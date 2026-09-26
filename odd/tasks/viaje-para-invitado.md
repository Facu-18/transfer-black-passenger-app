# Viaje para un invitado (ticket #8)

## Objetivo
El titular pide un viaje para un tercero sin cuenta: carga nombre, teléfono y (opcional) email
del invitado, y el viaje se confirma con `third_party`. El titular queda como coordinador.

## Problema / por qué
El ticket supone `passenger` en `POST /rides/quote`, pero el backend desplegado recibe
`third_party: { name, phone_e164, email }` en `POST /rides/{tripId}/confirm`, con email
obligatorio y aviso solo por email. El diseño marca el email como opcional y promete aviso
por SMS/WhatsApp, que el backend no tiene.

## Decisiones
- Backend (`Transfer-Black`, rama `develop`): `third_party.email` pasa a opcional; sin email no
  se manda el correo de seguimiento. El coordinador recibe el `tracking_url` del invitado en
  `GET /rides/{tripId}` para compartirlo por WhatsApp desde la app (sin proveedor de SMS pago).
- `quote` no cambia: el invitado se envía al confirmar.
- Sin `react-native-phone-number-input` (sin mantenimiento, no apunta a RN 0.86 / New
  Architecture): prefijo `+54 9` fijo + número local, normalizado a E.164.
- Fuera de alcance: chat (ticket aparte), solapa "Agenda", "Compartir mi seguimiento" y
  "Cobro a cuenta del anfitrión" (sin soporte en backend).

## Checks
- Backend: TDD estricto con `npm test` (vitest) + `npm run typecheck` en `backend/`.
- App: sin tests automatizados; `npm run typecheck` + `npx expo export --platform android`.

## Entrega
Estrategia `ask-on-risk`. Commits de unidad de trabajo en `develop` de cada repo (PR a `main`
la abre el usuario).

## Tareas
- [x] B1 Backend: `third_party.email` opcional + notificación tolerante a email ausente (TDD).
      Ruta: delegada (writer, 2+ archivos no triviales). Commit `de494dc` (+ `b1c1aaa` admin muestra invitados sin email).
- [x] B2 Backend: `tracking_url` para el coordinador en el detalle del viaje + Swagger (TDD).
      Ruta: delegada. Commit `0981b60`.
- [x] F1 App: `guestPassenger` en `useTripStore` (limpio en `resetTrip`), `third_party` en
      `confirmRideAction`/interfaces, campo de teléfono compartido.
- [x] F2 App: pantalla `(app)/guest.tsx` (RHF + Zod), entrada desde Home, chip en Pricing.
- [x] F3 App: indicador "Sos el coordinador" y compartir seguimiento por WhatsApp en el viaje activo.
- [x] F4 Docs: README + CLAUDE.md de la app.

## Progreso
- Exploración hecha.
- Backend: `third_party.email` opcional (la columna ya era nullable, sin SQL manual); `tracking_url` en `GET /rides/{id}` solo para el solicitante de un viaje de tercero (token existe desde el draft). Admin muestra invitados sin email.
- Verificación backend: `npm run typecheck` limpio; `npm test` 139/139 (tras `npm ci`: faltaban mercadopago/nodemailer en node_modules). RDD assess: medium, under_budget (335 líneas) -> sin review aún.

- App (writer delegado): F1 `04d4138`, F2 `bea7b1b`, F3 `e7b940f`, F4 `cf9f11a` (incluye el ajuste previo de CLAUDE.md de /init). Teléfono: prefijo fijo +54 9, se sacan 0 y 15 iniciales, 10 dígitos. Chip en Search omitido (opcional).
- Verificación app: `npm run typecheck` limpio (spot check del padre); `expo export --platform android` OK (3879 módulos). Prueba en dispositivo: pendiente.
- RDD app: high (auth-form-fields.ts), 587 líneas; review concedida, 4 lentes, APROBADA sin bloqueantes y acknowledged (lineage review-5ec5d7d5bc2a076d, autoridad quemada). Backend: medium, under_budget, sin review.
- Advertencias no bloqueantes (follow-up): fallback de WhatsApp dice "Copiá el link" pero no hay forma de copiarlo (CoordinatorBanner.tsx:27); la Idempotency-Key no se renueva si cambia el invitado tras un intento fallido (useConfirmRide.ts:50); refine de phone.ts:45 no angosta el tipo; tipos de invitado duplicados en interfaces/trips.ts.

- Backend desplegado y verificado contra /docs.json (third_party requiere solo name y phone_e164; tracking_url presente).
- Follow-up de review: `8d3f489` (clave de idempotencia se renueva al cambiar el invitado; fallback a Share nativo). typecheck + expo export OK. RDD: medium, under_budget (21 líneas). Tipado de phone.ts y tipos duplicados: sin cambio (compila; conceptos distintos).

## Próximo paso
Prueba en dispositivo contra el backend desplegado.
