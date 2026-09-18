import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { CoverImage } from './CoverImage';
import { FloatingMascot } from './FloatingMascot';

// El paso 1 y el paso NFC ya tienen el diseño nuevo (fondo ilustrado a
// pantalla completa); "Guarda tus recuerdos" conserva el diseño anterior
// (mascota centrada) hasta que llegue su mockup. El número de "paso" que
// se muestra es explícito por pantalla (no se calcula por posición en el
// array), así se puede reordenar/ajustar sin que cambie el rótulo.
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
    variant: 'mascot' as const,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('../assets/mascota/registro.png'),
    title: 'Guarda tus recuerdos',
    body: 'Añade fotos, notas y los momentos especiales de cada día, todo en un mismo sitio.',
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
];

export function OnboardingCarousel({ onFinish, onBack }: { onFinish: () => void; onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const goTo = (next: number) => {
    Animated.sequence([
      Animated.timing(fade, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

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

        <View style={[styles.heroBottomRow, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.dotsCenterWrap} pointerEvents="none">
            <View style={styles.dots}>
              {Array.from({ length: TOTAL_STEPS_PREVIEW }).map((_, i) => (
                <View key={i} style={[styles.heroDot, i === current.stepNumber - 1 && styles.heroDotOn]} />
              ))}
            </View>
          </View>

          <Pressable style={({ pressed }) => [styles.roundButton, pressed && { opacity: 0.9 }]} onPress={onNext}>
            <Ionicons name="arrow-forward" size={20} color={colors.background} />
          </Pressable>
        </View>
      </View>
    );
  }

  if (current.variant === 'feature') {
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

  return (
    <View style={styles.screen}>
      <Pressable style={styles.skip} onPress={onFinish}>
        <Text style={styles.skipText}>Saltar</Text>
      </Pressable>

      <Animated.View style={[styles.content, { opacity: fade }]}>
        <FloatingMascot source={current.image} />
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.body}>{current.body}</Text>
      </Animated.View>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotOn]} />
          ))}
        </View>

        <Pressable style={({ pressed }) => [styles.button, pressed && { opacity: 0.9 }]} onPress={onNext}>
          <Text style={styles.buttonText}>{isLast ? 'Comenzar' : 'Siguiente'}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.background} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  skip: { position: 'absolute', top: 60, right: spacing.xl, zIndex: 1, padding: spacing.xs },
  skipText: { fontFamily: fonts.sansSemiBold, color: colors.ink55, fontSize: 14 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.ink, textAlign: 'center', marginTop: spacing.lg },
  body: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.ink55,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 21,
    maxWidth: 320,
  },
  bottom: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, alignItems: 'center', gap: spacing.lg },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.line },
  dotOn: { backgroundColor: colors.terracotta, width: 20 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.terracotta,
    borderRadius: radii.pill,
    paddingVertical: 16,
    paddingHorizontal: spacing.xxl,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  buttonText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 16 },

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
  heroBottomRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    position: 'relative',
  },
  dotsCenterWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
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
