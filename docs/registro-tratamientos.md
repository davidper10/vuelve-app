# Registro de tratamientos de datos — SaveTrip

Responsable: David Pérez-Sevilla Pérez-Medrano · Última revisión: 7 de octubre de 2026

Borrador técnico basado en el código real de la app. Los plazos de los proveedores
marcados como "confirmar" deben comprobarse en sus paneles, y el conjunto debe
revisarlo un profesional antes de publicar.

## Tratamientos

| Dato | Finalidad | Base legal | Plazo | Destinatario | Ubicación |
|---|---|---|---|---|---|
| Email, nombre, usuario, contraseña (cifrada) | Cuenta e inicio de sesión | Ejecución del contrato | Hasta eliminar la cuenta | Supabase | Irlanda (UE) |
| Fotos, vídeos, notas, diario, lugares y coordenadas | Servicio principal (guardar y mostrar recuerdos) | Contrato; ubicación y fotos con consentimiento (permiso del sistema) | Hasta eliminar la cuenta o el viaje | Supabase | Irlanda (UE) |
| Etiquetas NFC (identificador y enlace público) | Abrir recuerdos desde un imán | Ejecución del contrato | Hasta eliminar la etiqueta o la cuenta | Supabase | Irlanda (UE) |
| Token push y preferencias de notificación | Enviar avisos | Consentimiento | Hasta eliminar la cuenta | Expo, Supabase | EE. UU. / Irlanda |
| ID de usuario y estado de suscripción | Gestionar SaveTrip Pro | Ejecución del contrato | Mientras exista el registro (ver pendiente 1) | RevenueCat, Apple | EE. UU. |
| Pantallas visitadas, dispositivo, IP | Analítica de uso | Interés legítimo | Según plan de PostHog (confirmar) | PostHog | UE |
| Errores y datos técnicos del dispositivo | Detectar y corregir fallos | Interés legítimo | Según plan de Sentry (confirmar) | Sentry | UE |
| Zona del mapa consultada y coordenadas del lugar elegido | Mostrar el mapa y el nombre del lugar | Ejecución del contrato | Sin conservación por nuestra parte (confirmar con el proveedor) | OpenFreeMap, OpenStreetMap (Nominatim), unpkg | UE / EE. UU. (confirmar) |

## Datos que la app NO recoge

Teléfono, dirección postal, contactos, cámara (solo galería), micrófono, datos de
salud, datos bancarios (los gestiona Apple) ni contenido de IA o chatbots.

## Identificación en los SDK

- **PostHog:** no se llama a `identify()`; los eventos van con un identificador
  anónimo. Solo se registran pantallas (`captureScreens` manual); el autocapture
  de toques está desactivado explícitamente.
- **Sentry:** `sendDefaultPii` no está activado, así que no se envían datos
  personales por defecto.
- **RevenueCat:** el identificador de usuario es el UUID de Supabase (seudónimo).

## Medidas de minimización aplicadas

- Autocapture de toques de PostHog desactivado (podía enviar el texto de los
  botones pulsados, como nombres de viajes o lugares).
- Eliminado el permiso `RECORD_AUDIO` de Android, que la app no usa.
- Eliminada la columna `trip_members.invited_email` (guardaba emails de terceros
  y ningún flujo la escribía).
- Cerrado el listado público del almacenamiento de fotos: ya no se pueden
  enumerar los archivos sin iniciar sesión.

## Pendientes

1. **Supresión en RevenueCat:** `delete-account` borra Supabase, pero no el
   registro del usuario en RevenueCat. Requiere llamar a su API de borrado con
   una clave secreta.
2. **Metadatos de fotos y vídeos:** no se limpian al subir. Si contienen GPS, se
   expone en las URLs públicas. Hay que comprobarlo y, si procede, eliminarlos
   antes de subir.
3. **Plazos de PostHog y Sentry:** confirmar su retención y reflejarla en la
   política de privacidad.
4. **Etiquetas de privacidad de App Store Connect:** declarar email, nombre,
   ID de usuario, fotos y vídeos, ubicación precisa y compras como datos
   vinculados al usuario; diagnósticos y uso de la app como no vinculados.
