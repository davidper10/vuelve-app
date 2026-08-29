import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { radii } from '@/constants/theme';
import type { Tables } from '@/lib/database.types';

type Moment = Tables<'moments'>;
type Pin = { lat: number; lng: number; title: string; place: string | null };

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

const LEAFLET_CSS_ID = 'leaflet-css-cdn';

// Metro no soporta url(images/...) relativas dentro de CSS bundleado
// (los iconos de marcador de Leaflet las usan), así que el CSS se carga
// desde el CDN igual que en el mockup, en vez de importarlo como módulo.
function ensureLeafletCss() {
  if (document.getElementById(LEAFLET_CSS_ID)) return;
  const link = document.createElement('link');
  link.id = LEAFLET_CSS_ID;
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

export function TripMap({ moments }: { moments: Moment[] }) {
  const containerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);

  const pins: Pin[] = moments
    .filter((m): m is Moment & { lat: number; lng: number } => m.lat != null && m.lng != null)
    .map((m) => ({ lat: m.lat, lng: m.lng, title: m.title, place: m.place_name }));

  useEffect(() => {
    if (pins.length === 0) return;
    let cancelled = false;

    (async () => {
      ensureLeafletCss();
      const L = await import('leaflet');
      if (cancelled || !containerRef.current) return;

      // Metro bundlea leaflet.js, así que la auto-detección de la ruta de
      // los iconos (basada en dónde se cargó el script) no aplica aquí.
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current).setView([pins[0].lat, pins[0].lng], 6);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap',
        }).addTo(mapRef.current);
      }

      pins.forEach((p) => {
        const marker = L.marker([p.lat, p.lng]).addTo(mapRef.current);
        marker.bindPopup(`<strong>${escapeHtml(p.title)}</strong>${p.place ? `<br/>${escapeHtml(p.place)}` : ''}`);
      });

      if (pins.length > 1) {
        mapRef.current.fitBounds(
          pins.map((p) => [p.lat, p.lng]),
          { padding: [30, 30] }
        );
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moments]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  if (pins.length === 0) return null;

  return <View ref={containerRef} style={styles.wrap} />;
}

const styles = StyleSheet.create({
  wrap: { height: 320, borderRadius: radii.lg, overflow: 'hidden' },
});
