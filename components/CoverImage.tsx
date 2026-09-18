import { Image, StyleSheet, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';

// resizeMode="cover" + StyleSheet.absoluteFill no estira el <Image> en el
// preview web (usa el tamaño intrínseco del archivo). Calculamos a mano el
// mismo efecto "cover" a partir de las dimensiones reales de la imagen.
export function CoverImage({
  source,
  naturalWidth,
  naturalHeight,
  fit = 'cover',
  verticalBias = 0.5,
}: {
  source: ImageSourcePropType;
  naturalWidth: number;
  naturalHeight: number;
  // 'cover' (por defecto) escala para cubrir ancho y alto, recortando lo
  // que sobre. 'width' escala solo por el ancho -- sin recortar ni
  // ampliar de más -- y puede dejar un hueco vertical; ese hueco se
  // rellena con el fondo de la pantalla (colocar detrás un color a juego
  // con el de la propia imagen para que no se note la costura).
  fit?: 'cover' | 'width';
  // Reparte el sobrante/hueco vertical: 0 ancla la imagen arriba, 0.5
  // centra (por defecto), 1 ancla abajo (deja el hueco arriba).
  verticalBias?: number;
}) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const scale = fit === 'width' ? screenWidth / naturalWidth : Math.max(screenWidth / naturalWidth, screenHeight / naturalHeight);
  const imageWidth = naturalWidth * scale;
  const imageHeight = naturalHeight * scale;
  const imageLeft = -(imageWidth - screenWidth) / 2;
  const imageTop = -(imageHeight - screenHeight) * verticalBias;

  return (
    <View style={styles.clip}>
      <Image source={source} style={{ width: imageWidth, height: imageHeight, left: imageLeft, top: imageTop }} />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
});
