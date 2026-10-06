import type { Coordinates } from '../interfaces/places';

/**
 * Decodifica el algoritmo de polyline de Google (precision 5), tal como lo
 * manda Routes API y lo reenvia el backend en `route.polyline` de la
 * cotizacion: la app dibuja esta ruta directamente, sin pedirla aparte.
 *
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(encoded: string): Coordinates[] {
  const points: Coordinates[] = [];

  if (encoded.length === 0) {
    return points;
  }

  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    const latResult = decodeSignedValue(encoded, index);
    lat += latResult.value;
    index = latResult.nextIndex;

    const lngResult = decodeSignedValue(encoded, index);
    lng += lngResult.value;
    index = lngResult.nextIndex;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}

/** Decodifica un unico numero (lat o lng) a partir de `startIndex`. */
function decodeSignedValue(encoded: string, startIndex: number): { value: number; nextIndex: number } {
  let result = 0;
  let shift = 0;
  let index = startIndex;
  let byte: number;

  do {
    byte = encoded.charCodeAt(index) - 63;
    index += 1;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20);

  const value = result & 1 ? ~(result >> 1) : result >> 1;

  return { value, nextIndex: index };
}
