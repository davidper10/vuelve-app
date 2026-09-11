import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { PostHogProvider } from 'posthog-react-native';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts as useInterFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  useFonts as useSerifFonts,
  DMSerifDisplay_400Regular,
  DMSerifDisplay_400Regular_Italic,
} from '@expo-google-fonts/dm-serif-display';
import { AuthProvider } from '@/lib/auth-context';
import { PremiumProvider } from '@/lib/premium-context';
import { NotificationsProvider } from '@/lib/notifications-context';
import { ConfirmProvider } from '@/lib/confirm-context';
import { WelcomeOverview } from '@/components/WelcomeOverview';
import { colors } from '@/constants/theme';

type Stage = 'welcome' | 'app';

SplashScreen.preventAutoHideAsync().catch(() => {});

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: __DEV__,
});

function RootLayout() {
  const [interLoaded] = useInterFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [serifLoaded] = useSerifFonts({
    DMSerifDisplay_400Regular,
    DMSerifDisplay_400Regular_Italic,
  });
  const fontsLoaded = interLoaded && serifLoaded;
  const [stage, setStage] = useState<Stage>('welcome');

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PostHogProvider
        apiKey={process.env.EXPO_PUBLIC_POSTHOG_KEY}
        options={{ host: process.env.EXPO_PUBLIC_POSTHOG_HOST }}
        autocapture
      >
        <SafeAreaProvider>
          <AuthProvider>
            <PremiumProvider>
              <NotificationsProvider>
                <ConfirmProvider>
                  {stage === 'app' && (
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: colors.background },
                      }}
                    >
                      <Stack.Screen name="(auth)" />
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen name="viaje/[id]" />
                      <Stack.Screen name="momento/[id]" />
                      <Stack.Screen name="crear-viaje" options={{ presentation: 'modal' }} />
                      <Stack.Screen name="vincular-nfc" options={{ presentation: 'modal' }} />
                      <Stack.Screen name="seleccionar-lugar" options={{ presentation: 'modal' }} />
                    </Stack>
                  )}
                  {stage === 'welcome' && <WelcomeOverview onContinue={() => setStage('app')} />}
                </ConfirmProvider>
              </NotificationsProvider>
            </PremiumProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </PostHogProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
