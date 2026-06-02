import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import type {
  ReactivoDirecto,
  ReactivoOrdenamiento,
  ReactivoRelacion,
} from '../../../domain/question/question';
import type { Answer } from '../../../domain/question/answer';
import { QuestionCard } from './QuestionCard';

// ---------------------------------------------------------------------------
// Fixtures — modelo v2
// ---------------------------------------------------------------------------

const base = {
  id: 'q1',
  area: 'A' as const,
  subarea: 'A1' as const,
  explanation: 'exp',
};

const directoQ: ReactivoDirecto = {
  ...base,
  tipo: 'directo',
  enunciado: '¿Cuál es la función de planeación?',
  opciones: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
  correcta: 1,
};

const ordenamientoQ: ReactivoOrdenamiento = {
  ...base,
  id: 'q3',
  area: 'A',
  subarea: 'A4',
  tipo: 'ordenamiento',
  enunciado: 'Ordena los pasos:',
  elementos: ['Paso 1', 'Paso 2', 'Paso 3'],
  ordenCorrecto: [0, 1, 2],
};

const relacionQ: ReactivoRelacion = {
  ...base,
  id: 'q4',
  area: 'D',
  subarea: 'D1',
  tipo: 'relacion',
  enunciado: 'Relaciona cada concepto:',
  columnaIzquierda: ['Concepto A', 'Concepto B'],
  columnaDerecha: ['Def 1', 'Def 2', 'Def 3'],
  emparejamientos: [[0, 0], [1, 1]],
};

const casoQ: ReactivoDirecto = {
  ...base,
  id: 'q5',
  area: 'E',
  subarea: 'E1',
  tipo: 'directo',
  caso: 'Texto del caso de estudio compartido.',
  enunciado: 'Pregunta derivada del caso',
  opciones: ['SA', 'SB', 'SC', 'SD'],
  correcta: 0,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('QuestionCard — T1 (directo)', () => {
  it('renderiza el enunciado y las 4 opciones', () => {
    render(
      <QuestionCard
        question={directoQ}
        answer={null}
        onChange={vi.fn()}
        index={1}
        total={20}
      />,
    );
    expect(screen.getByText('¿Cuál es la función de planeación?')).toBeInTheDocument();
    expect(screen.getByText(/Opción A/)).toBeInTheDocument();
    expect(screen.getByText(/Opción D/)).toBeInTheDocument();
  });

  it('muestra el nombre del área, no el código', () => {
    render(
      <QuestionCard
        question={directoQ}
        answer={null}
        onChange={vi.fn()}
        index={1}
        total={20}
      />,
    );
    expect(screen.getByText('Administración')).toBeInTheDocument();
    expect(screen.queryByText('A1')).not.toBeInTheDocument();
  });

  it('llama onChange con ChoiceAnswer al seleccionar una opción', async () => {
    const handler = vi.fn();
    render(
      <QuestionCard
        question={directoQ}
        answer={null}
        onChange={handler}
        index={1}
        total={20}
      />,
    );
    await userEvent.click(screen.getByText(/Opción B/));
    expect(handler).toHaveBeenCalledWith<[Answer]>({
      kind: 'choice',
      index: 1,
    });
  });
});

describe('QuestionCard — T3 (ordenamiento)', () => {
  it('renderiza los elementos para ordenar', () => {
    render(
      <QuestionCard
        question={ordenamientoQ}
        answer={null}
        onChange={vi.fn()}
        index={2}
        total={20}
      />,
    );
    expect(screen.getByText('Paso 1')).toBeInTheDocument();
    expect(screen.getByText('Paso 2')).toBeInTheDocument();
    expect(screen.getByText('Paso 3')).toBeInTheDocument();
  });
});

describe('QuestionCard — T4 (relacion)', () => {
  it('renderiza los conceptos izquierdos y los dropdowns', () => {
    render(
      <QuestionCard
        question={relacionQ}
        answer={null}
        onChange={vi.fn()}
        index={3}
        total={20}
      />,
    );
    expect(screen.getByText(/Concepto A/)).toBeInTheDocument();
    expect(screen.getByText(/Concepto B/)).toBeInTheDocument();
    // Debe haber un <select> por cada concepto izquierdo
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBe(2);
  });

  it('las opciones del dropdown incluyen a., b., c.', () => {
    render(
      <QuestionCard
        question={relacionQ}
        answer={null}
        onChange={vi.fn()}
        index={3}
        total={20}
      />,
    );
    // El primer select debe tener las 3 opciones (Def 1, Def 2, Def 3)
    const options = screen.getAllByRole('option');
    // 2 selects × (1 opción vacía + 3 opciones) = 8 opciones totales
    expect(options.length).toBe(8);
  });

  it('llama onChange con MatchAnswer al seleccionar opción en dropdown', async () => {
    const handler = vi.fn();
    render(
      <QuestionCard
        question={relacionQ}
        answer={null}
        onChange={handler}
        index={3}
        total={20}
      />,
    );
    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(selects[0]!, '0');
    expect(handler).toHaveBeenCalledWith<[Answer]>({
      kind: 'match',
      pairs: [[0, 0]],
    });
  });
});

describe('QuestionCard — reactivo con caso', () => {
  it('muestra el bloque de contexto del caso arriba del enunciado', () => {
    render(
      <QuestionCard
        question={casoQ}
        answer={null}
        onChange={vi.fn()}
        index={4}
        total={20}
      />,
    );
    expect(screen.getByText('Contexto del caso')).toBeInTheDocument();
    expect(screen.getByText('Texto del caso de estudio compartido.')).toBeInTheDocument();
    expect(screen.getByText('Pregunta derivada del caso')).toBeInTheDocument();
  });

  it('no muestra el bloque de caso cuando el reactivo no tiene caso', () => {
    render(
      <QuestionCard
        question={directoQ}
        answer={null}
        onChange={vi.fn()}
        index={1}
        total={20}
      />,
    );
    expect(screen.queryByText('Contexto del caso')).not.toBeInTheDocument();
  });
});
