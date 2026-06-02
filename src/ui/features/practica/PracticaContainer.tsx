import { useState, useCallback } from 'react';
import type { ContentPort } from '../../../application/ports/content-port';
import type { AreaCode, SubareaCode } from '../../../domain/taxonomy/taxonomy';
import { AREA_NOMBRES } from '../../../domain/taxonomy/taxonomy';
import type { Reactivo } from '../../../domain/question/question';
import type { Answer } from '../../../domain/question/answer';
import { cargarPractica, evaluarRespuesta } from '../../../application/use-cases/practica';
import type { FeedbackResult } from '../../../application/use-cases/practica';
import type { TemaSeleccionado } from './TemaSidebar';
import { TemaSidebar } from './TemaSidebar';
import { QuestionCard } from '../../molecules/QuestionCard/QuestionCard';
import { Button } from '../../atoms/Button/Button';

// ---------------------------------------------------------------------------
// Tipos de estado
// ---------------------------------------------------------------------------

type PracticaPhase =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | {
      phase: 'active';
      reactivos: ReadonlyArray<Reactivo>;
      index: number;
      answer: Answer | null;
      feedback: FeedbackResult | null;
      /** Contador de sesión */
      respondidos: number;
      aciertos: number;
    }
  | { phase: 'empty' };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PracticaContainerProps {
  contentPort: ContentPort;
  onVolver: () => void;
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

/**
 * Container del modo práctica (playground).
 *
 * Flujo:
 *  idle → (selección de tema) → loading → active → siguiente → active
 *                                       ↘ empty (si no hay reactivos)
 *
 * - Sin timer, sin blueprint, sin reporte criterial.
 * - Feedback inmediato tras responder.
 * - Contador de sesión (respondidos / aciertos).
 */
export function PracticaContainer({ contentPort, onVolver }: PracticaContainerProps) {
  const [state, setState] = useState<PracticaPhase>({ phase: 'idle' });
  const [seleccion, setSeleccion] = useState<TemaSeleccionado | null>(null);
  const [areaExpandida, setAreaExpandida] = useState<AreaCode | null>(null);

  // ---------------------------------------------------------------------------
  // Cargar tema
  // ---------------------------------------------------------------------------

  const handleSeleccionar = useCallback(
    async (tema: TemaSeleccionado) => {
      setSeleccion(tema);
      setState({ phase: 'loading' });

      try {
        const filtro = tema.subarea !== undefined
          ? { area: tema.area, subarea: tema.subarea as SubareaCode }
          : { area: tema.area };
        const session = await cargarPractica(filtro, contentPort);

        if (session.reactivos.length === 0) {
          setState({ phase: 'empty' });
          return;
        }

        setState({
          phase: 'active',
          reactivos: session.reactivos,
          index: 0,
          answer: null,
          feedback: null,
          respondidos: 0,
          aciertos: 0,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setState({ phase: 'error', message });
      }
    },
    [contentPort],
  );

  const handleExpandir = useCallback((area: AreaCode) => {
    setAreaExpandida((prev) => (prev === area ? null : area));
  }, []);

  // ---------------------------------------------------------------------------
  // Responder
  // ---------------------------------------------------------------------------

  const handleAnswer = useCallback((answer: Answer) => {
    setState((prev) => {
      if (prev.phase !== 'active') return prev;
      // Solo acepta respuesta si aún no hay feedback (una respuesta por reactivo)
      if (prev.feedback !== null) return prev;
      return { ...prev, answer };
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Confirmar respuesta → mostrar feedback
  // ---------------------------------------------------------------------------

  const handleConfirmar = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'active') return prev;
      if (prev.answer === null) return prev; // nada que confirmar
      if (prev.feedback !== null) return prev; // ya confirmado

      const reactivo = prev.reactivos[prev.index];
      if (!reactivo) return prev;

      const feedback = evaluarRespuesta(reactivo, prev.answer);
      return {
        ...prev,
        feedback,
        respondidos: prev.respondidos + 1,
        aciertos: prev.aciertos + (feedback.correcto ? 1 : 0),
      };
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Siguiente reactivo
  // ---------------------------------------------------------------------------

  const handleSiguiente = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'active') return prev;

      const total = prev.reactivos.length;
      // Elegir el siguiente evitando repetir el inmediato anterior si hay más de uno
      let nextIndex: number;
      if (total === 1) {
        nextIndex = 0;
      } else {
        // Avanzar en el arreglo mezclado; al llegar al final vuelve al inicio
        nextIndex = (prev.index + 1) % total;
      }

      return {
        ...prev,
        index: nextIndex,
        answer: null,
        feedback: null,
      };
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Render — sidebar
  // ---------------------------------------------------------------------------

  const sidebar = (
    <aside className="w-full md:w-72 shrink-0">
      <TemaSidebar
        seleccion={seleccion}
        areaExpandida={areaExpandida}
        onExpandir={handleExpandir}
        onSeleccionar={handleSeleccionar}
      />
    </aside>
  );

  // ---------------------------------------------------------------------------
  // Render — panel principal
  // ---------------------------------------------------------------------------

  const renderPanel = () => {
    if (state.phase === 'idle') {
      return (
        <div className="flex flex-1 flex-col items-center justify-center text-center gap-3 text-gray-400 p-8">
          <p className="text-lg font-medium">Selecciona un tema en la barra lateral.</p>
          <p className="text-sm">Elige un área o subárea para comenzar a practicar.</p>
        </div>
      );
    }

    if (state.phase === 'loading') {
      return (
        <div className="flex flex-1 items-center justify-center text-gray-500">
          <p className="animate-pulse text-lg">Cargando reactivos…</p>
        </div>
      );
    }

    if (state.phase === 'error') {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-lg font-semibold text-red-700">Error: {state.message}</p>
          <Button label="Reintentar" onClick={() => setState({ phase: 'idle' })} />
        </div>
      );
    }

    if (state.phase === 'empty') {
      const nombre = seleccion ? AREA_NOMBRES[seleccion.area] : 'este tema';
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-lg font-semibold text-amber-700">
            No hay reactivos disponibles para {nombre}.
          </p>
          <p className="text-sm text-gray-500">
            Elige otro tema en la barra lateral.
          </p>
        </div>
      );
    }

    if (state.phase === 'active') {
      const { reactivos, index, answer, feedback, respondidos, aciertos } = state;
      const reactivo = reactivos[index];
      if (!reactivo) return null;

      const total = reactivos.length;
      const feedbackExtraProps = feedback !== null
        ? { feedback: { correcto: feedback.correcto, explicacion: feedback.explicacion } }
        : ({} as Record<string, never>);

      return (
        <div className="flex flex-1 flex-col gap-4">
          {/* Contador de sesión */}
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>
              Aciertos: <span className="font-semibold text-green-700">{aciertos}</span> /{' '}
              <span className="font-semibold text-gray-700">{respondidos}</span> respondidos
            </span>
            <span className="text-gray-300">|</span>
            <span>
              Reactivos en tema: <span className="font-semibold text-gray-700">{total}</span>
            </span>
          </div>

          {/* Carta del reactivo */}
          <QuestionCard
            question={reactivo}
            answer={answer}
            onChange={handleAnswer}
            index={index + 1}
            total={total}
            {...feedbackExtraProps}
          />

          {/* Acciones */}
          <div className="flex justify-end gap-3">
            {feedback === null ? (
              <Button
                label="Verificar respuesta"
                variant="primary"
                disabled={answer === null}
                onClick={handleConfirmar}
                className="py-2.5 px-6"
              />
            ) : (
              <Button
                label="Siguiente reactivo →"
                variant="primary"
                onClick={handleSiguiente}
                className="py-2.5 px-6"
              />
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Encabezado */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            label="← Volver"
            variant="ghost"
            onClick={onVolver}
            className="py-1.5 px-3 text-sm"
          />
          <h1 className="text-base font-semibold text-blue-800">Modo práctica</h1>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex flex-1 flex-col gap-4 p-4 md:flex-row">
        {sidebar}
        <section className="flex flex-1 flex-col">{renderPanel()}</section>
      </main>
    </div>
  );
}
