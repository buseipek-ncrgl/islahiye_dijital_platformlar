import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, MapPin } from 'lucide-react';
import { Dish, DishCategory } from '../../types';
import { useContent } from '../../hooks/useContent';
import { CulturalAtlasCanvas } from '../map/CulturalAtlasCanvas';
import { RealStreetMapView } from '../map/RealStreetMapView';
import { ImageWithFallback } from '../ui/ImageWithFallback';

interface HomeMapTeaserProps {
  onSelectDish?: (dish: Dish) => void;
  onOpenWorkshop?: (recipeId: string) => void;
}

export const HomeMapTeaser: React.FC<HomeMapTeaserProps> = ({
  onSelectDish,
}) => {
  const navigate = useNavigate();
  const { getDishes, getAtlasNodes, getCategories } = useContent();
  const liveDishes = getDishes(true);
  const liveAtlasNodes = getAtlasNodes(true);
  const dishCategories = getCategories('dish', true);

  const [teaserMode, setTeaserMode] = useState<'cultural' | 'real_map'>('real_map');
  const [selectedCategory, setSelectedCategory] = useState<DishCategory>('all');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(liveDishes[0] || null);

  const categories: { key: DishCategory; label: string }[] = React.useMemo(
    () => [
      { key: 'all', label: 'Tümü' },
      ...dishCategories.map((cat) => ({
        key: cat.id as DishCategory,
        label: cat.label,
      })),
    ],
    [dishCategories]
  );

  const filteredDishes = React.useMemo(
    () =>
      selectedCategory === 'all'
        ? liveDishes
        : liveDishes.filter((d) => d.category === selectedCategory),
    [liveDishes, selectedCategory]
  );

  const filteredDishIds = React.useMemo(
    () => filteredDishes.map((d) => d.id),
    [filteredDishes]
  );

  // Sync selected dish with filtered dishes
  React.useEffect(() => {
    if (selectedDish && !filteredDishes.some((d) => d.id === selectedDish.id)) {
      setSelectedDish(filteredDishes[0] || null);
    } else if (!selectedDish && filteredDishes.length > 0) {
      setSelectedDish(filteredDishes[0]);
    }
  }, [filteredDishes, selectedDish]);

  return (
    <section id="lezzet-haritasi" className="py-20 md:py-28 bg-ivory border-t border-sand/70 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-8 h-px bg-copper" />
              <span className="text-[11px] font-sans uppercase tracking-[0.25em] text-copper-dark font-bold">
                02 / COĞRAFİ &amp; KÜLTÜREL ATLAS
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-forest leading-tight">
              İslahiye Lezzet Haritası
            </h2>

            <p className="text-sm sm:text-base text-charcoal/75 mt-3 max-w-2xl font-sans">
              Amanos yaylalarının meşe közünden ovadaki kırmızı biber sergilerine;
              lezzetlerimizin yetiştiği coğrafi havzaları ve çarşı duraklarını keşfedin.
            </p>
          </div>

          {/* Harita Modu Değiştirici & CTA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="inline-flex p-1 bg-[#ede3ca]/70 rounded-xs border border-[#d5c2aa] shadow-xs">
              <button
                type="button"
                onClick={() => setTeaserMode('cultural')}
                className={`py-2 px-3.5 rounded-2xs text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  teaserMode === 'cultural'
                    ? 'bg-[#203b31] text-[#fff9e9] shadow-xs'
                    : 'text-[#555f55] hover:text-[#203b31]'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Kültürel Atlas</span>
              </button>

              <button
                type="button"
                onClick={() => setTeaserMode('real_map')}
                className={`py-2 px-3.5 rounded-2xs text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  teaserMode === 'real_map'
                    ? 'bg-[#203b31] text-[#fff9e9] shadow-xs'
                    : 'text-[#555f55] hover:text-[#203b31]'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Gerçek Sokak Haritası</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  teaserMode === 'real_map'
                    ? '/lezzet-haritasi?mode=real_map'
                    : '/lezzet-haritasi?mode=cultural'
                )
              }
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-sm bg-forest text-ivory text-xs font-semibold uppercase tracking-widest hover:bg-forest-600 active:scale-[0.99] transition-all shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-copper"
            >
              <span>{teaserMode === 'real_map' ? 'Tam Ekran Sokak Haritası' : 'Tam Ekran Atlas'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-copper-light" />
            </button>
          </div>
        </div>

        {/* MOD B: GERÇEK SOKAK HARİTASI (ANASAYFA ENTEGRASYONU) */}
        {teaserMode === 'real_map' ? (
          <div className="border-2 border-sand/80 rounded-sm overflow-hidden shadow-md">
            <RealStreetMapView
              onSwitchToCulturalMode={() => setTeaserMode('cultural')}
              onPreviewDish={(dish) => navigate(`/yemekler/${dish.id}`)}
            />
          </div>
        ) : (
          /* MOD A: KÜLTÜREL ATLAS + 4'LÜ DETAY PANELİ */
          <>
            {/* Category Selector Chips */}
            <div className="mb-8 overflow-x-auto pb-2 scrollbar-none">
              <div className="flex items-center gap-2 min-w-max">
                <span className="text-xs font-sans uppercase tracking-[0.2em] text-charcoal/60 mr-2 font-bold">
                  Havza / Kategori:
                </span>
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`px-4 py-2 rounded-xl text-xs font-sans font-bold tracking-wider transition-colors ${
                        isActive
                          ? 'bg-forest text-ivory shadow-xs'
                          : 'bg-paper text-charcoal/70 border border-sand/70 hover:border-copper/50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editorial Two-Column Teaser Composition */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Main Visual Canvas (8 cols) - Tam sığan ve net büyük iğneli harita görünümü */}
              <div className="lg:col-span-8">
                <CulturalAtlasCanvas
                  dishes={liveDishes}
                  nodes={liveAtlasNodes}
                  selectedDishId={selectedDish?.id || null}
                  onSelectDish={(dish) => setSelectedDish(dish)}
                  filteredDishIds={filteredDishIds}
                />
              </div>

          {/* Quick Interactive Dish Snapshot (4 cols) */}
          <div className="lg:col-span-4 bg-[#FAF6EE] border-2 border-sand/80 rounded-2xl p-6 sm:p-7 flex flex-col justify-between shadow-xs">
            {selectedDish ? (
              <>
                <div>
                  <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden mb-4 bg-sand/20 border border-sand/60">
                    <ImageWithFallback
                      src={selectedDish.imageUrl}
                      alt={selectedDish.imageAlt}
                      fallbackText={selectedDish.name}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-forest text-ivory">
                        {selectedDish.categoryLabel}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-sans tracking-[0.2em] uppercase text-copper-dark font-bold block mb-1">
                    {selectedDish.originNote || 'İslahiye Kültürel Havzası'}
                  </span>

                  <h3 className="text-xl font-display font-bold text-forest mb-2">
                    {selectedDish.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-charcoal/75 leading-relaxed font-sans mb-4 line-clamp-3">
                    {selectedDish.description}
                  </p>

                  {selectedDish.culturalNote && (
                    <p className="text-xs text-charcoal/70 italic border-l-2 border-copper/60 pl-3 mb-5 font-serif line-clamp-2">
                      "{selectedDish.culturalNote}"
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-sand/50 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectDish) {
                        onSelectDish(selectedDish);
                      } else {
                        navigate(`/yemekler/${selectedDish.id}`);
                      }
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#203B31] text-[#F6F2E9] text-xs font-sans font-bold uppercase tracking-wider hover:bg-[#203B31]/90 transition-all shadow-xs"
                  >
                    <span>Yemek Detayını &amp; Tarifi İncele</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#BA855E]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/lezzet-haritasi')}
                    className="w-full text-center text-xs text-copper-dark hover:text-forest font-sans font-bold pt-1 transition-colors block"
                  >
                    Tüm Seyahatname Atlasını ve Ziyaret Duraklarını İncele →
                  </button>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-xs text-charcoal/60 font-sans">
                Seçili kategoride gösterilecek lezzet bulunamadı.
              </div>
            )}
          </div>
        </div>

        {/* Atlas V2 6'lı Lezzet Keşif Şeridi */}
        <div className="mt-10 border-t border-sand/70 pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-copper-dark font-bold">
              Lezzetleri Keşfedin
            </span>
            <span className="text-xs text-charcoal/50 font-sans">
              Altı anlatı · Tek coğrafya
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {liveDishes.slice(0, 6).map((d, idx) => {
              const isSelected = selectedDish?.id === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDish(d)}
                  aria-pressed={isSelected}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-[#e9e0cf] border-copper text-[#1d4233] shadow-xs'
                      : 'bg-paper border-sand/70 hover:border-copper/60 text-[#2b4034]'
                  }`}
                >
                  <span className="text-[10px] font-sans tabular-nums font-bold text-[#af7958] block">
                    {String(idx + 1).padStart(2, '0')} / 06
                  </span>
                  <strong className="font-display text-sm font-normal line-clamp-1 block mt-0.5">
                    {d.name}
                  </strong>
                </button>
              );
            })}
          </div>
        </div>
        </>
      )}
      </div>
    </section>
  );
};
