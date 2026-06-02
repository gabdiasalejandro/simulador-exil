import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renderiza el texto del botón', () => {
    render(<Button label="Simular" />);
    expect(screen.getByRole('button', { name: 'Simular' })).toBeInTheDocument();
  });

  it('llama onClick cuando no está deshabilitado', async () => {
    const handler = vi.fn();
    render(<Button label="Simular" onClick={handler} />);
    await userEvent.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('NO llama onClick cuando está deshabilitado', async () => {
    const handler = vi.fn();
    render(<Button label="Practicar" onClick={handler} disabled />);
    const btn = screen.getByRole('button', { name: 'Practicar' });
    await userEvent.click(btn);
    expect(handler).not.toHaveBeenCalled();
  });

  it('aplica atributo disabled al elemento nativo cuando disabled=true', () => {
    render(<Button label="Revisar" disabled />);
    expect(screen.getByRole('button', { name: 'Revisar' })).toBeDisabled();
  });

  it('renderiza variante primary por defecto', () => {
    render(<Button label="Simular" />);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-blue-700');
  });
});
