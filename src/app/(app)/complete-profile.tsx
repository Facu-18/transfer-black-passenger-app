import { router, useLocalSearchParams } from 'expo-router';

import { CompleteProfileScreen } from '@/presentation/screens/CompleteProfileScreen';

/** A donde volver tras guardar, segun por donde se interrumpio el pedido de viaje. */
const RETURN_ROUTES = {
  search: '/search',
  guest: '/guest',
  pricing: '/pricing',
} as const;

type ReturnKey = keyof typeof RETURN_ROUTES;

function isReturnKey(value: string | undefined): value is ReturnKey {
  return value !== undefined && value in RETURN_ROUTES;
}

/**
 * Se llega aca cuando el perfil esta incompleto y se intenta pedir un viaje
 * (ver `(app)/_layout.tsx`). Guardar los datos retoma el pedido donde
 * quedo: origen, destino e invitado siguen en `useTripStore`.
 */
export default function CompleteProfileRoute() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

  return (
    <CompleteProfileScreen
      reason="Completá tus datos para pedir tu primer viaje."
      onSaved={() => {
        if (isReturnKey(returnTo)) {
          router.replace(RETURN_ROUTES[returnTo]);
        } else {
          router.back();
        }
      }}
    />
  );
}
