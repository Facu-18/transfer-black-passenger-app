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

En un teléfono físico `localhost` apunta al propio teléfono: usar la IP de la PC en la red local. Después de cambiar `.env`, reiniciar Metro.

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
| `/activity` | `(app)/(tabs)/activity.tsx` | Provisoria |
| `/account` | `(app)/(tabs)/account.tsx` | Provisoria; permite cerrar sesión |
| `/search` | `(app)/search.tsx` | "Planifica tu viaje" |
| `/pricing` | `(app)/pricing.tsx` | Cotización, categoría y confirmación |
| `/trip/[tripId]` | `(app)/trip/[tripId].tsx` | Viaje activo: radar, chofer en camino y viaje en curso, en vivo |
| `/receipt/[tripId]` | `(app)/receipt/[tripId].tsx` | Recibo del viaje terminado y calificación del chofer |

`(public)` agrupa las rutas sin sesión y `(app)` la zona privada; el nombre del grupo no aparece en la URL. El layout de `(app)` es la compuerta: sin sesión redirige a `/login` y con el correo sin verificar, a `/verify-email`. `/verify-email` también redirige a `/login` si no hay sesión, porque el endpoint exige el access token.

Dentro de `(app)`, `(tabs)` tiene la barra inferior flotante (`FloatingTabBar`); `search` y `pricing` quedan fuera de las pestañas, a pantalla completa, con `slide_from_right`. `trip/[tripId]` y `receipt/[tripId]` entran con fundido y sin gesto de volver: mientras el viaje sigue, el botón atrás de Android no hace nada (no hay otra forma de volver a esa pantalla); al terminar o cancelar, `router.dismissTo('/home')` vacía la pila. Para navegar se usan las rutas sin grupos (`/home`, `/search`): resuelven igual aunque cambie el anidado.

## Home y búsqueda de direcciones

### Mapa y ubicación

- `react-native-maps` con `PROVIDER_GOOGLE` en Android (estilo oscuro de `theme/map-style.ts`, sin puntos de interés) y Apple Maps en iOS (`userInterfaceStyle="dark"`). En Expo Go no requiere key; para builds de tienda hay que configurar `androidGoogleMapsApiKey` / `iosGoogleMapsApiKey` en el plugin de `react-native-maps`.
- `useLocationPermissions` pide el permiso en primer plano al montar el Home, toma la última posición conocida (centra rápido) y después la actual. Guarda `currentLocation` en `useTripStore` y la convierte en dirección (geocodificación inversa) para proponerla como origen. Sin permiso o sin señal, el chip del mapa permite reintentar o abrir Ajustes.
- **Emulador de Android**: si Google Play Services está desactualizado, rechaza la firma de Expo Go (`GoogleCertificatesRslt: not allowed` en logcat) y el mapa queda sin tiles. En un teléfono con Play Services al día funciona.

### Proveedor de lugares (Geoapify, migrable a Google)

Las pantallas no conocen al proveedor. El contrato está en `infrastructure/interfaces/places.ts` (`Place`, `PlacesProvider`: `autocomplete` y `reverseGeocode`) y la implementación activa se elige en **un solo archivo**, `core/api/places-provider.ts`.

Para migrar a Google Maps: escribir `core/api/google-places-provider.ts` que cumpla `PlacesProvider` (con su mapper en `infrastructure/mappers/`) y asignarlo en `places-provider.ts`. El `placeId` viaja a `POST /rides/quote`, así que el backend tiene que migrar al mismo proveedor.

Geoapify se consulta por REST con `EXPO_PUBLIC_GEOAPIFY_API_KEY`: resultados en español, solo Argentina, priorizando la cercanía a la ubicación actual. El orden final lo decide Geoapify, que pesa mucho la coincidencia de texto: "Colón 1200" puede traer primero otras ciudades. La key queda legible dentro de la app: usar una propia, distinta de la del backend.

### Planifica tu viaje

