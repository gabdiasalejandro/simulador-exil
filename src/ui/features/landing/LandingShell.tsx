import { useState } from 'react';
import { Button } from '../../atoms/Button/Button';

export interface LandingShellProps {
  onSimular: () => void;
  onPracticar: () => void;
}

/** Logo pequeño del simulador: monograma "EX" en azul (mismo que el favicon). */
function Logo({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Simulador EXIL">
      <rect width="64" height="64" rx="14" fill="#1e40af" />
      <text
        x="32"
        y="34"
        fontSize="30"
        fontWeight={700}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        letterSpacing="-1"
      >
        EX
      </text>
    </svg>
  );
}

/**
 * Pantalla de inicio del simulador.
 *
 * Marca discreta arriba a la izquierda y una card central que encierra los
 * dos modos activos (Simular y Practicar). Tono sobrio, académico.
 * Cero lógica de negocio — solo presentación.
 */
export function LandingShell({ onSimular, onPracticar }: LandingShellProps) {
  const [ayudaAbierta, setAyudaAbierta] = useState(false);

  return (
    <main className="flex min-h-screen flex-col bg-crema">
      {/* Marca discreta arriba a la izquierda */}
      <header className="flex items-center gap-2 px-6 py-5">
        <Logo />
        <span className="text-sm font-semibold tracking-tight text-gray-400">
          Simulador EXIL
        </span>
      </header>

      {/* Card central con los modos */}
      <div className="flex flex-1 items-center justify-center px-6 pb-20">
        <section className="w-full max-w-sm rounded-xl border border-stone-300 bg-stone-50 p-8 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Simulador EXIL
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                EXIL-NEGOCIOS · CENEVAL · 125 reactivos criteriales
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAyudaAbierta((v) => !v)}
              aria-expanded={ayudaAbierta}
              aria-label="¿Qué es cada modo?"
              title="¿Qué es cada modo?"
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-base font-bold transition-colors ${
                ayudaAbierta
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-stone-300 bg-white text-gray-500 hover:bg-stone-100'
              }`}
            >
              ?
            </button>
          </div>

          {/* Panel de ayuda: para qué sirve cada modo */}
          {ayudaAbierta && (
            <div className="mt-5 space-y-3 rounded-lg border border-stone-200 bg-white p-4 text-sm">
              <div>
                <p className="font-bold text-blue-800">Simular</p>
                <p className="text-gray-600">
                  Examen completo bajo la distribución oficial, con tiempo. Respondes
                  todo de corrido y al final ves tu reporte por área. Ideal para medir
                  cómo te iría en el examen real.
                </p>
              </div>
              <div>
                <p className="font-bold text-blue-800">Practicar</p>
                <p className="text-gray-600">
                  Reactivos por tema, uno a uno y sin tiempo. Tras cada respuesta ves
                  si acertaste y la explicación. Ideal para estudiar y reforzar áreas
                  específicas.
                </p>
              </div>
            </div>
          )}

          <div className="mt-7 grid gap-3 border-t border-gray-100 pt-6">
            <Button
              label="Simular"
              variant="primary"
              onClick={onSimular}
              className="w-full py-3.5 text-base"
            />
            <Button
              label="Practicar"
              variant="secondary"
              onClick={onPracticar}
              className="w-full py-3.5 text-base"
            />
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            185 reactivos · 6 áreas oficiales
          </p>
        </section>
      </div>
    </main>
  );
}
