import { Redirect } from 'expo-router';

// Nunca se renderiza: el botón central de la barra de pestañas intercepta
// tabPress y navega a /crear-viaje. Esta ruta solo existe para que Expo
// Router tenga un archivo que resolver para ese Tabs.Screen.
export default function CrearTabPlaceholder() {
  return <Redirect href="/crear-viaje" />;
}
