import { useEffect } from 'react';
import { useSegments } from 'expo-router';
import { usePostHog } from 'posthog-react-native';

// El autocapture de pantallas de PostHog depende de un NavigationContainer
// propio, que Expo Router no expone -- así que se desactiva (ver
// `autocapture={{ captureScreens: false }}` en app/_layout.tsx) y se manda
// el evento a mano aquí. Se usa useSegments() en vez de usePathname() para
// que rutas dinámicas como viaje/[id] cuenten como una sola pantalla en vez
// de una por cada viaje.
export function ScreenTracker() {
  const posthog = usePostHog();
  const segments = useSegments();

  useEffect(() => {
    const screenName = `/${segments.join('/')}`;
    posthog.screen(screenName);
  }, [posthog, segments]);

  return null;
}
