import { LegalPage, type LegalSection } from '@/components/LegalPage';
import { LEGAL } from '@/constants/legal';

const SECTIONS: LegalSection[] = [
  {
    heading: '1. Quién es el responsable y a quién se aplica',
    paragraphs: [
      `El responsable del tratamiento de tus datos en ${LEGAL.appName} es ${LEGAL.controllerName}. Puedes escribirnos en ${LEGAL.contactEmail} para cualquier cuestión sobre privacidad.`,
      'Esta política se aplica a todas las personas que usan la app, residan donde residan, y se interpreta conforme a la normativa de protección de datos que te sea aplicable: por ejemplo, el Reglamento General de Protección de Datos (UE) y la LOPDGDD en España, la Ley 25.326 en Argentina, la Ley 19.628 y la Ley 21.719 en Chile, la Ley 1581 de 2012 en Colombia, la Ley Federal de Protección de Datos Personales en Posesión de los Particulares en México, la Ley 29733 en Perú o la Ley 18.331 en Uruguay, entre otras.',
    ],
  },
  {
    heading: '2. Qué datos recogemos',
    paragraphs: ['Solo tratamos los datos necesarios para que la app funcione. No pedimos datos sensibles (salud, ideología, origen, etc.), aunque el contenido que tú decidas subir, como fotos o notas, puede contenerlos por tu propia iniciativa.'],
    bullets: [
      'Cuenta: correo electrónico, nombre, nombre de usuario y contraseña (almacenada cifrada). Si inicias sesión con Google o Apple, recibimos tu correo y tu nombre.',
      'Perfil: la foto de perfil, si decides añadirla.',
      'Contenido que creas: viajes, recuerdos, fotos y vídeos, notas, entradas de diario, canciones o enlaces asociados y los lugares donde ocurrieron (nombre del lugar y coordenadas).',
      'Imanes NFC: el identificador de la etiqueta que vinculas y el enlace público asociado.',
      'Colaboración: los viajes que compartes y las personas que participan en ellos.',
      'Notificaciones: si las activas, un identificador de tu dispositivo para enviarte avisos y tus preferencias de notificación.',
      'Suscripción: tu identificador de usuario y el estado de tu suscripción. No recibimos tus datos de pago; los gestiona Apple.',
      'Uso de la app: pantallas visitadas e interacciones, asociadas a un identificador y a datos técnicos del dispositivo, para entender qué funciona y qué no.',
      'Errores: informes automáticos de fallos con datos técnicos (modelo de dispositivo, versión del sistema y de la app).',
    ],
  },
  {
    heading: '3. Para qué usamos tus datos y base legal',
    bullets: [
      'Prestarte el servicio (crear tu cuenta, guardar y mostrar tus viajes, sincronizarlos y permitir compartirlos): ejecución del contrato.',
      'Gestionar tu suscripción y las compras: ejecución del contrato.',
      'Enviarte notificaciones y acceder a tu ubicación, fotos o NFC: tu consentimiento, que puedes retirar en cualquier momento desde los ajustes de la app o del sistema.',
      'Detectar y corregir errores, garantizar la seguridad y mejorar la app mediante estadísticas de uso: interés legítimo.',
      'Cumplir obligaciones legales cuando sea necesario.',
      'En los países cuya ley basa el tratamiento de datos en el consentimiento, al crear tu cuenta y aceptar esta política nos autorizas de forma libre, informada e inequívoca a tratar tus datos para las finalidades descritas.',
      'No tomamos decisiones automatizadas con efectos jurídicos sobre ti.',
    ],
  },
  {
    heading: '4. Con quién compartimos tus datos',
    paragraphs: [
      'No vendemos tus datos. Los compartimos únicamente con proveedores que nos ayudan a prestar el servicio, que actúan como encargados del tratamiento:',
    ],
    bullets: [
      'Supabase: alojamiento de la base de datos, la autenticación y los archivos (servidores en la Unión Europea).',
      'RevenueCat: gestión de suscripciones y compras dentro de la app.',
      'PostHog: analítica de uso (servidores en la Unión Europea).',
      'Sentry: informes de errores.',
      'Expo: envío de notificaciones push.',
      'OpenFreeMap y OpenStreetMap (Nominatim): mapas y nombre de los lugares; reciben las zonas del mapa que consultas y las coordenadas que eliges al guardar un lugar.',
      'unpkg: entrega de las librerías que dibujan el mapa.',
      'Apple y Google: inicio de sesión con tu cuenta y, en el caso de Apple, cobro de las suscripciones.',
    ],
  },
  {
    heading: '5. Transferencias internacionales',
    paragraphs: [
      'Tus datos se alojan en la Unión Europea, pero algunos proveedores, como RevenueCat o Expo, pueden tratarlos en otros países, entre ellos Estados Unidos. En esos casos exigimos garantías adecuadas, como las cláusulas contractuales tipo de la Comisión Europea o la adhesión al Marco de Privacidad de Datos UE-EE. UU. Al usar la app aceptas estas transferencias necesarias para prestar el servicio.',
    ],
  },
  {
    heading: '6. Qué ven otras personas',
    bullets: [
      'Las personas con las que compartes un viaje pueden ver su contenido, así como tu nombre y tu foto de perfil.',
      'Los enlaces públicos de un imán NFC muestran el recuerdo o viaje vinculado a cualquiera que abra el enlace.',
      'Las fotos y vídeos se guardan en un almacenamiento al que se accede mediante una dirección directa; quien conozca esa dirección podría verlos. No compartas esas direcciones con personas en las que no confíes.',
    ],
  },
  {
    heading: '7. Cuánto tiempo conservamos tus datos',
    paragraphs: [
      'Conservamos tus datos mientras tu cuenta esté activa. Puedes eliminarla en cualquier momento desde Perfil → Eliminar cuenta: se borran tu perfil, tus viajes, recuerdos y los archivos asociados. Algunas copias de seguridad pueden conservar datos durante un periodo limitado antes de eliminarse definitivamente, y podremos conservar lo estrictamente necesario para cumplir obligaciones legales.',
    ],
  },
  {
    heading: '8. Tus derechos',
    paragraphs: [
      'Tienes derecho a acceder a tus datos, rectificarlos, cancelarlos o suprimirlos, oponerte a su tratamiento, limitarlo, solicitar su portabilidad y revocar en cualquier momento el consentimiento que nos hayas dado (los llamados derechos ARCO y equivalentes). Puedes ejercerlos escribiéndonos al correo indicado arriba; parte de ellos también directamente en la app (editar tu perfil o eliminar tu cuenta). Responderemos sin demora y siempre dentro del plazo que establezca la ley aplicable.',
      'Si consideras que no hemos tratado tus datos correctamente, puedes reclamar ante la autoridad de protección de datos de tu país: por ejemplo, la Agencia Española de Protección de Datos (España), la Agencia de Acceso a la Información Pública (Argentina), la Superintendencia de Industria y Comercio (Colombia), la Autoridad Nacional de Protección de Datos Personales (Perú), la Unidad Reguladora y de Control de Datos Personales (Uruguay) o la autoridad equivalente de tu país.',
    ],
  },
  {
    heading: '9. Permisos del dispositivo',
    paragraphs: ['La app solo te pide los permisos que necesita, y puedes revocarlos en los ajustes del sistema:'],
    bullets: [
      'Fotos: para añadir imágenes a tus recuerdos.',
      'Ubicación (solo mientras usas la app): para guardar dónde ocurrió cada recuerdo.',
      'NFC: para vincular tus recuerdos a objetos físicos.',
      'Notificaciones: para enviarte recordatorios y avisos.',
    ],
  },
  {
    heading: '10. Menores de edad',
    paragraphs: [
      `${LEGAL.appName} está dirigida a personas mayores de 18 años. No recogemos datos de menores de esa edad de forma consciente. Si crees que un menor nos ha facilitado datos, escríbenos y los eliminaremos.`,
    ],
  },
  {
    heading: '11. Seguridad y brechas',
    paragraphs: [
      'Aplicamos medidas técnicas y organizativas razonables para proteger tus datos, como el cifrado de las comunicaciones y el control de acceso a los datos de cada cuenta. Ningún sistema es completamente infalible. Si se produjera una brecha de seguridad que te afecte, te lo comunicaremos, y también a la autoridad competente, en los casos y plazos que exija la ley.',
    ],
  },
  {
    heading: '12. Cambios en esta política',
    paragraphs: [
      'Podemos actualizar esta política para reflejar cambios en la app o en la normativa. Cuando haya cambios importantes te lo indicaremos en la app. La fecha de última actualización aparece al principio de este documento.',
    ],
  },
];

export default function Privacidad() {
  return <LegalPage title="Política de privacidad" sections={SECTIONS} />;
}
