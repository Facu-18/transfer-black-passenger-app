import { useCallback, useEffect, useState } from 'react';

/**
 * Cuenta regresiva en segundos que arranca al montarse.
 *
 * Se calcula contra la hora de fin y no restando de a uno: con la app en segundo
 * plano los timers se pausan, y al volver el contador tiene que mostrar el
 * tiempo real que falta.
 */
export function useCountdown(initialSeconds: number) {
  const [endsAt, setEndsAt] = useState(() => Date.now() + initialSeconds * 1000);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [endsAt]);

  const restart = useCallback(
    (seconds: number = initialSeconds) => setEndsAt(Date.now() + seconds * 1000),
    [initialSeconds],
  );

  return { secondsLeft, isRunning: secondsLeft > 0, restart };
}
