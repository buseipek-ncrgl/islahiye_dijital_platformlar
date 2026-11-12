import React from 'react';
import { Dish } from '../../types';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { useContent } from '../../hooks/useContent';
import { Clock, Flame, ChefHat, Users, BookOpen, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface AtlasDetailPanelProps {
  dish: Dish | null;
  currentIndex: number;
  totalCount: number;
  onPrevDish: () => void;
  onNextDish: () => void;
  activeMode?: 'cultural' | 'geojson_boundary' | 'verified_places';
  onModeChange?: (mode: 'cultural' | 'geojson_boundary' | 'verified_places') => void;
  onOpenPreviewModal: (dish: Dish) => void;
  onOpenWorkshop?: (recipeId: string) => void;
}

export const AtlasDetailPanel: React.FC<AtlasDetailPanelProps> = ({
  dish,
  currentIndex,
  totalCount,
  onPrevDish,
  onNextDish,
  onOpenPreviewModal,
  onOpenWorkshop,
}) => {
  const { getRecipes } = useContent();
  const publishedRecipes = getRecipes(true);

  // Check if active dish has a published valid recipe (supports dish.recipeId and recipe.dishId)
  const validRecipe = dish
    ? (dish.recipeId ? publishedRecipes.find((r) => r.id === dish.recipeId) : undefined) ||
      publishedRecipes.find((r) => r.dishId === dish.id)
    : undefined;
  const hasValidRecipe = Boolean(validRecipe);

  return (
    <aside
      className="p-4 sm:p-5 lg:p-6 bg-[#fffaf1] min-w-0 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-[#dccbb3] shadow-xs"
      aria-label="Gastronomi seyahatname güncesi paneli"
    >
      <div>
        {/* ========================================================================= */}
        {/* 1. ÜST BAŞLIK & SAYFALAMA KONTROLLERİ (SEYAHATNAME GÜNCESİ 1 / 6 < >)      */}
        {/* ========================================================================= */}
        <div className="flex justify-between items-center pb-3 mb-3 border-b border-[#dfd2c0]">
          <span className="text-[#936645] text-[11px] font-bold tracking-[0.22em] font-sans uppercase">
            SEYAHATNAME GÜNCESİ {currentIndex + 1} / {totalCount}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrevDish}
              className="w-7 h-7 rounded-xs border border-[#d8c7b0] flex items-center justify-center text-[#203b31] hover:bg-[#f5ecdc] hover:border-[#ba855e] transition-colors focus:outline-none"
              aria-label="Önceki lezzet"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNextDish}
              className="w-7 h-7 rounded-xs border border-[#d8c7b0] flex items-center justify-center text-[#203b31] hover:bg-[#f5ecdc] hover:border-[#ba855e] transition-colors focus:outline-none"
              aria-label="Sonraki lezzet"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. SEÇİLİ YEMEK EDİTORYAL KARTI                                           */}
        {/* ========================================================================= */}
        {dish ? (
          <div>
            {/* Fotoğraf Alanı & Kategori Etiketi */}
            <div className="relative aspect-[16/9] max-h-[195px] w-full overflow-hidden bg-[#eee6d7] rounded-xs mb-2.5 shadow-xs border border-[#dccbb3]">
              <ImageWithFallback
                src={dish.imageUrl}
                alt={dish.imageAlt}
                fallbackText={dish.name}
                containerClassName="w-full h-full"
                className="w-full h-full object-cover block"
              />
              <span className="absolute top-2 left-2 bg-[#1b382b]/95 text-[#f5eee2] text-[10px] font-sans font-bold tracking-widest px-2 py-0.5 rounded-2xs shadow-xs uppercase">
                {dish.categoryLabel}
              </span>
            </div>

            {/* Köken Alt Başlığı */}
            <span className="block text-[#a16b48] tracking-[0.2em] text-[10px] font-bold uppercase mt-2 font-sans">
              {dish.originNote || 'İSLAHİYE TAŞ FIRIN GELENEĞİ'}
            </span>

            {/* Yemek Başlığı */}
            <h3 className="font-display text-xl sm:text-2xl lg:text-[28px] font-normal tracking-tight leading-[1.1] text-[#1b3a2d] my-1.5">
              {dish.name}
            </h3>

            {/* Anlatı & Açıklama */}
            <p className="text-[#555f55] text-xs sm:text-[13px] leading-relaxed my-0 font-sans line-clamp-3">
              {dish.description}
            </p>

            {/* Editoryal Alıntı (Pull-Quote) */}
            {dish.culturalNote && (
              <blockquote className="my-2.5 pl-2.5 border-l-2 border-[#ba855e] italic font-display text-[12.5px] sm:text-[13px] text-[#635b50] leading-snug line-clamp-2">
                "{dish.culturalNote}"
              </blockquote>
            )}

            <div className="h-px bg-[#dfd2c0] my-2.5" />

            {/* 4'lü Süre ve Zorluk Meta Satırı */}
            <div className="grid grid-cols-4 gap-1.5 py-1 text-center font-sans border-b border-[#dfd2c0] pb-2.5 mb-3">
              <div className="flex flex-col items-center">
                <Clock className="w-3.5 h-3.5 text-[#a16b48] mb-0.5" />
                <span className="text-[9px] text-[#7a7161] uppercase font-sans">Hazırlık</span>
                <strong className="text-xs text-[#203b31] font-semibold">{dish.prepTime || '20 dk'}</strong>
              </div>

              <div className="flex flex-col items-center border-l border-[#dfd2c0]">
                <Flame className="w-3.5 h-3.5 text-[#a16b48] mb-0.5" />
                <span className="text-[9px] text-[#7a7161] uppercase font-sans">Pişirme</span>
                <strong className="text-xs text-[#203b31] font-semibold">{dish.cookTime || '—'}</strong>
              </div>

              <div className="flex flex-col items-center border-l border-[#dfd2c0]">
                <ChefHat className="w-3.5 h-3.5 text-[#a16b48] mb-0.5" />
                <span className="text-[9px] text-[#7a7161] uppercase font-sans">Zorluk</span>
                <strong className="text-xs text-[#203b31] font-semibold">{dish.difficulty || 'Orta'}</strong>
              </div>

              <div className="flex flex-col items-center border-l border-[#dfd2c0]">
                <Users className="w-3.5 h-3.5 text-[#a16b48] mb-0.5" />
                <span className="text-[9px] text-[#7a7161] uppercase font-sans">Porsiyon</span>
                <strong className="text-xs text-[#203b31] font-semibold">{dish.servings || '4 Kişilik'}</strong>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 3. EYLEM BUTONLARI (Kural 7: Sahte tarif butonu gösterilmez)                */}
            {/* ========================================================================= */}
            {hasValidRecipe && validRecipe ? (
              <div className="flex flex-col sm:flex-row gap-2">
                {onOpenWorkshop && (
                  <button
                    type="button"
                    onClick={() => onOpenWorkshop(validRecipe.id)}
                    className="flex-1 bg-[#203b31] hover:bg-[#162e25] text-white py-2.5 px-3 rounded-xs text-[11px] font-bold tracking-[0.08em] uppercase transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Atölyede Pişir</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onOpenPreviewModal(dish)}
                  className="flex-1 border border-[#c2b099] text-[#203b31] hover:bg-[#f6efe4] hover:border-[#a16b48] py-2.5 px-3 rounded-xs text-[11px] font-bold tracking-[0.08em] uppercase transition-colors flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#a16b48]" />
                  <span>Tarifi İncele</span>
                </button>
              </div>
            ) : (
              <div className="p-2.5 bg-[#f6eee2] border border-[#dccbb3] rounded-xs text-[11px] text-[#726a5c] leading-relaxed font-sans">
                {dish.id === 'islahiye-biberi' && dish.isRegisteredGeographicalIndication ? (
                  <p>
                    <strong className="text-[#203b31] font-semibold block mb-0.5">Tescilli Yöresel Değer (Tescil No: 991)</strong>
                    İslahiye Biberi tescilli bir tarımsal hammadde mirasıdır; müstakil bir pişirme tarifi içermez.
                  </p>
                ) : (
                  <p>
                    Bu kayıt kültürel mutfak mirası anlatımıdır; henüz yayımlanmış atölye tarifi bulunmamaktadır.
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-[#786f62]">
            İncelemek için haritadan veya alt şeritten bir lezzet seçin.
          </div>
        )}
      </div>

      {/* Alt Uyarı Notu */}
      <div className="text-[10px] text-[#8e7b68] leading-snug pt-2.5 mt-2.5 border-t border-[#dfd2c0] font-sans">
        * Seyahatnamedeki lezzet düğümleri kültürel keşif öğeleridir; harita üzerinde kesin GPS noktası oluşturmaz.
      </div>
    </aside>

  );
};
