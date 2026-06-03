import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LandingShell } from './LandingShell';

describe('LandingShell', () => {
  it('(esc.08-A) muestra los dos modos activos en el DOM', () => {
    render(<LandingShell onSimular={vi.fn()} onPracticar={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Simular' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Practicar' })).toBeInTheDocument();
  });

  it('(esc.08-B) Practicar está habilitado e invoca onPracticar al hacer clic', async () => {
    const onPracticar = vi.fn();
    render(<LandingShell onSimular={vi.fn()} onPracticar={onPracticar} />);
    const practicar = screen.getByRole('button', { name: 'Practicar' });
    expect(practicar).not.toBeDisabled();
    await userEvent.click(practicar);
    expect(onPracticar).toHaveBeenCalledTimes(1);
  });

  it('ya no muestra "Por tema" ni "Revisar"', () => {
    render(<LandingShell onSimular={vi.fn()} onPracticar={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Por tema' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Revisar' })).not.toBeInTheDocument();
  });

  it('click en Simular invoca onSimular', async () => {
    const handler = vi.fn();
    render(<LandingShell onSimular={handler} onPracticar={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Simular' }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('muestra el título y un párrafo descriptivo', () => {
    render(<LandingShell onSimular={vi.fn()} onPracticar={vi.fn()} />);
    expect(
      screen.getByRole('heading', { name: 'Simulador EXIL' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Plataforma de estudio/i)).toBeInTheDocument();
  });
});
