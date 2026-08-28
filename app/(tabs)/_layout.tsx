import { Pressable, StyleSheet } from 'react-native';
import { Redirect, router, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { colors, fonts } from '@/constants/theme';

function CenterAddButton() {
  return (
    <Pressable style={styles.centerBtn} onPress={() => router.push('/crear-viaje')}>
      <Ionicons name="add" size={24} color={colors.background} />
    </Pressable>
  );
}

export default function TabsLayout() {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.sage,
        tabBarInactiveTintColor: colors.ink38,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.line,
          height: 84,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontFamily: fonts.sansSemiBold, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="viajes"
        options={{
          title: 'Viajes',
          tabBarIcon: ({ color, size }) => <Ionicons name="bag-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="crear"
        options={{
          title: '',
          tabBarButton: () => <CenterAddButton />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/crear-viaje');
          },
        }}
      />
      <Tabs.Screen
        name="nfc"
        options={{
          title: 'NFC',
          tabBarIcon: ({ color, size }) => <Ionicons name="radio-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginTop: -20,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.background,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    alignSelf: 'center',
  },
});
