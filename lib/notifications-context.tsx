import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import {
  DEFAULT_NOTIFICATION_PREFS,
  getNotificationPrefs,
  setNotificationPrefs,
  type NotificationPrefs,
  type ReminderTime,
} from '@/lib/notification-prefs';
import {
  cancelAllVuelveNotifications,
  getNotificationPermissionStatus,
  refreshScheduledNotifications,
  requestNotificationPermission,
} from '@/lib/notifications';
import { registerPushToken } from '@/lib/push-token';

export type ToggleResult = { enabled: boolean; permissionDenied?: boolean };

type CategoryKey = 'recuerdosEnabled' | 'diarioEnabled' | 'colaborativosEnabled' | 'nfcEnabled';

type NotificationsContextValue = {
  prefs: NotificationPrefs;
  loading: boolean;
  setRecuerdosEnabled: (enabled: boolean) => Promise<ToggleResult>;
  setDiarioEnabled: (enabled: boolean) => Promise<ToggleResult>;
  setColaborativosEnabled: (enabled: boolean) => Promise<ToggleResult>;
  setNfcEnabled: (enabled: boolean) => Promise<ToggleResult>;
  setReminderTime: (time: ReminderTime) => Promise<void>;
  refresh: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

function routeForResponse(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as
    | { type?: string; momentId?: string; tripId?: string }
    | undefined;
  if (data?.type === 'recuerdo' && data.momentId) router.push(`/momento/${data.momentId}`);
  else if (data?.type === 'diario' && data.tripId) router.push(`/viaje/${data.tripId}?tab=diario`);
  else if (data?.type === 'colaborativo_fotos' && data.momentId) router.push(`/momento/${data.momentId}`);
  else if (data?.type === 'colaborativo_fotos' && data.tripId) router.push(`/viaje/${data.tripId}`);
  else if (data?.type === 'colaborativo_miembro' && data.tripId) router.push(`/viaje/${data.tripId}`);
  else if (data?.type === 'nfc_actividad' && data.momentId) router.push(`/momento/${data.momentId}`);
  else if (data?.type === 'nfc_actividad' && data.tripId) router.push(`/viaje/${data.tripId}`);
}

export function NotificationsProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setPrefs(await getNotificationPrefs());
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    let sub: ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | undefined;
    try {
      sub = Notifications.addNotificationResponseReceivedListener(routeForResponse);
      Notifications.getLastNotificationResponseAsync()
        .then((response) => {
          if (response) routeForResponse(response);
        })
        .catch(() => {});
    } catch {
      // Módulo nativo no disponible todavía (p.ej. falta un rebuild nativo, o preview web).
    }
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    if (!session) {
      cancelAllVuelveNotifications();
      return;
    }
    (async () => {
      if ((await getNotificationPermissionStatus()) === 'granted') {
        registerPushToken(session.user.id);
      }
    })();
  }, [session?.user.id]);

  const persistAndRefresh = async (patch: Partial<NotificationPrefs>) => {
    const next = await setNotificationPrefs(patch);
    setPrefs(next);
    await refreshScheduledNotifications();
    return next;
  };

  const mirrorServerPrefs = (next: NotificationPrefs) => {
    if (!session?.user.id) return;
    supabase
      .from('notification_preferences')
      .upsert(
        { user_id: session.user.id, colaborativos: next.colaborativosEnabled, nfc: next.nfcEnabled },
        { onConflict: 'user_id' }
      )
      .then();
  };

  const setCategoryEnabled = async (key: CategoryKey, enabled: boolean): Promise<ToggleResult> => {
    const isServerCategory = key === 'colaborativosEnabled' || key === 'nfcEnabled';

    if (!enabled) {
      const next = await persistAndRefresh({ [key]: false });
      if (isServerCategory) mirrorServerPrefs(next);
      return { enabled: false };
    }
    const granted = await requestNotificationPermission();
    if (!granted) return { enabled: false, permissionDenied: true };
    const next = await persistAndRefresh({ [key]: true });
    if (isServerCategory) mirrorServerPrefs(next);
    if (session?.user.id) registerPushToken(session.user.id);
    return { enabled: true };
  };

  const value: NotificationsContextValue = {
    prefs,
    loading,
    setRecuerdosEnabled: (enabled) => setCategoryEnabled('recuerdosEnabled', enabled),
    setDiarioEnabled: (enabled) => setCategoryEnabled('diarioEnabled', enabled),
    setColaborativosEnabled: (enabled) => setCategoryEnabled('colaborativosEnabled', enabled),
    setNfcEnabled: (enabled) => setCategoryEnabled('nfcEnabled', enabled),
    setReminderTime: async (time) => {
      await persistAndRefresh({ reminderTime: time });
    },
    refresh: refreshScheduledNotifications,
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications debe usarse dentro de <NotificationsProvider>');
  return ctx;
}
