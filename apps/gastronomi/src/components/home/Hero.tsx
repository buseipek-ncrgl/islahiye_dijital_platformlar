import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface HeroProps {
  onExploreDishes: () => void;
  onExploreMap: () => void;
}

interface HeroSlide {
  id: string;
  image: string;
  alt: string;
  badge: string;
  title: string;
  subtitle: string;
  objectPosition?: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'islahiye-tava',
    image: '/images/islahiye_tava.jpg',
    alt: 'Taş fırında meşe közünde pişen geleneksel İslahiye Tavası',
    badge: '01 / 04 • TAŞ FIRIN GELENEĞİ',
    title: 'Geleneksel İslahiye Tavası',
    subtitle: 'Meşe közünde ağır pişen asırlık lezzet',
    objectPosition: 'center 36%',
  },
  {
    id: 'amanos-daglari',
    image: '/images/amanos_daglari.jpg',
    alt: 'Amanos Dağları ve verimli yaylalar',
    badge: '02 / 04 • COĞRAFİ HAVZA',
    title: 'Amanos Dağları & Yaylalar',
    subtitle: 'Yaylaların pınarları ve kadim toprak bereketi',
    objectPosition: 'center center',
  },
  {
    id: 'islahiye-biberi',
    image: '/images/islahiye_biberi.jpg',
    alt: 'Güneşte kurutulan coğrafi işaretli tescilli İslahiye Biberi',
    badge: '03 / 04 • TESCİLLİ MİRAS',
    title: 'Tescilli İslahiye Biberi',
    subtitle: 'Amanos rüzgârıyla kuruyan kırmızı altın',
    objectPosition: 'center center',
  },
  {
    id: 'tas-firin',
    image: '/images/hamur_zanaati_poster.jpg',
    alt: 'Geleneksel taş fırında hamur yoğuran asırlık usta',
    badge: '04 / 04 • ASIRLIK USTALIK',
    title: 'Taş Fırın & Hamur Zanaatı',
    subtitle: 'Kuşaktan kuşağa aktarılan fırıncılık kültürü',
    objectPosition: 'center 40%',
  },
];

