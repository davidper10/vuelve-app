import { Image, StyleSheet, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';

// resizeMode="cover" + StyleSheet.absoluteFill no estira el <Image> en el
// preview web (usa el tamaño intrínseco del archivo). Calculamos a mano el
// mismo efecto "cover" a partir de las dimensiones reales de la imagen.
export function CoverImage({
  source,
  naturalWidth,
  naturalHeight,
}: {
  source: ImageSourcePropType;
  naturalWidth: number;
  naturalHeight: number;
}) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const scale = Math.max(screenWidth / naturalWidth, screenHeight / naturalHeight);
  const imageWidth = naturalWidth * scale;
  const imageHeight = naturalHeight * scale;
  const imageLeft = -(imageWidth - screenWidth) / 2;
  const imageTop = -(imageHeight - screenHeight) / 2;

  return (
    <View style={styles.clip}>
      <Image source={source} style={{ width: imageWidth, height: imageHeight, left: imageLeft, top: imageTop }} />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
});
