import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import { getNotificationPrefs, type ReminderTime } from '@/lib/notification-prefs';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const RECUERDO_PREFIX = 'recuerdo:';
const DIARIO_PREFIX = 'diario:';
const LOOKAHEAD_DAYS = 60;
const MAX_PER_CATEGORY = 30;
const DAY_MS = 86_400_000;

export async function getNotificationPermissionStatus() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch {
    // Módulo nativo no disponible todavía (p.ej. falta un rebuild nativo, o preview web).
    return 'undetermined' as const;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function canAskForPermissionAgain(): Promise<boolean> {
  try {
    const { canAskAgain } = await Notifications.getPermissionsAsync();
    return canAskAgain;
  } catch {
    return false;
  }
}

function nextAnniversary(sourceISO: string, from: Date, lookaheadDays: number): Date | null {
  const source = new Date(sourceISO);
  const month = source.getMonth();
  const day = source.getDate();
  const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  let candidate = new Date(from.getFullYear(), month, day);
  if (candidate < fromMidnight) {
    candidate = new Date(from.getFullYear() + 1, month, day);
  }

  if (candidate.getFullYear() <= source.getFullYear()) return null;
  const diffDays = (candidate.getTime() - fromMidnight.getTime()) / DAY_MS;
  if (diffDays < 0 || diffDays > lookaheadDays) return null;

  return candidate;
}

function dayBeforeEndDate(endDateISO: string): Date {
  const end = new Date(endDateISO);
  return new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1);
}

function withReminderTime(date: Date, time: ReminderTime): Date {
  const d = new Date(date);
  d.setHours(time.hour, time.minute, 0, 0);
  return d;
}

async function cancelByPrefix(prefix: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(prefix))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

async function scheduleRecuerdos(reminderTime: ReminderTime) {
  await cancelByPrefix(RECUERDO_PREFIX);

  const { data: moments } = await supabase
    .from('moments')
    .select('id, title, occurred_at')
    .not('occurred_at', 'is', null)
    .order('occurred_at', { ascending: false })
    .limit(500);

  const now = new Date();
  const candidates = (moments ?? [])
    .map((m) => {
      const next = nextAnniversary(m.occurred_at as string, now, LOOKAHEAD_DAYS);
      if (!next) return null;
      const fireAt = withReminderTime(next, reminderTime);
      if (fireAt <= now) return null;
      const yearsAgo = fireAt.getFullYear() - new Date(m.occurred_at as string).getFullYear();
      return { moment: m, fireAt, yearsAgo };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
    .slice(0, MAX_PER_CATEGORY);

  for (const c of candidates) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${RECUERDO_PREFIX}${c.moment.id}`,
      content: {
        title: `Hace ${c.yearsAgo} ${c.yearsAgo === 1 ? 'año' : 'años'} 🗺️`,
        body: `Estabas viviendo "${c.moment.title}"`,
        data: { type: 'recuerdo', momentId: c.moment.id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: c.fireAt },
    });
  }
}

async function scheduleDiario(reminderTime: ReminderTime) {
  await cancelByPrefix(DIARIO_PREFIX);

  const { data: trips } = await supabase.from('trips').select('id, title, end_date').not('end_date', 'is', null);

  const now = new Date();
  const candidates = (trips ?? [])
    .map((t) => {
      const fireAt = withReminderTime(dayBeforeEndDate(t.end_date as string), reminderTime);
      if (fireAt <= now) return null;
      const diffDays = (fireAt.getTime() - now.getTime()) / DAY_MS;
      if (diffDays > LOOKAHEAD_DAYS) return null;
      return { trip: t, fireAt };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
    .slice(0, MAX_PER_CATEGORY);

  for (const c of candidates) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${DIARIO_PREFIX}${c.trip.id}`,
      content: {
        title: 'Tu viaje termina mañana ✈️',
        body: '¿Quieres escribir cómo fue?',
        data: { type: 'diario', tripId: c.trip.id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: c.fireAt },
    });
  }
}

export async function refreshScheduledNotifications(): Promise<void> {
  const status = await getNotificationPermissionStatus();
  if (status !== 'granted') return;

  try {
    const prefs = await getNotificationPrefs();

    if (prefs.recuerdosEnabled) await scheduleRecuerdos(prefs.reminderTime);
    else await cancelByPrefix(RECUERDO_PREFIX);

    if (prefs.diarioEnabled) await scheduleDiario(prefs.reminderTime);
    else await cancelByPrefix(DIARIO_PREFIX);
  } catch {
    // Módulo nativo no disponible todavía (p.ej. falta un rebuild nativo, o preview web).
  }
}

export async function cancelAllVuelveNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Módulo nativo no disponible todavía (p.ej. falta un rebuild nativo, o preview web).
  }
}
