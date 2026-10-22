import React from 'react';
import { Video, Compass, BookOpen, ArrowUpRight } from 'lucide-react';

export const RoadmapTeaser: React.FC = () => {
  const upcomingModules = [
    {
      id: 'usta-belgeselleri',
      status: 'Çok Yakında',
      title: 'Usta Hikâyeleri & Sözlü Tarih',
      icon: Video,
      desc: 'İslahiye’nin asırlık lezzet ustaları, ocaklık belgeselleri ve mutfak hafızası video arşivi.',
    },
    {
      id: 'kultur-rotalari',
      status: 'Çok Yakında',
      title: 'Tematik Kültür Rotaları',
      icon: Compass,
      desc: 'Amanos yaylalarından ovaya tematik bağ bozumu, biber hasadı ve taş fırın gezi rotaları.',
    },
    {
      id: 'dijital-arsiv',
      status: 'Çok Yakında',
      title: 'Gastronomi Video Kütüphanesi',
      icon: BookOpen,
      desc: 'Geleneksel yemek hazırlama ve pişirme tekniklerini belgeleyen 10 özel mini belgesel serisi.',
    },
  ];

  return (
    <section id="kultur-mirasi" className="py-20 md:py-28 bg-paper border-t border-sand/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-8 h-px bg-copper" />
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-copper-dark font-semibold">
              05 / GELECEK LEZZET DURAKLARI
            </span>
          </div>

          <h3 className="text-3xl sm:text-4xl font-display font-bold text-forest">
            Kültür Rotaları & Arşiv
          </h3>

          <p className="text-sm text-charcoal/70 mt-2 font-sans">
            İslahiye mutfak hafızasını zenginleştirecek usta belgeselleri ve tematik rota modüllerimiz bir sonraki aşamada lezzet severlerle buluşacaktır.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {upcomingModules.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                id={item.id}
                className="p-7 rounded-sm bg-ivory/50 border border-sand/70 flex flex-col justify-between hover:border-copper/40 transition-colors shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-sm bg-forest/10 flex items-center justify-center text-forest">
                      <Icon className="w-5 h-5 text-copper" />
                    </div>
                    <span className="text-[10px] font-mono font-medium uppercase tracking-wider px-2.5 py-1 rounded-sm bg-sand/40 text-charcoal/70">
                      {item.status}
                    </span>
                  </div>

                  <h4 className="text-xl font-display font-bold text-forest mb-2">
                    {item.title}
                  </h4>

                  <p className="text-xs sm:text-sm text-charcoal/70 leading-relaxed font-sans">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-5 mt-6 border-t border-sand/40 flex items-center justify-between text-xs text-charcoal/50">
                  <span className="font-mono text-[11px] uppercase tracking-wider">İslahiye Dijital Platformlar</span>
                  <ArrowUpRight className="w-4 h-4 text-copper/60" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
