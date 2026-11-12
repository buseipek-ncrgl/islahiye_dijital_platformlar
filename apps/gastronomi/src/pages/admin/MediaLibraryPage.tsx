import React, { useState, useMemo } from 'react';
import {
  Video,
  Image as ImageIcon,
  Search,
  Grid,
  List,
  Plus,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Link2,
  Trash2,
  X,
  Play,
  FileText,
  Info,
} from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import { MediaItem, MediaType, MediaOrigin, PublicationStatus } from '../../types';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { useAdminRole } from '../../context/AdminRoleContext';
import { BulkActionBar } from '../../components/admin/common/BulkActionBar';
import { ActionConfirmModal } from '../../components/admin/common/ActionConfirmModal';

type ViewMode = 'grid' | 'list';

export const MediaLibraryPage: React.FC = () => {
  const {
    getMediaItems,
    saveMediaItem,
    deleteMediaItem,
    updateStatus,
    getDishes,
    getCulturalStories,
    getFilms,
    getRecipes,
  } = useContent();

  const mediaItems = getMediaItems();
  const allDishes = getDishes(false);
  const allStories = getCulturalStories(false);
  const allFilms = getFilms(false);
  const allRecipes = getRecipes();
  const { canCreate, canEdit, canDelete, canPublish } = useAdminRole();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<MediaType | 'all'>('all');
  const [selectedOrigin, setSelectedOrigin] = useState<MediaOrigin | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<PublicationStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Multi-selection state
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Modal states
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<MediaItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [fileNotice, setFileNotice] = useState<string | null>(null);

  // Edit form state
  const [formData, setFormData] = useState<Partial<MediaItem>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedMediaIds(filteredItems.map((item) => item.id));
    } else {
      setSelectedMediaIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkPublish = () => {
    if (!canPublish) return;
    selectedMediaIds.forEach((id) => {
      updateStatus(id, 'media', 'published');
    });
    showToast(`${selectedMediaIds.length} medya kaydı başarıyla yayına alındı.`);
    setSelectedMediaIds([]);
  };

  const handleBulkDraft = () => {
    if (!canPublish) return;
    selectedMediaIds.forEach((id) => {
      updateStatus(id, 'media', 'draft');
    });
    showToast(`${selectedMediaIds.length} medya kaydı taslağa alındı.`);
    setSelectedMediaIds([]);
  };

  const handleBulkDeleteConfirm = () => {
    if (!canDelete) return;
    selectedMediaIds.forEach((id) => {
      deleteMediaItem(id);
    });
    showToast(`${selectedMediaIds.length} medya kaydı kalıcı olarak silindi.`);
    setSelectedMediaIds([]);
    setIsBulkDeleteModalOpen(false);
  };

  // Filtered Media
  const filteredItems = useMemo(() => {
    return mediaItems.filter((item) => {
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLocaleLowerCase('tr-TR');
        const matchesTitle = item.title.toLocaleLowerCase('tr-TR').includes(q);
        const matchesDesc = item.description?.toLocaleLowerCase('tr-TR').includes(q) || false;
        const matchesAlt = item.altText?.toLocaleLowerCase('tr-TR').includes(q) || false;
        const matchesSrc = item.src?.toLocaleLowerCase('tr-TR').includes(q) || false;
        if (!matchesTitle && !matchesDesc && !matchesAlt && !matchesSrc) {
          return false;
        }
      }

      if (selectedType !== 'all' && item.mediaType !== selectedType) {
        return false;
      }

      if (selectedOrigin !== 'all' && item.origin !== selectedOrigin) {
        return false;
      }

      if (selectedStatus !== 'all' && item.publicationStatus !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [mediaItems, searchQuery, selectedType, selectedOrigin, selectedStatus]);

  // Content ID to Name map
  const contentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allDishes.forEach((d) => map.set(d.id, `Yemek: ${d.name}`));
    allStories.forEach((s) => map.set(s.id, `Miras: ${s.title}`));
    allFilms.forEach((f) => map.set(f.id, `Video: ${f.title}`));
    allRecipes.forEach((r) => map.set(r.id, `Tarif: ${r.title}`));
    return map;
  }, [allDishes, allStories, allFilms, allRecipes]);

  // Open Edit Modal
  const handleOpenEdit = (item: MediaItem) => {
    setActiveItem(item);
    setIsCreatingNew(false);
    setModalError(null);
    setFileNotice(null);
    setFormData({ ...item });
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    if (!canCreate) return;
    setIsCreatingNew(true);
    setModalError(null);
    setFileNotice(null);
    const newItem: MediaItem = {
      id: `media-custom-${Date.now()}`,
      title: '',
      mediaType: 'dish_photo',
      src: '',
      description: '',
      altText: '',
      origin: 'real_local',
      usagePermission: 'İslahiye Lezzet Atlası Arşivi',
      verificationStatus: 'verified',
      relatedContentIds: [],
      publicationStatus: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fileSize: '—',
      dimensionsOrDuration: '1920x1080',
    };
    setActiveItem(newItem);
    setFormData(newItem);
  };

  // Save Modal
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const canSaveModal = isCreatingNew ? canCreate : canEdit;
    if (!canSaveModal) {
      setModalError('Aktif rolünüzle medya kaydı oluşturma veya düzenleme yetkiniz bulunmamaktadır.');
      return;
    }
    if (!formData.title?.trim() || !formData.src?.trim()) {
      setModalError('Lütfen medya başlığı ve dosya yolu / URL alanlarını doldurunuz.');
      return;
    }
    setModalError(null);

    const requestedStatus: PublicationStatus = formData.publicationStatus || 'draft';
    const finalStatus: PublicationStatus =
      !canPublish && (requestedStatus === 'published' || requestedStatus === 'archived')
        ? 'in_review'
        : requestedStatus;

    const itemToSave: MediaItem = {
      id: formData.id || `media-${Date.now()}`,
      title: formData.title.trim(),
      mediaType: formData.mediaType || 'dish_photo',
      src: formData.src.trim(),
      thumbnailSrc: formData.thumbnailSrc?.trim() || formData.src.trim(),
      posterSrc: formData.posterSrc?.trim(),
      description: formData.description?.trim() || '',
      altText: formData.altText?.trim() || formData.title.trim(),
      origin: formData.origin || 'real_local',
      sourceUrl: formData.sourceUrl?.trim() || undefined,
      licenseUrl: formData.licenseUrl?.trim() || undefined,
      usagePermission: formData.usagePermission?.trim() || 'İslahiye Lezzet Atlası Arşivi',
      verificationStatus: formData.verificationStatus || 'verified',
      relatedContentIds: formData.relatedContentIds || [],
      publicationStatus: finalStatus,
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fileSize: formData.fileSize || '—',
      dimensionsOrDuration: formData.dimensionsOrDuration || '1920x1080',
    };

    const ok = saveMediaItem(itemToSave);
    if (!ok) {
      setModalError('Medya yerel depoya kaydedilemedi.');
      return;
    }
    showToast(isCreatingNew ? 'Yeni medya başarıyla eklendi.' : 'Medya bilgileri güncellendi.');
    setActiveItem(null);
  };

  // Origin Badge Formatter
  const renderOriginBadge = (origin: MediaOrigin) => {
    switch (origin) {
      case 'real_local':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-sans font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Gerçek Yerel Çekim</span>
          </span>
        );
      case 'licensed_stock':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-sans font-semibold bg-sky-50 text-sky-800 border border-sky-200">
            <FileText className="w-3.5 h-3.5 text-sky-600" />
            <span>Lisanslı Stok</span>
          </span>
        );
      case 'ai_generated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-sans font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <Cpu className="w-3.5 h-3.5 text-purple-600" />
            <span>Yapay Zekâ (T2V)</span>
          </span>
        );
      case 'representative':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-sans font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Editoryal Görsel</span>
          </span>
        );
      case 'unverified':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-sans font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Doğrulanmamış</span>
          </span>
        );
    }
  };

  const renderTypeLabel = (type: MediaType) => {
    switch (type) {
      case 'dish_photo':
        return 'Yemek Fotoğrafı';
      case 'heritage':
        return 'Kültürel Miras';
      case 'video':
        return 'Gastronomi Videosu';
      case 'artisan':
        return 'Zanaat / Usta';
      case 'recipe_step':
        return 'Tarif Adımı';
      case 'news_event':
        return 'Haber & Etkinlik';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-sans shadow-xl border border-slate-700 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Context Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
            Medya &amp; Görsel Kütüphanesi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed font-sans">
            İslahiye Lezzet Atlası fotoğrafları, sinematik video klipleri, köken/lisans bilgileri
            ve içerik kullanım ilişkileri yönetim alanı.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
            Kayıt: <strong className="text-slate-900">{filteredItems.length}</strong> / {mediaItems.length}
          </div>

          {canCreate ? (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="h-9 px-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Medya Kaydı Ekle</span>
            </button>
          ) : (
            <div
              className="h-9 px-3.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-medium cursor-not-allowed border border-slate-200 inline-flex items-center justify-center shrink-0"
              title="İncelemeci rolünde yeni medya yüklenemez."
            >
              <span>Yeni Medya (Kısıtlı)</span>
            </div>
          )}
        </div>
      </div>

      {/* Institutional Accuracy Notice */}
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-sans flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block mb-0.5 font-bold">Medya Kökeni ve Telif Standartları:</strong>
          Kütüphanedeki tüm fotoğraf ve video içerikleri telif ve kullanım izinlerine uygun olarak kataloglanmaktadır.
          Yüksek çözünürlüklü saha çekimleri doğrudan medya arşivinde saklanmaktadır.
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Medya başlığı, dosya adı, açıklama veya alt metin ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 text-slate-800 placeholder-slate-400 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-100 self-end lg:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
              title="Galeri / Kart Görünümü"
            >
              <Grid className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline text-xs">Galeri</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
              title="Tablo / Liste Görünümü"
            >
              <List className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline text-xs">Liste</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-sans text-slate-500 font-semibold uppercase mr-1">
            Filtrele:
          </span>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="h-9 px-3 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Tüm Medya Türleri</option>
            <option value="dish_photo">Yemek Fotoğrafı</option>
            <option value="heritage">Kültürel Miras</option>
            <option value="video">Gastronomi Videosu</option>
            <option value="artisan">Zanaat & Usta</option>
            <option value="recipe_step">Tarif Adımı</option>
            <option value="news_event">Haber & Etkinlik</option>
          </select>

          {/* Origin Filter */}
          <select
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value as any)}
            className="h-9 px-3 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Tüm Kökenler</option>
            <option value="real_local">Gerçek Yerel Çekim</option>
            <option value="licensed_stock">Lisanslı Stok</option>
            <option value="ai_generated">Yapay Zekâ (T2V)</option>
            <option value="representative">Editoryal Görsel</option>
            <option value="unverified">Doğrulanmamış</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="h-9 px-3 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Tüm Yayın Durumları</option>
            <option value="published">Yayında</option>
            <option value="draft">Taslak</option>
            <option value="in_review">İncelemede</option>
            <option value="archived">Arşivde</option>
          </select>

          {(searchQuery || selectedType !== 'all' || selectedOrigin !== 'all' || selectedStatus !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setSelectedOrigin('all');
                setSelectedStatus('all');
              }}
              className="text-xs font-sans font-semibold text-rose-600 hover:underline ml-auto"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar for Media */}
      <BulkActionBar
        selectedCount={selectedMediaIds.length}
        totalCount={filteredItems.length}
        onClearSelection={() => setSelectedMediaIds([])}
        onBulkPublish={handleBulkPublish}
        onBulkDraft={handleBulkDraft}
        onBulkDelete={() => setIsBulkDeleteModalOpen(true)}
        canDelete={canDelete}
        canPublish={canPublish}
      />

      {/* Main Content Area */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Eşleşen Medya Bulunamadı</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Arama kriterlerinize uygun fotoğraf veya video kaydı bulunamadı. Filtreleri temizleyebilir veya yeni medya ekleyebilirsiniz.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const isVideo = item.mediaType === 'video' || item.src.endsWith('.mp4');
            const previewSrc = item.posterSrc || item.thumbnailSrc || item.src;
            const usageCount = item.relatedContentIds.length;
            const isSelected = selectedMediaIds.includes(item.id);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border transition-all flex flex-col justify-between overflow-hidden shadow-2xs group ${
                  isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Media Preview Box */}
                  <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden border-b border-slate-100">
                    <ImageWithFallback
                      src={previewSrc}
                      alt={item.altText || item.title}
                      fallbackText={item.title}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />

                    {/* Selection Checkbox Overlay */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(item.id)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer bg-white/95 shadow-xs"
                        title="Bu medyayı seç"
                      />
                    </div>

                    {/* Video Indicator */}
                    {isVideo && (
                      <div className="absolute top-2.5 left-9 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-sans font-semibold flex items-center gap-1 z-10">
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>{item.dimensionsOrDuration || '00:05'}</span>
                      </div>
                    )}

                    {/* Status Badge Overlay */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-sans uppercase font-bold tracking-wider ${
                          item.publicationStatus === 'published'
                            ? 'bg-emerald-600 text-white'
                            : item.publicationStatus === 'draft'
                              ? 'bg-amber-500 text-white'
                              : item.publicationStatus === 'in_review'
                              ? 'bg-sky-600 text-white'
                              : 'bg-slate-600 text-white'
                        }`}
                      >
                        {item.publicationStatus === 'published'
                          ? 'Yayında'
                          : item.publicationStatus === 'draft'
                          ? 'Taslak'
                          : item.publicationStatus === 'in_review'
                          ? 'İncelemede'
                          : 'Arşivde'}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-sans text-slate-600 font-semibold uppercase">
                        {renderTypeLabel(item.mediaType)}
                      </span>
                      <span className="text-slate-300">•</span>
                      {renderOriginBadge(item.origin)}
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-sans">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer / Actions */}
                <div className="p-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  {/* Linked contents counter */}
                  <div
                    className="flex items-center gap-1.5 text-[11px] font-sans font-medium text-slate-500"
                    title={
                      usageCount > 0
                        ? item.relatedContentIds
                            .map((id) => contentNameMap.get(id) || id)
                            .join(', ')
                        : 'Henüz bir içeriğe bağlanmadı'
                    }
                  >
                    <Link2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{usageCount} İçerik</span>
                  </div>

                  {/* Edit action */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="h-7 px-2.5 rounded-lg bg-slate-100 hover:bg-emerald-700 hover:text-white text-slate-700 text-xs font-semibold transition-colors"
                  >
                    {canEdit ? 'Detay & Düzenle' : 'Detayı Gör'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 font-sans">
              <thead className="bg-slate-50/80 text-[11px] font-sans font-semibold uppercase text-slate-500 border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredItems.length > 0 && selectedMediaIds.length === filteredItems.length}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate =
                            selectedMediaIds.length > 0 && selectedMediaIds.length < filteredItems.length;
                        }
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer"
                      title="Tümünü Seç / Kaldır"
                    />
                  </th>
                  <th className="py-3 px-4 w-16">Önizleme</th>
                  <th className="py-3 px-4">Başlık &amp; Dosya</th>
                  <th className="py-3 px-4">Tür &amp; Köken</th>
                  <th className="py-3 px-4">İlişkili İçerikler</th>
                  <th className="py-3 px-4">Doğrulama</th>
                  <th className="py-3 px-4">Durum</th>
                  <th className="py-3 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isVideo = item.mediaType === 'video' || item.src.endsWith('.mp4');
                  const previewSrc = item.posterSrc || item.thumbnailSrc || item.src;
                  const isSelected = selectedMediaIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-emerald-50/50' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer"
                          title="Bu medyayı seç"
                        />
                      </td>
                      <td className="py-2.5 px-4 align-middle">
                        <div className="w-12 h-9 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 relative">
                          <ImageWithFallback
                            src={previewSrc}
                            alt={item.title}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-cover"
                          />
                          {isVideo && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                              <Play className="w-3 h-3 fill-current" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 max-w-xs align-middle">
                        <div className="font-bold text-slate-900 leading-snug text-xs sm:text-[13px]">{item.title}</div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5 font-sans">
                          {item.src}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 align-middle">
                        <div className="text-xs font-semibold text-slate-700 mb-1">
                          {renderTypeLabel(item.mediaType)}
                        </div>
                        {renderOriginBadge(item.origin)}
                      </td>
                      <td className="py-2.5 px-4 align-middle">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.relatedContentIds.length > 0 ? (
                            item.relatedContentIds.slice(0, 2).map((cId) => (
                              <span
                                key={cId}
                                className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-sans font-medium border border-slate-200 truncate max-w-[130px]"
                                title={contentNameMap.get(cId) || cId}
                              >
                                {contentNameMap.get(cId) || cId}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Bağlantısız</span>
                          )}
                          {item.relatedContentIds.length > 2 && (
                            <span className="text-[11px] font-sans font-semibold text-slate-500">
                              +{item.relatedContentIds.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 align-middle">
                        {item.verificationStatus === 'verified' ? (
                          <span className="text-emerald-700 font-sans text-xs font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Doğrulandı
                          </span>
                        ) : item.verificationStatus === 'simulated' ? (
                          <span className="text-amber-700 font-sans text-xs font-semibold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Ön İnceleme
                          </span>
                        ) : (
                          <span className="text-rose-700 font-sans text-xs font-semibold flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Doğrulanmadı
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 align-middle">
                        <select
                          value={item.publicationStatus}
                          disabled={!canPublish}
                          title={!canPublish ? 'Yayın durumu için Yayın Sorumlusu / Yönetici yetkisi gerekir' : undefined}
                          onChange={(e) => {
                            const nextStatus = e.target.value as PublicationStatus;
                            updateStatus(item.id, 'media', nextStatus);
                            showToast(`Yayın durumu güncellendi: ${nextStatus}`);
                          }}
                          className="text-xs font-sans font-medium px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <option value="published">Yayında</option>
                          <option value="draft">Taslak</option>
                          <option value="in_review">İncelemede</option>
                          <option value="archived">Arşivde</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-4 text-right align-middle">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="h-7 px-2.5 rounded-lg bg-slate-100 hover:bg-emerald-700 hover:text-white text-slate-700 text-xs font-semibold transition-colors mr-1.5"
                        >
                          {canEdit ? 'Düzenle' : 'Detay'}
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleteCandidate(item)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors inline-block align-middle cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT & DETAIL MODAL / DRAWER */}
      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col justify-between overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                  {formData.mediaType === 'video' ? (
                    <Video className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-emerald-700" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    {isCreatingNew ? 'Yeni Medya Kaydı Ekle' : 'Medya Detayı & Lisans Düzenleme'}
                  </h2>
                  <p className="text-xs font-sans text-slate-500">
                    ID: {formData.id || 'Yeni Kayıt'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveModal} className="p-6 overflow-y-auto space-y-6 flex-1">
              {modalError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                  {modalError}
                </div>
              )}
              {/* Media Preview Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-900 overflow-hidden relative aspect-[16/9] flex items-center justify-center">
                {formData.src ? (
                  formData.mediaType === 'video' || formData.src.endsWith('.mp4') ? (
                    <video
                      src={formData.src}
                      poster={formData.posterSrc}
                      controls
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageWithFallback
                      src={formData.src}
                      alt={formData.altText || formData.title || 'Önizleme'}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  <div className="text-slate-400 text-xs font-sans flex flex-col items-center gap-2">
                    <ImageIcon className="w-8 h-8 opacity-40" />
                    <span>Önizleme için geçerli bir medya yolu giriniz.</span>
                  </div>
                )}
              </div>

              {/* Controlled Upload */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Yerel Medya Dosyası Seçimi
                  </label>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Görsel & Video
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*,video/mp4"
                  disabled={isCreatingNew ? !canCreate : !canEdit}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const fakePath = file.type.startsWith('video')
                        ? `/videos/${file.name}`
                        : `/images/${file.name}`;
                      setFormData({
                        ...formData,
                        src: fakePath,
                        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                        title: formData.title || file.name.replace(/\.[^/.]+$/, ''),
                      });
                      setFileNotice(
                        `Dosya seçildi: "${file.name}" (${(file.size / 1024).toFixed(0)} KB). /public/images veya /public/videos dizinindeki dosya yolunu ya da geçerli bir görsel URL'sini kullanınız.`
                      );
                    }
                  }}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800 cursor-pointer disabled:opacity-50"
                />
                {fileNotice && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5 leading-relaxed">
                    {fileNotice}
                  </p>
                )}
                <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                  Sunucu yükleme altyapısı bulunmadığından doğrudan dosya yolu veya web URL'si girebilirsiniz.
                </p>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Medya Başlığı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Örn: Geleneksel İslahiye Tavası — Bakır Tepside Meşe Közü"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Media Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Medya Türü
                  </label>
                  <select
                    value={formData.mediaType || 'dish_photo'}
                    onChange={(e) => setFormData({ ...formData, mediaType: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  >
                    <option value="dish_photo">Yemek Fotoğrafı</option>
                    <option value="heritage">Kültürel Miras Görseli</option>
                    <option value="video">Gastronomi Videosu (MP4)</option>
                    <option value="artisan">Usta / Üretici Fotoğrafı</option>
                    <option value="recipe_step">Tarif Adımı Görseli</option>
                    <option value="news_event">Haber ve Etkinlik Görseli</option>
                  </select>
                </div>

                {/* Media Origin */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Medya Kökeni & Kaynak Türü
                  </label>
                  <select
                    value={formData.origin || 'real_local'}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  >
                    <option value="real_local">Gerçek Yerel Çekim (Saha / Kültür Arşivi)</option>
                    <option value="licensed_stock">Lisanslı Stok Medya</option>
                    <option value="ai_generated">Yapay Zekâ Üretimi (T2V / Sentetik)</option>
                    <option value="representative">Editoryal Arşiv Görseli</option>
                    <option value="unverified">Kaynağı Henüz Doğrulanmamış</option>
                  </select>
                </div>

                {/* Source Path */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Medya Dosya Yolu / URL <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.src || ''}
                    onChange={(e) => setFormData({ ...formData, src: e.target.value })}
                    placeholder="/images/islahiye_tava.jpg veya web URL'si"
                    className="w-full px-3 py-2 text-xs font-sans border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Poster / Thumbnail Path */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kapak / Poster Görseli Yolu (Videolar İçin)
                  </label>
                  <input
                    type="text"
                    value={formData.posterSrc || ''}
                    onChange={(e) => setFormData({ ...formData, posterSrc: e.target.value })}
                    placeholder="/images/tas_firin_kozu_poster.jpg"
                    className="w-full px-3 py-2 text-xs font-sans border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Açıklama & İçerik Detayı
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Medyanın temsil ettiği yemek, zanaat veya kültürel bağlam..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Alt Text */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Erişilebilirlik Alt Metni (Alt Text)
                  </label>
                  <input
                    type="text"
                    value={formData.altText || ''}
                    onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                    placeholder="Ekran okuyucular için betimleyici görsel metni"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Source URL & License URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kaynak URL
                  </label>
                  <input
                    type="url"
                    value={formData.sourceUrl || ''}
                    onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs font-sans border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lisans Belgesi URL
                  </label>
                  <input
                    type="url"
                    value={formData.licenseUrl || ''}
                    onChange={(e) => setFormData({ ...formData, licenseUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs font-sans border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Usage Permission */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kullanım İzni / Telif Beyanı
                  </label>
                  <input
                    type="text"
                    value={formData.usagePermission || ''}
                    onChange={(e) => setFormData({ ...formData, usagePermission: e.target.value })}
                    placeholder="Örn: İslahiye Lezzet Atlası Kurumsal Arşivi"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Statuses */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Doğrulama Durumu
                  </label>
                  <select
                    value={formData.verificationStatus || 'verified'}
                    onChange={(e) =>
                      setFormData({ ...formData, verificationStatus: e.target.value as any })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  >
                    <option value="verified">Doğrulanmış (Resmî/Doğrulanmış Kaynak)</option>
                    <option value="simulated">Ön İnceleme Kaydı</option>
                    <option value="unverified">Doğrulanmamış (İnceleme Gerekli)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Yayın Durumu
                  </label>
                  <select
                    value={formData.publicationStatus || 'draft'}
                    disabled={isCreatingNew ? !canCreate : !canEdit}
                    onChange={(e) =>
                      setFormData({ ...formData, publicationStatus: e.target.value as any })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 bg-white disabled:bg-slate-50"
                  >
                    <option value="published" disabled={!canPublish}>
                      Yayında{!canPublish ? ' — Yayın yetkisi gerekir' : ''}
                    </option>
                    <option value="draft">Taslak</option>
                    <option value="in_review">İncelemede</option>
                    <option value="archived" disabled={!canPublish}>
                      Arşivde{!canPublish ? ' — Yayın yetkisi gerekir' : ''}
                    </option>
                  </select>
                </div>

                {/* Related Contents Multi-Picker */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    İlişkili İçerikler (Bu medyanın kullanıldığı yerler)
                  </label>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50/50">
                    {Array.from(contentNameMap.entries()).map(([cId, cName]) => {
                      const isSelected = formData.relatedContentIds?.includes(cId);
                      return (
                        <label
                          key={cId}
                          className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg text-xs text-slate-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const current = formData.relatedContentIds || [];
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  relatedContentIds: [...current, cId],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  relatedContentIds: current.filter((id) => id !== cId),
                                });
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="truncate">{cName}</span>
                          <span className="text-[11px] font-sans text-slate-400 ml-auto shrink-0">
                            ID: {cId}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                {canDelete && !isCreatingNew && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteCandidate(activeItem);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Medyayı Sil</span>
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setActiveItem(null)}
                    className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  >
                    Vazgeç
                  </button>
                  {(isCreatingNew ? canCreate : canEdit) && (
                    <button
                      type="submit"
                      className="h-9 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition shadow-2xs"
                    >
                      {isCreatingNew ? 'Medya Kaydını Oluştur' : 'Değişiklikleri Kaydet'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">Medya Kaydını Silmek İstiyor musunuz?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              <strong>"{deleteCandidate.title}"</strong> ({deleteCandidate.src}) kaydı kütüphaneden silinecektir.
            </p>

            {deleteCandidate.relatedContentIds.length > 0 && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                <strong className="block font-bold">Kullanım Uyarısı:</strong>
                <p>
                  Bu medya şu anda <strong>{deleteCandidate.relatedContentIds.length}</strong> farklı içerikte kullanılmaktadır:
                </p>
                <ul className="list-disc list-inside text-xs font-sans mt-1">
                  {deleteCandidate.relatedContentIds.map((cId) => (
                    <li key={cId} className="truncate">
                      {contentNameMap.get(cId) || cId}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-xs">
                  Silinmesi durumunda ziyaretçi arayüzünde güvenli fallback görseli görüntülenecektir.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteMediaItem(deleteCandidate.id);
                  showToast('Medya kaydı silindi.');
                  setDeleteCandidate(null);
                  if (activeItem?.id === deleteCandidate.id) {
                    setActiveItem(null);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      <ActionConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Toplu Medya Kaydı Silme Onayı"
        message={`Seçilen ${selectedMediaIds.length} medya kaydını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText={`Evet, ${selectedMediaIds.length} Medyayı Sil`}
        cancelText="Vazgeç"
        variant="danger"
      />
    </div>
  );
};
