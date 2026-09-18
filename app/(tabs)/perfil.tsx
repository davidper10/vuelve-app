import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, gradientFor, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useTrips, type Trip } from '@/lib/use-trips';
import { useConfirm } from '@/lib/confirm-context';
import { usePremium } from '@/lib/premium-context';
import { presentPaywall } from '@/lib/paywall';
import { supabase } from '@/lib/supabase';
import { flagForCountry } from '@/lib/flags';

function ProfileTripCard({ trip }: { trip: Trip }) {
  const gradient = gradientFor(trip.title);
  const year = trip.start_date ? new Date(trip.start_date).getFullYear() : null;

  return (
    <Pressable
      onPress={() => router.push(`/viaje/${trip.id}`)}
      style={({ pressed }) => [styles.tripCard, pressed && { opacity: 0.9 }]}
    >
      {trip.cover_photo_url ? (
        <Image source={{ uri: trip.cover_photo_url }} style={styles.tripCover} />
      ) : (
        <LinearGradient colors={gradient} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.tripCover} />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(10,6,7,0.75)']}
        locations={[0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      {!!year && (
        <View style={styles.tripYearBadge}>
          <Text style={styles.tripYearText}>{year}</Text>
        </View>
      )}
      <View style={styles.tripInfo}>
        <Text style={styles.tripTitle} numberOfLines={1}>
          {trip.title}
        </Text>
        {!!trip.country && (
          <Text style={styles.tripCountry} numberOfLines={1}>
            {flagForCountry(trip.country) ? `${flagForCountry(trip.country)} ` : ''}
            {trip.country}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export default function Perfil() {
  const insets = useSafeAreaInsets();
  const { session, signOut, deleteAccount } = useAuth();
  const confirm = useConfirm();
  const { isPremium } = usePremium();
  const { trips } = useTrips();
  const [momentsCount, setMomentsCount] = useState<number | null>(null);
  const [fullName, setFullName] = useState('Viajero');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initial = fullName.trim().charAt(0).toUpperCase() || 'A';
  const countries = new Set(trips.map((t) => t.country).filter(Boolean));
  const memberSince = session?.user.created_at ? new Date(session.user.created_at).getFullYear() : null;

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
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
          <Pressable style={styles.cameraBtn} onPress={() => router.push('/editar-perfil')}>
            <Ionicons name="camera" size={14} color={colors.background} />
          </Pressable>
        </View>

        <Text style={styles.name}>{fullName}</Text>
        {!!memberSince && <Text style={styles.memberSince}>Viajero desde {memberSince}</Text>}

        <View style={styles.quoteDivider} />
        <Text style={styles.quote}>"La vida es mejor cuando la vives viajando"</Text>
        <Ionicons name="leaf-outline" size={15} color={colors.sage} style={{ marginTop: 6 }} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="airplane-outline" size={18} color={colors.sageDark} />
          <Text style={styles.statNumber}>{trips.length}</Text>
          <Text style={styles.statLabel}>Viajes</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="earth-outline" size={18} color={colors.sageDark} />
          <Text style={styles.statNumber}>{countries.size}</Text>
          <Text style={styles.statLabel}>Países</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="images-outline" size={18} color={colors.sageDark} />
          <Text style={styles.statNumber}>{momentsCount ?? '—'}</Text>
          <Text style={styles.statLabel}>Recuerdos</Text>
        </View>
      </View>

      {trips.length > 0 && (
        <View style={{ gap: spacing.sm }}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Últimos viajes</Text>
            <Pressable style={styles.seeAllRow} onPress={() => router.push('/viajes')}>
              <Text style={styles.seeAll}>Ver todos</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.sage} />
            </Pressable>
          </View>
          <View style={styles.tripsRow}>
            {trips.slice(0, 2).map((t) => (
              <ProfileTripCard key={t.id} trip={t} />
            ))}
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable style={styles.actionRow} onPress={() => router.push('/editar-perfil')}>
          <Ionicons name="person-outline" size={17} color={colors.ink70} />
          <Text style={styles.actionRowText}>Editar perfil</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.ink38} />
        </Pressable>
        <Pressable style={styles.actionRow} onPress={() => router.push('/cambiar-contrasena')}>
          <Ionicons name="lock-closed-outline" size={17} color={colors.ink70} />
          <Text style={styles.actionRowText}>Cambiar contraseña</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.ink38} />
        </Pressable>
        <Pressable style={[styles.actionRow, styles.actionRowLast]} onPress={() => router.push('/notificaciones')}>
          <Ionicons name="notifications-outline" size={17} color={colors.ink70} />
          <Text style={styles.actionRowText}>Notificaciones</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.ink38} />
        </Pressable>
      </View>

      {!isPremium && (
        <View style={styles.premiumCard}>
          <View style={styles.premiumIconWrap}>
            <Ionicons name="ribbon-outline" size={19} color={colors.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.premiumTitle}>SaveTrip Plus</Text>
            <Text style={styles.premiumBody}>
              Más viajes, más recuerdos, más historias. Lleva tus aventuras al siguiente nivel.
            </Text>
          </View>
          <Pressable style={styles.premiumBtn} onPress={() => presentPaywall()}>
            <Text style={styles.premiumBtnText}>Ver planes</Text>
            <Ionicons name="chevron-forward" size={13} color={colors.background} />
          </Pressable>
        </View>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.signOut} onPress={signOut}>
        <Ionicons name="log-out-outline" size={16} color={colors.terracotta} />
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
  scroll: { paddingBottom: 120, gap: spacing.xl },
  hero: {
    backgroundColor: colors.sageLight,
    alignItems: 'center',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  avatarWrap: { position: 'relative', marginBottom: spacing.sm },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  avatarImg: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.sandDark,
    borderWidth: 3,
    borderColor: colors.background,
  },
  avatarText: { fontFamily: fonts.serif, fontSize: 32, color: colors.background },
  cameraBtn: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.sageDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.sageLight,
  },
  name: { fontFamily: fonts.serif, fontSize: 26, color: colors.ink },
  memberSince: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.ink55, marginTop: 2 },
  quoteDivider: { width: 32, height: 2, borderRadius: 1, backgroundColor: colors.sage, marginTop: spacing.sm, marginBottom: spacing.sm },
  quote: {
    fontFamily: fonts.serifItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: colors.ink70,
    textAlign: 'center',
  },
  statsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.sageLight,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
  },
  statNumber: { fontFamily: fonts.sansBold, fontSize: 19, color: colors.ink },
  statLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10.5,
    color: colors.ink55,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 19, color: colors.ink },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAll: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.sage },
  tripsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  tripCard: {
    flex: 1,
    height: 140,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.sandDark,
  },
  tripCover: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  tripYearBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(20,12,14,0.45)',
    borderRadius: radii.pill,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  tripYearText: { fontFamily: fonts.sansBold, fontSize: 10.5, color: '#FBF3EE' },
  tripInfo: { position: 'absolute', left: 10, right: 10, bottom: 8 },
  tripTitle: { fontFamily: fonts.sansBold, fontSize: 13.5, color: '#FBF3EE' },
  tripCountry: { fontFamily: fonts.sansMedium, fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  actions: {
    marginHorizontal: spacing.lg,
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
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.sageLight,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  premiumIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTitle: { fontFamily: fonts.sansBold, fontSize: 14.5, color: colors.ink },
  premiumBody: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.ink55, marginTop: 2, lineHeight: 15 },
  premiumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.sageDark,
    borderRadius: radii.pill,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  premiumBtnText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.background },
  error: { fontFamily: fonts.sansMedium, color: colors.terracotta, fontSize: 13, textAlign: 'center' },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'center',
    paddingVertical: 13,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.terracotta,
    marginHorizontal: spacing.lg,
  },
  signOutText: { fontFamily: fonts.sansBold, color: colors.terracotta, fontSize: 14 },
  deleteAccount: { alignSelf: 'center', paddingVertical: 8 },
  deleteAccountText: { fontFamily: fonts.sansSemiBold, color: colors.ink38, fontSize: 12.5 },
});
