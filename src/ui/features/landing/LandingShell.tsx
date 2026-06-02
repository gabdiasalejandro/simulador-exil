import { Button } from '../../atoms/Button/Button';

export interface LandingShellProps {
  onSimular: () => void;
}

/**
 * Pantalla de inicio del simulador.
 *
 * Muestra 4 modos de estudio:
 * - Simular: activo (inicia flujo completo)
 * - Practicar, Por tema, Revisar: deshabilitados ("próximamente")
 *
 * Cero lógica de negocio — solo presentación y despacho de eventos.
 */
export function LandingShell({ onSimular }: LandingShellProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gray-50 px-4 py-12">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-blue-800">Simulador EXIL</h1>
        <p className="mt-2 text-gray-500">
          EXIL-NEGOCIOS · CENEVAL · 125 reactivos criteriales
        </p>
      </header>

      <section className="grid w-full max-w-md gap-4">
        <Button
          label="Simular"
          variant="primary"
          onClick={onSimular}
          className="w-full text-base py-4"
        />

        <Button
          label="Practicar"
          variant="secondary"
          disabled
          title="Próximamente"
          className="w-full text-base py-4"
        />

        <Button
          label="Por tema"
          variant="secondary"
          disabled
          title="Próximamente"
          className="w-full text-base py-4"
        />

        <Button
          label="Revisar"
          variant="secondary"
          disabled
          title="Próximamente"
          className="w-full text-base py-4"
        />
      </section>

      <p className="text-xs text-gray-400">
        Los modos marcados como deshabilitados estarán disponibles próximamente.
      </p>
    </main>
  );
}
