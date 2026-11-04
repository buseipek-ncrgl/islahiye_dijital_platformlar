import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export type StatCardVariant = 'default' | 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'sky';

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  description?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  variant?: StatCardVariant;
  progress?: {
    value: number; // 0 - 100
    colorClass?: string;
  };
  to?: string;
  onClick?: () => void;
  className?: string;
}

const VARIANT_STYLES: Record<
  StatCardVariant,
  { iconBg: string; iconColor: string; borderHover: string; progressBg: string }
> = {
  default: {
    iconBg: 'bg-slate-100/90',
    iconColor: 'text-slate-600',
    borderHover: 'hover:border-slate-300',
    progressBg: 'bg-slate-600',
  },
  blue: {
    iconBg: 'bg-slate-100/90',
    iconColor: 'text-slate-700',
    borderHover: 'hover:border-blue-300',
    progressBg: 'bg-blue-600',
  },
  emerald: {
    iconBg: 'bg-slate-100/90',
    iconColor: 'text-emerald-700',
    borderHover: 'hover:border-emerald-300',
    progressBg: 'bg-emerald-600',
  },
  amber: {
    iconBg: 'bg-slate-100/90',
    iconColor: 'text-amber-700',
    borderHover: 'hover:border-amber-300',
    progressBg: 'bg-amber-500',
  },
  purple: {
    iconBg: 'bg-slate-100/90',
    iconColor: 'text-slate-700',
    borderHover: 'hover:border-purple-300',
    progressBg: 'bg-purple-600',
  },
  rose: {
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-700',
    borderHover: 'hover:border-rose-300',
    progressBg: 'bg-rose-600',
  },
  sky: {
    iconBg: 'bg-slate-100/90',
    iconColor: 'text-slate-700',
    borderHover: 'hover:border-sky-300',
    progressBg: 'bg-sky-500',
  },
};

/**
 * Platform Genelinde Standart İstatistik Kartı Bileşeni
 * IBM Carbon ve Material 3 kurumsal veri yoğunluğu prensiplerini takip eder.
 * Kompakt, dengeli yükseklik ve sabit iç hizalama sunar.
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  subtitle,
  badge,
  variant = 'default',
  progress,
  to,
  onClick,
  className = '',
}) => {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.default;
  const isClickable = Boolean(to || onClick);
  const subText = subtitle ?? description;

  const cardContent = (
    <div className="flex flex-col justify-between h-full min-h-[66px]">
      <div>
        {/* Üst Satır: Kompakt İkon + Başlık ve Opsiyonel Rozet/Ok */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {icon && (
              <div
                className={`w-6 h-6 rounded-md ${styles.iconBg} ${styles.iconColor} flex items-center justify-center shrink-0 border border-slate-200/50`}
              >
                <div className="w-3.5 h-3.5 flex items-center justify-center">{icon}</div>
              </div>
            )}
            <span className="text-[11px] font-medium text-slate-500 truncate" title={title}>
              {title}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {badge && <div className="scale-90 origin-right">{badge}</div>}
            {isClickable && (
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0" />
            )}
          </div>
        </div>

        {/* Sayısal Değer */}
        <div className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight tabular-nums mt-1 truncate">
          {value}
        </div>
      </div>

      {/* Alt Bilgi & İlerleme Çubuğu */}
      <div className="mt-1">
        {progress && (
          <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden mb-1">
            <div
              className={`h-1 rounded-full ${progress.colorClass || styles.progressBg}`}
              style={{ width: `${Math.min(Math.max(progress.value, 0), 100)}%` }}
            />
          </div>
        )}
        {subText ? (
          <div className="text-[10px] text-slate-400 font-medium truncate">
            {subText}
          </div>
        ) : !progress ? (
          <div className="text-[10px] text-transparent select-none leading-none">&nbsp;</div>
        ) : null}
      </div>
    </div>
  );

  const baseClasses = `px-3 py-2 sm:px-3.5 sm:py-2.5 bg-white rounded-lg border border-slate-200/80 shadow-2xs hover:border-slate-300 transition ${
    isClickable ? `group cursor-pointer ${styles.borderHover}` : ''
  } ${className}`;

  if (to) {
    return (
      <Link to={to} className={baseClasses}>
        {cardContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <div onClick={onClick} role="button" tabIndex={0} className={baseClasses}>
        {cardContent}
      </div>
    );
  }

  return <div className={baseClasses}>{cardContent}</div>;
};

export default StatCard;
