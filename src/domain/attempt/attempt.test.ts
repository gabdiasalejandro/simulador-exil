import { describe, it, expect } from 'vitest';
import { createAttempt } from './attempt';
import type { ExamSession } from '../exam/session';
import type { SampledExam } from '../exam/sampling';
import type { ReactivoDirecto } from '../question/question';
import type { Answer } from '../question/answer';
import type { AttemptReport } from '../scoring/attempt-report';

function makeSession(id: string, size: 20 | 60 | 125 = 20): ExamSession {
  const q: ReactivoDirecto = {
    id: 'q1',
    tipo: 'directo',
    area: 'A',
    subarea: 'A1',
    explanation: 'e',
    enunciado: 's',
    opciones: ['A', 'B', 'C', 'D'],
    correcta: 0,
  };
  const exam: SampledExam = { questions: [q], bankWarnings: [] };
  return {
    id,
    config: { size, timer: { mode: 'limited', minutes: 58 } },
    exam,
    answers: new Map<string, Answer | null>([['q1', { kind: 'choice', index: 0 }]]),
    startedAt: Date.now() - 1000,
  };
}

function makeReport(): AttemptReport {
  return {
    globalScore: { correct: 1, total: 1 },
    byArea: new Map([['A', { correct: 1, total: 1 }]]),
    bySubarea: new Map([['A1', { correct: 1, total: 1 }]]),
    bankWarnings: [],
  };
}

describe('createAttempt', () => {
  // esc.07-A: campos intactos
  it('esc.07-A — el attempt tiene todos los campos del spec', () => {
    const session = makeSession('s1');
    const report = makeReport();
    const attempt = createAttempt(session, report);

    expect(typeof attempt.id).toBe('string');
    expect(attempt.id.length).toBeGreaterThan(0);
    expect(attempt.blueprintSnapshot).toBeDefined();
    expect(attempt.examSnapshot).toBeDefined();
    expect(attempt.answerMap).toBeDefined();
    expect(attempt.report).toBe(report);
    expect(typeof attempt.startedAt).toBe('number');
    expect(typeof attempt.finishedAt).toBe('number');
    expect(attempt.finishedAt).toBeGreaterThanOrEqual(attempt.startedAt);
  });

  it('esc.07-A — answerMap conserva las respuestas de la sesión', () => {
    const session = makeSession('s1');
    const attempt = createAttempt(session, makeReport());
    expect(attempt.answerMap.get('q1')).toEqual({ kind: 'choice', index: 0 });
  });

  // esc.07-B: dos ids distintos no se mezclan
  it('esc.07-B — dos attempts con sesiones distintas tienen ids únicos', () => {
    const s1 = makeSession('ses-1');
    const s2 = makeSession('ses-2');
    const a1 = createAttempt(s1, makeReport());
    const a2 = createAttempt(s2, makeReport());
    expect(a1.id).not.toBe(a2.id);
  });

  it('esc.07-B — los datos de un attempt no se filtran al otro', () => {
    const s1 = makeSession('ses-1');
    const s2 = makeSession('ses-2');
    const a1 = createAttempt(s1, makeReport());
    const a2 = createAttempt(s2, makeReport());
    expect(a1.report).not.toBe(a2.report);
  });
});
