import { useEffect, useState } from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { isOnboardingPending } from '@/lib/onboarding';

export default function AuthLayout() {
  const { session, loading } = useAuth();
  const [pendingOnboarding, setPendingOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session) {
      setPendingOnboarding(null);
      return;
    }
    isOnboardingPending().then(setPendingOnboarding);
  }, [session]);

  if (loading) return null;
  if (session) {
    if (pendingOnboarding === null) return null; // comprobando la marca
    return <Redirect href={pendingOnboarding ? '/onboarding' : '/(tabs)'} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
