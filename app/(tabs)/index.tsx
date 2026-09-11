import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useTrips } from '@/lib/use-trips';
import { supabase } from '@/lib/supabase';
import { notify } from '@/lib/confirm';
import { useNotifications } from '@/lib/notifications-context';
import { TripCard } from '@/components/TripCard';
import { FeaturedTripCard } from '@/components/FeaturedTripCard';
import { flagForCountry } from '@/lib/flags';

type NostalgicMoment = {
  id: string;
  title: string;
  story: string | null;
  place_name: string | null;
  occurred_at: string;
  trip_id: string;
  tripTitle: string;
  tripCountry: string | null;
  yearsAgo: number;
  photoUrl: string | null;
};

export default function Home() {
  const { session } = useAuth();
  const { trips, loading, error } = useTrips();
  const { refresh: refreshNotifications } = useNotifications();
  const firstName = (session?.user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'viajero';

  const [momentCounts, setMomentCounts] = useState<Record<string, number>>({});
  const [nostalgia, setNostalgia] = useState<NostalgicMoment | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshNotifications().catch(() => {});
    }, [refreshNotifications])
  );

  const [featured, ...rest] = trips;
  const gridTrips = rest.slice(0, 4);

  useEffect(() => {
    const relevantIds = [featured, ...gridTrips].filter(Boolean).map((t) => t!.id);
    if (relevantIds.length === 0) {
      setMomentCounts({});
      return;
    }
    supabase
      .from('moments')
      .select('trip_id')
      .in('trip_id', relevantIds)
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        for (const row of data ?? []) {
          counts[row.trip_id] = (counts[row.trip_id] ?? 0) + 1;
        }
        setMomentCounts(counts);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips]);

  useEffect(() => {
    (async () => {
      const { data: moments } = await supabase
        .from('moments')
        .select('id, title, story, place_name, occurred_at, trip_id')
        .not('occurred_at', 'is', null)
        .order('occurred_at', { ascending: false })
        .limit(500);

      const now = new Date();
      const match = (moments ?? []).find((m) => {
        const d = new Date(m.occurred_at as string);
        return (
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate() &&
          d.getFullYear() < now.getFullYear()
        );
      });

      if (!match) {
        setNostalgia(null);
        return;
      }

      const [{ data: trip }, { data: links }] = await Promise.all([
        supabase.from('trips').select('title, country').eq('id', match.trip_id).single(),
        supabase.from('moment_memories').select('memories(storage_path, type)').eq('moment_id', match.id),
      ]);

      const photoMemory = (links ?? [])
        .map((l) => l.memories as { storage_path: string; type: string } | null)
        .find((m) => m?.type === 'photo');
      const path = photoMemory?.storage_path;

      setNostalgia({
        id: match.id,
        title: match.title,
        story: match.story,
        place_name: match.place_name,
        occurred_at: match.occurred_at as string,
        trip_id: match.trip_id,
        tripTitle: trip?.title ?? '',
        tripCountry: trip?.country ?? null,
        yearsAgo: now.getFullYear() - new Date(match.occurred_at as string).getFullYear(),
        photoUrl: path ? supabase.storage.from('memories').getPublicUrl(path).data.publicUrl : null,
      });
    })();
  }, []);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Bitácora Personal</Text>
            <Text style={styles.greeting}>Buenos días, {firstName} 👋</Text>
            <Text style={styles.question}>¿A dónde quieres volver hoy?</Text>
          </View>
          <Pressable
            style={styles.bellBtn}
            onPress={() => notify('Notificaciones', 'No hay notificaciones nuevas.')}
          >
            <Ionicons name="notifications-outline" size={17} color={colors.ink} />
          </Pressable>
        </View>

        {error && <Text style={styles.error}>No se pudieron cargar tus viajes: {error}</Text>}

        {!loading && !error && trips.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Todavía no tienes viajes</Text>
            <Text style={styles.emptyBody}>
              Crea el primero y empieza tu colección de recuerdos.
            </Text>
            <Pressable style={styles.emptyButton} onPress={() => router.push('/crear-viaje')}>
              <Text style={styles.emptyButtonText}>+ Nuevo viaje</Text>
            </Pressable>
          </View>
        )}

        {featured && (
          <FeaturedTripCard trip={featured} momentsCount={momentCounts[featured.id] ?? 0} />
        )}

        {nostalgia && (
          <View style={styles.nostalgiaSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recuerdos para volver a vivir</Text>
              <Text style={styles.nostalgiaTag}>Nostalgia ✨</Text>
            </View>
            <Pressable
              style={styles.nostalgiaCard}
              onPress={() => router.push(`/momento/${nostalgia.id}`)}
            >
              {nostalgia.photoUrl ? (
                <Image source={{ uri: nostalgia.photoUrl }} style={styles.nostalgiaThumb} />
              ) : (
                <View style={styles.nostalgiaThumb} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.nostalgiaEyebrow}>
                  Hace {nostalgia.yearsAgo} {nostalgia.yearsAgo === 1 ? 'año' : 'años'} hoy
                  {!!nostalgia.tripCountry &&
                    ` · ${flagForCountry(nostalgia.tripCountry) ? `${flagForCountry(nostalgia.tripCountry)} ` : ''}${nostalgia.tripCountry}`}
                </Text>
                <Text style={styles.nostalgiaTitle} numberOfLines={1}>
                  {nostalgia.title}
                </Text>
                {!!nostalgia.story && (
                  <Text style={styles.nostalgiaStory} numberOfLines={2}>
                    "{nostalgia.story}"
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.terracotta} />
            </Pressable>
          </View>
        )}

        {gridTrips.length > 0 && (
          <View style={{ gap: spacing.sm }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Tus viajes</Text>
              <Pressable onPress={() => router.push('/viajes')}>
                <Text style={styles.seeAll}>Ver todos ({trips.length})</Text>
              </Pressable>
            </View>
            <View style={styles.grid}>
              {gridTrips.map((t) => (
                <View key={t.id} style={styles.gridItem}>
                  <TripCard trip={t} size="grid" momentsCount={momentCounts[t.id]} />
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footerBanner}>
          <View style={styles.footerIconWrap}>
            <Ionicons name="map-outline" size={19} color={colors.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.footerTitle}>Cada viaje cuenta una historia</Text>
            <Text style={styles.footerBody}>
              Sigue explorando, recordando y guardando lo que hace especiales tus viajes.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingTop: 60, paddingBottom: 120, gap: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  eyebrow: {
    fontFamily: fonts.sansBold,
    fontSize: 11.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.sage,
  },
  greeting: { fontFamily: fonts.sansBold, fontSize: 21, color: colors.ink, marginTop: 4 },
  question: { fontFamily: fonts.serifItalic, fontStyle: 'italic', fontSize: 18, color: colors.ink55, marginTop: 2 },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink },
  seeAll: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.sage },
  error: { fontFamily: fonts.sansMedium, color: colors.terracotta, fontSize: 13 },
  empty: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.ink },
  emptyBody: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink55, textAlign: 'center' },
  emptyButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
  },
  emptyButtonText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 14 },
  nostalgiaSection: { gap: spacing.sm },
  nostalgiaTag: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.terracotta },
  nostalgiaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.terracottaLight,
    borderWidth: 1,
    borderColor: 'rgba(200,117,84,0.2)',
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  nostalgiaThumb: { width: 68, height: 68, borderRadius: radii.md, backgroundColor: colors.sandDark },
  nostalgiaEyebrow: {
    fontFamily: fonts.sansBold,
    fontSize: 10.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.terracotta,
  },
  nostalgiaTitle: { fontFamily: fonts.sansBold, fontSize: 14.5, color: colors.ink, marginTop: 3 },
  nostalgiaStory: {
    fontFamily: fonts.serifItalic,
    fontStyle: 'italic',
    fontSize: 12.5,
    color: colors.ink55,
    marginTop: 3,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridItem: { width: '48%' },
  footerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.sageLight,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  footerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerTitle: { fontFamily: fonts.sansBold, fontSize: 14.5, color: colors.ink },
  footerBody: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink55, marginTop: 3, lineHeight: 17 },
});
