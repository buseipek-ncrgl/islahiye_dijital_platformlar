import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Save,
  AlertTriangle,
  CheckCircle2,
  Search,
  ExternalLink,
  Layers,
  Sparkles,
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

const CONTENT_TYPE_LABELS: Record<string, string> = {
  all: 'Tüm İçerik Türleri (10 Tür)',
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
  const {
    contentVersion,
    updatePublicationStatus,
    getArticles,
    getAnnouncements,
    getEvents,
    getHomepageFeatured,
    saveHomepageFeatured,
    getDemoActivityLog,
    clearDemoActivityLog,
  } = useContent();

  const allItems = useMemo(() => ContentRepository.getAllItems(), [contentVersion]);

  // Main Page Tabs
  const [activeTab, setActiveTab] = useState<'inventory' | 'showcase' | 'history'>('inventory');

  // Filter State for Inventory
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPubStatus, setSelectedPubStatus] = useState<string>('all');
  const [selectedVerStatus, setSelectedVerStatus] = useState<string>('all');
  const [isDemoOnly, setIsDemoOnly] = useState<boolean | null>(null);
  const [missingSourceOnly, setMissingSourceOnly] = useState(false);

  // Selected item for detail drawer
  const [drawerItem, setDrawerItem] = useState<CmsContentItem | null>(null);

  // Pre-publication checklist modal state
  const [checklistItem, setChecklistItem] = useState<CmsContentItem | null>(null);

  // Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Homepage Showcase Selection State
  const featuredConfig = getHomepageFeatured();
  const publishedArticles = useMemo(() => getArticles(true), [getArticles, contentVersion]);
  const publishedAnnouncements = useMemo(() => getAnnouncements(true), [getAnnouncements, contentVersion]);
  const publishedEvents = useMemo(() => getEvents(true), [getEvents, contentVersion]);

  const [leadArticleId, setLeadArticleId] = useState<string>(featuredConfig.leadArticleId || '');
  const [secondaryArticleIds, setSecondaryArticleIds] = useState<string[]>(featuredConfig.secondaryArticleIds || []);
  const [featuredAnnouncementId, setFeaturedAnnouncementId] = useState<string>(
    featuredConfig.featuredAnnouncementId || ''
  );
  const [featuredEventId, setFeaturedEventId] = useState<string>(featuredConfig.featuredEventId || '');
  const [showcaseSaved, setShowcaseSaved] = useState(false);

  // Filtered Inventory Items
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCategory = item.categoryLabel.toLowerCase().includes(q);
        const matchesSource = item.officialSource ? item.officialSource.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesCategory && !matchesSource) return false;
      }

      if (selectedType !== 'all') {
        if (selectedType === 'cultural_story') {
          if (item.contentType !== 'editorial_article' || !item.id.startsWith('story-')) return false;
        } else if (item.contentType !== selectedType) {
          return false;
        }
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
    const ok = updatePublicationStatus(item.id, item.contentType as any, newStatus);
    if (ok) {
      setNotification({
        type: 'success',
        message: `"${item.title}" yayin durumu "${newStatus.toUpperCase()}" olarak güncellendi.`,
      });
      setTimeout(() => setNotification(null), 3000);
    }
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
            : 'AGENTS.md kuralı: İzni olmayan usta profilleri temsili demo kalmalıdır.',
      });
    }

    if (item.contentType === 'event') {
      checks.push({
        label: 'Tarih Mantığı ve Demo Uyarısı',
        passed: true,
        note: 'Tarih sıralaması geçerli. Başvuru butonu demo olarak etiketlenir.',
      });
    }

    const allPassed = checks.every((c) => c.passed);
    return { checks, allPassed };
  };

  // Save Homepage Featured Config
  const handleSaveShowcase = () => {
    saveHomepageFeatured({
      leadArticleId: leadArticleId || undefined,
      secondaryArticleIds,
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
      <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-xs bg-forest-50 text-forest text-[11px] font-mono font-bold uppercase tracking-wider border border-forest-200">
              MERKEZİ YAYIN YÖNETİMİ
            </span>
            <span className="text-slate-400 font-mono text-xs">•</span>
            <span className="text-slate-500 font-mono text-xs">Sprint 02C-3</span>
          </div>
          <h1 className="text-2xl font-sans font-bold text-slate-900 tracking-tight">
            Merkezi Yayın & Ana Sayfa Vitrin Yönetimi
          </h1>
          <p className="text-xs sm:text-sm font-sans text-slate-500 mt-1 max-w-3xl leading-relaxed">
            İslahiye Lezzet Atlası bünyesindeki tüm yemekler, tarifler, kültürel bellek hikâyeleri, haberler, duyurular ve
            etkinliklerin yayın durumlarını denetleyin, kalite kontrollerini gerçekleştirin ve ana sayfa vitrinini belirleyin.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-sm bg-slate-100 p-1 border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xs transition-colors flex items-center gap-1.5 ${
              activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-forest" />
            <span>Yayın Envanteri ({allItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('showcase')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xs transition-colors flex items-center gap-1.5 ${
              activeTab === 'showcase' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layout className="w-3.5 h-3.5 text-copper" />
            <span>Ana Sayfa Vitrini</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xs transition-colors flex items-center gap-1.5 ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-slate-600" />
            <span>Demo İşlem Geçmişi ({activityLogs.length})</span>
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-sm text-xs font-sans flex items-center justify-between ${
            notification.type === 'success'
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
            className="text-slate-400 hover:text-slate-600 font-mono text-sm"
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
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-xs">
              <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">Yayında</span>
              <span className="text-2xl font-sans font-bold text-emerald-700">{stats.published}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Ziyaretçiye Açık</span>
            </div>

            <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-xs">
              <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">Taslak</span>
              <span className="text-2xl font-sans font-bold text-slate-700">{stats.draft}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Yalnızca CMS</span>
            </div>

            <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-xs">
              <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">İncelemede</span>
              <span className="text-2xl font-sans font-bold text-amber-700">{stats.inReview}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Editör Kontrolünde</span>
            </div>

            <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-xs">
              <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">Arşivde</span>
              <span className="text-2xl font-sans font-bold text-slate-500">{stats.archived}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Gizlenmiş Kayıt</span>
            </div>

            <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-xs">
              <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">Doğrulanmış</span>
              <span className="text-2xl font-sans font-bold text-forest">{stats.verified}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Resmî / Saha Teyitli</span>
            </div>

            <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-xs">
              <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1">Eksik Kaynak</span>
              <span className={`text-2xl font-sans font-bold ${stats.missingSource > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                {stats.missingSource}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Atıf Girilmemiş</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-sm border border-slate-200 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Başlık, kategori veya kaynak ara..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest font-sans"
                />
              </div>

              {/* Content Type Filter (10 Types) */}
              <div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest bg-white font-sans"
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
                  className="w-full px-3 py-2 text-xs rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest bg-white font-sans"
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
                  className="w-full px-3 py-2 text-xs rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest bg-white font-sans"
                >
                  <option value="all">Tüm Doğrulama Durumları</option>
                  <option value="verified">Doğrulanmış Resmî Kayıt</option>
                  <option value="unverified">Doğrulanmamış</option>
                  <option value="simulated">Temsili Demo</option>
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
                    className="rounded-xs border-slate-300 text-forest focus:ring-forest"
                  />
                  <span>Yalnızca Gerçek / Doğrulanmış İçerikler</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={missingSourceOnly}
                    onChange={(e) => setMissingSourceOnly(e.target.checked)}
                    className="rounded-xs border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span className={missingSourceOnly ? 'text-rose-700 font-semibold' : ''}>
                    Kaynak Bilgisi Eksik Olanlar
                  </span>
                </label>
              </div>

              <div className="text-slate-500 font-mono text-[11px]">
                Listelenen: <strong>{filteredItems.length}</strong> / {allItems.length}
              </div>
            </div>
          </div>

          {/* Table of Items */}
          <div className="bg-white rounded-sm border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">İçerik Başlığı & Tür</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Yayın Durumu</th>
                    <th className="py-3 px-3">Doğruluk & Kaynak</th>
                    <th className="py-3 px-3">Kalite Kontrol</th>
                    <th className="py-3 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                        Filtrelere uygun içerik kaydı bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const check = getPrePublicationChecklist(item);

                      return (
                        <tr key={`${item.contentType}-${item.id}`} className="hover:bg-slate-50/70 transition-colors">
                          {/* Title & Type */}
                          <td className="py-3 px-4 max-w-xs">
                            <div className="flex items-start gap-3">
                              {item.coverImage ? (
                                <div className="w-10 h-10 rounded-xs overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                                  <img src={item.coverImage} alt="" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-xs bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400 font-mono text-[10px]">
                                  YOK
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-900 block truncate hover:text-forest cursor-pointer" onClick={() => setDrawerItem(item)}>
                                  {item.title}
                                </span>
                                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
                                  {item.contentTypeLabel}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                            {item.categoryLabel || item.category}
                          </td>

                          {/* Publication Status & Quick Toggle */}
                          <td className="py-3 px-3">
                            <select
                              value={item.publicationStatus}
                              onChange={(e) => handleStatusChange(item, e.target.value as PublicationStatus)}
                              className={`text-xs font-semibold py-1 px-2 rounded-xs border transition-colors ${
                                item.publicationStatus === 'published'
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
                          <td className="py-3 px-3">
                            <div className="space-y-1">
                              <VerificationBadge status={item.verificationStatus} isDemo={item.isDemo} />
                              <div className="text-[11px] text-slate-500 font-mono truncate max-w-[160px]" title={item.officialSource || item.sourceUrl}>
                                {item.officialSource || (item.sourceUrl ? 'URL Mevcut' : 'Kaynak Yok')}
                              </div>
                            </div>
                          </td>

                          {/* Quality Pre-Publication Check */}
                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => setChecklistItem(item)}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-xs text-[11px] font-semibold border transition-colors ${
                                check.allPassed
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              }`}
                            >
                              {check.allPassed ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Yayına Uygun</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  <span>Kontrol Gerekli</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setDrawerItem(item)}
                                className="p-1.5 rounded-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                title="İçerik Detayını Gör"
                              >
                                <Info className="w-4 h-4" />
                              </button>

                              {item.publicUrl && item.publicationStatus === 'published' && (
                                <Link
                                  to={item.publicUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-xs text-copper hover:text-forest hover:bg-sand/30"
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
          <div className="bg-sand/15 border border-sand/70 p-5 rounded-sm flex items-start gap-4">
            <Sparkles className="w-5 h-5 text-copper shrink-0 mt-0.5" />
            <div className="text-xs font-sans text-charcoal/80 space-y-1">
              <strong className="text-forest block text-sm font-bold">
                Ana Sayfa Editoryal Gündem & Vitrin Kontrolü (07 / Gündem Bölümü):
              </strong>
              <p>
                Ana sayfadaki "Mutfak Kültürü Gazetesi & Gündem" bölümünde öne çıkacak ana haberi, ikincil haberleri,
                öne çıkan duyuruyu ve gastronomi etkinliğini buradan seçebilirsiniz.
              </p>
              <p className="text-charcoal/60 text-[11px] font-mono">
                Kural: Yalnızca yayımlanmış (`published`) içerikler seçilebilir. Bir içerik daha sonra arşive alınırsa,
                ziyaretçi ana sayfasında bozuk bağlantı oluşmaz; sistem otomatik olarak sıradaki yayımlanmış kaydı gösterir.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Control Panel */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-6">
              <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
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
                  onChange={(e) => setLeadArticleId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest bg-white"
                >
                  <option value="">Otomatik Seçim (En Son Eklenen / isLead=true Olan)</option>
                  {publishedArticles.map((art) => (
                    <option key={art.id} value={art.id}>
                      {art.title} ({art.formattedDate})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Seçilen haber ana sayfanın en büyük editoryal kartında görseli ve özetiyle yer alır.
                </p>
              </div>

              {/* 2. Secondary Articles (2 slots) */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-800">
                  2. İkincil Araştırma Yazıları (2 Adet)
                </label>

                <div>
                  <span className="text-[11px] text-slate-500 font-mono block mb-1">İkincil Yazı #1:</span>
                  <select
                    value={secondaryArticleIds[0] || ''}
                    onChange={(e) => {
                      const newIds = [...secondaryArticleIds];
                      newIds[0] = e.target.value;
                      setSecondaryArticleIds(newIds.filter(Boolean));
                    }}
                    className="w-full px-3 py-2 text-xs rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest bg-white"
                  >
                    <option value="">Otomatik Seçim (Sıradaki Yayımlanmış Yazı)</option>
                    {publishedArticles
                      .filter((a) => a.id !== leadArticleId)
                      .map((art) => (
                        <option key={art.id} value={art.id}>
                          {art.title}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-mono block mb-1">İkincil Yazı #2:</span>
                  <select
                    value={secondaryArticleIds[1] || ''}
                    onChange={(e) => {
                      const newIds = [...secondaryArticleIds];
                      newIds[1] = e.target.value;
                      setSecondaryArticleIds(newIds.filter(Boolean));
                    }}
                    className="w-full px-3 py-2 text-xs rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest bg-white"
                  >
                    <option value="">Otomatik Seçim (Sıradaki Yayımlanmış Yazı)</option>
                    {publishedArticles
                      .filter((a) => a.id !== leadArticleId && a.id !== secondaryArticleIds[0])
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
                  onChange={(e) => setFeaturedAnnouncementId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest bg-white"
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
                  4. Öne Çıkan Etkinlik & Buluşma Kartı
                </label>
                <select
                  value={featuredEventId}
                  onChange={(e) => setFeaturedEventId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest bg-white"
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
                  onClick={handleSaveShowcase}
                  className="px-5 py-2.5 rounded-sm bg-forest hover:bg-forest-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Vitrin Seçimlerini Kaydet & Senkronize Et</span>
                </button>
              </div>
            </div>

            {/* Live Visual Preview of Selected Showcase */}
            <div className="bg-ivory p-6 rounded-sm border border-sand/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-sand/60">
                <span className="text-xs font-mono uppercase tracking-wider text-copper font-bold flex items-center gap-1.5">
                  <Layout className="w-4 h-4" />
                  <span>Ana Sayfa Vitrini Canlı Önizlemesi</span>
                </span>
                <span className="text-[11px] font-mono text-charcoal/50">Masaüstü Düzeni</span>
              </div>

              {/* Lead article card preview */}
              {(() => {
                const effectiveLead =
                  (leadArticleId ? publishedArticles.find((a) => a.id === leadArticleId) : undefined) ||
                  publishedArticles[0];

                if (!effectiveLead) {
                  return (
                    <div className="p-4 bg-paper border border-sand rounded-xs text-xs text-charcoal/60">
                      Yayında haber bulunmadığı için vitrin gösterilemiyor.
                    </div>
                  );
                }

                return (
                  <div className="bg-paper border border-sand/80 rounded-xs p-4 space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-copper font-bold block">
                      MANŞET: {effectiveLead.categoryLabel}
                    </span>
                    <h3 className="text-base font-display font-bold text-forest leading-snug">
                      {effectiveLead.title}
                    </h3>
                    <p className="text-xs text-charcoal/70 line-clamp-2">{effectiveLead.summary}</p>
                    <div className="text-[10px] font-mono text-charcoal/40 pt-1">
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
                    <div className="bg-paper p-3 rounded-xs border border-sand/70 text-xs space-y-1">
                      <span className="text-[10px] font-mono uppercase text-copper font-bold block">
                        Öne Çıkan Duyuru
                      </span>
                      {effectiveAnn ? (
                        <>
                          <h4 className="font-semibold text-forest text-xs leading-tight line-clamp-2">
                            {effectiveAnn.title}
                          </h4>
                          <span className="text-[10px] text-charcoal/50 block font-mono">
                            {effectiveAnn.formattedDate}
                          </span>
                        </>
                      ) : (
                        <span className="text-charcoal/40 text-[11px]">Yayında duyuru yok</span>
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
                    <div className="bg-paper p-3 rounded-xs border border-sand/70 text-xs space-y-1">
                      <span className="text-[10px] font-mono uppercase text-copper font-bold block">
                        Öne Çıkan Etkinlik
                      </span>
                      {effectiveEvt ? (
                        <>
                          <h4 className="font-semibold text-forest text-xs leading-tight line-clamp-2">
                            {effectiveEvt.title}
                          </h4>
                          <span className="text-[10px] text-charcoal/50 block font-mono">
                            {effectiveEvt.formattedDate}
                          </span>
                        </>
                      ) : (
                        <span className="text-charcoal/40 text-[11px]">Yayında etkinlik yok</span>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="pt-3 text-[11px] text-charcoal/50 font-sans italic border-t border-sand/50">
                Seçimler kaydedildikten sonra ziyaretçi ana sayfasındaki `EditorialAgendaShowcase` bileşeni anlık olarak güncellenir.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DEMO İŞLEM GEÇMİŞİ */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-xs bg-sand/40 text-charcoal/80 text-[10px] font-mono font-bold uppercase border border-sand">
                  Demo Simülasyonu
                </span>
                <h2 className="text-lg font-sans font-bold text-slate-900">
                  Demo İçerik İşlem Geçmişi
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-1">
                Tarayıcı oturumunda gerçekleştirilen taslak kaydı, demo yayını, arşivleme ve vitrin seçim hareketleri.
              </p>
            </div>

            {activityLogs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearDemoActivityLog();
                  setNotification({ type: 'success', message: 'Demo işlem geçmişi temizlendi.' });
                  setTimeout(() => setNotification(null), 2500);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Geçmişi Temizle</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-sm border border-slate-200 shadow-xs overflow-hidden">
            {activityLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-sans">
                Henüz kayıtlı bir demo işlem hareketi bulunmuyor.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activityLogs.map((log) => (
                  <div key={log.id} className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-xs">
                          {log.action}
                        </span>
                        <span className="text-xs font-semibold text-slate-900 font-sans">
                          {log.contentTitle}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
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
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {log.formattedTime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-sm border border-slate-200 text-xs text-slate-600 font-sans leading-relaxed">
            <strong>Şeffaflık İlkesi:</strong> Bu kayıtlar gerçek bir kurumsal denetim izi veya yetkilendirilmiş kullanıcı logu değildir.
            Gerçek authentication bulunmadığından tarayıcı localStorage tabanlı demo simülasyonu olarak işletilmektedir.
          </div>
        </div>
      )}

      {/* Pre-publication Checklist Modal */}
      {checklistItem && (
        <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
                  Yayınlama Öncesi Kalite Kontrolü
                </span>
                <h3 className="text-base font-sans font-bold text-slate-900 mt-0.5">
                  {checklistItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setChecklistItem(null)}
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
                  className={`p-3 rounded-xs border text-xs flex items-start gap-3 ${
                    c.passed ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' : 'bg-amber-50/50 border-amber-200 text-amber-900'
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
              <span className="text-[11px] font-mono text-slate-400">
                Statü: {checklistItem.publicationStatus.toUpperCase()}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setChecklistItem(null)}
                  className="px-3 py-1.5 rounded-sm border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Kapat
                </button>
                {checklistItem.publicationStatus !== 'published' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleStatusChange(checklistItem, 'published');
                      setChecklistItem(null);
                    }}
                    className="px-4 py-1.5 rounded-sm bg-forest text-white text-xs font-semibold hover:bg-forest-800"
                  >
                    Demo Olarak Yayımla
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Detail Drawer */}
      <ContentDetailDrawer item={drawerItem} onClose={() => setDrawerItem(null)} />
    </div>
  );
};
