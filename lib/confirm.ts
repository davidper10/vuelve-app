import { Alert, Platform } from 'react-native';

// Alert.alert() no hace nada en react-native-web (es un stub vacío), así
// que en web hay que usar window.alert o el mensaje nunca aparece.
export function notify(title: string, message: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
