import React from 'react';

interface StatusBadgeProps {
  label: string;
  variant?: 'warning' | 'forest' | 'copper';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, variant = 'forest' }) => {
  const variantStyles = {
    warning: 'bg-amber-100 text-amber-900 border border-amber-300',
    forest: 'bg-forest text-ivory border border-forest-600',
    copper: 'bg-copper/15 text-copper-dark border border-copper/30',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase ${variantStyles[variant]}`}>
      {label}
    </span>
  );
};
