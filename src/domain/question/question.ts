import type { AreaCode, SubareaCode } from '../taxonomy/taxonomy';

// ---------------------------------------------------------------------------
// Etiquetas de clasificación
// ---------------------------------------------------------------------------

export interface OfficialTag {
  readonly area: AreaCode;
  readonly subarea: SubareaCode;
}

export interface OriginTag {
  readonly area: string;
  readonly subarea: string;
}

// ---------------------------------------------------------------------------
// Base común a todos los tipos
// ---------------------------------------------------------------------------

export interface BaseQuestion {
  readonly id: string;
  readonly officialTag: OfficialTag;
  readonly originTag: OriginTag;
  readonly explanation: string;
}

// ---------------------------------------------------------------------------
// T1 — Cuestionamiento directo
// ---------------------------------------------------------------------------

export interface DirectQuestion extends BaseQuestion {
  readonly itemType: 'direct';
  readonly stem: string;
  readonly options: [string, string, string, string];
  readonly correctIndex: 0 | 1 | 2 | 3;
}

// ---------------------------------------------------------------------------
// T2 — Completamiento
// ---------------------------------------------------------------------------

export interface CompletionQuestion extends BaseQuestion {
  readonly itemType: 'completion';
  readonly stem: string;
  readonly options: [string, string, string, string];
  readonly correctIndex: 0 | 1 | 2 | 3;
}

// ---------------------------------------------------------------------------
// T3 — Ordenamiento
// ---------------------------------------------------------------------------

export interface OrderingQuestion extends BaseQuestion {
  readonly itemType: 'ordering';
  readonly stem: string;
  readonly items: string[];
  readonly correctOrder: number[];
}

// ---------------------------------------------------------------------------
// T4 — Relación de columnas
// ---------------------------------------------------------------------------

export interface ColumnMatchQuestion extends BaseQuestion {
  readonly itemType: 'match';
  readonly stem: string;
  readonly leftColumn: string[];
  readonly rightColumn: string[];
  readonly correctMatches: ReadonlyArray<[number, number]>;
}

// ---------------------------------------------------------------------------
// Hoja (todo tipo excepto T5)
// ---------------------------------------------------------------------------

export type LeafQuestion =
  | DirectQuestion
  | CompletionQuestion
  | OrderingQuestion
  | ColumnMatchQuestion;

// Sub-pregunta de T5: igual que una LeafQuestion pero sin los campos base
// (hereda officialTag/originTag/explanation/id del CaseQuestion padre).
// Se define explícitamente por variante para que TypeScript resuelva bien el
// narrowing en cada rama del switch dentro de scoring/UI.
export type DirectSubQuestion = Omit<DirectQuestion, keyof BaseQuestion>;
export type CompletionSubQuestion = Omit<CompletionQuestion, keyof BaseQuestion>;
export type OrderingSubQuestion = Omit<OrderingQuestion, keyof BaseQuestion>;
export type ColumnMatchSubQuestion = Omit<ColumnMatchQuestion, keyof BaseQuestion>;

export type SubQuestion =
  | DirectSubQuestion
  | CompletionSubQuestion
  | OrderingSubQuestion
  | ColumnMatchSubQuestion;

// ---------------------------------------------------------------------------
// T5 — Multirreactivo / Caso
// ---------------------------------------------------------------------------

export interface CaseQuestion extends BaseQuestion {
  readonly itemType: 'case';
  readonly caseStem: string;
  readonly subQuestions: ReadonlyArray<SubQuestion>;
}

// ---------------------------------------------------------------------------
// Unión discriminada principal
// ---------------------------------------------------------------------------

export type Question = LeafQuestion | CaseQuestion;

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/**
 * assertNever garantiza exhaustividad en switch. Si se llega aquí en runtime
 * significa que un nuevo tipo fue añadido sin actualizar el switch.
 */
export function assertNever(x: never): never {
  throw new Error(`Tipo no manejado: ${JSON.stringify(x)}`);
}

/**
 * Número de reactivos que contribuye esta Question al conteo del examen.
 * Leaf = 1, Case = N sub-preguntas (REQ-01 esc.01-C).
 */
export function getItemCount(q: Question): number {
  switch (q.itemType) {
    case 'direct':
    case 'completion':
    case 'ordering':
    case 'match':
      return 1;
    case 'case':
      return q.subQuestions.length;
    default:
      return assertNever(q);
  }
}
