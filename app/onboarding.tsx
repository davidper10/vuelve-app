import { useState } from 'react';
import { router } from 'expo-router';
import { OnboardingCarousel } from '@/components/OnboardingCarousel';
import { WelcomeOverview } from '@/components/WelcomeOverview';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export default function Onboarding() {
  const { session } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);

  const finish = async () => {
    if (session) {
      await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', session.user.id);
    }
    router.replace('/(tabs)');
  };

  if (showWelcome) {
    return <WelcomeOverview onContinue={() => setShowWelcome(false)} onSkip={finish} />;
  }

  return <OnboardingCarousel onFinish={finish} />;
}
