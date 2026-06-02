import { parse } from 'yaml';
import type { ContentPort } from '../../application/ports/content-port';
import type { Reactivo } from '../../domain/question/question';
import { validateQuestion } from '../../domain/question/validation';

// ---------------------------------------------------------------------------
// Forma del archivo YAML
// ---------------------------------------------------------------------------

interface BancoYaml {
  schemaVersion: number;
  reactivos: unknown[];
}

// ---------------------------------------------------------------------------
// Opciones de construcción (permiten inyectar contenido en tests)
// ---------------------------------------------------------------------------

export interface YamlContentAdapterOptions {
  /**
   * Contenido YAML crudo como string.
   * Si no se provee, se usa el banco.yaml embebido en el bundle.
   */
  rawYaml?: string;
}

// ---------------------------------------------------------------------------
// Importación del banco en tiempo de compilación (Vite inline)
// ---------------------------------------------------------------------------

// Vite importa el YAML como string con ?raw
// La importación se hace de forma condicional en el constructor
// para permitir inyección en tests.

// ---------------------------------------------------------------------------
// Adaptador
// ---------------------------------------------------------------------------

/**
 * Implementa ContentPort cargando el banco de reactivos desde YAML.
 *
 * - Parsea el archivo YAML.
 * - Valida cada reactivo con validateQuestion (del dominio).
 * - Descarta silenciosamente los reactivos inválidos con un log de advertencia.
 * - Soporta modelo v2 (tipo/area/subarea) y migra v1 (itemType/officialTag) via validateQuestion.
 */
export class YamlContentAdapter implements ContentPort {
  private readonly rawYaml: string | null;

  constructor(options?: YamlContentAdapterOptions) {
    this.rawYaml = options?.rawYaml ?? null;
  }

  async loadBank(): Promise<Reactivo[]> {
    let yamlString: string;

    if (this.rawYaml !== null) {
      yamlString = this.rawYaml;
    } else {
      // Importar el banco embebido en el bundle
      const bancoRaw = await import('./banco.yaml?raw');
      yamlString = bancoRaw.default;
    }

    let parsed: unknown;
    try {
      parsed = parse(yamlString);
    } catch (e) {
      console.error('[YamlContentAdapter] Error al parsear YAML:', e);
      return [];
    }

    if (!parsed || typeof parsed !== 'object') {
      console.error('[YamlContentAdapter] El YAML no contiene un objeto válido.');
      return [];
    }

    const banco = parsed as BancoYaml;
    if (!Array.isArray(banco.reactivos)) {
      console.error('[YamlContentAdapter] El YAML no tiene un arreglo "reactivos".');
      return [];
    }

    const valid: Reactivo[] = [];

    for (const raw of banco.reactivos) {
      const result = validateQuestion(raw);
      if (result.ok) {
        valid.push(result.value);
      } else {
        console.warn(
          `[YamlContentAdapter] Reactivo descartado — error: ${result.error.code}`,
          raw,
        );
      }
    }

    return valid;
  }
}
