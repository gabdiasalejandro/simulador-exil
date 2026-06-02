import { describe, it, expect } from 'vitest';
import { validateQuestion } from './validation';

describe('validateQuestion — modelo v2 (YAML)', () => {
  const validDirecto = {
    id: 'q1',
    tipo: 'directo',
    area: 'A',
    subarea: 'A1',
    explanation: 'Explicación',
    enunciado: '¿Pregunta?',
    opciones: ['A', 'B', 'C', 'D'],
    correcta: 0,
  };

  // --- Happy paths ---

  it('acepta ReactivoDirecto válido (modelo v2)', () => {
    expect(validateQuestion(validDirecto).ok).toBe(true);
  });

  it('acepta ReactivoCompletamiento válido', () => {
    const q = { ...validDirecto, tipo: 'completamiento' };
    expect(validateQuestion(q).ok).toBe(true);
  });

  it('acepta ReactivoOrdenamiento válido', () => {
    const q = {
      id: 'q2',
      tipo: 'ordenamiento',
      area: 'A',
      subarea: 'A1',
      explanation: 'Exp',
      enunciado: 'Ordena',
      elementos: ['C', 'A', 'B'],
      ordenCorrecto: [1, 2, 0],
    };
    expect(validateQuestion(q).ok).toBe(true);
  });

  it('acepta ReactivoRelacion válido', () => {
    const q = {
      id: 'q3',
      tipo: 'relacion',
      area: 'B',
      subarea: 'B1',
      explanation: 'Exp',
      enunciado: 'Relaciona',
      columnaIzquierda: ['A'],
      columnaDerecha: ['X', 'Y'],
      emparejamientos: [[0, 0]],
    };
    expect(validateQuestion(q).ok).toBe(true);
  });

  it('acepta reactivo con campo "caso" (aplanado)', () => {
    const q = { ...validDirecto, caso: 'Texto del caso compartido.' };
    const result = validateQuestion(q);
    expect(result.ok).toBe(true);
  });

  // --- Errores por área/subárea ---

  it('rechaza con MISSING_OFFICIAL_TAG si área no es oficial', () => {
    const q = { ...validDirecto, area: 'Z' };
    const result = validateQuestion(q);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('MISSING_OFFICIAL_TAG');
  });

  it('rechaza con MISSING_OFFICIAL_TAG si subárea no es oficial', () => {
    const q = { ...validDirecto, subarea: 'X9' };
    const result = validateQuestion(q);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('MISSING_OFFICIAL_TAG');
  });

  // --- Errores por opciones ---

  it('rechaza con INVALID_OPTIONS_COUNT si opciones tiene menos de 4', () => {
    const q = { ...validDirecto, opciones: ['A', 'B', 'C'] };
    const result = validateQuestion(q);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INVALID_OPTIONS_COUNT');
  });

  it('rechaza con INVALID_OPTIONS_COUNT si opciones tiene más de 4', () => {
    const q = { ...validDirecto, opciones: ['A', 'B', 'C', 'D', 'E'] };
    const result = validateQuestion(q);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INVALID_OPTIONS_COUNT');
  });

  it('rechaza con INVALID_OPTIONS_COUNT si una opción es string vacío', () => {
    const q = { ...validDirecto, opciones: ['A', '', 'C', 'D'] };
    const result = validateQuestion(q);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INVALID_OPTIONS_COUNT');
  });

  // --- Tipo desconocido ---

  it('rechaza con INVALID_ITEM_TYPE si tipo es desconocido', () => {
    const q = { ...validDirecto, tipo: 'caso_anidado' };
    const result = validateQuestion(q);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('INVALID_ITEM_TYPE');
  });

  // --- Compatibilidad v1 (JSON legacy) ---

  it('acepta formato v1 (itemType/officialTag) y lo normaliza a v2', () => {
    const v1 = {
      id: 'v1-001',
      itemType: 'direct',
      officialTag: { area: 'A', subarea: 'A1' },
      originTag: { area: 'Admin', subarea: 'General' },
      explanation: 'Exp',
      stem: '¿Pregunta?',
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 0,
    };
    const result = validateQuestion(v1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tipo).toBe('directo');
      expect(result.value.area).toBe('A');
    }
  });
});

describe('validateQuestion — compatibilidad v1 completa', () => {
  it('normaliza itemType "match" → tipo "relacion"', () => {
    const v1 = {
      id: 'v1-match',
      itemType: 'match',
      officialTag: { area: 'D', subarea: 'D1' },
      originTag: { area: 'x', subarea: 'y' },
      explanation: 'Exp',
      stem: 'Relaciona',
      leftColumn: ['A'],
      rightColumn: ['X'],
      correctMatches: [[0, 0]],
    };
    const result = validateQuestion(v1);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.tipo).toBe('relacion');
  });

  it('normaliza itemType "ordering" → tipo "ordenamiento"', () => {
    const v1 = {
      id: 'v1-ord',
      itemType: 'ordering',
      officialTag: { area: 'A', subarea: 'A4' },
      originTag: { area: 'x', subarea: 'y' },
      explanation: 'Exp',
      stem: 'Ordena',
      items: ['A', 'B'],
      correctOrder: [0, 1],
    };
    const result = validateQuestion(v1);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.tipo).toBe('ordenamiento');
  });
});