- Dos campos (origen y destino) comparten una lista: la del campo activo. El destino recibe el foco al entrar; el origen viene con la ubicación actual ("Ubicación actual").
- `usePlaceSearch` espera 350 ms tras la última tecla, busca desde 3 caracteres y cancela la búsqueda anterior.
- Al elegir destino se guarda en `useTripStore.destinationLocation` y en recientes; con origen, avanza a `/pricing`. Sin origen (sin ubicación), pide elegirlo primero.
- **Recientes**: los últimos 5 destinos, guardados en el dispositivo (`recent-places-storage.ts`). El backend no tiene lugares frecuentes ni guardados; el Home muestra estos mismos recientes.
- "Reserva", "Para mí", "Viaje corporativo", "Para un invitado" y las notificaciones informan que llegan pronto.

## Cotización y confirmación del viaje

`POST /rides/quote` (201) crea el viaje en `draft` y devuelve `{ draft, route, quotes[] }`. Origen y destino viajan como `{ address_text, place_id, latitude, longitude }`, con el `placeId` del mismo proveedor de mapas que usa el backend.

- **La ruta del mapa viene del backend**: `route.geometry` es un `MultiLineString` con los puntos `[longitud, latitud]` de la ruta que se cotizó. `trip-quote.mapper.ts` los da vuelta a `{ latitude, longitude }` para `Polyline`. Así la línea dibujada es la misma ruta que se cobró y la app no repite la llamada al proveedor.
- **Los importes son texto** (`"24500.00"`) y se conservan así en `totalAmount`; el `Number` solo se usa para mostrarlos formateados.
- **La cotización vence** (10 minutos): `useRideQuote` vuelve a cotizar sola al llegar esa hora, porque confirmar con una tarifa vencida responde 409.
- La categoría elegida se recuerda por `code` entre recotizaciones: los `id` cambian, la categoría no.

`POST /rides/{tripId}/confirm` espera `{ fare_quote_id, payment: { type } }` y el header **`Idempotency-Key`** (UUID v4 de `expo-crypto`). La clave se genera una vez por borrador: reintentar no cobra dos veces, y se renueva si hay que recotizar.

| Medio de pago | `payment.type` | Qué pasa |
|---|---|---|
| Efectivo | `cash` | El viaje pasa a `searching` y la app va a `/trip/[tripId]`, que arranca con el radar |
| Mercado Pago | `account_money` | La respuesta trae `payment.checkout_url`: se abre el checkout, que admite dinero en cuenta y tarjetas de crédito o débito. **El viaje queda en `draft`** hasta que el pago se acredite por webhook: la pantalla del viaje muestra "Confirmando tu pago" y pasa sola al radar cuando llega el aviso |

Errores: 409 `FARE_QUOTE_EXPIRED` recotiza sola, 409 `INVALID_TRIP_TRANSITION` vuelve al Home, 400 al cotizar ofrece reintentar y 401 reusa `handleExpiredSession()`.

Pendiente del lado del backend: no configura `back_urls` en Mercado Pago, así que el checkout no vuelve solo a la app (el pasajero cierra el navegador).

## Viaje activo y tiempo real

`ActiveTripScreen` es una sola pantalla que cambia de panel según el estado, con un fundido deslizante (Reanimated) para que la transición no recargue el mapa:

| Estado | Panel |
|---|---|
| `draft` | "Confirmando tu pago" |
| `searching` | Radar (`RadarPulse`) sobre el origen, "Contactando choferes VIP…", resumen del recorrido y "Cancelar búsqueda" |
| `assigned` / `driver_arriving` | "Conductor en camino": ETA, distancia, chofer (nombre, calificación), auto con patente, Llamar / Chat (próximamente) y Cancelar |
| `driver_arrived` | El mismo panel con "Tu chofer llegó" |
| `in_progress` | **A bordo**: el auto va al destino, ETA ("12 min", "Llegada 10:18"), chofer y patente, barra con destino y "Compartir ETA" |
| `completed` | Pasa al recibo con `router.replace`: "atrás" no vuelve al mapa |
| `cancelled` | Estado simple con "Volver al inicio" |

