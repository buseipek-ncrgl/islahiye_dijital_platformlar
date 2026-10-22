import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { ContentRepository } from '../../services/content/contentRepository';
import { CmsContentItem } from '../../types/admin';
import { StatCard } from '../../components/admin/dashboard/StatCard';
import { VerificationHealthWidget } from '../../components/admin/dashboard/VerificationHealthWidget';
import { ContentDistributionWidget } from '../../components/admin/dashboard/ContentDistributionWidget';
import { RecentContentWidget } from '../../components/admin/dashboard/RecentContentWidget';
import { ContentDetailDrawer } from '../../components/admin/content/ContentDetailDrawer';

import { useContent } from '../../hooks/useContent';

export const AdminDashboardPage: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<CmsContentItem | null>(null);
  const { contentVersion } = useContent();

  const stats = React.useMemo(() => ContentRepository.getStats(), [contentVersion]);
  const allItems = React.useMemo(() => ContentRepository.getAllItems(), [contentVersion]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Executive Welcome Banner */}
      <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono text-emerald-800 font-bold uppercase tracking-wider">
              DEMO ÇALIŞMA ALANI • ETKİLEŞİMLİ DEMO MODU
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-sans font-bold text-slate-900 tracking-tight">
            İslahiye Lezzet Atlası Yönetim Paneli
          </h2>
          <p className="text-xs sm:text-sm font-sans text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Kurumsal gastronomi envanteri, tescilli ürün kayıtları, yayın durumları ve kültürel miras belgelerinin
            tarayıcı içi etkileşimli içerik yönetimi ve ziyaretçi portalı senkronizasyon göstergesi.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono shrink-0">
          <div className="px-3 py-2 rounded-sm bg-slate-50 border border-slate-200 text-slate-700">
            Toplam Kayıt: <strong className="text-forest font-bold">{stats.totalItems}</strong>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Toplam İçerik"
          count={stats.totalItems}
          description="Envanterde kayıtlı tüm unsurlar"
          icon={FileText}
          badge="Demo Envanteri"
          badgeColor="blue"
          linkTo="/yonetim/yemekler"
        />

        <StatCard
          title="Yayındaki İçerik"
          count={stats.publishedCount}
          description={`Toplamın %${stats.totalItems > 0 ? Math.round((stats.publishedCount / stats.totalItems) * 100) : 0}'ü demo portalında görünür`}
          icon={CheckCircle2}
          badge="Portalda Görünür"
          badgeColor="emerald"
          linkTo="/yonetim/yayin-yonetimi"
        />

        <StatCard
          title="İnceleme & Taslak"
          count={stats.inReviewCount + stats.draftCount}
          description="Arşiv ve planlama aşamasındaki bölümler"
          icon={Clock}
          badge="Taslak & İnceleme"
          badgeColor="slate"
        />

        <StatCard
          title="Temsili Demo Modelleri"
          count={stats.simulatedDemoCount}
          description="Arayüz testi amaçlı örnek içerikler"
          icon={AlertTriangle}
          badge="Simülasyon"
          badgeColor="amber"
        />
      </div>

      {/* Two Column Section: Credibility Health + Content Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VerificationHealthWidget stats={stats} />
        <ContentDistributionWidget stats={stats} />
      </div>

      {/* Recent Items Table */}
      <RecentContentWidget
        items={allItems}
        onSelectItem={(item) => setSelectedItem(item)}
      />

      {/* Content Detail Drawer */}
      <ContentDetailDrawer
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
};
