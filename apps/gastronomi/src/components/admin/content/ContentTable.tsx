import React from 'react';
import { Eye, Edit2, Trash2, Inbox, ChefHat, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CmsContentItem } from '../../../types/admin';
import { StatusBadge } from './StatusBadge';
import { ImageWithFallback } from '../../ui/ImageWithFallback';
import { useAdminRole } from '../../../context/AdminRoleContext';

interface ContentTableProps {
  items: CmsContentItem[];
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
  onSelectItem: (item: CmsContentItem) => void;
  onDeleteItem?: (item: CmsContentItem) => void;
}

export const ContentTable: React.FC<ContentTableProps> = ({
  items,
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  onSelectItem,
  onDeleteItem,
}) => {
  const navigate = useNavigate();
  const { canEdit, canDelete } = useAdminRole();

  const getEditUrl = (item: CmsContentItem): string | null => {
    switch (item.contentType) {
      case 'dish':
        return `/yonetim/yemekler/${item.id}/duzenle`;
      case 'recipe':
        return `/yonetim/tarifler/${item.id}/duzenle`;
      case 'cultural_story':
        return `/yonetim/kulturel-miras/${item.id}/duzenle`;
      case 'editorial_article':
        return `/yonetim/haberler/${item.id}/duzenle`;
      case 'artisan':
        return `/yonetim/ustalar/${item.id}/duzenle`;
      case 'news':
        return `/yonetim/haberler/${item.id}/duzenle`;
      case 'announcement':
        return `/yonetim/duyurular/${item.id}/duzenle`;
      case 'event':
        return `/yonetim/etkinlikler/${item.id}/duzenle`;
      case 'place':
        return `/yonetim/harita/noktalar/${item.id}/duzenle`;
      case 'film':
      case 'media':
        return '/yonetim/medya';
      case 'atlas_node':
        return '/yonetim/harita?tab=atlas';
      default:
        return null;
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-2xs">
        <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 mb-1">
          Eşleşen İçerik Bulunamadı
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Mevcut arama veya filtre kriterlerinize uygun kayıt bulunamadı. Lütfen filtrelerinizi sıfırlayın veya farklı bir terim arayın.
        </p>
      </div>
    );
  }

  const isRecipeList = items.length > 0 && items.every((i) => i.contentType === 'recipe');
  const isDishList = items.length > 0 && items.every((i) => i.contentType === 'dish');
  const selectedInViewCount = items.filter(
    (item) => selectedIds.includes(`${item.contentType}:${item.id}`) || selectedIds.includes(item.id)
  ).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
            <tr>
              {onToggleSelect && (
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedInViewCount === items.length}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate =
                          selectedInViewCount > 0 && selectedInViewCount < items.length;
                      }
                    }}
                    onChange={onSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer"
                    title="Tümünü Seç / Kaldır"
                  />
                </th>
              )}
              <th className="py-3 px-4 w-14">Görsel</th>
              <th className="py-3 px-4 min-w-[220px]">
                {isRecipeList ? 'Tarif Başlığı & Özet' : isDishList ? 'Yemek Adı & Tanım' : 'Başlık & Özet'}
              </th>
              <th className="py-3 px-4 min-w-[130px]">
                {isRecipeList ? 'Zorluk & Ocaklık Süresi' : 'Kategori'}
              </th>
              <th className="py-3 px-4 min-w-[110px]">
                {isRecipeList ? 'Porsiyon' : 'Yayın Durumu'}
              </th>
              {isRecipeList && (
                <th className="py-3 px-4 min-w-[100px]">Yayın Durumu</th>
              )}
              {!isRecipeList && (
                <th className="py-3 px-4 min-w-[110px] hidden md:table-cell">Kayıt Tarihi</th>
              )}
              <th className="py-3 px-4 text-right min-w-[140px]">İşlemler</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const selectionKey = `${item.contentType}:${item.id}`;
              const isSelected = selectedIds.includes(selectionKey) || selectedIds.includes(item.id);
              return (
                <tr
                  key={`${item.contentType}-${item.id}`}
                  className={`transition-colors group ${
                    isSelected ? 'bg-emerald-50/50' : 'hover:bg-slate-50/70'
                  }`}
                >
                  {/* Row Checkbox */}
                  {onToggleSelect && (
                    <td className="py-3.5 px-3 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(selectionKey)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer"
                        title="Bu öğeyi seç"
                      />
                    </td>
                  )}

                  {/* Visual Thumbnail */}
                <td className="py-3.5 px-4 align-middle">
                  <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    {item.coverImage ? (
                      <ImageWithFallback
                        src={item.coverImage}
                        alt={item.title}
                        fallbackText={item.title}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-sans text-slate-400 font-bold">
                        {item.contentType.slice(0, 3).toUpperCase()}
                      </div>
                    )}
                  </div>
                </td>

                {/* Title & Subtitle */}
                <td className="py-3.5 px-4 align-middle">
                  <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 text-xs sm:text-[13px]">
                    {item.title}
                  </div>
                  {item.subtitle && (
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {item.subtitle}
                    </div>
                  )}
                  {item.summary && !item.subtitle && (
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {item.summary}
                    </div>
                  )}
                </td>

                {/* Specific Column 1: Category or Difficulty/Time */}
                <td className="py-3.5 px-4 align-middle">
                  {isRecipeList ? (
                    <div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-semibold">
                        <ChefHat className="w-3 h-3" />
                        <span>{item.tags?.[1] || 'Orta Zorluk'}</span>
                      </span>
                      {item.metrics?.duration && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{item.metrics.duration}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-semibold">
                        {item.categoryLabel || item.category}
                      </span>
                      {item.id === 'islahiye-biberi' && (
                        <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                          TÜRKPATENT #991
                        </div>
                      )}
                    </div>
                  )}
                </td>

                {/* Specific Column 2: Servings or Status */}
                <td className="py-3.5 px-4 align-middle">
                  {isRecipeList ? (
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.metrics?.servings || 4} Kişilik</span>
                    </div>
                  ) : (
                    <StatusBadge status={item.publicationStatus} />
                  )}
                </td>

                {/* Recipe specific: Status */}
                {isRecipeList && (
                  <td className="py-3.5 px-4 align-middle">
                    <StatusBadge status={item.publicationStatus} />
                  </td>
                )}

                {/* General specific: Date */}
                {!isRecipeList && (
                  <td className="py-3.5 px-4 align-middle text-slate-500 text-[11px] hidden md:table-cell font-sans font-medium">
                    {item.formattedDate || item.publishedAt || '—'}
                  </td>
                )}

                {/* Actions: Düzenle, İncele, Sil (Role-aware) */}
                <td className="py-3.5 px-4 align-middle text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {canEdit && getEditUrl(item) && (
                      <button
                        type="button"
                        onClick={() => {
                          const target = getEditUrl(item);
                          if (target) navigate(target);
                        }}
                        className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition border border-emerald-200/70 shadow-2xs whitespace-nowrap"
                        title="Kayıt Detaylarını Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Düzenle</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectItem(item)}
                      className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition border border-slate-200 shadow-2xs whitespace-nowrap"
                      title="Önizle & İncele"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>İncele</span>
                    </button>

                    {onDeleteItem && (
                      <button
                        type="button"
                        disabled={!canDelete}
                        onClick={() => canDelete && onDeleteItem(item)}
                        className={`h-8 w-8 inline-flex items-center justify-center rounded-lg border shadow-2xs shrink-0 transition ${
                          canDelete
                            ? 'bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border-slate-200 hover:border-rose-200 cursor-pointer'
                            : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                        }`}
                        title={canDelete ? 'Envanterden Sil' : 'Bu rolün kayıt silme yetkisi yoktur.'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
};
