import type { ExamSize } from './blueprint';
import type { SampledExam } from './sampling';
import type { Answer } from '../question/answer';
import type { SubareaCode } from '../taxonomy/taxonomy';

// ---------------------------------------------------------------------------
// Timer config
// ---------------------------------------------------------------------------

export interface LimitedTimer {
  readonly mode: 'limited';
  readonly minutes: number;
}

export interface UnlimitedTimer {
  readonly mode: 'unlimited';
}

export type TimerConfig = LimitedTimer | UnlimitedTimer;

// ---------------------------------------------------------------------------
// SessionConfig
// ---------------------------------------------------------------------------

export interface SessionConfig {
  readonly size: ExamSize;
  readonly timer: TimerConfig;
}

// ---------------------------------------------------------------------------
// ExamSession
// ---------------------------------------------------------------------------

export type AnswerMap = ReadonlyMap<string, Answer | null>;

export interface ExamSession {
  readonly id: string;
  readonly config: SessionConfig;
  readonly exam: SampledExam;
  /** Mapa questionId → respuesta (null si no respondida) */
  readonly answers: Map<string, Answer | null>;
  readonly startedAt: number; // timestamp epoch ms
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Tiempo default sugerido al arrancar el simulacro.
 * Fórmula: round((size / 125) × 360), mínimo 5 minutos.
 * Base 360 = examen real completo (2 sesiones × 180 min), resolución obs-313.
 */
export function computeDefaultMinutes(size: ExamSize): number {
  const raw = Math.round((size / 125) * 360);
  return Math.max(5, raw);
}

/** Genera un SessionConfig con timer limitado usando el default calculado. */
export function defaultSessionConfig(size: ExamSize): SessionConfig {
  return {
    size,
    timer: { mode: 'limited', minutes: computeDefaultMinutes(size) },
  };
}
