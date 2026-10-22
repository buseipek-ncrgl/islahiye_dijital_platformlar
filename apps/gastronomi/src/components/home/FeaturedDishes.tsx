import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Clock, ChefHat, Users, ArrowRight, UtensilsCrossed, Eye, Sparkles } from 'lucide-react';
import { Dish, DishCategory, Recipe } from '../../types';
import { useContent } from '../../hooks/useContent';
import { ImageWithFallback } from '../ui/ImageWithFallback';

interface FeaturedDishesProps {
  onSelectDish: (dish: Dish) => void;
  onOpenWorkshop?: (recipeId: string) => void;
}

export const FeaturedDishes: React.FC<FeaturedDishesProps> = ({
  onSelectDish,
  onOpenWorkshop,
}) => {
  const { getDishes, getRecipeById } = useContent();
  const publishedDishes = getDishes(true);

  const [activeCategory, setActiveCategory] = useState<DishCategory>('all');
  const [activeDishId, setActiveDishId] = useState<string>('');

  // Categories with live CMS counters
  const categories = useMemo(() => {
    return [
      { key: 'all' as DishCategory, label: 'Tüm Lezzetler', count: publishedDishes.length },
      {
        key: 'main' as DishCategory,
        label: 'Ana Yemekler',
        count: publishedDishes.filter((d) => d.category === 'main').length,
      },
      {
        key: 'pastry' as DishCategory,
        label: 'Hamur İşleri',
        count: publishedDishes.filter((d) => d.category === 'pastry').length,
      },
      {
        key: 'local_product' as DishCategory,
        label: 'Yöresel Ürünler',
        count: publishedDishes.filter((d) => d.category === 'local_product').length,
      },
      {
        key: 'dessert' as DishCategory,
        label: 'Tatlılar',
        count: publishedDishes.filter((d) => d.category === 'dessert').length,
      },
    ];
  }, [publishedDishes]);

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    if (activeCategory === 'all') return publishedDishes;
    return publishedDishes.filter((dish) => dish.category === activeCategory);
  }, [publishedDishes, activeCategory]);

  // Ensure an active dish is always selected when dishes load or filter changes
  useEffect(() => {
    if (filteredDishes.length === 0) {
      setActiveDishId('');
      return;
    }

    const currentExists = filteredDishes.some((d) => d.id === activeDishId);
    if (!currentExists) {
      // Prefer lead dish in filtered list, or first dish
      const defaultDish = filteredDishes.find((d) => d.isLead) || filteredDishes[0];
      setActiveDishId(defaultDish.id);
    }
  }, [filteredDishes, activeDishId]);

  // Active dish object
  const activeDish: Dish | undefined = useMemo(() => {
    return filteredDishes.find((d) => d.id === activeDishId) || filteredDishes[0];
  }, [filteredDishes, activeDishId]);

  // Check if active dish has a valid recipe
  const linkedRecipe: Recipe | undefined = useMemo(() => {
    if (!activeDish?.recipeId) return undefined;
    const r = getRecipeById(activeDish.recipeId);
    if (r && r.publicationStatus !== 'archived') return r;
    return undefined;
  }, [activeDish, getRecipeById]);

  // Keyboard navigation handler for right list items
  const handleItemKeyDown = (e: React.KeyboardEvent, dishId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveDishId(dishId);
    }
  };

  return (
    <section id="lezzetler" className="py-20 md:py-28 bg-ivory relative border-t border-sand/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header: High Editorial Pacing */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-8 h-px bg-copper" />
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-copper-dark font-semibold">
                02 / İSLAHİYE MUTFAK ENVENTARİ
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-forest leading-tight">
              Yöresel Lezzetler & Mutfak Monografisi
            </h2>

            <p className="text-sm sm:text-base text-charcoal/75 mt-3 max-w-2xl font-sans leading-relaxed">
              Taş fırının meşe közünde demlenen et tavalarından bağ bozumu semseklerine,
              tütsülü yeşil firikten tescilli İslahiye biberine yaşayan lezzet arşivi.
            </p>
          </div>

          {/* Quick Counter */}
          <div className="flex items-center gap-2 text-xs font-mono text-charcoal/70 bg-paper px-4 py-2.5 rounded-sm border border-sand/70 self-start md:self-auto shadow-2xs">
            <UtensilsCrossed className="w-3.5 h-3.5 text-copper" />
            <span>{filteredDishes.length} Yöresel Lezzet Listeleniyor</span>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="mb-10 sm:mb-12 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center gap-2 min-w-max border-b border-sand/50 pb-4">
            <div className="flex items-center gap-1.5 text-xs font-mono text-charcoal/50 pr-2 border-r border-sand/60">
              <Filter className="w-3.5 h-3.5 text-copper" />
              <span className="uppercase tracking-wider">Kategori</span>
            </div>

            {categories.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-semibold tracking-wider uppercase transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-forest ${
                    isActive
                      ? 'bg-forest text-ivory shadow-xs'
                      : 'bg-paper text-charcoal/75 border border-sand/70 hover:border-copper/60 hover:text-forest'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-xs ${
                      isActive ? 'bg-forest-600 text-ivory' : 'bg-sand/40 text-charcoal/60'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Showcase: Monographic Book Spread or Empty State */}
        {filteredDishes.length > 0 && activeDish ? (
          <div>
            {/* MOBILE COMPACT SELECTOR STRIP (< 768px): Horizontal Touch Rail */}
            <div className="block lg:hidden mb-8">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-sand/50">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-copper-dark font-semibold">
                  LEZZET SEÇİMİ
                </span>
                <span className="text-[10px] font-mono text-charcoal/50">
                  {filteredDishes.findIndex((d) => d.id === activeDish.id) + 1} / {filteredDishes.length}
                </span>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
                {filteredDishes.map((dish) => {
                  const isSelected = dish.id === activeDish.id;
                  return (
                    <button
                      key={dish.id}
                      type="button"
                      onClick={() => setActiveDishId(dish.id)}
                      className={`flex-shrink-0 flex items-center gap-2.5 p-2 rounded-sm border transition-all text-left min-w-[200px] max-w-[240px] ${
                        isSelected
                          ? 'bg-paper border-copper ring-1 ring-copper shadow-xs'
                          : 'bg-ivory/80 border-sand/70 active:bg-sand/20'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-sm overflow-hidden flex-shrink-0 bg-sand/20">
                        <ImageWithFallback
                          src={dish.imageUrl}
                          alt={dish.name}
                          containerClassName="w-full h-full"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="overflow-hidden">
                        <span className={`block text-xs font-display font-bold truncate ${
                          isSelected ? 'text-copper-dark' : 'text-forest'
                        }`}>
                          {dish.name}
                        </span>
                        <span className="block text-[10px] font-mono text-charcoal/50 uppercase tracking-wider truncate">
                          {dish.originNote}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MAIN TWO-COLUMN EDITORIAL BOOK SPREAD (Desktop 7 + 5 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              
              {/* LEFT / MAIN EDITORIAL MONOGRAPH (7 cols): Selected Dish Highlight */}
              <div className="lg:col-span-7 flex flex-col">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeDish.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="flex flex-col"
                  >
                    {/* Unconstrained Organic Food Photo */}
                    <figure className="relative m-0 p-0">
                      <div className="relative aspect-[16/10] sm:aspect-[16/10] w-full overflow-hidden rounded-sm bg-sand/20">
                        <ImageWithFallback
                          src={activeDish.imageUrl}
                          alt={activeDish.imageAlt || activeDish.name}
                          fallbackText={activeDish.name}
                          containerClassName="w-full h-full"
                          className="w-full h-full object-cover transition-transform duration-700 ease-out"
                          loading="eager"
                        />
                        {/* Subtle Vignette */}
                        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/30 via-transparent to-transparent pointer-events-none" />

                        {/* Top Left Cultural Category Badge */}
                        <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2.5 py-1 rounded-xs bg-forest text-ivory shadow-xs">
                            {activeDish.categoryLabel}
                          </span>
                          {activeDish.giStatusNote && (
                            <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-1 rounded-xs bg-paper/90 text-copper-dark border border-sand/50 shadow-xs hidden sm:inline">
                              {activeDish.giStatusNote}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quiet Typographic Caption OUTSIDE image */}
                      <figcaption className="mt-2.5 flex items-baseline justify-between text-xs text-charcoal/65 font-sans">
                        <span>{activeDish.tagline}</span>
                        <span className="text-[10px] font-mono text-charcoal/40 uppercase hidden sm:inline">
                          Temsili Görsel
                        </span>
                      </figcaption>
                    </figure>

                    {/* Monographic Text Details */}
                    <div className="mt-6 sm:mt-8">
                      {/* Sub-header / Provenance line */}
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="text-[11px] font-mono uppercase tracking-widest text-copper-dark font-semibold">
                          {activeDish.originNote}
                        </span>
                        <span className="text-sand">•</span>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-charcoal/50">
                          Geleneksel Mutfak Mirası
                        </span>
                      </div>

                      {/* Display Dish Title */}
                      <h3 className="text-2xl sm:text-3xl lg:text-[2.65rem] font-display font-bold text-forest leading-tight mb-4">
                        {activeDish.name}
                      </h3>

                      {/* Story / Description */}
                      <p className="text-sm sm:text-base text-charcoal/80 font-sans leading-relaxed mb-6">
                        {activeDish.description}
                      </p>

                      {/* Sensory Cultural Note (Pull-quote style) */}
                      {activeDish.culturalNote && (
                        <div className="border-l-2 border-copper bg-paper/60 p-4 sm:p-5 rounded-xs mb-6 sm:mb-8">
                          <p className="text-xs sm:text-sm text-charcoal/85 italic font-serif leading-relaxed">
                            "{activeDish.culturalNote}"
                          </p>
                        </div>
                      )}

                      {/* Structured Preparation Metadata Ribbon */}
                      <div className="flex flex-wrap items-center gap-6 sm:gap-8 py-3.5 mb-8 border-y border-sand/50 text-xs text-charcoal/70 font-sans">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-copper" />
                          <span>Hazırlık: {activeDish.prepTime}</span>
                        </div>
                        <span className="text-sand hidden sm:inline">•</span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-copper" />
                          <span>Pişirme: {activeDish.cookTime}</span>
                        </div>
                        <span className="text-sand hidden sm:inline">•</span>
                        <div className="flex items-center gap-1.5">
                          <ChefHat className="w-4 h-4 text-copper" />
                          <span>Zorluk: {activeDish.difficulty}</span>
                        </div>
                        <span className="text-sand hidden sm:inline">•</span>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-copper" />
                          <span>{activeDish.servings}</span>
                        </div>
                      </div>

                      {/* Action Buttons: Differentiated Hierarchy */}
                      <div className="flex flex-wrap items-center gap-4">
                        {/* Primary Action: Atölyede Pişir (Only if valid recipe exists) */}
                        {linkedRecipe && onOpenWorkshop ? (
                          <button
                            type="button"
                            onClick={() => onOpenWorkshop(linkedRecipe.id)}
                            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-sm bg-forest text-ivory text-xs font-semibold uppercase tracking-widest hover:bg-forest-600 active:scale-[0.99] transition-all shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-copper"
                          >
                            <span>Atölyede Pişir</span>
                            <ArrowRight className="w-3.5 h-3.5 text-copper-light" />
                          </button>
                        ) : null}

                        {/* Secondary Action: Hızlı Önizleme / Detay Modal */}
                        <button
                          type="button"
                          onClick={() => onSelectDish(activeDish)}
                          className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-copper ${
                            linkedRecipe
                              ? 'border border-sand bg-paper hover:bg-sand/30 text-charcoal hover:text-forest'
                              : 'bg-forest text-ivory hover:bg-forest-600 shadow-xs'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5 text-copper" />
                          <span>
                            {linkedRecipe
                              ? 'Malzeme & Tarif Önizlemesi'
                              : 'Lezzet Detaylarını İncele'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* RIGHT / EXPLORATION EDITORIAL INDEX (5 cols): Other Regional Dishes */}
              <div className="hidden lg:flex lg:col-span-5 flex-col">
                {/* Index Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-sand/60">
                  <span className="text-xs font-mono font-semibold uppercase tracking-widest text-copper-dark">
                    YÖRESEL ENVANTER LİSTESİ
                  </span>
                  <span className="text-xs font-mono text-charcoal/50">
                    {filteredDishes.findIndex((d) => d.id === activeDish.id) + 1} / {filteredDishes.length}
                  </span>
                </div>

                {/* Editorial Stacked List of Other Dishes */}
                <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1 scrollbar-thin">
                  {filteredDishes.map((dish, idx) => {
                    const isSelected = dish.id === activeDish.id;
                    const hasRecipe = Boolean(dish.recipeId && getRecipeById(dish.recipeId));

                    return (
                      <div
                        key={dish.id}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        onClick={() => setActiveDishId(dish.id)}
                        onKeyDown={(e) => handleItemKeyDown(e, dish.id)}
                        className={`group relative p-4 rounded-sm border transition-all duration-200 cursor-pointer flex items-center gap-4 ${
                          isSelected
                            ? 'bg-paper border-copper border-l-4 border-l-copper shadow-xs'
                            : 'bg-paper/40 border-sand/60 hover:border-sand hover:bg-paper/80'
                        }`}
                      >
                        {/* Number Index */}
                        <span className="font-mono text-xs text-charcoal/40 font-semibold w-5 shrink-0 text-center">
                          0{idx + 1}
                        </span>

                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-sm overflow-hidden bg-sand/20 shrink-0 relative">
                          <ImageWithFallback
                            src={dish.imageUrl}
                            alt={dish.name}
                            fallbackText={dish.name}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                          />
                        </div>

                        {/* Text info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono text-copper-dark uppercase tracking-wider font-semibold">
                              {dish.categoryLabel}
                            </span>
                            {hasRecipe && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs bg-forest/10 text-forest uppercase">
                                Tarif Var
                              </span>
                            )}
                          </div>

                          <h4 className={`text-base font-display font-bold leading-snug truncate transition-colors ${
                            isSelected ? 'text-copper-dark' : 'text-forest group-hover:text-copper'
                          }`}>
                            {dish.name}
                          </h4>

                          <p className="text-xs text-charcoal/65 font-sans line-clamp-1 mt-0.5">
                            {dish.tagline || dish.description}
                          </p>
                        </div>

                        {/* Active Selection Indicator */}
                        <div className="shrink-0 flex items-center pr-1">
                          {isSelected ? (
                            <span className="w-2 h-2 rounded-full bg-copper" title="Seçili Lezzet" />
                          ) : (
                            <span className="text-xs text-charcoal/30 group-hover:text-copper transition-colors">
                              →
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Index Guide */}
                <div className="mt-4 pt-3 border-t border-sand/40 flex items-center justify-between text-[11px] font-mono text-charcoal/50">
                  <span>← Listeden lezzet seçerek detayları inceleyebilirsiniz</span>
                  <Sparkles className="w-3.5 h-3.5 text-copper" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16 bg-paper rounded-sm border border-sand/70 p-8 max-w-lg mx-auto shadow-xs">
            <div className="w-12 h-12 rounded-full bg-sand/30 flex items-center justify-center mx-auto mb-4 text-copper">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-display font-bold text-forest mb-2">
              Bu kategoride henüz lezzet bulunmuyor
            </h4>
            <p className="text-xs sm:text-sm text-charcoal/70 leading-relaxed font-sans max-w-sm mx-auto mb-6">
              Seçilen kategori için yöresel mutfak arşivi çalışmaları devam etmektedir.
            </p>
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className="px-5 py-2.5 rounded-sm bg-forest text-ivory text-xs font-semibold uppercase tracking-wider hover:bg-forest-600 transition-colors"
            >
              Tüm Lezzetleri Göster
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
