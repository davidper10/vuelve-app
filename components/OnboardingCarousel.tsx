import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { FloatingMascot } from './FloatingMascot';

const STEPS = [
  {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('../assets/mascota/recuerdo.png'),
    title: 'Crea tu viaje',
    body: 'Organiza cada aventura y comparte el viaje con tus amigos para que todos podáis añadir recuerdos juntos.',
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('../assets/mascota/registro.png'),
    title: 'Guarda tus recuerdos',
    body: 'Añade fotos, notas y los momentos especiales de cada día, todo en un mismo sitio.',
  },
  {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    image: require('../assets/mascota/saludo.png'),
    title: 'Vincula un NFC',
    body: 'Pega un sticker NFC a un objeto físico. Al acercar el móvil, el recuerdo se abre al instante.',
  },
];

export function OnboardingCarousel({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
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
});
