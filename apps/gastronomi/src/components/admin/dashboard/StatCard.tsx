import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StatCardProps {
  title: string;
  count: number | string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'blue' | 'slate' | 'purple';
  trendData?: number[];
  delta?: {
    value: string;
    isPositive?: boolean;
    showArrow?: boolean;
    icon?: LucideIcon;
  };
  linkTo?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  count,
  description,
  icon: Icon,
  badge,
  badgeColor = 'emerald',
  delta,
  linkTo,
}) => {
  const getBadgeStyle = () => {
    switch (badgeColor) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'amber':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'blue':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'purple':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'slate':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getIconContainerStyle = () => {
    switch (badgeColor) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'amber':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'blue':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'slate':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const content = (
    <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between h-full group">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans">
            {title}
          </span>

          <div
            className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${getIconContainerStyle()}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2 mb-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {count}
            </span>

            {badge && (
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${getBadgeStyle()}`}
              >
                {badge}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <p className="text-slate-500 line-clamp-1 truncate mr-2">
          {description}
        </p>

        {delta && (
          <div
            className={`inline-flex items-center gap-1 font-sans text-[11px] font-semibold shrink-0 px-2 py-0.5 rounded-md ${
              delta.isPositive !== false
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/70'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {delta.icon ? (
              <delta.icon className="w-3 h-3 text-emerald-700 shrink-0" />
            ) : delta.showArrow ? (
              delta.isPositive !== false ? (
                <TrendingUp className="w-3 h-3 text-emerald-700 shrink-0" />
              ) : (
                <TrendingDown className="w-3 h-3 text-rose-600 shrink-0" />
              )
            ) : null}
            <span>{delta.value}</span>
          </div>
        )}
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <Link
        to={linkTo}
        className="block h-full focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl"
      >
        {content}
      </Link>
    );
  }

  return content;
};
