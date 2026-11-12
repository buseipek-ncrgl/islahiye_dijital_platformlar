import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Compass, Mountain, Landmark, Waves } from 'lucide-react';
import { ImageWithFallback } from '../ui/ImageWithFallback';

interface DiscoverySpot {
  id: string;
  title: string;
  badge: string;
  sensoryNote: string;
  description: string;
  location: string;
  image: string;
  icon: React.ComponentType<{ className?: string }>;
  targetRoute: string;
}

const DISCOVERY_SPOTS: DiscoverySpot[] = [
  {
    id: 'yesemek',
    title: 'Yesemek Açık Hava Müzesi & Heykel Atölyesi',
    badge: 'UNESCO GEÇİCİ MİRASI',
    sensoryNote: 'Bazalt taş bloklar, asırlık zeytin gölgeleri ve güneşin ısıttığı heykeller',
    description:
      'M.Ö. 900’lü yıllara uzanan, Yakın Doğu’nun en büyük taş ocağı ve heykel işleme atölyesi. Yüzlerce sfenks, aslan heykeli ve kadim bazalt taş işçiliği mirası.',
    location: 'Yesemek Köyü, İslahiye',
    image: '/images/amanos_daglari.jpg',
    icon: Landmark,
    targetRoute: '/mutfak-mirasi',
  },
  {
    id: 'tilmen-hoyuk',
    title: 'Tilmen Höyük Arkeoloji Parkı',
    badge: 'M.Ö. 4000 KADİM YERLEŞİM',
    sensoryNote: 'Altın sarısı buğday başakları ve Karasu Vadisi kadim saray kalıntıları',
    description:
      'İslahiye Ovası’nın en eski saray, sur ve tapınak kalıntıları. Kadim çağlardan beri zeytincilik ve buğday tarımının sürdürüldüğü bereketli havza.',
    location: 'Karasu Vadisi, İslahiye',
    image: '/images/firik_pilavi.jpg',
    icon: Compass,
    targetRoute: '/lezzet-haritasi?mode=cultural',
  },
  {
    id: 'amanos-yaylalari',
    title: 'Amanos & Huzurlu Yaylaları',
    badge: 'DOĞAL SU PINARLARI & FİRİK HAVZASI',
    sensoryNote: 'Kekik kokulu pınarlar, serin çam gölgeleri ve tütsülü firik ateşi',
    description:
      'Çam ve meşe ormanlarıyla bezeli serin yaylalar; lezzetlerimize tütsülü aromasını veren yeşil firik buğdayının ve yayla kekiğinin ana vatanı.',
    location: 'Amanos Dağları Sıradağları',
    image: '/images/amanos_daglari.jpg',
    icon: Mountain,
    targetRoute: '/lezzet-haritasi?mode=cultural',
  },
  {
    id: 'tahtakopru',
    title: 'Tahtaköprü Barajı & Kuş Cenneti',
    badge: 'SULAK ALAN & EKOLOJİK MİRAS',
    sensoryNote: 'Sazlıkların hışırtısı, göçmen kuş kanat sesleri ve ovanın bereket suyu',
    description:
      'Göçmen kuşların dinlenme durağı olan sulak sazlıklar ve ovadaki biber tarlalarını asırlardır besleyen can damarı su ekosistemi.',
    location: 'Tahtaköprü Havzası',
    image: '/images/islahiye_biberi.jpg',
    icon: Waves,
    targetRoute: '/lezzet-haritasi?mode=cultural',
  },
];

export const DiscoverDistrictSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="islahiyeyi-kesfet" className="py-20 md:py-28 bg-[#F6F2E9] border-t border-[#DCCAB2]/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-8 h-px bg-[#BA855E]" />
              <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[#936645] font-bold">
                05 / İLÇE TANITIMI &amp; KADİM COĞRAFYA
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium text-[#203B31] leading-tight">
              İslahiye’yi Keşfet
            </h2>

            <p className="text-sm sm:text-base text-[#242724]/75 mt-3 max-w-2xl font-sans leading-relaxed">
              Amanos Dağları’nın gölgesinde, Hititlerin bazalt heykel atölyelerinden asırlık yaylalara uzanan kadim bir coğrafya. Lezzetlerimizin kök saldığı toprakları, tarihî durakları ve doğal güzellikleri adımlayın.
            </p>
          </div>

          <div className="self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => navigate('/mutfak-mirasi')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#203B31]/30 bg-[#FFFCF7] text-[#203B31] text-xs font-semibold uppercase tracking-wider hover:bg-[#203B31] hover:text-[#F6F2E9] transition-colors shadow-xs cursor-pointer"
            >
              <span>Ayrıntılı Gezi &amp; Kültür Rehberi</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#BA855E]" />
            </button>
          </div>
        </div>

        {/* Asymmetric 4-Card Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DISCOVERY_SPOTS.map((spot, idx) => {
            const Icon = spot.icon;
            return (
              <article
                key={spot.id}
                className="bg-[#FFFCF7] rounded-2xl border border-[#DCCAB2]/80 overflow-hidden flex flex-col justify-between shadow-xs hover:border-[#BA855E]/60 transition-all group"
              >
                <div>
                  {/* Photo Container with Editorial Fallback */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#203B31]">
                    <ImageWithFallback
                      src={spot.image}
                      alt={spot.title}
                      fallbackText={spot.title}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter saturate-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#203B31]/80 via-transparent to-transparent pointer-events-none" />
                    
                    <div className="absolute top-2.5 left-2.5">
                      <span className="text-[10px] font-sans font-bold tabular-nums uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#203B31]/90 text-[#F6F2E9] backdrop-blur-xs">
                        0{idx + 1}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-1.5 text-white/90 text-[11px] font-sans">
                      <MapPin className="w-3 h-3 text-[#BA855E] shrink-0" />
                      <span className="truncate">{spot.location}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-sans tracking-wider uppercase text-[#936645] font-bold block">
                        {spot.badge}
                      </span>
                      <Icon className="w-4 h-4 text-[#BA855E] shrink-0" />
                    </div>

                    <h3 className="text-lg font-display font-medium text-[#203B31] mb-2 leading-snug group-hover:text-[#BA855E] transition-colors">
                      {spot.title}
                    </h3>

                    {/* Sensory Editorial Observation */}
                    <p className="text-[11px] text-[#936645] italic font-display mb-2.5 leading-snug">
                      "{spot.sensoryNote}"
                    </p>

                    <p className="text-xs text-[#242724]/75 font-sans leading-relaxed">
                      {spot.description}
                    </p>
                  </div>
                </div>

                {/* Footer link */}
                <div className="px-5 pb-5 pt-2 border-t border-[#DCCAB2]/40">
                  <button
                    type="button"
                    onClick={() => navigate(spot.targetRoute)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#203B31] font-semibold tracking-wide hover:text-[#BA855E] transition-colors cursor-pointer"
                  >
                    <span>Miras Kaydını İncele</span>
                    <ArrowRight className="w-3 h-3 text-[#BA855E]" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
