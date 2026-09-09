import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '@/constants/theme';
import { NFC_ICONS } from '@/lib/nfc-icons';

export function EmojiPicker({ value, onChange }: { value: string | null; onChange: (icon: string) => void }) {
  return (
    <View style={styles.row}>
      {NFC_ICONS.map((emoji) => (
        <Pressable
          key={emoji}
          style={[styles.item, value === emoji && styles.itemOn]}
          onPress={() => onChange(emoji)}
        >
          <Text style={styles.emoji}>{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  item: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemOn: { borderColor: colors.sage, backgroundColor: colors.sageLight },
  emoji: { fontSize: 20 },
});
