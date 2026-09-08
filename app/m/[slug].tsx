import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

// Punto de entrada al tocar un NFC físico o abrir el enlace público
// (app.json ya registra https://savetrip.vercel.app/m/* y el scheme
// vuelve:// para que el sistema operativo abra esta ruta). Resuelve el
// public_slug a su viaje o momento y navega ahí; si el usuario no tiene
// acceso, esa pantalla mostrará su propio estado vacío/de carga.
export default function ResolverNfc() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from('nfc_tags')
        .select('link_type, trip_id, moment_id, status')
        .eq('public_slug', slug)
        .eq('status', 'active')
        .maybeSingle();

      if (!data) {
        setError('Este enlace no existe o ha sido desactivado.');
        return;
      }
      if (data.link_type === 'moment' && data.moment_id) {
        router.replace(`/momento/${data.moment_id}`);
      } else if (data.trip_id) {
        router.replace(`/viaje/${data.trip_id}`);
      } else {
        setError('Este NFC no tiene ningún contenido vinculado todavía.');
      }
    })();
  }, [slug]);

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
      <Text style={{ fontFamily: fonts.sans, color: colors.ink55 }}>Abriendo…</Text>
    </View>
  );
}
