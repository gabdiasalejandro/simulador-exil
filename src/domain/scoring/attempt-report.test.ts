import { describe, it, expect } from 'vitest';
import { buildReport } from './attempt-report';
import type { SampledExam } from '../exam/sampling';
import type { ReactivoDirecto } from '../question/question';
import type { Answer } from '../question/answer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDirectoQ(id: string, area: 'A' | 'B', subarea: 'A1' | 'B1', correcta: 0 | 1 | 2 | 3): ReactivoDirecto {
  return {
    id,
    tipo: 'directo',
    area,
    subarea,
    explanation: 'e',
    enunciado: 's',
    opciones: ['A', 'B', 'C', 'D'],
    correcta,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// esc.06-A: 10 reactivos, 7 correctos, 3 sin responder → global 7/10
describe('buildReport — esc.06-A: global 7/10', () => {
  it('score global correcto = 7 / total = 10', () => {
    const questions: ReactivoDirecto[] = Array.from({ length: 10 }, (_, i) =>
      makeDirectoQ(`q${i}`, 'A', 'A1', 0),
    );
    const exam: SampledExam = { questions, bankWarnings: [] };

    const answers = new Map<string, Answer | null>();
    for (let i = 0; i < 7; i++) answers.set(`q${i}`, { kind: 'choice', index: 0 });
    for (let i = 7; i < 10; i++) answers.set(`q${i}`, null);

    const report = buildReport(exam, answers);
    expect(report.globalScore.correct).toBe(7);
    expect(report.globalScore.total).toBe(10);
  });
});

// esc.06-B: área A 2/4, área B 5/6
describe('buildReport — esc.06-B: score por área', () => {
  it('área A = 2/4, área B = 5/6', () => {
    const aQ = [
      makeDirectoQ('a1', 'A', 'A1', 0),
      makeDirectoQ('a2', 'A', 'A1', 1),
      makeDirectoQ('a3', 'A', 'A1', 2),
      makeDirectoQ('a4', 'A', 'A1', 3),
    ];
    const bQ = [
      makeDirectoQ('b1', 'B', 'B1', 0),
      makeDirectoQ('b2', 'B', 'B1', 1),
      makeDirectoQ('b3', 'B', 'B1', 2),
      makeDirectoQ('b4', 'B', 'B1', 3),
      makeDirectoQ('b5', 'B', 'B1', 0),
      makeDirectoQ('b6', 'B', 'B1', 1),
    ];
    const exam: SampledExam = { questions: [...aQ, ...bQ], bankWarnings: [] };

    const answers = new Map<string, Answer | null>([
      ['a1', { kind: 'choice', index: 0 }],
      ['a2', { kind: 'choice', index: 1 }],
      ['a3', { kind: 'choice', index: 0 }], // incorrecto (correcta=2)
      ['a4', null],
      ['b1', { kind: 'choice', index: 0 }],
      ['b2', { kind: 'choice', index: 1 }],
      ['b3', { kind: 'choice', index: 2 }],
      ['b4', { kind: 'choice', index: 3 }],
      ['b5', { kind: 'choice', index: 0 }],
      ['b6', { kind: 'choice', index: 0 }], // incorrecto (correcta=1)
    ]);

    const report = buildReport(exam, answers);
    expect(report.byArea.get('A')?.correct).toBe(2);
    expect(report.byArea.get('A')?.total).toBe(4);
    expect(report.byArea.get('B')?.correct).toBe(5);
    expect(report.byArea.get('B')?.total).toBe(6);
  });
});

// esc.06-C: reactivos con caso aplanados, cada uno vale 1 punto
describe('buildReport — esc.06-C: casos aplanados valen 1 punto cada uno', () => {
  it('3 reactivos de caso aplanados, 2 correctos → 2/3', () => {
    const q1 = makeDirectoQ('c1', 'A', 'A1', 0);
    const q2 = makeDirectoQ('c2', 'A', 'A1', 1);
    const q3 = makeDirectoQ('c3', 'A', 'A1', 2);
    const exam: SampledExam = { questions: [q1, q2, q3], bankWarnings: [] };

    const answers = new Map<string, Answer | null>([
      ['c1', { kind: 'choice', index: 0 }], // correcto
      ['c2', { kind: 'choice', index: 0 }], // incorrecto
      ['c3', { kind: 'choice', index: 2 }], // correcto
    ]);

    const report = buildReport(exam, answers);
    expect(report.globalScore.correct).toBe(2);
    expect(report.globalScore.total).toBe(3);
  });
});

describe('buildReport — bankWarnings propagados', () => {
  it('bankWarnings del exam se propagan al report', () => {
    const questions: ReactivoDirecto[] = [makeDirectoQ('q1', 'A', 'A1', 0)];
    const exam: SampledExam = {
      questions,
      bankWarnings: [{ subarea: 'A1', requested: 5, available: 1 }],
    };
    const answers = new Map<string, Answer | null>([['q1', { kind: 'choice', index: 0 }]]);
    const report = buildReport(exam, answers);
    expect(report.bankWarnings.length).toBe(1);
    expect(report.bankWarnings[0]?.subarea).toBe('A1');
  });
});
