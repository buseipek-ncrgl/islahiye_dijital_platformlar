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
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-copper-light font-semibold">
                06 / SİNEMATİK MEDYA & ATMOSFER
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-ivory leading-tight">
              Gastronomi Atmosferi & Mutfak Arşivi
            </h2>

            <p className="text-sm sm:text-base text-sand/80 mt-3 max-w-2xl font-sans leading-relaxed">
              Ateşin, un tezgâhının ve közün ritmini belgeleyen kısa atmosfer klipleri ile
              İslahiye mutfağı için planlanan belgesel dizisi taslağı.
            </p>
          </div>

          {/* Calm Institutional Status Notice */}
          <div className="flex items-center gap-2 text-xs text-sand/80 bg-forest-900/90 px-4 py-2.5 rounded-sm border border-sand/20 font-mono self-start md:self-auto shadow-sm">
            <Film className="w-4 h-4 text-copper-light shrink-0" />
            <span>3 Atmosfer Klibi (5 sn) • 10 Belgesel Planı</span>
          </div>
        </div>

        {/* Lead Showcase: 1 Large 16:9 Frame + Editorial Column */}
        <div className="space-y-8">
          <div className="rounded-sm overflow-hidden border border-sand/20 bg-forest-900/80 shadow-2xl group">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* 16:9 Cinematic Media Frame */}
              <div
                className="lg:col-span-8 relative aspect-video bg-charcoal overflow-hidden flex items-center justify-center cursor-pointer"
                onClick={() => setActivePlaybackFilm(featuredClip)}
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
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-xs bg-charcoal/85 text-sand border border-sand/20 shadow-xs">
                      {featuredClip.duration}
                    </span>
                  </div>
                )}

                {/* Category Pill Top Left */}
                <div className="absolute top-3.5 left-3.5 z-10">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-xs bg-forest-950/85 text-sand/90 border border-sand/20 shadow-xs">
                    {featuredClip.theme}
                  </span>
                </div>

                {/* Prominent Play Trigger */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePlaybackFilm(featuredClip);
                  }}
                  className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-copper text-ivory flex items-center justify-center hover:bg-copper-dark hover:scale-108 active:scale-95 transition-all duration-300 shadow-2xl focus:outline-none focus:ring-2 focus:ring-ivory"
                  aria-label={`${featuredClip.title} klibini oynat`}
                >
                  <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" />
                </button>
              </div>

              {/* Editorial Info Column */}
              <div className="lg:col-span-4 p-6 sm:p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-sand/20 bg-forest-900/60">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-copper-light block mb-2">
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
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-sm bg-copper text-ivory hover:bg-copper-dark transition-colors text-xs font-semibold uppercase tracking-wider shadow-sm"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Klibi Oynat ({featuredClip.duration || '5 sn'})</span>
                  </button>

                  {/* Calm, Subtle Attribution Footnote */}
                  <p className="text-[11px] text-sand/50 font-sans leading-relaxed text-center">
                    Temsili Atmosfer Klibi • Açık araştırma referansı
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Underneath: Secondary Film Strip Previews */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-mono uppercase tracking-widest text-copper-light font-semibold">
                DİĞER ATMOSFER KLİPLERİ
              </h4>
              <span className="text-xs font-mono text-sand/50">
                2 Klip Hazır
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {secondaryClips.map((clip) => (
                <div
                  key={clip.id}
                  className="bg-forest-900/70 border border-sand/20 rounded-sm overflow-hidden hover:border-copper/50 transition-all duration-300 shadow-sm flex flex-col sm:flex-row group"
                >
                  {/* Thumbnail Frame */}
                  <div
                    className="sm:w-2/5 relative aspect-video sm:aspect-auto bg-charcoal overflow-hidden shrink-0 cursor-pointer"
                    onClick={() => {
                      setFeaturedClipId(clip.id);
                      setActivePlaybackFilm(clip);
                    }}
                  >
                    <ImageWithFallback
                      src={clip.posterSrc}
                      alt={clip.title}
                      fallbackText={clip.title}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-90"
                    />
                    <div className="absolute inset-0 bg-charcoal/30 group-hover:bg-charcoal/10 transition-colors" />

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFeaturedClipId(clip.id);
                        setActivePlaybackFilm(clip);
                      }}
                      className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-copper text-ivory flex items-center justify-center hover:scale-110 transition-transform shadow-md"
                      aria-label={`${clip.title} klibini izle`}
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>

                    <div className="absolute bottom-2 right-2">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-xs bg-charcoal/80 text-sand border border-sand/20">
                        {clip.duration}
                      </span>
                    </div>
                  </div>

                  {/* Content Details */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-copper-light block mb-1">
                        {clip.theme}
                      </span>
                      <h5
                        onClick={() => {
                          setFeaturedClipId(clip.id);
                          setActivePlaybackFilm(clip);
                        }}
                        className="text-base font-display font-bold text-ivory mb-1 leading-snug group-hover:text-copper-light transition-colors cursor-pointer"
                      >
                        {clip.title}
                      </h5>
                      <p className="text-xs text-sand/75 font-sans line-clamp-2 leading-relaxed mb-3">
                        {clip.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-sand/15 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setFeaturedClipId(clip.id)}
                        className="text-[11px] font-mono text-sand/60 hover:text-ivory underline underline-offset-4 transition-colors"
                      >
                        Vitrine Al
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFeaturedClipId(clip.id);
                          setActivePlaybackFilm(clip);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-copper-light hover:text-ivory font-semibold uppercase transition-colors"
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

          {/* 10-Episode Documentary Blueprint Drawer (Calm & Clean) */}
          <div className="pt-4 border-t border-sand/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-sm bg-forest-900/50 border border-sand/20">
              <div>
                <h4 className="text-base font-display font-bold text-ivory mb-0.5">
                  10 Bölümlük Kurumsal Belgesel Arşiv Kapsamı
                </h4>
                <p className="text-xs text-sand/70 font-sans">
                  Gelecekte gerçekleştirilmesi planlanan İslahiye gastronomi belgeseli bölüm temaları.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPlannedSeries((prev) => !prev)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider bg-forest-800 text-ivory border border-sand/30 hover:border-copper/60 transition-colors shrink-0 self-start sm:self-auto"
              >
                <span>{showPlannedSeries ? 'Temaları Gizle' : '10 Bölüm Temasını İncele'}</span>
                {showPlannedSeries ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Expanded Planned Blueprint Grid */}
            {showPlannedSeries && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                {plannedSeries.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-5 rounded-sm bg-forest-950/70 border border-sand/15 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2 text-xs font-mono">
                        <span className="text-copper-light font-bold">
                          BÖLÜM 0{doc.episodeNumber}
                        </span>
                        <span className="text-sand/50 text-[10px] uppercase">
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

                    <div className="pt-2.5 border-t border-sand/15 flex items-center justify-between text-[11px] text-sand/50 font-mono">
                      <span>Arşiv Kapsamı</span>
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded-xs bg-forest-900 border border-sand/20">
                        Planlanan Yapım
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
