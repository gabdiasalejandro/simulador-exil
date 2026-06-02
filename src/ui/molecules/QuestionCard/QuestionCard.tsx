import type {
  Reactivo,
  ReactivoDirecto,
  ReactivoCompletamiento,
  ReactivoOrdenamiento,
  ReactivoRelacion,
} from '../../../domain/question/question';
import type {
  Answer,
  ChoiceAnswer,
  OrderAnswer,
  MatchAnswer,
} from '../../../domain/question/answer';
import { assertNever } from '../../../domain/question/question';
import { getAreaNombre } from '../../../domain/taxonomy/taxonomy';

// ---------------------------------------------------------------------------
// Props principal
// ---------------------------------------------------------------------------

/**
 * Modo feedback/revelado: cuando está activo, el card muestra el resultado
 * inmediato (correcto/incorrecto), resalta la opción correcta y muestra la
 * explicación del reactivo. Las opciones quedan deshabilitadas para cambio.
 */
export interface FeedbackState {
  /** Si la respuesta del usuario fue correcta. */
  correcto: boolean;
  /** Explicación que se muestra después de responder. */
  explicacion: string;
}

export interface QuestionCardProps {
  question: Reactivo;
  answer: Answer | null;
  onChange: (answer: Answer) => void;
  /** Número de orden para mostrar (ej. "Reactivo 3 de 20") */
  index: number;
  total: number;
  /**
   * Cuando se provee, el card entra en modo "revelado":
   * deshabilita cambios, resalta correcta/incorrecta y muestra explicación.
   */
  feedback?: FeedbackState;
}

// ---------------------------------------------------------------------------
// Bloque de contexto de caso
// ---------------------------------------------------------------------------

