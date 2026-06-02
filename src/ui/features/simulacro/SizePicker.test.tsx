import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SizePicker } from './SizePicker';
import type { SessionConfig } from '../../../domain/exam/session';

describe('SizePicker', () => {
  it('muestra los 3 tamaños de examen', () => {
    render(<SizePicker onConfirm={vi.fn()} />);
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('125')).toBeInTheDocument();
  });

  it('emite SessionConfig con el tamaño seleccionado al confirmar', async () => {
    const handler = vi.fn();
    render(<SizePicker onConfirm={handler} />);
    await userEvent.click(screen.getByText('60'));
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar simulacro' }));
    const config = handler.mock.calls[0]?.[0] as SessionConfig;
    expect(config.size).toBe(60);
    expect(config.timer.mode).toBe('limited');
  });

  it('al seleccionar "Sin límite" el config tiene timer.mode=unlimited', async () => {
    const handler = vi.fn();
    render(<SizePicker onConfirm={handler} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Sin límite de tiempo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar simulacro' }));
    const config = handler.mock.calls[0]?.[0] as SessionConfig;
    expect(config.timer.mode).toBe('unlimited');
  });

  it('el input de minutos se oculta al elegir sin límite', async () => {
    render(<SizePicker onConfirm={vi.fn()} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Sin límite de tiempo' }));
    expect(screen.queryByRole('spinbutton', { name: /Minutos/ })).not.toBeInTheDocument();
  });

  it('el default de minutos cambia según el tamaño elegido (125→360)', async () => {
    render(<SizePicker onConfirm={vi.fn()} />);
    await userEvent.click(screen.getByText('125'));
    // sugerido: 360 min, que es el default mostrado
    expect(screen.getByText(/sugerido: 360 min/)).toBeInTheDocument();
  });
});