- **REST es la verdad, el socket acelera.** `useActiveTrip` consulta `GET /rides/{tripId}` (estado, origen, destino, chofer y auto) y se suscribe a `core/api/realtime-client.ts`. Cada `trip:status_changed` muestra el estado nuevo al instante y vuelve a consultar el detalle; también se re-consulta al reconectar el socket, al volver del segundo plano y al confirmarse la entrada a la sala (`ride:joined`): un aviso emitido antes de entrar a la sala se pierde, y con tarjeta el pago suele acreditarse justo en ese hueco. Mientras el socket está caído, consulta cada 10 s y muestra "Reconectando…"; con el socket conectado, igual consulta cada 15 s mientras el viaje está en `draft` o `searching`, los estados que avanzan solos.
- **Socket.IO** (`socket.io-client`): una sola conexión para toda la app, abierta solo mientras hay un viaje que seguir. El token va en `auth` como función, así cada reconexión usa el vigente; un rechazo por token vencido lo renueva y reconecta. Hay que emitir `ride:join` para entrar a la sala del viaje, y el cliente lo repite en cada reconexión. Con `__DEV__` deja logs `[socket]` en la consola de Metro.
- **Despacho**: no lo pide la app. El backend ofrece solo los viajes en `searching` a los choferes cercanos cada 10 s y reintenta mientras nadie acepte.
- **El auto** (`DriverCarMarker`) recibe `driver:location` cada ~3 s. `useAnimatedCoordinate` interpola entre posiciones durante esos 3 s (sin `AnimatedRegion`, que depende de clases internas de React Native) y gira la flecha según el rumbo; un salto de más de 1 km se mueve sin animar.
- **ETA y ruta al origen** (`useDriverEta`): Geoapify Routing detrás de `RoutesProvider` (`core/api/routes-provider.ts`, migrable a Google igual que los lugares). Se recalcula al llegar la primera posición y después cada 30 s, no con cada posición, para no gastar cuota. Si el proveedor falla, estima con la distancia en línea recta.
- **Cancelar**: confirmación y `POST /rides/{tripId}/cancel` con `reason_code: passenger_cancelled`; vuelve al Home. La penalidad por cancelación todavía no existe en el backend.
- **Fuera de alcance por ahora**: PIN de validación (el backend no tiene endpoint), chat y llamada (el backend no expone el teléfono del chofer), y retomar el viaje si la app se cierra del todo. Compartir ETA, Destino, Confort, Concierge, el botón de seguridad y el PDF del comprobante se muestran como en el diseño y avisan "Próximamente".

### Recibo y calificación

`ReceiptScreen` relee `GET /rides/{tripId}`: tarifa final (`final_fare`), origen, destino, minutos de trayecto (`started_at` → `finished_at`), km de la ruta cotizada (`estimated_distance_meters`), medio y estado del pago (`payment_status`) y si ya calificó (`rating`).

- Las estrellas arrancan en 0 y "Calificar y finalizar" queda deshabilitado hasta elegir al menos una. Los motivos (Puntualidad, Conducción suave, Vehículo impecable) viajan como `tags`.
- `POST /rides/{tripId}/ratings` con `{ rating, tags? }`: 201 vuelve al Home y limpia el viaje en armado (`resetTrip`). Un 409 `RATING_ALREADY_EXISTS` se trata igual que el éxito (por ejemplo, un reintento).
- "Omitir" y el botón atrás de Android vuelven al Home sin calificar. Si el viaje ya estaba calificado, se muestran las estrellas dadas y "Volver al inicio".

Para probar sin la app del chofer hace falta un chofer que esté conectado por socket y mande su posición (una cuenta demo con un script). Swagger no alcanza: el despacho solo encuentra choferes online con ubicación.

## API y sesión

