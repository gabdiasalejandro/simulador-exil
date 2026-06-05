import {
  AREA_CODES,
  AREA_NOMBRES,
  OFFICIAL_DISTRIBUTION,
} from '../../../domain/taxonomy/taxonomy';
import { Button } from '../../atoms/Button/Button';

export interface TemarioViewProps {
  onVolver: () => void;
}

/**
 * Temario mínimo: presenta la estructura oficial del examen EXIL-NEGOCIOS
 * (6 áreas / 20 subáreas) con el número de reactivos que aporta cada subárea
 * en el examen de 125. Solo presentación; lee la taxonomía del dominio.
 */
export function TemarioView({ onVolver }: TemarioViewProps) {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-8">
      <header className="flex items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-blue-800">Temario</h2>
          <p className="text-xs text-gray-400">
            Estructura oficial EXIL-NEGOCIOS · 6 áreas · 125 reactivos
          </p>
        </div>
        <Button
          label="← Volver"
          variant="secondary"
          shape="square"
          onClick={onVolver}
          className="px-3 py-2 text-sm"
        />
      </header>

      <div className="space-y-4">
        {AREA_CODES.map((area) => (
          <section
            key={area}
            className="rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-sm"
          >
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
              {AREA_NOMBRES[area]}
            </h3>
            <ul className="divide-y divide-gray-100">
              {OFFICIAL_DISTRIBUTION.filter((e) => e.area === area).map((e) => (
                <li
                  key={e.subarea}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <span className="text-gray-700">{e.label}</span>
                  <span className="shrink-0 tabular-nums text-gray-400">
                    {e.count}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
