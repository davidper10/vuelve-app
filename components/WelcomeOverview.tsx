import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { WelcomeMascot } from './WelcomeMascot';

export function WelcomeOverview({ onContinue }: { onContinue: () => void }) {
  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <Text style={styles.title}>¡Bienvenido a</Text>
        <Text style={styles.brand}>SaveTrip!</Text>
        <Text style={styles.subtitle}>Guarda tus viajes.{'\n'}Revive tus mejores momentos.</Text>
      </View>

      <WelcomeMascot />

      <Pressable style={({ pressed }) => [styles.button, pressed && { opacity: 0.9 }]} onPress={onContinue}>
        <Text style={styles.buttonText}>Comenzar</Text>
        <Ionicons name="arrow-forward" size={18} color={colors.background} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  top: { alignItems: 'center', marginBottom: spacing.xl },
  title: { fontFamily: fonts.sansBold, fontSize: 30, color: colors.ink, textAlign: 'center' },
  brand: { fontFamily: fonts.sansBold, fontSize: 34, color: colors.terracotta, textAlign: 'center', marginTop: 2 },
  subtitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.ink55,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 21,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.terracotta,
    borderRadius: radii.pill,
    paddingVertical: 16,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xl,
  },
  buttonText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 16 },
});
