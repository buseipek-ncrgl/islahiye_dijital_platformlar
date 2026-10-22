import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, ExternalLink, UserCheck } from 'lucide-react';

interface AdminTopbarProps {
  onToggleSidebar: () => void;
  pageTitle: string;
  subtitle?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  onToggleSidebar,
  pageTitle,
  subtitle,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-paper/95 backdrop-blur-md border-b border-sand/70 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3.5 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-sm text-charcoal/70 hover:text-forest hover:bg-sand/20"
          aria-label="Menüyü Aç"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-sans font-bold text-forest truncate leading-tight">
            {pageTitle}
          </h1>
          {subtitle && (
            <p className="text-[11px] font-sans text-charcoal/55 truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Center: Search if provided */}
      {onSearchChange !== undefined && (
        <div className="hidden md:flex items-center flex-1 max-w-xs relative">
          <Search className="w-4 h-4 text-charcoal/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="İçeriklerde hızlı ara..."
            className="w-full pl-9 pr-3 py-1.5 rounded-sm bg-sand/15 border border-sand/70 text-xs font-sans text-charcoal placeholder:text-charcoal/45 focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors"
          />
        </div>
      )}

      {/* Right: Simulation Mode Badge & Visitor Portal Link */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Simulation Mode Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-[11px] font-mono font-medium shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">Simülasyon:</span>
          <span className="font-semibold">Etkileşimli Demo</span>
        </div>

        {/* Demo Role Profile Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-sand/25 border border-sand/70 text-charcoal/80 text-[11px] font-mono">
          <UserCheck className="w-3.5 h-3.5 text-forest shrink-0" />
          <span>Rol: <strong>Oda Yöneticisi</strong></span>
        </div>

        {/* Visitor Portal Direct Link */}
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-forest text-ivory text-xs font-semibold uppercase tracking-wider hover:bg-forest-800 transition-colors shadow-xs"
        >
          <span className="hidden sm:inline">Portala Git</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </header>
  );
};
