import { useEffect, useState, type ReactNode } from 'react';
import { Marker, type MapMarkerProps } from 'react-native-maps';

/** Tiempo para que la vista del marcador (bordes, texto) termine de dibujarse. */
const DRAW_SETTLE_MS = 600;

interface ViewMarkerProps extends Omit<MapMarkerProps, 'tracksViewChanges'> {
  children: ReactNode;
  /** Cuando cambia lo que muestra el marcador (por ejemplo su numero), se vuelve a dibujar. */
  redrawKey?: string | number;
}

/**
 * Marcador con una vista propia que siempre se ve completa.
 *
 * En Android, un `Marker` con `tracksViewChanges={false}` toma una "foto" de
 * su vista apenas se monta: si el texto o los bordes todavia no se dibujaron,
 * queda vacio o a medias para siempre (paradas sin numero, el destino sin el
 * cuadrado de adentro, el origen que no aparece). Aca arranca siguiendo los
 * cambios de la vista y deja de hacerlo cuando ya se asento, para no redibujar
 * en cada frame.
 */
export function ViewMarker({ children, redrawKey, ...props }: ViewMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), DRAW_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [redrawKey]);

  return (
    <Marker {...props} tracksViewChanges={tracksViewChanges}>
      {children}
    </Marker>
  );
}
