import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  PlusCircle,
  ChevronRight,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { Application, ApplicationStatus } from '../types';
import {
  getApplicationsByCandidateId,
  withdrawApplication,
  resetApplicationsToDefaults,
  subscribeToApplicationUpdates,
} from '../services/applicationStorage';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  getStoredEnrollments,
  getActiveAssignmentForEnrollment,
  subscribeToEnrollmentUpdates,
} from '../services/enrollmentStorage';

export const CandidateDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, currentRole, setRole, activeUserKey, setActiveUserKey } = useDemoRole();

  // If role is not applicant, switch to applicant
  useEffect(() => {
    if (currentRole !== 'applicant') {
      setRole('applicant');
    }
  }, [currentRole, setRole]);

  // Load applications for current candidate
  const [candidateApps, setCandidateApps] = useState<Application[]>(() =>
    getApplicationsByCandidateId(currentUser.id)
  );

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawNotice, setWithdrawNotice] = useState<string | null>(null);

  // Sync state on candidate change or storage updates
  useEffect(() => {
    const apps = getApplicationsByCandidateId(currentUser.id);
    setCandidateApps(apps);
    if (apps.length > 0) {
      // Keep selected or choose first
      setSelectedAppId((prev) => (apps.some((a) => a.id === prev) ? prev : apps[0].id));
    } else {
      setSelectedAppId(null);
    }

    const unsubscribe = subscribeToApplicationUpdates(() => {
      const updated = getApplicationsByCandidateId(currentUser.id);
      setCandidateApps(updated);
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  // Enrollment and Group Assignment tracking for Sprint E02-C
  const [enrollments, setEnrollments] = useState(() => getStoredEnrollments());

  useEffect(() => {
    const unsub = subscribeToEnrollmentUpdates(() => {
      setEnrollments(getStoredEnrollments());
    });
    return () => unsub();
  }, []);

  const selectedApp = candidateApps.find((a) => a.id === selectedAppId) || candidateApps[0] || null;

  const selectedEnrollment = React.useMemo(() => {
    if (!selectedApp) return null;
    return (
      enrollments.find((e) => e.applicationId === selectedApp.id) ||
      enrollments.find(
        (e) =>
          e.candidateId === selectedApp.candidateId &&
          e.programId === selectedApp.programId
      ) ||
      null
    );
  }, [selectedApp, enrollments]);

  const selectedAssignment = React.useMemo(() => {
    if (!selectedEnrollment) return null;
    return getActiveAssignmentForEnrollment(selectedEnrollment.id) || null;
  }, [selectedEnrollment]);

  // Status badge styling helper
  const getStatusBadgeInfo = (
    status: ApplicationStatus
  ): { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' } => {
    switch (status) {
      case 'draft':
        return { label: 'Taslak', variant: 'neutral' };
      case 'submitted':
        return { label: 'Gönderildi', variant: 'info' };
      case 'under_review':
      case 'pending':
        return { label: 'İncelemede', variant: 'warning' };
      case 'accepted':
        return { label: 'Kabul Edildi', variant: 'success' };
      case 'waitlisted':
      case 'reserve':
        return { label: 'Yedek Listede', variant: 'info' };
      case 'rejected':
        return { label: 'Reddedildi', variant: 'danger' };
      case 'withdrawn':
        return { label: 'Geri Çekildi', variant: 'neutral' };
      default:
        return { label: status, variant: 'neutral' };
    }
  };

  // Withdraw action handler
  const handleConfirmWithdraw = () => {
    if (!selectedApp) return;
    const res = withdrawApplication(selectedApp.id, currentUser.id, withdrawReason.trim());
    if (res.success) {
      setWithdrawModalOpen(false);
      setWithdrawReason('');
      setWithdrawNotice(`Başvurunuz (${selectedApp.referenceNumber}) başarıyla geri çekildi.`);
      setTimeout(() => setWithdrawNotice(null), 5000);
      const updated = getApplicationsByCandidateId(currentUser.id);
      setCandidateApps(updated);
    } else {
      alert(res.error || 'Başvuru geri çekilemedi.');
    }
  };

  // Reset demo data handler
  const handleResetData = () => {
    if (window.confirm('Tüm eğitim başvuruları fabrika ayarlarına sıfırlansın mı?')) {
      resetApplicationsToDefaults();
      const updated = getApplicationsByCandidateId(currentUser.id);
      setCandidateApps(updated);
      setSelectedAppId(updated[0]?.id || null);
    }
  };

  // Calculation counts
  const totalCount = candidateApps.length;
  const activeCount = candidateApps.filter((a) =>
    ['submitted', 'under_review', 'pending'].includes(a.status)
  ).length;
  const acceptedCount = candidateApps.filter((a) => a.status === 'accepted').length;
  const draftCount = candidateApps.filter((a) => a.status === 'draft').length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* Top Banner & Quick Candidate Switcher */}
      <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
              Aday Başvuru Masası
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              Demo Ortamı
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Hoş Geldiniz, {currentUser.fullName}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            İslahiye Ticaret Odası eğitim programlarına yaptığınız ön başvuruları, inceleme durumunu ve süreç geçmişini buradan takip edebilirsiniz.
          </p>
        </div>

        {/* Quick Candidate Switcher for Testing Isolation */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="p-1 bg-slate-100 rounded-lg flex items-center gap-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 px-2">Aday Değiştir:</span>
            <button
              type="button"
              onClick={() => setActiveUserKey('applicant')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                activeUserKey === 'applicant'
                  ? 'bg-white text-brand-blue shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fatma Şahin
            </button>
            <button
              type="button"
              onClick={() => setActiveUserKey('applicant2')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                activeUserKey === 'applicant2'
                  ? 'bg-white text-brand-blue shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ahmet Karataş (Aday 2)
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/egitimler')}
            className="text-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1" />
            Yeni Programa Başvur
          </Button>

          <button
            type="button"
            onClick={handleResetData}
            title="Demo başvuru verilerini sıfırla"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Withdraw Success Notice */}
      {withdrawNotice && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{withdrawNotice}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-brand-border shadow-xs space-y-1">
          <span className="text-slate-500 text-xs block">Toplam Başvuru</span>
          <strong className="text-xl font-extrabold text-slate-900">{totalCount}</strong>
        </div>
        <div className="bg-white p-4 rounded-xl border border-brand-border shadow-xs space-y-1">
          <span className="text-slate-500 text-xs block">İncelemedeki Başvuru</span>
          <strong className="text-xl font-extrabold text-amber-600">{activeCount}</strong>
        </div>
        <div className="bg-white p-4 rounded-xl border border-brand-border shadow-xs space-y-1">
          <span className="text-slate-500 text-xs block">Taslak Kayıt</span>
          <strong className="text-xl font-extrabold text-slate-600">{draftCount}</strong>
        </div>
        <div className="bg-white p-4 rounded-xl border border-brand-border shadow-xs space-y-1">
          <span className="text-slate-500 text-xs block">Kabul Edilen</span>
          <strong className="text-xl font-extrabold text-emerald-600">{acceptedCount}</strong>
        </div>
      </div>

      {/* Main Grid: Left Applications List (5 cols) + Right Selected Application Prospectus (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Başvurularım (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-base font-bold text-slate-900">
              Başvurularım ({candidateApps.length})
            </h2>
            <Link
              to="/egitimler"
              className="text-xs font-semibold text-brand-blue hover:underline inline-flex items-center gap-1"
            >
              <span>Tüm Katalog</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {candidateApps.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-brand-border text-slate-500 text-xs space-y-3">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">Henüz bir başvuru kaydınız bulunmuyor.</p>
              <p className="text-[11px] text-slate-400">
                Açık eğitim programlarını inceleyerek ilçemizdeki ücretsiz mesleki atölyelere ön başvuru yapabilirsiniz.
              </p>
              <Button size="sm" onClick={() => navigate('/egitimler')}>
                Eğitim Kataloğunu İncele
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {candidateApps.map((app) => {
                const badge = getStatusBadgeInfo(app.status);
                const isSelected = selectedApp?.id === app.id;
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/50 border-brand-blue shadow-xs'
                        : 'bg-white border-brand-border hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="font-mono text-[11px] font-semibold text-slate-500">
                        {app.referenceNumber}
                      </span>
                      <StatusBadge label={badge.label} variant={badge.variant} size="sm" />
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {app.programTitle}
                    </h3>

                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <span>{app.cohortName || '2026 Güz Dönemi'}</span>
                      <span>Başvuru: {app.appliedAt}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Seçili Başvuru Durum & Takip Detayı (7 cols) */}
        <div className="lg:col-span-7">
          {selectedApp ? (
            <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-xs space-y-6">
              
              {/* Header with Program Title & Status */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {selectedApp.referenceNumber}
                    </span>
                    <span className="text-xs text-slate-400">
                      Dönem: {selectedApp.cohortName || '2026 Güz Dönemi'}
                    </span>
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {selectedApp.programTitle}
                  </h2>
                </div>

                <div className="shrink-0">
                  <StatusBadge
                    label={getStatusBadgeInfo(selectedApp.status).label}
                    variant={getStatusBadgeInfo(selectedApp.status).variant}
                    size="md"
                  />
                </div>
              </div>

              {/* Status Action Banner (Next Steps based on current status) */}
              {selectedApp.status === 'draft' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>
                      Bu başvuru henüz <strong>Taslak</strong> aşamasındadır. İdari değerlendirmeye girmesi için formu tamamlayıp gönderiniz.
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/aday/basvuru/${selectedApp.programId}`)}
                    className="shrink-0"
                  >
                    Taslağı Düzenle & Gönder →
                  </Button>
                </div>
              )}

              {['submitted', 'under_review', 'pending'].includes(selectedApp.status) && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>İdari Değerlendirme Sürecindedir</span>
                  </div>
                  <p className="leading-relaxed">
                    Başvurunuz başarıyla kaydedilmiştir. Aday bilgileri şeffaf kriter havuzuna alınmış olup İslahiye Ticaret Odası yetkili idari yöneticisi tarafından incelenmektedir.
                  </p>
                </div>
              )}

              {selectedApp.status === 'accepted' && (
                <div className="space-y-3">
                  {/* Durum A: Kesin Kayıt İptal Edilmişse */}
                  {selectedEnrollment?.status === 'cancelled' && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-950 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-red-800">
                        <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Kayıt İptal Edildi</span>
                      </div>
                      <p className="leading-relaxed">
                        Bu programa ilişkin kesin kayıt işlemi idari yönetim tarafından iptal edilmiştir.
                      </p>
                      {selectedEnrollment.cancellationReason && (
                        <div className="p-2.5 bg-white/80 rounded border border-red-200 text-[11px] font-mono text-red-900">
                          <strong>İptal Gerekçesi:</strong> {selectedEnrollment.cancellationReason}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Durum B: Kesin Kayıt Bekleniyor */}
                  {(!selectedEnrollment || selectedEnrollment.status === 'pending_confirmation') && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2.5">
                      <div className="flex items-center gap-2 font-bold text-amber-900">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Kabul Edildi — Kesin Kayıt Bekleniyor</span>
                      </div>
                      <p className="leading-relaxed text-slate-700">
                        Tebrikler! Başvurunuz idari yönetici tarafından <strong>kabul edilmiştir</strong>. Şu anda İslahiye Ticaret Odası Eğitim İşleri tarafından evrak ve kesin kayıt onayı beklenmektedir.
                      </p>
                      <div className="p-2.5 bg-amber-100/60 rounded-lg text-[11px] text-amber-900 flex items-center justify-between">
                        <span>Aşama 1/3: Başvuru Kabulü Tamamlandı</span>
                        <span className="font-semibold">Aşama 2: Kesin Kayıt Onayı (Sırada)</span>
                      </div>
                      <div className="pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="opacity-70 cursor-not-allowed"
                        >
                          Kursiyer Paneli (Kesin Kayıt Bekleniyor)
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Durum C: Kesin Kayıt Tamamlandı, Grup Ataması Bekleniyor */}
                  {selectedEnrollment?.status === 'confirmed' && !selectedAssignment && (
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-2.5">
                      <div className="flex items-center gap-2 font-bold text-blue-900">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Kesin Kayıt Tamamlandı — Grup Ataması Bekleniyor</span>
                      </div>
                      <p className="leading-relaxed text-slate-700">
                        Kesin kaydınız <strong>{selectedEnrollment.confirmedAt}</strong> tarihinde onaylanmıştır! Şu anda eğitim grubu şube ve kontenjan planlaması yapılmaktadır. Atamanız tamamlandığında ders programınız aktif olacaktır.
                      </p>
                      <div className="p-2.5 bg-blue-100/60 rounded-lg text-[11px] text-blue-900 flex items-center justify-between">
                        <span>Aşama 2/3: Kesin Kayıt Onaylandı ✓</span>
                        <span className="font-semibold">Aşama 3: Grup Yerleşimi (Sırada)</span>
                      </div>
                      <div className="pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="opacity-70 cursor-not-allowed"
                        >
                          Kursiyer Paneli (Grup Ataması Bekleniyor)
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Durum D: Gruba Yerleştirildi — Kursiyer Paneli Aktif! */}
                  {selectedEnrollment?.status === 'confirmed' && selectedAssignment && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2.5">
                      <div className="flex items-center gap-2 font-bold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Gruba Yerleştirildi — Eğitime Hazır</span>
                      </div>
                      <p className="leading-relaxed text-slate-700">
                        Tebrikler! Kesin kaydınız tamamlanmış ve <strong>{selectedAssignment.groupName}</strong> grubuna yerleştirildiniz. Kursiyer paneliniz aktifleştirilmiştir.
                      </p>
                      <div className="p-3 bg-white/90 rounded-lg border border-emerald-200 text-slate-700 space-y-1">
                        <div><strong>Atandığı Grup:</strong> {selectedAssignment.groupName}</div>
                        <div><strong>Yerleşim Tarihi:</strong> {selectedAssignment.assignedAt}</div>
                        <div className="text-[11px] text-slate-500">İşlem Yapan: {selectedAssignment.assignedBy}</div>
                      </div>
                      <div className="pt-1">
                        <Button
                          size="sm"
                          onClick={() => {
                            setRole('trainee');
                            navigate('/kursiyer');
                          }}
                        >
                          Kursiyer Paneline Geçiş Yap →
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {['waitlisted', 'reserve'].includes(selectedApp.status) && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-brand-blue">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>Yedek Kontenjan Listesindesiniz</span>
                  </div>
                  <p className="leading-relaxed">
                    Kontenjan doluluğu sebebiyle başvurunuz yedek listeye kaydedilmiştir. Asil kursiyerlerden feragat eden olması durumunda sıranıza göre adınıza kesin kayıt oluşturulacaktır.
                  </p>
                </div>
              )}

              {selectedApp.status === 'rejected' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-800">
                    <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Başvuru Bu Dönem İçin Uygun Görülmemiştir</span>
                  </div>
                  <p className="leading-relaxed">
                    Başvurunuz idari değerlendirme sonucunda bu dönem için kabul edilememiştir. Bir sonraki eğitim döneminde tekrar başvuru yapabilirsiniz.
                  </p>
                </div>
              )}

              {selectedApp.status === 'withdrawn' && (
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <strong>Başvuru Geri Çekildi:</strong>
                  <p>Bu başvuru aday talebiyle süreçten çekilmiştir.</p>
                </div>
              )}

              {/* Administrative Result Message (Candidate Facing) */}
              {(selectedApp.candidateDecisionMessage || selectedApp.adminJustification) && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-800 block">
                    Yetkili İdari Yönetici Açıklaması:
                  </span>
                  <p className="text-slate-700 leading-relaxed italic">
                    "{selectedApp.candidateDecisionMessage || selectedApp.adminJustification}"
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200">
                    <span>Karar Veren: {selectedApp.decidedBy || 'Selin Aydın (Yönetici)'}</span>
                    <span>Tarih: {selectedApp.decidedAt || selectedApp.appliedAt}</span>
                  </div>
                </div>
              )}

              {/* Program & Candidate Snapshot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1.5">
                  <strong className="text-slate-900 block font-semibold">Aday Bilgileri</strong>
                  <div className="text-slate-600 space-y-0.5 text-[11px]">
                    <div><strong>Aday:</strong> {selectedApp.candidateName}</div>
                    <div><strong>E-Posta:</strong> {selectedApp.email}</div>
                    <div><strong>İkamet:</strong> {selectedApp.residenceDistrict || 'İslahiye Merkez'}</div>
                    <div><strong>Meslek:</strong> {selectedApp.occupation}</div>
                    <div><strong>Eğitim:</strong> {selectedApp.educationLevel}</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1.5">
                  <strong className="text-slate-900 block font-semibold">Program Bilgileri</strong>
                  <div className="text-slate-600 space-y-0.5 text-[11px]">
                    <div><strong>Eğitim:</strong> {selectedApp.programTitle}</div>
                    <div><strong>Dönem:</strong> {selectedApp.cohortName || '2026 Güz Dönemi'}</div>
                    <div><strong>Başvuru Tarihi:</strong> {selectedApp.appliedAt}</div>
                    <div className="pt-1">
                      <Link
                        to={`/egitimler/${selectedApp.programId}`}
                        className="text-brand-blue hover:underline inline-flex items-center gap-1 font-semibold"
                      >
                        Program Detay Sayfasını Aç <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Motivation Statement Snapshot */}
              {selectedApp.statement && (
                <div className="space-y-1.5 text-xs pt-1">
                  <strong className="text-slate-800 block">Başvuru Motivasyon Beyanı:</strong>
                  <p className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 leading-relaxed text-[11px]">
                    {selectedApp.statement}
                  </p>
                </div>
              )}

              {/* Process History (Zaman Çizelgesi) */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Başvuru Süreç Geçmişi
                </h3>
                <div className="space-y-2 border-l-2 border-slate-200 pl-4 ml-2 text-xs">
                  {selectedApp.statusHistory && selectedApp.statusHistory.length > 0 ? (
                    selectedApp.statusHistory.map((item, idx) => (
                      <div key={idx} className="relative pb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-blue absolute -left-[21px] top-1" />
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800 capitalize">
                            {getStatusBadgeInfo(item.status).label}
                          </span>
                          <span className="text-slate-400">{item.changedAt}</span>
                        </div>
                        {item.note && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.note}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="relative pb-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-blue absolute -left-[21px] top-1" />
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800">
                          {getStatusBadgeInfo(selectedApp.status).label}
                        </span>
                        <span className="text-slate-400">{selectedApp.appliedAt}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Başvuru sisteme kaydedildi.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer: Withdraw or Re-Apply */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                {['draft', 'submitted', 'under_review', 'pending'].includes(selectedApp.status) ? (
                  <button
                    type="button"
                    onClick={() => setWithdrawModalOpen(true)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline"
                  >
                    Başvurumu Geri Çekmek İstiyorum
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Sonuçlanan başvurular üzerinde geri çekme yapılamaz.
                  </span>
                )}

                <div className="flex items-center gap-2">
                  {selectedApp.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => navigate(`/aday/basvuru/${selectedApp.programId}`)}
                    >
                      Taslağı Tamamla →
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/egitimler')}
                  >
                    Diğer Eğitimleri Gör
                  </Button>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-brand-border text-slate-400 text-xs">
              İncelemek istediğiniz başvuruyu soldaki listeden seçiniz.
            </div>
          )}
        </div>

      </div>

      {/* MODAL: Başvuruyu Geri Çekme Onay Modalı */}
      {selectedApp && (
        <Modal
          isOpen={withdrawModalOpen}
          onClose={() => setWithdrawModalOpen(false)}
          title="Başvuruyu Geri Çek"
          maxWidth="max-w-md"
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <Button variant="outline" size="sm" onClick={() => setWithdrawModalOpen(false)}>
                Vazgeç
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmWithdraw}
              >
                Geri Çekmeyi Onayla
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <p>
              <strong>{selectedApp.programTitle}</strong> programına ait <strong>{selectedApp.referenceNumber}</strong> nolu başvurunuzu geri çekmek üzeresiniz.
            </p>
            <p className="text-slate-500">
              Geri çekilen başvurular idari değerlendirme havuzundan çıkarılır. İstediğiniz zaman aynı veya başka bir programa yeniden başvuru yapabilirsiniz.
            </p>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Geri Çekme Nedeni (İsteğe Bağlı):
              </label>
              <textarea
                rows={2}
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="Örn: Zaman planlamam değişti, başka bir programa başvuracağım..."
                className="w-full px-3 py-2 border border-brand-border rounded-lg text-xs"
              />
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
