import { describe, it, expect } from 'vitest';
import type {
  DirectQuestion,
  CompletionQuestion,
  OrderingQuestion,
  ColumnMatchQuestion,
  CaseQuestion,
  Question,
} from './question';
import { assertNever, getItemCount } from './question';

const baseFields = {
  id: 'q1',
  officialTag: { area: 'A' as const, subarea: 'A1' as const },
  originTag: { area: 'Administración', subarea: 'Conceptos generales' },
  explanation: 'Explicación de prueba',
};

const direct: DirectQuestion = {
  ...baseFields,
  itemType: 'direct',
  stem: '¿Cuál es el proceso administrativo?',
  options: ['Planear', 'Organizar', 'Dirigir', 'Controlar'],
  correctIndex: 0,
};

const completion: CompletionQuestion = {
  ...baseFields,
  itemType: 'completion',
  stem: 'La ___ es la primera etapa del proceso.',
  options: ['planeación', 'organización', 'dirección', 'control'],
  correctIndex: 0,
};

const ordering: OrderingQuestion = {
  ...baseFields,
  itemType: 'ordering',
  stem: 'Ordena las etapas del proceso',
  items: ['Controlar', 'Planear', 'Dirigir', 'Organizar'],
  correctOrder: [1, 3, 2, 0],
};

const match: ColumnMatchQuestion = {
  ...baseFields,
  itemType: 'match',
  stem: 'Relaciona conceptos',
  leftColumn: ['Planear', 'Organizar'],
  rightColumn: ['Definir objetivos', 'Estructurar recursos', 'Opciones extra'],
  correctMatches: [
    [0, 0],
    [1, 1],
  ],
};

const caseQ: CaseQuestion = {
  ...baseFields,
  itemType: 'case',
  caseStem: 'Caso de estudio sobre empresa XYZ',
  subQuestions: [
    {
      itemType: 'direct',
      stem: '¿Qué falló?',
      options: ['Planeación', 'Ejecución', 'Control', 'Todo'],
      correctIndex: 2,
    },
    {
      itemType: 'completion',
      stem: 'El fallo se debió a falta de ___',
      options: ['control', 'recursos', 'personal', 'tiempo'],
      correctIndex: 0,
    },
  ],
};

describe('Question — tipo discriminado', () => {
  it('direct tiene itemType "direct"', () => {
    expect(direct.itemType).toBe('direct');
  });

  it('completion tiene itemType "completion"', () => {
    expect(completion.itemType).toBe('completion');
  });

  it('ordering tiene itemType "ordering"', () => {
    expect(ordering.itemType).toBe('ordering');
  });

  it('match tiene itemType "match"', () => {
    expect(match.itemType).toBe('match');
  });

  it('case tiene itemType "case"', () => {
    expect(caseQ.itemType).toBe('case');
  });

  it('switch exhaustivo sobre todos los tipos — sin caer en assertNever', () => {
    const questions: Question[] = [direct, completion, ordering, match, caseQ];
    for (const q of questions) {
      let handled = false;
      switch (q.itemType) {
        case 'direct':
          handled = true;
          break;
        case 'completion':
          handled = true;
          break;
        case 'ordering':
          handled = true;
          break;
        case 'match':
          handled = true;
          break;
        case 'case':
          handled = true;
          break;
        default:
          assertNever(q);
      }
      expect(handled).toBe(true);
    }
  });

  it('getItemCount retorna 1 para leaf questions', () => {
    expect(getItemCount(direct)).toBe(1);
    expect(getItemCount(completion)).toBe(1);
    expect(getItemCount(ordering)).toBe(1);
    expect(getItemCount(match)).toBe(1);
  });

  it('getItemCount retorna N para CaseQuestion (cantidad de sub-preguntas)', () => {
    expect(getItemCount(caseQ)).toBe(2);
  });

  it('CaseQuestion con 2 sub-preguntas contribuye 2 al conteo (REQ-01 esc.01-C)', () => {
    const count = caseQ.subQuestions.length;
    expect(count).toBe(2);
    expect(getItemCount(caseQ)).toBe(count);
  });
});
