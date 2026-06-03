import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PracticaContainer } from './PracticaContainer';
import type { ContentPort } from '../../../application/ports/content-port';
import type { ReactivoDirecto } from '../../../domain/question/question';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReactivo(
  id: string,
  area: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' = 'A',
  subarea: 'A1' | 'A2' | 'B1' | 'C1' | 'D1' | 'E1' | 'F1' = 'A1',
  correcta: 0 | 1 | 2 | 3 = 1,
): ReactivoDirecto {
  return {
    id,
    tipo: 'directo',
    area,
    subarea,
    enunciado: `Enunciado del reactivo ${id}`,
    opciones: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
    correcta,
    explanation: `Explicación del reactivo ${id}`,
  };
}

function makeFakePort(reactivos: ReactivoDirecto[]): ContentPort {
  return {
    loadBank: vi.fn().mockResolvedValue(reactivos),
  };
}

// ---------------------------------------------------------------------------
// Tests de Sidebar
// ---------------------------------------------------------------------------

describe('PracticaContainer — sidebar', () => {
  it('muestra las 6 áreas por nombre en la sidebar', () => {
    const port = makeFakePort([]);
    render(<PracticaContainer contentPort={port} onVolver={vi.fn()} />);

    expect(screen.getByText('Administración')).toBeInTheDocument();
    expect(screen.getByText('Contabilidad y finanzas')).toBeInTheDocument();
    expect(screen.getByText('Economía')).toBeInTheDocument();
    expect(screen.getByText('Mercadotecnia')).toBeInTheDocument();
    expect(screen.getByText('Matemáticas y estadística')).toBeInTheDocument();
    expect(screen.getByText('Derecho')).toBeInTheDocument();
  });

  it('al expandir un área muestra sus subáreas', async () => {
    const port = makeFakePort([]);
    render(<PracticaContainer contentPort={port} onVolver={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /Administración/ }));

    expect(screen.getByText('Conceptos generales de administración')).toBeInTheDocument();
    expect(screen.getByText('Pensamiento administrativo')).toBeInTheDocument();
    expect(screen.getByText('Todas las subáreas')).toBeInTheDocument();
  });

  it('al volver a hacer clic en el área, la colapsa', async () => {
    const port = makeFakePort([]);
    render(<PracticaContainer contentPort={port} onVolver={vi.fn()} />);

    // Expandir
    await userEvent.click(screen.getByRole('button', { name: /Administración/ }));
    expect(screen.getByText('Todas las subáreas')).toBeInTheDocument();

    // Colapsar
    await userEvent.click(screen.getByRole('button', { name: /Administración/ }));
    expect(screen.queryByText('Todas las subáreas')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests de selección de tema y carga
// ---------------------------------------------------------------------------

describe('PracticaContainer — selección de tema', () => {
  it('al seleccionar un tema carga y muestra el primer reactivo', async () => {
    const reactivos = [makeReactivo('a1', 'A', 'A1')];
    const port = makeFakePort(reactivos);
    render(<PracticaContainer contentPort={port} onVolver={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /Administración/ }));
    await userEvent.click(screen.getByText('Todas las subáreas'));

    await waitFor(() => {
      expect(screen.getByText('Enunciado del reactivo a1')).toBeInTheDocument();
    });
  });

  it('muestra aviso cuando el tema no tiene reactivos', async () => {
    const port = makeFakePort([]); // banco vacío
    render(<PracticaContainer contentPort={port} onVolver={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /Economía/ }));
    await userEvent.click(screen.getByText('Todas las subáreas'));

    await waitFor(() => {
      expect(screen.getByText(/No hay reactivos disponibles/)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Tests de feedback
// ---------------------------------------------------------------------------

describe('PracticaContainer — feedback inmediato', () => {
  let port: ContentPort;
  const reactivo = makeReactivo('r1', 'A', 'A1', 1); // correcta = índice 1 = 'Opción B'

  beforeEach(() => {
    port = makeFakePort([reactivo]);
  });

  it('botón "Verificar respuesta" aparece después de seleccionar una opción', async () => {
    render(<PracticaContainer contentPort={port} onVolver={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /Administración/ }));
    await userEvent.click(screen.getByText('Todas las subáreas'));

    await waitFor(() => {
      expect(screen.getByText('Enunciado del reactivo r1')).toBeInTheDocument();
    });

    // El botón Verificar debe estar deshabilitado hasta que se seleccione una opción
    const verificar = screen.getByRole('button', { name: 'Verificar respuesta' });
    expect(verificar).toBeDisabled();

    await userEvent.click(screen.getByText(/Opción B/));
    expect(verificar).not.toBeDisabled();
  });

  it('tras verificar respuesta correcta muestra "Correcto" y la explicación', async () => {
    render(<PracticaContainer contentPort={port} onVolver={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /Administración/ }));
    await userEvent.click(screen.getByText('Todas las subáreas'));

    await waitFor(() => {
      expect(screen.getByText('Enunciado del reactivo r1')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText(/Opción B/)); // correcta
    await userEvent.click(screen.getByRole('button', { name: 'Verificar respuesta' }));

    expect(screen.getByText('Correcto')).toBeInTheDocument();
    expect(screen.getByText('Explicación del reactivo r1')).toBeInTheDocument();
  });

  it('tras verificar respuesta incorrecta muestra "Incorrecto" y la explicación', async () => {
    render(<PracticaContainer contentPort={port} onVolver={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /Administración/ }));
    await userEvent.click(screen.getByText('Todas las subáreas'));

    await waitFor(() => {
      expect(screen.getByText('Enunciado del reactivo r1')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText(/Opción A/)); // incorrecta
    await userEvent.click(screen.getByRole('button', { name: 'Verificar respuesta' }));

    expect(screen.getByText('Incorrecto')).toBeInTheDocument();
    expect(screen.getByText('Explicación del reactivo r1')).toBeInTheDocument();
  });

  it('tras verificar aparece el botón "Siguiente reactivo"', async () => {
    render(<PracticaContainer contentPort={port} onVolver={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /Administración/ }));
    await userEvent.click(screen.getByText('Todas las subáreas'));

    await waitFor(() => {
      expect(screen.getByText('Enunciado del reactivo r1')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText(/Opción A/));
    await userEvent.click(screen.getByRole('button', { name: 'Verificar respuesta' }));

    expect(screen.getByRole('button', { name: /Siguiente reactivo/ })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests de navegación: siguiente reactivo
// ---------------------------------------------------------------------------

describe('PracticaContainer — siguiente reactivo', () => {
  it('hacer clic en "Siguiente" cambia el reactivo mostrado', async () => {
    const reactivos = [
      makeReactivo('r1', 'A', 'A1'),
      makeReactivo('r2', 'A', 'A1'),
    ];
    const port = makeFakePort(reactivos);
    render(<PracticaContainer contentPort={port} onVolver={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /Administración/ }));
    await userEvent.click(screen.getByText('Todas las subáreas'));

    // Esperar a que cargue el primer reactivo
    await waitFor(() => {
      expect(screen.getByText(/Enunciado del reactivo r/)).toBeInTheDocument();
    });

    // Leer cuál es el primer reactivo
    const primerTexto = screen.getByText(/Enunciado del reactivo r/).textContent;

    // Responder y verificar
    await userEvent.click(screen.getByText(/Opción A/));
    await userEvent.click(screen.getByRole('button', { name: 'Verificar respuesta' }));
    await userEvent.click(screen.getByRole('button', { name: /Siguiente reactivo/ }));

    // El reactivo mostrado debe ser diferente (o el mismo si solo hay uno y vuelve)
    await waitFor(() => {
      // El feedback debe haberse limpiado
      expect(screen.queryByText('Correcto')).not.toBeInTheDocument();
      expect(screen.queryByText('Incorrecto')).not.toBeInTheDocument();
    });

    // Con 2 reactivos, el siguiente debe ser el otro
    const segundoTexto = screen.getByText(/Enunciado del reactivo r/).textContent;
    expect(segundoTexto).not.toBe(primerTexto);
  });
});

// ---------------------------------------------------------------------------
// Tests de wiring: botón Volver
// ---------------------------------------------------------------------------

describe('PracticaContainer — volver al landing', () => {
  it('el botón "← Volver" llama onVolver', async () => {
    const port = makeFakePort([]);
    const onVolver = vi.fn();
    render(<PracticaContainer contentPort={port} onVolver={onVolver} />);

    await userEvent.click(screen.getByRole('button', { name: /Volver/ }));
    expect(onVolver).toHaveBeenCalledTimes(1);
  });
});
