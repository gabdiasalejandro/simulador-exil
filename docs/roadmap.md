# Roadmap

## Cambio en curso: `mvp-simulacro-core`

Corte vertical que demuestra la arquitectura hexagonal de extremo a extremo. Único modo funcional: **Simular**.

### PRs del corte

| PR | Alcance | Estado |
|----|---------|--------|
| PR1 — dominio puro | `taxonomy`, `question`, `exam` (blueprint + sampling + session), `scoring`, `attempt` | ✅ Fusionado |
| PR2 — application + infrastructure | Puertos (`ContentPort`, `StoragePort`), casos de uso (`start-simulacro`, `submit-attempt`), adaptadores (`JsonContentAdapter`, `IndexedDbStorageAdapter`), banco semilla (`seed-bank.json`) | ✅ Fusionado |
| PR3 — UI | `SimulacroContainer`, `LandingShell`, `QuestionView` (1 renderer por tipo de reactivo), `NavGrid`, `ReportView`, `Timer`; shell React completo; tests RTL | Planeado |

### Fuera del alcance de `mvp-simulacro-core`

- Pipeline de extracción automática del PDF de ejercicios (mapeo 8 áreas → 6 áreas automatizado).
- Modo Práctica (con retroalimentación y solución paso a paso).
- Modo Por tema.
- Modo Revisar / historial de intentos.
- Sesiones gemelas oficiales (S1=58 / S2=67) y reactivos piloto.

## Cambios futuros planificados

| Cambio | Descripción | Dependencias |
|--------|-------------|--------------|
| `extraccion-banco` | Pipeline build-time para parsear el PDF de ejercicios y generar `seed-bank.json` con banco completo | `mvp-simulacro-core` completo |
| `modo-practica` | Práctica con feedback inmediato y solución por reactivo | `extraccion-banco` |
| `por-tema-revisar` | Modo Por tema y Modo Revisar (historial de intentos) | `modo-practica` |
| `guia-md` | Conversión de la guía CENEVAL a Markdown navegable dentro de la PWA | Independiente |

## Cambio completado: `modo-practica`

Playground de estudio por tema con feedback inmediato. Construido encima de `mvp-simulacro-core` (banco YAML v2, modelo de dominio v2).

| Entregable | Descripción | Estado |
|------------|-------------|--------|
| `cargarPractica` (use case) | Filtra banco por área/subárea, mezcla con Fisher-Yates | ✅ |
| `evaluarRespuesta` (use case) | Delega en `scoreQuestion` del dominio para feedback | ✅ |
| `QuestionCard` modo feedback | Prop `feedback?` revela correcta/incorrecta + explicación | ✅ |
| `TemaSidebar` | Lista 6 áreas + subáreas, colapsable | ✅ |
| `PracticaContainer` | Container completo: sidebar + panel + contador de sesión | ✅ |
| Wiring en `App.tsx` | Vista `practica` + LandingShell botón activo | ✅ |
| Docs | `docs/modo-practica.md` | ✅ |

## Estado general

```
mvp-simulacro-core
  PR1 dominio          ✅
  PR2 app + infra      ✅
  PR3 ui               ✅ (fusionado)
  Refactor v2 (YAML)   ✅ (fusionado)

extraccion-banco       [ ] planeado
modo-practica          ✅ implementado (feat/modo-practica)
por-tema-revisar       [ ] planeado
guia-md                [ ] planeado
```
