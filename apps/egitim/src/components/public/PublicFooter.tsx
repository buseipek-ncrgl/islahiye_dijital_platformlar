import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, Mail, MapPin, ArrowRight, X, CheckCircle2, Send } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactFormSubmitted, setContactFormSubmitted] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const location = useLocation();

  const isAuthPage = location.pathname === '/giris' || location.pathname === '/hesap-olustur' || location.pathname === '/';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <footer className="relative bg-[#070D18] text-slate-400 text-xs overflow-hidden border-t border-slate-800">
        {/* Background image: visible on the right, smoothly fading to solid dark navy on the left */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
          <img
            src="/images/contact_seminar_bg.jpg"
            alt=""
            className="w-full h-full object-cover object-right opacity-30 mix-blend-luminosity filter brightness-90 contrast-110"
          />
          {/* Sola doğru azalan görünürlük degrade katmanı */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070D18] via-[#070D18]/90 via-40% to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070D18]/70 via-transparent to-[#070D18]" />
        </div>

        {/* 1. UPPER SECTION: "DAHA FAZLA BİLGİ / Sorularınız var mı?" (Auth sayfalarında gizlenir) */}
        {!isAuthPage && (
          <div id="iletisim-bolumu" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-14 border-b border-slate-800/80">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              
              {/* Left: Heading & Call to Action */}
              <div className="lg:col-span-5 space-y-3.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  DAHA FAZLA BİLGİ
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Sorularınız var mı?
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
                  Eğitim programları, başvuru koşulları veya belge doğrulama hakkında merak ettikleriniz için bizimle iletişime geçin.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setContactModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl transition-colors shadow-lg cursor-pointer group"
                  >
                    <span>İletişim Sayfasına Git</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Right: 3 Contact Info Glass Cards */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Phone */}
                <a
                  href="tel:+903421234567"
                  className="bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/70 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-md transition group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400">Telefon</div>
                    <div className="text-xs sm:text-[13px] font-semibold text-white tracking-tight whitespace-nowrap">
                      +90 (342) 123 45 67
                    </div>
                  </div>
                </a>

                {/* Email */}
                <a
                  href="mailto:egitim@islahiyeto.org.tr"
                  className="bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/70 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-md transition group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400">E-posta</div>
                    <div className="text-xs sm:text-[13px] font-semibold text-white truncate" title="egitim@islahiyeto.org.tr">
                      egitim@islahiyeto.org.tr
                    </div>
                  </div>
                </a>

                {/* Address */}
                <div className="bg-slate-900/80 border border-slate-700/70 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-md">
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400">Adres</div>
                    <div className="text-[11px] font-semibold text-white leading-tight">
                      İslahiye Ticaret Odası<br />
                      İslahiye / Gaziantep
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 2. LOWER SECTION: Kurumsal 4 Kolonlu Grid & Linkler (Görsellerle Birebir) */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 pb-10 border-b border-slate-800/80">
            
            {/* Kolon 1: Marka Kimliği & Açıklama */}
            <div className="md:col-span-5 space-y-3.5">
              <Link
                to="/"
                onClick={scrollToTop}
                className="flex items-center gap-3 group cursor-pointer inline-flex"
                title="İslahiye Ticaret Odası Eğitim Portalı"
              >
                <div className="w-8.5 h-8.5 rounded-lg bg-white text-slate-900 flex items-center justify-center font-bold text-xs tracking-tight shadow-sm shrink-0">
                  <span className="font-sans font-bold">İE</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white tracking-tight leading-snug group-hover:text-blue-400 transition-colors">
                    İslahiye Ticaret Odası
                  </span>
                  <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">
                    EĞİTİM PORTALI
                  </span>
                </div>
              </Link>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Eğitim programlarını keşfetmek ve eğitim süreçlerini anlaşılır biçimde takip etmek için tasarlanmış dijital portal.
              </p>
              <div className="pt-1">
                <span className="inline-block px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 text-[11px] font-medium">
                  İslahiye Ticaret Odası Kurumsal Hizmeti
                </span>
              </div>
            </div>

            {/* Kolon 2: Keşfet */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">
                Keşfet
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <Link to="/" onClick={scrollToTop} className="hover:text-white transition-colors">
                    Ana Sayfa
                  </Link>
                </li>
                <li>
                  <Link to="/egitimler" className="hover:text-white transition-colors">
                    Eğitimler
                  </Link>
                </li>
                <li>
                  <Link to="/egitim-takvimi" className="hover:text-white transition-colors">
                    Eğitim Takvimi
                  </Link>
                </li>
              </ul>
            </div>

            {/* Kolon 3: Başvuru & Destek */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">
                Başvuru & Destek
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <Link to="/basvuru-rehberi" className="hover:text-white transition-colors">
                    Başvuru Rehberi
                  </Link>
                </li>
                <li>
                  <Link to="/belge-dogrula" className="hover:text-white transition-colors">
                    Belge Doğrulama
                  </Link>
                </li>
              </ul>
            </div>

            {/* Kolon 4: Portal */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider">
                Portal
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <button
                    type="button"
                    onClick={() => setAboutModalOpen(true)}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Hakkımızda
                  </button>
                </li>
                <li>
                  <Link to="/giris" className="hover:text-white transition-colors">
                    Giriş Yap
                  </Link>
                </li>
                <li>
                  <Link to="/hesap-olustur" className="hover:text-white transition-colors">
                    Hesap Oluştur
                  </Link>
                </li>
              </ul>
            </div>

          </div>

          {/* Alt Şerit: Telif & Hukuki Metinler */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
            <div>
              © 2026 İslahiye Ticaret Odası Eğitim Portalı • Tasarım maketi
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="hover:text-slate-200 transition-colors cursor-pointer">Gizlilik</span>
              <span className="hover:text-slate-200 transition-colors cursor-pointer">Kullanım Koşulları</span>
              <span className="hover:text-slate-200 transition-colors cursor-pointer">Çerez Politikası</span>
            </div>
          </div>
        </div>
      </footer>

      {/* İLETİŞİM MODALI */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>İE Eğitim Koordinatörlüğü İletişim</span>
              </div>
              <button
                onClick={() => {
                  setContactModalOpen(false);
                  setContactFormSubmitted(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {contactFormSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">
                  Mesajınız İletildi
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Talebiniz İslahiye Ticaret Odası Eğitim Koordinatörlüğüne ulaşmıştır. En kısa sürede dönüş sağlanacaktır.
                </p>
                <button
                  onClick={() => {
                    setContactModalOpen(false);
                    setContactFormSubmitted(false);
                  }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Tamam
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setContactFormSubmitted(true);
                }}
                className="space-y-3.5"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adınız Soyadınız
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Ahmet Yılmaz"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-Posta Adresiniz veya Telefonunuz
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: ahmet@ornek.com veya 0532..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Konu / Merak Ettiğiniz Eğitim
                  </label>
                  <select className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900">
                    <option>İslahiye Biberi ve Tarımsal E-Ticaret</option>
                    <option>Dış Ticaret ve İhracat Yönetimi</option>
                    <option>Temel Bilgisayar ve Dijital Okuryazarlık</option>
                    <option>Belge Doğrulama ve Sertifikasyon</option>
                    <option>Diğer İdari Sorular</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mesajınız
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Sorunuzu buraya yazabilirsiniz..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setContactModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium rounded-xl transition cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gönder</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* HAKKIMIZDA MODALI */}
      {aboutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <span>İslahiye Ticaret Odası Eğitim Portalı</span>
              </div>
              <button
                type="button"
                onClick={() => setAboutModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                İslahiye Ticaret Odası Eğitim Portalı; ilçemizdeki gençleri, girişimcileri, çiftçileri ve KOBİ çalışanlarını çağın mesleki ve dijital yetkinlikleriyle buluşturmayı hedefleyen kamusal bir akademi girişimidir.
              </p>
              <p>
                Tarımsal e-ticaretten dış ticarete, dijital pazarlamadan bilişim teknolojilerine kadar uzanan geniş müfredat yelpazesiyle bölge kalkınmasına ve nitelikli istihdama katkı sağlamaktadır.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setAboutModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
