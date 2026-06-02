import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Timer } from './Timer';

describe('Timer', () => {
  it('renderiza el tiempo restante formateado', () => {
    render(<Timer remainingSeconds={125} onExpire={vi.fn()} />);
    // 125s = 2m 05s
    expect(screen.getByRole('timer')).toHaveTextContent('02:05');
  });

  it('muestra horas cuando el tiempo supera 3600 segundos', () => {
    render(<Timer remainingSeconds={3661} onExpire={vi.fn()} />);
    expect(screen.getByRole('timer')).toHaveTextContent('01:01:01');
  });

  it('NO renderiza nada cuando remainingSeconds es null (modo sin límite)', () => {
    const { container } = render(
      <Timer remainingSeconds={null} onExpire={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('llama onExpire cuando llega a 0', () => {
    const onExpire = vi.fn();
    render(<Timer remainingSeconds={0} onExpire={onExpire} />);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('no llama onExpire más de una vez aunque el valor sea 0 en re-renders', () => {
    const onExpire = vi.fn();
    const { rerender } = render(<Timer remainingSeconds={1} onExpire={onExpire} />);
    rerender(<Timer remainingSeconds={0} onExpire={onExpire} />);
    rerender(<Timer remainingSeconds={0} onExpire={onExpire} />);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
