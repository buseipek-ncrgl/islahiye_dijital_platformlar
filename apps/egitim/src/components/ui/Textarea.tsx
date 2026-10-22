import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  hint,
  error,
  id,
  className = '',
  required,
  disabled,
  rows = 3,
  ...props
}, ref) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-semibold text-brand-textPrimary">
          {label} {required && <span className="text-brand-danger ml-0.5">*</span>}
        </label>
      )}

      {hint && (
        <p id={textareaId ? `${textareaId}-hint` : undefined} className="text-[11px] text-brand-textSecondary leading-normal">
          {hint}
        </p>
      )}

      <div className="relative">
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={Boolean(error)}
          disabled={disabled}
          required={required}
          className={`w-full rounded-md border text-xs bg-white text-brand-textPrimary placeholder:text-slate-400 p-3 transition-colors
            ${error
              ? 'border-brand-danger focus:border-brand-danger focus:ring-1 focus:ring-brand-danger'
              : 'border-slate-300 hover:border-slate-400 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue'
            }
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            focus:outline-none resize-none
            ${className}`}
          {...props}
        />
      </div>

      {error && (
        <p id={textareaId ? `${textareaId}-error` : undefined} className="text-xs text-brand-danger font-medium flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
