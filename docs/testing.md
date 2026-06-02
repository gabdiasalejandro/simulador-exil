# Estrategia de pruebas

## Comandos

```bash
npm test                # vitest run (una vez)
npm run test:watch      # vitest en modo watch
npm run test:coverage   # vitest con cobertura v8
npm run lint            # ESLint sobre src/
npm run lint:domain     # solo src/domain/ — verifica pureza de imports
```

## Convención de co-locación

Los tests viven al lado del archivo que prueban:

```
src/domain/exam/
  blueprint.ts
  blueprint.test.ts   ← co-ubicado
  sampling.ts
  sampling.test.ts
```

No hay directorio `__tests__` separado.

## Capas y su estrategia

| Capa | Qué se prueba | Herramienta | Notas |
|------|---------------|-------------|-------|
| Dominio puro | Hamilton (suma=size, cero permitido, determinismo, desempate), sampling (déficit, bankWarnings, sin repetición, EMPTY_BANK), scoring (global/área/subárea, T5 N-pts, null=0), validación de Question | Vitest — funciones puras | `rng` inyectado para tests deterministas |
| Casos de uso | `startSimulacro` y `submitAttempt` con dobles de puertos | Vitest + `vi.fn()` | El `ContentPort` y `StoragePort` son fakes; nunca se usa JSON real ni IndexedDB |
| Adaptadores | `JsonContentAdapter` con datos inyectados; `IndexedDbStorageAdapter` con fake-indexeddb | Vitest + `fake-indexeddb` | Cada test usa un `dbName` único para aislar estado |
| Lint arquitectónico | Pureza de dominio: cero imports de `react`, `idb` o DOM | ESLint `no-restricted-imports` | Ejecutar con `npm run lint:domain` |
| UI (planeado, PR3) | `QuestionView` por tipo, `LandingShell` 4 botones, timer, auto-submit | React Testing Library | No implementado aún |

## Patrón de dobles de puerto

Los casos de uso reciben sus dependencias por inyección. Un fake mínimo:

```ts
// En start-simulacro.test.ts
function makeFakePort(questions: DirectQuestion[]): ContentPort {
  return { loadBank: vi.fn().mockResolvedValue(questions) };
}

const session = await startSimulacro(config, makeFakePort(bank), rngFixed);
```

Nunca se importa `JsonContentAdapter` en tests de casos de uso.

## Patrón fake-indexeddb

```ts
import 'fake-indexeddb/auto';
import { IndexedDbStorageAdapter } from './indexeddb-storage-adapter';

// Nombre de DB único por test para evitar estado compartido
const adapter = new IndexedDbStorageAdapter({ dbName: `test-${crypto.randomUUID()}` });
```

## Strict TDD (estado actual)

El dominio (`src/domain/**`) se construyó con TDD estricto: primero el test, luego la implementación. Los tests de dominio son la especificación ejecutable de las reglas de negocio.
