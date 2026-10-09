import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export type SharedMedia = { path: string; type: string };

export type SharedMoment = {
  id: string;
  title: string;
  story: string | null;
  place_name: string | null;
  occurred_at: string | null;
  lat: number | null;
  lng: number | null;
  media: SharedMedia[];
};

export type SharedTrip = {
  id: string;
  title: string;
  country: string | null;
  cover_photo_url: string | null;
  start_date: string | null;
  end_date: string | null;
  destination_summary: string | null;
  quote: string | null;
};

export type SharedPayload = {
  mode: 'view' | 'collab' | 'nfc';
  kind?: 'trip' | 'moment' | 'empty';
  tag_id?: string;
  viewer_role: 'owner' | 'member' | null;
  trip: SharedTrip;
  owner: { full_name: string | null; avatar_url: string | null };
  moment_count?: number;
  memory_count?: number;
  moments: SharedMoment[];
};

export type EmptyTag = { kind: 'empty'; tag_id: string };

export type JoinResult = {
  trip_id?: string;
  joined?: boolean;
  error?: 'auth' | 'not_found' | 'view_only' | 'full';
};

// Estas funciones de la base de datos exigen el código exacto del enlace: es lo
// que permite ver contenido compartido sin ser miembro (ni tener cuenta).
export async function fetchSharedTrip(slug: string): Promise<SharedPayload | null> {
  const { data, error } = await supabase.rpc('get_shared_trip', { p_slug: slug });
  if (error) return null;
  return (data as unknown as SharedPayload | null) ?? null;
}

export async function fetchSharedNfc(slug: string): Promise<SharedPayload | EmptyTag | null> {
  const { data, error } = await supabase.rpc('get_shared_nfc', { p_slug: slug });
  if (error) return null;
  return (data as unknown as SharedPayload | EmptyTag | null) ?? null;
}

export async function joinTrip(slug: string): Promise<JoinResult> {
  const { data, error } = await supabase.rpc('join_trip', { p_slug: slug });
  if (error) return { error: 'not_found' };
  return (data as unknown as JoinResult) ?? { error: 'not_found' };
}

export function mediaUrl(path: string) {
  return supabase.storage.from('memories').getPublicUrl(path).data.publicUrl;
}

// Quien abre un enlace de colaborar sin cuenta debe iniciar sesión primero;
// se recuerda el código para retomarlo al entrar.
const PENDING_JOIN_KEY = '@savetrip/pending-join/v1';

export async function setPendingJoin(slug: string) {
  try {
    await AsyncStorage.setItem(PENDING_JOIN_KEY, slug);
  } catch {
    // sin almacenamiento disponible: el usuario tendrá que volver a abrir el enlace
  }
}

export async function takePendingJoin(): Promise<string | null> {
  try {
    const slug = await AsyncStorage.getItem(PENDING_JOIN_KEY);
    if (slug) await AsyncStorage.removeItem(PENDING_JOIN_KEY);
    return slug;
  } catch {
    return null;
  }
}
