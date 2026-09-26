# Seguimiento público del invitado (`/track`)

## Objetivo
El invitado de un viaje para terceros abre el link del email/WhatsApp y ve, sin cuenta, el
estado del viaje, el chofer, el auto y un mapa con origen, destino y el auto en vivo.

## Problema / por qué
`TRIP_TRACKING_URL` apunta por defecto a `http://localhost:5173/track` y esa página no existe.
El endpoint público `GET /rides/track/{token}` no expone ubicación, origen ni destino.

## Alcance
- Backend (`Transfer-Black`, rama `feature/track-trip`, push autorizado): ampliar el endpoint
  público con origen, destino y ubicación del chofer (solo mientras el viaje está activo).
- Front (`transferblack-admin`, rama `feature/track-trip`): ruta pública `/track` fuera de
  `ProtectedRoute`, cliente HTTP sin auth, polling. PRs a develop/main los abre el usuario.

## Checks
- Backend: TDD estricto, `npm test` (vitest) + `npm run typecheck` en `backend/`.
- Admin: `npm run build` + `npm run lint` (sin tests).

## Entrega
Estrategia `ask-on-risk`. Commits de unidad de trabajo + push de `feature/track-trip` (backend
primero; el usuario abre PR y despliega; después el front).

## Tareas
- [x] T1 Backend: origen, destino y ubicación del chofer en `GET /rides/track/{token}` + Swagger
      (TDD). Ruta: delegada (writer, 2+ archivos no triviales).
- [x] T2 Backend: push de `feature/track-trip`.
- [x] T3 Admin: página pública `/track` con mapa y estado. Ruta: delegada.
- [x] T4 Admin: `.env.example` (`VITE_API_URL`) + docs; push hecho.

## Progreso
- T1 `87f9ff0`: origin, destination, driver_location (estados assigned/driver_arriving/driver_arrived/in_progress, frescura 120 s, desde app.driver_locations) y route (routeGeometry si existe). Sin ids internos. typecheck OK, vitest 151/151 (spot check del padre). RDD: medium, under_budget (336 líneas).
- T2: push de feature/track-trip (66f35b6..87f9ff0).
- Hallazgos: sin rate limiting en todo el backend (token de 32 caracteres, enumeración inviable; follow-up); CORS requiere el origen del panel desplegado en CORS_ALLOWED_ORIGINS.

- Backend desplegado y verificado (docs.json con driver_location).
- Admin (writer delegado): `89acab6` cliente público + hook, `f4fd1ae` página /track con Leaflet/CARTO, `df726e2` .env.example + README. build OK (spot check del padre); lint: 1 error previo en Login.tsx:34 (no tocado). Sin config de hosting: hace falta rewrite /* -> /index.html.
- RDD admin: medium, slice_budget_reached; review concedida (lente reliability), APROBADA y acknowledged (lineage review-252adf91676b4dd5). Advertencias corregidas en `ce19fac` (finalizado como completo, sin NaN, sondeo fallido no tapa el viaje); build + lint OK; assess medium under_budget.
- Push: feature/track-trip del panel (5607086..ce19fac).
- Pendiente (usuario): PR, deploy del panel con rewrite SPA, TRIP_TRACKING_URL y CORS_ALLOWED_ORIGINS en Render; prueba punta a punta. Sin tests en el panel (R3-no-tests); error previo de lint en Login.tsx:34.

- Prueba real del usuario con ngrok: estados, timeline y datos OK. El auto no se movía porque el simulador manual manda siempre las mismas coordenadas (confirmado por el usuario).
- `4d98704`: allowedHosts de Vite para ngrok; build OK; push.

## Estado
Ticket cerrado. Pendiente de producción (usuario): deploy del panel con rewrite SPA, TRIP_TRACKING_URL y CORS_ALLOWED_ORIGINS con el dominio real. Contrato para la app de conductor: emitir driver:location_update con la posición real cada pocos segundos.