- **Cliente**: `core/api/transfer-black-api.ts`, instancia de Axios con `baseURL = EXPO_PUBLIC_API_URL`. Documentación del backend: https://transfer-black-api.onrender.com/docs
- **Errores**: el interceptor de respuesta convierte todo fallo en `ApiRequestError` (`status`, `code`, `message`, `details`). `code` es el código estable del backend (`EMAIL_ALREADY_EXISTS`, `VALIDATION_ERROR`...) o `NETWORK_ERROR` / `TIMEOUT` si no hubo respuesta. Las pantallas deciden el mensaje mirando `status` y `code`, nunca el texto del backend.
- **Timeout de 60s**: el backend en Render se duerme tras unos minutos sin tráfico y la primera solicitud puede tardar cerca de un minuto en despertarlo.
- **Tokens**: `useAuthStore` (Zustand) guarda el access token solo en memoria y el refresh token en `expo-secure-store` (Keychain / Keystore; AsyncStorage no cifra). El interceptor de solicitud agrega `Authorization: Bearer` con el access token vigente.
- **Renovación**: el access token dura 15 minutos. Ante un 401, el interceptor de respuesta pide `POST /auth/refresh`, guarda el refresh token nuevo (rota en cada uso) y repite la solicitud una vez. Las solicitudes que fallan a la vez esperan la misma renovación (`core/api/session-refresh.ts`): mandar dos veces el mismo refresh token cerraría la sesión. Si el backend rechaza el refresh token, el 401 llega a la pantalla y `handleExpiredSession()` vuelve al login; si la renovación falla por red, la pantalla recibe un error de conexión y la sesión sigue.
- **Pendiente**: restaurar la sesión al abrir la app. Hoy la sesión vive mientras la app está abierta.

### Registro de pasajero

La ruta real es `POST /auth/register` (no `/auth/register/passenger`), y solo acepta `email` y `password`: cualquier otro campo es un 400. Por eso `registerPassengerAction` hace dos solicitudes:

1. `POST /auth/register` → cuenta, perfil y tokens.
2. `PATCH /users/me` con `first_name`, `last_name` y `phone_number` (E.164), usando el access token recién emitido.

Si falla solo el paso 2, la cuenta ya existe y la sesión es válida: se sigue igual y la acción devuelve `profileSaved: false`. "Nombre y apellido" se divide en el primer espacio: la primera palabra es el nombre y el resto, el apellido.

Las reglas de contraseña del formulario replican las del backend: 8 a 128 caracteres, con minúscula, mayúscula y número.

### Inicio de sesión

`POST /auth/login` devuelve lo mismo que el registro (`profile` + `tokens`). Email inexistente, contraseña incorrecta y cuenta no activa responden igual, 401 `INVALID_CREDENTIALS`, así que la pantalla muestra un único "Correo o contraseña incorrectos." y vacía la contraseña.

- El formulario solo exige contraseña no vacía, sin reglas de fortaleza: una cuenta creada antes de que cambiaran tiene que poder entrar.
- Una cuenta sin rol `passenger` (conductor, administrador) no se guarda en el store y ve un aviso: esta app es solo para pasajeros.
- Destino: `/home` si el correo está verificado, `/verify-email` si no.
- "¿Olvidaste tu contraseña?" solo informa: el backend no tiene endpoint de recuperación.
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

Los mensajes de conexión, timeout y validación comunes a los formularios salen de `presentation/utils/api-error-message.ts`, y la validación de email compartida, de `presentation/utils/auth-form-fields.ts`.

## Archivos de configuración

| Archivo | Para qué |
|---|---|
| `tailwind.config.js` | Design Tokens y rutas donde Tailwind busca clases (`src/**`) |
| `src/presentation/theme/colors.js` | Paleta; la usan Tailwind y los componentes que reciben color por prop |
| `global.css` | Directivas de Tailwind; se importa una vez en `src/app/_layout.tsx` |
| `babel.config.js` | `jsxImportSource: 'nativewind'` para que `className` funcione |
| `metro.config.js` | `withNativeWind`: compila `global.css` |
| `nativewind-env.d.ts` | Tipos de `className` y declaración de imports `.css` (TypeScript 6 los verifica) |
| `app.json` | Nombre, identificadores (`com.transferblack.passenger`), scheme, splash en obsidian, plugins |

Una clase construida dinámicamente (`` `bg-${color}` ``) **no se genera**: Tailwind solo detecta clases escritas completas en el código.
