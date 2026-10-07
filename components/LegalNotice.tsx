import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts } from '@/constants/theme';

export function LegalNotice({ action }: { action: string }) {
  return (
    <Text style={styles.text}>
      {`Al ${action} aceptas los `}
      <Text style={styles.link} onPress={() => router.push('/terminos')}>
        Términos de uso
      </Text>
      {' y la '}
      <Text style={styles.link} onPress={() => router.push('/privacidad')}>
        Política de privacidad
      </Text>
      .
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 17, color: colors.ink55, textAlign: 'center' },
  link: { fontFamily: fonts.sansSemiBold, color: colors.sageDark, textDecorationLine: 'underline' },
});
