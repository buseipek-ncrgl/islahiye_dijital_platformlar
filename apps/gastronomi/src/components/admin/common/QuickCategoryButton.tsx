import React, { useState, useEffect } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';
import { CategoryDefinition, CategoryScope } from '../../../types';
import { CATEGORY_SCOPE_MAP } from '../../../data/categories';
import { useContent } from '../../../hooks/useContent';
import { useAdminRole } from '../../../context/AdminRoleContext';

interface QuickCategoryButtonProps {
  scope: CategoryScope;
  onCreated: (category: CategoryDefinition) => void;
  className?: string;
}

export const QuickCategoryButton: React.FC<QuickCategoryButtonProps> = ({
  scope,
  onCreated,
  className = '',
}) => {
  const { saveCategory } = useContent();
  const { canCreate } = useAdminRole();
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [shortLabel, setShortLabel] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  if (!canCreate) return null;

  const scopeMeta = CATEGORY_SCOPE_MAP[scope];

  const handleOpen = () => {
    setLabel('');
    setShortLabel('');
    setDescription('');
    setError(null);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const result = saveCategory({
      scope,
      label,
      shortLabel: shortLabel.trim() || undefined,
      description: description.trim() || undefined,
      isActive: true,
    });

    if (!result.ok || !result.category) {
      setError(result.error || 'Kategori eklenemedi.');
      return;
    }

    onCreated(result.category);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer ${className}`}
      >
        <Plus className="w-3 h-3" />
        <span>Yeni Kategori</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Yeni Kategori Ekle
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Modül: <strong>{scopeMeta?.shortTitle || scope}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Adı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Örn: Çorbalar ve Sulu Yemekler"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kısa Etiket (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={shortLabel}
                  onChange={(e) => setShortLabel(e.target.value)}
                  placeholder="Dar filtre sekmeleri için kısa ad (örn: Çorbalar)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Açıklama (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kategori kapsamı hakkında kısa bilgi"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 cursor-pointer shadow-2xs"
                >
                  Kategoriyi Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

