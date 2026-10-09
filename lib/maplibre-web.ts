// Fondo de mapa en web: Leaflet + estilo vectorial de OpenFreeMap (gratuito y
// sin clave) a través del plugin maplibre-gl-leaflet. Se carga desde el CDN
// igual que el CSS de Leaflet, porque Metro no empaqueta bien esos assets.
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
export const MAP_ATTRIBUTION = '&copy; OpenMapTiles &copy; OpenStreetMap contributors';

const MAPLIBRE_VERSION = '4.7.1';
const PLUGIN_VERSION = '0.1.4';

function loadCss(id: string, href: string) {
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function loadScript(id: string, src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(script);
  });
}

// El plugin espera `L` y `maplibregl` globales.
export async function ensureMapLibreLeaflet(L: unknown) {
  (window as any).L = L;
  loadCss('maplibre-css-cdn', `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.css`);
  await loadScript('maplibre-js-cdn', `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.js`);
  await loadScript(
    'maplibre-leaflet-js-cdn',
    `https://unpkg.com/@maplibre/maplibre-gl-leaflet@${PLUGIN_VERSION}/leaflet-maplibre-gl.js`
  );
}

export function addBaseLayer(L: any, map: unknown) {
  L.maplibreGL({ style: MAP_STYLE_URL, attribution: MAP_ATTRIBUTION }).addTo(map);
}
