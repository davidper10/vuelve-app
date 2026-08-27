import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useTrips } from '@/lib/use-trips';
import { TripCard } from '@/components/TripCard';

export default function Home() {
  const { session } = useAuth();
  const { trips, loading, error } = useTrips();
  const firstName = (session?.user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'viajero';

  const [featured, ...rest] = trips;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Buenos días, {firstName}</Text>
        <Text style={styles.greeting}>¿A dónde quieres{'\n'}volver hoy?</Text>

        {error && <Text style={styles.error}>No se pudieron cargar tus viajes: {error}</Text>}

        {!loading && !error && trips.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Todavía no tienes viajes</Text>
            <Text style={styles.emptyBody}>
              Crea el primero y empieza tu colección de recuerdos.
            </Text>
            <Pressable style={styles.emptyButton} onPress={() => router.push('/crear-viaje')}>
              <Text style={styles.emptyButtonText}>+ Nuevo viaje</Text>
            </Pressable>
          </View>
        )}

        {featured && (
          <>
            <TripCard trip={featured} size="lg" />
            {rest.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Tus viajes</Text>
                <View style={{ gap: spacing.md }}>
                  {rest.map((t) => (
                    <TripCard key={t.id} trip={t} />
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => router.push('/crear-viaje')}>
        <Ionicons name="add" size={22} color={colors.background} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingTop: 60, paddingBottom: 120, gap: spacing.md },
  eyebrow: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.ink55 },
  greeting: { fontFamily: fonts.serifItalic, fontStyle: 'italic', fontSize: 30, color: colors.ink, marginBottom: spacing.sm, lineHeight: 34 },
  sectionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 12.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.ink55,
    marginTop: spacing.md,
  },
  error: { fontFamily: fonts.sansMedium, color: colors.terracotta, fontSize: 13 },
  empty: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.ink },
  emptyBody: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink55, textAlign: 'center' },
  emptyButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
  },
  emptyButtonText: { fontFamily: fonts.sansBold, color: colors.background, fontSize: 14 },
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
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
});
