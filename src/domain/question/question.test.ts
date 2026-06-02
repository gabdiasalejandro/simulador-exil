import { describe, it, expect } from 'vitest';
import type {
  ReactivoDirecto,
  ReactivoCompletamiento,
  ReactivoOrdenamiento,
  ReactivoRelacion,
  Reactivo,
} from './question';
import { assertNever, getItemCount } from './question';

// ---------------------------------------------------------------------------
// Fixtures — modelo v2
// ---------------------------------------------------------------------------

const base = {
  id: 'q1',
  area: 'A' as const,
  subarea: 'A1' as const,
  explanation: 'Explicación de prueba',
};

const directo: ReactivoDirecto = {
  ...base,
  tipo: 'directo',
  enunciado: '¿Cuál es el proceso administrativo?',
  opciones: ['Planear', 'Organizar', 'Dirigir', 'Controlar'],
  correcta: 0,
};

const completamiento: ReactivoCompletamiento = {
  ...base,
  tipo: 'completamiento',
  enunciado: 'La ___ es la primera etapa del proceso.',
  opciones: ['planeación', 'organización', 'dirección', 'control'],
  correcta: 0,
};

const ordenamiento: ReactivoOrdenamiento = {
  ...base,
  tipo: 'ordenamiento',
  enunciado: 'Ordena las etapas del proceso',
  elementos: ['Controlar', 'Planear', 'Dirigir', 'Organizar'],
  ordenCorrecto: [1, 3, 2, 0],
};

const relacion: ReactivoRelacion = {
  ...base,
  tipo: 'relacion',
  enunciado: 'Relaciona conceptos',
  columnaIzquierda: ['Planear', 'Organizar'],
  columnaDerecha: ['Definir objetivos', 'Estructurar recursos', 'Opciones extra'],
  emparejamientos: [
    [0, 0],
    [1, 1],
  ],
};

const directoConCaso: ReactivoDirecto = {
  ...base,
  tipo: 'directo',
  caso: 'Contexto del caso compartido.',
  enunciado: 'Pregunta sobre el caso',
  opciones: ['A', 'B', 'C', 'D'],
  correcta: 0,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Reactivo — tipo discriminado (modelo v2)', () => {
  it('directo tiene tipo "directo"', () => {
    expect(directo.tipo).toBe('directo');
  });

  it('completamiento tiene tipo "completamiento"', () => {
    expect(completamiento.tipo).toBe('completamiento');
  });

  it('ordenamiento tiene tipo "ordenamiento"', () => {
    expect(ordenamiento.tipo).toBe('ordenamiento');
  });

  it('relacion tiene tipo "relacion"', () => {
    expect(relacion.tipo).toBe('relacion');
  });

  it('switch exhaustivo sobre todos los tipos — sin caer en assertNever', () => {
    const reactivos: Reactivo[] = [directo, completamiento, ordenamiento, relacion];
    for (const q of reactivos) {
      let handled = false;
      switch (q.tipo) {
        case 'directo':
          handled = true;
          break;
        case 'completamiento':
          handled = true;
          break;
        case 'ordenamiento':
          handled = true;
          break;
        case 'relacion':
          handled = true;
          break;
        default:
          assertNever(q);
      }
      expect(handled).toBe(true);
    }
  });

  it('getItemCount retorna 1 para todos los tipos (casos aplanados en modelo v2)', () => {
    expect(getItemCount(directo)).toBe(1);
    expect(getItemCount(completamiento)).toBe(1);
    expect(getItemCount(ordenamiento)).toBe(1);
    expect(getItemCount(relacion)).toBe(1);
  });

  it('reactivo con campo "caso" (aplanado) tiene getItemCount = 1', () => {
    expect(getItemCount(directoConCaso)).toBe(1);
  });

  it('campo "caso" es opcional', () => {
    expect(directo.caso).toBeUndefined();
    expect(directoConCaso.caso).toBe('Contexto del caso compartido.');
  });
});
