import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  MapPin,
  Upload,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  AlertCircle,
  BookOpen,
  FileText,
  Check,
  ExternalLink,
  History,
  X,
  Hash,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import {
  getActiveAssignmentForCandidate,
  getGroupById,
  subscribeToGroupUpdates,
} from '../services/enrollmentStorage';
import { getApplicationsByCandidateId } from '../services/applicationStorage';
import {
  getSessionsByGroup,
  getStoredAttendanceRecords,
  subscribeToSessionUpdates,
  subscribeToAttendanceUpdates,
} from '../services/sessionStorage';
import { calculateTraineeAttendance } from '../services/attendanceEngine';
import {
  getCourseAssignmentsByGroup,
  getLatestSubmission,
  getEvaluationForSubmission,
  submitAssignment,
  subscribeToAssignmentUpdates,
} from '../services/assignmentStorage';
import {
  calculateTraineeAssignmentPerformance,
} from '../services/assignmentEngine';
import { calculateFinalEligibility } from '../services/successEngine';
import {
  getSuccessDecisionByEnrollment,
  subscribeToSuccessDecisionUpdates,
} from '../services/successDecisionStorage';
import {
  getCertificatesByCandidateId,
  subscribeToCertificateUpdates,
  checkCertificateAcademicDiscrepancy,
} from '../services/certificateStorage';
import { downloadCertificatePDF } from '../services/pdfEngine';
import { CertificatePreviewModal } from '../components/certificate/CertificatePreviewModal';
import {
  Session,
  Assignment,
  AssignmentSubmission,
  FinalEligibilityResult,
  SuccessDecisionRecord,
  CertificateRecord,
} from '../types';
import { Award, Download, QrCode } from 'lucide-react';

