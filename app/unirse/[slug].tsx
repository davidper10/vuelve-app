import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { fetchSharedTrip, joinTrip, setPendingJoin, type SharedPayload } from '@/lib/shared';
import { AppStoreButton, SharedButton, SharedView } from '@/components/SharedView';

const JOIN_ERRORS = {
  full: 'Este álbum colaborativo ya está completo. Pídele a quien lo creó que pase a SaveTrip Pro para añadir más personas.',
  view_only: 'Este enlace es solo para ver el viaje.',
  not_found: 'Este enlace no existe o ya no está activo.',
  auth: 'Inicia sesión para unirte al viaje.',
} as const;

function Message({ text }: { text: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
      <Text style={{ fontFamily: fonts.serif, fontSize: 22, color: colors.ink, textAlign: 'center' }}>{text}</Text>
      <Pressable
        style={{ backgroundColor: colors.ink, borderRadius: radii.pill, paddingVertical: 12, paddingHorizontal: 24 }}
        onPress={() => router.replace('/')}
      >
        <Text style={{ fontFamily: fonts.sansBold, color: colors.background }}>Ir a Inicio</Text>
      </Pressable>
    </View>
  );
}

// Enlace de un viaje compartido. Según lo que eligió quien lo creó:
//  - "Solo ver": cualquiera ve el viaje, con o sin cuenta.
//  - "Colaborar": se ve una vista previa y hay que tener cuenta para unirse.
export default function UnirseATrip() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { session, loading: authLoading } = useAuth();
  const [data, setData] = useState<SharedPayload | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || authLoading) return;
    let cancelled = false;
    fetchSharedTrip(slug).then((payload) => {
      if (cancelled) return;
      if (payload?.viewer_role) {
        // Ya es del viaje (dueño o miembro): directo al viaje.
        router.replace(`/viaje/${payload.trip.id}`);
        return;
      }
      setData(payload);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [slug, authLoading, session?.user.id]);

  async function join() {
    if (!slug) return;
    setJoining(true);
    setError(null);
    const result = await joinTrip(slug);
    if (result.trip_id) {
      if (result.joined) {
        supabase.functions
          .invoke('send-push', { body: { type: 'member_joined', tripId: result.trip_id } })
          .catch(() => {});
      }
      router.replace(`/viaje/${result.trip_id}`);
      return;
    }
    setJoining(false);
    setError(JOIN_ERRORS[result.error ?? 'not_found']);
  }

  async function goSignIn() {
    if (slug && data?.mode === 'collab') await setPendingJoin(slug);
    router.push('/(auth)/sign-in');
  }

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.ink55} />
      </View>
    );
  }
  if (!data) return <Message text="Este enlace no existe o ya no está activo." />;

  const collab = data.mode === 'collab';
  const openInApp = Platform.OS === 'web' ? (
    <SharedButton variant="secondary" icon="phone-portrait-outline" label="Abrir en SaveTrip" onPress={() => Linking.openURL(`vuelve://unirse/${slug}`)} />
  ) : null;

  const actions = session ? (
    collab ? (
      <>
        <SharedButton label={joining ? 'Uniéndote…' : 'Unirme al viaje'} icon="people-outline" onPress={join} />
        {openInApp}
        <AppStoreButton />
      </>
    ) : (
      <>
        <SharedButton variant="secondary" label="Ir a mis viajes" onPress={() => router.replace('/')} />
        {openInApp}
        <AppStoreButton />
      </>
    )
  ) : (
    <>
      {collab ? (
        <SharedButton label="Crear cuenta o iniciar sesión para unirme" icon="people-outline" onPress={goSignIn} />
      ) : (
        <SharedButton variant="secondary" label="Iniciar sesión" onPress={goSignIn} />
      )}
      {openInApp}
      <AppStoreButton />
    </>
  );

  return (
    <SharedView
      data={data}
      content={!collab}
      actions={actions}
      note={
        error ??
        (collab
          ? 'Es un álbum colaborativo: al unirte podrás ver y añadir recuerdos.'
          : undefined)
      }
    />
  );
}
