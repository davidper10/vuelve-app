import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { safeBack } from '@/lib/navigation';

export default function CrearViaje() {
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [country, setCountry] = useState('');
  const [destinationSummary, setDestinationSummary] = useState('');
  const [startDate, setStartDate] = useState(''); // YYYY-MM-DD
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onCreate = async () => {
    if (!session) return;
    setError(null);
    setSubmitting(true);

    const { data, error: err } = await supabase
      .from('trips')
      .insert({
        owner_id: session.user.id,
        title: title.trim(),
        country: country.trim() || null,
        destination_summary: destinationSummary.trim() || null,
        start_date: startDate.trim() || null,
        end_date: endDate.trim() || null,
      })
      .select()
      .single();

    setSubmitting(false);

    if (err) {
      setError(err.message);
      return;
    }
    router.replace(`/viaje/${data.id}`);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Nuevo viaje</Text>

      <Field label="Destino (ej. Japón, Roma…)" value={title} onChangeText={setTitle} placeholder="Japón" />
      <Field label="País" value={country} onChangeText={setCountry} placeholder="Japón" />
      <Field
        label="Ciudades (opcional)"
        value={destinationSummary}
        onChangeText={setDestinationSummary}
        placeholder="Tokyo · Kyoto · Osaka"
      />
      <Field label="Fecha de inicio (AAAA-MM-DD)" value={startDate} onChangeText={setStartDate} placeholder="2026-09-12" />
      <Field label="Fecha de fin (AAAA-MM-DD)" value={endDate} onChangeText={setEndDate} placeholder="2026-09-18" />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, (!title || submitting) && { opacity: 0.5 }]}
        onPress={onCreate}
        disabled={!title || submitting}
      >
        <Text style={styles.buttonText}>{submitting ? 'Creando…' : 'Crear viaje'}</Text>
      </Pressable>

      <Pressable style={styles.cancel} onPress={() => safeBack('/viajes')}>
        <Text style={styles.cancelText}>Cancelar</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.ink38}
      />
    </View>
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
