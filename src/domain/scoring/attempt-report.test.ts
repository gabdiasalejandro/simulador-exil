import { describe, it, expect } from 'vitest';
import { buildReport } from './attempt-report';
import type { SampledExam } from '../exam/sampling';
import type { DirectQuestion, CaseQuestion } from '../question/question';
import type { Answer } from '../question/answer';

function makeDirectQ(id: string, area: 'A' | 'B', subarea: 'A1' | 'B1', correctIndex: 0 | 1 | 2 | 3): DirectQuestion {
  return {
    id,
    itemType: 'direct',
    officialTag: { area, subarea },
    originTag: { area: 'o', subarea: 'o' },
    explanation: 'e',
    stem: 's',
    options: ['A', 'B', 'C', 'D'],
    correctIndex,
  };
}

// esc.06-A: 10 reactivos, 7 correctos, 3 sin responder → global 7/10
describe('buildReport — esc.06-A: global 7/10', () => {
  it('score global correcto = 7 / total = 10', () => {
    const questions: DirectQuestion[] = Array.from({ length: 10 }, (_, i) =>
      makeDirectQ(`q${i}`, 'A', 'A1', 0),
    );
    const exam: SampledExam = { questions, bankWarnings: [] };

    const answers = new Map<string, Answer | null>();
    // 7 respondidos correctamente
    for (let i = 0; i < 7; i++) answers.set(`q${i}`, { kind: 'choice', index: 0 });
    // 3 sin responder
    for (let i = 7; i < 10; i++) answers.set(`q${i}`, null);

    const report = buildReport(exam, answers);
    expect(report.globalScore.correct).toBe(7);
    expect(report.globalScore.total).toBe(10);
  });
});

// esc.06-B: área A tiene 4 reactivos (2 correctos, 1 incorrecto, 1 sin responder)
//           área B tiene 6 reactivos (5 correctos, 1 incorrecto)
describe('buildReport — esc.06-B: score por área', () => {
  it('área A = 2/4, área B = 5/6', () => {
    const aQ = [
      makeDirectQ('a1', 'A', 'A1', 0), // correcto
      makeDirectQ('a2', 'A', 'A1', 1), // correcto
      makeDirectQ('a3', 'A', 'A1', 2), // incorrecto
      makeDirectQ('a4', 'A', 'A1', 3), // sin responder
    ];
    const bQ = [
      makeDirectQ('b1', 'B', 'B1', 0), // correcto
      makeDirectQ('b2', 'B', 'B1', 1), // correcto
      makeDirectQ('b3', 'B', 'B1', 2), // correcto
      makeDirectQ('b4', 'B', 'B1', 3), // correcto
      makeDirectQ('b5', 'B', 'B1', 0), // correcto
      makeDirectQ('b6', 'B', 'B1', 1), // incorrecto
    ];
    const exam: SampledExam = { questions: [...aQ, ...bQ], bankWarnings: [] };

    const answers = new Map<string, Answer | null>([
      ['a1', { kind: 'choice', index: 0 }],
      ['a2', { kind: 'choice', index: 1 }],
      ['a3', { kind: 'choice', index: 0 }], // incorrecto (correctIndex=2)
      ['a4', null],
      ['b1', { kind: 'choice', index: 0 }],
      ['b2', { kind: 'choice', index: 1 }],
      ['b3', { kind: 'choice', index: 2 }],
      ['b4', { kind: 'choice', index: 3 }],
      ['b5', { kind: 'choice', index: 0 }],
      ['b6', { kind: 'choice', index: 0 }], // incorrecto (correctIndex=1)
    ]);

    const report = buildReport(exam, answers);
    const aScore = report.byArea.get('A');
    const bScore = report.byArea.get('B');
    expect(aScore?.correct).toBe(2);
    expect(aScore?.total).toBe(4);
    expect(bScore?.correct).toBe(5);
    expect(bScore?.total).toBe(6);
  });
});

// esc.06-C: CaseQuestion con 3 sub-preguntas, 2 correctas → 2 puntos / 3 denominador
describe('buildReport — esc.06-C: caso N puntos', () => {
  it('caso con 3 sub-preguntas y 2 correctas contribuye 2/3', () => {
    const caseQ: CaseQuestion = {
      id: 'c1',
      itemType: 'case',
      officialTag: { area: 'A', subarea: 'A1' },
      originTag: { area: 'o', subarea: 'o' },
      explanation: 'e',
      caseStem: 'Caso',
      subQuestions: [
        { itemType: 'direct', stem: 'P1', options: ['A', 'B', 'C', 'D'], correctIndex: 0 },
        { itemType: 'direct', stem: 'P2', options: ['A', 'B', 'C', 'D'], correctIndex: 1 },
        { itemType: 'direct', stem: 'P3', options: ['A', 'B', 'C', 'D'], correctIndex: 2 },
      ],
    };
    const exam: SampledExam = { questions: [caseQ], bankWarnings: [] };
    const caseAnswer: Answer = {
      kind: 'case',
      answers: [
        { kind: 'choice', index: 0 }, // correcta
        { kind: 'choice', index: 0 }, // incorrecta
        { kind: 'choice', index: 2 }, // correcta
      ],
    };
    const answers = new Map<string, Answer | null>([['c1', caseAnswer]]);

    const report = buildReport(exam, answers);
    expect(report.globalScore.correct).toBe(2);
    expect(report.globalScore.total).toBe(3);
    const aScore = report.byArea.get('A');
    expect(aScore?.correct).toBe(2);
    expect(aScore?.total).toBe(3);
  });
});

describe('buildReport — bankWarnings propagados', () => {
  it('bankWarnings del exam se propagan al report', () => {
    const questions: DirectQuestion[] = [makeDirectQ('q1', 'A', 'A1', 0)];
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
