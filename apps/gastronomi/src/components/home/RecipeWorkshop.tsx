import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  ChefHat,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Users,
  UtensilsCrossed,
  Flame,
  Leaf,
  Wheat,
  Droplets,
  Search,
} from 'lucide-react';
import { Recipe, formatIngredientAmount } from '../../types';
import { useContent } from '../../hooks/useContent';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { gastronomyApiClient, ScaledRecipeResponse } from '../../services/api/gastronomyApiClient';

interface RecipeWorkshopProps {
  initialRecipeId?: string;
}

type MobileTab = 'ingredients' | 'steps';

export const RecipeWorkshop: React.FC<RecipeWorkshopProps> = ({
  initialRecipeId = 'recipe-islahiye-tava',
}) => {
  const { getRecipes, getDishes, getCategories } = useContent();
  const allRecipes = getRecipes();
  const allDishes = getDishes();
  const dishCategories = getCategories('dish', true);
  // Filter for active published recipes (Visitor Portal strict parity)
  const publishedRecipes = useMemo(() => {
    return allRecipes.filter(
      (r) => (!r.publicationStatus || r.publicationStatus === 'published')
    );
  }, [allRecipes]);

  const workshopCategories = useMemo(
    () => [
      { key: 'all', label: 'Tümü' },
      ...dishCategories.map((c) => ({
        key: c.id,
        label: c.shortLabel || c.label,
      })),
    ],
    [dishCategories]
  );

  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipeCategory, setRecipeCategory] = useState<string>('all');

  useEffect(() => {
    if (recipeCategory !== 'all' && !dishCategories.some((c) => c.id === recipeCategory)) {
      setRecipeCategory('all');
    }
  }, [recipeCategory, dishCategories]);

  const matchesCategory = (r: Recipe, cat: string) => {
    if (cat === 'all') return true;
    const dish = allDishes.find((d) => d.id === r.dishId || d.recipeId === r.id);
    const effectiveCategory = dish?.category || r.dishCategory || 'main';
    return effectiveCategory === cat;
  };

  // Filtered recipes for navigation sidebar
  const filteredRecipes = useMemo(() => {
    return publishedRecipes.filter((r) => {
      // 1. Category filter
      if (!matchesCategory(r, recipeCategory)) return false;
      // 2. Search query (supports Turkish case-insensitivity)
      if (recipeSearch.trim()) {
        const q = recipeSearch.toLocaleLowerCase('tr-TR').trim();
        const matchTitle = r.title.toLocaleLowerCase('tr-TR').includes(q);
        const matchSubtitle = (r.subtitle || '').toLocaleLowerCase('tr-TR').includes(q);
        const matchNotes = (r.notes || '').toLocaleLowerCase('tr-TR').includes(q);
        const matchIngredient = r.ingredients.some((ing) => ing.name.toLocaleLowerCase('tr-TR').includes(q));
        if (!matchTitle && !matchSubtitle && !matchNotes && !matchIngredient) return false;
      }
      return true;
    });
  }, [publishedRecipes, recipeCategory, recipeSearch, allDishes]);

  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(initialRecipeId);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [servings, setServings] = useState<number>(4);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('ingredients');
  const [showFullChecklist, setShowFullChecklist] = useState<boolean>(false);
  const [apiScaledRecipe, setApiScaledRecipe] = useState<ScaledRecipeResponse | null>(null);

  // Sync ONLY when initialRecipeId prop genuinely changes from the outside parent
  const lastInitialPropRef = React.useRef<string>(initialRecipeId);
  useEffect(() => {
    if (initialRecipeId && initialRecipeId !== lastInitialPropRef.current) {
      lastInitialPropRef.current = initialRecipeId;
      setSelectedRecipeId(initialRecipeId);
      setCurrentStepIndex(0);
      const r = publishedRecipes.find((rec) => rec.id === initialRecipeId || rec.dishId === initialRecipeId);
      if (r?.baseServings) {
        setServings(r.baseServings);
      }
      setCheckedIngredients({});
      setCompletedSteps({});
      setIsCompleted(false);
      setMobileTab('ingredients');
      setShowFullChecklist(false);
    }
  }, [initialRecipeId, publishedRecipes]);

  // Active recipe object
  const currentRecipe: Recipe | undefined = useMemo(() => {
    return (
      publishedRecipes.find((r) => r.id === selectedRecipeId || r.dishId === selectedRecipeId) ||
      filteredRecipes[0] ||
      publishedRecipes[0]
    );
  }, [publishedRecipes, selectedRecipeId, filteredRecipes]);

  // Ensure initial servings matches recipe baseServings if available
  useEffect(() => {
    if (currentRecipe?.baseServings) {
      setServings(currentRecipe.baseServings);
    }
  }, [currentRecipe?.id]);

  // Dynamic backend scaling calculation from ASP.NET Core API
  useEffect(() => {
    setApiScaledRecipe(null);
    if (!currentRecipe) return;
    let isCurrent = true;
    gastronomyApiClient.getScaledRecipe(currentRecipe.id, servings).then((scaled) => {
      if (isCurrent && scaled && scaled.id === currentRecipe.id) {
        setApiScaledRecipe(scaled);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [currentRecipe?.id, servings]);

  // Formatter that prefers backend-calculated amounts with local fallback
  const getIngredientFormatted = (ing: any) => {
    if (apiScaledRecipe && apiScaledRecipe.ingredients && apiScaledRecipe.id === currentRecipe?.id) {
      const found = apiScaledRecipe.ingredients.find(
        (i) => i.name.toLocaleLowerCase('tr-TR') === ing.name.toLocaleLowerCase('tr-TR') || i.id === ing.id
      );
      if (found && found.formattedAmount) {
        return found.formattedAmount;
      }
    }
    return formatIngredientAmount(ing, servings, currentRecipe?.baseServings || 4);
  };

  // Switch recipe cleanly with complete session reset
  const handleSelectRecipe = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    setApiScaledRecipe(null);
    setCurrentStepIndex(0);
    const r = publishedRecipes.find((rec) => rec.id === recipeId || rec.dishId === recipeId);
    setServings(r?.baseServings || 4);
    setCheckedIngredients({});
    setCompletedSteps({});
    setIsCompleted(false);
    setMobileTab('ingredients');
    setShowFullChecklist(false);
  };

  const handleCategoryChange = (nextCategory: string) => {
    setRecipeCategory(nextCategory);
    if (nextCategory !== 'all' && currentRecipe && !matchesCategory(currentRecipe, nextCategory)) {
      const nextFirst = publishedRecipes.find((r) => matchesCategory(r, nextCategory));
      if (nextFirst) {
        handleSelectRecipe(nextFirst.id);
      }
    }
  };

  // Toggle ingredient checkbox
  const toggleIngredient = (id: string) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Toggle all ingredients
  const toggleAllIngredients = () => {
    if (!currentRecipe) return;
    const allChecked = currentRecipe.ingredients.every((ing) => checkedIngredients[ing.id]);
    if (allChecked) {
      setCheckedIngredients({});
    } else {
      const nextChecked: Record<string, boolean> = {};
      currentRecipe.ingredients.forEach((ing) => {
        nextChecked[ing.id] = true;
      });
      setCheckedIngredients(nextChecked);
    }
  };

  // Step advancement & real completion tracking
  const handleCompleteCurrentStepAndNext = () => {
    if (!currentRecipe) return;
    const total = currentRecipe.steps.length;

    setCompletedSteps((prev) => ({
      ...prev,
      [currentStepIndex]: true,
    }));

    if (currentStepIndex < total - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      setIsCompleted(false);
    }
  };

  // Reset entire recipe session
  const handleResetSession = () => {
    setCurrentStepIndex(0);
    setCheckedIngredients({});
    setCompletedSteps({});
    setIsCompleted(false);
    setShowFullChecklist(false);
  };

  if (!currentRecipe) {
    return (
      <section id="tarif-atolyesi" className="py-20 bg-ivory border-t border-sand/70">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-charcoal/60 font-sans text-sm">
            Şu anda yayında olan tarif bulunmamaktadır.
          </p>
        </div>
      </section>
    );
  }

  const totalSteps = currentRecipe.steps.length;
  const safeStepIndex = totalSteps > 0 ? Math.min(currentStepIndex, totalSteps - 1) : 0;
  const currentStep = totalSteps > 0 ? currentRecipe.steps[safeStepIndex] : undefined;
  const checkedIngredientsCount = Object.values(checkedIngredients).filter(Boolean).length;
  const navigationRecipes = filteredRecipes.length > 0 ? filteredRecipes : publishedRecipes;
  const currentNavIndex = navigationRecipes.findIndex((r) => r.id === currentRecipe.id);
  const safeNavIndex = currentNavIndex >= 0 ? currentNavIndex : 0;

  // Authentic cooking step media resolver
  const getStepMedia = () => {
    if (!currentStep) return null;
    // 1. Direct step image from CMS
    if (currentStep.imageUrl) {
      return {
        url: currentStep.imageUrl,
        alt: currentStep.title,
        caption: currentStep.title,
        isCustom: true,
      };
    }

    const titleLower = (currentStep.title || '').toLocaleLowerCase('tr-TR');
    const instructionLower = (currentStep.instruction || '').toLocaleLowerCase('tr-TR');
    const recipeTitleLower = (currentRecipe.title || '').toLocaleLowerCase('tr-TR');

    // 2. Sautéing / meat browning in skillet
    if (
      titleLower.includes('tavada') ||
      titleLower.includes('kavur') ||
      titleLower.includes('mühürle') ||
      titleLower.includes('hazırla') ||
      instructionLower.includes('tavada') ||
      instructionLower.includes('kavur') ||
      instructionLower.includes('mühürle') ||
      instructionLower.includes('bakır tepsi')
    ) {
      return {
        url: '/images/recipe_step_skillet.jpg',
        alt: 'Et ve sebzelerin tavada kavrulması',
        caption: 'Kuşbaşı et, sarımsak ve biberlerin tavada mühürlenmesi',
        isCustom: false,
      };
    }

    // 3. Final presentation step
    if (safeStepIndex === totalSteps - 1 && currentRecipe.imageUrl) {
      return {
        url: currentRecipe.imageUrl,
        alt: `${currentRecipe.title} Sunumu`,
        caption: `${currentRecipe.title} — Servis Sunumu`,
        isCustom: false,
      };
    }

    // 4. Pastry dough preparation
    const isPastry =
      recipeTitleLower.includes('semse') ||
      recipeTitleLower.includes('börek') ||
      recipeTitleLower.includes('kömbe') ||
      recipeTitleLower.includes('katmer');

    if (
      isPastry &&
      (titleLower.includes('hamur') ||
        instructionLower.includes('hamur yoğrul') ||
        instructionLower.includes('un, tuz ve ılık su'))
    ) {
      return {
        url: '/images/hamur_zanaati_poster.jpg',
        alt: 'Geleneksel hamur yoğurma zanaatı',
        caption: 'Geleneksel Hamur Yoğurma ve Tezgâh Hazırlığı',
        isCustom: false,
      };
    }

    // 5. Pepper roasting
    if (
      (titleLower.includes('köz') || instructionLower.includes('közleme')) &&
      (instructionLower.includes('biber') || titleLower.includes('biber'))
    ) {
      return {
        url: '/images/biber_kozleme_poster.jpg',
        alt: 'Közde biber hazırlığı',
        caption: 'Odun Közünde Biber Hazırlığı',
        isCustom: false,
      };
    }

    // 6. Stone oven baking
    if (
      (titleLower.includes('taş fırın') ||
        instructionLower.includes('taş fırın') ||
        instructionLower.includes('meşe köz') ||
        instructionLower.includes('odun ateşi')) &&
      (instructionLower.includes('pişir') || instructionLower.includes('demlen'))
    ) {
      return {
        url: '/images/tas_firin_kozu_poster.jpg',
        alt: 'Taş fırın ve odun közü atmosferi',
        caption: 'Asırlık Taş Fırın Meşe Közünde Ağır Pişirme',
        isCustom: false,
      };
    }

    return null;
  };

  const stepMedia = getStepMedia();

  // Helper icons for step ingredients (Refined Lucide icons, NO emojis)
  const renderIngredientIcon = (name: string) => {
    const n = name.toLocaleLowerCase('tr-TR');
    if (n.includes('et') || n.includes('kuzu') || n.includes('dana') || n.includes('kuşbaşı') || n.includes('kıyma')) {
      return <UtensilsCrossed className="w-3.5 h-3.5 text-copper-dark" />;
    }
    if (n.includes('biber') || n.includes('pul') || n.includes('baharat') || n.includes('tuz') || n.includes('karabiber')) {
      return <Flame className="w-3.5 h-3.5 text-copper" />;
    }
    if (n.includes('yağ') || n.includes('zeytinyağ') || n.includes('tereyağ') || n.includes('sıvı')) {
      return <Droplets className="w-3.5 h-3.5 text-copper" />;
    }
    if (n.includes('bulgur') || n.includes('firik') || n.includes('buğday') || n.includes('un')) {
      return <Wheat className="w-3.5 h-3.5 text-copper-dark" />;
    }
    if (n.includes('sarımsak') || n.includes('domates') || n.includes('soğan') || n.includes('patlıcan') || n.includes('sebze')) {
      return <Leaf className="w-3.5 h-3.5 text-forest" />;
    }
    return <UtensilsCrossed className="w-3.5 h-3.5 text-copper/80" />;
  };

  return (
    <section id="tarif-atolyesi" className="pt-16 pb-14 md:pt-20 md:pb-20 scroll-mt-28 lg:scroll-mt-32 bg-ivory border-t border-sand/60 relative">
      {/* ============================================================== */}
      {/* ARKA PLAN GRAVÜRLERİ & ŞEMA (Amanos Dağı ve Zeytin Dalı Motifi) */}
      {/* Kutulama olmadan doğrudan sahne arkasında, Hero tarzı şema     */}
      {/* ============================================================== */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0" aria-hidden="true">
        {/* Amanos Dağ Silueti */}
        <img
          src="/images/mountain_landscape_clean.png"
          alt=""
          className="absolute top-4 left-1/2 -translate-x-[42%] w-[860px] max-w-none opacity-20"
        />
        {/* Sol Üst Zeytin Dalı */}
        <img
          src="/motifs/ribbon_olive_flourish.png"
          alt=""
          className="absolute top-12 left-4 w-48 opacity-25"
        />
        {/* Sağ Alt Zeytin Dalı */}
        <img
          src="/motifs/ribbon_olive_flourish.png"
          alt=""
          className="absolute bottom-6 right-6 w-56 opacity-20 rotate-180 scale-x-[-1]"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ============================================================== */}
        {/* 1. EDİTORYAL BÖLÜM BAŞLIĞI (03 / TARİF ATÖLYESİ HİYERARŞİSİ)  */}
        {/* ============================================================== */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-8 h-px bg-copper" />
              <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-copper-dark font-bold">
                03 / TARİF ATÖLYESİ &amp; PİŞİRME GÜNCESİ
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-forest leading-tight">
              Tarif Atölyesi
            </h2>

            <p className="text-sm sm:text-base text-charcoal/75 mt-3 max-w-2xl font-sans leading-relaxed">
              İslahiye'nin asırlık reçetelerini adım adım keşfedin. Taş fırın ustalarının püf noktaları,
              ölçeklenebilir malzeme gramajları ve geleneksel pişirme aşamalarıyla açık gastronomi güncesi.
            </p>
          </div>

          {/* Sağ Editoryal Alıntı (Emojisiz, rafine editoryal tipografi) */}
          <div className="hidden lg:block text-right max-w-sm">
            <p className="font-display italic text-lg text-copper-dark leading-snug">
              “Her tarif, bu toprakların hafızasından sofralarımıza uzanan bir hikâyedir.”
            </p>
            <div className="flex items-center justify-end gap-2 mt-2">
              <span className="w-6 h-px bg-copper/50" />
              <UtensilsCrossed className="w-3.5 h-3.5 text-copper/70" />
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. MASAÜSTÜ: AÇIK KİTAP SAHNESİ (KUTULAMA OLMADAN, DERİN GÖLGE) */}
        {/* ============================================================== */}
        <div className="hidden lg:grid grid-cols-[230px_1fr] xl:grid-cols-[250px_1fr] gap-7 items-start relative z-10">
          
          {/* ------------------------------------------------------------ */}
          {/* A. SOL POPÜLER TARİFLER KARTI (Parchment Bookmark Flap)      */}
          {/* ------------------------------------------------------------ */}
          <aside
            className="p-4 rounded-xs border border-[#DCCAB2]/70 flex flex-col justify-between min-h-[640px] max-h-[760px] bg-cover bg-center transition-all shadow-md relative z-20"
            style={{
              backgroundImage: "url('/images/recipe_sidebar_card_bg.png')",
              filter: 'drop-shadow(0 10px 18px rgba(32, 28, 24, 0.12))',
            }}
          >
            <div className="flex flex-col min-h-0 flex-1">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-dashed border-[#DCCAB2]/80">
                <div className="flex items-center gap-1.5 font-display text-base font-bold text-[#203B31]">
                  <ChefHat className="w-4 h-4 text-[#BA855E]" />
                  <span>Yöresel Tarifler</span>
                </div>
                <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded-full bg-[#BA855E]/15 text-[#936645]">
                  {publishedRecipes.length} Tarif
                </span>
              </div>

              {/* Arama Alanı */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-[#BA855E] absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  placeholder="Tarif veya malzeme ara..."
                  className="w-full pl-7 pr-5 py-1 text-xs bg-[#FFFDF8]/85 border border-[#DCCAB2] rounded-xs font-sans text-[#203B31] placeholder-[#936645]/60 focus:outline-none focus:border-[#BA855E] transition-colors"
                />
                {recipeSearch && (
                  <button
                    type="button"
                    onClick={() => setRecipeSearch('')}
                    aria-label="Aramayı temizle"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-[#936645] hover:text-[#203B31]"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Kategori Filtre Butonları */}
              <div className="flex flex-wrap gap-1 mb-2 pb-1.5 border-b border-dashed border-[#DCCAB2]/60 text-[9.5px] font-sans">
                {workshopCategories.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => handleCategoryChange(cat.key)}
                    className={`px-1.5 py-0.5 rounded-2xs font-semibold transition-all cursor-pointer ${
                      recipeCategory === cat.key
                        ? 'bg-[#203B31] text-[#FFF9EE] shadow-2xs'
                        : 'bg-[#EDE4D0]/60 text-[#555f55] hover:bg-[#FFF9EE]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Kaydırılabilir Tarif Listesi (Tüm 30 Tarif Eksiksiz Listelenir) */}
              <ul className="space-y-1.5 overflow-y-auto max-h-[460px] pr-1 scrollbar-thin scrollbar-thumb-[#BA855E]/40 flex-1">
                {filteredRecipes.length === 0 ? (
                  <li className="py-6 text-center text-xs text-[#786a59] font-sans">
                    Aramanıza uygun tarif bulunamadı.
                  </li>
                ) : (
                  filteredRecipes.map((recipe) => {
                    const isActive = recipe.id === currentRecipe.id;
                    return (
                      <li key={recipe.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectRecipe(recipe.id)}
                          className={`w-full flex items-center gap-2 p-1.5 rounded-xs transition-all text-left cursor-pointer border ${
                            isActive
                              ? 'bg-[#FFF9EE] border-[#BA855E] shadow-xs'
                              : 'bg-[#EDE4D0]/35 border-transparent hover:bg-[#FFF9EE]/70 hover:border-[#BA855E]/40'
                          }`}
                        >
                          <img
                            src={recipe.imageUrl || '/images/islahiye_tava.jpg'}
                            alt={recipe.title}
                            className="w-10 h-10 rounded-xs object-cover shrink-0 border border-[#BA855E]/40"
                          />
                          <div className="flex-1 min-w-0 pr-1">
                            <div className="flex items-center gap-1">
                              <h4 className="font-display font-bold text-[12px] text-[#203B31] leading-snug line-clamp-1">
                                {recipe.title}
                              </h4>
                              {(recipe.id.includes('custom') || recipe.id.includes('dish-') || recipe.publicationStatus === 'draft') && (
                                <span className="text-[8px] font-sans font-bold px-1 py-0.2 rounded bg-[#BA855E]/20 text-[#936645] shrink-0">
                                  Yeni
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#936645] font-sans flex items-center gap-1.5 mt-0.5">
                              <span>{recipe.prepTime}</span>
                              <span>•</span>
                              <span>{recipe.difficulty}</span>
                            </span>
                          </div>
                          <span className={`text-xs ${isActive ? 'text-[#BA855E] font-bold translate-x-0.5' : 'text-[#BA855E]/30'} transition-transform`}>
                            ›
                          </span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

            {/* Bottom Link */}
            <div className="pt-2 mt-2 border-t border-dashed border-[#DCCAB2]/70 flex items-center justify-between">
              <span className="text-[10px] text-[#786a59] font-sans">
                {navigationRecipes.length > 0 ? safeNavIndex + 1 : 0} / {navigationRecipes.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (navigationRecipes.length === 0) return;
                  const nextIndex =
                    currentNavIndex >= 0 ? (currentNavIndex + 1) % navigationRecipes.length : 0;
                  handleSelectRecipe(navigationRecipes[nextIndex].id);
                }}
                className="inline-flex items-center gap-1.5 font-display text-xs font-bold text-[#936645] hover:text-[#203B31] underline cursor-pointer transition-colors"
              >
                <span>Sıradaki Tarif</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </aside>

          {/* ------------------------------------------------------------ */}
          {/* B. MERKEZ: AÇIK KİTAP (PRISTINE OPEN COOKBOOK STAGE)          */}
          {/* Kesilmemiş doğal gölgeler ve orantılı iç sayfa tasarımı       */}
          {/* ------------------------------------------------------------ */}
          <section
            className="grid grid-cols-2 min-h-[640px] bg-cover bg-center select-text relative z-10"
            style={{
              backgroundImage: "url('/images/recipe_book_isolated_shell.png')",
              filter: 'drop-shadow(0 20px 30px rgba(32, 28, 24, 0.18)) drop-shadow(0 4px 10px rgba(32, 28, 24, 0.1))',
            }}
          >
            {/* ======================================================== */}
            {/* SOL SAYFA: BÜYÜK YEMEK FOTOĞRAFI, ANLATI & PORSİYON     */}
            {/* ======================================================== */}
            <article className="p-7 pl-12 pr-7 flex flex-col justify-between relative z-10">
              <div>
                {/* Large Cooked Food Photo in Pan */}
                <div className="w-full h-[185px] rounded-xs overflow-hidden border border-[#BA855E]/40 shadow-xs mb-3 bg-sand/20">
                  <ImageWithFallback
                    src={currentRecipe.imageUrl || '/images/islahiye_tava.jpg'}
                    alt={currentRecipe.title}
                    fallbackText={currentRecipe.title}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover object-[center_36%]"
                  />
                </div>

                {/* Recipe Display Title */}
                <h3 className="font-display font-bold text-2xl xl:text-[26px] text-[#203B31] leading-tight mb-1.5 tracking-tight">
                  {currentRecipe.title}
                </h3>

                {/* Cultural Monograph Narrative */}
                <p className="font-sans text-xs text-[#242724]/80 leading-relaxed mb-3 line-clamp-3">
                  {currentRecipe.subtitle ||
                    'Amanos yaylalarının meşe közü, kırmızı biberin kokusu ve doğal malzemelerin uyumuyla şekillenen İslahiye mutfağının en özel lezzetlerinden biridir. Taş fırınlarda ağır ağır pişen bu yemek, yörenin bereketini ve misafirperverliğini sofralara taşır.'}
                </p>

                {/* 3-Cell Metadata Strip (Doğal Kitap Tipografisi, Beyaz Kutu Olmadan) */}
                <div className="grid grid-cols-3 gap-2 py-2.5 my-3 border-y border-[#BA855E]/30 text-xs">
                  <div className="flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-[#BA855E] shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-sans text-[8.5px] uppercase tracking-wider text-[#936645] font-semibold">
                        Hazırlık
                      </span>
                      <span className="font-bold text-[#203B31] text-[11.5px]">
                        {currentRecipe.prepTime}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 border-l border-[#BA855E]/25 pl-2.5">
                    <Clock className="w-3.5 h-3.5 text-[#BA855E] shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-sans text-[8.5px] uppercase tracking-wider text-[#936645] font-semibold">
                        Pişirme
                      </span>
                      <span className="font-bold text-[#203B31] text-[11.5px]">
                        {currentRecipe.cookTime}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 border-l border-[#BA855E]/25 pl-2.5">
                    <Users className="w-3.5 h-3.5 text-[#BA855E] shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-sans text-[8.5px] uppercase tracking-wider text-[#936645] font-semibold">
                        Porsiyon
                      </span>
                      <span className="font-bold text-[#203B31] text-[11.5px]">
                        {servings} Kişilik
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Portion Selector at Bottom (Zarif Dairesel Mühür Butonları, Beyaz Plastik Kutu Yok) */}
              <div className="pt-2.5 border-t border-[#BA855E]/30 relative z-20">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-sans text-[10px] uppercase tracking-wider text-[#936645] font-bold">
                    Porsiyon Seçimi
                  </span>
                  <span className="font-sans text-[9px] text-[#786a59]">
                    (Kişi başı gramajlar güncellenir)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {[2, 4, 6, 8].map((p) => {
                    const isSelected = servings === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setServings(p)}
                        className={`w-8 h-8 rounded-full font-sans font-bold text-xs transition-all cursor-pointer border flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#203B31] text-[#F6F2E9] border-[#203B31] shadow-xs ring-2 ring-[#BA855E]/40 scale-105'
                            : 'bg-[#EDE4D0]/40 text-[#203B31] border-[#BA855E]/35 hover:bg-[#EDE4D0]/80 hover:border-[#BA855E]'
                        }`}
                        title={`${p} Kişilik Porsiyona Göre Hesapla`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </article>

            {/* ======================================================== */}
            {/* SAĞ SAYFA: PİŞİRME ADIMI, RESİM, NOT & MALZEMELER       */}
            {/* ======================================================== */}
            <article className="pt-7 pl-7 pr-16 xl:pr-20 pb-14 xl:pb-16 flex flex-col justify-between relative z-10">
              {!isCompleted ? (
                <>
                  {currentStep ? (
                    <div>
                      {/* Stepper Header (Adım X / Y + Noktalar + Butonlar) */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DCCAB2]/50">
                        <div className="flex items-center gap-3">
                          <span className="font-sans text-[10px] uppercase tracking-wider text-[#936645] font-bold">
                            Adım {safeStepIndex + 1} / {totalSteps}
                          </span>

                          {/* Connected Stepper Dots */}
                          <div className="flex items-center gap-1">
                            {currentRecipe.steps.map((_, idx) => {
                              const isCurrent = idx === safeStepIndex;
                              const isDone = !!completedSteps[idx];
                              return (
                                <React.Fragment key={idx}>
                                  <div
                                    className={`rounded-full transition-all ${
                                      isCurrent
                                        ? 'w-2.5 h-2.5 bg-[#203B31] ring-2 ring-[#203B31]/20'
                                        : isDone
                                        ? 'w-2 h-2 bg-[#BA855E]'
                                        : 'w-1.5 h-1.5 bg-[#DCCAB2]'
                                    }`}
                                  />
                                  {idx < totalSteps - 1 && (
                                    <div className="w-2 h-px bg-[#DCCAB2]" />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>

                        {/* Dairesel Navigasyon Butonları (Parşömenle Bütünleşik) */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handlePrevStep}
                            disabled={safeStepIndex === 0}
                            title="Önceki Adım"
                            className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs transition-all cursor-pointer ${
                              safeStepIndex === 0
                                ? 'border-[#BA855E]/20 text-[#242724]/30 cursor-not-allowed'
                                : 'border-[#BA855E]/50 bg-[#EDE4D0]/50 text-[#203B31] hover:bg-[#203B31] hover:text-[#F6F2E9]'
                            }`}
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={handleCompleteCurrentStepAndNext}
                            title="Sonraki Adım"
                            className="w-7 h-7 rounded-full border border-[#BA855E]/60 bg-[#EDE4D0]/60 text-[#203B31] hover:bg-[#203B31] hover:text-[#F6F2E9] flex items-center justify-center text-xs transition-all cursor-pointer shadow-2xs"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Step Title & Instruction */}
                      <h4 className="font-display font-bold text-xl xl:text-[22px] text-[#203B31] leading-tight mb-1">
                        {currentStep.title}
                      </h4>

                      <p className="font-sans text-xs xl:text-[13px] text-[#242724]/85 leading-relaxed mb-2.5 line-clamp-3">
                        {currentStep.instruction}
                      </p>

                      {/* Step Photo */}
                      {stepMedia && (
                        <div className="w-full h-[145px] rounded-xs overflow-hidden border border-[#BA855E]/40 shadow-xs mb-2.5 bg-sand/20">
                          <ImageWithFallback
                            src={stepMedia.url}
                            alt={stepMedia.alt}
                            fallbackText={stepMedia.alt}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Chef Tip Box (Ustanın Notu - Parşömen Üstü Doğal İntikal) */}
                      {currentStep.tip && (
                        <div className="flex items-start gap-2.5 py-2 px-3 bg-[#BA855E]/8 border-l-2 border-[#BA855E] rounded-2xs mb-2.5 text-xs leading-relaxed">
                          <ChefHat className="w-3.5 h-3.5 text-[#BA855E] shrink-0 mt-0.5" />
                          <div>
                            <div className="font-sans text-[9px] uppercase tracking-wider text-[#936645] font-bold">
                              Ustanın Notu
                            </div>
                            <p className="font-serif italic text-xs text-[#242724]/90 leading-snug">
                              “{currentStep.tip}”
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-xs text-[#786a59] font-sans">
                      Bu tarif için tanımlanmış pişirme adımı bulunmamaktadır.
                    </div>
                  )}

                  {/* Bu Adımda Kullanılan Malzemeler (Temiz İkonlu Kartlar, Emojisiz) */}
                  <div className="pt-2 border-t border-[#DCCAB2]/50 pr-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="font-sans text-[9px] uppercase tracking-wider text-[#936645] font-bold">
                        Bu Adımda Kullanılan Malzemeler
                      </span>
                      <div className="flex items-center gap-2">
                        {showFullChecklist && (
                          <button
                            type="button"
                            onClick={toggleAllIngredients}
                            className="font-sans text-[9px] uppercase text-[#BA855E] hover:text-[#203B31] font-semibold cursor-pointer"
                          >
                            {checkedIngredientsCount === currentRecipe.ingredients.length
                              ? 'Temizle'
                              : 'Tümünü Seç'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowFullChecklist(!showFullChecklist)}
                          className="font-sans text-[9px] uppercase text-[#936645] hover:text-[#203B31] underline font-semibold cursor-pointer"
                        >
                          {showFullChecklist
                            ? 'Kartlara Dön'
                            : `Reçete Listesi (${checkedIngredientsCount}/${currentRecipe.ingredients.length})`}
                        </button>
                      </div>
                    </div>

                    {!showFullChecklist ? (
                      /* Mini 5-Card Grid with Lucide Icons (Parşömene İşlenmiş Doğal Kartlar) */
                      <div className="grid grid-cols-5 gap-1.5">
                        {currentRecipe.ingredients.slice(0, 5).map((ing) => {
                          const formattedAmount = getIngredientFormatted(ing);
                          const isChecked = !!checkedIngredients[ing.id];
                          return (
                            <button
                              key={ing.id}
                              type="button"
                              onClick={() => toggleIngredient(ing.id)}
                              className={`p-1.5 rounded-xs border text-center flex flex-col items-center justify-between min-h-[58px] transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-[#203B31]/10 border-[#203B31]/30 opacity-55 line-through'
                                  : 'bg-[#EDE4D0]/30 border-[#BA855E]/30 hover:bg-[#EDE4D0]/60 hover:border-[#BA855E]'
                              }`}
                            >
                              <div className="mb-0.5">
                                {renderIngredientIcon(ing.name)}
                              </div>
                              <span
                                className="font-sans text-[9px] sm:text-[9.5px] font-bold text-[#203B31] leading-tight line-clamp-2 w-full text-center px-0.5 min-h-[22px] flex items-center justify-center break-words"
                                title={ing.name}
                              >
                                {ing.name}
                              </span>
                              <span className="font-sans text-[8.5px] font-bold text-[#936645] bg-[#BA855E]/10 px-1 rounded-2xs">
                                {formattedAmount}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      /* Expanded Checklist View */
                      <div className="space-y-1 max-h-[110px] overflow-y-auto pr-1">
                        {currentRecipe.ingredients.map((ing) => {
                          const isChecked = !!checkedIngredients[ing.id];
                          const formattedAmount = getIngredientFormatted(ing);
                          return (
                            <button
                              key={ing.id}
                              type="button"
                              onClick={() => toggleIngredient(ing.id)}
                              className={`w-full flex items-center justify-between p-1 px-2 rounded-xs border text-xs cursor-pointer ${
                                isChecked
                                  ? 'bg-[#203B31]/10 border-[#203B31]/20 line-through text-[#242724]/40'
                                  : 'bg-[#EDE4D0]/30 border-[#BA855E]/30 text-[#242724] hover:bg-[#EDE4D0]/60'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center text-[9px] ${isChecked ? 'bg-[#203B31] text-white border-[#203B31]' : 'border-[#BA855E]'}`}>
                                  {isChecked && '✓'}
                                </span>
                                <span>{ing.name}</span>
                              </div>
                              <span className="font-sans text-[10px] font-bold text-[#936645]">
                                {formattedAmount}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* ======================================================== */
                /* PİŞİRME TAMAMLANDI EKRANI (Afiyet Olsun)                  */
                /* ======================================================== */
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col justify-between h-full py-4 text-center"
                >
                  <div>
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#BA855E]/15 flex items-center justify-center text-[#BA855E] mb-3">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>

                    <span className="font-sans text-[10px] uppercase tracking-widest text-[#936645] font-bold">
                      PİŞİRME TAMAMLANDI
                    </span>

                    <h4 className="font-display font-bold text-2xl xl:text-3xl text-[#203B31] mt-1 mb-2">
                      Afiyet Olsun!
                    </h4>

                    <p className="font-sans text-xs text-[#242724]/80 max-w-sm mx-auto leading-relaxed mb-4">
                      {currentRecipe.title} tarifini İslahiye mutfak usullerine uygun olarak tamamladınız.
                    </p>
                  </div>

                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleResetSession}
                      className="px-4 py-2 rounded-xs border border-[#BA855E] text-[#203B31] text-xs font-bold uppercase tracking-wider hover:bg-[#203B31] hover:text-[#F6F2E9] transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Baştan Başla</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (navigationRecipes.length === 0) return;
                        const nextIndex =
                          currentNavIndex >= 0 ? (currentNavIndex + 1) % navigationRecipes.length : 0;
                        handleSelectRecipe(navigationRecipes[nextIndex].id);
                      }}
                      className="px-5 py-2 rounded-xs bg-[#203B31] text-[#F6F2E9] text-xs font-bold uppercase tracking-wider hover:bg-[#162721] transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Sıradaki Tarifi Keşfet</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </article>
          </section>

        </div>

        {/* ============================================================== */}
        {/* 3. MOBİL & TABLET DÜZENİ (< 1024px / 390px Ekran)               */}
        {/* ============================================================== */}
        <div className="block lg:hidden bg-[#FBF8F1] rounded-sm border border-sand/70 shadow-sm overflow-hidden">
          
          {/* Mobile Search & Category Filter */}
          <div className="p-3 bg-[#FFFCF7] border-b border-sand/60 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#BA855E] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={recipeSearch}
                onChange={(e) => setRecipeSearch(e.target.value)}
                placeholder="Tarif veya malzeme ara..."
                className="w-full pl-8 pr-6 py-1.5 text-xs bg-[#F6F2E9] border border-[#DCCAB2] rounded-xs font-sans text-[#203B31] placeholder-[#936645]/60 focus:outline-none focus:border-[#BA855E]"
              />
              {recipeSearch && (
                <button
                  type="button"
                  onClick={() => setRecipeSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#936645] hover:text-[#203B31]"
                  aria-label="Aramayı temizle"
                >
                  ×
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[10px] font-sans">
              {workshopCategories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => handleCategoryChange(cat.key)}
                  className={`px-2 py-1 rounded-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    recipeCategory === cat.key
                      ? 'bg-[#203B31] text-[#FFF9EE]'
                      : 'bg-[#EDE4D0]/70 text-[#555f55]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Recipe Horizontal Pill Selector */}
          <div className="p-3 bg-[#F6F2E9] border-b border-sand/60 overflow-x-auto scrollbar-none flex items-center gap-2">
            {(filteredRecipes.length > 0 ? filteredRecipes : publishedRecipes).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelectRecipe(r.id)}
                className={`px-3 py-1.5 rounded-xs text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  r.id === currentRecipe.id
                    ? 'bg-[#203B31] text-white shadow-2xs'
                    : 'bg-white text-[#242724]/75 border border-sand/60'
                }`}
              >
                {r.title}
              </button>
            ))}
          </div>

          {/* Mobile Recipe Cover Hero */}
          <div className="relative w-full h-[180px] bg-[#3A2E28]">
            <img
              src={currentRecipe.imageUrl || '/images/islahiye_tava.jpg'}
              alt={currentRecipe.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#162721] via-[#162721]/50 to-transparent flex flex-col justify-end p-4">
              <span className="font-sans text-[9px] uppercase tracking-widest text-[#DCCAB2]">
                EDİTORYAL REÇETE
              </span>
              <h3 className="font-display font-bold text-2xl text-white leading-tight">
                {currentRecipe.title}
              </h3>
            </div>
          </div>

          {/* Segmented Tab Controls */}
          <div className="grid grid-cols-2 p-1 bg-sand/30 border-b border-sand/60 text-xs font-sans">
            <button
              type="button"
              onClick={() => setMobileTab('ingredients')}
              className={`py-2 text-center rounded-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                mobileTab === 'ingredients'
                  ? 'bg-[#203B31] text-white shadow-xs'
                  : 'text-[#242724]/70'
              }`}
            >
              Malzemeler ({checkedIngredientsCount}/{currentRecipe.ingredients.length})
            </button>

            <button
              type="button"
              onClick={() => setMobileTab('steps')}
              className={`py-2 text-center rounded-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                mobileTab === 'steps'
                  ? 'bg-[#203B31] text-white shadow-xs'
                  : 'text-[#242724]/70'
              }`}
            >
              Adımlar ({totalSteps > 0 ? safeStepIndex + 1 : 0}/{totalSteps})
            </button>
          </div>

          {/* Mobile Tab Content Body */}
          <div className="p-4 flex flex-col gap-3.5">
            {mobileTab === 'ingredients' ? (
              <>
                {/* Metadata Row */}
                <div className="grid grid-cols-3 gap-2 p-2 bg-[#F6F2E9] border border-sand/70 rounded-xs text-xs text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-sans text-[8px] uppercase text-[#242724]/50 mb-0.5">Hazırlık</span>
                    <span className="font-bold text-[#203B31] text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#BA855E]" />
                      {currentRecipe.prepTime}
                    </span>
                  </div>
                  <div className="border-l border-sand/70 flex flex-col items-center">
                    <span className="font-sans text-[8px] uppercase text-[#242724]/50 mb-0.5">Pişirme</span>
                    <span className="font-bold text-[#203B31] text-xs flex items-center gap-1">
                      <Flame className="w-3 h-3 text-[#BA855E]" />
                      {currentRecipe.cookTime}
                    </span>
                  </div>
                  <div className="border-l border-sand/70 flex flex-col items-center">
                    <span className="font-sans text-[8px] uppercase text-[#242724]/50 mb-0.5">Zorluk</span>
                    <span className="font-bold text-[#203B31] text-xs flex items-center gap-1">
                      <ChefHat className="w-3 h-3 text-[#BA855E]" />
                      {currentRecipe.difficulty}
                    </span>
                  </div>
                </div>

                {/* Portion Scaler */}
                <div className="flex items-center justify-between py-2 border-b border-sand/50">
                  <span className="font-sans text-[10px] uppercase tracking-wider text-[#936645] font-bold">
                    Porsiyon (Kişi):
                  </span>
                  <div className="flex gap-1.5">
                    {[2, 4, 6, 8].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setServings(p)}
                        className={`w-7 h-7 font-sans text-xs font-bold rounded-xs cursor-pointer ${
                          servings === p
                            ? 'bg-[#203B31] text-white'
                            : 'bg-white border border-sand/70 text-[#242724]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checklist */}
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="font-sans text-[9px] uppercase text-[#936645] font-semibold">
                    Malzeme Kontrolü ({checkedIngredientsCount}/{currentRecipe.ingredients.length})
                  </span>
                  <button
                    type="button"
                    onClick={toggleAllIngredients}
                    className="font-sans text-[9px] uppercase text-[#BA855E] hover:text-[#203B31] underline cursor-pointer"
                  >
                    {checkedIngredientsCount === currentRecipe.ingredients.length
                      ? 'Temizle'
                      : 'Tümünü Seç'}
                  </button>
                </div>
                <ul className="space-y-1.5">
                  {currentRecipe.ingredients.map((ing) => {
                    const isChecked = !!checkedIngredients[ing.id];
                    const formattedAmount = getIngredientFormatted(ing);
                    return (
                      <li key={ing.id}>
                        <button
                          type="button"
                          onClick={() => toggleIngredient(ing.id)}
                          className={`w-full text-left flex items-center justify-between p-2 rounded-xs border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-[#203B31]/5 border-[#203B31]/20 line-through text-[#242724]/40'
                              : 'bg-white border-sand/60 text-[#242724]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center text-[9px] ${isChecked ? 'bg-[#203B31] text-white border-[#203B31]' : 'border-[#BA855E]'}`}>
                              {isChecked && '✓'}
                            </span>
                            <span className="font-medium">{ing.name}</span>
                          </div>
                          <span className="font-sans font-bold text-[#936645]">
                            {formattedAmount}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {currentRecipe.notes && (
                  <div className="p-2.5 bg-[#F6F2E9] border-l-2 border-[#BA855E] rounded-xs text-xs text-[#242724]/80 leading-relaxed font-sans">
                    <strong className="text-[#936645] block mb-0.5">Taş Fırın Tavsiyesi:</strong>
                    {currentRecipe.notes}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setMobileTab('steps')}
                  className="w-full py-3 bg-[#203B31] text-[#F6F2E9] font-sans text-xs font-bold uppercase tracking-wider rounded-xs flex items-center justify-center gap-2 hover:bg-[#162721] cursor-pointer shadow-xs mt-2"
                >
                  <span>Pişirme Adımlarına Başla</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                {/* Steps View */}
                {!isCompleted ? (
                  currentStep ? (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-sans text-[10px] uppercase tracking-wider text-[#936645] font-bold">
                        Aşama {safeStepIndex + 1} / {totalSteps}
                      </span>
                      <span className="font-sans text-[10px] text-[#242724]/50">
                        %{Math.round(((safeStepIndex + 1) / Math.max(totalSteps, 1)) * 100)}
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-xl text-[#203B31] leading-tight">
                      {currentStep.title}
                    </h4>

                    {stepMedia && (
                      <div className="w-full h-[160px] rounded-xs overflow-hidden border border-[#BA855E]/40">
                        <img
                          src={stepMedia.url}
                          alt={stepMedia.alt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <p className="font-sans text-xs text-[#242724]/85 leading-relaxed">
                      {currentStep.instruction}
                    </p>

                    {currentStep.tip && (
                      <div className="p-2 bg-[#F6F2E9] border-l-2 border-[#BA855E] rounded-xs text-xs">
                        <span className="font-sans text-[9px] uppercase font-bold text-[#936645] block">
                          Ustanın Notu
                        </span>
                        <p className="font-serif italic text-xs text-[#242724]/90 mt-0.5">
                          “{currentStep.tip}”
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-sand/50">
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        disabled={safeStepIndex === 0}
                        className={`flex-1 py-2.5 rounded-xs border text-xs font-sans font-bold uppercase tracking-wider ${
                          safeStepIndex === 0
                            ? 'opacity-40 border-sand text-[#242724]/40 cursor-not-allowed'
                            : 'border-sand bg-white text-[#203B31] cursor-pointer'
                        }`}
                      >
                        Geri
                      </button>

                      <button
                        type="button"
                        onClick={handleCompleteCurrentStepAndNext}
                        className="flex-2 py-2.5 bg-[#203B31] text-[#F6F2E9] font-sans text-xs font-bold uppercase tracking-wider rounded-xs flex items-center justify-center gap-1.5 hover:bg-[#162721] cursor-pointer shadow-xs"
                      >
                        <span>
                          {safeStepIndex === totalSteps - 1
                            ? 'Tamamla'
                            : 'Tamamla & İlerle'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                  ) : (
                    <div className="py-6 text-center text-xs text-[#786a59]">
                      Bu tarif için tanımlanmış pişirme adımı bulunmamaktadır.
                    </div>
                  )
                ) : (
                  <div className="py-6 text-center">
                    <CheckCircle2 className="w-10 h-10 text-[#BA855E] mx-auto mb-2" />
                    <h4 className="font-display font-bold text-2xl text-[#203B31] mb-2">
                      Afiyet Olsun!
                    </h4>
                    <p className="font-sans text-xs text-[#242724]/80 leading-relaxed mb-4">
                      {currentRecipe.title} tarifini başarıyla tamamladınız.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetSession}
                      className="px-4 py-2 bg-[#203B31] text-white font-sans text-xs font-bold uppercase rounded-xs cursor-pointer"
                    >
                      Tarifi Başa Al
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};
