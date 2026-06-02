import type { ContentPort } from '../../application/ports/content-port';
import type { Question } from '../../domain/question/question';
import { validateQuestion } from '../../domain/question/validation';
import seedBankData from './seed-bank.json';

// ---------------------------------------------------------------------------
// Opciones de construcción (permiten inyectar datos en tests)
// ---------------------------------------------------------------------------

export interface JsonContentAdapterOptions {
  /**
   * Arreglo crudo de preguntas a validar.
   * Si no se provee, se usa el seed-bank.json embebido.
   */
  rawQuestions?: unknown[];
}

// ---------------------------------------------------------------------------
// Adaptador
// ---------------------------------------------------------------------------

/**
 * Implementa ContentPort cargando el banco de preguntas desde un JSON.
 *
 * - Valida cada reactivo con validateQuestion (del dominio).
 * - Descarta silenciosamente los reactivos inválidos (MISSING_OFFICIAL_TAG,
 *   INVALID_OPTIONS_COUNT, etc.) con un log de advertencia.
 * - El mapping originTag → officialTag es pass-through en el seed:
 *   las etiquetas ya son oficiales.
 */
export class JsonContentAdapter implements ContentPort {
  private readonly rawQuestions: unknown[];

  constructor(options?: JsonContentAdapterOptions) {
    if (options?.rawQuestions !== undefined) {
      this.rawQuestions = options.rawQuestions;
    } else {
      // Cargar del seed-bank.json embebido
      const data = seedBankData as { schemaVersion: number; questions: unknown[] };
      this.rawQuestions = data.questions;
    }
  }

  async loadBank(): Promise<Question[]> {
    const valid: Question[] = [];

    for (const raw of this.rawQuestions) {
      const result = validateQuestion(raw);
      if (result.ok) {
        valid.push(result.value);
      } else {
        // Log de advertencia sin lanzar excepción
        console.warn(
          `[JsonContentAdapter] Reactivo descartado — error: ${result.error.code}`,
          raw,
        );
      }
    }

    return valid;
  }
}
