import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useTrips } from '@/lib/use-trips';
import { supabase } from '@/lib/supabase';

export default function Perfil() {
  const { session, signOut } = useAuth();
  const { trips } = useTrips();
  const [momentsCount, setMomentsCount] = useState<number | null>(null);

  const fullName = (session?.user.user_metadata?.full_name as string | undefined) ?? 'Viajero';
  const avatarUrl = session?.user.user_metadata?.avatar_url as string | undefined;
  const initial = fullName.trim().charAt(0).toUpperCase() || 'A';
  const countries = new Set(trips.map((t) => t.country).filter(Boolean));

  useEffect(() => {
    supabase
      .from('moments')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => setMomentsCount(count ?? 0));
  }, []);

  const byYear = new Map<number, typeof trips>();
  for (const t of trips) {
    if (!t.start_date) continue;
    const year = new Date(t.start_date).getFullYear();
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(t);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>
      <View style={styles.head}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        <Text style={styles.name}>{fullName}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statNumber}>{trips.length}</Text>
            <Text style={styles.statLabel}>Viajes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statNumber}>{countries.size}</Text>
            <Text style={styles.statLabel}>Países</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statNumber}>{momentsCount ?? '—'}</Text>
            <Text style={styles.statLabel}>Recuerdos</Text>
          </View>
        </View>
      </View>

      {years.length > 0 && (
        <View style={{ gap: spacing.md }}>
          <Text style={styles.sectionTitle}>Tu Historia por Años</Text>
          {years.map((year) => (
            <View key={year} style={{ gap: 8 }}>
              <Text style={styles.yearLabel}>{year}</Text>
              {byYear.get(year)!.map((t) => (
                <View key={t.id} style={styles.yearRow}>
                  <Text style={styles.yearRowTitle}>
                    {t.title}
                    {!!t.country && ` · ${t.country}`}
                  </Text>
                  <Text style={styles.yearRowDate}>
                    {new Date(t.start_date!).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      <Pressable style={styles.signOut} onPress={signOut}>
        <Text style={styles.signOutText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingTop: 60, paddingBottom: 120, gap: spacing.xl },
  head: { alignItems: 'center' },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarImg: { width: 84, height: 84, borderRadius: 42, marginBottom: spacing.sm, backgroundColor: colors.sandDark },
  avatarText: { fontFamily: fonts.serif, fontSize: 30, color: colors.background },
  name: { fontFamily: fonts.serif, fontSize: 26, color: colors.ink },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.md },
  statBlock: { alignItems: 'center' },
  statNumber: { fontFamily: fonts.sansBold, fontSize: 20, color: colors.ink },
  statLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 9.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.ink55,
    marginTop: 2,
  },
  statDivider: { width: 1, height: 26, backgroundColor: colors.line },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 19, color: colors.ink },
  yearLabel: { fontFamily: fonts.sansBold, fontSize: 12.5, color: colors.sage },
  yearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  yearRowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink },
  yearRowDate: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.ink55 },
  signOut: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  signOutText: { fontFamily: fonts.sansBold, color: colors.ink70, fontSize: 14 },
});
