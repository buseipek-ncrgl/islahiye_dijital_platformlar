import React, { useEffect, useRef, useState } from 'react';
import { X, AlertCircle, Film, ExternalLink } from 'lucide-react';
import { GastronomyFilm } from '../../types';

interface CinematicVideoModalProps {
  film: GastronomyFilm | null;
  onClose: () => void;
}

export const CinematicVideoModal: React.FC<CinematicVideoModalProps> = ({ film, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasError, setHasError] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Close on Escape key, trap focus to close button, and prevent background scrolling
  useEffect(() => {
    if (!film) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (closeBtnRef.current) {
      closeBtnRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [film]);

  // Pause video and cleanup when modal closes or film changes
  useEffect(() => {
    setHasError(false);

    if (film && videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Browser autoplay restriction handled: user can click controls play
        });
      }
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    };
  }, [film]);

  if (!film || !film.videoSrc) {
    return null;
  }

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-charcoal/90 backdrop-blur-md animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-forest-900 border border-sand/30 rounded-sm w-full max-w-5xl overflow-hidden shadow-2xl relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-sand/15 bg-forest-950/80">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded-xs bg-copper/20 text-copper-light border border-copper/30">
              {film.episodeNumber ? `BÖLÜM 0${film.episodeNumber}` : `ATMOSFER KLİBİ (${film.duration || '5 sn'})`}
            </span>
            <span className="text-xs font-mono text-sand/60 hidden sm:inline">
              {film.theme}
            </span>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-1.5 text-sand/70 hover:text-ivory px-3 py-1.5 rounded-xs hover:bg-forest-800 transition-colors text-xs font-mono focus:outline-none focus:ring-1 focus:ring-copper"
            aria-label="Videoyu kapat"
          >
            <span className="hidden sm:inline">Kapat</span>
            <span className="text-[11px] text-sand/50">[Esc]</span>
            <X className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Video Player Frame (16:9 Aspect Ratio) */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          {hasError ? (
            <div className="text-center p-8 max-w-md">
              <AlertCircle className="w-10 h-10 text-copper mx-auto mb-3" />
              <h5 className="text-base font-display font-semibold text-ivory mb-1">
                Video Yüklenemedi
              </h5>
              <p className="text-xs text-sand/70 font-sans leading-relaxed">
                Medya dosyası ({film.videoSrc}) şu anda doğrudan oynatılamıyor. Lütfen dosyanın
                doğru dizinde olduğunu kontrol ediniz.
              </p>
            </div>
          ) : (
            <video
              ref={videoRef}
              src={film.videoSrc}
              poster={film.posterSrc || film.coverImageUrl}
              controls
              playsInline
              preload="metadata"
              onError={() => setHasError(true)}
              className="w-full h-full object-contain"
            >
              Tarayıcınız HTML5 video etiketini desteklemiyor.
            </video>
          )}
        </div>

        {/* Modal Info Footer */}
        <div className="p-6 bg-forest-950/90 border-t border-sand/15">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="max-w-2xl">
              <h3
                id="video-modal-title"
                className="text-xl sm:text-2xl font-display font-bold text-ivory mb-1.5"
              >
                {film.title}
              </h3>
              <p className="text-xs sm:text-sm text-sand/80 font-sans leading-relaxed mb-3">
                {film.description}
              </p>

              {/* Attribution and Media Origin */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-sand/60 font-mono">
                <span className="inline-flex items-center gap-1.5 text-copper-light">
                  <Film className="w-3.5 h-3.5" />
                  <span>
                    {film.mediaOrigin === 'ai-generated'
                      ? 'Temsili Konsept Klip (Yayın Lisansı Doğrulanmamış)'
                      : film.mediaOrigin === 'licensed-stock'
                      ? 'Lisanslı Stok Medya'
                      : 'Saha Kaydı'}
                  </span>
                </span>

                {film.credits && (
                  <span className="text-sand/50">• {film.credits}</span>
                )}
              </div>
            </div>

            {/* Source Reference Link if available */}
            {film.sourceUrl && (
              <div className="shrink-0 pt-1">
                <a
                  href={film.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-sand/70 hover:text-copper-light transition-colors font-mono underline underline-offset-4"
                >
                  <span>Model / Veri Seti Kaynağı</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

