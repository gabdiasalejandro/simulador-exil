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
 * Líneas delgadas delimitan la vista arriba y abajo. El título y un párrafo
 * descriptivo van fuera y arriba de la card, que solo contiene las acciones.
 * Tono sobrio. Solo presentación.
 */
export function LandingShell({ onSimular, onPracticar }: LandingShellProps) {
  return (
    <main className="flex min-h-screen flex-col bg-crema">
      {/* Línea delgada superior + marca */}
      <header className="flex items-center gap-2 border-b border-stone-300 px-6 py-4">
        <Logo />
      </header>

      {/* Contenido centrado vertical y horizontalmente */}
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Simulador EXIL
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Plataforma de estudio para el examen EXIL-NEGOCIOS del CENEVAL. Practica por
            tema o resuelve un simulacro completo bajo la distribución oficial del examen.
          </p>

          {/* Card: solo las acciones */}
          <section className="mt-6 grid gap-3 rounded-xl border border-stone-300 bg-stone-50 p-6 shadow-sm">
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
          </section>
        </div>
      </div>

      {/* Línea delgada inferior + footer mínimo */}
      <footer className="border-t border-stone-300 px-6 py-3 text-center text-xs text-gray-400">
        EXIL-NEGOCIOS · CENEVAL · 185 reactivos
      </footer>
    </main>
  );
}
