import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import type { Tables } from '@/lib/database.types';

type Moment = Tables<'moments'>;

function formatDayShort(iso: string | null) {
  if (!iso) return 'Sin fecha';
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
}

export function MomentsTimeline({
  moments,
  photos,
  onPressMoment,
}: {
  moments: Moment[];
  photos: Record<string, string[]>;
  onPressMoment: (id: string) => void;
}) {
  return (
    <View>
      {moments.map((m, i) => {
        const isLast = i === moments.length - 1;
        const momentPhotos = photos[m.id] ?? [];
        const isFav = m.is_favorite;

        return (
          <Pressable key={m.id} style={styles.row} onPress={() => onPressMoment(m.id)}>
            <View style={styles.rail}>
              <View style={[styles.dot, isFav && styles.dotFav]} />
              {!isLast && <View style={styles.railLine} />}
            </View>

            <View style={styles.content}>
              <View style={styles.headerRow}>
                <Text style={[styles.dayLabel, isFav && styles.dayLabelFav]}>
                  {formatDayShort(m.occurred_at)}
                  {isFav ? ' · Momento especial' : ''}
                </Text>
                {!!m.place_name && (
                  <Text style={styles.headerPlace} numberOfLines={1}>
                    {m.place_name}
                  </Text>
                )}
              </View>

              {isFav ? (
                <View style={styles.featuredCard}>
                  <View style={styles.featuredTopRow}>
                    <Text style={styles.featuredTitle} numberOfLines={1}>
                      {m.title}
                    </Text>
                    <View style={styles.favBadge}>
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
                    <Text style={styles.quote} numberOfLines={2}>
                      "{m.story}"
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.card}>
                  {momentPhotos[0] ? (
                    <Image source={{ uri: momentPhotos[0] }} style={styles.thumb} />
                  ) : (
                    <View style={styles.thumb} />
                  )}
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
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  rail: { width: 24, alignItems: 'center' },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.sage,
    marginTop: 4,
  },
  dotFav: { backgroundColor: colors.terracotta, borderColor: colors.terracotta },
  railLine: { flex: 1, width: 2, backgroundColor: colors.line, marginTop: 4, marginBottom: -spacing.lg },
  content: { flex: 1, marginLeft: 4, marginBottom: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, gap: 8 },
  dayLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 11.5,
    color: colors.sage,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dayLabelFav: { color: colors.terracotta },
  headerPlace: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink38, flexShrink: 1, textAlign: 'right' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  thumb: { width: 56, height: 56, borderRadius: radii.sm, backgroundColor: colors.sandDark },
  cardTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  featuredCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 8,
  },
  featuredTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  featuredTitle: { fontFamily: fonts.serif, fontSize: 19, color: colors.ink, flex: 1 },
  favBadge: { backgroundColor: colors.terracottaLight, borderRadius: radii.pill, paddingVertical: 3, paddingHorizontal: 9 },
  favBadgeText: { fontFamily: fonts.sansBold, fontSize: 9.5, color: colors.terracotta },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  locationText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.ink55 },
  featuredPhoto: { width: '100%', height: 170, borderRadius: radii.md, backgroundColor: colors.sandDark },
  quote: {
    fontFamily: fonts.serifItalic,
    fontStyle: 'italic',
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.ink70,
  },
});
