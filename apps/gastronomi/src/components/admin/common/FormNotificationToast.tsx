import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, X, ArrowUpRight } from 'lucide-react';

export interface FormNotification {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  fields?: { name: string; label: string; message: string }[];
  onScrollToField?: (fieldName: string) => void;
}

interface FormNotificationToastProps {
  notification: FormNotification | null;
  onClose: () => void;
  autoCloseDuration?: number; // ms, optional
}

export const FormNotificationToast: React.FC<FormNotificationToastProps> = ({
  notification,
  onClose,
  autoCloseDuration,
}) => {
  useEffect(() => {
    if (!notification || notification.type === 'error') return; // Do not auto-close errors so user can read them

    const timer = setTimeout(() => {
      onClose();
    }, autoCloseDuration || 4000);

    return () => clearTimeout(timer);
  }, [notification, autoCloseDuration, onClose]);

  if (!notification) return null;

  const isError = notification.type === 'error';
  const isSuccess = notification.type === 'success';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-5 right-5 z-50 max-w-md w-[calc(100vw-2.5rem)] sm:w-96 shadow-2xl rounded-2xl border backdrop-blur-md transition-all duration-300 animate-slide-left font-sans bg-white/95 overflow-hidden"
      style={{
        borderColor: isError ? '#fecdd3' : isSuccess ? '#a7f3d0' : '#e2e8f0',
      }}
    >
      {/* Top Color Accent Line */}
      <div
        className={`h-1.5 w-full ${
          isError ? 'bg-rose-500' : isSuccess ? 'bg-emerald-600' : 'bg-amber-500'
        }`}
      />

      <div className="p-4 sm:p-5 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
                isError
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : isSuccess
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              {isError ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>

            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                {notification.title || (isError ? 'Eksik veya Hatalı Alanlar Var' : 'İşlem Başarılı')}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {notification.message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer shrink-0"
            aria-label="Bildirimi Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Detailed List of Missing Fields with One-Click Scroll */}
        {notification.fields && notification.fields.length > 0 && (
          <div className="mt-2 pt-2.5 border-t border-slate-100 space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Düzeltilmesi Gereken Alanlar ({notification.fields.length}):
            </span>

            <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
              {notification.fields.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => notification.onScrollToField?.(f.name)}
                  className="w-full text-left group flex items-center justify-between p-2 rounded-lg bg-rose-50/60 hover:bg-rose-100/70 border border-rose-200/70 text-xs text-rose-900 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  title="Bu alana git ve düzenle"
                >
                  <div className="min-w-0 pr-2">
                    <strong className="font-bold text-rose-950 block truncate">
                      {f.label}
                    </strong>
                    <span className="text-[11px] text-rose-700 block truncate">
                      {f.message}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-rose-700 group-hover:text-rose-900 group-hover:translate-x-0.5 transition-transform shrink-0">
                    <span>Alana Git</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

