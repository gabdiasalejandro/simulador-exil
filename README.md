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
| **Simular** | Examen cronometrado con la distribución oficial (125 / 60 / 20), sin feedback hasta enviar. Reporte criterial por área en **bento grid**: veredicto, aciertos/errores/sin responder/tiempo, fortaleza y área a reforzar, y revisión reactivo por reactivo en una vista aparte. Si refrescas a mitad de un simulacro, **se reanuda en el punto exacto** donde ibas. |
| **Practicar** | Reactivos por tema (sidebar por área → subárea) con feedback y explicación inmediata tras cada respuesta. Sin tiempo. |
| **Revisar** | _(próximamente)_ Historial de intentos y progreso por área a lo largo del tiempo. Los intentos ya se guardan; falta la pantalla. |

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
  domain/          Lógica pura: Reactivo (unión por tipo), blueprint + sampling (Hamilton), scoring, Attempt, taxonomy
  application/     Casos de uso + puertos (ContentPort, StoragePort)
  infrastructure/  Adaptadores: contenido YAML, IndexedDB (intentos finalizados),
                   localStorage (simulacro en curso, refresh-safe)
  ui/              React (atoms/molecules + features)
```

**Contrato de contenido — importante:** el banco de preguntas es un **`.yaml` comentado y
versionado** (`src/infrastructure/content/banco.yaml`), embebido en el bundle vía Vite
`?raw`. El PDF **nunca** se parsea en runtime: la transcripción se hizo una sola vez en
autoría. Hoy el banco tiene **185 reactivos** = 128 transcritos del PDF de preparación +
57 generados con apoyo de IA (marcados `origen: generado`) para cubrir la cuota oficial
por subárea. La app solo lee el YAML vía `ContentPort`.

```
PDF ──(transcripción asistida, una vez)──> banco.yaml ──(commit)──> app lee YAML ──> dominio
```

El progreso del usuario vive en el navegador: los **intentos finalizados** en IndexedDB
(vía `StoragePort`) y el **simulacro en curso** en localStorage (para sobrevivir un refresh).

La documentación detallada de cómo se organiza todo vive en [`docs/`](./docs/).

## Estado y roadmap

Construido con SDD (Spec-Driven Development), en cortes revisables:

| # | Corte | Estado |
|---|-------|--------|
| 1 | `mvp-simulacro-core` — toolchain + dominio + modo Simular | ✅ |
| 2 | `extraccion-banco` — transcripción PDF → `banco.yaml` | ✅ |
| 3 | `modo-practica` — feedback + explicación | ✅ |
| 4 | `banco-185` — +57 reactivos generados (cuota oficial por subárea) | ✅ |
| 5 | `reporte-analisis` — análisis detallado en bento grid | ✅ |
| 6 | `persistencia-simulacro` — localStorage refresh-safe + auto-reanudar | ✅ |
| 7 | `modo-revisar` — historial de intentos y progreso por área | ⏳ |
| 8 | `guia-md-referencia` — guía oficial → `.md` navegable | ⏳ |

Detalle vivo en [`docs/roadmap.md`](./docs/roadmap.md) y [`todo.md`](./todo.md). Suite en
**173 tests** (`npm test`), con `tsc` y `lint` en verde.

## Stack

Vite · TypeScript (strict) · React · Tailwind CSS v4 · Vitest + Testing Library ·
ESLint + Prettier · PWA (vite-plugin-pwa) · IndexedDB + localStorage.

## Licencia

[MIT](./LICENSE). Material de estudio de uso libre; los reactivos marcados
`origen: generado` deben revisarse antes de tomarse como definitivos.
