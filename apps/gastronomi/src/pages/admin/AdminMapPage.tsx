import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  Info,
  Move,
  Edit,
  Eye,
  Clock,
  Flame,
  UtensilsCrossed,
  Wheat,
} from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import {
  AtlasDishNode,
  GastronomyPlace,
  PublicationStatus,
} from '../../types';
import { CULTURAL_REGIONS } from '../../data/atlas';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { AdminRealMapView } from '../../components/admin/map/AdminRealMapView';
import { ActionConfirmModal } from '../../components/admin/common/ActionConfirmModal';
import { BulkActionBar } from '../../components/admin/common/BulkActionBar';
import { useAdminRole } from '../../context/AdminRoleContext';

type MapAdminTab = 'places' | 'atlas';

export const AdminMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    getPlaces,
    savePlace,
    deletePlace,
    getDishes,
    getAtlasNodes,
    saveAtlasNode,
    deleteAtlasNode,
    getCategories,
  } = useContent();

  const places = getPlaces(false);
  const allDishes = getDishes(false);
  const atlasNodes = getAtlasNodes(false);
  const placeCategories = getCategories('place', false);
  const { canCreate, canEdit, canDelete, canPublish } = useAdminRole();

  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Active Tab defaults to REAL PLACES MAP
  const paramTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<MapAdminTab>(
    paramTab === 'atlas' ? 'atlas' : 'places'
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (paramTab === 'atlas') {
      setActiveTab('atlas');
    } else {
      setActiveTab('places');
    }
  }, [paramTab]);

  const handleTabChange = (tab: MapAdminTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Dish Map helper
  const dishMap = useMemo(() => {
    const map = new Map<string, (typeof allDishes)[0]>();
    allDishes.forEach((d) => map.set(d.id, d));
    return map;
  }, [allDishes]);

  // --- PLACES MAP & TABLE STATE ---
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [placeSearch, setPlaceSearch] = useState('');
  const [selectedPlaceCategory, setSelectedPlaceCategory] = useState<string>('all');
  const [selectedPlaceStatus, setSelectedPlaceStatus] = useState<PublicationStatus | 'all'>('all');
  const [deleteCandidatePlace, setDeleteCandidatePlace] = useState<GastronomyPlace | null>(null);
  const [deleteCandidateNodeId, setDeleteCandidateNodeId] = useState<string | null>(null);

  const selectedPlace = useMemo(() => {
    if (!selectedPlaceId) return null;
    return places.find((p) => p.id === selectedPlaceId) || null;
  }, [places, selectedPlaceId]);

  // Filtered Places
  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      if (placeSearch.trim() !== '') {
        const q = placeSearch.toLocaleLowerCase('tr-TR');
        const matchesName = p.name.toLocaleLowerCase('tr-TR').includes(q);
        const matchesAddr = p.address?.toLocaleLowerCase('tr-TR').includes(q) || false;
        const matchesDesc = p.description?.toLocaleLowerCase('tr-TR').includes(q) || false;
        const matchesDist = p.districtOrNeighborhood?.toLocaleLowerCase('tr-TR').includes(q) || false;
        if (!matchesName && !matchesAddr && !matchesDesc && !matchesDist) return false;
      }
      if (selectedPlaceCategory !== 'all' && p.category !== selectedPlaceCategory) {
        return false;
      }
      if (selectedPlaceStatus !== 'all' && p.publicationStatus !== selectedPlaceStatus) {
        return false;
      }
      return true;
    });
  }, [places, placeSearch, selectedPlaceCategory, selectedPlaceStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = places.length;
    const published = places.filter((p) => p.publicationStatus === 'published').length;
    const bakeries = places.filter((p) => p.category === 'bakery' || p.category === 'oven').length;
    const restaurants = places.filter((p) => p.category === 'restaurant').length;
    const producers = places.filter((p) => p.category === 'producer' || p.category === 'cooperative').length;
    return { total, published, bakeries, restaurants, producers };
  }, [places]);

  // Toggle publish / unpublish
  const handleTogglePublish = (place: GastronomyPlace) => {
    if (!canPublish) {
      showToast('Yayın durumu değiştirmek için Yayın Sorumlusu veya Yönetici yetkisi gerekir.');
      return;
    }
    const nextStatus: PublicationStatus = place.publicationStatus === 'published' ? 'draft' : 'published';
    const updated: GastronomyPlace = {
      ...place,
      publicationStatus: nextStatus,
    };
    const ok = savePlace(updated);
    if (!ok) {
      showToast('Değişiklik kaydedilemedi.');
      return;
    }
    showToast(
      nextStatus === 'published'
        ? `"${place.name}" yayımlandı.`
        : `"${place.name}" taslağa alındı.`
    );
  };

  // Confirm delete place
  const handleConfirmDelete = () => {
    if (!deleteCandidatePlace) return;
    deletePlace(deleteCandidatePlace.id);
    if (selectedPlaceId === deleteCandidatePlace.id) {
      setSelectedPlaceId(null);
    }
    showToast(`"${deleteCandidatePlace.name}" ziyaret noktası silindi.`);
    setDeleteCandidatePlace(null);
  };

  // Confirm delete atlas dish node
  const handleConfirmDeleteNode = () => {
    if (!deleteCandidateNodeId) return;
    deleteAtlasNode(deleteCandidateNodeId);
    showToast('Atlas düğümü başarıyla kaldırıldı.');
    setDeleteCandidateNodeId(null);
  };

  // Bulk Selection Handlers for Places
  const selectedInViewCount = useMemo(
    () => filteredPlaces.filter((p) => selectedPlaceIds.includes(p.id)).length,
    [filteredPlaces, selectedPlaceIds]
  );

  const handleToggleSelectPlace = (id: string) => {
    setSelectedPlaceIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllPlaces = () => {
    if (filteredPlaces.length === 0) return;
    const filteredIds = filteredPlaces.map((p) => p.id);
    if (selectedInViewCount === filteredPlaces.length) {
      const filteredSet = new Set(filteredIds);
      setSelectedPlaceIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      setSelectedPlaceIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleBulkPublishPlaces = () => {
    if (!canPublish) return;
    selectedPlaceIds.forEach((id) => {
      const place = places.find((p) => p.id === id);
      if (place) {
        savePlace({ ...place, publicationStatus: 'published' });
      }
    });
    showToast(`${selectedPlaceIds.length} ziyaret noktası yayına alındı.`);
    setSelectedPlaceIds([]);
  };

  const handleBulkDraftPlaces = () => {
    if (!canPublish) return;
    selectedPlaceIds.forEach((id) => {
      const place = places.find((p) => p.id === id);
      if (place) {
        savePlace({ ...place, publicationStatus: 'draft' });
      }
    });
    showToast(`${selectedPlaceIds.length} ziyaret noktası taslak durumuna çekildi.`);
    setSelectedPlaceIds([]);
  };

  const handleBulkDeletePlacesConfirm = () => {
    if (!canDelete) return;
    selectedPlaceIds.forEach((id) => {
      deletePlace(id);
    });
    showToast(`${selectedPlaceIds.length} ziyaret noktası silindi.`);
    setSelectedPlaceIds([]);
    setIsBulkDeleteModalOpen(false);
  };

  // Add new place at clicked coordinate
  const handleNewPlaceAtCoords = (lat: number, lng: number) => {
    if (!canCreate) {
      showToast('Aktif rolünüzle yeni ziyaret noktası eklenemez.');
      return;
    }
    navigate(`/yonetim/harita/noktalar/yeni?lat=${lat}&lng=${lng}`);
  };

  // Map scroll anchor
  const mapSectionRef = useRef<HTMLDivElement | null>(null);
  const handleFocusOnMap = (place: GastronomyPlace) => {
    setSelectedPlaceId(place.id);
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // --- ATLAS TAB STATE ---
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    atlasNodes[0]?.id || (atlasNodes[0]?.dishId ? `node-${atlasNodes[0].dishId}` : null)
  );
  const [nodeFormData, setNodeFormData] = useState<Partial<AtlasDishNode>>({});
  const [isAddingNewNode, setIsAddingNewNode] = useState(false);

  const activeNode = useMemo(() => {
    if (!selectedNodeId) return atlasNodes[0] || null;
    return (
      atlasNodes.find((n) => n.id === selectedNodeId || n.dishId === selectedNodeId) ||
      atlasNodes[0] ||
      null
    );
  }, [selectedNodeId, atlasNodes]);

  useEffect(() => {
    if (activeNode && !isAddingNewNode) {
      setNodeFormData({ ...activeNode });
    }
  }, [activeNode, isAddingNewNode]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAddingNewNode ? !canCreate : !canEdit) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    const clampedX = Math.max(5, Math.min(95, x));
    const clampedY = Math.max(5, Math.min(95, y));

    setNodeFormData((prev) => ({
      ...prev,
      canvasPosition: { x: clampedX, y: clampedY },
    }));
  };

  const handleSaveNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingNewNode ? !canCreate : !canEdit) {
      showToast('Bu işlem için oluşturma veya düzenleme yetkiniz bulunmamaktadır.');
      return;
    }
    if (!nodeFormData.dishId) {
      showToast('Lütfen geçerli bir yemek seçiniz.');
      return;
    }

    const dish = dishMap.get(nodeFormData.dishId);
    const nodeToSave: AtlasDishNode = {
      id: nodeFormData.id || `node-${nodeFormData.dishId}`,
      dishId: nodeFormData.dishId,
      regionId: nodeFormData.regionId || 'tarihi-tascarsi',
      canvasPosition: nodeFormData.canvasPosition || { x: 50, y: 50 },
      accentNote: nodeFormData.accentNote || dish?.tagline || '',
      shortIntro: nodeFormData.shortIntro || dish?.description || '',
      imageUrl: nodeFormData.imageUrl || dish?.imageUrl || '',
      isVisible: nodeFormData.isVisible !== false,
      publicationStatus: nodeFormData.publicationStatus || 'published',
      verificationStatus: nodeFormData.verificationStatus || 'verified',
      contentOrigin: 'editorial_narrative',
      updatedAt: new Date().toISOString(),
    };

    const ok = saveAtlasNode(nodeToSave);
    if (!ok) {
      showToast('Atlas düğümü kaydedilemedi.');
      return;
    }
    setIsAddingNewNode(false);
    setSelectedNodeId(nodeToSave.id || `node-${nodeToSave.dishId}`);
    showToast(isAddingNewNode ? 'Yeni atlas düğümü eklendi.' : 'Atlas konumu güncellendi.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
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
            İslahiye Gastronomi Haritası &amp; Ziyaret Noktaları
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed font-sans">
            İslahiye ilçe sınırları içerisindeki doğrulanmış taş fırınlar, lezzet lokantaları ve yerel üretim noktalarının gerçek coğrafi harita yönetimi.
          </p>
        </div>

        {/* Tab Switcher & Action Button (Aligned on single row) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <div className="inline-flex items-center border border-slate-200 rounded-xl p-1 bg-slate-100">
            <button
              type="button"
              onClick={() => handleTabChange('places')}
              className={`h-8 px-3.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'places'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Gerçek Harita ({places.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('atlas')}
              className={`h-8 px-3.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'atlas'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-emerald-700" />
              <span>Kültürel Atlas ({atlasNodes.length})</span>
            </button>
          </div>

          {canCreate ? (
            <Link
              to="/yonetim/harita/noktalar/yeni"
              className="h-9 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition-colors inline-flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Ziyaret Noktası</span>
            </Link>
          ) : (
            <div
              className="h-9 px-3.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-medium cursor-not-allowed border border-slate-200 inline-flex items-center justify-center shrink-0"
              title="İncelemeci rolünde yeni nokta eklenemez."
            >
              <span>Yeni Nokta (Kısıtlı)</span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: GERÇEK HARİTA & ZİYARET NOKTALARI (VARSAYILAN AKTİF SEKMEYİ OLUŞTURUR) */}
      {/* ========================================================================= */}
      {activeTab === 'places' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar with Visual Category Icons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-sans">
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-start justify-between">
              <div>
                <div className="text-[11px] font-sans uppercase text-slate-500 font-semibold tracking-wider">
                  Toplam Ziyaret Noktası
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
                <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                  {stats.published} Nokta Canlı Yayında
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <MapPin className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-start justify-between">
              <div>
                <div className="text-[11px] font-sans uppercase text-amber-800 font-semibold tracking-wider">
                  Taş Fırın &amp; Ocaklar
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{stats.bakeries}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Meşe odunlu fırın durakları</div>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                <Flame className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-start justify-between">
              <div>
                <div className="text-[11px] font-sans uppercase text-emerald-800 font-semibold tracking-wider">
                  Restoran &amp; Lokantalar
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{stats.restaurants}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Yöresel yemek mutfakları</div>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-start justify-between">
              <div>
                <div className="text-[11px] font-sans uppercase text-sky-800 font-semibold tracking-wider">
                  Üretici &amp; Kooperatif
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{stats.producers}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Biber ve tarımsal havzalar</div>
              </div>
              <div className="p-2.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
                <Wheat className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Interactive Map Filter & Search Toolbar */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="İşletme adı, mahalle veya cadde ile filtrele..."
                value={placeSearch}
                onChange={(e) => setPlaceSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
              />
            </div>

            {/* Category Filter Pills & Status Select */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {[
                { id: 'all', label: 'Tüm Noktalar' },
                ...placeCategories.map((c) => ({
                  id: c.id,
                  label: c.shortLabel || c.label,
                })),
              ].map((cat) => {
                const isActive = selectedPlaceCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedPlaceCategory(cat.id)}
                    className={`h-10 px-4 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-2xs font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}

              <select
                value={selectedPlaceStatus}
                onChange={(e) => setSelectedPlaceStatus(e.target.value as any)}
                className="h-10 px-3 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer"
              >
                <option value="all">Tüm Yayın Durumları</option>
                <option value="published">Yayında Olanlar</option>
                <option value="draft">Taslak Kayıtlar</option>
                <option value="in_review">İncelemede Olanlar</option>
                <option value="archived">Arşivlenenler</option>
              </select>
            </div>
          </div>

          {/* Real Leaflet Map Container */}
          <div ref={mapSectionRef} className="space-y-4">
            <AdminRealMapView
              places={filteredPlaces}
              selectedPlaceId={selectedPlaceId}
              onSelectPlace={(p) => setSelectedPlaceId(p ? p.id : null)}
              onNewPlaceAtCoords={handleNewPlaceAtCoords}
            />

            {/* Selected Place Inspector Drawer (Appears right under map if a place is selected) */}
            {selectedPlace && (
              <div className="bg-white p-5 rounded-xl border border-emerald-200/90 shadow-2xs animate-fade-in flex flex-col md:flex-row items-start justify-between gap-5">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {selectedPlace.coverImage && (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                      <ImageWithFallback
                        src={selectedPlace.coverImage}
                        alt={selectedPlace.name}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5 font-sans">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-sans font-bold uppercase border border-emerald-200">
                        {selectedPlace.categoryLabel || selectedPlace.category}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[11px] font-sans font-bold uppercase ${
                          selectedPlace.publicationStatus === 'published'
                            ? 'bg-emerald-100 text-emerald-800'
                            : selectedPlace.publicationStatus === 'in_review'
                            ? 'bg-sky-100 text-sky-800'
                            : selectedPlace.publicationStatus === 'archived'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {selectedPlace.publicationStatus === 'published'
                          ? 'Yayında'
                          : selectedPlace.publicationStatus === 'in_review'
                          ? 'İncelemede'
                          : selectedPlace.publicationStatus === 'archived'
                          ? 'Arşivde'
                          : 'Taslak'}
                      </span>
                      <span className="text-xs font-sans text-slate-500 tabular-nums">
                        GPS: {selectedPlace.coordinates?.lat}, {selectedPlace.coordinates?.lng}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{selectedPlace.name}</h3>

                    <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                      {selectedPlace.description || selectedPlace.address}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-sans pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedPlace.address}</span>
                      </span>
                      {selectedPlace.visitingHours && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedPlace.visitingHours}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions for Selected Place */}
                <div className="flex flex-wrap md:flex-col items-center gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5">
                  {canEdit && (
                    <Link
                      to={`/yonetim/harita/noktalar/${selectedPlace.id}/duzenle`}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-semibold shadow-2xs transition-all inline-flex items-center justify-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Düzenle</span>
                    </Link>
                  )}

                  {canPublish && (
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(selectedPlace)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 text-xs font-semibold shadow-2xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>{selectedPlace.publicationStatus === 'published' ? 'Taslağa Al' : 'Yayımla'}</span>
                    </button>
                  )}

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleteCandidatePlace(selectedPlace)}
                      className="w-full sm:w-auto p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all inline-flex items-center justify-center cursor-pointer"
                      title="Noktayı Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedPlaceId(null)}
                    className="w-full sm:w-auto text-[11px] text-slate-400 hover:text-slate-600 underline pt-1 cursor-pointer"
                  >
                    Detayı Kapat
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Action Bar for Places */}
          <BulkActionBar
            selectedCount={selectedPlaceIds.length}
            totalCount={filteredPlaces.length}
            onClearSelection={() => setSelectedPlaceIds([])}
            onBulkPublish={handleBulkPublishPlaces}
            onBulkDraft={handleBulkDraftPlaces}
            onBulkDelete={() => setIsBulkDeleteModalOpen(true)}
            canDelete={canDelete}
            canPublish={canPublish}
          />

          {/* Places Envanteri Data Table */}
          <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  İslahiye Ziyaret Noktaları Envanteri
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Haritada filtrelenen <strong className="text-slate-900 font-bold">{filteredPlaces.length}</strong> kayıt listeleniyor
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-sans text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Resmî Saha Doğrulaması</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 font-sans">
                <thead className="bg-slate-50/80 text-[11px] font-sans font-semibold uppercase text-slate-500 border-b border-slate-200 tracking-wider">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredPlaces.length > 0 && selectedInViewCount === filteredPlaces.length}
                        ref={(el) => {
                          if (el) {
                            el.indeterminate =
                              selectedInViewCount > 0 && selectedInViewCount < filteredPlaces.length;
                          }
                        }}
                        onChange={handleSelectAllPlaces}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer"
                        title="Tümünü Seç / Kaldır"
                      />
                    </th>
                    <th className="py-3 px-4 w-16 text-center">Görsel</th>
                    <th className="py-3 px-4 min-w-[190px]">İşletme Adı &amp; Mahalle</th>
                    <th className="py-3 px-4 w-40 whitespace-nowrap">Kategori</th>
                    <th className="py-3 px-4 min-w-[200px]">Açık Adres</th>
                    <th className="py-3 px-4 w-44 whitespace-nowrap">GPS Koordinatları</th>
                    <th className="py-3 px-4 w-32 whitespace-nowrap">Doğrulama</th>
                    <th className="py-3 px-4 w-28 whitespace-nowrap">Yayın</th>
                    <th className="py-3 px-4 w-44 text-right whitespace-nowrap">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPlaces.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
                        Arama kriterlerine uygun ziyaret noktası bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredPlaces.map((place) => {
                      const isSelected = selectedPlaceIds.includes(place.id) || place.id === selectedPlaceId;
                      const isChecked = selectedPlaceIds.includes(place.id);
                      return (
                        <tr
                          key={place.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50/70'
                          }`}
                        >
                          <td className="py-2.5 px-3 w-10 text-center align-middle">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelectPlace(place.id)}
                              className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer"
                              title="Bu noktayı seç"
                            />
                          </td>
                          <td className="py-2.5 px-4 w-16 align-middle text-center">
                            <div className="w-11 h-11 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 mx-auto shadow-2xs">
                              {place.coverImage ? (
                                <ImageWithFallback
                                  src={place.coverImage}
                                  alt={place.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600">
                                  <MapPin className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-4 min-w-[190px] align-middle">
                            <div className="font-bold text-slate-900 leading-snug text-xs sm:text-[13px]">{place.name}</div>
                            <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                              {place.districtOrNeighborhood || 'İslahiye Merkez'}
                            </div>
                          </td>
                          <td className="py-2.5 px-4 w-40 align-middle whitespace-nowrap">
                            <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                              {place.categoryLabel || place.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 min-w-[200px] max-w-xs align-middle text-slate-600 text-xs">
                            <span className="line-clamp-2">{place.address}</span>
                          </td>
                          <td className="py-2.5 px-4 w-44 align-middle whitespace-nowrap font-sans text-xs">
                            {place.coordinates ? (
                              <button
                                type="button"
                                onClick={() => handleFocusOnMap(place)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-slate-600 transition-colors"
                                title="Haritada Odaklan"
                              >
                                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{place.coordinates.lat.toFixed(4)}, {place.coordinates.lng.toFixed(4)}</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">Koordinatsız</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 w-32 align-middle whitespace-nowrap">
                            {place.verificationStatus === 'verified' ? (
                              <span className="text-emerald-700 font-sans text-xs flex items-center gap-1.5 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Doğrulandı</span>
                              </span>
                            ) : place.verificationStatus === 'pending_verification' ? (
                              <span className="text-amber-700 font-sans text-xs flex items-center gap-1.5 font-semibold">
                                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>Bekliyor</span>
                              </span>
                            ) : (
                              <span className="text-sky-700 font-sans text-xs flex items-center gap-1.5 font-semibold">
                                <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                <span>İnceleniyor</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 w-28 align-middle whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase ${
                                place.publicationStatus === 'published'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : place.publicationStatus === 'in_review'
                                  ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                  : place.publicationStatus === 'archived'
                                  ? 'bg-slate-200 text-slate-700 border border-slate-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {place.publicationStatus === 'published'
                                ? 'Yayında'
                                : place.publicationStatus === 'in_review'
                                ? 'İncelemede'
                                : place.publicationStatus === 'archived'
                                ? 'Arşivde'
                                : 'Taslak'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 w-44 align-middle text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleFocusOnMap(place)}
                                className="h-8 px-2.5 rounded-lg bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-semibold transition-all inline-flex items-center gap-1 shadow-2xs"
                                title="Haritada Odaklan"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>Göster</span>
                              </button>
                              {canEdit && (
                                <Link
                                  to={`/yonetim/harita/noktalar/${place.id}/duzenle`}
                                  className="h-8 px-2.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-700 hover:text-white border border-emerald-200 text-xs font-semibold transition-all inline-flex items-center gap-1 shadow-2xs"
                                  title="Düzenle"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>Düzenle</span>
                                </Link>
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteCandidatePlace(place)}
                                  className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all inline-flex items-center justify-center cursor-pointer"
                                  title="Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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
      {/* SECTION B: KÜLTÜREL ATLAS (SEMBOLİK GÖRSEL DÜZENLEYİCİ)                    */}
      {/* ========================================================================= */}
      {activeTab === 'atlas' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs font-sans flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block mb-0.5 font-bold">Kültürel Atlas Sanatsal Keşif Yüzeyi:</strong>
              Kültürel Lezzet Atlası sembolik bir keşif yüzeyidir. Buradaki X/Y değerleri (yüzde 0–100) sanatsal çizim üzerindeki görsel konumu belirler.
              Fiziksel GPS noktaları için "Gerçek Harita" sekmesini kullanınız.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Visual Canvas (8 cols) */}
            <div className="lg:col-span-7 xl:col-span-8 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-sans font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Görsel Kültürel Atlas Tuvali</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Düğüm konumlandırmak için haritaya tıklayın veya sağdaki formdan koordinat girin.
                  </p>
                </div>

                <span className="text-[11px] font-sans font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                  Tuval: 1000 x 600 (% Yüzdesel)
                </span>
              </div>

              <div
                onClick={handleCanvasClick}
                className="relative w-full aspect-[16/10] bg-[#F7F3EB] rounded-xl border border-slate-200 overflow-hidden select-none shadow-inner cursor-crosshair group"
              >
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 1000 600"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <rect width="1000" height="600" fill="#F7F3EB" />
                  <path
                    d="M 10 40 C 80 80, 150 100, 230 70 S 300 170, 250 250 S 170 350, 210 470 S 130 550, 70 600"
                    fill="none"
                    stroke="#203B31"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                    strokeOpacity="0.18"
                  />
                  <path
                    d="M 330 0 Q 370 170 450 270 T 530 450 T 490 600"
                    fill="none"
                    stroke="#BA855E"
                    strokeWidth="1.2"
                    strokeOpacity="0.2"
                    strokeDasharray="5 3"
                  />
                </svg>

                {CULTURAL_REGIONS.map((region) => (
                  <div
                    key={region.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none text-center"
                    style={{
                      left: `${region.positionPercent.x}%`,
                      top: `${region.positionPercent.y}%`,
                    }}
                  >
                    <span className="text-[10px] font-sans tracking-wider uppercase text-emerald-800 font-bold block">
                      {region.terrainBadge}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {region.name}
                    </span>
                  </div>
                ))}

                {atlasNodes.map((node) => {
                  const dish = dishMap.get(node.dishId);
                  if (!dish) return null;
                  const isSelected = (node.id || `node-${node.dishId}`) === selectedNodeId;

                  return (
                    <button
                      type="button"
                      key={node.id || node.dishId}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAddingNewNode(false);
                        setSelectedNodeId(node.id || `node-${node.dishId}`);
                      }}
                      aria-label={`${dish.name} düğümünü seç`}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all ${
                        node.isVisible === false ? 'opacity-40 grayscale' : 'opacity-100'
                      }`}
                      style={{
                        left: `${node.canvasPosition.x}%`,
                        top: `${node.canvasPosition.y}%`,
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={`relative w-10 h-10 rounded-full overflow-hidden border-2 transition-transform shadow-xs ${
                            isSelected
                              ? 'border-emerald-600 ring-2 ring-emerald-300 scale-110 shadow-md'
                              : 'border-white hover:border-emerald-500 hover:scale-105'
                          }`}
                        >
                          <ImageWithFallback
                            src={node.imageUrl || dish.imageUrl}
                            alt={dish.name}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div
                          className={`mt-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap shadow-2xs border ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-800 border-slate-200'
                          }`}
                        >
                          {dish.name}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-xs font-sans text-slate-500 font-medium">
                  Toplam {atlasNodes.length} Atlas Düğümü
                </span>
                {canCreate && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewNode(true);
                      setSelectedNodeId(null);
                      setNodeFormData({
                        id: `node-${Date.now()}`,
                        dishId: allDishes[0]?.id || '',
                        regionId: 'tarihi-tascarsi',
                        canvasPosition: { x: 50, y: 50 },
                        accentNote: '',
                        isVisible: true,
                        publicationStatus: 'published',
                      });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Yeni Atlas Düğümü Ekle</span>
                  </button>
                )}
              </div>
            </div>

            {/* Node Form & Details (4 cols) */}
            <div className="lg:col-span-5 xl:col-span-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {isAddingNewNode ? 'Yeni Atlas Düğümü' : 'Düğüm Konumu & Ayarları'}
                </h3>
              </div>

              <form onSubmit={handleSaveNode} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    İlişkili Yemek <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={nodeFormData.dishId || ''}
                    onChange={(e) => {
                      const dId = e.target.value;
                      const selectedDish = dishMap.get(dId);
                      setNodeFormData((prev) => ({
                        ...prev,
                        dishId: dId,
                        accentNote: prev.accentNote || selectedDish?.tagline || '',
                        imageUrl: selectedDish?.imageUrl || prev.imageUrl,
                      }));
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="">Yemek Seçiniz...</option>
                    {allDishes.map((dish) => (
                      <option key={dish.id} value={dish.id}>
                        {dish.name} ({dish.categoryLabel})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <span className="font-bold text-slate-800 text-[11px] font-sans uppercase block">
                    Tuval Yüzde Konumu (X / Y)
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        X (%)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="95"
                        required
                        value={nodeFormData.canvasPosition?.x ?? 50}
                        onChange={(e) =>
                          setNodeFormData((prev) => ({
                            ...prev,
                            canvasPosition: {
                              x: Number(e.target.value),
                              y: prev.canvasPosition?.y ?? 50,
                            },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-sans border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Y (%)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="95"
                        required
                        value={nodeFormData.canvasPosition?.y ?? 50}
                        onChange={(e) =>
                          setNodeFormData((prev) => ({
                            ...prev,
                            canvasPosition: {
                              x: prev.canvasPosition?.x ?? 50,
                              y: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-sans border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vurgulu Mutfak Notu / Tagline
                  </label>
                  <input
                    type="text"
                    value={nodeFormData.accentNote || ''}
                    onChange={(e) => setNodeFormData({ ...nodeFormData, accentNote: e.target.value })}
                    placeholder="Örn: Meşe odununda demlenen kadim lezzet."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {!isAddingNewNode && nodeFormData.dishId && canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleteCandidateNodeId(nodeFormData.id || nodeFormData.dishId || '')}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Düğümü Kaldır"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    {isAddingNewNode && (
                      <button
                        type="button"
                        onClick={() => setIsAddingNewNode(false)}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                      >
                        Vazgeç
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isAddingNewNode ? !canCreate : !canEdit}
                      className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      {isAddingNewNode ? 'Düğümü Ekle' : 'Konumu Kaydet'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Places */}
      <ActionConfirmModal
        isOpen={Boolean(deleteCandidatePlace)}
        onClose={() => setDeleteCandidatePlace(null)}
        onConfirm={handleConfirmDelete}
        title="Ziyaret Noktasını Sil"
        message={`"${deleteCandidatePlace?.name}" işletmesi gastronomi haritası envanterinden silinecektir. Bu işlem geri alınamaz.`}
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        variant="danger"
      />

      {/* Bulk Delete Confirmation Modal for Places */}
      <ActionConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDeletePlacesConfirm}
        title="Toplu Ziyaret Noktası Sil"
        message={`Seçtiğiniz ${selectedPlaceIds.length} adet ziyaret noktasını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText={`Evet, ${selectedPlaceIds.length} Noktayı Sil`}
        cancelText="Vazgeç"
        variant="danger"
      />

      {/* Delete Confirmation Modal for Atlas Node */}
      <ActionConfirmModal
        isOpen={Boolean(deleteCandidateNodeId)}
        onClose={() => setDeleteCandidateNodeId(null)}
        onConfirm={handleConfirmDeleteNode}
        title="Atlas Düğümünü Kaldır"
        message="Bu lezzete ait kültürel atlas düğümü tuvalden kaldırılacaktır. Yemek kaydının kendisi silinmez."
        confirmText="Evet, Düğümü Kaldır"
        cancelText="Vazgeç"
        variant="danger"
      />
    </div>
  );
};
