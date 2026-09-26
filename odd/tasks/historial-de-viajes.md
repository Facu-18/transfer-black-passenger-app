# Historial de viajes ("Mis viajes")

## Objetivo
El pasajero ve sus viajes en la pestaña de actividad (filtros Todos / Completados / Cancelados,
scroll infinito, pull to refresh, estado vacío) y abre el detalle con ruta, desglose de tarifa,
pago y calificación.

## Problema / por qué
El ticket supone `GET /v1/trips` (limit/offset) y `GET /v1/trips/:tripId`. El backend no tiene
listado para pasajeros (solo `GET /admin/rides`), usa `/rides` y pagina con `page/limit`. El
detalle no expone desglose de tarifa ni nombre del servicio (están en `fare_quotes` y
`service_types`).

## Decisiones
- Backend (`Transfer-Black`, rama `feature/historial`, solo commit; merge lo hace el usuario):
  `GET /rides?page&limit&status` para el pasajero (solicitante o pasajero, sin borradores) y
  `fare_breakdown` + `service_type` en `GET /rides/{tripId}`.
- App: sin TanStack Query ni date-fns (hook de paginación propio, `Intl`).

## Checks
- Backend: TDD estricto, `npm test` (vitest) + `npm run typecheck`.
- App: `npm run typecheck` + `npx expo export --platform android`.

## Tareas
- [x] H1 Backend: listado paginado del pasajero (TDD). Ruta: delegada.
- [x] H2 Backend: `fare_breakdown` y `service_type` en el detalle (TDD). Ruta: delegada (mismo writer).
- [x] H3 App: listado en la pestaña con filtros, paginación, refresh y vacío.
- [x] H4 App: detalle `(app)/trips/[tripId]`.
- [x] H5 Docs app.

## Progreso
- H1 `1e39c61`: GET /rides?page(1..10000)&limit(1..50)&status (coma, alias active), solo rol passenger, solicitante o pasajero, sin draft, created_at desc. Envelope { data: { trips, pagination: {page, limit, total, total_pages} } }. Índices nuevos trips_requested_by_created_at_idx y trips_passenger_created_at_idx (sync alter).
- H2 `eec4301`: service_type {code,name} y fare_breakdown {base,distance,time,discount,fees,total,currency} en el detalle.
- Review (reliability) aprobada y acknowledged (review-72c64ffa13e8415f). Fix de la advertencia page sin tope: `50bb992` (RED observado, GREEN). typecheck OK, vitest 184/184. Sin push: el usuario mergea.

- Backend mergeado y desplegado (verificado en docs.json).
- App (writer delegado): H3 `ce2cc8a`, H4 `6d89783`, H5 `979b936`. Fechas relativas manuales (format-date.ts, puro con now). Hook con requestId contra respuestas viejas. Pestaña Viajes con ícono History.
- Review (reliability) aprobada y acknowledged (review-74f891dae52e3d19). Fix `d811281`: limpiar lista al cambiar filtro; sin fecha inventada en el detalle. typecheck + expo export OK; assess medium under_budget.
- Probado en dispositivo por el usuario: OK. Sin push (el usuario abre el MR).
- Follow-ups no bloqueantes: tests de format-date (no hay runner), íconos por service_type.code, fijar viajes activos arriba en Todos.

## Estado
Ticket cerrado.
