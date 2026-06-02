import { OFFICIAL_DISTRIBUTION } from '../taxonomy/taxonomy';
import type { AreaCode, SubareaCode } from '../taxonomy/taxonomy';

export type ExamSize = 20 | 60 | 125;

export interface BlueprintEntry {
  readonly area: AreaCode;
  readonly subarea: SubareaCode;
  readonly assigned: number;
}

/**
 * Calcula la distribución de reactivos por subárea usando el método
 * Hamilton de mayor residuo (largest-remainder).
 *
 * Algoritmo (REQ-02.2):
 * 1. cuota_exacta = (count/125) × size
 * 2. floor de cada cuota → asignación base
 * 3. Si sum(base) < size, asignar 1 adicional a las subáreas con mayor
 *    fracción, con desempate ALFABÉTICO ascendente por código de subárea.
 * 4. Cero está permitido — no hay mínimo.
 * 5. Invariante: sum(assigned) === size.
 */
export function computeBlueprint(size: ExamSize): BlueprintEntry[] {
  const total = 125;

  // Paso 1 y 2: calcular cuotas y asignaciones base
  type Intermediate = {
    area: AreaCode;
    subarea: SubareaCode;
    floor: number;
    fraction: number;
  };

  const intermediates: Intermediate[] = OFFICIAL_DISTRIBUTION.map((entry) => {
    const exact = (entry.count / total) * size;
    const floor = Math.floor(exact);
    const fraction = exact - floor;
    return { area: entry.area, subarea: entry.subarea, floor, fraction };
  });

  const baseSum = intermediates.reduce((s, e) => s + e.floor, 0);
  const remainder = size - baseSum;

  // Paso 3: ordenar por fracción descendente, desempate alfabético por subarea
  const sorted = [...intermediates].sort((a, b) => {
    if (b.fraction !== a.fraction) return b.fraction - a.fraction;
    return a.subarea.localeCompare(b.subarea);
  });

  // Asignar los residuos
  const bonuses = new Set<SubareaCode>();
  for (let i = 0; i < remainder; i++) {
    const entry = sorted[i];
    if (entry) bonuses.add(entry.subarea);
  }

  // Reconstruir en el orden original de OFFICIAL_DISTRIBUTION (estable)
  return intermediates.map((e) => ({
    area: e.area,
    subarea: e.subarea,
    assigned: e.floor + (bonuses.has(e.subarea) ? 1 : 0),
  }));
}
