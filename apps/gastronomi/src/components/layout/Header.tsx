import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight } from 'lucide-react';

interface HeaderProps {
  onNavigate?: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const navItems = [
    { label: 'Keşfet', href: '#kesfet', isRoute: false },
    { label: 'Yöresel Lezzetler', href: '#lezzetler', isRoute: false },
    { label: 'Tarif Atölyesi', href: '#tarif-atolyesi', isRoute: false },
    { label: 'Lezzet Haritası', href: '/lezzet-haritasi', isRoute: true },
    { label: 'Mutfak Mirası', href: '/mutfak-mirasi', isRoute: true },
    { label: 'Haberler & Yazılar', href: '/haberler', isRoute: true },
    { label: 'Etkinlikler', href: '/etkinlikler', isRoute: true },
  ];

  const handleNavClick = (target: (typeof navItems)[0] | string) => {
    setMobileMenuOpen(false);
    const item =
      typeof target === 'string'
        ? navItems.find((n) => n.href === target) || {
            label: '',
            href: target,
            isRoute: false,
          }
        : target;

    if (item.isRoute) {
      navigate(item.href);
      return;
    }

    if (location.pathname !== '/') {
      navigate('/' + item.href);
      return;
    }

    if (onNavigate) {
      onNavigate(item.href);
    } else {
      const element = document.querySelector(item.href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      {/* Top Institutional Bar */}
      <div className="bg-forest text-ivory/80 text-[11px] font-sans tracking-widest uppercase py-2 px-4 border-b border-forest-800/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-copper inline-block" />
            <span className="font-semibold text-ivory">İslahiye Dijital Platformlar</span>
            <span className="text-ivory/40">•</span>
            <span className="text-ivory/70 hidden sm:inline">Gastronomi & Kültür Portalı</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-ivory/60">
            <span className="hidden md:inline">Amanos & İslahiye Mutfak Havzası</span>
            <a
              href="http://localhost:5174"
              target="_blank"
              rel="noreferrer"
              className="text-copper-light hover:text-ivory transition-colors flex items-center gap-1 font-medium"
            >
              <span>Eğitim Platformu</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-ivory/95 backdrop-blur-md shadow-sm border-b border-sand/70 py-3.5'
            : 'bg-ivory/80 backdrop-blur-sm border-b border-sand/40 py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Left: Textual Institutional Brand Lockup */}
            <a
              href="#kesfet"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('#kesfet');
              }}
              className="group flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-forest rounded"
            >
              <span className="text-[10px] sm:text-[11px] font-sans font-bold tracking-[0.25em] uppercase text-charcoal/70 group-hover:text-forest transition-colors">
                İSLAHİYE TİCARET ODASI
              </span>
              <span className="text-xl sm:text-2xl font-display font-bold text-forest tracking-tight flex items-center gap-1.5">
                LEZZET ATLASI
                <span className="w-1.5 h-1.5 rounded-full bg-copper inline-block group-hover:scale-125 transition-transform" />
              </span>
            </a>

            {/* Desktop Navigation Links (Clean, No dev badges) */}
            <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-charcoal/80">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.href);
                  }}
                  className="relative group py-1 text-charcoal/85 hover:text-forest transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-forest rounded"
                >
                  <span>{item.label}</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-copper group-hover:w-full transition-all duration-300" />
                </a>
              ))}
            </nav>

            {/* Header Right Action */}
            <div className="hidden lg:flex items-center gap-4">
              <a
                href="#lezzetler"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('#lezzetler');
                }}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-sm bg-forest text-ivory text-xs font-semibold tracking-widest uppercase hover:bg-forest-600 active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-copper"
              >
                <span>Lezzetleri Keşfet</span>
              </a>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-2.5 rounded-lg text-charcoal hover:text-forest hover:bg-sand/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest transition-colors"
                aria-label="Menüyü aç"
                aria-expanded={mobileMenuOpen}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Accessible Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <div className="fixed inset-y-0 right-0 max-w-sm w-full bg-ivory shadow-2xl flex flex-col justify-between p-6 overflow-y-auto border-l border-sand">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-6 border-b border-sand/70">
                <div>
                  <span className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-charcoal/60">
                    İSLAHİYE TİCARET ODASI
                  </span>
                  <h3 className="text-xl font-display font-bold text-forest mt-0.5">
                    LEZZET ATLASI
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full text-charcoal/70 hover:text-forest hover:bg-sand/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest transition-colors"
                  aria-label="Menüyü kapat"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Drawer Links */}
              <nav className="mt-8 flex flex-col space-y-4">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.href);
                    }}
                    className="flex items-center justify-between py-2 text-base font-medium text-charcoal hover:text-forest border-b border-sand/30 transition-colors"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="w-4 h-4 text-copper/60" />
                  </a>
                ))}
                <a
                  href="http://localhost:5174"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between py-2 text-base font-medium text-copper-dark hover:text-forest border-b border-sand/30 transition-colors"
                >
                  <span>Eğitim Platformu</span>
                  <ArrowUpRight className="w-4 h-4 text-copper" />
                </a>
              </nav>
            </div>

            {/* Drawer Bottom Action */}
            <div className="pt-8 border-t border-sand/70">
              <a
                href="#lezzetler"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('#lezzetler');
                }}
                className="w-full flex items-center justify-center py-3 rounded-sm bg-forest text-ivory text-xs font-semibold tracking-widest uppercase hover:bg-forest-600 transition-colors shadow-xs"
              >
                <span>Lezzetleri Keşfet</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
