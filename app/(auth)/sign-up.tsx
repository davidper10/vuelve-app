import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function SignUp() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const { error: err } = await signUp(email.trim(), password, fullName.trim());
    setSubmitting(false);
    if (err) {
      setError(err);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.title}>Revisa tu email</Text>
        <Text style={styles.subtitle}>
          Te hemos enviado un enlace de confirmación. Confírmalo y vuelve a entrar.
        </Text>
        <Pressable style={styles.primaryButton} onPress={() => router.replace('/(auth)/sign-in')}>
          <Text style={styles.primaryButtonText}>Ir a entrar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.eyebrow}>Empieza tu colección</Text>
      <Text style={styles.title}>Crea tu cuenta</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Alex"
          placeholderTextColor={colors.ink38}
        />
      </View>

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
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor={colors.ink38}
        />
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.9 }]}
        onPress={onSubmit}
        disabled={submitting || !email || !password || !fullName}
      >
        <Text style={styles.primaryButtonText}>{submitting ? 'Creando…' : 'Crear cuenta'}</Text>
      </Pressable>

      <Link href="/(auth)/sign-in" style={styles.link}>
        <Text style={styles.linkText}>Ya tengo cuenta</Text>
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, justifyContent: 'center' },
  eyebrow: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink55, marginBottom: 4 },
  title: { fontFamily: fonts.serif, fontSize: 36, color: colors.ink, marginBottom: spacing.xl },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink55,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
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
  error: { fontFamily: fonts.sansMedium, color: colors.terracotta, marginBottom: spacing.sm, fontSize: 13 },
  primaryButton: {
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 15.5 },
  link: { marginTop: spacing.lg, alignSelf: 'center' },
  linkText: { fontFamily: fonts.sansSemiBold, color: colors.terracotta, fontSize: 13.5 },
});
