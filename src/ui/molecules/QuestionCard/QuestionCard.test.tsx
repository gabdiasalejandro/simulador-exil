import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import type {
  DirectQuestion,
  OrderingQuestion,
  ColumnMatchQuestion,
  CaseQuestion,
} from '../../../domain/question/question';
import type { Answer } from '../../../domain/question/answer';
import { QuestionCard } from './QuestionCard';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const directQ: DirectQuestion = {
  id: 'q1',
  itemType: 'direct',
  stem: '¿Cuál es la función de planeación?',
  options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
  correctIndex: 1,
  explanation: 'exp',
  officialTag: { area: 'A', subarea: 'A1' },
  originTag: { area: 'Admin', subarea: 'Proceso' },
};

const orderingQ: OrderingQuestion = {
  id: 'q3',
  itemType: 'ordering',
  stem: 'Ordena los pasos:',
  items: ['Paso 1', 'Paso 2', 'Paso 3'],
  correctOrder: [0, 1, 2],
  explanation: 'exp',
  officialTag: { area: 'A', subarea: 'A4' },
  originTag: { area: 'Admin', subarea: 'Entorno' },
};

const matchQ: ColumnMatchQuestion = {
  id: 'q4',
  itemType: 'match',
  stem: 'Relaciona cada concepto:',
  leftColumn: ['Concepto A', 'Concepto B'],
  rightColumn: ['Def 1', 'Def 2', 'Def 3'],
  correctMatches: [[0, 0], [1, 1]],
  explanation: 'exp',
  officialTag: { area: 'D', subarea: 'D1' },
  originTag: { area: 'Mercadotecnia', subarea: 'Mercado' },
};

const caseQ: CaseQuestion = {
  id: 'q5',
  itemType: 'case',
  caseStem: 'Texto del caso de estudio.',
  subQuestions: [
    {
      itemType: 'direct',
      stem: 'Sub-pregunta 1',
      options: ['SA', 'SB', 'SC', 'SD'],
      correctIndex: 0,
      explanation: 'sub-exp',
    },
    {
      itemType: 'direct',
      stem: 'Sub-pregunta 2',
      options: ['SA', 'SB', 'SC', 'SD'],
      correctIndex: 1,
      explanation: 'sub-exp',
    },
  ],
  explanation: 'exp',
  officialTag: { area: 'E', subarea: 'E1' },
  originTag: { area: 'Mat', subarea: 'Fin' },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('QuestionCard — T1 (direct)', () => {
  it('renderiza el stem y las 4 opciones', () => {
    render(
      <QuestionCard
        question={directQ}
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

  it('llama onChange con ChoiceAnswer al seleccionar una opción', async () => {
    const handler = vi.fn();
    render(
      <QuestionCard
        question={directQ}
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

describe('QuestionCard — T3 (ordering)', () => {
  it('renderiza los ítems para ordenar', () => {
    render(
      <QuestionCard
        question={orderingQ}
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

describe('QuestionCard — T4 (match)', () => {
  it('renderiza las columnas de relación', () => {
    render(
      <QuestionCard
        question={matchQ}
        answer={null}
        onChange={vi.fn()}
        index={3}
        total={20}
      />,
    );
    // Los conceptos de la columna izquierda se muestran como "1. Concepto A"
    expect(screen.getByText(/Concepto A/)).toBeInTheDocument();
    expect(screen.getByText(/Concepto B/)).toBeInTheDocument();
    // Las definiciones se muestran como botones en ambas filas
    expect(screen.getAllByText(/Def 1/).length).toBeGreaterThan(0);
  });
});

describe('QuestionCard — T5 (case)', () => {
  it('renderiza el caseStem y las sub-preguntas', () => {
    render(
      <QuestionCard
        question={caseQ}
        answer={null}
        onChange={vi.fn()}
        index={4}
        total={20}
      />,
    );
    expect(screen.getByText('Texto del caso de estudio.')).toBeInTheDocument();
    // Hay dos elementos con texto "Sub-pregunta 1": el label del contenedor
    // y el stem de la sub-pregunta. Verificamos que al menos uno esté presente.
    expect(screen.getAllByText('Sub-pregunta 1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Sub-pregunta 2').length).toBeGreaterThanOrEqual(1);
  });

  it('llama onChange con CaseAnswer al responder una sub-pregunta', async () => {
    const handler = vi.fn();
    render(
      <QuestionCard
        question={caseQ}
        answer={null}
        onChange={handler}
        index={4}
        total={20}
      />,
    );
    // Ambas sub-preguntas tienen "SA" como primera opción
    const saButtons = screen.getAllByText(/^SA$/);
    await userEvent.click(saButtons[0]!);
    expect(handler).toHaveBeenCalledWith<[Answer]>({
      kind: 'case',
      answers: [{ kind: 'choice', index: 0 }, null],
    });
  });
});
