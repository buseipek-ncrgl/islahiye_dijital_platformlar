import React from 'react';
import { Eye, Inbox } from 'lucide-react';
import { CmsContentItem } from '../../../types/admin';
import { StatusBadge } from './StatusBadge';
import { VerificationBadge } from './VerificationBadge';
import { ImageWithFallback } from '../../ui/ImageWithFallback';

interface ContentTableProps {
  items: CmsContentItem[];
  onSelectItem: (item: CmsContentItem) => void;
}

export const ContentTable: React.FC<ContentTableProps> = ({ items, onSelectItem }) => {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-sm border border-slate-200 p-12 text-center shadow-xs">
        <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-sans font-bold text-slate-800 mb-1">
          Eşleşen İçerik Bulunamadı
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto font-sans">
          Mevcut arama veya filtre kriterlerinize uygun kayıt bulunamadı. Lütfen filtrelerinizi sıfırlayın veya farklı bir terim arayın.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-sm border border-slate-200 shadow-xs overflow-hidden">
      {/* Desktop Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 w-14">Görsel</th>
              <th className="py-3 px-4 min-w-[200px]">Başlık & Özet</th>
              <th className="py-3 px-4 min-w-[120px]">Tür / Kategori</th>
              <th className="py-3 px-4 min-w-[100px]">Yayın Durumu</th>
              <th className="py-3 px-4 min-w-[120px]">Kaynak Doğrulama</th>
              <th className="py-3 px-4 min-w-[100px] hidden md:table-cell">Yayın Tarihi</th>
              <th className="py-3 px-4 text-right min-w-[90px]">İşlemler</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                {/* Visual Thumbnail */}
                <td className="py-3 px-4 align-middle">
                  <div className="w-10 h-10 rounded-xs bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    {item.coverImage ? (
                      <ImageWithFallback
                        src={item.coverImage}
                        alt={item.title}
                        fallbackText={item.title}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-slate-400">
                        {item.contentType.slice(0, 3).toUpperCase()}
                      </div>
                    )}
                  </div>
                </td>

                {/* Title & Subtitle */}
                <td className="py-3 px-4 align-middle">
                  <div className="font-semibold text-slate-900 group-hover:text-forest transition-colors line-clamp-1">
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

                {/* Type & Category */}
                <td className="py-3 px-4 align-middle">
                  <span className="inline-block px-1.5 py-0.5 rounded-xs bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-mono font-medium">
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

                {/* Verification Status */}
                <td className="py-3 px-4 align-middle">
                  <VerificationBadge status={item.verificationStatus} isDemo={item.isDemo} />
                </td>

                {/* Date */}
                <td className="py-3 px-4 align-middle text-slate-500 font-mono text-[11px] hidden md:table-cell">
                  {item.formattedDate || item.publishedAt || '—'}
                </td>

                {/* Action Button */}
                <td className="py-3 px-4 align-middle text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectItem(item);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-slate-100 hover:bg-forest hover:text-white text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>İncele</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
