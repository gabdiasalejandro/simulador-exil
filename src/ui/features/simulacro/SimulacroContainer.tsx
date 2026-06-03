import { useState, useEffect, useCallback, useRef } from 'react';
import type { ContentPort } from '../../../application/ports/content-port';
import type { StoragePort } from '../../../application/ports/storage-port';
import type { SessionConfig, ExamSession } from '../../../domain/exam/session';
import type { Attempt } from '../../../domain/attempt/attempt';
import type { Reactivo } from '../../../domain/question/question';
import type { Answer } from '../../../domain/question/answer';
import type { BankWarning } from '../../../domain/exam/sampling';
import { startSimulacro } from '../../../application/use-cases/start-simulacro';
import { submitAttempt } from '../../../application/use-cases/submit-attempt';
import { isAnswered } from '../../../domain/question/answer';
import type { SampledExam } from '../../../domain/exam/sampling';
import {
  saveSimulacroSnapshot,
  loadSimulacroSnapshot,
  clearSimulacroSnapshot,
} from '../../../infrastructure/storage/simulacro-session-storage';
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
  onDone: (attempt: Attempt, questions: readonly Reactivo[]) => void;
}

/**
 * Construye el estado inicial. Si hay un simulacro inconcluso en localStorage,
 * arranca directamente en 'active' restaurado en el punto exacto donde estaba;
 * si no, arranca en 'picking' (configuración).
 */
function restoreInitialState(): { state: SimulacroState; currentIndex: number } {
  const snap = loadSimulacroSnapshot();
  if (!snap) return { state: { phase: 'picking' }, currentIndex: 0 };

  const exam: SampledExam = {
    questions: snap.questions,
    bankWarnings: snap.bankWarnings,
  };
  const answers = new Map<string, Answer | null>(snap.answers);
  const session: ExamSession = {
    id: snap.sessionId,
    config: snap.config,
    exam,
    answers: new Map(answers),
    startedAt: snap.startedAt,
  };
  return {
    state: { phase: 'active', session, answers, remainingSeconds: snap.remainingSeconds },
    currentIndex: Math.min(Math.max(0, snap.currentIndex), snap.questions.length - 1),
  };
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
  const [state, setState] = useState<SimulacroState>(() => restoreInitialState().state);
  const [currentIndex, setCurrentIndex] = useState(() => restoreInitialState().currentIndex);
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
  // Persistir el estado del simulacro activo (refresh-safe)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (state.phase !== 'active') return;
    saveSimulacroSnapshot({
      sessionId: state.session.id,
      config: state.session.config,
      questions: [...state.session.exam.questions],
      bankWarnings: [...state.session.exam.bankWarnings],
      answers: [...state.answers.entries()],
      remainingSeconds: state.remainingSeconds,
      currentIndex,
      startedAt: state.session.startedAt,
    });
  }, [state, currentIndex]);

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
      clearSimulacroSnapshot();
      setState({ phase: 'submitted', attempt });
      onDone(attempt, finalSession.exam.questions);
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
          onClick={() => {
            clearSimulacroSnapshot();
            setState({ phase: 'picking' });
          }}
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
      <div className="flex min-h-screen flex-col bg-crema">
        {/* Barra superior */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-3 shadow-sm">
          <span className="text-sm text-gray-500">
            <span className="font-bold text-gray-800">{answeredCount}</span>/{totalQ}{' '}
            respondidos
          </span>
          <Timer
            remainingSeconds={remainingSeconds}
            onExpire={handleTimerExpire}
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

          {/* Carta de pregunta — mismo ancho que en práctica (ocupa el panel) */}
          <div className="flex flex-1 flex-col gap-4">
            {session.exam.bankWarnings.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
                <strong>Banco insuficiente:</strong>{' '}
                {session.exam.bankWarnings
                  .map((w) => `${w.subarea} (${w.available}/${w.requested})`)
                  .join(', ')}
              </div>
            )}

            {/* Navegación anterior / siguiente — cuadrados, oscuros, arriba */}
            <div className="flex justify-between">
              <Button
                label="← Anterior"
                variant="dark"
                shape="square"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
                className="px-3 py-2 text-sm"
              />
              <Button
                label="Siguiente →"
                variant="dark"
                shape="square"
                disabled={currentIndex >= totalQ - 1}
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="px-3 py-2 text-sm"
              />
            </div>

            <QuestionCard
              question={question}
              answer={currentAnswer}
              onChange={(ans) => handleAnswer(question.id, ans)}
              index={currentIndex + 1}
              total={totalQ}
            />

            {/* Enviar — solo en la última pregunta, abajo */}
            {currentIndex === totalQ - 1 && (
              <Button
                label="Revisar examen"
                variant="primary"
                onClick={() => void handleSubmit()}
                className="w-full py-4 text-base"
              />
            )}
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
