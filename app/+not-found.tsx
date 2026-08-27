import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { colors, fonts, spacing } from '@/constants/theme';

export default function NotFound() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Esta pantalla no existe</Text>
      <Link href="/(tabs)" style={styles.link}>
        <Text style={styles.linkText}>Volver al inicio</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  title: { fontFamily: fonts.serif, fontSize: 24, color: colors.ink, marginBottom: spacing.md },
  link: { paddingVertical: 10 },
  linkText: { fontFamily: fonts.sansBold, color: colors.terracotta, fontSize: 15 },
});
