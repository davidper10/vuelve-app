import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { safeBack } from '@/lib/navigation';
import { useConfirm } from '@/lib/confirm-context';
import type { Tables } from '@/lib/database.types';

type Trip = Tables<'trips'>;

export default function EditarViaje() {
  const confirm = useConfirm();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [title, setTitle] = useState('');
  const [country, setCountry] = useState('');
  const [destinationSummary, setDestinationSummary] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cover, setCover] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!tripId) return;
    const { data } = await supabase.from('trips').select('*').eq('id', tripId).single();
    if (data) {
      setTrip(data);
      setTitle(data.title);
      setCountry(data.country ?? '');
      setDestinationSummary(data.destination_summary ?? '');
      setStartDate(data.start_date ?? '');
      setEndDate(data.end_date ?? '');
    }
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  const pickCover = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Necesitamos permiso para acceder a tus fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      aspect: [16, 9],
      allowsEditing: true,
    });
    if (!result.canceled) {
      setCover(result.assets[0]);
    }
  };

  const onSave = async () => {
    if (!tripId || !trip) return;
    setError(null);
    setSubmitting(true);

    let coverPhotoUrl = trip.cover_photo_url;
    if (cover) {
      const ext = cover.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const contentType = cover.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      const path = `${tripId}/cover-${Date.now()}.${ext}`;
      const arrayBuffer = await fetch(cover.uri).then((res) => res.arrayBuffer());

      const { error: uploadErr } = await supabase.storage.from('memories').upload(path, arrayBuffer, {
        contentType,
      });
      if (uploadErr) {
        setSubmitting(false);
        setError(`No se pudo subir la portada: ${uploadErr.message}`);
        return;
      }
      coverPhotoUrl = supabase.storage.from('memories').getPublicUrl(path).data.publicUrl;
    }

    const { error: updateErr } = await supabase
      .from('trips')
      .update({
        title: title.trim(),
        country: country.trim() || null,
        destination_summary: destinationSummary.trim() || null,
        start_date: startDate.trim() || null,
        end_date: endDate.trim() || null,
        cover_photo_url: coverPhotoUrl,
      })
      .eq('id', tripId);

    setSubmitting(false);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }
    router.replace(`/viaje/${tripId}`);
  };

  const onDelete = async () => {
    if (!tripId || !trip) return;
    const ok = await confirm({
      title: 'Eliminar viaje',
      message: `¿Seguro que quieres eliminar "${trip.title}"? Se borrarán también sus recuerdos, el mapa, el diario y los tags NFC vinculados. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) confirmDelete();
  };

  const confirmDelete = async () => {
    if (!tripId) return;
    setError(null);
    setDeleting(true);

    const { data: moments } = await supabase.from('moments').select('id').eq('trip_id', tripId);
    const momentIds = (moments ?? []).map((m) => m.id);

    await supabase.from('nfc_tags').delete().eq('trip_id', tripId);
    if (momentIds.length) {
      await supabase.from('nfc_tags').delete().in('moment_id', momentIds);
    }

    const { data: files } = await supabase.storage.from('memories').list(tripId);
    if (files?.length) {
      await supabase.storage.from('memories').remove(files.map((f) => `${tripId}/${f.name}`));
    }

    const { error: deleteErr } = await supabase.from('trips').delete().eq('id', tripId);
    setDeleting(false);
    if (deleteErr) {
      setError(deleteErr.message);
      return;
    }
    router.replace('/viajes');
  };

  if (!trip) {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontFamily: fonts.sans, color: colors.ink55 }}>Cargando…</Text>
      </View>
    );
  }

  const previewUri = cover?.uri ?? trip.cover_photo_url ?? null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Editar viaje</Text>

      <Pressable style={styles.photoPicker} onPress={pickCover}>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="image-outline" size={26} color={colors.ink38} />
            <Text style={styles.photoPlaceholderText}>Añadir foto de portada</Text>
          </View>
        )}
        <View style={styles.photoEditBadge}>
          <Ionicons name="camera" size={14} color={colors.background} />
        </View>
      </Pressable>

      <Field label="Destino" value={title} onChangeText={setTitle} placeholder="Japón" />
      <Field label="País" value={country} onChangeText={setCountry} placeholder="Japón" />
      <Field
        label="Ciudades (opcional)"
        value={destinationSummary}
        onChangeText={setDestinationSummary}
        placeholder="Tokyo · Kyoto · Osaka"
      />
      <Field label="Fecha de inicio (AAAA-MM-DD)" value={startDate} onChangeText={setStartDate} placeholder="2026-09-12" />
      <Field label="Fecha de fin (AAAA-MM-DD)" value={endDate} onChangeText={setEndDate} placeholder="2026-09-18" />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, (!title || submitting || deleting) && { opacity: 0.5 }]}
        onPress={onSave}
        disabled={!title || submitting || deleting}
      >
        <Text style={styles.buttonText}>{submitting ? 'Guardando…' : 'Guardar cambios'}</Text>
      </Pressable>

      <Pressable style={styles.cancel} onPress={() => safeBack(`/viaje/${tripId}`)} disabled={deleting}>
        <Text style={styles.cancelText}>Cancelar</Text>
      </Pressable>

      <Pressable
        style={[styles.deleteButton, deleting && { opacity: 0.5 }]}
        onPress={onDelete}
        disabled={deleting}
      >
        <Ionicons name="trash-outline" size={16} color={colors.terracotta} />
        <Text style={styles.deleteButtonText}>{deleting ? 'Eliminando…' : 'Eliminar viaje'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.ink38}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, paddingTop: spacing.xxl },
  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.ink, marginBottom: spacing.lg },
  photoPicker: { marginBottom: spacing.lg, position: 'relative' },
  photoPreview: { width: '100%', height: 180, borderRadius: radii.md, backgroundColor: colors.sandDark },
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
  photoEditBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.ink,
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xl,
    paddingVertical: 12,
  },
  deleteButtonText: { fontFamily: fonts.sansSemiBold, color: colors.terracotta, fontSize: 14 },
});
