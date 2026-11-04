import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  LayoutGrid,
  List,
  QrCode,
  ExternalLink,
} from 'lucide-react';
import {
  CertificateRecord,
  CertificateType,
  Group,
  Program,
} from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { KpiStrip } from '../components/ui/KpiStrip';
import { Button } from '../components/ui/Button';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { getStoredGroups } from '../services/enrollmentStorage';
import { fetchLivePrograms, getInitialPrograms } from '../services/programAdapter';
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
  const [programs, setPrograms] = useState<Program[]>(() => getInitialPrograms());
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

  // View Mode & Bulk Selection
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState<string[]>([]);
  const [bulkIssueModalOpen, setBulkIssueModalOpen] = useState(false);
  const [bulkIssueNotes, setBulkIssueNotes] = useState('');

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load Data
  const loadData = () => {
    fetchLivePrograms().then((progs) => {
      if (progs && progs.length > 0) setPrograms(progs);
    });
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

  // Bulk Actions
  const toggleSelectAll = () => {
    if (selectedEnrollmentIds.length === combinedRows.length) {
      setSelectedEnrollmentIds([]);
    } else {
      setSelectedEnrollmentIds(combinedRows.map((r) => r.eligibility.enrollmentId));
    }
  };

  const toggleSelectOne = (enrollmentId: string) => {
    setSelectedEnrollmentIds((prev) =>
      prev.includes(enrollmentId) ? prev.filter((id) => id !== enrollmentId) : [...prev, enrollmentId]
    );
  };

  const handleExecuteBulkIssue = () => {
    let successCount = 0;
    let failCount = 0;

    selectedEnrollmentIds.forEach((enrId) => {
      const res = issueCertificate({
        enrollmentId: enrId,
        issuedBy: `${currentUser.fullName} (Yetkili Yönetici)`,
        certificateType: 'achievement',
        notes: bulkIssueNotes.trim() || 'Toplu işlemle başarı belgesi üretildi.',
      });
      if (res.success) {
        successCount++;
      } else {
        failCount++;
      }
    });

    setFeedback({
      type: 'success',
      message: `${successCount} kursiyer için başarı belgeleri ve QR kodları başarıyla üretildi.${
        failCount > 0 ? ` (${failCount} kayıtta zaten belge bulunduğu veya onay eksik olduğu için atlandı)` : ''
      }`,
    });
    setBulkIssueModalOpen(false);
    setSelectedEnrollmentIds([]);
    setBulkIssueNotes('');
    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Sayfa Başlığı ve Durum */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Başarı Belgesi Üretimi, QR Doğrulama & Belge Kütüğü
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Yetkili oda yönetimi onayı almış kursiyerlerin belge kayıtları, PDF üretimi ve iptal/yeniden düzenleme yönetimi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              resetCertificateDemoData();
              loadData();
              setFeedback({ type: 'success', message: 'Belge kütük verileri başlangıç durumuna yenilendi.' });
            }}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            <span>Belge Kütüğünü Yenile</span>
          </button>
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

      {/* 4 TOP KPI STRIP (Stripe / Canvas LMS Metrik Bandı) */}
      <KpiStrip
        items={[
          {
            label: 'Belgeye Hak Kazanan',
            value: totalApprovedCandidates,
            icon: <Award className="w-4 h-4" />,
            subtext: 'Yönetimce onaylı kursiyer',
          },
          {
            label: 'Düzenlenmiş Belgeler',
            value: totalIssuedCerts,
            icon: <CheckCircle2 className="w-4 h-4" />,
            subtext: 'Aktif & doğrulanabilir PDF',
          },
          {
            label: 'Belge Bekleyenler',
            value: pendingIssuanceCount,
            icon: <Award className="w-4 h-4" />,
            subtext: 'Onaylı, düzenleme bekliyor',
            badge: pendingIssuanceCount > 0 ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Sırada
              </span>
            ) : undefined,
          },
          {
            label: 'İptal / İnceleme',
            value: underReviewOrCancelledCount,
            icon: <AlertTriangle className="w-4 h-4" />,
            subtext: 'Geçersiz / veri uyumsuzluğu',
            badge: underReviewOrCancelledCount > 0 ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                Kritik
              </span>
            ) : undefined,
          },
        ]}
      />

      {/* FILTER & SEARCH TOOLBAR (Standart Tek Satır Hizalama) */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          {/* 1. Arama */}
          <div className="relative flex items-center min-w-[220px] max-w-xs w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Kursiyer veya belge no ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-3 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white w-full text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* 2. Program Seçimi */}
          <select
            value={selectedProgramId}
            onChange={(e) => setSelectedProgramId(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tüm Programlar</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          {/* 3. Grup Seçimi */}
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tüm Gruplar</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          {/* 4. Durum Filtresi */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="issued">Düzenlenenler ({totalIssuedCerts})</option>
            <option value="pending">Belge Bekleyen ({pendingIssuanceCount})</option>
            <option value="under_review">İnceleme Gerekli ({underReviewOrCancelledCount})</option>
            <option value="cancelled">İptal Edilenler</option>
          </select>
        </div>

        {/* Sağ: Görünüm Modu Switcher */}
        <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-100 shrink-0 h-9">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`h-7 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === 'list'
                ? 'bg-white shadow-2xs text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Liste Görünümü"
          >
            <List className="w-3.5 h-3.5" />
            <span>Liste</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`h-7 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === 'grid'
                ? 'bg-white shadow-2xs text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Kart Görünümü"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kartlar</span>
          </button>
        </div>
      </div>

      {/* CERTIFICATE & CANDIDATE RECORDS VIEW */}
      {combinedRows.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          Seçili filtrelere uygun kursiyer veya belge kaydı bulunamadı.
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[580px] overflow-y-auto relative">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center bg-slate-50">
                    <input
                      type="checkbox"
                      checked={
                        combinedRows.length > 0 &&
                        selectedEnrollmentIds.length === combinedRows.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 bg-slate-50">Kursiyer</th>
                  <th className="py-3 px-3 bg-slate-50">Program & Grup</th>
                  <th className="py-3 px-3 text-center bg-slate-50">Nihai Karar Durumu</th>
                  <th className="py-3 px-3 text-center bg-slate-50">Belge No & Kod</th>
                  <th className="py-3 px-3 text-center bg-slate-50">Belge Durumu</th>
                  <th className="py-3 px-3 text-right bg-slate-50">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {combinedRows.map((row) => {
                  const { eligibility, certificate, hasDiscrepancy } = row;
                  const isIssued = certificate?.status === 'issued';
                  const isCancelled = certificate?.status === 'cancelled';
                  const isUnderReview = certificate?.status === 'under_review' || hasDiscrepancy;
                  const isPending = eligibility.finalStatus === 'admin_approved' && (!certificate || isCancelled);
                  const isSelected = selectedEnrollmentIds.includes(eligibility.enrollmentId);

                  return (
                    <tr
                      key={eligibility.enrollmentId}
                      className={`transition-colors ${
                        isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(eligibility.enrollmentId)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

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
                            <div className="flex items-center justify-center gap-1 mt-0.5">
                              <Link
                                to={`/yonetim/belge-dogrulama/${certificate.verificationCode}`}
                                className="text-[10px] text-blue-700 hover:text-blue-900 font-mono underline inline-flex items-center gap-0.5"
                                title="Belge Doğrulama Sayfasını Aç"
                              >
                                <span>{certificate.verificationCode}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
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

                          {certificate && (
                            <Button
                              size="sm"
                              variant="outline"
                              leftIcon={<History className="w-3 h-3" />}
                              onClick={() => setHistoryModalCert(certificate)}
                              className="text-[11px] py-1 px-2 text-slate-600 hover:bg-slate-100"
                              title="Tarihçe ve Denetim İzi"
                            >
                              Kütük
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
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {combinedRows.map((row) => {
            const { eligibility, certificate, hasDiscrepancy } = row;
            const isIssued = certificate?.status === 'issued';
            const isCancelled = certificate?.status === 'cancelled';
            const isUnderReview = certificate?.status === 'under_review' || hasDiscrepancy;
            const isPending = eligibility.finalStatus === 'admin_approved' && (!certificate || isCancelled);
            const isSelected = selectedEnrollmentIds.includes(eligibility.enrollmentId);

            return (
              <Card
                key={eligibility.enrollmentId}
                className={`transition-all border ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-100 shadow-md bg-blue-50/20'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(eligibility.enrollmentId)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{eligibility.traineeName}</h4>
                        <p className="text-[11px] text-slate-500">{eligibility.groupName}</p>
                      </div>
                    </div>

                    {isIssued && !hasDiscrepancy ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Düzenlendi
                      </span>
                    ) : isUnderReview ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        İnceleme Gerekli
                      </span>
                    ) : isPending ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                        Bekliyor
                      </span>
                    ) : isCancelled ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                        İptal
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                        Onaysız
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Program:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                        {eligibility.programTitle}
                      </span>
                    </div>

                    {certificate ? (
                      <>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Belge No:</span>
                          <span className="font-mono font-bold text-slate-900">
                            {certificate.certificateNumber}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Karekod / Doğrulama:</span>
                          <Link
                            to={`/yonetim/belge-dogrulama/${certificate.verificationCode}`}
                            className="text-blue-700 font-mono font-bold text-[10px] underline flex items-center gap-1"
                          >
                            <QrCode className="w-3 h-3" />
                            <span>{certificate.verificationCode}</span>
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">
                        Henüz resmi belge numarası atanmadı
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 text-xs">
                    {isPending && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="w-full justify-center text-xs"
                        leftIcon={<Plus className="w-3 h-3" />}
                        onClick={() => handleOpenIssueModal(eligibility.enrollmentId)}
                      >
                        Belge Düzenle
                      </Button>
                    )}

                    {certificate && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 justify-center text-xs"
                          leftIcon={<Eye className="w-3 h-3" />}
                          onClick={() => setPreviewCert(certificate)}
                        >
                          Önizle
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="flex-1 justify-center text-xs"
                          leftIcon={<Download className="w-3 h-3" />}
                          onClick={() => downloadCertificatePDF(certificate)}
                        >
                          PDF
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Floating Bulk Action Ribbon */}
      {selectedEnrollmentIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 text-xs animate-slideUp">
          <div className="flex items-center gap-2 font-semibold">
            <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[11px] font-bold">
              {selectedEnrollmentIds.length}
            </span>
            <span>kayıt seçildi</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBulkIssueModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Toplu Belge Üret</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedEnrollmentIds([])}
              className="px-2.5 py-1.5 text-slate-400 hover:text-white transition"
            >
              Seçimi Kaldır
            </button>
          </div>
        </div>
      )}

      {/* BULK ISSUE MODAL */}
      {bulkIssueModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Toplu Belge Üretimi</h3>
                <p className="text-xs text-slate-500">
                  {selectedEnrollmentIds.length} kursiyer için karekodlu resmi sertifika üretilecek.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
              Yalnızca nihai oda onayı verilmiş kursiyerler için benzersiz belge numarası (İE-2026-BB-xxx) ve doğrulama kodu üretilecek, kütüğe kaydedilecektir.
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kütük Tescil Açıklaması (Opsiyonel):
              </label>
              <textarea
                rows={2}
                value={bulkIssueNotes}
                onChange={(e) => setBulkIssueNotes(e.target.value)}
                placeholder="Örn: 2026 Güz dönemi mezuniyet komisyonu onayıyla toplu düzenlendi..."
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBulkIssueModalOpen(false)}
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-brand-navy hover:bg-slate-800 text-white"
                onClick={handleExecuteBulkIssue}
              >
                Belgeleri Üret ve Kütüğe İşle
              </Button>
            </div>
          </div>
        </div>
      )}

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
