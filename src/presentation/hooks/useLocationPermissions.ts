import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';

import { resolvePlaceFromCoordinatesAction } from '@/core/actions/resolve-place-from-coordinates.action';
import type { Coordinates } from '@/infrastructure/interfaces/places';
import { useTripStore } from '@/presentation/store/useTripStore';
import { distanceMeters } from '@/presentation/utils/geo';

/** Si el GPS preciso cae a mas de esto de la ultima posicion conocida, se vuelve a buscar la direccion. */
const ADDRESS_REFRESH_METERS = 100;

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

  // Puede haber dos busquedas en vuelo (ultima posicion y GPS preciso): solo
  // vale la ultima pedida, aunque la otra responda despues.
  const addressRequest = useRef(0);

  const resolveAddress = useCallback(
    async (coordinates: Coordinates) => {
      const request = ++addressRequest.current;
      try {
        const place = await resolvePlaceFromCoordinatesAction(coordinates);
        if (place && request === addressRequest.current) setCurrentPlace(place);
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
        // Sin esperar al GPS (puede tardar varios segundos): el origen ya se puede proponer.
        setStatus('granted');
        void resolveAddress(lastKnown);
      }
    } catch {
      // Sin ultima posicion se espera la actual.
    }

    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };

      setCurrentLocation(coordinates);
      setStatus('granted');
      // La direccion de la ultima posicion ya se pidio: solo se vuelve a pedir si se movio.
      if (!lastKnown || distanceMeters(lastKnown, coordinates) > ADDRESS_REFRESH_METERS) {
        await resolveAddress(coordinates);
      }
    } catch {
      // Sin posicion precisa (GPS apagado, sin señal), la ultima conocida alcanza para proponer el origen.
      if (!lastKnown) setStatus('unavailable');
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
