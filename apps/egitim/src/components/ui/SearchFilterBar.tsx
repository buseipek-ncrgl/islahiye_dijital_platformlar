import React from 'react';
import { Search, X, LayoutGrid, List } from 'lucide-react';

export interface SearchFilterBarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
  className?: string;
}

/**
 * Platform Genelinde Standart Filtreleme ve Arama Barı
 * Arama, filtreler, görünüm değiştirici ve aksiyon butonlarını
 * tek bir hizada, standart h-9 yüksekliğinde sunar.
 */
export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Arama yapın...',
  filters,
  actions,
  viewMode,
  onViewModeChange,
  className = '',
}) => {
  return (
    <div
      className={`bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${className}`}
    >
      {/* Sol Alan: Arama Kutusu ve Filtre Kontrolleri */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
        {onSearchChange && (
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-9 pl-9 pr-8 text-xs bg-slate-50/70 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
      </div>

      {/* Sağ Alan: Görünüm Değiştirici ve Aksiyon Butonları */}
      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
        {onViewModeChange && viewMode && (
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 h-9">
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`h-7.5 px-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Liste Görünümü"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Liste</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`h-7.5 px-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Kart Görünümü"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kartlar</span>
            </button>
          </div>
        )}

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};

export default SearchFilterBar;

