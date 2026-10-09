import { useMemo } from 'react';
import { View } from 'react-native';
import { encode } from 'uqr';

// QR dibujado con Views (sin módulos nativos): cada fila se compacta en tramos
// de módulos oscuros contiguos. Fondo blanco y margen de 4 módulos para que
// cualquier lector lo detecte.
export function QrCode({ value, size = 200 }: { value: string; size?: number }) {
  const { data, count } = useMemo(() => {
    const result = encode(value, { ecc: 'M', border: 0 });
    return { data: result.data, count: result.size };
  }, [value]);

  const margin = 4;
  const total = count + margin * 2;
  const cell = size / total;

  const runs: { row: number; start: number; length: number }[] = [];
  for (let r = 0; r < count; r++) {
    let start = -1;
    for (let c = 0; c <= count; c++) {
      const dark = c < count && data[r][c];
      if (dark && start < 0) start = c;
      if (!dark && start >= 0) {
        runs.push({ row: r, start, length: c - start });
        start = -1;
      }
    }
  }

  return (
    <View style={{ width: size, height: size, backgroundColor: '#FFFFFF' }} accessibilityLabel="Código QR del enlace">
      {runs.map((run) => (
        <View
          key={`${run.row}-${run.start}`}
          style={{
            position: 'absolute',
            left: (run.start + margin) * cell,
            top: (run.row + margin) * cell,
            width: run.length * cell,
            height: cell,
            backgroundColor: '#000000',
          }}
        />
      ))}
    </View>
  );
}
