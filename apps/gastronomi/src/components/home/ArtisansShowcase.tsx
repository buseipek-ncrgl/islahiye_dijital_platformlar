import React from 'react';
import { Info, FileCheck } from 'lucide-react';
import { ARTISAN_PROJECT_INFO } from '../../data/artisans';
import { useContent } from '../../hooks/useContent';
import { ImageWithFallback } from '../ui/ImageWithFallback';

export const ArtisansShowcase: React.FC = () => {
  const { getArtisans } = useContent();
  const artisans = getArtisans(true);

  return (
    <section id="ustalar" className="py-20 md:py-28 bg-ivory border-t border-sand/70 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Documentary Tone */}
        <div className="max-w-3xl mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-8 h-px bg-copper" />
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-copper-dark font-semibold">
              05 / MUTFAK ZANAATLARI & EMEK
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-forest leading-tight">
            Ocaklığın ve Toprağın Zanaat Mirası
          </h2>

          <p className="text-sm sm:text-base text-charcoal/75 mt-3 max-w-2xl font-sans leading-relaxed">
            İslahiye mutfak kültürünü şekillendiren fırın ritüelleri, bereketli ova üretimi
            ve geleneksel el becerilerinin kültürel anlatımı.
          </p>
        </div>

        {/* Dynamic Display: Verified Real Profiles OR Asymmetrical Documentary Monograph */}
        {artisans.length > 0 ? (
          /* Render full portraits when verified field data with formal release is active */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {artisans.map((artisan) => (
              <article
                key={artisan.id}
                className="bg-paper border border-sand/70 rounded-sm p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:border-copper/50 transition-colors"
              >
                <div>
                  {artisan.imageUrl && (
                    <div className="aspect-[4/3] rounded-xs overflow-hidden mb-5 border border-sand/60 bg-sand/20">
                      <ImageWithFallback
                        src={artisan.imageUrl}
                        alt={artisan.name}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-copper-dark uppercase tracking-wider font-semibold">
                      {artisan.craftCategoryLabel}
                    </span>
                    {artisan.publicationPermissionGranted && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono text-forest bg-forest/10 px-2 py-0.5 rounded-xs font-semibold uppercase">
                        <FileCheck className="w-2.5 h-2.5 text-copper" />
                        İzinli Profil
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-display font-bold text-forest mb-1">
                    {artisan.name}
                  </h3>
                  <span className="text-xs font-mono text-copper-dark uppercase tracking-wider block mb-3 font-medium">
                    {artisan.title}
                  </span>
                  <p className="text-xs sm:text-sm text-charcoal/75 leading-relaxed font-sans mb-4">
                    {artisan.biography}
                  </p>
                </div>

                {artisan.visitInfo?.address && (
                  <div className="pt-3.5 border-t border-sand/40 text-[11px] font-mono text-charcoal/60">
                    {artisan.visitInfo.address}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          /* Asymmetrical Editorial Monograph (NO 3 equal cards) */
          <div className="space-y-12 lg:space-y-16">
            {/* 1. Lead Monograph Feature: Taş Fırın ve Ocaklık Kültürü (Expansive & Frameless) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Wide Photo Frame */}
              <div className="lg:col-span-7">
                <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-sm overflow-hidden bg-sand/20 shadow-sm border border-sand/50">
                  <ImageWithFallback
                    src="/images/tas_firin_kozu_poster.jpg"
                    alt="Taş fırın meşe odunu közleri ve ocaklık ateşi"
                    fallbackText="Taş Fırın & Meşe Közü"
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-2 text-[11px] font-mono text-charcoal/50 text-right">
                  Meşe Odunu ve Bakır Tepsi Zanaatı • Temsili Kültürel Görsel
                </p>
              </div>

              {/* Lead Narrative Text */}
              <div className="lg:col-span-5 space-y-4">
                <span className="text-[11px] font-mono uppercase tracking-widest text-copper-dark font-semibold block">
                  Asırlık Çarşı Geleneği
                </span>

                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-forest leading-snug">
                  Taş Fırın ve Ocaklık Kültürü
                </h3>

                <p className="text-sm sm:text-base text-charcoal/80 font-serif italic leading-relaxed border-l-2 border-copper/60 pl-3.5">
                  "Sabahın ilk meşe ateşinden bakır tepside ağır ağır demlenen İslahiye tavasına uzanan ocaklık hafızası."
                </p>

                <p className="text-xs sm:text-sm text-charcoal/75 leading-relaxed font-sans">
                  Taş fırınlar, İslahiye'de yalnızca yemek pişirilen yerler değil; sabahın erken saatlerinde meşe odunlarıyla ısınan, çarşı esnafının ve hanelerin ortak lezzet ocağıdır. Fırın taşında kuzu eti ve sebzelerin suyunu kaybetmeden kendi buharında demlenmesi, fırıncı küreğinin ucunda kabaran tırnaklı pidelerle buluşarak asırlık bir mutfak zanaatını yaşatır.
                </p>
              </div>
            </div>

            {/* 2. Secondary Cultural Narratives (Different Proportions & Asymmetrical Layout) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 pt-6 border-t border-sand/50">
              {/* Secondary Block 1: Toprak ve Biber Üretimi */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="relative aspect-[4/3] w-full rounded-sm overflow-hidden bg-sand/20 shadow-xs border border-sand/40">
                  <ImageWithFallback
                    src="/images/islahiye_biberi.jpg"
                    alt="İslahiye kırmızı biberi hasat ve kurutma"
                    fallbackText="Toprak & Biber Üretimi"
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-[11px] font-mono text-charcoal/50 mb-1.5">
                    Amanos Alüvyonu ve Taş Dibekler • Temsili Görsel
                  </p>
                  <h4 className="text-xl sm:text-2xl font-display font-bold text-forest mb-2">
                    Toprak ve Biber Üretimi
                  </h4>
                  <p className="text-xs sm:text-sm text-charcoal/75 leading-relaxed font-sans">
                    Amanos Dağları’nın eteğindeki alüvyon topraklarda yetişen tescilli kırmızı biberlerin eylül ayında keten sergilerde güneşte kurutulması ve taş dibeklerde ezilerek ipeksi pullara dönüştürülmesi, ova tarımının ve yerel zanaatın temel direğidir.
                  </p>
                </div>
              </div>

              {/* Secondary Block 2: Geleneksel Hamur Zanaatı */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="relative aspect-[4/3] w-full rounded-sm overflow-hidden bg-sand/20 shadow-xs border border-sand/40">
                  <ImageWithFallback
                    src="/images/hamur_zanaati_poster.jpg"
                    alt="Geleneksel hamur açma ve unlu tezgâh"
                    fallbackText="Geleneksel Hamur Zanaatı"
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-[11px] font-mono text-charcoal/50 mb-1.5">
                    Oymalı Ahşap Kalıplar ve Yufka Ustalığı • Temsili Görsel
                  </p>
                  <h4 className="text-xl sm:text-2xl font-display font-bold text-forest mb-2">
                    Geleneksel Hamur Zanaatı
                  </h4>
                  <p className="text-xs sm:text-sm text-charcoal/75 leading-relaxed font-sans">
                    Gürgen ve ceviz ağacına nakşedilmiş asırlık motifli kalıplarla bayram kömbelerinin desenlenmesi ve tezgâhta el ayasıyla açılarak saç üzerinde pişirilen peynirli semsek böreği yufkaları, kuşaktan kuşağa aktarılan incelikli bir el becerisidir.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Calm & Truthful Institutional Clarification */}
            <div className="p-6 sm:p-7 rounded-sm bg-sand/20 border border-sand/60 flex items-start gap-4">
              <Info className="w-5 h-5 text-copper shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed font-sans">
                {ARTISAN_PROJECT_INFO.description}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

