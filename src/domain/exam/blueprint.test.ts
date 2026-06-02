import { describe, it, expect } from 'vitest';
import { computeBlueprint } from './blueprint';

describe('computeBlueprint — muestreo Hamilton largest-remainder', () => {
  // esc.02-A: suma para 125
  it('esc.02-A — sum(blueprint 125) === 125', () => {
    const bp = computeBlueprint(125);
    const total = bp.reduce((s, e) => s + e.assigned, 0);
    expect(total).toBe(125);
  });

  it('esc.02-A — blueprint 125 tiene 20 entradas (una por subárea)', () => {
    const bp = computeBlueprint(125);
    expect(bp.length).toBe(20);
  });

  it('esc.02-A — blueprint 125 para A1 debe ser 5', () => {
    const bp = computeBlueprint(125);
    const a1 = bp.find((e) => e.subarea === 'A1');
    expect(a1?.assigned).toBe(5);
  });

  // esc.02-B: suma para 60
  it('esc.02-B — sum(blueprint 60) === 60', () => {
    const bp = computeBlueprint(60);
    const total = bp.reduce((s, e) => s + e.assigned, 0);
    expect(total).toBe(60);
  });

  it('esc.02-B — ninguna subárea en 60 supera su cuota en 125', () => {
    const bp125 = computeBlueprint(125);
    const bp60 = computeBlueprint(60);
    for (const entry of bp60) {
      const official = bp125.find((e) => e.subarea === entry.subarea);
      expect(entry.assigned).toBeLessThanOrEqual(official?.assigned ?? 0);
    }
  });

  // esc.02-C: cero permitido para variantes pequeñas
  it('esc.02-C — D2 puede ser 0 en blueprint 20 (2/125 × 20 = 0.32)', () => {
    const bp = computeBlueprint(20);
    const total = bp.reduce((s, e) => s + e.assigned, 0);
    expect(total).toBe(20);
    // No debe lanzar error aunque D2 o E3 queden en 0
    const d2 = bp.find((e) => e.subarea === 'D2');
    expect(d2?.assigned).toBeGreaterThanOrEqual(0);
  });

  it('esc.02-C — sum(blueprint 20) === 20', () => {
    const bp = computeBlueprint(20);
    const total = bp.reduce((s, e) => s + e.assigned, 0);
    expect(total).toBe(20);
  });

  // esc.02-D: determinismo
  it('esc.02-D — dos llamadas con el mismo tamaño producen la misma distribución', () => {
    const bp1 = computeBlueprint(60);
    const bp2 = computeBlueprint(60);
    for (let i = 0; i < bp1.length; i++) {
      expect(bp1[i]?.assigned).toBe(bp2[i]?.assigned);
      expect(bp1[i]?.subarea).toBe(bp2[i]?.subarea);
    }
  });

  it('blueprint siempre tiene todas las 20 subáreas presentes', () => {
    for (const size of [20, 60, 125] as const) {
      const bp = computeBlueprint(size);
      expect(bp.length).toBe(20);
    }
  });
});
