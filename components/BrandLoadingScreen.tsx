import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '@/constants/theme';

// Puntos de un arco parabólico (mismo p en [0,1] para el avión animado y
// para los puntos fijos de la estela), sin necesitar SVG:
// x(p) = -120 + 240p, y(p) = 40 - 400 · p · (1-p)
const ARC_STOPS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
const arcX = (p: number) => -120 + 240 * p;
const arcY = (p: number) => 40 - 400 * p * (1 - p);
const DASH_STOPS = [0.12, 0.28, 0.42, 0.58, 0.72, 0.88];

export function BrandLoadingScreen() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 2400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [progress]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-120, 120] });
  const translateY = progress.interpolate({
    inputRange: ARC_STOPS,
    outputRange: ARC_STOPS.map(arcY),
  });
  const rotate = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['16deg', '0deg', '-16deg'] });

  return (
    <View style={styles.screen}>
      <View style={styles.globeWrap}>
        <View style={styles.globe}>
          <View style={styles.meridian} />
          <View style={[styles.meridian, styles.meridianNarrow]} />
          <View style={[styles.meridian, styles.equator]} />
          <View style={[styles.pin, { top: 58, left: 66 }]} />
          <View style={[styles.pin, { top: 98, left: 132 }]} />
          <View style={[styles.pin, { top: 132, left: 82 }]} />
        </View>

        {DASH_STOPS.map((p) => (
          <View key={p} style={[styles.dash, { transform: [{ translateX: arcX(p) }, { translateY: arcY(p) }] }]} />
        ))}

        <Animated.View style={[styles.plane, { transform: [{ translateX }, { translateY }, { rotate }] }]}>
          <Ionicons name="airplane" size={26} color={colors.ink} />
        </Animated.View>
      </View>

      <Text style={styles.wordmark}>SaveTrip</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  globeWrap: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  globe: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  meridian: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.line,
  },
  meridianNarrow: { transform: [{ scaleX: 0.42 }] },
  equator: { transform: [{ scaleY: 0.32 }] },
  pin: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.terracotta,
  },
  dash: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.ink38,
  },
  plane: { position: 'absolute' },
  wordmark: {
    fontFamily: fonts.serif,
    fontSize: 40,
    color: colors.ink,
    letterSpacing: 0.3,
  },
});
