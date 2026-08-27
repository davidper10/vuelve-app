import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth-context';

// Punto de entrada: manda a cada quien a donde le toca según su sesión.
export default function Index() {
  const { session, loading } = useAuth();

  if (loading) return null;
  return <Redirect href={session ? '/(tabs)' : '/(auth)/sign-in'} />;
}
