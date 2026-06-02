import type { ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  /** Contenido adicional (ej. ícono) */
  children?: ReactNode;
  /** Clase CSS adicional */
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-700 text-white hover:bg-blue-800 focus-visible:ring-blue-600',
  secondary:
    'bg-white text-blue-700 border border-blue-700 hover:bg-blue-50 focus-visible:ring-blue-600',
  ghost:
    'bg-transparent text-gray-500 hover:bg-gray-100 focus-visible:ring-gray-400',
};

/**
 * Átomo Button reutilizable.
 * Soporta variantes primary / secondary / ghost y estado disabled.
 * Sin lógica de negocio.
 */
export function Button({
  label,
  onClick,
  disabled = false,
  variant = 'primary',
  children,
  className = '',
  type = 'button',
  title,
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-semibold text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  const disabledClasses = disabled
    ? 'opacity-40 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={!disabled ? onClick : undefined}
      className={`${base} ${variantClasses[variant]} ${disabledClasses} ${className}`}
      title={title}
      aria-disabled={disabled}
    >
      {children}
      {label}
    </button>
  );
}
