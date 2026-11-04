import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  ChefHat,
  Users,
  ArrowLeft,
  ArrowRight,
  MapPin,
  UtensilsCrossed,
  Award,
  Share2,
  Check,
} from 'lucide-react';
import { useContent } from '../hooks/useContent';
import { Dish } from '../types';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { RecipeWorkshop } from '../components/home/RecipeWorkshop';

export const DishDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { getDishes, getDishById, getPlaces } = useContent();

  const allDishes = getDishes(true);

  // Match dish by id or slug
  const dish: Dish | undefined = useMemo(() => {
    if (!slug) return undefined;
    return getDishById(slug) || allDishes.find((d) => d.id === slug);
  }, [slug, getDishById, allDishes]);

  // Linked physical place
  const linkedPlace = useMemo(() => {
    if (!dish) return undefined;
    const places = getPlaces(true);
    return places.find((p) => p.relatedDishIds?.includes(dish.id));
  }, [dish, getPlaces]);

  // Other recommendations
  const otherDishes = useMemo(() => {
    if (!dish) return [];
    return allDishes.filter((d) => d.id !== dish.id).slice(0, 3);
  }, [dish, allDishes]);

  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!dish) {
    return (
      <div className="min-h-screen bg-[#F6F2E9] text-[#242724] font-sans flex flex-col justify-between">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-24 text-center">
          <UtensilsCrossed className="w-12 h-12 text-[#BA855E] mx-auto mb-4 opacity-60" />
          <h1 className="text-3xl font-display font-medium text-[#203B31] mb-3">
            Yemek Bulunamadı
          </h1>
          <p className="text-sm text-[#242724]/70 mb-6">
            Aradığınız yöresel lezzet kaydı arşivimizde bulunamadı veya taşınmış olabilir.
          </p>
          <button
            type="button"
            onClick={() => navigate('/yemekler')}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#203B31] text-[#F6F2E9] rounded-xs text-xs font-semibold uppercase tracking-wider hover:bg-[#203B31]/90"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tüm Lezzet Kataloğuna Dön</span>
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  // Determine initial recipe id for the workshop
  const workshopRecipeId = dish.recipeId || (dish.id.startsWith('recipe-') ? dish.id : `recipe-${dish.id}`);

  return (
    <div className="min-h-screen bg-[#F6F2E9] text-[#242724] font-sans selection:bg-[#BA855E] selection:text-[#F6F2E9]">
      <Header />

      <main className="pb-24">
        {/* 1. Breadcrumbs & Top Navigation Bar */}
        <div className="bg-[#FFFCF7] border-b border-[#DCCAB2]/60 py-3.5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-[#242724]/60 font-sans">
              <Link to="/" className="hover:text-[#203B31] transition-colors">
                Ana Sayfa
              </Link>
              <span>/</span>
              <Link to="/#lezzet-haritasi" className="hover:text-[#203B31] transition-colors">
                Lezzet Haritası
              </Link>
              <span>/</span>
              <Link to="/yemekler" className="hover:text-[#203B31] transition-colors">
                Yöresel Tarifler
              </Link>
              <span>/</span>
              <span className="text-[#203B31] font-semibold truncate max-w-[200px] sm:max-w-none">
                {dish.name}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xs border border-[#DCCAB2] bg-[#F6F2E9] text-[#203B31] text-[11px] font-semibold hover:border-[#BA855E] transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-[#BA855E]" />}
                <span>{copiedLink ? 'Bağlantı Kopyalandı' : 'Paylaş'}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/yemekler')}
                className="inline-flex items-center gap-1.5 text-xs text-[#203B31] font-semibold hover:text-[#BA855E] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kataloğa Dön</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Hero Editorial Section */}
        <section className="py-12 md:py-16 bg-[#FFFCF7] border-b border-[#DCCAB2]/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Left Column: Typography, Story, Metadata (7 cols) */}
              <div className="lg:col-span-7">
                {/* Provenance & Category Badges */}
                <div className="flex flex-wrap items-center gap-2.5 mb-4">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.2em] px-3 py-1 rounded-2xs bg-[#203B31] text-[#F6F2E9]">
                    {dish.categoryLabel}
                  </span>

                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#936645] px-2.5 py-1 rounded-2xs bg-[#F6F2E9] border border-[#DCCAB2]">
                    {dish.originNote}
                  </span>

                  {dish.isRegisteredGeographicalIndication && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider text-[#BA855E] px-2.5 py-1 rounded-2xs bg-[#BA855E]/10 border border-[#BA855E]/40">
                      <Award className="w-3.5 h-3.5" />
                      TÜRKPATENT TESCİLLİ • NO: 991
                    </span>
                  )}
                </div>

                {/* Display Title */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium text-[#203B31] leading-[1.08] mb-4">
                  {dish.name}
                </h1>

                {/* Tagline */}
                <p className="text-base sm:text-lg text-[#936645] font-serif italic mb-6 leading-relaxed">
                  "{dish.tagline}"
                </p>

                {/* Description */}
                <p className="text-sm sm:text-base text-[#242724]/85 font-sans leading-relaxed mb-6">
                  {dish.description}
                </p>

                {/* Cultural Note Box */}
                {dish.culturalNote && (
                  <div className="p-4 sm:p-5 rounded-xs bg-[#F6F2E9] border-l-3 border-[#BA855E] mb-8">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#936645] font-semibold block mb-1">
                      OCAKLIK &amp; GELENEK NOTU
                    </span>
                    <p className="text-xs sm:text-sm text-[#242724]/80 font-sans leading-relaxed">
                      {dish.culturalNote}
                    </p>
                  </div>
                )}

                {/* Quick Cooking Metrics */}
                <div className="grid grid-cols-3 gap-3 pt-6 border-t border-[#DCCAB2]/60">
                  <div className="p-3 rounded-xs bg-[#F6F2E9] border border-[#DCCAB2]/60">
                    <div className="flex items-center gap-1.5 text-xs text-[#242724]/60 mb-1">
                      <Clock className="w-3.5 h-3.5 text-[#BA855E]" />
                      <span>Hazırlık &amp; Pişirme</span>
                    </div>
                    <span className="text-sm font-semibold text-[#203B31] font-sans">
                      {dish.prepTime} + {dish.cookTime}
                    </span>
                  </div>

                  <div className="p-3 rounded-xs bg-[#F6F2E9] border border-[#DCCAB2]/60">
                    <div className="flex items-center gap-1.5 text-xs text-[#242724]/60 mb-1">
                      <ChefHat className="w-3.5 h-3.5 text-[#BA855E]" />
                      <span>Zorluk Seviyesi</span>
                    </div>
                    <span className="text-sm font-semibold text-[#203B31] font-sans">
                      {dish.difficulty}
                    </span>
                  </div>

                  <div className="p-3 rounded-xs bg-[#F6F2E9] border border-[#DCCAB2]/60">
                    <div className="flex items-center gap-1.5 text-xs text-[#242724]/60 mb-1">
                      <Users className="w-3.5 h-3.5 text-[#BA855E]" />
                      <span>Temel Porsiyon</span>
                    </div>
                    <span className="text-sm font-semibold text-[#203B31] font-sans">
                      {dish.servings}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Dish Photography (5 cols) */}
              <div className="lg:col-span-5">
                <div className="relative aspect-[4/3] sm:aspect-square rounded-xs overflow-hidden shadow-md border-2 border-[#DCCAB2] bg-[#203B31]">
                  <ImageWithFallback
                    src={dish.imageUrl}
                    alt={dish.imageAlt}
                    fallbackText={dish.name}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover filter saturate-[1.10] contrast-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                  <div className="absolute bottom-3 left-3 right-3 text-white/90 text-[11px] font-sans flex items-center justify-between">
                    <span>{dish.imageCredit || 'İslahiye Gastronomi Arşivi'}</span>
                    <span className="font-mono text-[10px] bg-black/40 px-2 py-0.5 rounded-2xs">
                      Gerçek Saha Çekimi
                    </span>
                  </div>
                </div>

                {/* Linked physical place teaser if available */}
                {linkedPlace && (
                  <div className="mt-4 p-4 rounded-xs bg-[#F6F2E9] border border-[#DCCAB2] flex items-center justify-between gap-4">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-[#BA855E] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#936645] font-semibold block">
                          DOĞRULANMIŞ ÇARŞI DURAĞI
                        </span>
                        <h4 className="text-xs font-semibold text-[#203B31]">
                          {linkedPlace.name}
                        </h4>
                        <p className="text-[11px] text-[#242724]/70">
                          {linkedPlace.districtOrNeighborhood}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/lezzet-haritasi?placeId=${linkedPlace.id}`}
                      className="inline-flex items-center gap-1 text-xs text-[#BA855E] font-semibold hover:text-[#203B31] transition-colors shrink-0"
                    >
                      <span>Haritada Gör</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 3. USTAYLA PİŞİR: FOTOGERÇEKÇİ AÇIK YEMEK KİTABI TEZGÂHI */}
        <section id="ustayla-pisir" className="border-t border-[#DCCAB2]/60">
          <RecipeWorkshop initialRecipeId={workshopRecipeId} />
        </section>

        {/* 4. OTHER DISH RECOMMENDATIONS */}
        {otherDishes.length > 0 && (
          <section className="py-16 bg-[#FFFCF7] border-t border-[#DCCAB2]/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#936645] font-semibold block mb-1">
                    GELENEKSEL LEZZETLERİMİZ
                  </span>
                  <h3 className="text-2xl font-display font-medium text-[#203B31]">
                    Diğer Yöresel Reçeteler
                  </h3>
                </div>

                <Link
                  to="/yemekler"
                  className="inline-flex items-center gap-1 text-xs text-[#203B31] font-semibold hover:text-[#BA855E] transition-colors"
                >
                  <span>Tüm Kataloğu Gör</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#BA855E]" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {otherDishes.map((other) => (
                  <Link
                    key={other.id}
                    to={`/yemekler/${other.id}`}
                    className="bg-[#F6F2E9] rounded-xs border border-[#DCCAB2]/80 overflow-hidden group hover:border-[#BA855E]/60 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#203B31]">
                        <img
                          src={other.imageUrl}
                          alt={other.imageAlt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter saturate-[1.05]"
                        />
                        <div className="absolute top-2 left-2">
                          <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-2xs bg-[#203B31] text-[#F6F2E9]">
                            {other.categoryLabel}
                          </span>
                        </div>
                      </div>

                      <div className="p-4">
                        <span className="text-[10px] font-mono text-[#936645] font-semibold block mb-1">
                          {other.originNote}
                        </span>
                        <h4 className="text-base font-display font-medium text-[#203B31] group-hover:text-[#BA855E] transition-colors mb-1.5">
                          {other.name}
                        </h4>
                        <p className="text-xs text-[#242724]/75 line-clamp-2">
                          {other.description}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-2 border-t border-[#DCCAB2]/40 flex items-center justify-between text-xs">
                      <span className="text-[#242724]/60 font-mono text-[11px]">
                        {other.cookTime}
                      </span>
                      <span className="text-[#203B31] font-semibold group-hover:text-[#BA855E] inline-flex items-center gap-1 transition-colors">
                        Reçeteyi İncele →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};
