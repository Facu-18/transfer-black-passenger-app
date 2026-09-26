# Cancelaciones: reintegros y penalidad

## Objetivo
Al cancelar el pasajero: reintegro automático cuando corresponde; penalidad al pasajero y
compensación al chofer si el chofer ya llegó; lo mismo para efectivo (vía deuda del pasajero).

## Problema / por qué
`cancelLockedTrip` no toca pagos ni ledger (`cancellationPenaltyAmount` fijo en 0). El reintegro
de MP existe solo para pagos duplicados. El pasajero no tiene cuenta en el ledger. La
especificación deja la política abierta (§24.12).

## Política acordada (con el usuario, 2026-09-25)
| Momento (cancela el pasajero) | Pasajero | Chofer |
|---|---|---|
| draft / scheduled / searching | gratis, reintegro total | — |
| assigned / driver_arriving (cualquier momento) | gratis, reintegro total | — |
| driver_arrived | penalidad P fija | compensación C = 70% de P |
- Ventana N = 2 min desde `assigned_at` (se registra; hoy no cambia el resultado porque
  cancelar con chofer en camino es gratis siempre — decisión 2).
- P fija: 1500 ARS (configurable). C = 70% de P (configurable). La plataforma nunca pone plata.
- Cancela el chofer: nunca penaliza al pasajero; reintegro total.
- Efectivo: P queda como deuda del pasajero, se suma a su próximo viaje; C se acredita al chofer
  en el momento (la plataforma asume el riesgo).
- MP con penalidad: reintegro parcial (tarifa − P).
- Reintegro fuera de la transacción: outbox + worker idempotente; pago acreditado después de
  cancelar → reintegro automático.
- Vista previa: `GET /rides/{id}/cancellation-preview` como única fuente de la política para la app.
- Fuera de alcance: no-show (cancelación del chofer por pasajero ausente) — pendiente.

## Checks
- Backend (`Transfer-Black`, rama `feature/cancelaciones-reintegros`): TDD estricto,
  `npm test` + `npm run typecheck`.
- App: `npm run typecheck` + `npx expo export --platform android`.

## Entrega
Estrategia `single-pr` (flujo habitual del usuario: una rama, una PR). Commits por unidad de
trabajo. Supera ~400 líneas: avisado al usuario.

## Tareas
- [x] B1 Política pura + config + `GET /rides/{id}/cancellation-preview`. Ruta: delegada.
- [x] B2 Cancelación aplica la política: penalidad persistida + movimientos de ledger
      (`cancellation_penalty`, `cancellation_compensation`, cuenta `passenger`). Ruta: delegada.
- [x] B3 Reintegro total/parcial vía outbox + worker, `partially_refunded`, reintegro de pagos
      tardíos. Ruta: delegada.
- [x] B4 Deuda del pasajero en efectivo: se cobra en el próximo viaje; voucher: penalidad a la empresa. Ruta: delegada.
- [ ] A1 App: vista previa en la confirmación, resultado y aviso de deuda.

## Progreso
- B1 `7934c61`: evaluateCancellation pura + env CANCELLATION_*.
- B2 `7b9afcc`: cancelLockedTrip aplica la política; preview GET /rides/{id}/cancellation-preview; ledger: cuenta passenger, asientos cancellation_penalty (collections o passenger -P / platform +P) y cancellation_compensation (platform -C / driver +C), referencias cancellation_penalty:<tripId>; payments.refund_status/refund_requested_amount como costura para B3. Sin SQL (columnas STRING). vitest 223/223, typecheck OK (spot check del padre).
- Decisión del usuario (2026-09-25): voucher corporativo con chofer llegado → la penalidad se carga a la EMPRESA (reporte corporativo), no al empleado. Se implementa en B4 (hoy B2 lo trata como deuda del pasajero).
- B3 `3c87a74`: refundPayment total/parcial (PaymentRefund), executor por polling de payments.refund_status con FOR UPDATE SKIP LOCKED, llamada a MP fuera de la transacción, idempotency key refund:<paymentId>, 5 intentos; partially_refunded; webhook no revierte ledger en viajes cancelados; pago tardío tras cancelar → reintegro (monto − penalidad); detalle expone refund. vitest 245/245, typecheck OK. Columnas nuevas llegan por db-sync con alter:true en el build (NODE_ENV=development).
- B4a `b18489e`: deuda del pasajero (saldo cuenta passenger) expuesta en quote (pending_debt, total_with_debt), sumada al checkout MP / cobro en efectivo; snapshot trips.debt_charged_amount + debt_settled_at; asiento passenger_debt_settlement (MP: collections -D / passenger +D; efectivo: driver -D / passenger +D); advisory lock por pasajero + reclamo de deuda no liquidada.
- B4b `f4685a6`: voucher → company_charge_amount; cuenta company, asiento company -P / platform +P; reporte corporativo JSON suma cancellation_penalties (sin centro de costo; CSV sin cambios).
- vitest 272/272, typecheck OK (spot check del padre). RDD: high (payments), 3613 líneas → consentimiento pedido.
- Riesgos anotados: deuda buscada por requestedByUserId (vs passengerUserId ?? requester al penalizar); app de chofer debe sumar debt_charged_amount al cobrar en efectivo.

- Review: el rango completo (3613 líneas) excedió el presupuesto de contexto; se revisó commit por commit en worktrees temporales (Transfer-Black-worktrees, ya borrados). Las 5 aprobadas y acknowledged. Dos correcciones acotadas exigidas por la review: `c39da04` (reintegros trabados en processing: reclamo con vencimiento de 10 min) y `7d3aa1c` (la deuda es de quien pide el viaje: debtHolderId = requestedByUserId en penalidad y liquidación). Conflicto de cherry-pick en el test del ledger resuelto conservando ambos casos. vitest 274/274, typecheck OK en la rama.
- Advertencias no bloqueantes pendientes: (1) un draft que nunca se paga retiene la deuda reclamada para siempre; (2) si no se encuentra la empresa del voucher, la cancelación falla; (3) un reembolso MP en estado in_process se trata como error; (4) el origen de la penalidad en el ledger se decide por tipo de pago y no por si se cobró; (5) comentario viejo sobre processing.

## Próximo paso
Decisión del usuario sobre las advertencias; push; mensaje de PR; A1.
