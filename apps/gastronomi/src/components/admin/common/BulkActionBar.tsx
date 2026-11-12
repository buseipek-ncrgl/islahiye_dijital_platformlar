import React from 'react';
import { CheckSquare, Trash2, Globe, Clock, X } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  totalCount?: number;
  onClearSelection: () => void;
  onBulkDelete?: () => void;
  onBulkPublish?: () => void;
  onBulkDraft?: () => void;
  canDelete?: boolean;
  canPublish?: boolean;
  isProcessing?: boolean;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkPublish,
  onBulkDraft,
  canDelete = true,
  canPublish = true,
  isProcessing = false,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-20 z-20 mb-4 rounded-xl bg-white/95 backdrop-blur-md text-slate-800 p-3 sm:p-3.5 shadow-lg border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 animate-fade-in font-sans">
      {/* Left: Selection Counter */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
          <CheckSquare className="w-4 h-4" />
        </div>
        <div className="text-xs sm:text-sm font-semibold text-slate-800">
          <span className="font-bold text-emerald-700">{selectedCount}</span> içerik seçildi
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {onBulkPublish && (
          <button
            type="button"
            onClick={onBulkPublish}
            disabled={!canPublish || isProcessing}
            title={canPublish ? 'Seçilen tüm içerikleri yayına al' : 'Rol yetkiniz yayınlamaya kısıtlı'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Toplu Yayına Al</span>
          </button>
        )}

        {onBulkDraft && (
          <button
            type="button"
            onClick={onBulkDraft}
            disabled={!canPublish || isProcessing}
            title={canPublish ? 'Seçilen tüm içerikleri taslağa çek' : 'Rol yetkiniz yayın durumunu değiştirmeye kısıtlı'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Toplu Taslağa Al</span>
          </button>
        )}

        {onBulkDelete && (
          <button
            type="button"
            onClick={onBulkDelete}
            disabled={!canDelete || isProcessing}
            title={canDelete ? 'Seçilen içerikleri kalıcı olarak sil' : 'Rol yetkiniz silmeye kısıtlı'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Toplu Sil ({selectedCount})</span>
          </button>
        )}

        <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block" />

        <button
          type="button"
          onClick={onClearSelection}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Seçimi Temizle</span>
        </button>
      </div>
    </div>
  );
};
