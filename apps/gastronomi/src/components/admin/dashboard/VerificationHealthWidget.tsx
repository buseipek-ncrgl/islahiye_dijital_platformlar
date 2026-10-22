import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';
import { CmsStats } from '../../../types/admin';

interface VerificationHealthWidgetProps {
  stats: CmsStats;
}

export const VerificationHealthWidget: React.FC<VerificationHealthWidgetProps> = ({ stats }) => {
  const verifiedPercent = Math.round((stats.verifiedCount / stats.totalItems) * 100) || 0;
  const demoPercent = Math.round((stats.simulatedDemoCount / stats.totalItems) * 100) || 0;
  const unverifiedPercent = 100 - verifiedPercent - demoPercent;

  return (
    <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-forest" />
            <h3 className="text-sm font-sans font-bold text-slate-900">
              İçerik Güvenilirlik & Doğrulama Sağlığı
            </h3>
          </div>
          <span className="text-xs font-mono font-semibold text-forest bg-forest-50 px-2 py-0.5 rounded-xs border border-forest-200">
            %{verifiedPercent} Doğrulanmış Kayıt
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="h-2.5 w-full bg-slate-100 rounded-xs overflow-hidden flex mb-4">
          <div
            style={{ width: `${verifiedPercent}%` }}
            className="bg-forest h-full transition-all duration-500"
            title={`Doğrulanmış: %${verifiedPercent}`}
          />
          <div
            style={{ width: `${demoPercent}%` }}
            className="bg-amber-400 h-full transition-all duration-500"
            title={`Temsili Demo: %${demoPercent}`}
          />
          <div
            style={{ width: `${unverifiedPercent}%` }}
            className="bg-slate-300 h-full transition-all duration-500"
            title={`Planlama / Doğrulanmamış: %${unverifiedPercent}`}
          />
        </div>

        {/* Segment Metrics */}
        <div className="grid grid-cols-3 gap-2 text-xs font-sans mb-4">
          <div className="p-2.5 rounded-sm bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-forest mb-1 font-mono text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-forest shrink-0" />
              <span>Doğrulanmış</span>
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {stats.verifiedCount}
            </div>
            <div className="text-[10px] text-slate-500 font-sans">
              Resmî & belgelenmiş
            </div>
          </div>

          <div className="p-2.5 rounded-sm bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-amber-700 mb-1 font-mono text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span>Temsili Demo</span>
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {stats.simulatedDemoCount}
            </div>
            <div className="text-[10px] text-slate-500 font-sans">
              Arayüz şablonu
            </div>
          </div>

          <div className="p-2.5 rounded-sm bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-600 mb-1 font-mono text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              <span>İncelemede</span>
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {stats.unverifiedCount}
            </div>
            <div className="text-[10px] text-slate-500 font-sans">
              Planlanan arşiv
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Note */}
      <div className="p-3 rounded-sm bg-slate-50 border border-slate-200 text-xs font-sans text-slate-600 space-y-1">
        <div className="font-semibold text-slate-800 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-forest" />
          <span>TÜRKPATENT Coğrafi İşaret İlkesi</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          İslahiye Biberi tescili (No: 991, 05.01.2022) Gaziantep Ticaret Borsası mülkiyetindedir.
          Yayın ve duyuru onaylarında resmî kurum tescil ve kaynak URL şartı aranmaktadır.
        </p>
      </div>
    </div>
  );
};
