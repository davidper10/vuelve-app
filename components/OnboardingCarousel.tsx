import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { CoverImage } from './CoverImage';

// El número que se muestra en cada paso es explícito por pantalla (no se
// calcula por posición en el array), así se puede reordenar/ajustar sin
// que cambie el rótulo.
const TOTAL_STEPS_PREVIEW = 4;

const STEPS = [
  {
    variant: 'hero' as const,
    stepNumber: 1,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('../assets/onboarding/crear_viajes.png'),
    imageNaturalWidth: 850,
    imageNaturalHeight: 1850,
    title: 'Crea tus viajes\ny guarda cada momento',
    body: 'Organiza tus aventuras en un solo lugar y añade fotos, notas y lugares para revivirlas siempre que quieras.',
  },
  {
    variant: 'feature' as const,
    stepNumber: 2,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('../assets/onboarding/nfc.png'),
    imageNaturalWidth: 941,
    imageNaturalHeight: 1672,
    title: 'Añade un NFC\na tus recuerdos',
    body: 'Asocia un tag NFC a tus viajes para guardar recuerdos al instante. Acerca tu móvil y añade fotos, notas o lugares, estés donde estés.',
    features: [
      { icon: 'flash' as const, title: 'Rápido y fácil', body: 'Acerca tu móvil al tag NFC y añade un recuerdo en segundos.' },
      { icon: 'link' as const, title: 'Siempre contigo', body: 'Llévalo en tu llavero, mochila o donde quieras.' },
      { icon: 'heart' as const, title: 'Revive la experiencia', body: 'Cada vez que lo uses, seguirás construyendo la historia de tu viaje.' },
    ],
  },
  {
    variant: 'feature' as const,
    stepNumber: 3,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('../assets/onboarding/recrear.png'),
    imageNaturalWidth: 941,
    imageNaturalHeight: 1672,
    title: 'Recrea tus viajes\ncuando quieras',
    body: 'Revive cada detalle de tus aventuras con el mapa, tus fotos, notas y recuerdos. Todo en un solo lugar, siempre contigo.',
    features: [
      { icon: 'map' as const, title: 'Explora el mapa', body: 'Visualiza los lugares que has visitado y sigue tu ruta paso a paso.' },
      { icon: 'images' as const, title: 'Revive tus recuerdos', body: 'Consulta tus fotos, notas y momentos especiales en cualquier momento.' },
      { icon: 'time' as const, title: 'Vuelve a sentirlo', body: 'Redescubre cada viaje como si estuvieras allí otra vez.' },
    ],
  },
  {
    variant: 'feature' as const,
    stepNumber: 4,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('../assets/onboarding/share.png'),
    imageNaturalWidth: 941,
    imageNaturalHeight: 1672,
    title: 'Comparte tus\nhistorias',
    body: 'Inspira a otros viajeros compartiendo tus viajes, fotos y recuerdos. Elige qué quieres mostrar y mantén el control de tu privacidad.',
    features: [
      { icon: 'people' as const, title: 'Comparte tus viajes', body: 'Publica tus experiencias para inspirar a otros viajeros.' },
      { icon: 'link' as const, title: 'Invita y colabora', body: 'Comparte un viaje con amigos o familia y añadid recuerdos juntos.' },
      { icon: 'lock-closed' as const, title: 'Tú decides', body: 'Controla qué compartes y con quién. Tu privacidad siempre es lo primero.' },
    ],
  },
];

