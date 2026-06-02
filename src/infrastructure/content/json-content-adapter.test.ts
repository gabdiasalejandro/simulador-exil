import { describe, it, expect } from 'vitest';
import { JsonContentAdapter } from './json-content-adapter';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('JsonContentAdapter', () => {
  it('carga el seed-bank y retorna un arreglo de preguntas válidas', async () => {
    const adapter = new JsonContentAdapter();
    const questions = await adapter.loadBank();

    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBeGreaterThan(0);
  });

  it('todas las preguntas retornadas tienen officialTag válido con area y subarea', async () => {
    const adapter = new JsonContentAdapter();
    const questions = await adapter.loadBank();

    for (const q of questions) {
      expect(q.officialTag).toBeDefined();
      expect(typeof q.officialTag.area).toBe('string');
      expect(typeof q.officialTag.subarea).toBe('string');
    }
  });

  it('todas las preguntas tienen id, itemType y explanation', async () => {
    const adapter = new JsonContentAdapter();
    const questions = await adapter.loadBank();

    for (const q of questions) {
      expect(typeof q.id).toBe('string');
      expect(q.id.length).toBeGreaterThan(0);
      expect(typeof q.itemType).toBe('string');
      expect(typeof q.explanation).toBe('string');
    }
  });

  it('filtra reactivos con officialTag.subarea inválido', async () => {
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
          officialTag: { area: 'Z', subarea: 'X9' }, // inválido
          originTag: { area: 'X', subarea: 'Y' },
        },
      ],
    });

    const questions = await adapter.loadBank();

    expect(questions.length).toBe(1);
    expect(questions[0]?.id).toBe('valid-001');
  });

  it('filtra reactivos con opciones incompletas (T1/T2 con menos de 4 opciones)', async () => {
    const adapter = new JsonContentAdapter({
      rawQuestions: [
        {
          id: 'bad-options',
          itemType: 'direct',
          stem: 'Pregunta con opciones incompletas',
          options: ['Solo', 'Dos'], // inválido: faltan 2 opciones
          correctIndex: 0,
          explanation: 'Explicación',
          officialTag: { area: 'A', subarea: 'A1' },
          originTag: { area: 'X', subarea: 'Y' },
        },
      ],
    });

    const questions = await adapter.loadBank();

    expect(questions.length).toBe(0);
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
          // officialTag ausente
          originTag: { area: 'X', subarea: 'Y' },
        },
      ],
    });

    const questions = await adapter.loadBank();

    expect(questions.length).toBe(0);
  });

  it('retorna arreglo vacío si todos los reactivos son inválidos', async () => {
    const adapter = new JsonContentAdapter({ rawQuestions: [] });
    const questions = await adapter.loadBank();
    expect(questions).toEqual([]);
  });

  it('el seed-bank cubre al menos 8 subáreas oficiales distintas', async () => {
    const adapter = new JsonContentAdapter();
    const questions = await adapter.loadBank();

    const subareas = new Set(questions.map((q) => q.officialTag.subarea));
    expect(subareas.size).toBeGreaterThanOrEqual(8);
  });

  it('el seed-bank cubre los 5 tipos de reactivo', async () => {
    const adapter = new JsonContentAdapter();
    const questions = await adapter.loadBank();

    const types = new Set(questions.map((q) => q.itemType));
    expect(types.has('direct')).toBe(true);
    expect(types.has('completion')).toBe(true);
    expect(types.has('ordering')).toBe(true);
    expect(types.has('match')).toBe(true);
    expect(types.has('case')).toBe(true);
  });
});
