import React from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  hint,
  error,
  options,
  id,
  className = '',
  required,
  disabled,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-brand-textPrimary">
          {label} {required && <span className="text-brand-danger ml-0.5">*</span>}
        </label>
      )}

      {hint && (
        <p id={selectId ? `${selectId}-hint` : undefined} className="text-[11px] text-brand-textSecondary">
          {hint}
        </p>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error)}
          disabled={disabled}
          required={required}
          className={`w-full rounded-md border text-xs bg-white text-brand-textPrimary appearance-none pl-3.5 pr-8 py-2 h-9 transition-colors
            ${error
              ? 'border-brand-danger focus:border-brand-danger focus:ring-1 focus:ring-brand-danger'
              : 'border-slate-300 hover:border-slate-400 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue'
            }
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            focus:outline-none
            ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3 text-slate-400 pointer-events-none flex items-center">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error && (
        <p id={selectId ? `${selectId}-error` : undefined} className="text-xs text-brand-danger font-medium flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
