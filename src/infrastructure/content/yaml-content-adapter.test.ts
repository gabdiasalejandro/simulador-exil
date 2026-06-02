import { describe, it, expect } from 'vitest';
import { YamlContentAdapter } from './yaml-content-adapter';

// ---------------------------------------------------------------------------
// YAML de prueba — inyectado como string para no depender del archivo en disco
// ---------------------------------------------------------------------------

const yamlValido = `
schemaVersion: 2
reactivos:
  - id: A1-001
    tipo: directo
    area: A
    subarea: A1
    enunciado: "¿Qué es la planeación?"
    opciones: ["Definir objetivos", "Organizar", "Dirigir", "Controlar"]
    correcta: 0
    explicacion: "La planeación es la definición de objetivos."
  - id: B1-001
    tipo: completamiento
    area: B
    subarea: B1
    enunciado: "El balance general muestra ___"
    opciones: ["activos y pasivos", "ingresos", "costos", "flujo"]
    correcta: 0
    explicacion: "El balance muestra activos, pasivos y capital."
  - id: A4-001
    tipo: ordenamiento
    area: A
    subarea: A4
    enunciado: "Ordena los pasos"
    elementos: ["Paso 1", "Paso 2", "Paso 3"]
    ordenCorrecto: [0, 1, 2]
    explicacion: "Orden correcto."
  - id: D1-001
    tipo: relacion
    area: D
    subarea: D1
    enunciado: "Relaciona"
    columnaIzquierda: ["Concepto A"]
    columnaDerecha: ["Definición A", "Definición B"]
    emparejamientos: [[0, 0]]
    explicacion: "Relación correcta."
  - id: C3-CASO1-q1
    tipo: directo
    area: C
    subarea: C3
    caso: "Contexto del caso de inflación."
    enunciado: "¿Cuál fue la tasa de inflación?"
    opciones: ["5%", "8%", "10%", "12%"]
    correcta: 2
    explicacion: "Inflación = 10%."
`;

const yamlConInvalidos = `
schemaVersion: 2
reactivos:
  - id: valid-001
    tipo: directo
    area: A
    subarea: A1
    enunciado: "Pregunta válida"
    opciones: ["A", "B", "C", "D"]
    correcta: 0
    explicacion: "Exp."
  - id: invalid-002
    tipo: directo
    area: Z
    subarea: X9
    enunciado: "Reactivo con área inválida"
    opciones: ["A", "B", "C", "D"]
    correcta: 0
    explicacion: "Exp."
  - id: invalid-003
    tipo: directo
    area: A
    subarea: A1
    enunciado: "Reactivo con opciones incompletas"
    opciones: ["Solo", "Dos"]
    correcta: 0
    explicacion: "Exp."
`;

const yamlMalformado = `{ esto no es yaml válido: [ `;

const yamlSinReactivos = `
schemaVersion: 2
otro_campo: "sin reactivos"
`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('YamlContentAdapter', () => {
  it('carga reactivos válidos desde YAML inyectado', async () => {
    const adapter = new YamlContentAdapter({ rawYaml: yamlValido });
    const reactivos = await adapter.loadBank();
    expect(Array.isArray(reactivos)).toBe(true);
    expect(reactivos.length).toBe(5);
  });

  it('todos los reactivos tienen area, subarea e id', async () => {
    const adapter = new YamlContentAdapter({ rawYaml: yamlValido });
    const reactivos = await adapter.loadBank();
    for (const r of reactivos) {
      expect(typeof r.id).toBe('string');
      expect(r.id.length).toBeGreaterThan(0);
      expect(typeof r.area).toBe('string');
      expect(typeof r.subarea).toBe('string');
    }
  });

  it('filtra reactivos con área o subárea inválida', async () => {
    const adapter = new YamlContentAdapter({ rawYaml: yamlConInvalidos });
    const reactivos = await adapter.loadBank();
    expect(reactivos.length).toBe(1);
    expect(reactivos[0]?.id).toBe('valid-001');
  });

  it('retorna [] si el YAML está malformado', async () => {
    const adapter = new YamlContentAdapter({ rawYaml: yamlMalformado });
    const reactivos = await adapter.loadBank();
    expect(reactivos).toEqual([]);
  });

  it('retorna [] si el YAML no tiene campo "reactivos"', async () => {
    const adapter = new YamlContentAdapter({ rawYaml: yamlSinReactivos });
    const reactivos = await adapter.loadBank();
    expect(reactivos).toEqual([]);
  });

  it('reactivo con campo "caso" se carga correctamente', async () => {
    const adapter = new YamlContentAdapter({ rawYaml: yamlValido });
    const reactivos = await adapter.loadBank();
    const conCaso = reactivos.find((r) => r.id === 'C3-CASO1-q1');
    expect(conCaso).toBeDefined();
    expect(conCaso?.caso).toBe('Contexto del caso de inflación.');
  });

  it('cubre los 4 tipos del modelo v2', async () => {
    const adapter = new YamlContentAdapter({ rawYaml: yamlValido });
    const reactivos = await adapter.loadBank();
    const tipos = new Set(reactivos.map((r) => r.tipo));
    expect(tipos.has('directo')).toBe(true);
    expect(tipos.has('completamiento')).toBe(true);
    expect(tipos.has('ordenamiento')).toBe(true);
    expect(tipos.has('relacion')).toBe(true);
  });

  it('retorna [] con arreglo rawYaml vacío de reactivos', async () => {
    const adapter = new YamlContentAdapter({ rawYaml: 'schemaVersion: 2\nreactivos: []' });
    const reactivos = await adapter.loadBank();
    expect(reactivos).toEqual([]);
  });
});
