import type {
  ReactivoDirecto,
  ReactivoCompletamiento,
  ReactivoOrdenamiento,
  ReactivoRelacion,
  Reactivo,
} from '../question/question';
import { assertNever } from '../question/question';
import type { Answer, ChoiceAnswer, OrderAnswer, MatchAnswer } from '../question/answer';

// ---------------------------------------------------------------------------
// Helpers de comparación por tipo
// ---------------------------------------------------------------------------

function scoreChoice(q: ReactivoDirecto | ReactivoCompletamiento, a: ChoiceAnswer): 0 | 1 {
  return a.index === q.correcta ? 1 : 0;
}

function scoreOrder(q: ReactivoOrdenamiento, a: OrderAnswer): 0 | 1 {
  if (a.sequence.length !== q.ordenCorrecto.length) return 0;
  for (let i = 0; i < q.ordenCorrecto.length; i++) {
    if (a.sequence[i] !== q.ordenCorrecto[i]) return 0;
  }
  return 1;
}

function scoreMatch(q: ReactivoRelacion, a: MatchAnswer): 0 | 1 {
  if (a.pairs.length !== q.emparejamientos.length) return 0;
  // Ordenar ambos para comparación independiente del orden de entrega
  const sortPairs = (pairs: ReadonlyArray<readonly [number, number]>) =>
    [...pairs].sort((x, y) => x[0] - y[0] || x[1] - y[1]);
  const sortedCorrect = sortPairs(q.emparejamientos);
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
 * Califica un reactivo. Retorna 0 o 1.
 * Sin responder (null) → 0 (REQ-06.4).
 * getItemCount siempre es 1 en el modelo v2 (casos aplanados).
 */
export function scoreQuestion(q: Reactivo, a: Answer | null): 0 | 1 {
  if (a === null) return 0;

  switch (q.tipo) {
    case 'directo':
    case 'completamiento': {
      if (a.kind !== 'choice') return 0;
      return scoreChoice(q, a);
    }
    case 'ordenamiento': {
      if (a.kind !== 'order') return 0;
      return scoreOrder(q, a);
    }
    case 'relacion': {
      if (a.kind !== 'match') return 0;
      return scoreMatch(q, a);
    }
    default:
      return assertNever(q);
  }
}
