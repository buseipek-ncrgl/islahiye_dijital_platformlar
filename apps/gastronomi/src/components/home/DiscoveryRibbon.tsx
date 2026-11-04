import React from 'react';

interface DiscoveryRibbonProps {
  onNavigateToMap: () => void;
  onNavigateToDishes: () => void;
  onNavigateToDistrict: () => void;
  onNavigateToHeritage: () => void;
}

export const DiscoveryRibbon: React.FC<DiscoveryRibbonProps> = ({
  onNavigateToMap,
  onNavigateToDishes,
  onNavigateToDistrict,
  onNavigateToHeritage,
}) => {
  const items = [
    {
      id: 'lezzet-haritasi',
      title: 'Lezzet Haritası',
      subtitle: 'Coğrafi & kültürel lezzet atlası',
      iconSrc: '/motifs/icon_mountains.png',
      iconAlt: 'Amanos Dağları Gravürü',
      iconClass: 'w-16 h-12',
      onClick: onNavigateToMap,
      href: '#lezzet-haritasi',
    },
    {
      id: 'lezzetler',
      title: 'Yöresel Tarifler',
      subtitle: 'Özgün reçeteler ve lezzet kataloğu',
      iconSrc: '/motifs/icon_casserole.png',
      iconAlt: 'Toprak Güveç Çanağı Gravürü',
      iconClass: 'w-16 h-12',
      onClick: onNavigateToDishes,
      href: '#lezzetler',
    },
    {
      id: 'islahiyeyi-kesfet',
      title: 'İslahiye’yi Keşfet',
      subtitle: 'Yesemek ve kadim doğa rotaları',
      iconSrc: '/motifs/icon_pitcher.png',
      iconAlt: 'Kadim Zanaat & Güğüm Gravürü',
      iconClass: 'w-11 h-12',
      onClick: onNavigateToDistrict,
      href: '#islahiyeyi-kesfet',
    },
    {
      id: 'mutfak-mirasi',
      title: 'Mutfak Mirası',
      subtitle: 'Sözlü tarih ve kültürel bellek',
      iconSrc: '/motifs/icon_oven_arch.png',
      iconAlt: 'Taş Fırın Kemer Kapı Gravürü',
      iconClass: 'w-14 h-12',
      onClick: onNavigateToHeritage,
      href: '/mutfak-mirasi',
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
                    className="max-h-full max-w-full object-contain filter contrast-[1.08]" 
                    loading="lazy"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="block font-display font-medium text-sm sm:text-base text-[#203B31] group-hover:text-[#BA855E] transition-colors truncate">
                    {item.title}
                  </span>
                  <span className="block text-[11px] sm:text-xs text-[#242724]/70 font-sans truncate">
                    {item.subtitle}
                  </span>
                </div>
              </div>

              {/* Minimal chevron pointer */}
              <span 
                className="text-xs text-[#BA855E]/60 group-hover:text-[#BA855E] group-hover:translate-x-0.5 transition-all shrink-0 pr-1 select-none font-bold" 
                aria-hidden="true"
              >
                ›
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
