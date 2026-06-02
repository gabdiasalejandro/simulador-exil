import { useEffect, useRef } from 'react';

export interface TimerProps {
  /**
   * Segundos restantes. `null` indica modo "sin límite" — el Timer no se muestra.
   */
  remainingSeconds: number | null;
  onExpire: () => void;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

/**
 * Átomo Timer presentacional.
 *
 * - `null` → no se renderiza (modo sin límite).
 * - `0`   → llama `onExpire()` una vez y muestra 00:00.
 * - Solo muestra; el countdown vive en SimulacroContainer.
 */
export function Timer({ remainingSeconds, onExpire }: TimerProps) {
  const expiredRef = useRef(false);

  useEffect(() => {
    if (remainingSeconds === 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpire();
    }
    if (remainingSeconds !== null && remainingSeconds > 0) {
      expiredRef.current = false;
    }
  }, [remainingSeconds, onExpire]);

  if (remainingSeconds === null) return null;

  const isUrgent = remainingSeconds <= 60;

  return (
    <div
      role="timer"
      aria-label={`Tiempo restante: ${formatTime(remainingSeconds)}`}
      className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-sm font-mono font-semibold tabular-nums ${
        isUrgent
          ? 'bg-red-100 text-red-700 animate-pulse'
          : 'bg-blue-50 text-blue-800'
      }`}
    >
      ⏱ {formatTime(remainingSeconds)}
    </div>
  );
}
