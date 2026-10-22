import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, ArrowRight, BookOpen, Filter } from 'lucide-react';
import { useContent } from '../hooks/useContent';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';

type StoryCategoryFilter = 'all' | 'cooking_methods' | 'tools' | 'seasons' | 'traditions';

export const HeritagePage: React.FC = () => {
  const navigate = useNavigate();
  const { getCulturalStories } = useContent();
  const publishedStories = getCulturalStories(true);
  const [selectedFilter, setSelectedFilter] = useState<StoryCategoryFilter>('all');

  const categories: { key: StoryCategoryFilter; label: string }[] = [
    { key: 'all', label: 'Tüm Anlatılar' },
    { key: 'cooking_methods', label: 'Pişirme Usulleri' },
    { key: 'tools', label: 'Mutfak Araçları' },
    { key: 'seasons', label: 'Hasat & Mevsimler' },
    { key: 'traditions', label: 'Gelenekler' },
  ];

  const filteredStories =
    selectedFilter === 'all'
      ? publishedStories
      : publishedStories.filter((s) => s.category === selectedFilter);

  return (
    <div className="min-h-screen bg-ivory text-charcoal font-sans flex flex-col justify-between selection:bg-copper selection:text-ivory">
      {/* 1. Global Header */}
      <Header />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Navigation & Tracker */}
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-charcoal/60 hover:text-forest transition-colors focus:outline-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ana Sayfaya Dön</span>
            </button>

            <span className="text-[11px] font-mono text-copper-dark uppercase tracking-widest font-semibold">
              Kültürel Miras Arşivi
            </span>
          </div>

          {/* Editorial Page Header */}
          <div className="max-w-3xl mb-10 md:mb-14">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-8 h-px bg-copper" />
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-copper-dark font-semibold">
                SÖZLÜ TARİH & MUTFAK BELLEĞİ
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-forest leading-tight">
              İslahiye Mutfak Mirası ve Kültürel Anlatılar
            </h1>

            <p className="text-sm sm:text-base text-charcoal/75 mt-3 leading-relaxed font-sans">
              Taş fırın meşe odununun kokusundan oymalı ahşap kömbe kalıplarına;
              İslahiye mutfağını var eden aletler, hasat ritüelleri ve kadim pişirme usulleri.
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="mb-10 overflow-x-auto pb-2 scrollbar-none">
            <div className="flex items-center gap-2 min-w-max border-b border-sand/50 pb-4">
              <div className="flex items-center gap-1.5 text-xs font-mono text-charcoal/50 pr-2 border-r border-sand/60">
                <Filter className="w-3.5 h-3.5 text-copper" />
                <span className="uppercase tracking-wider">Kategori</span>
              </div>

              {categories.map((cat) => {
                const isActive = selectedFilter === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedFilter(cat.key)}
                    className={`px-4 py-2 rounded-sm text-xs font-semibold tracking-wider transition-colors ${
                      isActive
                        ? 'bg-forest text-ivory shadow-xs'
                        : 'bg-paper text-charcoal/70 border border-sand/70 hover:border-copper/50'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Empty State */}
          {filteredStories.length === 0 ? (
            <div className="p-12 text-center rounded-sm bg-paper border border-sand/70 max-w-lg mx-auto">
              <BookOpen className="w-10 h-10 text-copper mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-display font-bold text-forest mb-2">
                Bu Kategoride Henüz Anlatı Bulunmuyor
              </h3>
              <p className="text-xs text-charcoal/70 font-sans mb-4">
                Seçilen temada saha derleme ve kayıt çalışmaları devam etmektedir.
              </p>
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className="px-4 py-2 rounded-xs bg-forest text-ivory text-xs font-mono uppercase tracking-wider hover:bg-forest-600 transition-colors"
              >
                Tüm Anlatıları Göster
              </button>
            </div>
          ) : (
            /* Editorial Articles Grid (Magazine Spread Layout) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
              {filteredStories.map((story) => (
                <article
                  key={story.id}
                  className="group bg-paper border border-sand/70 rounded-sm overflow-hidden flex flex-col justify-between hover:border-copper/50 transition-all duration-300 shadow-xs"
                >
                  <div>
                    {/* Article Cover Image */}
                    <div
                      className="relative aspect-[16/10] w-full overflow-hidden bg-sand/20 cursor-pointer"
                      onClick={() => navigate(`/mutfak-mirasi/${story.slug}`)}
                    >
                      <ImageWithFallback
                        src={story.coverImageUrl}
                        alt={story.title}
                        fallbackText={story.title}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-600"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2.5 py-1 rounded-xs bg-forest text-ivory shadow-xs">
                          {story.categoryLabel}
                        </span>
                      </div>
                      {story.imageCredit && (
                        <div className="absolute bottom-2 right-2">
                          <span className="text-[9px] font-mono text-ivory/80 bg-charcoal/70 px-2 py-0.5 rounded-xs backdrop-blur-xs">
                            {story.imageCredit}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Article Card Content */}
                    <div className="p-6 sm:p-8">
                      <div className="flex items-center gap-3 text-[11px] font-mono text-charcoal/50 mb-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-copper" />
                          {story.readingTime}
                        </span>
                        <span>•</span>
                        <span>{story.publishedDate}</span>
                        <span>•</span>
                        <span className="text-copper-dark font-medium">Sözlü Tarih</span>
                      </div>

                      <h2
                        onClick={() => navigate(`/mutfak-mirasi/${story.slug}`)}
                        className="text-2xl font-display font-bold text-forest leading-snug mb-3 cursor-pointer group-hover:text-copper-dark transition-colors"
                      >
                        {story.title}
                      </h2>

                      <p className="text-xs sm:text-sm text-charcoal/75 leading-relaxed font-sans line-clamp-3 mb-6">
                        {story.leadParagraph}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {story.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-ivory border border-sand/60 text-charcoal/70"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Article Read More Action */}
                  <div className="p-6 sm:p-8 pt-0 border-t border-sand/40 mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-charcoal/50 font-mono">
                      <BookOpen className="w-3.5 h-3.5 text-copper" />
                      <span>Monografik Kayıt</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/mutfak-mirasi/${story.slug}`)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-forest text-ivory text-xs font-semibold uppercase tracking-wider hover:bg-forest-600 transition-colors shadow-xs"
                    >
                      <span>Yazıyı Oku</span>
                      <ArrowRight className="w-3 h-3 text-copper-light" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Institutional Archive Note */}
          <div className="mt-14 p-6 rounded-sm bg-paper border border-sand/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="max-w-2xl">
              <span className="text-[11px] font-mono uppercase tracking-widest text-copper-dark font-semibold block mb-1">
                Kültürel Bellek Standartları
              </span>
              <p className="text-xs text-charcoal/70 font-sans leading-relaxed">
                İslahiye Mutfak Mirası Arşivi, yerel toplulukların sözlü anlatımlarını ve tescilli gastronomik değerleri belgelendirir. Tescilsiz ürünler resmî tescilli gibi gösterilmez.
              </p>
            </div>
            <span className="text-[11px] font-mono text-charcoal/50 shrink-0 bg-ivory px-3 py-1.5 rounded-xs border border-sand/60">
              İslahiye Dijital Platformlar
            </span>
          </div>
        </div>
      </main>

      {/* 2. Global Footer */}
      <Footer />
    </div>
  );
};
