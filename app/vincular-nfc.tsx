import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useTrips } from '@/lib/use-trips';

type Step = 'checking' | 'unsupported' | 'scan' | 'found' | 'save';

function randomSlug(length = 6) {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function VincularNfc() {
  const { session } = useAuth();
  const { trips } = useTrips();
  const [step, setStep] = useState<Step>('checking');
  const [tagUid, setTagUid] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [tripId, setTripId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supported = await NfcManager.isSupported();
        if (!supported) {
          if (!cancelled) setStep('unsupported');
          return;
        }
        await NfcManager.start();
        if (!cancelled) setStep('scan');
      } catch {
        // Esperado en Expo Go: react-native-nfc-manager requiere un dev
        // client / build nativo (npx expo run:ios | run:android, o EAS Build).
        if (!cancelled) setStep('unsupported');
      }
    })();

    return () => {
      cancelled = true;
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  const startScan = async () => {
    setError(null);
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();
      const uid = tag?.id ?? randomSlug(8);
      setTagUid(uid);
      setStep('found');
      setTimeout(() => setStep('save'), 700);
    } catch (e) {
      setError('No se pudo leer el NFC. Inténtalo de nuevo.');
    } finally {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  };

  const onSave = async () => {
    if (!session) return;
    setSaving(true);
    setError(null);

    const { error: err } = await supabase.from('nfc_tags').insert({
      owner_id: session.user.id,
      label: label.trim() || 'NFC sin nombre',
      tag_uid: tagUid,
      link_type: 'trip',
      trip_id: tripId,
      public_slug: randomSlug(),
      status: 'active',
    });

    setSaving(false);

    if (err) {
      setError(err.message);
      return;
    }
    router.replace('/(tabs)/nfc');
  };

  if (step === 'checking') {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={colors.sage} />
      </View>
    );
  }

  if (step === 'unsupported') {
    return (
      <View style={[styles.screen, styles.center, { paddingHorizontal: spacing.xl }]}>
        <Text style={styles.title}>NFC no disponible aquí</Text>
        <Text style={styles.body}>
          react-native-nfc-manager necesita un dev client o un build nativo — no funciona dentro de
          Expo Go. Ejecuta{' '}
          <Text style={{ fontFamily: fonts.sansBold }}>npx expo run:ios</Text> /{' '}
          <Text style={{ fontFamily: fonts.sansBold }}>run:android</Text> (o un build de EAS) para
          probar esta pantalla en un dispositivo real con NFC.
        </Text>
        <Pressable style={styles.cancel} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (step === 'scan' || step === 'found') {
    return (
      <View style={[styles.screen, styles.center, { paddingHorizontal: spacing.xl }]}>
        <Text style={styles.title}>
          {step === 'found' ? 'NFC encontrado' : 'Acerca el sticker NFC a tu teléfono'}
        </Text>
        {step === 'scan' && (
          <>
            <Text style={styles.body}>Mantén el sticker cerca de la parte superior del dispositivo.</Text>
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Pressable style={styles.button} onPress={startScan}>
              <Text style={styles.buttonText}>Empezar a escanear</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>¿Qué quieres guardar aquí?</Text>

      <Text style={styles.label}>Nombre para este NFC</Text>
      <TextInput
        style={styles.input}
        value={label}
        onChangeText={setLabel}
        placeholder="Imán Japón"
        placeholderTextColor={colors.ink38}
      />

      <Text style={[styles.label, { marginTop: spacing.md }]}>Viaje</Text>
      {trips.length === 0 ? (
        <Text style={styles.body}>Todavía no tienes viajes creados.</Text>
      ) : (
        trips.map((t) => (
          <Pressable
            key={t.id}
            style={[styles.tripOption, tripId === t.id && styles.tripOptionOn]}
            onPress={() => setTripId(t.id)}
          >
            <Text style={styles.tripOptionText}>{t.title}</Text>
          </Pressable>
        ))
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, (!label || !tripId || saving) && { opacity: 0.5 }]}
        onPress={onSave}
        disabled={!label || !tripId || saving}
      >
        <Text style={styles.buttonText}>{saving ? 'Guardando…' : 'Guardar'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, paddingTop: spacing.xxl },
  center: { alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.ink, textAlign: 'center', marginBottom: spacing.sm },
  body: { fontFamily: fonts.sans, fontSize: 14.5, color: colors.ink55, textAlign: 'center', lineHeight: 21, marginBottom: spacing.lg },
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
  tripOption: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  tripOptionOn: { borderColor: colors.sage, backgroundColor: colors.sand },
  tripOptionText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  error: { fontFamily: fonts.sansMedium, color: colors.terracotta, fontSize: 13, marginTop: spacing.md },
  button: {
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 15.5 },
  cancel: { marginTop: spacing.lg },
  cancelText: { fontFamily: fonts.sansSemiBold, color: colors.ink55, fontSize: 14 },
});
