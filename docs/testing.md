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

(El smoke de integración del flujo completo sí vive en `src/__tests__/`.)

## Capas y su estrategia

| Capa | Qué se prueba | Herramienta | Notas |
|------|---------------|-------------|-------|
| Dominio puro | Hamilton (suma=size, cero permitido, determinismo, desempate), sampling (déficit, bankWarnings, sin repetición, EMPTY_BANK), scoring (global/área/subárea, null=0), validación de `Reactivo` | Vitest — funciones puras | `rng` inyectado para tests deterministas |
| Casos de uso | `startSimulacro`, `submitAttempt` y `practica` con dobles de puertos | Vitest + `vi.fn()` | El `ContentPort` y `StoragePort` son fakes; nunca se usa el banco real ni IndexedDB |
| Adaptadores | `YamlContentAdapter` con YAML inyectado; `IndexedDbStorageAdapter` con fake-indexeddb | Vitest + `fake-indexeddb` | Cada test usa un `dbName` único para aislar estado |
| Lint arquitectónico | Pureza de dominio: cero imports de `react`, `idb` o DOM | ESLint `no-restricted-imports` | Ejecutar con `npm run lint:domain` |
| UI | `QuestionCard` por tipo (+ modo feedback), `LandingShell`, `SimulacroContainer`, `ReportView`, `Timer`, `PracticaContainer`/`TemaSidebar` | React Testing Library | 167 tests en verde |

## Patrón de dobles de puerto

Los casos de uso reciben sus dependencias por inyección. Un fake mínimo:

```ts
// En start-simulacro.test.ts
function makeFakePort(reactivos: Reactivo[]): ContentPort {
  return { loadBank: vi.fn().mockResolvedValue(reactivos) };
}

const session = await startSimulacro(config, makeFakePort(bank), rngFixed);
```

Nunca se importa `YamlContentAdapter` en tests de casos de uso.

## Patrón fake-indexeddb

```ts
import 'fake-indexeddb/auto';
import { IndexedDbStorageAdapter } from './indexeddb-storage-adapter';

// Nombre de DB único por test para evitar estado compartido
const adapter = new IndexedDbStorageAdapter({ dbName: `test-${crypto.randomUUID()}` });
```

## Strict TDD (estado actual)

El dominio (`src/domain/**`) se construyó con TDD estricto: primero el test, luego la implementación. Los tests de dominio son la especificación ejecutable de las reglas de negocio.
