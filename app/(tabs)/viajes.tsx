import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useTrips } from '@/lib/use-trips';
import { TripCard } from '@/components/TripCard';

type Filter = 'todos' | 'ano' | 'favoritos';

export default function Viajes() {
  const { trips, loading } = useTrips();
  const [filter, setFilter] = useState<Filter>('todos');
  const [query, setQuery] = useState('');

  const thisYear = new Date().getFullYear();
  const countries = new Set(trips.map((t) => t.country).filter(Boolean));

  const filtered = trips
    .filter((t) => {
      if (filter === 'favoritos') return t.is_favorite;
      if (filter === 'ano') return t.start_date ? new Date(t.start_date).getFullYear() === thisYear : false;
      return true;
    })
    .filter((t) => {
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      return t.title.toLowerCase().includes(q) || (t.country ?? '').toLowerCase().includes(q);
    });

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Colección de Viajes</Text>
            <Text style={styles.subtitle}>
              {countries.size} {countries.size === 1 ? 'país' : 'países'} · {trips.length}{' '}
              {trips.length === 1 ? 'viaje' : 'viajes'}
            </Text>
          </View>
          <Pressable style={styles.newBtn} onPress={() => router.push('/crear-viaje')}>
            <Ionicons name="add" size={14} color={colors.background} />
            <Text style={styles.newBtnText}>Nuevo viaje</Text>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={14} color={colors.ink38} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por ciudad, país o año..."
            placeholderTextColor={colors.ink38}
            value={query}
            onChangeText={setQuery}
          />
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingTop: 60, paddingBottom: 120 },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.md },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.ink },
  subtitle: { fontFamily: fonts.sans, fontSize: 12, color: colors.ink55, marginTop: 2 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.sage,
    borderRadius: radii.pill,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  newBtnText: { fontFamily: fonts.sansSemiBold, color: colors.background, fontSize: 12 },
  searchWrap: { position: 'relative', marginBottom: spacing.md },
  searchIcon: { position: 'absolute', left: 14, top: 13, zIndex: 1 },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    paddingLeft: 36,
    paddingRight: 14,
    paddingVertical: 11,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.ink,
  },
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
});
