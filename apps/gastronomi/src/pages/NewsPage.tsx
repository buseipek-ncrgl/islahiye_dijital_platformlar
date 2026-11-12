import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, ArrowRight, BookOpen, Tag, ArrowLeft } from 'lucide-react';
import { ArticleCategory } from '../types';
import { useContent } from '../hooks/useContent';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export const NewsPage: React.FC = () => {
  const { getArticles, getCategories } = useContent();
  const publishedArticles = getArticles(true);
  const articleCategories = getCategories('article', true);
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const CATEGORIES = useMemo(
    () => [
      { id: 'all' as ArticleCategory, label: 'Tüm Yazılar' },
      ...articleCategories.map((c) => ({ id: c.id as ArticleCategory, label: c.label })),
    ],
    [articleCategories]
  );

  useEffect(() => {
    if (selectedCategory !== 'all' && !articleCategories.some((c) => c.id === selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [selectedCategory, articleCategories]);

  // Filtered articles (only published)
  const filteredArticles = useMemo(() => {
    return publishedArticles.filter((article) => {
      const matchesCategory =
        selectedCategory === 'all' || article.category === selectedCategory;
      const q = searchQuery.toLocaleLowerCase('tr-TR').trim();
      const matchesSearch =
        q === '' ||
        article.title.toLocaleLowerCase('tr-TR').includes(q) ||
        article.summary.toLocaleLowerCase('tr-TR').includes(q) ||
        article.tags.some((tag) => tag.toLocaleLowerCase('tr-TR').includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [publishedArticles, selectedCategory, searchQuery]);

  // Lead article (first article matching lead flag, or first in filtered list)
  const leadArticle = useMemo(() => {
    return filteredArticles.find((a) => a.isLead) || filteredArticles[0] || null;
  }, [filteredArticles]);

  // Secondary articles (remaining articles)
  const secondaryArticles = useMemo(() => {
    if (!leadArticle) return [];
    return filteredArticles.filter((a) => a.id !== leadArticle.id);
  }, [filteredArticles, leadArticle]);

  return (
    <div className="min-h-screen bg-ivory text-charcoal font-sans flex flex-col justify-between selection:bg-copper selection:text-ivory">
      <Header />
      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Navigation Breadcrumb */}
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-copper hover:text-forest transition-colors font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ana Sayfaya Dön</span>
            </Link>
          </div>

        {/* Masthead Header */}
        <div className="mb-12 border-b border-sand/70 pb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-8 h-px bg-copper" />
            <span className="text-[11px] font-sans uppercase tracking-[0.25em] text-copper-dark font-bold">
              İSLAHİYE LEZZET ATLASI • EDİTORYAL YAYIN & GAZETE
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-forest leading-tight mb-4">
                Mutfak Kültürü & Araştırma Yazıları
              </h1>

              <p className="text-base sm:text-lg text-charcoal/75 max-w-3xl font-sans leading-relaxed">
                İslahiye Ovası’nın bereketli topraklarından kadim taş fırın ocaklıklarına;
                coğrafi işaretli ürünler, mevsimsel hasat ritüelleri ve mutfak belleği üzerine editoryal incelemeler.
              </p>
            </div>

            <div className="text-xs font-sans text-charcoal/60 lg:text-right shrink-0">
              <span>Arşiv Durumu: </span>
              <strong className="text-forest font-bold">{publishedArticles.length} Yayında</strong>
            </div>
          </div>

          {/* Search and Category Filters Bar */}
          <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-sans font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-forest text-ivory shadow-xs'
                      : 'bg-paper text-charcoal/75 border border-sand/70 hover:border-copper/60 hover:text-forest'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80 shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Yazılarda veya etiketlerde ara..."
                className="w-full pl-10 pr-16 py-2.5 bg-paper border border-sand/80 rounded-xl text-xs text-charcoal placeholder:text-charcoal/45 focus:outline-none focus:border-copper focus:ring-1 focus:ring-copper font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-charcoal/60 hover:text-charcoal font-sans font-bold"
                >
                  Temizle
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-20 bg-paper border border-sand/70 rounded-2xl p-8">
            <BookOpen className="w-10 h-10 text-copper mx-auto mb-3" />
            <h3 className="text-xl font-display font-bold text-forest mb-2">
              Eşleşen Yazı Bulunamadı
            </h3>
            <p className="text-sm text-charcoal/70 font-sans max-w-md mx-auto mb-6">
              Arama kriterlerinize uygun yayın bulunamadı. Lütfen farklı anahtar kelimeler deneyin veya filtreleri sıfırlayın.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest text-ivory text-xs font-sans font-bold uppercase tracking-wider hover:bg-forest-800 transition-colors"
            >
              Filtreleri Sıfırla
            </button>
          </div>
        )}

        {/* Lead Featured Article (Asymmetric BroadSheet Monograph) */}
        {leadArticle && (
          <div className="mb-16">
            <article className="bg-paper border border-sand/80 rounded-2xl overflow-hidden shadow-xs hover:border-copper/50 transition-all duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                {/* Image Col (7 cols) */}
                <div className="lg:col-span-7 flex flex-col justify-between bg-sand/15">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <ImageWithFallback
                      src={leadArticle.coverImage}
                      alt={leadArticle.title}
                      fallbackText={leadArticle.title}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover hover:scale-102 transition-transform duration-700 ease-out"
                    />
                  </div>
                  {leadArticle.imageCaption && (
                    <div className="p-3 bg-sand/10 border-t border-sand/40 text-[11px] text-charcoal/60 font-sans flex items-center justify-between">
                      <span>{leadArticle.imageCaption}</span>
                      <span className="font-sans text-charcoal/50 text-[10px] font-medium">{leadArticle.imageCredit}</span>
                    </div>
                  )}
                </div>

                {/* Content Col (5 cols) */}
                <div className="lg:col-span-5 p-7 sm:p-9 lg:p-10 flex flex-col justify-between">
                  <div>
                    {/* Top kicker */}
                    <div className="flex items-center gap-3 text-xs font-sans uppercase tracking-[0.2em] mb-3">
                      <span className="text-copper-dark font-bold">
                        {leadArticle.categoryLabel}
                      </span>
                      <span className="text-charcoal/30">•</span>
                      <span className="flex items-center gap-1 text-charcoal/60 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-copper" />
                        {leadArticle.readingTime}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-forest mb-3 leading-snug">
                      <Link
                        to={`/haberler/${leadArticle.slug}`}
                        className="hover:text-copper transition-colors"
                      >
                        {leadArticle.title}
                      </Link>
                    </h2>

                    {leadArticle.subtitle && (
                      <p className="text-xs sm:text-sm text-copper-dark font-serif italic mb-4 leading-relaxed">
                        "{leadArticle.subtitle}"
                      </p>
                    )}

                    <p className="text-xs sm:text-sm text-charcoal/75 font-sans leading-relaxed mb-6">
                      {leadArticle.summary}
                    </p>

                    {/* Tags */}
                    {leadArticle.tags && leadArticle.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mb-6">
                        {leadArticle.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 text-[10px] font-sans text-charcoal/70 bg-ivory px-2.5 py-0.5 rounded-md border border-sand/60 font-medium"
                          >
                            <Tag className="w-2.5 h-2.5 text-copper" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-sand/60 flex items-center justify-between">
                    <div className="text-xs font-sans text-charcoal/60">
                      <span className="font-semibold">{leadArticle.formattedDate}</span>
                      <span className="block text-[11px] text-charcoal/45 font-sans mt-0.5 font-medium">
                        {leadArticle.author.name}
                      </span>
                    </div>

                    <Link
                      to={`/haberler/${leadArticle.slug}`}
                      className="inline-flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-wider text-copper hover:text-forest transition-colors"
                    >
                      <span>Yazıyı İncele</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          </div>
        )}

        {/* Secondary Articles Section - Varied Asymmetric Layout */}
        {secondaryArticles.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-8 pb-3 border-b border-sand/60">
              <h3 className="text-xs font-sans uppercase tracking-[0.2em] text-copper-dark font-bold">
                KÜLTÜREL YAYINLAR & ARŞİV
              </h3>
              <span className="text-xs font-sans tabular-nums text-charcoal/60 font-medium">
                {secondaryArticles.length} Yazı
              </span>
            </div>

            {/* Asymmetrical Grid: 1 Wide Horizontal + 2 Balanced Monograph Cards */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {secondaryArticles.map((article, idx) => {
                // First secondary article gets a wide 8-col or 12-col feature layout if solitary
                const isWide = idx === 0 && secondaryArticles.length > 1;

                if (isWide) {
                  return (
                    <article
                      key={article.id}
                      className="md:col-span-12 lg:col-span-7 bg-paper border border-sand/70 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-copper/50 transition-all duration-300 shadow-xs group"
                    >
                      <div>
                        <div className="relative aspect-[16/10] bg-sand/20 overflow-hidden">
                          <ImageWithFallback
                            src={article.coverImage}
                            alt={article.title}
                            fallbackText={article.title}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
                          />
                        </div>

                        <div className="p-6 sm:p-7">
                          <div className="flex items-center gap-2 text-xs font-sans text-charcoal/60 mb-2 font-medium">
                            <span className="text-copper-dark font-bold uppercase">
                              {article.categoryLabel}
                            </span>
                            <span>•</span>
                            <span>{article.formattedDate}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-semibold">
                              <Clock className="w-3 h-3 text-copper" />
                              {article.readingTime}
                            </span>
                          </div>

                          <h4 className="text-xl sm:text-2xl font-display font-bold text-forest mb-2.5 leading-snug group-hover:text-copper transition-colors">
                            <Link to={`/haberler/${article.slug}`}>
                              {article.title}
                            </Link>
                          </h4>

                          <p className="text-xs sm:text-sm text-charcoal/70 font-sans leading-relaxed line-clamp-3 mb-4">
                            {article.summary}
                          </p>
                        </div>
                      </div>

                      <div className="px-6 pb-6 pt-0 border-t border-sand/40 mt-2 flex items-center justify-between">
                        <span className="text-[11px] font-sans text-charcoal/60 font-medium">
                          {article.author.name}
                        </span>

                        <Link
                          to={`/haberler/${article.slug}`}
                          className="inline-flex items-center gap-1.5 text-xs font-sans font-bold uppercase tracking-wider text-copper hover:text-forest transition-colors"
                        >
                          <span>Yazıyı Oku</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </article>
                  );
                }

                // Balanced editorial magazine layout:
                // Pair 1: idx 0 isWide (7 cols) + idx 1 (5 cols) = 12 cols
                // Remaining articles (idx >= 2): clean 3-column broadsheet (4 cols each) = 12 cols
                const colSpanClass =
                  secondaryArticles.length === 1
                    ? 'md:col-span-12 lg:col-span-8'
                    : idx === 1
                    ? 'md:col-span-12 lg:col-span-5'
                    : 'md:col-span-6 lg:col-span-4';

                return (
                  <article
                    key={article.id}
                    className={`${colSpanClass} bg-paper border border-sand/70 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-copper/50 transition-all duration-300 shadow-xs group`}
                  >
                    <div>
                      <div className="relative aspect-[16/10] bg-sand/20 overflow-hidden">
                        <ImageWithFallback
                          src={article.coverImage}
                          alt={article.title}
                          fallbackText={article.title}
                          containerClassName="w-full h-full"
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
                        />
                      </div>

                      <div className="p-6">
                        <div className="flex items-center gap-2 text-xs font-sans text-charcoal/60 mb-2 font-medium">
                          <span className="text-copper-dark font-bold uppercase">
                            {article.categoryLabel}
                          </span>
                          <span>•</span>
                          <span>{article.readingTime}</span>
                        </div>

                        <h4 className="text-lg sm:text-xl font-display font-bold text-forest mb-2 leading-snug group-hover:text-copper transition-colors">
                          <Link to={`/haberler/${article.slug}`}>
                            {article.title}
                          </Link>
                        </h4>

                        <p className="text-xs sm:text-sm text-charcoal/70 font-sans leading-relaxed line-clamp-3 mb-4">
                          {article.summary}
                        </p>
                      </div>
                    </div>

                    <div className="px-6 pb-6 pt-0 border-t border-sand/40 mt-2 flex items-center justify-between">
                      <span className="text-[11px] font-sans text-charcoal/60 font-medium">
                        {article.formattedDate}
                      </span>

                      <Link
                        to={`/haberler/${article.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-sans font-bold uppercase tracking-wider text-copper hover:text-forest transition-colors"
                      >
                        <span>Oku</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* Institutional Footnote */}
        <div className="mt-16 pt-8 border-t border-sand/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-sans text-charcoal/60">
          <p>
            İslahiye Lezzet Atlası Kültürel Yayın Kurulu • Resmî tescilli kayıtlar ile editoryal saha araştırmaları açıkça etiketlenmiştir.
          </p>
          <span className="text-charcoal/50 text-[11px]">
            İslahiye Dijital Gastronomi Arşivi
          </span>
        </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
