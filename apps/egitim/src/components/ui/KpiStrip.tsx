import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export type KpiItemVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface KpiItem {
  id?: string;
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  subtext?: React.ReactNode;
  badge?: React.ReactNode;
  variant?: KpiItemVariant;
  to?: string;
  onClick?: () => void;
}

export interface KpiStripProps {
  items: KpiItem[];
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

/**
 * KpiStrip — Stripe / Linear / Canvas LMS Standartlarında Kompakt Metrik Bandı
 * 
 * Özellikler:
 * - Kompakt Yükseklik (En ve boy olarak küçültülmüş, sayfa içeriğini aşağı itmez).
 * - Nötr ve rafine kurumsal tipografi (text-lg font-bold, text-[11px] etiket).
 * - Tam genişlik (w-full), eşit sütun oranları ve bölünmüş çizgiler.
 */
export const KpiStrip: React.FC<KpiStripProps> = ({
  items,
  columns = 4,
  className = '',
}) => {
  const getColClass = () => {
    switch (columns) {
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-3';
      case 5:
        return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';
      case 4:
      default:
        return 'grid-cols-2 sm:grid-cols-4';
    }
  };

  return (
    <div
      className={`w-full bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden grid ${getColClass()} divide-y sm:divide-y-0 sm:divide-x divide-slate-100 ${className}`}
    >
      {items.map((item, idx) => {
        const isClickable = Boolean(item.to || item.onClick);

        const content = (
          <div className="px-3.5 py-2.5 sm:px-4 sm:py-2.5 flex flex-col justify-center min-h-[52px] hover:bg-slate-50/60 transition group">
            {/* Üst Satır: İkon + Etiket + Rozet/Ok */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                {item.icon && (
                  <span className="text-slate-400 group-hover:text-slate-600 transition shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">
                    {item.icon}
                  </span>
                )}
                <span className="text-[11px] font-semibold text-slate-500 truncate">
                  {item.label}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {item.badge}
                {isClickable && (
                  <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                )}
              </div>
            </div>

            {/* Alt Satır: Değer ve Ek Bilgi (Dikey Yığın - Değer ve Alt Metin Sıkışmaz) */}
            <div className="mt-1 min-w-0">
              <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight tabular-nums truncate">
                {item.value}
              </div>
              {item.subtext && (
                <div
                  className="text-[11px] text-slate-500 font-normal truncate mt-0.5"
                  title={typeof item.subtext === 'string' ? item.subtext : undefined}
                >
                  {item.subtext}
                </div>
              )}
            </div>
          </div>
        );

        if (item.to) {
          return (
            <Link key={item.id || idx} to={item.to} className="block focus:outline-none">
              {content}
            </Link>
          );
        }

        if (item.onClick) {
          return (
            <div
              key={item.id || idx}
              onClick={item.onClick}
              role="button"
              tabIndex={0}
              className="cursor-pointer focus:outline-none"
            >
              {content}
            </div>
          );
        }

        return <div key={item.id || idx}>{content}</div>;
      })}
    </div>
  );
};

export default KpiStrip;
