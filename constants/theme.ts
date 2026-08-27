// Sistema visual de Vuelve — coherente con las mockups (paleta cálida,
// tipografía editorial + UI limpia). Mantener estos valores como única
// fuente de verdad; no repetir hex sueltos por las pantallas.

export const colors = {
  background: '#FAF8F4',
  ink: '#171717',
  ink70: 'rgba(23,23,23,0.72)',
  ink55: 'rgba(23,23,23,0.55)',
  ink38: 'rgba(23,23,23,0.38)',
  sage: '#68775C',
  terracotta: '#C87554',
  sand: '#EAE2D6',
  sandDark: '#DED2BF',
  line: 'rgba(23,23,23,0.09)',
  card: '#FFFFFF',
} as const;

// Familias registradas por useFonts() en app/_layout.tsx.
export const fonts = {
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  sans: 'Manrope_400Regular',
  sansMedium: 'Manrope_500Medium',
  sansSemiBold: 'Manrope_600SemiBold',
  sansBold: 'Manrope_700Bold',
  sansExtraBold: 'Manrope_800ExtraBold',
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

// Gradientes de placeholder para portadas de viaje (mientras no haya
// fotos reales del usuario). Ver Trip['coverGradient'] en lib/types.ts.
export const coverGradients: Record<string, [string, string, string]> = {
  japon: ['#F3D9CF', '#D98E7A', '#5B4653'],
  roma: ['#E8C39A', '#C87554', '#7A4A33'],
  lisboa: ['#D7DFD4', '#8FA089', '#3F4A3B'],
  paris: ['#E7E1D3', '#B7AFA0', '#4A4038'],
  ibiza: ['#F6D9A8', '#D9885A', '#3A5F6B'],
  default: ['#EAE2D6', '#C87554', '#5B4653'],
};

// Normaliza el título de un viaje a una clave de coverGradients (quita
// acentos: "Japón" -> "japon"). Única fuente de verdad — usar esta función
// en vez de repetir la lógica de normalización en cada pantalla.
export function gradientFor(title: string): [string, string, string] {
  const key = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  return coverGradients[key] ?? coverGradients.default;
}
