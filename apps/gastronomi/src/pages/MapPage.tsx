import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, Compass, MapPin } from 'lucide-react';
import { Dish } from '../types';
import { useContent } from '../hooks/useContent';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { CulturalAtlasCanvas, CanvasMode } from '../components/map/CulturalAtlasCanvas';
import { AtlasDetailPanel } from '../components/map/AtlasDetailPanel';
import { RealStreetMapView } from '../components/map/RealStreetMapView';
import { RecipePreviewModal } from '../components/home/RecipePreviewModal';

export const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlMode = searchParams.get('mode');

  const { getDishes } = useContent();
  const liveDishes = getDishes(true);

  const [activeMode, setActiveMode] = useState<CanvasMode>(
    urlMode === 'real_map' || urlMode === 'verified_places' || urlMode === 'sokak'
      ? 'verified_places'
      : 'cultural'
  );

  // Senkronize URL mode
  useEffect(() => {
    if (urlMode === 'real_map' || urlMode === 'verified_places' || urlMode === 'sokak') {
      setActiveMode('verified_places');
    } else if (urlMode === 'cultural') {
      setActiveMode('cultural');
    }
  }, [urlMode]);

  const handleModeChange = (mode: CanvasMode) => {
    setActiveMode(mode);
    setSearchParams({ mode: mode === 'verified_places' ? 'real_map' : 'cultural' });
  };

  // Image 2 Onaylanan Tasarım Referansındaki 6 Özgün Tat Sıralaması
  const curatedDishIds = [
    'islahiye-tava',
    'firik-pilavi',
    'islahiye-biberi',
    'semsek-boregi',
    'incir-tatlisi',
    'islahiye-kombesi',
  ];

  const travelogueDishes = useMemo(() => {
    const list: Dish[] = [];
    curatedDishIds.forEach((id) => {
      const found = liveDishes.find((d) => d.id === id);
      if (found) list.push(found);
    });
    liveDishes.forEach((d) => {
      if (!list.some((item) => item.id === d.id)) {
        list.push(d);
      }
    });
    return list;
  }, [liveDishes]);

  const [selectedDish, setSelectedDish] = useState<Dish | null>(travelogueDishes[0] || null);
  const [modalDish, setModalDish] = useState<Dish | null>(null);

  // Senkronize seçili yemek
  React.useEffect(() => {
    if (selectedDish && !travelogueDishes.some((d) => d.id === selectedDish.id)) {
      setSelectedDish(travelogueDishes[0] || null);
    } else if (!selectedDish && travelogueDishes.length > 0) {
      setSelectedDish(travelogueDishes[0]);
    }
  }, [travelogueDishes, selectedDish]);

  const currentIndex = selectedDish && travelogueDishes.length > 0
    ? travelogueDishes.findIndex((d) => d.id === selectedDish.id)
    : 0;

  const handlePrevDish = () => {
    if (travelogueDishes.length <= 1) return;
    const prevIdx = (currentIndex - 1 + travelogueDishes.length) % travelogueDishes.length;
    setSelectedDish(travelogueDishes[prevIdx]);
  };

  const handleNextDish = () => {
    if (travelogueDishes.length <= 1) return;
    const nextIdx = (currentIndex + 1) % travelogueDishes.length;
    setSelectedDish(travelogueDishes[nextIdx]);
  };

  const handleOpenWorkshop = (recipeId: string) => {
    navigate('/', { state: { recipeId } });
    setTimeout(() => {
      const el = document.querySelector('#tarif-atolyesi');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#f6f2e9] text-charcoal font-sans flex flex-col justify-between selection:bg-copper selection:text-ivory">
      {/* 1. Global Header */}
      <Header />

      <main className="flex-1 w-full max-w-[1660px] mx-auto pb-12" id="main">
        {/* ========================================================================= */}
        {/* EDİTORYAL BAŞLIK & İKİ HARİTA MODU SEÇİCİ (MASAÜSTÜ VE MOBİL UYUMLU)       */}
        {/* ========================================================================= */}
        <section className="px-4 sm:px-6 lg:px-10 pt-6 pb-3">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
            <div>
              <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-[0.22em] text-[#936645] uppercase block mb-1">
                KÜLTÜREL COĞRAFYA &amp; SOKAK HARİTASI / 04
              </span>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-normal leading-[1.1] text-[#1b3a2d]">
                {activeMode === 'cultural'
                  ? 'İslahiye Gastronomi Seyahatnamesi'
                  : 'İslahiye Gerçek Sokak & Ziyaret Haritası'}
              </h1>
              <p className="text-xs sm:text-[13px] text-[#525f54] leading-relaxed font-sans mt-1 max-w-2xl">
                {activeMode === 'cultural'
                  ? 'Amanos eteklerinden ovaya uzanan 6 özgün tat ve kültürel lezzet keşif atlası.'
                  : 'Gerçek OpenStreetMap sokak döşemeleri üzerinde İslahiye caddeleri, sokakları, mahalleleri ve doğrulanmış lezzet durakları.'}
              </p>
            </div>

            {/* İKİ HARİTA MODU SEÇİCİ BUTONLARI (Kural 4) */}
            <div className="inline-flex p-1 bg-[#ede3ca]/70 rounded-xs border border-[#d5c2aa] shadow-xs self-start md:self-auto">
              <button
                type="button"
                onClick={() => handleModeChange('cultural')}
                className={`py-2 px-3.5 rounded-2xs text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  activeMode === 'cultural'
                    ? 'bg-[#203b31] text-[#fff9e9] shadow-xs'
                    : 'text-[#555f55] hover:text-[#203b31]'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Kültürel Lezzet Atlası</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('verified_places')}
                className={`py-2 px-3.5 rounded-2xs text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  activeMode === 'verified_places'
                    ? 'bg-[#203b31] text-[#fff9e9] shadow-xs'
                    : 'text-[#555f55] hover:text-[#203b31]'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Gerçek Ziyaret Haritası</span>
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. ATLAS ANA SAHNE: MOD A (İLLÜSTRATİF) VEYA MOD B (GERÇEK SOKAK HARİTASI) */}
        {/* ========================================================================= */}
        <div className="relative mx-0 sm:mx-6 lg:mx-10 mt-1 sm:mt-3">
          {/* Çift Çerçeveli Antik Yazma/Atlas Panosu (İlluminated Manuscript Frame) */}
          <div className="p-1 sm:p-2 bg-[#f4ecd8]/60 border-2 border-[#d5c2aa] rounded-xs shadow-md">
            {activeMode === 'cultural' || activeMode === 'geojson_boundary' ? (
              /* MOD A: KÜLTÜREL ATLAS + SEYAHATNAME DETAY PANELİ */
              <section
                className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.9fr)_minmax(350px,0.92fr)] bg-[#f6f2e9] border border-[#dccbb3] rounded-2xs overflow-hidden items-stretch"
                aria-label="İslahiye Lezzet Haritası ve Seyahatname Güncesi"
              >
                {/* Sol Kolon: Zengin İllüstratif Harita Arka Planı ve 6 İnteraktif Lezzet Düğümü */}
                <div className="min-w-0 border-b lg:border-b-0 lg:border-r border-[#dccbb3] relative bg-[#f6f2e9] flex flex-col justify-center">
                  <CulturalAtlasCanvas
                    activeMode={activeMode}
                    onSwitchMode={handleModeChange}
                    onSwitchToCulturalMode={() => handleModeChange('cultural')}
                    dishes={liveDishes}
                    selectedDishId={selectedDish?.id || null}
                    onSelectDish={(dish) => setSelectedDish(dish)}
                  />
                </div>

                {/* Sağ Kolon: Editoryal Seyahatname Güncesi Detay Paneli */}
                <AtlasDetailPanel
                  dish={selectedDish}
                  currentIndex={currentIndex}
                  totalCount={travelogueDishes.length}
                  onPrevDish={handlePrevDish}
                  onNextDish={handleNextDish}
                  activeMode={activeMode}
                  onModeChange={handleModeChange}
                  onOpenPreviewModal={(d) => setModalDish(d)}
                  onOpenWorkshop={handleOpenWorkshop}
                />
              </section>
            ) : (
              /* MOD B: GERÇEK SOKAK HARİTASI (LEAFLET + OPENSTREETMAP + ZİYARET NOKTALARI) */
              <section
                className="bg-[#f6f2e9] border border-[#dccbb3] rounded-2xs overflow-hidden"
                aria-label="İslahiye Gerçek Sokak Haritası ve Doğrulanmış Ziyaret Noktaları"
              >
                <RealStreetMapView
                  onSwitchToCulturalMode={() => handleModeChange('cultural')}
                  initialDishId={selectedDish?.id || null}
                  onPreviewDish={(d) => setModalDish(d)}
                />
              </section>
            )}
          </div>
        </div>


        {/* ========================================================================= */}
        {/* 3. BU LEZZET COĞRAFYASINDA KEŞFEDİN (6 ÖZGÜN TAT ŞERİDİ)                  */}
        {/* ========================================================================= */}
        <section
          id="discover"
          className="mx-0 sm:mx-6 lg:mx-10 mt-6 pt-5 pb-6 px-4 sm:px-6 bg-[#fcf9f2] border border-[#dccbb3] rounded-xs shadow-xs"
          aria-label="Lezzet keşif şeridi"
        >
          {/* Başlık ve Sağ Bağlantı (Image 2 Birebir Uyum) */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-mono font-bold tracking-[0.22em] text-[#936645] uppercase">
                BU LEZZET COĞRAFYASINDA KEŞFEDİN
              </span>
              <span className="text-[11px] font-mono text-[#8d765e] tracking-wider ml-1">
                6 ÖZGÜN TAT
              </span>
            </div>

            <Link
              to="/yoresel-lezzetler"
              className="text-[11px] font-bold font-sans text-[#8d765e] hover:text-[#203b31] flex items-center gap-1.5 transition-colors uppercase tracking-wider"
            >
              <span>Tüm Lezzetler</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 6'lı Lezzet Kartları Izgarası (Referanstaki Yatay Düzen) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5" aria-label="Lezzet seçimi">
            {travelogueDishes.slice(0, 6).map((d, idx) => {
              const isSelected = selectedDish?.id === d.id;

              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDish(d)}
                  aria-pressed={isSelected}
                  className={`group relative p-3 sm:p-3.5 rounded-xs border text-left transition-all duration-200 flex flex-col justify-between min-h-[148px] ${
                    isSelected
                      ? 'bg-[#f4ece0] border-2 border-[#ba855e] shadow-xs'
                      : 'bg-[#fffdf8] border border-[#dccbb3] hover:border-[#ba855e] hover:bg-[#faf4ea]'
                  }`}
                >
                  {/* Üst Sıra: Numara & Kategori Rozeti */}
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-[11px] font-mono font-bold text-[#936645]">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded-2xs bg-[#eee6d7] text-[#7a7161] tracking-wider truncate max-w-[95px]">
                      {d.categoryLabel}
                    </span>
                  </div>

                  {/* Orta Sıra: Yuvarlak Fotoğraf (Solda) & Lezzet İsmi (Sağda) */}
                  <div className="flex items-center gap-2.5 my-auto">
                    <div
                      className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full overflow-hidden flex-shrink-0 transition-transform duration-200 ${
                        isSelected
                          ? 'ring-2 ring-[#ba855e] shadow-xs scale-105'
                          : 'ring-1 ring-[#c9b59d] group-hover:scale-105'
                      }`}
                    >
                      <img
                        src={d.imageUrl}
                        alt={d.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <strong
                      className={`font-display text-[14px] sm:text-[15px] font-medium leading-snug line-clamp-2 ${
                        isSelected ? 'text-[#1b3a2d]' : 'text-[#2b4034]'
                      }`}
                    >
                      {d.name}
                    </strong>
                  </div>

                  {/* Alt Sağ: Dairesel Ok İkonu */}
                  <div className="w-full flex justify-end mt-1.5">
                    <span
                      className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#ba855e] text-white border-[#ba855e]'
                          : 'border-[#c9b59d] text-[#786d5e] group-hover:border-[#ba855e] group-hover:text-[#ba855e]'
                      }`}
                    >
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. AÇIKLAMA VE METODOLOJİ DİPNOTU (#notes)                                */}
        {/* ========================================================================= */}
        <section className="mx-0 sm:mx-6 lg:mx-10 mt-6 flex flex-col sm:flex-row justify-between gap-6 px-6 py-5 bg-[#fcf9f2] border border-[#dccbb3] rounded-xs text-xs text-[#6a6b5f] leading-relaxed font-sans" id="notes">
          <div className="max-w-xl">
            <strong className="text-[#203b31] block mb-1 font-semibold">Coğrafi Harita &amp; Sınır Doğruluğu</strong>
            İslahiye ilçe sınır geometrisi, 325 noktalı resmî WGS84 GeoJSON poligonundan türetilmiştir. Harita üzerindeki illüstratif dağlar, su dokuları ve tarım sahneleri kültürel keşif seyahatnamesidir.
          </div>
          <div className="max-w-xl">
            <strong className="text-[#203b31] block mb-1 font-semibold">Lezzet Düğümleri &amp; Gerçek Konum Ayrımı</strong>
            Yemek işaretleri, İslahiye'nin mutfak hafızasını temsil eden kültürel keşif duraklarıdır; gerçek ziyaret ve tadım noktaları yalnızca doğrulanmış işletme koordinatlarıyla ayrıca sunulur.
          </div>
        </section>
      </main>

      {/* 5. Global Footer */}
      <Footer />

      {/* 6. Reçete Önizleme Modalı */}
      <RecipePreviewModal
        dish={modalDish}
        onClose={() => setModalDish(null)}
        onOpenInWorkshop={handleOpenWorkshop}
      />
    </div>
  );
};
