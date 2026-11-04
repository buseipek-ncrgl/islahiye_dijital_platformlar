import React from 'react';
import { Instagram, ArrowUpRight, Heart, MessageCircle } from 'lucide-react';

interface InstagramPost {
  id: string;
  image: string;
  caption: string;
  date: string;
  likes: number;
  comments: number;
  tag: string;
}

const INSTAGRAM_POSTS: InstagramPost[] = [
  {
    id: 'post-1',
    image: '/images/islahiye_biberi.jpg',
    caption:
      'Amanos eteklerinde güneşe serilen tescilli İslahiye biberlerimiz, doğal kurutma sürecinde ovayı kızıla boyuyor. Bereketli hasat günleri. #İslahiyeBiberi #Coğrafiİşaret991 #HasatZamanı',
    date: '18 Ekim 2026',
    likes: 342,
    comments: 28,
    tag: 'HASAT & GÜNEŞ SERGİSİ',
  },
  {
    id: 'post-2',
    image: '/images/islahiye_tava.jpg',
    caption:
      'Günün ilk ışıklarıyla çarşı fırınında meşe közü yakıldı. Kuzu eti, sarımsak ve taze biberle demlenen asırlık İslahiye Tavası fırından çıktı. Sıcak pideyle servis edilir. #TaşFırın #İslahiyeTavası #Ocaklık',
    date: '15 Ekim 2026',
    likes: 519,
    comments: 44,
    tag: 'TAŞ FIRIN LEZZETİ',
  },
  {
    id: 'post-3',
    image: '/images/firik_pilavi.jpg',
    caption:
      'Amanos yamaçlarında süt olumundaki yeşil buğday başakları meşe alevinde tütsülenerek asırlık firik aromasına kavuşuyor. Kadim toprakların bereketi sofralarımızda. #FirikPilavı #Amanos #ToprağınHafızası',
    date: '12 Ekim 2026',
    likes: 287,
    comments: 19,
    tag: 'AMANOS USULÜ FİRİK',
  },
  {
    id: 'post-4',
    image: '/images/hamur_zanaati_poster.jpg',
    caption:
      'Kuşaktan kuşağa aktarılan fırıncılık kültürü ve hamur zanaatı. Emeğiyle toprağın bereketini sofralara taşıyan emektar çarşı ustalarımıza hürmetle. #Zanaat #FırınUstaları #İslahiye',
    date: '08 Ekim 2026',
    likes: 412,
    comments: 31,
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
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#936645] font-semibold">
                05 / GÜNCEL HAYAT &amp; SAHA KARELERİ
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium text-[#203B31] leading-tight">
              İslahiye’den Kareler
            </h2>

            <p className="text-sm sm:text-base text-[#242724]/75 mt-3 max-w-2xl font-sans leading-relaxed">
              İslahiye Ticaret Odasının sahadan anlık hasat sergileri, asırlık taş fırın mesaileri ve zanaatkâr buluşmaları. Yaşayan gastronomi kültürünü sosyal medya arşivimizden takip edin.
            </p>
          </div>

          <div className="self-start md:self-auto shrink-0">
            <a
              href="https://www.instagram.com/islahiyeto"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xs border border-[#203B31]/30 bg-[#F6F2E9] text-[#203B31] text-xs font-semibold uppercase tracking-wider hover:bg-[#203B31] hover:text-[#F6F2E9] transition-colors shadow-xs"
            >
              <Instagram className="w-4 h-4 text-[#BA855E]" />
              <span>@islahiyeto Takip Edin</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
            </a>
          </div>
        </div>

        {/* 4 Instagram Feed Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {INSTAGRAM_POSTS.map((post) => (
            <article
              key={post.id}
              className="bg-[#F6F2E9] rounded-xs border border-[#DCCAB2]/80 overflow-hidden flex flex-col justify-between shadow-xs hover:border-[#BA855E]/70 transition-all group"
            >
              {/* Image with hover zoom */}
              <div className="relative aspect-square w-full overflow-hidden bg-[#203B31]">
                <img
                  src={post.image}
                  alt={post.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter saturate-[1.08]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <div className="flex items-center gap-4 text-white text-xs font-medium">
                    <span className="flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 fill-white/80" />
                      {post.likes}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 fill-white/80" />
                      {post.comments}
                    </span>
                  </div>
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
                    <span className="text-[10px] font-mono tracking-wider uppercase text-[#936645] font-semibold">
                      {post.tag}
                    </span>
                    <span className="text-[10px] font-mono text-[#242724]/50">
                      {post.date}
                    </span>
                  </div>

                  <p className="text-xs text-[#242724]/80 font-sans leading-relaxed line-clamp-3 mb-3">
                    {post.caption}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#DCCAB2]/50 flex items-center justify-between text-[11px] text-[#242724]/60">
                  <span className="font-mono">İTO Resmî Gönderisi</span>
                  <a
                    href="https://www.instagram.com/islahiyeto"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#203B31] font-semibold hover:text-[#BA855E] transition-colors"
                  >
                    <span>İncele</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
