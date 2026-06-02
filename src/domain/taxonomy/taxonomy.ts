// Taxonomía oficial del examen EXIL-NEGOCIOS (CENEVAL, guía nov 2024)
// Fuente de verdad: assets/guia-ceneval.pdf — distribución 125 reactivos

export type AreaCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type SubareaCode =
  | 'A1'
  | 'A2'
  | 'A3'
  | 'A4'
  | 'A5'
  | 'B1'
  | 'B2'
  | 'B3'
  | 'B4'
  | 'B5'
  | 'C1'
  | 'C2'
  | 'C3'
  | 'D1'
  | 'D2'
  | 'E1'
  | 'E2'
  | 'E3'
  | 'F1'
  | 'F2';

export interface DistributionEntry {
  readonly area: AreaCode;
  readonly subarea: SubareaCode;
  readonly label: string;
  readonly count: number;
}

/** Distribución oficial por subárea: 125 reactivos en 6 áreas / 20 subáreas */
export const OFFICIAL_DISTRIBUTION: ReadonlyArray<DistributionEntry> = [
  // A. Administración — 21 reactivos
  { area: 'A', subarea: 'A1', label: 'Conceptos generales de administración', count: 5 },
  { area: 'A', subarea: 'A2', label: 'Pensamiento administrativo', count: 6 },
  { area: 'A', subarea: 'A3', label: 'Proceso administrativo', count: 4 },
  { area: 'A', subarea: 'A4', label: 'Entorno organizacional', count: 3 },
  { area: 'A', subarea: 'A5', label: 'Tecnologías y sistemas de información', count: 3 },
  // B. Contabilidad y finanzas — 25 reactivos
  { area: 'B', subarea: 'B1', label: 'Información financiera', count: 6 },
  { area: 'B', subarea: 'B2', label: 'Normatividad contable', count: 4 },
  { area: 'B', subarea: 'B3', label: 'Proceso contable', count: 5 },
  { area: 'B', subarea: 'B4', label: 'Costos y presupuestos', count: 3 },
  { area: 'B', subarea: 'B5', label: 'Análisis de información financiera', count: 7 },
  // C. Economía — 22 reactivos
  { area: 'C', subarea: 'C1', label: 'Fundamentos de economía', count: 6 },
  { area: 'C', subarea: 'C2', label: 'Economía de la empresa', count: 8 },
  { area: 'C', subarea: 'C3', label: 'Macroeconomía', count: 8 },
  // D. Mercadotecnia — 18 reactivos
  { area: 'D', subarea: 'D1', label: 'Mercado y empresa', count: 16 },
  { area: 'D', subarea: 'D2', label: 'Técnicas y herramientas de mercadotecnia', count: 2 },
  // E. Matemáticas y estadística — 19 reactivos
  { area: 'E', subarea: 'E1', label: 'Matemáticas financieras', count: 12 },
  { area: 'E', subarea: 'E2', label: 'Fundamentos de cálculo', count: 4 },
  { area: 'E', subarea: 'E3', label: 'Estadística descriptiva', count: 3 },
  // F. Derecho — 20 reactivos
  { area: 'F', subarea: 'F1', label: 'Derecho público', count: 4 },
  { area: 'F', subarea: 'F2', label: 'Derecho privado', count: 16 },
] as const;

export const AREA_CODES: ReadonlyArray<AreaCode> = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

export const SUBAREA_CODES: ReadonlyArray<SubareaCode> = OFFICIAL_DISTRIBUTION.map(
  (e) => e.subarea,
) as ReadonlyArray<SubareaCode>;

const AREA_SET = new Set<string>(AREA_CODES);
const SUBAREA_SET = new Set<string>(SUBAREA_CODES);

export function isValidArea(code: string): code is AreaCode {
  return AREA_SET.has(code);
}

export function isValidSubarea(code: string): code is SubareaCode {
  return SUBAREA_SET.has(code);
}
