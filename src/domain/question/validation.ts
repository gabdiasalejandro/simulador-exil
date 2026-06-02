import { isValidArea, isValidSubarea } from '../taxonomy/taxonomy';
import type { Reactivo } from './question';

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

function validateAreaSubarea(raw: Record<string, unknown>): ValidationError | null {
  // Soporta tanto el modelo v2 (area/subarea en raíz) como el v1 (officialTag)
  const area = raw['area'] ?? (raw['officialTag'] as Record<string, unknown> | undefined)?.['area'];
  const subarea = raw['subarea'] ?? (raw['officialTag'] as Record<string, unknown> | undefined)?.['subarea'];

  if (typeof area !== 'string' || !isValidArea(area)) {
    return { code: 'MISSING_OFFICIAL_TAG', message: `Área oficial no reconocida: ${String(area)}` };
  }
  if (typeof subarea !== 'string' || !isValidSubarea(subarea)) {
    return {
      code: 'MISSING_OFFICIAL_TAG',
      message: `Subárea oficial no reconocida: ${String(subarea)}`,
    };
  }
  return null;
}

function validateOptions(options: unknown): ValidationError | null {
  if (!Array.isArray(options) || options.length !== 4) {
    return {
      code: 'INVALID_OPTIONS_COUNT',
      message: `opciones debe tener exactamente 4 elementos, tiene ${Array.isArray(options) ? options.length : 'N/A'}`,
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

// ---------------------------------------------------------------------------
// Normalizador: transforma el objeto crudo al modelo v2
// ---------------------------------------------------------------------------

function normalizeRaw(raw: Record<string, unknown>): Record<string, unknown> {
  // Si viene en formato v1 (itemType + officialTag), transformar a v2
  const officialTag = raw['officialTag'] as Record<string, unknown> | undefined;
  if (officialTag && !raw['tipo']) {
    const tipoMap: Record<string, string> = {
      direct: 'directo',
      completion: 'completamiento',
      ordering: 'ordenamiento',
      match: 'relacion',
    };
    const tipo = tipoMap[raw['itemType'] as string] ?? raw['itemType'];
    const normalized: Record<string, unknown> = {
      ...raw,
      tipo,
      area: officialTag['area'],
      subarea: officialTag['subarea'],
    };
    // Mapear campos v1 → v2
    if (raw['stem'] !== undefined && normalized['enunciado'] === undefined) {
      normalized['enunciado'] = raw['stem'];
    }
    if (raw['options'] !== undefined && normalized['opciones'] === undefined) {
      normalized['opciones'] = raw['options'];
    }
    if (raw['correctIndex'] !== undefined && normalized['correcta'] === undefined) {
      normalized['correcta'] = raw['correctIndex'];
    }
    if (raw['items'] !== undefined && normalized['elementos'] === undefined) {
      normalized['elementos'] = raw['items'];
    }
    if (raw['correctOrder'] !== undefined && normalized['ordenCorrecto'] === undefined) {
      normalized['ordenCorrecto'] = raw['correctOrder'];
    }
    if (raw['leftColumn'] !== undefined && normalized['columnaIzquierda'] === undefined) {
      normalized['columnaIzquierda'] = raw['leftColumn'];
    }
    if (raw['rightColumn'] !== undefined && normalized['columnaDerecha'] === undefined) {
      normalized['columnaDerecha'] = raw['rightColumn'];
    }
    if (raw['correctMatches'] !== undefined && normalized['emparejamientos'] === undefined) {
      normalized['emparejamientos'] = raw['correctMatches'];
    }
    // Mapear explicacion → explanation dentro del bloque v1 también
    if (normalized['explicacion'] !== undefined && normalized['explanation'] === undefined) {
      normalized['explanation'] = normalized['explicacion'];
    }
    return normalized;
  }

  // Mapear explicacion → explanation (YAML v2 usa la clave en español)
  if (raw['explicacion'] !== undefined && raw['explanation'] === undefined) {
    return { ...raw, explanation: raw['explicacion'] };
  }
  return raw;
}

// ---------------------------------------------------------------------------
// Validador principal — acepta modelo v2 (YAML) y v1 legacy (JSON)
// ---------------------------------------------------------------------------

export function validateQuestion(raw: unknown): Result<Reactivo, ValidationError> {
  if (!raw || typeof raw !== 'object') {
    return err({ code: 'MISSING_REQUIRED_FIELD', message: 'El objeto Reactivo es null o no es un objeto' });
  }

  const normalized = normalizeRaw(raw as Record<string, unknown>);

  // Validar area/subarea
  const tagErr = validateAreaSubarea(normalized);
  if (tagErr) return err(tagErr);

  const tipo = normalized['tipo'];
  const validTipos = ['directo', 'completamiento', 'ordenamiento', 'relacion'];
  if (!validTipos.includes(tipo as string)) {
    return err({ code: 'INVALID_ITEM_TYPE', message: `tipo desconocido: ${String(tipo)}` });
  }

  // T1 y T2: validar opciones
  if (tipo === 'directo' || tipo === 'completamiento') {
    const optErr = validateOptions(normalized['opciones']);
    if (optErr) return err(optErr);
  }

  return ok(normalized as unknown as Reactivo);
}
