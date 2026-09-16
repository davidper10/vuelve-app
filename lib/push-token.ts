import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export async function registerPushToken(userId: string): Promise<void> {
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return; // Falta `eas init` / app.json todavía.

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token) return;

    await supabase.from('devices').upsert(
      { user_id: userId, expo_push_token: token, platform: Platform.OS, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,expo_push_token' }
    );
  } catch {
    // Módulo nativo no disponible todavía, o falla la petición a Expo
    // (p.ej. credenciales APNs no configuradas aún vía `eas credentials`).
  }
}
