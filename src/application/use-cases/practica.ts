import type { ContentPort } from '../ports/content-port';
import type { AreaCode, SubareaCode } from '../../domain/taxonomy/taxonomy';
import type { Reactivo } from '../../domain/question/question';
import type { Answer } from '../../domain/question/answer';
import type { Rng } from '../../domain/exam/sampling';
import { scoreQuestion } from '../../domain/scoring/scoring-policy';

// ---------------------------------------------------------------------------
// Tipos de configuración
// ---------------------------------------------------------------------------

export interface PracticaFiltro {
  /** Área a practicar (obligatorio). */
  area: AreaCode;
  /** Subárea específica. Si es undefined, se toman todos los reactivos del área. */
  subarea?: SubareaCode;
}

export interface PracticaSession {
  /** Lista completa de reactivos del tema seleccionado, en orden aleatorio. */
  reactivos: ReadonlyArray<Reactivo>;
  /** Filtro que generó esta sesión. */
  filtro: PracticaFiltro;
}

// ---------------------------------------------------------------------------
// Función de mezcla (Fisher-Yates) — inyectable para tests
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

// ---------------------------------------------------------------------------
// Caso de uso: cargar sesión de práctica
// ---------------------------------------------------------------------------

/**
 * Carga el banco y devuelve los reactivos del área (y opcionalmente subárea)
 * seleccionados en orden ALEATORIO.
 *
 * - Si el banco no tiene reactivos para el tema → devuelve arreglo vacío
 *   (la UI debe mostrar un aviso).
 * - No lanza Error; los fallos del ContentPort se propagan tal cual.
 *
 * @param filtro  Área y subárea opcional para filtrar.
 * @param port    ContentPort inyectado.
 * @param rng     Función aleatoria inyectable (default: Math.random).
 */
export async function cargarPractica(
  filtro: PracticaFiltro,
  port: ContentPort,
  rng: Rng = Math.random,
): Promise<PracticaSession> {
  const banco = await port.loadBank();

  const filtrados = banco.filter((r) => {
    if (r.area !== filtro.area) return false;
    if (filtro.subarea !== undefined && r.subarea !== filtro.subarea) return false;
    return true;
  });

  const mezclados = shuffle(filtrados, rng);

  return { reactivos: mezclados, filtro };
}

// ---------------------------------------------------------------------------
// Caso de uso: evaluar una respuesta (feedback inmediato)
// ---------------------------------------------------------------------------

export interface FeedbackResult {
  /** true si la respuesta es correcta. */
  correcto: boolean;
  /** Puntuación retornada por el dominio (0 o 1). */
  puntuacion: 0 | 1;
  /** Explicación del reactivo para mostrar al estudiante. */
  explicacion: string;
}

/**
 * Evalúa la respuesta de un reactivo usando la política de puntuación del dominio.
 * Retorna el resultado de feedback: correcto/incorrecto + explicación.
 *
 * No tiene estado — es una función pura de presentación que delega en el dominio.
 */
export function evaluarRespuesta(reactivo: Reactivo, respuesta: Answer | null): FeedbackResult {
  const puntuacion = scoreQuestion(reactivo, respuesta);
  return {
    correcto: puntuacion === 1,
    puntuacion,
    explicacion: reactivo.explanation,
  };
}
