import { isValidSubarea } from '../taxonomy/taxonomy';
import type { SubareaCode } from '../taxonomy/taxonomy';
import type { Reactivo } from '../question/question';
import type { BlueprintEntry } from './blueprint';

export type Rng = () => number;

export interface BankWarning {
  readonly subarea: SubareaCode;
  readonly requested: number;
  readonly available: number;
}

export interface SampledExam {
  readonly questions: ReadonlyArray<Reactivo>;
  readonly bankWarnings: ReadonlyArray<BankWarning>;
}

/**
 * Muestrea reactivos del banco según el blueprint.
 *
 * - Filtra por subarea válida (REQ-03).
 * - Muestrea sin reemplazo por subárea.
 * - Si una subárea tiene menos reactivos de los pedidos → usa todos,
 *   agrega BankWarning (REQ-04).
 * - Si el banco completo está vacío → lanza Error('EMPTY_BANK') (REQ-04.4).
 * - rng es inyectado para determinismo en tests.
 */
export function sampleExam(
  bank: Reactivo[],
  blueprint: ReadonlyArray<BlueprintEntry>,
  rng: Rng,
): SampledExam {
  // Filtrar banco: solo reactivos con subarea oficial válida
  const validBank = bank.filter(
    (q) => q.subarea && isValidSubarea(q.subarea),
  );

  if (validBank.length === 0) {
    throw new Error('EMPTY_BANK');
  }

  // Agrupar por subárea
  const bySubarea = new Map<SubareaCode, Reactivo[]>();
  for (const q of validBank) {
    const sub = q.subarea;
    const existing = bySubarea.get(sub);
    if (existing) {
      existing.push(q);
    } else {
      bySubarea.set(sub, [q]);
    }
  }

  const sampled: Reactivo[] = [];
  const warnings: BankWarning[] = [];

  for (const entry of blueprint) {
    const requested = entry.assigned;
    if (requested === 0) continue; // cero permitido, sin warning

    const available = bySubarea.get(entry.subarea) ?? [];
    const take = Math.min(requested, available.length);

    if (take < requested) {
      warnings.push({
        subarea: entry.subarea,
        requested,
        available: available.length,
      });
    }

    if (take === 0) continue;

    // Fisher-Yates shuffle sobre una copia, tomar los primeros `take`
    const pool = [...available];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = pool[i]!;
      pool[i] = pool[j]!;
      pool[j] = tmp;
    }

    for (let i = 0; i < take; i++) {
      sampled.push(pool[i]!);
    }
  }

  return { questions: sampled, bankWarnings: warnings };
}
