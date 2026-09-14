# Transfer Black — App de pasajeros

Aplicación móvil del pasajero. React Native + Expo + TypeScript, estilos con NativeWind (Tailwind CSS).

La app de conductores comparte la misma arquitectura base y los mismos Design Tokens: cualquier diferencia de configuración entre los dos proyectos tiene que quedar documentada acá.

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
├── core/               Qué hace la app, sin React Native
│   ├── actions/        Casos de uso: una función por operación (ej. solicitar un viaje)
│   └── api/            Cliente y configuración para hablar con el backend
├── infrastructure/     Cómo se traducen los datos externos
│   ├── interfaces/     Tipos de las respuestas de la API y de los modelos de la app
│   └── mappers/        Conversión respuesta de API ⇄ modelo de la app
└── presentation/       Lo que ve y toca el usuario
    ├── components/     Componentes reutilizables
    ├── hooks/          Hooks de UI (estado de pantalla, llamadas a actions)
    └── screens/        Pantallas
```

Reglas:

- `core` no importa nada de `presentation` ni de `react-native`.
- Las pantallas no llaman a la API directamente: usan un hook, que llama a una action, que usa `core/api` y los mappers.
- Las respuestas de la API (snake_case, forma del backend) no llegan a los componentes: se mapean antes a las interfaces de la app.
- Las carpetas se agregan cuando una funcionalidad concreta las necesita, no por adelantado.

Imports con alias `@/` → `src/` (configurado en `tsconfig.json`; Metro lo resuelve solo):

```ts
import { Typography } from '@/presentation/components/Typography';
```

TypeScript en modo `strict`. No usar `any`; si un caso lo exige, justificarlo con un comentario al lado.

## Design Tokens

Definidos **una sola vez** en `tailwind.config.js`. Ese bloque `theme` es idéntico en la app de conductores.

### Colores

| Token | Valor | Uso |
|---|---|---|
| `obsidian` | `#0A0A0C` | Fondo |
| `gold` | `#D4AF37` | Acciones y acentos |
| `platinum` | `#E4E4E5` | Texto principal |
| `ash` | `#8E8E93` | Texto secundario |
| `charcoal` | `#2C2C2E` | Bordes y superficies |

Se usan con cualquier utilidad de color: `bg-obsidian`, `text-gold`, `text-platinum`, `text-ash`, `border-charcoal`, etc. La configuración **reemplaza** la paleta de Tailwind: fuera de estos cinco (más `transparent`) no existen clases de color. Nunca escribir hexadecimales en pantallas o componentes.

### Tipografía

Montserrat es la única familia. Se carga en `App.tsx` con `@expo-google-fonts/montserrat` (funciona en Expo Go y en builds nativos); el splash se mantiene hasta que las fuentes están listas.

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

`tone`: `primary` (platinum, por defecto), `secondary` (ash), `accent` (gold), `inverse` (obsidian, para texto sobre gold). Peso y color van por props y no por `className` porque dos clases que pisan la misma propiedad (ej. `text-platinum` y `text-gold`) se resuelven por el orden de la hoja generada, no por el orden en que se escriben. Para H1–H3 en su tamaño mayor (`text-5xl`, `text-3xl`, `text-xl`) se puede pasar la clase de tamaño en `className`: Tailwind ordena los tamaños de menor a mayor, así que el mayor gana.

### Prueba del sistema de diseño

`src/presentation/components/DesignSystemTest.tsx` es lo que muestra la app hoy: paleta, jerarquía tipográfica, bordes y botones. Si se ve con Montserrat sobre fondo obsidian, la configuración funciona. Se reemplaza cuando exista la primera pantalla real.

## Archivos de configuración

| Archivo | Para qué |
|---|---|
| `tailwind.config.js` | Design Tokens y rutas donde Tailwind busca clases (`App.tsx`, `src/**`) |
| `global.css` | Directivas de Tailwind; se importa una vez en `App.tsx` |
| `babel.config.js` | `jsxImportSource: 'nativewind'` para que `className` funcione |
| `metro.config.js` | `withNativeWind`: compila `global.css` |
| `nativewind-env.d.ts` | Tipos de `className` y declaración de imports `.css` (TypeScript 6 los verifica) |
| `app.json` | Nombre, identificadores (`com.transferblack.passenger`), splash en obsidian |

Una clase construida dinámicamente (`` `bg-${color}` ``) **no se genera**: Tailwind solo detecta clases escritas completas en el código.
