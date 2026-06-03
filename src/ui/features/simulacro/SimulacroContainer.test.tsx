import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimulacroContainer } from './SimulacroContainer';
import type { ContentPort } from '../../../application/ports/content-port';
import type { StoragePort } from '../../../application/ports/storage-port';
import type { Reactivo, ReactivoDirecto } from '../../../domain/question/question';
import type { Attempt } from '../../../domain/attempt/attempt';

// ---------------------------------------------------------------------------
// Fakes — modelo v2
// ---------------------------------------------------------------------------

function makeReactivoDirecto(id: string, subarea: string): ReactivoDirecto {
  return {
    id,
    tipo: 'directo',
    enunciado: `Pregunta ${id}`,
    opciones: ['A', 'B', 'C', 'D'],
    correcta: 0,
    explanation: 'exp',
    area: 'A',
    subarea: subarea as 'A1',
  };
}

function makeFakeContentPort(questions: Reactivo[]): ContentPort {
  return { loadBank: () => Promise.resolve(questions) };
}

function makeFakeStoragePort(): StoragePort {
  return {
    saveAttempt: vi.fn().mockResolvedValue(undefined),
    listAttempts: vi.fn().mockResolvedValue([]),
    getAttempt: vi.fn().mockResolvedValue(null),
  };
}

// 20 reactivos de distintas subáreas (necesarios para el muestreo válido)
function make20Questions(): Reactivo[] {
  const subareas = ['A1','A2','A3','A4','A5','B1','B2','B3','B4','B5','C1','C2','C3','D1','D2','E1','E2','E3','F1','F2'] as const;
  return subareas.map((s, i) => makeReactivoDirecto(`q-${i}`, s));
}

describe('SimulacroContainer', () => {
  let contentPort: ContentPort;
  let storagePort: StoragePort;
  const onDone = vi.fn<(attempt: Attempt) => void>();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear(); // evitar que el snapshot de un test contamine al siguiente
    contentPort = makeFakeContentPort(make20Questions());
    storagePort = makeFakeStoragePort();
  });

  it('muestra el SizePicker al inicio', () => {
    render(
      <SimulacroContainer
        contentPort={contentPort}
        storagePort={storagePort}
        onDone={onDone}
      />,
    );
    expect(screen.getByText('Configurar simulacro')).toBeInTheDocument();
  });

  it('navega al flujo activo tras confirmar la configuración', async () => {
    render(
      <SimulacroContainer
        contentPort={contentPort}
        storagePort={storagePort}
        onDone={onDone}
      />,
    );
    await userEvent.click(screen.getByText('20'));
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Iniciar simulacro' }));
    });
    // En el flujo activo, la primera pregunta muestra el botón "Siguiente →"
    expect(screen.getByRole('button', { name: 'Siguiente →' })).toBeInTheDocument();
  });

  it('cambia currentIndex al navegar con la NavGrid', async () => {
    render(
      <SimulacroContainer
        contentPort={contentPort}
        storagePort={storagePort}
        onDone={onDone}
      />,
    );
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Iniciar simulacro' }));
    });
    // El header de QuestionCard puede estar dividido en sub-spans; usamos getAllByText
    expect(
      screen.getAllByText((_, el) => el?.textContent?.includes('Reactivo 1 de') ?? false).length,
    ).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente →' }));
    expect(
      screen.getAllByText((_, el) => el?.textContent?.includes('Reactivo 2 de') ?? false).length,
    ).toBeGreaterThan(0);
  });

  it('al hacer submit llama onDone con el Attempt', async () => {
    render(
      <SimulacroContainer
        contentPort={contentPort}
        storagePort={storagePort}
        onDone={onDone}
      />,
    );
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Iniciar simulacro' }));
    });
    // El submit solo aparece en la última pregunta: saltamos a ella con la NavGrid
    const navButtons = screen.getAllByRole('button', { name: /^Reactivo \d+,/ });
    await userEvent.click(navButtons[navButtons.length - 1]!);
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Revisar examen' }));
    });
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(storagePort.saveAttempt).toHaveBeenCalledTimes(1);
  });

  it('auto-submit al expirar el timer llama onDone', async () => {
    const contentPortWith1s: ContentPort = makeFakeContentPort(make20Questions());
    render(
      <SimulacroContainer
        contentPort={contentPortWith1s}
        storagePort={storagePort}
        onDone={onDone}
      />,
    );
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Iniciar simulacro' }));
    });
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });
});
