# Modelo de dominio

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

## Question — unión discriminada por `itemType`

Archivo: `src/domain/question/question.ts`.

```ts
type Question = LeafQuestion | CaseQuestion;

type LeafQuestion =
  | DirectQuestion     // T1: cuestionamiento directo
  | CompletionQuestion // T2: completamiento
  | OrderingQuestion   // T3: ordenamiento
  | ColumnMatchQuestion; // T4: relación de columnas

interface CaseQuestion extends BaseQuestion {
  itemType: 'case'; // T5: multirreactivo
  caseStem: string;
  subQuestions: ReadonlyArray<SubQuestion>; // nunca anida otro T5
}
```

Todos los tipos comparten `BaseQuestion`:

```ts
interface BaseQuestion {
  id: string;
  officialTag: { area: AreaCode; subarea: SubareaCode }; // autoridad del blueprint
  originTag:   { area: string;   subarea: string };       // metadato del PDF (8 áreas)
  explanation: string;
}
```

### Por qué unión discriminada (y no clases)

- Serializable desde JSON sin constructores.
- `switch(q.itemType)` + `assertNever` garantizan exhaustividad en tiempo de compilación.
- Scoring y rendering viven FUERA del tipo — son políticas inyectables.

### Respuestas (`src/domain/question/answer.ts`)

| Tipo de reactivo | `Answer` |
|-----------------|----------|
| T1/T2 (direct/completion) | `{ kind: 'choice'; index: number }` |
| T3 (ordering) | `{ kind: 'order'; sequence: number[] }` |
| T4 (match) | `{ kind: 'match'; pairs: [number, number][] }` |
| T5 (case) | `{ kind: 'case'; answers: (LeafAnswer \| null)[] }` |
| Sin responder | `null` |

### Conteo de reactivos por `Question`

Un `CaseQuestion` con N sub-preguntas aporta N reactivos al conteo del examen (no 1).
`getItemCount(q: Question): number` en `question.ts` encapsula esta regla.

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
sampleExam(bank: Question[], blueprint, rng: Rng): SampledExam
```

- Fisher-Yates sin reemplazo por subárea.
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

- Cada reactivo vale 1 punto; sin respuesta = 0 (REQ-06.4).
- `CaseQuestion` con N sub-preguntas aporta hasta N puntos.
- Funciones puras por tipo: `scoreChoice`, `scoreOrder`, `scoreMatch`.
- API pública: `scoreQuestion(q, answer)` y `scoreCaseQuestion(q, answers)`.

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
