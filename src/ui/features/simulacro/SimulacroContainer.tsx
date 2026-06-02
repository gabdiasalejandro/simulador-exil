import { useState, useEffect, useCallback, useRef } from 'react';
import type { ContentPort } from '../../../application/ports/content-port';
import type { StoragePort } from '../../../application/ports/storage-port';
import type { SessionConfig, ExamSession } from '../../../domain/exam/session';
import type { Attempt } from '../../../domain/attempt/attempt';
import type { Answer } from '../../../domain/question/answer';
import type { BankWarning } from '../../../domain/exam/sampling';
import { startSimulacro } from '../../../application/use-cases/start-simulacro';
import { submitAttempt } from '../../../application/use-cases/submit-attempt';
import { isAnswered } from '../../../domain/question/answer';
import { SizePicker } from './SizePicker';
import { QuestionCard } from '../../molecules/QuestionCard/QuestionCard';
import { NavGrid } from '../../molecules/NavGrid/NavGrid';
import { Timer } from '../../atoms/Timer/Timer';
import { Button } from '../../atoms/Button/Button';
import type { NavItemStatus } from '../../molecules/NavGrid/NavGrid';

// ---------------------------------------------------------------------------
// Estados del flujo
// ---------------------------------------------------------------------------

type SimulacroState =
  | { phase: 'picking' }
  | { phase: 'loading' }
  | { phase: 'error'; message: string; bankWarnings: BankWarning[] }
  | { phase: 'active'; session: ExamSession; answers: Map<string, Answer | null>; remainingSeconds: number | null }
  | { phase: 'submitted'; attempt: Attempt };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SimulacroContainerProps {
  contentPort: ContentPort;
  storagePort: StoragePort;
  onDone: (attempt: Attempt) => void;
}

/**
 * Container del flujo completo de simulacro.
 *
 * Fases:
 *  picking → loading → active → submitted
 *
 * Gestiona:
 * - startSimulacro / submitAttempt
 * - countdown del timer (1 s interval)
 * - auto-submit al expirar el timer
 * - navegación entre reactivos
 * - captura de respuestas
 */
export function SimulacroContainer({
  contentPort,
  storagePort,
  onDone,
}: SimulacroContainerProps) {
  const [state, setState] = useState<SimulacroState>({ phase: 'picking' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---------------------------------------------------------------------------
  // Iniciar simulacro
  // ---------------------------------------------------------------------------

  const handleStart = useCallback(
    async (config: SessionConfig) => {
      setState({ phase: 'loading' });
      try {
        const session = await startSimulacro(config, contentPort);
        const remainingSeconds =
          config.timer.mode === 'limited' ? config.timer.minutes * 60 : null;
        setState({
          phase: 'active',
          session,
          answers: new Map(),
          remainingSeconds,
        });
        setCurrentIndex(0);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setState({ phase: 'error', message, bankWarnings: [] });
      }
    },
    [contentPort],
  );

  // ---------------------------------------------------------------------------
  // Timer countdown
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (state.phase !== 'active') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    if (state.remainingSeconds === null) return; // sin límite

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.phase !== 'active') return prev;
        if (prev.remainingSeconds === null) return prev;
        const next = prev.remainingSeconds - 1;
        return { ...prev, remainingSeconds: next };
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.phase]); // Se recrea intencionalmente solo cuando cambia de fase

  // ---------------------------------------------------------------------------
  // Submit (manual o automático)
  // ---------------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    if (state.phase !== 'active') return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    const { session, answers } = state;
    // Construir sesión con las respuestas actuales
    const finalSession: ExamSession = {
      ...session,
      answers,
    };

    try {
      const attempt = await submitAttempt(finalSession, storagePort);
      setState({ phase: 'submitted', attempt });
      onDone(attempt);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ phase: 'error', message, bankWarnings: [] });
    }
  }, [state, storagePort, onDone]);

  // ---------------------------------------------------------------------------
  // Auto-submit al expirar timer
  // ---------------------------------------------------------------------------

  const handleTimerExpire = useCallback(() => {
    void handleSubmit();
  }, [handleSubmit]);

  // ---------------------------------------------------------------------------
  // Respuesta
  // ---------------------------------------------------------------------------

  const handleAnswer = useCallback((questionId: string, answer: Answer) => {
    setState((prev) => {
      if (prev.phase !== 'active') return prev;
      const newAnswers = new Map(prev.answers);
      newAnswers.set(questionId, answer);
      return { ...prev, answers: newAnswers };
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Render por fase
  // ---------------------------------------------------------------------------

  if (state.phase === 'picking') {
    return <SizePicker onConfirm={handleStart} />;
  }

  if (state.phase === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        <p className="animate-pulse text-lg">Cargando banco de reactivos…</p>
      </div>
    );
  }

  if (state.phase === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-semibold text-red-700">
          {state.message === 'EMPTY_BANK'
            ? 'El banco de reactivos está vacío. No se puede generar el simulacro.'
            : `Error: ${state.message}`}
        </p>
        <Button
          label="Volver al inicio"
          onClick={() => setState({ phase: 'picking' })}
        />
      </div>
    );
  }

  if (state.phase === 'active') {
    const { session, answers, remainingSeconds } = state;
    const questions = session.exam.questions;
    const totalQ = questions.length;
    const question = questions[currentIndex];

    if (!question) return null;

    const currentAnswer = answers.get(question.id) ?? null;

    const navItems = questions.map((q, i) => ({
      index: i,
      status: (isAnswered(answers.get(q.id) ?? null)
        ? 'answered'
        : 'unanswered') as NavItemStatus,
    }));

    const answeredCount = navItems.filter((n) => n.status === 'answered').length;

    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        {/* Barra superior */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
          <span className="text-sm text-gray-500">
            {answeredCount}/{totalQ} respondidos
          </span>
          <Timer
            remainingSeconds={remainingSeconds}
            onExpire={handleTimerExpire}
          />
          <Button
            label="Enviar"
            variant="primary"
            onClick={() => void handleSubmit()}
            className="py-1.5 px-4 text-sm"
          />
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 md:flex-row">
          {/* NavGrid lateral / superior */}
          <aside className="md:w-64 shrink-0">
            <NavGrid
              items={navItems}
              currentIndex={currentIndex}
              onSelect={setCurrentIndex}
            />
          </aside>

          {/* Carta de pregunta */}
          <div className="flex-1 flex flex-col gap-4">
            {session.exam.bankWarnings.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
                <strong>Banco insuficiente:</strong>{' '}
                {session.exam.bankWarnings
                  .map((w) => `${w.subarea} (${w.available}/${w.requested})`)
                  .join(', ')}
              </div>
            )}

            <QuestionCard
              question={question}
              answer={currentAnswer}
              onChange={(ans) => handleAnswer(question.id, ans)}
              index={currentIndex + 1}
              total={totalQ}
            />

            {/* Navegación anterior / siguiente */}
            <div className="flex justify-between">
              <Button
                label="← Anterior"
                variant="ghost"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
              />
              <Button
                label="Siguiente →"
                variant="ghost"
                disabled={currentIndex >= totalQ - 1}
                onClick={() => setCurrentIndex((i) => i + 1)}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // phase === 'submitted' — el padre (App) escucha onDone y cambia la vista
  return (
    <div className="flex min-h-screen items-center justify-center text-gray-400">
      <p>Guardando intento…</p>
    </div>
  );
}
