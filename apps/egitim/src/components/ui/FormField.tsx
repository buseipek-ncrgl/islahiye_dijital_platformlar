import React from 'react';

interface FormFieldProps {
  label?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children: React.ReactNode;
  id?: string;
  className?: string;
}

/**
 * Kurumsal Form Alanı Standart Sarmalayıcısı (FormField)
 * GOV.UK ve WCAG 2.2 AA erişilebilirlik standartlarına uygun etiket ve hata hiyerarşisi.
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  helperText,
  error,
  children,
  id,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 leading-none"
        >
          {label}
          {required && <span className="text-rose-500 ml-1 font-bold" aria-hidden="true">*</span>}
        </label>
      )}

      {children}

      {helperText && !error && (
        <p className="text-[11px] text-slate-500 leading-normal">{helperText}</p>
      )}

      {error && (
        <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1 mt-1 leading-normal" role="alert">
          <span>•</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
