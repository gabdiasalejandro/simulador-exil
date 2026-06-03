/**
 * Smoke test de integración del flujo completo de simulacro.
 *
 * - Usa YamlContentAdapter real sobre banco.yaml (20 reactivos reales).
 * - Usa IndexedDbStorageAdapter con fake-indexeddb para aislamiento.
 * - No usa mocks del dominio ni de los casos de uso.
 *
 * Flujo verificado:
 *  Landing → click Simular → SizePicker (20 reactivos) →
 *  confirmar → reactivo activo → responder algunos →
 *  enviar → ReportView con puntuación global visible.
 */
import 'fake-indexeddb/auto';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { App } from '../ui/App';
import { saveSimulacroSnapshot } from '../infrastructure/storage/simulacro-session-storage';
import type { Reactivo } from '../domain/question/question';

describe('Smoke: flujo completo del simulacro', () => {
  beforeEach(() => {
    localStorage.clear(); // sin simulacro en curso persistido
  });

  it('navega de landing a simulacro y muestra el reporte criterial', async () => {
    render(<App />);

    // --- Paso 1: Landing muestra los modos activos ---
    expect(screen.getByRole('button', { name: 'Simular' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Practicar' })).toBeInTheDocument();

    // --- Paso 2: Click en Simular lleva al SizePicker ---
    await userEvent.click(screen.getByRole('button', { name: 'Simular' }));
    expect(screen.getByText('Configurar simulacro')).toBeInTheDocument();

    // --- Paso 3: Elegir 20 reactivos y confirmar ---
    await userEvent.click(screen.getByText('20'));
    await act(async () => {
      await userEvent.click(
        screen.getByRole('button', { name: 'Iniciar simulacro' }),
      );
    });

    // --- Paso 4: El simulacro activo muestra la navegación entre reactivos ---
    expect(
      await screen.findByRole('button', { name: 'Siguiente →' }),
    ).toBeInTheDocument();

    // --- Paso 5: Responder el primer reactivo (primera opción disponible) ---
    // La QuestionCard del reactivo activo muestra opciones tipo A./B./C./D.
    // Buscamos el primer botón que empieza con "A." para seleccionarlo.
    const optionButtons = screen.getAllByRole('button').filter((btn) =>
      btn.textContent?.trim().startsWith('A.'),
    );
    if (optionButtons.length > 0) {
      await userEvent.click(optionButtons[0]!);
    }

    // --- Paso 6: Saltar a la última pregunta y enviar con "Revisar examen" ---
    const navButtons = screen.getAllByRole('button', { name: /^Reactivo \d+,/ });
    await userEvent.click(navButtons[navButtons.length - 1]!);
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Revisar examen' }));
    });

    // --- Paso 7: Verificar que aparece el reporte criterial ---
    expect(
      await screen.findByText('Resultados del simulacro'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Evaluación criterial — sin comparación con otros'),
    ).toBeInTheDocument();

    // La puntuación global debe estar presente (número/total)
    expect(screen.getByText(/global/)).toBeInTheDocument();

    // --- Paso 8: Botón "Nuevo simulacro" regresa al landing ---
    await userEvent.click(
      screen.getByRole('button', { name: 'Nuevo simulacro' }),
    );
    expect(screen.getByRole('button', { name: 'Simular' })).toBeInTheDocument();
  });

  it('si hay un simulacro inconcluso guardado, App arranca directo en él', async () => {
    const reactivo: Reactivo = {
      id: 'qr-1',
      tipo: 'directo',
      area: 'A',
      subarea: 'A1',
      enunciado: 'Enunciado restaurado del simulacro guardado',
      opciones: ['op A', 'op B', 'op C', 'op D'],
      correcta: 1,
      explanation: 'exp',
    };
    saveSimulacroSnapshot({
      sessionId: 'sess-restaurada',
      config: { size: 20, timer: { mode: 'unlimited' } },
      questions: [reactivo],
      bankWarnings: [],
      answers: [],
      remainingSeconds: null,
      currentIndex: 0,
      startedAt: Date.now(),
    });

    render(<App />);

    // Arranca directo en el simulacro activo (no en el landing)
    expect(
      await screen.findByText('Enunciado restaurado del simulacro guardado'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Simular' })).not.toBeInTheDocument();
  });
});
