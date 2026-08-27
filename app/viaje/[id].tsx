import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, gradientFor, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { safeBack } from '@/lib/navigation';
import type { Tables } from '@/lib/database.types';

type Trip = Tables<'trips'>;
type Moment = Tables<'moments'>;
type DiaryEntry = Tables<'diary_entries'>;
type NfcTag = Tables<'nfc_tags'>;

type Tab = 'recuerdos' | 'mapa' | 'diario' | 'nfc';

export default function ViajeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [nfcTags, setNfcTags] = useState<NfcTag[]>([]);
  const [momentPhotos, setMomentPhotos] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<Tab>('recuerdos');

  const load = useCallback(async () => {
    if (!id) return;
    const [tripRes, momentsRes, diaryRes, nfcRes] = await Promise.all([
      supabase.from('trips').select('*').eq('id', id).single(),
      supabase.from('moments').select('*').eq('trip_id', id).order('occurred_at', { ascending: true }),
      supabase.from('diary_entries').select('*').eq('trip_id', id).order('entry_date', { ascending: true }),
      supabase.from('nfc_tags').select('*').eq('trip_id', id),
    ]);
    setTrip(tripRes.data ?? null);
    setMoments(momentsRes.data ?? []);
    setDiary(diaryRes.data ?? []);
    setNfcTags(nfcRes.data ?? []);

    const momentIds = (momentsRes.data ?? []).map((m) => m.id);
    if (momentIds.length > 0) {
      const { data: links } = await supabase
        .from('moment_memories')
        .select('moment_id, memories(storage_path)')
        .in('moment_id', momentIds);
      const photos: Record<string, string> = {};
      for (const link of links ?? []) {
        const path = (link.memories as { storage_path: string } | null)?.storage_path;
        if (path && !photos[link.moment_id]) {
          photos[link.moment_id] = supabase.storage.from('memories').getPublicUrl(path).data.publicUrl;
        }
      }
      setMomentPhotos(photos);
    } else {
      setMomentPhotos({});
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!trip) {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontFamily: fonts.sans, color: colors.ink55 }}>Cargando viaje…</Text>
      </View>
    );
  }

  const gradient = gradientFor(trip.title);

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        {trip.cover_photo_url ? (
          <Image source={{ uri: trip.cover_photo_url }} style={StyleSheet.absoluteFill} />
        ) : (
          <LinearGradient
            colors={gradient}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.heroNav}>
          <Pressable style={styles.roundBtn} onPress={() => safeBack('/viajes')}>
            <Ionicons name="chevron-back" size={18} color="#FBF3EE" />
          </Pressable>
        </View>
        <View style={styles.heroNavRight}>
          <Pressable
            style={styles.roundBtn}
            onPress={() => router.push(`/editar-viaje?tripId=${trip.id}`)}
          >
            <Ionicons name="pencil" size={16} color="#FBF3EE" />
          </Pressable>
        </View>
        <View style={styles.heroShade} />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>{trip.title}</Text>
          {!!trip.destination_summary && <Text style={styles.heroSub}>{trip.destination_summary}</Text>}
        </View>
      </View>

      <View style={styles.subnav}>
        {(
          [
            ['recuerdos', 'Recuerdos'],
            ['mapa', 'Mapa'],
            ['diario', 'Diario'],
            ['nfc', 'NFC'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <Pressable key={key} style={styles.navtab} onPress={() => setTab(key)}>
            <Text style={[styles.navtabText, tab === key && styles.navtabTextActive]}>{label}</Text>
            {tab === key && <View style={styles.navtabUnderline} />}
          </Pressable>
        ))}
      </View>

      <View style={styles.panel}>
        {tab === 'recuerdos' && (
          <>
            <Pressable
              style={styles.addMomentBtn}
              onPress={() => router.push(`/crear-recuerdo?tripId=${trip.id}`)}
            >
              <Ionicons name="add" size={18} color={colors.background} />
              <Text style={styles.addMomentBtnText}>Nuevo recuerdo</Text>
            </Pressable>

            {moments.length === 0 ? (
              <Text style={styles.emptyText}>Todavía no hay momentos guardados en este viaje.</Text>
            ) : (
              moments.map((m) => (
                <Pressable key={m.id} style={styles.momentCard} onPress={() => router.push(`/momento/${m.id}`)}>
                  {momentPhotos[m.id] ? (
                    <Image source={{ uri: momentPhotos[m.id] }} style={styles.momentThumb} />
                  ) : (
                    <View style={styles.momentThumb} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.momentTitle}>{m.title}</Text>
                    {!!m.place_name && <Text style={styles.momentSub}>{m.place_name}</Text>}
                  </View>
                </Pressable>
              ))
            )}
          </>
        )}

        {tab === 'mapa' &&
          (moments.filter((m) => m.lat && m.lng).length === 0 ? (
            <Text style={styles.emptyText}>
              Añade ubicación a tus momentos para verlos aquí en el mapa.
            </Text>
          ) : (
            <Text style={styles.emptyText}>
              {moments.filter((m) => m.lat && m.lng).length} lugares con ubicación guardada.{'\n'}
              (Integra react-native-maps o expo-maps aquí para el mapa interactivo.)
            </Text>
          ))}

        {tab === 'diario' &&
          (diary.length === 0 ? (
            <Text style={styles.emptyText}>Todavía no hay entradas de diario.</Text>
          ) : (
            diary.map((d) => (
              <View key={d.id} style={styles.diaryEntry}>
                <Text style={styles.diaryDate}>
                  {new Date(d.entry_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                </Text>
                <Text style={styles.diaryText}>{d.body}</Text>
              </View>
            ))
          ))}

        {tab === 'nfc' &&
          (nfcTags.length === 0 ? (
            <Text style={styles.emptyText}>Este viaje no tiene ningún NFC vinculado todavía.</Text>
          ) : (
            nfcTags.map((n) => (
              <View key={n.id} style={styles.nfcCard}>
                <Text style={styles.momentTitle}>{n.label}</Text>
                <Text style={styles.momentSub}>{n.status === 'active' ? 'Vinculado y activo' : 'Inactivo'}</Text>
              </View>
            ))
          ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { height: 300, position: 'relative', overflow: 'hidden', backgroundColor: colors.sandDark },
  heroNav: { position: 'absolute', top: 54, left: 16, zIndex: 2 },
  heroNavRight: { position: 'absolute', top: 54, right: 16, zIndex: 2 },
  roundBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(20,12,14,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20,12,14,0.35)',
  },
  heroContent: { position: 'absolute', left: 22, right: 22, bottom: 20 },
  heroTitle: { fontFamily: fonts.serif, fontSize: 40, color: '#FBF3EE' },
  heroSub: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: '#FBF3EE', opacity: 0.85, marginTop: 4 },
  subnav: { flexDirection: 'row', paddingHorizontal: spacing.md, borderBottomWidth: 1, borderColor: colors.line },
  navtab: { flex: 1, alignItems: 'center', paddingVertical: 13 },
  navtabText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.ink38 },
  navtabTextActive: { color: colors.ink },
  navtabUnderline: { height: 2, width: '60%', backgroundColor: colors.sage, marginTop: 8, borderRadius: 2 },
  panel: { padding: spacing.lg, paddingBottom: 80, gap: spacing.md },
  emptyText: { fontFamily: fonts.sans, color: colors.ink55, fontSize: 14, lineHeight: 20 },
  addMomentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingVertical: 12,
    marginBottom: spacing.xs,
  },
  addMomentBtnText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 14 },
  momentCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.sand,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  momentThumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.sandDark },
  momentTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  momentSub: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.ink55, marginTop: 2 },
  diaryEntry: { borderBottomWidth: 1, borderColor: colors.line, paddingBottom: spacing.md },
  diaryDate: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    color: colors.sage,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  diaryText: { fontFamily: fonts.serifItalic, fontStyle: 'italic', fontSize: 18, color: colors.ink, lineHeight: 24 },
  nfcCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radii.md, padding: spacing.md },
});
