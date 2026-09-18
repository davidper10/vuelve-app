import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

// fondo_login.png es un retrato alto (941x1672) pensado para que el cielo
// vacío de arriba sirva de fondo al título y el zorro quede visible abajo.
// En vez de un resizeMode="cover" centrado (que con esta proporción sólo
// enseña cielo y corta antes de llegar al zorro), se escala la imagen a
// su alto natural completo y se desplaza hacia arriba para que la ventana
// visible sea justo el tramo [CROP_START, CROP_END] de la imagen original.
const IMAGE_ASPECT = 1672 / 941;
const CROP_START = 0.33;
const CROP_END = 0.867;

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const imageHeight = screenWidth * IMAGE_ASPECT;
  const heroHeight = imageHeight * (CROP_END - CROP_START);
  const imageTop = -(imageHeight * CROP_START);
  const { signInWithIdentifier, signInWithGoogle, signInWithApple } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <View style={styles.screen}>
      <View style={[styles.hero, { height: heroHeight }]}>
        <Image
          source={require('../../assets/mascota/fondo_login.png')}
          style={{ width: screenWidth, height: imageHeight, top: imageTop }}
        />
      </View>

      <View style={[styles.heroText, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.title}>¿A dónde quieres{'\n'}volver hoy?</Text>
        <Text style={styles.subtitle}>Tus viajes, tus recuerdos, siempre contigo.</Text>
      </View>

      <KeyboardAvoidingView style={[styles.sheetWrap, { marginTop: heroHeight }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={[styles.sheetContent, { paddingBottom: insets.bottom + spacing.md }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.eyebrow}>Bienvenido de vuelta</Text>
            <Text style={styles.sheetSubtitle}>Inicia sesión para seguir explorando tus aventuras.</Text>

            <View style={styles.field}>
              <Ionicons name="mail-outline" size={17} color={colors.sage} style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="Tu email o nombre de usuario"
                placeholderTextColor={colors.ink38}
              />
            </View>

            <View style={styles.field}>
              <Ionicons name="lock-closed-outline" size={17} color={colors.sage} style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholder="Contraseña"
                placeholderTextColor={colors.ink38}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={17}
                  color={colors.ink38}
                />
              </Pressable>
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
              <Ionicons name="arrow-forward" size={16} color={colors.background} />
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O continúa con</Text>
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
                  <Ionicons name="logo-google" size={16} color={colors.ink} />
                  <Text style={styles.oauthButtonText}>Continuar con Google</Text>
                </>
              )}
            </Pressable>

            {appleAvailable && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={22}
                style={styles.appleButton}
                onPress={onApple}
              />
            )}

            <View style={styles.signUpRow}>
              <Text style={styles.signUpText}>¿No tienes cuenta? </Text>
              <Link href="/(auth)/sign-up">
                <Text style={styles.signUpLink}>Crea una</Text>
              </Link>
              <Ionicons name="arrow-forward" size={13} color={colors.sageDark} style={{ marginLeft: 2 }} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  heroText: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.xl },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.ink, lineHeight: 33 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.ink70, marginTop: 6 },
  sheetWrap: { flex: 1 },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
  },
  sheetContent: { padding: spacing.lg },
  eyebrow: { fontFamily: fonts.serif, fontSize: 21, color: colors.ink },
  sheetSubtitle: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.ink55, marginTop: 3, marginBottom: spacing.md },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.sageLight,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    marginBottom: spacing.sm,
  },
  fieldIcon: { marginTop: 1 },
  input: {
    flex: 1,
    paddingVertical: 11,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ink,
  },
  error: { fontFamily: fonts.sansMedium, color: colors.terracotta, marginBottom: spacing.xs, fontSize: 12.5 },
  forgotLink: { alignSelf: 'flex-end', marginBottom: spacing.xs },
  forgotLinkText: { fontFamily: fonts.sansSemiBold, color: colors.ink55, fontSize: 12 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.sageDark,
    borderRadius: radii.pill,
    paddingVertical: 13,
    marginTop: spacing.xs,
  },
  primaryButtonText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 14.5 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.line },
  dividerText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.ink38 },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    paddingVertical: 12,
    marginTop: spacing.sm,
  },
  oauthButtonText: { fontFamily: fonts.sansBold, color: colors.ink, fontSize: 13.5 },
  appleButton: { alignSelf: 'stretch', height: 44, marginTop: spacing.sm },
  signUpRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  signUpText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.ink55 },
  signUpLink: { fontFamily: fonts.sansBold, fontSize: 12.5, color: colors.sageDark },
});
