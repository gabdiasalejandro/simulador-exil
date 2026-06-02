import { describe, it, expect, vi } from 'vitest';
import { startSimulacro } from './start-simulacro';
import type { ContentPort } from '../ports/content-port';
import type { SessionConfig } from '../../domain/exam/session';
import type { ReactivoDirecto } from '../../domain/question/question';

// ---------------------------------------------------------------------------
// Fakes helpers — modelo v2
// ---------------------------------------------------------------------------

function makeReactivoDirecto(id: string, subarea: string): ReactivoDirecto {
  return {
    id,
    tipo: 'directo',
    enunciado: `Pregunta ${id}`,
    opciones: ['A', 'B', 'C', 'D'],
    correcta: 0,
    explanation: 'Explicación.',
    area: 'A',
    subarea: subarea as 'A1',
  };
}

/** Banco mínimo con 5 reactivos en A1 */
function makeSeedBank(n = 5): ReactivoDirecto[] {
  return Array.from({ length: n }, (_, i) => makeReactivoDirecto(`q${i + 1}`, 'A1'));
}

function makeFakePort(questions: ReactivoDirecto[]): ContentPort {
  return {
    loadBank: vi.fn().mockResolvedValue(questions),
  };
}

const rngFixed = () => 0.5;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('startSimulacro', () => {
  it('carga el banco y retorna una ExamSession con config correcta', async () => {
    const config: SessionConfig = { size: 20, timer: { mode: 'limited', minutes: 58 } };
    const port = makeFakePort(makeSeedBank(5));

    const session = await startSimulacro(config, port, rngFixed);

    expect(session.config.size).toBe(20);
    expect(session.config.timer.mode).toBe('limited');
    expect(session.exam.questions.length).toBeGreaterThan(0);
    expect(session.answers).toBeInstanceOf(Map);
  });

  it('timer.minutes es computeDefaultMinutes(size) cuando el config usa modo limited', async () => {
    const config: SessionConfig = { size: 20, timer: { mode: 'limited', minutes: 58 } };
    const port = makeFakePort(makeSeedBank(5));

    const session = await startSimulacro(config, port, rngFixed);

    // computeDefaultMinutes(20) = round((20/125)*360) = round(57.6) = 58
    if (session.config.timer.mode === 'limited') {
      expect(session.config.timer.minutes).toBe(58);
    }
  });

  it('propaga bankWarnings cuando el banco es insuficiente', async () => {
    const config: SessionConfig = { size: 20, timer: { mode: 'limited', minutes: 58 } };
    const port = makeFakePort([makeReactivoDirecto('q1', 'A1')]);

    const session = await startSimulacro(config, port, rngFixed);

    expect(session.exam.bankWarnings.length).toBeGreaterThan(0);
  });

  it('lanza EMPTY_BANK cuando el banco no tiene reactivos válidos', async () => {
    const config: SessionConfig = { size: 20, timer: { mode: 'limited', minutes: 58 } };
    const port = makeFakePort([]);

    await expect(startSimulacro(config, port, rngFixed)).rejects.toThrow('EMPTY_BANK');
  });

  it('llama loadBank exactamente una vez por invocación', async () => {
    const config: SessionConfig = { size: 20, timer: { mode: 'limited', minutes: 58 } };
    const port = makeFakePort(makeSeedBank(5));

    await startSimulacro(config, port, rngFixed);

    expect(port.loadBank).toHaveBeenCalledTimes(1);
  });

  it('modo unlimited preserva el config sin modificar los minutos', async () => {
    const config: SessionConfig = { size: 20, timer: { mode: 'unlimited' } };
    const port = makeFakePort(makeSeedBank(5));

    const session = await startSimulacro(config, port, rngFixed);

    expect(session.config.timer.mode).toBe('unlimited');
  });
});
