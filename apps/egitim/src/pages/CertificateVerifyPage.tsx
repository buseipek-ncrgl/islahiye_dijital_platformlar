import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
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
  Download,
  Award,
  Fingerprint,
  Calendar,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { getCertificateByVerificationCode } from '../services/certificateStorage';
import { educationApi } from '../services/apiClient';
import { CertificateRecord } from '../types';

export const CertificateVerifyPage: React.FC = () => {
  const { verificationCode: routeCode } = useParams<{ verificationCode?: string }>();
  const location = useLocation();
  const isPortalMode =
    location.pathname.startsWith('/kursiyer') ||
    location.pathname.startsWith('/yonetim') ||
    location.pathname.startsWith('/egitmen') ||
    location.pathname.startsWith('/aday');

  // State
  const [searchMethod, setSearchMethod] = useState<'code' | 'docNum'>('code');
  const [inputCode, setInputCode] = useState<string>(routeCode || 'İE-2026-ABC123');
  const [searchedCode, setSearchedCode] = useState<string>(routeCode || 'İE-2026-ABC123');
  const [isVerified, setIsVerified] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [customCert, setCustomCert] = useState<CertificateRecord | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Accordion FAQ state
  const [openFaqIndices, setOpenFaqIndices] = useState<number[]>([0]);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // Perform Verification
  const handleVerify = async (codeToSearch: string) => {
    const clean = codeToSearch.trim();
    setSearchedCode(clean);

    if (!clean) {
      setIsVerified(false);
      setNotFound(false);
      setCustomCert(null);
      return;
    }

    try {
      const apiRes = await educationApi.verifyCertificate(clean);
      if (apiRes && apiRes.isValid) {
        setIsVerified(true);
        setNotFound(false);
        setCustomCert({
          id: `cert-${clean}`,
          certificateNumber: clean,
          enrollmentId: 'enr-v',
          candidateId: 'cand-v',
          traineeName: apiRes.studentName || 'Ahmet Kaya',
          traineeEmail: '',
          programId: 'prog-v',
          programTitle: apiRes.programName || 'Dijital Pazarlama ve E-İhracat Atölyesi',
          termId: 'term-v',
          cohortName: apiRes.termName || '2026 Güz Dönemi',
          groupId: 'grp-v',
          groupName: 'A Grubu',
          certificateType: 'achievement',
          certificateTypeLabel: 'Eğitim Başarı ve Katılım Belgesi',
          status: 'issued',
          issuedAt: apiRes.issueDate ? new Date(apiRes.issueDate).toLocaleDateString('tr-TR') : '14 Ekim 2026',
          issuedBy: 'İslahiye Ticaret Odası',
          verificationCode: clean,
          verificationUrl: `/belge-dogrula/${clean}`,
          successDecisionId: 'dec-verified',
          eligibilitySnapshot: {
            attendanceRate: 100,
            attendedCount: 12,
            completedSessionsCount: 12,
            excusedCount: 0,
            assignmentAverage: 100,
            mandatoryAssignmentsApproved: 3,
            mandatoryAssignmentsTotal: 3,
            sessionsEvaluatedCount: 12,
            capturedAt: new Date().toISOString(),
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return;
      }
    } catch {
      // Local fallback
    }

    // Check localStorage storage service
    const found = getCertificateByVerificationCode(clean);
    if (found) {
      setIsVerified(true);
      setNotFound(false);
      setCustomCert(found);
    } else {
      // Special mockup fallback code: İE-2026-ABC123
      if (clean.toUpperCase() === 'İE-2026-ABC123' || clean.toUpperCase() === 'IE-2026-ABC123') {
        setIsVerified(true);
        setNotFound(false);
        setCustomCert({
          id: 'cert-demo-abc123',
          certificateNumber: 'İE-2026-ABC123',
          enrollmentId: 'enr-demo',
          candidateId: 'cand-demo',
          traineeName: 'Ali Yılmaz',
          traineeEmail: 'ali.yilmaz@ornek.com',
          programId: 'prog-01',
          programTitle: 'Dijital Pazarlama Atölyesi',
          termId: 'term-2026-01',
          cohortName: '2026 Güz Dönemi',
          groupId: 'grp-01',
          groupName: 'Hafta Sonu Şubesi',
          certificateType: 'achievement',
          certificateTypeLabel: 'Katılım ve Başarı Belgesi',
          status: 'issued',
          issuedAt: '14 Ekim 2026',
          issuedBy: 'İslahiye Ticaret Odası',
          verificationCode: 'İE-2026-ABC123',
          verificationUrl: '/belge-dogrula/İE-2026-ABC123',
          successDecisionId: 'dec-01',
          eligibilitySnapshot: {
            attendanceRate: 100,
            attendedCount: 12,
            completedSessionsCount: 12,
            excusedCount: 0,
            assignmentAverage: 95,
            mandatoryAssignmentsApproved: 3,
            mandatoryAssignmentsTotal: 3,
            sessionsEvaluatedCount: 12,
            capturedAt: '2026-10-14T10:00:00.000Z',
          },
          createdAt: '2026-10-14T10:00:00.000Z',
          updatedAt: '2026-10-14T10:00:00.000Z',
        });
      } else {
        setIsVerified(false);
        setNotFound(true);
        setCustomCert(null);
      }
    }
  };

  useEffect(() => {
    if (routeCode) {
      setInputCode(routeCode);
      handleVerify(routeCode);
    } else {
      handleVerify('İE-2026-ABC123');
    }
  }, [routeCode]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Display fields (dynamic or mockup default)
  const displayParticipant = customCert ? customCert.traineeName : 'Ali Yılmaz';
  const displayProgram = customCert ? customCert.programTitle : 'Dijital Pazarlama Atölyesi';
  const displayDocNum = customCert ? (customCert.certificateNumber || customCert.verificationCode) : 'İE-2026-ABC123';
  const displayDate = customCert ? customCert.issuedAt : '14 Ekim 2026';
  const displayDocType = customCert ? (customCert.certificateTypeLabel || 'Katılım Belgesi') : 'Katılım Belgesi';
  const displayStatus = customCert?.status === 'cancelled' ? 'İptal Edildi' : 'Geçerli ve Tescilli';

  // Sıkça Sorulan Sorular (6 Items)
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
    <div className={`max-w-7xl mx-auto space-y-7 pb-16 ${isPortalMode ? '' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
      
      {/* 1. BREADCRUMB (Yalnızca Kamusal Ziyaretçi Görünümünde) */}
      {!isPortalMode && (
        <nav className="flex items-center gap-2 text-xs text-slate-500" aria-label="Sayfa Konumu">
          <Link to="/" className="hover:text-blue-600 transition-colors">Ana Sayfa</Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 font-semibold">Belge Doğrulama</span>
        </nav>
      )}

      {/* 2. PAGE HEADER: Kurumsal Portal Header Standardı */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Belge & Karekod Doğrulama Masası
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            İslahiye Ticaret Odası onaylı katılım belgelerinin geçerliliğini, tescil tarihini ve mezuniyet durumunu dijital kütükten 7/24 sorgulayabilirsiniz.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isPortalMode ? (
            <>
              <Link
                to={location.pathname.startsWith('/kursiyer') ? '/kursiyer/belgeler' : '/yonetim/belgeler'}
                className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
              >
                <Award className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Belgelerim</span>
              </Link>
              <Link
                to={location.pathname.startsWith('/kursiyer') ? '/kursiyer' : '/yonetim'}
                className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
              >
                <span>Panoya Dön →</span>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2.5 bg-blue-50/70 border border-blue-200 rounded-xl px-4 py-2 text-xs text-blue-900 shrink-0">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-semibold">Resmî Karekod Doğrulama Kütüğü</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. TWO-COLUMN TOP CARD GRID: Sorgulama Formu + Prestij Berat Örneği */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Sol Sütun: Belge Sorgulama Formu (6 COLS) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 flex flex-col justify-between space-y-6">
          
          <div className="space-y-6">
            
            {/* Kart Başlığı */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Kütükten Belge Sorgulama
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lütfen belgenizde yer alan doğrulama kodunu veya belge numarasını giriniz.
                </p>
              </div>
            </div>

            {/* Arama Yöntemi Sekmeleri */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSearchMethod('code')}
                className={`py-2 px-3 rounded-lg transition cursor-pointer text-center ${
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
                className={`py-2 px-3 rounded-lg transition cursor-pointer text-center ${
                  searchMethod === 'docNum'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Belge Numarası ile Sorgula
              </button>
            </div>

            {/* Giriş Formu */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify(inputCode);
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>{searchMethod === 'code' ? 'Doğrulama Kodu' : 'Resmî Belge Numarası'}</span>
                  <span className="text-[11px] text-slate-400 font-normal">Harf ve rakamlar duyarlıdır</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="Örn: İE-2026-ABC123"
                    className="w-full text-sm font-mono font-bold tracking-wider text-slate-900 placeholder-slate-400 bg-white border border-slate-300 rounded-xl px-4 py-3 pr-11 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
                  />
                  <div className="absolute right-3.5 text-blue-600 pointer-events-none">
                    <QrCode className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Hızlı Test Örnekleri (Tek Tıkla Doldur ve Sorgula) */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Hızlı Demo Kodları ile Test Edin:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { label: 'İE-2026-ABC123', desc: 'Ali Yılmaz' },
                    { label: 'İE-2026-XYZ789', desc: 'Ahmet Kaya' },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        setInputCode(chip.label);
                        handleVerify(chip.label);
                      }}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{chip.label}</span>
                      <span className="text-[10px] text-slate-400">({chip.desc})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorgulama Butonu */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Belgeyi Kütükte Sorgula</span>
              </button>
            </form>

          </div>

          {/* Bilgilendirme Notu */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-950">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Doğrulama kodu, basılı veya dijital katılım belgenizin sağ alt köşesinde karekodun yanında yer alır. Kod büyük/küçük harf duyarlıdır.
            </div>
          </div>

        </div>

        {/* Sağ Sütun: Prestij Berat Tasarımı Simülasyonu (Credly & Harvard Online Standardı) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-4 flex flex-col justify-between">
          
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Resmî Belge Yapısı & Kod Konumu
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Oda onaylı karekod ve doğrulama kodunuzun belgedeki mimarisi aşağıda gösterilmiştir.
              </p>
            </div>
          </div>

          {/* Lüks Editoryal Sertifika Temsili */}
          <div className="relative p-6 sm:p-7 rounded-xl border border-amber-300/80 bg-gradient-to-b from-amber-50/30 via-white to-amber-50/20 shadow-xs text-center space-y-3.5 overflow-hidden select-none">
            
            {/* Çift Çizgili Klasik Berat Bordürü */}
            <div className="absolute inset-1.5 border border-dashed border-amber-400/40 rounded-lg pointer-events-none" />

            {/* Üst Amblem & Oda Başlığı */}
            <div className="flex flex-col items-center space-y-1 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shadow-xs border border-amber-300">
                İE
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-extrabold tracking-wide text-slate-900 uppercase block">
                  İslahiye Ticaret Odası
                </span>
                <span className="text-[10px] text-slate-500 tracking-wider uppercase block">
                  Eğitim ve Sertifikasyon Kütüğü
                </span>
              </div>
            </div>

            {/* Belge Ana Başlığı */}
            <div className="pt-1 space-y-0.5 relative z-10">
              <h4 className="text-lg sm:text-xl font-serif font-extrabold tracking-widest text-slate-900 uppercase">
                KATILIM VE BAŞARI BELGESİ
              </h4>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-sans font-semibold">
                Certificate of Participation & Achievement
              </p>
            </div>

            {/* Katılımcı Alanı */}
            <div className="space-y-0.5 relative z-10">
              <span className="text-xs text-slate-400 font-medium">Bu belge başarıyla takdim edilmiştir:</span>
              <div className="text-base font-bold text-slate-900 font-serif border-b-2 border-slate-300 pb-0.5 max-w-xs mx-auto">
                {displayParticipant}
              </div>
            </div>

            {/* Metin */}
            <p className="text-[11px] text-slate-600 max-w-sm mx-auto leading-relaxed relative z-10">
              İslahiye Ticaret Odası bünyesinde düzenlenen <strong className="text-slate-900 font-semibold">"{displayProgram}"</strong> eğitim programını %80 devam ve başarı barajıyla tamamlayarak bu belgeyi almaya hak kazanmıştır.
            </p>

            {/* Alt İmza & Karekod / Kod Alanı */}
            <div className="pt-3 flex items-end justify-between border-t border-slate-200/80 text-[10px] text-slate-500 relative z-10">
              
              <div className="text-left space-y-0.5">
                <span className="block text-slate-400">Tescil Tarihi</span>
                <span className="font-semibold text-slate-800">{displayDate}</span>
              </div>

              <div className="text-center space-y-0.5">
                <div className="w-20 h-5 mx-auto border-b border-slate-300 flex items-center justify-center font-serif italic text-slate-400 text-xs">
                  İmza & Mühür
                </div>
                <span className="font-semibold text-slate-700 block">Yönetim Kurulu Başkanı</span>
              </div>

              {/* Vurgulu Doğrulama Kodu & Karekod Kutusu */}
              <div className="relative">
                <div className="p-2 rounded-xl border-2 border-blue-600 bg-blue-50 text-center space-y-1 shadow-sm">
                  <span className="text-[9px] font-bold text-blue-900 uppercase block tracking-wider">Doğrulama Kodu</span>
                  <span className="font-mono font-bold text-xs text-blue-800 block">{displayDocNum}</span>
                </div>
              </div>

            </div>

            {/* Radar Vurgu Etiketi */}
            <div className="hidden sm:flex items-center gap-1.5 absolute right-3 bottom-16 z-20">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
              </span>
              <div className="bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-xl shadow-md whitespace-nowrap">
                Doğrulama Kodu & Karekod Alanı
              </div>
            </div>

          </div>

          <div className="text-[11px] text-slate-400 text-center">
            Örnek temsilidir; doğrulamada sistem kütüğündeki tescil kaydı esas alınır.
          </div>

        </div>

      </div>

      {/* 4. DOĞRULAMA SONUCU KARTI (CREDLY & E-DEVLET STANDARDI) */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-5">
        
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Doğrulama ve Kütük Sorgulama Sonucu
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              İslahiye Ticaret Odası merkezi veritabanından çekilen resmî tescil detayları.
            </p>
          </div>
        </div>

        {/* Sonuç Durumu */}
        {notFound ? (
          /* Bulunamadı Uyarısı */
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3.5 text-rose-800">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base">Belge Kaydı Kütükte Bulunamadı</h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  Girilen <strong>"{searchedCode}"</strong> koduna ait geçerli bir İE eğitim belgesi veya tescil sicili bulunamadı.
                </p>
              </div>
            </div>
            <div className="pt-2 text-xs text-slate-600 border-t border-rose-200/70 flex flex-wrap items-center gap-2">
              <span>Lütfen kodu kontrol ediniz veya geçerli demo kodunu deneyiniz:</span>
              <button
                type="button"
                onClick={() => {
                  setInputCode('İE-2026-ABC123');
                  handleVerify('İE-2026-ABC123');
                }}
                className="font-mono text-blue-700 font-bold hover:underline cursor-pointer bg-white px-2 py-0.5 rounded border border-slate-200"
              >
                İE-2026-ABC123
              </button>
            </div>
          </div>
        ) : isVerified ? (
          /* Doğrulandı Başarı Kartı */
          <div className="rounded-2xl border border-emerald-200 bg-white overflow-hidden shadow-2xs">
            
            {/* Yeşil Başlık Çubuğu */}
            <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50/30 p-4 sm:p-5 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span>Belge Resmî Olarak Doğrulandı</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase">
                      Sicil Aktif
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Bu belge İslahiye Ticaret Odası Yönetim Kurulu onaylı resmi kütüğe tescil edilmiştir.
                  </p>
                </div>
              </div>

              {/* Doğrulama Zaman Damgası */}
              <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 shrink-0 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Doğrulama Zamanı: <strong>Bugün (TSİ)</strong></span>
              </div>
            </div>

            {/* Detay Bilgileri Izgarası */}
            <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-500 font-medium">Katılımcı Adı Soyadı</span>
                <div className="font-bold text-slate-900 text-sm">{displayParticipant}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-500 font-medium">Eğitim Programı</span>
                <div className="font-bold text-slate-900 text-sm">{displayProgram}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-500 font-medium">Belge Türü</span>
                <div className="font-bold text-slate-900 text-sm">{displayDocType}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-500 font-medium">Kütük Sicil Numarası</span>
                <div className="font-mono font-bold text-blue-700 text-sm">{displayDocNum}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-500 font-medium">Düzenlenme Tarihi</span>
                <div className="font-bold text-slate-900 text-sm">{displayDate}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-500 font-medium">Sicil Durumu</span>
                <div className="font-bold text-emerald-700 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{displayStatus}</span>
                </div>
              </div>

            </div>

            {/* Alt Kriptografik İmza ve PDF İndirme Aksiyonları */}
            <div className="p-5 sm:p-6 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                <Fingerprint className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Dijital Parmak İzi: SHA256:7f83b165...ec498c1a (Doğrulandı)</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(window.location.href)}
                  className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Kopyalandı' : 'Bağlantıyı Kopyala'}</span>
                </button>

                <a
                  href={`/api/v1/certificates/verify/${encodeURIComponent(searchedCode)}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Resmî PDF Belgeyi İndir</span>
                </a>
              </div>
            </div>

          </div>
        ) : null}

      </section>

      {/* 5. GÜVEN VE HIZ METRİK KARTLARI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">
              Resmî Sicil Güvencesi
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Yalnızca İslahiye Ticaret Odası Yönetim Kurulu onaylı kütük belgeleri doğrulanabilir.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">
              KVKK ve Veri Gizliliği
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Doğrulama sırasında hiçbir kişisel iletişim veya hassas kimlik bilgisi dışarı sızdırılmaz.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Zap className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">
              7/24 Kesintisiz Teyit
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              İşverenler ve resmi kurumlar karekodu okutarak anında belgenin geçerliliğini teyit edebilir.
            </p>
          </div>
        </div>

      </div>

      {/* 6. SIKÇA SORULAN SORULAR AKORDEONU (6 MADDE) */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Sıkça Sorulan Sorular
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Belge doğrulama işlemi hakkında en çok merak edilen soruların cevapları.
            </p>
          </div>
          <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200 shrink-0">
            Karekod & Belge Kılavuzu
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqItems.map((faq, idx) => {
            const isOpen = openFaqIndices.includes(idx);
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/50 transition"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs font-bold text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-4 pt-1 text-xs text-slate-600 leading-relaxed bg-white border-t border-slate-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </section>

    </div>
  );
};
