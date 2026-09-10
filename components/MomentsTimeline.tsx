import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useConfirm } from '@/lib/confirm-context';
import type { Tables } from '@/lib/database.types';

type Moment = Tables<'moments'>;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function dateParts(iso: string | null) {
  if (!iso) return { day: '–', month: '', weekday: 'Sin fecha' };
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString('es-ES', { day: 'numeric' }),
    month: capitalize(d.toLocaleDateString('es-ES', { month: 'short' })).replace('.', ''),
    weekday: capitalize(d.toLocaleDateString('es-ES', { weekday: 'long' })),
  };
}

function PhotoGrid({ photos }: { photos: string[] }) {
  if (photos.length === 0) return null;
  const shown = photos.slice(0, 3);
  const extra = photos.length - shown.length;
  return (
    <View style={styles.photoGrid}>
      {shown.map((uri, i) => {
        const isLast = i === shown.length - 1;
        return (
          <View key={uri} style={styles.photoGridItem}>
            <Image source={{ uri }} style={styles.photoGridImage} />
            {isLast && extra > 0 && (
              <View style={styles.photoGridOverlay}>
                <Text style={styles.photoGridOverlayText}>+{extra}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

export function MomentsTimeline({
  moments,
  photos,
  onPressMoment,
  onChanged,
}: {
  moments: Moment[];
  photos: Record<string, string[]>;
  onPressMoment: (id: string) => void;
  onChanged?: () => void;
}) {
  const confirm = useConfirm();
  const [menuMomentId, setMenuMomentId] = useState<string | null>(null);
  const menuMoment = moments.find((m) => m.id === menuMomentId) ?? null;

  const closeMenu = () => setMenuMomentId(null);

  const onEdit = (id: string) => {
    closeMenu();
    router.push(`/editar-recuerdo?momentId=${id}`);
  };

  const onDelete = async (id: string, title: string) => {
    closeMenu();
    const ok = await confirm({
      title: 'Eliminar recuerdo',
      message: `¿Seguro que quieres eliminar "${title}"? Se borrarán también sus fotos. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!ok) return;

    const { data: links } = await supabase.from('moment_memories').select('memory_id').eq('moment_id', id);
    const memoryIds = (links ?? []).map((l) => l.memory_id);
    if (memoryIds.length) {
      const { data: mems } = await supabase.from('memories').select('id, storage_path').in('id', memoryIds);
      const paths = (mems ?? []).map((m) => m.storage_path).filter((p): p is string => !!p);
      if (paths.length) await supabase.storage.from('memories').remove(paths);
      await supabase.from('memories').delete().in('id', memoryIds);
    }
    await supabase.from('nfc_tags').delete().eq('moment_id', id);
    await supabase.from('moments').delete().eq('id', id);
    onChanged?.();
  };

  return (
    <View>
      {moments.map((m, i) => {
        const isLast = i === moments.length - 1;
        const momentPhotos = photos[m.id] ?? [];
        const isFav = m.is_favorite;
        const { day, month, weekday } = dateParts(m.occurred_at);

        return (
          <View key={m.id} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.dot, isFav && styles.dotFav]} />
              {!isLast && <View style={styles.railLine} />}
            </View>

            <View style={styles.dateCol}>
              <Text style={styles.dayNum}>{day}</Text>
              {!!month && <Text style={styles.monthAbbr}>{month}</Text>}
              <Text style={styles.weekday}>{weekday}</Text>
            </View>

            <View style={[styles.content, !isLast && styles.contentDivider]}>
              <Pressable onPress={() => onPressMoment(m.id)}>
              {isFav ? (
                <View style={styles.featuredCard}>
                  <View style={styles.featuredTopRow}>
                    <Text style={styles.featuredTitle} numberOfLines={1}>
                      {m.title}
                    </Text>
                    <View style={styles.favBadge}>
                      <Ionicons name="star" size={11} color={colors.terracotta} />
                      <Text style={styles.favBadgeText}>Favorito</Text>
                    </View>
                  </View>

                  {!!m.place_name && (
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={12} color={colors.sage} />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {m.place_name}
                      </Text>
                    </View>
                  )}

                  {!!momentPhotos[0] && <Image source={{ uri: momentPhotos[0] }} style={styles.featuredPhoto} />}

                  {!!m.story && (
                    <Text style={styles.quote} numberOfLines={3}>
                      "{m.story}"
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.card}>
                  <View style={styles.cardTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {m.title}
                      </Text>
                      {!!m.place_name && (
                        <View style={styles.locationRow}>
                          <Ionicons name="location-outline" size={12} color={colors.sage} />
                          <Text style={styles.locationText} numberOfLines={1}>
                            {m.place_name}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Pressable
                      hitSlop={8}
                      style={styles.menuBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        setMenuMomentId(m.id);
                      }}
                    >
                      <Ionicons name="ellipsis-horizontal" size={16} color={colors.ink38} />
                    </Pressable>
                  </View>

                  <PhotoGrid photos={momentPhotos} />

                  {!!m.story && (
                    <Text style={styles.cardBody} numberOfLines={2}>
                      {m.story}
                    </Text>
                  )}
                </View>
              )}
              </Pressable>
            </View>
          </View>
        );
      })}

      <Modal visible={!!menuMoment} transparent animationType="fade" onRequestClose={closeMenu}>
        <Pressable style={styles.menuOverlay} onPress={closeMenu}>
          <Pressable style={styles.menuCard} onPress={(e) => e.stopPropagation()}>
            {!!menuMoment && (
              <Text style={styles.menuTitle} numberOfLines={1}>
                {menuMoment.title}
              </Text>
            )}
            <Pressable style={styles.menuItem} onPress={() => menuMoment && onEdit(menuMoment.id)}>
              <Ionicons name="pencil-outline" size={17} color={colors.ink70} />
              <Text style={styles.menuItemText}>Editar</Text>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={() => menuMoment && onDelete(menuMoment.id, menuMoment.title)}
            >
              <Ionicons name="trash-outline" size={17} color={colors.terracotta} />
              <Text style={[styles.menuItemText, { color: colors.terracotta }]}>Eliminar</Text>
            </Pressable>
            <Pressable style={styles.menuCancel} onPress={closeMenu}>
              <Text style={styles.menuCancelText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  rail: { width: 14, alignItems: 'center' },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.sage,
    marginTop: 3,
  },
  dotFav: { backgroundColor: colors.terracotta },
  railLine: { flex: 1, width: 2, backgroundColor: colors.line, marginTop: 4, marginBottom: -spacing.lg },
  dateCol: { width: 44, marginLeft: 6 },
  dayNum: { fontFamily: fonts.sansBold, fontSize: 17, color: colors.ink, lineHeight: 19 },
  monthAbbr: {
    fontFamily: fonts.sansBold,
    fontSize: 10.5,
    color: colors.sage,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  weekday: { fontFamily: fonts.sans, fontSize: 10, color: colors.ink38, marginTop: 1 },
  content: { flex: 1, marginLeft: spacing.xs, marginBottom: spacing.lg },
  contentDivider: {
    paddingBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(20,12,14,0.08)',
  },
  card: {
    gap: spacing.sm,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  cardTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  cardBody: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink55, lineHeight: 19 },
  menuBtn: { padding: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  locationText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.ink55 },
  photoGrid: { flexDirection: 'row', gap: 6 },
  photoGridItem: { flex: 1, aspectRatio: 1, borderRadius: radii.sm, overflow: 'hidden', backgroundColor: colors.sandDark },
  photoGridImage: { width: '100%', height: '100%' },
  photoGridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20,12,14,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoGridOverlayText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 16 },
  featuredCard: {
    gap: 8,
  },
  featuredTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  featuredTitle: { fontFamily: fonts.serif, fontSize: 19, color: colors.ink, flex: 1 },
  favBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.terracottaLight,
    borderRadius: radii.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  favBadgeText: { fontFamily: fonts.sansBold, fontSize: 9.5, color: colors.terracotta },
  featuredPhoto: { width: '100%', height: 170, borderRadius: radii.md, backgroundColor: colors.sandDark },
  quote: {
    fontFamily: fonts.serifItalic,
    fontStyle: 'italic',
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.ink70,
  },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(20,12,14,0.4)', justifyContent: 'flex-end' },
  menuCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  menuTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12.5,
    color: colors.ink38,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    marginBottom: spacing.xs,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  menuItemText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink },
  menuCancel: { alignItems: 'center', paddingVertical: 12, marginTop: spacing.xs },
  menuCancelText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink55 },
});