export function OnboardingCarousel({ onFinish, onBack }: { onFinish: () => void; onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const goTo = (next: number) => setStep(next);

  const onNext = () => {
    if (isLast) {
      onFinish();
      return;
    }
    goTo(step + 1);
  };

  const onPrev = () => {
    if (isFirst) {
      onBack?.();
      return;
    }
    goTo(step - 1);
  };

  if (current.variant === 'hero') {
    return (
      <View style={styles.screen}>
        <CoverImage source={current.image} naturalWidth={current.imageNaturalWidth} naturalHeight={current.imageNaturalHeight} />

        <View style={[styles.heroTopRow, { paddingTop: insets.top + spacing.md }]}>
          <Pressable onPress={onPrev} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </Pressable>
          <Pressable onPress={onFinish} hitSlop={8}>
            <Text style={styles.skipText}>Omitir</Text>
          </Pressable>
        </View>

        <View style={styles.heroTextBlock}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              PASO {current.stepNumber} DE {TOTAL_STEPS_PREVIEW}
            </Text>
          </View>
          <Text style={styles.heroTitle}>{current.title}</Text>
          <Text style={styles.heroBody}>{current.body}</Text>
        </View>

        <View style={[styles.featureBottomBar, { paddingBottom: insets.bottom + spacing.md, marginTop: 'auto' }]}>
          <Pressable style={styles.circleBtn} onPress={onPrev} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={colors.ink} />
          </Pressable>

          <View style={styles.dots}>
            {Array.from({ length: TOTAL_STEPS_PREVIEW }).map((_, i) => (
              <View key={i} style={[styles.heroDot, i === current.stepNumber - 1 && styles.heroDotOn]} />
            ))}
          </View>

          <Pressable style={({ pressed }) => [styles.roundButton, pressed && { opacity: 0.9 }]} onPress={onNext}>
            <Ionicons name="arrow-forward" size={20} color={colors.background} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
      <View style={styles.screen}>
        <CoverImage
          source={current.image}
          naturalWidth={current.imageNaturalWidth}
          naturalHeight={current.imageNaturalHeight}
          fit="width"
          verticalBias={1}
        />

        <View style={[styles.featureTopRow, { paddingTop: insets.top + spacing.md }]}>
          <Pressable style={styles.circleBtn} onPress={onPrev} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </Pressable>
          <Pressable onPress={onFinish} hitSlop={8}>
            <Text style={styles.skipText}>Omitir</Text>
          </Pressable>
        </View>

        <View style={styles.heroTextBlock}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              PASO {current.stepNumber} DE {TOTAL_STEPS_PREVIEW}
            </Text>
          </View>
          <Text style={styles.heroTitle}>{current.title}</Text>
          <Text style={styles.heroBody}>{current.body}</Text>
        </View>

        <View style={styles.featureList}>
          {current.features.map((feature) => (
            <View key={feature.title} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={18} color={colors.sageDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureBody}>{feature.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.featureBottomBar, { paddingBottom: insets.bottom + spacing.md, marginTop: 'auto' }]}>
          <Pressable style={styles.circleBtn} onPress={onPrev} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={colors.ink} />
          </Pressable>

          <View style={styles.dots}>
            {Array.from({ length: TOTAL_STEPS_PREVIEW }).map((_, i) => (
              <View key={i} style={[styles.heroDot, i === current.stepNumber - 1 && styles.heroDotOn]} />
            ))}
          </View>

          <Pressable style={({ pressed }) => [styles.roundButton, pressed && { opacity: 0.9 }]} onPress={onNext}>
            <Ionicons name="arrow-forward" size={20} color={colors.background} />
          </Pressable>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  skipText: { fontFamily: fonts.sansSemiBold, color: colors.ink55, fontSize: 14 },
  dots: { flexDirection: 'row', gap: 8 },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  heroTextBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: colors.sageLight,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 11.5, color: colors.sageDark, letterSpacing: 0.5 },
  heroTitle: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 34,
  },
  heroBody: {
    fontFamily: fonts.sansMedium,
    fontSize: 14.5,
    color: colors.ink70,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: '90%',
  },
  heroDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.line },
  heroDotOn: { backgroundColor: colors.sageDark },
  roundButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.sageDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  featureTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureList: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(250,248,244,0.97)',
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.md,
    maxWidth: '72%',
  },
  featureRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: { fontFamily: fonts.serif, fontSize: 16, color: colors.ink },
  featureBody: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.ink55, marginTop: 2, lineHeight: 17 },
  featureBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
});
