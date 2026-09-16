import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function RecuperarContrasena() {
  const insets = useSafeAreaInsets();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    await requestPasswordReset(email);
    setSubmitting(false);
    // Mensaje genérico siempre, exista o no esa cuenta: evita revelar qué
    // emails están registrados.
    setSent(true);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>Recuperar acceso</Text>
        <Text style={styles.title}>¿Olvidaste tu{'\n'}contraseña?</Text>

        {sent ? (
          <Text style={styles.body}>
            Si existe una cuenta con ese email, te hemos enviado un enlace para restablecer tu contraseña. Revisa tu
            bandeja de entrada.
          </Text>
        ) : (
          <>
            <Text style={styles.body}>Te enviaremos un enlace a tu email para que puedas crear una nueva.</Text>

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

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.9 }]}
              onPress={onSubmit}
              disabled={submitting || !email.trim()}
            >
              <Text style={styles.primaryButtonText}>{submitting ? 'Enviando…' : 'Enviar enlace'}</Text>
            </Pressable>
          </>
        )}

        <Link href="/(auth)/sign-in" style={styles.link}>
          <Text style={styles.linkText}>Volver a iniciar sesión</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  eyebrow: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink55, marginBottom: 4 },
  title: { fontFamily: fonts.serif, fontSize: 36, color: colors.ink, marginBottom: spacing.md, lineHeight: 40 },
  body: { fontFamily: fonts.sans, fontSize: 14.5, color: colors.ink70, lineHeight: 21, marginBottom: spacing.lg },
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
