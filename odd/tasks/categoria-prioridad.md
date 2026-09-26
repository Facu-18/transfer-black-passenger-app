# Categoría única "Prioridad"

## Objetivo
Dejar una sola categoría de servicio, "Prioridad", con la tarifa que hoy tiene "essential".
"essential" y "comfort" dejan de ofrecerse.

## Por qué no se borran
`trips.service_type_id` y `fare_quotes.service_type_id` referencian `service_types` con
`ON DELETE RESTRICT`: borrar rompe el historial. Se desactivan (`is_active = false`); la
cotización solo usa categorías activas.

## Alcance
- Backend (`Transfer-Black`, rama `feature/categorias`, commit; PR la abre el usuario):
  seeder con `prioridad` activa + `essential`/`comfort` inactivas, demo seeder, comentarios.
  Sin migraciones: el usuario corre el seeder en la Shell de Render tras el deploy.
- App (`develop`): revisar que Pricing se vea bien con una sola opción; limpiar referencias.
- Fuera de alcance: panel admin (texto fijo "Essential y Comfort"; otro repo).

## Checks
- Backend: TDD, `npm test` + `npm run typecheck`.
- App: `npm run typecheck` + `npx expo export --platform android`.

## Tareas
- [x] C1 Backend: categoría Prioridad y retiro de essential/comfort (TDD). Ruta: delegada.
- [x] C2 App: Pricing con una sola categoría.

## Progreso
- C1 `8e5b5c0`: seeder con prioridad activa (tarifa de essential) y essential/comfort inactivas vía upsert por code (actualiza is_active en filas existentes); demo: viajes activos usan prioridad, históricos quedan con essential/comfort. vitest 188/188, typecheck OK. RDD medium under_budget (201). Push de feature/categorias.
- Render: NODE_ENV=development, rootDir backend; comando recomendado `node dist/scripts/seed-service-types.js` (compilado por el build, no depende de tsx).

- Backend desplegado y seeder corrido por el usuario.
- C2 `6d008ce`: Recomendado solo con más de una opción; comentario y README. La selección ya tomaba options[0]. typecheck + expo export OK. Sin push.

## Estado
Falta prueba en dispositivo. Pendiente en otro repo: texto fijo en el panel admin.
