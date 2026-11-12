import React, { useMemo } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { CmsFilterState, CmsContentType } from '../../../types/admin';
import { PublicationStatus, CategoryScope } from '../../../types';
import { useContent } from '../../../hooks/useContent';

interface ContentFiltersProps {
  filter: CmsFilterState;
  onChange: (newFilter: CmsFilterState) => void;
  totalFiltered: number;
  totalItems: number;
  activeContentType?: CmsContentType | 'articles_all' | 'all';
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  hideCategoryPills?: boolean;
}

const ALL_CONTENT_TYPES: { id: CmsContentType | 'all'; label: string }[] = [
  { id: 'all', label: 'Tüm Türler' },
  { id: 'dish', label: 'Yemekler' },
  { id: 'recipe', label: 'Tarifler' },
  { id: 'place', label: 'Harita Noktaları' },
  { id: 'artisan', label: 'Ustalar & Üreticiler' },
  { id: 'cultural_story', label: 'Mutfak Mirası' },
  { id: 'news', label: 'Resmî Haber' },
  { id: 'editorial_article', label: 'Editoryal Makale' },
  { id: 'announcement', label: 'Duyurular' },
  { id: 'event', label: 'Etkinlikler' },
  { id: 'film', label: 'Medya & Filmler' },
];

const RECIPE_DIFFICULTIES = [
  { id: 'all', label: 'Tüm Zorluklar' },
  { id: 'Kolay', label: 'Kolay' },
  { id: 'Orta', label: 'Orta' },
  { id: 'Ustalık Gerektirir', label: 'Ustalık Gerektirir' },
];

const ARTICLE_CONTENT_TYPES = [
  { id: 'all', label: 'Tüm Haberler & Yazılar' },
  { id: 'news', label: 'Resmî Haberler' },
  { id: 'editorial_article', label: 'Editoryal Makaleler' },
];

const SCOPE_ALL_LABELS: Partial<Record<CmsContentType | 'articles_all' | 'all', { scope: CategoryScope; allLabel: string }>> = {
  dish: { scope: 'dish', allLabel: 'Tüm Kategoriler' },
  announcement: { scope: 'announcement', allLabel: 'Tüm Duyurular' },
  event: { scope: 'event', allLabel: 'Tüm Etkinlikler' },
  cultural_story: { scope: 'cultural_story', allLabel: 'Tüm Miras Yazıları' },
  artisan: { scope: 'artisan', allLabel: 'Tüm Zanaatkârlar' },
};

export const ContentFilters: React.FC<ContentFiltersProps> = ({
  filter,
  onChange,
  totalFiltered,
  totalItems,
  activeContentType = 'all',
  selectedCategory = 'all',
  onCategoryChange,
  hideCategoryPills = false,
}) => {
  const { getCategories } = useContent();

  const scopeMeta = SCOPE_ALL_LABELS[activeContentType];
  const dynamicScopePills = useMemo(() => {
    if (!scopeMeta) return [];
    const cats = getCategories(scopeMeta.scope, false);
    return [{ id: 'all', label: scopeMeta.allLabel }, ...cats.map((c) => ({ id: c.id, label: c.label }))];
  }, [scopeMeta, getCategories]);

  const dynamicArticleCategories = useMemo(() => {
    if (activeContentType !== 'articles_all') return [];
    return getCategories('article', false);
  }, [activeContentType, getCategories]);
  const handleReset = () => {
    onChange({
      searchQuery: '',
      contentType: activeContentType === 'articles_all' ? 'all' : activeContentType,
      publicationStatus: 'all',
      verificationStatus: 'all',
      isDemoOnly: null,
    });
    if (onCategoryChange && !hideCategoryPills) {
      onCategoryChange('all');
    }
  };

  const isFiltered =
    filter.searchQuery !== '' ||
    filter.publicationStatus !== 'all' ||
    (activeContentType === 'all' && filter.contentType !== 'all') ||
    (!hideCategoryPills && selectedCategory !== 'all');

  const getSearchPlaceholder = () => {
    if (activeContentType === 'dish') return 'Yemek adı, malzeme veya açıklamaya göre ara...';
    if (activeContentType === 'recipe') return 'Tarif başlığı, hazırlık süresi veya pişirme yöntemine göre ara...';
    if (activeContentType === 'articles_all') return 'Haber veya makale başlığına göre ara...';
    return 'Başlık, özet veya etikete göre filtrele...';
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
      {/* Top Filter Bar: Search + Counter + Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filter.searchQuery}
            onChange={(e) => onChange({ ...filter, searchQuery: e.target.value })}
            placeholder={getSearchPlaceholder()}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
          />
        </div>

        {/* Counter & Reset Action */}
        <div className="flex items-center gap-3 text-xs text-slate-600 justify-between sm:justify-end">
          <span className="font-medium">
            Gösterilen: <strong className="text-slate-900 font-bold">{totalFiltered}</strong> / {totalItems} kayıt
          </span>

          {isFiltered && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Sıfırla</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills based on Active Content Type */}
      {!hideCategoryPills && dynamicScopePills.length > 0 && onCategoryChange && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 pt-1">
          {dynamicScopePills.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {activeContentType === 'recipe' && onCategoryChange && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 pt-1">
          {RECIPE_DIFFICULTIES.map((diff) => (
            <button
              key={diff.id}
              type="button"
              onClick={() => onCategoryChange(diff.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === diff.id
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {diff.label}
            </button>
          ))}
        </div>
      )}

      {activeContentType === 'articles_all' && onCategoryChange && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 pt-1">
          {ARTICLE_CONTENT_TYPES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
          {dynamicArticleCategories.length > 0 && (
            <span className="h-4 w-px bg-slate-200 mx-1 shrink-0" aria-hidden="true" />
          )}
          {dynamicArticleCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* General Multi-Type Pills (Only displayed when activeContentType is 'all') */}
      {activeContentType === 'all' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 pt-1">
          {ALL_CONTENT_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => onChange({ ...filter, contentType: type.id })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filter.contentType === type.id
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      )}

      {/* Secondary Dropdown Selectors */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        {/* Publication Status Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium text-[11px]">Yayın Durumu:</span>
          <select
            value={filter.publicationStatus}
            onChange={(e) =>
              onChange({
                ...filter,
                publicationStatus: e.target.value as PublicationStatus | 'all',
              })
            }
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-600"
          >
            <option value="all">Tümü (Yayında, Taslak, Arşiv)</option>
            <option value="published">Sadece Yayında</option>
            <option value="draft">Taslak</option>
            <option value="in_review">İncelemede</option>
            <option value="archived">Arşivde</option>
          </select>
        </div>
      </div>
    </div>
  );
};
