# Modelo de dominio

> **Versión**: modelo v2 (post-refactor). Los casos ya no son tipos anidados; cada reactivo es una unidad independiente.

Todo en `src/domain/`. Sin imports de React, IndexedDB ni ninguna librería externa.

## Taxonomía oficial

Fuente: `src/domain/taxonomy/taxonomy.ts`. 6 áreas (A–F), 20 subáreas, 125 reactivos totales.

| Área | Nombre | Reactivos | Subáreas |
|------|--------|-----------|----------|
| A | Administración | 21 | A1–A5 |
| B | Contabilidad y finanzas | 25 | B1–B5 |
| C | Economía | 22 | C1–C3 |
| D | Mercadotecnia | 18 | D1–D2 |
| E | Matemáticas y estadística | 19 | E1–E3 |
| F | Derecho | 20 | F1–F2 |

La constante `OFFICIAL_DISTRIBUTION` es la única fuente de verdad. Las variantes de 60 y 20 reactivos se DERIVAN en runtime; no se hardcodean.

`AREA_NOMBRES` y `getAreaNombre(code)` mapean código → nombre completo. La UI siempre muestra el nombre completo, nunca el código.

## Reactivo — unión discriminada por `tipo` (modelo v2)

Archivo: `src/domain/question/question.ts`.

```ts
type Reactivo =
  | ReactivoDirecto      // T1: cuestionamiento directo
  | ReactivoCompletamiento  // T2: completamiento
  | ReactivoOrdenamiento    // T3: ordenamiento
  | ReactivoRelacion;       // T4: relación de columnas (con dropdown)
```

Todos los tipos comparten `BaseReactivo`:

```ts
interface BaseReactivo {
  id: string;
  area: AreaCode;        // código oficial para el blueprint (A–F)
  subarea: SubareaCode;  // código oficial (A1, B3, etc.)
  explanation: string;
  caso?: string;         // contexto compartido cuando el reactivo proviene de un multirreactivo
}
```

### Casos aplanados (`caso?`)

Los multirreactivos (antes `CaseQuestion` con `subQuestions[]`) ya no existen como tipo separado. Cada sub-pregunta se representa como un reactivo independiente con el campo opcional `caso` que lleva el contexto compartido. Esto elimina la deuda técnica del cast `as LeafQuestion` y el `scoreCaseQuestion`.

### Por qué unión discriminada (y no clases)

- Serializable desde YAML/JSON sin constructores.
- `switch(q.tipo)` + `assertNever` garantizan exhaustividad en tiempo de compilación.
- Scoring y rendering viven FUERA del tipo — son políticas inyectables.

### Campos por `tipo`

| `tipo` | Campos adicionales |
|--------|--------------------|
| `directo` | `enunciado`, `opciones[4]`, `correcta: 0\|1\|2\|3` |
| `completamiento` | `enunciado`, `opciones[4]`, `correcta: 0\|1\|2\|3` |
| `ordenamiento` | `enunciado`, `elementos[]`, `ordenCorrecto[]` |
| `relacion` | `enunciado`, `columnaIzquierda[]`, `columnaDerecha[]`, `emparejamientos[]` |

Todos pueden tener `caso?: string` de manera optativa.

### Respuestas (`src/domain/question/answer.ts`)

| Tipo de reactivo | `Answer` |
|-----------------|----------|
| `directo` / `completamiento` | `{ kind: 'choice'; index: number }` |
| `ordenamiento` | `{ kind: 'order'; sequence: number[] }` |
| `relacion` | `{ kind: 'match'; pairs: [number, number][] }` |
| Sin responder | `null` |

### Conteo de reactivos

`getItemCount(q: Reactivo)` siempre retorna `1`. Con el modelo v2, cada reactivo es una unidad independiente independientemente de si tiene campo `caso`.

## ExamBlueprint — muestreo Hamilton

Archivo: `src/domain/exam/blueprint.ts`.

`computeBlueprint(size: 20 | 60 | 125): BlueprintEntry[]` calcula la distribución proporcional:

1. `cuota = (count/125) × size`
2. `base = Math.floor(cuota)` para cada subárea
3. Residuo distribuido a las subáreas con mayor fracción; desempate: orden alfabético ascendente por código de subárea (determinismo)
4. **Cero está permitido** — no hay mínimo por subárea
5. Invariante: `sum(assigned) === size`

## sampleExam — muestreo del banco

Archivo: `src/domain/exam/sampling.ts`.

```ts
sampleExam(bank: Reactivo[], blueprint, rng: Rng): SampledExam
```

- Fisher-Yates sin reemplazo por subárea.
- Filtra por `subarea` directamente (no `officialTag` — modelo v2).
- `rng` inyectado (default `Math.random`) — permite tests deterministas.
- Banco insuficiente en una subárea: usa todos los disponibles + agrega `BankWarning`.
- Banco completamente vacío: lanza `Error('EMPTY_BANK')`.

## SessionConfig y ExamSession

Archivo: `src/domain/exam/session.ts`.

```ts
interface SessionConfig {
  size: 20 | 60 | 125;
  timer: { mode: 'limited'; minutes: number }
       | { mode: 'unlimited' };
}
```

El timer es **configurable y opcional**. Default sugerido: `round((size/125) × 360)` min.
`unlimited` → sin auto-submit; el usuario envía manualmente.

## ScoringPolicy — criterial

Archivo: `src/domain/scoring/scoring-policy.ts`.

- Cada reactivo vale 1 punto (modelo v2 — casos aplanados). Sin respuesta = 0 (REQ-06.4).
- API pública: `scoreQuestion(q: Reactivo, answer)` — exhaustivo sobre los 4 tipos.
- `scoreCaseQuestion` eliminado — ya no existe tipo 'caso'.

## AttemptReport

Archivo: `src/domain/scoring/attempt-report.ts`.

```ts
interface AttemptReport {
  globalScore: ScoreEntry;                           // {correct, total}
  byArea:      ReadonlyMap<AreaCode, ScoreEntry>;
  bySubarea:   ReadonlyMap<SubareaCode, ScoreEntry>;
  bankWarnings: BankWarning[];
}
```

## Attempt — snapshot inmutable

Archivo: `src/domain/attempt/attempt.ts`.

`createAttempt(session, report)` construye un objeto autocontenido e inmutable con snapshot del blueprint, los IDs del examen, el mapa de respuestas y el reporte. Solo los intentos enviados se persisten.
