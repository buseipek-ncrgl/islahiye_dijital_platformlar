import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft, Share2, Check, Tag, Utensils, BookOpen, ShieldCheck, ExternalLink, Lightbulb } from 'lucide-react';
import { useContent } from '../hooks/useContent';
import { Dish, ArticleParagraph } from '../types';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { sanitizeUrl } from '../utils/security';

export const NewsDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const { getArticleBySlug, getArticles, getDishes, getRecipeById, getRecipes } = useContent();

  // Find article from reactive contentStore
  const article = slug ? getArticleBySlug(slug) : undefined;

  // Fallback if not found or not published (drafts/archived not visible to public)
  if (!article || article.publicationStatus !== 'published') {
    return (
      <div className="min-h-screen bg-ivory text-charcoal font-sans flex flex-col justify-between selection:bg-copper selection:text-ivory">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-24 text-center">
          <BookOpen className="w-12 h-12 text-copper mx-auto mb-4" />
          <h1 className="text-3xl font-display font-bold text-forest mb-3">
            Yazı Bulunamadı veya Yayında Değil
          </h1>
          <p className="text-sm text-charcoal/70 font-sans mb-8 leading-relaxed">
            Aradığınız haber veya makale henüz yayımlanmamış, taslak aşamasında ya da arşive kaldırılmış olabilir.
          </p>
          <Link
            to="/haberler"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-sm bg-forest text-ivory text-xs font-semibold uppercase tracking-wider hover:bg-forest-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tüm Yazılara Dön</span>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Related articles (only published)
  const publishedArticles = getArticles(true);
  const relatedArticles = publishedArticles.filter(
    (a) =>
      a.id !== article.id &&
      (article.relatedArticleSlugs?.includes(a.slug) || a.category === article.category)
  ).slice(0, 3);

  // Related dishes (only published)
  const publishedDishes = getDishes(true);
  const publishedRecipes = getRecipes(true);
  const relatedDishes = publishedDishes.filter((d) =>
    article.relatedDishIds?.includes(d.id)
  );

  // Copy URL action
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-ivory text-charcoal font-sans flex flex-col justify-between selection:bg-copper selection:text-ivory">
      <Header />
      <main className="flex-1 py-10 sm:py-16">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Link and Share Bar */}
          <div className="mb-10 flex items-center justify-between border-b border-sand/60 pb-4">
            <Link
              to="/haberler"
              className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-copper hover:text-forest transition-colors font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Tüm Yazılara Dön</span>
            </Link>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-paper border border-sand/70 text-xs font-sans font-bold text-charcoal/75 hover:border-copper/60 hover:text-forest transition-colors shadow-xs"
            aria-label="Yazı bağlantısını kopyala"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-copper" />
                <span className="text-copper font-bold">Bağlantı Kopyalandı</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-copper" />
                <span>Paylaş</span>
              </>
            )}
          </button>
        </div>

        {/* Article Masthead Header */}
        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-3 text-xs font-sans text-copper-dark uppercase tracking-wider mb-4 font-semibold">
            <span className="font-bold text-copper-dark">
              {article.categoryLabel}
            </span>
            <span className="text-charcoal/30">•</span>
            <span>{article.formattedDate}</span>
            <span className="text-charcoal/30">•</span>
            <span className="flex items-center gap-1 text-charcoal/60">
              <Clock className="w-3.5 h-3.5 text-copper" />
              {article.readingTime}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-forest leading-tight mb-5">
            {article.title}
          </h1>

          {article.subtitle && (
            <p className="text-lg sm:text-xl text-copper-dark font-serif italic leading-relaxed">
              "{article.subtitle}"
            </p>
          )}
        </header>

        {/* Official Source Callout if available */}
        {article.sourceUrl && sanitizeUrl(article.sourceUrl) && (
          <div className="mb-10 p-4 sm:p-5 rounded-xl bg-sand/20 border border-sand/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-sans">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-forest font-bold">
                <ShieldCheck className="w-4 h-4 text-copper shrink-0" />
                <span>Doğrulanmış Dış Kaynak Referansı</span>
              </div>
              <p className="text-[11px] text-charcoal/70 font-sans">
                {article.author.name} • {article.author.title}
              </p>
            </div>
            <a
              href={sanitizeUrl(article.sourceUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest text-ivory hover:bg-forest-800 font-bold transition-colors shrink-0"
            >
              <span>
                {article.sourceUrl.includes('turkpatent.gov.tr')
                  ? 'Resmî TÜRKPATENT Kaydını Gör'
                  : 'Dış Kaynağı İncele'}
              </span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Cinematic Cover Image */}
        <div className="mb-12 rounded-2xl overflow-hidden border border-sand/70 bg-sand/15 shadow-sm">
          <div className="relative aspect-[16/9] w-full">
            <ImageWithFallback
              src={article.coverImage}
              alt={article.title}
              fallbackText={article.title}
              containerClassName="w-full h-full"
              className="w-full h-full object-cover"
            />
          </div>
          {article.imageCaption && (
            <div className="p-3.5 bg-paper border-t border-sand/50 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-charcoal/65 font-sans gap-2">
              <span>{article.imageCaption}</span>
              <span className="font-sans text-[11px] text-charcoal/50 shrink-0 font-medium">
                {article.imageCredit}
              </span>
            </div>
          )}
        </div>

        {/* Constrained Reading Column for Optimal Legibility */}
        <div className="max-w-3xl mx-auto">
          {/* Summary Lead Blockquote */}
          <div className="mb-10 pl-6 border-l-2 border-copper py-1">
            <p className="text-lg sm:text-xl font-serif italic text-forest leading-relaxed m-0">
              {article.summary}
            </p>
          </div>

          {/* Structured Paragraphs */}
          <div className="space-y-8 text-base sm:text-lg text-charcoal/85 leading-relaxed font-sans">
            {article.paragraphs.map((para: ArticleParagraph, idx: number) => (
              <div key={idx} className="space-y-4">
                {para.title && (
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-forest pt-4 mb-2">
                    {para.title}
                  </h2>
                )}

                <p className="leading-relaxed font-sans text-charcoal/85">
                  {para.body}
                </p>

                {para.quote && (
                  <blockquote className="my-8 pl-6 border-l-2 border-copper italic text-forest font-serif text-xl sm:text-2xl leading-snug">
                    "{para.quote}"
                  </blockquote>
                )}

                {para.highlightText && (
                  <div className="p-4 rounded-xl bg-sand/20 border border-sand/70 text-xs sm:text-sm font-sans text-copper-dark leading-relaxed font-medium flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-copper shrink-0 mt-0.5" />
                    <span>{para.highlightText}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Author Footnote & Tags */}
          <div className="mt-14 pt-8 border-t border-sand/70 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="text-xs font-sans text-charcoal/50 uppercase tracking-wider mb-1 font-bold">
                Editoryal Künye & Kaynak
              </div>
              <div className="text-sm font-display font-bold text-forest">
                {article.author.name}
              </div>
              <div className="text-xs text-charcoal/60 font-sans">
                {article.author.title}
              </div>
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {article.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-[11px] font-sans text-charcoal/70 bg-paper px-2.5 py-1 rounded-md border border-sand/70 font-medium"
                  >
                    <Tag className="w-3 h-3 text-copper" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related Dishes Bridge */}
        {relatedDishes.length > 0 && (
          <div className="mt-16 p-6 sm:p-8 rounded-2xl bg-paper border border-sand/80 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-sans text-copper-dark uppercase tracking-wider mb-2 font-bold">
              <Utensils className="w-4 h-4 text-copper" />
              <span>Bu Yazıyla İlgili Yöresel Lezzetler</span>
            </div>

            <h3 className="text-2xl font-display font-bold text-forest mb-4">
              Yazıda Geçen Tatları Atölyede Keşfedin
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedDishes.map((dish: Dish) => {
                const dishRecipe =
                  (dish.recipeId ? getRecipeById(dish.recipeId) : undefined) ||
                  publishedRecipes.find((r) => r.dishId === dish.id);

                return (
                  <div
                    key={dish.id}
                    className="p-4 rounded-xl bg-ivory border border-sand/70 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-sand/30 shrink-0">
                        <ImageWithFallback
                          src={dish.imageUrl}
                          alt={dish.name}
                          fallbackText={dish.name}
                          containerClassName="w-full h-full"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-display font-bold text-forest truncate">
                          {dish.name}
                        </div>
                        <div className="text-xs font-sans text-copper truncate font-semibold">
                          {dish.categoryLabel || dish.category}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (dishRecipe) {
                          navigate(
                            `/yemekler?view=book&recipe=${encodeURIComponent(dishRecipe.id)}#tarif-atolyesi`
                          );
                        } else {
                          navigate(`/yemekler/${dish.id}`);
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-forest text-ivory text-xs font-sans font-bold uppercase tracking-wider hover:bg-forest-800 transition-colors shrink-0"
                    >
                      {dishRecipe ? 'Atölyede Pişir' : 'Detayı Gör'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Related Articles - Editorial Recommendation Layout */}
        {relatedArticles.length > 0 && (
          <div className="mt-16 pt-10 border-t border-sand/70">
            <h3 className="text-2xl font-display font-bold text-forest mb-6">
              Diğer Editoryal Okumalar
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/haberler/${rel.slug}`}
                  className="group bg-paper border border-sand/80 rounded-2xl overflow-hidden shadow-xs hover:border-copper/50 transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-[16/10] bg-sand/20 overflow-hidden">
                    <ImageWithFallback
                      src={rel.coverImage}
                      alt={rel.title}
                      fallbackText={rel.title}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
                    />
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-sans text-copper-dark uppercase tracking-wider mb-2 font-bold">
                        {rel.categoryLabel} • {rel.readingTime}
                      </div>

                      <h4 className="text-base font-display font-bold text-forest leading-snug group-hover:text-copper transition-colors line-clamp-2 mb-2">
                        {rel.title}
                      </h4>

                      <p className="text-xs text-charcoal/70 font-sans line-clamp-2">
                        {rel.summary}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-sand/40 mt-3 flex items-center justify-between text-xs font-sans text-copper">
                      <span className="font-semibold">{rel.formattedDate}</span>
                      <span className="font-semibold group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        </article>
      </main>
      <Footer />
    </div>
  );
};
