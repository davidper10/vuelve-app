import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { usePremium } from '@/lib/premium-context';
import { presentPaywall } from '@/lib/paywall';
import { countTripMemories, FREE_PHOTO_LIMIT } from '@/lib/limits';
import { safeBack } from '@/lib/navigation';
import { requestLocation } from '@/lib/location-picker-bridge';
import { DateField } from '@/components/DateField';
import type { Tables } from '@/lib/database.types';

type Moment = Tables<'moments'>;
type ExistingPhoto = { memoryId: string; storagePath: string; url: string };

export default function EditarRecuerdo() {
  const { momentId } = useLocalSearchParams<{ momentId: string }>();
  const { session } = useAuth();
  const { isPremium } = usePremium();
  const [moment, setMoment] = useState<Moment | null>(null);
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!momentId) return;
    const [{ data }, { data: links }] = await Promise.all([
      supabase.from('moments').select('*').eq('id', momentId).single(),
      supabase
        .from('moment_memories')
        .select('memories(id, storage_path, created_at)')
        .eq('moment_id', momentId)
        .order('created_at', { referencedTable: 'memories', ascending: true }),
    ]);
    if (data) {
      setMoment(data);
      setTitle(data.title);
      setStory(data.story ?? '');
      setPlaceName(data.place_name ?? '');
      setOccurredAt(data.occurred_at ? data.occurred_at.slice(0, 10) : '');
      setCoords(data.lat != null && data.lng != null ? { lat: data.lat, lng: data.lng } : null);
    }
    const photos = (links ?? [])
      .map((l) => l.memories as { id: string; storage_path: string } | null)
      .filter((m): m is { id: string; storage_path: string } => !!m)
      .map((m) => ({
        memoryId: m.id,
        storagePath: m.storage_path,
        url: supabase.storage.from('memories').getPublicUrl(m.storage_path).data.publicUrl,
      }));
    setExistingPhotos(photos);
  }, [momentId]);

  useEffect(() => {
    load();
  }, [load]);

  const pickPhotos = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Necesitamos permiso para acceder a tus fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      setNewPhotos((prev) => [...prev, ...result.assets]);
    }
  };

  const removeExisting = (memoryId: string) => {
    setExistingPhotos((prev) => prev.filter((p) => p.memoryId !== memoryId));
    setRemovedIds((prev) => [...prev, memoryId]);
  };

  const removeNew = (uri: string) => {
    setNewPhotos((prev) => prev.filter((p) => p.uri !== uri));
  };

  const pickLocation = async () => {
    const result = await requestLocation(coords);
    if (result) {
      setCoords({ lat: result.lat, lng: result.lng });
      if (!placeName.trim() && result.placeName) setPlaceName(result.placeName);
    }
  };

  const onSave = async () => {
    if (!moment || !session) return;

    if (!isPremium && newPhotos.length > 0) {
      const existing = await countTripMemories(moment.trip_id);
      if (existing - removedIds.length + newPhotos.length > FREE_PHOTO_LIMIT) {
        const unlocked = await presentPaywall();
        if (!unlocked) return;
      }
    }

    setError(null);
    setSubmitting(true);

    const { error: updateErr } = await supabase
      .from('moments')
      .update({
        title: title.trim(),
        story: story.trim() || null,
        place_name: placeName.trim() || null,
        occurred_at: occurredAt.trim() ? `${occurredAt.trim()}T12:00:00` : null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      })
      .eq('id', moment.id);

    if (updateErr) {
      setSubmitting(false);
      setError(updateErr.message);
      return;
    }

    for (const memoryId of removedIds) {
      const removed = existingPhotos.find((p) => p.memoryId === memoryId);
      await supabase.from('moment_memories').delete().eq('moment_id', moment.id).eq('memory_id', memoryId);
      await supabase.from('memories').delete().eq('id', memoryId);
      if (removed) {
        await supabase.storage.from('memories').remove([removed.storagePath]);
      }
    }

    let failedUploads = 0;
    for (let i = 0; i < newPhotos.length; i++) {
      const photo = newPhotos[i];
      const ext = photo.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const contentType = photo.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      const path = `${moment.trip_id}/${moment.id}-edit-${i}-${Date.now()}.${ext}`;
      const arrayBuffer = await fetch(photo.uri).then((res) => res.arrayBuffer());

      const { error: uploadErr } = await supabase.storage.from('memories').upload(path, arrayBuffer, {
        contentType,
      });
      if (uploadErr) {
        failedUploads++;
        continue;
      }

      const { data: memory, error: memoryErr } = await supabase
        .from('memories')
        .insert({
          trip_id: moment.trip_id,
          created_by: session.user.id,
          type: 'photo',
          storage_path: path,
          place_name: placeName.trim() || null,
          taken_at: occurredAt.trim() ? `${occurredAt.trim()}T12:00:00` : null,
        })
        .select()
        .single();

      if (!memoryErr && memory) {
        await supabase.from('moment_memories').insert({ moment_id: moment.id, memory_id: memory.id });
      } else {
        failedUploads++;
      }
    }

    setSubmitting(false);
    if (failedUploads > 0) {
      setError(`Guardado, pero ${failedUploads} foto(s) nueva(s) no se pudieron subir.`);
      return;
    }
    router.replace(`/momento/${moment.id}`);
  };

  if (!moment) {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontFamily: fonts.sans, color: colors.ink55 }}>Cargando…</Text>
      </View>
    );
  }

  const coverUri = existingPhotos[0]?.url ?? newPhotos[0]?.uri ?? null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Editar recuerdo</Text>

      <Pressable style={styles.photoPicker} onPress={pickPhotos}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="image-outline" size={26} color={colors.ink38} />
            <Text style={styles.photoPlaceholderText}>Añadir fotos</Text>
          </View>
        )}
      </Pressable>

      {(existingPhotos.length > 0 || newPhotos.length > 0) && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbStrip}>
          {existingPhotos.map((p) => (
            <View key={p.memoryId} style={styles.thumbWrap}>
              <Image source={{ uri: p.url }} style={styles.thumb} />
              <Pressable style={styles.removeThumb} onPress={() => removeExisting(p.memoryId)}>
                <Ionicons name="close" size={12} color="#fff" />
              </Pressable>
            </View>
          ))}
          {newPhotos.map((p) => (
            <View key={p.uri} style={styles.thumbWrap}>
              <Image source={{ uri: p.uri }} style={styles.thumb} />
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>Nueva</Text>
              </View>
              <Pressable style={styles.removeThumb} onPress={() => removeNew(p.uri)}>
                <Ionicons name="close" size={12} color="#fff" />
              </Pressable>
            </View>
          ))}
          <Pressable style={styles.addThumb} onPress={pickPhotos}>
            <Ionicons name="add" size={20} color={colors.ink55} />
          </Pressable>
        </ScrollView>
      )}

      <Field label="Título" value={title} onChangeText={setTitle} placeholder="La cena en el mirador" />
      <Field
        label="Historia (opcional)"
        value={story}
        onChangeText={setStory}
        placeholder="Qué pasó, cómo te sentiste…"
        multiline
      />
      <Field label="Lugar (opcional)" value={placeName} onChangeText={setPlaceName} placeholder="Kyoto" />

      <Pressable style={styles.mapBtn} onPress={pickLocation}>
        <Ionicons name="location" size={15} color={colors.sage} />
        <Text style={styles.mapBtnText}>
          {coords ? `Ubicación elegida (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` : 'Elegir en el mapa'}
        </Text>
      </Pressable>

      <DateField label="Fecha (opcional)" value={occurredAt} onChange={setOccurredAt} />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, (!title || submitting) && { opacity: 0.5 }]}
        onPress={onSave}
        disabled={!title || submitting}
      >
        <Text style={styles.buttonText}>{submitting ? 'Guardando…' : 'Guardar cambios'}</Text>
      </Pressable>

      <Pressable style={styles.cancel} onPress={() => safeBack(`/momento/${moment.id}`)}>
        <Text style={styles.cancelText}>Cancelar</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        style={[styles.input, props.multiline && styles.inputMultiline]}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.ink38}
        multiline={props.multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, paddingTop: spacing.xxl },
  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.ink, marginBottom: spacing.lg },
  photoPicker: { marginBottom: spacing.lg },
  photoPreview: { width: '100%', height: 200, borderRadius: radii.md, backgroundColor: colors.sandDark },
  photoPlaceholder: {
    width: '100%',
    height: 160,
    borderRadius: radii.md,
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoPlaceholderText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink55 },
  thumbStrip: { marginBottom: spacing.lg },
  thumbWrap: { position: 'relative', marginRight: 10 },
  thumb: { width: 64, height: 64, borderRadius: radii.sm, backgroundColor: colors.sandDark },
  newBadge: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    backgroundColor: 'rgba(104,119,92,0.85)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  newBadgeText: { fontFamily: fonts.sansBold, fontSize: 8.5, color: '#fff' },
  removeThumb: {
    position: 'absolute',
    top: -5,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addThumb: {
    width: 64,
    height: 64,
    borderRadius: radii.sm,
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.sageLight,
    borderRadius: radii.pill,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginBottom: spacing.md,
  },
  mapBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.sageDark },
  field: { marginBottom: spacing.md },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.ink70, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: radii.sm,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
  },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  error: { fontFamily: fonts.sansMedium, color: colors.terracotta, fontSize: 13, marginBottom: spacing.sm },
  button: {
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 15.5 },
  cancel: { marginTop: spacing.md, alignItems: 'center' },
  cancelText: { fontFamily: fonts.sansSemiBold, color: colors.ink55, fontSize: 14 },
});
