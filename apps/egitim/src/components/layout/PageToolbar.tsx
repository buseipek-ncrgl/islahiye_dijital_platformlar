import React from 'react';

interface PageToolbarProps {
  children: React.ReactNode;
  rightActions?: React.ReactNode;
  className?: string;
}

/**
 * Tablo ve Liste Masaları için Ortak Araç Çubuğu (Toolbar)
 * Arama kutusu, filtre seçicileri ve dışa aktarma butonlarını tek hizada tutar.
 */
export const PageToolbar: React.FC<PageToolbarProps> = ({
  children,
  rightActions,
  className = '',
}) => {
  return (
    <div
      className={`bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2.5 flex-1">{children}</div>
      {rightActions && (
        <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-100">
          {rightActions}
        </div>
      )}
    </div>
  );
};
