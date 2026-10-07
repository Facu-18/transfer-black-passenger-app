import type { PlacesProvider } from '@/infrastructure/interfaces/places';

import { googlePlacesProvider } from './google-places-provider';

/**
 * Proveedor de lugares activo. Es el unico punto a cambiar para migrar de
 * proveedor: escribir otro archivo que cumpla `PlacesProvider` y asignarlo aca.
 *
 * Ojo al migrar: el `placeId` viaja a `POST /rides/quote`, asi que el backend
 * tiene que usar el mismo proveedor que la app.
 */
export const placesProvider: PlacesProvider = googlePlacesProvider;
