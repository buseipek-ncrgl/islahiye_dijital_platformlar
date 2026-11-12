import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { CmsStats } from '../../../types/admin';
import { DonutChart, DonutSegment } from '../charts/DonutChart';

interface VerificationHealthWidgetProps {
  stats: CmsStats;
}

export const VerificationHealthWidget: React.FC<VerificationHealthWidgetProps> = ({ stats }) => {
  const publishedPercent =
    stats.totalItems > 0 ? Math.round((stats.publishedCount / stats.totalItems) * 100) : 0;
  const verifiedPercent =
    stats.totalItems > 0 ? Math.round((stats.verifiedCount / stats.totalItems) * 100) : 0;
  const draftCount = stats.draftCount + stats.inReviewCount;

  const donutSegments: DonutSegment[] = [
    {
      id: 'published',
      label: 'Canlı Yayında',
      value: stats.publishedCount,
      color: '#059669', // Emerald
      sublabel: 'Ziyaretçiye açık içerikler',
    },
    {
      id: 'draft',
      label: 'Taslak & İnceleme',
      value: draftCount,
      color: '#f59e0b', // Amber
      sublabel: 'Hazırlık / editör kontrolünde',
    },
    {
      id: 'archived',
      label: 'Arşiv & Diğer',
      value: stats.archivedCount || 0,
      color: '#94a3b8', // Slate
      sublabel: 'Yayından kaldırılmış kayıtlar',
    },
  ];

  return (
    <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between font-sans">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                İçerik Güvenilirlik &amp; Tescil Sağlığı
              </h3>
              <p className="text-[11px] text-slate-500">
                TÜRKPATENT tescil belgeleri, saha onayları ve yayın doğruluk dağılımı.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/70 shrink-0">
            %{verifiedPercent} Doğrulanmış
          </span>
        </div>

        {/* Interactive Donut Chart Distribution */}
        <div className="py-2">
          <DonutChart
            segments={donutSegments}
            centerTitle={`%${publishedPercent}`}
            centerSubtitle="YAYINDA"
            size={140}
            strokeWidth={18}
          />
        </div>

        {/* 3 Metric Summary Boxes */}
        <div className="grid grid-cols-3 gap-2.5 text-xs my-4">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-emerald-700 mb-1 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>Yayında</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 tabular-nums">
              {stats.publishedCount}
            </div>
            <div className="text-[10px] text-slate-500">
              Canlı portalda
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-amber-700 mb-1 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>Taslak / İnceleme</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 tabular-nums">
              {draftCount}
            </div>
            <div className="text-[10px] text-slate-500">
              Hazırlık aşamasında
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-600 mb-1 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
              <span>Toplam Kayıt</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 tabular-nums">
              {stats.totalItems}
            </div>
            <div className="text-[10px] text-slate-500">
              Envanter geneli
            </div>
          </div>
        </div>
      </div>

      {/* Corporate Institutional Callout */}
      <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/70 text-xs text-emerald-950 space-y-1">
        <div className="font-semibold text-emerald-900 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>TÜRKPATENT Tescil Güvencesi</span>
        </div>
        <p className="text-[11px] leading-relaxed text-emerald-800/80">
          İslahiye Biberi 991 tescil numarasıyla kayıtlıdır. Doğrulanmamış hiçbir yemek veya ürün sistemde resmî tescilli olarak sunulamaz.
        </p>
      </div>
    </div>
  );
};
