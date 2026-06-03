import type { SessionConfig } from '../../domain/exam/session';
import type { Reactivo } from '../../domain/question/question';
import type { Answer } from '../../domain/question/answer';
import type { BankWarning } from '../../domain/exam/sampling';

// ---------------------------------------------------------------------------
// Persistencia del simulacro EN CURSO (localStorage).
//
// A diferencia del StoragePort (IndexedDB, intentos finalizados), esto guarda
// el estado VOLÁTIL de un simulacro activo para que un refresh del navegador no
// pierda el progreso. Se borra al enviar el examen o al abandonarlo.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'simulador-exil:simulacro-en-curso';
const SNAPSHOT_VERSION = 1;

export interface SimulacroSnapshot {
  readonly version: number;
  readonly sessionId: string;
  readonly config: SessionConfig;
  /** Reactivos exactos del examen, en orden de presentación. */
  readonly questions: Reactivo[];
  readonly bankWarnings: BankWarning[];
  /** answerMap serializado como pares [id, respuesta|null]. */
  readonly answers: [string, Answer | null][];
  readonly remainingSeconds: number | null;
  readonly currentIndex: number;
  readonly startedAt: number;
}

/** Accede a localStorage de forma segura (SSR / modo restringido). */
function getStorage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

/** Guarda el snapshot del simulacro en curso (best-effort). */
export function saveSimulacroSnapshot(
  snapshot: Omit<SimulacroSnapshot, 'version'>,
): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: SNAPSHOT_VERSION, ...snapshot }),
    );
  } catch {
    // Cuota llena o serialización fallida — la persistencia es best-effort.
  }
}

/** Recupera el snapshot guardado, o null si no hay / es inválido / es de otra versión. */
export function loadSimulacroSnapshot(): SimulacroSnapshot | null {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SimulacroSnapshot;
    if (!parsed || parsed.version !== SNAPSHOT_VERSION) return null;
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) return null;
    if (!Array.isArray(parsed.answers)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Borra el snapshot del simulacro en curso. */
export function clearSimulacroSnapshot(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Ignorar.
  }
}
