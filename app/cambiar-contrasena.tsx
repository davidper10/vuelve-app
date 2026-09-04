import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { safeBack } from '@/lib/navigation';

export default function CambiarContrasena() {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const mismatch = !!confirmPassword && newPassword !== confirmPassword;
  const tooShort = !!newPassword && newPassword.length < 6;
  const canSubmit = !!currentPassword && !!newPassword && !mismatch && !tooShort && !submitting;

  const onSave = async () => {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    const { error: err } = await changePassword(currentPassword, newPassword);
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    router.replace('/(tabs)/perfil');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Cambiar contraseña</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Contraseña actual</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.ink38}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Nueva contraseña</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor={colors.ink38}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Confirmar nueva contraseña</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.ink38}
        />
        {mismatch && <Text style={styles.hint}>Las contraseñas no coinciden.</Text>}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={[styles.button, !canSubmit && { opacity: 0.5 }]} onPress={onSave} disabled={!canSubmit}>
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
  scroll: { padding: spacing.xl, paddingTop: spacing.xxl },
  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.ink, marginBottom: spacing.lg },
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
  hint: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.terracotta, marginTop: 6 },
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
