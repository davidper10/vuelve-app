import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { radii } from '@/constants/theme';
import type { Tables } from '@/lib/database.types';

type Moment = Tables<'moments'>;
type Pin = { lat: number; lng: number; title: string; place: string | null };

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function buildHtml(pins: Pin[]) {
  const center = pins[0];
  const markersJs = pins
    .map(
      (p) =>
        `L.marker([${p.lat}, ${p.lng}]).addTo(map).bindPopup(${JSON.stringify(
          `<strong>${escapeHtml(p.title)}</strong>${p.place ? '<br/>' + escapeHtml(p.place) : ''}`
        )});`
    )
    .join('\n');
  const boundsJs =
    pins.length > 1
      ? `var bounds = L.latLngBounds([${pins.map((p) => `[${p.lat},${p.lng}]`).join(',')}]); map.fitBounds(bounds, {padding:[30,30]});`
      : '';

  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>html,body,#map{height:100%;margin:0;padding:0;}</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map').setView([${center.lat}, ${center.lng}], 6);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
  ${markersJs}
  ${boundsJs}
</script>
</body></html>`;
}

export function TripMap({ moments }: { moments: Moment[] }) {
  const pins: Pin[] = moments
    .filter((m): m is Moment & { lat: number; lng: number } => m.lat != null && m.lng != null)
    .map((m) => ({ lat: m.lat, lng: m.lng, title: m.title, place: m.place_name }));

  if (pins.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <WebView source={{ html: buildHtml(pins) }} style={{ flex: 1 }} originWhitelist={['*']} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 320, borderRadius: radii.lg, overflow: 'hidden' },
});
