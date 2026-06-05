import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Attempt } from '../../../domain/attempt/attempt';
import type { AreaCode } from '../../../domain/taxonomy/taxonomy';
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

// ---------------------------------------------------------------------------
// Piezas de presentación
// ---------------------------------------------------------------------------

function ScoreBar({ entry }: { entry: ScoreEntry }) {
  const percent = entry.total > 0 ? (entry.correct / entry.total) * 100 : 0;
  const color =
    percent >= 70 ? 'bg-green-500' : percent >= 50 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-full rounded-full bg-stone-200">
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

/** Tile base del bento grid. */
function Tile({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function StatTile({
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
    <Tile className="flex flex-col justify-center text-center">
      <p className={`text-2xl font-extrabold tabular-nums ${tones[tone]}`}>{value}</p>
      <p className="mt-0.5 text-xs uppercase tracking-wide text-gray-400">{label}</p>
    </Tile>
  );
}

// ---------------------------------------------------------------------------
// ReportView
// ---------------------------------------------------------------------------

/**
 * Vista de reporte criterial post-simulacro, organizada como bento grid:
 * puntuación global + veredicto, aciertos/errores/sin responder/tiempo,
 * fortaleza y área a reforzar, y desempeño por área.
 *
 * La revisión reactivo por reactivo NO es invasiva: vive en una vista aparte
 * a la que se entra con un botón y desde la que se vuelve al resumen.
 */
export function ReportView({ attempt, questions = [], onReset }: ReportViewProps) {
  const [mode, setMode] = useState<'resumen' | 'revision'>('resumen');
  const { report } = attempt;
  const areas: AreaCode[] = ['A', 'B', 'C', 'D', 'E', 'F'];

  const total = report.globalScore.total;
  const aciertos = report.globalScore.correct;
  const percent = total > 0 ? (aciertos / total) * 100 : 0;
  const v = veredicto(percent);

  const sinResponder = attempt.examSnapshot.questionIds.reduce((acc, id) => {
    const ans = attempt.answerMap.get(id) ?? null;
    return ans === null ? acc + 1 : acc;
  }, 0);
  const errores = Math.max(0, total - aciertos - sinResponder);
  const duracion = formatDuracion(attempt.finishedAt - attempt.startedAt);

  const { mejor, peor } = extremosArea(report.byArea);

  // Reactivos fallados (incorrectos o sin responder), en orden de examen.
  const qById = new Map(questions.map((q) => [q.id, q]));
  const fallados = attempt.examSnapshot.questionIds
    .map((id, i) => {
      const q = qById.get(id);
      if (!q) return null;
      const ans = attempt.answerMap.get(id) ?? null;
      return scoreQuestion(q, ans) === 1 ? null : { q, ans, numero: i + 1 };
    })
    .filter((x): x is { q: Reactivo; ans: Answer | null; numero: number } => x !== null);

  // Temas para reforzar: temas distintos entre los reactivos fallados, con conteo.
  // Alimenta las sugerencias de estudio del cierre del simulacro.
  const temaCount = new Map<string, number>();
  for (const { q } of fallados) {
    if (q.tema) temaCount.set(q.tema, (temaCount.get(q.tema) ?? 0) + 1);
  }
  const temasReforzar = [...temaCount.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );

  const volverInicio = (
    <Button label="Volver al inicio" onClick={onReset} variant="primary" className="px-5 py-2.5" />
  );

  // -------------------------------------------------------------------------
  // Vista de revisión (separada, no invasiva)
  // -------------------------------------------------------------------------

  if (mode === 'revision') {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-8">
        <header className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-stone-200 bg-crema px-4 py-3">
          <div>
            <h2 className="text-lg font-bold text-blue-800">Revisión de respuestas</h2>
            <p className="text-xs text-gray-500">{fallados.length} por corregir</p>
          </div>
          <Button
            label="← Volver al resumen"
            variant="secondary"
            shape="square"
            onClick={() => setMode('resumen')}
            className="px-3 py-2 text-sm"
          />
        </header>

        <div className="space-y-3">
          {fallados.map(({ q, ans, numero }) => {
            const correcta = correctaTexto(q);
            const noRespondido = ans === null;
            return (
              <article
                key={q.id}
                className="rounded-xl border border-stone-200 bg-stone-50 p-5 shadow-sm"
              >
                {q.tema && (
                  <span className="mb-2 inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {q.tema}
                  </span>
                )}
                {q.caso && (
                  <div className="mb-3 rounded-lg border border-l-4 border-gray-200 border-l-gray-400 bg-white p-3 text-sm leading-relaxed text-gray-600">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                      Contexto del caso
                    </p>
                    {q.caso}
                  </div>
                )}
                <p className="mb-3 font-semibold text-gray-800">
                  <span className="text-gray-400">#{numero}</span> {q.enunciado}
                </p>
                <div className="space-y-2 text-sm">
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
                  <p className="rounded-md bg-white p-3 text-gray-600">{q.explanation}</p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="flex justify-center pt-2">{volverInicio}</div>
      </main>
    );
  }

  // -------------------------------------------------------------------------
  // Resumen (bento grid)
  // -------------------------------------------------------------------------

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-8">
      {/* Encabezado con acción de volver bien visible */}
      <header className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b border-stone-200 bg-crema px-4 py-3">
        <div>
          <h2 className="text-xl font-bold text-blue-800">Resultados del simulacro</h2>
          <p className="text-xs text-gray-400">Evaluación criterial — sin comparación con otros</p>
        </div>
        {volverInicio}
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Score global — tile destacado */}
        <Tile className="col-span-2 flex flex-col items-center justify-center text-center">
          <p className="text-4xl font-extrabold text-blue-800">
            {aciertos}
            <span className="text-xl font-normal text-blue-500">/{total}</span>
          </p>
          <p className="mt-1 text-base font-semibold text-blue-700">
            {pct(report.globalScore)} global
          </p>
          <span
            className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${v.className}`}
          >
            {v.label}
          </span>
        </Tile>

        <StatTile value={aciertos} label="Aciertos" tone="green" />
        <StatTile value={errores} label="Errores" tone="red" />
        <StatTile value={sinResponder} label="Sin responder" tone="amber" />
        <StatTile value={duracion} label="Tiempo" />

        {/* Fortaleza / a reforzar */}
        {mejor && (
          <Tile className="border-l-4 border-l-green-500">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
              Tu fortaleza
            </p>
            <p className="mt-1 text-sm font-medium text-gray-700">{AREA_LABELS[mejor]}</p>
            <p className="text-sm font-semibold text-green-700">{pct(report.byArea.get(mejor)!)}</p>
          </Tile>
        )}
        {peor && (
          <Tile className="border-l-4 border-l-red-500">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600">A reforzar</p>
            <p className="mt-1 text-sm font-medium text-gray-700">{AREA_LABELS[peor]}</p>
            <p className="text-sm font-semibold text-red-700">{pct(report.byArea.get(peor)!)}</p>
          </Tile>
        )}

        {/* Por área — tile ancho */}
        <Tile className="col-span-2 sm:col-span-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Por área
          </h3>
          <div className="space-y-3">
            {areas.map((area) => {
              const entry = report.byArea.get(area);
              if (!entry) return null;
              return (
                <div key={area}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{AREA_LABELS[area]}</span>
                    <span className="text-sm font-semibold text-gray-500">{pct(entry)}</span>
                  </div>
                  <ScoreBar entry={entry} />
                </div>
              );
            })}
          </div>
        </Tile>

        {/* bankWarnings */}
        {report.bankWarnings.length > 0 && (
          <div className="col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 sm:col-span-4">
            <p className="mb-2 font-semibold">Aviso de banco insuficiente:</p>
            <ul className="list-disc space-y-1 pl-5">
              {report.bankWarnings.map((w) => (
                <li key={w.subarea}>
                  Subárea <strong>{w.subarea}</strong>: se solicitaron {w.requested}, disponibles{' '}
                  {w.available}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Revisar respuestas — acceso a la vista aparte, no invasivo */}
        {fallados.length > 0 && (
          <button
            type="button"
            onClick={() => setMode('revision')}
            className="col-span-2 flex items-center justify-between rounded-xl border border-stone-300 bg-white px-5 py-4 text-left shadow-sm transition-colors hover:bg-stone-100 sm:col-span-4"
          >
            <span>
              <span className="block font-semibold text-gray-800">Revisar respuestas</span>
              <span className="text-sm text-gray-500">
                {fallados.length} reactivo{fallados.length === 1 ? '' : 's'} por corregir, con explicación
              </span>
            </span>
            <span aria-hidden="true" className="text-xl text-gray-400">
              →
            </span>
          </button>
        )}

        {/* Temas a reforzar — sugerencias de estudio finas (por tema) */}
        {temasReforzar.length > 0 && (
          <Tile className="col-span-2 sm:col-span-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Temas a reforzar
            </h3>
            <p className="mb-3 mt-0.5 text-xs text-gray-400">
              Contenidos no acertados, agrupados por tema. Se recomienda su repaso
              antes de un nuevo intento.
            </p>
            <ul className="divide-y divide-stone-200 border-t border-stone-200">
              {temasReforzar.map(([tema, count]) => (
                <li
                  key={tema}
                  className="flex items-baseline justify-between gap-4 py-2"
                >
                  <span className="text-sm text-gray-700">{tema}</span>
                  <span className="shrink-0 text-xs tabular-nums text-gray-400">
                    {count} {count === 1 ? 'reactivo' : 'reactivos'}
                  </span>
                </li>
              ))}
            </ul>
          </Tile>
        )}
      </div>
    </main>
  );
}
