import React from 'react';
import { Clock, Eye, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CmsContentItem } from '../../../types/admin';
import { StatusBadge } from '../content/StatusBadge';
import { ImageWithFallback } from '../../ui/ImageWithFallback';
import { useAdminRole } from '../../../context/AdminRoleContext';

interface RecentContentWidgetProps {
  items: CmsContentItem[];
  onSelectItem: (item: CmsContentItem) => void;
  onDeleteItem?: (item: CmsContentItem) => void;
}

export const RecentContentWidget: React.FC<RecentContentWidgetProps> = ({
  items,
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
      case 'news':
        return `/yonetim/haberler/${item.id}/duzenle`;
      case 'artisan':
        return `/yonetim/ustalar/${item.id}/duzenle`;
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
        return '/yonetim/harita';
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Son Güncellenen Envanter Kayıtları
            </h3>
            <p className="text-[11px] text-slate-500">
              Sistemdeki en son içerikler ve doğrudan yönetim işlemleri.
            </p>
          </div>
        </div>

        <Link
          to="/yonetim/yemekler"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors flex items-center gap-1"
        >
          <span>Tüm Yemekleri Gör</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 w-12">Görsel</th>
              <th className="py-3 px-4 min-w-[200px]">Başlık & Açıklama</th>
              <th className="py-3 px-4 min-w-[120px]">Tür / Kategori</th>
              <th className="py-3 px-4 min-w-[100px]">Yayın Durumu</th>
              <th className="py-3 px-4 min-w-[100px] hidden md:table-cell">Tarih</th>
              <th className="py-3 px-4 text-right min-w-[140px]">İşlemler</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {items.slice(0, 6).map((item) => (
              <tr
                key={`${item.contentType}-${item.id}`}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                {/* Visual Thumbnail */}
                <td className="py-3 px-4 align-middle">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    {item.coverImage ? (
                      <ImageWithFallback
                        src={item.coverImage}
                        alt={item.title}
                        fallbackText={item.title}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-sans text-slate-400 font-bold">
                        {item.contentType.slice(0, 3).toUpperCase()}
                      </div>
                    )}
                  </div>
                </td>

                {/* Title */}
                <td className="py-3 px-4 align-middle">
                  <div className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {item.title}
                  </div>
                  {item.subtitle && (
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {item.subtitle}
                    </div>
                  )}
                </td>

                {/* Type & Category */}
                <td className="py-3 px-4 align-middle">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium">
                    {item.contentTypeLabel}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {item.categoryLabel}
                  </div>
                </td>

                {/* Publication Status */}
                <td className="py-3 px-4 align-middle">
                  <StatusBadge status={item.publicationStatus} />
                </td>

                {/* Date */}
                <td className="py-3 px-4 align-middle text-slate-500 text-[11px] hidden md:table-cell">
                  {item.formattedDate || item.publishedAt || '—'}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 align-middle text-right">
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

                    {onDeleteItem && canDelete && (
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition border border-slate-200 hover:border-rose-200 shadow-2xs shrink-0"
                        title="Envanterden Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
