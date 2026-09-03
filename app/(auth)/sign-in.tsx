import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { signInWithIdentifier, signInWithOAuth } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const { error: err } = await signInWithIdentifier(identifier.trim(), password);
    setSubmitting(false);
    if (err) setError(err);
  };

  const onGoogle = async () => {
    setError(null);
    setOauthLoading(true);
    const { error: err } = await signInWithOAuth('google');
    setOauthLoading(false);
    if (err) setError(err);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={styles.eyebrow}>Bienvenido de vuelta</Text>
      <Text style={styles.title}>¿A dónde quieres{'\n'}volver hoy?</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Email o nombre de usuario</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="tu@email.com o tu_usuario"
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
        disabled={submitting || !identifier || !password}
      >
        <Text style={styles.primaryButtonText}>{submitting ? 'Entrando…' : 'Entrar'}</Text>
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>o continúa con</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        style={({ pressed }) => [styles.oauthButton, pressed && { opacity: 0.9 }]}
        onPress={onGoogle}
        disabled={oauthLoading}
      >
        {oauthLoading ? (
          <ActivityIndicator color={colors.ink} size="small" />
        ) : (
          <>
            <Ionicons name="logo-google" size={17} color={colors.ink} />
            <Text style={styles.oauthButtonText}>Continuar con Google</Text>
          </>
        )}
      </Pressable>

      <Link href="/(auth)/sign-up" style={styles.link}>
        <Text style={styles.linkText}>¿No tienes cuenta? Crea una</Text>
      </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
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
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.line },
  dividerText: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: colors.ink38 },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    paddingVertical: 15,
    marginTop: spacing.md,
  },
  oauthButtonText: { fontFamily: fonts.sansBold, color: colors.ink, fontSize: 14.5 },
  link: { marginTop: spacing.lg, alignSelf: 'center' },
  linkText: { fontFamily: fonts.sansSemiBold, color: colors.terracotta, fontSize: 13.5 },
});
