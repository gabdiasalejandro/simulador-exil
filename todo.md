# TODO — Simulador EXIL

Estado y pendientes para retomar. Última actualización: corte tras `modo-practica`.

## Cómo retomar

```bash
git pull            # siempre antes de empezar/pushear
npm install         # si hay deps nuevas
npm run dev         # http://localhost:5173
npm test            # 167 tests
npm run lint && npm run lint:domain && npx tsc --noEmit
```

Documentación completa en [`docs/`](./docs/). Memoria del proyecto en Engram (decisiones, gotchas) — buscá por `mem_search`.

## Estado actual

| Modo | Estado |
|------|--------|
| Simular | ✅ 185 reactivos, blueprint oficial (125/60/20), timer configurable, reporte criterial con análisis detallado, estado persistido en localStorage (refresh-safe) |
| Practicar | ✅ playground por tema, feedback + explicación inmediata |
| Por tema | ↪️ cubierto por el sidebar de Práctica |
| Revisar | ⏳ pendiente |

Banco: `src/infrastructure/content/banco.yaml` (185 reactivos: 128 transcritos + 57 generados con `origen: generado`, modelo v2).

## Pendientes (prioridad)

- [ ] **Modo Revisar** (alta) — UI de historial de intentos. El `StoragePort`/IndexedDB ya persiste los `Attempt`; falta la pantalla que los liste y muestre desempeño por área.
- [ ] **Resaltado en feedback no-choice** (media) — en práctica, `ordenamiento` y `relacion` muestran correcto/incorrecto + explicación pero NO resaltan la opción correcta. Solo `directo`/`completamiento` lo hacen (`ChoiceRenderer`). Extender `OrderingRenderer`/`RelacionRenderer` con la prop `revealed`.
- [ ] **Revisar reactivos generados** (media) — el banco subió a 185 (+57 con `origen: generado`) para cubrir la cuota oficial por subárea; un simulacro de 125 ya no muestra "banco insuficiente". Falta validación humana del contenido generado (áreas B/C/D/E/F).
- [ ] **Consolidar "Por tema"** (baja) — decidir si el botón se elimina (cubierto por Práctica) o se reusa.
- [ ] **guia-md** (baja) — guía CENEVAL oficial → Markdown navegable dentro de la PWA.
- [ ] **Sesiones gemelas** (baja) — S1=58 / S2=67 y reactivos piloto (modelo ya extensible).

## Limitaciones conocidas

- El PDF de ejercicios no traía reactivos nativos de `ordenamiento`/`relacion`; los 4 de esos tipos son semilla (para probar la UI). Las "relaciona columnas" del PDF venían como opción múltiple → transcritas como `directo`.
- 1 pregunta del PDF (Área 6, caso "Andrea") se omitió: no tenía respuesta marcada en la fuente (no se inventó).
- Mapeos 8→6 con criterio: *Estadística inferencial*→E3; *Habilidades/Competencias profesionales*→A.

## Mapa rápido del código

```
src/
  domain/         puro: question (Reactivo v2), exam (blueprint+Hamilton), scoring, attempt, taxonomy
  application/    ports (ContentPort, StoragePort) + use-cases (start-simulacro, submit-attempt, practica)
  infrastructure/ content (YamlContentAdapter + banco.yaml), storage (IndexedDbStorageAdapter)
  ui/             atoms, molecules (QuestionCard, NavGrid), features (landing, simulacro, practica)
```

## Convenciones del repo

- Flujo git: trabajar en rama → **merge local a `main`** → push (sin PRs). `git pull` antes de pushear.
- Commits convencionales, **sin** `Co-Authored-By` ni atribución de IA.
- Todo en **es-MX**. Build NO se corre (`npm run build` evitado); sí tests/lint/tsc.
- Arquitectura hexagonal: el dominio no importa UI ni infra (verificado por `lint:domain`).
