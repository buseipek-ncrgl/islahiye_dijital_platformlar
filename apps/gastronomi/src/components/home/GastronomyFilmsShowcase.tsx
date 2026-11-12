import React, { useState } from 'react';
import { Play, Film, ChevronDown, ChevronUp } from 'lucide-react';
import { CONCEPT_CLIPS, DOCUMENTARY_SERIES } from '../../data/films';
import { GastronomyFilm } from '../../types';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { CinematicVideoModal } from '../films/CinematicVideoModal';
import { useContent } from '../../hooks/useContent';

export const GastronomyFilmsShowcase: React.FC = () => {
  const { getFilms } = useContent();

  // Reactive published films for playable clips
  const publishedFilms = getFilms(true);
  const activeClipsFromStore = publishedFilms.filter((f) => f.contentType === 'concept_clip');
  const activeClips = activeClipsFromStore.length > 0 ? activeClipsFromStore : CONCEPT_CLIPS;

  // Planned documentary series blueprint
  const allFilms = getFilms(false);
  const plannedSeriesFromStore = allFilms.filter(
    (f) => f.contentType === 'documentary_episode' && f.publicationStatus === 'planned'
  );
  const plannedSeries = plannedSeriesFromStore.length > 0 ? plannedSeriesFromStore : DOCUMENTARY_SERIES;

  // Active featured clip in the 16:9 main theater frame
  const [featuredClipId, setFeaturedClipId] = useState<string>(activeClips[0]?.id || 'clip-firin-atesi');
  const featuredClip = activeClips.find((c) => c.id === featuredClipId) || activeClips[0];

  // Secondary clips
  const secondaryClips = activeClips.filter((c) => c.id !== featuredClip?.id);

  // Active modal playback
  const [activePlaybackFilm, setActivePlaybackFilm] = useState<GastronomyFilm | null>(null);

  // Planned documentary series toggle
  const [showPlannedSeries, setShowPlannedSeries] = useState<boolean>(false);

  return (
    <section id="filmler" className="py-20 md:py-28 bg-[#0D1914] text-ivory relative overflow-hidden">
      {/* Subtle Warm Atmospheric Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(186,133,94,0.15),transparent_65%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header with Cinema Direction */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 lg:mb-14">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-8 h-px bg-copper" />
              <span className="text-[11px] font-sans uppercase tracking-[0.25em] text-copper-light font-bold">
                SİNEMATİK MEDYA &amp; BELGESEL ARŞİVİ
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-ivory leading-tight">
              Gastronomi Atmosferi & Mutfak Arşivi
            </h2>

            <p className="text-sm sm:text-base text-sand/80 mt-3 max-w-2xl font-sans leading-relaxed">
              Ateşin, un tezgâhının ve közün ritmini belgeleyen kısa atmosfer klipleri ile
              İslahiye mutfağını ele alan 10 bölümlük belgesel seçkisi.
            </p>
          </div>

          {/* Calm Institutional Status Notice */}
          <div className="flex items-center gap-2 text-xs text-sand/85 bg-forest-900/90 px-4 py-2.5 rounded-xl border border-sand/20 font-sans font-medium self-start md:self-auto shadow-sm">
            <Film className="w-4 h-4 text-copper-light shrink-0" />
            <span>3 Atmosfer Klibi • 10 Belgesel Başlığı</span>
          </div>
        </div>

        {/* Lead Showcase: 1 Large 16:9 Frame + Editorial Column */}
        <div className="space-y-8">
          <div className="rounded-2xl overflow-hidden border border-sand/20 bg-forest-900/80 shadow-2xl group">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* 16:9 Cinematic Media Frame */}
              <button
                type="button"
                className="lg:col-span-8 relative aspect-video bg-charcoal overflow-hidden flex items-center justify-center cursor-pointer w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-copper"
                onClick={() => setActivePlaybackFilm(featuredClip)}
                aria-label={`${featuredClip.title} klibini oynat`}
              >
                <ImageWithFallback
                  src={featuredClip.posterSrc}
                  alt={featuredClip.title}
                  fallbackText={featuredClip.title}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out brightness-90"
                />

                {/* Subtle Cinematic Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-charcoal/30 pointer-events-none" />

                {/* Duration Badge Bottom Right */}
                {featuredClip.duration && (
                  <div className="absolute bottom-3 right-3 z-10">
                    <span className="text-[10px] font-sans tabular-nums font-bold uppercase px-2.5 py-1 rounded-lg bg-charcoal/85 text-sand border border-sand/20 shadow-xs">
                      {featuredClip.duration}
                    </span>
                  </div>
                )}

                {/* Category Pill Top Left */}
                <div className="absolute top-3.5 left-3.5 z-10">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-forest-950/85 text-sand/90 border border-sand/20 shadow-xs">
                    {featuredClip.theme}
                  </span>
                </div>

                {/* Prominent Visual Play Trigger */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-copper text-ivory flex items-center justify-center group-hover:bg-copper-dark group-hover:scale-108 transition-all duration-300 shadow-2xl"
                >
                  <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" />
                </span>
              </button>

              {/* Editorial Info Column */}
              <div className="lg:col-span-4 p-6 sm:p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-sand/20 bg-forest-900/60">
                <div>
                  <span className="text-xs font-sans uppercase tracking-[0.2em] text-copper-light block mb-2 font-bold">
                    {featuredClip.theme}
                  </span>

                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-ivory mb-2 leading-tight">
                    {featuredClip.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-sand/85 font-sans italic mb-4 leading-relaxed border-l border-copper/50 pl-3">
                    "{featuredClip.subtitle}"
                  </p>

                  <p className="text-xs sm:text-sm text-sand/75 font-sans leading-relaxed mb-6">
                    {featuredClip.description}
                  </p>
                </div>

                {/* Primary Action & Truthful Attribution */}
                <div className="space-y-3.5 pt-4 border-t border-sand/15">
                  <button
                    type="button"
                    onClick={() => setActivePlaybackFilm(featuredClip)}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-copper text-ivory hover:bg-copper-dark transition-colors text-xs font-sans font-bold uppercase tracking-wider shadow-sm"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Klibi Oynat ({featuredClip.duration || '5 sn'})</span>
                  </button>

                  {/* Calm, Subtle Attribution Footnote */}
                  <p className="text-[11px] text-sand/50 font-sans leading-relaxed text-center">
                    Kısa Atmosfer Klibi • İslahiye Kültür Arşivi
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Underneath: Secondary Film Strip Previews */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-sans uppercase tracking-[0.2em] text-copper-light font-bold">
                DİĞER ATMOSFER KLİPLERİ
              </h4>
              <span className="text-xs font-sans tabular-nums text-sand/60 font-medium">
                {secondaryClips.length} Klip Hazır
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {secondaryClips.map((clip) => (
                <div
                  key={clip.id}
                  className="bg-forest-900/70 border border-sand/20 rounded-xl overflow-hidden hover:border-copper/50 transition-all duration-300 shadow-sm flex flex-col sm:flex-row group"
                >
                  {/* Thumbnail Frame */}
                  <button
                    type="button"
                    className="sm:w-2/5 relative aspect-video sm:aspect-auto bg-charcoal overflow-hidden shrink-0 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-copper"
                    onClick={() => {
                      setFeaturedClipId(clip.id);
                      setActivePlaybackFilm(clip);
                    }}
                    aria-label={`${clip.title} klibini izle`}
                  >
                    <ImageWithFallback
                      src={clip.posterSrc}
                      alt={clip.title}
                      fallbackText={clip.title}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
                    />
                    <div className="absolute inset-0 bg-charcoal/30 group-hover:bg-charcoal/10 transition-colors" />

                    <span
                      aria-hidden="true"
                      className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-copper text-ivory flex items-center justify-center group-hover:scale-110 transition-transform shadow-md"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </span>

                    <div className="absolute bottom-2 right-2">
                      <span className="text-[9px] font-sans tabular-nums font-bold px-2 py-0.5 rounded-md bg-charcoal/80 text-sand border border-sand/20">
                        {clip.duration}
                      </span>
                    </div>
                  </button>

                  {/* Content Details */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-sans uppercase tracking-wider text-copper-light block mb-1 font-bold">
                        {clip.theme}
                      </span>
                      <h5 className="text-base font-display font-bold text-ivory mb-1 leading-snug">
                        <button
                          type="button"
                          onClick={() => {
                            setFeaturedClipId(clip.id);
                            setActivePlaybackFilm(clip);
                          }}
                          className="text-left group-hover:text-copper-light transition-colors cursor-pointer"
                        >
                          {clip.title}
                        </button>
                      </h5>
                      <p className="text-xs text-sand/75 font-sans line-clamp-2 leading-relaxed mb-3">
                        {clip.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-sand/15 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setFeaturedClipId(clip.id)}
                        className="text-[11px] font-sans text-sand/70 hover:text-ivory underline underline-offset-4 transition-colors font-medium"
                      >
                        Vitrine Al
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedClipId(clip.id);
                          setActivePlaybackFilm(clip);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-copper-light hover:text-ivory font-sans font-bold uppercase tracking-wider transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Oynat</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 10-Episode Documentary Series Overview */}
          <div className="pt-4 border-t border-sand/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-forest-900/50 border border-sand/20">
              <div>
                <h4 className="text-base font-display font-bold text-ivory mb-0.5">
                  10 Bölümlük Belgesel Seçkisi &amp; Arşiv Kapsamı
                </h4>
                <p className="text-xs text-sand/70 font-sans">
                  İslahiye mutfak kültürünün taş fırınlarını, hasat dönemlerini ve zanaat geleneğini işleyen belgesel konu başlıkları.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPlannedSeries((prev) => !prev)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-sans font-bold uppercase tracking-wider bg-forest-800 text-ivory border border-sand/30 hover:border-copper/60 transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <span>{showPlannedSeries ? 'Temaları Gizle' : '10 Bölüm Temasını İncele'}</span>
                {showPlannedSeries ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Expanded Series Grid */}
            {showPlannedSeries && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                {plannedSeries.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-5 rounded-xl bg-forest-950/70 border border-sand/15 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2 text-xs font-sans">
                        <span className="text-copper-light font-bold">
                          BÖLÜM {String(doc.episodeNumber ?? 0).padStart(2, '0')}
                        </span>
                        <span className="text-sand/50 text-[10px] uppercase font-medium">
                          {doc.theme}
                        </span>
                      </div>

                      <h5 className="text-base font-display font-bold text-ivory mb-1.5">
                        {doc.title}
                      </h5>

                      <p className="text-xs text-sand/70 font-sans leading-relaxed mb-3">
                        {doc.description}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-sand/15 flex items-center justify-between text-[11px] text-sand/60 font-sans">
                      <span>Arşiv Seçkisi</span>
                      <span className="text-[10px] font-sans font-bold uppercase px-2 py-0.5 rounded-md bg-forest-900 border border-sand/20">
                        Bölüm Özeti
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Accessible Cinematic Video Modal */}
      <CinematicVideoModal
        film={activePlaybackFilm}
        onClose={() => setActivePlaybackFilm(null)}
      />
    </section>
  );
};
