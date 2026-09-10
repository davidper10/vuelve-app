import { useCallback, useState } from 'react';
import { Image, Linking, Modal, Pressable, Share, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { safeBack } from '@/lib/navigation';
import { useConfirm } from '@/lib/confirm-context';
import type { Tables } from '@/lib/database.types';

type Moment = Tables<'moments'>;

function splitPlace(placeName: string) {
  const parts = placeName.split(',').map((p) => p.trim());
  return { primary: parts[0], secondary: parts.slice(1).join(', ') };
}

export default function MomentoDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const confirm = useConfirm();
  const [moment, setMoment] = useState<Moment | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const onShare = async () => {
    if (!moment) return;
    try {
      await Share.share({ message: [moment.title, moment.place_name].filter(Boolean).join(' · ') });
    } catch {
      // el usuario canceló el share sheet
    }
  };

  const onDelete = async () => {
    if (!moment) return;
    setMenuOpen(false);
    const ok = await confirm({
      title: 'Eliminar recuerdo',
      message: `¿Seguro que quieres eliminar "${moment.title}"? Se borrarán también sus fotos. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;

    const { data: links } = await supabase.from('moment_memories').select('memory_id').eq('moment_id', moment.id);
    const memoryIds = (links ?? []).map((l) => l.memory_id);
    if (memoryIds.length) {
      const { data: mems } = await supabase.from('memories').select('id, storage_path').in('id', memoryIds);
      const paths = (mems ?? []).map((m) => m.storage_path).filter((p): p is string => !!p);
      if (paths.length) await supabase.storage.from('memories').remove(paths);
      await supabase.from('memories').delete().in('id', memoryIds);
    }
    await supabase.from('nfc_tags').delete().eq('moment_id', moment.id);
    await supabase.from('moments').delete().eq('id', moment.id);
    safeBack(moment.trip_id ? `/viaje/${moment.trip_id}` : '/viajes');
  };

  if (!moment) {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontFamily: fonts.sans, color: colors.ink55 }}>Cargando…</Text>
      </View>
    );
  }

  const backHref = moment.trip_id ? `/viaje/${moment.trip_id}` : '/viajes';
  const place = moment.place_name ? splitPlace(moment.place_name) : null;
  const hasCoords = moment.lat != null && moment.lng != null;

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {photoUrls[photoIndex] ? (
            <Image source={{ uri: photoUrls[photoIndex] }} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sandDark }]} />
          )}
          <View style={styles.heroNav}>
            <Pressable style={styles.roundBtn} onPress={() => safeBack(backHref)}>
              <Ionicons name="chevron-back" size={18} color="#FBF3EE" />
            </Pressable>
          </View>
          <View style={styles.heroNavRight}>
            <Pressable style={styles.roundBtn} onPress={toggleFavorite}>
              <Ionicons name={moment.is_favorite ? 'heart' : 'heart-outline'} size={18} color="#FBF3EE" />
            </Pressable>
            <Pressable style={styles.roundBtn} onPress={onShare}>
              <Ionicons name="share-social-outline" size={17} color="#FBF3EE" />
            </Pressable>
            <Pressable style={styles.roundBtn} onPress={() => setMenuOpen(true)}>
              <Ionicons name="ellipsis-vertical" size={16} color="#FBF3EE" />
            </Pressable>
          </View>
          {photoUrls.length > 0 && (
            <View style={styles.photoCountBadge}>
              <Ionicons name="images-outline" size={13} color="#fff" />
              <Text style={styles.photoCountText}>
                {photoIndex + 1} / {photoUrls.length} fotos
              </Text>
            </View>
          )}
          {photoUrls.length > 1 && (
            <View style={styles.heroPager}>
              <Pressable
                style={styles.roundBtnSmall}
                onPress={() => setPhotoIndex((i) => (i - 1 + photoUrls.length) % photoUrls.length)}
              >
                <Ionicons name="chevron-back" size={16} color="#FBF3EE" />
              </Pressable>
              <Pressable
                style={styles.roundBtnSmall}
                onPress={() => setPhotoIndex((i) => (i + 1) % photoUrls.length)}
              >
                <Ionicons name="chevron-forward" size={16} color="#FBF3EE" />
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.body}>
          {!!moment.occurred_at && (
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={13} color={colors.ink55} />
              <Text style={styles.metaLine}>
                {new Date(moment.occurred_at).toLocaleString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}

          <View style={styles.titleRow}>
            <Text style={styles.title}>{moment.title}</Text>
            <Pressable style={styles.editPill} onPress={() => router.push(`/editar-recuerdo?momentId=${moment.id}`)}>
              <Ionicons name="pencil" size={14} color={colors.ink70} />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {!!moment.story && (
            <View style={styles.quote}>
              <Text style={styles.quoteText}>{moment.story}</Text>
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

          {photoUrls.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Fotos de este momento</Text>
                <View style={styles.sectionMoreRow}>
                  <Text style={styles.sectionMoreText}>
                    {photoUrls.length} foto{photoUrls.length === 1 ? '' : 's'}
                  </Text>
                  <Ionicons name="chevron-forward" size={13} color={colors.ink38} />
                </View>
              </View>
              <View style={styles.photoGrid}>
                {photoUrls.map((url) => (
                  <Image key={url} source={{ uri: url }} style={styles.photoGridItem} />
                ))}
                <Pressable
                  style={styles.addPhotoTile}
                  onPress={() => router.push(`/editar-recuerdo?momentId=${moment.id}`)}
                >
                  <Ionicons name="add" size={20} color={colors.ink55} />
                  <Text style={styles.addPhotoText}>Añadir{'\n'}más fotos</Text>
                </Pressable>
              </View>
            </>
          )}

          {!!place && (
            <View style={styles.locationCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.locationCardPrimary} numberOfLines={1}>
                  {place.primary}
                </Text>
                {!!place.secondary && (
                  <Text style={styles.locationCardSecondary} numberOfLines={2}>
                    {place.secondary}
                  </Text>
                )}
              </View>
              {hasCoords && (
                <View style={styles.locationCardMap}>
                  <Ionicons name="location" size={22} color={colors.sage} />
                </View>
              )}
            </View>
          )}

          {hasCoords && (
            <Pressable
              style={styles.mapLinkBtn}
              onPress={() => Linking.openURL(`https://www.google.com/maps?q=${moment.lat},${moment.lng}`)}
            >
              <Ionicons name="map-outline" size={16} color={colors.ink70} />
              <Text style={styles.mapLinkText}>Ver en el mapa</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.ink38} style={{ marginLeft: 'auto' }} />
            </Pressable>
          )}
        </View>
      </ScrollView>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.menuCard} onPress={(e) => e.stopPropagation()}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                router.push(`/editar-recuerdo?momentId=${moment.id}`);
              }}
            >
              <Ionicons name="pencil-outline" size={17} color={colors.ink70} />
              <Text style={styles.menuItemText}>Editar</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={onDelete}>
              <Ionicons name="trash-outline" size={17} color={colors.terracotta} />
              <Text style={[styles.menuItemText, { color: colors.terracotta }]}>Eliminar</Text>
            </Pressable>
            <Pressable style={styles.menuCancel} onPress={() => setMenuOpen(false)}>
              <Text style={styles.menuCancelText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  heroPager: { position: 'absolute', right: 16, bottom: 16, zIndex: 2, flexDirection: 'row', gap: 8 },
  roundBtnSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(20,12,14,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCountBadge: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(20,12,14,0.6)',
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  photoCountText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: '#fff' },
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, paddingTop: spacing.lg },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  metaLine: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink55 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.ink, flex: 1 },
  editPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: colors.line, marginTop: spacing.md, marginBottom: spacing.md },
  quote: {
    backgroundColor: colors.sageLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.sage,
    borderTopRightRadius: radii.md,
    borderBottomRightRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  quoteText: {
    fontFamily: fonts.serifItalic,
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 23,
    color: colors.ink,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  sectionMoreRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionMoreText: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink38 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  photoGridItem: { width: 96, height: 96, borderRadius: radii.md, backgroundColor: colors.sandDark },
  addPhotoTile: {
    width: 96,
    height: 96,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.ink55, textAlign: 'center' },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  locationCardPrimary: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  locationCardSecondary: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.ink55, marginTop: 2, lineHeight: 16 },
  locationCardMap: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    backgroundColor: colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.pill,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  mapLinkText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink70 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(20,12,14,0.4)', justifyContent: 'flex-end' },
  menuCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  menuItemText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  menuCancel: { alignItems: 'center', paddingVertical: 12, marginTop: spacing.xs },
  menuCancelText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink55 },
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
