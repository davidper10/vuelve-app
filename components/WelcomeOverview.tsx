import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { CoverImage } from './CoverImage';

// Primera pantalla del onboarding (tras registrarse). Le siguen las 3
// páginas de OnboardingCarousel -- de ahí los 4 puntos, con el primero
// activo aquí. "Comenzar" avanza a esa siguiente página; "Omitir" salta
// directo al final del onboarding completo.
const TOTAL_STEPS = 4;
const ACTIVE_STEP = 0;

const IMAGE_NATURAL_WIDTH = 941;
const IMAGE_NATURAL_HEIGHT = 1672;

export function WelcomeOverview({
  onContinue,
  onSkip = onContinue,
}: {
  onContinue: () => void;
  onSkip?: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <CoverImage
        source={require('../assets/mascota/fondo_login.png')}
        naturalWidth={IMAGE_NATURAL_WIDTH}
        naturalHeight={IMAGE_NATURAL_HEIGHT}
      />

      <View style={[styles.topRow, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            <Ionicons name="triangle" size={13} color={colors.sageDark} />
          </View>
          <Text style={styles.logoText}>SaveTrip</Text>
        </View>
        <Pressable onPress={onSkip} hitSlop={8}>
          <Text style={styles.skip}>Omitir</Text>
        </Pressable>
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.headline}>Tus viajes,{'\n'}siempre contigo</Text>
        <Text style={styles.subtitle}>Guarda, revive y comparte los lugares que hacen la vida más grande.</Text>
      </View>

      <LinearGradient
        colors={['transparent', 'rgba(10,6,7,0.55)']}
        locations={[0, 0.7]}
        style={styles.bottomGradient}
      />

      <View style={[styles.bottomBlock, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.dotsRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[styles.dot, i === ACTIVE_STEP && styles.dotActive]} />
          ))}
        </View>

        <Pressable style={({ pressed }) => [styles.button, pressed && { opacity: 0.9 }]} onPress={onContinue}>
          <Text style={styles.buttonText}>Comenzar</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.background} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoMark: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontFamily: fonts.sansBold, fontSize: 17, color: colors.sageDark },
  skip: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink55 },
  textBlock: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  headline: { fontFamily: fonts.serif, fontSize: 34, color: colors.ink, lineHeight: 39 },
  subtitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 14.5,
    color: colors.ink70,
    marginTop: spacing.sm,
    lineHeight: 20,
    maxWidth: '85%',
  },
  bottomGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 260 },
  bottomBlock: { marginTop: 'auto', paddingHorizontal: spacing.lg, alignItems: 'center', gap: spacing.md },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { width: 20, backgroundColor: colors.background },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    backgroundColor: colors.sageDark,
    borderRadius: radii.pill,
    paddingVertical: 16,
  },
  buttonText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 16 },
});
