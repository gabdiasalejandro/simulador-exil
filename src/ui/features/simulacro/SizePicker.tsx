import { useState } from 'react';
import type { SessionConfig } from '../../../domain/exam/session';
import type { ExamSize } from '../../../domain/exam/blueprint';
import { computeDefaultMinutes } from '../../../domain/exam/session';
import { Button } from '../../atoms/Button/Button';

export interface SizePickerProps {
  onConfirm: (config: SessionConfig) => void;
}

const SIZES: ExamSize[] = [20, 60, 125];

/**
 * Pantalla de configuración previa al simulacro.
 *
 * El usuario elige:
 * - Tamaño del examen (20 / 60 / 125 reactivos).
 * - Timer: limitado (con default calculado, ajustable) o sin límite.
 *
 * Emite SessionConfig al confirmar.
 */
export function SizePicker({ onConfirm }: SizePickerProps) {
  const [size, setSize] = useState<ExamSize>(20);
  const [timerMode, setTimerMode] = useState<'limited' | 'unlimited'>('limited');
  const [minutes, setMinutes] = useState<number>(computeDefaultMinutes(20));

  const handleSizeChange = (s: ExamSize) => {
    setSize(s);
    setMinutes(computeDefaultMinutes(s));
  };

  const handleConfirm = () => {
    const config: SessionConfig = {
      size,
      timer:
        timerMode === 'limited'
          ? { mode: 'limited', minutes }
          : { mode: 'unlimited' },
    };
    onConfirm(config);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gray-50 px-4 py-12">
      <header className="text-center">
        <h2 className="text-2xl font-bold text-blue-800">Configurar simulacro</h2>
        <p className="mt-1 text-sm text-gray-500">
          Elige el número de reactivos y el tiempo
        </p>
      </header>

      {/* Selector de tamaño */}
      <section className="w-full max-w-md">
        <h3 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Número de reactivos
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSizeChange(s)}
              className={`rounded-lg border-2 py-4 text-center text-lg font-bold transition-colors ${
                size === s
                  ? 'border-blue-600 bg-blue-50 text-blue-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-400 text-center">
          20 = práctica rápida · 60 = examen parcial · 125 = simulacro completo
        </p>
      </section>

      {/* Configuración del timer */}
      <section className="w-full max-w-md">
        <h3 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Tiempo
        </h3>
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="timerMode"
              value="limited"
              checked={timerMode === 'limited'}
              onChange={() => setTimerMode('limited')}
              className="accent-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">Con límite de tiempo</span>
          </label>

          {timerMode === 'limited' && (
            <div className="flex items-center gap-3 pl-7">
              <label
                htmlFor="minutes-input"
                className="text-sm text-gray-600"
              >
                Minutos:
              </label>
              <input
                id="minutes-input"
                type="number"
                min={1}
                max={480}
                value={minutes}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0) setMinutes(val);
                }}
                className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-center focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-400">
                (sugerido: {computeDefaultMinutes(size)} min)
              </span>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="timerMode"
              value="unlimited"
              checked={timerMode === 'unlimited'}
              onChange={() => setTimerMode('unlimited')}
              className="accent-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">Sin límite de tiempo</span>
          </label>
        </div>
      </section>

      <Button
        label="Iniciar simulacro"
        variant="primary"
        onClick={handleConfirm}
        className="w-full max-w-md py-4 text-base"
      />
    </div>
  );
}
