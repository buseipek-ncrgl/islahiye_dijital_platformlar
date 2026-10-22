import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Search,
  History,
  Download,
  Eye,
  Plus,
  RefreshCw,
  X,
  FileCheck,
} from 'lucide-react';
import {
  CertificateRecord,
  CertificateType,
  Group,
  Program,
} from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { getStoredGroups } from '../services/enrollmentStorage';
import { DEMO_PROGRAMS } from '../data/educationData';
import { calculateBatchEligibility } from '../services/successEngine';
import {
  getStoredCertificates,
  issueCertificate,
  cancelCertificate,
  reissueCertificate,
  checkCertificateIssuanceEligibility,
  checkCertificateAcademicDiscrepancy,
  subscribeToCertificateUpdates,
  resetCertificateDemoData,
} from '../services/certificateStorage';
import { downloadCertificatePDF } from '../services/pdfEngine';
import { CertificatePreviewModal } from '../components/certificate/CertificatePreviewModal';

export const CertificateManagementPage: React.FC = () => {
  const { currentUser } = useDemoRole();

  // Filters & Search
  const [programs, setPrograms] = useState<Program[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [eligibilityList, setEligibilityList] = useState<ReturnType<typeof calculateBatchEligibility>>([]);

  // Modals
  const [previewCert, setPreviewCert] = useState<CertificateRecord | null>(null);

  // Issue Certificate Modal
  const [selectedEnrollmentForIssue, setSelectedEnrollmentForIssue] = useState<string | null>(null);
  const [issueCertType, setIssueCertType] = useState<CertificateType>('achievement');
  const [issueNotes, setIssueNotes] = useState<string>('');

  // Cancel Certificate Modal
  const [cancelModalCert, setCancelModalCert] = useState<CertificateRecord | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  // Reissue Modal
  const [reissueModalCert, setReissueModalCert] = useState<CertificateRecord | null>(null);
  const [reissueReason, setReissueReason] = useState<string>('');

  // Audit History Modal
  const [historyModalCert, setHistoryModalCert] = useState<CertificateRecord | null>(null);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load Data
  const loadData = () => {
    setPrograms(DEMO_PROGRAMS);
    setGroups(getStoredGroups());
    setCertificates(getStoredCertificates());

    const batch = calculateBatchEligibility(
      selectedProgramId === 'all' ? undefined : selectedProgramId,
      undefined,
      selectedGroupId === 'all' ? undefined : selectedGroupId
    );
    setEligibilityList(batch);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToCertificateUpdates(() => {
      loadData();
    });
    return () => {
      unsub();
    };
  }, [selectedProgramId, selectedGroupId]);

  // Map from enrollmentId to CertificateRecord
  const certByEnrollmentMap = useMemo(() => {
    const map = new Map<string, CertificateRecord>();
    for (const c of certificates) {
      if (c.status !== 'superseded') {
        map.set(c.enrollmentId, c);
      }
    }
    return map;
  }, [certificates]);

  // Combined Rows for Decision Desk
  // A row can be an already issued certificate OR a candidate who is approved and awaiting certificate
  const combinedRows = useMemo(() => {
    const rows = eligibilityList.map((elig) => {
      const cert = certByEnrollmentMap.get(elig.enrollmentId) || null;
      const discrepancyCheck = cert ? checkCertificateAcademicDiscrepancy(cert) : { hasDiscrepancy: false };
      return {
        eligibility: elig,
        certificate: cert,
        hasDiscrepancy: discrepancyCheck.hasDiscrepancy,
      };
    });

    return rows.filter((r) => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.eligibility.traineeName.toLowerCase().includes(q);
        const matchProg = r.eligibility.programTitle.toLowerCase().includes(q);
        const matchCertNo = r.certificate?.certificateNumber.toLowerCase().includes(q);
        const matchVerCode = r.certificate?.verificationCode.toLowerCase().includes(q);
        if (!matchName && !matchProg && !matchCertNo && !matchVerCode) return false;
      }

      // Status Filter
      if (statusFilter === 'issued') {
        return r.certificate && r.certificate.status === 'issued';
      }
      if (statusFilter === 'pending') {
        // Hak kazanmış (admin onaylı) ama henüz belgesi üretilmemiş
        return r.eligibility.finalStatus === 'admin_approved' && (!r.certificate || r.certificate.status === 'cancelled');
      }
      if (statusFilter === 'under_review') {
        return r.certificate && (r.certificate.status === 'under_review' || r.hasDiscrepancy);
      }
      if (statusFilter === 'cancelled') {
        return r.certificate && r.certificate.status === 'cancelled';
      }

      return true;
    });
  }, [eligibilityList, certByEnrollmentMap, searchQuery, statusFilter]);

  // Top KPI Metrics
  const totalApprovedCandidates = eligibilityList.filter((e) => e.finalStatus === 'admin_approved').length;
  const totalIssuedCerts = certificates.filter((c) => c.status === 'issued').length;
  const pendingIssuanceCount = eligibilityList.filter(
    (e) => e.finalStatus === 'admin_approved' && !certByEnrollmentMap.has(e.enrollmentId)
  ).length;
  const underReviewOrCancelledCount = certificates.filter(
    (c) => c.status === 'cancelled' || c.status === 'under_review'
  ).length;

  // Selected Enrollment for Issue Check
  const issueEligibilityCheck = useMemo(() => {
    if (!selectedEnrollmentForIssue) return null;
    return checkCertificateIssuanceEligibility(selectedEnrollmentForIssue);
  }, [selectedEnrollmentForIssue]);

  // Handlers
  const handleOpenIssueModal = (enrollmentId: string) => {
    setSelectedEnrollmentForIssue(enrollmentId);
    setIssueCertType('achievement');
    setIssueNotes('');
  };

  const handleConfirmIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollmentForIssue) return;

    const res = issueCertificate({
      enrollmentId: selectedEnrollmentForIssue,
      issuedBy: `${currentUser.fullName} (Yetkili Yönetici)`,
      certificateType: issueCertType,
      notes: issueNotes.trim() || undefined,
    });

    if (res.success && res.certificate) {
      setFeedback({
        type: 'success',
        message: `${res.certificate.traineeName} adına ${res.certificate.certificateNumber} numaralı Başarı Belgesi başarıyla oluşturuldu ve tescil edildi.`,
      });
      setSelectedEnrollmentForIssue(null);
      loadData();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Belge oluşturulamadı.' });
    }
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalCert) return;

    const res = cancelCertificate({
      certificateId: cancelModalCert.id,
      cancellationReason: cancelReason.trim(),
      cancelledBy: `${currentUser.fullName} (Yetkili Yönetici)`,
    });

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `${cancelModalCert.certificateNumber} numaralı belge gerekçelendirilerek resmi olarak iptal edildi.`,
      });
      setCancelModalCert(null);
      setCancelReason('');
      loadData();
    } else {
      setFeedback({ type: 'error', message: res.error || 'İptal işlemi başarısız.' });
    }
  };

  const handleConfirmReissue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reissueModalCert) return;

    const res = reissueCertificate({
      previousCertificateId: reissueModalCert.id,
      reissueReason: reissueReason.trim(),
      reissuedBy: `${currentUser.fullName} (Yetkili Yönetici)`,
    });

    if (res.success && res.newCertificate) {
      setFeedback({
        type: 'success',
        message: `${reissueModalCert.certificateNumber} numaralı eski belgenin yerine ${res.newCertificate.certificateNumber} numaralı yeni belge düzenlendi.`,
      });
      setReissueModalCert(null);
      setReissueReason('');
      loadData();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Yeniden düzenleme yapılamadı.' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Sayfa Başlığı ve Durum */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <span className="text-xs text-slate-500 font-medium">Yönetim Masası (/yonetim/belgeler):</span>
          <h2 className="text-xl font-bold text-brand-navy flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Başarı Belgesi PDF Üretimi, QR Doğrulama ve Belge Kütüğü
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Yetkili oda yönetimi onayı almış kursiyerlerin belge kayıtları, PDF üretimi ve iptal/yeniden düzenleme yönetimi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => {
              resetCertificateDemoData();
              loadData();
              setFeedback({ type: 'success', message: 'Demo belge verileri başlangıç durumuna sıfırlandı.' });
            }}
            className="text-xs text-slate-600"
          >
            Demo Verilerini Sıfırla
          </Button>
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
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 TOP KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-slate-500">Belgeye Hak Kazanan</span>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">{totalApprovedCandidates}</div>
            <div className="text-[11px] text-slate-400">Yönetimce Onaylı Kursiyer</div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/20">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-emerald-900">Düzenlenmiş Belgeler</span>
            <div className="text-2xl font-bold text-emerald-700 tabular-nums">{totalIssuedCerts}</div>
            <div className="text-[11px] text-emerald-800">Aktif & Doğrulanabilir PDF</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/20">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-blue-900">Belge Bekleyenler</span>
            <div className="text-2xl font-bold text-blue-700 tabular-nums">{pendingIssuanceCount}</div>
            <div className="text-[11px] text-blue-800">Onaylı, Düzenleme Bekliyor</div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/20">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-amber-900">İptal / İnceleme</span>
            <div className="text-2xl font-bold text-amber-700 tabular-nums">{underReviewOrCancelledCount}</div>
            <div className="text-[11px] text-amber-800">Geçersiz / Veri Uyumsuzluğu</div>
          </CardContent>
        </Card>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">Program:</span>
            <select
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              className="border border-slate-300 rounded-lg p-2 bg-slate-50 text-xs font-medium text-slate-800"
            >
              <option value="all">Tüm Programlar</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">Grup:</span>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="border border-slate-300 rounded-lg p-2 bg-slate-50 text-xs font-medium text-slate-800"
            >
              <option value="all">Tüm Gruplar</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Kursiyer veya belge no ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white w-48 text-slate-800"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-600 mr-1">Filtre:</span>
          {[
            { key: 'all', label: 'Tümü' },
            { key: 'issued', label: 'Düzenlenenler' },
            { key: 'pending', label: 'Belge Bekleyen' },
            { key: 'under_review', label: 'İnceleme Gerekli' },
            { key: 'cancelled', label: 'İptal Edilenler' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                statusFilter === f.key
                  ? 'bg-brand-navy text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE: CERTIFICATE & CANDIDATE RECORDS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-blue-600" />
              Kursiyer Belge Kayıtları ve Hak Ediş Kütüğü ({combinedRows.length} Kayıt)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Yalnızca 4 başarı şartı sağlanmış ve yetkili oda yönetimince onaylanmış kayıtlara belge üretilebilir.
            </p>
          </div>
        </div>

        {combinedRows.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            Seçili filtrelere uygun kursiyer veya belge kaydı bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Kursiyer</th>
                  <th className="py-3 px-3">Program & Grup</th>
                  <th className="py-3 px-3 text-center">Nihai Karar Durumu</th>
                  <th className="py-3 px-3 text-center">Belge No & Kod</th>
                  <th className="py-3 px-3 text-center">Belge Durumu</th>
                  <th className="py-3 px-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {combinedRows.map((row) => {
                  const { eligibility, certificate, hasDiscrepancy } = row;
                  const isIssued = certificate?.status === 'issued';
                  const isCancelled = certificate?.status === 'cancelled';
                  const isUnderReview = certificate?.status === 'under_review' || hasDiscrepancy;
                  const isPending = eligibility.finalStatus === 'admin_approved' && (!certificate || isCancelled);

                  return (
                    <tr key={eligibility.enrollmentId} className="hover:bg-slate-50/70 transition-colors">
                      {/* Kursiyer */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900">{eligibility.traineeName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Kayıt: {eligibility.enrollmentId}</div>
                      </td>

                      {/* Program & Grup */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800">{eligibility.programTitle}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {eligibility.groupName} • {eligibility.cohortName}
                        </div>
                      </td>

                      {/* Nihai Karar Durumu */}
                      <td className="py-3.5 px-3 text-center">
                        {eligibility.finalStatus === 'admin_approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Yönetici Onayı Verildi
                          </span>
                        ) : eligibility.finalStatus === 'remediation' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-900 border border-purple-300">
                            Telafi Sürecinde
                          </span>
                        ) : eligibility.academicEligible ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                            Yönetici Kararı Bekliyor
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                            Akademik Şart Eksik
                          </span>
                        )}
                      </td>

                      {/* Belge No & Kod */}
                      <td className="py-3.5 px-3 text-center">
                        {certificate ? (
                          <div>
                            <div className="font-mono font-bold text-slate-900 text-[11px]">
                              {certificate.certificateNumber}
                            </div>
                            <div className="text-[10px] text-blue-700 font-mono mt-0.5">
                              {certificate.verificationCode}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belge Düzenlenmedi</span>
                        )}
                      </td>

                      {/* Belge Durumu */}
                      <td className="py-3.5 px-3 text-center">
                        {isIssued && !hasDiscrepancy ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Düzenlendi (Geçerli)
                          </span>
                        ) : isUnderReview ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Yeniden İnceleme Gerekli
                          </span>
                        ) : isCancelled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                            İptal Edildi
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                            Belge Düzenlenmesi Bekleniyor
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                            Hak Kazanmadı
                          </span>
                        )}
                      </td>

                      {/* İşlemler */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. Belge Düzenle Butonu (Yalnızca hak kazanmış ve aktif belgesi olmayanlar için) */}
                          {isPending && (
                            <Button
                              size="sm"
                              variant="primary"
                              leftIcon={<Plus className="w-3 h-3" />}
                              onClick={() => handleOpenIssueModal(eligibility.enrollmentId)}
                              className="text-[11px] py-1 px-2.5"
                            >
                              Belge Düzenle
                            </Button>
                          )}

                          {/* 2. Önizle / PDF İndir (Belgesi olanlar için) */}
                          {certificate && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                leftIcon={<Eye className="w-3 h-3" />}
                                onClick={() => setPreviewCert(certificate)}
                                className="text-[11px] py-1 px-2"
                              >
                                Önizle
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                leftIcon={<Download className="w-3 h-3" />}
                                onClick={() => downloadCertificatePDF(certificate)}
                                className="text-[11px] py-1 px-2"
                              >
                                PDF
                              </Button>
                            </>
                          )}

                          {/* 3. İptal Et Butonu (Aktif belgesi olanlar için) */}
                          {isIssued && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setCancelModalCert(certificate);
                                setCancelReason('');
                              }}
                              className="text-[11px] py-1 px-2 text-red-700 hover:bg-red-50 border-red-200"
                            >
                              İptal Et
                            </Button>
                          )}

                          {/* 4. Yeniden Düzenle Butonu (İptal veya inceleme gerektirenler için) */}
                          {(isCancelled || isUnderReview) && certificate && (
                            <Button
                              size="sm"
                              variant="outline"
                              leftIcon={<RefreshCw className="w-3 h-3" />}
                              onClick={() => {
                                setReissueModalCert(certificate);
                                setReissueReason('');
                              }}
                              className="text-[11px] py-1 px-2 text-purple-700 hover:bg-purple-50 border-purple-200"
                            >
                              Yeniden Düzenle
                            </Button>
                          )}

                          {/* 5. Denetim Geçmişi */}
                          {certificate && certificate.auditHistory && certificate.auditHistory.length > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setHistoryModalCert(certificate)}
                              className="text-[11px] py-1 px-1.5 text-slate-500"
                              title="Belge Denetim Geçmişi"
                            >
                              <History className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: BELGE DÜZENLEME ONAY MODALI (8 ŞART KONTROLÜ) */}
      {/* ===================================================================== */}
      {selectedEnrollmentForIssue && issueEligibilityCheck && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-brand-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-base">Başarı Belgesi Düzenleme Masası</h3>
                  <p className="text-xs text-blue-200">
                    {issueEligibilityCheck.eligibilityResult?.traineeName} ({issueEligibilityCheck.eligibilityResult?.programTitle})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEnrollmentForIssue(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmIssue} className="p-6 space-y-4 text-xs">
              {/* 8 Şart Uygunluk Kontrol Özeti */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  Resmî Belge Düzenleme Yetki & Ön Koşul Kontrolü:
                </span>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-slate-700">
                    <span>1. Geçerli Kesin Kayıt:</span>
                    <strong className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Doğrulandı
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-700">
                    <span>2. Devam Oranı (%80 Barajı):</span>
                    <strong className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> %{issueEligibilityCheck.eligibilityResult?.attendanceRate}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-700">
                    <span>3. Ödev Ortalaması (70/100 Barajı):</span>
                    <strong className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {issueEligibilityCheck.eligibilityResult?.assignmentAverage} / 100
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-700">
                    <span>4. Zorunlu Ödev Onayları:</span>
                    <strong className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Tamamı Onaylı ({issueEligibilityCheck.eligibilityResult?.mandatoryAssignmentsApproved})
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-700">
                    <span>5. Yetkili Yönetici Nihai Onayı:</span>
                    <strong className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Karar Onaylandı
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-700">
                    <span>6. Veri Snapshot Uyumu:</span>
                    <strong className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Güncel ve Tutarlı
                    </strong>
                  </div>
                </div>

                {!issueEligibilityCheck.canIssue && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 mt-2 space-y-1">
                    <strong className="block text-red-800 font-bold">Belge Düzenlenemez Gerekçesi:</strong>
                    <ul className="list-disc list-inside space-y-0.5">
                      {issueEligibilityCheck.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Belge Türü Seçimi */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Belge Türü *
                </label>
                <select
                  value={issueCertType}
                  onChange={(e) => setIssueCertType(e.target.value as CertificateType)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-slate-50 font-medium"
                >
                  <option value="achievement">Eğitim Başarı Belgesi (Nihai Onaylı)</option>
                  <option value="participation" disabled>
                    Katılım Belgesi (Kurumca onaylı kural bulunmamaktadır)
                  </option>
                  <option value="specialized" disabled>
                    Uzmanlık Sertifikası (Ayrı mevzuat gerektirir)
                  </option>
                </select>
              </div>

              {/* Kurum İçi Not */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kurum İçi Belge Notu (Opsiyonel)
                </label>
                <textarea
                  rows={2}
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                  placeholder="Örn: 2026 Güz Dönemi mezuniyet komisyonu kararı gereğince düzenlendi..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setSelectedEnrollmentForIssue(null)}>
                  Vazgeç
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!issueEligibilityCheck.canIssue}
                  className="bg-blue-700 hover:bg-blue-800 text-white"
                >
                  Belgeyi Resmen Oluştur ve Kaydet
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: BELGE İPTAL MODALI (GEREKÇELİ) */}
      {/* ===================================================================== */}
      {cancelModalCert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-red-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Belge İptal İşlemi</h3>
                <p className="text-xs text-red-200 mt-0.5">
                  {cancelModalCert.certificateNumber} — {cancelModalCert.traineeName}
                </p>
              </div>
              <button
                onClick={() => setCancelModalCert(null)}
                className="text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 leading-relaxed">
                <strong>Dikkat:</strong> Belge iptal edildiğinde QR doğrulama sayfasında <strong>"İptal Edilmiş"</strong> durumu görüntülenecek ve belge geçerliliğini yitirecektir. Eski belge kaydı geçmişte korunacaktır.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Zorunlu İptal Gerekçesi *
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="İptal nedenini ayrıntılı olarak yazınız (Örn: Evrak mükerrerliği, idari inceleme kararı vb.)..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCancelModalCert(null)}>
                  Vazgeç
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!cancelReason.trim()}
                  className="bg-red-700 hover:bg-red-800 text-white font-semibold"
                >
                  Belgeyi Resmen İptal Et
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: YENİDEN BELGE DÜZENLEME (REISSUE) MODALI */}
      {/* ===================================================================== */}
      {reissueModalCert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-purple-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Belgeyi Yeniden Düzenle (Reissue)</h3>
                <p className="text-xs text-purple-200 mt-0.5">
                  Önceki Belge: {reissueModalCert.certificateNumber}
                </p>
              </div>
              <button
                onClick={() => setReissueModalCert(null)}
                className="text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReissue} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-900 leading-relaxed">
                Bu işlemle {reissueModalCert.traineeName} adına yeni bir belge numarası ve karekod üretilecek, önceki belge ise <strong>"Yerine Yeni Belge Düzenlendi"</strong> olarak işaretlenecektir.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Yeniden Düzenleme Gerekçesi *
                </label>
                <textarea
                  rows={3}
                  value={reissueReason}
                  onChange={(e) => setReissueReason(e.target.value)}
                  placeholder="Gerekçe giriniz (Örn: İsim düzeltmesi sonrası güncel akademik verilerle yeniden tanzim edildi)..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setReissueModalCert(null)}>
                  Vazgeç
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!reissueReason.trim()}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-semibold"
                >
                  Yeni Belge Düzenle
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: BELGE DENETİM GEÇMİŞİ MODALI */}
      {/* ===================================================================== */}
      {historyModalCert && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Belge Denetim & Sürüm Tarihçesi</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {historyModalCert.certificateNumber} — {historyModalCert.traineeName}
                </p>
              </div>
              <button
                onClick={() => setHistoryModalCert(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs max-h-[400px] overflow-y-auto">
              {historyModalCert.auditHistory?.map((item, index) => (
                <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>İşlem: {item.action.toUpperCase()}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {new Date(item.performedAt).toLocaleString('tr-TR')}
                    </span>
                  </div>
                  <div className="text-slate-600">İşlemi Yapan: <strong>{item.performedBy}</strong></div>
                  {item.reason && <div className="text-slate-700 italic">Gerekçe: "{item.reason}"</div>}
                  {item.note && <div className="text-slate-600">Not: {item.note}</div>}
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setHistoryModalCert(null)}>
                Kapat
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 5: RESMÎ PDF ÖNİZLEME MODALI */}
      {/* ===================================================================== */}
      <CertificatePreviewModal
        certificate={previewCert}
        onClose={() => setPreviewCert(null)}
      />

    </div>
  );
};

export default CertificateManagementPage;
