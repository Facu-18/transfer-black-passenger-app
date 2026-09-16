import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';

import { resolvePlaceFromCoordinatesAction } from '@/core/actions/resolve-place-from-coordinates.action';
import type { Coordinates } from '@/infrastructure/interfaces/places';
import { useTripStore } from '@/presentation/store/useTripStore';

export type LocationStatus = 'checking' | 'granted' | 'denied' | 'unavailable';

/**
 * Pide el permiso de ubicacion en primer plano, obtiene la posicion y la guarda
 * en `useTripStore` junto con su direccion (para proponerla como origen).
 */
export function useLocationPermissions() {
  const currentLocation = useTripStore((state) => state.currentLocation);
  const setCurrentLocation = useTripStore((state) => state.setCurrentLocation);
  const setCurrentPlace = useTripStore((state) => state.setCurrentPlace);
  const [status, setStatus] = useState<LocationStatus>('checking');
  const [canAskAgain, setCanAskAgain] = useState(true);

  const resolveAddress = useCallback(
    async (coordinates: Coordinates) => {
      try {
        const place = await resolvePlaceFromCoordinatesAction(coordinates);
        if (place) setCurrentPlace(place);
      } catch {
        // Sin direccion el mapa funciona igual; en la busqueda el origen se elige a mano.
      }
    },
    [setCurrentPlace],
  );

  const locate = useCallback(async () => {
    setStatus('checking');

    const permission = await Location.requestForegroundPermissionsAsync();
    setCanAskAgain(permission.canAskAgain);

    if (!permission.granted) {
      setStatus('denied');
      return;
    }

    // La ultima posicion conocida llega al instante y centra el mapa mientras el GPS afina.
    let lastKnown: Coordinates | null = null;
    try {
      const position = await Location.getLastKnownPositionAsync();
      if (position) {
        lastKnown = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setCurrentLocation(lastKnown);
      }
    } catch {
      // Sin ultima posicion se espera la actual.
    }

    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };

      setCurrentLocation(coordinates);
      setStatus('granted');
      await resolveAddress(coordinates);
    } catch {
      // Sin posicion precisa (GPS apagado, sin señal), la ultima conocida alcanza para proponer el origen.
      if (lastKnown) {
        setStatus('granted');
        await resolveAddress(lastKnown);
        return;
      }
      setStatus('unavailable');
    }
  }, [resolveAddress, setCurrentLocation]);

  useEffect(() => {
    void locate();
  }, [locate]);

  /** Si el usuario nego el permiso para siempre, el sistema ya no lo vuelve a preguntar: hay que ir a Ajustes. */
  const retry = useCallback(() => {
    if (status === 'denied' && !canAskAgain) {
      void Linking.openSettings();
      return;
    }
    void locate();
  }, [canAskAgain, locate, status]);

  return { status, currentLocation, retry };
}
