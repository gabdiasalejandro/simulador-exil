// Respuestas por tipo de reactivo (union discriminada)

/** T1/T2 — Cuestionamiento directo / Completamiento */
export interface ChoiceAnswer {
  readonly kind: 'choice';
  readonly index: number;
}

/** T3 — Ordenamiento: secuencia de índices en el orden que el usuario eligió */
export interface OrderAnswer {
  readonly kind: 'order';
  readonly sequence: number[];
}

/** T4 — Relación de columnas: pares [índice izquierdo, índice derecho] */
export interface MatchAnswer {
  readonly kind: 'match';
  readonly pairs: ReadonlyArray<[number, number]>;
}

/** T5 — Caso: una respuesta por sub-pregunta (puede ser null si no respondió) */
export interface CaseAnswer {
  readonly kind: 'case';
  readonly answers: ReadonlyArray<LeafAnswer | null>;
}

export type LeafAnswer = ChoiceAnswer | OrderAnswer | MatchAnswer;

export type Answer = LeafAnswer | CaseAnswer;

/**
 * Indica si el usuario ya respondió la pregunta.
 * Para CaseAnswer: verdadero si al menos una sub-respuesta no es null.
 */
export function isAnswered(a: Answer | null): boolean {
  if (a === null) return false;
  if (a.kind === 'case') {
    return a.answers.some((sub) => sub !== null);
  }
  return true;
}