export const TraineeDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, setRole } = useDemoRole();

  // Modallar
  const [selectedAssignmentForSubmit, setSelectedAssignmentForSubmit] = useState<Assignment | null>(null);
  const [sessionDetailModal, setSessionDetailModal] = useState<Session | null>(null);
  const [selectedSubmissionForView, setSelectedSubmissionForView] = useState<{
    assignment: Assignment;
    submission: AssignmentSubmission;
  } | null>(null);
  const [previewCert, setPreviewCert] = useState<CertificateRecord | null>(null);

  // Form State
  const [submitText, setSubmitText] = useState('');
  const [submitLink, setSubmitLink] = useState('');
  const [submitFileName, setSubmitFileName] = useState('');
  const [submitFileSize, setSubmitFileSize] = useState('1.5 MB');

  // Feedback Toast
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Data Refresh Trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const unsub1 = subscribeToGroupUpdates(() => setRefreshTrigger((p) => p + 1));
    const unsub2 = subscribeToSessionUpdates(() => setRefreshTrigger((p) => p + 1));
    const unsub3 = subscribeToAttendanceUpdates(() => setRefreshTrigger((p) => p + 1));
    const unsub4 = subscribeToAssignmentUpdates(() => setRefreshTrigger((p) => p + 1));
    const unsub5 = subscribeToSuccessDecisionUpdates(() => setRefreshTrigger((p) => p + 1));
    const unsub6 = subscribeToCertificateUpdates(() => setRefreshTrigger((p) => p + 1));
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
    };
  }, []);

  // Kursiyerin kendi düzenlenmiş veya kayıtlı belgeleri (Sprint E03-D)
  const traineeCertificates = useMemo(() => {
    return getCertificatesByCandidateId(currentUser.id);
  }, [currentUser.id, refreshTrigger]);

  // Kursiyerin aktif grup ataması
  const activeAssignment = useMemo(() => {
    return getActiveAssignmentForCandidate(currentUser.id);
  }, [currentUser.id]);

  // Atanmış grup detayları
  const assignedGroup = useMemo(() => {
    if (!activeAssignment) return null;
    return getGroupById(activeAssignment.groupId) || null;
  }, [activeAssignment]);

  // Grup oturumları
  const groupSessions = useMemo(() => {
    if (!assignedGroup) return [];
    return getSessionsByGroup(assignedGroup.id);
  }, [assignedGroup]);

  // Dinamik Devam Oranı Hesaplaması (attendanceEngine üzerinden)
  const attendanceCalc = useMemo(() => {
    if (!assignedGroup) return null;
    return calculateTraineeAttendance(currentUser.id, assignedGroup.id, {
      enrollmentDate: activeAssignment?.assignedAt,
    });
  }, [currentUser.id, assignedGroup, activeAssignment]);

  // Sıradaki / En Yakın Oturum
  const nextSession = useMemo(() => {
    if (groupSessions.length === 0) return null;
    const openSess = groupSessions.find((s) => s.status === 'attendance_open' || s.status === 'active');
    if (openSess) return openSess;
    const scheduledSess = groupSessions.find((s) => s.status === 'scheduled');
    return scheduledSess || groupSessions[groupSessions.length - 1];
  }, [groupSessions]);

  // Kursiyerin kendi yoklama kayıtları haritası
  const traineeAttendanceMap = useMemo(() => {
    const all = getStoredAttendanceRecords();
    const map = new Map<string, string>();
    all
      .filter((r) => r.candidateId === currentUser.id || r.traineeId === currentUser.id)
      .forEach((r) => map.set(r.sessionId, r.status));
    return map;
  }, [currentUser.id]);

  // Kursiyerin diğer program başvuruları
  const otherApplications = useMemo(() => {
    const allApps = getApplicationsByCandidateId(currentUser.id);
    if (!activeAssignment) return allApps;
    return allApps.filter((a) => a.programId !== activeAssignment.programId);
  }, [currentUser.id, activeAssignment]);

  // =========================================================================
  // DİNAMİK ÖDEVLER VE BAŞARI ÖN KONTROLÜ
  // =========================================================================

  // Yalnızca yayınlanmış (published) ödevler kursiyere gösterilir
  const groupAssignments = useMemo(() => {
    if (!assignedGroup) return [];
    return getCourseAssignmentsByGroup(assignedGroup.id, false);
  }, [assignedGroup]);

  // Kursiyer ödev performansı
  const assignmentPerf = useMemo(() => {
    if (!assignedGroup) return null;
    return calculateTraineeAssignmentPerformance(currentUser.id, assignedGroup.id);
  }, [currentUser.id, assignedGroup, groupAssignments]);

  // Sprint E03-C: Nihai Başarı Motoru ve Yönetici Kararı
  const finalEligibility: FinalEligibilityResult | null = useMemo(() => {
    if (!activeAssignment) return null;
    return calculateFinalEligibility(activeAssignment.enrollmentId, activeAssignment.termId);
  }, [activeAssignment, refreshTrigger]);

  const successDecision: SuccessDecisionRecord | null = useMemo(() => {
    if (!activeAssignment) return null;
    return getSuccessDecisionByEnrollment(activeAssignment.enrollmentId);
  }, [activeAssignment, refreshTrigger]);

  // Acil / Sıradaki Teslim Bekleyen Ödev (not submitted veya revision requested)
  const urgentAssignment = useMemo(() => {
    if (groupAssignments.length === 0) return null;

    // Önce revizyon istenmiş olan varsa en yüksek öncelik
    for (const asgn of groupAssignments) {
      const sub = getLatestSubmission(asgn.id, currentUser.id);
      if (sub && sub.status === 'revision_requested') {
        return { assignment: asgn, latestSub: sub, isRevision: true };
      }
    }

    // Sonra henüz teslim edilmemiş zorunlu ödevler
    for (const asgn of groupAssignments) {
      const sub = getLatestSubmission(asgn.id, currentUser.id);
      if (!sub && asgn.isMandatory) {
        return { assignment: asgn, latestSub: null, isRevision: false };
      }
    }

    // Sonra henüz teslim edilmemiş isteğe bağlı ödevler
    for (const asgn of groupAssignments) {
      const sub = getLatestSubmission(asgn.id, currentUser.id);
      if (!sub) {
        return { assignment: asgn, latestSub: null, isRevision: false };
      }
    }

    return null;
  }, [groupAssignments, currentUser.id]);

  // Teslim Modalı Açma
  const handleOpenSubmitModal = (asgn: Assignment) => {
    setSelectedAssignmentForSubmit(asgn);
    const prevSub = getLatestSubmission(asgn.id, currentUser.id);
    if (prevSub && prevSub.status === 'revision_requested') {
      setSubmitText(prevSub.content.text || '');
      setSubmitLink(prevSub.content.linkUrl || '');
      setSubmitFileName(prevSub.content.fileName || '');
    } else {
      setSubmitText('');
      setSubmitLink('');
      setSubmitFileName('');
    }
  };

  // Ödev Teslim Etme / Yeniden Gönderme
  const handleSubmitAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentForSubmit || !activeAssignment) return;

    if (!submitText.trim() && !submitLink.trim() && !submitFileName.trim()) {
      setFeedback({
        type: 'error',
        message: 'Lütfen açıklama metni, bağlantı URL veya dosya ekinden en az birini doldurunuz.',
      });
      return;
    }

    const res = submitAssignment({
      assignmentId: selectedAssignmentForSubmit.id,
      enrollmentId: activeAssignment.enrollmentId,
      traineeId: currentUser.id,
      traineeName: currentUser.fullName,
      content: {
        text: submitText.trim() || undefined,
        linkUrl: submitLink.trim() || undefined,
        fileName: submitFileName.trim() || undefined,
        fileSize: submitFileName.trim() ? submitFileSize : undefined,
      },
    });

    if (res.success) {
      const isResubmit = res.submission && res.submission.submissionVersion > 1;
      setFeedback({
        type: 'success',
        message: isResubmit
          ? `Ödev düzeltmeniz Sürüm v${res.submission?.submissionVersion} olarak eğitmeninize başarıyla iletildi.`
          : 'Ödeviniz başarıyla teslim edildi ve eğitmenin değerlendirme kuyruğuna alındı.',
      });
      setSelectedAssignmentForSubmit(null);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Ödev teslim edilemedi.' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ------------------------------------------------------------------- */}
      {/* BAŞLIK & PROGRAM ÖZETİ */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <span className="text-xs text-slate-500 font-medium">Aktif Kursiyer Portali:</span>
          <h2 className="text-xl font-bold text-brand-navy">
            {assignedGroup
              ? `${assignedGroup.programTitle} — ${assignedGroup.name}`
              : 'Aktif Eğitim Programı Bulunamadı'}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {assignedGroup ? (
            <>
              <Link
                to="/kursiyer/mesajlar"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-brand-blue" />
                <span>Eğitmen Mesajları</span>
              </Link>
              <Link
                to="/kursiyer/kanallar"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
              >
                <Hash className="w-3.5 h-3.5 text-brand-blue" />
                <span>Grup Kanalları</span>
              </Link>
            </>
          ) : (
            <span className="text-amber-800 text-xs">
              Henüz bir gruba atanmadınız veya kesin kaydınız tamamlanmadı.
            </span>
          )}
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-lg flex items-start justify-between text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Gruptan Çıkarılma / Ayrılma Uyarısı */}
      {activeAssignment?.status === 'removed' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            Eğitim Grubu Kaydınız Sonlandırılmıştır
          </div>
          <p>
            Gerekçe: <strong>{activeAssignment.removalReason || 'İdari karar'}</strong>. Detaylı
            bilgi için oda yönetimiyle iletişime geçiniz.
          </p>
        </div>
      )}

      {/* Grup Bilgisi Kartı */}
      {assignedGroup && (
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{assignedGroup.name}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Aktif Kursiyerlik
              </span>
            </div>
            <div className="text-slate-500">
              Ders Programı: <strong className="text-slate-700">{assignedGroup.scheduleSummary}</strong> • Sınıf / Konum:{' '}
              <strong className="text-slate-700">{assignedGroup.location}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>Kayıt Tarihi: {activeAssignment?.assignedAt?.split('T')[0] || '12.10.2026'}</span>
          </div>
        </div>
      )}

      {/* Kayıt Yok Uyarısı */}
      {!assignedGroup ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
          <h3 className="text-base font-bold text-amber-900">
            Aktif Bir Eğitim Grubuna Henüz Atanmadınız
          </h3>
          <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
            Başvurunuz kabul edilmiş olsa dahi kesin kayıt veya grup atama işleminiz henüz
            tamamlanmamış olabilir. Lütfen Aday Masasından başvuru durumunuzu kontrol ediniz.
          </p>
          <Button
            size="sm"
            onClick={() => {
              setRole('applicant');
              navigate('/aday');
            }}
          >
            Aday Masasına Git →
          </Button>
        </div>
      ) : (
        <>
          {/* ----------------------------------------------------------------- */}
          {/* 1. ÖNCELİK — EN YAKIN / SIRADAKİ DERS OTURUMU */}
          {/* ----------------------------------------------------------------- */}
          {nextSession ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      1. Öncelik — Sıradaki Ders Oturumu
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">{nextSession.date}</span>
                    {nextSession.status === 'attendance_open' && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded animate-pulse">
                        Yoklama Alınıyor
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-brand-textPrimary">
                    Oturum {nextSession.sessionNumber}: {nextSession.title}
                  </h3>
                  <div className="text-xs text-brand-textSecondary flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Saat: <strong>{nextSession.startTime} - {nextSession.endTime}</strong>
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Yer: <strong>{nextSession.location}</strong>
                      </span>
                    </span>
                    {nextSession.topic && (
                      <span className="text-slate-500 italic max-w-sm truncate">
                        Konu: {nextSession.topic}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSessionDetailModal(nextSession)}
                  className="shrink-0"
                >
                  Oturum Notlarını Görüntüle
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 text-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">
                Bu grup için henüz ders oturumu tanımlanmamış.
              </h3>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* 2. ÖNCELİK — DİNAMİK TESLİM BEKLEYEN ÖDEV KARTI */}
          {/* ----------------------------------------------------------------- */}
          {urgentAssignment ? (
            <div
              className={`rounded-xl border p-5 shadow-xs space-y-3 ${
                urgentAssignment.isRevision
                  ? 'bg-purple-50/80 border-purple-200'
                  : 'bg-amber-50/70 border-amber-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        urgentAssignment.isRevision
                          ? 'bg-purple-100 text-purple-900 border-purple-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {urgentAssignment.isRevision
                        ? '2. Öncelik — Revizyon Bekleyen Ödev (Düzeltme İsteniyor)'
                        : '2. Öncelik — Teslim Bekleyen Ödev'}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      Son Teslim: {urgentAssignment.assignment.dueDate || urgentAssignment.assignment.dueAt}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-brand-textPrimary">
                    {urgentAssignment.assignment.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    {urgentAssignment.assignment.description}
                  </p>

                  {/* Revizyon Gerekçesi Vurgusu */}
                  {urgentAssignment.isRevision && urgentAssignment.latestSub?.revisionHistory && (
                    <div className="p-2.5 bg-white rounded border border-purple-200 text-xs text-purple-900 mt-2">
                      <strong className="flex items-center gap-1 text-purple-800">
                        <History className="w-3.5 h-3.5" /> Eğitmeninizin Revizyon Notu:
                      </strong>
                      <p className="italic mt-0.5">
                        "{urgentAssignment.latestSub.revisionHistory[urgentAssignment.latestSub.revisionHistory.length - 1]?.revisionReason}"
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  onClick={() => handleOpenSubmitModal(urgentAssignment.assignment)}
                  className="shrink-0"
                >
                  {urgentAssignment.isRevision ? 'Revize Edip Yeniden Gönder' : 'Ödevi Teslim Et'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Tebrikler! Şu an için teslim bekleyen aktif bir ödeviniz bulunmamaktadır.</span>
              </div>
              <span className="font-semibold text-emerald-800">Tüm Teslimler Tamam</span>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* 3. ÖNCELİK — DEVAM ORANI (%80 BARAJI) */}
          {/* ----------------------------------------------------------------- */}
          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    3. Öncelik — Devam Durumu
                  </span>
                  <div className="text-sm font-bold text-brand-textPrimary mt-0.5">
                    Katılım Oranı:{' '}
                    {attendanceCalc?.attendanceRate !== null ? (
                      <span
                        className={`text-base font-extrabold tabular-nums ${
                          attendanceCalc?.hasPassedThreshold ? 'text-brand-success' : 'text-brand-danger'
                        }`}
                      >
                        %{attendanceCalc?.attendanceRate}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-sm font-medium">
                        Henüz Hesaplanamıyor
                      </span>
                    )}
                    <span className="text-xs text-slate-500 font-normal ml-2">
                      (Başarı Koşulu: En az %80)
                    </span>
                  </div>
                </div>

                {attendanceCalc?.attendanceRate !== null ? (
                  <StatusBadge
                    label={
                      attendanceCalc?.hasPassedThreshold
                        ? 'Başarı Barajı Üzerinde'
                        : 'Devamsızlık Riski'
                    }
                    variant={attendanceCalc?.hasPassedThreshold ? 'success' : 'danger'}
                  />
                ) : (
                  <span className="text-xs text-slate-500 font-medium">
                    (Yeterli oturum tamamlanmadı)
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      attendanceCalc?.hasPassedThreshold ? 'bg-emerald-600' : 'bg-red-500'
                    }`}
                    style={{ width: `${attendanceCalc?.attendanceRate || 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>
                    Katılınan: <strong>{attendanceCalc?.attendedCount || 0} Oturum</strong>
                  </span>
                  <span>
                    Mazeretli: <strong>{attendanceCalc?.excusedCount || 0} (Muaf)</strong>
                  </span>
                  <span>
                    Devamsızlık: <strong>{attendanceCalc?.absentCount || 0} Oturum</strong>
                  </span>
                  <span>
                    Hesaba Dahil: <strong>{attendanceCalc?.completedSessionsCount || 0} Oturum</strong>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ----------------------------------------------------------------- */}
          {/* YENİ: GRUP ÖDEVLERİM VE TESLİM DURUMLARI (Sprint E03-B) */}
          {/* ----------------------------------------------------------------- */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Eğitim Grubu Ödevlerim ({groupAssignments.length} Ödev)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Başarı kriteri için zorunlu ödevlerin tamamının onaylanması ve genel ödev ortalamasının en az 70/100 olması gerekmektedir.
                </p>
              </div>

              <div className="text-xs text-slate-600 flex items-center gap-3">
                <span>
                  Ortalama:{' '}
                  <strong className="text-blue-700">
                    {assignmentPerf?.averageScore !== null
                      ? `${assignmentPerf?.averageScore} / 100`
                      : 'Hesaplanamıyor'}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Onaylanan Zorunlu:{' '}
                  <strong className="text-emerald-700">
                    {assignmentPerf?.mandatoryAssignmentsApproved || 0} /{' '}
                    {assignmentPerf?.mandatoryAssignmentsTotal || 0}
                  </strong>
                </span>
              </div>
            </div>

            {/* Assignments List */}
            {groupAssignments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-lg">
                Bu grup için henüz yayınlanmış bir ödev bulunmamaktadır.
              </div>
            ) : (
              <div className="space-y-3">
                {groupAssignments.map((asgn) => {
                  const latestSub = getLatestSubmission(asgn.id, currentUser.id);
                  const evaluation = latestSub ? getEvaluationForSubmission(latestSub.id) : null;
                  const isSubmitted = Boolean(latestSub);
                  const isApproved = latestSub?.status === 'approved';
                  const isRevision = latestSub?.status === 'revision_requested';
                  const isUnderReview =
                    latestSub?.status === 'submitted' || latestSub?.status === 'resubmitted';

                  return (
                    <div
                      key={asgn.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {asgn.isMandatory ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                Zorunlu Ödev
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                                İsteğe Bağlı
                              </span>
                            )}

                            {/* Teslim / Değerlendirme Durumu Rozeti */}
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded">
                                <Check className="w-3 h-3" /> Onaylandı ({evaluation?.score} Puan)
                              </span>
                            ) : isRevision ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded border border-amber-300">
                                <AlertTriangle className="w-3 h-3 text-amber-600" /> Revizyon İstendi (v{latestSub?.submissionVersion})
                              </span>
                            ) : isUnderReview ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded animate-pulse">
                                <Clock className="w-3 h-3 text-blue-600" /> Değerlendirme Bekliyor (v{latestSub?.submissionVersion})
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                                Henüz Teslim Edilmedi
                              </span>
                            )}

                            <span className="text-xs text-slate-500">
                              Son Teslim: <strong>{asgn.dueDate || asgn.dueAt}</strong>
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900">{asgn.title}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                            {asgn.description}
                          </p>

                          {/* Revizyon Gerekçesi Kutusu */}
                          {isRevision && latestSub?.revisionHistory && latestSub.revisionHistory.length > 0 && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 mt-2 space-y-1">
                              <span className="font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" /> Eğitmeninizin Revizyon Notu:
                              </span>
                              <p className="italic">
                                "{latestSub.revisionHistory[latestSub.revisionHistory.length - 1]?.revisionReason}"
                              </p>
                              {evaluation && (
                                <div className="text-[11px] text-amber-800 pt-1">
                                  Geçici Puan: <strong>{evaluation.score} / 100</strong> (Revizyon teslimi sonrasında nihai puan güncellenecektir)
                                </div>
                              )}
                            </div>
                          )}

                          {/* Onaylanmış Ödev Geri Bildirimi */}
                          {isApproved && evaluation?.feedback && (
                            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-900 mt-1">
                              <strong>Eğitmen Değerlendirmesi:</strong> "{evaluation.feedback}"
                            </div>
                          )}
                        </div>

                        {/* İşlem Butonları */}
                        <div className="shrink-0 flex items-center gap-2">
                          {!isSubmitted ? (
                            <Button
                              size="sm"
                              leftIcon={<Upload className="w-3.5 h-3.5" />}
                              onClick={() => handleOpenSubmitModal(asgn)}
                            >
                              Teslim Et
                            </Button>
                          ) : isRevision ? (
                            <Button
                              size="sm"
                              leftIcon={<Upload className="w-3.5 h-3.5" />}
                              onClick={() => handleOpenSubmitModal(asgn)}
                            >
                              Yeniden Gönder (v{(latestSub?.submissionVersion || 1) + 1})
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedSubmissionForView({ assignment: asgn, submission: latestSub! })}
                            >
                              Teslimi İncele
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* OTURUM GEÇMİŞİ TABLOSU */}
          {/* ----------------------------------------------------------------- */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Grup Oturumları ve Yoklama Kayıtlarım ({groupSessions.length} Oturum)
              </h3>
              <span className="text-xs text-slate-500">
                Resmî Devam Barajı: <strong>%80</strong>
              </span>
            </div>

            {groupSessions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-lg">
                Henüz oturum tanımlanmamış.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Oturum</th>
                      <th className="py-2.5 px-3">Ders Başlığı & İçerik</th>
                      <th className="py-2.5 px-3">Tarih & Saat</th>
                      <th className="py-2.5 px-3">Yer</th>
                      <th className="py-2.5 px-4 text-right">Yoklama Durumu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groupSessions.map((sess) => {
                      const userStatus = traineeAttendanceMap.get(sess.id);
                      const isCompleted = sess.status === 'completed';
                      const isOpen = sess.status === 'attendance_open' || sess.status === 'active';
                      const isCancelled = sess.status === 'cancelled';

                      return (
                        <tr key={sess.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-900">
                            Oturum {sess.sessionNumber}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">{sess.title}</div>
                            {sess.topic && (
                              <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                {sess.topic}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div>{sess.date}</div>
                            <div className="text-[10px] text-slate-400">
                              {sess.startTime} - {sess.endTime}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div>{sess.location}</div>
                            <div className="text-[10px] text-slate-400">{sess.instructorName}</div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {isCancelled ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">
                                İptal Edildi (Muaf)
                              </span>
                            ) : isCompleted ? (
                              userStatus === 'attended' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" /> Katıldı
                                </span>
                              ) : userStatus === 'excused' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Mazeretli
                                </span>
                              ) : userStatus === 'absent' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                                  Katılmadı
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                                  Kayıt Yok
                                </span>
                              )
                            ) : isOpen ? (
                              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 animate-pulse">
                                Yoklama Alınıyor
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                                Gelecek Oturum
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* 2-Column Grid: 4. Eğitmen Mesajı & 5. Başarı Kriterleri Durumu */}
          {/* ----------------------------------------------------------------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 4. ÖNCELİK — EĞİTMEN MESAJLARI */}
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    4. Öncelik — Eğitmen Mesajları
                  </span>
                  <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> 1 Yeni
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">
                      {assignedGroup?.instructorNames?.join(', ') || 'Murat Özkan'}
                    </span>
                    <span className="text-[10px] text-slate-400">Dün 16:30</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    "Ödev teslimleriniz için yönergelere ve standartlara dikkat ediniz. Revizyon istenen çalışmalarınızı belirtilen geri bildirim doğrultusunda güncelleyerek yeniden yükleyebilirsiniz."
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 5. ÖNCELİK — BAŞARI DURUMUM & NİHAİ YÖNETİCİ ONAYI (Sprint E03-C) */}
            <Card className="border-slate-300 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      5. Öncelik — Başarı Durumum
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                      Dönem Sonu Başarı ve Belge Uygunluk Durumu
                    </h4>
                  </div>
                  {finalEligibility && (
                    <span
                      className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                        finalEligibility.finalStatus === 'admin_approved'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : finalEligibility.finalStatus === 'awaiting_admin_decision'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : finalEligibility.finalStatus === 'remediation'
                          ? 'bg-purple-100 text-purple-900 border-purple-300'
                          : finalEligibility.finalStatus === 'rejected'
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {finalEligibility.statusLabel}
                    </span>
                  )}
                </div>

                {/* DÖRT ŞART KONTROL LİSTESİ */}
                <div className="space-y-2.5 text-xs">
                  {/* Koşul 1: %80 Devam */}
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      finalEligibility?.attendanceEligible
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                        : finalEligibility?.attendanceRate === null
                        ? 'bg-slate-50 border-slate-200 text-slate-700'
                        : 'bg-red-50/60 border-red-200 text-red-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {finalEligibility?.attendanceEligible ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle
                          className={`w-4 h-4 shrink-0 ${
                            finalEligibility?.attendanceRate === null
                              ? 'text-slate-400'
                              : 'text-red-500'
                          }`}
                        />
                      )}
                      <div>
                        <span className="font-semibold text-slate-900">1. Devam Koşulu (En az %80):</span>
                        <div className="text-[11px] text-slate-500">
                          {finalEligibility?.attendedCount || 0} katılım, {finalEligibility?.excusedCount || 0} mazeret / {finalEligibility?.completedSessionsCount || 0} oturum
                        </div>
                      </div>
                    </div>
                    <strong className="font-bold tabular-nums text-right">
                      {finalEligibility?.attendanceRate !== null
                        ? `%${finalEligibility?.attendanceRate} (${
                            finalEligibility?.attendanceEligible ? 'Sağlandı' : 'Baraj Altında'
                          })`
                        : 'Henüz Hesaplanamıyor'}
                    </strong>
                  </div>

                  {/* Koşul 2: 70/100 Ödev Ortalaması */}
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      finalEligibility?.gradeEligible
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                        : finalEligibility?.assignmentAverage === null
                        ? 'bg-slate-50 border-slate-200 text-slate-700'
                        : 'bg-red-50/60 border-red-200 text-red-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {finalEligibility?.gradeEligible ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle
                          className={`w-4 h-4 shrink-0 ${
                            finalEligibility?.assignmentAverage === null
                              ? 'text-slate-400'
                              : 'text-red-500'
                          }`}
                        />
                      )}
                      <div>
                        <span className="font-semibold text-slate-900">2. Ödev Ortalaması (En az 70/100):</span>
                        <div className="text-[11px] text-slate-500">
                          Eğitmen tarafından geçerli son değerlendirme puanları
                        </div>
                      </div>
                    </div>
                    <strong className="font-bold tabular-nums text-right">
                      {finalEligibility?.assignmentAverage !== null
                        ? `${finalEligibility?.assignmentAverage} / 100 (${
                            finalEligibility?.gradeEligible ? 'Sağlandı' : 'Baraj Altında'
                          })`
                        : 'Henüz Hesaplanamıyor'}
                    </strong>
                  </div>

                  {/* Koşul 3: Zorunlu Ödevlerin Tamamı Onaylandı */}
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      finalEligibility?.mandatoryEligible
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50/60 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {finalEligibility?.mandatoryEligible ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-slate-900">3. Zorunlu Ödev Onayları:</span>
                        <div className="text-[11px] text-slate-500">
                          Tüm zorunlu ödevlerin eğitmen onayından geçmesi şarttır
                        </div>
                      </div>
                    </div>
                    <strong className="font-bold tabular-nums text-right">
                      {finalEligibility?.mandatoryAssignmentsApproved ?? 0} /{' '}
                      {finalEligibility?.mandatoryAssignmentsTotal ?? 0} Onaylandı{' '}
                      {finalEligibility?.mandatoryEligible
                        ? '(Sağlandı)'
                        : `(${
                            (finalEligibility?.mandatoryAssignmentsTotal || 0) -
                            (finalEligibility?.mandatoryAssignmentsApproved || 0)
                          } Bekliyor)`}
                    </strong>
                  </div>

                  {/* Koşul 4: Yetkili Yönetici Nihai Onayı */}
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      finalEligibility?.finalStatus === 'admin_approved'
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                        : finalEligibility?.finalStatus === 'remediation'
                        ? 'bg-purple-50/60 border-purple-200 text-purple-900'
                        : finalEligibility?.finalStatus === 'rejected'
                        ? 'bg-red-50/60 border-red-200 text-red-900'
                        : 'bg-blue-50/60 border-blue-200 text-blue-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {finalEligibility?.finalStatus === 'admin_approved' ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                      <div>
                        <span className="font-semibold text-slate-900">4. Yetkili Yönetici Nihai Kararı:</span>
                        <div className="text-[11px] text-slate-500">
                          Oda yönetimi tarafından gerekçelendirilmiş resmî karar
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">
                        {finalEligibility?.finalStatus === 'admin_approved'
                          ? 'Nihai Onay Verildi'
                          : finalEligibility?.finalStatus === 'remediation'
                          ? 'Telafi Sürecinde'
                          : finalEligibility?.finalStatus === 'rejected'
                          ? 'Başarısız'
                          : finalEligibility?.academicEligible
                          ? 'Yönetici Onayı Bekleniyor'
                          : 'Ön Koşullar Bekleniyor'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* DİNAMİK YÖNETİCİ & DURUM MESAJI BİLGİLENDİRMESİ */}
                {finalEligibility?.finalStatus === 'admin_approved' ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs text-emerald-900">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Başarı değerlendirmeniz yönetici tarafından onaylandı. Belge işlemleri sonraki aşamada yürütülecektir.
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {successDecision?.traineeDecisionMessage ||
                        'Dönem sonu değerlendirmeniz ve akademik başarı kanıtlarınız yetkili oda yönetimi tarafından incelenmiş ve başarı onayınız verilmiştir.'}
                    </p>
                    {successDecision && (
                      <div className="text-[11px] text-emerald-800 pt-1 border-t border-emerald-200/60 flex items-center justify-between">
                        <span>Onaylayan: <strong>{successDecision.decidedBy}</strong></span>
                        <span>Karar Tarihi: <strong>{new Date(successDecision.decidedAt).toLocaleDateString('tr-TR')}</strong></span>
                      </div>
                    )}
                  </div>
                ) : finalEligibility?.finalStatus === 'remediation' ? (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-1.5 text-xs text-purple-900">
                    <div className="font-bold flex items-center gap-1.5 text-purple-800">
                      <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0" />
                      Telafi Sürecindesiniz
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {successDecision?.traineeDecisionMessage ||
                        'Eksik kalan akademik koşullarınız için oda yönetimi tarafından kontrollü telafi süreci tanımlanmıştır.'}
                    </p>
                    {successDecision?.remediationDetails && (
                      <div className="bg-white/80 p-2.5 rounded-lg border border-purple-200 text-[11px] space-y-1">
                        <div>
                          <strong>Gereken İşlem:</strong> {successDecision.remediationDetails.requiredActionNote}
                        </div>
                        {successDecision.remediationDetails.dueDate && (
                          <div>
                            <strong>Son Teslim Tarihi:</strong> {successDecision.remediationDetails.dueDate}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : finalEligibility?.academicEligible ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1 text-xs text-blue-900">
                    <div className="font-bold flex items-center gap-1.5 text-blue-800">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      Akademik koşulları sağladınız. Nihai yönetici onayı bekleniyor.
                    </div>
                    <p className="text-blue-800 leading-relaxed">
                      Tüm devam ve ödev barajlarını başarıyla tamamladınız. Dönem sonu kesin başarı kaydınız oda yönetimi tarafından incelenerek onaylanacaktır.
                    </p>
                  </div>
                ) : (
                  finalEligibility?.incompleteRequirements &&
                  finalEligibility.incompleteRequirements.length > 0 && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-amber-800">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        Tamamlanması Gereken Akademik Koşullar:
                      </div>
                      <ul className="list-disc list-inside text-amber-800 space-y-0.5 pl-1">
                        {finalEligibility.incompleteRequirements.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  )
                )}

                <div className="text-[11px] text-slate-500 pt-1 leading-relaxed border-t border-slate-100">
                  * <strong>Önemli Bilgilendirme:</strong> İlk üç akademik koşulun sağlanması kursiyere otomatik sertifika veya belge üretmez. Nihai başarı kararı yetkili İslahiye Ticaret Odası yönetimi tarafından verilir. Karar onaylandığında belge aşağıda listelenir.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* 6. BELGELERİM & KAREKODLU DOĞRULAMA (Sprint E03-D) */}
          {/* ----------------------------------------------------------------- */}
          <div id="belgeler" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  Belgelerim & Karekodlu Doğrulama Masası
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Eğitim programını başarıyla tamamlayıp yetkili yönetici onayı alan kursiyerler adına düzenlenen resmî başarı belgeleri.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Kayıtlı Belge: <strong>{traineeCertificates.length} Adet</strong>
              </span>
            </div>

            {traineeCertificates.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                <Award className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-xs font-bold text-slate-800">
                  {finalEligibility?.finalStatus === 'admin_approved'
                    ? 'Yönetici Nihai Onayınız Verildi — Belge Düzenleme Sırasında'
                    : finalEligibility?.academicEligible
                    ? 'Akademik Başarı Sağlandı — Yönetici Onayı Bekleniyor'
                    : 'Henüz Düzenlenmiş Bir Başarı Belgeniz Bulunmamaktadır'}
                </h4>
                <p className="text-[11px] text-slate-500 max-w-lg mx-auto leading-relaxed">
                  {finalEligibility?.finalStatus === 'admin_approved'
                    ? 'Tebrikler! Dönem sonu başarı kütüğünde onayınız tescil edilmiştir. İdari masadan belge numaranız ve karekodunuz üretildiğinde PDF çıktınızı buradan indirebilirsiniz.'
                    : 'Başarı belgesine hak kazanabilmek için %80 devam, en az 70 ödev ortalaması, tüm zorunlu ödevlerin eğitmen onayı ve oda yönetiminin resmî nihai onayı şarttır.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {traineeCertificates.map((cert) => {
                  const disc = checkCertificateAcademicDiscrepancy(cert);
                  const isCancelled = cert.status === 'cancelled';
                  const isSuperseded = cert.status === 'superseded';
                  const isUnderReview = cert.status === 'under_review' || disc.hasDiscrepancy;

                  return (
                    <div
                      key={cert.id}
                      className={`p-4 rounded-xl border transition-all space-y-3 ${
                        isCancelled
                          ? 'bg-red-50/50 border-red-200'
                          : isUnderReview
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {cert.certificateNumber}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                              {cert.certificateTypeLabel}
                            </span>
                            {isCancelled ? (
                              <span className="text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded">
                                İptal Edildi
                              </span>
                            ) : isSuperseded ? (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded">
                                Yerine Yeni Belge Düzenlendi
                              </span>
                            ) : isUnderReview ? (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                                Yeniden İnceleme Gerekiyor
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                                Düzenlendi (Geçerli Demo)
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-900">
                            {cert.programTitle} — {cert.cohortName}
                          </h4>
                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                            <span>Düzenleme: {new Date(cert.issuedAt).toLocaleDateString('tr-TR')}</span>
                            <span>•</span>
                            <span>Onaylayan: {cert.issuedBy}</span>
                            <span>•</span>
                            <span className="font-mono text-slate-700">Doğrulama Kodu: {cert.verificationCode}</span>
                          </div>
                        </div>

                        {/* Butonlar */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<QrCode className="w-3.5 h-3.5 text-slate-600" />}
                            onClick={() => navigate(`/belge-dogrula/${cert.verificationCode}`)}
                          >
                            Doğrula
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setPreviewCert(cert)}
                          >
                            Önizle / Yazdır
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            leftIcon={<Download className="w-3.5 h-3.5" />}
                            onClick={() => downloadCertificatePDF(cert)}
                          >
                            PDF İndir
                          </Button>
                        </div>
                      </div>

                      {/* İptal gerekçesi uyarısı */}
                      {isCancelled && cert.cancellationReason && (
                        <div className="p-2.5 rounded bg-white border border-red-200 text-xs text-red-800">
                          <strong>İptal Gerekçesi:</strong> {cert.cancellationReason}
                        </div>
                      )}

                      {/* Akademik uyumsuzluk uyarısı */}
                      {isUnderReview && (
                        <div className="p-2.5 rounded bg-white border border-amber-200 text-xs text-amber-900">
                          <strong>Uyarı:</strong> Not veya devam verilerinizde yapılan son güncelleme sebebiyle belgeniz idari yeniden incelemeye alınmıştır.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 6. DİĞER PROGRAM BAŞVURULARI BÖLÜMÜ */}
      {/* ------------------------------------------------------------------- */}
      {otherApplications.length > 0 && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Diğer Program Başvurularınız
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Bir eğitimde aktif kursiyer olmanız, diğer programlara aday olarak başvurmanızı engellemez.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setRole('applicant');
                navigate('/aday');
              }}
              className="text-xs"
            >
              Aday Masasını Aç →
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {otherApplications.map((app) => (
              <div
                key={app.id}
                className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{app.programTitle}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Durum: <span className="font-semibold text-blue-700 capitalize">{app.status}</span> •{' '}
                    {app.appliedAt}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setRole('applicant');
                    navigate('/aday');
                  }}
                  className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold"
                >
                  İncele
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Ödev Teslim Modalı (Sprint E03-B) */}
      {/* ===================================================================== */}
      {selectedAssignmentForSubmit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-brand-navy text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Ödev Teslim Masası</h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  {selectedAssignmentForSubmit.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedAssignmentForSubmit(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Son Teslim Tarihi:</span>
                  <span className="text-blue-700">
                    {selectedAssignmentForSubmit.dueDate || selectedAssignmentForSubmit.dueAt}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Zorunluluk Durumu:</span>
                  <span className={selectedAssignmentForSubmit.isMandatory ? 'text-red-700 font-bold' : 'text-slate-600'}>
                    {selectedAssignmentForSubmit.isMandatory ? 'Zorunlu Ödev' : 'İsteğe Bağlı'}
                  </span>
                </div>
              </div>

              {/* Açıklama Metni Alanı */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Çalışma Açıklaması & Metin İçeriği
                </label>
                <textarea
                  rows={4}
                  value={submitText}
                  onChange={(e) => setSubmitText(e.target.value)}
                  placeholder="Hazırladığınız çalışmanın özetini, bulgularınızı ve uyguladığınız adımları yazınız..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              {/* Bağlantı URL Alanı */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Harici Bağlantı / Repo / Drive Linki (Opsiyonel)
                </label>
                <input
                  type="url"
                  value={submitLink}
                  onChange={(e) => setSubmitLink(e.target.value)}
                  placeholder="https://drive.google.com/... veya https://github.com/..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              {/* Dosya Eki (Frontend Demo Simülasyonu) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Çalışma Dosyası Ekleme (Simülasyon)
                </label>
                <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 text-center space-y-2">
                  <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="text"
                      value={submitFileName}
                      onChange={(e) => setSubmitFileName(e.target.value)}
                      placeholder="Örn: pazaryeri_urun_listesi_ayse.pdf"
                      className="border border-slate-300 rounded px-2.5 py-1 text-xs w-64 bg-white"
                    />
                    <select
                      value={submitFileSize}
                      onChange={(e) => setSubmitFileSize(e.target.value)}
                      className="border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                    >
                      <option value="1.2 MB">1.2 MB</option>
                      <option value="3.5 MB">3.5 MB</option>
                      <option value="8.0 MB">8.0 MB</option>
                    </select>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    * Frontend simülasyonudur; dosya verisi yerel demo depolamada saklanır, harici sunucuya iletilmez.
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedAssignmentForSubmit(null)}
                >
                  Vazgeç
                </Button>
                <Button type="submit">Ödevi Eğitmene Teslim Et</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Teslim İnceleme Modalı */}
      {/* ===================================================================== */}
      {selectedSubmissionForView && (
        <Modal
          isOpen={Boolean(selectedSubmissionForView)}
          onClose={() => setSelectedSubmissionForView(null)}
          title={`Teslim Detayı: ${selectedSubmissionForView.assignment.title}`}
          description={`Sürüm: v${selectedSubmissionForView.submission.submissionVersion} • ${new Date(
            selectedSubmissionForView.submission.submittedAt
          ).toLocaleString('tr-TR')}`}
          footer={
            <Button size="sm" onClick={() => setSelectedSubmissionForView(null)}>
              Kapat
            </Button>
          }
        >
          <div className="space-y-3 text-xs">
            {selectedSubmissionForView.submission.content.text && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <strong className="block text-slate-700 mb-1">Açıklama Metni:</strong>
                <p className="text-slate-800 whitespace-pre-wrap">
                  {selectedSubmissionForView.submission.content.text}
                </p>
              </div>
            )}

            {selectedSubmissionForView.submission.content.linkUrl && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <strong className="block text-slate-700 mb-1">Bağlantı:</strong>
                <a
                  href={selectedSubmissionForView.submission.content.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  {selectedSubmissionForView.submission.content.linkUrl} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {selectedSubmissionForView.submission.content.fileName && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <strong className="block text-slate-700 mb-1">Eklenen Dosya:</strong>
                <span className="font-mono text-slate-700">
                  {selectedSubmissionForView.submission.content.fileName} ({selectedSubmissionForView.submission.content.fileSize})
                </span>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Oturum Detay Modalı */}
      {/* ===================================================================== */}
      {sessionDetailModal && (
        <Modal
          isOpen={Boolean(sessionDetailModal)}
          onClose={() => setSessionDetailModal(null)}
          title={`Oturum ${sessionDetailModal.sessionNumber}: ${sessionDetailModal.title}`}
          description={`${sessionDetailModal.date} • ${sessionDetailModal.startTime} - ${sessionDetailModal.endTime}`}
          footer={
            <Button size="sm" onClick={() => setSessionDetailModal(null)}>
              Kapat
            </Button>
          }
        >
          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <strong>Oturum Konumu:</strong> {sessionDetailModal.location}
            </div>
            {sessionDetailModal.topic && (
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <strong>Ders İçeriği:</strong> {sessionDetailModal.topic}
              </div>
            )}
            {sessionDetailModal.notes && (
              <div className="p-3 bg-blue-50 text-blue-900 rounded border border-blue-200">
                <strong>Eğitmen Notu:</strong> {sessionDetailModal.notes}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Başarı Belgesi Önizleme Modalı (Sprint E03-D) */}
      {/* ===================================================================== */}
      {previewCert && (
        <CertificatePreviewModal
          certificate={previewCert}
          onClose={() => setPreviewCert(null)}
        />
      )}
    </div>
  );
};

export default TraineeDashboardPage;
