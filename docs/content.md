# Contrato de contenido

## Decisión central

El banco de preguntas es un archivo `.json` versionado y embebido en el bundle. El PDF de ejercicios NUNCA se parsea en runtime — solo en build time (paso de extracción manual hoy, automatizado en un corte futuro).

## Flujo de contenido

```
assets/guia-ceneval.pdf  (fuente oficial — no toca código)
assets/ejercicios.pdf    (banco origen — 8 áreas)
         │
         │  extracción manual (hoy) / pipeline futuro
         ▼
src/infrastructure/content/seed-bank.json   ← versionado en git
         │
         │  JsonContentAdapter.loadBank()
         ▼
Question[]  (validados, officialTag mapeado)
         │
         │  ContentPort (puerto)
         ▼
casos de uso en application/
```

## Esquema del banco JSON

Archivo: `src/infrastructure/content/seed-bank.json`.

```json
{
  "schemaVersion": 1,
  "questions": [
    {
      "id": "seed-d-a1-001",
      "itemType": "direct",
      "stem": "¿Cuál enunciado describe mejor la función de planeación?",
      "options": ["...", "...", "...", "..."],
      "correctIndex": 1,
      "explanation": "La planeación consiste en fijar objetivos...",
      "officialTag": { "area": "A", "subarea": "A3" },
      "originTag": { "area": "Administración y gestión", "subarea": "Proceso administrativo" }
    }
  ]
}
```

Campo `schemaVersion` permite detectar migraciones de formato.

### Campos por `itemType`

| `itemType` | Campos adicionales |
|------------|--------------------|
| `direct` | `stem`, `options[4]`, `correctIndex` |
| `completion` | `stem`, `options[4]`, `correctIndex` |
| `ordering` | `stem`, `items[]`, `correctOrder[]` |
| `match` | `stem`, `leftColumn[]`, `rightColumn[]`, `correctMatches[]` |
| `case` | `caseStem`, `subQuestions[]` (cada uno es una LeafQuestion sin campos base) |

## Mapeo de taxonomía

Cada reactivo tiene dos etiquetas:

| Campo | Significado | Autoridad |
|-------|-------------|-----------|
| `officialTag` | Área y subárea según guía CENEVAL (6 áreas / 20 subáreas) | Blueprint del examen |
| `originTag` | Área y subárea según el PDF de ejercicios (8 áreas) | Metadato de trazabilidad |

El mapeo 8 áreas → 6 áreas ocurre en el adaptador de extracción/contenido, **nunca en el dominio**. En el `seed-bank.json` actual ambas etiquetas ya están alineadas manualmente.

## Validación en JsonContentAdapter

Archivo: `src/infrastructure/content/json-content-adapter.ts`.

`validateQuestion(raw)` (del dominio) verifica:

| Error | Causa |
|-------|-------|
| `MISSING_OFFICIAL_TAG` | `officialTag` ausente, área o subárea no reconocida |
| `INVALID_OPTIONS_COUNT` | T1/T2 sin exactamente 4 opciones non-vacías |
| `INVALID_ITEM_TYPE` | `itemType` fuera del conjunto válido |
| `MISSING_REQUIRED_FIELD` | Objeto nulo o falta campo requerido |

Los reactivos que no pasan se **descartan silenciosamente** con `console.warn` — nunca lanzan excepción. El examen se construye solo con los válidos; si ninguno pasa, `sampleExam` lanza `EMPTY_BANK`.

## Almacenamiento de intentos (StoragePort / IndexedDB)

Archivo: `src/infrastructure/storage/indexeddb-storage-adapter.ts`.

- Base de datos: `simulador-exil`, store `attempts`, `keyPath: 'id'`.
- `DB_VERSION = 1`; migraciones vía `onupgradeneeded` con switch por versión.
- `Map` se serializa como `Array<[key, value]>` — IndexedDB no almacena `Map`.
- Solo se persisten intentos **enviados** (el objeto `Attempt` con reporte completo).
- La estrategia de versionado está completamente oculta detrás de `StoragePort`. El dominio y la capa de aplicación no conocen IndexedDB.
