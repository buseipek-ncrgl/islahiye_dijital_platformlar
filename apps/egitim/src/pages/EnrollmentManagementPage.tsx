import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  RotateCcw,
  PlusCircle,
} from 'lucide-react';
import { DEMO_PROGRAMS } from '../data/educationData';
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
  getGroupCapacityStats,
  subscribeToEnrollmentUpdates,
  subscribeToGroupUpdates,
  resetEnrollmentsToDefaults,
} from '../services/enrollmentStorage';
import { getStoredApplications } from '../services/applicationStorage';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Card, CardContent } from '../components/ui/Card';

export const EnrollmentManagementPage: React.FC = () => {
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

  // Modal States
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

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

  // Filter Data
  const filteredEnrollments = enrollments.filter((item) => {
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Yönetim Masası</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Kesin Kayıt & Aktivasyon</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-brand-textPrimary mt-0.5">
            Kesin Kayıt & Kontenjan Onay Masası
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kabul edilmiş adayların kontrollü kesin kaydı, grup yerleşimleri ve kursiyer aktivasyon yönetimi.
          </p>
        </div>

        {/* Demo reset */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.confirm('Tüm kayıt ve grup atamalarını fabrika ayarlarına sıfırlamak istiyor musunuz?')) {
                resetEnrollmentsToDefaults();
                window.location.reload();
              }
            }}
            className="flex items-center gap-1.5"
            title="Demo Kayıt Verilerini Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-xs">Kayıt Verilerini Sıfırla</span>
          </Button>
        </div>
      </div>

      {/* Distinction Info Banner */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-brand-blue">
          <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0" />
          <span>Aşama Ayrımı Prensibi (Sprint E02-C)</span>
        </div>
        <p className="leading-relaxed text-[11px] text-slate-700">
          <strong>1. Kabul Edildi:</strong> Aday değerlendirmeyi geçti, ancak kesin kayıt henüz onaylanmadı. •{' '}
          <strong>2. Kesin Kayıt:</strong> Yönetici tarafından evrak ve ön koşullar teyit edildi. •{' '}
          <strong>3. Gruba Yerleştirildi:</strong> Kursiyer sınıf grubuna atandı ve kursiyer paneli aktif oldu.
        </p>
      </div>

      {/* Notifications */}
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

      {/* Filter and Search Bar */}
      <Card className="bg-white border-slate-200 shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Aday adı veya e-posta ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            {/* Selects */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-brand-blue"
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
                className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                <option value="all">Tüm Durumlar ({enrollments.length})</option>
                <option value="pending_confirmation">Kesin Kayıt Bekleyenler</option>
                <option value="confirmed_pending_group">Grup Ataması Bekleyenler</option>
                <option value="assigned">Gruba Yerleştirilenler (Aktif)</option>
                <option value="cancelled">İptal Edilenler</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrollments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Aday & İletişim</th>
                <th className="py-3.5 px-4">Program & Dönem</th>
                <th className="py-3.5 px-3 text-center">Puan</th>
                <th className="py-3.5 px-3">Kesin Kayıt Durumu</th>
                <th className="py-3.5 px-3">Atandığı Grup</th>
                <th className="py-3.5 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEnrollments.length > 0 ? (
                filteredEnrollments.map((enr) => {
                  const assignment = getAssignmentForEnrollment(enr.id);
                  const score = getScoreForApplication(enr.applicationId);

                  return (
                    <tr key={enr.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Candidate */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 leading-tight">
                          {enr.candidateName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {enr.candidateEmail} • {enr.candidatePhone || '—'}
                        </div>
                      </td>

                      {/* Program & Term */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-semibold text-slate-800 truncate" title={enr.programTitle}>
                          {enr.programTitle}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {enr.cohortName}
                        </div>
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-extrabold text-slate-900 tabular-nums">
                          {score}
                        </span>
                      </td>

                      {/* Enrollment Status */}
                      <td className="py-3.5 px-3">
                        {enr.status === 'confirmed' ? (
                          <StatusBadge label="Kesin Kayıt Onaylandı" variant="success" size="sm" />
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
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {enr.status === 'pending_confirmation' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleOpenConfirmModal(enr)}
                              className="text-xs flex items-center gap-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Kesin Kaydı Onayla</span>
                            </Button>
                          )}

                          {enr.status === 'confirmed' && !assignment && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleOpenAssignModal(enr)}
                              className="text-xs flex items-center gap-1"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Gruba Yerleştir</span>
                            </Button>
                          )}

                          {enr.status === 'confirmed' && assignment && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenAssignModal(enr)}
                              className="text-xs"
                            >
                              Grup Değiştir
                            </Button>
                          )}

                          {enr.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenCancelModal(enr)}
                              className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                            >
                              İptal
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Kriterlere uygun kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: KESİN KAYIT ONAYLAMA */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Adayın Kesin Kaydını Onaylayınız"
      >
        <div className="space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="font-bold text-slate-900 text-sm">
              {activeEnrollment?.candidateName}
            </div>
            <div className="text-slate-600">
              <strong>Program:</strong> {activeEnrollment?.programTitle} ({activeEnrollment?.cohortName})
            </div>
            <div className="text-slate-500 text-[11px]">
              E-Posta: {activeEnrollment?.candidateEmail} • Telefon: {activeEnrollment?.candidatePhone}
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-800">Kayıt Onay Notu:</label>
            <textarea
              rows={2}
              value={confirmNotes}
              onChange={(e) => setConfirmNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs resize-none"
            />
          </div>

          <div className="text-[11px] text-slate-500 leading-relaxed">
            Bu işlem adayın programa kesin kaydını oluşturur. Kesin kayıt sonrasında kursiyer bir eğitim grubuna atanabilecektir.
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
              onClick={handleExecuteConfirm}
            >
              Kesin Kaydı Onayla
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: GRUBA YERLEŞTİRME */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Kursiyeri Eğitim Grubuna Yerleştir"
      >
        <div className="space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900 text-sm">
              {activeEnrollment?.candidateName}
            </div>
            <div className="text-slate-600">
              {activeEnrollment?.programTitle} ({activeEnrollment?.cohortName})
            </div>
          </div>

          {/* Group Selection with Capacity Display */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 block">
              Atanacak Eğitim Grubu ve Kontenjan:
            </label>
            <div className="space-y-2">
              {groups
                .filter((g) => g.programId === activeEnrollment?.programId)
                .map((g) => {
                  const stats = getGroupCapacityStats(g.id);
                  const isSelected = selectedTargetGroupId === g.id;

                  return (
                    <div
                      key={g.id}
                      onClick={() => !stats.isFull && setSelectedTargetGroupId(g.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-brand-blue bg-blue-50/60 ring-2 ring-brand-blue/20'
                          : stats.isFull
                          ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">{g.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {g.scheduleSummary} • {g.instructorNames.join(', ')}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-extrabold text-xs tabular-nums text-slate-800">
                          {stats.assignedCount} / {stats.capacity} Kişi
                        </div>
                        {stats.isFull ? (
                          <span className="text-[10px] font-bold text-rose-700">Dolu</span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            {stats.availableSeats} Boş Kontenjan
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignModalOpen(false)}
            >
              Vazgeç
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleExecuteAssign}
              disabled={!selectedTargetGroupId}
            >
              Gruba Yerleştir ve Aktif Et
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: KAYIT İPTALİ */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Kesin Kayıt İptali"
      >
        <div className="space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-[11px]">
            ⚠️ Bu işlem kursiyerin kesin kaydını iptal eder, ilişkili grup kontenjanını boşaltır ve kursiyer erişimini kapatır.
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-800">İptal Gerekçesi (Zorunlu):</label>
            <textarea
              rows={3}
              placeholder="Örn: Kursiyer feragat talebinde bulundu veya devamsızlık sebebiyle ilişiği kesildi."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs resize-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(false)}
            >
              Vazgeç
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleExecuteCancel}
            >
              Kaydı İptal Et
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
