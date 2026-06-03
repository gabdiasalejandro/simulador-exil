import type { ReactNode } from 'react';
import { Button } from '../../atoms/Button/Button';
import { AREA_CODES, AREA_NOMBRES } from '../../../domain/taxonomy/taxonomy';

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

/** Tarjeta formal de un modo: nombre, descripción y acción. */
function ModeCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-stone-300 bg-stone-50 p-6 shadow-sm">
      <h2 className="text-lg font-bold tracking-tight text-gray-900">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{description}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

/**
 * Pantalla de inicio del simulador.
 *
 * Hero con el propósito de la app, dos tarjetas de modo (Simular y Practicar)
 * con su explicación, y un pie con la cobertura del banco. Tono sobrio y formal.
 * Solo presentación.
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

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl space-y-8">
          {/* Hero */}
          <header className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Simulador EXIL
            </h1>
            <p className="mt-1 text-sm font-medium text-gray-500">
              EXIL-NEGOCIOS · CENEVAL · 125 reactivos criteriales
            </p>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-gray-600">
              Plataforma de estudio para el examen EXIL-NEGOCIOS del CENEVAL.
              Practica por tema para reforzar lo que te cuesta, o enfréntate a un
              simulacro completo bajo la distribución oficial del examen.
            </p>
          </header>

          {/* Modos */}
          <section className="grid gap-4 sm:grid-cols-2">
            <ModeCard
              title="Simular"
              description="Examen completo bajo la distribución oficial, con tiempo. Respondes todo de corrido y al final ves tu reporte por área."
            >
              <Button
                label="Simular"
                variant="primary"
                onClick={onSimular}
                className="w-full py-3 text-base"
              />
            </ModeCard>

            <ModeCard
              title="Practicar"
              description="Reactivos por tema, uno a uno y sin tiempo, con explicación inmediata tras cada respuesta. Ideal para estudiar a tu ritmo."
            >
              <Button
                label="Practicar"
                variant="secondary"
                onClick={onPracticar}
                className="w-full py-3 text-base"
              />
            </ModeCard>
          </section>

          {/* Cobertura del banco */}
          <footer className="border-t border-stone-200 pt-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Cubre las 6 áreas oficiales
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
              {AREA_CODES.map((code) => AREA_NOMBRES[code]).join(' · ')}
            </p>
            <p className="mt-4 text-xs text-gray-400">
              185 reactivos · examen oficial de 125
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
