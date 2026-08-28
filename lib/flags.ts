// Bandera de emoji a partir del nombre de país en español (texto libre que
// el usuario escribe al crear/editar un viaje). Cobertura de los destinos
// más habituales; si no hay match, se omite la bandera sin romper el layout.
const FLAGS: Record<string, string> = {
  japon: '🇯🇵',
  italia: '🇮🇹',
  francia: '🇫🇷',
  espana: '🇪🇸',
  portugal: '🇵🇹',
  'reino unido': '🇬🇧',
  inglaterra: '🇬🇧',
  alemania: '🇩🇪',
  paises_bajos: '🇳🇱',
  holanda: '🇳🇱',
  belgica: '🇧🇪',
  suiza: '🇨🇭',
  austria: '🇦🇹',
  grecia: '🇬🇷',
  turquia: '🇹🇷',
  marruecos: '🇲🇦',
  egipto: '🇪🇬',
  estados_unidos: '🇺🇸',
  eeuu: '🇺🇸',
  usa: '🇺🇸',
  canada: '🇨🇦',
  mexico: '🇲🇽',
  brasil: '🇧🇷',
  argentina: '🇦🇷',
  chile: '🇨🇱',
  peru: '🇵🇪',
  colombia: '🇨🇴',
  china: '🇨🇳',
  tailandia: '🇹🇭',
  vietnam: '🇻🇳',
  indonesia: '🇮🇩',
  india: '🇮🇳',
  corea_del_sur: '🇰🇷',
  australia: '🇦🇺',
  nueva_zelanda: '🇳🇿',
  irlanda: '🇮🇪',
  noruega: '🇳🇴',
  suecia: '🇸🇪',
  dinamarca: '🇩🇰',
  finlandia: '🇫🇮',
  islandia: '🇮🇸',
  croacia: '🇭🇷',
  polonia: '🇵🇱',
  republica_checa: '🇨🇿',
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_');
}

export function flagForCountry(country: string | null | undefined): string {
  if (!country) return '';
  return FLAGS[normalize(country)] ?? '';
}
