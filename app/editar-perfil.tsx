import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { safeBack } from '@/lib/navigation';

export default function EditarPerfil() {
  const { session } = useAuth();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', session.user.id).single();
    if (data) {
      setFullName(data.full_name ?? '');
      setAvatarUrl(data.avatar_url);
    }
    setLoaded(true);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Necesitamos permiso para acceder a tus fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      aspect: [1, 1],
      allowsEditing: true,
    });
    if (!result.canceled) {
      setAvatar(result.assets[0]);
    }
  };

  const onSave = async () => {
    if (!session) return;
    setError(null);
    setSubmitting(true);

    let newAvatarUrl = avatarUrl;
    if (avatar) {
      const ext = avatar.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const contentType = avatar.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      const path = `avatars/${session.user.id}/avatar-${Date.now()}.${ext}`;
      const arrayBuffer = await fetch(avatar.uri).then((res) => res.arrayBuffer());

      const { error: uploadErr } = await supabase.storage.from('memories').upload(path, arrayBuffer, { contentType });
      if (uploadErr) {
        setSubmitting(false);
        setError(`No se pudo subir la foto: ${uploadErr.message}`);
        return;
      }
      newAvatarUrl = supabase.storage.from('memories').getPublicUrl(path).data.publicUrl;
    }

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), avatar_url: newAvatarUrl })
      .eq('id', session.user.id);

    setSubmitting(false);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }
    router.replace('/(tabs)/perfil');
  };

  if (!loaded) {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontFamily: fonts.sans, color: colors.ink55 }}>Cargando…</Text>
      </View>
    );
  }

  const previewUri = avatar?.uri ?? avatarUrl ?? null;
  const initial = fullName.trim().charAt(0).toUpperCase() || 'A';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Editar perfil</Text>

      <Pressable style={styles.avatarPicker} onPress={pickAvatar}>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>{initial}</Text>
          </View>
        )}
        <View style={styles.avatarEditBadge}>
          <Ionicons name="camera" size={13} color={colors.background} />
        </View>
      </Pressable>

      <View style={styles.field}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Tu nombre"
          placeholderTextColor={colors.ink38}
        />
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, (!fullName.trim() || submitting) && { opacity: 0.5 }]}
        onPress={onSave}
        disabled={!fullName.trim() || submitting}
      >
        <Text style={styles.buttonText}>{submitting ? 'Guardando…' : 'Guardar cambios'}</Text>
      </Pressable>

      <Pressable style={styles.cancel} onPress={() => safeBack('/(tabs)/perfil')}>
        <Text style={styles.cancelText}>Cancelar</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, paddingTop: spacing.xxl, alignItems: 'center' },
  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.ink, marginBottom: spacing.lg, alignSelf: 'flex-start' },
  avatarPicker: { marginBottom: spacing.lg, position: 'relative' },
  avatarImg: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.sandDark },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: { fontFamily: fonts.serif, fontSize: 36, color: colors.background },
  avatarEditBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  field: { width: '100%', marginBottom: spacing.md },
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
    width: '100%',
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
