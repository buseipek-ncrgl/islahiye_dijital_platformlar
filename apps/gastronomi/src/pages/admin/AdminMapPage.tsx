import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Move,
  ShieldCheck,
} from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import {
  AtlasDishNode,
  GastronomyPlace,
  PlaceCategory,
  PublicationStatus,
} from '../../types';
import { CULTURAL_REGIONS } from '../../data/atlas';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';

type MapAdminTab = 'atlas' | 'places';

export const AdminMapPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    getAtlasNodes,
    saveAtlasNode,
    deleteAtlasNode,
    getPlaces,
    deletePlace,
    getDishes,
  } = useContent();

  const atlasNodes = getAtlasNodes(false);
  const places = getPlaces(false);
  const allDishes = getDishes(false);

  // Active Tab synchronized with ?tab= param
  const paramTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<MapAdminTab>(paramTab === 'places' ? 'places' : 'atlas');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (paramTab === 'places' || paramTab === 'atlas') {
      setActiveTab(paramTab);
    }
  }, [paramTab]);

  const handleTabChange = (tab: MapAdminTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // --- ATLAS EDITOR STATE ---
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    atlasNodes[0]?.id || (atlasNodes[0]?.dishId ? `node-${atlasNodes[0].dishId}` : null)
  );
  const [nodeFormData, setNodeFormData] = useState<Partial<AtlasDishNode>>({});
  const [isAddingNewNode, setIsAddingNewNode] = useState(false);

  // --- PLACES FILTER STATE ---
  const [placeSearch, setPlaceSearch] = useState('');
  const [selectedPlaceCategory, setSelectedPlaceCategory] = useState<PlaceCategory | 'all'>('all');
  const [selectedPlaceStatus, setSelectedPlaceStatus] = useState<PublicationStatus | 'all'>('all');
  const [deleteCandidatePlace, setDeleteCandidatePlace] = useState<GastronomyPlace | null>(null);

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

  // Selected Node in Atlas
  const activeNode = useMemo(() => {
    if (!selectedNodeId) return atlasNodes[0] || null;
    return (
      atlasNodes.find((n) => n.id === selectedNodeId || n.dishId === selectedNodeId) ||
      atlasNodes[0] ||
      null
    );
  }, [selectedNodeId, atlasNodes]);

  // Sync node form when selection changes
  React.useEffect(() => {
    if (activeNode && !isAddingNewNode) {
      setNodeFormData({ ...activeNode });
    }
  }, [activeNode, isAddingNewNode]);

  // --- COLLISION DETECTION ALGORITHM ---
  // Calculates distance between all visible nodes on the 0-100% canvas.
  // Threshold: if distance < 8.5%, flag collision.
  const collisions = useMemo(() => {
    const collidingPairs: { nodeA: AtlasDishNode; nodeB: AtlasDishNode; distance: number }[] = [];
    const threshold = 8.5;

    for (let i = 0; i < atlasNodes.length; i++) {
      for (let j = i + 1; j < atlasNodes.length; j++) {
        const a = atlasNodes[i];
        const b = atlasNodes[j];
        if (a.isVisible === false || b.isVisible === false) continue;

        const dx = a.canvasPosition.x - b.canvasPosition.x;
        const dy = a.canvasPosition.y - b.canvasPosition.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < threshold) {
          collidingPairs.push({ nodeA: a, nodeB: b, distance: dist });
        }
      }
    }
    return collidingPairs;
  }, [atlasNodes]);

  // Canvas Click / Reposition Handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    // Keep within safe canvas margins (5% to 95%)
    const clampedX = Math.max(5, Math.min(95, x));
    const clampedY = Math.max(5, Math.min(95, y));

    setNodeFormData((prev) => ({
      ...prev,
      canvasPosition: { x: clampedX, y: clampedY },
    }));
  };

  // Save Node Changes
  const handleSaveNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeFormData.dishId) {
      alert('Lütfen geçerli bir yemek seçiniz.');
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

    saveAtlasNode(nodeToSave);
    setIsAddingNewNode(false);
    setSelectedNodeId(nodeToSave.id || `node-${nodeToSave.dishId}`);
    showToast(isAddingNewNode ? 'Yeni atlas düğümü eklendi.' : 'Atlas konumu ve bilgileri güncellendi.');
  };

  // Safe Position Recommender (Auto-resolve overlap)
  const handleAutoResolveCollision = (_nodeAId: string, nodeBId: string) => {
    const targetNode = atlasNodes.find((n) => n.id === nodeBId || n.dishId === nodeBId);
    if (!targetNode) return;

    // Shift Y or X safely away from nodeA
    const newY = targetNode.canvasPosition.y >= 50 ? targetNode.canvasPosition.y - 12 : targetNode.canvasPosition.y + 12;
    const resolved: AtlasDishNode = {
      ...targetNode,
      canvasPosition: {
        x: targetNode.canvasPosition.x,
        y: Math.max(8, Math.min(90, newY)),
      },
    };
    saveAtlasNode(resolved);
    showToast(`Düğüm ayrıştırıldı: ${dishMap.get(targetNode.dishId)?.name || targetNode.dishId}`);
  };

  // Filtered Places
  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      if (placeSearch.trim() !== '') {
        const q = placeSearch.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesAddr = p.address?.toLowerCase().includes(q) || false;
        const matchesDesc = p.description?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesAddr && !matchesDesc) return false;
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
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
              ÇİFT KATMANLI HARİTA MİMARİSİ
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Gastronomi Haritası & Atlas Yönetimi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Kültürel Lezzet Atlası’nın sembolik sanatsal konumlarını ve doğrulanmış fiziksel ziyaret noktalarını tek merkezden yönetin.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border border-slate-200 rounded-sm p-1 bg-slate-50 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => handleTabChange('atlas')}
            className={`px-4 py-2 rounded-xs text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'atlas'
                ? 'bg-white text-forest shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4 text-copper" />
            <span>Kültürel Atlas Yönetimi ({atlasNodes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('places')}
            className={`px-4 py-2 rounded-xs text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'places'
                ? 'bg-white text-forest shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4 text-copper" />
            <span>Gerçek Ziyaret Noktaları ({places.length})</span>
          </button>
        </div>
      </div>

      {/* SECTION A: KÜLTÜREL ATLAS YÖNETİMİ */}
      {activeTab === 'atlas' && (
        <div className="space-y-6">
          {/* Institutional Accuracy Notice */}
          <div className="p-4 rounded-sm bg-amber-50/70 border border-amber-200 text-amber-900 text-xs font-sans flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block mb-0.5 font-bold">Kültürel Atlas Konum İlkesi:</strong>
              Kültürel Lezzet Atlası sembolik bir keşif yüzeyidir. Buradaki X/Y değerleri (yüzde 0–100) gerçek GPS koordinatı değildir.
              Yemek noktaları geçerli yemek deposuna bağlıdır. Yapılan konum değişiklikleri anında ziyaretçinin `/lezzet-haritasi` sayfasına yansır.
            </div>
          </div>

          {/* Collision Warning Banner */}
          {collisions.length > 0 && (
            <div className="p-4 rounded-sm bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Düğüm Çakışması Tespit Edildi ({collisions.length} Çakışma)</span>
              </div>
              <p className="text-[11px] text-rose-700 font-sans leading-relaxed">
                Aşağıdaki yemek düğümleri atlas tuvalinde birbirine çok yakın konumlandırılmıştır.
                Özellikle mobil keşifte metinlerin üst üste binmemesi için konumları ayrıştırınız:
              </p>
              <div className="space-y-1.5 pt-1">
                {collisions.map((c, idx) => {
                  const dishA = dishMap.get(c.nodeA.dishId)?.name || c.nodeA.dishId;
                  const dishB = dishMap.get(c.nodeB.dishId)?.name || c.nodeB.dishId;
                  return (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xs bg-white/70 border border-rose-200 text-[11px] font-mono"
                    >
                      <span>
                        <strong>{dishA}</strong> (%{c.nodeA.canvasPosition.x}, %{c.nodeA.canvasPosition.y}) ↔{' '}
                        <strong>{dishB}</strong> (%{c.nodeB.canvasPosition.x}, %{c.nodeB.canvasPosition.y})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleAutoResolveCollision(
                            c.nodeA.id || c.nodeA.dishId,
                            c.nodeB.id || c.nodeB.dishId
                          )
                        }
                        className="px-2 py-0.5 rounded-xs bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-sans font-semibold transition-colors"
                      >
                        Otomatik Ayrıştır (+%12)
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Visual Canvas & Node Editor Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Visual Canvas (8 cols) */}
            <div className="lg:col-span-7 xl:col-span-8 bg-white p-4 rounded-sm border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-copper" />
                    <span>Etkileşimli Görsel Atlas Tuvali</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Seçili düğümü taşımak için haritaya tıklayın veya sağdaki sayısal koordinatları girin.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-slate-100 text-slate-600 border border-slate-200">
                    Tuval: 1000 x 600 (% Yüzdesel)
                  </span>
                </div>
              </div>

              {/* The Visual Illustrative Map */}
              <div
                onClick={handleCanvasClick}
                className="relative w-full aspect-[16/10] bg-[#F7F3EB] rounded-sm border border-sand/70 overflow-hidden select-none shadow-inner cursor-crosshair group"
              >
                {/* SVG Artistic Topographic Background */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 1000 600"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <defs>
                    <linearGradient id="adminMapWash" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#F5EFE4" />
                      <stop offset="50%" stopColor="#F7F3EB" />
                      <stop offset="100%" stopColor="#EFE8D8" />
                    </linearGradient>
                  </defs>
                  <rect width="1000" height="600" fill="url(#adminMapWash)" />
                  {/* Contour Curves */}
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

                {/* Thematic Region Labels */}
                {CULTURAL_REGIONS.map((region) => (
                  <div
                    key={region.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none text-center"
                    style={{
                      left: `${region.positionPercent.x}%`,
                      top: `${region.positionPercent.y}%`,
                    }}
                  >
                    <span className="text-[9px] font-mono tracking-widest uppercase text-forest/40 font-semibold block">
                      {region.terrainBadge}
                    </span>
                    <span className="text-[11px] font-display font-bold text-forest/45">
                      {region.name}
                    </span>
                  </div>
                ))}

                {/* Active Editable Target Crosshair */}
                {nodeFormData.canvasPosition && (
                  <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 transition-all duration-150"
                    style={{
                      left: `${nodeFormData.canvasPosition.x}%`,
                      top: `${nodeFormData.canvasPosition.y}%`,
                    }}
                  >
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-copper animate-spin-slow opacity-80" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-copper" />
                  </div>
                )}

                {/* Nodes rendered on Canvas */}
                {atlasNodes.map((node) => {
                  const dish = dishMap.get(node.dishId);
                  if (!dish) return null;
                  const isSelected = (node.id || `node-${node.dishId}`) === selectedNodeId;
                  const isCollision = collisions.some(
                    (c) =>
                      c.nodeA.dishId === node.dishId ||
                      c.nodeB.dishId === node.dishId
                  );

                  return (
                    <div
                      key={node.dishId}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAddingNewNode(false);
                        setSelectedNodeId(node.id || `node-${node.dishId}`);
                      }}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all ${
                        node.isVisible === false ? 'opacity-40 grayscale' : 'opacity-100'
                      }`}
                      style={{
                        left: `${node.canvasPosition.x}%`,
                        top: `${node.canvasPosition.y}%`,
                      }}
                    >
                      <div className="flex flex-col items-center group/node">
                        {/* Node Avatar Circle */}
                        <div
                          className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 transition-transform shadow-xs ${
                            isSelected
                              ? 'border-copper ring-3 ring-forest scale-110 shadow-md'
                              : isCollision
                              ? 'border-rose-500 ring-2 ring-rose-300'
                              : 'border-white hover:border-copper hover:scale-105'
                          }`}
                        >
                          <ImageWithFallback
                            src={node.imageUrl || dish.imageUrl}
                            alt={dish.name}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Label Badge */}
                        <div
                          className={`mt-1 px-1.5 py-0.5 rounded-xs text-[10px] font-bold whitespace-nowrap shadow-2xs border ${
                            isSelected
                              ? 'bg-forest text-white border-forest'
                              : isCollision
                              ? 'bg-rose-100 text-rose-900 border-rose-300'
                              : 'bg-white text-slate-800 border-slate-200'
                          }`}
                        >
                          {dish.name}
                          {node.publicationStatus === 'draft' && (
                            <span className="ml-1 text-[9px] text-amber-600 font-mono">(Taslak)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Canvas Action Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2">
                <span className="text-[11px] font-mono text-slate-400">
                  Atlas Düğümleri: <strong>{atlasNodes.filter((n) => n.isVisible !== false).length}</strong> Aktif • {atlasNodes.length} Toplam
                </span>

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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-forest hover:bg-forest-800 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Yeni Atlas Düğümü Ekle</span>
                </button>
              </div>
            </div>

            {/* Node Form & Details (5 cols) */}
            <div className="lg:col-span-5 xl:col-span-4 bg-white p-5 rounded-sm border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {isAddingNewNode ? 'Yeni Atlas Düğümü Ekle' : 'Düğüm Konumu & Ayarları'}
                </h3>
                {nodeFormData.dishId && !isAddingNewNode && (
                  <span className="text-[10px] font-mono text-copper-dark font-semibold">
                    {dishMap.get(nodeFormData.dishId)?.categoryLabel}
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveNode} className="space-y-4 text-xs">
                {/* Dish Selector */}
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
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm bg-white focus:outline-none focus:border-forest"
                  >
                    <option value="">Yemek Seçiniz...</option>
                    {allDishes.map((dish) => (
                      <option key={dish.id} value={dish.id}>
                        {dish.name} ({dish.categoryLabel})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Region Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tematik Kültürel Havza
                  </label>
                  <select
                    value={nodeFormData.regionId || 'tarihi-tascarsi'}
                    onChange={(e) => setNodeFormData({ ...nodeFormData, regionId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm bg-white focus:outline-none focus:border-forest"
                  >
                    {CULTURAL_REGIONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.terrainBadge})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Coordinate Fields (Numerical Percentage) */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px] font-mono uppercase">
                      Tuval Yüzde Konumu (X / Y)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Sınırlar: %5 - %95
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        X Konumu (%)
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
                        className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-sm bg-white focus:outline-none focus:border-forest"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Y Konumu (%)
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
                        className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-sm bg-white focus:outline-none focus:border-forest"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans">
                    Harita üzerinde doğrudan tıklayarak da bu koordinatları güncelleyebilirsiniz.
                  </p>
                </div>

                {/* Accent Note / Tagline */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vurgulu Mutfak Notu / Tagline
                  </label>
                  <input
                    type="text"
                    value={nodeFormData.accentNote || ''}
                    onChange={(e) => setNodeFormData({ ...nodeFormData, accentNote: e.target.value })}
                    placeholder="Örn: Sabahın ilk meşe közünde demlenen tava lezzeti."
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
                  />
                </div>

                {/* Visibility & Status */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Yayın Durumu
                    </label>
                    <select
                      value={nodeFormData.publicationStatus || 'published'}
                      onChange={(e) =>
                        setNodeFormData({
                          ...nodeFormData,
                          publicationStatus: e.target.value as any,
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-sm bg-white focus:outline-none focus:border-forest font-mono"
                    >
                      <option value="published">Yayında</option>
                      <option value="draft">Taslak</option>
                      <option value="archived">Arşivde</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Atlas Görünürlüğü
                    </label>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={nodeFormData.isVisible !== false}
                        onChange={(e) =>
                          setNodeFormData({ ...nodeFormData, isVisible: e.target.checked })
                        }
                        className="rounded-xs text-forest focus:ring-forest"
                      />
                      <span className="text-xs font-medium text-slate-700">Haritada Göster</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {!isAddingNewNode && nodeFormData.dishId && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            `"${dishMap.get(nodeFormData.dishId || '')?.name || 'Düğüm'}" atlas düğümünü kaldırmak istiyor musunuz?`
                          )
                        ) {
                          deleteAtlasNode(nodeFormData.id || nodeFormData.dishId || '');
                          showToast('Atlas düğümü kaldırıldı.');
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-sm hover:bg-rose-50 transition-colors"
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
                        className="px-3 py-1.5 rounded-sm border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Vazgeç
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-sm bg-forest hover:bg-forest-800 text-white text-xs font-semibold shadow-xs transition-colors"
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

      {/* SECTION B: GERÇEK ZİYARET NOKTALARI */}
      {activeTab === 'places' && (
        <div className="space-y-6">
          {/* Institutional Accuracy Notice for Physical Map */}
          <div className="p-4 rounded-sm bg-forest-50/80 border border-forest-200 text-forest-950 text-xs font-sans flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-forest shrink-0 mt-0.5" />
            <div>
              <strong className="block mb-0.5 font-bold">Gerçek Ziyaret Noktaları Güvenilirlik İlkeleri:</strong>
              AGENTS.md 4. ve 8. maddeleri uyarınca, hayalî işletme adı veya uydurma GPS koordinatları üretilemez.
              Yalnızca resmî kaynak/saha teyidi olan ve `verified` statüsüne sahip işletmeler ziyaretçi haritasında yer alır.
              Doğrulanmamış veya demo kayıtlar gerçek coğrafi haritada yayınlanmaz; ziyaretçi tarafındaki dürüst boş durum korunur.
            </div>
          </div>

          {/* Table Controls & Filter Bar */}
          <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="İşletme adı, adres veya mahalle ile ara..."
                  value={placeSearch}
                  onChange={(e) => setPlaceSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
                />
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/yonetim/harita/noktalar/yeni"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-forest hover:bg-forest-800 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Yeni Ziyaret Noktası Ekle</span>
                </Link>
              </div>
            </div>

            {/* Sub-Filters */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold mr-1">
                Filtrele:
              </span>

              <select
                value={selectedPlaceCategory}
                onChange={(e) => setSelectedPlaceCategory(e.target.value as any)}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-sm bg-white text-slate-700 focus:outline-none focus:border-forest"
              >
                <option value="all">Tüm Kategoriler</option>
                <option value="bakery">Taş Fırın & Fırıncı</option>
                <option value="restaurant">Restoran & Lokanta</option>
                <option value="producer">Üretici & Çiftlik</option>
                <option value="market">Geleneksel Pazar / Baharatçı</option>
                <option value="cultural_site">Tarihi & Kültürel Alan</option>
              </select>

              <select
                value={selectedPlaceStatus}
                onChange={(e) => setSelectedPlaceStatus(e.target.value as any)}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-sm bg-white text-slate-700 focus:outline-none focus:border-forest"
              >
                <option value="all">Tüm Yayın Durumları</option>
                <option value="published">Yayında</option>
                <option value="draft">Taslak</option>
                <option value="in_review">İncelemede</option>
                <option value="archived">Arşivde</option>
              </select>
            </div>
          </div>

          {/* Places Table */}
          {filteredPlaces.length === 0 ? (
            <div className="bg-white rounded-sm border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Kayıtlı Ziyaret Noktası Bulunmuyor</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                İslahiye genelinde henüz resmî saha tespiti tamamlanmış fiziksel ziyaret noktası bulunmamaktadır.
                Kurumsal ilke gereği ziyaretçi haritasında dürüst boş durum korunur.
              </p>
              <div className="pt-2">
                <Link
                  to="/yonetim/harita/noktalar/yeni"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-slate-100 hover:bg-forest hover:text-white text-slate-700 text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Örnek Ziyaret Noktası Taslağı Oluştur</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-sm border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-mono uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">İşletme Adı</th>
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Adres & İlçe</th>
                      <th className="py-3 px-4">GPS Koordinatları</th>
                      <th className="py-3 px-4">Doğrulama Statüsü</th>
                      <th className="py-3 px-4">Yayın</th>
                      <th className="py-3 px-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPlaces.map((place) => (
                      <tr key={place.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 leading-snug">{place.name}</div>
                          <div className="text-[10px] font-mono text-slate-400 truncate max-w-xs">
                            {place.description}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-xs bg-slate-100 text-slate-700 text-[10px] font-mono">
                            {place.categoryLabel || place.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {place.address}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {place.coordinates
                            ? `${place.coordinates.lat.toFixed(4)}, ${place.coordinates.lng.toFixed(4)}`
                            : 'Koordinatsız'}
                        </td>
                        <td className="py-3 px-4">
                          {place.verificationStatus === 'verified' ? (
                            <span className="text-emerald-700 font-mono text-[11px] flex items-center gap-1 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Doğrulandı
                            </span>
                          ) : (
                            <span className="text-amber-700 font-mono text-[11px] flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> İncelemede / Demo
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-bold uppercase ${
                              place.publicationStatus === 'published'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {place.publicationStatus === 'published' ? 'Yayında' : place.publicationStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/yonetim/harita/noktalar/${place.id}/duzenle`}
                            className="px-2.5 py-1 rounded-sm bg-slate-100 hover:bg-forest hover:text-white text-slate-700 text-xs font-semibold transition-colors mr-1.5"
                          >
                            Düzenle
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteCandidatePlace(place)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors inline-block align-middle"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG FOR PLACES */}
      {deleteCandidatePlace && (
        <div className="fixed inset-0 z-60 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">Ziyaret Noktasını Sil</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              <strong>"{deleteCandidatePlace.name}"</strong> noktası envanterden silinecektir.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidatePlace(null)}
                className="px-3 py-1.5 rounded-sm border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  deletePlace(deleteCandidatePlace.id);
                  showToast('Ziyaret noktası silindi.');
                  setDeleteCandidatePlace(null);
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
