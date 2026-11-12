import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, GraduationCap, ArrowUp, ArrowUpRight, BookOpen, Calendar, Bell, Newspaper, MapPin, Film } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-forest text-ivory/80 pt-16 pb-12 border-t border-forest-800 relative overflow-hidden">
      {/* Arka Plan Botanik Gravür Süslemeleri */}
      <div className="absolute -top-10 -right-10 w-44 sm:w-56 pointer-events-none select-none opacity-15 text-copper-light z-0" aria-hidden="true">
        <img src="/motifs/motif_wheat_firik.svg" alt="" className="w-full h-auto" />
      </div>
      <div className="absolute -bottom-12 -left-8 w-40 sm:w-52 pointer-events-none select-none opacity-10 text-copper-light z-0" aria-hidden="true">
        <img src="/motifs/motif_olive_branch.svg" alt="" className="w-full h-auto" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-forest-800/80">
          {/* Institutional Brand Info (4 cols) */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-2 mb-2">
              <img src="/motifs/motif_olive_branch.svg" alt="" className="w-4 h-4 opacity-70" aria-hidden="true" />
              <span className="text-[10px] font-sans font-bold tracking-[0.25em] uppercase text-ivory/60">
                İSLAHİYE TİCARET ODASI
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-ivory mt-1 mb-3">
              LEZZET ATLASI
            </h3>
            <p className="text-xs sm:text-sm text-ivory/70 max-w-sm leading-relaxed mb-4 font-sans">
              İslahiye'nin asırlık mutfak hafızasını, taş fırın lezzetlerini, özgün tariflerini ve
              bereketli topraklarının ürünlerini belgeleyen ve tanıtan kültürel gastronomi portalı.
            </p>
            <p className="text-xs text-ivory/60 font-sans leading-relaxed max-w-sm">
              Amanos Dağları’nın eteklerinden İslahiye Ovası’na uzanan kadim lezzet köprüsü.
            </p>
          </div>

          {/* Mutfak & Keşif (4 cols) */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-ivory/60 mb-4">
              Mutfak &amp; Kültürel Keşif
            </h4>
            <ul className="space-y-2.5 text-xs text-ivory/75">
              <li>
                <Link
                  to="/lezzet-haritasi"
                  className="hover:text-copper-light transition-colors flex items-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-copper" />
                  <span>İslahiye Lezzet &amp; Sokak Haritası</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/yemekler"
                  className="hover:text-copper-light transition-colors flex items-center gap-2"
                >
                  <Compass className="w-3.5 h-3.5 text-copper" />
                  <span>Yöresel Yemekler &amp; Tarif Kataloğu</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/mutfak-mirasi"
                  className="hover:text-copper-light transition-colors flex items-center gap-2"
                >
                  <BookOpen className="w-3.5 h-3.5 text-copper" />
                  <span>Mutfak Mirası &amp; Sözlü Bellek</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/filmler"
                  className="hover:text-copper-light transition-colors flex items-center gap-2"
                >
                  <Film className="w-3.5 h-3.5 text-copper" />
                  <span>Gastronomi Atmosferi &amp; Filmler</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/#islahiyeyi-kesfet"
                  className="hover:text-copper-light transition-colors flex items-center gap-2"
                >
                  <Compass className="w-3.5 h-3.5 text-copper" />
                  <span>İslahiye’yi Keşfet (Tarih &amp; Coğrafya)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Güncel & Kurumsal (4 cols) */}
          <div className="md:col-span-4 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-ivory/60 mb-4">
                Güncel Bülten &amp; İlanlar
              </h4>
              <ul className="space-y-2.5 text-xs text-ivory/75 mb-6">
                <li>
                  <Link
                    to="/haberler"
                    className="hover:text-copper-light transition-colors flex items-center gap-2"
                  >
                    <Newspaper className="w-3.5 h-3.5 text-copper" />
                    <span>Haberler &amp; Editoryal Makaleler</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/etkinlikler"
                    className="hover:text-copper-light transition-colors flex items-center gap-2"
                  >
                    <Calendar className="w-3.5 h-3.5 text-copper" />
                    <span>Gastronomi Etkinlik Takvimi</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/duyurular"
                    className="hover:text-copper-light transition-colors flex items-center gap-2"
                  >
                    <Bell className="w-3.5 h-3.5 text-copper" />
                    <span>Kurumsal Duyurular &amp; Tescil İlanları</span>
                  </Link>
                </li>
              </ul>

              <a
                href={import.meta.env.VITE_EGITIM_URL || 'http://localhost:5174'}
                target="_blank"
                rel="noopener noreferrer"
                title="İslahiye Eğitim ve Kursiyer Portalı (Bağımsız Uygulama)"
                className="group block p-3 rounded-lg bg-forest-800/80 border border-forest-700/80 hover:border-copper/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-copper-light" />
                    <span className="text-xs font-bold text-ivory uppercase tracking-wider">
                      Eğitim ve Kursiyer Portalı
                    </span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-copper-light group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-ivory/60 leading-normal">
                  İslahiye Ticaret Odası mesleki eğitim ve belgelendirme sistemi.
                </p>
              </a>
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              className="mt-6 self-start inline-flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-wider text-ivory/70 hover:text-ivory transition-colors group"
            >
              <span>Sayfa Başına Dön</span>
              <div className="w-6 h-6 rounded-full border border-ivory/20 flex items-center justify-center group-hover:border-ivory transition-colors">
                <ArrowUp className="w-3 h-3 text-copper-light" />
              </div>
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ivory/50">
          <p>© 2026 İslahiye Ticaret Odası Dijital Platformları — Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-4">
            <span className="font-sans text-[11px] text-ivory/60">
              İslahiye Lezzet Atlası Kültür &amp; Gastronomi Envanteri
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
