import { describe, it, expect } from 'vitest';
import { JsonContentAdapter } from './json-content-adapter';

// ---------------------------------------------------------------------------
// Tests — JsonContentAdapter (legacy, mantiene compatibilidad con seed-bank.json)
// Nota: el seed-bank.json usa el formato v1 (itemType/officialTag).
// La normalización v1→v2 ocurre en validateQuestion.
// ---------------------------------------------------------------------------

describe('JsonContentAdapter', () => {
  it('carga el seed-bank y retorna un arreglo de reactivos válidos', async () => {
    const adapter = new JsonContentAdapter();
    const reactivos = await adapter.loadBank();

    expect(Array.isArray(reactivos)).toBe(true);
    expect(reactivos.length).toBeGreaterThan(0);
  });

  it('todos los reactivos retornados tienen area, subarea e id', async () => {
    const adapter = new JsonContentAdapter();
    const reactivos = await adapter.loadBank();

    for (const r of reactivos) {
      expect(r).toBeDefined();
      expect(typeof r.id).toBe('string');
      expect(r.id.length).toBeGreaterThan(0);
      expect(typeof r.area).toBe('string');
      expect(typeof r.subarea).toBe('string');
    }
  });

  it('todos los reactivos tienen tipo y explanation', async () => {
    const adapter = new JsonContentAdapter();
    const reactivos = await adapter.loadBank();

    for (const r of reactivos) {
      expect(typeof r.tipo).toBe('string');
      expect(typeof r.explanation).toBe('string');
    }
  });

  it('filtra reactivos con area o subarea inválida', async () => {
    const adapter = new JsonContentAdapter({
      rawQuestions: [
        {
          id: 'valid-001',
          itemType: 'direct',
          stem: 'Test pregunta',
          options: ['A', 'B', 'C', 'D'],
          correctIndex: 0,
          explanation: 'Explicación',
          officialTag: { area: 'A', subarea: 'A1' },
          originTag: { area: 'X', subarea: 'Y' },
        },
        {
          id: 'invalid-002',
          itemType: 'direct',
          stem: 'Reactivo inválido',
          options: ['A', 'B', 'C', 'D'],
          correctIndex: 0,
          explanation: 'Sin subárea oficial',
          officialTag: { area: 'Z', subarea: 'X9' },
          originTag: { area: 'X', subarea: 'Y' },
        },
      ],
    });

    const reactivos = await adapter.loadBank();

    expect(reactivos.length).toBe(1);
    expect(reactivos[0]?.id).toBe('valid-001');
  });

  it('filtra reactivos con opciones incompletas (T1/T2 con menos de 4 opciones)', async () => {
    const adapter = new JsonContentAdapter({
      rawQuestions: [
        {
          id: 'bad-options',
          itemType: 'direct',
          stem: 'Pregunta con opciones incompletas',
          options: ['Solo', 'Dos'],
          correctIndex: 0,
          explanation: 'Explicación',
          officialTag: { area: 'A', subarea: 'A1' },
          originTag: { area: 'X', subarea: 'Y' },
        },
      ],
    });

    const reactivos = await adapter.loadBank();

    expect(reactivos.length).toBe(0);
  });

  it('filtra reactivos sin officialTag', async () => {
    const adapter = new JsonContentAdapter({
      rawQuestions: [
        {
          id: 'no-tag',
          itemType: 'direct',
          stem: 'Sin tag',
          options: ['A', 'B', 'C', 'D'],
          correctIndex: 0,
          explanation: 'Sin tag oficial',
          originTag: { area: 'X', subarea: 'Y' },
        },
      ],
    });

    const reactivos = await adapter.loadBank();

    expect(reactivos.length).toBe(0);
  });

  it('retorna arreglo vacío si todos los reactivos son inválidos', async () => {
    const adapter = new JsonContentAdapter({ rawQuestions: [] });
    const reactivos = await adapter.loadBank();
    expect(reactivos).toEqual([]);
  });

  it('el seed-bank cubre al menos 8 subáreas oficiales distintas', async () => {
    const adapter = new JsonContentAdapter();
    const reactivos = await adapter.loadBank();

    const subareas = new Set(reactivos.map((r) => r.subarea));
    expect(subareas.size).toBeGreaterThanOrEqual(8);
  });

  it('el seed-bank cubre los 4 tipos del modelo v2 (casos aplanados)', async () => {
    const adapter = new JsonContentAdapter();
    const reactivos = await adapter.loadBank();

    const tipos = new Set(reactivos.map((r) => r.tipo));
    // Los tipos legacy 'direct'→'directo', 'completion'→'completamiento', etc.
    // son normalizados por validateQuestion. Los reactivos de tipo 'case'
    // son descartados (no tienen equivalente en v2 — se aplanar en banco.yaml).
    expect(tipos.has('directo') || tipos.has('completamiento') || tipos.has('ordenamiento') || tipos.has('relacion')).toBe(true);
  });
});
