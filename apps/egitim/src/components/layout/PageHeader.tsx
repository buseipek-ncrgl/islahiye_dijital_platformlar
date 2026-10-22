import React from 'react';

interface PageHeaderProps {
  title: string;
  category?: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  breadcrumb?: Array<{ label: string; href?: string }>;
}

/**
 * Tüm Rol Panellerinde Ortak Sayfa Başlığı Standardı
 * Aynı hiyerarşi, aynı font boyutu ve aynı sol kenar başlangıcı sağlar.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  category,
  description,
  actions,
  badge,
  breadcrumb,
}) => {
  return (
    <div className="border-b border-slate-200/80 pb-5 mb-2">
      {/* İsteğe bağlı Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          {breadcrumb.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-400">/</span>}
              {item.href ? (
                <a href={item.href} className="hover:text-slate-800 transition">
                  {item.label}
                </a>
              ) : (
                <span className="text-slate-800 font-medium">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          {category && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {category}
              </span>
              {badge}
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
