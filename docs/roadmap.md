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

## Estado general

```
mvp-simulacro-core
  PR1 dominio          ✅
  PR2 app + infra      ✅
  PR3 ui               [ ] planeado

extraccion-banco       [ ] planeado
modo-practica          [ ] planeado
por-tema-revisar       [ ] planeado
guia-md                [ ] planeado
```
