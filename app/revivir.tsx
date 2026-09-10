import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { safeBack } from '@/lib/navigation';
import type { Tables } from '@/lib/database.types';

type Moment = Tables<'moments'>;
type DiaryEntry = Tables<'diary_entries'>;

type Slide =
  | { kind: 'moment'; date: string; moment: Moment; photoUrl: string | null }
  | { kind: 'diary'; date: string; entry: DiaryEntry };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Revivir() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const [tripTitle, setTripTitle] = useState('');
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!tripId) return;
    (async () => {
      const [{ data: trip }, { data: moments }, { data: diary }] = await Promise.all([
        supabase.from('trips').select('title').eq('id', tripId).single(),
        supabase.from('moments').select('*').eq('trip_id', tripId).order('occurred_at', { ascending: true }),
        supabase.from('diary_entries').select('*').eq('trip_id', tripId).order('entry_date', { ascending: true }),
      ]);

      setTripTitle(trip?.title ?? '');

      const momentIds = (moments ?? []).map((m) => m.id);
      const photoByMoment: Record<string, string> = {};
      if (momentIds.length > 0) {
        const { data: links } = await supabase
          .from('moment_memories')
          .select('moment_id, memories(storage_path, created_at)')
          .in('moment_id', momentIds)
          .order('created_at', { referencedTable: 'memories', ascending: true });
        for (const link of links ?? []) {
          const path = (link.memories as { storage_path: string } | null)?.storage_path;
          if (path && !photoByMoment[link.moment_id]) {
            photoByMoment[link.moment_id] = supabase.storage.from('memories').getPublicUrl(path).data.publicUrl;
          }
        }
      }

      const momentSlides: Slide[] = (moments ?? []).map((m) => ({
        kind: 'moment',
        date: m.occurred_at ?? m.created_at,
        moment: m,
        photoUrl: photoByMoment[m.id] ?? null,
      }));
      const diarySlides: Slide[] = (diary ?? []).map((d) => ({
        kind: 'diary',
        date: d.entry_date,
        entry: d,
      }));

      const all = [...momentSlides, ...diarySlides].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setSlides(all);
    })();
  }, [tripId]);

  const close = () => safeBack(tripId ? `/viaje/${tripId}` : '/viajes');

  const next = () => {
    if (!slides) return;
    if (index >= slides.length - 1) {
      close();
      return;
    }
    setIndex((i) => i + 1);
  };

  const prev = () => setIndex((i) => Math.max(i - 1, 0));

  if (!slides) {
    return <View style={[styles.screen, styles.center]} />;
  }

  if (slides.length === 0) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.emptyText}>Este viaje todavía no tiene recuerdos ni notas que revivir.</Text>
        <Pressable style={styles.emptyClose} onPress={close}>
          <Text style={styles.emptyCloseText}>Cerrar</Text>
        </Pressable>
      </View>
    );
  }

  const slide = slides[index];

  return (
    <View style={styles.screen}>
      {slide.kind === 'moment' ? <MomentSlide slide={slide} /> : <DiarySlide slide={slide} />}

      <View style={styles.progressRow}>
        {slides.map((_, i) => (
          <View key={i} style={styles.progressTrack}>
            <View style={[styles.progressFill, i <= index && styles.progressFillActive]} />
          </View>
        ))}
      </View>

      <View style={styles.topBar}>
        <Text style={styles.tripTitle} numberOfLines={1}>
          {tripTitle}
        </Text>
        <Pressable style={styles.closeBtn} onPress={close}>
          <Ionicons name="close" size={20} color="#FBF3EE" />
        </Pressable>
      </View>

      <View style={styles.tapZones} pointerEvents="box-none">
        <Pressable style={styles.tapLeft} onPress={prev} />
        <Pressable style={styles.tapRight} onPress={next} />
      </View>
    </View>
  );
}

function MomentSlide({ slide }: { slide: Slide & { kind: 'moment' } }) {
  const { moment, photoUrl, date } = slide;
  return (
    <View style={StyleSheet.absoluteFill}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sandDark }]} />
      )}
      <LinearGradient
        colors={['rgba(10,6,7,0.35)', 'transparent', 'rgba(10,6,7,0.85)']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.slideContent}>
        <Text style={styles.slideDate}>{formatDate(date)}</Text>
        <Text style={styles.slideTitle}>{moment.title}</Text>
        {!!moment.place_name && (
          <View style={styles.slidePlaceRow}>
            <Ionicons name="location" size={13} color="#FBF3EE" />
            <Text style={styles.slidePlaceText}>{moment.place_name}</Text>
          </View>
        )}
        {!!moment.story && (
          <Text style={styles.slideStory} numberOfLines={4}>
            {moment.story}
          </Text>
        )}
      </View>
    </View>
  );
}

function DiarySlide({ slide }: { slide: Slide & { kind: 'diary' } }) {
  const { entry, date } = slide;
  return (
    <View style={[StyleSheet.absoluteFill, styles.diarySlide]}>
      <Image
        source={require('../assets/mascota/saludo.png')}
        style={styles.diaryMascot}
        resizeMode="contain"
      />
      <Text style={styles.diaryEyebrow}>Nota de viaje</Text>
      <Text style={styles.diaryDate}>{formatDate(date)}</Text>
      {!!entry.title && <Text style={styles.diaryTitle}>{entry.title}</Text>}
      {!!entry.place_name && (
        <View style={styles.slidePlaceRow}>
          <Ionicons name="location" size={13} color={colors.sage} />
          <Text style={[styles.slidePlaceText, { color: colors.sageDark }]}>{entry.place_name}</Text>
        </View>
      )}
      <Text style={styles.diaryBody} numberOfLines={8}>
        {entry.body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  emptyText: { fontFamily: fonts.sans, fontSize: 14, color: colors.background, textAlign: 'center', lineHeight: 20 },
  emptyClose: {
    backgroundColor: colors.background,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyCloseText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  progressRow: { position: 'absolute', top: 54, left: 12, right: 12, flexDirection: 'row', gap: 4, zIndex: 3 },
  progressTrack: { flex: 1, height: 2.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  progressFill: { flex: 1, backgroundColor: 'transparent' },
  progressFillActive: { backgroundColor: '#FBF3EE' },
  topBar: {
    position: 'absolute',
    top: 68,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  tripTitle: { fontFamily: fonts.sansBold, fontSize: 13, color: '#FBF3EE', flex: 1, marginRight: spacing.sm },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(20,12,14,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapZones: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', zIndex: 2 },
  tapLeft: { flex: 4 },
  tapRight: { flex: 6 },
  slideContent: { position: 'absolute', left: 22, right: 22, bottom: 60 },
  slideDate: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  slideTitle: { fontFamily: fonts.serif, fontSize: 32, color: '#FBF3EE' },
  slidePlaceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  slidePlaceText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: '#FBF3EE' },
  slideStory: {
    fontFamily: fonts.serifItalic,
    fontStyle: 'italic',
    fontSize: 15.5,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.92)',
    marginTop: 12,
  },
  diarySlide: {
    backgroundColor: colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  diaryMascot: { width: 90, height: 90, marginBottom: spacing.md },
  diaryEyebrow: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.sage,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  diaryDate: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.ink55, marginTop: 4 },
  diaryTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.ink, textAlign: 'center', marginTop: 10 },
  diaryBody: {
    fontFamily: fonts.serifItalic,
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 23,
    color: colors.ink70,
    textAlign: 'center',
    marginTop: 14,
  },
});
