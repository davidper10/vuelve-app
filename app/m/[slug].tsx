import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { fetchSharedNfc, type SharedPayload } from '@/lib/shared';
import { AppStoreButton, SharedButton, SharedView } from '@/components/SharedView';

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

// Punto de entrada al tocar un NFC físico o abrir el enlace público
// (app.json ya registra https://www.savetrip-app.com/m/* y el scheme
// vuelve:// para que el sistema operativo abra esta ruta). Quien es dueño o
// miembro del viaje entra directo a él; el resto ve el recuerdo o viaje
// vinculado en solo lectura.
export default function ResolverNfc() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { session, loading: authLoading } = useAuth();
  const [data, setData] = useState<SharedPayload | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'empty'>('loading');

  useEffect(() => {
    if (!slug || authLoading) return;
    let cancelled = false;
    fetchSharedNfc(slug).then((payload) => {
      if (cancelled) return;
      if (!payload) return setState('missing');
      if (payload.kind === 'empty' && !('trip' in payload)) return setState('empty');
      const shared = payload as SharedPayload;
      supabase.functions.invoke('send-push', { body: { type: 'nfc_scanned', tagId: shared.tag_id } }).catch(() => {});
      if (shared.viewer_role) {
        if (shared.kind === 'moment' && shared.moments[0]) router.replace(`/momento/${shared.moments[0].id}`);
        else router.replace(`/viaje/${shared.trip.id}`);
        return;
      }
      setData(shared);
      setState('ready');
    });
    return () => {
      cancelled = true;
    };
  }, [slug, authLoading, session?.user.id]);

  if (state === 'missing') return <Message text="Este enlace no existe o ha sido desactivado." />;
  if (state === 'empty') return <Message text="Este NFC no tiene ningún contenido vinculado todavía." />;
  if (state !== 'ready' || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.ink55} />
      </View>
    );
  }

  return (
    <SharedView
      data={data}
      content
      actions={
        <>
          {Platform.OS === 'web' ? (
            <SharedButton variant="secondary" icon="phone-portrait-outline" label="Abrir en SaveTrip" onPress={() => Linking.openURL(`vuelve://m/${slug}`)} />
          ) : null}
          <AppStoreButton />
          {session ? null : <SharedButton variant="secondary" label="Iniciar sesión" onPress={() => router.push('/(auth)/sign-in')} />}
        </>
      }
    />
  );
}
