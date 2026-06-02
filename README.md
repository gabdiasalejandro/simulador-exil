# Simulador EXIL · Negocios

Plataforma web de estudio para presentar el **EXIL-NEGOCIOS** (Examen Intermedio de
Licenciatura en Negocios de CENEVAL). Simula el examen con fidelidad a la guía oficial,
practica con explicaciones y mide tu desempeño por área para llegar mejor preparado al
examen real.

Funciona **offline** (PWA), es de **un solo usuario** y **no requiere backend**: todo
corre en tu navegador y tu progreso se guarda localmente.

## Qué es el EXIL-NEGOCIOS

Examen de CENEVAL de **125 reactivos** de opción múltiple (4 opciones, una correcta),
distribuidos en **2 sesiones de 3 horas**. Es **criterial**: te mide contra un estándar,
no contra otros sustentantes. Se organiza en **6 áreas** (Administración, Contabilidad y
finanzas, Economía, Mercadotecnia, Matemáticas y estadística, Derecho).

## Modos de estudio

| Modo | Qué hace |
|------|----------|
| **Simular** | Examen cronometrado con la distribución oficial (125 / 60 / 20). Sin feedback hasta enviar. Reporte criterial por área y subárea. |
| **Practicar** | Reactivos con feedback y explicación inmediata después de responder. |
| **Por tema** | Navega el banco filtrando por área → subárea. |
| **Revisar** | Historial de intentos y desempeño por área. |

## Cómo correr

> Requiere Node 18+.

```bash
npm install      # instala dependencias
npm run dev      # servidor de desarrollo (Vite)
npm test         # corre la suite (Vitest)
```

| Script | Para qué |
|--------|----------|
| `npm run dev` | Desarrollo con HMR |
| `npm test` | Tests una vez |
| `npm run test:watch` | Tests en watch |
| `npm run test:coverage` | Cobertura |
| `npm run lint` | ESLint sobre `src/` |
| `npm run lint:domain` | Verifica la pureza del dominio (sin imports de UI/infra) |
| `npm run build` | `tsc --noEmit` + build de producción |

## Arquitectura

Arquitectura **hexagonal** (puertos y adaptadores). El dominio es puro y no conoce a
React ni a la base de datos; todo lo externo entra por un puerto.

```
src/
  domain/          Lógica pura: Question, ExamBlueprint, sampling, ScoringPolicy, Attempt
  application/     Casos de uso + puertos (ContentPort, StoragePort)
  infrastructure/  Adaptadores: JSON de contenido, IndexedDB de progreso
  ui/              React (atoms/molecules + features)
```

**Contrato de contenido — importante:** el banco de preguntas es un **`.json` versionado**
en el repo, no se extrae del PDF en runtime. El PDF se parsea **una sola vez** con un
script de build que genera ese JSON; la app desplegada solo lee el JSON (vía
`ContentPort`). El progreso del usuario vive en IndexedDB (vía `StoragePort`).

```
PDF ──(script dev, una vez)──> bank.json ──(commit)──> app lee JSON ──> dominio
```

La documentación detallada de cómo se organiza todo vive en [`docs/`](./docs/).

## Estado y roadmap

Construido con SDD (Spec-Driven Development), en cortes revisables:

| # | Corte | Estado |
|---|-------|--------|
| 1 | `mvp-simulacro-core` — toolchain + dominio + modo Simular | 🚧 en progreso |
| 2 | `extraccion-banco` — script PDF → `bank.json` | ⏳ |
| 3 | `modo-practica` — feedback + explicación | ⏳ |
| 4 | `modo-por-tema` y `revisar` | ⏳ |
| 5 | `guia-md-referencia` — guía oficial → `.md` | ⏳ |

## Stack

Vite · TypeScript (strict) · React · Vitest + Testing Library · ESLint + Prettier ·
PWA (vite-plugin-pwa) · IndexedDB.