function CasoBlock({ caso }: { caso: string }) {
  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-5">
      <p className="mb-2 text-xs font-bold text-amber-700 uppercase tracking-widest">
        Contexto del caso
      </p>
      <p className="text-base leading-relaxed text-gray-800">{caso}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-renderer T1/T2: Cuestionamiento directo / Completamiento
// ---------------------------------------------------------------------------

function ChoiceRenderer({
  enunciado,
  opciones,
  correcta,
  answer,
  onChange,
  revealed,
}: {
  enunciado: string;
  opciones: [string, string, string, string];
  correcta: 0 | 1 | 2 | 3;
  answer: ChoiceAnswer | null;
  onChange: (a: ChoiceAnswer) => void;
  revealed: boolean;
}) {
  return (
    <div>
      <p className="mb-5 text-lg font-medium leading-relaxed text-gray-900">{enunciado}</p>
      <ul className="space-y-3">
        {opciones.map((opt, i) => {
          const selected = answer?.index === i;
          const isCorrect = i === correcta;

          let colorClasses: string;
          if (revealed) {
            if (isCorrect) {
              colorClasses = 'border-green-600 bg-green-50 font-semibold text-green-900';
            } else if (selected && !isCorrect) {
              colorClasses = 'border-red-400 bg-red-50 font-semibold text-red-800';
            } else {
              colorClasses = 'border-gray-200 bg-white text-gray-500';
            }
          } else {
            colorClasses = selected
              ? 'border-blue-600 bg-blue-50 font-semibold text-blue-900'
              : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800';
          }

          return (
            <li key={i}>
              <button
                type="button"
                disabled={revealed}
                onClick={() => !revealed && onChange({ kind: 'choice', index: i })}
                className={`w-full text-left rounded-xl border px-5 py-3.5 text-base transition-colors ${colorClasses} ${revealed ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className="mr-3 font-bold text-gray-500">
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
                {revealed && isCorrect && (
                  <span className="ml-2 text-green-700 font-bold">✓</span>
                )}
                {revealed && selected && !isCorrect && (
                  <span className="ml-2 text-red-600 font-bold">✗</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-renderer T3: Ordenamiento
// ---------------------------------------------------------------------------

function OrderingRenderer({
  enunciado,
  elementos,
  answer,
  onChange,
}: {
  enunciado: string;
  elementos: string[];
  answer: OrderAnswer | null;
  onChange: (a: OrderAnswer) => void;
}) {
  const sequence = answer?.sequence ?? [];

  const handleToggle = (idx: number) => {
    const pos = sequence.indexOf(idx);
    let next: number[];
    if (pos >= 0) {
      next = sequence.filter((_, i) => i !== pos);
    } else {
      next = [...sequence, idx];
    }
    onChange({ kind: 'order', sequence: next });
  };

  return (
    <div>
      <p className="mb-4 text-lg font-medium leading-relaxed text-gray-900">{enunciado}</p>
      <p className="mb-4 text-sm text-gray-500">
        Haz clic en los elementos en el orden correcto:
      </p>
      <ul className="space-y-2">
        {elementos.map((item, idx) => {
          const pos = sequence.indexOf(idx);
          const selected = pos >= 0;
          return (
            <li key={idx}>
              <button
                type="button"
                onClick={() => handleToggle(idx)}
                className={`w-full text-left rounded-xl border px-5 py-3.5 text-base transition-colors ${
                  selected
                    ? 'border-blue-600 bg-blue-50 font-semibold text-blue-900'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800'
                }`}
              >
                {selected && (
                  <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                    {pos + 1}
                  </span>
                )}
                {item}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-renderer T4: Relación de columnas — dropdown por fila
// ---------------------------------------------------------------------------

function RelacionRenderer({
  enunciado,
  columnaIzquierda,
  columnaDerecha,
  answer,
  onChange,
}: {
  enunciado: string;
  columnaIzquierda: string[];
  columnaDerecha: string[];
  answer: MatchAnswer | null;
  onChange: (a: MatchAnswer) => void;
}) {
  const pairs = answer?.pairs ?? [];

  const getSelectedRight = (leftIdx: number): number | undefined =>
    pairs.find(([l]) => l === leftIdx)?.[1];

  const handleSelect = (leftIdx: number, value: string) => {
    const rightIdx = parseInt(value, 10);
    const filtered = pairs.filter(([l]) => l !== leftIdx);

    if (isNaN(rightIdx)) {
      // Opción vacía — quitar la selección
      onChange({ kind: 'match', pairs: filtered as [number, number][] });
      return;
    }

    // Quitar si rightIdx ya está asignado a otro concepto izquierdo
    const clean = filtered.filter(([, r]) => r !== rightIdx);
    onChange({
      kind: 'match',
      pairs: [...clean, [leftIdx, rightIdx]] as [number, number][],
    });
  };

  return (
    <div>
      <p className="mb-5 text-lg font-medium leading-relaxed text-gray-900">{enunciado}</p>
      <div className="space-y-3">
        {columnaIzquierda.map((leftItem, leftIdx) => {
          const selectedRight = getSelectedRight(leftIdx);
          return (
            <div
              key={leftIdx}
              className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:gap-4"
            >
              <p className="flex-1 text-base font-medium text-gray-900">
                <span className="mr-2 text-gray-400">{leftIdx + 1}.</span>
                {leftItem}
              </p>
              <select
                value={selectedRight !== undefined ? String(selectedRight) : ''}
                onChange={(e) => handleSelect(leftIdx, e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:min-w-48"
                aria-label={`Relación para: ${leftItem}`}
              >
                <option value="">— elige una opción —</option>
                {columnaDerecha.map((rightItem, rightIdx) => (
                  <option key={rightIdx} value={String(rightIdx)}>
                    {String.fromCharCode(97 + rightIdx)}. {rightItem}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuestionCard principal
// ---------------------------------------------------------------------------

export function QuestionCard({ question, answer, onChange, index, total, feedback }: QuestionCardProps) {
  const areaNombre = getAreaNombre(question.area);
  const revealed = feedback !== undefined;

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
      <header className="mb-5 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Reactivo <span className="font-semibold text-gray-700">{index}</span> de {total}
        </span>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          {areaNombre}
        </span>
      </header>

      {question.caso && <CasoBlock caso={question.caso} />}

      {renderReactivo(question, answer, onChange, revealed)}

      {feedback && (
        <div
          className={`mt-6 rounded-xl border px-5 py-4 ${
            feedback.correcto
              ? 'border-green-300 bg-green-50'
              : 'border-red-300 bg-red-50'
          }`}
          role="status"
          aria-live="polite"
        >
          <p className={`mb-2 font-bold text-sm ${feedback.correcto ? 'text-green-700' : 'text-red-700'}`}>
            {feedback.correcto ? '¡Correcto!' : 'Incorrecto'}
          </p>
          <p className="text-sm leading-relaxed text-gray-700">{feedback.explicacion}</p>
        </div>
      )}
    </article>
  );
}

function renderReactivo(
  question: Reactivo,
  answer: Answer | null,
  onChange: (a: Answer) => void,
  revealed: boolean,
) {
  switch (question.tipo) {
    case 'directo':
    case 'completamiento': {
      const q = question as ReactivoDirecto | ReactivoCompletamiento;
      return (
        <ChoiceRenderer
          enunciado={q.enunciado}
          opciones={q.opciones}
          correcta={q.correcta}
          answer={answer?.kind === 'choice' ? answer : null}
          onChange={onChange}
          revealed={revealed}
        />
      );
    }
    case 'ordenamiento': {
      const q = question as ReactivoOrdenamiento;
      return (
        <OrderingRenderer
          enunciado={q.enunciado}
          elementos={q.elementos}
          answer={answer?.kind === 'order' ? answer : null}
          onChange={onChange}
        />
      );
    }
    case 'relacion': {
      const q = question as ReactivoRelacion;
      return (
        <RelacionRenderer
          enunciado={q.enunciado}
          columnaIzquierda={q.columnaIzquierda}
          columnaDerecha={q.columnaDerecha}
          answer={answer?.kind === 'match' ? answer : null}
          onChange={onChange}
        />
      );
    }
    default:
      return assertNever(question);
  }
}
