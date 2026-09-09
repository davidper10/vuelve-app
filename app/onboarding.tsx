import { router } from 'expo-router';
import { OnboardingCarousel } from '@/components/OnboardingCarousel';
import { clearOnboardingPending } from '@/lib/onboarding';

export default function Onboarding() {
  const finish = async () => {
    await clearOnboardingPending();
    router.replace('/(tabs)');
  };

  return <OnboardingCarousel onFinish={finish} />;
}
