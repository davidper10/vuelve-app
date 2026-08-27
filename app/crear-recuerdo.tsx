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
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Necesitamos permiso para acceder a tus fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0]);
    }
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

    if (photo) {
      const ext = photo.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const contentType = photo.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      const path = `${tripId}/${moment.id}-${Date.now()}.${ext}`;
      const arrayBuffer = await fetch(photo.uri).then((res) => res.arrayBuffer());

      const { error: uploadErr } = await supabase.storage.from('memories').upload(path, arrayBuffer, {
        contentType,
      });

      if (uploadErr) {
        setSubmitting(false);
        setError(`El recuerdo se creó, pero la foto falló: ${uploadErr.message}`);
        router.replace(`/momento/${moment.id}`);
        return;
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
      }
    }

    setSubmitting(false);
    router.replace(`/momento/${moment.id}`);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Nuevo recuerdo</Text>

      <Pressable style={styles.photoPicker} onPress={pickPhoto}>
        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="image-outline" size={26} color={colors.ink38} />
            <Text style={styles.photoPlaceholderText}>Añadir foto</Text>
          </View>
        )}
      </Pressable>

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
