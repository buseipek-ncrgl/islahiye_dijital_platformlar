import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string; // e.g. 'w-96' or 'w-[420px]'
  variant?: 'overlay' | 'side-panel';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'w-[420px]',
  variant = 'overlay',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (variant === 'side-panel') {
    // Yan panel modu: Ekranı örtmez, tablonun yanında yer kaplar, tablo okunabilir kalır.
    return (
      <aside
        className={`${width} shrink-0 bg-white border-l border-brand-border shadow-lg flex flex-col h-full overflow-hidden z-20 transition-all`}
        aria-label={title}
      >
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-brand-textPrimary">{title}</h3>
            {subtitle && <p className="text-xs text-brand-textSecondary mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {children}
        </div>
      </aside>
    );
  }

  // Standart overlay / modal çekmece modu (özellikle mobil veya odaklanmış görünüm için)
  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside className={`${width} max-w-full bg-white shadow-2xl flex flex-col h-full overflow-hidden border-l border-brand-border z-10 animate-in slide-in-from-right duration-200`}>
          <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-brand-textPrimary">{title}</h3>
              {subtitle && <p className="text-xs text-brand-textSecondary mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {children}
          </div>
        </aside>
      </div>
    </div>
  );
};
