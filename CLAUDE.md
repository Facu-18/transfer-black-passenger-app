@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repositorio

App móvil del **pasajero** de Transfer Black (remis/transfer, Córdoba, Argentina). Expo SDK 57,
React Native 0.86, TypeScript 6, NativeWind 4 + Tailwind 3.4, Expo Router.

Este repo tiene **solo la app**. El backend vive en `Facu-18/Transfer-Black` (carpeta `backend/`),
que además contiene `ESPECIFICACION_PROYECTO.md`, la fuente de los requisitos. La app consume el
backend **desplegado** (`EXPO_PUBLIC_API_URL`), cuyo contrato real se lee en
https://transfer-black-api.onrender.com/docs — esa documentación manda por encima de cualquier
ticket: los nombres de eventos y de campos del ticket no siempre coinciden con lo implementado.

El `README.md` documenta a fondo el entorno, los comandos, la arquitectura, los Design Tokens y
cada pantalla ya construida. Lo de acá es lo que no se deduce leyendo un archivo suelto.

Código, comentarios y textos de UI en español. En el código, sin tildes; en lo que ve el usuario,
con tildes y en voseo rioplatense.

## Comandos

```bash
npm install
npx expo start            # Metro; `a` abre en Android, o QR con Expo Go (SDK 57)
npm run typecheck         # tsc --noEmit: no hay linter, esta es la verificación estática
npx expo-doctor           # desajustes de dependencias del SDK
npx expo export --platform android --output-dir <tmp>   # arma el bundle: detecta errores que el typecheck no ve
```

No hay tests automatizados. Antes de dar algo por terminado: `typecheck` + `expo export`, y probarlo
en un dispositivo. Las dependencias nativas se agregan **siempre** con `npx expo install`.

## Reglas que no se ven en un archivo

- **Colores:** solo en `src/presentation/theme/colors.js`, que importa `tailwind.config.js`. La
  paleta de Tailwind está **reemplazada**: fuera de esos tokens no existen clases de color, y nunca
  se escribe un hexadecimal en un componente. Debe ser idéntica en la futura app de conductores.
- **Textos:** siempre con el componente `Typography`. El peso y el color van por props, no por
  `className`: dos clases que pisan la misma propiedad se resuelven por el orden de la hoja
  generada, no por el orden en que se escriben.
- **Fuentes:** las clases `font-*` eligen el **archivo** de Montserrat; la utilidad `fontWeight` de
  Tailwind está desactivada a propósito (en Android engrosa la fuente sintéticamente).
- **Capas:** `core/` (actions + cliente HTTP y socket, sin React Native) → `infrastructure/`
  (interfaces de la API, mappers, storage) → `presentation/` (componentes, hooks, pantallas, store).
  Las respuestas snake_case del backend no llegan a los componentes: se mapean antes. Los archivos
  de `src/app/` solo exportan una pantalla. El recorrido es siempre pantalla → hook
  (`presentation/hooks`) → action (`core/actions`) → `core/api` + mapper; una pantalla nunca llama a
  la API. Imports con alias `@/` → `src/`; TypeScript `strict`, sin `any` salvo justificado al lado.
- **Errores:** el interceptor convierte todo fallo en `ApiRequestError` (`status`, `code`, `message`,
  `details`; `NETWORK_ERROR` / `TIMEOUT` si no hubo respuesta). El mensaje al usuario se decide por
  `status` y `code`, nunca por el texto del backend.
- **Entorno:** `.env` (copia de `.env.example`). Las `EXPO_PUBLIC_*` quedan escritas en el bundle
  (nada secreto) y se leen con acceso literal a `process.env`; tras cambiarlas hay que reiniciar
  Metro. En un celular físico `localhost` es el celular: usar la IP de la PC.
- **Proveedores de mapas:** Geoapify está detrás de `PlacesProvider` y `RoutesProvider`; se cambia
  en un solo archivo (`core/api/places-provider.ts`, `core/api/routes-provider.ts`). Ojo: el
  `placeId` viaja a `POST /rides/quote`, así que el backend tiene que usar el mismo proveedor.

## Cosas del backend que sorprenden

- **Socket.IO:** el token va en el handshake y hay que emitir `ride:join` para entrar a la sala del
  viaje. Los eventos son `trip:status_changed` (solo trae `status`) y `driver:location` (cada 3 s).
  **REST es la verdad**: cada aviso dispara una consulta a `GET /rides/{tripId}`, que trae estado,
  origen, destino, chofer, auto, tarifa, estado del pago y si ya se calificó.
- **Un aviso emitido antes de entrar a la sala se pierde.** Por eso la app re-consulta al confirmarse
  `ride:joined`, al reconectar y al volver del segundo plano, y consulta cada 15 s mientras el viaje
  está en `draft` o `searching`. Sin eso, un pago con tarjeta deja la pantalla trabada.
- **Mercado Pago:** siempre se abre `init_point`. El viaje queda en `draft` hasta que el pago se
  acredita por webhook, cosa que puede tardar unos segundos. El backend **no** configura `back_urls`:
  el checkout no vuelve solo a la app.
- **Despacho:** la app no lo pide. El servidor ofrece los viajes en `searching` cada 10 s y reintenta.
- **Tokens:** el access token dura 15 minutos y el refresh **rota** en cada uso. El interceptor
  renueva una sola vez a la vez (`core/api/session-refresh.ts`): mandar dos veces el mismo refresh
  token cierra la sesión. El access token vive solo en memoria (`useAuthStore`) y el refresh en
  `expo-secure-store`; por eso cerrar la app hoy pierde la sesión.
- **Idempotencia:** las operaciones que mueven plata mandan `Idempotency-Key`
  (`core/api/idempotency.ts`), una por intento de confirmación y no por solicitud: si se regenera en
  cada reintento, se puede cobrar dos veces.
- **Render se duerme:** la primera solicitud tras un rato sin tráfico puede tardar ~1 minuto; por eso
  el timeout de Axios es de 60 s. No es un bug de la app.
- **Cancelar** pide `reason_code` (no `reason`), y hoy **no reembolsa** el pago de Mercado Pago.

## Estado y pendientes

Terminado: registro, login, verificación por PIN, home con mapa, búsqueda de direcciones,
cotización, pago (Mercado Pago y efectivo), radar, chofer en camino, viaje a bordo, recibo y
calificación.

Pendiente, no por olvido:

- PIN de validación a bordo, chat y llamada: el backend no tiene endpoint ni expone el teléfono.
- Reembolso y penalidad al cancelar: falta definir la política (especificación §24, punto 12).
- Restaurar la sesión al abrir la app, y por lo tanto retomar un viaje activo si la app se cerró.
- `back_urls` / deep link de vuelta desde el checkout.
- Historial de viajes (`/activity`) y cuenta (`/account`) son pantallas provisorias.

## Probar un viaje de punta a punta

Hace falta un chofer conectado por socket mandando posición: Swagger no alcanza, porque el despacho
solo encuentra choferes `online` con ubicación de menos de 5 km. Para eso está el simulador en
`C:\Users\Tonchi\OneDrive\Escritorio\simulador-chofer` (fuera de todo repo, con su propio README):
`npm run manual` lo deja online y las transiciones las hacés desde Swagger; `npm start -- --complete`
recorre el viaje entero solo.

Las credenciales de las cuentas de prueba (pasajero, choferes demo, admin) las publica el propio
Swagger en `/docs`. Un viaje sin cerrar deja al chofer `in_trip` y sin poder tomar otro.
