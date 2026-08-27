import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useTrips } from '@/lib/use-trips';
import { TripCard } from '@/components/TripCard';

type Filter = 'todos' | 'ano' | 'favoritos';

export default function Viajes() {
  const { trips, loading } = useTrips();
  const [filter, setFilter] = useState<Filter>('todos');

  const thisYear = new Date().getFullYear();
  const filtered = trips.filter((t) => {
    if (filter === 'favoritos') return t.is_favorite;
    if (filter === 'ano') return t.start_date ? new Date(t.start_date).getFullYear() === thisYear : false;
    return true;
  });

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Text style={styles.title}>Viajes</Text>
        </View>

        <View style={styles.pills}>
          {(
            [
              ['todos', 'Todos'],
              ['ano', 'Este año'],
              ['favoritos', 'Favoritos'],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={[styles.pill, filter === key && styles.pillActive]}
            >
              <Text style={[styles.pillText, filter === key && styles.pillTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {!loading && filtered.length === 0 && (
          <Text style={styles.empty}>No hay viajes con este filtro todavía.</Text>
        )}

        <View style={{ gap: spacing.md }}>
          {filtered.map((t) => (
            <TripCard key={t.id} trip={t} />
          ))}
        </View>
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => router.push('/crear-viaje')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingTop: 60, paddingBottom: 120 },
  top: { marginBottom: spacing.md },
  title: { fontFamily: fonts.serif, fontSize: 34, color: colors.ink },
  pills: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg },
  pill: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  pillActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  pillText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.ink55 },
  pillTextActive: { color: colors.background },
  empty: { fontFamily: fonts.sans, color: colors.ink55, fontSize: 14, paddingVertical: spacing.lg },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: { color: colors.background, fontSize: 26, fontFamily: fonts.sans, marginTop: -2 },
});
