import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { NavGrid } from './NavGrid';
import type { NavItem } from './NavGrid';

function makeItems(count: number): NavItem[] {
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    status: 'unanswered' as const,
  }));
}

describe('NavGrid', () => {
  it('renderiza un botón por reactivo', () => {
    render(
      <NavGrid items={makeItems(20)} currentIndex={0} onSelect={vi.fn()} />,
    );
    // 20 botones numerados 1..20
    expect(screen.getByLabelText(/Reactivo 1,/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Reactivo 20,/)).toBeInTheDocument();
  });

  it('llama onSelect con el índice correcto al hacer clic', async () => {
    const handler = vi.fn();
    render(
      <NavGrid items={makeItems(20)} currentIndex={0} onSelect={handler} />,
    );
    await userEvent.click(screen.getByLabelText(/Reactivo 5,/));
    expect(handler).toHaveBeenCalledWith(4); // índice 0-based
  });

  it('marca el reactivo activo con aria-current', () => {
    const items = makeItems(5);
    render(<NavGrid items={items} currentIndex={2} onSelect={vi.fn()} />);
    const active = screen.getByLabelText(/Reactivo 3,/);
    expect(active).toHaveAttribute('aria-current', 'true');
  });

  it('muestra estado answered en verde', () => {
    const items: NavItem[] = [
      { index: 0, status: 'answered' },
      { index: 1, status: 'unanswered' },
    ];
    render(<NavGrid items={items} currentIndex={0} onSelect={vi.fn()} />);
    const answeredBtn = screen.getByLabelText(/Reactivo 1, respondido/);
    expect(answeredBtn.className).toContain('bg-green-50');
  });
});
