import type { Attempt } from '../../../domain/attempt/attempt';
import type { AreaCode, SubareaCode } from '../../../domain/taxonomy/taxonomy';
import type { ScoreEntry } from '../../../domain/scoring/attempt-report';
import { Button } from '../../atoms/Button/Button';

export interface ReportViewProps {
  attempt: Attempt;
  onReset: () => void;
}

function pct(entry: ScoreEntry): string {
  if (entry.total === 0) return '—';
  return ((entry.correct / entry.total) * 100).toFixed(1) + '%';
}

const AREA_LABELS: Record<AreaCode, string> = {
  A: 'A. Administración',
  B: 'B. Contabilidad y finanzas',
  C: 'C. Economía',
  D: 'D. Mercadotecnia',
  E: 'E. Matemáticas y estadística',
  F: 'F. Derecho',
};

function ScoreBar({ entry }: { entry: ScoreEntry }) {
  const percent = entry.total > 0 ? (entry.correct / entry.total) * 100 : 0;
  const color =
    percent >= 70
      ? 'bg-green-500'
      : percent >= 50
        ? 'bg-amber-400'
        : 'bg-red-400';

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-full rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-gray-700">
        {entry.correct}/{entry.total}
      </span>
    </div>
  );
}

/**
 * Vista de reporte criterial post-simulacro.
 *
 * Muestra:
 * - Puntuación global
 * - Por área (6 áreas)
 * - Por subárea (solo las presentes en el examen)
 * - bankWarnings si hubo banco insuficiente
 *
 * Sin comparación entre usuarios (criterial).
 */
export function ReportView({ attempt, onReset }: ReportViewProps) {
  const { report } = attempt;

  // Ordenar áreas para presentación consistente
  const areas: AreaCode[] = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="text-center">
        <h2 className="text-2xl font-bold text-blue-800">Resultados del simulacro</h2>
        <p className="mt-1 text-sm text-gray-400">Evaluación criterial — sin comparación con otros</p>
      </header>

      {/* Score global */}
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
        <p className="text-4xl font-extrabold text-blue-800">
          {report.globalScore.correct}
          <span className="text-xl font-normal text-blue-500">/{report.globalScore.total}</span>
        </p>
        <p className="mt-1 text-lg font-semibold text-blue-700">
          {pct(report.globalScore)} global
        </p>
      </section>

      {/* bankWarnings */}
      {report.bankWarnings.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="mb-2 font-semibold">Aviso de banco insuficiente:</p>
          <ul className="list-disc pl-5 space-y-1">
            {report.bankWarnings.map((w) => (
              <li key={w.subarea}>
                Subárea <strong>{w.subarea}</strong>: se solicitaron{' '}
                {w.requested}, disponibles {w.available}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Por área */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Por área
        </h3>
        <div className="space-y-3">
          {areas.map((area) => {
            const entry = report.byArea.get(area as AreaCode);
            if (!entry) return null;
            return (
              <div key={area} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {AREA_LABELS[area as AreaCode]}
                  </span>
                  <span className="text-sm font-semibold text-gray-500">
                    {pct(entry)}
                  </span>
                </div>
                <ScoreBar entry={entry} />
              </div>
            );
          })}
        </div>
      </section>

      {/* Por subárea */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Por subárea
        </h3>
        <div className="rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3">Subárea</th>
                <th className="px-4 py-3 text-right">Correctas</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(report.bySubarea.entries()).map(([sub, entry]) => (
                <tr
                  key={sub as SubareaCode}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td className="px-4 py-2.5 font-mono text-gray-700">{sub}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">
                    {entry.correct}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-500">
                    {entry.total}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-700">
                    {pct(entry)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Button
        label="Nuevo simulacro"
        onClick={onReset}
        variant="secondary"
        className="w-full py-3 text-base"
      />
    </main>
  );
}
