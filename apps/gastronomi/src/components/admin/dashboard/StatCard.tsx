import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StatCardProps {
  title: string;
  count: number | string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'blue' | 'slate';
  linkTo?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  count,
  description,
  icon: Icon,
  badge,
  badgeColor = 'emerald',
  linkTo,
}) => {
  const content = (
    <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
          {title}
        </span>

        <div className="w-8 h-8 rounded-sm bg-slate-100 flex items-center justify-center text-forest shrink-0">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-sans font-bold text-slate-900 tracking-tight">
            {count}
          </span>

          {badge && (
            <span
              className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-xs ${
                badgeColor === 'emerald'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : badgeColor === 'amber'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : badgeColor === 'blue'
                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {badge}
            </span>
          )}
        </div>

        <p className="text-xs font-sans text-slate-500 line-clamp-1">
          {description}
        </p>
      </div>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo} className="block h-full group">{content}</Link>;
  }

  return content;
};
