import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import NfcManager, { Ndef, NfcTech } from 'react-native-nfc-manager';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { usePremium } from '@/lib/premium-context';
import { presentPaywall } from '@/lib/paywall';
import { countOwnedNfcTags, FREE_NFC_LIMIT } from '@/lib/limits';
import { useTrips } from '@/lib/use-trips';
import { safeBack } from '@/lib/navigation';
import { EmojiPicker } from '@/components/EmojiPicker';
import type { Tables } from '@/lib/database.types';

type Moment = Tables<'moments'>;
type NfcTagRow = Tables<'nfc_tags'>;
type Step = 'checking' | 'unsupported' | 'target' | 'scan' | 'done';
type LinkType = 'trip' | 'moment';

const PUBLIC_BASE_URL = 'https://savetrip.vercel.app/m';

function randomSlug(length = 6) {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function VincularNfc() {
  const { session } = useAuth();
  const { isPremium } = usePremium();
  const { trips } = useTrips();
  const { tagId } = useLocalSearchParams<{ tagId?: string }>();
  const [step, setStep] = useState<Step>('checking');
  const [linkType, setLinkType] = useState<LinkType>('trip');
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState<string | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [momentId, setMomentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [rewriteTag, setRewriteTag] = useState<NfcTagRow | null>(null);

  // Si llegamos con ?tagId=..., estamos reescribiendo el sticker físico de
  // un NFC ya existente (mismo slug/fila en la BD) en vez de crear uno
  // nuevo: nos saltamos el paso de elegir destino y vamos directas a
  // escanear.
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
        if (cancelled) return;

        if (tagId) {
          const { data } = await supabase.from('nfc_tags').select('*').eq('id', tagId).single();
          if (cancelled) return;
          if (data) {
            setRewriteTag(data);
            setLabel(data.label);
            setStep('scan');
            return;
          }
        }
        setStep('target');
      } catch {
        // Esperado en Expo Go / web: react-native-nfc-manager necesita un
        // dev client o build nativo (npx expo run:ios | run:android, o EAS).
        if (!cancelled) setStep('unsupported');
      }
    })();
    return () => {
      cancelled = true;
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, [tagId]);

  useEffect(() => {
    if (linkType !== 'moment' || !tripId) {
      setMoments([]);
      setMomentId(null);
      return;
    }
    supabase
      .from('moments')
      .select('*')
      .eq('trip_id', tripId)
      .order('occurred_at', { ascending: true })
      .then(({ data }) => setMoments(data ?? []));
  }, [linkType, tripId]);

  const canContinue = !!label.trim() && (linkType === 'trip' ? !!tripId : !!tripId && !!momentId);

  const writeAndSave = async () => {
    if (!session) return;
    if (!rewriteTag && !canContinue) return;

    if (!rewriteTag && !isPremium) {
      const nfcCount = await countOwnedNfcTags(session.user.id);
      if (nfcCount >= FREE_NFC_LIMIT) {
        const unlocked = await presentPaywall();
        if (!unlocked) return;
      }
    }

    setError(null);
    setWriting(true);

    const slug = rewriteTag ? rewriteTag.public_slug : randomSlug();
    const url = `${PUBLIC_BASE_URL}/${slug}`;

    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const bytes = Ndef.encodeMessage([Ndef.uriRecord(url)]);
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
      const tag = await NfcManager.getTag();

      const { error: err } = rewriteTag
        ? await supabase.from('nfc_tags').update({ tag_uid: tag?.id ?? null }).eq('id', rewriteTag.id)
        : await supabase.from('nfc_tags').insert({
            owner_id: session.user.id,
            label: label.trim(),
            icon,
            tag_uid: tag?.id ?? null,
            link_type: linkType,
            trip_id: tripId,
            moment_id: linkType === 'moment' ? momentId : null,
            public_slug: slug,
            status: 'active',
          });

      if (err) throw err;

      setSavedSlug(slug);
      setStep('done');
    } catch (e) {
      setError('No se pudo escribir el NFC. Mantén el sticker quieto junto al teléfono e inténtalo de nuevo.');
    } finally {
      setWriting(false);
      NfcManager.cancelTechnologyRequest().catch(() => {});
    }
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
          Expo Go ni en web. Ejecuta{' '}
          <Text style={{ fontFamily: fonts.sansBold }}>npx expo run:ios</Text> /{' '}
          <Text style={{ fontFamily: fonts.sansBold }}>run:android</Text> (o un build de EAS) para
          probar esta pantalla en un dispositivo real con NFC.
        </Text>
        <Pressable style={styles.cancel} onPress={() => safeBack('/nfc')}>
          <Text style={styles.cancelText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (step === 'scan') {
    return (
      <View style={[styles.screen, styles.center, { paddingHorizontal: spacing.xl }]}>
        <View style={styles.nfcPulse}>
          <Ionicons name="radio-outline" size={40} color={colors.sage} />
        </View>
        <Text style={styles.title}>Acerca el sticker NFC</Text>
        <Text style={styles.body}>
          {rewriteTag
            ? `Vas a reescribir "${rewriteTag.label}" con la URL actual. Mantén el sticker junto al teléfono mientras se escribe.`
            : 'Mantén el sticker o imán junto a la parte superior del teléfono mientras se escribe.'}
        </Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={[styles.button, writing && { opacity: 0.6 }]} onPress={writeAndSave} disabled={writing}>
          <Text style={styles.buttonText}>{writing ? 'Escribiendo…' : 'Escribir NFC'}</Text>
        </Pressable>
        <Pressable style={styles.cancel} onPress={() => (rewriteTag ? safeBack('/nfc') : setStep('target'))}>
          <Text style={styles.cancelText}>{rewriteTag ? 'Cancelar' : 'Atrás'}</Text>
        </Pressable>
      </View>
    );
  }

  if (step === 'done') {
    return (
      <View style={[styles.screen, styles.center, { paddingHorizontal: spacing.xl }]}>
        <View style={styles.doneIcon}>
          <Ionicons name="checkmark" size={28} color={colors.background} />
        </View>
        <Text style={styles.title}>{rewriteTag ? 'Sticker reescrito' : 'NFC vinculado'}</Text>
        <Text style={styles.body}>
          "{label}" ya está guardado y activo.{'\n'}
          Enlace: {PUBLIC_BASE_URL}/{savedSlug}
        </Text>
        <Pressable style={styles.button} onPress={() => router.replace('/(tabs)/nfc')}>
          <Text style={styles.buttonText}>Listo</Text>
        </Pressable>
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

      <Text style={[styles.label, { marginTop: spacing.md }]}>Icono (opcional)</Text>
      <EmojiPicker value={icon} onChange={setIcon} />

      <View style={styles.typeRow}>
        <Pressable
          style={[styles.typeOption, linkType === 'trip' && styles.typeOptionOn]}
          onPress={() => setLinkType('trip')}
        >
          <Text style={[styles.typeOptionText, linkType === 'trip' && styles.typeOptionTextOn]}>Un viaje entero</Text>
        </Pressable>
        <Pressable
          style={[styles.typeOption, linkType === 'moment' && styles.typeOptionOn]}
          onPress={() => setLinkType('moment')}
        >
          <Text style={[styles.typeOptionText, linkType === 'moment' && styles.typeOptionTextOn]}>Un momento</Text>
        </Pressable>
      </View>

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

      {linkType === 'moment' && tripId && (
        <>
          <Text style={[styles.label, { marginTop: spacing.md }]}>Momento</Text>
          {moments.length === 0 ? (
            <Text style={styles.body}>Este viaje todavía no tiene momentos guardados.</Text>
          ) : (
            moments.map((m) => (
              <Pressable
                key={m.id}
                style={[styles.tripOption, momentId === m.id && styles.tripOptionOn]}
                onPress={() => setMomentId(m.id)}
              >
                <Text style={styles.tripOptionText}>{m.title}</Text>
              </Pressable>
            ))
          )}
        </>
      )}

      <Pressable
        style={[styles.button, !canContinue && { opacity: 0.5 }]}
        onPress={() => setStep('scan')}
        disabled={!canContinue}
      >
        <Text style={styles.buttonText}>Continuar</Text>
      </Pressable>

      <Pressable style={styles.cancel} onPress={() => safeBack('/nfc')}>
        <Text style={styles.cancelText}>Cancelar</Text>
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
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  typeOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: radii.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  typeOptionOn: { borderColor: colors.sage, backgroundColor: colors.sageLight },
  typeOptionText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink55 },
  typeOptionTextOn: { color: colors.sageDark },
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
  error: { fontFamily: fonts.sansMedium, color: colors.terracotta, fontSize: 13, marginBottom: spacing.md, textAlign: 'center' },
  nfcPulse: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  doneIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 15.5 },
  cancel: { marginTop: spacing.lg, alignItems: 'center' },
  cancelText: { fontFamily: fonts.sansSemiBold, color: colors.ink55, fontSize: 14 },
});
