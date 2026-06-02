import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { IndexedDbStorageAdapter } from './indexeddb-storage-adapter';
import type { Attempt } from '../../domain/attempt/attempt';
import type { AttemptReport } from '../../domain/scoring/attempt-report';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReport(): AttemptReport {
  return {
    globalScore: { correct: 3, total: 5 },
    byArea: new Map([['A', { correct: 3, total: 5 }]]),
    bySubarea: new Map([['A1', { correct: 3, total: 5 }]]),
    bankWarnings: [],
  };
}

function makeAttempt(id: string): Attempt {
  return {
    id,
    blueprintSnapshot: {
      size: 20,
      distribution: new Map([['A1', 5]]),
    },
    examSnapshot: {
      questionIds: ['q1', 'q2', 'q3', 'q4', 'q5'],
    },
    answerMap: new Map([
      ['q1', { kind: 'choice', index: 0 }],
      ['q2', null],
    ]),
    report: makeReport(),
    startedAt: Date.now() - 60_000,
    finishedAt: Date.now(),
  };
}

// Cada test usa un nombre de DB único para aislar el estado (fake-indexeddb es global)
let dbCounter = 0;
function createAdapter(): IndexedDbStorageAdapter {
  dbCounter++;
  return new IndexedDbStorageAdapter({ dbName: `test-db-${dbCounter}` });
}

// ---------------------------------------------------------------------------
// Tests — esc.07-A (persiste y recupera) y esc.07-B (dos intentos independientes)
// ---------------------------------------------------------------------------

describe('IndexedDbStorageAdapter', () => {
  it('guarda y recupera un intento por id (esc.07-A)', async () => {
    const adapter = createAdapter();
    const attempt = makeAttempt('attempt-001');

    await adapter.saveAttempt(attempt);
    const recovered = await adapter.getAttempt('attempt-001');

    expect(recovered).not.toBeNull();
    expect(recovered?.id).toBe('attempt-001');
    expect(recovered?.report.globalScore.correct).toBe(3);
    expect(recovered?.report.globalScore.total).toBe(5);
  });

  it('retorna null para un id que no existe', async () => {
    const adapter = createAdapter();

    const result = await adapter.getAttempt('id-inexistente');

    expect(result).toBeNull();
  });

  it('listAttempts retorna todos los intentos guardados (esc.07-B)', async () => {
    const adapter = createAdapter();
    const a1 = makeAttempt('attempt-AAA');
    const a2 = makeAttempt('attempt-BBB');

    await adapter.saveAttempt(a1);
    await adapter.saveAttempt(a2);

    const list = await adapter.listAttempts();

    expect(list.length).toBe(2);
    const ids = list.map((a) => a.id);
    expect(ids).toContain('attempt-AAA');
    expect(ids).toContain('attempt-BBB');
  });

  it('los datos de dos intentos independientes no se mezclan (esc.07-B)', async () => {
    const adapter = createAdapter();
    const a1 = makeAttempt('attempt-X1');
    const a2 = makeAttempt('attempt-X2');

    await adapter.saveAttempt(a1);
    await adapter.saveAttempt(a2);

    const recovered1 = await adapter.getAttempt('attempt-X1');
    const recovered2 = await adapter.getAttempt('attempt-X2');

    expect(recovered1?.id).toBe('attempt-X1');
    expect(recovered2?.id).toBe('attempt-X2');
    expect(recovered1?.id).not.toBe(recovered2?.id);
  });

  it('listAttempts retorna arreglo vacío si no hay intentos guardados', async () => {
    const adapter = createAdapter();

    const list = await adapter.listAttempts();

    expect(list).toEqual([]);
  });

  it('sobrescribe un intento con el mismo id al guardar de nuevo', async () => {
    const adapter = createAdapter();
    const attempt = makeAttempt('attempt-UPSERT');

    await adapter.saveAttempt(attempt);

    const updated: Attempt = {
      ...attempt,
      report: {
        ...attempt.report,
        globalScore: { correct: 5, total: 5 },
      },
    };
    await adapter.saveAttempt(updated);

    const recovered = await adapter.getAttempt('attempt-UPSERT');
    expect(recovered?.report.globalScore.correct).toBe(5);

    const list = await adapter.listAttempts();
    expect(list.length).toBe(1); // no duplicado
  });

  it('preserva bankWarnings en el intento recuperado', async () => {
    const adapter = createAdapter();
    const attempt: Attempt = {
      ...makeAttempt('attempt-WARN'),
      report: {
        ...makeReport(),
        bankWarnings: [{ subarea: 'B1', requested: 6, available: 2 }],
      },
    };

    await adapter.saveAttempt(attempt);
    const recovered = await adapter.getAttempt('attempt-WARN');

    expect(recovered?.report.bankWarnings.length).toBe(1);
    expect(recovered?.report.bankWarnings[0]?.subarea).toBe('B1');
  });

  it('preserva las respuestas (answerMap) en el intento recuperado', async () => {
    const adapter = createAdapter();
    const attempt = makeAttempt('attempt-ANSWERS');

    await adapter.saveAttempt(attempt);
    const recovered = await adapter.getAttempt('attempt-ANSWERS');

    expect(recovered?.answerMap.get('q1')).toEqual({ kind: 'choice', index: 0 });
    expect(recovered?.answerMap.get('q2')).toBeNull();
  });
});
