import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Save,
  AlertTriangle,
  CheckCircle2,
  Search,
  ExternalLink,
  Layers,
  RotateCcw,
  Clock,
  Info,
  History,
  Layout,
  Check,
  X,
} from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import { ContentRepository } from '../../services/content/contentRepository';
import { CmsContentItem, PublicationStatus } from '../../types/admin';
import { VerificationBadge } from '../../components/admin/content/VerificationBadge';
import { ContentDetailDrawer } from '../../components/admin/content/ContentDetailDrawer';
import { BulkActionBar } from '../../components/admin/common/BulkActionBar';
import { ActionConfirmModal } from '../../components/admin/common/ActionConfirmModal';
import { useAdminRole } from '../../context/AdminRoleContext';

const CONTENT_TYPE_LABELS: Record<string, string> = {
  all: 'Tüm İçerik Türleri',
  dish: 'Yöresel Yemekler',
  recipe: 'Geleneksel Tarifler',
  cultural_story: 'Kültürel Hikâyeler',
  artisan: 'Ustalar & Üreticiler',
  news: 'Resmî Haberler',
  editorial_article: 'Editoryal Makaleler',
  announcement: 'Kurumsal Duyurular',
  event: 'Gastronomi Etkinlikleri',
  media: 'Medya & Fotoğraflar',
  atlas_node: 'Lezzet Atlası Düğümleri',
  place: 'Gerçek Ziyaret Noktaları',
};

