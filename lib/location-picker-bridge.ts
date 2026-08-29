import { router } from 'expo-router';

export type PickedLocation = { lat: number; lng: number; placeName: string | null };

type Resolver = (result: PickedLocation | null) => void;

let pendingResolver: Resolver | null = null;

// Puente simple para que /seleccionar-lugar devuelva un resultado a quien
// lo abrió, ya que expo-router no tiene un mecanismo nativo de "resultado
// de pantalla" como navigation.navigate con callback.
export function requestLocation(initial?: { lat: number | null; lng: number | null } | null): Promise<PickedLocation | null> {
  return new Promise((resolve) => {
    pendingResolver = resolve;
    const params: Record<string, string> = {};
    if (initial?.lat != null && initial?.lng != null) {
      params.lat = String(initial.lat);
      params.lng = String(initial.lng);
    }
    router.push({ pathname: '/seleccionar-lugar', params });
  });
}

export function resolveLocation(result: PickedLocation | null) {
  pendingResolver?.(result);
  pendingResolver = null;
}
