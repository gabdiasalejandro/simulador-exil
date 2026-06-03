import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveSimulacroSnapshot,
  loadSimulacroSnapshot,
  clearSimulacroSnapshot,
  type SimulacroSnapshot,
} from './simulacro-session-storage';
import type { Reactivo } from '../../domain/question/question';

function makeReactivo(id: string): Reactivo {
  return {
    id,
    tipo: 'directo',
    area: 'A',
    subarea: 'A1',
    enunciado: `Enunciado ${id}`,
    opciones: ['a', 'b', 'c', 'd'],
    correcta: 0,
    explanation: 'exp',
  };
}

const baseSnapshot: Omit<SimulacroSnapshot, 'version'> = {
  sessionId: 'sess-1',
  config: { size: 20, timer: { mode: 'limited', minutes: 30 } },
  questions: [makeReactivo('q1'), makeReactivo('q2')],
  bankWarnings: [],
  answers: [
    ['q1', { kind: 'choice', index: 2 }],
    ['q2', null],
  ],
  remainingSeconds: 1200,
  currentIndex: 1,
  startedAt: 1_700_000_000_000,
};

describe('simulacro-session-storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('load retorna null cuando no hay snapshot', () => {
    expect(loadSimulacroSnapshot()).toBeNull();
  });

  it('save + load hace round-trip preservando los datos', () => {
    saveSimulacroSnapshot(baseSnapshot);
    const loaded = loadSimulacroSnapshot();
    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe(1);
    expect(loaded!.sessionId).toBe('sess-1');
    expect(loaded!.questions).toHaveLength(2);
    expect(loaded!.answers).toEqual(baseSnapshot.answers);
    expect(loaded!.remainingSeconds).toBe(1200);
    expect(loaded!.currentIndex).toBe(1);
  });

  it('clear elimina el snapshot', () => {
    saveSimulacroSnapshot(baseSnapshot);
    clearSimulacroSnapshot();
    expect(loadSimulacroSnapshot()).toBeNull();
  });

  it('load retorna null si la versión no coincide', () => {
    localStorage.setItem(
      'simulador-exil:simulacro-en-curso',
      JSON.stringify({ ...baseSnapshot, version: 99 }),
    );
    expect(loadSimulacroSnapshot()).toBeNull();
  });

  it('load retorna null si el JSON está corrupto', () => {
    localStorage.setItem('simulador-exil:simulacro-en-curso', '{no-json');
    expect(loadSimulacroSnapshot()).toBeNull();
  });
});
