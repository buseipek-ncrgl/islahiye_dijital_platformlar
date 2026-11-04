import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, Clock, HelpCircle } from 'lucide-react';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'pending' | 'review' | 'draft';

export interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const variantConfig: Record<StatusVariant, { styles: string; icon: React.ReactNode }> = {
    success: {
      styles: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />,
    },
    warning: {
      styles: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />,
    },
    danger: {
      styles: 'bg-red-50 text-red-800 border-red-200',
      icon: <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" aria-hidden="true" />,
    },
    info: {
      styles: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />,
    },
    review: {
      styles: 'bg-purple-50 text-purple-800 border-purple-200',
      icon: <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" aria-hidden="true" />,
    },
    pending: {
      styles: 'bg-amber-50 text-amber-900 border-amber-300',
      icon: <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" aria-hidden="true" />,
    },
    draft: {
      styles: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />,
    },
    neutral: {
      styles: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />,
    },
  };

  const current = variantConfig[variant] || variantConfig.neutral;
  const sizeStyles = size === 'sm' ? 'text-[11px] px-2.5 py-0.5 gap-1' : 'text-xs px-3 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-semibold border rounded-full leading-none select-none ${current.styles} ${sizeStyles} ${className}`}
    >
      {showIcon && current.icon}
      <span>{label}</span>
    </span>
  );
};
