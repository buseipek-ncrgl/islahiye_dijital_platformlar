import React from 'react';
import { Compass, GraduationCap, ArrowUp, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-forest text-ivory/80 pt-16 pb-12 border-t border-forest-800 relative overflow-hidden">
      {/* Arka Plan Botanik Gravür Süslemeleri (Yön A — Koyu Orman Yeşili Üzerinde Sıcak Bakır/Fildişi) */}
      <div className="absolute -top-10 -right-10 w-44 sm:w-56 pointer-events-none select-none opacity-15 text-copper-light z-0" aria-hidden="true">
        <img src="/motifs/motif_wheat_firik.svg" alt="" className="w-full h-auto" />
      </div>
      <div className="absolute -bottom-12 -left-8 w-40 sm:w-52 pointer-events-none select-none opacity-10 text-copper-light z-0" aria-hidden="true">
        <img src="/motifs/motif_olive_branch.svg" alt="" className="w-full h-auto" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-forest-800/80">
          {/* Institutional Brand Info (5 cols) */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2 mb-2">
              <img src="/motifs/motif_olive_branch.svg" alt="" className="w-4 h-4 opacity-70" aria-hidden="true" />
              <span className="text-[10px] font-sans font-bold tracking-[0.25em] uppercase text-ivory/60">
                İSLAHİYE TİCARET ODASI
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-ivory mt-1 mb-3">
              LEZZET ATLASI
            </h3>
            <p className="text-xs sm:text-sm text-ivory/70 max-w-sm leading-relaxed mb-6 font-sans">
              İslahiye'nin asırlık mutfak hafızasını, taş fırın lezzetlerini, özgün tariflerini ve
              bereketli topraklarının ürünlerini belgeleyen ve tanıtan kültürel gastronomi portalı.
            </p>

            <p className="text-xs text-ivory/60 font-sans leading-relaxed max-w-sm">
              Amanos Dağları’nın eteklerinden İslahiye Ovası’na uzanan kadim lezzet köprüsü.
            </p>
          </div>

          {/* Quick Nav Links (3 cols) */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-ivory/50 mb-4">
              Hızlı Gezinti
            </h4>
            <ul className="space-y-2.5 text-xs text-ivory/75">
              <li>
                <a
                  href="#kesfet"
                  className="hover:text-copper-light transition-colors flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5 text-copper" />
                  <span>Keşfet & Giriş</span>
                </a>
              </li>
              <li>
                <a
                  href="#lezzetler"
                  className="hover:text-copper-light transition-colors flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5 text-copper" />
                  <span>Yöresel Lezzetler</span>
                </a>
              </li>
              <li>
                <a
                  href="#kultur-mirasi"
                  className="hover:text-copper-light transition-colors flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5 text-copper" />
                  <span>Kültürel Miras</span>
                </a>
              </li>
              <li>
                <a
                  href="#harita-onizleme"
                  className="hover:text-copper-light transition-colors flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5 text-copper" />
                  <span>Lezzet Haritası & Rotalar</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Institutional Digital Services Connection (4 cols) */}
          <div className="md:col-span-4 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-ivory/50 mb-4">
                Kurumsal Dijital Platformlar
              </h4>
              <p className="text-xs text-ivory/70 leading-relaxed mb-4">
                İslahiye Dijital Platformlar bünyesinde sunulan hizmetler:
              </p>

              <a
                href="http://localhost:5174"
                target="_blank"
                rel="noreferrer"
                className="group block p-4 rounded-xl bg-forest-800/80 border border-forest-700/80 hover:border-copper/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-copper-light" />
                    <span className="text-xs font-bold text-ivory uppercase tracking-wider">
                      Eğitim ve Kursiyer Yönetim Sistemi
                    </span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-copper-light group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-ivory/60 leading-normal">
                  Aday başvuruları, eğitim programları, kursiyer süreçleri ve doğrulanabilir başarı belgeleri yönetim platformu.
                </p>
              </a>
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              className="mt-6 self-start inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-ivory/60 hover:text-ivory transition-colors group"
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
          <p>© 2026 İslahiye Dijital Platformlar — Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-4">
            <a
              href="/yonetim"
              className="text-ivory/50 hover:text-copper-light transition-colors font-mono text-[11px]"
            >
              CMS Yönetim Paneli ↗
            </a>
            <span className="text-ivory/30">•</span>
            <span className="font-sans text-[11px] text-ivory/40">
              İslahiye Lezzet Atlası Kültür Girişimi
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
