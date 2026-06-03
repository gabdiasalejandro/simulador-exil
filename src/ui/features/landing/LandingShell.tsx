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
 * dos modos activos (Simular y Practicar), con una explicación breve y fija
 * de para qué sirve cada uno. Tono sobrio, académico. Solo presentación.
 */
export function LandingShell({ onSimular, onPracticar }: LandingShellProps) {
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Simulador EXIL
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            EXIL-NEGOCIOS · CENEVAL · 125 reactivos criteriales
          </p>

          {/* Explicación fija de cada modo */}
          <div className="mt-5 space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-bold text-blue-800">Simular</span> — examen completo
              bajo la distribución oficial, con tiempo. Al final ves tu reporte por área.
            </p>
            <p>
              <span className="font-bold text-blue-800">Practicar</span> — reactivos por
              tema, sin tiempo y con explicación inmediata tras cada respuesta.
            </p>
          </div>

          <div className="mt-6 grid gap-3 border-t border-gray-100 pt-6">
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
