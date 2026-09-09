import AsyncStorage from '@react-native-async-storage/async-storage';

// Marca en el dispositivo (no en el servidor) que la próxima vez que esta
// cuenta consiga sesión debe ver el onboarding. Se pone al registrarse y se
// quita al terminar/saltar el onboarding -- así solo se ve una vez, justo
// tras confirmar el email y entrar por primera vez.
const KEY = 'pendingOnboarding';

export const markOnboardingPending = () => AsyncStorage.setItem(KEY, 'true');
export const clearOnboardingPending = () => AsyncStorage.removeItem(KEY);
export const isOnboardingPending = async () => (await AsyncStorage.getItem(KEY)) === 'true';
