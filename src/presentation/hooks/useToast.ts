import { useCallback, useEffect, useRef, useState } from 'react';

/** Tiempo que el aviso queda a la vista antes de ocultarse solo. */
export const TOAST_DURATION_MS = 3500;

export interface ToastState {
  /** Cambia en cada `show`: el mismo texto repetido reinicia la animacion y el temporizador. */
  id: number;
  message: string;
}

/**
 * Estado de un aviso efimero para una pantalla: `show(texto)` lo muestra y se
 * oculta solo. Se dibuja con `<Toast toast={toast} />`.
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setToast(null);
  }, []);

  const show = useCallback(
    (message: string) => {
      if (timer.current) clearTimeout(timer.current);
      nextId.current += 1;
      setToast({ id: nextId.current, message });
      timer.current = setTimeout(hide, TOAST_DURATION_MS);
    },
    [hide],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { toast, show, hide };
}
