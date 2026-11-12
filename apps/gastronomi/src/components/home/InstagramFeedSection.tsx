import React from 'react';
import { Instagram, ArrowUpRight, Camera } from 'lucide-react';
import { ImageWithFallback } from '../ui/ImageWithFallback';

interface InstagramPost {
  id: string;
  image: string;
  caption: string;
  date: string;
  tag: string;
}

const INSTAGRAM_POSTS: InstagramPost[] = [
  {
    id: 'post-1',
    image: '/images/islahiye_biberi.jpg',
    caption:
      'Amanos eteklerinde güneşe serilen tescilli İslahiye biberlerimiz, doğal kurutma sürecinde ovayı kızıla boyuyor. Bereketli hasat günleri. #İslahiyeBiberi #Coğrafiİşaret991 #HasatZamanı',
    date: 'Eylül Hasadı',
    tag: 'HASAT & GÜNEŞ SERGİSİ',
  },
  {
    id: 'post-2',
    image: '/images/islahiye_tava.jpg',
    caption:
      'Günün ilk ışıklarıyla çarşı fırınında meşe közü yakıldı. Kuzu eti, sarımsak ve taze biberle demlenen asırlık İslahiye Tavası fırından çıktı. Sıcak pideyle servis edilir. #TaşFırın #İslahiyeTavası #Ocaklık',
    date: 'Çarşı Fırını',
    tag: 'TAŞ FIRIN LEZZETİ',
  },
  {
    id: 'post-3',
    image: '/images/firik_pilavi.jpg',
    caption:
      'Amanos yamaçlarında süt olumundaki yeşil buğday başakları meşe alevinde tütsülenerek asırlık firik aromasına kavuşuyor. Kadim toprakların bereketi sofralarımızda. #FirikPilavı #Amanos #ToprağınHafızası',
    date: 'Yayla Mevsimi',
    tag: 'AMANOS USULÜ FİRİK',
  },
  {
    id: 'post-4',
    image: '/images/hamur_zanaati_poster.jpg',
    caption:
      'Kuşaktan kuşağa aktarılan fırıncılık kültürü ve hamur zanaatı. Emeğiyle toprağın bereketini sofralara taşıyan fırıncılık geleneğine hürmetle. #Zanaat #FırınKültürü #İslahiye',
    date: 'Hamur Zanaatı',
    tag: 'ASIRLIK ZANAAT',
  },
];

export const InstagramFeedSection: React.FC = () => {
  return (
    <section id="islahiyeden-kareler" className="py-20 md:py-28 bg-[#FFFCF7] border-t border-[#DCCAB2]/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-8 h-px bg-[#BA855E]" />
              <span className="text-[11px] font-sans uppercase tracking-[0.25em] text-[#936645] font-bold">
                06 / GÜNCEL HAYAT &amp; GASTRONOMİ KARELERİ
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium text-[#203B31] leading-tight">
              İslahiye’den Kareler
            </h2>

            <p className="text-sm sm:text-base text-[#242724]/75 mt-3 max-w-2xl font-sans leading-relaxed">
              Hasat sergilerinden taş fırın mesailerine ve hamur tezgâhlarına; İslahiye’nin yaşayan gastronomi kültüründen kareler.
            </p>
          </div>

          <div className="self-start md:self-auto shrink-0">
            <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#DCCAB2] bg-[#F6F2E9] text-[#203B31] text-xs font-sans font-semibold uppercase tracking-wider">
              <Camera className="w-4 h-4 text-[#BA855E]" />
              <span>İslahiye Görsel Seçkisi</span>
            </span>
          </div>
        </div>

        {/* 4 Feed Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {INSTAGRAM_POSTS.map((post) => (
            <article
              key={post.id}
              className="bg-[#F6F2E9] rounded-2xl border border-[#DCCAB2]/80 overflow-hidden flex flex-col justify-between shadow-xs hover:border-[#BA855E]/70 transition-all group"
            >
              {/* Image with hover zoom */}
              <div className="relative aspect-square w-full overflow-hidden bg-[#203B31]">
                <ImageWithFallback
                  src={post.image}
                  alt={post.caption}
                  fallbackText={post.tag}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter saturate-[1.08]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-white/90 text-[11px] font-sans font-semibold tracking-wider uppercase">
                    {post.date}
                  </span>
                </div>

                <div className="absolute top-2.5 right-2.5">
                  <div className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-white">
                    <Instagram className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Caption and Metadata */}
              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-sans tracking-[0.2em] uppercase text-[#936645] font-bold">
                      {post.tag}
                    </span>
                    <span className="text-[10px] font-sans text-[#242724]/60 font-semibold">
                      {post.date}
                    </span>
                  </div>

                  <p className="text-xs text-[#242724]/80 font-sans leading-relaxed line-clamp-3 mb-3">
                    {post.caption}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#DCCAB2]/50 flex items-center justify-between text-[11px] text-[#242724]/60">
                  <span className="font-sans font-medium text-xs">İslahiye Kültür Arşivi</span>
                  <span className="inline-flex items-center gap-1 text-[#203B31]/75 font-sans font-semibold">
                    <span>Lezzet Atlası</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
