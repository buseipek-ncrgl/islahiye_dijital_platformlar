import React, { useState, useEffect } from 'react';
import { X, Clock, Users, ChefHat, Check, BookOpen, ArrowRight } from 'lucide-react';
import { Dish, Recipe } from '../../types';
import { useContent } from '../../hooks/useContent';
import { ImageWithFallback } from '../ui/ImageWithFallback';

interface RecipePreviewModalProps {
  dish: Dish | null;
  onClose: () => void;
  onOpenInWorkshop?: (recipeId: string) => void;
}

export const RecipePreviewModal: React.FC<RecipePreviewModalProps> = ({
  dish,
  onClose,
  onOpenInWorkshop,
}) => {
  const { getRecipeById } = useContent();
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCheckedIngredients({});
  }, [dish]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (dish) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dish, onClose]);

  if (!dish) return null;

  // Single source of truth lookup from reactive contentStore
  const linkedRecipe: Recipe | undefined = dish.recipeId
    ? getRecipeById(dish.recipeId)
    : undefined;

  const toggleIngredient = (name: string) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleLaunchWorkshop = () => {
    if (linkedRecipe && onOpenInWorkshop) {
      onClose();
      onOpenInWorkshop(linkedRecipe.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-3xl bg-ivory rounded-sm shadow-2xl border border-sand overflow-hidden z-10 max-h-[90vh] flex flex-col my-auto">
        {/* Modal Top Visual Header */}
        <div className="relative h-48 sm:h-64 w-full shrink-0 overflow-hidden bg-forest">
          <ImageWithFallback
            src={dish.imageUrl}
            alt={dish.imageAlt}
            fallbackText={dish.name}
            containerClassName="w-full h-full"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-black/20" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-sm bg-charcoal/60 hover:bg-charcoal text-ivory flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-copper"
            aria-label="Tarif önizlemesini kapat"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Dish Header Overlay Info */}
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 right-14 text-ivory">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-xs bg-copper text-ivory">
                {dish.categoryLabel}
              </span>
              <span className="text-[10px] font-mono tracking-wide uppercase px-2 py-0.5 rounded-xs bg-charcoal/70 text-sand border border-sand/30">
                {dish.giStatusNote || 'Yöresel Mutfak Mirası'}
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-display font-bold leading-tight">
              {dish.name}
            </h3>
            <p className="text-xs sm:text-sm text-ivory/80 line-clamp-1 mt-0.5">
              {dish.tagline}
            </p>
          </div>
        </div>

        {/* Modal Quick Meta Bar */}
        <div className="bg-sand/30 border-b border-sand px-6 py-3.5 flex items-center justify-between gap-4 text-xs font-medium text-charcoal/80 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-copper" />
            <span>Hazırlık: {linkedRecipe ? linkedRecipe.prepTime : dish.prepTime}</span>
            <span className="mx-1 text-sand">|</span>
            <span>Pişirme: {linkedRecipe ? linkedRecipe.cookTime : dish.cookTime}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-copper" />
            <span>Porsiyon: {linkedRecipe ? `${linkedRecipe.baseServings} Kişilik` : dish.servings}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <ChefHat className="w-4 h-4 text-copper" />
            <span>Zorluk: {dish.difficulty}</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1">
          {/* Cultural Heritage Note */}
          {dish.culturalNote && (
            <div className="bg-paper p-4 rounded-sm border border-sand/70">
              <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed italic font-serif">
                "{dish.culturalNote}"
              </p>
            </div>
          )}

          {/* Ingredients Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-display font-bold text-forest">
                Gerekli Malzemeler
              </h4>
              <span className="text-[11px] text-charcoal/50 font-mono">
                (İşaretleyerek kontrol edebilirsiniz)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(linkedRecipe ? linkedRecipe.ingredients : dish.ingredients).map((ing) => {
                const isChecked = !!checkedIngredients[ing.name];
                const amountDisplay = 'fallbackDisplay' in ing ? ing.fallbackDisplay : ing.amount;

                return (
                  <button
                    key={ing.name}
                    type="button"
                    onClick={() => toggleIngredient(ing.name)}
                    className={`flex items-center justify-between p-3 rounded-sm border text-left transition-all ${
                      isChecked
                        ? 'bg-forest/5 border-forest/30 text-charcoal/50 line-through'
                        : 'bg-paper border-sand/70 hover:border-copper/50 text-charcoal'
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-medium">{ing.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-copper-dark font-semibold">
                        {amountDisplay}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-xs border flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-forest border-forest text-ivory'
                            : 'border-sand bg-ivory'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div>
            <h4 className="text-base font-display font-bold text-forest mb-4">
              Geleneksel Hazırlık Adımları
            </h4>

            <div className="space-y-4">
              {(linkedRecipe ? linkedRecipe.steps : dish.steps || []).map((step) => {
                const stepTitle: string | undefined =
                  'title' in step && typeof (step as { title?: unknown }).title === 'string'
                    ? (step as { title: string }).title
                    : undefined;
                return (
                  <div
                    key={step.stepNumber}
                    className="p-4 rounded-sm bg-paper border border-sand/70 flex items-start gap-4"
                  >
                    <div className="w-7 h-7 rounded-sm bg-forest text-ivory font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      0{step.stepNumber}
                    </div>
                    <div className="flex-1">
                      {stepTitle && (
                        <h5 className="text-sm font-bold text-forest mb-1">
                          {stepTitle}
                        </h5>
                      )}
                      <p className="text-xs sm:text-sm text-charcoal/90 leading-relaxed font-sans">
                        {step.instruction}
                      </p>
                      {step.tip && (
                        <div className="mt-2 text-[11px] sm:text-xs text-copper-dark bg-copper/10 px-3 py-1.5 rounded-xs inline-block font-medium">
                          💡 <strong>Püf Noktası:</strong> {step.tip}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-paper border-t border-sand/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-charcoal/60">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <BookOpen className="w-4 h-4 text-copper shrink-0" />
            <span>
              Tarif adımları geleneksel İslahiye mutfak envanteri ve pişirme usulleri kaynak alınarak derlenmiştir.
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {linkedRecipe && onOpenInWorkshop && (
              <button
                type="button"
                onClick={handleLaunchWorkshop}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-forest text-ivory text-xs font-semibold uppercase tracking-wider hover:bg-forest-600 transition-colors"
              >
                <span>Atölyede Pişir</span>
                <ArrowRight className="w-3.5 h-3.5 text-copper-light" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-sm border border-sand/80 hover:bg-ivory text-charcoal text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
