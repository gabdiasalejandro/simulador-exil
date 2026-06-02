# Roadmap

## Estado general

```
mvp-simulacro-core
  PR1 dominio puro       ✅ fusionado
  PR2 app + infra        ✅ fusionado
  PR3 ui                 ✅ fusionado
refactor-modelo-yaml-ui  ✅ fusionado   (banco YAML v2, casos aplanados, UI mejorada)
extraccion-banco         ✅ fusionado   (128 reactivos transcritos del PDF)
modo-practica            ✅ fusionado   (playground por tema, feedback inmediato)
por-tema                 ↪️ cubierto por el sidebar de Práctica
modo-revisar             [ ] pendiente  (historial de intentos)
guia-md                  [ ] pendiente  (guía oficial → Markdown navegable)
```

## Modos del simulador

| Modo | Estado | Notas |
|------|--------|-------|
| **Simular** | ✅ | 128 reactivos, blueprint oficial (125/60/20, Hamilton), timer configurable, reporte criterial por área/subárea |
| **Practicar** | ✅ | Playground: sidebar por tema → reactivos aleatorios con feedback y explicación inmediata |
| **Por tema** | ↪️ | Prácticamente cubierto por el sidebar de Práctica; evaluar si el botón se fusiona o se elimina |
| **Revisar** | ⏳ | Historial de intentos persistidos (StoragePort ya guarda los `Attempt`); falta la UI |

## Pendientes y siguientes pasos

| Ítem | Descripción | Prioridad |
|------|-------------|-----------|
| **Modo Revisar** | UI de historial: listar `Attempt` guardados, ver desempeño por área. El `StoragePort`/IndexedDB ya persiste los intentos. | Alta |
| **Resaltado en feedback no-choice** | En modo práctica, `ordenamiento` y `relacion` muestran correcto/incorrecto + explicación pero NO resaltan la respuesta correcta (solo `directo`/`completamiento` lo hacen). | Media |
| **Ampliar banco** | Con 128 reactivos y distribución desigual (C=8, D=11…), un simulacro de 125 todavía muestra "banco insuficiente" en subáreas flacas. Sumar fuentes para cubrir el blueprint completo. | Media |
| **Tech-debt scoring** | Resuelto al aplanar casos (eliminado el cast `as LeafQuestion`). Sin acción pendiente. | — |
| **Consolidar "Por tema"** | Decidir si el botón "Por tema" se elimina (cubierto por Práctica) o se reusa para otra cosa. | Baja |
| **guia-md** | Convertir la guía CENEVAL oficial a Markdown navegable dentro de la PWA. | Baja |
| **Sesiones gemelas** | Sesiones oficiales S1=58 / S2=67 y reactivos piloto (hoy fuera de alcance; el modelo es extensible). | Baja |

## Distribución actual del banco (128 reactivos)

| Área | Reactivos |
|------|-----------|
| A · Administración | 40 |
| E · Matemáticas y estadística | 41 |
| B · Contabilidad y finanzas | 17 |
| D · Mercadotecnia | 11 |
| F · Derecho | 11 |
| C · Economía | 8 |

Tipos: `directo` 124, `ordenamiento` 2, `relacion` 2 (los 4 no-`directo` son semilla; el PDF no traía nativos de esos tipos).
