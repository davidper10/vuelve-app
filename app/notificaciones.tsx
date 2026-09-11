import { useState } from 'react';
import { Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { safeBack } from '@/lib/navigation';
import { useNotifications } from '@/lib/notifications-context';
import type { ReminderTime } from '@/lib/notification-prefs';

type Category = 'recuerdos' | 'diario';

const COPY: Record<Category, { title: string; description: string; justify: string }> = {
  recuerdos: {
    title: 'Recuerdos de viajes',
    description: 'Te avisamos en el aniversario de un recuerdo pasado.',
    justify:
      'Te avisaremos en el aniversario de un recuerdo pasado, como "Hace un año estabas en París". Podrás desactivarlo cuando quieras.',
  },
  diario: {
    title: 'Diario y recordatorios',
    description: 'Te avisamos el día antes de que termine un viaje.',
    justify:
      'Te avisaremos el día antes de que termine un viaje, para que no se te olvide escribir cómo fue. Podrás desactivarlo cuando quieras.',
  },
};

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// Usa la fecha actual como base: construir con año 0 (1899) cae en una fecha
// previa a la estandarización de husos horarios, donde el offset histórico
// local no es un número redondo de minutos y puede no coincidir entre el
// motor JS y el selector nativo, desplazando la hora mostrada.
function timeToDate(time: ReminderTime): Date {
  const d = new Date();
  d.setHours(time.hour, time.minute, 0, 0);
  return d;
}

export default function Notificaciones() {
  const { prefs, setRecuerdosEnabled, setDiarioEnabled, setReminderTime } = useNotifications();
  const [justifying, setJustifying] = useState<Category | null>(null);
  const [denied, setDenied] = useState<Category | null>(null);
  const [activating, setActivating] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftTime, setDraftTime] = useState(() => timeToDate(prefs.reminderTime));

  const isEnabled = (category: Category) => (category === 'recuerdos' ? prefs.recuerdosEnabled : prefs.diarioEnabled);
  const setEnabled = (category: Category) => (category === 'recuerdos' ? setRecuerdosEnabled : setDiarioEnabled);

  const onToggle = (category: Category, next: boolean) => {
    setDenied(null);
    if (!next) {
      setEnabled(category)(false);
      return;
    }
    setJustifying(category);
  };

  const onConfirmActivate = async (category: Category) => {
    setActivating(true);
    const result = await setEnabled(category)(true);
    setActivating(false);
    setJustifying(null);
    if (result.permissionDenied) setDenied(category);
  };

  const openPicker = () => {
    setDraftTime(timeToDate(prefs.reminderTime));
    setPickerOpen(true);
  };

  const onTimeChange = (event: unknown, date?: Date) => {
    if (Platform.OS === 'android') setPickerOpen(false);
    if (!date) return;
    setDraftTime(date);
    if (Platform.OS === 'android') {
      setReminderTime({ hour: date.getHours(), minute: date.getMinutes() });
    }
  };

  const onConfirmTime = () => {
    setReminderTime({ hour: draftTime.getHours(), minute: draftTime.getMinutes() });
    setPickerOpen(false);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={() => safeBack('/(tabs)/perfil')}>
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>Notificaciones</Text>
      </View>

      <View style={styles.card}>
        {(['recuerdos', 'diario'] as Category[]).map((category, i) => (
          <View key={category}>
            <View style={[styles.row, i === 0 && styles.rowBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{COPY[category].title}</Text>
                <Text style={styles.rowDescription}>{COPY[category].description}</Text>
              </View>
              <Switch
                value={isEnabled(category)}
                onValueChange={(next) => onToggle(category, next)}
                trackColor={{ true: colors.sage, false: colors.line }}
              />
            </View>

            {justifying === category && (
              <View style={styles.justifyCard}>
                <Text style={styles.justifyText}>{COPY[category].justify}</Text>
                <View style={styles.justifyActions}>
                  <Pressable style={styles.justifyCancel} onPress={() => setJustifying(null)}>
                    <Text style={styles.justifyCancelText}>Ahora no</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.justifyConfirm, activating && { opacity: 0.6 }]}
                    onPress={() => onConfirmActivate(category)}
                    disabled={activating}
                  >
                    <Text style={styles.justifyConfirmText}>
                      {activating ? 'Activando…' : 'Activar notificaciones'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {denied === category && (
              <View style={styles.deniedCard}>
                <Text style={styles.deniedText}>
                  No pudimos activar las notificaciones. Actívalas desde los ajustes del sistema.
                </Text>
                <Pressable onPress={() => Linking.openSettings()}>
                  <Text style={styles.deniedLink}>Abrir ajustes</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Pressable style={styles.row} onPress={openPicker}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Hora del recordatorio</Text>
            <Text style={styles.rowDescription}>Cuándo quieres recibir estos avisos.</Text>
          </View>
          <Text style={styles.timeValue}>{formatTime(prefs.reminderTime.hour, prefs.reminderTime.minute)}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.ink38} />
        </Pressable>
      </View>

      {Platform.OS === 'ios' ? (
        <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
          <Pressable style={styles.menuOverlay} onPress={() => setPickerOpen(false)}>
            <Pressable style={styles.menuCard} onPress={(e) => e.stopPropagation()}>
              <DateTimePicker mode="time" display="spinner" value={draftTime} onChange={onTimeChange} />
              <Pressable style={styles.pickerConfirm} onPress={onConfirmTime}>
                <Text style={styles.pickerConfirmText}>Listo</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      ) : (
        pickerOpen && <DateTimePicker mode="time" display="default" value={draftTime} onChange={onTimeChange} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingTop: 60, paddingBottom: 120, gap: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.line,
  },
  title: { fontFamily: fonts.serif, fontSize: 24, color: colors.ink },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 14, paddingHorizontal: spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.ink },
  rowDescription: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink55, marginTop: 2 },
  timeValue: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink55 },
  justifyCard: {
    backgroundColor: colors.sageLight,
    borderRadius: radii.md,
    padding: spacing.md,
    margin: spacing.md,
    marginTop: 0,
    gap: spacing.sm,
  },
  justifyText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.ink70, lineHeight: 18 },
  justifyActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md },
  justifyCancel: { paddingVertical: 8, paddingHorizontal: 4 },
  justifyCancelText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink55 },
  justifyConfirm: { backgroundColor: colors.ink, borderRadius: radii.pill, paddingVertical: 9, paddingHorizontal: 16 },
  justifyConfirmText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.background },
  deniedCard: {
    backgroundColor: colors.terracottaLight,
    borderRadius: radii.md,
    padding: spacing.md,
    margin: spacing.md,
    marginTop: 0,
    gap: 6,
  },
  deniedText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.ink70, lineHeight: 18 },
  deniedLink: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.terracotta },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(20,12,14,0.4)', justifyContent: 'flex-end' },
  menuCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  pickerConfirm: {
    marginTop: spacing.sm,
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  pickerConfirmText: { fontFamily: fonts.sansBold, fontSize: 14.5, color: colors.background },
});
