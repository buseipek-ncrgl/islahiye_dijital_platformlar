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
  Sparkles,
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

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<MediaType | 'all'>('all');
  const [selectedOrigin, setSelectedOrigin] = useState<MediaOrigin | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<PublicationStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Modal states
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<MediaItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit form state
  const [formData, setFormData] = useState<Partial<MediaItem>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Media
  const filteredItems = useMemo(() => {
    return mediaItems.filter((item) => {
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q) || false;
        const matchesAlt = item.altText?.toLowerCase().includes(q) || false;
        const matchesSrc = item.src?.toLowerCase().includes(q) || false;
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
    setFormData({ ...item });
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setIsCreatingNew(true);
    const newItem: MediaItem = {
      id: `media-custom-${Date.now()}`,
      title: '',
      mediaType: 'dish_photo',
      src: '',
      description: '',
      altText: '',
      origin: 'representative',
      usagePermission: 'Kurumsal izin ve telif incelemesinde',
      verificationStatus: 'unverified',
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
    if (!formData.title?.trim() || !formData.src?.trim()) {
      alert('Lütfen başlık ve medya yolu (URL) alanlarını doldurunuz.');
      return;
    }

    const itemToSave: MediaItem = {
      id: formData.id || `media-${Date.now()}`,
      title: formData.title.trim(),
      mediaType: formData.mediaType || 'dish_photo',
      src: formData.src.trim(),
      thumbnailSrc: formData.thumbnailSrc?.trim() || formData.src.trim(),
      posterSrc: formData.posterSrc?.trim(),
      description: formData.description?.trim() || '',
      altText: formData.altText?.trim() || formData.title.trim(),
      origin: formData.origin || 'representative',
      sourceUrl: formData.sourceUrl?.trim() || undefined,
      licenseUrl: formData.licenseUrl?.trim() || undefined,
      usagePermission: formData.usagePermission?.trim() || 'Temsili Ön Tanıtım İzni',
      verificationStatus: formData.verificationStatus || 'unverified',
      relatedContentIds: formData.relatedContentIds || [],
      publicationStatus: formData.publicationStatus || 'draft',
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fileSize: formData.fileSize || '—',
      dimensionsOrDuration: formData.dimensionsOrDuration || '1920x1080',
    };

    saveMediaItem(itemToSave);
    showToast(isCreatingNew ? 'Yeni medya başarıyla eklendi.' : 'Medya bilgileri güncellendi.');
    setActiveItem(null);
  };

  // Origin Badge Formatter
  const renderOriginBadge = (origin: MediaOrigin) => {
    switch (origin) {
      case 'real_local':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Gerçek Yerel Çekim</span>
          </span>
        );
      case 'licensed_stock':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono font-medium bg-sky-50 text-sky-800 border border-sky-200">
            <FileText className="w-3 h-3 text-sky-600" />
            <span>Lisanslı Stok</span>
          </span>
        );
      case 'ai_generated':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono font-medium bg-purple-50 text-purple-800 border border-purple-200">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>Yapay Zekâ (T2V)</span>
          </span>
        );
      case 'representative':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Temsili Görsel</span>
          </span>
        );
      case 'unverified':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono font-medium bg-rose-50 text-rose-800 border border-rose-200">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
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
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-sm bg-forest-900 text-ivory text-xs font-mono shadow-xl border border-sand/40 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-copper-light shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Context Banner */}
      <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-copper" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 font-semibold">
              KURUMSAL MEDYA KATALOĞU & ENVENTER
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Medya & Görsel Kütüphanesi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            İslahiye Lezzet Atlası fotoğrafları, sinematik video klipleri, köken/lisans bilgileri
            ve içerik kullanım ilişkileri yönetim alanı.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="px-3 py-1.5 rounded-sm bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono">
            Kayıt: <strong>{filteredItems.length}</strong> / {mediaItems.length}
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-forest hover:bg-forest-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Yeni Medya Kaydı Ekle</span>
          </button>
        </div>
      </div>

      {/* Institutional Accuracy Notice */}
      <div className="p-4 rounded-sm bg-amber-50/70 border border-amber-200 text-amber-900 text-xs font-sans flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block mb-0.5 font-bold">Medya Kökeni ve Temsil İlkeleri:</strong>
          AGENTS.md ve MEDIA_ORIGIN_INVENTORY.md kuralları gereğince, görsel ve video kaynakları şeffaf tutulmaktadır.
          Gerçek yerel çekim olmayan stok ve yapay zekâ temsili medyalar açıkça etiketlenir; kaynağı doğrulanmamış medyaya hayali lisans atfedilmez.
          Büyük medya dosyaları tarayıcı belleğine (localStorage) ikili olarak kaydedilmez, kontrollü dosya yolu veya URL olarak kataloglanır.
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Medya başlığı, dosya adı, açıklama veya alt metin ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest text-slate-800 placeholder-slate-400"
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
          <div className="flex items-center gap-1 border border-slate-200 rounded-sm p-0.5 bg-slate-50 self-end lg:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xs text-xs font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'grid'
                  ? 'bg-white text-forest shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Galeri / Kart Görünümü"
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Galeri</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-xs text-xs font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'list'
                  ? 'bg-white text-forest shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tablo / Liste Görünümü"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Liste</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase mr-1">
            Filtrele:
          </span>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="px-2.5 py-1 text-xs border border-slate-200 rounded-sm bg-white text-slate-700 focus:outline-none focus:border-forest"
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
            className="px-2.5 py-1 text-xs border border-slate-200 rounded-sm bg-white text-slate-700 focus:outline-none focus:border-forest"
          >
            <option value="all">Tüm Kökenler</option>
            <option value="real_local">Gerçek Yerel Çekim</option>
            <option value="licensed_stock">Lisanslı Stok</option>
            <option value="ai_generated">Yapay Zekâ (T2V)</option>
            <option value="representative">Temsili Görsel</option>
            <option value="unverified">Doğrulanmamış</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-2.5 py-1 text-xs border border-slate-200 rounded-sm bg-white text-slate-700 focus:outline-none focus:border-forest"
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
              className="text-[11px] font-mono text-rose-600 hover:underline ml-auto"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-sm border border-slate-200 p-12 text-center space-y-3">
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

            return (
              <div
                key={item.id}
                className="bg-white rounded-sm border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden shadow-2xs group"
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

                    {/* Video Indicator */}
                    {isVideo && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-xs bg-forest-900/80 backdrop-blur-xs text-white text-[10px] font-mono flex items-center gap-1">
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>{item.dimensionsOrDuration || '00:05'}</span>
                      </div>
                    )}

                    {/* Status Badge Overlay */}
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-1.5 py-0.5 rounded-xs text-[10px] font-mono uppercase tracking-wider font-semibold ${
                          item.publicationStatus === 'published'
                            ? 'bg-emerald-600 text-white'
                            : item.publicationStatus === 'draft'
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-600 text-white'
                        }`}
                      >
                        {item.publicationStatus === 'published' ? 'Yayında' : item.publicationStatus}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                        {renderTypeLabel(item.mediaType)}
                      </span>
                      <span>•</span>
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
                    className="flex items-center gap-1 text-[11px] font-mono text-slate-500"
                    title={
                      usageCount > 0
                        ? item.relatedContentIds
                            .map((id) => contentNameMap.get(id) || id)
                            .join(', ')
                        : 'Henüz bir içeriğe bağlanmadı'
                    }
                  >
                    <Link2 className="w-3 h-3 text-copper" />
                    <span>{usageCount} İçerik</span>
                  </div>

                  {/* Edit action */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="px-2.5 py-1 rounded-sm bg-slate-100 hover:bg-forest hover:text-white text-slate-700 text-xs font-semibold transition-colors"
                  >
                    Detay & Düzenle
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-sm border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-mono uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-16">Önizleme</th>
                  <th className="py-3 px-4">Başlık & Dosya</th>
                  <th className="py-3 px-4">Tür & Köken</th>
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

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="w-12 h-9 rounded-xs overflow-hidden bg-slate-100 border border-slate-200 relative">
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
                      <td className="py-2.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 leading-snug">{item.title}</div>
                        <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                          {item.src}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="text-[11px] font-mono text-slate-600 mb-1">
                          {renderTypeLabel(item.mediaType)}
                        </div>
                        {renderOriginBadge(item.origin)}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {item.relatedContentIds.length > 0 ? (
                            item.relatedContentIds.slice(0, 2).map((cId) => (
                              <span
                                key={cId}
                                className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-xs text-[10px] font-mono truncate max-w-[120px]"
                                title={contentNameMap.get(cId) || cId}
                              >
                                {contentNameMap.get(cId) || cId}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Bağlantısız</span>
                          )}
                          {item.relatedContentIds.length > 2 && (
                            <span className="text-[10px] font-mono text-slate-500">
                              +{item.relatedContentIds.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        {item.verificationStatus === 'verified' ? (
                          <span className="text-emerald-700 font-mono text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Doğrulandı
                          </span>
                        ) : item.verificationStatus === 'simulated' ? (
                          <span className="text-amber-700 font-mono text-[11px] flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Simülasyon
                          </span>
                        ) : (
                          <span className="text-rose-700 font-mono text-[11px] flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" /> Doğrulanmadı
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <select
                          value={item.publicationStatus}
                          onChange={(e) => {
                            updateStatus(item.id, e.target.value);
                            showToast(`Yayın durumu güncellendi: ${e.target.value}`);
                          }}
                          className="text-[11px] font-mono px-2 py-0.5 rounded-xs border border-slate-200 bg-white text-slate-800"
                        >
                          <option value="published">Yayında</option>
                          <option value="draft">Taslak</option>
                          <option value="in_review">İncelemede</option>
                          <option value="archived">Arşivde</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="px-2.5 py-1 rounded-sm bg-slate-100 hover:bg-forest hover:text-white text-slate-700 text-xs font-semibold transition-colors mr-1.5"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(item)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors inline-block align-middle"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
          className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="bg-white rounded-sm border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col justify-between overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-sm bg-forest/10 flex items-center justify-center text-forest">
                  {formData.mediaType === 'video' ? (
                    <Video className="w-4 h-4 text-copper" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-copper" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    {isCreatingNew ? 'Yeni Medya Kaydı Ekle' : 'Medya Detayı & Lisans Düzenleme'}
                  </h2>
                  <p className="text-[11px] font-mono text-slate-500">
                    ID: {formData.id || 'Yeni Kayıt'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-sm hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveModal} className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Media Preview Box */}
              <div className="rounded-sm border border-slate-200 bg-slate-900 overflow-hidden relative aspect-[16/9] flex items-center justify-center">
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
                  <div className="text-slate-400 text-xs font-mono flex flex-col items-center gap-2">
                    <ImageIcon className="w-8 h-8 opacity-40" />
                    <span>Önizleme için geçerli bir medya yolu giriniz.</span>
                  </div>
                )}
              </div>

              {/* Controlled Upload Simulation Guard (Madde 5) */}
              <div className="p-3.5 rounded-sm bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Yerel Medya Seçimi & Simülasyon
                  </label>
                  <span className="text-[10px] font-mono text-copper-dark font-semibold">
                    Faz 02C-1 Prototip
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*,video/mp4"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Honest notification: do not claim physical server upload
                      const fakePath = file.type.startsWith('video')
                        ? `/videos/${file.name}`
                        : `/images/${file.name}`;
                      setFormData({
                        ...formData,
                        src: fakePath,
                        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                        title: formData.title || file.name.replace(/\.[^/.]+$/, ''),
                      });
                      alert(
                        `Dosya seçildi: "${file.name}" (${(file.size / 1024).toFixed(0)} KB).\n\nÖnemli: Bu bir frontend prototipidir. Dosyalar harici sunucuya fiziksel olarak aktarılmaz. Kalıcı render için '/public/images' veya '/public/videos' dizinindeki mevcut dosyalar veya geçerli web URL'leri kullanılır.`
                      );
                    }
                  }}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xs file:border-0 file:text-xs file:font-semibold file:bg-forest file:text-white hover:file:bg-forest-800 cursor-pointer"
                />
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
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
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
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest bg-white"
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
                    value={formData.origin || 'representative'}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest bg-white"
                  >
                    <option value="real_local">Gerçek Yerel Çekim (Saha / Kültür Arşivi)</option>
                    <option value="licensed_stock">Lisanslı Stok Medya</option>
                    <option value="ai_generated">Yapay Zekâ Üretimi (T2V / Sentetik)</option>
                    <option value="representative">Temsili Editoryal Görsel</option>
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
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
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
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
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
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
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
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
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
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
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
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
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
                    placeholder="Örn: İslahiye Dijital Platformlar Tanıtım Prototipi İzni"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
                  />
                </div>

                {/* Statuses */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Doğrulama Durumu
                  </label>
                  <select
                    value={formData.verificationStatus || 'unverified'}
                    onChange={(e) =>
                      setFormData({ ...formData, verificationStatus: e.target.value as any })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest bg-white"
                  >
                    <option value="verified">Doğrulanmış (Resmî/Doğrulanmış Kaynak)</option>
                    <option value="simulated">Temsili / Simülasyon</option>
                    <option value="unverified">Doğrulanmamış (İnceleme Gerekli)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Yayın Durumu
                  </label>
                  <select
                    value={formData.publicationStatus || 'draft'}
                    onChange={(e) =>
                      setFormData({ ...formData, publicationStatus: e.target.value as any })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest bg-white"
                  >
                    <option value="published">Yayında</option>
                    <option value="draft">Taslak</option>
                    <option value="in_review">İncelemede</option>
                    <option value="archived">Arşivde</option>
                  </select>
                </div>

                {/* Related Contents Multi-Picker */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    İlişkili İçerikler (Bu medyanın kullanıldığı yerler)
                  </label>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-sm p-2 space-y-1 bg-slate-50/50">
                    {Array.from(contentNameMap.entries()).map(([cId, cName]) => {
                      const isSelected = formData.relatedContentIds?.includes(cId);
                      return (
                        <label
                          key={cId}
                          className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xs text-xs text-slate-700 cursor-pointer"
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
                            className="rounded-xs text-forest focus:ring-forest"
                          />
                          <span className="truncate">{cName}</span>
                          <span className="text-[10px] font-mono text-slate-400 ml-auto shrink-0">
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
                {!isCreatingNew && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteCandidate(activeItem);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Medyayı Sil</span>
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setActiveItem(null)}
                    className="px-4 py-2 rounded-sm border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-sm bg-forest hover:bg-forest-800 text-white text-xs font-semibold shadow-xs"
                  >
                    {isCreatingNew ? 'Medya Kaydını Oluştur' : 'Değişiklikleri Kaydet'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-60 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">Medya Kaydını Silmek İstiyor musunuz?</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              <strong>"{deleteCandidate.title}"</strong> ({deleteCandidate.src}) kaydı kütüphaneden silinecektir.
            </p>

            {deleteCandidate.relatedContentIds.length > 0 && (
              <div className="p-3 rounded-sm bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                <strong className="block font-bold">Kullanım Uyarısı:</strong>
                <p>
                  Bu medya şu anda <strong>{deleteCandidate.relatedContentIds.length}</strong> farklı içerikte kullanılmaktadır:
                </p>
                <ul className="list-disc list-inside text-[11px] font-mono mt-1">
                  {deleteCandidate.relatedContentIds.map((cId) => (
                    <li key={cId} className="truncate">
                      {contentNameMap.get(cId) || cId}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-[11px]">
                  Silinmesi durumunda ziyaretçi arayüzünde güvenli fallback görseli görüntülenecektir.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-3 py-1.5 rounded-sm border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
                className="px-3 py-1.5 rounded-sm bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
