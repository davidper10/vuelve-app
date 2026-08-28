import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, gradientFor, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { safeBack } from '@/lib/navigation';
import { MomentsTimeline } from '@/components/MomentsTimeline';
import type { Tables } from '@/lib/database.types';

type Trip = Tables<'trips'>;
type Moment = Tables<'moments'>;
type DiaryEntry = Tables<'diary_entries'> & { profiles: { full_name: string | null } | null };
type NfcTag = Tables<'nfc_tags'>;

type Tab = 'recuerdos' | 'mapa' | 'diario' | 'nfc';

export default function ViajeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [nfcTags, setNfcTags] = useState<NfcTag[]>([]);
  const [momentPhotos, setMomentPhotos] = useState<Record<string, string>>({});
  const [memoriesCount, setMemoriesCount] = useState(0);
  const [tab, setTab] = useState<Tab>('recuerdos');

  const load = useCallback(async () => {
    if (!id) return;
    const [tripRes, momentsRes, diaryRes, nfcRes, memoriesRes] = await Promise.all([
      supabase.from('trips').select('*').eq('id', id).single(),
      supabase.from('moments').select('*').eq('trip_id', id).order('occurred_at', { ascending: true }),
      supabase
        .from('diary_entries')
        .select('*, profiles(full_name)')
        .eq('trip_id', id)
        .order('entry_date', { ascending: true }),
      supabase.from('nfc_tags').select('*').eq('trip_id', id),
      supabase.from('memories').select('id', { count: 'exact', head: true }).eq('trip_id', id),
    ]);
    setTrip(tripRes.data ?? null);
    setMoments(momentsRes.data ?? []);
    setDiary((diaryRes.data as DiaryEntry[]) ?? []);
    setNfcTags(nfcRes.data ?? []);
    setMemoriesCount(memoriesRes.count ?? 0);

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
  const placesCount = new Set(moments.map((m) => m.place_name).filter(Boolean)).size;

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
              onPress={() => Alert.alert('Compartir', 'La opción de compartir viajes llegará pronto.')}
            >
              <Ionicons name="share-social-outline" size={16} color="#FBF3EE" />
            </Pressable>
            <Pressable
              style={styles.roundBtn}
              onPress={() => router.push(`/editar-viaje?tripId=${trip.id}`)}
            >
              <Ionicons name="pencil" size={16} color="#FBF3EE" />
            </Pressable>
          </View>
          <LinearGradient
            colors={['transparent', 'rgba(10,6,7,0.15)', 'rgba(10,6,7,0.9)']}
            locations={[0, 0.4, 1]}
            style={styles.heroShade}
          />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{trip.title}</Text>
            {!!trip.destination_summary && <Text style={styles.heroSub}>{trip.destination_summary}</Text>}
            <View style={styles.heroStats}>
              <Text style={styles.heroStatText}>
                <Text style={styles.heroStatNumber}>{memoriesCount}</Text> fotos
              </Text>
              <Text style={styles.heroStatDot}>•</Text>
              <Text style={styles.heroStatText}>
                <Text style={styles.heroStatNumber}>{placesCount}</Text> lugares
              </Text>
            </View>
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
          {tab === 'recuerdos' &&
            (moments.length === 0 ? (
              <Text style={styles.emptyText}>Todavía no hay momentos guardados en este viaje.</Text>
            ) : (
              <MomentsTimeline
                moments={moments}
                photos={momentPhotos}
                onPressMoment={(momentId) => router.push(`/momento/${momentId}`)}
              />
            ))}

          {tab === 'mapa' && (
            <View style={styles.mapInfoCard}>
              <Text style={styles.mapInfoText}>
                {moments.filter((m) => m.lat && m.lng).length} lugares registrados
                {!!trip.country && ` en ${trip.country}`}
              </Text>
              <View style={styles.mapInfoBadge}>
                <Text style={styles.mapInfoBadgeText}>📍 {placesCount} lugares</Text>
              </View>
            </View>
          )}

          {tab === 'diario' &&
            (diary.length === 0 ? (
              <Text style={styles.emptyText}>Todavía no hay entradas de diario.</Text>
            ) : (
              diary.map((d, i) => (
                <View key={d.id} style={styles.diaryEntry}>
                  <Text style={styles.diaryEyebrow}>Nota de viaje #{i + 1}</Text>
                  <Text style={styles.diaryText}>{d.body}</Text>
                  <View style={styles.diaryFooter}>
                    <Text style={styles.diaryFooterText}>
                      {d.profiles?.full_name ? `Escrito por ${d.profiles.full_name}` : ' '}
                    </Text>
                    <Text style={styles.diaryFooterText}>
                      {new Date(d.entry_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
              ))
            ))}

          {tab === 'nfc' && (
            <>
              {nfcTags.length > 0 && (
                <View style={styles.nfcExplainer}>
                  <View style={styles.nfcExplainerTitleRow}>
                    <Ionicons name="radio" size={13} color={colors.sageDark} />
                    <Text style={styles.nfcExplainerTitle}>NFC vinculado a este viaje</Text>
                  </View>
                  <Text style={styles.nfcExplainerBody}>
                    Cualquier persona que acerque su móvil al objeto físico accederá a este viaje.
                  </Text>
                </View>
              )}

              {nfcTags.length === 0 ? (
                <Text style={styles.emptyText}>Este viaje no tiene ningún NFC vinculado todavía.</Text>
              ) : (
                nfcTags.map((n) => (
                  <View key={n.id} style={styles.nfcCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.momentTitle}>{n.label}</Text>
                      <Text style={styles.momentSub}>ID: {n.tag_uid ?? n.public_slug}</Text>
                    </View>
                    <View
                      style={[styles.statusPill, n.status === 'active' ? styles.statusPillActive : styles.statusPillInactive]}
                    >
                      <Text
                        style={[styles.statusText, n.status === 'active' ? styles.statusTextActive : styles.statusTextInactive]}
                      >
                        {n.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>

      {tab === 'recuerdos' && (
        <Pressable style={styles.fab} onPress={() => router.push(`/crear-recuerdo?tripId=${trip.id}`)}>
          <Ionicons name="add" size={26} color={colors.background} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { height: 300, position: 'relative', overflow: 'hidden', backgroundColor: colors.sandDark },
  heroNav: { position: 'absolute', top: 54, left: 16, zIndex: 2 },
  heroNavRight: { position: 'absolute', top: 54, right: 16, zIndex: 2, flexDirection: 'row', gap: 8 },
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
  },
  heroContent: { position: 'absolute', left: 22, right: 22, bottom: 20 },
  heroTitle: { fontFamily: fonts.serif, fontSize: 40, color: '#FBF3EE' },
  heroSub: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: '#FBF3EE', opacity: 0.85, marginTop: 4 },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  heroStatText: { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  heroStatNumber: { fontFamily: fonts.sansBold, color: '#FBF3EE' },
  heroStatDot: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  subnav: { flexDirection: 'row', paddingHorizontal: spacing.md, borderBottomWidth: 1, borderColor: colors.line },
  navtab: { flex: 1, alignItems: 'center', paddingVertical: 13 },
  navtabText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.ink38 },
  navtabTextActive: { color: colors.ink },
  navtabUnderline: { height: 2, width: '60%', backgroundColor: colors.sage, marginTop: 8, borderRadius: 2 },
  panel: { padding: spacing.lg, paddingBottom: 80, gap: spacing.md },
  emptyText: { fontFamily: fonts.sans, color: colors.ink55, fontSize: 14, lineHeight: 20 },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  momentTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  momentSub: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.ink55, marginTop: 2 },
  mapInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  mapInfoText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.ink55, flex: 1 },
  mapInfoBadge: { backgroundColor: colors.sageLight, borderRadius: radii.pill, paddingVertical: 5, paddingHorizontal: 10 },
  mapInfoBadgeText: { fontFamily: fonts.sansBold, fontSize: 11.5, color: colors.sageDark },
  diaryEntry: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 8,
  },
  diaryEyebrow: {
    fontFamily: fonts.sansBold,
    fontSize: 10.5,
    color: colors.sage,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  diaryText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.ink70, lineHeight: 20 },
  diaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  diaryFooterText: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink38 },
  nfcExplainer: { backgroundColor: colors.sageLight, borderRadius: radii.lg, padding: spacing.md, gap: 6 },
  nfcExplainerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nfcExplainerTitle: { fontFamily: fonts.sansBold, fontSize: 12.5, color: colors.sageDark },
  nfcExplainerBody: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.ink70, lineHeight: 16 },
  nfcCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  statusPill: { borderRadius: radii.pill, paddingVertical: 4, paddingHorizontal: 10 },
  statusPillActive: { backgroundColor: '#DCF3E3' },
  statusPillInactive: { backgroundColor: colors.sand },
  statusText: { fontFamily: fonts.sansBold, fontSize: 10.5 },
  statusTextActive: { color: '#1E7A45' },
  statusTextInactive: { color: colors.ink55 },
});
