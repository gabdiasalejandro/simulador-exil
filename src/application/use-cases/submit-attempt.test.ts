import { describe, it, expect, vi } from 'vitest';
import { submitAttempt } from './submit-attempt';
import type { StoragePort } from '../ports/storage-port';
import type { ExamSession } from '../../domain/exam/session';
import type { SampledExam } from '../../domain/exam/sampling';
import type { DirectQuestion } from '../../domain/question/question';
import type { Answer } from '../../domain/question/answer';
import type { Attempt } from '../../domain/attempt/attempt';

// ---------------------------------------------------------------------------
// Fakes helpers
// ---------------------------------------------------------------------------

function makeDirectQuestion(id: string): DirectQuestion {
  return {
    id,
    itemType: 'direct',
    stem: `Pregunta ${id}`,
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
    explanation: 'Explicación.',
    officialTag: { area: 'A', subarea: 'A1' },
    originTag: { area: 'Administración', subarea: 'Conceptos' },
  };
}

function makeSampledExam(questionIds: string[]): SampledExam {
  return {
    questions: questionIds.map(makeDirectQuestion),
    bankWarnings: [],
  };
}

function makeSession(questionIds: string[], answerMap?: Map<string, Answer | null>): ExamSession {
  const exam = makeSampledExam(questionIds);
  const answers = answerMap ?? new Map<string, Answer | null>();
  return {
    id: 'session-test',
    config: { size: 20, timer: { mode: 'limited', minutes: 58 } },
    exam,
    answers,
    startedAt: Date.now() - 1000,
  };
}

function makeFakeStoragePort(): StoragePort & { saved: Attempt[] } {
  const saved: Attempt[] = [];
  return {
    saved,
    saveAttempt: vi.fn(async (attempt: Attempt) => {
      saved.push(attempt);
    }),
    listAttempts: vi.fn(async () => [...saved]),
    getAttempt: vi.fn(async (id: string) => saved.find((a) => a.id === id) ?? null),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('submitAttempt', () => {
  it('retorna un Attempt con los campos correctos', async () => {
    const session = makeSession(['q1', 'q2', 'q3']);
    session.answers.set('q1', { kind: 'choice', index: 0 }); // correcta
    session.answers.set('q2', { kind: 'choice', index: 1 }); // incorrecta
    // q3 sin responder

    const port = makeFakeStoragePort();
    const attempt = await submitAttempt(session, port);

    expect(attempt.id).toBeTruthy();
    expect(attempt.report.globalScore.correct).toBe(1);
    expect(attempt.report.globalScore.total).toBe(3);
    expect(attempt.startedAt).toBe(session.startedAt);
    expect(attempt.finishedAt).toBeGreaterThanOrEqual(attempt.startedAt);
  });

  it('llama saveAttempt exactamente una vez', async () => {
    const session = makeSession(['q1', 'q2']);
    const port = makeFakeStoragePort();

    await submitAttempt(session, port);

    expect(port.saveAttempt).toHaveBeenCalledTimes(1);
  });

  it('llama saveAttempt con el Attempt construido (mismo id en el retorno y en el argumento)', async () => {
    const session = makeSession(['q1']);
    const port = makeFakeStoragePort();

    const attempt = await submitAttempt(session, port);

    expect(port.saveAttempt).toHaveBeenCalledWith(attempt);
  });

  it('persiste correctamente con cero respuestas (sesión enviada sin contestar nada)', async () => {
    const session = makeSession(['q1', 'q2', 'q3']);
    const port = makeFakeStoragePort();

    const attempt = await submitAttempt(session, port);

    expect(attempt.report.globalScore.correct).toBe(0);
    expect(attempt.report.globalScore.total).toBe(3);
  });

  it('propaga bankWarnings al report cuando el examen los tiene', async () => {
    const exam: SampledExam = {
      questions: [makeDirectQuestion('q1')],
      bankWarnings: [{ subarea: 'B1', requested: 6, available: 1 }],
    };
    const session: ExamSession = {
      id: 'session-test',
      config: { size: 60, timer: { mode: 'limited', minutes: 173 } },
      exam,
      answers: new Map(),
      startedAt: Date.now() - 500,
    };
    const port = makeFakeStoragePort();

    const attempt = await submitAttempt(session, port);

    expect(attempt.report.bankWarnings.length).toBe(1);
    expect(attempt.report.bankWarnings[0]?.subarea).toBe('B1');
  });
});
