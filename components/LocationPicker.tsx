import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

function buildHtml(initialLat: number, initialLng: number, hasInitial: boolean) {
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>html,body,#map{height:100%;margin:0;padding:0;}</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
  var map = L.map('map').setView([${initialLat}, ${initialLng}], ${hasInitial ? 13 : 3});
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
  var marker = ${hasInitial ? `L.marker([${initialLat}, ${initialLng}]).addTo(map)` : 'null'};
  function post(msg) {
    window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  }
  map.on('click', function (e) {
    if (marker) { marker.setLatLng(e.latlng); } else { marker = L.marker(e.latlng).addTo(map); }
    post({ lat: e.latlng.lat, lng: e.latlng.lng });
  });
</script>
</body></html>`;
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
  const hasInitial = initialLat != null && initialLng != null;
  const html = buildHtml(initialLat ?? 20, initialLng ?? 0, hasInitial);

  return (
    <WebView
      source={{ html }}
      style={styles.webview}
      originWhitelist={['*']}
      onMessage={(e) => {
        try {
          const data = JSON.parse(e.nativeEvent.data);
          if (typeof data.lat === 'number' && typeof data.lng === 'number') {
            onPick(data.lat, data.lng);
          }
        } catch {
          // ignore malformed messages
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  webview: { flex: 1 },
});
