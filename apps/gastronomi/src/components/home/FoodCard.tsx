import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ChefHat, ArrowRight } from 'lucide-react';
import { Dish } from '../../types';
import { ImageWithFallback } from '../ui/ImageWithFallback';

interface FoodCardProps {
  dish: Dish;
  onSelectDish: (dish: Dish) => void;
  onOpenWorkshop?: (recipeId: string) => void;
  isLeadCard?: boolean;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  dish,
  onSelectDish,
  onOpenWorkshop,
  isLeadCard = false,
}) => {
  // 1. Lead Cinematic Card (Hero Dish)
  if (isLeadCard) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        transition={{ duration: 0.4 }}
        className="group relative bg-paper border border-sand/70 rounded-xl overflow-hidden hover:border-copper/40 transition-all duration-300 flex flex-col lg:flex-row lg:col-span-12 shadow-xs"
      >
        {/* Large Cinematic Photo Area */}
        <div className="relative w-full lg:w-7/12 aspect-[16/10] lg:aspect-auto overflow-hidden bg-sand/20">
          <ImageWithFallback
            src={dish.imageUrl}
            alt={dish.imageAlt}
            fallbackText={dish.name}
            containerClassName="w-full h-full"
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
          />
          {/* Very Subtle Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 via-transparent to-transparent lg:hidden" />
        </div>

        {/* Lead Content Area */}
        <div className="w-full lg:w-5/12 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-paper">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-copper-dark font-bold">
                {dish.categoryLabel}
              </span>
              <span className="text-sand">•</span>
              <span className="text-xs text-charcoal/50 font-sans font-medium">
                {dish.originNote}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-display font-bold text-forest leading-tight mb-3 group-hover:text-copper-dark transition-colors">
              {dish.name}
            </h3>

            <p className="text-sm text-charcoal/75 leading-relaxed mb-6 font-sans">
              {dish.description}
            </p>

            {dish.culturalNote && (
              <p className="text-xs text-charcoal/65 leading-relaxed italic border-l-2 border-copper/50 pl-3 mb-6 font-serif">
                "{dish.culturalNote}"
              </p>
            )}
          </div>

          {/* Lead Card Meta & Action */}
          <div>
            <div className="flex items-center gap-4 text-xs text-charcoal/65 mb-6 pt-4 border-t border-sand/40">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-copper" />
                <span>{dish.cookTime}</span>
              </div>
              <span className="text-sand">/</span>
              <div className="flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-copper" />
                <span>{dish.difficulty}</span>
              </div>
              <span className="text-sand">/</span>
              <span>{dish.servings}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onSelectDish(dish)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-forest/30 hover:bg-sand/30 text-forest text-xs font-semibold uppercase tracking-wider transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-copper cursor-pointer"
              >
                <span>Hızlı Önizleme</span>
              </button>

              {dish.recipeId && onOpenWorkshop && (
                <button
                  type="button"
                  onClick={() => onOpenWorkshop(dish.recipeId!)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest text-ivory text-xs font-semibold uppercase tracking-wider hover:bg-forest-600 transition-colors shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-copper cursor-pointer"
                >
                  <span>Atölyede Pişir</span>
                  <ArrowRight className="w-3.5 h-3.5 text-copper-light group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // 2. Refined Editorial Standard Card (Photo Centric, Calm & Minimal)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.35 }}
      className="group relative bg-paper border border-sand/60 rounded-xl overflow-hidden hover:border-copper/40 transition-all duration-300 flex flex-col justify-between shadow-xs"
    >
      {/* Photo Area (The Visual Hero) */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand/20">
        <ImageWithFallback
          src={dish.imageUrl}
          alt={dish.imageAlt}
          fallbackText={dish.name}
          containerClassName="w-full h-full"
          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-600 ease-out"
        />

        {/* Clean, Non-intrusive Category Label */}
        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-sans font-semibold tracking-wider uppercase px-2.5 py-1 rounded-md bg-ivory/95 text-forest shadow-xs">
            {dish.categoryLabel}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 sm:p-6 flex flex-col justify-between flex-1">
        <div>
          <span className="text-[10px] font-sans font-semibold tracking-wider uppercase text-charcoal/50 mb-1 block">
            {dish.originNote}
          </span>

          <h3 className="text-xl font-display font-bold text-forest leading-snug mb-2 group-hover:text-copper-dark transition-colors">
            {dish.name}
          </h3>

          <p className="text-xs sm:text-sm text-charcoal/70 leading-relaxed line-clamp-2 mb-4 font-sans">
            {dish.description}
          </p>
        </div>

        <div>
          {/* Quick Meta */}
          <div className="flex items-center justify-between text-xs text-charcoal/55 pb-3.5 mb-3.5 border-t border-sand/40 pt-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-copper" />
              {dish.cookTime}
            </span>
            <span className="text-sand">•</span>
            <span>{dish.difficulty}</span>
            <span className="text-sand">•</span>
            <span>{dish.servings}</span>
          </div>

          {/* Action Buttons */}
          {dish.recipeId && onOpenWorkshop ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSelectDish(dish)}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-sand bg-ivory/50 hover:bg-paper text-charcoal text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <span>Önizle</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenWorkshop(dish.recipeId!)}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-forest text-ivory text-xs font-semibold uppercase tracking-wider hover:bg-forest-600 transition-colors shadow-xs cursor-pointer"
              >
                <span>Atölye</span>
                <ArrowRight className="w-3 h-3 text-copper-light" />
              </button>
            </div>
          ) : dish.recipeId ? (
            <button
              type="button"
              onClick={() => onSelectDish(dish)}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-forest/25 bg-ivory/50 hover:bg-forest hover:text-ivory text-forest text-xs font-semibold uppercase tracking-wider transition-all duration-200 group/btn cursor-pointer"
            >
              <span>Tarifi İncele</span>
              <ArrowRight className="w-3.5 h-3.5 text-copper group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSelectDish(dish)}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-forest/25 bg-ivory/50 hover:bg-forest hover:text-ivory text-forest text-xs font-semibold uppercase tracking-wider transition-all duration-200 group/btn cursor-pointer"
            >
              <span>Lezzet Detayı</span>
              <ArrowRight className="w-3.5 h-3.5 text-copper group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
