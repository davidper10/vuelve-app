import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { LEGAL } from '@/constants/legal';
import { safeBack } from '@/lib/navigation';

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export function LegalPage({ title, sections }: { title: string; sections: LegalSection[] }) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xxl }]}
    >
      <View style={styles.column}>
        <Pressable style={styles.backBtn} onPress={() => safeBack('/')} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </Pressable>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.updated}>Última actualización: {LEGAL.updatedAt}</Text>

        {sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.heading}>{section.heading}</Text>
            {section.paragraphs?.map((p) => (
              <Text key={p} style={styles.paragraph}>
                {p}
              </Text>
            ))}
            {section.bullets?.map((b) => (
              <View key={b} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={[styles.paragraph, styles.bulletText]}>{b}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.lg, alignItems: 'center' },
  column: { width: '100%', maxWidth: 720 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sand,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.lg,
  },
  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.ink },
  updated: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.ink55, marginTop: spacing.xs, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  heading: { fontFamily: fonts.serif, fontSize: 19, color: colors.ink, marginBottom: spacing.sm },
  paragraph: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 22, color: colors.ink70, marginBottom: spacing.sm },
  bulletRow: { flexDirection: 'row', gap: spacing.sm },
  bulletDot: { fontFamily: fonts.sansBold, fontSize: 14.5, lineHeight: 22, color: colors.sageDark },
  bulletText: { flex: 1 },
});
