import { useState } from 'react';
import type { Attempt } from '../domain/attempt/attempt';
import type { Reactivo } from '../domain/question/question';
import { YamlContentAdapter } from '../infrastructure/content/yaml-content-adapter';
import { IndexedDbStorageAdapter } from '../infrastructure/storage/indexeddb-storage-adapter';
import { loadSimulacroSnapshot } from '../infrastructure/storage/simulacro-session-storage';
import { LandingShell } from './features/landing/LandingShell';
import { SimulacroContainer } from './features/simulacro/SimulacroContainer';
import { ReportView } from './features/simulacro/ReportView';
import { PracticaContainer } from './features/practica/PracticaContainer';
import { TemarioView } from './features/temario/TemarioView';

// ---------------------------------------------------------------------------
// Instancias singleton de los adapters
// Se instancian aquí (raíz de la UI) para que el dominio y application
// permanezcan puros sin conocer infraestructura.
// ---------------------------------------------------------------------------

const contentPort = new YamlContentAdapter();
const storagePort = new IndexedDbStorageAdapter();

// ---------------------------------------------------------------------------
// Vistas de la aplicación (routing sin librería pesada — estado local)
// ---------------------------------------------------------------------------

type AppView = 'landing' | 'simulacro' | 'report' | 'practica' | 'temario';

/**
 * Shell principal de la aplicación.
 *
 * Routing simple con estado local:
 *  landing → simulacro → report → landing
 *  landing → practica → landing
 *
 * Los adapters se instancian una sola vez y se inyectan en los casos de uso.
 */
export function App() {
  // Si hay un simulacro inconcluso en localStorage, arranca directo en él.
  const [view, setView] = useState<AppView>(() =>
    loadSimulacroSnapshot() ? 'simulacro' : 'landing',
  );
  const [lastAttempt, setLastAttempt] = useState<Attempt | null>(null);
  const [lastQuestions, setLastQuestions] = useState<readonly Reactivo[]>([]);

  const handleAttemptDone = (attempt: Attempt, questions: readonly Reactivo[]) => {
    setLastAttempt(attempt);
    setLastQuestions(questions);
    setView('report');
  };

  const handleReset = () => {
    setLastAttempt(null);
    setLastQuestions([]);
    setView('landing');
  };

  switch (view) {
    case 'landing':
      return (
        <LandingShell
          onSimular={() => setView('simulacro')}
          onPracticar={() => setView('practica')}
          onTemario={() => setView('temario')}
        />
      );

    case 'simulacro':
      return (
        <SimulacroContainer
          contentPort={contentPort}
          storagePort={storagePort}
          onDone={handleAttemptDone}
          onVolver={handleReset}
        />
      );

    case 'report':
      if (!lastAttempt) return null;
      return (
        <ReportView
          attempt={lastAttempt}
          questions={lastQuestions}
          onReset={handleReset}
        />
      );

    case 'practica':
      return (
        <PracticaContainer
          contentPort={contentPort}
          onVolver={handleReset}
        />
      );

    case 'temario':
      return <TemarioView onVolver={handleReset} />;

    default:
      return null;
  }
}
