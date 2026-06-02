import { describe, it, expect } from 'vitest';
import { scoreQuestion } from './scoring-policy';
import type { ReactivoDirecto } from '../question/question';
import type { Answer } from '../question/answer';

// ---------------------------------------------------------------------------
// Fixtures — modelo v2
// ---------------------------------------------------------------------------

const base = {
  id: 'q',
  area: 'A' as const,
  subarea: 'A1' as const,
  explanation: 'e',
};

const directo: ReactivoDirecto = {
  ...base,
  tipo: 'directo',
  enunciado: 'Pregunta',
  opciones: ['A', 'B', 'C', 'D'],
  correcta: 2,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('scoreQuestion — modelo v2 (tipos planos)', () => {
  it('respuesta correcta → 1', () => {
    const ans: Answer = { kind: 'choice', index: 2 };
    expect(scoreQuestion(directo, ans)).toBe(1);
  });

  it('respuesta incorrecta → 0', () => {
    const ans: Answer = { kind: 'choice', index: 0 };
    expect(scoreQuestion(directo, ans)).toBe(0);
  });

  it('sin responder (null) → 0 (REQ-06.4)', () => {
    expect(scoreQuestion(directo, null)).toBe(0);
  });

  it('completamiento correcto → 1', () => {
    const q = {
      ...base,
      tipo: 'completamiento' as const,
      enunciado: 'Completa',
      opciones: ['a', 'b', 'c', 'd'] as [string, string, string, string],
      correcta: 1 as const,
    };
    const ans: Answer = { kind: 'choice', index: 1 };
    expect(scoreQuestion(q, ans)).toBe(1);
  });

  it('ordenamiento correcto → 1', () => {
    const ordenamiento = {
      ...base,
      tipo: 'ordenamiento' as const,
      enunciado: 'Ordena',
      elementos: ['C', 'A', 'B'],
      ordenCorrecto: [1, 2, 0],
    };
    const ans: Answer = { kind: 'order', sequence: [1, 2, 0] };
    expect(scoreQuestion(ordenamiento, ans)).toBe(1);
  });

  it('ordenamiento incorrecto → 0', () => {
    const ordenamiento = {
      ...base,
      tipo: 'ordenamiento' as const,
      enunciado: 'Ordena',
      elementos: ['C', 'A', 'B'],
      ordenCorrecto: [1, 2, 0],
    };
    const ans: Answer = { kind: 'order', sequence: [0, 1, 2] };
    expect(scoreQuestion(ordenamiento, ans)).toBe(0);
  });

  it('relacion correcto → 1', () => {
    const relacion = {
      ...base,
      tipo: 'relacion' as const,
      enunciado: 'Relaciona',
      columnaIzquierda: ['A'],
      columnaDerecha: ['X', 'Y'],
      emparejamientos: [[0, 1]] as [number, number][],
    };
    const ans: Answer = { kind: 'match', pairs: [[0, 1]] };
    expect(scoreQuestion(relacion, ans)).toBe(1);
  });

  it('relacion incorrecto → 0', () => {
    const relacion = {
      ...base,
      tipo: 'relacion' as const,
      enunciado: 'Relaciona',
      columnaIzquierda: ['A'],
      columnaDerecha: ['X', 'Y'],
      emparejamientos: [[0, 1]] as [number, number][],
    };
    const ans: Answer = { kind: 'match', pairs: [[0, 0]] };
    expect(scoreQuestion(relacion, ans)).toBe(0);
  });

  it('reactivo con caso (aplanado) se califica igual que directo → 1', () => {
    const directoConCaso = {
      ...base,
      tipo: 'directo' as const,
      caso: 'Contexto del caso.',
      enunciado: 'Pregunta',
      opciones: ['A', 'B', 'C', 'D'] as [string, string, string, string],
      correcta: 0 as const,
    };
    const ans: Answer = { kind: 'choice', index: 0 };
    expect(scoreQuestion(directoConCaso, ans)).toBe(1);
  });
});
