import React, { useState, useEffect } from 'react';
import {
  Search,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  History,
  Lock,
  Eye,
} from 'lucide-react';
import { DEMO_PROGRAMS } from '../data/educationData';
import { Application, ApplicationStatus, RecommendationStatus } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  getAllApplications,
  updateAdminDecision,
  subscribeToApplicationUpdates,
  getProgramQuotaStats,
} from '../services/applicationStorage';
import {
  getEvaluationForApplication,
  evaluateAndStoreApplication,
  updateCriterionVerificationStatus,
  subscribeToEvaluationUpdates,
} from '../services/evaluationStorage';

export const ApplicationDecisionPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>(() => getAllApplications());
  const [selectedAppId, setSelectedAppId] = useState<string | null>('app-fatma-01');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sync applications and evaluations
  useEffect(() => {
    const unsubApps = subscribeToApplicationUpdates((updated) => {
      setApplications(updated);
    });
    const unsubEvals = subscribeToEvaluationUpdates(() => {
      setApplications(getAllApplications());
    });
    return () => {
      unsubApps();
      unsubEvals();
    };
  }, []);

  // Karar formu durumları
  const [internalNoteDraft, setInternalNoteDraft] = useState<string>('');
  const [candidateMessageDraft, setCandidateMessageDraft] = useState<string>('');
  const [deviationReasonDraft, setDeviationReasonDraft] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Onay penceresi (Confirmation Modal)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingDecisionStatus, setPendingDecisionStatus] = useState<ApplicationStatus | null>(null);

  // Seçili aday nesnesi
  const selectedApp = applications.find((a) => a.id === selectedAppId) || applications[0] || null;

  // Seçili adayın değerlendirme kaydı (yoksa otomatik değerlendir)
  const currentEvaluation = selectedApp
    ? getEvaluationForApplication(selectedApp.id) ||
      (selectedApp.evaluationResult ?? evaluateAndStoreApplication(selectedApp))
    : undefined;

  // Kontenjan durumu
  const quotaStats = selectedApp
    ? getProgramQuotaStats(selectedApp.programId, selectedApp.termId || selectedApp.cohortName)
    : undefined;

  // Aday seçimi değiştiğinde form durumunu temizle ve o adaya göre hazırla
  const handleSelectCandidate = (candidate: Application) => {
    setSelectedAppId(candidate.id);
    setInternalNoteDraft(candidate.internalDecisionNote || '');
    setCandidateMessageDraft(candidate.candidateDecisionMessage || candidate.adminJustification || '');
    setDeviationReasonDraft(candidate.deviationReason || '');
    setFormError(null);
    setSuccessNotice(null);
  };

  // Karar butonuna tıklandığında (Onay modalını açar ve sapma kontrolü yapar)
  const handleInitiateDecision = (newStatus: ApplicationStatus) => {
    if (!selectedApp) return;

    if (!internalNoteDraft.trim()) {
      setFormError('Lütfen kurum içi değerlendirme notunu yazınız (Yalnızca yönetim masasında görünür).');
      return;
    }

    if (!candidateMessageDraft.trim()) {
      setFormError('Lütfen adaya iletilecek resmi sonuç açıklamasını yazınız (Aday panelinde görünür).');
      return;
    }

    // Tavsiyeden sapma kontrolü:
    // Eğer algoritma 'review_needed' veya 'prerequisite_review' demişse ve yönetici 'accepted' yapıyorsa;
    // ya da 'strong' demişse ve 'rejected' yapıyorsa sapma gerekçesi zorunludur!
    const rec = currentEvaluation?.recommendation;
    const isDeviating =
      (newStatus === 'accepted' && (rec === 'review_needed' || rec === 'prerequisite_review')) ||
      (newStatus === 'rejected' && rec === 'strong');

    if (isDeviating && !deviationReasonDraft.trim()) {
      setFormError(
        'Dikkat: Seçtiğiniz karar algoritma tavsiyesinden sapmaktadır. Lütfen sapma gerekçesini belirtiniz.'
      );
      return;
    }

    setPendingDecisionStatus(newStatus);
    setFormError(null);
    setConfirmModalOpen(true);
  };

  // Kararı onaylayıp kesinleştirme
  const handleConfirmDecision = () => {
    if (!selectedApp || !pendingDecisionStatus) return;

    const res = updateAdminDecision(
      selectedApp.id,
      pendingDecisionStatus,
      internalNoteDraft.trim(),
      candidateMessageDraft.trim(),
      'Selin Aydın (Yönetici)',
      deviationReasonDraft.trim() || undefined
    );

    if (res.success) {
      const updated = getAllApplications();
      setApplications(updated);
      setConfirmModalOpen(false);
      setPendingDecisionStatus(null);
      setFormError(null);

      const label =
        pendingDecisionStatus === 'accepted'
          ? 'Kabul Edildi (Asil Liste)'
          : pendingDecisionStatus === 'waitlisted' || pendingDecisionStatus === 'reserve'
          ? 'Yedek Listeye Alındı'
          : pendingDecisionStatus === 'under_review'
          ? 'Ek İncelemeye Gönderildi'
          : 'Reddedildi';

      setSuccessNotice(`Nihai karar kaydedildi: ${selectedApp.candidateName} — ${label}.`);
    } else {
      setFormError(res.error || 'Karar kaydedilemedi.');
    }
  };

  // Beyan doğrulama durumunu değiştirme
  const handleToggleVerification = (criterionId: string, currentStatus: boolean) => {
    if (!selectedApp) return;
    updateCriterionVerificationStatus(selectedApp.id, criterionId, !currentStatus);
    setApplications(getAllApplications());
  };

  // Filtreleme
  const filteredData = applications.filter((item) => {
    const matchSearch =
      item.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchProgram =
      programFilter === 'all' || item.programId === programFilter;

    const matchStatus =
      statusFilter === 'all' ||
      item.status === statusFilter ||
      (statusFilter === 'pending' &&
        ['submitted', 'under_review', 'pending', 'draft'].includes(item.status)) ||
      (statusFilter === 'reserve' && ['reserve', 'waitlisted'].includes(item.status));

    return matchSearch && matchProgram && matchStatus;
  });

  const getRecBadge = (rec?: RecommendationStatus) => {
    switch (rec) {
      case 'strong':
        return <StatusBadge label="Güçlü Aday" variant="success" size="sm" />;
      case 'suitable':
        return <StatusBadge label="Değerlendirmeye Uygun" variant="info" size="sm" />;
      case 'review_needed':
        return <StatusBadge label="Ek İnceleme Gerekli" variant="warning" size="sm" />;
      case 'prerequisite_review':
        return <StatusBadge label="Ön Koşul İncelemesi" variant="danger" size="sm" />;
      default:
        return <StatusBadge label="İnceleniyor" variant="neutral" size="sm" />;
    }
  };

  const columns: Column<Application>[] = [
    {
      key: 'referenceNumber',
      header: 'Referans No',
      render: (app) => (
        <span className="font-mono text-slate-500 font-semibold">{app.referenceNumber}</span>
      ),
    },
    {
      key: 'candidateName',
      header: 'Aday',
      render: (app) => (
        <div>
          <div className="font-bold text-slate-900">{app.candidateName}</div>
          <div className="text-[11px] text-slate-500">{app.occupation}</div>
        </div>
      ),
    },
    {
      key: 'programTitle',
      header: 'Program & Dönem',
      render: (app) => (
        <div className="max-w-[180px]">
          <div className="font-semibold text-slate-800 text-xs truncate" title={app.programTitle}>
            {app.programTitle}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {app.cohortName || '2026 Güz Dönemi'}
          </div>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Kriter Puanı & Tavsiye',
      render: (app) => {
        const evalRes = getEvaluationForApplication(app.id) || app.evaluationResult;
        if (!evalRes) {
          return (
            <span className="text-[11px] text-slate-400 font-medium">
              Henüz Değerlendirilmedi
            </span>
          );
        }
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-slate-900 tabular-nums">
                {evalRes.totalWeightedScore}
              </span>
              <span className="text-[10px] text-slate-400">/ 100</span>
              <span className="text-[10px] text-blue-700 font-mono font-semibold">
                ({evalRes.criteriaVersion})
              </span>
            </div>
            <div>{getRecBadge(evalRes.recommendation)}</div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Başvuru Durumu',
      render: (app) => {
        let variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral';
        let label: string = app.status;

        if (app.status === 'accepted') {
          variant = 'success';
          label = 'Kabul Edildi';
        } else if (app.status === 'reserve' || app.status === 'waitlisted') {
          variant = 'info';
          label = 'Yedek Listede';
        } else if (app.status === 'rejected') {
          variant = 'danger';
          label = 'Reddedildi';
        } else if (app.status === 'submitted') {
          variant = 'warning';
          label = 'Gönderildi';
        } else if (app.status === 'under_review') {
          variant = 'warning';
          label = 'İncelemede';
        }

        return <StatusBadge label={label} variant={variant} size="sm" />;
      },
    },
    {
      key: 'actions',
      header: 'İşlem',
      render: (app) => (
        <Button
          size="sm"
          variant={selectedAppId === app.id ? 'primary' : 'outline'}
          onClick={() => handleSelectCandidate(app)}
          className="text-xs"
        >
          {selectedAppId === app.id ? 'Seçili' : 'İncele'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Yönetim Masası</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Başvurular & Karar Masası</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-brand-textPrimary mt-0.5">
            Aday Başvuru İnceleme & Nihai Karar Masası
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sürümlü kriter puanlama motoru ile desteklenen, şeffaf ve gerekçelendirilmiş idari karar masası.
          </p>
        </div>

        {/* Clear Decision Support Principle Notice */}
        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-center gap-2 max-w-md">
          <ShieldAlert className="w-4 h-4 text-brand-blue shrink-0" />
          <span className="leading-tight text-[11px]">
            <strong>Altın Kural:</strong> Puanlama motoru yalnızca karar destektir. Hiçbir aday otomatik kabul veya ret edilmez; nihai karar idari yöneticiye aittir.
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-700 font-bold hover:underline"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Applications Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Aday Adı veya Ref No ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            {/* Select Filters */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                <option value="all">Tüm Programlar</option>
                {DEMO_PROGRAMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                <option value="pending">İnceleme Bekleyenler</option>
                <option value="accepted">Kabul Edilenler</option>
                <option value="reserve">Yedek Listedekiler</option>
                <option value="rejected">Reddedilenler</option>
                <option value="all">Tüm Durumlar</option>
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-xs">
            <DataTable
              columns={columns}
              data={filteredData}
              keyExtractor={(item) => item.id}
              emptyMessage="Arama kriterlerine uygun başvuru bulunamadı."
            />
          </div>
        </div>

        {/* Right Column: Detailed Candidate Evaluation Drawer (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedApp ? (
            <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-xs space-y-5">
              
              {/* Candidate Header & Score Summary */}
              <div className="border-b border-slate-200 pb-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-slate-400 font-semibold">
                    {selectedApp.referenceNumber}
                  </span>
                  <StatusBadge
                    label={
                      selectedApp.status === 'accepted'
                        ? 'Kabul Edildi'
                        : selectedApp.status === 'reserve' || selectedApp.status === 'waitlisted'
                        ? 'Yedek Listede'
                        : selectedApp.status === 'rejected'
                        ? 'Reddedildi'
                        : 'İnceleme Bekliyor'
                    }
                    variant={
                      selectedApp.status === 'accepted'
                        ? 'success'
                        : selectedApp.status === 'rejected'
                        ? 'danger'
                        : selectedApp.status === 'reserve' || selectedApp.status === 'waitlisted'
                        ? 'info'
                        : 'warning'
                    }
                  />
                </div>

                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    {selectedApp.candidateName}
                  </h2>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                    <span>{selectedApp.occupation}</span>
                    <span>•</span>
                    <span>{selectedApp.residenceDistrict || 'İslahiye Merkez'}</span>
                    <span>•</span>
                    <span>{selectedApp.educationLevel}</span>
                  </div>
                </div>

                {/* Algorithmic Score Card */}
                {currentEvaluation && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                          Ön Değerlendirme Puanı
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-brand-blue tabular-nums">
                            {currentEvaluation.totalWeightedScore}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">/ 100</span>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 block">
                          Kriter: {currentEvaluation.criteriaVersion}
                        </span>
                        {getRecBadge(currentEvaluation.recommendation)}
                      </div>
                    </div>

                    {/* Unverified Statement Notice */}
                    {currentEvaluation.hasUnverifiedStatements && (
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>
                          {currentEvaluation.unverifiedStatementsCount} adet doğrulanmamış beyan bulunmaktadır (Aşağıdan onaylanabilir).
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Program Quota Monitor */}
              {quotaStats && (
                <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  quotaStats.isQuotaFull
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>Kontenjan Durumu ({quotaStats.cohortName})</span>
                    <span className="tabular-nums">
                      Kabul: {quotaStats.acceptedCount} / {quotaStats.quota} Kişi
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        quotaStats.isQuotaFull ? 'bg-rose-600' : 'bg-brand-blue'
                      }`}
                      style={{
                        width: `${Math.min(100, (quotaStats.acceptedCount / quotaStats.quota) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>Yedek: {quotaStats.waitlistedCount}</span>
                    <span>İnceleme Bekleyen: {quotaStats.pendingCount}</span>
                  </div>

                  {quotaStats.isQuotaFull && (
                    <div className="text-[11px] font-bold text-rose-700 flex items-center gap-1 pt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Kontenjan Dolu! Bu adayın kabulü kontenjan aşımına sebep olacaktır.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Criteria Score Breakdown Accordion / List */}
              {currentEvaluation && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">
                      Kriter Bazlı Puan Dökümü ({currentEvaluation.criteriaVersion})
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Detaylı İnceleme
                    </span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                    {currentEvaluation.scoreBreakdown.map((item) => (
                      <div
                        key={item.criterionId}
                        className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="font-mono text-[10px] text-brand-blue font-bold">
                              {item.criterionCode}
                            </span>
                            <div className="font-semibold text-slate-900 text-xs">
                              {item.criterionTitle}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-extrabold text-slate-900 tabular-nums">
                              {item.earnedWeightedScore}p
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium block">
                              Ağırlık: %{item.weight}
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80">
                          <strong>Aday Beyanı:</strong> {item.candidateAnswerText || '—'}
                          <div className="text-[10px] text-slate-400 mt-0.5 italic">
                            {item.explanation}
                          </div>
                        </div>

                        {/* Statement verification toggle for admin */}
                        {item.requiresVerification && (
                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <span className="text-amber-800 font-medium flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                              Resmi Evrak Kontrolü
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleVerification(item.criterionId, !!item.isVerified)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                                item.isVerified
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              {item.isVerified ? '✓ Doğrulandı' : 'Doğrula'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Error Notice */}
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* FINAL ADMINISTRATIVE DECISION SECTION */}
              <div className="pt-3 border-t border-slate-200 space-y-4">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Nihai Yönetici Kararı & Gerekçeleri</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Kurum içi not adaya iletilmez; aday paneline yalnızca sonuç açıklaması yansır.
                  </p>
                </div>

                {/* Field 1: Kurum İçi Değerlendirme Notu (Admin only) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-800 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Kurum İçi Değerlendirme Notu:</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Yalnızca İdari Masada Görünür</span>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Örn: Adayın tarımsal deneyimi ve ÇKS beyanı incelendi; komisyonca uygun görüldü."
                    value={internalNoteDraft}
                    onChange={(e) => setInternalNoteDraft(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
                  />
                </div>

                {/* Field 2: Adaya Gösterilecek Resmi Sonuç Açıklaması */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-800 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-brand-blue" />
                      <span>Adaya Gösterilecek Sonuç Açıklaması:</span>
                    </label>
                    <span className="text-[10px] text-blue-700 font-semibold">Aday Panelinde Görüntülenir</span>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Örn: Başvurunuz 2026 Güz Dönemi Tarımsal E-Ticaret programı için asil listeden kabul edilmiştir."
                    value={candidateMessageDraft}
                    onChange={(e) => setCandidateMessageDraft(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
                  />
                </div>

                {/* Field 3: Algoritma Tavsiyesinden Sapma Varsa Sapma Gerekçesi */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-800">
                      Algoritma Tavsiyesinden Sapma Gerekçesi (Varsa):
                    </label>
                    <span className="text-[10px] text-slate-400">Tavsiyeden farklı kararda zorunlu</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Örn: Puan eşik altında kalmış olsa da kadın üretici kota önceliği sebebiyle kabul edildi."
                    value={deviationReasonDraft}
                    onChange={(e) => setDeviationReasonDraft(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-slate-50/50 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                {/* Decision Buttons */}
                <div className="pt-2 grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleInitiateDecision('accepted')}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    Kabul Et (Asil Liste)
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleInitiateDecision('waitlisted')}
                    className="w-full"
                  >
                    Yedek Listeye Al
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleInitiateDecision('under_review')}
                    className="w-full text-amber-800 border-amber-300 hover:bg-amber-50"
                  >
                    Ek İncelemeye Gönder
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleInitiateDecision('rejected')}
                    className="w-full"
                  >
                    Reddet
                  </Button>
                </div>
              </div>

              {/* Decision Audit History (Past decisions preserved) */}
              {selectedApp.decisionHistory && selectedApp.decisionHistory.length > 0 && (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>Karar Değişiklik Tarihçesi ({selectedApp.decisionHistory.length})</span>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto text-[11px]">
                    {selectedApp.decisionHistory.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            {item.status === 'accepted' ? 'Kabul Edildi' : item.status === 'rejected' ? 'Reddedildi' : item.status}
                          </span>
                          <span className="text-slate-400 text-[10px]">{item.decidedAt}</span>
                        </div>
                        <div className="text-slate-600">
                          <strong>Aday Mesajı:</strong> "{item.candidateDecisionMessage}"
                        </div>
                        {item.deviationReason && (
                          <div className="text-amber-800 text-[10px]">
                            <strong>Sapma:</strong> {item.deviationReason}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 pt-0.5 border-t border-slate-200">
                          Yetkili: {item.decidedBy}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              İncelemek için sol tablodan bir aday seçiniz.
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION MODAL BEFORE APPLYING DECISION */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Nihai Yönetici Kararını Onaylayınız"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900 text-sm">
              Aday: {selectedApp?.candidateName} ({selectedApp?.referenceNumber})
            </div>
            <div className="text-slate-600">
              <strong>Uygulanacak Karar:</strong>{' '}
              <span className="font-bold text-brand-blue uppercase">
                {pendingDecisionStatus === 'accepted'
                  ? 'Kabul Edildi (Asil Liste)'
                  : pendingDecisionStatus === 'waitlisted'
                  ? 'Yedek Listeye Alındı'
                  : pendingDecisionStatus === 'under_review'
                  ? 'Ek İncelemeye Gönderildi'
                  : 'Reddedildi'}
              </span>
            </div>
            {quotaStats?.isQuotaFull && pendingDecisionStatus === 'accepted' && (
              <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold">
                ⚠️ Uyarı: Kontenjan doludur ({quotaStats.acceptedCount}/{quotaStats.quota}). Bu işlem kontenjan aşımına sebep olacaktır.
              </div>
            )}
            <div className="text-slate-600 pt-1 border-t border-slate-200">
              <strong>Adaya İletilecek Mesaj:</strong>
              <p className="italic text-slate-700 mt-0.5">"{candidateMessageDraft}"</p>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 leading-relaxed">
            Bu karar zaman damgası ve yönetici kimliğiniz ile denetim geçmişine kaydedilecek ve adayın takip ekranına anında yansıtılacaktır.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmModalOpen(false)}
            >
              Vazgeç
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleConfirmDecision}
            >
              Kararı Onayla ve Uygula
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
