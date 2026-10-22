import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Calendar, Bell, BookOpen } from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import { Article } from '../../types';
import { ImageWithFallback } from '../ui/ImageWithFallback';

function getIstanbulToday(): string {
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

function isEventUpcoming(evt: any): boolean {
  if (evt.status === 'cancelled') return false;
  try {
    const todayStr = getIstanbulToday();
    const eventEndOrStartDate = evt.endDate || evt.startDate;
    return eventEndOrStartDate >= todayStr;
  } catch {
    return evt.status === 'upcoming';
  }
}

export const EditorialAgendaShowcase: React.FC = () => {
  const { getArticles, getAnnouncements, getEvents, getHomepageFeatured } = useContent();
  const publishedArticles = getArticles(true);
  const publishedAnnouncements = getAnnouncements(true);
  const publishedEvents = getEvents(true);
  const featuredConfig = getHomepageFeatured();

  // 1. Lead article (custom configured or fallback)
  const leadArticle =
    (featuredConfig.leadArticleId
      ? publishedArticles.find((a) => a.id === featuredConfig.leadArticleId)
      : undefined) ||
    publishedArticles.find((a) => a.isLead) ||
    publishedArticles[0];

  // 2. Secondary articles (custom configured or fallback)
  const configuredSecondary = (featuredConfig.secondaryArticleIds || [])
    .map((id) => publishedArticles.find((a) => a.id === id))
    .filter((a): a is Article => Boolean(a && a.id !== leadArticle?.id));

  const fallbackSecondary = leadArticle
    ? publishedArticles
        .filter((a) => a.id !== leadArticle.id && !configuredSecondary.some((s) => s.id === a.id))
        .slice(0, Math.max(0, 2 - configuredSecondary.length))
    : [];

  const secondaryArticles = [...configuredSecondary, ...fallbackSecondary].slice(0, 2);

  // 3. Featured / Upcoming event (custom configured or next upcoming)
  const upcomingEvent =
    (featuredConfig.featuredEventId
      ? publishedEvents.find((e) => e.id === featuredConfig.featuredEventId)
      : undefined) ||
    publishedEvents.find((e) => isEventUpcoming(e)) ||
    publishedEvents[0];

  // 4. Featured / Latest announcement (custom configured or first published)
  const latestAnnouncement =
    (featuredConfig.featuredAnnouncementId
      ? publishedAnnouncements.find((a) => a.id === featuredConfig.featuredAnnouncementId)
      : undefined) ||
    publishedAnnouncements[0];

  return (
    <section id="gundem" className="py-20 md:py-28 bg-paper border-t border-sand/70 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 lg:mb-16">
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-8 h-px bg-copper" />
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-copper-dark font-semibold">
                TOPRAĞIN HAFIZASI & GÜNCEL BÜLTEN
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-forest leading-tight">
              Mutfak Kültürü Gazetesi & Gündem
            </h2>

            <p className="text-sm sm:text-base text-charcoal/75 mt-3 max-w-2xl font-sans leading-relaxed">
              İslahiye Ovası’nın bereketli topraklarından kadim taş fırın ocaklıklarına;
              araştırma yazıları, gastronomi atölyeleri ve kurumsal bildirimler.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/haberler"
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-copper hover:text-forest transition-colors font-semibold py-2 px-3.5 rounded-sm bg-sand/20 hover:bg-sand/35"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Tüm Yazılar ({publishedArticles.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Editorial Layout: 7-col Lead Feature + 5-col Previews & Agenda */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mb-12">
          {/* Lead Article (7 cols) - Refined Editorial Monograph */}
          {leadArticle ? (
            <article className="lg:col-span-7 bg-ivory border border-sand/80 rounded-sm overflow-hidden shadow-xs flex flex-col justify-between group hover:border-copper/50 transition-all duration-300">
              <div>
                <div className="relative aspect-[16/10] bg-sand/20 overflow-hidden">
                  <ImageWithFallback
                    src={leadArticle.coverImage}
                    alt={leadArticle.title}
                    fallbackText={leadArticle.title}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-xs bg-forest text-ivory border border-sand/30 shadow-xs">
                      {leadArticle.contentType === 'news' ? 'Resmî Kayıt & Haber' : leadArticle.categoryLabel}
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 text-xs font-mono text-charcoal/50 mb-3">
                    <span>{leadArticle.formattedDate}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-copper-dark">
                      <Clock className="w-3 h-3 text-copper" />
                      {leadArticle.readingTime}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-forest mb-3 leading-snug group-hover:text-copper transition-colors">
                    <Link to={`/haberler/${leadArticle.slug}`}>
                      {leadArticle.title}
                    </Link>
                  </h3>

                  {leadArticle.subtitle && (
                    <p className="text-xs sm:text-sm text-copper-dark font-serif italic mb-3">
                      "{leadArticle.subtitle}"
                    </p>
                  )}

                  <p className="text-xs sm:text-sm text-charcoal/75 font-sans leading-relaxed line-clamp-3 mb-6">
                    {leadArticle.summary}
                  </p>
                </div>
              </div>

              <div className="px-6 sm:px-8 pb-6 pt-4 border-t border-sand/60 flex items-center justify-between">
                <span className="text-xs font-mono text-charcoal/60">
                  {leadArticle.author.name}
                </span>

                <Link
                  to={`/haberler/${leadArticle.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-copper hover:text-forest transition-colors font-mono"
                >
                  <span>Yazıyı İncele</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ) : (
            <div className="lg:col-span-7 bg-ivory border border-sand/80 rounded-sm p-12 text-center text-charcoal/60 text-sm font-sans flex items-center justify-center">
              Şu anda yayında öne çıkan haber bulunmamaktadır.
            </div>
          )}

          {/* Secondary Stack (5 cols: 2 articles + agenda cards) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            {/* Stacked Secondary Articles with Asymmetrical Character */}
            <div className="space-y-4">
              {secondaryArticles.map((art) => (
                <article
                  key={art.id}
                  className="p-5 rounded-sm bg-ivory border border-sand/70 hover:border-copper/50 transition-colors shadow-xs group flex items-start gap-4"
                >
                  <div className="w-24 h-24 rounded-sm overflow-hidden bg-sand/30 shrink-0">
                    <ImageWithFallback
                      src={art.coverImage}
                      alt={art.title}
                      fallbackText={art.title}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-copper-dark uppercase mb-1">
                      <span>{art.categoryLabel}</span>
                      <span>•</span>
                      <span>{art.readingTime}</span>
                    </div>

                    <h4 className="text-base font-display font-bold text-forest group-hover:text-copper transition-colors line-clamp-2 leading-snug mb-1.5">
                      <Link to={`/haberler/${art.slug}`}>
                        {art.title}
                      </Link>
                    </h4>

                    <p className="text-xs text-charcoal/65 font-sans line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            {/* Upcoming Event & Latest Announcement Mini-Ribbon */}
            <div className="p-6 rounded-sm bg-forest text-ivory border border-sand/20 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-sand/20 pb-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-copper-light font-bold">
                  YAKLAŞAN PROGRAM & BİLDİRİM BÜLTENİ
                </span>
                <Link
                  to="/etkinlikler"
                  className="text-[11px] font-mono text-sand/80 hover:text-ivory underline underline-offset-4"
                >
                  Takvim ↗
                </Link>
              </div>

              {/* Event Snippet */}
              {upcomingEvent && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xs bg-copper/20 text-copper-light flex items-center justify-center shrink-0 border border-copper/30">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono text-sand/70 block">
                      {upcomingEvent.formattedDate} • {upcomingEvent.eventTypeLabel}
                    </span>
                    <Link
                      to="/etkinlikler"
                      className="text-xs font-display font-bold text-ivory hover:text-copper-light transition-colors line-clamp-1 block mt-0.5"
                    >
                      {upcomingEvent.title}
                    </Link>
                  </div>
                </div>
              )}

              {/* Announcement Snippet */}
              {latestAnnouncement && (
                <div className="flex items-start gap-3 pt-3 border-t border-sand/15">
                  <div className="w-8 h-8 rounded-xs bg-copper/20 text-copper-light flex items-center justify-center shrink-0 border border-copper/30">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono text-sand/70 block">
                      {latestAnnouncement.formattedDate} • {latestAnnouncement.categoryLabel}
                    </span>
                    <Link
                      to="/duyurular"
                      className="text-xs font-display font-bold text-ivory hover:text-copper-light transition-colors line-clamp-1 block mt-0.5"
                    >
                      {latestAnnouncement.title}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer CTAs for Full Pages */}
        <div className="pt-8 border-t border-sand/60 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-6">
            <Link
              to="/haberler"
              className="text-copper-dark hover:text-forest font-semibold uppercase tracking-wider flex items-center gap-1.5"
            >
              <span>Tüm Haber & Makaleler</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/etkinlikler"
              className="text-copper-dark hover:text-forest font-semibold uppercase tracking-wider flex items-center gap-1.5"
            >
              <span>Etkinlik Takvimi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/duyurular"
              className="text-copper-dark hover:text-forest font-semibold uppercase tracking-wider flex items-center gap-1.5"
            >
              <span>Kurumsal Duyurular</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <span className="text-charcoal/45">
            İslahiye Lezzet Atlası Editoryal Arşivi
          </span>
        </div>
      </div>
    </section>
  );
};
