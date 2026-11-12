import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, BookOpen } from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import { ImageWithFallback } from '../ui/ImageWithFallback';

export const CulturalHeritageShowcase: React.FC = () => {
  const navigate = useNavigate();
  const { getCulturalStories } = useContent();
  const publishedStories = getCulturalStories(true);

  if (publishedStories.length === 0) {
    return (
      <section id="kultur-mirasi" className="py-20 md:py-28 bg-paper border-y border-sand/70 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-copper-dark font-bold block mb-3">
            01 / MUTFAK MİRASI &amp; KÜLTÜREL BELLEK
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-forest mb-4">
            Toprağın Hafızası ve Kültürel Bellek Arşivi
          </h2>
          <p className="text-sm text-charcoal/70 max-w-xl mx-auto font-sans">
            İslahiye yöresinin mutfak mirası anlatıları ve geleneksel hazırlama usulleri bu arşivde derlenmektedir.
          </p>
        </div>
      </section>
    );
  }

  const leadStory = publishedStories[0];
  const secondaryStories = publishedStories.slice(1, 3);

  return (
    <section id="kultur-mirasi" className="py-20 md:py-28 bg-paper border-y border-sand/70 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Refined Editorial Rhythm */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-8 h-px bg-copper" />
              <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-copper-dark font-bold">
                01 / MUTFAK MİRASI &amp; KÜLTÜREL BELLEK
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-forest leading-tight">
              Toprağın Hafızası, Meşe Közü ve Asırlık Usuller
            </h2>

            <p className="text-sm sm:text-base text-charcoal/75 mt-3 max-w-2xl font-sans leading-relaxed">
              Taş fırınların sabah mesaisinden sonbahar biber sergilerine;
              İslahiye mutfak kültürünü araçları, ritüelleri ve mevsimsel hafızasıyla belgeleyen editoryal monografi arşivi.
            </p>
          </div>

          <div className="self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => navigate('/mutfak-mirasi')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-forest/30 bg-ivory text-forest text-xs font-semibold uppercase tracking-wider hover:bg-forest hover:text-ivory transition-colors shadow-xs cursor-pointer"
            >
              <span>Mutfak Mirası Arşivi</span>
              <ArrowRight className="w-3.5 h-3.5 text-copper" />
            </button>
          </div>
        </div>

        {/* Asymmetrical Editorial Spread (Savora & L'Officiel Magazine Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left Column (7 cols): Lead Monograph Feature */}
          <article className="lg:col-span-7 bg-ivory border border-sand/70 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs group">
            <div>
              {/* Lead Image Frame */}
              <button
                type="button"
                className="block w-full text-left relative aspect-[16/10] overflow-hidden bg-sand/20 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-copper"
                onClick={() => navigate(`/mutfak-mirasi/${leadStory.slug}`)}
                aria-label={`${leadStory.title} anlatısını oku`}
              >
                <ImageWithFallback
                  src={leadStory.coverImageUrl}
                  alt={leadStory.title}
                  fallbackText={leadStory.title}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-3.5 left-3.5">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-forest text-ivory shadow-xs">
                    {leadStory.categoryLabel}
                  </span>
                </div>
                {leadStory.imageCredit && (
                  <div className="absolute bottom-2.5 right-3">
                    <span className="text-[9px] font-sans text-ivory/80 bg-charcoal/70 px-2 py-0.5 rounded-md backdrop-blur-xs">
                      {leadStory.imageCredit}
                    </span>
                  </div>
                )}
              </button>

              {/* Lead Story Body */}
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 text-xs font-sans text-charcoal/50 mb-2.5">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-copper" />
                    {leadStory.readingTime}
                  </span>
                  <span>•</span>
                  <span>{leadStory.publishedDate}</span>
                  <span>•</span>
                  <span className="text-copper-dark font-semibold">Editoryal Kültür Derlemesi</span>
                </div>

                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-forest leading-tight mb-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/mutfak-mirasi/${leadStory.slug}`)}
                    className="text-left cursor-pointer group-hover:text-copper-dark transition-colors focus:outline-none focus-visible:underline"
                  >
                    {leadStory.title}
                  </button>
                </h3>

                <p className="text-sm sm:text-base text-charcoal/80 font-serif italic mb-3 leading-relaxed border-l-2 border-copper/60 pl-3.5">
                  "{leadStory.subtitle}"
                </p>

                <p className="text-xs sm:text-sm text-charcoal/70 leading-relaxed font-sans line-clamp-3 mb-6">
                  {leadStory.leadParagraph}
                </p>

                {/* Tags */}
                {leadStory.tags && leadStory.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {leadStory.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-sans font-medium px-2.5 py-0.5 rounded-md bg-paper border border-sand/60 text-charcoal/70"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Lead Story Footer CTA */}
            <div className="px-6 sm:px-8 py-4 bg-sand/15 border-t border-sand/50 flex items-center justify-between">
              <span className="text-xs font-sans text-copper-dark uppercase tracking-wider font-bold">
                Mutfak Belleği Monografisi
              </span>

              <button
                type="button"
                onClick={() => navigate(`/mutfak-mirasi/${leadStory.slug}`)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:text-copper-dark uppercase tracking-wider transition-colors cursor-pointer"
              >
                <span>Anlatıyı İncele</span>
                <ArrowRight className="w-3.5 h-3.5 text-copper" />
              </button>
            </div>
          </article>

          {/* Right Column (5 cols): Complementary Narratives in Varied Formats */}
          <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
            {secondaryStories.map((story) => (
              <article
                key={story.id}
                className="bg-ivory border border-sand/70 rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-copper/50 transition-colors shadow-xs flex-1 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-[10px] font-sans uppercase tracking-wider text-copper-dark font-bold">
                      {story.categoryLabel}
                    </span>
                    <span className="text-xs font-sans text-charcoal/50 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-copper" />
                      {story.readingTime}
                    </span>
                  </div>

                  <h4 className="text-xl sm:text-2xl font-display font-bold text-forest mb-2 leading-snug">
                    <button
                      type="button"
                      onClick={() => navigate(`/mutfak-mirasi/${story.slug}`)}
                      className="text-left cursor-pointer group-hover:text-copper-dark transition-colors focus:outline-none focus-visible:underline"
                    >
                      {story.title}
                    </button>
                  </h4>

                  <p className="text-xs sm:text-sm text-charcoal/70 leading-relaxed font-sans line-clamp-2 mb-4">
                    {story.subtitle}
                  </p>
                </div>

                <div className="pt-3.5 border-t border-sand/40 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-sans text-charcoal/60 font-medium">
                    <BookOpen className="w-3.5 h-3.5 text-copper" />
                    <span>{story.tags[0] || 'Kültürel Miras'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/mutfak-mirasi/${story.slug}`)}
                    className="text-xs font-semibold text-forest hover:text-copper-dark uppercase tracking-wider transition-colors flex items-center gap-1"
                  >
                    <span>Oku</span>
                    <ArrowRight className="w-3 h-3 text-copper" />
                  </button>
                </div>
              </article>
            ))}

            {/* Atmospheric Editorial Citation Note */}
            <div className="p-5 rounded-2xl bg-sand/20 border border-sand/60 flex items-start gap-3 text-xs text-charcoal/70 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-copper mt-1.5 shrink-0" />
              <p className="leading-relaxed">
                <strong className="font-semibold text-forest">Editoryal Derleme İlkesi:</strong> Bu bölümdeki anlatılar,
                İslahiye yöresinin mutfak kültürünü ve geleneksel pişirme usullerini tanıtmak amacıyla hazırlanan editoryal derlemelerdir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
