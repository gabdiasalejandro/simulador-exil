import type {
  Question,
  DirectQuestion,
  CompletionQuestion,
  OrderingQuestion,
  ColumnMatchQuestion,
  CaseQuestion,
  SubQuestion,
} from '../../../domain/question/question';
import type {
  Answer,
  ChoiceAnswer,
  OrderAnswer,
  MatchAnswer,
  CaseAnswer,
  LeafAnswer,
} from '../../../domain/question/answer';
import { assertNever } from '../../../domain/question/question';

// ---------------------------------------------------------------------------
// Props principal
// ---------------------------------------------------------------------------

export interface QuestionCardProps {
  question: Question;
  answer: Answer | null;
  onChange: (answer: Answer) => void;
  /** Número de orden para mostrar (ej. "Reactivo 3 de 20") */
  index: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Sub-renderer T1/T2: Cuestionamiento directo / Completamiento
// ---------------------------------------------------------------------------

function ChoiceRenderer({
  stem,
  options,
  answer,
  onChange,
}: {
  stem: string;
  options: [string, string, string, string];
  answer: ChoiceAnswer | null;
  onChange: (a: ChoiceAnswer) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-gray-800 leading-relaxed">{stem}</p>
      <ul className="space-y-2">
        {options.map((opt, i) => {
          const selected = answer?.index === i;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => onChange({ kind: 'choice', index: i })}
                className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors ${
                  selected
                    ? 'border-blue-600 bg-blue-50 font-semibold text-blue-800'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="mr-2 font-bold">
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
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
  stem,
  items,
  answer,
  onChange,
}: {
  stem: string;
  items: string[];
  answer: OrderAnswer | null;
  onChange: (a: OrderAnswer) => void;
}) {
  // Estado: secuencia de índices seleccionados (en el orden elegido por el usuario)
  const sequence = answer?.sequence ?? [];

  const handleToggle = (idx: number) => {
    const pos = sequence.indexOf(idx);
    let next: number[];
    if (pos >= 0) {
      // Des-seleccionar: remover
      next = sequence.filter((_, i) => i !== pos);
    } else {
      // Agregar al final
      next = [...sequence, idx];
    }
    onChange({ kind: 'order', sequence: next });
  };

  return (
    <div>
      <p className="mb-3 text-gray-800 leading-relaxed">{stem}</p>
      <p className="mb-3 text-xs text-gray-500">
        Haz clic en los elementos en el orden correcto:
      </p>
      <ul className="space-y-2">
        {items.map((item, idx) => {
          const pos = sequence.indexOf(idx);
          const selected = pos >= 0;
          return (
            <li key={idx}>
              <button
                type="button"
                onClick={() => handleToggle(idx)}
                className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors ${
                  selected
                    ? 'border-blue-600 bg-blue-50 font-semibold text-blue-800'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                {selected && (
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
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
// Sub-renderer T4: Relación de columnas
// ---------------------------------------------------------------------------

function MatchRenderer({
  stem,
  leftColumn,
  rightColumn,
  answer,
  onChange,
}: {
  stem: string;
  leftColumn: string[];
  rightColumn: string[];
  answer: MatchAnswer | null;
  onChange: (a: MatchAnswer) => void;
}) {
  const pairs = answer?.pairs ?? [];

  const getRightForLeft = (leftIdx: number): number | undefined =>
    pairs.find(([l]) => l === leftIdx)?.[1];

  const handleSelect = (leftIdx: number, rightIdx: number) => {
    // Reemplazar o agregar el par para leftIdx
    const filtered = pairs.filter(([l]) => l !== leftIdx);
    const current = getRightForLeft(leftIdx);
    if (current === rightIdx) {
      // Des-seleccionar
      onChange({ kind: 'match', pairs: filtered });
    } else {
      // También quitar si rightIdx ya está asignado a otro left
      const clean = filtered.filter(([, r]) => r !== rightIdx);
      onChange({
        kind: 'match',
        pairs: [...clean, [leftIdx, rightIdx]] as [number, number][],
      });
    }
  };

  return (
    <div>
      <p className="mb-4 text-gray-800 leading-relaxed">{stem}</p>
      <div className="space-y-4">
        {leftColumn.map((leftItem, leftIdx) => {
          const selectedRight = getRightForLeft(leftIdx);
          return (
            <div key={leftIdx} className="rounded-lg border border-gray-200 p-3">
              <p className="mb-2 text-sm font-semibold text-gray-700">
                {leftIdx + 1}. {leftItem}
              </p>
              <div className="flex flex-wrap gap-2">
                {rightColumn.map((rightItem, rightIdx) => {
                  const isSelected = selectedRight === rightIdx;
                  return (
                    <button
                      key={rightIdx}
                      type="button"
                      onClick={() => handleSelect(leftIdx, rightIdx)}
                      className={`rounded border px-3 py-1 text-xs transition-colors ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 font-semibold text-blue-800'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      {String.fromCharCode(97 + rightIdx)}. {rightItem}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-renderer para sub-preguntas de T5 (hoja)
// ---------------------------------------------------------------------------

function SubQuestionRenderer({
  subQ,
  subIndex,
  answer,
  onChange,
}: {
  subQ: SubQuestion;
  subIndex: number;
  answer: LeafAnswer | null;
  onChange: (a: LeafAnswer) => void;
}) {
  switch (subQ.itemType) {
    case 'direct':
    case 'completion': {
      const q = subQ as DirectQuestion | CompletionQuestion;
      return (
        <div className="mb-4 rounded-lg bg-gray-50 p-3">
          <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Sub-pregunta {subIndex + 1}
          </p>
          <ChoiceRenderer
            stem={q.stem}
            options={q.options}
            answer={answer?.kind === 'choice' ? answer : null}
            onChange={onChange}
          />
        </div>
      );
    }
    case 'ordering': {
      const q = subQ as OrderingQuestion;
      return (
        <div className="mb-4 rounded-lg bg-gray-50 p-3">
          <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Sub-pregunta {subIndex + 1}
          </p>
          <OrderingRenderer
            stem={q.stem}
            items={q.items}
            answer={answer?.kind === 'order' ? answer : null}
            onChange={onChange}
          />
        </div>
      );
    }
    case 'match': {
      const q = subQ as ColumnMatchQuestion;
      return (
        <div className="mb-4 rounded-lg bg-gray-50 p-3">
          <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Sub-pregunta {subIndex + 1}
          </p>
          <MatchRenderer
            stem={q.stem}
            leftColumn={q.leftColumn}
            rightColumn={q.rightColumn}
            answer={answer?.kind === 'match' ? answer : null}
            onChange={onChange}
          />
        </div>
      );
    }
    default:
      return assertNever(subQ);
  }
}

// ---------------------------------------------------------------------------
// Sub-renderer T5: Caso / Multirreactivo
// ---------------------------------------------------------------------------

function CaseRenderer({
  question,
  answer,
  onChange,
}: {
  question: CaseQuestion;
  answer: CaseAnswer | null;
  onChange: (a: CaseAnswer) => void;
}) {
  const subAnswers: Array<LeafAnswer | null> =
    answer?.answers
      ? Array.from({ length: question.subQuestions.length }, (_, i) =>
          answer.answers[i] ?? null,
        )
      : Array(question.subQuestions.length).fill(null);

  const handleSubChange = (subIndex: number, subAnswer: LeafAnswer) => {
    const next = [...subAnswers];
    next[subIndex] = subAnswer;
    onChange({ kind: 'case', answers: next });
  };

  return (
    <div>
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-gray-800 leading-relaxed">
        <p className="mb-1 text-xs font-semibold text-amber-700 uppercase tracking-wide">
          Caso
        </p>
        {question.caseStem}
      </div>

      {question.subQuestions.map((subQ, i) => (
        <SubQuestionRenderer
          key={i}
          subQ={subQ}
          subIndex={i}
          answer={subAnswers[i] ?? null}
          onChange={(a) => handleSubChange(i, a)}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuestionCard principal
// ---------------------------------------------------------------------------

export function QuestionCard({ question, answer, onChange, index, total }: QuestionCardProps) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <header className="mb-4 flex items-center justify-between text-xs text-gray-400">
        <span>
          Reactivo {index} de {total}
        </span>
        <span className="uppercase tracking-wide text-gray-300">
          {question.officialTag.area} · {question.officialTag.subarea}
        </span>
      </header>

      {renderQuestion(question, answer, onChange)}
    </article>
  );
}

function renderQuestion(
  question: Question,
  answer: Answer | null,
  onChange: (a: Answer) => void,
) {
  switch (question.itemType) {
    case 'direct':
    case 'completion':
      return (
        <ChoiceRenderer
          stem={question.stem}
          options={question.options}
          answer={answer?.kind === 'choice' ? answer : null}
          onChange={onChange}
        />
      );
    case 'ordering':
      return (
        <OrderingRenderer
          stem={question.stem}
          items={question.items}
          answer={answer?.kind === 'order' ? answer : null}
          onChange={onChange}
        />
      );
    case 'match':
      return (
        <MatchRenderer
          stem={question.stem}
          leftColumn={question.leftColumn}
          rightColumn={question.rightColumn}
          answer={answer?.kind === 'match' ? answer : null}
          onChange={onChange}
        />
      );
    case 'case':
      return (
        <CaseRenderer
          question={question}
          answer={answer?.kind === 'case' ? answer : null}
          onChange={onChange}
        />
      );
    default:
      return assertNever(question);
  }
}
