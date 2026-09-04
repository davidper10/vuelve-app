import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useTrips } from '@/lib/use-trips';
import { useConfirm } from '@/lib/confirm-context';
import { supabase } from '@/lib/supabase';

export default function Perfil() {
  const { session, signOut, deleteAccount } = useAuth();
  const confirm = useConfirm();
  const { trips } = useTrips();
  const [momentsCount, setMomentsCount] = useState<number | null>(null);
  const [fullName, setFullName] = useState('Viajero');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initial = fullName.trim().charAt(0).toUpperCase() || 'A';
  const countries = new Set(trips.map((t) => t.country).filter(Boolean));

  const loadProfile = useCallback(() => {
    if (!session) return;
    supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name ?? 'Viajero');
          setAvatarUrl(data.avatar_url);
        }
      });
  }, [session]);

  // Recarga al volver de "Editar perfil" para reflejar el nombre/foto nuevos.
  useFocusEffect(
    useCallback(() => {
      loadProfile();
      supabase
        .from('moments')
        .select('id', { count: 'exact', head: true })
        .then(({ count }) => setMomentsCount(count ?? 0));
    }, [loadProfile])
  );

  const byYear = new Map<number, typeof trips>();
  for (const t of trips) {
    if (!t.start_date) continue;
    const year = new Date(t.start_date).getFullYear();
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(t);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);

  const onDeleteAccount = async () => {
    const ok = await confirm({
      title: 'Eliminar cuenta',
      message:
        'Esto borrará tu cuenta y todos tus viajes, recuerdos, fotos, diario y tags NFC de forma permanente. No hay vuelta atrás: no podrás recuperar nada de esto.',
      confirmLabel: 'Eliminar mi cuenta',
      destructive: true,
    });
    if (!ok) return;

    setError(null);
    setDeleting(true);
    const { error: err } = await deleteAccount();
    setDeleting(false);
    if (err) {
      setError(err);
      return;
    }
    router.replace('/(auth)/sign-in');
  };

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

      <View style={styles.actions}>
        <Pressable style={styles.actionRow} onPress={() => router.push('/editar-perfil')}>
          <Ionicons name="person-outline" size={17} color={colors.ink70} />
          <Text style={styles.actionRowText}>Editar perfil</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.ink38} />
        </Pressable>
        <Pressable style={[styles.actionRow, styles.actionRowLast]} onPress={() => router.push('/cambiar-contrasena')}>
          <Ionicons name="lock-closed-outline" size={17} color={colors.ink70} />
          <Text style={styles.actionRowText}>Cambiar contraseña</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.ink38} />
        </Pressable>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.signOut} onPress={signOut}>
        <Text style={styles.signOutText}>Cerrar sesión</Text>
      </Pressable>

      <Pressable style={[styles.deleteAccount, deleting && { opacity: 0.5 }]} onPress={onDeleteAccount} disabled={deleting}>
        <Text style={styles.deleteAccountText}>{deleting ? 'Eliminando cuenta…' : 'Eliminar cuenta'}</Text>
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
  actions: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  actionRowLast: { borderBottomWidth: 0 },
  actionRowText: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  error: { fontFamily: fonts.sansMedium, color: colors.terracotta, fontSize: 13, textAlign: 'center' },
  signOut: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  signOutText: { fontFamily: fonts.sansBold, color: colors.ink70, fontSize: 14 },
  deleteAccount: { alignSelf: 'center', paddingVertical: 8 },
  deleteAccountText: { fontFamily: fonts.sansSemiBold, color: colors.terracotta, fontSize: 13 },
});
