import type { ExamSession } from '../exam/session';
import type { Answer } from '../question/answer';
import type { AttemptReport } from '../scoring/attempt-report';

// ---------------------------------------------------------------------------
// Snapshot del blueprint (distribución usada, no todo el blueprint obj)
// ---------------------------------------------------------------------------

export interface BlueprintSnapshot {
  readonly size: number;
  /** Distribución efectiva: subárea → cantidad asignada */
  readonly distribution: ReadonlyMap<string, number>;
}

// ---------------------------------------------------------------------------
// Snapshot del examen (ids + orden de presentación)
// ---------------------------------------------------------------------------

export interface ExamSnapshot {
  /** IDs en el orden en que se presentaron */
  readonly questionIds: ReadonlyArray<string>;
}

// ---------------------------------------------------------------------------
// Attempt
// ---------------------------------------------------------------------------

export interface Attempt {
  readonly id: string;
  readonly blueprintSnapshot: BlueprintSnapshot;
  readonly examSnapshot: ExamSnapshot;
  /** Mapa questionId → respuesta enviada (null = sin responder) */
  readonly answerMap: ReadonlyMap<string, Answer | null>;
  readonly report: AttemptReport;
  readonly startedAt: number; // epoch ms
  readonly finishedAt: number; // epoch ms
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

let attemptCounter = 0;

function generateId(): string {
  attemptCounter++;
  return `attempt-${Date.now()}-${attemptCounter}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Construye un Attempt a partir de la sesión finalizada y el reporte calculado.
 * Hace snapshot de los datos para que el Attempt sea autocontenido e inmutable.
 */
export function createAttempt(session: ExamSession, report: AttemptReport): Attempt {
  const blueprintSnapshot: BlueprintSnapshot = {
    size: session.config.size,
    distribution: new Map(
      // Derivar la distribución efectiva de las preguntas del examen
      (() => {
        const dist = new Map<string, number>();
        for (const q of session.exam.questions) {
          const sub = q.subarea;
          dist.set(sub, (dist.get(sub) ?? 0) + 1);
        }
        return dist;
      })(),
    ),
  };

  const examSnapshot: ExamSnapshot = {
    questionIds: session.exam.questions.map((q) => q.id),
  };

  // Copiar el answerMap para que sea inm immutable e independiente de la sesión
  const answerMap = new Map<string, Answer | null>(session.answers);

  return {
    id: generateId(),
    blueprintSnapshot,
    examSnapshot,
    answerMap,
    report,
    startedAt: session.startedAt,
    finishedAt: Date.now(),
  };
}
