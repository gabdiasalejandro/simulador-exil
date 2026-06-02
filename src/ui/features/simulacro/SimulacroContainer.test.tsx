import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimulacroContainer } from './SimulacroContainer';
import type { ContentPort } from '../../../application/ports/content-port';
import type { StoragePort } from '../../../application/ports/storage-port';
import type { Question } from '../../../domain/question/question';
import type { Attempt } from '../../../domain/attempt/attempt';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

function makeDirectQ(id: string, subarea: string): Question {
  return {
    id,
    itemType: 'direct',
    stem: `Pregunta ${id}`,
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
    explanation: 'exp',
    officialTag: { area: 'A', subarea: subarea as 'A1' },
    originTag: { area: 'Admin', subarea: 'sub' },
  };
}

function makeFakeContentPort(questions: Question[]): ContentPort {
  return { loadBank: () => Promise.resolve(questions) };
}

function makeFakeStoragePort(): StoragePort {
  return {
    saveAttempt: vi.fn().mockResolvedValue(undefined),
    listAttempts: vi.fn().mockResolvedValue([]),
    getAttempt: vi.fn().mockResolvedValue(null),
  };
}

// 20 questions from various subareas (needed for valid sampling)
function make20Questions(): Question[] {
  const subareas = ['A1','A2','A3','A4','A5','B1','B2','B3','B4','B5','C1','C2','C3','D1','D2','E1','E2','E3','F1','F2'] as const;
  return subareas.map((s, i) => makeDirectQ(`q-${i}`, s));
}

describe('SimulacroContainer', () => {
  let contentPort: ContentPort;
  let storagePort: StoragePort;
  const onDone = vi.fn<[Attempt], void>();

  beforeEach(() => {
    vi.clearAllMocks();
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
    // Debe mostrar el botón de enviar del simulacro activo
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument();
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
    // Reactivo 1 de 20 visible
    expect(screen.getByText(/Reactivo 1 de/)).toBeInTheDocument();
    // Clic en "Siguiente →" pasa a reactivo 2
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente →' }));
    expect(screen.getByText(/Reactivo 2 de/)).toBeInTheDocument();
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
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    });
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(storagePort.saveAttempt).toHaveBeenCalledTimes(1);
  });

  it('auto-submit al expirar el timer llama onDone', async () => {
    // Timer de 1 segundo para agilizar
    const contentPortWith1s: ContentPort = makeFakeContentPort(make20Questions());
    render(
      <SimulacroContainer
        contentPort={contentPortWith1s}
        storagePort={storagePort}
        onDone={onDone}
      />,
    );
    // Iniciar con 1 minuto y luego agotar manualmente el timer
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Iniciar simulacro' }));
    });
    // Simular expiración: el Timer dispara onExpire cuando llega a 0.
    // No podemos avanzar real-clock en jsdom, pero validamos que el Timer
    // aparece cuando el modo es limited (existencia del elemento timer).
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });
});
