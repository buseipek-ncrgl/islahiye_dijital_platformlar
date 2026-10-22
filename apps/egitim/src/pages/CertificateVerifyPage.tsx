import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldCheck,
  Lock,
  Zap,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Eye,
  QrCode,
} from 'lucide-react';
import { getCertificateByVerificationCode } from '../services/certificateStorage';
import { CertificateRecord } from '../types';

export const CertificateVerifyPage: React.FC = () => {
  const { verificationCode: routeCode } = useParams<{ verificationCode?: string }>();

  // State
  const [searchMethod, setSearchMethod] = useState<'code' | 'docNum'>('code');
  const [inputCode, setInputCode] = useState<string>(routeCode || 'İE-2026-ABC123');
  const [searchedCode, setSearchedCode] = useState<string>(routeCode || 'İE-2026-ABC123');
  const [isVerified, setIsVerified] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [customCert, setCustomCert] = useState<CertificateRecord | null>(null);

  // Accordion FAQ state
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0]);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // Perform Verification
  const handleVerify = (codeToSearch: string) => {
    const clean = codeToSearch.trim();
    setSearchedCode(clean);

    if (!clean) {
      setIsVerified(false);
      setNotFound(false);
      setCustomCert(null);
      return;
    }

    // Check Mockup default sample code
    if (
      clean.toUpperCase() === 'İE-2026-ABC123' ||
      clean.toUpperCase() === 'IE-2026-ABC123' ||
      clean.toUpperCase() === 'İTO-2026-ABC123' ||
      clean.toUpperCase() === 'ITO-2026-ABC123' ||
      clean.toLowerCase() === 'örnek' ||
      clean.toLowerCase() === 'ornek'
    ) {
      setIsVerified(true);
      setNotFound(false);
      setCustomCert(null);
      return;
    }

    // Check localStorage storage service
    const found = getCertificateByVerificationCode(clean);
    if (found) {
      setIsVerified(true);
      setNotFound(false);
      setCustomCert(found);
    } else {
      setIsVerified(false);
      setNotFound(true);
      setCustomCert(null);
    }
  };

  useEffect(() => {
    if (routeCode) {
      setInputCode(routeCode);
      handleVerify(routeCode);
    }
  }, [routeCode]);

  // Display fields (dynamic or mockup default)
  const displayParticipant = customCert ? customCert.traineeName : 'Ali Yılmaz';
  const displayProgram = customCert ? customCert.programTitle : 'Dijital Pazarlama Atölyesi';
  const displayDocNum = customCert ? (customCert.certificateNumber || customCert.verificationCode) : 'İE-2026-ABC123';
  const displayDate = customCert ? customCert.issuedAt : '14 Ekim 2026';
  const displayDocType = customCert ? (customCert.certificateTypeLabel || 'Katılım Belgesi') : 'Katılım Belgesi';
  const displayStatus = customCert?.status === 'cancelled' ? 'İptal Edildi' : 'Geçerli';

  // Sıkça Sorulan Sorular (6 Items from Mockup)
  const faqItems = [
    {
      q: 'Doğrulama kodunu nerede bulabilirim?',
      a: 'Doğrulama kodu, İslahiye Ticaret Odası tarafından düzenlenen katılım belgenizin sağ alt köşesinde karekodun (QR kod) hemen yanında veya altında yer almaktadır. "İE-2026-..." formatındadır.',
    },
    {
      q: 'Belge doğrulama işlemi ücretli mi?',
      a: 'Hayır, İE Belge Doğrulama Portalı üzerinden yapılan tüm sorgulama işlemleri 7/24 tamamen ücretsizdir ve herhangi bir üyelik gerektirmez.',
    },
    {
      q: 'Hangi belgeler doğrulanabilir?',
      a: 'Yalnızca İslahiye Ticaret Odası bünyesinde tamamlanan mesleki ve dijital eğitim programları sonrasında hak kazanılan resmi karekodlu başarı ve katılım belgeleri doğrulanabilir.',
    },
    {
      q: 'Sistem üzerinden doğrulanan belge resmî geçerliliğe sahip midir?',
      a: 'Evet, sistemimizde geçerli olarak teyit edilen tüm belgeler İslahiye Ticaret Odası Yönetim Kurulu onaylı resmi katılım belgesi hükmündedir.',
    },
    {
      q: 'Doğrulama kodu çalışmıyor, ne yapmalıyım?',
      a: 'Lütfen kodun harf ve rakamlarını (Örn: İE-2026-ABC123) eksiksiz girdiğinizden emin olun. Belgeniz yeni düzenlendiyse sistem kayıtlarına geçmesi birkaç saat alabilir. Sorun devam ederse egitim@islahiyeto.org.tr ile iletişime geçebilirsiniz.',
    },
    {
      q: 'Farklı bir kurumun belgesi doğrulanabilir mi?',
      a: 'Hayır, bu portal yalnızca İslahiye Ticaret Odası tarafından tescillenen eğitim belgeleri için yetkilidir. Diğer kamu veya özel kurum belgeleri doğrulanamaz.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* ===================================================================== */}
      {/* 1. BREADCRUMB NAVIGATION                                              */}
      {/* ===================================================================== */}
      <nav className="flex items-center gap-2 text-xs text-slate-500" aria-label="Sayfa Konumu">
        <Link to="/" className="hover:text-blue-600 transition-colors">Ana Sayfa</Link>
        <span className="text-slate-400">/</span>
        <span className="text-slate-800 font-medium">Belge Doğrulama</span>
      </nav>

      {/* ===================================================================== */}
      {/* 2. PAGE HERO: Overline, Headline & Subtitle                           */}
      {/* ===================================================================== */}
      <div className="space-y-1.5 max-w-3xl">
        <div className="text-xs font-bold text-slate-500 tracking-wider uppercase">
          SERTİFİKA DOĞRULAMA
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Belge <span className="text-blue-600">Doğrulama</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          İslahiye Ticaret Odası tarafından düzenlenen eğitim programı katılım belgelerinin doğruluğunu kolayca sorgulayabilirsiniz.
        </p>
      </div>

      {/* ===================================================================== */}
      {/* 3. TWO-COLUMN TOP CARD GRID: Input Form + Certificate Sample Preview   */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Belge Sorgulama Form (6 COLS) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 flex flex-col justify-between space-y-6">
          
          <div className="space-y-6">
            
            {/* Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Belge Sorgulama
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lütfen belgenizde yer alan doğrulama kodunu veya belge numarasını giriniz.
                </p>
              </div>
            </div>

            {/* Search Method Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSearchMethod('code')}
                className={`py-2 px-3 rounded-lg transition-colors cursor-pointer text-center ${
                  searchMethod === 'code'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Doğrulama Kodu ile Sorgula
              </button>
              <button
                type="button"
                onClick={() => setSearchMethod('docNum')}
                className={`py-2 px-3 rounded-lg transition-colors cursor-pointer text-center ${
                  searchMethod === 'docNum'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Belge Numarası ile Sorgula
              </button>
            </div>

            {/* Form Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify(inputCode);
              }}
              className="space-y-3.5"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  {searchMethod === 'code' ? 'Doğrulama Kodu' : 'Belge Numarası'}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="Örn: İE-2026-ABC123"
                    className="w-full text-sm font-semibold tracking-wide text-slate-900 placeholder-slate-400 bg-white border border-slate-200 rounded-xl px-4 py-3 pr-11 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                  <div className="absolute right-3.5 text-blue-600 pointer-events-none">
                    <QrCode className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Belgeyi Doğrula</span>
              </button>
            </form>

          </div>

          {/* Bottom Info Note */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Doğrulama kodu, belgenin sağ alt köşesinde yer almaktadır.<br />
              <span className="font-semibold text-slate-700">Kod örneği: </span>
              <button
                type="button"
                onClick={() => {
                  setInputCode('İE-2026-ABC123');
                  handleVerify('İE-2026-ABC123');
                }}
                className="font-mono text-blue-700 font-bold hover:underline cursor-pointer"
              >
                İE-2026-ABC123
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Belge Örneği Visual (6 COLS) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-4 flex flex-col justify-between">
          
          {/* Header */}
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Belge Örneği
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Doğrulama kodunun belgenizdeki konumu aşağıdaki gibidir.
              </p>
            </div>
          </div>

          {/* Graphical Certificate Representation (Mockup ile Birebir) */}
          <div className="relative p-6 sm:p-7 rounded-2xl border-4 border-double border-amber-300/80 bg-gradient-to-b from-amber-50/20 via-white to-amber-50/10 shadow-sm text-center space-y-3 overflow-hidden select-none">
            
            {/* Top Emblem & Chamber Name */}
            <div className="flex flex-col items-center space-y-1">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                İE
              </div>
              <span className="text-xs font-bold tracking-tight text-slate-800">
                İslahiye Ticaret Odası
              </span>
            </div>

            {/* Certificate Title */}
            <h4 className="text-base sm:text-lg font-serif font-extrabold tracking-wider text-slate-900 uppercase pt-0.5">
              KATILIM BELGESİ
            </h4>

            {/* Recipient */}
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-slate-800 border-b border-slate-300 pb-0.5 px-4 inline-block font-sans">
                Ad Soyad
              </span>
            </div>

            {/* Body Text */}
            <p className="text-[11px] text-slate-600 max-w-sm mx-auto leading-relaxed">
              İslahiye Ticaret Odası tarafından düzenlenen <strong className="text-slate-800">"Dijital Pazarlama Atölyesi"</strong> eğitim programına katılarak bu belgeyi almaya hak kazanmıştır.
            </p>

            {/* Bottom Row: Date, Signature & Verification Box */}
            <div className="pt-3 flex items-end justify-between border-t border-slate-200/60 text-[10px] text-slate-500">
              <div className="text-left space-y-0.5">
                <span className="block text-slate-400">Tarih</span>
                <span className="font-semibold text-slate-700">14 Ekim 2026</span>
              </div>

              <div className="text-center space-y-0.5">
                <div className="w-16 h-5 mx-auto border-b border-slate-300 flex items-center justify-center font-serif italic text-slate-400 text-[11px]">
                  İmza
                </div>
                <span className="font-semibold text-slate-700 block">Yönetim Kurulu Başkanı</span>
              </div>

              {/* Verification Code Box (Highlighted in Blue) */}
              <div className="relative">
                <div className="p-1.5 rounded-lg border-2 border-blue-600 bg-blue-50/80 text-center space-y-0.5 shadow-xs">
                  <span className="text-[9px] font-bold text-slate-600 block leading-tight">Doğrulama Kodu</span>
                  <span className="font-mono font-bold text-[10px] text-blue-700 block leading-tight">İE-2026-ABC123</span>
                </div>
              </div>
            </div>

            {/* Callout Tooltip Overlay */}
            <div className="hidden sm:flex items-center gap-1.5 absolute right-3 bottom-14 z-20">
              <div className="bg-blue-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-md whitespace-nowrap animate-pulse">
                Doğrulama kodu bu alanda yer alır.
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ===================================================================== */}
      {/* 4. THREE TRUST / FEATURE HIGHLIGHT CARDS                              */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">
              Güvenilir Doğrulama
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Yalnızca İslahiye Ticaret Odası tarafından düzenlenen belgeler doğrulanabilir.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">
              Gizliliğe Uygun
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Belge doğrulama işlemi sırasında kişisel veriler güvenle korunur.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">
              Hızlı ve Kolay
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Doğrulama kodunu girerek saniyeler içinde belgenizin geçerliliğini kontrol edin.
            </p>
          </div>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* 5. VERIFICATION RESULT SECTION (Doğrulama Sonucu)                      */}
      {/* ===================================================================== */}
      <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-5">
        
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Doğrulama Sonucu {isVerified && !customCert && '(Örnek)'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Doğrulama işlemi tamamlandığında aşağıdaki gibi bir sonuç görüntülenir.
            </p>
          </div>
        </div>

        {/* Dynamic Verification Result Card */}
        {notFound ? (
          /* Not Found State */
          <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-6 space-y-3 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3 text-rose-800">
              <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">Belge Kaydı Bulunamadı</h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  Girilen <strong>"{searchedCode}"</strong> koduna ait geçerli bir İE eğitim belgesi sistemimizde bulunamadı.
                </p>
              </div>
            </div>
            <div className="pt-2 text-xs text-slate-600">
              Lütfen kodu kontrol ediniz veya örnek kodla doğrulamayı test ediniz:{' '}
              <button
                type="button"
                onClick={() => {
                  setInputCode('İE-2026-ABC123');
                  handleVerify('İE-2026-ABC123');
                }}
                className="text-blue-600 font-bold hover:underline"
              >
                İE-2026-ABC123
              </button>
            </div>
          </div>
        ) : isVerified ? (
          /* Verified Success Card (Matches Mockup Table exactly) */
          <div className="rounded-2xl border border-emerald-200/80 bg-white overflow-hidden shadow-2xs">
            
            {/* Top Green Banner */}
            <div className="bg-emerald-50/70 p-4 sm:p-5 border-b border-emerald-100 flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Belge Doğrulandı
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Girdiğiniz doğrulama koduna ait belge sistemimizde geçerlidir.
                </p>
              </div>
            </div>

            {/* Table Details Grid (6 Fields) */}
            <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-xs">
              
              {/* Row 1 */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Katılımcı Adı</span>
                <span className="font-bold text-slate-900">{displayParticipant}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Belge Türü</span>
                <span className="font-bold text-slate-900">{displayDocType}</span>
              </div>

              {/* Row 2 */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Eğitim Programı</span>
                <span className="font-bold text-slate-900">{displayProgram}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Belge Numarası</span>
                <span className="font-mono font-bold text-slate-900">{displayDocNum}</span>
              </div>

              {/* Row 3 */}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Eğitim Tarihi</span>
                <span className="font-bold text-slate-900">{displayDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Durum</span>
                <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-md">
                  {displayStatus}
                </span>
              </div>

            </div>

          </div>
        ) : null}

      </section>

      {/* ===================================================================== */}
      {/* 6. SIKÇA SORULAN SORULAR (2 COLUMNS x 3 ROWS = 6 ACCORDION ITEMS)     */}
      {/* ===================================================================== */}
      <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                Sıkça Sorulan Sorular
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Belge doğrulama işlemi hakkında en çok merak edilen soruların cevaplarını burada bulabilirsiniz.
              </p>
            </div>
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

        {/* 2-Column Accordion Grid (3 Left, 3 Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Column 1 (Questions 1, 2, 3) */}
          <div className="space-y-3.5">
            {faqItems.slice(0, 3).map((faq, idx) => {
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

          {/* Column 2 (Questions 4, 5, 6) */}
          <div className="space-y-3.5">
            {faqItems.slice(3, 6).map((faq, idx) => {
              const actualIdx = idx + 3;
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

      {/* ===================================================================== */}
      {/* 7. IMPORTANT NOTICE BANNER (Önemli Bilgilendirme)                      */}
      {/* ===================================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-start gap-3.5 text-xs text-blue-900 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
            Önemli Bilgilendirme
          </h4>
          <p className="text-slate-600 leading-relaxed text-[11px] sm:text-xs">
            Bu sayfa yalnızca İslahiye Ticaret Odası tarafından düzenlenen eğitim programı katılım belgelerinin doğrulanması için kullanılmaktadır. Farklı kurumlar tarafından düzenlenen belgeler bu sistem üzerinden doğrulanamaz.
          </p>
        </div>
      </div>

    </div>
  );
};
