import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { signInWithIdentifier, signInWithGoogle, signInWithApple } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

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
    const { error: err } = await signInWithGoogle();
    setOauthLoading(false);
    if (err) setError(err);
  };

  const onApple = async () => {
    setError(null);
    const { error: err } = await signInWithApple();
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

      <Link href="/(auth)/recuperar-contrasena" style={styles.forgotLink}>
        <Text style={styles.forgotLinkText}>¿Olvidaste tu contraseña?</Text>
      </Link>

      <Pressable
        style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.9 }]}
        onPress={onSubmit}
        disabled={submitting || !identifier || !password}
      >
        <Text style={styles.primaryButtonText}>{submitting ? 'Entrando…' : 'Entrar'}</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.googleButton, pressed && { opacity: 0.9 }]}
        onPress={onGoogle}
        disabled={oauthLoading}
      >
        {oauthLoading ? (
          <ActivityIndicator color={colors.background} size="small" />
        ) : (
          <>
            <Ionicons name="logo-google" size={17} color={colors.background} />
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          </>
        )}
      </Pressable>

      {appleAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={24}
          style={styles.appleButton}
          onPress={onApple}
        />
      )}

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
  forgotLink: { alignSelf: 'flex-end', marginBottom: spacing.sm },
  forgotLinkText: { fontFamily: fonts.sansSemiBold, color: colors.ink55, fontSize: 12.5 },
  primaryButton: {
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryButtonText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 15.5 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 48,
    backgroundColor: colors.terracotta,
    borderRadius: radii.pill,
    marginTop: spacing.lg,
  },
  googleButtonText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 14.5 },
  appleButton: { alignSelf: 'stretch', height: 48, marginTop: spacing.md },
  link: { marginTop: spacing.lg, alignSelf: 'center' },
  linkText: { fontFamily: fonts.sansSemiBold, color: colors.terracotta, fontSize: 13.5 },
});
