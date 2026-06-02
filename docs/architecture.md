# Arquitectura hexagonal

## Decisión central

El dominio NO importa nada externo. Todo lo que necesita el exterior entra por **puertos** (interfaces). Los adaptadores implementan esos puertos; la UI orquesta casos de uso. Esta regla es verificable por ESLint (`lint:domain`).

## Las 4 capas

| Capa | Responsabilidad | Ejemplos reales |
|------|-----------------|-----------------|
| `domain` | Tipos, reglas de negocio, algoritmos — sin dependencias externas | `question.ts`, `blueprint.ts`, `scoring-policy.ts`, `attempt.ts` |
| `application` | Puertos (interfaces) y casos de uso que los orquestan | `ContentPort`, `StoragePort`, `start-simulacro.ts`, `submit-attempt.ts` |
| `infrastructure` | Adaptadores concretos que implementan los puertos | `JsonContentAdapter`, `IndexedDbStorageAdapter`, `seed-bank.json` |
| `ui` | React — solo render y manejo de eventos, cero reglas de negocio | `App.tsx` (stub hoy; `SimulacroContainer` planeado en PR3) |

## Regla de dependencia

Las capas internas NUNCA importan capas externas. El dominio no sabe que existe React ni IndexedDB.

```
ui
 └─ llama casos de uso
     application (ports + use-cases)
      └─ consume puertos (interfaces)
          domain (puro)
      └─ implementados por
          infrastructure (adaptadores)
```

### Diagrama ASCII

```
┌─────────────────────────────────────────────────────┐
│  ui (React)                                          │
│  ┌──────────────────────────────────────────────┐   │
│  │  application                                  │   │
│  │  ┌─────────────────────────────────────────┐ │   │
│  │  │  domain (puro — sin imports externos)   │ │   │
│  │  └─────────────────────────────────────────┘ │   │
│  │  ports: ContentPort, StoragePort             │   │
│  │  use-cases: StartSimulacro, SubmitAttempt    │   │
│  └──────────────────────────────────────────────┘   │
│                           ▲                          │
│  infrastructure           │ implementa puertos       │
│  JsonContentAdapter ──────┤                          │
│  IndexedDbStorageAdapter ─┘                          │
└─────────────────────────────────────────────────────┘
```

## Flujo de una sesión de simulacro

```
UI → startSimulacro(config, ContentPort)
         ↓ ContentPort.loadBank()
         ↓ computeBlueprint(size)       [domain]
         ↓ sampleExam(bank, blueprint)  [domain]
       ExamSession ←──────────────────────────────

Usuario responde → submitAttempt(session, StoragePort)
         ↓ buildReport(exam, answers)   [domain]
         ↓ createAttempt(session, report) [domain]
         ↓ StoragePort.saveAttempt(attempt)
       Attempt (con reporte) ←──────────────────────
```

## Por qué hexagonal (y no otra cosa)

| Decisión | Elegido | Rechazado | Razón |
|----------|---------|-----------|-------|
| Modelo de dominio | Union discriminada + funciones puras | Clases con métodos | Serializable desde JSON, exhaustivo con `assertNever`, sin acoplamiento |
| Polimorfismo de scoring | Registro por `itemType` inyectable | Método en cada tipo de `Question` | `ScoringPolicy` es política aislada, extensible sin tocar `Question` |
| Acceso a contenido | `ContentPort` desde el día 1 | Import directo de JSON en dominio/app | Hoy JSON estático, mañana API sin tocar dominio |
| Migraciones IDB | Ocultas dentro de `IndexedDbStorageAdapter` | Esquema expuesto al dominio | Dominio y app no conocen IndexedDB |
