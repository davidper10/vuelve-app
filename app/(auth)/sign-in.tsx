import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function SignIn() {
  const { signInWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const { error: err } = await signInWithPassword(email.trim(), password);
    setSubmitting(false);
    if (err) setError(err);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.eyebrow}>Bienvenido de vuelta</Text>
      <Text style={styles.title}>¿A dónde quieres{'\n'}volver hoy?</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@email.com"
          placeholderTextColor={colors.ink38}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={colors.ink38}
        />
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.9 }]}
        onPress={onSubmit}
        disabled={submitting || !email || !password}
      >
        <Text style={styles.primaryButtonText}>{submitting ? 'Entrando…' : 'Entrar'}</Text>
      </Pressable>

      <Link href="/(auth)/sign-up" style={styles.link}>
        <Text style={styles.linkText}>¿No tienes cuenta? Crea una</Text>
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, justifyContent: 'center' },
  eyebrow: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink55, marginBottom: 4 },
  title: { fontFamily: fonts.serif, fontSize: 36, color: colors.ink, marginBottom: spacing.xl, lineHeight: 40 },
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
  error: { fontFamily: fonts.sansMedium, color: colors.terracotta, marginBottom: spacing.sm, fontSize: 13 },
  primaryButton: {
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 15.5 },
  link: { marginTop: spacing.lg, alignSelf: 'center' },
  linkText: { fontFamily: fonts.sansSemiBold, color: colors.terracotta, fontSize: 13.5 },
});
