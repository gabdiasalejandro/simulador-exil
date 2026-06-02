import { describe, it, expect, vi } from 'vitest';
import { cargarPractica, evaluarRespuesta } from './practica';
import type { ContentPort } from '../ports/content-port';
import type { ReactivoDirecto } from '../../domain/question/question';
import type { ChoiceAnswer } from '../../domain/question/answer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReactivo(
  id: string,
  area: 'A' | 'B' | 'C' | 'D' | 'E' | 'F',
  subarea: 'A1' | 'A2' | 'B1' | 'C1' | 'D1' | 'E1' | 'F1',
  correcta: 0 | 1 | 2 | 3 = 1,
): ReactivoDirecto {
  return {
    id,
    tipo: 'directo',
    area,
    subarea,
    enunciado: `Enunciado ${id}`,
    opciones: ['A', 'B', 'C', 'D'],
    correcta,
    explanation: `Explicación de ${id}`,
  };
}

function makeFakePort(reactivos: ReactivoDirecto[]): ContentPort {
  return {
    loadBank: vi.fn().mockResolvedValue(reactivos),
  };
}

/** rng fija que devuelve siempre 0 → sin cambio de orden real */
const rngCero = () => 0;
/** rng fija que devuelve 0.5 */
const rngMedio = () => 0.5;

// ---------------------------------------------------------------------------
// Tests: cargarPractica
// ---------------------------------------------------------------------------

describe('cargarPractica — filtrado por área', () => {
  it('retorna solo los reactivos del área solicitada', async () => {
    const banco = [
      makeReactivo('A1-1', 'A', 'A1'),
      makeReactivo('A1-2', 'A', 'A2'),
      makeReactivo('B1-1', 'B', 'B1'),
    ];
    const port = makeFakePort(banco);

    const session = await cargarPractica({ area: 'A' }, port, rngCero);

    expect(session.reactivos).toHaveLength(2);
    expect(session.reactivos.every((r) => r.area === 'A')).toBe(true);
  });

  it('retorna arreglo vacío si no hay reactivos del área', async () => {
    const banco = [makeReactivo('B1-1', 'B', 'B1')];
    const port = makeFakePort(banco);

    const session = await cargarPractica({ area: 'F' }, port, rngCero);

    expect(session.reactivos).toHaveLength(0);
  });

  it('devuelve el filtro correcto en la sesión', async () => {
    const port = makeFakePort([makeReactivo('A1-1', 'A', 'A1')]);

    const session = await cargarPractica({ area: 'A' }, port, rngCero);

    expect(session.filtro.area).toBe('A');
    expect(session.filtro.subarea).toBeUndefined();
  });
});

describe('cargarPractica — filtrado por subárea', () => {
  it('filtra por subárea cuando se proporciona', async () => {
    const banco = [
      makeReactivo('A1-1', 'A', 'A1'),
      makeReactivo('A2-1', 'A', 'A2'),
      makeReactivo('A1-2', 'A', 'A1'),
    ];
    const port = makeFakePort(banco);

    const session = await cargarPractica({ area: 'A', subarea: 'A1' }, port, rngCero);

    expect(session.reactivos).toHaveLength(2);
    expect(session.reactivos.every((r) => r.subarea === 'A1')).toBe(true);
  });

  it('retorna vacío cuando la subárea no tiene reactivos', async () => {
    const banco = [makeReactivo('A1-1', 'A', 'A1')];
    const port = makeFakePort(banco);

    const session = await cargarPractica({ area: 'A', subarea: 'A2' }, port, rngCero);

    expect(session.reactivos).toHaveLength(0);
  });
});

describe('cargarPractica — aleatoriedad determinista', () => {
  it('con la misma rng produce el mismo orden', async () => {
    const banco = Array.from({ length: 5 }, (_, i) =>
      makeReactivo(`A${i}`, 'A', 'A1'),
    );
    const port1 = makeFakePort(banco);
    const port2 = makeFakePort(banco);

    const s1 = await cargarPractica({ area: 'A' }, port1, rngMedio);
    const s2 = await cargarPractica({ area: 'A' }, port2, rngMedio);

    expect(s1.reactivos.map((r) => r.id)).toEqual(s2.reactivos.map((r) => r.id));
  });

  it('llama loadBank exactamente una vez', async () => {
    const port = makeFakePort([makeReactivo('A1-1', 'A', 'A1')]);

    await cargarPractica({ area: 'A' }, port, rngCero);

    expect(port.loadBank).toHaveBeenCalledTimes(1);
  });

  it('mezcla los reactivos (rng != 0 produce un orden diferente al original)', async () => {
    // Con 5 reactivos y rng=0.9, Fisher-Yates los reordena
    const banco = [
      makeReactivo('q1', 'A', 'A1'),
      makeReactivo('q2', 'A', 'A1'),
      makeReactivo('q3', 'A', 'A1'),
      makeReactivo('q4', 'A', 'A1'),
      makeReactivo('q5', 'A', 'A1'),
    ];
    const port = makeFakePort(banco);

    const session = await cargarPractica({ area: 'A' }, port, () => 0.9);

    // Los ids deben estar presentes, pero el orden puede variar
    const ids = session.reactivos.map((r) => r.id);
    expect(ids.sort()).toEqual(['q1', 'q2', 'q3', 'q4', 'q5'].sort());
  });
});

// ---------------------------------------------------------------------------
// Tests: evaluarRespuesta
// ---------------------------------------------------------------------------

describe('evaluarRespuesta', () => {
  const reactivo = makeReactivo('t1', 'A', 'A1', 1);

  it('devuelve correcto=true cuando la respuesta es la correcta', () => {
    const respuesta: ChoiceAnswer = { kind: 'choice', index: 1 };
    const resultado = evaluarRespuesta(reactivo, respuesta);

    expect(resultado.correcto).toBe(true);
    expect(resultado.puntuacion).toBe(1);
  });

  it('devuelve correcto=false cuando la respuesta es incorrecta', () => {
    const respuesta: ChoiceAnswer = { kind: 'choice', index: 0 };
    const resultado = evaluarRespuesta(reactivo, respuesta);

    expect(resultado.correcto).toBe(false);
    expect(resultado.puntuacion).toBe(0);
  });

  it('devuelve correcto=false cuando no hay respuesta (null)', () => {
    const resultado = evaluarRespuesta(reactivo, null);

    expect(resultado.correcto).toBe(false);
    expect(resultado.puntuacion).toBe(0);
  });

  it('incluye la explicación del reactivo', () => {
    const respuesta: ChoiceAnswer = { kind: 'choice', index: 1 };
    const resultado = evaluarRespuesta(reactivo, respuesta);

    expect(resultado.explicacion).toBe('Explicación de t1');
  });
});
