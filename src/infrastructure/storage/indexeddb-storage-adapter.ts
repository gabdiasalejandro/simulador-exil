import { openDB, type IDBPDatabase } from 'idb';
import type { StoragePort } from '../../application/ports/storage-port';
import type { Attempt, BlueprintSnapshot, ExamSnapshot } from '../../domain/attempt/attempt';
import type { AttemptReport, ScoreEntry } from '../../domain/scoring/attempt-report';
import type { Answer } from '../../domain/question/answer';
import type { AreaCode, SubareaCode } from '../../domain/taxonomy/taxonomy';
import type { BankWarning } from '../../domain/exam/sampling';

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const DEFAULT_DB_NAME = 'simulador-exil';
const STORE_ATTEMPTS = 'attempts';
const DB_VERSION = 1;

// ---------------------------------------------------------------------------
// Esquema serializable (IndexedDB no almacena Map directamente)
// ---------------------------------------------------------------------------

interface SerializedAttempt {
  id: string;
  blueprintSnapshot: {
    size: number;
    distribution: Array<[string, number]>;
  };
  examSnapshot: {
    questionIds: string[];
  };
  answerMap: Array<[string, Answer | null]>;
  report: {
    globalScore: ScoreEntry;
    byArea: Array<[string, ScoreEntry]>;
    bySubarea: Array<[string, ScoreEntry]>;
    bankWarnings: BankWarning[];
  };
  startedAt: number;
  finishedAt: number;
}

// ---------------------------------------------------------------------------
// Serialización y deserialización
// ---------------------------------------------------------------------------

function serialize(attempt: Attempt): SerializedAttempt {
  return {
    id: attempt.id,
    blueprintSnapshot: {
      size: attempt.blueprintSnapshot.size,
      distribution: Array.from(attempt.blueprintSnapshot.distribution.entries()),
    },
    examSnapshot: {
      questionIds: Array.from(attempt.examSnapshot.questionIds),
    },
    answerMap: Array.from(attempt.answerMap.entries()),
    report: {
      globalScore: attempt.report.globalScore,
      byArea: Array.from(attempt.report.byArea.entries()),
      bySubarea: Array.from(attempt.report.bySubarea.entries()),
      bankWarnings: Array.from(attempt.report.bankWarnings),
    },
    startedAt: attempt.startedAt,
    finishedAt: attempt.finishedAt,
  };
}

function deserialize(raw: SerializedAttempt): Attempt {
  const blueprintSnapshot: BlueprintSnapshot = {
    size: raw.blueprintSnapshot.size,
    distribution: new Map(raw.blueprintSnapshot.distribution),
  };

  const examSnapshot: ExamSnapshot = {
    questionIds: raw.examSnapshot.questionIds,
  };

  const answerMap = new Map<string, Answer | null>(raw.answerMap);

  const report: AttemptReport = {
    globalScore: raw.report.globalScore,
    byArea: new Map(raw.report.byArea) as ReadonlyMap<AreaCode, ScoreEntry>,
    bySubarea: new Map(raw.report.bySubarea) as ReadonlyMap<SubareaCode, ScoreEntry>,
    bankWarnings: raw.report.bankWarnings,
  };

  return {
    id: raw.id,
    blueprintSnapshot,
    examSnapshot,
    answerMap,
    report,
    startedAt: raw.startedAt,
    finishedAt: raw.finishedAt,
  };
}

// ---------------------------------------------------------------------------
// Opciones de construcción (permiten inyectar fake-indexeddb en tests)
// ---------------------------------------------------------------------------

export interface IndexedDbStorageAdapterOptions {
  /**
   * Nombre de la base de datos. Útil en tests para aislar cada instancia
   * usando un nombre único (evita estado compartido con fake-indexeddb).
   * Default: "simulador-exil".
   */
  dbName?: string;
}

// ---------------------------------------------------------------------------
// Adaptador
// ---------------------------------------------------------------------------

/**
 * Implementa StoragePort usando IndexedDB vía la librería `idb`.
 *
 * - Base de datos: "simulador-exil" (o dbName inyectado), store "attempts", keyPath "id".
 * - DB_VERSION=1, migración en onupgradeneeded (switch sobre oldVersion).
 * - Serializa Maps a arrays de pares para compatibilidad con IndexedDB.
 * - La estrategia de versionado queda oculta tras el puerto (NOTA-D2).
 */
export class IndexedDbStorageAdapter implements StoragePort {
  private dbPromise: Promise<IDBPDatabase<unknown>> | null = null;
  private readonly dbName: string;

  constructor(options?: IndexedDbStorageAdapterOptions) {
    this.dbName = options?.dbName ?? DEFAULT_DB_NAME;
  }

  private getDb(): Promise<IDBPDatabase<unknown>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(this.dbName, DB_VERSION, {
        upgrade(db, oldVersion) {
          // Migración por versión — switch permite upgrades incrementales
          switch (oldVersion) {
            case 0:
              // Primera instalación: crear el store
              db.createObjectStore(STORE_ATTEMPTS, { keyPath: 'id' });
              break;
            // case 1: → future migrations go here
          }
        },
      });
    }
    return this.dbPromise;
  }

  async saveAttempt(attempt: Attempt): Promise<void> {
    const db = await this.getDb();
    const serialized = serialize(attempt);
    await db.put(STORE_ATTEMPTS, serialized);
  }

  async listAttempts(): Promise<Attempt[]> {
    const db = await this.getDb();
    const all = await db.getAll(STORE_ATTEMPTS) as SerializedAttempt[];
    return all.map(deserialize);
  }

  async getAttempt(id: string): Promise<Attempt | null> {
    const db = await this.getDb();
    const raw = await db.get(STORE_ATTEMPTS, id) as SerializedAttempt | undefined;
    return raw ? deserialize(raw) : null;
  }
}
