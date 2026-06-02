# Contrato de contenido

> **Versión**: banco YAML (post-refactor v2). El banco está en formato YAML con comentarios, adapter `YamlContentAdapter`.

## Decisión central

El banco de reactivos es un archivo `.yaml` comentado y embebido en el bundle via Vite `?raw`. El PDF de ejercicios NUNCA se parsea en runtime — solo en build/autoría. La extracción ya se realizó (transcripción asistida del PDF): **128 reactivos** en `banco.yaml`.

## Flujo de contenido

```
assets/guia-ceneval.pdf              (fuente oficial — no toca código)
assets/ejercicios-ejemplos/*.pdf     (banco origen)
         │
         │  transcripción asistida (una vez) → banco.yaml (128 reactivos)
         ▼
src/infrastructure/content/banco.yaml   ← versionado en git, comentado en español
         │
         │  YamlContentAdapter.loadBank()
         ▼
Reactivo[]  (validados, modelo v2)
         │
         │  ContentPort (puerto)
         ▼
casos de uso en application/
```

## Esquema del banco YAML (schemaVersion: 2)

Archivo: `src/infrastructure/content/banco.yaml`.

```yaml
# Banco de reactivos — Simulador EXIL-NEGOCIOS (CENEVAL)
# tipo: directo | completamiento | ordenamiento | relacion
# area: A Administración · B Contabilidad y finanzas · ... · F Derecho
schemaVersion: 2

reactivos:
  # Reactivo simple
  - id: A3-001
    tipo: directo
    area: A                  # Administración
    subarea: A3              # Proceso administrativo
    enunciado: "¿Cuál...?"
    opciones: ["...", "...", "...", "..."]
    correcta: 1
    explicacion: "..."

  # Reactivo de relación (dropdown por fila en la UI)
  - id: D1-001
    tipo: relacion
    area: D
    subarea: D1
    enunciado: "Relaciona..."
    columnaIzquierda: ["Concepto A", "Concepto B"]
    columnaDerecha: ["Def a", "Def b", "Def c"]
    emparejamientos: [[0, 1], [1, 2]]
    explicacion: "..."

  # Reactivo de caso aplanado (multirreactivo desglosado)
  - id: E1-CASO1-q1
    tipo: directo
    area: E
    subarea: E1
    caso: "Contexto del caso compartido, repetido en cada reactivo del mismo caso."
    enunciado: "Pregunta específica del caso"
    opciones: ["...", "...", "...", "..."]
    correcta: 0
    explicacion: "..."
```

### Campos por `tipo`

| `tipo` | Campos adicionales |
|--------|--------------------|
| `directo` | `enunciado`, `opciones[4]`, `correcta: 0-3` |
| `completamiento` | `enunciado`, `opciones[4]`, `correcta: 0-3` |
| `ordenamiento` | `enunciado`, `elementos[]`, `ordenCorrecto[]` |
| `relacion` | `enunciado`, `columnaIzquierda[]`, `columnaDerecha[]`, `emparejamientos[]` |

Campo opcional en todos: `caso` (contexto compartido de multirreactivo).

### Clave de explicación: `explicacion` en YAML, `explanation` en TypeScript

El YAML usa la clave en español (`explicacion`) para legibilidad del banco. `validateQuestion` normaliza automáticamente `explicacion → explanation` al cargar.

### Sin tipo 'caso' en el banco

Los multirreactivos del examen se desglosan en reactivos independientes con `caso`. No existe un tipo `caso` anidado. Esto simplifica el modelo, elimina el cast frágil y hace cada reactivo calificable directamente.

## Validación en YamlContentAdapter

Archivo: `src/infrastructure/content/yaml-content-adapter.ts`.

`validateQuestion(raw)` (del dominio) verifica:

| Error | Causa |
|-------|-------|
| `MISSING_OFFICIAL_TAG` | `area` o `subarea` ausente o no reconocida |
| `INVALID_OPTIONS_COUNT` | T1/T2 sin exactamente 4 opciones no vacías |
| `INVALID_ITEM_TYPE` | `tipo` fuera del conjunto válido |
| `MISSING_REQUIRED_FIELD` | Objeto nulo o falta campo requerido |

Los reactivos que no pasan se **descartan silenciosamente** con `console.warn` — nunca lanzan excepción. El examen se construye solo con los válidos; si ninguno pasa, `sampleExam` lanza `EMPTY_BANK`.

## PWA / Workbox

`banco.yaml` está incluido en `globPatterns: ['**/*.yaml']` y en `runtimeCaching` para `CacheFirst` offline. Configurado en `vite.config.ts`.

## Almacenamiento de intentos (StoragePort / IndexedDB)

Archivo: `src/infrastructure/storage/indexeddb-storage-adapter.ts`.

- Base de datos: `simulador-exil`, store `attempts`, `keyPath: 'id'`.
- `DB_VERSION = 1`; migraciones vía `onupgradeneeded` con switch por versión.
- `Map` se serializa como `Array<[key, value]>` — IndexedDB no almacena `Map`.
- Solo se persisten intentos **enviados** (el objeto `Attempt` con reporte completo).
- La estrategia de versionado está completamente oculta detrás de `StoragePort`. El dominio y la capa de aplicación no conocen IndexedDB.
