import React from 'react';
import { Layers, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CmsStats, CmsContentType } from '../../../types/admin';

interface ContentDistributionWidgetProps {
  stats: CmsStats;
}

export const ContentDistributionWidget: React.FC<ContentDistributionWidgetProps> = ({ stats }) => {
  const distributionItems: {
    type: CmsContentType;
    label: string;
    count: number;
    path: string;
    color: string;
  }[] = [
    {
      type: 'dish',
      label: 'Yöresel Lezzetler',
      count: stats.countsByType.dish,
      path: '/yonetim/yemekler',
      color: 'bg-emerald-600',
    },
    {
      type: 'recipe',
      label: 'Geleneksel Tarifler',
      count: stats.countsByType.recipe,
      path: '/yonetim/tarifler',
      color: 'bg-teal-600',
    },
    {
      type: 'editorial_article',
      label: 'Mutfak Mirası & Makale',
      count: stats.countsByType.editorial_article + stats.countsByType.news,
      path: '/yonetim/haberler',
      color: 'bg-forest',
    },
    {
      type: 'film',
      label: 'Medya & Sinematik Klipler',
      count: stats.countsByType.film,
      path: '/yonetim/medya',
      color: 'bg-amber-600',
    },
    {
      type: 'announcement',
      label: 'Kurumsal Duyurular',
      count: stats.countsByType.announcement,
      path: '/yonetim/duyurular',
      color: 'bg-blue-600',
    },
    {
      type: 'event',
      label: 'Etkinlikler & Atölyeler',
      count: stats.countsByType.event,
      path: '/yonetim/etkinlikler',
      color: 'bg-purple-600',
    },
  ];

  return (
    <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-forest" />
            <h3 className="text-sm font-sans font-bold text-slate-900">
              İçerik Türü Dağılımı
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {stats.totalItems} Toplam Kayıt
          </span>
        </div>

        {/* Breakdown List with Horizontal Bars */}
        <div className="space-y-3.5">
          {distributionItems.map((item) => {
            const percent = stats.totalItems > 0 ? Math.round((item.count / stats.totalItems) * 100) : 0;

            return (
              <div key={item.type} className="group">
                <div className="flex items-center justify-between text-xs font-sans mb-1">
                  <Link
                    to={item.path}
                    className="font-medium text-slate-800 hover:text-forest transition-colors flex items-center gap-1.5"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-forest" />
                  </Link>

                  <div className="font-mono text-slate-500 text-[11px]">
                    <strong className="text-slate-900 font-semibold">{item.count}</strong> ({percent}%)
                  </div>
                </div>

                <div className="h-1.5 w-full bg-slate-100 rounded-xs overflow-hidden">
                  <div
                    style={{ width: `${percent}%` }}
                    className={`h-full ${item.color} rounded-xs transition-all duration-500`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
        <span>Fiziksel Noktalar: {stats.countsByType.place} (Onay Bekliyor)</span>
        <span>Ustalar: {stats.countsByType.artisan} (İzin Bekliyor)</span>
      </div>
    </div>
  );
};
