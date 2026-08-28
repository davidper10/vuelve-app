import { useCallback, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { safeBack } from '@/lib/navigation';
import type { Tables } from '@/lib/database.types';

type Moment = Tables<'moments'>;

export default function MomentoDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [moment, setMoment] = useState<Moment | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    const [{ data }, { data: links }] = await Promise.all([
      supabase.from('moments').select('*').eq('id', id).single(),
      supabase
        .from('moment_memories')
        .select('memories(storage_path, created_at)')
        .eq('moment_id', id)
        .order('created_at', { referencedTable: 'memories', ascending: true }),
    ]);
    setMoment(data);
    const urls = (links ?? [])
      .map((l) => (l.memories as { storage_path: string } | null)?.storage_path)
      .filter((p): p is string => !!p)
      .map((path) => supabase.storage.from('memories').getPublicUrl(path).data.publicUrl);
    setPhotoUrls(urls);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggleFavorite = async () => {
    if (!moment) return;
    const next = !moment.is_favorite;
    setMoment({ ...moment, is_favorite: next });
    await supabase.from('moments').update({ is_favorite: next }).eq('id', moment.id);
  };

  if (!moment) {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontFamily: fonts.sans, color: colors.ink55 }}>Cargando…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.collage}>
        <View style={styles.topLeft}>
          <Pressable
            style={styles.roundBtn}
            onPress={() => safeBack(moment.trip_id ? `/viaje/${moment.trip_id}` : '/viajes')}
          >
            <Ionicons name="chevron-back" size={18} color="#FBF3EE" />
          </Pressable>
        </View>
        <View style={styles.topRight}>
          <Pressable style={styles.roundBtn} onPress={toggleFavorite}>
            <Ionicons name={moment.is_favorite ? 'heart' : 'heart-outline'} size={18} color="#FBF3EE" />
          </Pressable>
          <Pressable style={styles.roundBtn} onPress={() => router.push(`/editar-recuerdo?momentId=${moment.id}`)}>
            <Ionicons name="pencil" size={16} color="#FBF3EE" />
          </Pressable>
        </View>
        {photoUrls[0] ? (
          <Image source={{ uri: photoUrls[0] }} style={styles.big} />
        ) : (
          <View style={styles.big} />
        )}
        {photoUrls.length > 0 && (
          <View style={styles.photoCountBadge}>
            <Text style={styles.photoCountText}>1 / {photoUrls.length} fotografías</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        {!!moment.occurred_at && (
          <Text style={styles.metaLine}>
            {new Date(moment.occurred_at).toLocaleString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}

        <Text style={styles.title}>{moment.title}</Text>

        {!!moment.place_name && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={colors.sage} />
            <Text style={styles.locationText}>{moment.place_name}</Text>
          </View>
        )}

        {!!moment.story && (
          <View style={styles.quote}>
            <Text style={styles.quoteText}>"{moment.story}"</Text>
          </View>
        )}

        {!!moment.song_title && (
          <View style={styles.songBar}>
            <View style={styles.songIcon}>
              <Ionicons name="musical-notes" size={16} color={colors.sage} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.songLabel}>Canción del momento</Text>
              <Text style={styles.songTitle} numberOfLines={1}>
                {moment.song_title}
              </Text>
            </View>
            {!!moment.song_url && (
              <Pressable style={styles.playBtn} onPress={() => Linking.openURL(moment.song_url!)}>
                <Ionicons name="play" size={13} color="#fff" />
              </Pressable>
            )}
          </View>
        )}

        {photoUrls.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.gallery}
            contentContainerStyle={styles.galleryContent}
          >
            {photoUrls.slice(1).map((url) => (
              <Image key={url} source={{ uri: url }} style={styles.galleryImage} />
            ))}
          </ScrollView>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  collage: { padding: spacing.md, position: 'relative' },
  topLeft: { position: 'absolute', top: 40, left: 30, zIndex: 2 },
  topRight: { position: 'absolute', top: 40, right: 30, zIndex: 2, flexDirection: 'row', gap: 10 },
  roundBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(20,12,14,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  big: {
    height: 260,
    borderRadius: radii.lg,
    backgroundColor: colors.sandDark,
  },
  photoCountBadge: {
    position: 'absolute',
    left: spacing.md + 8,
    bottom: 8,
    backgroundColor: 'rgba(20,12,14,0.6)',
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  photoCountText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: '#fff' },
  gallery: { marginTop: spacing.sm, marginHorizontal: -spacing.xl },
  galleryContent: { paddingHorizontal: spacing.xl, gap: 10 },
  galleryImage: { width: 96, height: 96, borderRadius: radii.md, backgroundColor: colors.sandDark },
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, paddingTop: spacing.md },
  metaLine: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink55, marginBottom: 4 },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.ink },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5, marginBottom: spacing.md },
  locationText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.sage },
  quote: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderLeftWidth: 4,
    borderLeftColor: colors.terracotta,
    borderTopRightRadius: radii.md,
    borderBottomRightRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  quoteText: { fontFamily: fonts.serifItalic, fontStyle: 'italic', fontSize: 16, lineHeight: 23, color: colors.ink },
  songBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  songIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songLabel: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.ink },
  songTitle: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink55, marginTop: 1 },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
