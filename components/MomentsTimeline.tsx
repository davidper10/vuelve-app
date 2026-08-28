import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import type { Tables } from '@/lib/database.types';

type Moment = Tables<'moments'>;

function dayKey(iso: string | null) {
  return iso ? iso.slice(0, 10) : 'sin-fecha';
}

function formatDayHeader(key: string) {
  if (key === 'sin-fecha') return 'Sin fecha';
  const label = new Date(`${key}T00:00:00`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export function MomentsTimeline({
  moments,
  photos,
  onPressMoment,
}: {
  moments: Moment[];
  photos: Record<string, string>;
  onPressMoment: (id: string) => void;
}) {
  const groups: { key: string; items: Moment[] }[] = [];
  for (const m of moments) {
    const key = dayKey(m.occurred_at);
    const current = groups[groups.length - 1];
    if (current && current.key === key) {
      current.items.push(m);
    } else {
      groups.push({ key, items: [m] });
    }
  }

  return (
    <View>
      {groups.map((group, gi) => (
        <View key={group.key} style={styles.dayGroup}>
          <View style={styles.dayHeaderRow}>
            <Text style={styles.dayHeader}>{formatDayHeader(group.key)}</Text>
            <View style={styles.dayHeaderLine} />
          </View>

          {group.items.map((m, i) => {
            const isLastRow = gi === groups.length - 1 && i === group.items.length - 1;
            return (
              <Pressable key={m.id} style={styles.row} onPress={() => onPressMoment(m.id)}>
                <View style={styles.rail}>
                  <View style={[styles.dot, m.is_favorite && styles.dotFav]} />
                  {!isLastRow && <View style={styles.railLine} />}
                </View>

                <View style={styles.card}>
                  <View style={styles.cardTopRow}>
                    {!!photos[m.id] && <Image source={{ uri: photos[m.id] }} style={styles.thumb} />}

                    <View style={styles.cardInfo}>
                      <View style={styles.timeRow}>
                        {!!m.occurred_at && <Text style={styles.time}>{formatTime(m.occurred_at)}</Text>}
                        {m.is_favorite && (
                          <View style={styles.favBadge}>
                            <Text style={styles.favBadgeText}>Favorito</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {m.title}
                      </Text>

                      {!!m.place_name && (
                        <View style={styles.metaRow}>
                          <Ionicons name="location-outline" size={13} color={colors.sage} />
                          <Text style={styles.metaText} numberOfLines={1}>
                            {m.place_name}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {!!m.story && (
                    <Text style={styles.story} numberOfLines={2}>
                      {m.story}
                    </Text>
                  )}

                  {!!m.song_title && (
                    <View style={styles.songChip}>
                      <Ionicons name="musical-notes-outline" size={12} color={colors.sage} />
                      <Text style={styles.songChipText} numberOfLines={1}>
                        {m.song_title}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dayGroup: { marginBottom: spacing.sm },
  dayHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.sm },
  dayHeader: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    color: colors.sage,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayHeaderLine: { flex: 1, height: 1, backgroundColor: colors.line },
  row: { flexDirection: 'row' },
  rail: { width: 24, alignItems: 'center' },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.sage,
    marginTop: 6,
  },
  dotFav: { backgroundColor: colors.terracotta, borderColor: colors.terracotta },
  railLine: { flex: 1, width: 2, backgroundColor: colors.line, marginTop: 4, marginBottom: -spacing.lg },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    marginLeft: 4,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumb: { width: 56, height: 56, borderRadius: radii.sm, backgroundColor: colors.sandDark },
  cardInfo: { flex: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  time: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: colors.ink38 },
  favBadge: { backgroundColor: colors.terracottaLight, borderRadius: radii.pill, paddingVertical: 3, paddingHorizontal: 9 },
  favBadgeText: { fontFamily: fonts.sansBold, fontSize: 9.5, color: colors.terracotta },
  cardTitle: { fontFamily: fonts.serif, fontSize: 19, color: colors.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  metaText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.ink55 },
  story: {
    fontFamily: fonts.serifItalic,
    fontStyle: 'italic',
    fontSize: 14.5,
    lineHeight: 20,
    color: colors.ink70,
    marginTop: 8,
  },
  songChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.sand,
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  songChipText: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: colors.ink70, maxWidth: 180 },
});
