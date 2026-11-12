import React from 'react';
import { Layers } from 'lucide-react';
import { CmsStats } from '../../../types/admin';
import { BarChart, BarChartItem } from '../charts/BarChart';

interface ContentDistributionWidgetProps {
  stats: CmsStats;
}

export const ContentDistributionWidget: React.FC<ContentDistributionWidgetProps> = ({ stats }) => {
  const barItems: BarChartItem[] = [
    {
      id: 'dish',
      label: 'Yöresel Yemekler',
      value: stats.countsByType.dish,
      color: '#059669', // Emerald
      secondaryText: 'Tescilli ana yemek ve hamur işleri',
      to: '/yonetim/yemekler',
    },
    {
      id: 'recipe',
      label: 'Geleneksel Tarifler',
      value: stats.countsByType.recipe,
      color: '#0d9488', // Teal
      secondaryText: 'Porsiyon ölçekli ocaklık reçeteleri',
      to: '/yonetim/tarifler',
    },
    {
      id: 'place',
      label: 'Gastronomi Haritası & Mekanlar',
      value: stats.countsByType.place,
      color: '#2563eb', // Blue
      secondaryText: 'Taş fırınlar, lokantalar ve sergi havzaları',
      to: '/yonetim/harita',
    },
    {
      id: 'editorial_article',
      label: 'Mutfak Mirası & Makale',
      value:
        stats.countsByType.cultural_story +
        stats.countsByType.editorial_article +
        stats.countsByType.news,
      color: '#4f46e5', // Indigo
      secondaryText: 'Sözlü tarih, haber ve kültürel bellek yayınları',
      to: '/yonetim/kulturel-miras',
    },
    {
      id: 'film',
      label: 'Medya & Sinematik Klip',
      value: stats.countsByType.film,
      color: '#d97706', // Amber
      secondaryText: 'Atmosfer klipleri ve fotoğraf arşivi',
      to: '/yonetim/medya',
    },
    {
      id: 'announcement',
      label: 'Kurumsal Duyurular',
      value: stats.countsByType.announcement,
      color: '#e11d48', // Rose
      secondaryText: 'Resmî bülten ve tescil duyuruları',
      to: '/yonetim/duyurular',
    },
  ];

  return (
    <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Envanter Modül Dağılımı
              </h3>
              <p className="text-[11px] text-slate-500">
                Veritabanındaki unsurların gastronomi kategorilerine göre gerçek dağılımı.
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shrink-0 self-start sm:self-auto">
            {stats.totalItems} Toplam Kayıt
          </span>
        </div>

        {/* Real Horizontal Bar Chart */}
        <div>
          <div className="flex items-center justify-between text-xs font-sans font-medium text-slate-500 mb-2 px-1">
            <span>İçerik Kategorisi</span>
            <span>Kayıt / Oran</span>
          </div>
          <BarChart items={barItems} orientation="horizontal" showPercent={true} />
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-sans">
        <span className="font-medium">
          Toplam Envanter: <strong className="text-slate-900">{stats.totalItems} Kayıt</strong>
        </span>
        <span className="text-[11px] font-sans font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          Canlı Veritabanı
        </span>
      </div>
    </div>
  );
};
