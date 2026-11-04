import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  ChefHat,
  Users,
  Search,
  ArrowRight,
  ArrowLeft,
  Award,
  UtensilsCrossed,
  LayoutGrid,
  BookOpen,
} from 'lucide-react';
import { useContent } from '../hooks/useContent';
import { DishCategory } from '../types';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { RecipeWorkshop } from '../components/home/RecipeWorkshop';

export const DishesCatalogPage: React.FC = () => {
  const { getDishes } = useContent();
  const allDishes = getDishes(true);

  const [activeCategory, setActiveCategory] = useState<DishCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'book'>('grid');

  const categories: { key: DishCategory; label: string; count: number }[] = useMemo(() => {
    return [
      { key: 'all', label: 'Tüm Lezzetler', count: allDishes.length },
      {
        key: 'main',
        label: 'Ana Yemekler',
        count: allDishes.filter((d) => d.category === 'main').length,
      },
      {
        key: 'pastry',
        label: 'Hamur İşleri',
        count: allDishes.filter((d) => d.category === 'pastry').length,
      },
      {
        key: 'local_product',
        label: 'Yöresel Ürünler',
        count: allDishes.filter((d) => d.category === 'local_product').length,
      },
      {
        key: 'dessert',
        label: 'Tatlılar',
        count: allDishes.filter((d) => d.category === 'dessert').length,
      },
    ];
  }, [allDishes]);

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    let result = allDishes;

    if (activeCategory !== 'all') {
      result = result.filter((d) => d.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.ingredients.some((ing) => ing.name.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allDishes, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F6F2E9] text-[#242724] font-sans selection:bg-[#BA855E] selection:text-[#F6F2E9]">
      <Header />

      <main className="pb-24">
        {/* 1. Breadcrumb Bar */}
        <div className="bg-[#FFFCF7] border-b border-[#DCCAB2]/60 py-3.5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-[#242724]/60">
              <Link to="/" className="hover:text-[#203B31] transition-colors">
                Ana Sayfa
              </Link>
              <span>/</span>
              <span className="text-[#203B31] font-semibold">
                Yöresel Yemek &amp; Tarif Kataloğu
              </span>
            </div>

            <Link
              to="/#lezzet-haritasi"
              className="inline-flex items-center gap-1.5 text-xs text-[#203B31] font-semibold hover:text-[#BA855E] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Haritaya Git</span>
            </Link>
          </div>
        </div>

        {/* 2. Catalog Header & Mode Switcher */}
        <section className="py-12 md:py-16 bg-[#FFFCF7] border-b border-[#DCCAB2]/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="w-8 h-px bg-[#BA855E]" />
                  <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#936645] font-semibold">
                    İSLAHİYE LEZZET ARŞİVİ &amp; REÇETE DERLEMESİ
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium text-[#203B31] leading-tight mb-4">
                  Yöresel Tarif Kataloğu
                </h1>

                <p className="text-sm sm:text-base text-[#242724]/75 font-sans leading-relaxed">
                  Amanos yaylalarının kuzu etinden meşe közünde demlenen tavasına; güneş sergilerinde kuruyan kırmızı biberlerden taş fırın kömbelerine kadar İslahiye mutfak mirasının tüm geleneksel lezzetleri.
                </p>
              </div>

              {/* View Mode Switcher: Grid vs Open Book */}
              <div className="flex items-center p-1 bg-[#F6F2E9] rounded-xs border border-[#DCCAB2] shrink-0 self-start md:self-auto shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xs text-xs font-semibold uppercase tracking-wider transition-all ${
                    viewMode === 'grid'
                      ? 'bg-[#203B31] text-[#F6F2E9] shadow-xs'
                      : 'text-[#242724]/70 hover:text-[#203B31]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Kart Izgarası</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('book')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xs text-xs font-semibold uppercase tracking-wider transition-all ${
                    viewMode === 'book'
                      ? 'bg-[#203B31] text-[#F6F2E9] shadow-xs'
                      : 'text-[#242724]/70 hover:text-[#203B31]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#BA855E]" />
                  <span>Açık Tarif Kitabı</span>
                </button>
              </div>
            </div>

            {/* Filter Bar and Search Input (Only shown in Grid Mode) */}
            {viewMode === 'grid' && (
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-6 border-t border-[#DCCAB2]/60">
                {/* Category tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                  {categories.map((cat) => {
                    const isActive = activeCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setActiveCategory(cat.key)}
                        className={`px-4 py-2 rounded-xs text-xs font-semibold whitespace-nowrap transition-all ${
                          isActive
                            ? 'bg-[#203B31] text-[#F6F2E9] shadow-xs'
                            : 'bg-[#F6F2E9] text-[#242724]/70 border border-[#DCCAB2] hover:border-[#BA855E]'
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span className="ml-1.5 opacity-60 text-[10px] font-mono">
                          ({cat.count})
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search Box */}
                <div className="relative min-w-[260px] md:w-72">
                  <Search className="w-4 h-4 text-[#242724]/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Yemek veya malzeme ara..."
                    className="w-full pl-9 pr-4 py-2 rounded-xs bg-[#F6F2E9] border border-[#DCCAB2] text-xs text-[#242724] placeholder-[#242724]/40 focus:outline-none focus:border-[#BA855E] focus:bg-[#FFFCF7]"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3. Dynamic View: Grid vs Photorealistic Open Cookbook */}
        {viewMode === 'book' ? (
          /* AÇIK TARİF KİTABI TEZGÂHI (FOTOGERÇEKÇİ KİTAP GÖRÜNÜMÜ) */
          <div className="border-t border-[#DCCAB2]/60">
            <RecipeWorkshop initialRecipeId="recipe-islahiye-tava" />
          </div>
        ) : (
          /* KART IZGARASI GÖRÜNÜMÜ */
          <section className="py-12 md:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {filteredDishes.length === 0 ? (
                <div className="py-20 text-center bg-[#FFFCF7] rounded-xs border border-[#DCCAB2] p-8">
                  <UtensilsCrossed className="w-10 h-10 text-[#BA855E] mx-auto mb-3 opacity-60" />
                  <h3 className="text-xl font-display font-medium text-[#203B31] mb-2">
                    Aramanıza Uygun Lezzet Bulunamadı
                  </h3>
                  <p className="text-xs text-[#242724]/70 mb-4 max-w-md mx-auto">
                    "{searchQuery}" aramasıyla eşleşen herhangi bir yöresel yemek kaydı bulunamadı. Lütfen farklı bir arama terimi deneyin.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('all');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xs bg-[#203B31] text-[#F6F2E9] text-xs font-semibold uppercase"
                  >
                    Filtreleri Temizle
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredDishes.map((dish) => (
                    <article
                      key={dish.id}
                      className="bg-[#FFFCF7] rounded-xs border border-[#DCCAB2] overflow-hidden flex flex-col justify-between shadow-xs hover:border-[#BA855E] transition-all group"
                    >
                      <div>
                        {/* Photo Container */}
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#203B31]">
                          <ImageWithFallback
                            src={dish.imageUrl}
                            alt={dish.imageAlt}
                            fallbackText={dish.name}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter saturate-[1.08]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                          {/* Top Badges */}
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-2xs bg-[#203B31] text-[#F6F2E9]">
                              {dish.categoryLabel}
                            </span>
                          </div>

                          {dish.isRegisteredGeographicalIndication && (
                            <div className="absolute top-2.5 right-2.5">
                              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-2xs bg-[#BA855E] text-[#FFFCF7] shadow-xs">
                                <Award className="w-3 h-3" />
                                Tescil 991
                              </span>
                            </div>
                          )}

                          <div className="absolute bottom-2.5 left-2.5 text-white/90 text-[11px] font-sans">
                            {dish.originNote}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          <h2 className="text-xl font-display font-medium text-[#203B31] mb-2 leading-snug group-hover:text-[#BA855E] transition-colors">
                            <Link to={`/yemekler/${dish.id}`}>
                              {dish.name}
                            </Link>
                          </h2>

                          <p className="text-xs sm:text-sm text-[#242724]/75 font-sans leading-relaxed mb-4 line-clamp-3">
                            {dish.description}
                          </p>

                          {/* Metrics */}
                          <div className="flex items-center gap-4 text-xs text-[#242724]/70 pt-3 border-t border-[#DCCAB2]/60">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#BA855E]" />
                              <span>{dish.cookTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ChefHat className="w-3.5 h-3.5 text-[#BA855E]" />
                              <span>{dish.difficulty}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-[#BA855E]" />
                              <span>{dish.servings}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Button */}
                      <div className="p-6 pt-0">
                        <Link
                          to={`/yemekler/${dish.id}`}
                          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xs bg-[#F6F2E9] border border-[#DCCAB2] text-[#203B31] text-xs font-semibold uppercase tracking-wider group-hover:bg-[#203B31] group-hover:text-[#F6F2E9] group-hover:border-[#203B31] transition-all"
                        >
                          <span>Tarifi &amp; Pişirme Güncesini İncele</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#BA855E] group-hover:text-[#F6F2E9]" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};
