import type { StoragePort } from '../ports/storage-port';
import type { ExamSession } from '../../domain/exam/session';
import type { Attempt } from '../../domain/attempt/attempt';
import { buildReport } from '../../domain/scoring/attempt-report';
import { createAttempt } from '../../domain/attempt/attempt';

/**
 * Caso de uso: envía un simulacro y persiste el intento resultante.
 *
 * 1. Califica las respuestas usando el dominio (buildReport).
 * 2. Construye un Attempt inmutable con snapshot del examen y las respuestas.
 * 3. Persiste el Attempt a través del StoragePort.
 * 4. Retorna el Attempt para que la UI muestre el reporte.
 *
 * @param session  Sesión de examen con las respuestas del usuario.
 * @param port     Implementación de StoragePort inyectada.
 */
export async function submitAttempt(
  session: ExamSession,
  port: StoragePort,
): Promise<Attempt> {
  const report = buildReport(session.exam, session.answers);
  const attempt = createAttempt(session, report);

  await port.saveAttempt(attempt);

  return attempt;
}
