import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, fonts, gradientFor, radii, spacing } from '@/constants/theme';
import type { Trip } from '@/lib/use-trips';

function formatRange(start: string | null, end: string | null) {
  if (!start) return 'Fechas por definir';
  const s = new Date(start);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  if (!end) return s.toLocaleDateString('es-ES', opts);
  const e = new Date(end);
  return `${s.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} – ${e.toLocaleDateString('es-ES', opts)}`;
}

export function TripCard({
  trip,
  size = 'md',
  momentsCount,
}: {
  trip: Trip;
  size?: 'md' | 'lg' | 'grid';
  momentsCount?: number;
}) {
  const gradient = gradientFor(trip.title);
  const height = size === 'lg' ? 260 : size === 'grid' ? 128 : 150;

  if (size === 'grid') {
    return (
      <Pressable
        onPress={() => router.push(`/viaje/${trip.id}`)}
        style={({ pressed }) => [styles.gridCard, pressed && { opacity: 0.9 }]}
      >
        <View style={styles.gridCoverWrap}>
          {trip.cover_photo_url ? (
            <Image source={{ uri: trip.cover_photo_url }} style={[styles.cover, styles.gridCoverRadius, { height }]} />
          ) : (
            <LinearGradient
              colors={gradient}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={[styles.cover, styles.gridCoverRadius, { height }]}
            />
          )}
          {!!trip.country && (
            <View style={styles.gridBadge}>
              <Text style={styles.gridBadgeText}>{trip.country}</Text>
            </View>
          )}
        </View>
        <Text style={styles.gridTitle} numberOfLines={1}>
          {trip.title}
        </Text>
        <Text style={styles.gridMeta} numberOfLines={1}>
          {formatRange(trip.start_date, trip.end_date)}
          {typeof momentsCount === 'number' ? ` · ${momentsCount} fotos` : ''}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => router.push(`/viaje/${trip.id}`)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      {trip.cover_photo_url ? (
        <Image source={{ uri: trip.cover_photo_url }} style={[styles.cover, { height }]} />
      ) : (
        <LinearGradient
          colors={gradient}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.cover, { height }]}
        />
      )}
      <View style={styles.body}>
        <Text style={styles.title}>{trip.title}</Text>
        <Text style={styles.meta}>{formatRange(trip.start_date, trip.end_date)}</Text>
        {!!trip.country && (
          <View style={styles.countryRow}>
            <View style={styles.dot} />
            <Text style={styles.country}>{trip.country}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cover: { width: '100%' },
  body: { padding: spacing.md },
  title: { fontFamily: fonts.serif, fontSize: 22, color: colors.ink },
  meta: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.ink55, marginTop: 4 },
  countryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.terracotta },
  country: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.ink70 },
  gridCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.sm,
  },
  gridCoverWrap: { position: 'relative', marginBottom: spacing.xs, overflow: 'hidden', borderRadius: radii.md },
  gridCoverRadius: { borderRadius: radii.md },
  gridBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(20,12,14,0.55)',
    borderRadius: radii.pill,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  gridBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 9.5, color: '#fff' },
  gridTitle: { fontFamily: fonts.serif, fontSize: 18, color: colors.ink },
  gridMeta: { fontFamily: fonts.sans, fontSize: 11, color: colors.ink55, marginTop: 2 },
});
