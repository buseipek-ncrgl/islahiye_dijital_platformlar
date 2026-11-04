import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronRight,
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  Info,
  X,
} from 'lucide-react';
import { fetchLivePrograms, getInitialPrograms } from '../services/programAdapter';
import { Program } from '../types';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Toast } from '../components/ui/Toast';
import {
  saveDraftApplication,
  submitApplication,
  getApplicationsByCandidateId,
} from '../services/applicationStorage';

export const CandidateApplicationFormPage: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isCandidatePanel = location.pathname.startsWith('/aday');
  const { currentUser, currentRole, setRole } = useDemoRole();

  const [livePrograms, setLivePrograms] = useState<Program[]>(() => getInitialPrograms());

  useEffect(() => {
    fetchLivePrograms().then((list) => {
      if (list && list.length > 0) setLivePrograms(list);
    });
  }, []);

  // If role is not applicant, switch to applicant so user experiences the candidate workflow
  useEffect(() => {
    if (currentRole !== 'applicant') {
      setRole('applicant');
    }
  }, [currentRole, setRole]);

  // Program matching
  const program =
    livePrograms.find((p) => p.id === programId) ||
    livePrograms[0] || {
      id: programId || 'prog-01',
      title: 'Eğitim Programı',
      category: 'Tarım ve E-Ticaret',
      description: '',
      targetAudience: '',
      durationWeeks: 8,
      totalHours: 32,
      cohortName: '2026 Güz Dönemi',
      quota: 25,
      enrolledCount: 0,
      location: 'İslahiye Ticaret Odası',
      mode: 'Yüz Yüze' as const,
      status: 'open' as const,
      curriculumModules: [],
    };

  // Existing active application check
  const candidateApps = getApplicationsByCandidateId(currentUser.id);
  const existingApp = candidateApps.find(
    (a) => a.programId === program.id && !['withdrawn', 'rejected'].includes(a.status)
  );
  const isExistingDraft = existingApp?.status === 'draft';
  const isExistingSubmitted = existingApp && !isExistingDraft;

  // Form states initialized with existing draft or default candidate data
  const [educationLevel, setEducationLevel] = useState<string>(
    existingApp?.educationLevel || 'Ön Lisans'
  );
  const [occupation, setOccupation] = useState<string>(
    existingApp?.occupation || currentUser.occupation || 'Tarımsal Üretici & Girişimci'
  );
  const [residenceDistrict, setResidenceDistrict] = useState<string>(
    existingApp?.residenceDistrict || currentUser.residenceDistrict || 'İslahiye Merkez'
  );
  const [experienceYears, setExperienceYears] = useState<string>(
    existingApp?.experienceYears || '1-3 Yıl'
  );

  // Dynamic suitability questions
  const [q1, setQ1] = useState<string>(
    (existingApp?.specificAnswers?.q1 as string) || 'Evet'
  );
  const [q2, setQ2] = useState<string>(
    (existingApp?.specificAnswers?.q2 as string) || 'Evet, doğrudan üreticiyim'
  );
  const [q3, setQ3] = useState<string>(
    (existingApp?.specificAnswers?.q3 as string) || 'Evet'
  );

  // Motivation statement
  const [statement, setStatement] = useState<string>(
    existingApp?.statement || ''
  );

  // Commitments
  const [commitAttendance, setCommitAttendance] = useState<boolean>(
    existingApp?.commitments?.attendanceAccepted ?? false
  );
  const [commitAssignments, setCommitAssignments] = useState<boolean>(
    existingApp?.commitments?.assignmentsAccepted ?? false
  );
  const [commitTruthfulness, setCommitTruthfulness] = useState<boolean>(
    existingApp?.commitments?.truthfulnessAccepted ?? false
  );

  // Notifications and feedback modals
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [draftSuccessNotice, setDraftSuccessNotice] = useState<string | null>(null);
  const [submittedModalOpen, setSubmittedModalOpen] = useState(false);
  const [submittedReference, setSubmittedReference] = useState<string>('');

  // Save Draft Handler
  const handleSaveDraft = () => {
    setValidationErrors([]);
    const res = saveDraftApplication({
      id: existingApp?.id,
      candidateId: currentUser.id,
      candidateName: currentUser.fullName,
      email: currentUser.email,
      phone: currentUser.phone || '0544 *** ** 28',
      programId: program.id,
      programTitle: program.title,
      termId: program.cohortName || 'term-2026-fall',
      cohortName: program.cohortName,
      educationLevel,
      occupation,
      residenceDistrict,
      experienceYears,
      specificAnswers: { q1, q2, q3 },
      statement,
      commitments: {
        attendanceAccepted: commitAttendance,
        assignmentsAccepted: commitAssignments,
        truthfulnessAccepted: commitTruthfulness,
      },
    });

    if (res.success) {
      setDraftSuccessNotice(
        `Taslak kaydedildi (${res.application?.referenceNumber}). İstediğiniz zaman bu forma geri dönüp başvurunuzu tamamlayabilirsiniz.`
      );
      setTimeout(() => setDraftSuccessNotice(null), 5000);
    } else {
      setValidationErrors([res.error || 'Taslak kaydedilemedi.']);
    }
  };

  // Submit Application Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (!statement.trim() || statement.trim().length < 20) {
      errors.push('Lütfen eğitime katılma gerekçenizi en az 20 karakter olacak şekilde açıklayınız.');
    }
    if (!commitAttendance) {
      errors.push('Ders oturumlarına en az %80 katılım taahhüdünü onaylamanız zorunludur.');
    }
    if (!commitAssignments) {
      errors.push('Bireysel ödevleri tamamlama taahhüdünü onaylamanız zorunludur.');
    }
    if (!commitTruthfulness) {
      errors.push('Beyan ettiğiniz bilgilerin doğruluğunu onaylamanız zorunludur.');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    const res = submitApplication({
      id: existingApp?.id,
      candidateId: currentUser.id,
      candidateName: currentUser.fullName,
      email: currentUser.email,
      phone: currentUser.phone || '0544 *** ** 28',
      programId: program.id,
      programTitle: program.title,
      termId: program.cohortName || 'term-2026-fall',
      cohortName: program.cohortName,
      educationLevel,
      occupation,
      residenceDistrict,
      experienceYears,
      specificAnswers: { q1, q2, q3 },
      statement: statement.trim(),
      commitments: {
        attendanceAccepted: commitAttendance,
        assignmentsAccepted: commitAssignments,
        truthfulnessAccepted: commitTruthfulness,
      },
    });

    if (res.success && res.application) {
      setSubmittedReference(res.application.referenceNumber);
      setSubmittedModalOpen(true);
    } else {
      setValidationErrors([res.error || 'Başvuru gönderilirken bir hata oluştu.']);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500" aria-label="Sayfa Konumu">
        {isCandidatePanel ? (
          <>
            <Link to="/aday" className="hover:text-blue-600 transition-colors">Aday Paneli</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to="/aday/katalog" className="hover:text-blue-600 transition-colors">Eğitim Kataloğu</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to={`/aday/katalog/${program.id}`} className="hover:text-blue-600 transition-colors truncate max-w-[180px]">
              {program.title}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800 font-semibold">Ön Başvuru</span>
          </>
        ) : (
          <>
            <Link to="/" className="hover:text-brand-blue transition-colors">Ana Sayfa</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to="/egitimler" className="hover:text-brand-blue transition-colors">Eğitim Kataloğu</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link to={`/egitimler/${program.id}`} className="hover:text-brand-blue transition-colors truncate max-w-[180px]">
              {program.title}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800 font-semibold">Ön Başvuru Formu</span>
          </>
        )}
      </nav>

      {/* Standard Flat Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {program.title} — Ön Başvuru Formu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {program.cohortName} dönemi başvuru formunu eksiksiz doldurunuz. Değerlendirme kriterleri doğrultusunda başvurunuz incelenecektir.
          </p>
        </div>

        <div className="flex items-center gap-2.5 bg-blue-50/70 border border-blue-100 rounded-xl px-4 py-2.5 text-xs text-blue-900 shrink-0">
          <Clock className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="leading-snug text-xs font-medium">
            {program.durationWeeks} Hafta • {program.totalHours} Saat • {program.mode}
          </p>
        </div>
      </div>

      {/* Existing Active Application Notice (If candidate already applied) */}
      {isExistingSubmitted && (
        <div className="p-5 rounded-2xl bg-blue-50 border-2 border-blue-300 text-blue-950 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Info className="w-5 h-5 text-brand-blue" />
            <span>Bu Programa Ait Aktif Başvurunuz Bulunmaktadır</span>
          </div>
          <p className="text-xs leading-relaxed">
            Sayın <strong>{currentUser.fullName}</strong>, bu eğitim programına <strong>{existingApp.appliedAt}</strong> tarihinde iletilmiş bir başvurunuz ({existingApp.referenceNumber}) bulunmaktadır. Başvurunuz şu anda <strong>{existingApp.status === 'under_review' ? 'İdari İncelemede' : 'Gönderildi'}</strong> statüsündedir.
          </p>
          <div className="pt-1 flex items-center gap-3">
            <Button size="sm" onClick={() => navigate('/aday')}>
              Aday Paneline Git ve Durumu İncele →
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/egitimler')}>
              Diğer Eğitimleri Gör
            </Button>
          </div>
        </div>
      )}

      {/* Existing Draft Loaded Notice */}
      {isExistingDraft && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Save className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Kayıtlı taslağınız yüklendi (Ref: {existingApp.referenceNumber}). Bilgilerinizi kontrol edip başvurunuzu tamamlayabilirsiniz.</span>
          </div>
          <span className="text-[11px] font-mono text-amber-800 shrink-0">Son Güncelleme: {existingApp.updatedAt || existingApp.appliedAt}</span>
        </div>
      )}

      {/* Success Notification for Draft Saving (Floating Toast) */}
      <Toast message={draftSuccessNotice} onClose={() => setDraftSuccessNotice(null)} />

      {/* Validation Errors Alert Box */}
      {validationErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1.5 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Lütfen aşağıdaki eksik alanları tamamlayınız:</span>
            </div>
            <button
              type="button"
              onClick={() => setValidationErrors([])}
              className="p-1 rounded-md text-rose-400 hover:text-rose-700 hover:bg-rose-100 transition"
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* The Dynamic Application Form */}
      {!isExistingSubmitted && (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Bölüm 1: Aday Sentetik Demo Profil Bilgileri */}
          <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                1. Aday Kütük & Kimlik Bilgileri
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">Kayıtlı Profil</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Aday Adı Soyadı</label>
                <input
                  type="text"
                  disabled
                  value={currentUser.fullName}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">E-Posta Adresi</label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">İletişim Telefonu</label>
                <input
                  type="text"
                  disabled
                  value={currentUser.phone || '0544 *** ** 28'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Kayıtlı GSM numarası bildirimlerde kullanılır.</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">İkamet Bölgesi</label>
                <select
                  value={residenceDistrict}
                  onChange={(e) => setResidenceDistrict(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="İslahiye Merkez">İslahiye Merkez</option>
                  <option value="Fevzipaşa Mahallesi">Fevzipaşa Mahallesi</option>
                  <option value="Yeşilyurt Mahallesi">Yeşilyurt Mahallesi</option>
                  <option value="Altınüzüm / Boğaziçi">Altınüzüm / Boğaziçi</option>
                  <option value="Diğer Gaziantep İlçesi">Diğer Gaziantep İlçesi (Şehitkamil, Şahinbey vb.)</option>
                  <option value="İl Dışı">İl Dışı</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bölüm 2: Eğitim ve Mesleki Durum */}
          <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                2. Eğitim ve Mesleki Deneyim
              </h2>
              <span className="text-[11px] text-slate-400">Uygunluk Kriterleri</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Eğitim Düzeyi</label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="Lise / Ortaöğretim">Lise / Ortaöğretim</option>
                  <option value="Ön Lisans (Meslek Yüksekokulu)">Ön Lisans (MYO)</option>
                  <option value="Lisans (Fakülte Mezunu)">Lisans (Fakülte Mezunu)</option>
                  <option value="Lisansüstü / Yüksek Lisans">Lisansüstü / Yüksek Lisans</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mevcut Çalışma / Meslek Durumu</label>
                <select
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="Tarımsal Üretici & Çiftçi">Tarımsal Üretici & Çiftçi</option>
                  <option value="Esnaf / KOBİ Sahibi / Ortak">Esnaf / KOBİ Sahibi / Ortak</option>
                  <option value="Kooperatif Üyesi / Yöneticisi">Kooperatif Üyesi / Yöneticisi</option>
                  <option value="Özel Sektör Çalışanı / Uzman">Özel Sektör Çalışanı / Uzman</option>
                  <option value="Genç Girişimci / Yeni Mezun">Genç Girişimci / Yeni Mezun</option>
                  <option value="Serbest Meslek / Diğer">Serbest Meslek / Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">İlgili Alandaki Deneyim Süresi</label>
                <select
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="Yeni Başlayan (0 - 1 Yıl)">Yeni Başlayan (0 - 1 Yıl)</option>
                  <option value="1 - 3 Yıl">1 - 3 Yıl</option>
                  <option value="3 - 5 Yıl">3 - 5 Yıl</option>
                  <option value="5 Yıldan Fazla">5 Yıldan Fazla</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bölüm 3: Programa Özgü Uygunluk ve İhtiyaç Soruları */}
          <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                3. Programa Özgü Uygunluk Soruları
              </h2>
              <span className="text-[11px] text-brand-blue font-semibold">{program.category}</span>
            </div>

            <div className="space-y-4 text-xs">
              {program.category === 'Tarım & E-Ticaret' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-slate-800">
                      1. Tescilli İslahiye biberi veya yöresel gıda üretimi / satışı yapıyor musunuz?
                    </label>
                    <div className="flex flex-wrap gap-4 text-slate-600">
                      {['Evet, doğrudan üreticiyim', 'Hayır, ticari satış yapıyorum', 'Yeni başlayacağım'].map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="q1"
                            value={opt}
                            checked={q1 === opt}
                            onChange={(e) => setQ1(e.target.value)}
                            className="text-brand-blue focus:ring-brand-blue"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <label className="block font-semibold text-slate-800">
                      2. Daha önce internetten veya pazar yerlerinden (Trendyol, Hepsiburada vb.) ürün satışı yaptınız mı?
                    </label>
                    <div className="flex gap-4 text-slate-600">
                      {['Evet, aktif mağazam var', 'Kısmen / Sosyal medyadan', 'Hayır, sıfırdan öğreneceğim'].map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="q2"
                            value={opt}
                            checked={q2 === opt}
                            onChange={(e) => setQ2(e.target.value)}
                            className="text-brand-blue focus:ring-brand-blue"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <label className="block font-semibold text-slate-800">
                      3. E-Ticaret atölye uygulamaları için dizüstü bilgisayar veya akıllı cihaz erişiminiz var mı?
                    </label>
                    <div className="flex gap-4 text-slate-600">
                      {['Evet, kendi cihazımı getirebilirim', 'Ticaret Odası atölye bilgisayarlarını kullanacağım'].map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="q3"
                            value={opt}
                            checked={q3 === opt}
                            onChange={(e) => setQ3(e.target.value)}
                            className="text-brand-blue focus:ring-brand-blue"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              ) : program.category === 'Dış Ticaret' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-slate-800">
                      1. İşletmenizin veya çalıştığınız firmanın ihracata konu olabilecek bir ürünü var mı?
                    </label>
                    <div className="flex gap-4 text-slate-600">
                      {['Evet, mevcut ürünümüz var', 'Yeni ürün geliştirmeyi planlıyoruz', 'Danışmanlık/Lojistik alanındayım'].map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="q1"
                            value={opt}
                            checked={q1 === opt}
                            onChange={(e) => setQ1(e.target.value)}
                            className="text-brand-blue focus:ring-brand-blue"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <label className="block font-semibold text-slate-800">
                      2. Gümrük mevzuatı, akreditif veya teslim şekilleri (Incoterms) konusunda ön bilginiz var mı?
                    </label>
                    <div className="flex gap-4 text-slate-600">
                      {['Temel düzeyde var', 'Sıfırdan öğreneceğim', 'Orta / İleri düzey'].map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="q2"
                            value={opt}
                            checked={q2 === opt}
                            onChange={(e) => setQ2(e.target.value)}
                            className="text-brand-blue focus:ring-brand-blue"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-slate-800">
                      1. Ders saatlerine düzenli katılım sağlayabilecek zaman planlamanız uygun mu?
                    </label>
                    <div className="flex gap-4 text-slate-600">
                      {['Evet, tüm oturumlara eksiksiz katılabilirim', 'İş saatlerime göre kısmen katılabilirim'].map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="q1"
                            value={opt}
                            checked={q1 === opt}
                            onChange={(e) => setQ1(e.target.value)}
                            className="text-brand-blue focus:ring-brand-blue"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bölüm 4: Programa Katılma Gerekçesi (Motivasyon Beyanı) */}
          <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                4. Programa Katılma Gerekçesi (Motivasyon Beyanı)
              </h2>
              <span className="text-[11px] text-slate-400">
                {statement.length} / 500 karakter
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                Bu eğitim programına neden katılmak istediğinizi, edineceğiniz kazanımların yerel üretiminize, ticari faaliyetinize veya kariyer hedeflerinize nasıl katkı sunacağını kısaca belirtiniz.
              </p>
              <textarea
                rows={4}
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Örnek: Coğrafi işaretli ürünlerimizin paketleme kalitesini ve e-ticaret satış hacmini artırarak ilçemiz ekonomisine katkı sunmak ve doğrudan tüketiciye ulaşmak istiyorum..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue text-slate-800 leading-relaxed placeholder-slate-400"
              />
            </div>
          </div>

          {/* Bölüm 5: Ön Koşullar ve Taahhütler */}
          <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              5. Ön Koşullar ve Katılım Taahhüdü
            </h2>

            <div className="space-y-3 text-xs text-slate-700">
              <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-blue-50/40 transition-colors">
                <input
                  type="checkbox"
                  checked={commitAttendance}
                  onChange={(e) => setCommitAttendance(e.target.checked)}
                  className="mt-0.5 rounded text-brand-blue focus:ring-brand-blue"
                />
                <span className="leading-relaxed">
                  Program boyunca planlanan oturumların <strong>en az %80'ine</strong> fiziki/hibrit katılım sağlamayı taahhüt ediyorum. (Yoklamalar eğitmen tarafından manuel alınır).
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-blue-50/40 transition-colors">
                <input
                  type="checkbox"
                  checked={commitAssignments}
                  onChange={(e) => setCommitAssignments(e.target.checked)}
                  className="mt-0.5 rounded text-brand-blue focus:ring-brand-blue"
                />
                <span className="leading-relaxed">
                  Eğitmen tarafından verilecek bireysel uygulama ödevlerini teslim edeceğimi ve <strong>en az 70/100</strong> başarı ortalamasını hedeflediğimi kabul ediyorum.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-blue-50/40 transition-colors">
                <input
                  type="checkbox"
                  checked={commitTruthfulness}
                  onChange={(e) => setCommitTruthfulness(e.target.checked)}
                  className="mt-0.5 rounded text-brand-blue focus:ring-brand-blue"
                />
                <span className="leading-relaxed">
                  Formda beyan ettiğim tüm bilgilerin doğruluğunu onaylıyor, bu başvurunun ön incelemeye tabi tutulacağını ve kesin kabul kararının İslahiye Ticaret Odası Eğitim Yönetimi tarafından verileceğini kabul ediyorum.
                </span>
              </label>
            </div>
          </div>

          {/* Aksiyon Barı */}
          <div className="p-6 bg-slate-900 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="space-y-0.5 text-center sm:text-left">
              <h3 className="text-sm font-bold text-white">Başvuru İşlemini Tamamlayın</h3>
              <p className="text-xs text-slate-300">
                Taslak olarak kaydedebilir veya doğrudan idari incelemeye gönderebilirsiniz.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                className="flex-1 sm:flex-none border-slate-600 text-white hover:bg-slate-800"
                onClick={handleSaveDraft}
              >
                <Save className="w-4 h-4 mr-1.5" />
                Taslak Olarak Kaydet
              </Button>

              <Button
                type="submit"
                variant="primary"
                className="flex-1 sm:flex-none shadow-md shadow-blue-500/20"
              >
                <Send className="w-4 h-4 mr-1.5" />
                Başvuruyu Gönder
              </Button>
            </div>
          </div>

        </form>
      )}

      {/* MODAL: Başvuru Gönderildi Onay Modalı */}
      <Modal
        isOpen={submittedModalOpen}
        onClose={() => {
          setSubmittedModalOpen(false);
          navigate('/aday');
        }}
        title="Başvurunuz Başarıyla Alındı"
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSubmittedModalOpen(false);
                navigate('/aday');
              }}
            >
              Aday Paneline Git ve Takip Et →
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-1">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <strong className="block text-sm font-bold">Ön Başvurunuz Başarıyla İletildi</strong>
            <span className="inline-block font-mono text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded">
              Takip No: {submittedReference}
            </span>
          </div>

          <p>
            <strong>{program.title}</strong> eğitimi için başvurunuz idari inceleme kuyruğuna alınmıştır.
          </p>

          <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200 text-[11px] text-blue-900 space-y-1">
            <strong>İdari Süreç Bilgilendirmesi:</strong>
            <p>
              Başvurunuz ön inceleme kriter havuzuna alınmıştır. İdari komisyon değerlendirmesi tamamlandığında sonuç sistem üzerinden ve kayıtlı iletişim kanallarınızdan tarafınıza bildirilecektir.
            </p>
          </div>
        </div>
      </Modal>

    </div>
  );
};
