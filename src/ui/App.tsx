import { useState } from 'react';
import type { Attempt } from '../domain/attempt/attempt';
import { YamlContentAdapter } from '../infrastructure/content/yaml-content-adapter';
import { IndexedDbStorageAdapter } from '../infrastructure/storage/indexeddb-storage-adapter';
import { LandingShell } from './features/landing/LandingShell';
import { SimulacroContainer } from './features/simulacro/SimulacroContainer';
import { ReportView } from './features/simulacro/ReportView';
import { PracticaContainer } from './features/practica/PracticaContainer';

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

type AppView = 'landing' | 'simulacro' | 'report' | 'practica';

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
  const [view, setView] = useState<AppView>('landing');
  const [lastAttempt, setLastAttempt] = useState<Attempt | null>(null);

  const handleAttemptDone = (attempt: Attempt) => {
    setLastAttempt(attempt);
    setView('report');
  };

  const handleReset = () => {
    setLastAttempt(null);
    setView('landing');
  };

  switch (view) {
    case 'landing':
      return (
        <LandingShell
          onSimular={() => setView('simulacro')}
          onPracticar={() => setView('practica')}
        />
      );

    case 'simulacro':
      return (
        <SimulacroContainer
          contentPort={contentPort}
          storagePort={storagePort}
          onDone={handleAttemptDone}
        />
      );

    case 'report':
      if (!lastAttempt) return null;
      return <ReportView attempt={lastAttempt} onReset={handleReset} />;

    case 'practica':
      return (
        <PracticaContainer
          contentPort={contentPort}
          onVolver={handleReset}
        />
      );

    default:
      return null;
  }
}
