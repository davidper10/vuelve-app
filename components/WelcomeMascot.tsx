import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet } from 'react-native';

const SIZE = 220;
// Punto de apoyo del hombro, como fracción del tamaño de la imagen (el
// personaje original es cuadrado y mira al frente con la pata ya
// levantada). Al rotar alrededor de este punto en vez del centro, la pata
// -la parte más alejada del hombro- es lo que más se mueve, mientras el
// resto del cuerpo apenas se desplaza.
const PIVOT_X_FRAC = 0.4;
const PIVOT_Y_FRAC = 0.56;
const pivotOffsetX = (PIVOT_X_FRAC - 0.5) * SIZE;
const pivotOffsetY = (PIVOT_Y_FRAC - 0.5) * SIZE;

export function WelcomeMascot() {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const wave = Animated.sequence([
      Animated.timing(rotate, { toValue: -8, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(rotate, { toValue: 4, duration: 260, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(rotate, { toValue: -8, duration: 260, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(rotate, { toValue: 4, duration: 260, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(rotate, { toValue: 0, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.delay(1500),
    ]);
    const loop = Animated.loop(wave);
    loop.start();
    return () => loop.stop();
  }, [rotate]);

  const rotateDeg = rotate.interpolate({ inputRange: [-8, 8], outputRange: ['-8deg', '8deg'] });

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          transform: [
            { translateX: -pivotOffsetX },
            { translateY: -pivotOffsetY },
            { rotate: rotateDeg },
            { translateX: pivotOffsetX },
            { translateY: pivotOffsetY },
          ],
        },
      ]}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
      <Image source={require('../assets/mascota/saludo.png')} style={styles.image} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE },
  image: { width: SIZE, height: SIZE },
});
