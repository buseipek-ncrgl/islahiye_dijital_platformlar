import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Compass } from 'lucide-react';

export const CulturalIntro: React.FC = () => {
  return (
    <section id="kultur-mirasi" className="py-20 md:py-28 bg-paper border-y border-sand/70 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-8 h-px bg-copper" />
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-copper-dark font-semibold">
              01 / MİRASIN İZİNDE
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-forest leading-tight">
            Güneşin Bereketi, Toprağın Hafızası ve Taş Fırınlar.
          </h2>
        </div>

        {/* Asymmetrical Editorial Composition (Varied Columns, No Repetitive Cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Column (7 cols): Editorial Manifesto / Quote */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 bg-ivory/60 border border-sand/70 rounded-2xl md:rounded-3xl p-8 sm:p-10 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-copper font-medium text-xs uppercase tracking-wider mb-4">
                <Sparkles className="w-4 h-4 text-copper" />
                <span>Akdeniz & Mezopotamya Kesişimi</span>
              </div>

              <blockquote className="text-xl sm:text-2xl lg:text-[1.65rem] font-display font-medium text-forest leading-snug italic mb-6">
                "Amanos Dağları’nın serin yamaçlarından İslahiye Ovası’na inen rüzgâr, bin yıllık taş fırınların sıcaklığıyla birleşir."
              </blockquote>

              <p className="text-sm sm:text-base text-charcoal/80 leading-relaxed font-sans">
                Kadim İpek Yolu güzergâhında yer alan İslahiye; ovayı besleyen kırmızı toprağı,
                güneşte kızaran ipek pul biberi, başakta tütsülenen yeşil firik buğdayı ve asırlık
                fırın kültürüyle Güneydoğu Anadolu mutfağının en özgün duraklarından biridir.
              </p>
            </div>

            <div className="pt-6 mt-8 border-t border-sand/50 flex items-center justify-between text-xs text-charcoal/60">
              <span className="font-mono uppercase tracking-wider">İslahiye Mutfak Kayıtları</span>
              <Compass className="w-4 h-4 text-copper" />
            </div>
          </motion.div>

          {/* Right Column (5 cols): Two Stacked Asymmetrical Facets */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Facet 1: Bereketli Toprak & Güneş */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-ivory/40 border border-sand/70 rounded-2xl p-6 sm:p-7 hover:border-copper/40 transition-colors"
            >
              <span className="text-[10px] font-mono uppercase tracking-widest text-copper-dark font-semibold">
                01 / Coğrafi Karakter
              </span>
              <h3 className="text-xl font-display font-bold text-forest mt-1 mb-2">
                Toprak & Güneş
              </h3>
              <p className="text-xs sm:text-sm text-charcoal/75 leading-relaxed font-sans">
                Ovanın mikrokliması biberin etli ve meyvemsi aromasına can verirken, erken hasat buğday közde tütsülenerek firik kokusunu kazanır.
              </p>
            </motion.div>

            {/* Facet 2: Fırın & İmece Geleneği */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-ivory/40 border border-sand/70 rounded-2xl p-6 sm:p-7 hover:border-copper/40 transition-colors flex-1"
            >
              <span className="text-[10px] font-mono uppercase tracking-widest text-copper-dark font-semibold">
                02 / Pişirme Usulü
              </span>
              <h3 className="text-xl font-display font-bold text-forest mt-1 mb-2">
                Ocaklık & Taş Fırın
              </h3>
              <p className="text-xs sm:text-sm text-charcoal/75 leading-relaxed font-sans">
                Tepsiler sabahın erken saatlerinde meşe odunu yanan çarşı fırınlarına emanet edilir; bayramlarda ise ahşap kalıplarla kömbe desenlenir.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
