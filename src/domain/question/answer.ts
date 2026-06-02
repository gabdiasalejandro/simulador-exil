// Respuestas por tipo de reactivo (union discriminada — modelo v2)

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

export type Answer = ChoiceAnswer | OrderAnswer | MatchAnswer;

/**
 * Indica si el usuario ya respondió el reactivo.
 */
export function isAnswered(a: Answer | null): boolean {
  return a !== null;
}
