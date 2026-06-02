import type { AreaCode, SubareaCode } from '../../../domain/taxonomy/taxonomy';
import { AREA_CODES, AREA_NOMBRES, OFFICIAL_DISTRIBUTION } from '../../../domain/taxonomy/taxonomy';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TemaSeleccionado {
  area: AreaCode;
  /** undefined = "Todas las subáreas del área" */
  subarea?: SubareaCode;
}

export interface TemaSidebarProps {
  /** Tema actualmente seleccionado (puede ser null si nada está seleccionado). */
  seleccion: TemaSeleccionado | null;
  /** Área que está expandida en la lista. */
  areaExpandida: AreaCode | null;
  onExpandir: (area: AreaCode) => void;
  onSeleccionar: (tema: TemaSeleccionado) => void;
}

// ---------------------------------------------------------------------------
// Sidebar de temas
// ---------------------------------------------------------------------------

/**
 * Componente presentacional: lista las 6 áreas por nombre completo.
 * Al expandir un área muestra sus subáreas + opción "Todas".
 * Seleccionar un tema dispara onSeleccionar.
 * Sin lógica de negocio — solo presentación.
 */
export function TemaSidebar({
  seleccion,
  areaExpandida,
  onExpandir,
  onSeleccionar,
}: TemaSidebarProps) {
  return (
    <nav
      className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
      aria-label="Selección de tema"
    >
      <header className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-widest">
          Tema
        </h2>
      </header>

      <ul className="divide-y divide-gray-100">
        {AREA_CODES.map((areaCode) => {
          const areaNombre = AREA_NOMBRES[areaCode];
          const isExpanded = areaExpandida === areaCode;
          const subareas = OFFICIAL_DISTRIBUTION.filter((e) => e.area === areaCode);

          const isAreaActive =
            seleccion?.area === areaCode && seleccion.subarea === undefined;

          return (
            <li key={areaCode}>
              {/* Encabezado del área */}
              <button
                type="button"
                onClick={() => onExpandir(areaCode)}
                className={`flex w-full items-center justify-between px-5 py-3.5 text-left text-sm font-medium transition-colors ${
                  isAreaActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-800 hover:bg-gray-50'
                }`}
                aria-expanded={isExpanded}
              >
                <span>{areaNombre}</span>
                <span className={`text-xs ${isAreaActive ? 'text-blue-100' : 'text-gray-400'}`}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>

              {/* Subáreas (colapsables) */}
              {isExpanded && (
                <ul className="border-t border-gray-100 bg-gray-50">
                  {/* Opción "Todas" */}
                  <li>
                    <button
                      type="button"
                      onClick={() => onSeleccionar({ area: areaCode })}
                      className={`w-full px-8 py-2.5 text-left text-sm transition-colors ${
                        seleccion?.area === areaCode && seleccion.subarea === undefined
                          ? 'bg-blue-600 font-semibold text-white'
                          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-800'
                      }`}
                    >
                      Todas las subáreas
                    </button>
                  </li>

                  {subareas.map((entry) => {
                    const isSubActive =
                      seleccion?.area === areaCode && seleccion.subarea === entry.subarea;
                    return (
                      <li key={entry.subarea}>
                        <button
                          type="button"
                          onClick={() =>
                            onSeleccionar({ area: areaCode, subarea: entry.subarea })
                          }
                          className={`w-full px-8 py-2.5 text-left text-sm transition-colors ${
                            isSubActive
                              ? 'bg-blue-600 font-semibold text-white'
                              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-800'
                          }`}
                        >
                          {entry.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
