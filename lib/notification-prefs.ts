import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReminderTime = { hour: number; minute: number };

export type NotificationPrefs = {
  recuerdosEnabled: boolean;
  diarioEnabled: boolean;
  reminderTime: ReminderTime;
};

const STORAGE_KEY = '@vuelve/notification-prefs/v1';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  recuerdosEnabled: false,
  diarioEnabled: false,
  reminderTime: { hour: 9, minute: 0 },
};

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFS;
    return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export async function setNotificationPrefs(patch: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
  const current = await getNotificationPrefs();
  const next = { ...current, ...patch };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
