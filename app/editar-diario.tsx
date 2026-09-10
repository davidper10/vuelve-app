import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { safeBack } from '@/lib/navigation';
import { DateField } from '@/components/DateField';
import type { Tables } from '@/lib/database.types';

type DiaryEntry = Tables<'diary_entries'>;

export default function EditarDiario() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [entryDate, setEntryDate] = useState('');
  const [title, setTitle] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!entryId) return;
    const { data } = await supabase.from('diary_entries').select('*').eq('id', entryId).single();
    if (data) {
      setEntry(data);
      setEntryDate(data.entry_date);
      setTitle(data.title ?? '');
      setPlaceName(data.place_name ?? '');
      setBody(data.body);
    }
  }, [entryId]);

  useEffect(() => {
    load();
  }, [load]);

  const backHref = entry ? `/viaje/${entry.trip_id}?tab=diario` : '/viajes';

  const onSave = async () => {
    if (!entry || !body.trim()) return;
    setError(null);
    setSubmitting(true);

    const { error: err } = await supabase
      .from('diary_entries')
      .update({
        entry_date: entryDate.trim() || entry.entry_date,
        title: title.trim() || null,
        place_name: placeName.trim() || null,
        body: body.trim(),
      })
      .eq('id', entry.id);

    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.replace(backHref as never);
  };

  if (!entry) {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontFamily: fonts.sans, color: colors.ink55 }}>Cargando…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Editar nota</Text>

      <DateField label="Fecha" value={entryDate} onChange={setEntryDate} />

      <View style={styles.field}>
        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Un título para esta nota"
          placeholderTextColor={colors.ink38}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Ubicación</Text>
        <TextInput
          style={styles.input}
          value={placeName}
          onChangeText={setPlaceName}
          placeholder="¿Dónde ocurrió?"
          placeholderTextColor={colors.ink38}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Nota</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={body}
          onChangeText={setBody}
          placeholder="Cómo fue el día, qué recuerdas, cómo te sentiste…"
          placeholderTextColor={colors.ink38}
          multiline
        />
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, (!body.trim() || submitting) && { opacity: 0.5 }]}
        onPress={onSave}
        disabled={!body.trim() || submitting}
      >
        <Text style={styles.buttonText}>{submitting ? 'Guardando…' : 'Guardar cambios'}</Text>
      </Pressable>

      <Pressable style={styles.cancel} onPress={() => safeBack(backHref)}>
        <Text style={styles.cancelText}>Cancelar</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, paddingTop: spacing.xxl },
  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.ink, marginBottom: spacing.lg },
  field: { marginBottom: spacing.md },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.ink70, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: radii.sm,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
  },
  inputMultiline: { minHeight: 180, textAlignVertical: 'top' },
  error: { fontFamily: fonts.sansMedium, color: colors.terracotta, fontSize: 13, marginBottom: spacing.sm },
  button: {
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 15.5 },
  cancel: { marginTop: spacing.md, alignItems: 'center' },
  cancelText: { fontFamily: fonts.sansSemiBold, color: colors.ink55, fontSize: 14 },
});
