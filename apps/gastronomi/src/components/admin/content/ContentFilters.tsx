import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { CmsFilterState, CmsContentType } from '../../../types/admin';
import { PublicationStatus, VerificationStatus } from '../../../types';

interface ContentFiltersProps {
  filter: CmsFilterState;
  onChange: (newFilter: CmsFilterState) => void;
  totalFiltered: number;
  totalItems: number;
}

const CONTENT_TYPES: { id: CmsContentType | 'all'; label: string }[] = [
  { id: 'all', label: 'Tüm Türler' },
  { id: 'dish', label: 'Yemekler' },
  { id: 'recipe', label: 'Tarifler' },
  { id: 'news', label: 'Resmî Haber' },
  { id: 'editorial_article', label: 'Editoryal Yazı' },
  { id: 'announcement', label: 'Duyurular' },
  { id: 'event', label: 'Etkinlikler' },
  { id: 'film', label: 'Medya & Klipler' },
];

export const ContentFilters: React.FC<ContentFiltersProps> = ({
  filter,
  onChange,
  totalFiltered,
  totalItems,
}) => {
  const handleReset = () => {
    onChange({
      searchQuery: '',
      contentType: 'all',
      publicationStatus: 'all',
      verificationStatus: 'all',
      isDemoOnly: null,
    });
  };

  const isFiltered =
    filter.searchQuery !== '' ||
    filter.contentType !== 'all' ||
    filter.publicationStatus !== 'all' ||
    filter.verificationStatus !== 'all' ||
    filter.isDemoOnly !== null;

  return (
    <div className="bg-white p-4 sm:p-5 rounded-sm border border-slate-200 shadow-xs space-y-4">
      {/* Top Filter Bar: Search + Quick Stats + Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filter.searchQuery}
            onChange={(e) => onChange({ ...filter, searchQuery: e.target.value })}
            placeholder="Başlık, özet veya etikete göre filtrele..."
            className="w-full pl-9 pr-3 py-2 rounded-sm bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors font-sans"
          />
        </div>

        {/* Counter & Reset Action */}
        <div className="flex items-center gap-3 text-xs font-mono text-slate-600 justify-between sm:justify-end">
          <span>
            Gösterilen: <strong className="text-slate-900 font-bold">{totalFiltered}</strong> / {totalItems} içerik
          </span>

          {isFiltered && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Sıfırla</span>
            </button>
          )}
        </div>
      </div>

      {/* Type Filter Tabs (Scrollable on small devices) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 pt-1">
        {CONTENT_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onChange({ ...filter, contentType: type.id })}
            className={`px-3 py-1.5 rounded-sm text-xs font-medium whitespace-nowrap transition-colors ${
              filter.contentType === type.id
                ? 'bg-forest text-white shadow-xs font-semibold'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Secondary Dropdown Selectors */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-sans">
        {/* Publication Status Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono text-[11px]">Yayın Durumu:</span>
          <select
            value={filter.publicationStatus}
            onChange={(e) =>
              onChange({
                ...filter,
                publicationStatus: e.target.value as PublicationStatus | 'all',
              })
            }
            className="px-2.5 py-1 rounded-sm bg-slate-50 border border-slate-300 text-xs text-slate-800 font-medium focus:outline-none focus:border-forest"
          >
            <option value="all">Tümü</option>
            <option value="published">Yayında</option>
            <option value="draft">Taslak</option>
            <option value="in_review">İncelemede</option>
            <option value="archived">Arşivde</option>
          </select>
        </div>

        {/* Verification Status Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono text-[11px]">Doğrulama:</span>
          <select
            value={filter.verificationStatus}
            onChange={(e) =>
              onChange({
                ...filter,
                verificationStatus: e.target.value as VerificationStatus | 'all',
              })
            }
            className="px-2.5 py-1 rounded-sm bg-slate-50 border border-slate-300 text-xs text-slate-800 font-medium focus:outline-none focus:border-forest"
          >
            <option value="all">Tümü</option>
            <option value="verified">Doğrulanmış</option>
            <option value="simulated">Temsili Demo</option>
            <option value="unverified">Doğrulanmamış</option>
          </select>
        </div>

        {/* Real vs Demo Filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono text-[11px]">İçerik Tipi:</span>
          <select
            value={filter.isDemoOnly === null ? 'all' : filter.isDemoOnly ? 'demo' : 'real'}
            onChange={(e) => {
              const val = e.target.value;
              onChange({
                ...filter,
                isDemoOnly: val === 'all' ? null : val === 'demo',
              });
            }}
            className="px-2.5 py-1 rounded-sm bg-slate-50 border border-slate-300 text-xs text-slate-800 font-medium focus:outline-none focus:border-forest"
          >
            <option value="all">Tümü (Gerçek & Demo)</option>
            <option value="real">Yalnızca Doğrulanmış Resmî</option>
            <option value="demo">Yalnızca Temsili Demo</option>
          </select>
        </div>
      </div>
    </div>
  );
};
