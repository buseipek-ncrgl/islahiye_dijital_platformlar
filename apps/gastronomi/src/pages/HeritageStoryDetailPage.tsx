import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, BookOpen, ArrowRight, ChefHat, Info } from 'lucide-react';
import { useContent } from '../hooks/useContent';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';

export const HeritageStoryDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { getCulturalStoryBySlug, getCulturalStories, getDishes } = useContent();

  const story = getCulturalStoryBySlug(slug || '');
  const allDishes = getDishes(true);
  const relatedDishes = story
    ? allDishes.filter((d) => story.relatedDishIds?.includes(d.id))
    : [];

  const allPublishedStories = getCulturalStories(true);
  const otherStories = story
    ? allPublishedStories.filter((s) => s.id !== story.id).slice(0, 2)
    : [];

  const handleOpenWorkshop = (recipeId: string) => {
    navigate('/', { state: { recipeId } });
    setTimeout(() => {
      const el = document.querySelector('#tarif-atolyesi');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  if (!story || (story.publicationStatus && story.publicationStatus !== 'published')) {
    return (
      <div className="min-h-screen bg-ivory text-charcoal font-sans flex flex-col justify-between selection:bg-copper selection:text-ivory">
        <Header />
        <main className="flex-1 py-20 max-w-xl mx-auto px-4 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-copper mx-auto opacity-40" />
          <h1 className="text-2xl font-display font-bold text-forest">
            Kültürel Anlatı Bulunamadı veya Taslak Durumunda
          </h1>
          <p className="text-xs sm:text-sm text-charcoal/70 font-sans leading-relaxed">
            Talep ettiğiniz mutfak mirası anlatısı henüz demo ortamında yayımlanmamış veya yayından kaldırılmış olabilir.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/mutfak-mirasi')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xs bg-forest text-ivory text-xs font-mono font-semibold hover:bg-forest-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kültürel Miras Arşivine Dön</span>
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory text-charcoal font-sans flex flex-col justify-between selection:bg-copper selection:text-ivory">
      {/* 1. Global Header */}
      <Header />

      <main className="flex-1 py-10 sm:py-16">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Navigation Bar */}
          <div className="mb-8 flex items-center justify-between border-b border-sand/50 pb-4">
            <button
              type="button"
              onClick={() => navigate('/mutfak-mirasi')}
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-charcoal/60 hover:text-forest transition-colors focus:outline-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Mutfak Mirası Arşivine Dön</span>
            </button>

            <span className="text-[11px] font-mono text-copper-dark uppercase tracking-widest font-semibold">
              {story.categoryLabel}
            </span>
          </div>

          {/* Article Header & Typography (Prestigious Book Typography) */}
          <header className="mb-8">
            <div className="flex items-center gap-3 text-xs font-mono text-charcoal/50 mb-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-copper" />
                {story.readingTime} Okuma
              </span>
              <span>•</span>
              <span>{story.publishedDate}</span>
              <span>•</span>
              <span className="text-copper-dark font-medium">Sözlü Kültür Derlemesi</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-forest leading-[1.15] tracking-tight mb-4">
              {story.title}
            </h1>

            <p className="text-base sm:text-lg text-charcoal/80 font-serif italic leading-relaxed border-l-2 border-copper/60 pl-4 py-1">
              "{story.subtitle}"
            </p>
          </header>

          {/* Large Editorial Cover Image & Caption */}
          <figure className="mb-10">
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-sm overflow-hidden bg-sand/20 shadow-sm border border-sand/60">
              <ImageWithFallback
                src={story.coverImageUrl}
                alt={story.title}
                fallbackText={story.title}
                containerClassName="w-full h-full"
                className="w-full h-full object-cover"
              />
            </div>
            {story.imageCredit && (
              <figcaption className="mt-2 text-[11px] font-mono text-charcoal/60 text-right">
                Fotoğraf / Arşiv: {story.imageCredit}
              </figcaption>
            )}
          </figure>

          {/* Article Prose Body (Yeni Anadolu Mutfağı & Savora Book Layout) */}
          <div className="space-y-7 font-sans">
            {/* Lead Paragraph */}
            <p className="text-base sm:text-lg text-charcoal/90 leading-relaxed font-sans font-medium">
              {story.leadParagraph}
            </p>

            {/* Structured Body Sections */}
            {story.bodySections.map((section, idx) => (
              <section key={idx} className="space-y-3 pt-2">
                {section.heading && (
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-forest pt-3">
                    {section.heading}
                  </h2>
                )}
                <p className="text-sm sm:text-base text-charcoal/80 leading-relaxed font-sans">
                  {section.paragraph}
                </p>
              </section>
            ))}
          </div>

          {/* Methodological Oral History Footnote */}
          <div className="mt-10 p-5 rounded-sm bg-sand/20 border border-sand/60 flex items-start gap-3.5 text-xs text-charcoal/70 font-sans">
            <Info className="w-4 h-4 text-copper shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-mono text-[11px] uppercase tracking-wider text-forest font-semibold block">
                Metodoloji & Kaynakça Bildirimi
              </span>
              <p className="leading-relaxed">
                Bu monografi, İslahiye Kültür Arşivi kapsamında bölge sakinleri, fırın ustaları ve yaşlı kuşak kaynak kişilerle gerçekleştirilen saha görüşmelerine dayanır. Resmî tescilli değerler TÜRKPATENT kayıtları (İslahiye Biberi - Tescil No: 991) ile doğrulanmıştır.
              </p>
            </div>
          </div>

          {/* Related Dishes & Recipes Callout Box */}
          {relatedDishes.length > 0 && (
            <div className="mt-12 pt-8 border-t border-sand/70">
              <div className="flex items-center gap-2 mb-4">
                <ChefHat className="w-4 h-4 text-copper" />
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-copper-dark font-semibold">
                  BU KÜLTÜREL ANLATIYLA İLGİLİ LEZZETLER
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedDishes.map((dish) => (
                  <div
                    key={dish.id}
                    className="p-5 rounded-sm bg-paper border border-sand/70 flex items-center justify-between gap-4 shadow-xs"
                  >
                    <div>
                      <span className="text-[10px] font-mono text-copper-dark uppercase tracking-wider block mb-0.5">
                        {dish.categoryLabel}
                      </span>
                      <h4 className="text-base font-display font-bold text-forest">
                        {dish.name}
                      </h4>
                      <span className="text-xs text-charcoal/60 font-sans block mt-0.5">
                        {dish.originNote}
                      </span>
                    </div>

                    {dish.recipeId && (
                      <button
                        type="button"
                        onClick={() => handleOpenWorkshop(dish.recipeId!)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-forest text-ivory text-xs font-semibold uppercase tracking-wider hover:bg-forest-600 transition-colors shrink-0 shadow-xs"
                      >
                        <span>Atölyede Pişir</span>
                        <ArrowRight className="w-3 h-3 text-copper-light" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complementary Stories Recommendation */}
          {otherStories.length > 0 && (
            <div className="mt-14 pt-8 border-t border-sand/70">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-copper-dark font-semibold">
                  DİĞER KÜLTÜREL ANLATILAR
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/mutfak-mirasi')}
                  className="text-xs font-mono text-charcoal/60 hover:text-forest uppercase tracking-wider transition-colors"
                >
                  Tüm Arşiv →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {otherStories.map((other) => (
                  <div
                    key={other.id}
                    onClick={() => navigate(`/mutfak-mirasi/${other.slug}`)}
                    className="p-5 rounded-sm bg-paper border border-sand/70 hover:border-copper/50 transition-colors cursor-pointer group shadow-xs"
                  >
                    <span className="text-[10px] font-mono uppercase tracking-wider text-copper-dark font-semibold block mb-1">
                      {other.categoryLabel}
                    </span>
                    <h5 className="text-base font-display font-bold text-forest group-hover:text-copper-dark transition-colors mb-1.5">
                      {other.title}
                    </h5>
                    <p className="text-xs text-charcoal/70 font-sans line-clamp-2">
                      {other.subtitle}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Article Footer & Tags */}
          <footer className="mt-12 pt-6 border-t border-sand/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {story.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-xs bg-paper border border-sand/60 text-charcoal/70"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-charcoal/50 font-mono">
              <BookOpen className="w-3.5 h-3.5 text-copper" />
              <span>İslahiye Kültür Arşivi</span>
            </div>
          </footer>
        </article>
      </main>

      {/* 2. Global Footer */}
      <Footer />
    </div>
  );
};
