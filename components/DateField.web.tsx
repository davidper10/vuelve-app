import type { CSSProperties } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii, spacing } from '@/constants/theme';

type Props = {
  label: string;
  value: string; // 'YYYY-MM-DD' o ''
  onChange: (value: string) => void;
  placeholder?: string;
};

// Usa el <input type="date"> nativo del navegador: ya trae su propio
// selector de calendario, sin depender de @react-native-community/
// datetimepicker (que no tiene implementación web).
export function DateField({ label, value, onChange }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={webInputStyle}
      />
    </View>
  );
}

const webInputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: `1px solid ${colors.line}`,
  background: colors.card,
  borderRadius: radii.sm,
  padding: '13px 15px',
  fontFamily: fonts.sans,
  fontSize: 15,
  color: colors.ink,
  outline: 'none',
};

const styles = StyleSheet.create({
  field: { marginBottom: spacing.md },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.ink70, marginBottom: 6 },
});
