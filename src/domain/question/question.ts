import type { AreaCode, SubareaCode } from '../taxonomy/taxonomy';

// ---------------------------------------------------------------------------
// Clasificación oficial
// ---------------------------------------------------------------------------

export interface OfficialTag {
  readonly area: AreaCode;
  readonly subarea: SubareaCode;
}

// ---------------------------------------------------------------------------
// Base común a todos los tipos (modelo v2)
// ---------------------------------------------------------------------------

export interface BaseReactivo {
  readonly id: string;
  readonly area: AreaCode;
  readonly subarea: SubareaCode;
  readonly explanation: string;
  /** Contexto de caso compartido. Presente cuando el reactivo proviene de un multirreactivo. */
  readonly caso?: string;
}

// ---------------------------------------------------------------------------
// T1 — Cuestionamiento directo
// ---------------------------------------------------------------------------

export interface ReactivoDirecto extends BaseReactivo {
  readonly tipo: 'directo';
  readonly enunciado: string;
  readonly opciones: [string, string, string, string];
  readonly correcta: 0 | 1 | 2 | 3;
}

// ---------------------------------------------------------------------------
// T2 — Completamiento
// ---------------------------------------------------------------------------

export interface ReactivoCompletamiento extends BaseReactivo {
  readonly tipo: 'completamiento';
  readonly enunciado: string;
  readonly opciones: [string, string, string, string];
  readonly correcta: 0 | 1 | 2 | 3;
}

// ---------------------------------------------------------------------------
// T3 — Ordenamiento
// ---------------------------------------------------------------------------

export interface ReactivoOrdenamiento extends BaseReactivo {
  readonly tipo: 'ordenamiento';
  readonly enunciado: string;
  readonly elementos: string[];
  readonly ordenCorrecto: number[];
}

// ---------------------------------------------------------------------------
// T4 — Relación de columnas
// ---------------------------------------------------------------------------

export interface ReactivoRelacion extends BaseReactivo {
  readonly tipo: 'relacion';
  readonly enunciado: string;
  readonly columnaIzquierda: string[];
  readonly columnaDerecha: string[];
  readonly emparejamientos: ReadonlyArray<[number, number]>;
}

// ---------------------------------------------------------------------------
// Unión discriminada principal (modelo v2 — sin tipo 'caso')
// ---------------------------------------------------------------------------

export type Reactivo =
  | ReactivoDirecto
  | ReactivoCompletamiento
  | ReactivoOrdenamiento
  | ReactivoRelacion;

// Alias de compatibilidad para código que aún usa 'Question'
export type Question = Reactivo;

// ---------------------------------------------------------------------------
// Aliases de compatibilidad para gradual migration
// ---------------------------------------------------------------------------

/** @deprecated Usar ReactivoDirecto */
export type DirectQuestion = ReactivoDirecto;
/** @deprecated Usar ReactivoCompletamiento */
export type CompletionQuestion = ReactivoCompletamiento;
/** @deprecated Usar ReactivoOrdenamiento */
export type OrderingQuestion = ReactivoOrdenamiento;
/** @deprecated Usar ReactivoRelacion */
export type ColumnMatchQuestion = ReactivoRelacion;

// OfficialTag se usa en compatibility re-export (ya definida al inicio del archivo)

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
 * Número de reactivos que contribuye este Reactivo al conteo del examen.
 * En el modelo v2 siempre es 1 (los casos están aplanados).
 */
export function getItemCount(_q: Reactivo): number {
  return 1;
}
