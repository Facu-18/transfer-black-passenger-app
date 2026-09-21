import { useEffect, useRef, useState } from 'react';

import type { Coordinates } from '@/infrastructure/interfaces/places';
import { bearingDegrees, distanceMeters, interpolate } from '@/presentation/utils/geo';

/** Cada cuanto se repinta el marcador durante la animacion (~20 fps). */
const FRAME_MS = 50;
/** Un salto mayor es un error de GPS o una reconexion: se mueve sin animar. */
const MAX_ANIMATED_METERS = 1_000;

/**
 * Lleva el marcador de la posicion anterior a la nueva a lo largo de
 * `durationMs`, en vez de saltar. Con una duracion igual al intervalo entre
 * posiciones (3 s), el auto se ve moverse sin pausas.
 *
 * Tambien devuelve el rumbo, para girar el icono hacia donde va.
 */
export function useAnimatedCoordinate(target: Coordinates | null, durationMs = 3_000) {
  const [coordinate, setCoordinate] = useState<Coordinates | null>(target);
  const [rotation, setRotation] = useState(0);
  const current = useRef<Coordinates | null>(target);

  useEffect(() => {
    if (!target) {
      current.current = null;
      setCoordinate(null);
      return;
    }

    const from = current.current;
    const jump = from ? distanceMeters(from, target) : Infinity;

    if (!from || jump > MAX_ANIMATED_METERS) {
      current.current = target;
      setCoordinate(target);
      return;
    }

    // Detenido: el GPS oscila unos metros y giraria el auto sin motivo.
    if (jump < 2) return;

    setRotation(bearingDegrees(from, target));

    const startedAt = Date.now();
    let lastPaint = 0;
    let frame: number | null = null;

    const step = () => {
      const now = Date.now();
      const progress = Math.min(1, (now - startedAt) / durationMs);

      if (progress === 1 || now - lastPaint >= FRAME_MS) {
        lastPaint = now;
        // Se guarda aunque no termine: la proxima animacion arranca desde aca.
        current.current = interpolate(from, target, progress);
        setCoordinate(current.current);
      }

      frame = progress < 1 ? requestAnimationFrame(step) : null;
    };

    frame = requestAnimationFrame(step);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
    };
    // Solo importa el valor de las coordenadas, no la identidad del objeto.
  }, [target?.latitude, target?.longitude, durationMs]);

  return { coordinate, rotation };
}
