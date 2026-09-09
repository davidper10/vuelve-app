import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, type ImageSourcePropType } from 'react-native';

const SIZE = 200;

export function FloatingMascot({ source }: { source: ImageSourcePropType }) {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  const translateY = float.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] });

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <Image source={source} style={styles.image} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  image: { width: SIZE, height: SIZE },
});
