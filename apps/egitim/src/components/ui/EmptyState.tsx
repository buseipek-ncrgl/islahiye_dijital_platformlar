import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`p-8 text-center flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h4 className="text-sm font-bold text-brand-textPrimary">{title}</h4>
      {description && (
        <p className="text-xs text-brand-textSecondary max-w-sm mt-1 mb-4 leading-normal">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};
