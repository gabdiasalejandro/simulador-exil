# Modo práctica (playground)

## Qué es

El modo práctica es un playground de estudio libre. A diferencia del modo Simular (que aplica un examen completo con timer y genera un reporte criterial), el modo práctica:

- No tiene timer.
- No aplica blueprint ni selecciona reactivos proporcionales.
- No genera reporte criterial al final.
- Muestra **feedback inmediato** (correcto/incorrecto + explicación) tras cada respuesta.
- Permite al estudiante elegir el tema (área o subárea) de lo que quiere practicar.

Es ideal para repasar temas específicos donde el estudiante siente que necesita reforzar.

## Flujo de usuario

```
Landing → clic en "Practicar"
  → PracticaContainer (sidebar + panel)
    → Sidebar: seleccionar área o subárea
    → Panel: un reactivo aleatorio del tema aparece
    → Estudiante elige opción → clic en "Verificar respuesta"
    → Feedback inmediato: ✓ Correcto / ✗ Incorrecto + explicación
    → Clic en "Siguiente reactivo →" → nuevo reactivo aleatorio del mismo tema
    → … (ciclo continuo sin fin)
  → Clic en "← Volver" → regresa al Landing
```

## Diferencias clave vs. Simular

| Característica | Simular | Practicar |
|----------------|---------|-----------|
| Timer | Sí (limitado o sin límite) | No |
| Blueprint proporcional | Sí (Hamilton) | No |
| Selección de tema | No (examen completo) | Sí (área + subárea opcional) |
| Feedback inmediato | No (al final) | Sí (tras cada respuesta) |
| Reporte criterial | Sí | No |
| Número de reactivos | Fijo (20/60/125) | Ilimitado (cicla por el tema) |

## Caso de uso: `cargarPractica`

Ubicación: `src/application/use-cases/practica.ts`

```
cargarPractica(filtro, port, rng?) → PracticaSession
```

- Carga el banco completo via `ContentPort.loadBank()`.
- Filtra por `filtro.area` (obligatorio) y `filtro.subarea` (opcional).
- Mezcla con Fisher-Yates (misma lógica que el sampler del simulacro).
- `rng` es inyectable para tests deterministas.
- Si no hay reactivos → retorna `reactivos: []` (la UI muestra el aviso, no lanza error).

## Caso de uso: `evaluarRespuesta`

```
evaluarRespuesta(reactivo, respuesta) → FeedbackResult
```

Función pura. Delega en `scoreQuestion` (dominio) para evaluar la respuesta. Retorna:

```ts
{
  correcto: boolean;    // true si puntuacion === 1
  puntuacion: 0 | 1;   // resultado del dominio
  explicacion: string;  // reactivo.explanation
}
```

El dominio permanece puro — no hay lógica de puntuación en la UI.

## Componentes UI

Todos en `src/ui/features/practica/`:

### `TemaSidebar`

Componente presentacional. Lista las 6 áreas por nombre completo (nunca códigos). Al expandir un área muestra sus subáreas + "Todas las subáreas". Props:

- `seleccion`: tema activo (área + subárea opcional)
- `areaExpandida`: área desplegada
- `onExpandir`: callback para colapsar/expandir
- `onSeleccionar`: callback con el tema elegido

### `PracticaContainer`

Container del flujo completo. Gestiona:

- Estado de la sesión (idle / loading / active / empty / error).
- Llamada a `cargarPractica` al seleccionar tema.
- Captura de respuesta → confirmación → feedback.
- Contador de sesión (aciertos / respondidos).
- Navegación al siguiente reactivo.

### QuestionCard en modo feedback

`QuestionCard` (en `src/ui/molecules/QuestionCard/`) acepta una prop opcional `feedback?: FeedbackState`. Cuando está presente:

- Las opciones quedan deshabilitadas.
- La opción correcta se resalta en verde.
- La opción seleccionada incorrecta se resalta en rojo.
- Un bloque debajo muestra "¡Correcto!" o "Incorrecto" + la explicación.

Este modo es usado exclusivamente por el modo práctica. En el simulacro no se usa (las opciones siempre están activas mientras dura el examen).

## Tests

| Archivo | Qué prueba |
|---------|------------|
| `src/application/use-cases/practica.test.ts` | Filtrado por área/subárea, aleatoriedad determinista, evaluarRespuesta |
| `src/ui/features/practica/PracticaContainer.test.tsx` | Sidebar, carga de tema, feedback correcto/incorrecto, siguiente reactivo, botón volver |
