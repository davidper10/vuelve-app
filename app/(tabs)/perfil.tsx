import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useTrips } from '@/lib/use-trips';

export default function Perfil() {
  const { session, signOut } = useAuth();
  const { trips } = useTrips();

  const fullName = (session?.user.user_metadata?.full_name as string | undefined) ?? 'Viajero';
  const initial = fullName.trim().charAt(0).toUpperCase() || 'A';
  const countries = new Set(trips.map((t) => t.country).filter(Boolean));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>
      <View style={styles.head}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.stats}>
          {trips.length} {trips.length === 1 ? 'viaje' : 'viajes'} · {countries.size}{' '}
          {countries.size === 1 ? 'país' : 'países'}
        </Text>
      </View>

      {countries.size > 0 && (
        <>
          <Text style={styles.sectionTitle}>Países visitados</Text>
          <View style={styles.countries}>
            {[...countries].map((c) => (
              <View key={c} style={styles.chip}>
                <View style={styles.chipDot} />
                <Text style={styles.chipText}>{c}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Pressable style={styles.signOut} onPress={signOut}>
        <Text style={styles.signOutText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingTop: 60, paddingBottom: 120 },
  head: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { fontFamily: fonts.serif, fontSize: 30, color: colors.background },
  name: { fontFamily: fonts.serif, fontSize: 28, color: colors.ink },
  stats: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.ink55, marginTop: 4 },
  sectionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 12.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.ink55,
    marginBottom: spacing.sm,
  },
  countries: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.xl },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.terracotta },
  chipText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  signOut: {
    marginTop: spacing.xl,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  signOutText: { fontFamily: fonts.sansBold, color: colors.ink70, fontSize: 14 },
});
