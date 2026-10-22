import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ArrowLeft, X, Info } from 'lucide-react';
import { useContent } from '../hooks/useContent';
import { GastronomyEvent } from '../types';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';

export function getIstanbulDate(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export function isEventUpcoming(evt: GastronomyEvent): boolean {
  if (evt.status === 'cancelled') return false;
  try {
    const todayStr = getIstanbulDate();
    const eventEndOrStartDate = evt.endDate || evt.startDate;
    return eventEndOrStartDate >= todayStr;
  } catch {
    return evt.status === 'upcoming';
  }
}

// Helper to format day and month for calendar block
function getCalendarBadge(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleDateString('tr-TR', { month: 'short' });
    const year = d.getFullYear();
    const weekday = d.toLocaleDateString('tr-TR', { weekday: 'short' });
    return { day, month: month.toUpperCase(), year, weekday };
  } catch {
    return { day: '', month: '', year: '', weekday: '' };
  }
}

export const EventsPage: React.FC = () => {
  const { getEvents } = useContent();
  const publishedEvents = getEvents(true);

  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [selectedEventForRegistration, setSelectedEventForRegistration] = useState<GastronomyEvent | null>(null);

  // Esc key & body lock for registration prototype modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedEventForRegistration) {
        setSelectedEventForRegistration(null);
      }
    };

    if (selectedEventForRegistration) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedEventForRegistration]);

  // Chronologically sorted and filtered events
  const filteredEvents = useMemo(() => {
    const list = publishedEvents.filter((evt) => {
      const isUpcoming = isEventUpcoming(evt);
      if (filter === 'upcoming') return isUpcoming;
      if (filter === 'completed') return !isUpcoming;
      return true;
    });

    return list.sort((a, b) => {
      const isAUpcoming = isEventUpcoming(a);
      const isBUpcoming = isEventUpcoming(b);

      if (isAUpcoming && !isBUpcoming) return -1;
      if (!isAUpcoming && isBUpcoming) return 1;

      // Both upcoming: sort ascending (closest date first)
      if (isAUpcoming && isBUpcoming) {
        return a.startDate.localeCompare(b.startDate);
      }

      // Both past/completed: sort descending (most recent past first)
      return b.startDate.localeCompare(a.startDate);
    });
  }, [publishedEvents, filter]);

  return (
    <div className="min-h-screen bg-ivory text-charcoal pt-24 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-copper hover:text-forest transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ana Sayfaya Dön</span>
          </Link>
        </div>

        {/* Page Masthead Header */}
        <div className="mb-12 border-b border-sand/70 pb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-8 h-px bg-copper" />
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-copper-dark font-semibold">
              KÜLTÜREL PROGRAM & ETKİNLİK TAKVİMİ
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-forest leading-tight mb-4">
            Gastronomi Atölyeleri & Buluşmalar
          </h1>

          <p className="text-base sm:text-lg text-charcoal/75 max-w-3xl font-sans leading-relaxed">
            İslahiye mutfak zanaatlarını, geleneksel taş fırın ustalığını ve hasat kültürünü tanıtmak amacıyla
            kurgulanan editoryal etkinlik takvimi ve program akışı.
          </p>

          {/* Status Filter Tabs */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider transition-all ${
                filter === 'all'
                  ? 'bg-forest text-ivory shadow-xs'
                  : 'bg-paper text-charcoal/75 border border-sand/70 hover:border-copper/60'
              }`}
            >
              Tüm Program ({publishedEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider transition-all ${
                filter === 'upcoming'
                  ? 'bg-forest text-ivory shadow-xs'
                  : 'bg-paper text-charcoal/75 border border-sand/70 hover:border-copper/60'
              }`}
            >
              Temsili Yaklaşan ({publishedEvents.filter((e) => isEventUpcoming(e)).length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider transition-all ${
                filter === 'completed'
                  ? 'bg-forest text-ivory shadow-xs'
                  : 'bg-paper text-charcoal/75 border border-sand/70 hover:border-copper/60'
              }`}
            >
              Arşiv / Tamamlanan ({publishedEvents.filter((e) => !isEventUpcoming(e)).length})
            </button>
          </div>
        </div>

        {/* Editorial Program & Itinerary List */}
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center bg-paper border border-sand/70 rounded-sm text-charcoal/60 text-sm font-sans">
            Seçilen filtrede şu anda listelenen etkinlik kaydı bulunmamaktadır.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredEvents.map((evt) => {
              const isUpcoming = isEventUpcoming(evt);
              const badge = getCalendarBadge(evt.startDate);

              return (
                <article
                  key={evt.id}
                  className="bg-paper border border-sand/80 rounded-sm overflow-hidden shadow-xs hover:border-copper/50 transition-all duration-300 group"
                >
                  <div className="p-6 sm:p-8 flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
                    {/* Left: Prominent Calendar Badge */}
                    <div className="w-full sm:w-auto flex sm:flex-col items-center justify-center p-4 rounded-xs bg-sand/20 border border-sand/70 text-center shrink-0 min-w-[90px]">
                      <span className="text-[11px] font-mono uppercase tracking-widest text-copper-dark font-bold">
                        {badge.month}
                      </span>
                      <span className="text-3xl sm:text-4xl font-display font-bold text-forest leading-none my-1">
                        {badge.day}
                      </span>
                      <span className="text-[10px] font-mono text-charcoal/50">
                        {badge.year} • {badge.weekday}
                      </span>
                    </div>

                    {/* Center: Program Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5 mb-2 text-xs font-mono">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-forest/10 text-forest border border-forest/20">
                          {evt.eventTypeLabel}
                        </span>

                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-sand/40 text-charcoal/70 border border-sand/70">
                          Temsili Demo Modeli
                        </span>

                        {!isUpcoming && (
                          <span className="text-[10px] uppercase text-charcoal/45 italic">
                            (Tamamlanmış Buluşma)
                          </span>
                        )}
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-display font-bold text-forest mb-2 leading-snug">
                        {evt.title}
                      </h2>

                      {evt.subtitle && (
                        <p className="text-xs sm:text-sm text-copper-dark font-serif italic mb-3">
                          "{evt.subtitle}"
                        </p>
                      )}

                      <p className="text-xs sm:text-sm text-charcoal/75 font-sans leading-relaxed mb-4">
                        {evt.description}
                      </p>

                      {/* Schedule and Location Row */}
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-mono text-charcoal/70 pt-3 border-t border-sand/50">
                        <div className="flex items-center gap-1.5 text-copper-dark font-medium">
                          <Clock className="w-3.5 h-3.5 text-copper" />
                          <span>{evt.time}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-copper" />
                          <span>{evt.locationName}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-charcoal/50">
                          <Info className="w-3.5 h-3.5 text-copper" />
                          <span>{evt.targetAudience}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Preview Thumbnail (if present) + Action CTA */}
                    <div className="w-full lg:w-48 flex sm:flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-4 shrink-0">
                      {evt.coverImage ? (
                        <div className="w-28 sm:w-36 lg:w-full aspect-[16/10] rounded-xs overflow-hidden bg-sand/20 border border-sand/60 shrink-0">
                          <ImageWithFallback
                            src={evt.coverImage}
                            alt={evt.title}
                            fallbackText={evt.title}
                            containerClassName="w-full h-full"
                            className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                          />
                        </div>
                      ) : null}

                      <div className="text-right w-full">
                        {isUpcoming ? (
                          <button
                            type="button"
                            onClick={() => setSelectedEventForRegistration(evt)}
                            className="w-full sm:w-auto lg:w-full px-4 py-2 rounded-sm bg-copper text-ivory text-xs font-semibold uppercase tracking-wider hover:bg-copper-dark transition-colors shadow-xs font-mono text-center"
                          >
                            <span>Örnek Planı İncele</span>
                          </button>
                        ) : (
                          <span className="text-xs font-mono text-charcoal/45 italic block py-2">
                            Arşivlenmiş Kayıt
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Prototype Registration Simulation Modal */}
        {selectedEventForRegistration && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-event-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedEventForRegistration(null)}
          >
            <div
              className="bg-paper border border-sand/80 rounded-sm p-6 sm:p-8 max-w-lg w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className="text-[10px] font-mono text-copper-dark font-bold uppercase tracking-wider block mb-1">
                    ARAYÜZ PROTOTİP BİLGİLENDİRMESİ
                  </span>
                  <h4 id="modal-event-title" className="text-xl font-display font-bold text-forest">
                    {selectedEventForRegistration.title}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEventForRegistration(null)}
                  className="text-charcoal/50 hover:text-forest p-1 focus:outline-none focus:ring-1 focus:ring-copper"
                  aria-label="Kapat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs sm:text-sm font-sans text-charcoal/80 leading-relaxed mb-6">
                <div className="p-3.5 rounded-sm bg-sand/20 border border-sand/80 text-xs text-charcoal/85 space-y-1">
                  <strong>Önemli Bilgilendirme:</strong> Bu etkinlik kaydı, İslahiye Lezzet Atlası platformunun takvim, konum ve katılım modüllerini doğrulamak amacıyla hazırlanmış temsili bir arayüz simülasyonudur.
                </div>

                <div className="p-3.5 rounded-sm bg-ivory border border-sand/80 space-y-2 font-mono text-xs text-charcoal/75">
                  <div><strong>Etkinlik Konusu:</strong> {selectedEventForRegistration.subtitle}</div>
                  <div><strong>Temsili Zaman:</strong> {selectedEventForRegistration.formattedDate}</div>
                  <div><strong>Saat Aralığı:</strong> {selectedEventForRegistration.time} (Europe/Istanbul)</div>
                  <div><strong>Mekân Kurgusu:</strong> {selectedEventForRegistration.locationName}</div>
                </div>

                <p className="text-xs text-charcoal/65">
                  Aktif bir resmî başvuru, kesinleşmiş kontenjan veya fiziksel kayıt alınmamaktadır.
                  Gerçek kurumsal etkinlik takvimi resmî kurum onaylarının ardından duyurulacaktır.
                </p>
              </div>

              <div className="pt-4 border-t border-sand/60 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedEventForRegistration(null)}
                  className="px-5 py-2 rounded-sm bg-forest text-ivory text-xs font-semibold uppercase tracking-wider hover:bg-forest-800 transition-colors"
                >
                  Anladım, Kapat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
