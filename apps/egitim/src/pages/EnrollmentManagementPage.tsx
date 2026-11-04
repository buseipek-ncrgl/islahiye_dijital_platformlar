import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  RotateCcw,
  Check,
  LayoutGrid,
  List,
  Layers,
  GraduationCap,
  Clock,
} from 'lucide-react';
import { fetchLivePrograms, getInitialPrograms } from '../services/programAdapter';
import { Program } from '../types';
import {
  Enrollment,
  Group,
  GroupAssignment,
} from '../types';
import {
  getStoredEnrollments,
  getStoredGroups,
  getStoredAssignments,
  confirmEnrollment,
  cancelEnrollment,
  assignTraineeToGroup,
  batchConfirmEnrollments,
  batchAssignTraineesToGroup,
  batchCancelEnrollments,
  subscribeToEnrollmentUpdates,
  subscribeToGroupUpdates,
  resetEnrollmentsToDefaults,
} from '../services/enrollmentStorage';
import { getStoredApplications } from '../services/applicationStorage';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { KpiStrip } from '../components/ui/KpiStrip';
import { ActionConfirmModal } from '../components/common/ActionConfirmModal';

export const EnrollmentManagementPage: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>(() => getInitialPrograms());
  const [enrollments, setEnrollments] = useState<Enrollment[]>(() =>
    getStoredEnrollments()
  );
  const [groups, setGroups] = useState<Group[]>(() => getStoredGroups());
  const [assignments, setAssignments] = useState<GroupAssignment[]>(() =>
    getStoredAssignments()
  );

  const [selectedProgramId, setSelectedProgramId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState<string[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    fetchLivePrograms().then((progs) => {
      if (progs && progs.length > 0) setPrograms(progs);
    });
  }, []);

  // Sync state
  useEffect(() => {
    const unsubEnr = subscribeToEnrollmentUpdates((updated) => {
      setEnrollments(updated);
    });
    const unsubGrp = subscribeToGroupUpdates(() => {
      setGroups(getStoredGroups());
      setAssignments(getStoredAssignments());
    });
    return () => {
      unsubEnr();
      unsubGrp();
    };
  }, []);

  // Notifications
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Single Action Modal States
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [detailModalEnrollment, setDetailModalEnrollment] = useState<Enrollment | null>(null);

  // Bulk Action Modals
  const [bulkAssignModalOpen, setBulkAssignModalOpen] = useState(false);
  const [bulkCancelModalOpen, setBulkCancelModalOpen] = useState(false);
  const [bulkTargetGroupId, setBulkTargetGroupId] = useState<string>('');
  const [bulkCancelReason, setBulkCancelReason] = useState<string>('');

  const [activeEnrollment, setActiveEnrollment] = useState<Enrollment | null>(null);
  const [selectedTargetGroupId, setSelectedTargetGroupId] = useState<string>('');
  const [confirmNotes, setConfirmNotes] = useState<string>('');
  const [cancelReason, setCancelReason] = useState<string>('');

  // Helper: Find active assignment for enrollment
  const getAssignmentForEnrollment = (enrollmentId: string) => {
    return assignments.find((a) => a.enrollmentId === enrollmentId && a.status === 'active');
  };

  // Helper: Find score from application
  const getScoreForApplication = (applicationId: string) => {
    const apps = getStoredApplications();
    const app = apps.find((a) => a.id === applicationId);
    return app?.evaluationResult?.totalWeightedScore ?? app?.autoScore?.total ?? '—';
  };

  // Telemetry KPI Stats
  const macroStats = useMemo(() => {
    const total = enrollments.length;
    const pending = enrollments.filter((e) => e.status === 'pending_confirmation').length;
    const confirmedAll = enrollments.filter((e) => e.status === 'confirmed');
    const assigned = confirmedAll.filter((e) => getAssignmentForEnrollment(e.id)).length;
    const pendingGroup = confirmedAll.filter((e) => !getAssignmentForEnrollment(e.id)).length;
    const cancelled = enrollments.filter((e) => e.status === 'cancelled').length;

    return { total, pending, assigned, pendingGroup, cancelled };
  }, [enrollments, assignments]);

  // Filter Data
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((item) => {
      const matchSearch =
        item.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.applicationId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchProgram =
        selectedProgramId === 'all' || item.programId === selectedProgramId;

      const assignment = getAssignmentForEnrollment(item.id);

      let matchStatus = true;
      if (statusFilter === 'pending_confirmation') {
        matchStatus = item.status === 'pending_confirmation';
      } else if (statusFilter === 'confirmed_pending_group') {
        matchStatus = item.status === 'confirmed' && !assignment;
      } else if (statusFilter === 'assigned') {
        matchStatus = item.status === 'confirmed' && !!assignment;
      } else if (statusFilter === 'cancelled') {
        matchStatus = item.status === 'cancelled';
      }

      return matchSearch && matchProgram && matchStatus;
    });
  }, [enrollments, searchQuery, selectedProgramId, statusFilter, assignments]);

  // Multi-select handlers
  const handleToggleSelectAll = () => {
    if (selectedEnrollmentIds.length === filteredEnrollments.length) {
      setSelectedEnrollmentIds([]);
    } else {
      setSelectedEnrollmentIds(filteredEnrollments.map((e) => e.id));
    }
  };

  const handleToggleSingleSelect = (id: string) => {
    setSelectedEnrollmentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Actions
  const handleOpenConfirmModal = (enr: Enrollment) => {
    setActiveEnrollment(enr);
    setConfirmNotes('Ön kayıt ve resmi kimlik doğrulaması kontrol edilmiştir.');
    setErrorMessage(null);
    setConfirmModalOpen(true);
  };

  const handleExecuteConfirm = () => {
    if (!activeEnrollment) return;
    const res = confirmEnrollment(
      activeEnrollment.id,
      'Selin Aydın (Yönetici)',
      confirmNotes.trim()
    );
    if (res.success) {
      setSuccessNotice(`Kesin kayıt onaylandı: ${activeEnrollment.candidateName}`);
      setConfirmModalOpen(false);
      setEnrollments(getStoredEnrollments());
      setTimeout(() => setSuccessNotice(null), 4000);
    } else {
      setErrorMessage(res.error || 'Onaylama işlemi başarısız.');
    }
  };

  const handleOpenAssignModal = (enr: Enrollment) => {
    setActiveEnrollment(enr);
    const availableGroups = groups.filter((g) => g.programId === enr.programId);
    setSelectedTargetGroupId(availableGroups[0]?.id || '');
    setErrorMessage(null);
    setAssignModalOpen(true);
  };

  const handleExecuteAssign = () => {
    if (!activeEnrollment || !selectedTargetGroupId) return;
    const res = assignTraineeToGroup(
      activeEnrollment.id,
      selectedTargetGroupId,
      'Selin Aydın (Yönetici)'
    );
    if (res.success) {
      setSuccessNotice(
        `Kursiyer başarıyla gruba yerleştirildi: ${activeEnrollment.candidateName}`
      );
      setAssignModalOpen(false);
      setAssignments(getStoredAssignments());
      setTimeout(() => setSuccessNotice(null), 4000);
    } else {
      setErrorMessage(res.error || 'Gruba atama başarısız.');
    }
  };

  const handleOpenCancelModal = (enr: Enrollment) => {
    setActiveEnrollment(enr);
    setCancelReason('');
    setErrorMessage(null);
    setCancelModalOpen(true);
  };

  const handleExecuteCancel = () => {
    if (!activeEnrollment || !cancelReason.trim()) {
      setErrorMessage('Lütfen iptal gerekçesini belirtiniz.');
      return;
    }
    const res = cancelEnrollment(
      activeEnrollment.id,
      cancelReason.trim(),
      'Selin Aydın (Yönetici)'
    );
    if (res.success) {
      setSuccessNotice(`Kayıt iptal edildi: ${activeEnrollment.candidateName}`);
      setCancelModalOpen(false);
      setEnrollments(getStoredEnrollments());
      setAssignments(getStoredAssignments());
      setTimeout(() => setSuccessNotice(null), 4000);
    } else {
      setErrorMessage(res.error || 'İptal işlemi başarısız.');
    }
  };

  // Bulk Handlers
  const handleBulkConfirm = () => {
    if (selectedEnrollmentIds.length === 0) return;
    const res = batchConfirmEnrollments(
      selectedEnrollmentIds,
      'Selin Aydın (Yönetici)',
      'Toplu kesin kayıt onay işlemi gerçekleştirildi.'
    );
    setSuccessNotice(`${res.successCount} adayın kesin kaydı başarıyla onaylandı.`);
    setSelectedEnrollmentIds([]);
    setEnrollments(getStoredEnrollments());
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const handleBulkAssignExecute = () => {
    if (selectedEnrollmentIds.length === 0 || !bulkTargetGroupId) return;
    const res = batchAssignTraineesToGroup(
      selectedEnrollmentIds,
      bulkTargetGroupId,
      'Selin Aydın (Yönetici)'
    );
    setSuccessNotice(`${res.successCount} kursiyer seçilen gruba başarıyla yerleştirildi.`);
    setBulkAssignModalOpen(false);
    setSelectedEnrollmentIds([]);
    setAssignments(getStoredAssignments());
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const handleBulkCancelExecute = () => {
    if (selectedEnrollmentIds.length === 0 || !bulkCancelReason.trim()) {
      setErrorMessage('Lütfen toplu iptal gerekçesini belirtiniz.');
      return;
    }
    const res = batchCancelEnrollments(
      selectedEnrollmentIds,
      bulkCancelReason.trim(),
      'Selin Aydın (Yönetici)'
    );
    setSuccessNotice(`${res.successCount} kayıt iptal edildi.`);
    setBulkCancelModalOpen(false);
    setSelectedEnrollmentIds([]);
    setEnrollments(getStoredEnrollments());
    setAssignments(getStoredAssignments());
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Kesin Kayıt & Kontenjan Onay Masası
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kabul edilmiş adayların kontrollü kesin kaydı, grup yerleşimleri ve kursiyer aktivasyon yönetimi.
          </p>
        </div>

        {/* Demo reset */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
            title="Kayıt Verilerini Sıfırla"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>Kayıt Verilerini Sıfırla</span>
          </button>
        </div>
      </div>

      {/* Distinction Info Banner */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-blue-900">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Aşama Ayrımı & Kursiyerlik Aktivasyon İlkesi</span>
        </div>
        <p className="leading-relaxed text-[11px] text-slate-700">
          <strong>1. Kabul Edildi:</strong> Aday değerlendirmeyi geçti, ancak kesin kayıt evrakı henüz onaylanmadı. •{' '}
          <strong>2. Kesin Kayıt Onaylandı:</strong> Yönetici tarafından evrak ve ön koşullar teyit edildi. •{' '}
          <strong>3. Gruba Yerleştirildi:</strong> Kursiyer eğitim grubuna atandı ve ders programına erişimi aktif oldu.
        </p>
      </div>

      {/* Telemetry KPI Strip (Stripe / Canvas LMS Standart Metrik Bandı) */}
      <KpiStrip
        items={[
          {
            label: 'Toplam Kayıt Havuzu',
            value: macroStats.total,
            icon: <Users className="w-4 h-4" />,
            subtext: 'Dönem asil adayları',
          },
          {
            label: 'Onay Bekleyenler',
            value: macroStats.pending,
            icon: <Clock className="w-4 h-4" />,
            subtext: 'Evrak kontrolü bekliyor',
            badge: macroStats.pending > 0 ? (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                İnceleme
              </span>
            ) : undefined,
          },
          {
            label: 'Grup Bekleyenler',
            value: macroStats.pendingGroup,
            icon: <Layers className="w-4 h-4" />,
            subtext: 'Kaydı onaylı, şube atanacak',
          },
          {
            label: 'Gruba Yerleşenler',
            value: macroStats.assigned,
            icon: <GraduationCap className="w-4 h-4" />,
            subtext: 'Aktif kursiyer statüsünde',
          },
        ]}
      />

      {/* Notifications */}
      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3 animate-in fade-in">
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

      {/* Filter, Search and View Switcher Toolbar (Standart Tek Satır Hizalama) */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          {/* Search */}
          <div className="relative flex items-center min-w-[240px] max-w-xs w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Aday adı veya e-posta ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-3 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white w-full text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Program Select */}
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

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 border border-slate-300 rounded-lg bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tüm Durumlar ({enrollments.length})</option>
            <option value="pending_confirmation">Kesin Kayıt Bekleyenler ({macroStats.pending})</option>
            <option value="confirmed_pending_group">Grup Ataması Bekleyenler ({macroStats.pendingGroup})</option>
            <option value="assigned">Gruba Yerleştirilenler ({macroStats.assigned})</option>
            <option value="cancelled">İptal Edilenler ({macroStats.cancelled})</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-100 shrink-0 h-9">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`h-7 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === 'list'
                ? 'bg-white shadow-2xs text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Tablo / Liste Görünümü"
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

      {/* VIEW 1: ENROLLMENTS TABLE (LIST VIEW) */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-[580px] overflow-y-auto relative">
            <table className="w-full text-left text-xs min-w-[900px] border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 w-10 text-center bg-slate-50">
                    <input
                      type="checkbox"
                      checked={
                        selectedEnrollmentIds.length === filteredEnrollments.length &&
                        filteredEnrollments.length > 0
                      }
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                  </th>
                  <th className="py-3.5 px-4 bg-slate-50">Aday & İletişim</th>
                  <th className="py-3.5 px-4 bg-slate-50">Program & Dönem</th>
                  <th className="py-3.5 px-3 text-center bg-slate-50">Puan</th>
                  <th className="py-3.5 px-3 bg-slate-50">Kesin Kayıt Durumu</th>
                  <th className="py-3.5 px-3 bg-slate-50">Atandığı Grup</th>
                  <th className="py-3.5 px-4 text-right bg-slate-50 min-w-[210px] whitespace-nowrap">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEnrollments.length > 0 ? (
                  filteredEnrollments.map((enr) => {
                    const assignment = getAssignmentForEnrollment(enr.id);
                    const score = getScoreForApplication(enr.applicationId);
                    const isSelected = selectedEnrollmentIds.includes(enr.id);

                    return (
                      <tr
                        key={enr.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSingleSelect(enr.id)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                        </td>

                        {/* Candidate */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 font-bold text-slate-700 flex items-center justify-center shrink-0">
                              {enr.candidateName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 leading-tight">
                                {enr.candidateName}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {enr.candidateEmail} • {enr.candidatePhone || '—'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Program & Term */}
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <div
                            className="font-semibold text-slate-800 truncate"
                            title={enr.programTitle}
                          >
                            {enr.programTitle}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {enr.cohortName}
                          </div>
                        </td>

                        {/* Score */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 tabular-nums">
                            {score}
                          </span>
                        </td>

                        {/* Enrollment Status */}
                        <td className="py-3.5 px-3">
                          {enr.status === 'confirmed' ? (
                            <StatusBadge
                              label="Kesin Kayıt Onaylandı"
                              variant="success"
                              size="sm"
                            />
                          ) : enr.status === 'cancelled' ? (
                            <StatusBadge label="İptal Edildi" variant="danger" size="sm" />
                          ) : (
                            <StatusBadge label="Onay Bekliyor" variant="warning" size="sm" />
                          )}
                        </td>

                        {/* Assigned Group */}
                        <td className="py-3.5 px-3">
                          {assignment ? (
                            <div className="space-y-0.5">
                              <span className="font-bold text-brand-blue flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                <span>{assignment.groupName}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                Atandı: {assignment.assignedAt}
                              </span>
                            </div>
                          ) : enr.status === 'confirmed' ? (
                            <span className="text-amber-800 font-semibold text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Grup Bekliyor
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap min-w-[210px]">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDetailModalEnrollment(enr)}
                              className="h-8 px-2.5 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium transition inline-flex items-center shadow-2xs cursor-pointer"
                              title="Detay & Evrak İncele"
                            >
                              İncele
                            </button>

                            {enr.status === 'pending_confirmation' && (
                              <button
                                type="button"
                                onClick={() => handleOpenConfirmModal(enr)}
                                className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 shrink-0" />
                                <span>Onayla</span>
                              </button>
                            )}

                            {enr.status === 'confirmed' && (
                              <button
                                type="button"
                                onClick={() => handleOpenAssignModal(enr)}
                                className="h-8 px-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
                              >
                                <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>{assignment ? 'Grup Değiştir' : 'Gruba Ata'}</span>
                              </button>
                            )}

                            {enr.status !== 'cancelled' && (
                              <button
                                type="button"
                                onClick={() => handleOpenCancelModal(enr)}
                                className="h-8 px-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition cursor-pointer"
                              >
                                İptal
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Kayıt kriterlerine uygun başvuru bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: ENROLLMENTS CARDS (GRID VIEW) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEnrollments.map((enr) => {
            const assignment = getAssignmentForEnrollment(enr.id);
            const score = getScoreForApplication(enr.applicationId);
            const isSelected = selectedEnrollmentIds.includes(enr.id);

            return (
              <div
                key={enr.id}
                className={`p-4 rounded-xl border bg-white shadow-2xs hover:shadow-sm transition flex flex-col justify-between ${
                  isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSingleSelect(enr.id)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300"
                      />
                      <div className="w-8 h-8 rounded-full bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-xs">
                        {enr.candidateName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-xs leading-snug">
                          {enr.candidateName}
                        </h3>
                        <div className="text-[10px] text-slate-400">{enr.candidateEmail}</div>
                      </div>
                    </div>

                    <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {score} Puan
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Program:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[170px]" title={enr.programTitle}>
                        {enr.programTitle}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kesin Kayıt:</span>
                      {enr.status === 'confirmed' ? (
                        <StatusBadge label="Onaylandı" variant="success" size="sm" />
                      ) : enr.status === 'cancelled' ? (
                        <StatusBadge label="İptal Edildi" variant="danger" size="sm" />
                      ) : (
                        <StatusBadge label="Onay Bekliyor" variant="warning" size="sm" />
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Atanan Şube:</span>
                      {assignment ? (
                        <span className="font-bold text-blue-700">{assignment.groupName}</span>
                      ) : enr.status === 'confirmed' ? (
                        <span className="text-amber-700 font-semibold text-[11px]">Grup Bekliyor</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDetailModalEnrollment(enr)}
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                  >
                    Detay
                  </button>
                  {enr.status === 'pending_confirmation' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenConfirmModal(enr)}
                      className="text-xs"
                    >
                      Onayla
                    </Button>
                  )}
                  {enr.status === 'confirmed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenAssignModal(enr)}
                      className="text-xs text-blue-700 border-blue-200"
                    >
                      {assignment ? 'Grup Değiştir' : 'Gruba Ata'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bulk Action Ribbon */}
      {selectedEnrollmentIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 max-w-3xl w-[92vw] animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
              {selectedEnrollmentIds.length}
            </div>
            <div>
              <div className="text-xs font-bold">
                {selectedEnrollmentIds.length} Kursiyer Seçildi
              </div>
              <div className="text-[10px] text-slate-400">
                Toplu kesin kayıt veya grup ataması yapın
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleBulkConfirm}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Toplu Onayla</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBulkTargetGroupId(groups[0]?.id || '');
                setBulkAssignModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Gruba Ata</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setBulkCancelReason('');
                setBulkCancelModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
            >
              <span>İptal Et</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedEnrollmentIds([])}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Kesin Kayıt Onayı"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 text-sm">
              {activeEnrollment?.candidateName}
            </div>
            <div className="text-slate-600">
              Program: <strong>{activeEnrollment?.programTitle}</strong>
            </div>
            <div className="text-slate-500 text-[11px]">
              Dönem: {activeEnrollment?.cohortName} • Ref: {activeEnrollment?.applicationId}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Yönetici Onay Notu:
            </label>
            <textarea
              rows={3}
              value={confirmNotes}
              onChange={(e) => setConfirmNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmModalOpen(false)}
            >
              Vazgeç
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExecuteConfirm}
            >
              Kesin Kaydı Onayla
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign to Group Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Kursiyeri Eğitim Grubuna Yerleştir"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 text-sm">
              {activeEnrollment?.candidateName}
            </div>
            <div className="text-slate-600">
              Program: {activeEnrollment?.programTitle}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Hedef Şube / Eğitim Grubu:
            </label>
            <select
              value={selectedTargetGroupId}
              onChange={(e) => setSelectedTargetGroupId(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
            >
              {groups
                .filter((g) => g.programId === activeEnrollment?.programId)
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — {g.location || 'Derslik'} (Mevcut: {assignments.filter((a) => a.groupId === g.id).length} / {g.capacity || 20})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignModalOpen(false)}
            >
              Vazgeç
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExecuteAssign}
            >
              Gruba Ata
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Kesin Kayıt İptali"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 text-sm">
              {activeEnrollment?.candidateName}
            </div>
            <div className="text-rose-700 font-semibold">
              Bu adayın kesin kaydı iptal edilecek ve varsa grup ataması kaldırılacaktır.
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              İptal Gerekçesi (Zorunlu):
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Örn: Kursiyer feragat dilekçesi ile kaydını dondurmak istediğini bildirdi."
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(false)}
            >
              Vazgeç
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleExecuteCancel}
            >
              Kaydı İptal Et
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Assign Modal */}
      <Modal
        isOpen={bulkAssignModalOpen}
        onClose={() => setBulkAssignModalOpen(false)}
        title={`Seçili ${selectedEnrollmentIds.length} Kursiyeri Gruba Ata`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Hedef Şube / Eğitim Grubu Seçiniz:
            </label>
            <select
              value={bulkTargetGroupId}
              onChange={(e) => setBulkTargetGroupId(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} — {g.location || 'Derslik'} ({assignments.filter((a) => a.groupId === g.id).length}/{g.capacity || 20})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkAssignModalOpen(false)}
            >
              Vazgeç
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleBulkAssignExecute}
            >
              Toplu Gruba Yerleştir
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Cancel Modal */}
      <Modal
        isOpen={bulkCancelModalOpen}
        onClose={() => setBulkCancelModalOpen(false)}
        title={`Seçili ${selectedEnrollmentIds.length} Kaydı İptal Et`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
            Seçilen {selectedEnrollmentIds.length} kursiyerin kaydı iptal edilecek ve denetim kütüğüne tescil edilecektir.
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Toplu İptal Gerekçesi (Zorunlu):
            </label>
            <textarea
              rows={3}
              value={bulkCancelReason}
              onChange={(e) => setBulkCancelReason(e.target.value)}
              placeholder="Örn: Evrak teslim süresi dolduğu için feragat sayıldı."
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkCancelModalOpen(false)}
            >
              Vazgeç
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleBulkCancelExecute}
            >
              Toplu İptal Et
            </Button>
          </div>
        </div>
      </Modal>

      {/* Candidate Detail Modal */}
      {detailModalEnrollment && (
        <Modal
          isOpen={!!detailModalEnrollment}
          onClose={() => setDetailModalEnrollment(null)}
          title="Kursiyer Kesin Kayıt & Dosya Detayı"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-slate-400">
                  Ref: {detailModalEnrollment.applicationId}
                </span>
                {detailModalEnrollment.status === 'confirmed' ? (
                  <StatusBadge label="Kesin Kayıt Onaylandı" variant="success" size="sm" />
                ) : detailModalEnrollment.status === 'cancelled' ? (
                  <StatusBadge label="İptal Edildi" variant="danger" size="sm" />
                ) : (
                  <StatusBadge label="Onay Bekliyor" variant="warning" size="sm" />
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {detailModalEnrollment.candidateName}
              </h3>
              <div className="text-slate-600 space-y-1 pt-1">
                <div>E-Posta: <strong>{detailModalEnrollment.candidateEmail}</strong></div>
                <div>Telefon: <strong>{detailModalEnrollment.candidatePhone || '—'}</strong></div>
                <div>Program: <strong>{detailModalEnrollment.programTitle}</strong></div>
                <div>Dönem: <strong>{detailModalEnrollment.cohortName}</strong></div>
                <div>Kriter Puanı: <strong className="font-mono text-blue-700">{getScoreForApplication(detailModalEnrollment.applicationId)} / 100</strong></div>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-950 text-[11px] space-y-1">
              <div className="font-bold">Kurumsal Tescil Durumu:</div>
              <p>
                Adayın beyanları ve ön koşul evrakları komisyonca incelenmiş olup kesin kayıt aşamasına aktarılmıştır.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailModalEnrollment(null)}
              >
                Kapat
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* In-App Custom Confirm Modal */}
      <ActionConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          resetEnrollmentsToDefaults();
          window.location.reload();
        }}
        title="Kayıt ve Grup Atamalarını Sıfırla"
        message="Tüm kayıt ve grup atamalarını başlangıç fabrika ayarlarına sıfırlamak istiyor musunuz? Manuel yapılan tüm öğrenci yerleşimleri sıfırlanacaktır."
        confirmText="Evet, Sıfırla"
        variant="danger"
      />
    </div>
  );
};
