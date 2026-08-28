import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, gradientFor, radii, spacing } from '@/constants/theme';
import type { Trip } from '@/lib/use-trips';

function tripYear(trip: Trip) {
  return trip.start_date ? new Date(trip.start_date).getFullYear() : null;
}

function tripDays(trip: Trip) {
  if (!trip.start_date || !trip.end_date) return null;
  const ms = new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

export function FeaturedTripCard({ trip, momentsCount }: { trip: Trip; momentsCount: number }) {
  const gradient = gradientFor(trip.title);
  const year = tripYear(trip);
  const days = tripDays(trip);

  return (
    <Pressable
      onPress={() => router.push(`/viaje/${trip.id}`)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}
    >
      {trip.cover_photo_url ? (
        <Image source={{ uri: trip.cover_photo_url }} style={styles.cover} />
      ) : (
        <LinearGradient colors={gradient} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.cover} />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(10,6,7,0.15)', 'rgba(10,6,7,0.92)']}
        locations={[0, 0.45, 1]}
        style={styles.shade}
      />

      <View style={styles.content}>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Destacado</Text>
          </View>
          {!!year && (
            <View style={[styles.badge, styles.badgeSage]}>
              <Text style={styles.badgeText}>{year}</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{trip.title}</Text>
        {!!trip.destination_summary && <Text style={styles.subtitle}>{trip.destination_summary}</Text>}

        <View style={styles.statsRow}>
          {days !== null && (
            <View style={styles.stat}>
              <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.75)" />
              <Text style={styles.statText}>{days} días</Text>
            </View>
          )}
          <View style={styles.stat}>
            <Ionicons name="image-outline" size={12} color="rgba(255,255,255,0.75)" />
            <Text style={styles.statText}>{momentsCount} recuerdos</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.ink,
  },
  cover: { width: '100%', height: 320 },
  shade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg },
  badges: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radii.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  badgeSage: { backgroundColor: 'rgba(104,119,92,0.85)' },
  badgeText: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: '#fff' },
  title: { fontFamily: fonts.serif, fontSize: 34, color: '#fff' },
  subtitle: { fontFamily: fonts.sans, fontSize: 13.5, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: 'rgba(255,255,255,0.85)' },
});
