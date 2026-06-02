# Documentación — simulador-exil

PWA de estudio para el examen EXIL-NEGOCIOS (CENEVAL). Frontend puro, sin backend.

## Índice

| Documento | Qué encontrarás |
|-----------|-----------------|
| [architecture.md](./architecture.md) | Arquitectura hexagonal: las 4 capas, la regla de dependencia, diagrama ASCII |
| [domain-model.md](./domain-model.md) | Modelo de dominio: `Question`, `ExamBlueprint`, `ScoringPolicy`, `Attempt` |
| [content.md](./content.md) | Contrato de contenido: banco JSON, validación, IndexedDB |
| [testing.md](./testing.md) | Estrategia de pruebas: Vitest, dobles de puertos, fake-indexeddb |
| [roadmap.md](./roadmap.md) | Cortes SDD: estado de cada PR y próximas iteraciones |

## Inicio rápido

```bash
npm test          # tests + cobertura
npm run lint      # ESLint (incluye regla de pureza de dominio)
npm run dev       # servidor de desarrollo
```

Ver `package.json` para la lista completa de scripts.
