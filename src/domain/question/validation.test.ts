import { describe, it, expect } from 'vitest';
import { validateQuestion } from './validation';

describe('validateQuestion', () => {
  const validDirect = {
    id: 'q1',
    itemType: 'direct',
    officialTag: { area: 'A', subarea: 'A1' },
    originTag: { area: 'Admin', subarea: 'General' },
    explanation: 'Explicación',
    stem: '¿Pregunta?',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
  };

  // esc.01-A: falta officialTag
  it('esc.01-A — rechaza con MISSING_OFFICIAL_TAG si falta officialTag', () => {
    const q = { ...validDirect };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (q as any).officialTag;
    const result = validateQuestion(q);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('MISSING_OFFICIAL_TAG');
    }
  });

  // esc.01-A: officialTag con área inválida
  it('esc.01-A — rechaza con MISSING_OFFICIAL_TAG si área no es oficial', () => {
    const q = { ...validDirect, officialTag: { area: 'Z', subarea: 'A1' } };
    const result = validateQuestion(q);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('MISSING_OFFICIAL_TAG');
    }
  });

  // esc.01-A: officialTag con subárea inválida
  it('esc.01-A — rechaza con MISSING_OFFICIAL_TAG si subárea no es oficial', () => {
    const q = { ...validDirect, officialTag: { area: 'A', subarea: 'X9' } };
    const result = validateQuestion(q);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('MISSING_OFFICIAL_TAG');
    }
  });

  // esc.01-B: opciones incompletas (3 en lugar de 4)
  it('esc.01-B — rechaza con INVALID_OPTIONS_COUNT si options tiene menos de 4', () => {
    const q = { ...validDirect, options: ['A', 'B', 'C'] };
    const result = validateQuestion(q);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_OPTIONS_COUNT');
    }
  });

  it('esc.01-B — rechaza con INVALID_OPTIONS_COUNT si options tiene más de 4', () => {
    const q = { ...validDirect, options: ['A', 'B', 'C', 'D', 'E'] };
    const result = validateQuestion(q);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_OPTIONS_COUNT');
    }
  });

  it('esc.01-B — rechaza con INVALID_OPTIONS_COUNT si una opción es string vacío', () => {
    const q = { ...validDirect, options: ['A', '', 'C', 'D'] };
    const result = validateQuestion(q);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_OPTIONS_COUNT');
    }
  });

  // esc.01-C: CaseQuestion válido
  it('esc.01-C — acepta CaseQuestion con 2 sub-preguntas válidas', () => {
    const q = {
      id: 'c1',
      itemType: 'case',
      officialTag: { area: 'A', subarea: 'A1' },
      originTag: { area: 'Admin', subarea: 'General' },
      explanation: 'Caso válido',
      caseStem: 'Texto del caso',
      subQuestions: [
        {
          itemType: 'direct',
          stem: 'Pregunta 1',
          options: ['A', 'B', 'C', 'D'],
          correctIndex: 0,
        },
        {
          itemType: 'direct',
          stem: 'Pregunta 2',
          options: ['A', 'B', 'C', 'D'],
          correctIndex: 1,
        },
      ],
    };
    const result = validateQuestion(q);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.itemType).toBe('case');
    }
  });

  // Happy paths — todos los tipos leaf
  it('acepta DirectQuestion válido', () => {
    expect(validateQuestion(validDirect).ok).toBe(true);
  });

  it('acepta CompletionQuestion válido', () => {
    const q = { ...validDirect, itemType: 'completion' };
    expect(validateQuestion(q).ok).toBe(true);
  });

  it('acepta OrderingQuestion válido', () => {
    const q = {
      id: 'q2',
      itemType: 'ordering',
      officialTag: { area: 'A', subarea: 'A1' },
      originTag: { area: 'Admin', subarea: 'General' },
      explanation: 'Exp',
      stem: 'Ordena',
      items: ['C', 'A', 'B'],
      correctOrder: [1, 2, 0],
    };
    expect(validateQuestion(q).ok).toBe(true);
  });

  it('acepta ColumnMatchQuestion válido', () => {
    const q = {
      id: 'q3',
      itemType: 'match',
      officialTag: { area: 'B', subarea: 'B1' },
      originTag: { area: 'Conta', subarea: 'Info' },
      explanation: 'Exp',
      stem: 'Relaciona',
      leftColumn: ['A'],
      rightColumn: ['X', 'Y'],
      correctMatches: [[0, 0]],
    };
    expect(validateQuestion(q).ok).toBe(true);
  });
});