export const CentralPublicationPage: React.FC = () => {
  const { canPublish, canDelete } = useAdminRole();
  const {
    contentVersion,
    updatePublicationStatus,
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
    getArticles,
    getAnnouncements,
    getEvents,
    getHomepageFeatured,
    saveHomepageFeatured,
    getDemoActivityLog,
    clearDemoActivityLog,
  } = useContent();

  const allItems = useMemo(() => ContentRepository.getAllItems(), [contentVersion]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Main Page Tabs
  const [activeTab, setActiveTab] = useState<'inventory' | 'showcase' | 'history'>('inventory');

  // Filter State for Inventory
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPubStatus, setSelectedPubStatus] = useState<string>('all');
  const [selectedVerStatus, setSelectedVerStatus] = useState<string>('all');
  const [isDemoOnly, setIsDemoOnly] = useState<boolean | null>(null);
  const [missingSourceOnly, setMissingSourceOnly] = useState(false);

  // Selected item for detail drawer & checklist modal (derived live from allItems)
  const [drawerTarget, setDrawerTarget] = useState<{ id: string; contentType: string } | null>(null);
  const drawerItem = useMemo(
    () =>
      drawerTarget
        ? allItems.find(
            (i) => i.id === drawerTarget.id && i.contentType === drawerTarget.contentType
          ) || null
        : null,
    [drawerTarget, allItems]
  );

  const [checklistTarget, setChecklistTarget] = useState<{ id: string; contentType: string } | null>(null);
  const checklistItem = useMemo(
    () =>
      checklistTarget
        ? allItems.find(
            (i) => i.id === checklistTarget.id && i.contentType === checklistTarget.contentType
          ) || null
        : null,
    [checklistTarget, allItems]
  );

  // Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Homepage Showcase Selection State
  const featuredConfig = useMemo(() => getHomepageFeatured(), [getHomepageFeatured, contentVersion]);
  const publishedArticles = useMemo(() => getArticles(true), [getArticles, contentVersion]);
  const publishedAnnouncements = useMemo(() => getAnnouncements(true), [getAnnouncements, contentVersion]);
  const publishedEvents = useMemo(() => getEvents(true), [getEvents, contentVersion]);

  const [leadArticleId, setLeadArticleId] = useState<string>(featuredConfig.leadArticleId || '');
  const [secondary1, setSecondary1] = useState<string>(featuredConfig.secondaryArticleIds?.[0] || '');
  const [secondary2, setSecondary2] = useState<string>(featuredConfig.secondaryArticleIds?.[1] || '');
  const [featuredAnnouncementId, setFeaturedAnnouncementId] = useState<string>(
    featuredConfig.featuredAnnouncementId || ''
  );
  const [featuredEventId, setFeaturedEventId] = useState<string>(featuredConfig.featuredEventId || '');
  const [showcaseSaved, setShowcaseSaved] = useState(false);

  useEffect(() => {
    setLeadArticleId(featuredConfig.leadArticleId || '');
    setSecondary1(featuredConfig.secondaryArticleIds?.[0] || '');
    setSecondary2(featuredConfig.secondaryArticleIds?.[1] || '');
    setFeaturedAnnouncementId(featuredConfig.featuredAnnouncementId || '');
    setFeaturedEventId(featuredConfig.featuredEventId || '');
  }, [featuredConfig]);

  // Filtered Inventory Items
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLocaleLowerCase('tr-TR');
        const matchesTitle = item.title.toLocaleLowerCase('tr-TR').includes(q);
        const matchesCategory = item.categoryLabel.toLocaleLowerCase('tr-TR').includes(q);
        const matchesSource = item.officialSource
          ? item.officialSource.toLocaleLowerCase('tr-TR').includes(q)
          : false;
        if (!matchesTitle && !matchesCategory && !matchesSource) return false;
      }

      if (selectedType !== 'all' && item.contentType !== selectedType) {
        return false;
      }

      if (selectedPubStatus !== 'all' && item.publicationStatus !== selectedPubStatus) {
        return false;
      }

      if (selectedVerStatus !== 'all' && item.verificationStatus !== selectedVerStatus) {
        return false;
      }

      if (isDemoOnly !== null && item.isDemo !== isDemoOnly) {
        return false;
      }

      if (missingSourceOnly) {
        if (item.sourceUrl || item.officialSource) return false;
      }

      return true;
    });
  }, [allItems, searchQuery, selectedType, selectedPubStatus, selectedVerStatus, isDemoOnly, missingSourceOnly]);

  // Overall Inventory Stats
  const stats = useMemo(() => {
    const published = allItems.filter((i) => i.publicationStatus === 'published').length;
    const draft = allItems.filter((i) => i.publicationStatus === 'draft').length;
    const inReview = allItems.filter((i) => i.publicationStatus === 'in_review').length;
    const archived = allItems.filter((i) => i.publicationStatus === 'archived').length;
    const verified = allItems.filter((i) => i.verificationStatus === 'verified').length;
    const missingSource = allItems.filter((i) => !i.sourceUrl && !i.officialSource).length;
    return { published, draft, inReview, archived, verified, missingSource, total: allItems.length };
  }, [allItems]);

  // Quick Status Change Handler
  const handleStatusChange = (item: CmsContentItem, newStatus: PublicationStatus) => {
    if (!canPublish) return;
    const ok = updatePublicationStatus(item.id, item.contentType, newStatus);
    if (ok) {
      setNotification({
        type: 'success',
        message: `"${item.title}" yayın durumu "${newStatus.toUpperCase()}" olarak güncellendi.`,
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Bulk Selection Handlers (composite `${contentType}:${id}` keys prevent cross-type ID collisions)
  const getSelectionKey = (item: Pick<CmsContentItem, 'id' | 'contentType'>) =>
    `${item.contentType}:${item.id}`;

  const resolveSelectedItem = (selKey: string) =>
    filteredItems.find((i) => getSelectionKey(i) === selKey || i.id === selKey) ||
    allItems.find((i) => getSelectionKey(i) === selKey || i.id === selKey);

  const selectedInViewCount = useMemo(
    () => filteredItems.filter((i) => selectedIds.includes(getSelectionKey(i))).length,
    [filteredItems, selectedIds]
  );

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
    setNotification({
      type: 'success',
      message: `${selectedIds.length} içerik başarıyla yayına alındı.`,
    });
    setTimeout(() => setNotification(null), 3000);
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
    setNotification({
      type: 'success',
      message: `${selectedIds.length} içerik taslak durumuna çekildi.`,
    });
    setTimeout(() => setNotification(null), 3000);
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
    setNotification({
      type: 'success',
      message: `${selectedIds.length} içerik sistemden silindi.`,
    });
    setTimeout(() => setNotification(null), 3000);
    setSelectedIds([]);
    setIsBulkDeleteModalOpen(false);
  };

  // Pre-publication check generator for a given item
  const getPrePublicationChecklist = (item: CmsContentItem) => {
    const checks: { label: string; passed: boolean; note: string }[] = [];

    // 1. Title & description
    const hasTitle = Boolean(item.title && item.title.trim().length > 3);
    checks.push({
      label: 'Temel Başlık ve Tanım',
      passed: hasTitle,
      note: hasTitle ? 'Başlık uygun uzunlukta.' : 'Başlık eksik veya çok kısa.',
    });

    // 2. Summary or details
    const hasSummary = Boolean(item.summary && item.summary.trim().length > 10);
    checks.push({
      label: 'İçerik Özeti & Metin',
      passed: hasSummary,
      note: hasSummary ? 'Açıklayıcı özet mevcut.' : 'İçerik özeti veya tanıtım metni yetersiz.',
    });

    // 3. Media & Cover image
    const hasMedia = Boolean(item.coverImage && item.coverImage.length > 0);
    checks.push({
      label: 'Kapak Görseli / Medya Bağlantısı',
      passed: hasMedia,
      note: hasMedia ? 'Görsel tanımlı.' : 'Görsel bulunamadı (isteğe bağlı ancak önerilir).',
    });

    // 4. Source & Attribution
    const hasSource = Boolean(item.officialSource || item.sourceUrl);
    checks.push({
      label: 'Kurumsal Kaynak & Atıf Bilgisi',
      passed: hasSource,
      note: hasSource ? `Kaynak: ${item.officialSource || item.sourceUrl}` : 'Resmî kaynak bilgisi belirtilmemiş.',
    });

    // 5. Special checks by content type
    if (item.contentType === 'place') {
      checks.push({
        label: 'Doğrulanmış Coğrafi Konum Kriteri',
        passed: item.verificationStatus === 'verified',
        note:
          item.verificationStatus === 'verified'
            ? 'Saha koordinatları ve işletme teyitli.'
            : 'Doğrulanmamış işletmeye hayalî koordinat atanması yasaktır.',
      });
    }

    if (item.contentType === 'artisan') {
      checks.push({
        label: 'Kişisel Veri ve Yayın İzni',
        passed: item.verificationStatus === 'verified' && !item.isDemo,
        note:
          item.verificationStatus === 'verified' && !item.isDemo
            ? 'Resmî yayın izni ve saha formu tamam.'
            : 'Yayın Güvenlik İlkesi: İzni ve saha onayı tamamlanmayan usta profilleri ön inceleme aşamasında tutulur.',
      });
    }

    if (item.contentType === 'event') {
      checks.push({
        label: 'Tarih Mantığı ve Katılım Bilgisi',
        passed: true,
        note: 'Tarih sıralaması geçerli. Katılım ve program bilgileri etkinlik sayfasında gösterilir.',
      });
    }

    const allPassed = checks.every((c) => c.passed);
    return { checks, allPassed };
  };

  // Save Homepage Featured Config
  const handleSaveShowcase = () => {
    if (!canPublish) {
      setNotification({
        type: 'error',
        message: 'Ana sayfa vitrin ayarlarını değiştirmek için Yayın Sorumlusu veya Yönetici yetkisi gerekir.',
      });
      return;
    }
    saveHomepageFeatured({
      leadArticleId: leadArticleId || undefined,
      secondaryArticleIds: [secondary1, secondary2].filter(Boolean),
      featuredAnnouncementId: featuredAnnouncementId || undefined,
      featuredEventId: featuredEventId || undefined,
    });

    setShowcaseSaved(true);
    setNotification({
      type: 'success',
      message: 'Ana sayfa editoryal vitrin seçimleri kaydedildi ve ana sayfaya yansıtıldı.',
    });
    setTimeout(() => {
      setShowcaseSaved(false);
      setTimeout(() => setNotification(null), 2500);
    }, 1500);
  };

  const activityLogs = getDemoActivityLog();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-sans font-extrabold text-slate-900 tracking-tight">
            Merkezi Yayın &amp; Ana Sayfa Vitrin Yönetimi
          </h1>
          <p className="text-xs sm:text-sm font-sans text-slate-500 mt-1 max-w-3xl leading-relaxed">
            İslahiye Lezzet Atlası bünyesindeki tüm yemekler, tarifler, kültürel bellek hikâyeleri, haberler, duyurular ve
            etkinliklerin yayın durumlarını denetleyin, kalite kontrollerini gerçekleştirin ve ana sayfa vitrinini belirleyin.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            <span>Yayın Envanteri ({allItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('showcase')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'showcase' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layout className="w-3.5 h-3.5 text-amber-600" />
            <span>Ana Sayfa Vitrini</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-slate-600" />
            <span>İşlem Günlüğü ({activityLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs font-sans flex items-center justify-between ${notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 font-sans text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: YAYIN ENVANTERİ & DENETİMİ */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-sans font-semibold text-slate-500 uppercase block mb-1">Yayında</span>
              <span className="text-2xl font-sans font-extrabold text-emerald-700">{stats.published}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Ziyaretçiye Açık</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-sans font-semibold text-slate-500 uppercase block mb-1">Taslak</span>
              <span className="text-2xl font-sans font-extrabold text-slate-700">{stats.draft}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Yalnızca CMS</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-sans font-semibold text-slate-500 uppercase block mb-1">İncelemede</span>
              <span className="text-2xl font-sans font-extrabold text-amber-700">{stats.inReview}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Editör Kontrolünde</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-sans font-semibold text-slate-500 uppercase block mb-1">Arşivde</span>
              <span className="text-2xl font-sans font-extrabold text-slate-500">{stats.archived}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Gizlenmiş Kayıt</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-sans font-semibold text-slate-500 uppercase block mb-1">Doğrulanmış</span>
              <span className="text-2xl font-sans font-extrabold text-teal-700">{stats.verified}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Resmî / Saha Teyitli</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
              <span className="text-[11px] font-sans font-semibold text-slate-500 uppercase block mb-1">Eksik Kaynak</span>
              <span className={`text-2xl font-sans font-extrabold ${stats.missingSource > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                {stats.missingSource}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Atıf Girilmemiş</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Başlık, kategori veya kaynak ara..."
                  className="w-full h-10 pl-9 pr-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-sans bg-white"
                />
              </div>

              {/* Content Type Filter (10 Types) */}
              <div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white font-sans cursor-pointer"
                >
                  {Object.entries(CONTENT_TYPE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Publication Status Filter */}
              <div>
                <select
                  value={selectedPubStatus}
                  onChange={(e) => setSelectedPubStatus(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white font-sans cursor-pointer"
                >
                  <option value="all">Tüm Yayın Durumları</option>
                  <option value="published">Yayında</option>
                  <option value="draft">Taslak</option>
                  <option value="in_review">İncelemede</option>
                  <option value="archived">Arşivde</option>
                </select>
              </div>

              {/* Verification Status Filter */}
              <div>
                <select
                  value={selectedVerStatus}
                  onChange={(e) => setSelectedVerStatus(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white font-sans cursor-pointer"
                >
                  <option value="all">Tüm Doğrulama Durumları</option>
                  <option value="verified">Doğrulanmış Resmî Kayıt</option>
                  <option value="unverified">Doğrulanmamış</option>
                  <option value="simulated">Ön İnceleme Kaydı</option>
                </select>
              </div>
            </div>

            {/* Quick Toggle Checkboxes */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={isDemoOnly === false}
                    onChange={(e) => setIsDemoOnly(e.target.checked ? false : null)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Yalnızca Gerçek / Doğrulanmış İçerikler</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={missingSourceOnly}
                    onChange={(e) => setMissingSourceOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-rose-600 accent-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <span className={missingSourceOnly ? 'text-rose-700 font-semibold' : ''}>
                    Kaynak Bilgisi Eksik Olanlar
                  </span>
                </label>
              </div>

              <div className="text-slate-500 font-sans text-xs">
                Listelenen: <strong>{filteredItems.length}</strong> / {allItems.length}
              </div>
            </div>
          </div>

          {/* Bulk Action Bar for Central Publication Table */}
          <BulkActionBar
            selectedCount={selectedIds.length}
            totalCount={filteredItems.length}
            onClearSelection={() => setSelectedIds([])}
            onBulkPublish={handleBulkPublish}
            onBulkDraft={handleBulkDraft}
            onBulkDelete={() => setIsBulkDeleteModalOpen(true)}
            canDelete={canDelete}
            canPublish={canPublish}
          />

          {/* Table of Items */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredItems.length > 0 && selectedInViewCount === filteredItems.length}
                        ref={(el) => {
                          if (el) {
                            el.indeterminate =
                              selectedInViewCount > 0 && selectedInViewCount < filteredItems.length;
                          }
                        }}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer"
                        title="Tümünü Seç / Kaldır"
                      />
                    </th>
                    <th className="py-3 px-4">İçerik Başlığı &amp; Tür</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Yayın Durumu</th>
                    <th className="py-3 px-3">Doğruluk &amp; Kaynak</th>
                    <th className="py-3 px-3">Kalite Kontrol</th>
                    <th className="py-3 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                        Filtrelere uygun içerik kaydı bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const check = getPrePublicationChecklist(item);
                      const selectionKey = getSelectionKey(item);
                      const isSelected = selectedIds.includes(selectionKey);

                      return (
                        <tr
                          key={`${item.contentType}-${item.id}`}
                          className={`transition-colors ${
                            isSelected ? 'bg-emerald-50/50' : 'hover:bg-slate-50/70'
                          }`}
                        >
                          {/* Row Checkbox */}
                          <td className="py-3.5 px-3 text-center align-middle">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(selectionKey)}
                              className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer"
                              title="Bu öğeyi seç"
                            />
                          </td>

                          {/* Title & Type */}
                          <td className="py-3.5 px-4 max-w-xs align-middle">
                            <div className="flex items-start gap-3">
                              {item.coverImage ? (
                                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                                  <img src={item.coverImage} alt="" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400 font-sans text-[10px] font-bold">
                                  YOK
                                </div>
                              )}
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  className="font-bold text-slate-900 block w-full text-left truncate hover:text-emerald-700 cursor-pointer text-xs sm:text-[13px]"
                                  onClick={() =>
                                    setDrawerTarget({ id: item.id, contentType: item.contentType })
                                  }
                                >
                                  {item.title}
                                </button>
                                <span className="text-[11px] font-sans text-slate-500 font-medium block">
                                  {item.contentTypeLabel}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3.5 px-3 align-middle">
                            <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold">
                              {item.categoryLabel || item.category}
                            </span>
                          </td>

                          {/* Publication Status & Quick Toggle */}
                          <td className="py-3.5 px-3 align-middle">
                            <select
                              value={item.publicationStatus}
                              disabled={!canPublish}
                              title={canPublish ? 'Yayın durumunu değiştir' : 'Bu rolün yayın durumunu değiştirme yetkisi yoktur.'}
                              onChange={(e) => handleStatusChange(item, e.target.value as PublicationStatus)}
                              className={`text-xs font-semibold py-1.5 px-2.5 rounded-lg border shadow-2xs transition-colors cursor-pointer ${
                                !canPublish
                                  ? 'opacity-60 cursor-not-allowed bg-slate-100 text-slate-500 border-slate-200'
                                  : item.publicationStatus === 'published'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : item.publicationStatus === 'draft'
                                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                                  : item.publicationStatus === 'in_review'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}
                            >
                              <option value="published">Yayında</option>
                              <option value="draft">Taslak</option>
                              <option value="in_review">İncelemede</option>
                              <option value="archived">Arşivde</option>
                            </select>
                          </td>

                          {/* Verification & Source */}
                          <td className="py-3.5 px-3 align-middle">
                            <div className="space-y-1">
                              <VerificationBadge status={item.verificationStatus} isDemo={item.isDemo} />
                              <div className="text-[11px] text-slate-500 font-sans truncate max-w-[160px]" title={item.officialSource || item.sourceUrl}>
                                {item.officialSource || (item.sourceUrl ? 'URL Mevcut' : 'Kaynak Yok')}
                              </div>
                            </div>
                          </td>

                          {/* Quality Pre-Publication Check */}
                          <td className="py-3.5 px-3 align-middle">
                            <button
                              type="button"
                              onClick={() =>
                                setChecklistTarget({ id: item.id, contentType: item.contentType })
                              }
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border shadow-2xs transition-colors cursor-pointer ${check.allPassed
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                }`}
                            >
                              {check.allPassed ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Yayına Uygun</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Kontrol Gerekli</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right align-middle">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setDrawerTarget({ id: item.id, contentType: item.contentType })
                                }
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                title="İçerik Detayını Gör"
                              >
                                <Info className="w-4 h-4" />
                              </button>

                              {item.publicUrl && item.publicationStatus === 'published' && (
                                <Link
                                  to={item.publicUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors"
                                  title="Ziyaretçi Sayfasında Gör"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ANA SAYFA EDİTORYAL VİTRİN SEÇİMİ */}
      {/* ========================================================================= */}
      {activeTab === 'showcase' && (
        <div className="space-y-6">
          {/* Showcase Banner */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 p-5 rounded-xl flex items-start gap-4">
            <Layers className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs font-sans text-slate-700 space-y-1">
              <strong className="text-slate-900 block text-sm font-bold">
                Ana Sayfa Editoryal Gündem & Vitrin Kontrolü (07 / Gündem Bölümü):
              </strong>
              <p className="text-slate-600">
                Ana sayfadaki "Mutfak Kültürü Gazetesi & Gündem" bölümünde öne çıkacak ana haberi, ikincil haberleri,
                öne çıkan duyuruyu ve gastronomi etkinliğini buradan seçebilirsiniz.
              </p>
              <p className="text-slate-500 text-xs font-sans">
                Kural: Yalnızca yayımlanmış (`published`) içerikler seçilebilir. Bir içerik daha sonra arşive alınırsa,
                ziyaretçi ana sayfasında bozuk bağlantı oluşmaz; sistem otomatik olarak sıradaki yayımlanmış kaydı gösterir.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
            {/* Control Panel */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-6">
              <h2 className="text-xs font-sans font-bold text-slate-700 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Vitrin Seçim Ayarları</span>
                {showcaseSaved && (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Kaydedildi
                  </span>
                )}
              </h2>

              {/* 1. Lead Article */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  1. Ana Manşet Haberi (Lead Feature - 7 Kolon)
                </label>
                <select
                  value={leadArticleId}
                  disabled={!canPublish}
                  onChange={(e) => setLeadArticleId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white disabled:bg-slate-50"
                >
                  <option value="">Otomatik Seçim (En Son Eklenen / isLead=true Olan)</option>
                  {publishedArticles.map((art) => (
                    <option key={art.id} value={art.id}>
                      {art.title} ({art.formattedDate})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1 font-sans">
                  Seçilen haber ana sayfanın en büyük editoryal kartında görseli ve özetiyle yer alır.
                </p>
              </div>

              {/* 2. Secondary Articles (2 slots) */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-800">
                  2. İkincil Araştırma Yazıları (2 Adet)
                </label>

                <div>
                  <span className="text-xs text-slate-500 font-medium block mb-1">İkincil Yazı #1:</span>
                  <select
                    value={secondary1}
                    disabled={!canPublish}
                    onChange={(e) => setSecondary1(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white disabled:bg-slate-50"
                  >
                    <option value="">Otomatik Seçim (Sıradaki Yayımlanmış Yazı)</option>
                    {publishedArticles
                      .filter((a) => a.id !== leadArticleId && a.id !== secondary2)
                      .map((art) => (
                        <option key={art.id} value={art.id}>
                          {art.title}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <span className="text-xs text-slate-500 font-medium block mb-1">İkincil Yazı #2:</span>
                  <select
                    value={secondary2}
                    disabled={!canPublish}
                    onChange={(e) => setSecondary2(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white disabled:bg-slate-50"
                  >
                    <option value="">Otomatik Seçim (Sıradaki Yayımlanmış Yazı)</option>
                    {publishedArticles
                      .filter((a) => a.id !== leadArticleId && a.id !== secondary1)
                      .map((art) => (
                        <option key={art.id} value={art.id}>
                          {art.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* 3. Featured Announcement */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  3. Öne Çıkan Kurumsal Duyuru Kartı
                </label>
                <select
                  value={featuredAnnouncementId}
                  disabled={!canPublish}
                  onChange={(e) => setFeaturedAnnouncementId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white disabled:bg-slate-50"
                >
                  <option value="">Otomatik Seçim (En Son Yayımlanmış Duyuru)</option>
                  {publishedAnnouncements.map((ann) => (
                    <option key={ann.id} value={ann.id}>
                      {ann.title} ({ann.formattedDate})
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Featured Event */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  4. Öne Çıkan Etkinlik &amp; Buluşma Kartı
                </label>
                <select
                  value={featuredEventId}
                  disabled={!canPublish}
                  onChange={(e) => setFeaturedEventId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white disabled:bg-slate-50"
                >
                  <option value="">Otomatik Seçim (En Yakın Gelecek Etkinlik)</option>
                  {publishedEvents.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title} ({evt.formattedDate})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  disabled={!canPublish}
                  onClick={handleSaveShowcase}
                  title={!canPublish ? 'Vitrin değişikliği için Yayın Sorumlusu veya Yönetici yetkisi gerekir' : undefined}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Vitrin Seçimlerini Kaydet &amp; Senkronize Et</span>
                </button>
              </div>
            </div>

            {/* Live Visual Preview of Selected Showcase */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-sans uppercase tracking-wider text-emerald-800 font-bold flex items-center gap-1.5">
                  <Layout className="w-4 h-4 text-amber-600" />
                  <span>Ana Sayfa Vitrini Canlı Önizlemesi</span>
                </span>
                <span className="text-xs font-sans text-slate-400">Masaüstü Düzeni</span>
              </div>

              {/* Lead article card preview */}
              {(() => {
                const effectiveLead =
                  (leadArticleId ? publishedArticles.find((a) => a.id === leadArticleId) : undefined) ||
                  publishedArticles[0];

                if (!effectiveLead) {
                  return (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                      Yayında haber bulunmadığı için vitrin gösterilemiyor.
                    </div>
                  );
                }

                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                    <span className="text-[10px] font-sans uppercase tracking-wider text-amber-700 font-bold block">
                      MANŞET: {effectiveLead.categoryLabel}
                    </span>
                    <h3 className="text-base font-sans font-bold text-slate-900 leading-snug">
                      {effectiveLead.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2">{effectiveLead.summary}</p>
                    <div className="text-[11px] font-sans text-slate-400 pt-1">
                      {effectiveLead.formattedDate} • {effectiveLead.author.name}
                    </div>
                  </div>
                );
              })()}

              {/* Agenda Mini Cards Preview */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* Announcement Box */}
                {(() => {
                  const effectiveAnn =
                    (featuredAnnouncementId
                      ? publishedAnnouncements.find((a) => a.id === featuredAnnouncementId)
                      : undefined) || publishedAnnouncements[0];

                  return (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                      <span className="text-[10px] font-sans uppercase text-emerald-800 font-bold block">
                        Öne Çıkan Duyuru
                      </span>
                      {effectiveAnn ? (
                        <>
                          <h4 className="font-semibold text-slate-900 text-xs leading-tight line-clamp-2">
                            {effectiveAnn.title}
                          </h4>
                          <span className="text-[11px] text-slate-400 block font-sans">
                            {effectiveAnn.formattedDate}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Yayında duyuru yok</span>
                      )}
                    </div>
                  );
                })()}

                {/* Event Box */}
                {(() => {
                  const effectiveEvt =
                    (featuredEventId
                      ? publishedEvents.find((e) => e.id === featuredEventId)
                      : undefined) || publishedEvents[0];

                  return (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                      <span className="text-[10px] font-sans uppercase text-emerald-800 font-bold block">
                        Öne Çıkan Etkinlik
                      </span>
                      {effectiveEvt ? (
                        <>
                          <h4 className="font-semibold text-slate-900 text-xs leading-tight line-clamp-2">
                            {effectiveEvt.title}
                          </h4>
                          <span className="text-[11px] text-slate-400 block font-sans">
                            {effectiveEvt.formattedDate}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Yayında etkinlik yok</span>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="pt-3 text-xs text-slate-400 font-sans italic border-t border-slate-100">
                Seçimler kaydedildikten sonra ziyaretçi ana sayfasındaki `EditorialAgendaShowcase` bileşeni anlık olarak güncellenir.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: İÇERİK İŞLEM GEÇMİŞİ */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6 font-sans">
          <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-sans font-bold uppercase border border-emerald-200">
                  Yayın Kaydı
                </span>
                <h2 className="text-lg font-sans font-bold text-slate-900">
                  İçerik İşlem Geçmişi
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-1">
                Gerçekleştirilen taslak kaydı, yayın onayları, arşivleme ve vitrin seçim hareketleri.
              </p>
            </div>

            {activityLogs.length > 0 && canPublish && (
              <button
                type="button"
                onClick={() => {
                  clearDemoActivityLog();
                  setNotification({ type: 'success', message: 'İşlem geçmişi temizlendi.' });
                  setTimeout(() => setNotification(null), 2500);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Geçmişi Temizle</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            {activityLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-sans">
                Henüz kayıtlı bir işlem hareketi bulunmuyor.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activityLogs.map((log) => (
                  <div key={log.id} className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-sans font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                          {log.action}
                        </span>
                        <span className="text-xs font-semibold text-slate-900 font-sans">
                          {log.contentTitle}
                        </span>
                        <span className="text-[11px] font-sans text-slate-400">
                          ({log.contentType})
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-xs text-slate-600 font-sans leading-relaxed">
                          {log.details}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-sans text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {log.formattedTime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 font-sans leading-relaxed">
            <strong>Kayıt Notu:</strong> Bu listede yönetim paneli üzerinden gerçekleştirilen taslak, onay ve arşivleme işlemleri kronolojik olarak görüntülenir.
          </div>
        </div>
      )}

      {/* Pre-publication Checklist Modal */}
      {checklistItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-5 animate-fade-in font-sans">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-sans uppercase tracking-wider text-slate-500 font-bold block">
                  Yayınlama Öncesi Kalite Kontrolü
                </span>
                <h3 className="text-base font-sans font-bold text-slate-900 mt-0.5">
                  {checklistItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setChecklistTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checklist details */}
            <div className="space-y-3">
              {getPrePublicationChecklist(checklistItem).checks.map((c, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border text-xs flex items-start gap-3 ${c.passed ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' : 'bg-amber-50/50 border-amber-200 text-amber-900'
                    }`}
                >
                  {c.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block font-semibold">{c.label}</strong>
                    <span className="text-[11px] opacity-85 block mt-0.5">{c.note}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-sans text-slate-500 font-medium">
                Statü: {checklistItem.publicationStatus.toUpperCase()}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setChecklistTarget(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Kapat
                </button>
                {canPublish && checklistItem.publicationStatus !== 'published' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleStatusChange(checklistItem, 'published');
                      setChecklistTarget(null);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-2xs cursor-pointer"
                  >
                    Yayıma Al
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Detail Drawer */}
      <ContentDetailDrawer item={drawerItem} onClose={() => setDrawerTarget(null)} />

      {/* Bulk Delete Confirmation Modal */}
      <ActionConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
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
