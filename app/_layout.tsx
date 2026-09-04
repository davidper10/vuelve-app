import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
import { ConfirmProvider } from '@/lib/confirm-context';
import { colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
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

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ConfirmProvider>
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
        </ConfirmProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
