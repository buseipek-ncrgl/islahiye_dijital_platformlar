import React from 'react';
import { Clock, Eye, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CmsContentItem } from '../../../types/admin';
import { StatusBadge } from '../content/StatusBadge';
import { VerificationBadge } from '../content/VerificationBadge';
import { ImageWithFallback } from '../../ui/ImageWithFallback';

interface RecentContentWidgetProps {
  items: CmsContentItem[];
  onSelectItem: (item: CmsContentItem) => void;
}

export const RecentContentWidget: React.FC<RecentContentWidgetProps> = ({
  items,
  onSelectItem,
}) => {
  return (
    <div className="bg-white rounded-sm border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-forest" />
          <h3 className="text-sm font-sans font-bold text-slate-900">
            Son Güncellenen & İncelenen Kayıtlar
          </h3>
        </div>

        <Link
          to="/yonetim/yemekler"
          className="text-xs font-mono font-semibold text-forest hover:text-forest-800 transition-colors flex items-center gap-1"
        >
          <span>Tüm Envanteri Gör</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {items.slice(0, 6).map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectItem(item)}
            className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
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

              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    {item.contentTypeLabel}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {item.formattedDate || item.publishedAt}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-slate-900 group-hover:text-forest transition-colors truncate">
                  {item.title}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="hidden sm:flex items-center gap-1.5">
                <StatusBadge status={item.publicationStatus} />
                <VerificationBadge status={item.verificationStatus} isDemo={item.isDemo} />
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectItem(item);
                }}
                className="p-1.5 rounded-sm text-slate-400 hover:text-forest hover:bg-slate-100 transition-colors"
                aria-label="Detay İncele"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
