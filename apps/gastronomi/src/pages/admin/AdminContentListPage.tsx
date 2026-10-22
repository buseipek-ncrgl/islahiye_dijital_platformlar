import React, { useState, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ContentRepository } from '../../services/content/contentRepository';
import { CmsFilterState, CmsContentType, CmsContentItem } from '../../types/admin';
import { ContentFilters } from '../../components/admin/content/ContentFilters';
import { ContentTable } from '../../components/admin/content/ContentTable';
import { ContentDetailDrawer } from '../../components/admin/content/ContentDetailDrawer';
import { ShieldCheck, Info, Plus } from 'lucide-react';
import { useContent } from '../../hooks/useContent';

interface AdminContentListPageProps {
  forcedType?: CmsContentType;
  forcedTitle?: string;
  forcedDescription?: string;
}

export const AdminContentListPage: React.FC<AdminContentListPageProps> = ({
  forcedType,
  forcedTitle,
  forcedDescription,
}) => {
  const location = useLocation();
  const { contentVersion } = useContent();
  const allItems = useMemo(() => ContentRepository.getAllItems(), [contentVersion]);

  // Deduce content type from route if not forced
  const routeType = useMemo<CmsContentType | 'all'>(() => {
    if (forcedType) return forcedType;
    const path = location.pathname;
    if (path.includes('/yemekler')) return 'dish';
    if (path.includes('/tarifler')) return 'recipe';
    if (path.includes('/haberler')) return 'all'; // Both news and articles
    if (path.includes('/medya')) return 'film';
    if (path.includes('/duyurular')) return 'announcement';
    if (path.includes('/etkinlikler')) return 'event';
    return 'all';
  }, [location.pathname, forcedType]);

  const [filter, setFilter] = useState<CmsFilterState>({
    searchQuery: '',
    contentType: routeType,
    publicationStatus: 'all',
    verificationStatus: 'all',
    isDemoOnly: null,
  });

  const [selectedItem, setSelectedItem] = useState<CmsContentItem | null>(null);

  // Filter items
  const filteredItems = useMemo(() => {
    return ContentRepository.filterItems(allItems, filter);
  }, [allItems, filter]);

  // New Content Button Route Detection
  const createButtonConfig = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/yemekler')) {
      return { to: '/yonetim/yemekler/yeni', label: '+ Yeni Yemek Ekle' };
    }
    if (path.includes('/tarifler')) {
      return { to: '/yonetim/tarifler/yeni', label: '+ Yeni Tarif Ekle' };
    }
    if (path.includes('/kulturel-miras')) {
      return { to: '/yonetim/kulturel-miras/yeni', label: '+ Yeni Kültürel Miras Anlatısı Ekle' };
    }
    if (path.includes('/ustalar')) {
      return { to: '/yonetim/ustalar/yeni', label: '+ Yeni Usta / Üretici Ekle' };
    }
    if (path.includes('/medya')) {
      return { to: '/yonetim/medya', label: 'Medya Kütüphanesine Git' };
    }
    if (path.includes('/haberler')) {
      return { to: '/yonetim/haberler/yeni', label: '+ Yeni Haber / Makale Ekle' };
    }
    if (path.includes('/duyurular')) {
      return { to: '/yonetim/duyurular/yeni', label: '+ Yeni Kurumsal Duyuru Ekle' };
    }
    if (path.includes('/etkinlikler')) {
      return { to: '/yonetim/etkinlikler/yeni', label: '+ Yeni Gastronomi Etkinliği Ekle' };
    }
    return { to: '/yonetim/yemekler/yeni', label: '+ Yeni Yemek Ekle' };
  }, [location.pathname]);

  // Special section alerts for verified empty categories
  const isArtisanSection = location.pathname.includes('/ustalar');
  const isPlaceSection = location.pathname.includes('/harita');
  const isProductSection = location.pathname.includes('/urunler');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Context Banner */}
      <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-sans font-bold text-slate-900 tracking-tight">
            {forcedTitle || 'İçerik Envanteri ve Durum Listesi'}
          </h2>
          <p className="text-xs sm:text-sm font-sans text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {forcedDescription ||
              'Sistemdeki tüm gastronomi, tarif, haber, duyuru ve medya içeriklerinin yayın ve doğrulama durumları.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="px-3 py-1.5 rounded-sm bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono">
            Kayıt: <strong>{filteredItems.length}</strong> / {allItems.length}
          </div>

          <Link
            to={createButtonConfig.to}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-forest hover:bg-forest-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{createButtonConfig.label}</span>
          </Link>
        </div>
      </div>

      {/* Corporate Accuracy Notice for Places or Artisans */}
      {isArtisanSection && (
        <div className="p-4 rounded-sm bg-amber-50 border border-amber-200 text-amber-900 text-xs font-sans flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="block mb-0.5 font-bold">Zanaatkâr & Üretici Arşivi İlkesi:</strong>
            AGENTS.md 4. maddesi gereğince, gerçek ustaların resmi yayın izinleri ve doğrulanmış saha belgeleri tamamlanana kadar
            hayali şahıs profili, temsili usta adı veya stok portre kullanılmamaktadır. Saha belgelendirmesi tamamlanan profiller bu alana eklenecektir.
          </div>
        </div>
      )}

      {isPlaceSection && (
        <div className="p-4 rounded-sm bg-amber-50 border border-amber-200 text-amber-900 text-xs font-sans flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="block mb-0.5 font-bold">Gastronomi Haritası Doğrulama İlkesi:</strong>
            Konumu ve çalışma saatleri doğrulanmamış işletmelere hayalî gerçek koordinat atanmaz. Kültürel keşif atlası ile fiziksel konum modülü birbirinden ayrı tutulmaktadır.
          </div>
        </div>
      )}

      {isProductSection && (
        <div className="p-4 rounded-sm bg-forest-50 border border-forest-200 text-forest-900 text-xs font-sans flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-forest shrink-0 mt-0.5" />
          <div>
            <strong className="block mb-0.5 font-bold">Tescilli Coğrafi İşaret Kaydı:</strong>
            İslahiye Biberi, TÜRKPATENT nezdinde 991 tescil numarasıyla (05.01.2022) Gaziantep Ticaret Borsası tarafından tescil ettirilmiştir.
            Coğrafi işaretli ürün olduğu doğrulanmamış içerikler tescilli olarak işaretlenmez.
          </div>
        </div>
      )}

      {/* Filter Component */}
      <ContentFilters
        filter={filter}
        onChange={setFilter}
        totalFiltered={filteredItems.length}
        totalItems={allItems.length}
      />

      {/* Content Table Component */}
      <ContentTable
        items={filteredItems}
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
