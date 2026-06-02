import { describe, it, expect } from 'vitest';
import { sampleExam } from './sampling';
import { computeBlueprint } from './blueprint';
import type { Reactivo, ReactivoDirecto } from '../question/question';
import type { AreaCode, SubareaCode } from '../taxonomy/taxonomy';

// RNG determinista para tests
const deterministicRng = (() => {
  let seed = 42;
  return () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };
})();

function makeReactivo(id: string, area: AreaCode, subarea: SubareaCode): ReactivoDirecto {
  return {
    id,
    tipo: 'directo',
    area,
    subarea,
    explanation: 'exp',
    enunciado: `Pregunta ${id}`,
    opciones: ['A', 'B', 'C', 'D'],
    correcta: 0,
  };
}

// Banco básico: una pregunta por subárea oficial para variante 20
function makeMinimalBank(): Reactivo[] {
  const subareas: Array<[AreaCode, SubareaCode]> = [
    ['A', 'A1'], ['A', 'A2'], ['A', 'A3'], ['A', 'A4'], ['A', 'A5'],
    ['B', 'B1'], ['B', 'B2'], ['B', 'B3'], ['B', 'B4'], ['B', 'B5'],
    ['C', 'C1'], ['C', 'C2'], ['C', 'C3'],
    ['D', 'D1'], ['D', 'D2'],
    ['E', 'E1'], ['E', 'E2'], ['E', 'E3'],
    ['F', 'F1'], ['F', 'F2'],
  ];
  return subareas.flatMap(([area, sub]) =>
    Array.from({ length: 5 }, (_, i) => makeReactivo(`${sub}-${i}`, area, sub)),
  );
}

describe('sampleExam — modelo v2', () => {
  // esc.03-A: reactivo con subárea inválida se excluye
  it('esc.03-A — excluye reactivos cuyo subarea no es oficial', () => {
    const bank: Reactivo[] = [
      makeReactivo('valid', 'A', 'A1'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { ...makeReactivo('invalid', 'A', 'A1'), subarea: 'X9' as any },
    ];
    const bp = computeBlueprint(20);
    const result = sampleExam(bank, bp, deterministicRng);
    const hasInvalid = result.questions.some((q) => q.id === 'invalid');
    expect(hasInvalid).toBe(false);
  });

  // esc.04-A: degradación parcial genera bankWarnings
  it('esc.04-A — banco insuficiente para A1 produce bankWarning y usa los disponibles', () => {
    const bank = makeMinimalBank();
    const filteredBank = bank.filter((q) => q.subarea !== 'A1');
    filteredBank.push(makeReactivo('a1-0', 'A', 'A1'));
    filteredBank.push(makeReactivo('a1-1', 'A', 'A1'));

    const bp = computeBlueprint(125);
    const result = sampleExam(filteredBank, bp, deterministicRng);

    const a1Warning = result.bankWarnings.find((w) => w.subarea === 'A1');
    expect(a1Warning).toBeDefined();
    expect(a1Warning?.requested).toBe(5);
    expect(a1Warning?.available).toBe(2);

    const a1Questions = result.questions.filter((q) => q.subarea === 'A1');
    expect(a1Questions.length).toBe(2);
  });

  // esc.04-B: sin repetición
  it('esc.04-B — ningún reactivo aparece dos veces en el examen', () => {
    const bank = makeMinimalBank();
    const bp = computeBlueprint(20);
    const result = sampleExam(bank, bp, deterministicRng);
    const ids = result.questions.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  // esc.04-C: banco vacío lanza EMPTY_BANK
  it('esc.04-C — banco vacío lanza error EMPTY_BANK', () => {
    const bp = computeBlueprint(20);
    expect(() => sampleExam([], bp, deterministicRng)).toThrow('EMPTY_BANK');
  });

  it('con banco suficiente no produce bankWarnings', () => {
    const bank = makeMinimalBank();
    const bp = computeBlueprint(20);
    const result = sampleExam(bank, bp, deterministicRng);
    expect(result.bankWarnings.length).toBe(0);
  });

  it('con banco vacío de subáreas con assigned=0 no produce bankWarning (cero esperado)', () => {
    const bank = makeMinimalBank();
    const bp = computeBlueprint(20);
    const d2assigned = bp.find((e) => e.subarea === 'D2')?.assigned ?? 0;
    if (d2assigned === 0) {
      const result = sampleExam(bank, bp, deterministicRng);
      const d2Warning = result.bankWarnings.find((w) => w.subarea === 'D2');
      expect(d2Warning).toBeUndefined();
    }
  });
});
