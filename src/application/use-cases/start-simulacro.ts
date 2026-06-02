import type { ContentPort } from '../ports/content-port';
import type { SessionConfig, ExamSession } from '../../domain/exam/session';
import type { Rng } from '../../domain/exam/sampling';
import { computeBlueprint } from '../../domain/exam/blueprint';
import { sampleExam } from '../../domain/exam/sampling';

/**
 * Caso de uso: inicia un simulacro.
 *
 * 1. Carga el banco de preguntas a través del ContentPort.
 * 2. Calcula el blueprint proporcional para el tamaño solicitado (Hamilton).
 * 3. Muestrea el examen del banco.
 * 4. Construye la ExamSession con el timer configurado.
 *
 * Lanza Error('EMPTY_BANK') si el banco no tiene reactivos válidos.
 * Propaga bankWarnings en la sesión cuando el banco es insuficiente.
 *
 * @param config  Configuración de la sesión (tamaño + timer ya resueltos).
 * @param port    Implementación de ContentPort inyectada.
 * @param rng     Función aleatoria inyectable (default: Math.random).
 */
export async function startSimulacro(
  config: SessionConfig,
  port: ContentPort,
  rng: Rng = Math.random,
): Promise<ExamSession> {
  const bank = await port.loadBank();
  const blueprint = computeBlueprint(config.size);
  const sampledExam = sampleExam(bank, blueprint, rng);

  const session: ExamSession = {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    config,
    exam: sampledExam,
    answers: new Map(),
    startedAt: Date.now(),
  };

  return session;
}
