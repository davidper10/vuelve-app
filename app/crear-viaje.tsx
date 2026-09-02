import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { safeBack } from '@/lib/navigation';

export default function CrearViaje() {
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [country, setCountry] = useState('');
  const [destinationSummary, setDestinationSummary] = useState('');
  const [startDate, setStartDate] = useState(''); // YYYY-MM-DD
  const [endDate, setEndDate] = useState('');
  const [cover, setCover] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const onCreate = async () => {
    if (!session) return;
    setError(null);
    setSubmitting(true);

    const { data, error: err } = await supabase
      .from('trips')
      .insert({
        owner_id: session.user.id,
        title: title.trim(),
        country: country.trim() || null,
        destination_summary: destinationSummary.trim() || null,
        start_date: startDate.trim() || null,
        end_date: endDate.trim() || null,
      })
      .select()
      .single();

    if (err || !data) {
      setSubmitting(false);
      setError(err?.message ?? 'No se pudo crear el viaje.');
      return;
    }

    if (cover) {
      const ext = cover.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const contentType = cover.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      const path = `${data.id}/cover-${Date.now()}.${ext}`;
      const arrayBuffer = await fetch(cover.uri).then((res) => res.arrayBuffer());

      const { error: uploadErr } = await supabase.storage.from('memories').upload(path, arrayBuffer, {
        contentType,
      });
      if (!uploadErr) {
        const coverPhotoUrl = supabase.storage.from('memories').getPublicUrl(path).data.publicUrl;
        await supabase.from('trips').update({ cover_photo_url: coverPhotoUrl }).eq('id', data.id);
      }
    }

    setSubmitting(false);
    router.replace(`/viaje/${data.id}`);
  };

  const previewUri = cover?.uri ?? null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Nuevo viaje</Text>

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

      <Field label="Destino (ej. Japón, Roma…)" value={title} onChangeText={setTitle} placeholder="Japón" />
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
        style={[styles.button, (!title || submitting) && { opacity: 0.5 }]}
        onPress={onCreate}
        disabled={!title || submitting}
      >
        <Text style={styles.buttonText}>{submitting ? 'Creando…' : 'Crear viaje'}</Text>
      </Pressable>

      <Pressable style={styles.cancel} onPress={() => safeBack('/viajes')}>
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
});
