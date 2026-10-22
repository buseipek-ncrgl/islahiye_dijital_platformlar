import React from 'react';

interface PageSectionProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Merkezi Bölüm Düzeni Bileşeni (PageSection)
 * Standart: 24-32px dikey spacing, net bölüm başlığı ve açıklama hiyerarşisi
 */
export const PageSection: React.FC<PageSectionProps> = ({
  title,
  description,
  action,
  children,
  className = '',
  id,
}) => {
  return (
    <section id={id} className={`space-y-4 ${className}`}>
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1">
          <div>
            {title && (
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
};
