import { useEffect, useState } from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export default function AuthLayout() {
  const { session, loading } = useAuth();
  const [pendingOnboarding, setPendingOnboarding] = useState<boolean | null>(null);

  // El onboarding está ligado a la cuenta (columna en `profiles`), no al
  // dispositivo: así, si se borra la cuenta y se crea una nueva, siempre
  // vuelve a aparecer, sin importar el método de registro (email/Google/Apple).
  useEffect(() => {
    if (!session) {
      setPendingOnboarding(null);
      return;
    }
    supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setPendingOnboarding(!data?.onboarding_completed));
  }, [session]);

  if (loading) return null;
  if (session) {
    if (pendingOnboarding === null) return null; // comprobando la marca
    return <Redirect href={pendingOnboarding ? '/onboarding' : '/(tabs)'} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
