import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LandingShell } from './LandingShell';

describe('LandingShell', () => {
  it('(esc.08-A) muestra los 4 botones en el DOM', () => {
    render(<LandingShell onSimular={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Simular' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Practicar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Por tema' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Revisar' })).toBeInTheDocument();
  });

  it('(esc.08-B) Practicar está deshabilitado y no llama ningún handler', async () => {
    const handler = vi.fn();
    render(<LandingShell onSimular={handler} />);
    const practicar = screen.getByRole('button', { name: 'Practicar' });
    expect(practicar).toBeDisabled();
    await userEvent.click(practicar);
    expect(handler).not.toHaveBeenCalled();
  });

  it('Por tema y Revisar están deshabilitados', () => {
    render(<LandingShell onSimular={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Por tema' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Revisar' })).toBeDisabled();
  });

  it('click en Simular invoca onSimular', async () => {
    const handler = vi.fn();
    render(<LandingShell onSimular={handler} />);
    await userEvent.click(screen.getByRole('button', { name: 'Simular' }));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
