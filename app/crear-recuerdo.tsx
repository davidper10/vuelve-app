import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { safeBack } from '@/lib/navigation';

export default function CrearRecuerdo() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [occurredAt, setOccurredAt] = useState(''); // YYYY-MM-DD
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      setPhotos((prev) => [...prev, ...result.assets]);
    }
  };

  const removePhoto = (uri: string) => {
    setPhotos((prev) => prev.filter((p) => p.uri !== uri));
  };

  const onCreate = async () => {
    if (!session || !tripId) return;
    setError(null);
    setSubmitting(true);

    const { data: moment, error: momentErr } = await supabase
      .from('moments')
      .insert({
        trip_id: tripId,
        created_by: session.user.id,
        title: title.trim(),
        story: story.trim() || null,
        place_name: placeName.trim() || null,
        occurred_at: occurredAt.trim() ? `${occurredAt.trim()}T12:00:00` : null,
      })
      .select()
      .single();

    if (momentErr || !moment) {
      setSubmitting(false);
      setError(momentErr?.message ?? 'No se pudo crear el recuerdo.');
      return;
    }

    let failedUploads = 0;
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const ext = photo.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const contentType = photo.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      const path = `${tripId}/${moment.id}-${i}-${Date.now()}.${ext}`;
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
          trip_id: tripId,
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
      setError(`El recuerdo se creó, pero ${failedUploads} foto(s) no se pudieron subir.`);
    }
    router.replace(`/momento/${moment.id}`);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Nuevo recuerdo</Text>

      <Pressable style={styles.photoPicker} onPress={pickPhotos}>
        {photos.length > 0 ? (
          <Image source={{ uri: photos[0].uri }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="image-outline" size={26} color={colors.ink38} />
            <Text style={styles.photoPlaceholderText}>Añadir portada y fotos</Text>
          </View>
        )}
      </Pressable>

      {photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbStrip}>
          {photos.map((p, i) => (
            <View key={p.uri} style={styles.thumbWrap}>
              <Image source={{ uri: p.uri }} style={styles.thumb} />
              {i === 0 && (
                <View style={styles.coverBadge}>
                  <Text style={styles.coverBadgeText}>Portada</Text>
                </View>
              )}
              <Pressable style={styles.removeThumb} onPress={() => removePhoto(p.uri)}>
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
      <Field label="Fecha (AAAA-MM-DD, opcional)" value={occurredAt} onChangeText={setOccurredAt} placeholder="2026-09-14" />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, (!title || submitting) && { opacity: 0.5 }]}
        onPress={onCreate}
        disabled={!title || submitting}
      >
        <Text style={styles.buttonText}>{submitting ? 'Guardando…' : 'Guardar recuerdo'}</Text>
      </Pressable>

      <Pressable style={styles.cancel} onPress={() => safeBack(tripId ? `/viaje/${tripId}` : '/viajes')}>
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
  coverBadge: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    backgroundColor: 'rgba(20,12,14,0.65)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  coverBadgeText: { fontFamily: fonts.sansBold, fontSize: 8.5, color: '#fff' },
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
