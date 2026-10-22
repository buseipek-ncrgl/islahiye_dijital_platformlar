import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  hint,
  error,
  leftIcon,
  rightIcon,
  id,
  className = '',
  required,
  disabled,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-brand-textPrimary">
          {label} {required && <span className="text-brand-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}

      {hint && (
        <p id={inputId ? `${inputId}-hint` : undefined} className="text-[11px] text-brand-textSecondary leading-normal">
          {hint}
        </p>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          aria-describedby={
            [
              hint && inputId ? `${inputId}-hint` : null,
              error && inputId ? `${inputId}-error` : null,
            ].filter(Boolean).join(' ') || undefined
          }
          aria-invalid={Boolean(error)}
          disabled={disabled}
          required={required}
          className={`w-full rounded-md border text-xs bg-white text-brand-textPrimary placeholder:text-slate-400 transition-colors
            ${leftIcon ? 'pl-9' : 'pl-3.5'}
            ${rightIcon ? 'pr-9' : 'pr-3.5'}
            py-2 h-9
            ${error
              ? 'border-brand-danger focus:border-brand-danger focus:ring-1 focus:ring-brand-danger'
              : 'border-slate-300 hover:border-slate-400 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue'
            }
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            focus:outline-none
            ${className}`}
          {...props}
        />

        {rightIcon && !error && (
          <div className="absolute right-3 text-slate-400 flex items-center">
            {rightIcon}
          </div>
        )}

        {error && (
          <div className="absolute right-3 text-brand-danger flex items-center">
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
          </div>
        )}
      </div>

      {error && (
        <p id={inputId ? `${inputId}-error` : undefined} className="text-xs text-brand-danger font-medium flex items-center gap-1 mt-1">
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
