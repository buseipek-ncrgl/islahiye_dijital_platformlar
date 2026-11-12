import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ContentRepository } from '../../services/content/contentRepository';
import { CmsFilterState, CmsContentType, CmsContentItem } from '../../types/admin';
import { ContentFilters } from '../../components/admin/content/ContentFilters';
import { ContentTable } from '../../components/admin/content/ContentTable';
import { ContentCardGrid } from '../../components/admin/content/ContentCardGrid';
import { ContentDetailDrawer } from '../../components/admin/content/ContentDetailDrawer';
import { ActionConfirmModal } from '../../components/admin/common/ActionConfirmModal';
import { BulkActionBar } from '../../components/admin/common/BulkActionBar';
import { ShieldCheck, Info, Plus, LayoutGrid, List, Globe, Clock, CheckCircle2 } from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import { useAdminRole } from '../../context/AdminRoleContext';

interface AdminContentListPageProps {
  forcedType?: CmsContentType | 'articles_all';
  forcedTitle?: string;
  forcedDescription?: string;
  categoryFilter?: string;
}

export const AdminContentListPage: React.FC<AdminContentListPageProps> = ({
  forcedType,
  forcedTitle,
  forcedDescription,
  categoryFilter,
}) => {
  const location = useLocation();
  const {
    contentVersion,
    deleteDish,
    deleteRecipe,
    deleteArticle,
    deleteCulturalStory,
    deleteArtisan,
    deletePlace,
    deleteAnnouncement,
    deleteEvent,
    deleteFilm,
    deleteMediaItem,
    deleteAtlasNode,
    updatePublicationStatus,
  } = useContent();

  const { canCreate, canDelete, canPublish } = useAdminRole();

  const allItems = useMemo(() => ContentRepository.getAllItems(), [contentVersion]);

  // Deduce content type from route if not forced
  const routeType = useMemo<CmsContentType | 'articles_all' | 'all'>(() => {
    if (forcedType) return forcedType;
    const path = location.pathname;
    if (path.includes('/yemekler')) return 'dish';
    if (path.includes('/tarifler')) return 'recipe';
    if (path.includes('/haberler')) return 'articles_all';
    if (path.includes('/medya')) return 'film';
    if (path.includes('/duyurular')) return 'announcement';
    if (path.includes('/etkinlikler')) return 'event';
    if (path.includes('/ustalar')) return 'artisan';
    if (path.includes('/urunler')) return 'dish';
    if (path.includes('/kulturel-miras')) return 'cultural_story';
    return 'all';
  }, [location.pathname, forcedType]);

  const [filter, setFilter] = useState<CmsFilterState>({
    searchQuery: '',
    contentType: routeType === 'articles_all' ? 'all' : routeType,
    publicationStatus: 'all',
    verificationStatus: 'all',
    isDemoOnly: null,
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDrawerTarget, setSelectedDrawerTarget] = useState<{
    id: string;
    contentType: string;
  } | null>(null);
  const selectedItem = useMemo(
    () =>
      selectedDrawerTarget
        ? allItems.find(
            (i) => i.id === selectedDrawerTarget.id && i.contentType === selectedDrawerTarget.contentType
          ) || null
        : null,
    [selectedDrawerTarget, allItems]
  );
  const [itemToDelete, setItemToDelete] = useState<CmsContentItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Synchronize filter when route or forcedType changes & clear selection
  useEffect(() => {
    setFilter((prev) => ({
      ...prev,
      contentType: routeType === 'articles_all' ? 'all' : routeType,
      searchQuery: '',
      publicationStatus: 'all',
    }));
    setSelectedCategory('all');
    setSelectedIds([]);
  }, [routeType, forcedType]);

  // Clear selection when search or category changes
  useEffect(() => {
    setSelectedIds([]);
  }, [selectedCategory, filter.searchQuery, filter.publicationStatus]);

  // Base items scoped to active type
  const baseItems = useMemo(() => {
    let scoped = allItems;

    if (forcedType === 'articles_all' || routeType === 'articles_all') {
      scoped = allItems.filter(
        (i) => i.contentType === 'news' || i.contentType === 'editorial_article'
      );
    } else if (forcedType) {
      scoped = allItems.filter((i) => i.contentType === forcedType);
    } else if (routeType !== 'all') {
      scoped = allItems.filter((i) => i.contentType === routeType);
    }

    if (categoryFilter) {
      scoped = scoped.filter((i) => i.category === categoryFilter);
    }

    return scoped;
  }, [allItems, forcedType, routeType, categoryFilter]);

  // Module Scope Metrics
  const metrics = useMemo(() => {
    const total = baseItems.length;
    const published = baseItems.filter((i) => i.publicationStatus === 'published').length;
    const draft = baseItems.filter(
      (i) => i.publicationStatus === 'draft' || i.publicationStatus === 'in_review'
    ).length;
    const verified = baseItems.filter((i) => i.verificationStatus === 'verified').length;
    const pubRatio = total > 0 ? Math.round((published / total) * 100) : 0;
    return { total, published, draft, verified, pubRatio };
  }, [baseItems]);

  // Apply filters including subcategory / difficulty
  const filteredItems = useMemo(() => {
    let result = ContentRepository.filterItems(baseItems, filter);

    if (selectedCategory !== 'all') {
      if (routeType === 'dish' || forcedType === 'dish') {
        result = result.filter((i) => i.category === selectedCategory);
      } else if (routeType === 'recipe' || forcedType === 'recipe') {
        result = result.filter((i) => i.tags?.includes(selectedCategory));
      } else if (routeType === 'articles_all' || forcedType === 'articles_all') {
        if (selectedCategory === 'news' || selectedCategory === 'editorial_article') {
          result = result.filter((i) => i.contentType === selectedCategory);
        } else {
          result = result.filter((i) => i.category === selectedCategory);
        }
      } else if (routeType === 'announcement' || forcedType === 'announcement') {
        result = result.filter((i) => i.category === selectedCategory);
      } else if (routeType === 'event' || forcedType === 'event') {
        result = result.filter((i) => i.category === selectedCategory);
      } else if (routeType === 'cultural_story' || forcedType === 'cultural_story') {
        result = result.filter((i) => i.category === selectedCategory);
      } else if (routeType === 'editorial_article' || forcedType === 'editorial_article') {
        result = result.filter((i) => i.category === selectedCategory);
      } else if (routeType === 'artisan' || forcedType === 'artisan') {
        result = result.filter((i) => i.category === selectedCategory);
      }
    }

    return result;
  }, [baseItems, filter, selectedCategory, routeType, forcedType]);

  // Delete Action Handler
  const handleDeleteConfirm = () => {
    if (!itemToDelete || !canDelete) return;

    switch (itemToDelete.contentType) {
      case 'dish':
        deleteDish(itemToDelete.id);
        break;
      case 'recipe':
        deleteRecipe(itemToDelete.id);
        break;
      case 'news':
        deleteArticle(itemToDelete.id);
        break;
      case 'cultural_story':
        deleteCulturalStory(itemToDelete.id);
        break;
      case 'editorial_article':
        deleteArticle(itemToDelete.id);
        break;
      case 'artisan':
        deleteArtisan(itemToDelete.id);
        break;
      case 'place':
        deletePlace(itemToDelete.id);
        break;
      case 'announcement':
        deleteAnnouncement(itemToDelete.id);
        break;
      case 'event':
        deleteEvent(itemToDelete.id);
        break;
      case 'film':
        deleteFilm(itemToDelete.id);
        break;
      case 'media':
        deleteMediaItem(itemToDelete.id);
        break;
      case 'atlas_node':
        deleteAtlasNode(itemToDelete.id);
        break;
      default:
        break;
    }

    setItemToDelete(null);
  };

  // Bulk Selection Handlers (composite `${contentType}:${id}` keys prevent cross-type ID collisions)
  const getSelectionKey = (item: Pick<CmsContentItem, 'id' | 'contentType'>) =>
    `${item.contentType}:${item.id}`;

  const resolveSelectedItem = (selKey: string) =>
    filteredItems.find((i) => getSelectionKey(i) === selKey || i.id === selKey) ||
    allItems.find((i) => getSelectionKey(i) === selKey || i.id === selKey);

  const handleToggleSelect = (selKey: string) => {
    setSelectedIds((prev) =>
      prev.includes(selKey) ? prev.filter((k) => k !== selKey) : [...prev, selKey]
    );
  };

  const handleSelectAll = () => {
    const allFilteredKeys = filteredItems.map(getSelectionKey);
    const allSelected =
      allFilteredKeys.length > 0 && allFilteredKeys.every((k) => selectedIds.includes(k));
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allFilteredKeys);
    }
  };

  const handleBulkPublish = () => {
    if (!canPublish) return;
    selectedIds.forEach((selKey) => {
      const item = resolveSelectedItem(selKey);
      if (item) {
        updatePublicationStatus(item.id, item.contentType, 'published');
      }
    });
    setSelectedIds([]);
  };

  const handleBulkDraft = () => {
    if (!canPublish) return;
    selectedIds.forEach((selKey) => {
      const item = resolveSelectedItem(selKey);
      if (item) {
        updatePublicationStatus(item.id, item.contentType, 'draft');
      }
    });
    setSelectedIds([]);
  };

  const handleBulkDeleteConfirm = () => {
    if (!canDelete) return;
    selectedIds.forEach((selKey) => {
      const item = resolveSelectedItem(selKey);
      if (!item) return;
      switch (item.contentType) {
        case 'dish':
          deleteDish(item.id);
          break;
        case 'recipe':
          deleteRecipe(item.id);
          break;
        case 'news':
          deleteArticle(item.id);
          break;
        case 'cultural_story':
          deleteCulturalStory(item.id);
          break;
        case 'editorial_article':
          deleteArticle(item.id);
          break;
        case 'artisan':
          deleteArtisan(item.id);
          break;
        case 'place':
          deletePlace(item.id);
          break;
        case 'announcement':
          deleteAnnouncement(item.id);
          break;
        case 'event':
          deleteEvent(item.id);
          break;
        case 'film':
          deleteFilm(item.id);
          break;
        case 'media':
          deleteMediaItem(item.id);
          break;
        case 'atlas_node':
          deleteAtlasNode(item.id);
          break;
        default:
          break;
      }
    });
    setSelectedIds([]);
    setIsBulkConfirmOpen(false);
  };

  // Button config for creating new records (Single plus icon in template, no double plus)
  const createButtonConfig = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/yemekler') || path.includes('/urunler')) {
      return { to: '/yonetim/yemekler/yeni', label: 'Yeni Yemek / Ürün Ekle' };
    }
    if (path.includes('/tarifler')) {
      return { to: '/yonetim/tarifler/yeni', label: 'Yeni Tarif Ekle' };
    }
    if (path.includes('/kulturel-miras')) {
      return { to: '/yonetim/kulturel-miras/yeni', label: 'Yeni Mutfak Mirası Ekle' };
    }
    if (path.includes('/ustalar')) {
      return { to: '/yonetim/ustalar/yeni', label: 'Yeni Usta / Üretici Ekle' };
    }
    if (path.includes('/medya')) {
      return { to: '/yonetim/medya', label: 'Medya Kütüphanesine Git' };
    }
    if (path.includes('/haberler')) {
      return { to: '/yonetim/haberler/yeni', label: 'Yeni Haber / Makale Ekle' };
    }
    if (path.includes('/duyurular')) {
      return { to: '/yonetim/duyurular/yeni', label: 'Yeni Duyuru Ekle' };
    }
    if (path.includes('/etkinlikler')) {
      return { to: '/yonetim/etkinlikler/yeni', label: 'Yeni Etkinlik Ekle' };
    }
    return { to: '/yonetim/yemekler/yeni', label: 'Yeni Kayıt Ekle' };
  }, [location.pathname]);

  const isArtisanSection = location.pathname.includes('/ustalar');
  const isProductSection = location.pathname.includes('/urunler');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8 font-sans">
      {/* 1. Header Context Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
            {forcedTitle || 'İçerik Envanteri ve Durum Listesi'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed font-sans">
            {forcedDescription ||
              'Sistemdeki tüm gastronomi, tarif ve kültürel miras kayıtlarının yayın ve yönetim işlemleri.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* View Mode Toggle: Table vs Cards */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tablo Görünümü"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tablo</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Kart Izgarası Görünümü"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kartlar</span>
            </button>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
            Kayıt: <strong className="text-slate-900">{filteredItems.length}</strong> / {baseItems.length}
          </div>

          {canCreate ? (
            <Link
              to={createButtonConfig.to}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{createButtonConfig.label}</span>
            </Link>
          ) : (
            <div
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-medium cursor-not-allowed border border-slate-200"
              title="İncelemeci rolünde yeni kayıt ekleme yetkisi kısıtlıdır."
            >
              <span>Yeni Kayıt (Kısıtlı)</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Module Scope KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Toplam Kayıt</span>
            <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
              <Globe className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{metrics.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Envanterdeki tüm unsurlar</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Yayında</span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{metrics.published}</span>
            <span className="text-[11px] font-semibold text-emerald-700">%{metrics.pubRatio}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ziyaretçi portalında aktif</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Taslak / İnceleme</span>
            <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center text-amber-700">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{metrics.draft}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Yayın onayı bekleyen</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-teal-700 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Doğrulandı</span>
            <div className="w-6 h-6 rounded-md bg-teal-50 flex items-center justify-center text-teal-700">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{metrics.verified}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Saha ve arşiv onaylı</div>
        </div>
      </div>

      {/* 2. Specialized Notices (Artisan / Registered Product) */}
      {isArtisanSection && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="block mb-0.5 font-bold">Zanaatkâr & Üretici Arşivi:</strong>
            Saha araştırmaları ve izin süreçleri tamamlanan ustaların biyografileri ve zanaat kayıtları bu alanda listelenmektedir.
          </div>
        </div>
      )}

      {isProductSection && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <strong className="block mb-0.5 font-bold">Tescilli Coğrafi İşaret Kaydı:</strong>
            İslahiye Biberi, TÜRKPATENT nezdinde 991 tescil numarasıyla (05.01.2022) Gaziantep Ticaret Borsası adına tescil edilmiştir.
          </div>
        </div>
      )}

      {/* 3. Context-Aware Filters Component */}
      <ContentFilters
        filter={filter}
        onChange={setFilter}
        totalFiltered={filteredItems.length}
        totalItems={baseItems.length}
        activeContentType={
          forcedType === 'articles_all' || routeType === 'articles_all'
            ? 'articles_all'
            : forcedType || (routeType !== 'all' ? routeType : 'all')
        }
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        hideCategoryPills={Boolean(categoryFilter)}
      />

      {/* 4. Bulk Action Floating Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={filteredItems.length}
        onClearSelection={() => setSelectedIds([])}
        onBulkPublish={handleBulkPublish}
        onBulkDraft={handleBulkDraft}
        onBulkDelete={() => setIsBulkConfirmOpen(true)}
        canDelete={canDelete}
        canPublish={canPublish}
      />

      {/* 5. Action-Rich Content Presentation (Table vs Cards) */}
      {viewMode === 'table' ? (
        <ContentTable
          items={filteredItems}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onSelectItem={(item) =>
            setSelectedDrawerTarget({ id: item.id, contentType: item.contentType })
          }
          onDeleteItem={(item) => setItemToDelete(item)}
        />
      ) : (
        <ContentCardGrid
          items={filteredItems}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectItem={(item) =>
            setSelectedDrawerTarget({ id: item.id, contentType: item.contentType })
          }
          onDeleteItem={(item) => setItemToDelete(item)}
        />
      )}

      {/* 6. Detail Preview Drawer */}
      <ContentDetailDrawer
        item={selectedItem}
        onClose={() => setSelectedDrawerTarget(null)}
      />

      {/* 7. Single Delete Confirmation Modal */}
      <ActionConfirmModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Envanter Kaydını Sil"
        message={`"${itemToDelete?.title}" başlıklı ${itemToDelete?.contentTypeLabel || 'içeriği'} sistemden tamamen silmek istediğinize emin misiniz?`}
        confirmText="Evet, Kalıcı Olarak Sil"
        cancelText="Vazgeç"
        variant="danger"
      />

      {/* 8. Bulk Delete Confirmation Modal */}
      <ActionConfirmModal
        isOpen={isBulkConfirmOpen}
        onClose={() => setIsBulkConfirmOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Toplu Envanter Kaydı Sil"
        message={`Seçtiğiniz ${selectedIds.length} adet içeriği kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText={`Evet, ${selectedIds.length} Kaydı Sil`}
        cancelText="Vazgeç"
        variant="danger"
      />
    </div>
  );
};
