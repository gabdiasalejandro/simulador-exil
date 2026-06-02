import { isValidArea, isValidSubarea } from '../taxonomy/taxonomy';
import type { Question } from './question';

// ---------------------------------------------------------------------------
// Tipos de error y resultado
// ---------------------------------------------------------------------------

export type ValidationErrorCode =
  | 'MISSING_OFFICIAL_TAG'
  | 'INVALID_OPTIONS_COUNT'
  | 'INVALID_ITEM_TYPE'
  | 'MISSING_REQUIRED_FIELD';

export interface ValidationError {
  readonly code: ValidationErrorCode;
  readonly message: string;
}

export type Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// ---------------------------------------------------------------------------
// Validaciones auxiliares
// ---------------------------------------------------------------------------

function validateOfficialTag(raw: unknown): ValidationError | null {
  if (!raw || typeof raw !== 'object') {
    return { code: 'MISSING_OFFICIAL_TAG', message: 'officialTag es requerido' };
  }
  const tag = raw as Record<string, unknown>;
  if (typeof tag['area'] !== 'string' || !isValidArea(tag['area'])) {
    return { code: 'MISSING_OFFICIAL_TAG', message: `Área oficial no reconocida: ${String(tag['area'])}` };
  }
  if (typeof tag['subarea'] !== 'string' || !isValidSubarea(tag['subarea'])) {
    return {
      code: 'MISSING_OFFICIAL_TAG',
      message: `Subárea oficial no reconocida: ${String(tag['subarea'])}`,
    };
  }
  return null;
}

function validateOptions(options: unknown): ValidationError | null {
  if (!Array.isArray(options) || options.length !== 4) {
    return {
      code: 'INVALID_OPTIONS_COUNT',
      message: `options debe tener exactamente 4 elementos, tiene ${Array.isArray(options) ? options.length : 'N/A'}`,
    };
  }
  for (const opt of options) {
    if (typeof opt !== 'string' || opt.trim() === '') {
      return {
        code: 'INVALID_OPTIONS_COUNT',
        message: 'Todas las opciones deben ser strings no vacíos',
      };
    }
  }
  return null;
}

function validateSubQuestion(sub: unknown): ValidationError | null {
  if (!sub || typeof sub !== 'object') {
    return { code: 'MISSING_REQUIRED_FIELD', message: 'Sub-pregunta inválida' };
  }
  const s = sub as Record<string, unknown>;
  const leafTypes = ['direct', 'completion', 'ordering', 'match'];
  if (!leafTypes.includes(s['itemType'] as string)) {
    return { code: 'INVALID_ITEM_TYPE', message: `itemType de sub-pregunta inválido: ${String(s['itemType'])}` };
  }
  if (s['itemType'] === 'direct' || s['itemType'] === 'completion') {
    const optErr = validateOptions(s['options']);
    if (optErr) return optErr;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Validador principal
// ---------------------------------------------------------------------------

export function validateQuestion(raw: unknown): Result<Question, ValidationError> {
  if (!raw || typeof raw !== 'object') {
    return err({ code: 'MISSING_REQUIRED_FIELD', message: 'El objeto Question es null o no es un objeto' });
  }

  const q = raw as Record<string, unknown>;

  // Validar officialTag
  const tagErr = validateOfficialTag(q['officialTag']);
  if (tagErr) return err(tagErr);

  const itemType = q['itemType'];
  const validTypes = ['direct', 'completion', 'ordering', 'match', 'case'];
  if (!validTypes.includes(itemType as string)) {
    return err({ code: 'INVALID_ITEM_TYPE', message: `itemType desconocido: ${String(itemType)}` });
  }

  // T1 y T2: validar options
  if (itemType === 'direct' || itemType === 'completion') {
    const optErr = validateOptions(q['options']);
    if (optErr) return err(optErr);
  }

  // T5: validar sub-preguntas
  if (itemType === 'case') {
    const subs = q['subQuestions'];
    if (!Array.isArray(subs) || subs.length === 0) {
      return err({
        code: 'MISSING_REQUIRED_FIELD',
        message: 'CaseQuestion requiere al menos una sub-pregunta',
      });
    }
    for (const sub of subs) {
      const subErr = validateSubQuestion(sub);
      if (subErr) return err(subErr);
    }
  }

  return ok(raw as Question);
}
