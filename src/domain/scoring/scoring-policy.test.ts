import { describe, it, expect } from 'vitest';
import { scoreQuestion, scoreCaseQuestion } from './scoring-policy';
import type { DirectQuestion, CaseQuestion } from '../question/question';
import type { Answer } from '../question/answer';

const base = {
  id: 'q',
  officialTag: { area: 'A' as const, subarea: 'A1' as const },
  originTag: { area: 'a', subarea: 'a' },
  explanation: 'e',
};

const direct: DirectQuestion = {
  ...base,
  itemType: 'direct',
  stem: 'Pregunta',
  options: ['A', 'B', 'C', 'D'],
  correctIndex: 2,
};

describe('scoreQuestion — leaf questions', () => {
  it('respuesta correcta → 1', () => {
    const ans: Answer = { kind: 'choice', index: 2 };
    expect(scoreQuestion(direct, ans)).toBe(1);
  });

  it('respuesta incorrecta → 0', () => {
    const ans: Answer = { kind: 'choice', index: 0 };
    expect(scoreQuestion(direct, ans)).toBe(0);
  });

  it('sin responder (null) → 0 (REQ-06.4)', () => {
    expect(scoreQuestion(direct, null)).toBe(0);
  });

  it('ordering correcto → 1', () => {
    const ordering = {
      ...base,
      itemType: 'ordering' as const,
      stem: 'Ordena',
      items: ['C', 'A', 'B'],
      correctOrder: [1, 2, 0],
    };
    const ans: Answer = { kind: 'order', sequence: [1, 2, 0] };
    expect(scoreQuestion(ordering, ans)).toBe(1);
  });

  it('ordering incorrecto → 0', () => {
    const ordering = {
      ...base,
      itemType: 'ordering' as const,
      stem: 'Ordena',
      items: ['C', 'A', 'B'],
      correctOrder: [1, 2, 0],
    };
    const ans: Answer = { kind: 'order', sequence: [0, 1, 2] };
    expect(scoreQuestion(ordering, ans)).toBe(0);
  });

  it('match correcto → 1', () => {
    const match = {
      ...base,
      itemType: 'match' as const,
      stem: 'Relaciona',
      leftColumn: ['A'],
      rightColumn: ['X', 'Y'],
      correctMatches: [[0, 1]] as [number, number][],
    };
    const ans: Answer = { kind: 'match', pairs: [[0, 1]] };
    expect(scoreQuestion(match, ans)).toBe(1);
  });

  it('match incorrecto → 0', () => {
    const match = {
      ...base,
      itemType: 'match' as const,
      stem: 'Relaciona',
      leftColumn: ['A'],
      rightColumn: ['X', 'Y'],
      correctMatches: [[0, 1]] as [number, number][],
    };
    const ans: Answer = { kind: 'match', pairs: [[0, 0]] };
    expect(scoreQuestion(match, ans)).toBe(0);
  });
});

describe('scoreCaseQuestion', () => {
  const caseQ: CaseQuestion = {
    ...base,
    itemType: 'case',
    caseStem: 'Caso',
    subQuestions: [
      { itemType: 'direct', stem: 'P1', options: ['A', 'B', 'C', 'D'], correctIndex: 0 },
      { itemType: 'direct', stem: 'P2', options: ['A', 'B', 'C', 'D'], correctIndex: 1 },
      { itemType: 'direct', stem: 'P3', options: ['A', 'B', 'C', 'D'], correctIndex: 2 },
    ],
  };

  // esc.06-C: 3 sub-preguntas, 2 correctas → 2 puntos
  it('esc.06-C — caso con 3 sub-preguntas y 2 correctas → 2', () => {
    const answers: Array<Answer | null> = [
      { kind: 'choice', index: 0 }, // correcta
      { kind: 'choice', index: 0 }, // incorrecta (correctIndex=1)
      { kind: 'choice', index: 2 }, // correcta
    ];
    expect(scoreCaseQuestion(caseQ, answers)).toBe(2);
  });

  it('caso con todas correctas → N', () => {
    const answers: Array<Answer | null> = [
      { kind: 'choice', index: 0 },
      { kind: 'choice', index: 1 },
      { kind: 'choice', index: 2 },
    ];
    expect(scoreCaseQuestion(caseQ, answers)).toBe(3);
  });

  it('caso sin responder ninguna → 0', () => {
    const answers: Array<Answer | null> = [null, null, null];
    expect(scoreCaseQuestion(caseQ, answers)).toBe(0);
  });
});
