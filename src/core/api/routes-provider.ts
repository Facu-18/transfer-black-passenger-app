import type { RoutesProvider } from '@/infrastructure/interfaces/routes';

import { geoapifyRoutesProvider } from './geoapify-routes-provider';

/**
 * Proveedor de rutas activo. Para migrar a Google Maps: escribir
 * `google-routes-provider.ts` que cumpla `RoutesProvider` y asignarlo aca.
 */
export const routesProvider: RoutesProvider = geoapifyRoutesProvider;
