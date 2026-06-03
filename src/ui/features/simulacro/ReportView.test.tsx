import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ReportView } from './ReportView';
import type { Attempt } from '../../../domain/attempt/attempt';
import type { AttemptReport } from '../../../domain/scoring/attempt-report';

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

function makeAttempt(report: AttemptReport): Attempt {
  return {
    id: 'attempt-test-001',
    blueprintSnapshot: { size: 20, distribution: new Map([['A1', 3]]) },
    examSnapshot: { questionIds: ['q1', 'q2', 'q3'] },
    answerMap: new Map(),
    report,
    startedAt: Date.now() - 60_000,
    finishedAt: Date.now(),
  };
}

const mockReport: AttemptReport = {
  globalScore: { correct: 7, total: 10 },
  byArea: new Map([
    ['A', { correct: 3, total: 4 }],
    ['B', { correct: 4, total: 6 }],
  ]),
  bySubarea: new Map([
    ['A1', { correct: 2, total: 3 }],
    ['B5', { correct: 4, total: 4 }],
  ]),
  bankWarnings: [],
};

const reportWithWarning: AttemptReport = {
  ...mockReport,
  bankWarnings: [{ subarea: 'A1', requested: 5, available: 2 }],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReportView', () => {
  it('muestra la puntuación global', () => {
    render(<ReportView attempt={makeAttempt(mockReport)} onReset={vi.fn()} />);
    // "7" aparece en el score global y en el StatCard de aciertos
    expect(screen.getAllByText('7').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('/10')).toBeInTheDocument();
    expect(screen.getByText('70.0% global')).toBeInTheDocument();
  });

  it('muestra los valores de área', () => {
    render(<ReportView attempt={makeAttempt(mockReport)} onReset={vi.fn()} />);
    // Los nombres de área aparecen en "Por área" y en la tira de fortaleza/refuerzo
    expect(screen.getAllByText('A. Administración').length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText('B. Contabilidad y finanzas').length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('muestra la sección bankWarnings cuando está presente', () => {
    render(
      <ReportView attempt={makeAttempt(reportWithWarning)} onReset={vi.fn()} />,
    );
    expect(
      screen.getByText('Aviso de banco insuficiente:'),
    ).toBeInTheDocument();
    // "Subárea" aparece tanto en el aviso como en el encabezado de la tabla
    expect(screen.getAllByText(/Subárea/).length).toBeGreaterThanOrEqual(1);
    // A1 aparece en el aviso Y en la tabla de subáreas
    expect(screen.getAllByText('A1').length).toBeGreaterThanOrEqual(1);
  });

  it('NO muestra la sección bankWarnings cuando está vacía', () => {
    render(<ReportView attempt={makeAttempt(mockReport)} onReset={vi.fn()} />);
    expect(
      screen.queryByText('Aviso de banco insuficiente:'),
    ).not.toBeInTheDocument();
  });

  it('llama onReset al hacer clic en "Volver al inicio"', async () => {
    const handler = vi.fn();
    render(<ReportView attempt={makeAttempt(mockReport)} onReset={handler} />);
    await userEvent.click(screen.getByRole('button', { name: 'Volver al inicio' }));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
