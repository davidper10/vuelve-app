import { LegalPage, type LegalSection } from '@/components/LegalPage';
import { LEGAL } from '@/constants/legal';

const SECTIONS: LegalSection[] = [
  {
    heading: '1. Aceptación',
    paragraphs: [
      `Al crear una cuenta o usar ${LEGAL.appName} aceptas estos términos y nuestra Política de privacidad. Si no estás de acuerdo, no uses la app.`,
    ],
  },
  {
    heading: '2. Tu cuenta',
    paragraphs: [
      'Eres responsable de mantener la confidencialidad de tu contraseña y de la actividad que se realice desde tu cuenta. Debes facilitar datos veraces y ser mayor de 18 años (o tener la mayoría de edad legal en tu país, si es superior). Puedes eliminar tu cuenta en cualquier momento desde Perfil → Eliminar cuenta.',
    ],
  },
  {
    heading: '3. Tu contenido',
    paragraphs: [
      'Tus fotos, notas y recuerdos son tuyos. Nos concedes únicamente el permiso necesario para almacenarlos, procesarlos y mostrarlos a ti y a las personas con las que decidas compartirlos, con el fin de prestar el servicio. Eres responsable del contenido que subes y de contar con los derechos necesarios sobre él.',
      'No puedes subir contenido ilegal, que vulnere derechos de terceros, ofensivo o que invada la privacidad de otras personas sin su consentimiento. Podemos eliminar contenido o suspender cuentas que incumplan estas normas.',
    ],
  },
  {
    heading: '4. Compartir y colaborar',
    paragraphs: [
      'Cuando compartes un viaje o un enlace, las personas que lo reciben pueden ver su contenido. Compartir es una decisión tuya: revisa con quién lo haces. Los enlaces públicos de los imanes NFC son accesibles para cualquiera que los abra.',
    ],
  },
  {
    heading: '5. Plan gratuito y SaveTrip Pro',
    paragraphs: [
      `${LEGAL.appName} ofrece un plan gratuito con límites de uso (por ejemplo, en número de viajes, imanes NFC, colaboradores y fotos) y una suscripción de pago, SaveTrip Pro, que los amplía. El precio y la duración de cada plan se muestran en la pantalla de suscripción antes de contratar.`,
    ],
    bullets: [
      'El pago se carga en tu cuenta de Apple al confirmar la compra.',
      'La suscripción se renueva automáticamente salvo que la canceles al menos 24 horas antes de que termine el periodo en curso.',
      'Puedes gestionar o cancelar la suscripción en cualquier momento desde los ajustes de tu cuenta de Apple (Ajustes → tu nombre → Suscripciones).',
      'Cancelar no genera reembolso del periodo ya pagado; mantendrás el acceso hasta que termine. Los reembolsos los gestiona Apple conforme a sus condiciones.',
      'Puedes recuperar una compra anterior con la opción "Restaurar compras" de la pantalla de suscripción.',
      'Los precios se muestran en tu moneda local e incluyen, cuando corresponda, los impuestos aplicables en tu país; Apple se encarga de calcularlos y cobrarlos.',
    ],
  },
  {
    heading: '6. Propiedad intelectual',
    paragraphs: [
      `La app ${LEGAL.appName}, su diseño, marca, ilustraciones y código pertenecen a su titular y están protegidos por la legislación aplicable. No puedes copiarlos, modificarlos ni distribuirlos sin autorización.`,
    ],
  },
  {
    heading: '7. Disponibilidad y cambios',
    paragraphs: [
      'Nos esforzamos por que la app funcione de forma continua, pero no garantizamos que esté libre de interrupciones o errores. Podemos modificar o retirar funciones, y actualizar estos términos; si los cambios son relevantes te avisaremos en la app.',
    ],
  },
  {
    heading: '8. Limitación de responsabilidad',
    paragraphs: [
      'Haz copias de lo que no quieras perder. En la medida permitida por la ley, no respondemos de daños indirectos ni de pérdidas de datos derivadas del uso de la app o de fallos fuera de nuestro control. Esto no limita los derechos que la ley reconoce a los consumidores.',
    ],
  },
  {
    heading: '9. Ley aplicable y consumidores',
    paragraphs: [
      'Estos términos se rigen por la legislación española, sin perjuicio de las normas imperativas de protección de los consumidores y usuarios del país en el que residas, que seguirán siendo aplicables y que prevalecerán si te otorgan mayor protección. Los derechos que te reconoce la ley como consumidor no quedan limitados por estos términos.',
      'Si tienes un problema, escríbenos primero para intentar resolverlo. En cualquier caso podrás acudir a las autoridades de consumo y a los tribunales de tu país de residencia.',
    ],
  },
  {
    heading: '10. Contacto',
    paragraphs: [`Para cualquier duda sobre estos términos escríbenos a ${LEGAL.contactEmail}.`],
  },
];

export default function Terminos() {
  return <LegalPage title="Términos de uso" sections={SECTIONS} />;
}
