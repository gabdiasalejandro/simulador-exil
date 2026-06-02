export type NavItemStatus = 'unanswered' | 'answered' | 'flagged';

export interface NavItem {
  index: number;
  status: NavItemStatus;
}

export interface NavGridProps {
  items: NavItem[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

const statusClasses: Record<NavItemStatus, string> = {
  unanswered: 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50',
  answered: 'border-green-500 bg-green-50 text-green-800 font-semibold',
  flagged: 'border-amber-400 bg-amber-50 text-amber-800 font-semibold',
};

/**
 * Grilla de navegación entre reactivos.
 * Muestra un botón numerado por reactivo con estado visual:
 * - unanswered (blanco)
 * - answered (verde)
 * - flagged (ámbar)
 * El reactivo activo lleva un anillo de foco adicional.
 */
export function NavGrid({ items, currentIndex, onSelect }: NavGridProps) {
  return (
    <nav
      aria-label="Navegación de reactivos"
      className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3"
    >
      {items.map((item) => {
        const isCurrent = item.index === currentIndex;
        return (
          <button
            key={item.index}
            type="button"
            onClick={() => onSelect(item.index)}
            aria-current={isCurrent ? 'true' : undefined}
            aria-label={`Reactivo ${item.index + 1}, ${item.status === 'answered' ? 'respondido' : item.status === 'flagged' ? 'marcado' : 'sin responder'}`}
            className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs transition-all ${
              statusClasses[item.status]
            } ${isCurrent ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
          >
            {item.index + 1}
          </button>
        );
      })}
    </nav>
  );
}
