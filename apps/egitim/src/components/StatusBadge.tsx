import React from 'react';

interface StatusBadgeProps {
  label: string;
  variant?: 'warning' | 'primary' | 'success';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, variant = 'primary' }) => {
  const variantStyles = {
    warning: 'bg-amber-100 text-amber-900 border border-amber-300',
    primary: 'bg-brand-50 text-brand-700 border border-brand-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium tracking-wide ${variantStyles[variant]}`}>
      {label}
    </span>
  );
};
