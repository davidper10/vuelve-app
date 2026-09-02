import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export default function UnirseATrip() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { session } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !session) return;
    (async () => {
      const { data: share } = await supabase
        .from('trip_shares')
        .select('trip_id, share_mode')
        .eq('public_slug', slug)
        .in('share_mode', ['link', 'nfc'])
        .maybeSingle();

      if (!share) {
        setError('Este enlace no existe o ya no está activo.');
        return;
      }

      const { data: trip } = await supabase.from('trips').select('owner_id').eq('id', share.trip_id).single();
      const isOwner = trip?.owner_id === session.user.id;

      if (!isOwner) {
        const { data: existing } = await supabase
          .from('trip_members')
          .select('id')
          .eq('trip_id', share.trip_id)
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (!existing) {
          // Cualquiera que se une por enlace puede añadir recuerdos.
          await supabase.from('trip_members').insert({
            trip_id: share.trip_id,
            user_id: session.user.id,
            role: 'editor',
          });
        }
      }

      router.replace(`/viaje/${share.trip_id}`);
    })();
  }, [slug, session]);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
        <Text style={{ fontFamily: fonts.serif, fontSize: 22, color: colors.ink, textAlign: 'center' }}>{error}</Text>
        <Pressable
          style={{ backgroundColor: colors.ink, borderRadius: radii.pill, paddingVertical: 12, paddingHorizontal: 24 }}
          onPress={() => router.replace('/')}
        >
          <Text style={{ fontFamily: fonts.sansBold, color: colors.background }}>Ir a Inicio</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.sans, color: colors.ink55 }}>Uniéndote al viaje…</Text>
    </View>
  );
}
