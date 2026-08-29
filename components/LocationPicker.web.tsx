import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

const LEAFLET_CSS_ID = 'leaflet-css-cdn';

function ensureLeafletCss() {
  if (document.getElementById(LEAFLET_CSS_ID)) return;
  const link = document.createElement('link');
  link.id = LEAFLET_CSS_ID;
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

export function LocationPicker({
  initialLat,
  initialLng,
  onPick,
}: {
  initialLat: number | null;
  initialLng: number | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      ensureLeafletCss();
      const L = await import('leaflet');
      if (cancelled || !containerRef.current || mapRef.current) return;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const hasInitial = initialLat != null && initialLng != null;
      const map = L.map(containerRef.current).setView(
        [hasInitial ? initialLat! : 20, hasInitial ? initialLng! : 0],
        hasInitial ? 13 : 3
      );
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      if (hasInitial) {
        markerRef.current = L.marker([initialLat!, initialLng!]).addTo(map);
      }

      map.on('click', (e: any) => {
        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        } else {
          markerRef.current = L.marker(e.latlng).addTo(map);
        }
        onPickRef.current(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return <View ref={containerRef} style={styles.wrap} />;
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
});
