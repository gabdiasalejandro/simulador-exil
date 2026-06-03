import type { Attempt } from '../../../domain/attempt/attempt';
import type { AreaCode, SubareaCode } from '../../../domain/taxonomy/taxonomy';
import type { ScoreEntry } from '../../../domain/scoring/attempt-report';
import type { Reactivo } from '../../../domain/question/question';
import type { Answer } from '../../../domain/question/answer';
import { scoreQuestion } from '../../../domain/scoring/scoring-policy';
import { Button } from '../../atoms/Button/Button';

export interface ReportViewProps {
  attempt: Attempt;
  /** Reactivos presentados en el examen. Opcional: habilita la revisión por reactivo. */
  questions?: readonly Reactivo[];
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

// ---------------------------------------------------------------------------
// Helpers de análisis
// ---------------------------------------------------------------------------

interface Veredicto {
  label: string;
  className: string;
}

function veredicto(percent: number): Veredicto {
  if (percent >= 85) return { label: 'Excelente', className: 'bg-green-100 text-green-800' };
  if (percent >= 70) return { label: 'Sólido', className: 'bg-green-100 text-green-700' };
  if (percent >= 50) return { label: 'Suficiente', className: 'bg-amber-100 text-amber-800' };
  return { label: 'En desarrollo', className: 'bg-red-100 text-red-700' };
}

function formatDuracion(ms: number): string {
  if (ms <= 0) return '—';
  const totalSeg = Math.round(ms / 1000);
  const min = Math.floor(totalSeg / 60);
  const seg = totalSeg % 60;
  if (min === 0) return `${seg}s`;
  return `${min}m ${seg.toString().padStart(2, '0')}s`;
}

/** Mejor/peor área por porcentaje, considerando solo áreas con reactivos. */
function extremosArea(
  byArea: ReadonlyMap<AreaCode, ScoreEntry>,
): { mejor: AreaCode | null; peor: AreaCode | null } {
  let mejor: AreaCode | null = null;
  let peor: AreaCode | null = null;
  let mejorPct = -1;
  let peorPct = Infinity;
  for (const [area, entry] of byArea.entries()) {
    if (entry.total === 0) continue;
    const p = entry.correct / entry.total;
    if (p > mejorPct) {
      mejorPct = p;
      mejor = area;
    }
    if (p < peorPct) {
      peorPct = p;
      peor = area;
    }
  }
  return { mejor, peor };
}

/** Texto de la opción elegida por el usuario (solo tipos de opción múltiple). */
function respuestaTexto(q: Reactivo, answer: Answer | null): string {
  if (answer === null) return 'Sin responder';
  if (answer.kind === 'choice' && (q.tipo === 'directo' || q.tipo === 'completamiento')) {
    return q.opciones[answer.index] ?? '—';
  }
  return 'Respuesta enviada';
}

/** Texto de la opción correcta (solo tipos de opción múltiple). */
function correctaTexto(q: Reactivo): string | null {
  if (q.tipo === 'directo' || q.tipo === 'completamiento') {
    return q.opciones[q.correcta] ?? null;
  }
  return null;
}

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

function StatCard({
  value,
  label,
  tone = 'gray',
}: {
  value: string | number;
  label: string;
  tone?: 'gray' | 'green' | 'red' | 'amber';
}) {
  const tones: Record<string, string> = {
    gray: 'text-gray-700',
    green: 'text-green-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
      <p className={`text-2xl font-extrabold tabular-nums ${tones[tone]}`}>{value}</p>
      <p className="mt-0.5 text-xs uppercase tracking-wide text-gray-400">{label}</p>
    </div>
  );
}

/**
 * Vista de reporte criterial post-simulacro.
 *
 * Muestra:
 * - Puntuación global + veredicto
 * - Desglose rápido: aciertos / errores / sin responder / tiempo
 * - Fortaleza y área a reforzar
 * - bankWarnings si hubo banco insuficiente
 * - Desempeño por área (barras) y por subárea (tabla)
 * - Revisión reactivo por reactivo de los fallados (si se reciben los reactivos)
 *
 * Sin comparación entre usuarios (criterial).
 */
export function ReportView({ attempt, questions = [], onReset }: ReportViewProps) {
  const { report } = attempt;
  const areas: AreaCode[] = ['A', 'B', 'C', 'D', 'E', 'F'];

  const total = report.globalScore.total;
  const aciertos = report.globalScore.correct;
  const percent = total > 0 ? (aciertos / total) * 100 : 0;
  const v = veredicto(percent);

  // Sin responder: ids del examen sin respuesta registrada
  const sinResponder = attempt.examSnapshot.questionIds.reduce((acc, id) => {
    const ans = attempt.answerMap.get(id) ?? null;
    return ans === null ? acc + 1 : acc;
  }, 0);
  const errores = Math.max(0, total - aciertos - sinResponder);
  const duracion = formatDuracion(attempt.finishedAt - attempt.startedAt);

  const { mejor, peor } = extremosArea(report.byArea);

  // Revisión por reactivo: los fallados (incorrectos o sin responder), en orden de examen
  const qById = new Map(questions.map((q) => [q.id, q]));
  const fallados = attempt.examSnapshot.questionIds
    .map((id, i) => {
      const q = qById.get(id);
      if (!q) return null;
      const ans = attempt.answerMap.get(id) ?? null;
      const acierto = scoreQuestion(q, ans) === 1;
      return acierto ? null : { q, ans, numero: i + 1 };
    })
    .filter((x): x is { q: Reactivo; ans: Answer | null; numero: number } => x !== null);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="text-center">
        <h2 className="text-2xl font-bold text-blue-800">Resultados del simulacro</h2>
        <p className="mt-1 text-sm text-gray-400">Evaluación criterial — sin comparación con otros</p>
      </header>

      {/* Score global */}
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
        <p className="text-4xl font-extrabold text-blue-800">
          {aciertos}
          <span className="text-xl font-normal text-blue-500">/{total}</span>
        </p>
        <p className="mt-1 text-lg font-semibold text-blue-700">
          {pct(report.globalScore)} global
        </p>
        <span
          className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${v.className}`}
        >
          {v.label}
        </span>
      </section>

      {/* Desglose rápido */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard value={aciertos} label="Aciertos" tone="green" />
        <StatCard value={errores} label="Errores" tone="red" />
        <StatCard value={sinResponder} label="Sin responder" tone="amber" />
        <StatCard value={duracion} label="Tiempo" />
      </section>

      {/* Fortaleza y área a reforzar */}
      {(mejor || peor) && (
        <section className="grid gap-3 sm:grid-cols-2">
          {mejor && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                Tu fortaleza
              </p>
              <p className="mt-1 text-sm font-medium text-gray-700">{AREA_LABELS[mejor]}</p>
              <p className="text-sm text-green-700">{pct(report.byArea.get(mejor)!)}</p>
            </div>
          )}
          {peor && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                A reforzar
              </p>
              <p className="mt-1 text-sm font-medium text-gray-700">{AREA_LABELS[peor]}</p>
              <p className="text-sm text-red-700">{pct(report.byArea.get(peor)!)}</p>
            </div>
          )}
        </section>
      )}

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

      {/* Revisión por reactivo (solo si se reciben los reactivos) */}
      {fallados.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Revisión de reactivos ({fallados.length} por corregir)
          </h3>
          <div className="space-y-3">
            {fallados.map(({ q, ans, numero }) => {
              const correcta = correctaTexto(q);
              const noRespondido = ans === null;
              return (
                <details
                  key={q.id}
                  className="group rounded-lg border border-gray-200 bg-white"
                >
                  <summary className="flex cursor-pointer items-start gap-2 px-4 py-3 text-sm">
                    <span
                      className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        noRespondido
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                      aria-hidden="true"
                    >
                      {noRespondido ? '–' : '✕'}
                    </span>
                    <span className="font-medium text-gray-700">
                      <span className="text-gray-400">#{numero}</span> {q.enunciado}
                    </span>
                  </summary>
                  <div className="space-y-2 border-t border-gray-100 px-4 py-3 text-sm">
                    <p>
                      <span className="font-semibold text-gray-500">Tu respuesta: </span>
                      <span className={noRespondido ? 'text-amber-700' : 'text-red-700'}>
                        {respuestaTexto(q, ans)}
                      </span>
                    </p>
                    {correcta && (
                      <p>
                        <span className="font-semibold text-gray-500">Correcta: </span>
                        <span className="text-green-700">{correcta}</span>
                      </p>
                    )}
                    <p className="rounded-md bg-gray-50 p-3 text-gray-600">
                      {q.explanation}
                    </p>
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      )}

      <Button
        label="Nuevo simulacro"
        onClick={onReset}
        variant="secondary"
        className="w-full py-3 text-base"
      />
    </main>
  );
}
