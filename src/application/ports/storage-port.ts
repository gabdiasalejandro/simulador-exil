import type { Attempt } from '../../domain/attempt/attempt';

/**
 * Puerto de almacenamiento: persiste y recupera intentos completados.
 * La implementación concreta vive en src/infrastructure/storage/.
 */
export interface StoragePort {
  /**
   * Guarda un intento completado.
   * Si ya existe un intento con el mismo id, lo sobrescribe.
   */
  saveAttempt(attempt: Attempt): Promise<void>;

  /**
   * Retorna todos los intentos guardados, en orden de inserción.
   */
  listAttempts(): Promise<Attempt[]>;

  /**
   * Retorna el intento con el id dado, o null si no existe.
   */
  getAttempt(id: string): Promise<Attempt | null>;
}
