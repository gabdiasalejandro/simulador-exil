import type {
  Question,
  LeafQuestion,
  CaseQuestion,
  DirectQuestion,
  CompletionQuestion,
  OrderingQuestion,
  ColumnMatchQuestion,
} from '../question/question';
import { assertNever } from '../question/question';
import type { Answer, LeafAnswer, ChoiceAnswer, OrderAnswer, MatchAnswer } from '../question/answer';

// ---------------------------------------------------------------------------
// Helpers de comparación por tipo
// ---------------------------------------------------------------------------

function scoreChoice(q: DirectQuestion | CompletionQuestion, a: ChoiceAnswer): 0 | 1 {
  return a.index === q.correctIndex ? 1 : 0;
}

function scoreOrder(q: OrderingQuestion, a: OrderAnswer): 0 | 1 {
  if (a.sequence.length !== q.correctOrder.length) return 0;
  for (let i = 0; i < q.correctOrder.length; i++) {
    if (a.sequence[i] !== q.correctOrder[i]) return 0;
  }
  return 1;
}

function scoreMatch(q: ColumnMatchQuestion, a: MatchAnswer): 0 | 1 {
  if (a.pairs.length !== q.correctMatches.length) return 0;
  // Ordenar ambos para comparación independiente del orden de entrega
  const sortPairs = (pairs: ReadonlyArray<readonly [number, number]>) =>
    [...pairs].sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  const sortedCorrect = sortPairs(q.correctMatches);
  const sortedAnswer = sortPairs(a.pairs);
  for (let i = 0; i < sortedCorrect.length; i++) {
    const c = sortedCorrect[i]!;
    const r = sortedAnswer[i]!;
    if (c[0] !== r[0] || c[1] !== r[1]) return 0;
  }
  return 1;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Califica una pregunta hoja (leaf). Retorna 0 o 1.
 * Sin responder (null) → 0 (REQ-06.4).
 */
export function scoreQuestion(q: LeafQuestion, a: Answer | null): 0 | 1 {
  if (a === null) return 0;

  switch (q.itemType) {
    case 'direct':
    case 'completion': {
      if (a.kind !== 'choice') return 0;
      return scoreChoice(q, a);
    }
    case 'ordering': {
      if (a.kind !== 'order') return 0;
      return scoreOrder(q, a);
    }
    case 'match': {
      if (a.kind !== 'match') return 0;
      return scoreMatch(q, a);
    }
    default:
      return assertNever(q);
  }
}

/**
 * Califica un caso con N sub-preguntas.
 * Retorna la cantidad de sub-respuestas correctas (0 a N).
 */
export function scoreCaseQuestion(q: CaseQuestion, answers: ReadonlyArray<Answer | null>): number {
  let correct = 0;
  for (let i = 0; i < q.subQuestions.length; i++) {
    const sub = q.subQuestions[i];
    const ans = answers[i] ?? null;
    if (!sub) continue;

    // Construir una LeafQuestion sintética para reutilizar scoreQuestion
    const leafQ = { ...sub, id: `${q.id}-sub${i}`, officialTag: q.officialTag, originTag: q.originTag, explanation: q.explanation } as LeafQuestion;

    if (ans !== null && ans.kind === 'case') continue; // caso anidado no permitido
    const leafAns = ans as LeafAnswer | null;
    correct += scoreQuestion(leafQ, leafAns);
  }
  return correct;
}
