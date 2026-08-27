# Vuelve

App de viajes y recuerdos: crea viajes, construye recuerdos visuales, asócialos
a NFC y revívelos / compártelos. Construida con **Expo (SDK 55, Expo Router
v7)** + **Supabase** (auth, base de datos, storage).

## Antes de arrancar — instala las dependencias

Este proyecto se generó sin ejecutar `npm install` (el entorno donde se
escribió el código no tenía acceso a la registry de npm). Desde tu Mac, en
esta carpeta:

```bash
npm install
npx expo install --fix
```

El segundo comando le pide a Expo que revise `package.json` y ajuste
cualquier versión que no encaje exactamente con SDK 55 — es la forma oficial
de corregir versiones sin tener que adivinarlas a mano.

Después arranca el proyecto:

```bash
npx expo start
```

## Supabase

Ya existe un proyecto Supabase real llamado **vuelve-app** (organización
`davidper10's Org`, región `eu-west-1`), con el esquema completo aplicado:
`profiles`, `trips`, `trip_members`, `trip_shares`, `memories`, `moments`,
`moment_memories`, `diary_entries`, `nfc_tags`, RLS en todas las tablas, y un
bucket de Storage `memories` para fotos/vídeos/audios.

Las credenciales ya están en `.env` (no se sube a git). Si algún día migras a
otro proyecto, copia `.env.example` a `.env` y rellena tus propios valores.

El histórico de migraciones SQL vive en `supabase/migrations/` para que
tengas el porqué de cada tabla y política documentado y versionado. Si en
algún momento instalas la [CLI de Supabase](https://supabase.com/docs/guides/cli)
y haces `supabase link`, podrás seguir aplicando cambios de esquema con
`supabase db push` en vez de SQL suelto.

## Estructura

```
app/
  _layout.tsx           Providers + Stack raíz (fuentes, Auth)
  index.tsx              Redirige según haya sesión o no
  (auth)/                Entrar / crear cuenta
  (tabs)/                Inicio · Viajes · NFC · Perfil (las 4 tabs)
  viaje/[id].tsx          Interior de un viaje (Recuerdos/Mapa/Diario/NFC)
  momento/[id].tsx        Detalle de un momento
  crear-viaje.tsx         Formulario de alta de viaje (modal)
  vincular-nfc.tsx        Flujo de vinculación de un NFC (modal)
lib/
  supabase.ts             Cliente de Supabase (con AsyncStorage)
  auth-context.tsx        Sesión + sign in/up/out
  use-trips.ts             Hook de lectura de viajes
  database.types.ts        Tipos generados desde el esquema real
constants/theme.ts        Paleta, tipografía, radios — misma que las mockups
supabase/migrations/       Historial SQL del esquema
```

## NFC — importante

`react-native-nfc-manager` **no funciona dentro de Expo Go**: necesita
código nativo. Para probar la pantalla "Vincular NFC" de verdad en un
dispositivo con NFC:

```bash
npx expo run:ios      # o
npx expo run:android
```

(o genera un dev client con [EAS Build](https://docs.expo.dev/develop/development-builds/introduction/)
si no quieres compilar en local). Mientras tanto, la pantalla detecta que no
hay soporte nativo y te lo dice con un aviso en vez de fallar en silencio.

## Qué falta por construir (siguientes pasos razonables)

- **Mapa interactivo** en la pestaña "Mapa" del viaje — instala
  `react-native-maps` (o `expo-maps`, todavía en alpha) y sustituye el texto
  placeholder en `app/viaje/[id].tsx`.
- **Selector de fechas real** en "Crear viaje" (hoy son campos de texto
  `AAAA-MM-DD`) — `@react-native-community/datetimepicker`.
- **Subida de fotos/vídeos** al bucket `memories` de Storage (con
  `expo-image-picker` + `supabase.storage.from('memories').upload(...)`) y
  la creación de `moments`/`memories` desde la app — de momento el esquema y
  las políticas ya están listos, falta la UI de subida.
- **Viajes colaborativos**: la tabla `trip_members` y las políticas ya
  existen; falta la pantalla de invitar personas.
- **Compartir por enlace/NFC fuera de la app**: monta una app web (Next.js)
  o una Edge Function que resuelva `nfc_tags.public_slug` → datos del viaje,
  para cuando alguien sin la app escanee un NFC.
- **Modo historia / Travel Wrapped**: son las pantallas más "show" del
  producto (ver el prototipo de diseño) — de momento no tienen pantalla real
  en el código, solo existían como mockup.
- **Iconos/splash**: son placeholders generados por mí con la paleta de la
  marca (compás sobre fondo salvia) en `assets/images/` — sustitúyelos
  cuando tengas los definitivos.
