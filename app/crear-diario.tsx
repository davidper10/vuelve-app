import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { safeBack } from '@/lib/navigation';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function CrearDiario() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { session } = useAuth();
  const [entryDate, setEntryDate] = useState(today());
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onCreate = async () => {
    if (!session || !tripId || !body.trim()) return;
    setError(null);
    setSubmitting(true);

    const { error: err } = await supabase.from('diary_entries').insert({
      trip_id: tripId,
      created_by: session.user.id,
      entry_date: entryDate.trim() || today(),
      body: body.trim(),
    });

    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.replace(`/viaje/${tripId}?tab=diario`);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Nueva nota de diario</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Fecha (AAAA-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={entryDate}
          onChangeText={setEntryDate}
          placeholder="2026-09-14"
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
        onPress={onCreate}
        disabled={!body.trim() || submitting}
      >
        <Text style={styles.buttonText}>{submitting ? 'Guardando…' : 'Guardar nota'}</Text>
      </Pressable>

      <Pressable style={styles.cancel} onPress={() => safeBack(tripId ? `/viaje/${tripId}?tab=diario` : '/viajes')}>
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
