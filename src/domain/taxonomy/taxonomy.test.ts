import { describe, it, expect } from 'vitest';
import {
  OFFICIAL_DISTRIBUTION,
  AREA_CODES,
  SUBAREA_CODES,
  isValidArea,
  isValidSubarea,
} from './taxonomy';

describe('taxonomy — distribución oficial', () => {
  it('la suma de todos los reactivos debe ser 125', () => {
    const total = OFFICIAL_DISTRIBUTION.reduce((sum, entry) => sum + entry.count, 0);
    expect(total).toBe(125);
  });

  it('tiene exactamente 20 entradas (13 subáreas + 20 filas)', () => {
    // El spec tabla REQ-02.1 tiene 20 filas
    expect(OFFICIAL_DISTRIBUTION.length).toBe(20);
  });

  it('todas las entradas tienen área y subárea válidas', () => {
    for (const entry of OFFICIAL_DISTRIBUTION) {
      expect(isValidArea(entry.area)).toBe(true);
      expect(isValidSubarea(entry.subarea)).toBe(true);
    }
  });

  it('AREA_CODES contiene exactamente las 6 áreas oficiales', () => {
    expect(AREA_CODES).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
  });

  it('SUBAREA_CODES contiene exactamente 20 subáreas', () => {
    expect(SUBAREA_CODES.length).toBe(20);
  });

  it('isValidArea devuelve true para áreas válidas', () => {
    expect(isValidArea('A')).toBe(true);
    expect(isValidArea('B')).toBe(true);
    expect(isValidArea('F')).toBe(true);
  });

  it('isValidArea devuelve false para códigos inválidos', () => {
    expect(isValidArea('Z')).toBe(false);
    expect(isValidArea('G')).toBe(false);
    expect(isValidArea('')).toBe(false);
  });

  it('isValidSubarea devuelve true para subáreas válidas', () => {
    expect(isValidSubarea('A1')).toBe(true);
    expect(isValidSubarea('D2')).toBe(true);
    expect(isValidSubarea('F2')).toBe(true);
  });

  it('isValidSubarea devuelve false para subáreas inválidas', () => {
    expect(isValidSubarea('X9')).toBe(false);
    expect(isValidSubarea('A6')).toBe(false);
    expect(isValidSubarea('')).toBe(false);
  });

  it('distribución del área D: D1=16, D2=2', () => {
    const d1 = OFFICIAL_DISTRIBUTION.find((e) => e.subarea === 'D1');
    const d2 = OFFICIAL_DISTRIBUTION.find((e) => e.subarea === 'D2');
    expect(d1?.count).toBe(16);
    expect(d2?.count).toBe(2);
  });

  it('distribución del área F: F1=4, F2=16', () => {
    const f1 = OFFICIAL_DISTRIBUTION.find((e) => e.subarea === 'F1');
    const f2 = OFFICIAL_DISTRIBUTION.find((e) => e.subarea === 'F2');
    expect(f1?.count).toBe(4);
    expect(f2?.count).toBe(16);
  });
});
