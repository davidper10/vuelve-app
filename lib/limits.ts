import { supabase } from '@/lib/supabase';

export const FREE_TRIP_LIMIT = 3;
export const FREE_NFC_LIMIT = 1;
export const FREE_COLLABORATOR_LIMIT = 2;
export const FREE_PHOTO_LIMIT = 50;

export async function countOwnedTrips(userId: string) {
  const { count } = await supabase
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId);
  return count ?? 0;
}

export async function countOwnedNfcTags(userId: string) {
  const { count } = await supabase
    .from('nfc_tags')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId);
  return count ?? 0;
}

export async function countTripMembers(tripId: string) {
  const { count } = await supabase
    .from('trip_members')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId);
  return count ?? 0;
}

export async function countTripMemories(tripId: string) {
  const { count } = await supabase
    .from('memories')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId);
  return count ?? 0;
}

export async function isUserPremium(userId: string) {
  const { data } = await supabase.from('profiles').select('is_premium').eq('id', userId).maybeSingle();
  return data?.is_premium ?? false;
}