export const Hero: React.FC<HeroProps> = ({ onExploreDishes, onExploreMap }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Yavaş ve akıcı otomatik geçiş (5.5 saniye)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  return (
    <section 
      id="kesfet" 
      className="relative w-full bg-[#F6F2E9] overflow-hidden border-b border-[#DCCBB3]/60 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ============================================================== */}
      {/* DESKTOP LAYOUT (lg & xl & 2xl): Panoramic Cinematic Stage      */}
      {/* ============================================================== */}
      <div className="hidden lg:block relative w-full h-[440px] xl:h-[480px] 2xl:h-[530px] max-w-[1920px] mx-auto overflow-hidden">
        
        {/* 1. YÖRESEL ŞABLON ZEMİNİ: Eskitme Parşömen, Çizikler ve Zeytin Gravürü */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none select-none"
          aria-hidden="true"
        >
          <img 
            src="/images/hero_parchment_schema.jpg" 
            alt="" 
            className="w-full h-full object-cover object-left" 
          />
        </div>

        {/* 2. MERKEZ & SAĞ SİNEMATİK TAM BOY FOTOĞRAF ALANI (GEÇİŞLİ / SLIDER) */}
        {/* Sağdaki 3 dar kutu kaldırıldı; fotoğraf alanı ekranın sağına (right-0) kadar genişletildi */}
        <div 
          className="absolute left-[28%] xl:left-[30%] 2xl:left-[32%] right-0 top-0 bottom-0 z-10 overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.12) 12%, rgba(0,0,0,0.80) 28%, black 44%, black 100%)',
            maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.12) 12%, rgba(0,0,0,0.80) 28%, black 44%, black 100%)',
          }}
        >
          {HERO_SLIDES.map((slide, index) => {
            const isActive = activeSlide === index;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.alt}
                  className={`w-full h-full object-cover filter saturate-[1.10] contrast-[1.04] transition-transform duration-[6000ms] ease-out ${
                    isActive ? 'scale-105' : 'scale-100'
                  }`}
                  style={{ objectPosition: slide.objectPosition || 'center center' }}
                />
              </div>
            );
          })}
        </div>

        {/* 3. SOL EDİTORYAL YAZI ALANI (%38 - %42) */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-20 w-[46%] xl:w-[42%] 2xl:w-[39%] h-full flex flex-col justify-center pl-32 xl:pl-40 2xl:pl-44 pr-4 py-3"
        >
          {/* Eyebrow / Provenance Stamp */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] xl:text-[11px] font-mono font-bold uppercase tracking-[0.22em] text-[#936645]">
              İSLAHİYE • TOPRAĞIN HAFIZASI
            </span>
          </div>

          {/* Display Headline */}
          <h1 className="text-3xl xl:text-[40px] 2xl:text-[46px] font-display font-medium text-[#203B31] leading-[1.06] tracking-tight mb-2.5">
            Toprağın <br />
            Hafızası, <br />
            <span className="italic font-normal text-[#BA855E]">Ocağın</span> Hikâyesi.
          </h1>

          {/* Sensory Subtitle */}
          <p className="text-xs xl:text-[14px] 2xl:text-[15px] text-[#242724]/85 font-sans leading-relaxed mb-4 max-w-[400px]">
            Amanos eteklerinin meşe közü, kırmızı biberin kokusuyla, taş fırınların ateşiyle şekillenen İslahiye mutfağını keşfedin.
          </p>

          {/* Side-by-Side CTAs */}
          <div className="flex flex-row items-center gap-3 mb-4 whitespace-nowrap">
            <button
              type="button"
              onClick={onExploreDishes}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xs bg-[#203B31] text-[#F6F2E9] text-xs font-semibold tracking-widest uppercase hover:bg-[#162721] active:scale-[0.99] transition-all shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BA855E]"
            >
              <span>LEZZETLERİ KEŞFET</span>
              <span className="text-sm">→</span>
            </button>

            <button
              type="button"
              onClick={onExploreMap}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xs border border-[#BA855E]/70 bg-[#FAF6EE]/90 text-[#203B31] text-xs font-semibold tracking-widest uppercase hover:bg-[#F2ECE0] hover:border-[#BA855E] active:scale-[0.99] transition-all shadow-xs cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BA855E]"
            >
              <span>GASTRONOMİ HARİTASI</span>
              <span className="text-[#BA855E] font-serif text-sm">⊕</span>
            </button>
          </div>
        </motion.div>

        {/* 4. SAĞ ALT SİNEMATİK EDİTORYAL KONTROL KAPSÜLÜ */}
        <div className="absolute bottom-5 right-6 z-20 flex items-center gap-3 bg-[#1B382B]/90 backdrop-blur-md px-3.5 py-2 rounded-xs border border-[#BA855E]/50 text-[#F6F2E9] shadow-lg">
          {/* Aktif Slayt Başlığı */}
          <div className="text-right pr-3 border-r border-[#BA855E]/30 hidden sm:block">
            <span className="block text-[9.5px] font-mono tracking-widest text-[#BA855E] uppercase font-bold">
              {HERO_SLIDES[activeSlide].badge}
            </span>
            <span className="font-display text-xs text-white tracking-wide">
              {HERO_SLIDES[activeSlide].title}
            </span>
          </div>

          {/* Slayt Geçiş Çizgileri */}
          <div className="flex items-center gap-1.5">
            {HERO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveSlide(idx)}
                className="group py-1 cursor-pointer focus:outline-none"
                aria-label={`Slayt ${idx + 1}: ${slide.title}`}
              >
                <div
                  className={`h-1 rounded-full transition-all duration-500 ${
                    activeSlide === idx
                      ? 'w-6 bg-[#BA855E]'
                      : 'w-2 bg-[#F6F2E9]/40 group-hover:bg-[#F6F2E9]/70'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Önceki / Sonraki Okları */}
          <div className="flex items-center gap-1 pl-1">
            <button
              type="button"
              onClick={handlePrevSlide}
              className="w-6 h-6 rounded-2xs flex items-center justify-center text-[#F6F2E9]/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-sm font-bold"
              aria-label="Önceki slayt"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNextSlide}
              className="w-6 h-6 rounded-2xs flex items-center justify-center text-[#F6F2E9]/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-sm font-bold"
              aria-label="Sonraki slayt"
            >
              ›
            </button>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* MOBILE & TABLET LAYOUT (< 1024px / 390px Screen)               */}
      {/* ============================================================== */}
      <div className="block lg:hidden px-4 sm:px-6 py-6 sm:py-8 relative">
        {/* Subtle Background Texture */}
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" aria-hidden="true">
          <img src="/images/hero_parchment_schema.jpg" alt="" className="w-full h-full object-cover" />
        </div>

        <div className="relative z-10">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#936645]">
              İSLAHİYE • TOPRAĞIN HAFIZASI
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl font-display font-medium text-[#203B31] leading-tight mb-3">
            Toprağın Hafızası, <br />
            <span className="italic font-normal text-[#BA855E]">Ocağın</span> Hikâyesi.
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-[#242724]/80 font-sans leading-relaxed mb-4">
            Amanos eteklerinin meşe közü, kırmızı biberin kokusuyla, taş fırınların ateşiyle şekillenen İslahiye mutfağını keşfedin.
          </p>

          {/* Central Animated Food Photo Slider */}
          <div 
            className="relative w-full aspect-[16/10] sm:aspect-[16/9] mb-4 overflow-hidden rounded-xs border border-[#BA855E]/30 shadow-md"
          >
            {HERO_SLIDES.map((slide, index) => {
              const isActive = activeSlide === index;
              return (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={slide.alt}
                    className="w-full h-full object-cover filter saturate-[1.10] contrast-[1.04]"
                    style={{ objectPosition: slide.objectPosition || 'center center' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <span className="text-[9px] font-mono text-[#BA855E] uppercase tracking-wider block font-bold">
                      {slide.badge}
                    </span>
                    <span className="font-display text-sm font-medium">
                      {slide.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Carousel Indicators */}
          <div className="flex items-center justify-center gap-1.5 mb-5">
            {HERO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveSlide(idx)}
                className="p-1 cursor-pointer focus:outline-none"
                aria-label={`Slayt ${idx + 1}`}
              >
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeSlide === idx ? 'w-5 bg-[#BA855E]' : 'w-1.5 bg-[#BA855E]/30'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onExploreDishes}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xs bg-[#203B31] text-[#F6F2E9] text-xs font-semibold tracking-widest uppercase hover:bg-[#162721] active:scale-[0.99] transition-all shadow-xs cursor-pointer"
            >
              <span>LEZZETLERİ KEŞFET</span>
              <span className="text-sm">→</span>
            </button>

            <button
              type="button"
              onClick={onExploreMap}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xs border border-[#BA855E]/70 bg-[#FAF6EE]/90 text-[#203B31] text-xs font-semibold tracking-widest uppercase hover:bg-[#F2ECE0] active:scale-[0.99] transition-all shadow-xs cursor-pointer"
            >
              <span>GASTRONOMİ HARİTASI</span>
              <span className="text-[#BA855E] font-serif text-sm">⊕</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
