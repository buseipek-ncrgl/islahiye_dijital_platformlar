import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit3, Trash2, Calendar, ExternalLink, Award } from 'lucide-react';
import { CmsContentItem } from '../../../types/admin';
import { ImageWithFallback } from '../../ui/ImageWithFallback';
import { StatusBadge } from './StatusBadge';
import { VerificationBadge } from './VerificationBadge';
import { useAdminRole } from '../../../context/AdminRoleContext';

interface ContentCardGridProps {
  items: CmsContentItem[];
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onSelectItem: (item: CmsContentItem) => void;
  onDeleteItem: (item: CmsContentItem) => void;
}

export const ContentCardGrid: React.FC<ContentCardGridProps> = ({
  items,
  selectedIds = [],
  onToggleSelect,
  onSelectItem,
  onDeleteItem,
}) => {
  const { canEdit, canDelete } = useAdminRole();
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-2xs">
        <p className="text-sm font-semibold text-slate-700 mb-1">
          Kayıt Bulunamadı
        </p>
        <p className="text-xs text-slate-400">
          Arama ve filtre kriterlerinize uygun envanter kaydı bulunmuyor.
        </p>
      </div>
    );
  }

  const getEditPath = (item: CmsContentItem): string | null => {
    switch (item.contentType) {
      case 'dish':
        return `/yonetim/yemekler/${item.id}/duzenle`;
      case 'recipe':
        return `/yonetim/tarifler/${item.id}/duzenle`;
      case 'news':
        return `/yonetim/haberler/${item.id}/duzenle`;
      case 'cultural_story':
        return `/yonetim/kulturel-miras/${item.id}/duzenle`;
      case 'editorial_article':
        return `/yonetim/haberler/${item.id}/duzenle`;
      case 'place':
        return `/yonetim/harita/noktalar/${item.id}/duzenle`;
      case 'announcement':
        return `/yonetim/duyurular/${item.id}/duzenle`;
      case 'event':
        return `/yonetim/etkinlikler/${item.id}/duzenle`;
      case 'artisan':
        return `/yonetim/ustalar/${item.id}/duzenle`;
      case 'film':
      case 'media':
        return '/yonetim/medya';
      case 'atlas_node':
        return '/yonetim/harita?tab=atlas';
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const isRegistered = item.id === 'islahiye-biberi';
        const selectionKey = `${item.contentType}:${item.id}`;
        const isSelected = selectedIds.includes(selectionKey) || selectedIds.includes(item.id);
        const editPath = getEditPath(item);

        return (
          <div
            key={`${item.contentType}-${item.id}`}
            className={`bg-white rounded-xl border transition-all flex flex-col justify-between overflow-hidden group ${
              isSelected
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div>
              {/* Photo & Badges */}
              <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden">
                <ImageWithFallback
                  src={item.coverImage}
                  alt={item.title}
                  fallbackText={item.title}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                />

                {/* Selection Checkbox */}
                {onToggleSelect && (
                  <div className="absolute top-2.5 left-2.5 z-20">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(selectionKey)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer bg-white/95 shadow-xs"
                      title="Bu içeriği seç"
                    />
                  </div>
                )}

                {/* Overlaid Badges */}
                <div className={`absolute top-2.5 ${onToggleSelect ? 'left-9' : 'left-2.5'} flex flex-wrap items-center gap-1.5 z-10`}>
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900/80 text-white backdrop-blur-xs">
                    {item.contentTypeLabel || item.categoryLabel}
                  </span>

                  {isRegistered && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-sans font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-xs">
                      <Award className="w-3 h-3" />
                      Tescil #991
                    </span>
                  )}
                </div>

                <div className="absolute bottom-2.5 right-2.5 z-10">
                  <StatusBadge status={item.publicationStatus} />
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-2 font-sans">
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span className="truncate text-emerald-700 font-semibold">
                    {item.categoryLabel}
                  </span>
                  <span className="shrink-0 flex items-center gap-1 font-medium">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {item.formattedDate}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900">
                  <button
                    type="button"
                    onClick={() => onSelectItem(item)}
                    className="text-left w-full line-clamp-1 hover:text-emerald-700 transition-colors cursor-pointer"
                    title={item.title}
                  >
                    {item.title}
                  </button>
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-sans">
                  {item.summary || item.subtitle || 'Kayıtlı envanter unsuru ve yayın detayları.'}
                </p>

                {/* Verification row */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  <VerificationBadge status={item.verificationStatus} isDemo={item.isDemo} />
                  {item.publicUrl && (
                    <Link
                      to={item.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-emerald-700 transition-colors p-1"
                      title="Portalda Görüntüle"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => onSelectItem(item)}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>İncele</span>
              </button>

              <div className="flex items-center gap-1">
                {canEdit && editPath && (
                  <Link
                    to={editPath}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                    title="Düzenle"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Link>
                )}

                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => onDeleteItem(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="p-1.5 rounded-lg text-slate-300 cursor-not-allowed"
                    title="Bu rolün silme yetkisi yoktur."
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
