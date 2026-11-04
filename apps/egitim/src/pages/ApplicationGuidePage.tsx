import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  Search,
  GraduationCap,
  Users,
  Calendar,
  FileCheck,
  ListOrdered,
  Sliders,
  Award,
  HelpCircle,
  Headphones,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Cpu,
  Handshake,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

export const ApplicationGuidePage: React.FC = () => {
  const location = useLocation();
  const isCandidatePanel = location.pathname.startsWith('/aday');
  const isTraineePanel = location.pathname.startsWith('/kursiyer');
  const isPortalMode = isCandidatePanel || isTraineePanel || location.pathname.startsWith('/yonetim');

  // Active Sidebar Tab State (Default: 'genel-bilgi')
  const [activeTab, setActiveTab] = useState<string>('genel-bilgi');

  // FAQ Accordion State (open question indexes)
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0]);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // 9 Navigation Tabs for the Sidebar
  const navTabs = [
    { id: 'genel-bilgi', label: 'Genel Bilgi', icon: FileText },
    { id: 'kimler-basvurabilir', label: 'Kimler Başvurabilir?', icon: Users },
    { id: 'basvuru-tarihleri', label: 'Başvuru Tarihleri', icon: Calendar },
    { id: 'gerekli-belgeler', label: 'Gerekli Belgeler', icon: FileCheck },
    { id: 'basvuru-adimlari', label: 'Başvuru Adımları', icon: ListOrdered },
    { id: 'degerlendirme-sureci', label: 'Değerlendirme Süreci', icon: Sliders },
    { id: 'sonuclar-ve-kayit', label: 'Sonuçlar ve Kayıt', icon: Award },
    { id: 'sss', label: 'Sıkça Sorulan Sorular', icon: HelpCircle },
    { id: 'iletisim-destek', label: 'İletişim ve Destek', icon: Headphones },
  ];

  // 8 Specific FAQ Items matching the mockup exactly
  const faqItems = [
    {
      q: 'Başvuru için herhangi bir ücret var mı?',
      a: 'Hayır, İslahiye Ticaret Odası bünyesinde düzenlenen mesleki eğitim programları kamu yararına ve bölgesel kalkınma amacıyla tamamen ücretsiz olarak sunulmaktadır. Kursiyerlerden hiçbir aşamada ücret talep edilmez.',
    },
    {
      q: 'Birden fazla programa başvuru yapabilir miyim?',
      a: 'Aynı dönem içerisinde ders oturum saatleri çakışmamak kaydıyla en fazla 2 farklı eğitim programına ön başvuru yapabilirsiniz. Her program için kriterler bağımsız olarak değerlendirilir.',
    },
    {
      q: 'Başvurum ne zaman sonuçlanır?',
      a: 'Ön başvuru süresi tamamlandıktan sonra 3 iş günü içerisinde idari değerlendirme tamamlanır ve sonuçlar aday portalı üzerinden ilan edilir. Kabul edilen adaylara SMS ile bildirim gönderilir.',
    },
    {
      q: 'Eğitimler çevrim içi mi yoksa yüz yüze mi gerçekleştiriliyor?',
      a: 'Programın niteliğine göre değişmektedir. Tarımsal e-ticaret, mutfak ve el sanatları İE atölyelerinde yüz yüze; dış ticaret ve temel dijital beceriler ise hibrit (yüz yüze + çevrim içi canlı) olarak yürütülür.',
    },
    {
      q: 'Başvuru sırasında hangi belgeler gereklidir?',
      a: 'Ön başvuru esnasında sisteme herhangi bir resmi evrak yükleme zorunluluğu yoktur; beyana dayalı form doldurulur. Kesin kayıt aşamasında kimlik fotokopisi ve İslahiye ikametgah belgesi teyit edilir.',
    },
    {
      q: 'Başvuru sonucumu nasıl öğrenebilirim?',
      a: 'Sistemimize kayıt olduğunuz e-posta ve şifrenizle Aday Girişi yaparak panelinizdeki Başvurularım sekmesinden başvuru durumunuzu anlık olarak takip edebilirsiniz.',
    },
    {
      q: 'Eğitimleri tamamlayanlara sertifika veriliyor mu?',
      a: 'Evet. Eğitim oturumlarına en az %80 devam eden ve ödev/uygulama not ortalaması en az 70/100 olan kursiyerlere İE onaylı, karekodlu (QR) başarı belgesi verilir. Karekod ile doğrulama yapılabilir.',
    },
    {
      q: 'Başvurum reddedilirse tekrar başvuru yapabilir miyim?',
      a: 'Evet. Kontenjan sınırlılığı nedeniyle kabul edilemeyen adaylar bir sonraki eğitim döneminde öncelikli başvuru hakkına sahip olurlar ve yeni dönemde tekrar başvurabilirler.',
    },
  ];

  return (
    <div className={`max-w-7xl mx-auto space-y-6 pb-12 ${isPortalMode ? '' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
      
      {/* 1. BREADCRUMB (Yalnızca Kamusal Görünümde) */}
      {!isPortalMode && (
        <nav className="flex items-center gap-2 text-xs text-slate-500" aria-label="Sayfa Konumu">
          <Link to="/" className="hover:text-blue-600 transition-colors">Ana Sayfa</Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-800 font-medium">Başvuru Rehberi</span>
        </nav>
      )}

      {/* 2. PAGE HEADER: Clean Typography & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Başvuru Rehberi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Eğitim programlarımıza başvurmak için gerekli tüm bilgiler, başvuru koşulları, zorunlu belgeler ve değerlendirme aşamaları.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isPortalMode ? (
            <Link
              to={isCandidatePanel ? '/aday' : '/kursiyer'}
              className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs whitespace-nowrap"
            >
              <span>Panoya Dön →</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2.5 bg-blue-50/70 border border-blue-100 rounded-xl px-4 py-2 text-xs text-blue-900 shrink-0">
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-medium">Resmi Başvuru Rehberi</span>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. 4-STEP PROCESS HORIZONTAL STRIP                                    */}
      {/* ===================================================================== */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-7">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          
          {/* Step 1 */}
          <div className="flex items-start gap-3.5 relative">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-extrabold text-xs flex items-center justify-center shrink-0">
              1
            </div>
            <div className="space-y-1 pr-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Programı İnceleyin
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Size uygun eğitim programlarını ve kontenjan durumlarını inceleyin.
              </p>
            </div>
            {/* Arrow separator (hidden on mobile, visible on desktop) */}
            <div className="hidden md:flex items-center absolute -right-3 top-1/2 -translate-y-1/2 text-slate-300">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3.5 relative">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-extrabold text-xs flex items-center justify-center shrink-0">
              2
            </div>
            <div className="space-y-1 pr-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Başvurunuzu Yapın
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Gerekli bilgileri doldurun ve belgeleri yükleyin.
              </p>
            </div>
            <div className="hidden md:flex items-center absolute -right-3 top-1/2 -translate-y-1/2 text-slate-300">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3.5 relative">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-extrabold text-xs flex items-center justify-center shrink-0">
              3
            </div>
            <div className="space-y-1 pr-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                <Search className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Değerlendirme Süreci
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Başvurunuz, ilgili kriterlere göre değerlendirilir.
              </p>
            </div>
            <div className="hidden md:flex items-center absolute -right-3 top-1/2 -translate-y-1/2 text-slate-300">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-extrabold text-xs flex items-center justify-center shrink-0">
              4
            </div>
            <div className="space-y-1">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Sonucu Takip Edin
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Başvuru durumunuzu sistem üzerinden takip edin.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. MAIN GUIDE CONTENT: Left 9-Tab Nav + Right Detailed Sections       */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* =================================================================== */}
        {/* LEFT COLUMN: 9-TAB NAVIGATION SIDEBAR (4 COLS)                      */}
        {/* =================================================================== */}
        <aside className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3 sm:p-4 space-y-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* =================================================================== */}
        {/* RIGHT COLUMN: DETAILED SECTION CONTENT (8 COLS)                     */}
        {/* =================================================================== */}
        <main className="lg:col-span-8 space-y-8">
          
          {/* Section: Genel Bilgi & Eğitim Programları Hakkında */}
          <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
            
            {/* Header + Content + Right Featured Institutional Box */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              <div className="md:col-span-7 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  GENEL BİLGİ
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Eğitim programları hakkında
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                  İslahiye Ticaret Odası Eğitim Portalı, bölgedeki bireylerin mesleki gelişimini desteklemek amacıyla hazırlanmış çeşitli eğitim programları sunmaktadır. Bu rehber, programlarımıza başvuru sürecinde ihtiyacınız olan tüm bilgileri adım adım açıklar.
                </p>
              </div>

              {/* Right Institutional Card (İE Yerel Kalkınma Görsel Bloğu) */}
              <div className="md:col-span-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl overflow-hidden shadow-xs p-5 flex flex-col justify-between min-h-[160px] relative group">
                <div className="space-y-1 relative z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">
                    İSLAHİYE TİCARET ODASI
                  </span>
                  <h4 className="text-sm font-bold text-white leading-snug">
                    Yerel Kalkınma İçin Nitelikli Eğitim
                  </h4>
                </div>

                <div className="pt-4 flex items-center justify-between relative z-10 border-t border-slate-700/60 mt-3">
                  <span className="text-[11px] text-slate-300">Programları Keşfet</span>
                  <Link
                    to="/egitimler"
                    className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition-colors shadow-xs"
                    title="Eğitim Kataloğuna Git"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Subtle Geometric Background */}
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-4 translate-y-4">
                  <GraduationCap className="w-32 h-32 text-white" />
                </div>
              </div>

            </div>

            {/* 3 Overview Highlight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center mb-1">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Hedef Kitle
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Yerel üreticiler, esnaf, girişimciler, öğrenciler ve mesleki gelişim hedefleyen tüm bireyler.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center mb-1">
                  <Cpu className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Eğitim Türleri
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Yüz yüze, çevrim içi ve hibrit formatlarda uygulamalı eğitim programları.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100/70 text-amber-600 flex items-center justify-center mb-1">
                  <Handshake className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Katılım Belgesi
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Programı başarıyla tamamlayan katılımcılara İslahiye Ticaret Odası onaylı sertifika verilir.
                </p>
              </div>

            </div>

          </section>

          {/* Section: Sıkça Sorulan Sorular (2-Column Grid Accordion) */}
          <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  SIKÇA SORULAN SORULAR
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                  Başvuru süreci hakkında merak edilenler
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  En sık sorulan soruların cevaplarını burada bulabilirsiniz.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (openFaqIndices.length === faqItems.length) {
                    setOpenFaqIndices([]);
                  } else {
                    setOpenFaqIndices(faqItems.map((_, i) => i));
                  }
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer self-start sm:self-auto shrink-0"
              >
                {openFaqIndices.length === faqItems.length ? 'Tümünü Kapat' : 'Tüm Soruları Gör →'}
              </button>
            </div>

            {/* 2-Column Accordion Grid (Mockup ile Birebir) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Column 1 (Left 4 FAQs) */}
              <div className="space-y-3.5">
                {faqItems.slice(0, 4).map((faq, idx) => {
                  const actualIdx = idx;
                  const isOpen = openFaqIndices.includes(actualIdx);
                  return (
                    <div
                      key={actualIdx}
                      className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs"
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(actualIdx)}
                        className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <span className="font-bold text-slate-900 text-xs leading-snug">
                          {faq.q}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Column 2 (Right 4 FAQs) */}
              <div className="space-y-3.5">
                {faqItems.slice(4, 8).map((faq, idx) => {
                  const actualIdx = idx + 4;
                  const isOpen = openFaqIndices.includes(actualIdx);
                  return (
                    <div
                      key={actualIdx}
                      className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs"
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(actualIdx)}
                        className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <span className="font-bold text-slate-900 text-xs leading-snug">
                          {faq.q}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

          </section>

          {/* Additional Dynamic Guide Block for Selected Tab (when not on Genel Bilgi) */}
          {activeTab !== 'genel-bilgi' && (
            <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span className="capitalize">{navTabs.find((t) => t.id === activeTab)?.label} Detayları</span>
              </div>

              {activeTab === 'kimler-basvurabilir' && (
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>İslahiye ilçesinde ikamet eden veya faaliyet gösteren:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Yerel tarım üreticileri ve çiftçiler</li>
                    <li>Esnaf, serbest meslek sahipleri ve KOBİ çalışanları</li>
                    <li>Tarımsal kooperatifler ve kadın girişimci ortakları</li>
                    <li>Mesleki becerilerini dijital pazara taşımak isteyen yeni mezunlar ve gençler</li>
                  </ul>
                </div>
              )}

              {activeTab === 'basvuru-tarihleri' && (
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p><strong>2026 Güz Dönemi Başvuru Takvimi:</strong></p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-800 block">Ön Başvuru Kabulü</span>
                      <span className="text-blue-600 font-semibold text-[11px]">01 - 20 Ekim 2026</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-800 block">İdari İnceleme</span>
                      <span className="text-blue-600 font-semibold text-[11px]">21 - 25 Ekim 2026</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-800 block">Derslerin Başlangıcı</span>
                      <span className="text-blue-600 font-semibold text-[11px]">28 Ekim 2026</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'gerekli-belgeler' && (
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p><strong>Ön Başvuru Aşamasında:</strong> Herhangi bir fiziki evrak gerekmez; online beyan formu doldurulur.</p>
                  <p><strong>Kesin Kabul Aşamasında:</strong> T.C. Kimlik fotokopisi ve İslahiye ikametgah belgesi sistem üzerinden doğrulanır.</p>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-900 text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5 inline mr-1 text-blue-600" />
                    Bu portalda hassas kişisel veriler, vergi levhası veya finansal evraklar talep edilmez.
                  </div>
                </div>
              )}

              {activeTab === 'degerlendirme-sureci' && (
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>Adayın mesleki durumu, üretim alanı ve kooperatif üyeliğine göre sistemde açıklanabilir örnek kriter puanı hesaplanır.</p>
                  <p><strong>Kesin Karar Kuralı:</strong> Nihai kabul ve grup atama kararı yalnızca İslahiye Ticaret Odası yetkili yöneticisi tarafından verilir.</p>
                </div>
              )}

              {activeTab === 'sonuclar-ve-kayit' && (
                <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                  <p>Başvuru sonuçları aday portalında anlık olarak güncellenir. Başarılı bulunan adaylar Kursiyer Paneline yönlendirilir ve atanmış eğitmenleriyle iletişim kanalı açılır.</p>
                </div>
              )}

              {activeTab === 'iletisim-destek' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs text-slate-600">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <strong className="text-slate-800 block">Telefon</strong>
                    <span>+90 (342) 123 45 67</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <strong className="text-slate-800 block">E-Posta</strong>
                    <span>egitim@islahiyeto.org.tr</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <strong className="text-slate-800 block">Hizmet Binası</strong>
                    <span>İslahiye Ticaret Odası / Gaziantep</span>
                  </div>
                </div>
              )}

            </section>
          )}

        </main>

      </div>

    </div>
  );
};
