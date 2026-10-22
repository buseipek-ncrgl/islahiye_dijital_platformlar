import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  ChevronUp,
  ChevronDown,
  Building,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useContent } from '../hooks/useContent';
import { Announcement, AnnouncementCategory } from '../types';

const CATEGORIES: { id: AnnouncementCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Tüm Duyurular' },
  { id: 'gastronomi', label: 'Resmî Coğrafi İşaret' },
  { id: 'kurumsal', label: 'Kurumsal Bilgilendirme' },
  { id: 'kultur', label: 'Kültürel Program' },
  { id: 'egitim', label: 'Eğitim & Gelişim' },
];

function isAnnouncementActive(ann: Announcement): boolean {
  if (!ann.validUntil) return true;
  try {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    return ann.validUntil >= today;
  } catch {
    return true;
  }
}

export const AnnouncementsPage: React.FC = () => {
  const { getAnnouncements } = useContent();
  const publishedAnnouncements = getAnnouncements(true);

  const [selectedCategory, setSelectedCategory] = useState<AnnouncementCategory | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(publishedAnnouncements[0]?.id || null);

  const filteredAnnouncements = useMemo(() => {
    return publishedAnnouncements.filter((ann) => {
      return selectedCategory === 'all' || ann.category === selectedCategory;
    });
  }, [publishedAnnouncements, selectedCategory]);

  return (
    <div className="min-h-screen bg-ivory text-charcoal pt-24 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="mb-10 border-b border-sand/70 pb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-8 h-px bg-copper" />
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-copper-dark font-semibold">
              İSLAHİYE TİCARET ODASI • KURUMSAL BÜLTEN & BİLDİRİMLER
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-display font-bold text-forest leading-tight mb-4">
            Duyurular & Resmî Bildirimler
          </h1>

          <p className="text-sm sm:text-base text-charcoal/75 max-w-2xl font-sans leading-relaxed">
            İslahiye yöresel değerleri, TÜRKPATENT tescilli ürün kayıtları ve gastronomi platformu
            geliştirme sürecine ilişkin resmî ve editoryal bilgilendirme envanteri.
          </p>

          {/* Category Tabs */}
          <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-forest text-ivory shadow-xs'
                    : 'bg-paper text-charcoal/75 border border-sand/70 hover:border-copper/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Refined Announcement Inventory List */}
        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <div className="p-12 text-center bg-paper border border-sand/70 rounded-sm text-charcoal/60 text-sm font-sans">
              Seçilen filtrede şu anda yayında olan duyuru veya kurumsal bildirim bulunmamaktadır.
            </div>
          ) : (
            filteredAnnouncements.map((ann) => {
              const isExpanded = expandedId === ann.id;
              const isActive = isAnnouncementActive(ann);
              const paragraphs = ann.detailedContent
                ? ann.detailedContent.split('\n').filter((p) => p.trim().length > 0)
                : Array.isArray(ann.content)
                ? ann.content
                : [ann.summary];

              return (
                <article
                  key={ann.id}
                  className={`bg-paper border rounded-sm overflow-hidden transition-all duration-300 ${
                    isExpanded
                      ? 'border-copper/60 shadow-xs'
                      : 'border-sand/80 hover:border-copper/40'
                  }`}
                >
                  {/* Announcement Accordion Header */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : ann.id)}
                    aria-expanded={isExpanded}
                    aria-controls={`ann-content-${ann.id}`}
                    className="w-full text-left p-6 flex items-start justify-between gap-4 select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-copper"
                  >
                    <div className="flex-1 min-w-0">
                      {/* Meta Kicker Line */}
                      <div className="flex flex-wrap items-center gap-2.5 mb-2.5 text-xs font-mono">
                        {!isActive ? (
                          <span className="text-[10px] uppercase font-semibold text-charcoal/45 bg-sand/30 px-2 py-0.5 rounded-xs border border-sand/60">
                            Geçerlilik Süresi Sona Ermiştir (Arşiv)
                          </span>
                        ) : ann.isDemo ? (
                          <span className="text-[10px] uppercase font-semibold text-copper-dark bg-copper/10 px-2 py-0.5 rounded-xs border border-copper/20">
                            Temsili Demo Bildirimi
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-forest bg-forest/10 px-2 py-0.5 rounded-xs border border-forest/20">
                            Doğrulanmış Resmî Kayıt
                          </span>
                        )}

                        <span className="text-copper-dark font-semibold uppercase">
                          {ann.categoryLabel}
                        </span>

                        <span className="text-charcoal/30">•</span>

                        <span className="flex items-center gap-1 text-charcoal/50">
                          <Calendar className="w-3.5 h-3.5" />
                          {ann.formattedDate}
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-display font-bold text-forest mb-2 leading-snug">
                        {ann.title}
                      </h2>

                      <p className="text-xs sm:text-sm text-charcoal/70 font-sans leading-relaxed">
                        {ann.summary}
                      </p>
                    </div>

                    <div className="p-2 text-charcoal/45 hover:text-forest transition-colors shrink-0 mt-1">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-copper" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content Body */}
                  {isExpanded && (
                    <div
                      id={`ann-content-${ann.id}`}
                      className="px-6 pb-6 pt-3 border-t border-sand/60 bg-ivory/50"
                    >
                      <div className="space-y-3.5 text-xs sm:text-sm font-sans text-charcoal/80 leading-relaxed mb-6 pt-1">
                        {paragraphs.map((paragraph, idx) => (
                          <p key={idx} className="m-0">
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-sand/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-charcoal/65">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-copper shrink-0" />
                          <span>Kaynak: {ann.officialSource}</span>
                        </div>

                        {ann.sourceUrl && (
                          <a
                            href={ann.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-copper hover:text-forest font-semibold transition-colors shrink-0"
                          >
                            <span>Resmî TÜRKPATENT Kaydını Gör</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        {/* Information Callout */}
        <div className="mt-14 p-6 rounded-sm bg-sand/20 border border-sand/70 flex items-start gap-4 text-xs font-sans text-charcoal/70">
          <Info className="w-5 h-5 text-copper shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-forest block">
              Kurumsal Şeffaflık ve Doğruluk İlkesi
            </span>
            <p className="leading-relaxed">
              Bu sayfada yer alan bilgiler; TÜRKPATENT nezdinde 991 numarasıyla tescilli İslahiye Biberi'ne
              (Tescil Ettiren: Gaziantep Ticaret Borsası, Tescil Tarihi: 05.01.2022) ilişkin resmî kayıtları ve
              İslahiye Dijital Platformlar koordinasyonunda geliştirilen dijital platform prototipine ait bildirimleri kapsar.
              Arayüz tasarımı amacıyla kurgulanmış örnek bildirimler açıkça "Temsili Demo Bildirimi" olarak etiketlenmiştir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
