# Transfer Black — App de pasajeros

Aplicación móvil del pasajero. React Native + Expo + TypeScript, estilos con NativeWind (Tailwind CSS).

El backend está en otro repositorio ([Facu-18/Transfer-Black](https://github.com/Facu-18/Transfer-Black), carpeta `backend/`), junto con la especificación del producto. La app consume el backend desplegado; su contrato se lee en [`/docs`](https://transfer-black-api.onrender.com/docs).

La app de conductores compartirá la misma arquitectura base y los mismos Design Tokens: cualquier diferencia de configuración entre los dos proyectos tiene que quedar documentada acá.

## Entorno

Versiones con las que se configuró el proyecto:

| Herramienta | Versión |
|---|---|
| Node.js | 22.x LTS (probado con 22.23.1) |
| npm | 10.9.8 |
| Git | 2.45 |
| Expo SDK | 57 (`expo ~57.0.22`) |
| React Native | 0.86.3 |
| React | 19.2.3 |
| TypeScript | 6.0 |
| NativeWind | 4.2.6 |
| Tailwind CSS | 3.4.x (NativeWind 4 no soporta Tailwind 4) |
| react-native-reanimated | 4.5.1 (requerido por NativeWind) |
| JDK | 17 (Temurin 17.0.17) — solo para compilar Android nativo |
| Android SDK | Android Studio con un AVD o un dispositivo con depuración USB |

No hace falta instalar Expo CLI global: se usa con `npx expo`.

**Expo Go**: la app no usa módulos nativos fuera del SDK, así que corre en Expo Go (versión para SDK 57, desde la tienda del teléfono).

Las dependencias nativas se agregan siempre con `npx expo install <paquete>`, que elige la versión compatible con el SDK. `npx expo-doctor` verifica que no haya desajustes.

## Inicio

```bash
npm install
cp .env.example .env
npx expo start
```

Con Metro levantado: `a` abre en el emulador Android, `i` en el simulador iOS (solo macOS), o escanear el QR con Expo Go.

| Comando | Qué hace |
|---|---|
| `npx expo start` / `npm start` | Servidor de desarrollo (Metro) |
| `npm run android` | Metro + abre la app en Expo Go en Android |
| `npm run ios` | Metro + abre la app en Expo Go en iOS (macOS) |
| `npm run android:build` | Compila e instala la app nativa de Android (`expo run:android`, requiere JDK 17 + Android SDK) |
| `npm run ios:build` | Compila la app nativa de iOS (`expo run:ios`, requiere macOS + Xcode) |
| `npm run typecheck` | Verificación de tipos |
| `npx expo start --clear` | Arranca limpiando la caché de Metro: usarlo si un cambio en `tailwind.config.js` no se refleja |

`android/` e `ios/` se generan con prebuild y están en `.gitignore`: no se versionan.

## Variables de entorno

`.env.example` lista las variables; se copia como `.env` (ignorado por Git).

Expo solo expone al código las variables con prefijo `EXPO_PUBLIC_`, y las **escribe en el bundle**: cualquiera que tenga la app puede leerlas. Nunca poner tokens, credenciales ni secretos. Se leen con acceso literal (`process.env.EXPO_PUBLIC_API_URL`); ver `src/core/api/api-config.ts`.

| Variable | Para qué |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL base del backend, con `/api/v1` |
| `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY` | Key del Maps SDK for Android (ver "Mapa y ubicación" más abajo); queda en el bundle, por eso se restringe por paquete + SHA-1 en Google Cloud Console, no por dominio. Sin ella el mapa de Android funciona pero sin tiles de Google. iOS no la necesita: usa Apple Maps |
| `EXPO_PUBLIC_SENTRY_DSN` | DSN del proyecto de Sentry (ver "Monitoreo de errores" más abajo). Sin ella, Sentry queda desactivado |
| `EXPO_PUBLIC_SENTRY_ENABLE_DEV` | `true` para activar Sentry en desarrollo (`__DEV__`) y poder probar el envío a mano; cualquier otro valor (o ausente) lo deja desactivado en desarrollo aunque haya DSN |
| `EXPO_PUBLIC_TERMS_URL` | URL de los Términos de Servicio; sin ella se usa la del panel por defecto |
| `EXPO_PUBLIC_PRIVACY_URL` | URL de la Política de Privacidad; sin ella se usa la del panel por defecto |

En un teléfono físico `localhost` apunta al propio teléfono: usar la IP de la PC en la red local. Después de cambiar `.env`, reiniciar Metro.

`SENTRY_ORG` y `SENTRY_PROJECT` (de build, no `EXPO_PUBLIC_*`: no hace falta que viajen en el bundle) y el secreto `SENTRY_AUTH_TOKEN` se configuran en EAS, no en `.env`; ver "Monitoreo de errores" más abajo.

## Arquitectura

Hexagonal simplificada, en tres capas:

```text
src/
├── app/                Rutas de Expo Router (archivos finos que solo renderizan una screen)
├── core/               Qué hace la app, sin React Native
│   ├── actions/        Casos de uso: una función por operación (ej. registrar un pasajero)
│   └── api/            Clientes HTTP (backend, proveedor de lugares), configuración y errores normalizados
├── infrastructure/     Cómo se traducen y guardan los datos externos
│   ├── interfaces/     Tipos de las respuestas de la API y de los modelos de la app
│   ├── mappers/        Conversión respuesta de API ⇄ modelo de la app
│   └── storage/        Almacenamiento del dispositivo (SecureStore para tokens, AsyncStorage para recientes)
└── presentation/       Lo que ve y toca el usuario
    ├── components/     Componentes reutilizables
    ├── hooks/          Hooks de UI (formularios, llamadas a actions)
    ├── screens/        Pantallas
    ├── store/          Estado global con Zustand (sesión)
    ├── theme/          Paleta de colores
    └── utils/          Helpers de UI compartidos (mensajes de error, campos de formulario)
```

Reglas:

- `core` no importa nada de `presentation` ni de `react-native`.
- Las pantallas no llaman a la API directamente: usan un hook, que llama a una action, que usa `core/api` y los mappers.
- Los archivos de `src/app/` no tienen lógica: exportan la pantalla de `presentation/screens`.
- Las respuestas de la API (snake_case, forma del backend) no llegan a los componentes: se mapean antes a las interfaces de la app.
- Las carpetas se agregan cuando una funcionalidad concreta las necesita, no por adelantado.

Imports con alias `@/` → `src/` (configurado en `tsconfig.json`; Metro lo resuelve solo):

```ts
import { Typography } from '@/presentation/components/Typography';
```

TypeScript en modo `strict`. No usar `any`; si un caso lo exige, justificarlo con un comentario al lado.

## Design Tokens

Los colores viven en `src/presentation/theme/colors.js` y el resto en `tailwind.config.js`, que importa esa paleta. Los dos archivos son idénticos en la app de conductores.

### Colores

| Token | Valor | Uso |
|---|---|---|
| `obsidian` | `#0A0A0C` | Fondo |
| `gold` | `#D4AF37` | Acciones y acentos |
| `platinum` | `#E4E4E5` | Texto principal |
| `ash` | `#8E8E93` | Texto secundario |
| `charcoal` | `#2C2C2E` | Bordes |
| `surface` | `#141416` | Tarjetas y contenedores de formulario |
| `field` | `#1A1A1C` | Fondo de inputs |
| `danger` | `#F87171` | Mensajes de error |

Se usan con cualquier utilidad de color y admiten opacidad: `bg-obsidian`, `text-gold`, `border-charcoal`, `bg-surface/90`, `border-gold/40`. La configuración **reemplaza** la paleta de Tailwind: fuera de estos tokens (más `transparent`) no existen clases de color. Nunca escribir hexadecimales en pantallas o componentes.

Cuando un componente recibe el color como prop y no por `className` (íconos de `lucide-react-native`, `placeholderTextColor`, `ActivityIndicator`, opciones de navegación), se importa la paleta:

```tsx
import { colors } from '@/presentation/theme/colors';

<Mail size={18} color={colors.ash} />
```

### Tipografía

Montserrat es la única familia. Se carga en `src/app/_layout.tsx` con `@expo-google-fonts/montserrat` (funciona en Expo Go y en builds nativos); el splash se mantiene hasta que las fuentes están listas.

Pesos disponibles como clases: `font-regular`, `font-medium`, `font-semibold`, `font-bold` (y `font-sans` = Regular). Cada clase selecciona el **archivo** de ese peso, no un `fontWeight`: en Android un `fontWeight` sobre una fuente personalizada genera un engrosado sintético. Por eso la utilidad `fontWeight` de Tailwind está desactivada.

React Native no tiene fuente global: un `<Text>` sin clase de fuente usa la del sistema. Para textos usar el componente `Typography`, que ya aplica Montserrat, la jerarquía y el color:

| Nivel | `variant` | Clases | Tamaño | Peso por defecto | Pesos admitidos |
|---|---|---|---|---|---|
| H1 | `h1` | `text-4xl` – `text-5xl` | 36–48px | Bold | Bold |
| H2 | `h2` | `text-2xl` – `text-3xl` | 24–30px | Bold | Bold |
| H3 | `h3` | `text-lg` – `text-xl` | 18–20px | SemiBold | SemiBold |
| Body Large | `bodyLarge` | `text-base` | 16px | Medium | Medium / Bold |
| Body Regular | `body` | `text-sm` | 14px | Regular | Regular |
| Caption | `caption` | `text-xs` | 12px | Regular | Regular / Medium |

```tsx
<Typography variant="h1">Tu viaje</Typography>
<Typography variant="bodyLarge" weight="bold" tone="accent">Confirmar</Typography>
<Typography variant="caption" tone="secondary">Llega en 4 min</Typography>
```

`tone`: `primary` (platinum, por defecto), `secondary` (ash), `accent` (gold), `inverse` (obsidian, para texto sobre gold), `danger` (errores). Peso y color van por props y no por `className` porque dos clases que pisan la misma propiedad (ej. `text-platinum` y `text-gold`) se resuelven por el orden de la hoja generada, no por el orden en que se escriben. Para H1–H3 en su tamaño mayor (`text-5xl`, `text-3xl`, `text-xl`) se puede pasar la clase de tamaño en `className`: Tailwind ordena los tamaños de menor a mayor, así que el mayor gana.

### Componentes base

| Componente | Uso |
|---|---|
| `Screen` | Contenedor de pantalla: fondo obsidian y márgenes seguros. `scrollable` para formularios (se aparta del teclado) |
| `Typography` | Todo texto |
| `VIPButton` | Botón principal: píldora gold de 56px, `loading` lo deshabilita y muestra spinner |
| `VIPTextInput` | Input oscuro con etiqueta, ícono, error y, con `secureTextEntry`, botón para revelar |
| `BrandLogo` | Sello de la marca (`assets/Logo.jpeg`) |
| `ProfileOptionCard` | Tarjeta seleccionable tipo radio; con `badge` se muestra como no disponible |

## Navegación

Expo Router con rutas en `src/app/` (`package.json` → `"main": "expo-router/entry"`).

| Ruta | Archivo | Estado |
|---|---|---|
| `/` | `(public)/index.tsx` | Selección de perfil |
| `/register` | `(public)/register.tsx` | Registro de pasajero |
| `/login` | `(public)/login.tsx` | Inicio de sesión |
| `/verify-email` | `verify-email.tsx` | Validación del PIN; destino después del registro o de un login sin correo verificado |
| `/home` | `(app)/(tabs)/home.tsx` | Mapa principal |
| `/activity` | `(app)/(tabs)/activity.tsx` | "Viajes": historial paginado, con filtros |
| `/account` | `(app)/(tabs)/account.tsx` | Provisoria; con el perfil completo muestra un resumen de solo lectura con "Modificar datos", notificaciones, legales, "Eliminar mi cuenta" y permite cerrar sesión |
| `/complete-profile` | `(app)/complete-profile.tsx` | A donde manda el guard de perfil incompleto al pedir un viaje; mismo formulario que `/account`, con el aviso de por qué y vuelta al pedido en curso al guardar |
| `/delete-account` | `(app)/delete-account.tsx` | "Eliminar mi cuenta": explica las consecuencias y pide la contraseña para confirmar |
| `/search` | `(app)/search.tsx` | "Planifica tu viaje" |
| `/guest` | `(app)/guest.tsx` | "Pasajero invitado": carga los datos de un tercero para viajar en su nombre |
| `/pricing` | `(app)/pricing.tsx` | Cotización, categoría y confirmación |
| `/reserve` | `(app)/reserve.tsx` | "Reservar viaje": origen, destino, fecha y hora para mandar por WhatsApp |
| `/trip/[tripId]` | `(app)/trip/[tripId].tsx` | Viaje activo: radar, chofer en camino y viaje en curso, en vivo |
| `/receipt/[tripId]` | `(app)/receipt/[tripId].tsx` | Recibo del viaje terminado y calificación del chofer |
| `/trips/[tripId]` | `(app)/trips/[tripId].tsx` | Detalle de un viaje del historial (plural: distinta de `/trip/[tripId]`) |
| `/chat/[tripId]` | `(app)/chat/[tripId].tsx` | Chat 1 a 1 con el chofer asignado |
| `/payment-return` | `payment-return.tsx` | Deep link de vuelta desde el checkout de Mercado Pago (`transferblack-passenger://payment-return?trip_id=...`); redirige a `/trip/[tripId]` |

`(public)` agrupa las rutas sin sesión y `(app)` la zona privada; el nombre del grupo no aparece en la URL. El layout de `(app)` es la compuerta: sin sesión redirige a `/login` y con el correo sin verificar, a `/verify-email`. `/verify-email` también redirige a `/login` si no hay sesión, porque el endpoint exige el access token.

Dentro de `(app)`, `(tabs)` tiene la barra inferior flotante (`FloatingTabBar`); `search` y `pricing` quedan fuera de las pestañas, a pantalla completa, con `slide_from_right`. `trip/[tripId]` y `receipt/[tripId]` entran con fundido y sin gesto de volver: mientras el viaje sigue, el botón atrás de Android no hace nada (no hay otra forma de volver a esa pantalla); al terminar o cancelar, `router.dismissTo('/home')` vacía la pila. Para navegar se usan las rutas sin grupos (`/home`, `/search`): resuelven igual aunque cambie el anidado.

## Home y búsqueda de direcciones

### Mapa y ubicación

- `react-native-maps` con `PROVIDER_GOOGLE` en Android (estilo oscuro de `theme/map-style.ts`, sin puntos de interés) y Apple Maps en iOS (`userInterfaceStyle="dark"`, sin provider forzado). La key del Maps SDK for Android se configura en `android.config.googleMaps.apiKey`, que `app.config.ts` llena desde `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY` (en Google Cloud Console, restringida al paquete `com.transferblack.passenger` + el SHA-1 de cada build). En Expo Go no se usa (va con el build de Expo Go, no con el de esta app); hace falta para un build nativo propio (`expo run:android`, EAS Build) o prebuild.
- `useLocationPermissions` pide el permiso en primer plano al montar el Home, toma la última posición conocida (centra rápido) y después la actual. Guarda `currentLocation` en `useTripStore` y la convierte en dirección (geocodificación inversa) para proponerla como origen. Sin permiso o sin señal, el chip del mapa permite reintentar o abrir Ajustes.
- **Emulador de Android**: si Google Play Services está desactualizado, rechaza la firma de Expo Go (`GoogleCertificatesRslt: not allowed` en logcat) y el mapa queda sin tiles. En un teléfono con Play Services al día funciona.

### Proveedor de lugares (Google, detrás del backend)

Las pantallas no conocen al proveedor. El contrato está en `infrastructure/interfaces/places.ts` (`Place`, `PlaceSuggestion`, `PlacesProvider`: `autocomplete`, `getPlaceDetails` y `reverseGeocode`) y la implementación activa se elige en **un solo archivo**, `core/api/places-provider.ts` (hoy `google-places-provider.ts`, contra `GET /places/autocomplete|details/:placeId|reverse` del propio backend).

La app **no habla con Google directamente** ni tiene una key de Places/Geocoding: todo pasa por el backend, que usa su propia key de servidor (optimiza costo: Google no cobra por tecla dentro de una sesión de Places). Por eso `autocomplete` no trae coordenadas, solo `placeId`, `primaryText`, `secondaryText` y `description` (`PlaceSuggestion`); hace falta `getPlaceDetails` para resolverlas, y ahí se cierra la sesión. `usePlaceSearch` genera el `sessionToken` (UUID de `expo-crypto`) al empezar a escribir, lo reusa en cada tecla de la misma búsqueda y lo descarta al vaciar el campo; `usePlanTrip.selectSuggestion` es quien pide el detalle al elegir una sugerencia (las de "Recientes" y "Ubicación actual" ya tienen coordenadas resueltas y no vuelven a pedir nada). El `placeId` viaja tal cual a `POST /rides/quote`: tiene que ser del mismo proveedor que usa el backend.

`getPlacesErrorMessage` (`presentation/utils/places-error-message.ts`) traduce `RATE_LIMIT_EXCEEDED` (429, con `Retry-After`) y `PLACES_PROVIDER_UNAVAILABLE` (503) a un mensaje para el usuario; cualquier otro error cae al genérico de `usePlaceSearch`. La geocodificación inversa ("Ubicación actual") puede traer `place_id: null` si Google no asocia un lugar estable a esas coordenadas: en ese caso se usa un id propio con las coordenadas redondeadas, que no se vuelve a resolver contra el proveedor pero alcanza para cotizar.

### Planifica tu viaje

- Dos campos (origen y destino) comparten una lista: la del campo activo. El destino recibe el foco al entrar; el origen viene con la ubicación actual ("Ubicación actual").
- `usePlaceSearch` espera 350 ms tras la última tecla, busca desde 3 caracteres y cancela la búsqueda anterior.
- Al elegir destino se guarda en `useTripStore.destinationLocation` y en recientes; con origen, avanza a `/pricing`. Sin origen (sin ubicación), pide elegirlo primero.
- **Recientes**: los últimos 5 destinos, guardados en el dispositivo (`recent-places-storage.ts`). El backend no tiene lugares frecuentes ni guardados; el Home muestra estos mismos recientes.
- "Reserva", "Para mí" y "Viaje corporativo" informan que llegan pronto. "Para un invitado" ya funciona: lleva a `/guest`.

### Pasajero invitado (viaje para un tercero)

La pantalla `GuestPassengerScreen` (hook `useGuestPassengerForm`, RHF + Zod) carga los datos de quien viaja cuando no es el titular: nombre completo, teléfono móvil y un email opcional para el comprobante. Se guardan en `useTripStore.guestPassenger` (se limpian en `resetTrip()`) y viajan recién en `POST /rides/{tripId}/confirm`, como `third_party`; `POST /rides/quote` no cambia. El titular queda como coordinador del viaje: es quien paga y quien ve el seguimiento.

- **Teléfono**: el campo solo pide el número local (el "+54 9" es un prefijo fijo en pantalla). `presentation/utils/phone.ts` normaliza a E.164 (`normalizeArgentineMobile`): saca espacios/guiones, un "0" inicial y un "15" inicial, y exige que queden exactamente 10 dígitos (código de área + número). No cubre el "15" escrito después del código de área (ej. "0351 15 555 0199"): ahí alcanza con escribir el número sin el 0 ni el 15, como lo guarda cualquier agenda moderna. El mismo archivo expone `phoneE164Field`, el campo genérico en E.164 que también usa el registro.
- **Entradas**: la píldora "Para un invitado" del Home (`from=home`, al confirmar sigue a `/search`) y, en Cotización, un chip que pide, edita o quita el invitado (`GuestPassengerChip`); sin `from=home` el paso siguiente es `router.back()`, así que desde Cotización se vuelve ahí.
- **Sin SMS**: el backend no tiene proveedor de SMS. Si se carga email, el invitado recibe ahí el link de seguimiento; siempre se lo puede mandar también por WhatsApp desde el viaje activo (ver más abajo). No hay "Agenda", "Compartir mi seguimiento" propio ni "Cobro a cuenta del anfitrión": no tienen soporte en el backend.

## Reservar un viaje (para más tarde)

`ReservationScreen` (ruta `/reserve`, hook `useReservationForm`) deja elegir origen, destino, fecha y
hora para un viaje futuro y manda todo por WhatsApp; la agencia arregla el precio y crea el viaje a
mano (todavía no hay endpoint). Sin llamada al backend: es el mismo patrón que los "Otros servicios
por WhatsApp" de Cotización, pero con fecha y hora.

- **Store propio** (`useReservationStore`): origen, destino, fecha/hora y notas de la reserva viven
  separados de `useTripStore`. Comparten un solo store haría que elegir origen/destino para una
  reserva pisara un viaje "Ahora" a medio armar (o al revés).
- **Reusa la búsqueda de siempre**: tocar "Origen" o "Destino" en la reserva navega a `/search` con
  `?mode=reserve&field=origin|destino`. `usePlanTrip` lee ese `mode` para guardar en
  `useReservationStore` en vez de `useTripStore`, y para volver (`router.back()`) a la reserva en vez
  de seguir a Cotización una vez elegidos los dos puntos.
- **Fecha y hora**: `ReservationScheduleField` usa `@react-native-community/datetimepicker` (compact
  en iOS, diálogo nativo en Android), igual que `BirthDateField`. El selector de fecha no deja elegir
  un día pasado; el mínimo real —30 minutos desde ahora— lo valida el formulario, porque depende de
  qué día se elija.
- **Entradas**: una píldora "Reservar viaje" en el Home (misma fila que "Viaje corporativo" y "Para
  un invitado"), la pestaña "Reserva" de "Planifica tu viaje", y un link "Reservar viaje" en
  Cotización, debajo de los servicios por WhatsApp.
- **Mensaje**: "Hola, quiero reservar un viaje" + fecha (`sábado 3 de octubre`), hora (`18:30`),
  origen, destino, pasajeros/notas si se cargó algo, y nombre y email del pasajero logueado, para que
  la agencia encuentre la cuenta. Al confirmarse la línea y abrirse WhatsApp, la pantalla pasa a un
  estado de "ya te contactamos" con un botón al inicio que limpia la reserva.

### El viaje reservado, del lado del pasajero

Una vez que la agencia arma el viaje (admin, por Swagger), `GET /rides`, `GET /rides/{tripId}` y el
nuevo `GET /rides/upcoming` lo traen con `booking_type: 'scheduled'`, `scheduled_at` (hora de
retiro), `prepaid_at` (si ya se acreditó el cobro por adelantado) y, mientras sigue sin activar
(`status: 'scheduled'`), `reserved_driver` en vez de `driver`/`vehicle`.

- **"Próximo viaje reservado" en el Home** (`UpcomingTripCard`, hook `useUpcomingTrips`): el primero
  de `GET /rides/upcoming` (ya viene ordenado, más próximo primero), con fecha y hora de retiro,
  origen → destino, la píldora "Pagado" / "Pendiente de pago" y el chofer reservado si ya hay uno.
  Se recarga con cada foco del Home; un error se traga en silencio, la tarjeta simplemente no
  aparece (no hay nada crítico que avisar ahí). Toca a `/trips/[tripId]`.
- **Historial**: filtro "Reservados" (`status=scheduled`, el backend ya lo acepta como cualquier
  otro estado). La tarjeta muestra la hora de retiro pedida en vez de cuándo se armó el viaje, y
  "Reservado" en vez de "En curso".
- **Detalle** (`TripDetailScreen`): con `booking_type: 'scheduled'` y `status: 'scheduled'` todavía,
  la sección "Pago" se reemplaza por "Reserva" (retiro, estado del pago, el chofer reservado o "Se
  asigna un chofer antes del viaje", y la aclaración de que el viaje se activa solo). "Chofer y
  vehículo" sigue oculta: `driver`/`vehicle` siguen en `null` hasta la activación.
- **Cancelar una reserva ya paga**: el backend responde 409 `SCHEDULED_TRIP_CANCEL_VIA_AGENCY`
  (`useCancelReservedTrip`); la pantalla cambia el botón "Cancelar reserva" por un aviso para
  escribirle a la agencia por WhatsApp (`contactWhatsAppToCancelReservation`, mismo patrón de
  elegir línea que el resto de `whatsapp-services.ts`).
- **Si se activa mientras se mira el detalle** (o entre que se lista y se toca): `TripDetailScreen`
  detecta que ya no está en `scheduled` y hace `router.replace` a `/trip/[tripId]`, el seguimiento
  en vivo.

## Cotización y confirmación del viaje

`POST /rides/quote` (201) crea el viaje en `draft` y devuelve `{ draft, route, quotes[] }`. Origen y destino viajan como `{ address_text, place_id, latitude, longitude }`, con el `placeId` del mismo proveedor de mapas que usa el backend.

- **La ruta del mapa viene del backend**: `route.polyline` es el recorrido codificado (algoritmo de polyline de Google, el que devuelve Routes API) de la ruta que se cotizó. `decode-polyline.ts` lo decodifica a `{ latitude, longitude }[]` para `Polyline`. Así la línea dibujada es la misma ruta que se cobró y la app no vuelve a pedirla.
- **Los importes son texto** (`"24500.00"`) y se conservan así en `totalAmount`; el `Number` solo se usa para mostrarlos formateados.
- **La cotización vence** (10 minutos): `useRideQuote` vuelve a cotizar sola al llegar esa hora, porque confirmar con una tarifa vencida responde 409.
- La categoría elegida se recuerda por `code` entre recotizaciones: los `id` cambian, la categoría no.
- **Hoy hay una sola categoría, "Prioridad"** (`prioridad`): `essential` y `comfort` están desactivadas en el backend (no borradas, porque el historial las referencia) y la cotización solo devuelve las activas. La pantalla no tiene nada fijo por categoría: si el backend vuelve a ofrecer varias, se muestran solas, y el cartel "Recomendado" aparece solo cuando hay más de una.
- **Otros servicios por WhatsApp** (Grúa, Colectivo, Flete, Otros): viven solo en el front (`presentation/utils/whatsapp-services.ts`), no se cotizan ni crean viaje. Al tocar uno se elige la línea (351 926-0326 o 351 926-0327) y se abre `wa.me` con el servicio, el origen y el destino ya escritos; el equipo coordina el resto por fuera de la app. Se muestran también si la cotización falla.

`POST /rides/{tripId}/confirm` espera `{ fare_quote_id, payment: { type } }` y el header **`Idempotency-Key`** (UUID v4 de `expo-crypto`). La clave se genera una vez por borrador y se renueva si hay que recotizar o si cambia algo que forma parte del cuerpo que hashea el backend para la idempotencia (el invitado, el PIN de abordaje o el medio de pago): reintentar con el mismo cuerpo no cobra dos veces, pero cambiarlo con la clave vieja devolvería la respuesta del intento anterior.

| Medio de pago | `payment.type` | Qué pasa |
|---|---|---|
| Efectivo | `cash` | El viaje pasa a `searching` y la app va a `/trip/[tripId]`, que arranca con el radar |
| Mercado Pago | `account_money` | La respuesta trae `payment.checkout_url`: se abre el checkout (`WebBrowser.openAuthSessionAsync`), que admite dinero en cuenta y tarjetas de crédito o débito. **El viaje queda en `draft`** hasta que el pago se acredite por webhook: la pantalla del viaje muestra "Confirmando tu pago" y pasa sola al radar cuando llega el aviso |
| Cuenta corporativa | `corporate` | Igual que efectivo (sin checkout): el viaje pasa directo a `searching`. Se paga contra el **saldo prepago** de la empresa (la empresa carga saldo antes; el límite mensual es solo un control interno opcional) |

Errores: 409 `FARE_QUOTE_EXPIRED` recotiza sola, 409 `INVALID_TRIP_TRANSITION` vuelve al Home, 400 al cotizar ofrece reintentar y 401 reusa `handleExpiredSession()`.

### Saldo prepago corporativo

La pastilla "Corporativo" de "Método de pago" solo aparece con un vínculo empresarial (`GET /corporate/membership/me`, ya consumido por `useCorporateMembership` en Mi Cuenta): la elegibilidad para pagar así (`can_ride_on_account`, `reason`, `company_balance` y `consumption` por empleado/centro de costo/empresa) viaja en esa misma respuesta, mapeada en `CorporateMembershipMapper`. `useCorporateEligibility` (hook nuevo, no confundir con `useCorporateMembership`) la consulta una vez y la cachea 60 segundos en memoria de módulo, porque Home ("Viaje corporativo") y Cotización la piden casi al mismo tiempo. Sin vínculo, la pastilla ni se muestra; con vínculo pero sin permiso, se muestra deshabilitada y al tocarla explica el motivo (`COMPANY_SUSPENDED` o `CORPORATE_INSUFFICIENT_BALANCE`, en `presentation/utils/corporate-eligibility-copy.ts`; `CORPORATE_LIMIT_REQUIRED` queda por si responde un backend viejo); habilitada, muestra el saldo de la empresa y, si hay tope individual o de centro de costo vigente, también "Te quedan $X este mes" con el menor remanente entre esos dos.

La empresa carga saldo antes de viajar (prepago): el límite mensual por empleado o centro de costo sigue existiendo como control interno opcional, pero ya no hace falta un límite de empresa configurado, y lo que habilita o no el viaje es el saldo disponible (`company_balance.available`, puede quedar chico en negativo y se recupera en la próxima carga). Si la tarifa elegida supera ese saldo, Cotización deshabilita la pastilla para esa tarifa puntual (`exceedsCompanyBalance` en `corporate-eligibility-copy.ts`) aunque `can_ride_on_account` siga en `true`.

"Viaje corporativo" del Home hace lo mismo con `Alert.alert` (sin vínculo invita a Mi Cuenta; sin permiso explica el motivo) y, si puede, guarda `corporate` en `useTripStore.preferredPaymentMethod` antes de ir a `/search`: `useConfirmRide` arranca con ese medio ya elegido. La preferencia se limpia sola al empezar cualquier otro viaje (`startSearch`, elegir un reciente) y con `resetTrip()`.

`POST /rides/{tripId}/confirm` con `corporate` no abre checkout (como efectivo): descuenta el saldo de la empresa, no genera deuda. El backend no expone selección de centro de costo al pasajero (solo un responsable podría elegirlo, y esta versión no lo ofrece), así que la app nunca manda `cost_center_id`. Errores propios de este medio (`presentation/utils/corporate-error-message.ts`): `CORPORATE_MEMBERSHIP_REQUIRED`, `COMPANY_SUSPENDED`, `CORPORATE_INSUFFICIENT_BALANCE` (409, con `details.available/required/currency`), `CORPORATE_LIMIT_REQUIRED`, `CORPORATE_LIMIT_EXCEEDED` (con `details.scope/limit/committed/remaining`), `COST_CENTER_NOT_ALLOWED`, `COST_CENTER_COMPANY_MISMATCH`, `COST_CENTER_NOT_ACTIVE`. Ante cualquiera de estos, la pantalla vuelve el medio de pago a Mercado Pago y muestra el motivo, sin salir de Cotización.

### Volver de Mercado Pago

`useConfirmRide` abre el checkout con `WebBrowser.openAuthSessionAsync(checkoutUrl, Linking.createURL('payment-return'))` (en vez de `openBrowserAsync`): el navegador se cierra solo apenas Mercado Pago redirige al deep link de vuelta de la app (`transferblack-passenger://payment-return`), en vez de quedar abierto hasta que el pasajero lo cierre a mano. Resuelva lo que resuelva esa promesa (éxito, cancelado, o el pasajero cerró el navegador), la app ya sigue a `/trip/[tripId]`, que consulta el estado real al montarse: no hace falta un refetch aparte.

`src/app/payment-return.tsx` es el otro lado del mismo link, para cuando la app estaba cerrada o en segundo plano y es el sistema operativo quien lo abre (si la app seguía al frente, `openAuthSessionAsync` ya se encarga sin llegar hasta acá): lee `trip_id` de los parámetros y redirige a `/trip/[tripId]` (o a `/home` sin ese parámetro).

Pendiente del lado del backend: configurar `back_urls` en la preferencia de Mercado Pago apuntando a ese esquema (hoy, sin `back_urls`, Mercado Pago no redirige solo y el pasajero tiene que cerrar el checkout a mano; la app ya está lista para cuando lo haga).

## Viaje activo y tiempo real

`ActiveTripScreen` es una sola pantalla que cambia de panel según el estado, con un fundido deslizante (Reanimated) para que la transición no recargue el mapa:

| Estado | Panel |
|---|---|
| `draft` | "Confirmando tu pago" |
| `searching` | Radar (`RadarPulse`) sobre el origen, "Contactando choferes VIP…", resumen del recorrido y "Cancelar búsqueda" |
| `assigned` / `driver_arriving` | "Conductor en camino": ETA, distancia, chofer (nombre, calificación), auto con patente, Chat y Cancelar |
| `driver_arrived` | El mismo panel con "Tu chofer llegó" |
| `in_progress` | **A bordo**: el auto va al destino, ETA ("12 min", "Llegada 10:18"), chofer y patente, barra con el destino |
| `completed` | Pasa al recibo con `router.replace`: "atrás" no vuelve al mapa |
| `cancelled` | Estado simple con "Volver al inicio", salvo `cancellation_reason_code: 'no_driver_found'` (ver abajo) |

- **REST es la verdad, el socket acelera.** `useActiveTrip` consulta `GET /rides/{tripId}` (estado, origen, destino, chofer y auto) y se suscribe a `core/api/realtime-client.ts`. Cada `trip:status_changed` muestra el estado nuevo al instante y vuelve a consultar el detalle; también se re-consulta al reconectar el socket, al volver del segundo plano y al confirmarse la entrada a la sala (`ride:joined`): un aviso emitido antes de entrar a la sala se pierde, y con tarjeta el pago suele acreditarse justo en ese hueco. Mientras el socket está caído, consulta cada 10 s y muestra "Reconectando…"; con el socket conectado, igual consulta cada 15 s mientras el viaje está en `draft` o `searching`, los estados que avanzan solos.
- **Socket.IO** (`socket.io-client`): una sola conexión para toda la app, abierta solo mientras hay un viaje que seguir. El token va en `auth` como función, así cada reconexión usa el vigente; un rechazo por token vencido lo renueva y reconecta. Hay que emitir `ride:join` para entrar a la sala del viaje, y el cliente lo repite en cada reconexión. Con `__DEV__` deja logs `[socket]` en la consola de Metro.
- **Despacho**: no lo pide la app. El backend ofrece solo los viajes en `searching` a los choferes cercanos cada 10 s y reintenta mientras nadie acepte.
- **El auto** (`DriverCarMarker`) recibe `driver:location` cada ~3 s: un sedán visto desde arriba, dibujado con `react-native-svg` (gradiente, sombra, parabrisas/luneta) en vez de una flecha. `useAnimatedCoordinate` interpola entre posiciones durante esos 3 s (sin `AnimatedRegion`, que depende de clases internas de React Native) y gira el auto según el rumbo; un salto de más de 1 km se mueve sin animar. La polilínea se recorta desde el punto de la ruta más cercano a la posición del chofer (`geo.trimRouteFromPosition`), así el tramo ya recorrido no queda dibujado detrás del auto.
- **ETA y ruta al origen** (`useDriverEta`): el backend no expone una ruta entre dos puntos cualquiera (solo calcula una al cotizar el viaje), así que acá no hay proveedor: la distancia y los minutos son siempre una estimación en línea recta (haversine × 1.3 de factor de rodeo). Se recalcula al llegar la primera posición y después cada 30 s, no con cada posición (llegan cada 3 s), para no reencuadrar el mapa todo el tiempo.
- **Cancelar**: `useCancelTrip` primero consulta `GET /rides/{tripId}/cancellation-preview` (si falla, se sigue con el texto genérico de siempre: no bloquea la cancelación) y arma la alerta de confirmación con `buildCancelConfirmationMessage` (`presentation/utils/cancellation-copy.ts`): la penalidad, si `preview.penalty.amount > 0`, y qué pasa con el reembolso según `refund_mode` — `automatic` ("Te devolvemos $X automáticamente...", con la hora límite si `auto_refund_window_ends_at` vino), `claim` ("...se gestiona por reclamo con la agencia") o `none` (nada). Confirmado, `POST /rides/{tripId}/cancel` con `reason_code: passenger_cancelled`; con el resultado real (`cancellation.refund_mode`) se muestra el mismo tipo de aviso antes de volver al Home. Reembolso automático por Mercado Pago solo dentro de los primeros `CANCELLATION_AUTO_REFUND_WINDOW_SECONDS` (5 min) desde que se acreditó el pago; pasada la ventana, o si cancela el chofer/admin/sistema, o en un reservado prepago, el reembolso queda como reclamo o es automático según corresponda (la política completa vive en el backend, `cancellation-policy.ts`).
- **Viaje para un invitado**: si el detalle trae `third_party`, la pantalla muestra "Sos el coordinador · viaja `<nombre>`" (`CoordinatorBanner`) y, cuando el backend también manda `tracking_url` (solo al titular que pidió el viaje), un botón "Enviar seguimiento por WhatsApp" que abre `wa.me` al número del invitado con el link ya escrito. Sin chat: no hay forma de escribirle al invitado desde la app.
- **Sin chofer disponible**: si el backend cancela solo porque nadie buscó más de `TRIP_SEARCH_TIMEOUT_MINUTES` (`cancellation_reason_code: 'no_driver_found'`), `TripStatusPanel` muestra "No encontramos un chofer disponible" (más "Te devolvemos el pago automáticamente" si se había pagado con Mercado Pago) y un botón "Volver a intentar" (`onRetry`, en vez de "Volver al inicio") que hace `router.replace('/pricing')`: como no se llama a `resetTrip()`, el origen y destino de `useTripStore` siguen ahí y se cotiza un borrador nuevo. Sin alguno de los dos, `PricingScreen` ya redirige sola a `/search`.
- **Fuera de alcance por ahora**: PIN de validación a bordo (el backend no tiene endpoint) y llamada al chofer (el backend no expone su teléfono; el botón "Llamar" se sacó del panel "Conductor en camino" por eso). El botón de seguridad, "Compartir ETA", "Confort" y "Concierge" de la barra y el panel "A bordo" se sacaron: no tenían funcionalidad propia (el seguimiento real del invitado sigue por `CoordinatorBanner`, más abajo). "Destino" queda y avisa "Próximamente". El chat con el chofer sí está implementado (ver más abajo).

### Chat del viaje

Chat 1 a 1 con el chofer asignado, en `/chat/[tripId]` (`TripChatScreen`, hook `useTripChat`). Se entra desde el botón "Chat" de "Conductor en camino" y del panel "A bordo" (deshabilitado hasta que hay chofer asignado, con badge de mensajes sin leer) y desde el recibo, dentro de la ventana de gracia.

- **REST siempre para leer y mandar**: `GET/POST /trips/{tripId}/messages` (paginación por cursor, `before` para historial viejo y `after` para "lo nuevo desde tal mensaje") y `POST /trips/{tripId}/messages/read`. El envío es optimista, con un `client_message_id` (UUID de `expo-crypto`) que identifica el intento y no el mensaje: reintentar un envío fallido con el mismo id nunca lo duplica (el backend responde 200 en vez de 201).
- **Tiempo real como camino principal, con fallback a polling**: al abrir la pantalla se emite `chat.join` con un ack; si confirma, la pantalla se mantiene al día por los eventos del socket (`chat.message.created`, `chat.message.read`) y no hace polling periódico, solo catch-up puntual (`after`) al confirmarse el join, al reconectar el socket y al volver del segundo plano. Si nadie responde en 3 s o el ack llega `ok: false` (por ejemplo `FORBIDDEN`), o el socket está desconectado, cae a polling con `after` cada ~4 s mientras está enfocada y la app en primer plano, y recarga la página más reciente cada 15 s porque `after` no trae de vuelta los mensajes ya cargados (la lectura "Leído" sin tiempo real solo se nota así). El socket vuelve a pedir `chat.join` en cada reconexión (las salas de Socket.IO no sobreviven una caída) y, si esa vez confirma, la pantalla vuelve a tiempo real.
- **Marcar como leído**: se manda con un debounce corto al ver mensajes nuevos del chofer, con el id del más reciente (el backend marca todos los anteriores).
- **Estado cerrado**: si el backend responde `CHAT_CLOSED` (viaje terminado fuera de la ventana de gracia de 24 h, o intento del chofer con el viaje en curso) se oculta el cuadro de texto; el historial se puede seguir leyendo. La ventana de gracia la calcula el backend desde `finishedAt`/`cancelledAt`; la app no la replica y confía en la respuesta real de cada `POST`.
- **429**: el backend limita a 20 mensajes por minuto y manda `Retry-After`; la pantalla muestra una cuenta regresiva y deshabilita el envío mientras dure.

### Recibo y calificación

`ReceiptScreen` relee `GET /rides/{tripId}`: tarifa final (`final_fare`), origen, destino, minutos de trayecto (`started_at` → `finished_at`), km de la ruta cotizada (`estimated_distance_meters`), medio y estado del pago (`payment_status`) y si ya calificó (`rating`).

- Las estrellas arrancan en 0 y "Calificar y finalizar" queda deshabilitado hasta elegir al menos una. Los motivos (Puntualidad, Conducción suave, Vehículo impecable) viajan como `tags`.
- `POST /rides/{tripId}/ratings` con `{ rating, tags? }`: 201 vuelve al Home y limpia el viaje en armado (`resetTrip`). Un 409 `RATING_ALREADY_EXISTS` se trata igual que el éxito (por ejemplo, un reintento).
- "Omitir" y el botón atrás de Android vuelven al Home sin calificar. Si el viaje ya estaba calificado, se muestran las estrellas dadas y "Volver al inicio".
- **"Descargar comprobante en PDF"**: arma un HTML con los mismos datos del recibo (`presentation/utils/receipt-pdf.ts`, función pura) y lo convierte en PDF con `expo-print` (`Print.printToFileAsync`); `useDownloadReceipt` es el hook de la acción, con estado de carga y error, y abre la hoja de compartir del sistema con `expo-sharing`. Por ahora solo está en `ReceiptScreen`: el detalle del historial (`/trips/[tripId]`) no tiene ese botón.

Para probar sin la app del chofer hace falta un chofer que esté conectado por socket y mande su posición (una cuenta demo con un script). Swagger no alcanza: el despacho solo encuentra choferes online con ubicación.

## Mis viajes

La pestaña "Viajes" (`(app)/(tabs)/activity.tsx`, ruta `/activity`) es `TripHistoryScreen`: historial paginado con filtros Todos / Reservados / Completados / Cancelados, scroll infinito, pull to refresh y estado vacío.

- **Listado**: `GET /rides?page&limit&status` (rol pasajero, solicitante o pasajero, sin borradores). "Todos" no manda `status`: el backend ya devuelve todo lo no-borrador, incluidos los viajes en curso, así que ese filtro también muestra lo que está pasando ahora. "Reservados", "Completados" y "Cancelados" mandan `status=scheduled` / `completed` / `cancelled`; el backend también acepta el alias `active` (todo lo que no sea `completed` ni `cancelled`), pero la app no lo necesita porque no ofrece ese filtro.
- **Paginación**: a mano, sin TanStack Query (decisión del ticket). `useTripHistory` guarda un `requestId` que se incrementa en cada pedido: una respuesta que llega con un id viejo (por ejemplo, la del filtro anterior, tarde) se descarta en vez de pisar la lista. Cambiar de filtro reinicia la página a 1; `loadMore` no dispara un segundo pedido mientras uno sigue en marcha ni pasado el último `total_pages`.
- **Tarjeta**: ícono del servicio, destino (o el origen si no hay destino), fecha (`formatTripDate`, ver abajo) y tarifa (`final_fare` o, si todavía no hay, `estimated_fare`). Muestra "Cancelado" (rojo), un tilde gold para "Completado", "Reservado" (gold) para un viaje reservado sin activar o "En curso" (gold) para cualquier otro estado, y "Para `<nombre>`" si el viaje es para un invitado. Un reservado muestra la hora de retiro pedida (`scheduledAt`, con `formatReservationDate`/`formatClockTime`) en vez de cuándo se armó el viaje.
- **Fechas relativas**: `presentation/utils/format-date.ts` calcula "Hoy, 15:30" / "Ayer, 15:30" / "Hace 3 días" a mano (no con `Intl.RelativeTimeFormat`, que no arma ese formato) y usa `Intl.DateTimeFormat` para el resto ("14 de agosto, 15:30", con el año si no es el actual). Recibe `now` como parámetro para que el resultado sea determinista.
- **Toque en una tarjeta**: un reservado sin activar (`status: 'scheduled'`) o ya terminado (completado o cancelado) va al detalle, `/trips/[tripId]` (plural, distinto de `/trip/[tripId]`); cualquier otro estado activo va a `/trip/[tripId]`, la pantalla en vivo.
- **Detalle** (`TripDetailScreen`): relee `GET /rides/{tripId}`, que además del detalle que ya usaba el recibo trae `service_type` (categoría elegida) y `fare_breakdown` (`base`, `distance`, `time`, `discount`, `fees`, `total`, todos como texto). Si el desglose no coincide con `final_fare` (puede pasar: el total cotizado no es necesariamente lo que se liquidó), se muestra aparte como "Total cobrado" con una aclaración. El descuento y los cargos solo se muestran si son mayores a cero. Un viaje cancelado muestra `cancelled_at`; el motivo (`cancellation_reason_code`) solo se traduce si hay una entrada en `CANCELLATION_REASON_LABELS` (`presentation/utils/cancellation-copy.ts`: `passenger_cancelled`, `no_driver_found`, `draft_expired`) — cualquier otro código se omite en vez de mostrar el código crudo.
- **Reembolso en el detalle**: si `GET /rides/{tripId}` trae `refund` (reintegro de Mercado Pago en curso), se muestra el monto y el estado (`REFUND_STATUS_LABELS`, en `TripDetailScreen`). Con `refund.status === 'claim_required'` (fuera de la ventana de reembolso automático, o reservado prepago) aparece "Reclamar por WhatsApp" (`contactWhatsAppRefundClaim`, `presentation/utils/refund-claim-whatsapp.ts`): mismo patrón de elegir línea que `whatsapp-services.ts`, en un archivo aparte porque ese módulo no exporta sus líneas de atención. El mensaje lleva el código del viaje, fecha y hora de la cancelación, el monto y el nombre/email del pasajero (`useAuthStore`).
- Los textos de medio y estado de pago (`PAYMENT_METHOD_LABELS`, `PAYMENT_STATUS_LABELS`) están en `presentation/utils/payment-labels.ts`, compartidos con `ReceiptScreen`.

## Eliminar la cuenta

"Mi cuenta" → "Eliminar mi cuenta" (`DeleteAccountScreen`, hook `useDeleteAccount`, ruta `/delete-account`) explica las consecuencias (se borran los datos personales; los viajes y comprobantes se conservan anonimizados por obligación contable; no se puede deshacer), pide la contraseña y confirma con una alerta destructiva antes de llamar a `DELETE /users/me` con `{ password }`.

- **No es un borrado físico**: el backend anonimiza la cuenta. Errores propios: `INVALID_PASSWORD` (401/403), `ACCOUNT_HAS_ACTIVE_TRIP` y `ACCOUNT_HAS_UPCOMING_RESERVATION` (409, con un mensaje propio cada uno); cualquier otro cae al genérico de `getApiErrorMessage`.
- **Éxito**: el backend ya revocó la sesión y el dispositivo push; la app solo limpia lo local (revoca el dispositivo push si falla no bloquea, `clearSession()`, `resetTrip()`, reset de notificaciones) y vuelve a `/login` con un aviso de confirmación.

## API y sesión

- **Cliente**: `core/api/transfer-black-api.ts`, instancia de Axios con `baseURL = EXPO_PUBLIC_API_URL`. Documentación del backend: https://transfer-black-api.onrender.com/docs
- **Errores**: el interceptor de respuesta convierte todo fallo en `ApiRequestError` (`status`, `code`, `message`, `details`, `retryAfterSeconds`). `code` es el código estable del backend (`EMAIL_ALREADY_EXISTS`, `VALIDATION_ERROR`...) o `NETWORK_ERROR` / `TIMEOUT` si no hubo respuesta. Las pantallas deciden el mensaje mirando `status` y `code`, nunca el texto del backend. `message` puede llegar como un array de `issues` de Zod en `VALIDATION_ERROR`; el interceptor lo junta en un solo texto. El interceptor también reconoce el formato viejo del chat (error en la raíz, `{ code, message }`, en vez de `{ error: { code, message } }` como el resto de la API) como respaldo, por si algún ambiente no se redesplegó con el arreglo del backend. `retryAfterSeconds` sale del header `Retry-After` (hoy solo lo manda el 429 del chat).
- **Timeout de 60s**: el backend en Render se duerme tras unos minutos sin tráfico y la primera solicitud puede tardar cerca de un minuto en despertarlo.
- **Tokens**: `useAuthStore` (Zustand) guarda el access token solo en memoria y el refresh token en `expo-secure-store` (Keychain / Keystore; AsyncStorage no cifra). El interceptor de solicitud agrega `Authorization: Bearer` con el access token vigente.
- **Renovación**: el access token dura 15 minutos. Ante un 401, el interceptor de respuesta pide `POST /auth/refresh`, guarda el refresh token nuevo (rota en cada uso) y repite la solicitud una vez. Las solicitudes que fallan a la vez esperan la misma renovación (`core/api/session-refresh.ts`): mandar dos veces el mismo refresh token cerraría la sesión. Si el backend rechaza el refresh token, el 401 llega a la pantalla y `handleExpiredSession()` vuelve al login; si la renovación falla por red, la pantalla recibe un error de conexión y la sesión sigue.

### Restaurar la sesión al abrir la app

`useSessionRestore` (llamado una sola vez desde `src/app/_layout.tsx`) corre antes de decidir rutas públicas o privadas, con el splash (`expo-splash-screen`) visible mientras dura:

1. Lee el refresh token de `expo-secure-store`. Sin token, termina: se entra sin sesión, como siempre.
2. `POST /auth/refresh` (reusa `refreshSessionAction`) y guarda los tokens renovados (`useAuthStore.updateTokens`).
3. `GET /users/me` con el access token recién obtenido, y marca la sesión vigente (`useAuthStore.markAuthenticated`).
4. Busca un viaje para retomar: `GET /rides?status=active` (alias que trae todo lo que no sea `completed` ni `cancelled`, incluidos los borradores) y se queda con el primero en un estado de viaje inmediato en curso o un borrador esperando el pago (`searching`, `assigned`, `driver_arriving`, `driver_arrived`, `in_progress`, `draft`); un reservado sin activar (`scheduled`) no cuenta, de eso se encarga la tarjeta de "Próximo viaje" del Home. El resultado se guarda en `useSessionRestoreStore` hasta que se consume.

Un rechazo del backend (4xx: el refresh token venció o se revocó) borra el token local y se entra sin sesión. Un corte de red o timeout no cierra la sesión: se muestra una pantalla de "Reintentar" en vez de la app, sin perder el token. `(public)/_layout.tsx` es quien lee el resultado: con sesión restaurada, redirige a `/home` o, si hay un viaje para retomar, directo a `/trip/[tripId]`, en vez de mostrar la selección de perfil.

Con la app abierta, un access token vencido mientras está en segundo plano se renueva solo con el mismo interceptor de siempre: no hace falta nada adicional.

### Registro de pasajero

La ruta real es `POST /auth/register` (no `/auth/register/passenger`), y solo acepta `email` y `password`: cualquier otro campo es un 400. Por eso `registerPassengerAction` hace dos solicitudes:

1. `POST /auth/register` → cuenta, perfil y tokens.
2. `PATCH /users/me` con `first_name`, `last_name` y `phone_number` (E.164), usando el access token recién emitido.

Si falla solo el paso 2, la cuenta ya existe y la sesión es válida: se sigue igual y la acción devuelve `profileSaved: false`. "Nombre y apellido" se divide en el primer espacio: la primera palabra es el nombre y el resto, el apellido.

Las reglas de contraseña del formulario replican las del backend: 8 a 128 caracteres, con minúscula, mayúscula y número.

"Términos de Servicio" y "Política de Privacidad" (acá y en "Mi cuenta" → "Legales") abren esas páginas del panel con `expo-web-browser` (`WebBrowser.openBrowserAsync`); las URLs están en `presentation/utils/legal-links.ts` (`TERMS_URL`, `PRIVACY_URL`), overrideables por `EXPO_PUBLIC_TERMS_URL` / `EXPO_PUBLIC_PRIVACY_URL`.

### Inicio de sesión

`POST /auth/login` devuelve lo mismo que el registro (`profile` + `tokens`). Email inexistente, contraseña incorrecta y cuenta no activa responden igual, 401 `INVALID_CREDENTIALS`, así que la pantalla muestra un único "Correo o contraseña incorrectos." y vacía la contraseña.

- El formulario solo exige contraseña no vacía, sin reglas de fortaleza: una cuenta creada antes de que cambiaran tiene que poder entrar.
- Una cuenta sin rol `passenger` (conductor, administrador) no se guarda en el store y ve un aviso: esta app es solo para pasajeros.
- Destino: `/home` si el correo está verificado, `/verify-email` si no.
- "¿Olvidaste tu contraseña?" lleva a `/forgot-password`, precargando el correo si ya es válido.
- Login y registro se enlazan entre sí con `router.replace`, para que ir y volver no apile pantallas.

### Verificación de correo (PIN)

El correo trae un PIN de 6 dígitos. `POST /auth/verify-email` con `{ "token": "123456" }` (el campo se llama `token` por compatibilidad) **exige el access token**: el PIN solo vale para la cuenta de la sesión.

| Respuesta | Qué hace la pantalla |
|---|---|
| 200 | Haptic de éxito, `markEmailVerified()` en el store y `router.replace('/(app)/home')`. Es idempotente: si ya estaba verificado también responde 200 |
| 400 `VERIFICATION_CODE_INVALID` | Haptic de error, vacía las cajas y muestra los intentos restantes (`details.attempts_remaining`) |
| 429 `VERIFICATION_CODE_LOCKED` | Se agotaron los 5 intentos del código: pide reenviar |
| 410 `VERIFICATION_CODE_EXPIRED` | Venció (24 h) o no hay código vigente: pide reenviar |
| 401 | La sesión venció y no se pudo renovar: alerta y vuelta a `/login`, que trae de nuevo a esta pantalla |

- Las cajas son `react-native-otp-entry` (`OtpCodeInput`): foco automático, avance y pegado. Recibe estilos como objetos en `theme`, no `className`, por eso usa la paleta de `colors.js` y la familia `Montserrat_700Bold`. Se envía solo al completar el sexto dígito; el botón "Validar Identidad" queda para reintentar.
- No usa `blurOnFilled` ni se deshabilita mientras valida: en Android el teclado no vuelve a abrirse con `focus()` después de un blur o de un input deshabilitado.
- **Reenviar código**: `POST /auth/resend-verification` (202). El contador (`useCountdown`, 45 s) arranca al montar la pantalla y se reinicia con cada reenvío; coincide con el cooldown del backend. Si igual responde 429 `VERIFICATION_RECENTLY_SENT`, el contador toma `details.retry_in_seconds`. Un 409 `EMAIL_ALREADY_VERIFIED` lleva directo a `/home`.

### Recuperación de contraseña (PIN por email)

Tres pantallas sin sesión, encadenadas con `router.push`/`router.replace` (`/forgot-password` →
`/reset-password-verify` → `/reset-password`):

1. **`/forgot-password`** (`ForgotPasswordScreen`, hook `useForgotPasswordForm`): pide el correo y
   llama a `POST /auth/forgot-password`. Siempre responde 202 (exista o no la cuenta, para no
   enumerar usuarios): la app no interpreta el cuerpo, solo sigue al paso del PIN y lo avisa recién
   ahí ("Si `<email>` está registrado, te enviamos un código de 6 dígitos..."). El correo viaja como
   parámetro de ruta al siguiente paso.
2. **`/reset-password-verify`** (`ResetPasswordVerifyScreen`, hook `useResetPasswordVerify`): el
   mismo `OtpCodeInput` de 6 dígitos que la verificación de email, contra
   `POST /auth/reset-password/verify` (`{ email, code }`). Comparte con `useVerifyEmail` el
   describer de errores `VERIFICATION_CODE_*` (`presentation/utils/verification-code-error.ts`):
   `INVALID` (intentos restantes si vienen), `EXPIRED` y `LOCKED` (429, pedir uno nuevo). "Reenviar
   código" vuelve a llamar `forgot-password` con el mismo cooldown de 45 s. Al validar, el
   `reset_token` (10 minutos, un solo uso) se guarda en memoria en `usePasswordResetStore` —no en la
   URL, a diferencia del correo— y navega al paso final.
3. **`/reset-password`** (`ResetPasswordScreen`, hook `useResetPasswordForm`): contraseña nueva +
   repetir (mismas reglas que el registro, compartidas ahora en
   `presentation/utils/auth-form-fields.ts#passwordField`), contra `POST /auth/reset-password`
   (`{ reset_token, new_password }`). Sin `reset_token` en memoria, redirige a `/forgot-password`. El
   éxito limpia `usePasswordResetStore`, limpia también la sesión local si hubiera una
   (`useAuthStore.clearSession()`, porque el backend ya revocó todas las del usuario) y manda a
   `/login`. Un `reset_token` vencido o ya usado (`RESET_TOKEN_INVALID`) avisa y vuelve a pedir uno
   nuevo desde `/forgot-password`.

Los mensajes de conexión, timeout y validación comunes a los formularios salen de `presentation/utils/api-error-message.ts`, y la validación de email compartida, de `presentation/utils/auth-form-fields.ts`.

## Monitoreo de errores (Sentry)

`@sentry/react-native` captura errores inesperados en producción (y en desarrollo si se activa a mano). Queda **desactivado sin `EXPO_PUBLIC_SENTRY_DSN`**, y también en desarrollo salvo que `EXPO_PUBLIC_SENTRY_ENABLE_DEV=true`: no hace falta un proyecto de Sentry para desarrollar o probar la app (`src/core/monitoring/sentry.ts`, `isSentryEnabled`).

- **Inicialización**: `initSentry()` se llama una sola vez, en scope global de `src/app/_layout.tsx` (antes de montar la app), y el componente raíz se envuelve con `wrapWithSentry` (captura errores de render y agrega contexto de navegación).
- **Usuario**: `useAuthStore` llama a `setSentryUser(user.id)` al iniciar sesión, restaurarla o marcarla autenticada, y a `setSentryUser(null)` al cerrarla. **Solo el id**, nunca el email ni otro dato personal.
- **Qué se reporta**: el interceptor de `transfer-black-api.ts` manda a Sentry únicamente los `ApiRequestError` de servidor (`status >= 500`) o con forma inesperada (`UNKNOWN_ERROR`, una respuesta que no matchea ningún contrato conocido). Un error de negocio (4xx: contraseña incorrecta, tarifa vencida, validación...) es un flujo esperado y no se reporta (`captureUnexpectedApiError`).
- **Metro**: `metro.config.js` **no** envuelve la config con `withSentryConfig` (de `@sentry/react-native/metro`): con esta combinación de versiones de Metro/Hermes rompe `npx expo export` (`determineDebugIdFromBundleSource` recibe el bundle sin `code`). Sin eso, los reportes llegan sin Debug ID automático para relacionar un stack trace con el código fuente exacto; si una versión más nueva del paquete lo arregla, se puede volver a agregar.
- **Plugin de Expo**: `app.config.ts` agrega `@sentry/react-native` a `plugins`, con `organization`/`project` desde las variables de entorno de build `SENTRY_ORG`/`SENTRY_PROJECT` (no `EXPO_PUBLIC_*`: no hace falta que viajen en el bundle). Sin ellas el plugin solo avisa y sigue con las variables de entorno del builder como respaldo.
- **Subida de source maps (opcional)**: para que los stack traces de Sentry se vean legibles (no minificados) hace falta subir los source maps durante el build. Eso lo hace el plugin nativo con el secreto `SENTRY_AUTH_TOKEN` (`eas secret:create --name SENTRY_AUTH_TOKEN --value <token> --type string` o configurado en el proyecto de EAS); **sin ese secreto el build sigue funcionando igual**, solo no sube los source maps (los reportes llegan con el stack minificado).

## Archivos de configuración

| Archivo | Para qué |
|---|---|
| `tailwind.config.js` | Design Tokens y rutas donde Tailwind busca clases (`src/**`) |
| `src/presentation/theme/colors.js` | Paleta; la usan Tailwind y los componentes que reciben color por prop |
| `global.css` | Directivas de Tailwind; se importa una vez en `src/app/_layout.tsx` |
| `babel.config.js` | `jsxImportSource: 'nativewind'` para que `className` funcione |
| `metro.config.js` | `withNativeWind`: compila `global.css` (ver "Monitoreo de errores" sobre por qué no usa `withSentryConfig`) |
| `nativewind-env.d.ts` | Tipos de `className` y declaración de imports `.css` (TypeScript 6 los verifica) |
| `app.json` | Nombre, identificadores (`com.transferblack.passenger`), scheme, splash en obsidian, plugins |

Una clase construida dinámicamente (`` `bg-${color}` ``) **no se genera**: Tailwind solo detecta clases escritas completas en el código.
