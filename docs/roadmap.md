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
banco-185                ✅ fusionado   (+57 reactivos generados, cuota oficial por subárea)
reporte-analisis         ✅ fusionado   (reporte en bento grid, revisión en vista aparte)
persistencia-simulacro   ✅ fusionado   (localStorage refresh-safe + auto-reanudar)
rediseño-ui/landing      ✅ fusionado   (paleta crema, landing sobria, card de pregunta unificada)
por-tema                 ↪️ cubierto por el sidebar de Práctica
modo-revisar             [ ] pendiente  (historial de intentos)
guia-md                  [ ] pendiente  (guía oficial → Markdown navegable)
```

## Modos del simulador

| Modo | Estado | Notas |
|------|--------|-------|
| **Simular** | ✅ | 185 reactivos, blueprint oficial (125/60/20, Hamilton), timer configurable, reporte criterial por área en bento grid (veredicto, aciertos/errores/tiempo, fortaleza/refuerzo, revisión por reactivo en vista aparte). Estado persistido en localStorage: refresh-safe y auto-reanuda al cargar la app |
| **Practicar** | ✅ | Playground: sidebar por tema → reactivos aleatorios con feedback y explicación inmediata |
| **Por tema** | ↪️ | Prácticamente cubierto por el sidebar de Práctica; evaluar si el botón se fusiona o se elimina |
| **Revisar** | ⏳ | Historial de intentos persistidos (StoragePort ya guarda los `Attempt`); falta la UI |

## Pendientes y siguientes pasos

| Ítem | Descripción | Prioridad |
|------|-------------|-----------|
| **Modo Revisar** | UI de historial: listar `Attempt` guardados, ver desempeño por área. El `StoragePort`/IndexedDB ya persiste los intentos. | Alta |
| **Resaltado en feedback no-choice** | En modo práctica, `ordenamiento` y `relacion` muestran correcto/incorrecto + explicación pero NO resaltan la respuesta correcta (solo `directo`/`completamiento` lo hacen). | Media |
| **Ampliar banco** | ✅ Banco a 185 reactivos: +57 generados (`origen: generado`) para llevar cada subárea a su cuota oficial; un simulacro de 125 ya no muestra "banco insuficiente". Pendiente: revisión humana del contenido generado. | Media |
| **Tech-debt scoring** | Resuelto al aplanar casos (eliminado el cast `as LeafQuestion`). Sin acción pendiente. | — |
| **Consolidar "Por tema"** | Decidir si el botón "Por tema" se elimina (cubierto por Práctica) o se reusa para otra cosa. | Baja |
| **guia-md** | Convertir la guía CENEVAL oficial a Markdown navegable dentro de la PWA. | Baja |
| **Sesiones gemelas** | Sesiones oficiales S1=58 / S2=67 y reactivos piloto (hoy fuera de alcance; el modelo es extensible). | Baja |

## Distribución actual del banco (185 reactivos)

| Área | Reactivos | Transcritos | Generados |
|------|-----------|-------------|-----------|
| A · Administración | 40 | 40 | 0 |
| E · Matemáticas y estadística | 50 | 41 | 9 |
| B · Contabilidad y finanzas | 27 | 17 | 10 |
| C · Economía | 23 | 8 | 15 |
| D · Mercadotecnia | 23 | 11 | 12 |
| F · Derecho | 22 | 11 | 11 |

Todas las subáreas alcanzan o superan su cuota oficial (ver `taxonomy.ts`).

Los 57 reactivos generados llevan `origen: generado` en `banco.yaml`; el resto es transcripción
fiel del PDF de preparación. Los generados deben revisarse antes de tomarse como definitivos.

Tipos: `directo` 181, `ordenamiento` 2, `relacion` 2 (los 4 no-`directo` son semilla).
