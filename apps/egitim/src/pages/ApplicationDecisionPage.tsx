import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  AlertCircle,
  AlertTriangle,
  History,
  Lock,
  Eye,
  X,
  Users,
  Clock,
  UserCheck,
} from 'lucide-react';
import { Application, ApplicationStatus, RecommendationStatus, Program } from '../types';
import { fetchLivePrograms, getInitialPrograms } from '../services/programAdapter';
import { DataTable, Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { KpiStrip } from '../components/ui/KpiStrip';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Toast } from '../components/ui/Toast';
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
  getActiveCriteriaSetForProgram,
} from '../services/evaluationStorage';
import { evaluateApplication } from '../services/criteriaEngine';

export const ApplicationDecisionPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>(() => getAllApplications());
  const [programs, setPrograms] = useState<Program[]>(() => getInitialPrograms());
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchLivePrograms().then((list) => {
      if (list && list.length > 0) setPrograms(list);
    });
  }, []);

  // Sync applications
  useEffect(() => {
    const unsubApps = subscribeToApplicationUpdates((updated) => {
      setApplications(updated);
    });
    return () => {
      unsubApps();
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

  // Set default selected if not set
  useEffect(() => {
    if (!selectedAppId && applications.length > 0) {
      handleSelectCandidate(applications[0]);
    }
  }, [selectedAppId, applications.length]);

  // Seçili adayın değerlendirme kaydı (yan etki yaratmadan güvenli hesaplama)
  const currentEvaluation = useMemo(() => {
    if (!selectedApp) return undefined;
    const stored = getEvaluationForApplication(selectedApp.id);
    if (stored && stored.totalWeightedScore > 0) return stored;
    if (selectedApp.evaluationResult && selectedApp.evaluationResult.totalWeightedScore > 0) return selectedApp.evaluationResult;
    try {
      const activeCriteria = getActiveCriteriaSetForProgram(selectedApp.programId);
      if (activeCriteria) {
        return evaluateApplication(selectedApp, activeCriteria);
      }
    } catch (e) {
      console.warn('Evaluation calculation fallback:', e);
    }
    return stored || selectedApp.evaluationResult;
  }, [selectedApp]);

  // Arka planda değerlendirme kaydını depoya senkronize et (Render dışı güvenli çağrı)
  useEffect(() => {
    if (selectedApp) {
      const existing = getEvaluationForApplication(selectedApp.id);
      if (!existing || existing.totalWeightedScore === 0) {
        try {
          evaluateAndStoreApplication(selectedApp);
        } catch (e) {
          // Sessiz hata yakalama
        }
      }
    }
  }, [selectedApp?.id]);

  // Kontenjan durumu
  const quotaStats = selectedApp
    ? getProgramQuotaStats(selectedApp.programId, selectedApp.termId || selectedApp.cohortName)
    : undefined;

  // Top Macro Stats for Telemetry
  const macroStats = useMemo(() => {
    const total = applications.length;
    const accepted = applications.filter((a) => a.status === 'accepted').length;
    const waitlisted = applications.filter((a) => a.status === 'reserve' || a.status === 'waitlisted').length;
    const pending = applications.filter((a) => ['pending', 'under_review', 'submitted', 'draft'].includes(a.status)).length;
    const rejected = applications.filter((a) => a.status === 'rejected').length;
    return { total, accepted, waitlisted, pending, rejected };
  }, [applications]);

  // Aday seçimi değiştiğinde form durumunu temizle ve o adaya göre hazırla
  const handleSelectCandidate = (candidate: Application) => {
    setSelectedAppId(candidate.id);
    setInternalNoteDraft(candidate.internalDecisionNote || '');
    setCandidateMessageDraft(candidate.candidateDecisionMessage || candidate.adminJustification || '');
    setDeviationReasonDraft(candidate.deviationReason || '');
    setFormError(null);
    setSuccessNotice(null);
  };

  // Hızlı Şablon Uygulayıcılar
  const applyQuickTemplate = (templateType: 'accept' | 'waitlist' | 'reject') => {
    if (!selectedApp) return;
    if (templateType === 'accept') {
      setInternalNoteDraft('Adayın kriter puanı ve başvuru beyanları incelendi; asil kayıt hakkı verildi.');
      setCandidateMessageDraft(
        `Tebrikler Sayın ${selectedApp.candidateName}, ${selectedApp.programTitle} eğitim programına asil listeden kabul edildiniz. Kesin kayıt evraklarınız için SMS/E-posta bilgilendirmesini takip ediniz.`
      );
    } else if (templateType === 'waitlist') {
      setInternalNoteDraft('Aday yeterli puana sahip ancak sınıf kontenjan sınırına ulaşıldığından yedek listeye alındı.');
      setCandidateMessageDraft(
        `Sayın ${selectedApp.candidateName}, ${selectedApp.programTitle} başvurunuz yedek listeye alınmıştır. Asil listeden feragat olması durumunda sıranıza göre aranacaksınız.`
      );
    } else {
      setInternalNoteDraft('Adayın ön koşul veya kriter puanı program kabul barajının altında kaldı.');
      setCandidateMessageDraft(
        `Sayın ${selectedApp.candidateName}, ${selectedApp.programTitle} eğitimimize gösterdiğiniz ilgi için teşekkür ederiz. Kontenjan ve puan sınırları sebebiyle başvurunuz bu dönem için olumlu sonuçlanamamıştır.`
      );
    }
  };

  // Karar butonuna tıklandığında (Onay modalını açar ve sapma kontrolü yapar)
  const handleInitiateDecision = (newStatus: ApplicationStatus) => {
    if (!selectedApp) return;

    if (!internalNoteDraft.trim()) {
      setFormError('Lütfen kurum içi değerlendirme notunu yazınız (Yalnızca yönetim masasında görünür).');
      return;
    }
    if (!candidateMessageDraft.trim()) {
      setFormError('Lütfen adaya gösterilecek resmi karar açıklamasını yazınız.');
      return;
    }

    // Algoritma sapma kontrolü
    if (currentEvaluation) {
      const isAlgoAccept = currentEvaluation.recommendation === 'strong';
      const isAlgoReject =
        currentEvaluation.recommendation === 'review_needed' ||
        currentEvaluation.recommendation === 'prerequisite_review';

      const isDeviating =
        (newStatus === 'accepted' && isAlgoReject) ||
        (newStatus === 'rejected' && isAlgoAccept);

      if (isDeviating && !deviationReasonDraft.trim()) {
        setFormError(
          'Algoritma ön değerlendirme tavsiyesinden farklı bir karar veriyorsunuz. Lütfen sapma gerekçenizi belirtiniz.'
        );
        return;
      }
    }

    setFormError(null);
    setPendingDecisionStatus(newStatus);
    setConfirmModalOpen(true);
  };

  // Nihai Kararı Uygula
  const handleConfirmDecision = () => {
    if (!selectedApp || !pendingDecisionStatus) return;

    const result = updateAdminDecision(
      selectedApp.id,
      pendingDecisionStatus,
      internalNoteDraft.trim(),
      candidateMessageDraft.trim(),
      'Yönetici (Admin)',
      deviationReasonDraft.trim() || undefined
    );

    if (result.success) {
      setSuccessNotice(`Başvuru kararı "${pendingDecisionStatus}" olarak güncellendi ve kütüğe işlendi.`);
      setConfirmModalOpen(false);
      setApplications(getAllApplications());
    } else {
      setFormError(result.error || 'Karar kaydedilemedi.');
      setConfirmModalOpen(false);
    }
  };

  // Beyan Doğrulama Toggle
  const handleToggleVerification = (criterionId: string, currentStatus: boolean) => {
    if (!selectedApp) return;
    const res = updateCriterionVerificationStatus(
      selectedApp.id,
      criterionId,
      !currentStatus
    );
    if (res.success) {
      setApplications(getAllApplications());
    }
  };

  // Filtreleme mantığı
  const filteredData = applications.filter((item) => {
    const matchSearch =
      searchQuery === '' ||
      item.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.email && item.email.toLowerCase().includes(searchQuery.toLowerCase()));

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
        <span className="font-mono text-slate-600 font-semibold text-xs">{app.referenceNumber}</span>
      ),
    },
    {
      key: 'candidateName',
      header: 'Aday Adı & Meslek',
      render: (app) => (
        <div>
          <div className="font-bold text-slate-900 text-xs">{app.candidateName}</div>
          <div className="text-[11px] text-slate-500">{app.occupation}</div>
        </div>
      ),
    },
    {
      key: 'programTitle',
      header: 'Program & Dönem',
      render: (app) => (
        <div className="max-w-[170px]">
          <div className="font-semibold text-slate-800 text-xs truncate" title={app.programTitle}>
            {app.programTitle}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {app.cohortName || '2026 Güz Dönemi'}
          </div>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Kriter Puanı & Tavsiye',
      render: (app) => {
        let evalRes = getEvaluationForApplication(app.id) || app.evaluationResult;
        if (!evalRes || evalRes.totalWeightedScore === 0) {
          try {
            const activeCriteria = getActiveCriteriaSetForProgram(app.programId);
            if (activeCriteria) {
              evalRes = evaluateApplication(app, activeCriteria);
            }
          } catch {}
        }
        if (!evalRes) {
          return (
            <span className="text-[11px] text-slate-400 font-medium">
              Hesaplanıyor...
            </span>
          );
        }
        const score = evalRes.totalWeightedScore;
        const scoreColor =
          score >= 70
            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
            : score >= 50
            ? 'text-amber-700 bg-amber-50 border-amber-200'
            : 'text-rose-700 bg-rose-50 border-rose-200';

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded-md text-xs font-black border tabular-nums ${scoreColor}`}>
                {score} / 100
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {evalRes.criteriaVersion}
              </span>
            </div>
            <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full ${score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(100, score)}%` }}
              />
            </div>
            <div>{getRecBadge(evalRes.recommendation)}</div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Durum',
      render: (app) => {
        const isSelected = selectedApp?.id === app.id;
        return (
          <div className="flex items-center justify-between gap-2">
            <StatusBadge
              label={
                app.status === 'accepted'
                  ? 'Kabul Edildi'
                  : app.status === 'reserve' || app.status === 'waitlisted'
                  ? 'Yedek Listede'
                  : app.status === 'rejected'
                  ? 'Reddedildi'
                  : 'İnceleme Bekliyor'
              }
              variant={
                app.status === 'accepted'
                  ? 'success'
                  : app.status === 'rejected'
                  ? 'danger'
                  : app.status === 'reserve' || app.status === 'waitlisted'
                  ? 'info'
                  : 'warning'
              }
              size="sm"
            />
            {isSelected && (
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" title="Aktif İncelenen Aday" />
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (app) => (
        <button
          type="button"
          onClick={() => handleSelectCandidate(app)}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
            selectedApp?.id === app.id
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          {selectedApp?.id === app.id ? 'Seçili' : 'İncele'}
        </button>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-16">
      {/* 1. Üst Başlık & Yönetim Kuralı Hatırlatması */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Aday Başvuru İnceleme & Nihai Karar Masası
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Sürümlü kriter puanlama motoru ile desteklenen, şeffaf, gerekçeli ve tam denetlenebilir idari karar masası.
          </p>
        </div>
      </div>

      {/* Karar Kokpiti Standart Metrik Bandı */}
      <KpiStrip
        items={[
          {
            label: 'Toplam Başvuru',
            value: `${macroStats.total} Aday`,
            icon: <Users className="w-4 h-4" />,
            subtext: 'Dönem başvuru havuzu',
          },
          {
            label: 'Asil Kabul',
            value: `${macroStats.accepted} Aday`,
            icon: <UserCheck className="w-4 h-4" />,
            subtext: 'Kesin kayıt aşamasında',
          },
          {
            label: 'Yedek Liste',
            value: `${macroStats.waitlisted} Aday`,
            icon: <Clock className="w-4 h-4" />,
            subtext: 'Sıralı beklemede',
          },
          {
            label: 'İnceleme Bekleyen',
            value: `${macroStats.pending} Aday`,
            icon: <AlertTriangle className="w-4 h-4" />,
            subtext: 'Karar verilmeyi bekliyor',
            badge: macroStats.pending > 0 ? (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                İnceleme
              </span>
            ) : undefined,
          },
        ]}
      />

      {/* Başarı Bildirimi */}
      <Toast message={successNotice} onClose={() => setSuccessNotice(null)} />

      {/* 2.5. FİLTRE VE ARAMA ÇUBUĞU (TAM GENİŞLİK) */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex items-center min-w-[240px] max-w-xs w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Aday adı, ref no veya TC ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-3 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white w-full text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tüm Programlar</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="pending">İnceleme Bekleyenler</option>
            <option value="accepted">Kabul Edilenler</option>
            <option value="reserve">Yedek Listedekiler</option>
            <option value="rejected">Reddedilenler</option>
            <option value="all">Tüm Durumlar</option>
          </select>

          {(searchQuery || programFilter !== 'all' || statusFilter !== 'pending') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setProgramFilter('all');
                setStatusFilter('pending');
              }}
              className="h-9 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1 cursor-pointer"
              title="Filtreleri Temizle"
            >
              <X className="w-3.5 h-3.5" />
              <span>Temizle</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. İKİ SÜTUNLU ANA ÇALIŞMA ALANI: Tablo (7 Kolon) + Detay Konsolu (5 Kolon) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Sol Sütun: Aday Başvuruları Tablosu (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Veri Tablosu */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <DataTable
              columns={columns}
              data={filteredData}
              keyExtractor={(item) => item.id}
              selectedId={selectedApp?.id}
              onRowClick={(item) => handleSelectCandidate(item)}
              emptyMessage="Arama kriterlerine uygun başvuru bulunamadı."
            />
          </div>
        </div>

        {/* Sağ Sütun: Aday Değerlendirme & Karar Konsolu (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedApp ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
              
              {/* Aday Üst Bilgisi */}
              <div className="border-b border-slate-200 pb-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                    Ref: {selectedApp.referenceNumber}
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
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {selectedApp.candidateName}
                  </h2>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                    <span>{selectedApp.occupation}</span>
                    <span>•</span>
                    <span>{selectedApp.residenceDistrict || 'İslahiye'}</span>
                    <span>•</span>
                    <span>{selectedApp.educationLevel}</span>
                  </div>
                </div>

                {/* STRIPE RADAR STANDARDI: Kriter Ağırlık Dağılım Çubukları */}
                {currentEvaluation && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mt-2 space-y-3.5">
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Ön Değerlendirme Puanı
                        </span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className={`text-3xl font-black tabular-nums ${
                            currentEvaluation.totalWeightedScore >= 70
                              ? 'text-emerald-700'
                              : currentEvaluation.totalWeightedScore >= 50
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}>
                            {currentEvaluation.totalWeightedScore}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">/ 100</span>
                          <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            currentEvaluation.totalWeightedScore >= 70
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {currentEvaluation.totalWeightedScore >= 70 ? 'Baraj Üstü (≥70)' : 'Baraj Altı (<70)'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="text-[10px] font-mono text-slate-400 block">
                          Sürüm: {currentEvaluation.criteriaVersion}
                        </span>
                        {getRecBadge(currentEvaluation.recommendation)}
                      </div>
                    </div>

                    {/* Ana İlerleme Çubuğu */}
                    <div className="space-y-1">
                      <div className="relative w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all ${
                            currentEvaluation.totalWeightedScore >= 70
                              ? 'bg-emerald-600'
                              : currentEvaluation.totalWeightedScore >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, currentEvaluation.totalWeightedScore)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                        <span>0p</span>
                        <span className="text-slate-700 font-bold">Asgari Kabul Eşiği: 70p</span>
                        <span>100p</span>
                      </div>
                    </div>

                    {/* Çoklu Kriter Ağırlık Kırılım Radarı (Stripe Radar Tarzı) */}
                    <div className="pt-2 border-t border-slate-200/80 space-y-2">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        Ağırlıklı Kriter Dağılım Radarı:
                      </span>
                      <div className="space-y-1.5 text-[11px]">
                        {currentEvaluation.scoreBreakdown.map((item) => (
                          <div key={item.criterionId} className="space-y-0.5">
                            <div className="flex items-center justify-between text-slate-600">
                              <span className="truncate max-w-[190px]" title={item.criterionTitle}>
                                {item.criterionTitle}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <strong className="text-slate-900 tabular-nums">
                                  {item.earnedWeightedScore}p <span className="text-[10px] text-slate-400 font-normal">/ %{item.weight}</span>
                                </strong>
                                {item.requiresVerification && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleVerification(item.criterionId, !!item.isVerified)}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition cursor-pointer ${
                                      item.isVerified
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                                    }`}
                                    title="Resmî Evrak Kontrolü"
                                  >
                                    {item.isVerified ? '✓ Doğrulandı' : 'Evrakı Doğrula'}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${Math.min(100, (item.earnedWeightedScore / item.weight) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Doğrulanmamış Beyan Uyarısı */}
                    {currentEvaluation.hasUnverifiedStatements && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>
                          {currentEvaluation.unverifiedStatementsCount} adet doğrulanmamış beyan bulunmaktadır (Aşağıdan evrak kontrolü yapınız).
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Kontenjan İbresi */}
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
                        quotaStats.isQuotaFull ? 'bg-rose-600' : 'bg-blue-600'
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

              {/* Hata Uyarısı */}
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormError(null)}
                    className="p-1 rounded-md text-rose-400 hover:text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                    aria-label="Kapat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* NİHAİ YÖNETİCİ KARAR ALANI & HIZLI ŞABLONLAR */}
              <div className="pt-2 border-t border-slate-200 space-y-4">
                
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Nihai Yönetici Kararı & Gerekçeleri
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">İdari Yetki</span>
                </div>

                {/* Hızlı Şablon Butonları */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 block">Hızlı Karar Şablonu Seç:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyQuickTemplate('accept')}
                      className="px-2 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold transition cursor-pointer"
                    >
                      Asil Kabul
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickTemplate('waitlist')}
                      className="px-2 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-semibold transition cursor-pointer"
                    >
                      Yedek Liste
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickTemplate('reject')}
                      className="px-2 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-[11px] font-semibold transition cursor-pointer"
                    >
                      Kabul Edilmedi
                    </button>
                  </div>
                </div>

                {/* Alan 1: Kurum İçi Değerlendirme Notu */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-800 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Kurum İçi Değerlendirme Notu:</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Gizli / Yalnızca Yönetim Görür</span>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Örn: Adayın tarımsal deneyimi ve ÇKS beyanı incelendi; komisyonca uygun görüldü."
                    value={internalNoteDraft}
                    onChange={(e) => setInternalNoteDraft(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  />
                </div>

                {/* Alan 2: Adaya Gösterilecek Resmi Sonuç Açıklaması */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-800 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-blue-600" />
                      <span>Adaya Gösterilecek Sonuç Açıklaması:</span>
                    </label>
                    <span className="text-[10px] text-blue-700 font-semibold">Aday Portalı Bildirimi</span>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Örn: Başvurunuz 2026 Güz Dönemi programı için asil listeden kabul edilmiştir."
                    value={candidateMessageDraft}
                    onChange={(e) => setCandidateMessageDraft(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50/50 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  />
                </div>

                {/* Alan 3: Sapma Gerekçesi (Gerektiğinde) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-800">
                      Algoritma Tavsiyesinden Sapma Gerekçesi:
                    </label>
                    <span className="text-[10px] text-slate-400">Farklı kararda zorunlu</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Örn: Puan eşik altında kalsa da kadın üretici kota önceliği sebebiyle kabul edildi."
                    value={deviationReasonDraft}
                    onChange={(e) => setDeviationReasonDraft(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-slate-50/50 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Karar Butonları */}
                <div className="pt-2 grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleInitiateDecision('accepted')}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                  >
                    Kabul Et (Asil Liste)
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleInitiateDecision('waitlisted')}
                    className="w-full font-bold"
                  >
                    Yedek Listeye Al
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleInitiateDecision('under_review')}
                    className="w-full text-amber-800 border-amber-300 hover:bg-amber-50 font-bold"
                  >
                    Ek İnceleme
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleInitiateDecision('rejected')}
                    className="w-full font-bold"
                  >
                    Reddet
                  </Button>
                </div>
              </div>

              {/* Karar Tarihçesi */}
              {selectedApp.decisionHistory && selectedApp.decisionHistory.length > 0 && (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>Karar Değişiklik Tarihçesi ({selectedApp.decisionHistory.length})</span>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto text-[11px]">
                    {selectedApp.decisionHistory.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
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

      {/* Karar Onay Modalı */}
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
              <span className="font-bold text-blue-700 uppercase">
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

export default ApplicationDecisionPage;
