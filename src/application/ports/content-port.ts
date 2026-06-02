import type { Reactivo } from '../../domain/question/question';

/**
 * Puerto de contenido: carga el banco de reactivos desde la fuente de datos.
 * La implementación concreta vive en src/infrastructure/content/.
 */
export interface ContentPort {
  /**
   * Carga todos los reactivos válidos del banco.
   * Los reactivos con área o subárea inválida son descartados por el adaptador.
   * Retorna un arreglo potencialmente vacío si ningún reactivo pasa validación.
   */
  loadBank(): Promise<Reactivo[]>;
}
