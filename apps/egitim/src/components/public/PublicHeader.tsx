import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn, ChevronRight, LayoutDashboard, User } from 'lucide-react';
import { useDemoRole } from '../layout/DemoRoleContext';

export const PublicHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { currentRole, currentUser } = useDemoRole();

  const getHomePath = () => {
    switch (currentRole) {
      case 'superadmin':
        return '/yonetim/super-admin';
      case 'admin':
        return '/yonetim';
      case 'trainee':
        return '/kursiyer';
      case 'instructor':
        return '/egitmen';
      case 'applicant':
        return '/aday';
      default:
        return '/';
    }
  };

  const isAuthenticated = currentRole !== 'visitor';
  const homePath = getHomePath();

  // Close mobile menu on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

  const navLinks = currentRole === 'applicant'
    ? [
        { to: '/aday/katalog', label: 'Eğitimler', end: false },
        { to: '/aday/takvim', label: 'Eğitim Takvimi', end: false },
        { to: '/aday/rehber', label: 'Başvuru Rehberi', end: false },
        { to: '/belge-dogrula', label: 'Belge Doğrulama', end: false },
      ]
    : [
        { to: '/egitimler', label: 'Eğitimler', end: false },
        { to: '/egitim-takvimi', label: 'Eğitim Takvimi', end: false },
        { to: '/basvuru-rehberi', label: 'Başvuru Rehberi', end: false },
        { to: '/belge-dogrula', label: 'Belge Doğrulama', end: false },
      ];

  return (
    <>
      {/* Skip to Content for WCAG Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-blue focus:text-white focus:rounded-md focus:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
      >
        Ana içeriğe atla
      </a>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between flex-nowrap gap-3 xl:gap-4">
          
          {/* Brand Logo & Typographic Title */}
          <Link
            to={homePath}
            className="flex items-center gap-2.5 sm:gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg p-1 shrink-0 whitespace-nowrap"
            title="İslahiye Ticaret Odası Eğitim Portalı Ana Sayfa"
          >
            {/* Minimal Geometric Emblem */}
            <div className="w-8.5 h-8.5 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-sm group-hover:bg-blue-600 transition-colors shrink-0">
              <span className="font-sans font-bold">İE</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight leading-snug group-hover:text-blue-600 transition-colors whitespace-nowrap">
                İslahiye Ticaret Odası
              </span>
              <span className="text-[9px] text-blue-600 font-bold uppercase tracking-wider whitespace-nowrap">
                EĞİTİM PORTALI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation - 100% Single Line */}
          <nav className="hidden lg:flex items-center gap-3.5 xl:gap-6 text-xs xl:text-sm font-medium text-slate-600 whitespace-nowrap shrink-0" aria-label="Ana Gezinti Menüsü">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `transition-colors py-1 border-b-2 font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    isActive
                      ? 'text-blue-600 font-semibold border-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <button
              onClick={() => setAboutModalOpen(true)}
              className="py-1 border-b-2 border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors cursor-pointer whitespace-nowrap"
            >
              Hakkımızda
            </button>
          </nav>

          {/* Actions: Search Button, Giriş Yap, Hesap Oluştur & Demo Önizleme - 100% Single Line */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap">
            {/* Quick Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="w-8 h-8 rounded-full border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 flex items-center justify-center transition cursor-pointer mr-0.5 shrink-0"
              title="Eğitim veya Müfredat Ara"
              aria-label="Arama"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => navigate(homePath)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap shrink-0"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Genel Bakışa Dön ({currentUser.fullName.split(' ')[0]})</span>
              </button>
            ) : (
              <>
                {/* Giriş Yap (Outline Button) */}
                <button
                  onClick={() => navigate('/')}
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-500" />
                  <span>Giriş Yap</span>
                </button>

                {/* Hesap Oluştur (Primary Blue Button) */}
                <button
                  onClick={() => navigate('/hesap-olustur')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Hesap Oluştur</span>
                </button>
              </>
            )}


            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-public-navigation"
              aria-label="Gezinti Menüsünü Aç / Kapat"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Navigation Panel */}
        <div
          id="mobile-public-navigation"
          className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-50 shadow-2xl border-l border-brand-border flex flex-col justify-between transition-transform duration-300 lg:hidden ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          aria-label="Mobil Menü"
        >
          <div>
            {/* Mobile Drawer Header */}
            <div className="p-4 border-b border-brand-border flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-navy text-white font-bold flex items-center justify-center text-xs">
                  İE
                </div>
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  İslahiye Ticaret Odası
                  <span className="block text-[10px] text-brand-blue font-semibold uppercase tracking-wider">
                    Eğitim Portalı
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
                aria-label="Menüyü Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="p-4 space-y-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-brand-blue font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  <span>{link.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Mobile Drawer Bottom Actions */}
          <div className="p-4 border-t border-brand-border bg-slate-50 space-y-3">
            <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
              <strong>İslahiye Ticaret Odası:</strong> Resmi Akademi ve Eğitim Koordinasyon Portalı.
            </div>
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(homePath);
                }}
                className="w-full flex items-center justify-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg shadow-2xs transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Genel Bakışa Dön ({currentUser.fullName.split(' ')[0]})</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/giris');
                }}
                className="w-full flex items-center justify-center gap-2 text-sm bg-brand-blue hover:bg-brand-blueHover text-white font-medium py-3 rounded-lg shadow-2xs transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Giriş Yap & Rol Seç</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Quick Search Dialog (Coursera / École des Ponts Inspired) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Eğitim ve Müfredat Arama</span>
              </div>
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Örn: Biber, Gastronomi, Dış Ticaret, E-Ticaret, Sertifika..."
                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Suggestions */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Popüler Konular ve Programlar
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'İslahiye Biberi & E-Ticaret', to: '/egitimler/prog-01' },
                  { label: 'Dış Ticaret ve İhracat', to: '/egitimler/prog-02' },
                  { label: 'Temel Bilgisayar & Ofis', to: '/egitimler/prog-03' },
                  { label: 'Başvuru Koşulları', to: '/basvuru-rehberi' },
                  { label: 'Karekod Belge Doğrulama', to: '/belge-dogrula' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchOpen(false);
                      navigate(item.to);
                    }}
                    className="text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-600 px-3 py-1.5 rounded-lg border border-slate-200 transition text-slate-700"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
              <span>Esc tuşuyla kapatabilirsiniz</span>
              <button
                onClick={() => {
                  setSearchOpen(false);
                  navigate('/egitimler');
                }}
                className="text-blue-600 font-semibold hover:underline"
              >
                Tüm Kataloğu Gör →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Institutional About Modal (İE Hakkımızda) */}
      {aboutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                  İE
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">İslahiye Ticaret Odası</h3>
                  <p className="text-[11px] text-blue-600 font-semibold">Mesleki Eğitim ve Bölgesel Kalkınma</p>
                </div>
              </div>
              <button
                onClick={() => setAboutModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                İslahiye Ticaret Odası Eğitim Portalı, ilçemizin ekonomik dinamiklerini güçlendirmek, yerel üreticileri, esnafı ve iş arayan gençleri yüksek nitelikli becerilerle donatmak amacıyla tasarlanmış kurumsal kamu platformudur.
              </p>
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1.5 text-blue-900">
                <div className="font-semibold text-xs">Platform Misyonumuz:</div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-blue-800">
                  <li>İslahiye Biberi ve tarımsal katma değerli ürünlerde dijital e-ticaret okuryazarlığı</li>
                  <li>Dış ticaret, gümrük ve ihracat kapasitesinin KOBİ düzeyinde artırılması</li>
                  <li>Uygulamalı atölyeler ve karekodlu güvenilir başarı belgeleriyle istihdam desteği</li>
                </ul>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500">
                * Eğitim programları ve takvim İslahiye Ticaret Odası koordinasyonunda güncellenmektedir.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setAboutModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
              >
                Anladım, Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
