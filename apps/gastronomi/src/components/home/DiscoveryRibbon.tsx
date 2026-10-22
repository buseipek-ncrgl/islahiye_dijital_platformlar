import React from 'react';

interface DiscoveryRibbonProps {
  onNavigateToDishes: () => void;
  onNavigateToWorkshop: () => void;
  onNavigateToMap: () => void;
  onNavigateToHeritage: () => void;
}

export const DiscoveryRibbon: React.FC<DiscoveryRibbonProps> = ({
  onNavigateToDishes,
  onNavigateToWorkshop,
  onNavigateToMap,
  onNavigateToHeritage,
}) => {
  const items = [
    {
      id: 'lezzetler',
      title: 'Yöresel Lezzetler',
      subtitle: "İslahiye'nin özgün tatları",
      iconSrc: '/motifs/icon_casserole.png',
      iconAlt: 'Toprak Güveç Çanağı Gravürü',
      iconClass: 'w-16 h-12',
      onClick: onNavigateToDishes,
      href: '#lezzetler',
    },
    {
      id: 'tarif-atolyesi',
      title: 'Tarif Atölyesi',
      subtitle: 'Adım adım pişirme rehberi',
      iconSrc: '/motifs/icon_pitcher.png',
      iconAlt: 'Bakır Güğüm Gravürü',
      iconClass: 'w-11 h-12',
      onClick: onNavigateToWorkshop,
      href: '#tarif-atolyesi',
    },
    {
      id: 'lezzet-haritasi',
      title: 'Lezzet Haritası',
      subtitle: 'Gastronomi seyahatnamesi',
      iconSrc: '/motifs/icon_mountains.png',
      iconAlt: 'Amanos Dağları Gravürü',
      iconClass: 'w-16 h-12',
      onClick: onNavigateToMap,
      href: '#lezzet-haritasi',
    },
    {
      id: 'mutfak-mirasi',
      title: 'Mutfak Mirası',
      subtitle: 'Kültürel anlatılar ve yazılar',
      iconSrc: '/motifs/icon_oven_arch.png',
      iconAlt: 'Taş Fırın Kemer Kapı Gravürü',
      iconClass: 'w-14 h-12',
      onClick: onNavigateToHeritage,
      href: '#kultur-mirasi',
    },
  ];

  return (
    <section 
      aria-label="Keşif Şeridi" 
      className="relative z-20 bg-[#FAF6EE] border-b border-[#DCCBB3]/75 py-3 sm:py-3.5 px-4 sm:px-6 lg:px-8 xl:px-12 overflow-hidden shadow-xs"
    >
      {/* Subtle paper background texture effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-sand/10 via-transparent to-sand/15 pointer-events-none" />

      {/* Far Right Authentic Olive Branch Flourish (Zarif Köşe Bitişi) */}
      <div 
        className="hidden lg:block absolute right-0 -bottom-2 w-32 xl:w-40 h-[75px] xl:h-[85px] pointer-events-none select-none z-20"
        aria-hidden="true"
      >
        <img 
          src="/motifs/ribbon_olive_flourish.png" 
          alt="" 
          className="w-full h-full object-contain object-right-bottom opacity-85 filter drop-shadow-xs" 
        />
      </div>

      <div className="max-w-[1920px] mx-auto relative z-10 pr-0 lg:pr-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#DCCBB3]/60">
          {items.map((item, index) => (
            <a
              key={item.id}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                item.onClick();
              }}
              className={`group flex items-center justify-between gap-3 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-1.5 transition-all duration-300 hover:bg-[#F2ECE0]/60 rounded-xs focus:outline-none focus-visible:ring-1 focus-visible:ring-[#BA855E] ${
                index === 0 ? 'sm:pl-1' : ''
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                {/* Authentic master woodcut engraving icon */}
                <div 
                  className={`shrink-0 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity ${item.iconClass}`}
                >
                  <img 
                    src={item.iconSrc} 
                    alt={item.iconAlt} 
                    className="w-full h-full object-contain filter drop-shadow-xs" 
                    loading="lazy"
                  />
                </div>

                {/* Editorial Typography */}
                <div className="min-w-0">
                  <h3 className="font-display font-medium text-[#203B31] text-base sm:text-[17px] leading-tight group-hover:text-[#BA855E] transition-colors duration-200 truncate">
                    {item.title}
                  </h3>
                  <p className="font-sans text-[12px] sm:text-[13px] text-[#242724]/75 leading-tight mt-0.5 truncate">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              {/* Minimalist circular copper arrow cue */}
              <div className="shrink-0 ml-2">
                <span className="w-6 h-6 rounded-full border border-[#BA855E]/60 flex items-center justify-center text-[#BA855E] text-xs font-semibold group-hover:border-[#BA855E] group-hover:bg-[#BA855E] group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200 shadow-xs">
                  →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
