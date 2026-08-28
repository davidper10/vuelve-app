import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
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

  useEffect(() => {
    load();
  }, [load]);

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
        <Pressable
          style={styles.roundBtn}
          onPress={() => safeBack(moment.trip_id ? `/viaje/${moment.trip_id}` : '/viajes')}
        >
          <Ionicons name="chevron-back" size={18} color="#FBF3EE" />
        </Pressable>
        {photoUrls[0] ? (
          <Image source={{ uri: photoUrls[0] }} style={styles.big} />
        ) : (
          <View style={styles.big} />
        )}
      </View>

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

      <View style={styles.body}>
        {!!moment.place_name && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={15} color={colors.terracotta} />
            <Text style={styles.metaText}>{moment.place_name}</Text>
          </View>
        )}
        {!!moment.occurred_at && (
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={15} color={colors.terracotta} />
            <Text style={styles.metaText}>
              {new Date(moment.occurred_at).toLocaleString('es-ES', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        )}

        <Text style={styles.title}>{moment.title}</Text>
        {!!moment.story && <Text style={styles.story}>"{moment.story}"</Text>}

        <View style={styles.chips}>
          {!!moment.song_title && (
            <View style={styles.chip}>
              <Ionicons name="musical-notes-outline" size={16} color={colors.sage} />
              <Text style={styles.chipText}>{moment.song_title}</Text>
            </View>
          )}
          <Pressable
            style={[styles.chip, styles.favChip, moment.is_favorite && styles.favChipOn]}
            onPress={toggleFavorite}
          >
            <Ionicons
              name={moment.is_favorite ? 'heart' : 'heart-outline'}
              size={16}
              color={moment.is_favorite ? '#fff' : colors.sage}
            />
            <Text style={[styles.chipText, moment.is_favorite && { color: '#fff' }]}>Favorito</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  collage: { padding: spacing.md, position: 'relative' },
  roundBtn: {
    position: 'absolute',
    top: 40,
    left: 30,
    zIndex: 2,
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
  gallery: { marginTop: spacing.sm },
  galleryContent: { paddingHorizontal: spacing.xl, gap: 10 },
  galleryImage: { width: 96, height: 96, borderRadius: radii.md, backgroundColor: colors.sandDark },
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, paddingTop: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  metaText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink55 },
  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.ink, marginTop: spacing.sm, marginBottom: spacing.md },
  story: { fontFamily: fonts.serifItalic, fontStyle: 'italic', fontSize: 19, lineHeight: 27, color: colors.ink70, marginBottom: spacing.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.pill,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  chipText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  favChip: {},
  favChipOn: { backgroundColor: colors.terracotta, borderColor: colors.terracotta },
});
