import type { Question } from '../../domain/question/question';

/**
 * Puerto de contenido: carga el banco de preguntas desde la fuente de datos.
 * La implementación concreta vive en src/infrastructure/content/.
 */
export interface ContentPort {
  /**
   * Carga todas las preguntas válidas del banco.
   * Los reactivos con officialTag inválido son descartados por el adaptador.
   * Retorna un arreglo potencialmente vacío si ningún reactivo pasa validación.
   */
  loadBank(): Promise<Question[]>;
}
