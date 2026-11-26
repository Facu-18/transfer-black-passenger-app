import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';

/**
 * Alto estandar de la barra de navegacion de 3 botones de Android (48 dp).
 * Se usa solo cuando el sistema informa 0 de margen inferior.
 */
const ANDROID_NAV_BAR_FALLBACK = 48;

/**
 * Igual que `useSafeAreaInsets`, con un arreglo para Android: algunos equipos
 * (Redmi con HyperOS y Android 15, con la barra de 3 botones) dibujan la app
 * por debajo de la barra de navegacion pero informan 0 de margen inferior, y
 * los botones de abajo quedaban tapados. Con 0 en Android se asume la barra de
 * 3 botones: en un equipo sin barra solo queda un poco mas de aire abajo. La
 * navegacion por gestos informa su propio margen (mayor a 0) y no cambia.
 */
export function useSafeInsets(): EdgeInsets {
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    if (Platform.OS !== 'android' || insets.bottom > 0) return insets;
    return { ...insets, bottom: ANDROID_NAV_BAR_FALLBACK };
  }, [insets]);
}
