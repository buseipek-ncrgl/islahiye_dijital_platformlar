import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Users,
  Search,
  History,
  X,
  Lock,
  Clock,
  FileText,
  Check,
} from 'lucide-react';
import {
  Group,
  Program,
  AdminSuccessDecisionType,
  FinalEligibilityResult,
  TermRegistryRecord,
} from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { getStoredGroups } from '../services/enrollmentStorage';
import { DEMO_PROGRAMS } from '../data/educationData';
import {
  calculateBatchEligibility,
  calculateFinalEligibility,
} from '../services/successEngine';
import {
  getStoredSuccessDecisions,
  recordAdminSuccessDecision,
  getStoredTermRegistries,
  closeTermRegistry,
  subscribeToSuccessDecisionUpdates,
} from '../services/successDecisionStorage';

export const SuccessDecisionPage: React.FC = () => {
  const { currentUser } = useDemoRole();

  // Tab: 'decision_desk' | 'term_registry'
  const [activeTab, setActiveTab] = useState<'decision_desk' | 'term_registry'>('decision_desk');

  // Filters
  const [programs, setPrograms] = useState<Program[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data State
  const [eligibilityList, setEligibilityList] = useState<FinalEligibilityResult[]>([]);
  const [termRegistries, setTermRegistries] = useState<TermRegistryRecord[]>([]);

  // Modal State: Kursiyer Başarı Dosyası & Karar Verme
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
  const [modalDecision, setModalDecision] = useState<AdminSuccessDecisionType>('approved');
  const [modalInternalNote, setModalInternalNote] = useState<string>('');
  const [modalTraineeMessage, setModalTraineeMessage] = useState<string>('');

  // Remediation State
  const [remediationReason, setRemediationReason] = useState<string>('');
  const [remediationTarget, setRemediationTarget] = useState<
    'attendance' | 'assignment_grade' | 'mandatory_assignment' | 'multiple'
  >('attendance');
  const [remediationDueDate, setRemediationDueDate] = useState<string>('');
  const [remediationActionNote, setRemediationActionNote] = useState<string>('');

  // Close Term Modal State
  const [isCloseTermModalOpen, setIsCloseTermModalOpen] = useState(false);
  const [closureNotes, setClosureNotes] = useState('');

  // Feedback Toast
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load Data
  const loadData = () => {
    const progs = DEMO_PROGRAMS;
    const grps = getStoredGroups();
    setPrograms(progs);
    setGroups(grps);

    const batch = calculateBatchEligibility(
      selectedProgramId === 'all' ? undefined : selectedProgramId,
      undefined,
      selectedGroupId === 'all' ? undefined : selectedGroupId
    );
    setEligibilityList(batch);
    setTermRegistries(getStoredTermRegistries());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToSuccessDecisionUpdates(() => {
      loadData();
    });
    return () => {
      unsub();
    };
  }, [selectedProgramId, selectedGroupId]);

  // Selected Trainee Detail Object
  const selectedDossier = useMemo(() => {
    if (!selectedEnrollmentId) return null;
    return calculateFinalEligibility(selectedEnrollmentId);
  }, [selectedEnrollmentId, eligibilityList]);

  // Existing Stored Decision for Dossier
  const dossierDecision = useMemo(() => {
    if (!selectedEnrollmentId) return null;
    const all = getStoredSuccessDecisions();
    return all.find((d) => d.enrollmentId === selectedEnrollmentId && d.status === 'active') || null;
  }, [selectedEnrollmentId]);

  // Open Dossier Modal
  const handleOpenDossier = (enrId: string) => {
    setSelectedEnrollmentId(enrId);
    const item = calculateFinalEligibility(enrId);
    const existing = getStoredSuccessDecisions().find(
      (d) => d.enrollmentId === enrId && d.status === 'active'
    );

    if (existing) {
      setModalDecision(existing.decision);
      setModalInternalNote(existing.internalNote);
      setModalTraineeMessage(existing.traineeDecisionMessage);
      if (existing.remediationDetails) {
        setRemediationReason(existing.remediationDetails.reason);
        setRemediationTarget(existing.remediationDetails.targetRequirement);
        setRemediationDueDate(existing.remediationDetails.dueDate);
        setRemediationActionNote(existing.remediationDetails.requiredActionNote);
      }
    } else {
      if (item.academicEligible) {
        setModalDecision('approved');
        setModalInternalNote(
          'Kursiyer %80 devam barajını, 70/100 ödev ortalamasını ve tüm zorunlu ödev onaylarını başarıyla sağlamıştır. Başarı belgesi düzenlenmesi uygundur.'
        );
        setModalTraineeMessage(
          'Tebrik ederiz! İslahiye Ticaret Odası Eğitim Portalı başarı değerlendirmeniz yetkili yönetim tarafından onaylanmış ve başarı belgesi hakkınız tescil edilmiştir.'
        );
      } else {
        setModalDecision('remediation');
        setModalInternalNote(
          `Eksik koşullar tespit edilmiştir: ${item.incompleteRequirements.join('; ')}`
        );
        setModalTraineeMessage(
          'Eğitim dönemi başarı koşullarınızda eksiklikler tespit edilmiştir. İlgili telafi adımlarını tamamlamanız beklenmektedir.'
        );
        setRemediationReason(item.incompleteRequirements[0] || 'Eksik akademik koşul');
        setRemediationTarget(
          !item.attendanceEligible
            ? 'attendance'
            : !item.gradeEligible
            ? 'assignment_grade'
            : 'mandatory_assignment'
        );
        setRemediationDueDate('2026-11-15');
        setRemediationActionNote('Belirtilen eksiklik için telafi çalışması tamamlanmalıdır.');
      }
    }
  };

  // Submit Admin Decision
  const handleSaveDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDossier) return;

    const res = recordAdminSuccessDecision({
      enrollmentId: selectedDossier.enrollmentId,
      traineeId: selectedDossier.traineeId,
      traineeName: selectedDossier.traineeName,
      programId: selectedDossier.programId,
      termId: selectedDossier.termId,
      groupId: selectedDossier.groupId,
      decision: modalDecision,
      eligibilitySnapshot: selectedDossier.sourceSnapshot,
      internalNote: modalInternalNote.trim(),
      traineeDecisionMessage: modalTraineeMessage.trim(),
      remediationDetails:
        modalDecision === 'remediation'
          ? {
              reason: remediationReason.trim(),
              targetRequirement: remediationTarget,
              targetRequirementLabel:
                remediationTarget === 'attendance'
                  ? 'Devam Telafisi'
                  : remediationTarget === 'assignment_grade'
                  ? 'Ödev Notu Yükseltme'
                  : 'Zorunlu Ödev Telafisi',
              dueDate: remediationDueDate,
              requiredActionNote: remediationActionNote.trim(),
              assignedAt: new Date().toISOString(),
              outcome: 'pending',
            }
          : undefined,
      decidedBy: `${currentUser.fullName} (Yetkili Yönetici)`,
      academicEligible: selectedDossier.academicEligible,
    });

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `${selectedDossier.traineeName} için nihai karar "${
          modalDecision === 'approved'
            ? 'Nihai Onay Verildi (Belgeye Hak Kazandı)'
            : modalDecision === 'remediation'
            ? 'Telafi Sürecine Yönlendirildi'
            : modalDecision === 'additional_review'
            ? 'Ek İnceleme İstendi'
            : 'Başarısız Olarak Sonuçlandırıldı'
        }" olarak kaydedildi ve denetim kütüğüne işlendi.`,
      });
      setSelectedEnrollmentId(null);
      loadData();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Karar kaydedilemedi.' });
    }
  };

  // Close Term Registry Action
  const handleCloseTermSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activeProgId = selectedProgramId !== 'all' ? selectedProgramId : 'prog-01';
    const res = closeTermRegistry(
      activeProgId,
      'term-2026-fall',
      `${currentUser.fullName} (Genel Sekreter Yrd.)`,
      closureNotes.trim()
    );

    if (res.success) {
      setFeedback({
        type: 'success',
        message: '2026 Güz Dönemi resmi kütüğü başarıyla kapatıldı ve kilitlendi.',
      });
      setIsCloseTermModalOpen(false);
      setClosureNotes('');
      loadData();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Kütük kapatılamadı.' });
    }
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return eligibilityList.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.traineeName.toLowerCase().includes(q);
        const matchProg = item.programTitle.toLowerCase().includes(q);
        const matchGroup = item.groupName.toLowerCase().includes(q);
        if (!matchName && !matchProg && !matchGroup) return false;
      }

      if (statusFilter === 'academic_passed') {
        return item.academicEligible;
      }
      if (statusFilter === 'awaiting_admin') {
        return item.finalStatus === 'awaiting_admin_decision';
      }
      if (statusFilter === 'approved') {
        return item.finalStatus === 'admin_approved';
      }
      if (statusFilter === 'remediation') {
        return item.finalStatus === 'remediation';
      }
      if (statusFilter === 'rejected') {
        return item.finalStatus === 'rejected';
      }
      if (statusFilter === 'missing') {
        return !item.academicEligible;
      }

      return true;
    });
  }, [eligibilityList, searchQuery, statusFilter]);

  // Top KPI Metrics
  const totalCount = eligibilityList.length;
  const academicPassedCount = eligibilityList.filter((e) => e.academicEligible).length;
  const approvedCount = eligibilityList.filter((e) => e.finalStatus === 'admin_approved').length;
  const awaitingAdminCount = eligibilityList.filter((e) => e.finalStatus === 'awaiting_admin_decision').length;
  const remediationCount = eligibilityList.filter((e) => e.finalStatus === 'remediation').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <span className="text-xs text-slate-500 font-medium">Yetkili Yönetici Masası:</span>
          <h2 className="text-xl font-bold text-brand-navy">
            Dönem Sonu Nihai Başarı Onay Masası ve Resmî Kütük
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dört Şart Kontrolü: %80 Devam + 70/100 Ödev Ortalaması + Zorunlu Ödev Onayları + Yetkili Yönetici Kararı
          </p>
        </div>
        <div className="text-xs text-slate-600 flex items-center gap-2">
          <span>
            Aktif Yönetici: <strong>{currentUser.fullName}</strong>
          </span>
        </div>
      </div>

      {/* Ana Sekmeler (Tab Switcher) */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('decision_desk')}
          className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'decision_desk'
              ? 'border-blue-600 text-brand-navy'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Award className="w-4 h-4 text-blue-600" />
          <span>1. Başarı Onay & Karar Masası ({totalCount})</span>
          {awaitingAdminCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
              {awaitingAdminCount} Karar Bekliyor
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('term_registry')}
          className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'term_registry'
              ? 'border-blue-600 text-brand-navy'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Lock className="w-4 h-4 text-blue-600" />
          <span>2. Dönem Sonu Resmî Kütüğü & Kapanış</span>
        </button>
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

      {/* ===================================================================== */}
      {/* 1. SEKME — BAŞARI ONAY & KARAR MASASI */}
      {/* ===================================================================== */}
      {activeTab === 'decision_desk' && (
        <div className="space-y-6">
          {/* 4 KPI Kartı */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-semibold text-slate-500">Kesin Kayıtlı Kursiyer</span>
                <div className="text-2xl font-bold text-slate-900 tabular-nums">{totalCount}</div>
                <div className="text-[11px] text-slate-400">Aktif Eğitim Dönemi</div>
              </CardContent>
            </Card>

            <Card className="border-blue-100 bg-blue-50/20">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-semibold text-blue-900">Akademik Şartları Sağlayan</span>
                <div className="text-2xl font-bold text-blue-700 tabular-nums">
                  {academicPassedCount}
                </div>
                <div className="text-[11px] text-blue-600 font-medium">
                  {awaitingAdminCount} Kişi Yönetici Onayı Bekliyor
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 bg-emerald-50/20">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-semibold text-emerald-900">Nihai Onay Verilenler</span>
                <div className="text-2xl font-bold text-emerald-700 tabular-nums">
                  {approvedCount}
                </div>
                <div className="text-[11px] text-emerald-700 font-medium">
                  Belgeye Hak Kazananlar
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-100 bg-amber-50/20">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-semibold text-amber-900">Telafi Sürecindekiler</span>
                <div className="text-2xl font-bold text-amber-700 tabular-nums">
                  {remediationCount}
                </div>
                <div className="text-[11px] text-amber-800">Ek Süre / Telafi Kararı</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtre ve Arama Barı */}
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
                  placeholder="Kursiyer veya program ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white w-48 text-slate-800"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-600 mr-1">Durum:</span>
              {[
                { key: 'all', label: 'Tümü' },
                { key: 'awaiting_admin', label: 'Onay Bekleyen' },
                { key: 'approved', label: 'Onaylanan' },
                { key: 'remediation', label: 'Telafi' },
                { key: 'missing', label: 'Eksik Koşul' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    statusFilter === f.key
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ana Kursiyer Başarı Karar Tablosu */}
          <Card>
            <CardContent className="p-0 overflow-hidden">
              {filteredList.length === 0 ? (
                <div className="p-10 text-center text-slate-500 space-y-2">
                  <Users className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-bold">Filtreye uygun kursiyer kaydı bulunamadı.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Kursiyer Adı</th>
                        <th className="py-3.5 px-4">Program & Grup</th>
                        <th className="py-3.5 px-3 text-center">Devam (%80)</th>
                        <th className="py-3.5 px-3 text-center">Ödev Notu (70)</th>
                        <th className="py-3.5 px-3 text-center">Zorunlu Onay</th>
                        <th className="py-3.5 px-3 text-center">Akademik Durum</th>
                        <th className="py-3.5 px-3 text-center">Yönetici Kararı</th>
                        <th className="py-3.5 px-4 text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredList.map((item) => (
                        <tr key={item.enrollmentId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {item.traineeName}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 line-clamp-1">
                              {item.programTitle}
                            </div>
                            <div className="text-[11px] text-slate-500">{item.groupName}</div>
                          </td>
                          {/* Devam */}
                          <td className="py-3.5 px-3 text-center tabular-nums">
                            {item.attendanceRate !== null ? (
                              <span
                                className={`font-bold ${
                                  item.attendanceEligible ? 'text-emerald-700' : 'text-red-700'
                                }`}
                              >
                                %{item.attendanceRate}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">Hesaplanamıyor</span>
                            )}
                          </td>
                          {/* Ödev Ortalaması */}
                          <td className="py-3.5 px-3 text-center tabular-nums">
                            {item.assignmentAverage !== null ? (
                              <span
                                className={`font-bold ${
                                  item.gradeEligible ? 'text-emerald-700' : 'text-red-700'
                                }`}
                              >
                                {item.assignmentAverage} / 100
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">Hesaplanamıyor</span>
                            )}
                          </td>
                          {/* Zorunlu Onay */}
                          <td className="py-3.5 px-3 text-center font-bold tabular-nums">
                            <span
                              className={
                                item.mandatoryEligible ? 'text-emerald-700' : 'text-amber-700'
                              }
                            >
                              {item.mandatoryAssignmentsApproved} / {item.mandatoryAssignmentsTotal}
                            </span>
                          </td>
                          {/* Akademik Durum Rozeti */}
                          <td className="py-3.5 px-3 text-center">
                            {item.academicEligible ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <Check className="w-3 h-3" /> Koşullar Sağlandı
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-900">
                                Eksik Koşul
                              </span>
                            )}
                          </td>
                          {/* Yönetici Kararı */}
                          <td className="py-3.5 px-3 text-center">
                            {item.finalStatus === 'admin_approved' ? (
                              <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Nihai Onay Verildi
                              </span>
                            ) : item.finalStatus === 'awaiting_admin_decision' ? (
                              <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-blue-100 text-blue-800 animate-pulse border border-blue-300">
                                Onay Bekliyor
                              </span>
                            ) : item.finalStatus === 'remediation' ? (
                              <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                Telafi Sürecinde
                              </span>
                            ) : item.finalStatus === 'under_review' ? (
                              <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-purple-100 text-purple-900">
                                Ek İnceleme
                              </span>
                            ) : item.finalStatus === 'rejected' ? (
                              <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-red-100 text-red-800">
                                Başarısız
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                İnceleme Sürüyor
                              </span>
                            )}
                          </td>
                          {/* Eylem */}
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              size="sm"
                              variant={item.finalStatus === 'awaiting_admin_decision' ? 'primary' : 'outline'}
                              onClick={() => handleOpenDossier(item.enrollmentId)}
                            >
                              Dosyayı İncele
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. SEKME — DÖNEM SONU KÜTÜĞÜ VE RESMÎ KAPANIŞ */}
      {/* ===================================================================== */}
      {activeTab === 'term_registry' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-brand-navy" />
                    2026 Güz Dönemi Resmî Başarı Kütüğü
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dönem kapanışı yapıldığında kütük kalıcı olarak kilitlenir ve geriye dönük değişiklikler gerekçeli yönetici işlemi gerektirir.
                  </p>
                </div>

                <div>
                  {termRegistries[0]?.isClosed ? (
                    <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Kütük Resmen Kapatıldı ({termRegistries[0].closedAt?.split('T')[0]})
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setIsCloseTermModalOpen(true)}
                    >
                      Dönem Kütüğünü Resmen Kapat
                    </Button>
                  )}
                </div>
              </div>

              {/* Kütük Durumu İstatistikleri */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500">Kütükteki Toplam Kayıt:</span>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">
                    {eligibilityList.length} Kursiyer
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900">
                  <span className="text-emerald-700">Tescilli Başarı Onayı:</span>
                  <div className="text-lg font-bold text-emerald-800 tabular-nums">
                    {approvedCount} Belge Hakkı
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                  <span className="text-amber-700">Telafi / Şartlı Süreç:</span>
                  <div className="text-lg font-bold text-amber-800 tabular-nums">
                    {remediationCount} Kayıt
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-blue-900">
                  <span className="text-blue-700">Bekleyen Nihai Karar:</span>
                  <div className="text-lg font-bold text-blue-800 tabular-nums">
                    {awaitingAdminCount} Kayıt
                  </div>
                </div>
              </div>

              {/* Tescilli Kütük Tablosu */}
              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Kayıt No</th>
                      <th className="py-3 px-4">Kursiyer Adı</th>
                      <th className="py-3 px-4">Program & Dönem</th>
                      <th className="py-3 px-3 text-center">Devam / Not</th>
                      <th className="py-3 px-3 text-center">Akademik Tescil</th>
                      <th className="py-3 px-3 text-center">Yönetici Kararı</th>
                      <th className="py-3 px-3 text-center">Belge Hakkı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {eligibilityList.map((item, idx) => (
                      <tr key={item.enrollmentId} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          KUT-2026-{String(idx + 1).padStart(4, '0')}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{item.traineeName}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.programTitle} • {item.cohortName}
                        </td>
                        <td className="py-3 px-3 text-center tabular-nums">
                          %{item.attendanceRate || 0} / {item.assignmentAverage || 0} Not
                        </td>
                        <td className="py-3 px-3 text-center">
                          {item.academicEligible ? (
                            <span className="text-emerald-700 font-bold">Uygun</span>
                          ) : (
                            <span className="text-red-700 font-medium">Yetersiz</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-semibold text-slate-800">{item.statusLabel}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {item.finalStatus === 'admin_approved' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                              <Check className="w-3 h-3" /> Hak Kazandı
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Verilmedi</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: KURSİYER BAŞARI DOSYASI VE YÖNETİCİ KARAR MASASI */}
      {/* ===================================================================== */}
      {selectedDossier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-brand-navy text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-200">Dönem Sonu Başarı Dosyası İnceleme:</span>
                <h3 className="font-bold text-base mt-0.5">{selectedDossier.traineeName}</h3>
                <p className="text-xs text-slate-300">
                  {selectedDossier.programTitle} — {selectedDossier.groupName}
                </p>
              </div>
              <button
                onClick={() => setSelectedEnrollmentId(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDecision} className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              {/* Snapshot Tutarsızlık Uyarısı (Eğer sonradan not/yoklama değiştiyse) */}
              {selectedDossier.hasDiscrepancyWithSavedSnapshot && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block">Denetim Uyarısı: Veri Uyuşmazlığı Tespit Edildi!</strong>
                    <p className="mt-0.5 leading-relaxed text-[11px]">
                      Bu kursiyer için daha önce verilen onaydan sonra yoklama veya ödev notlarında geriye dönük düzeltme yapılmıştır. Lütfen güncel verileri inceleyerek kararı yenileyiniz.
                    </p>
                  </div>
                </div>
              )}

              {/* 4 Şart Denetim Özeti Kartları */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Devam */}
                <div
                  className={`p-3 rounded-lg border space-y-1 ${
                    selectedDossier.attendanceEligible
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : 'bg-red-50/60 border-red-200 text-red-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>1. Devam Oranı</span>
                    <span>%{selectedDossier.attendanceRate ?? 'Hesaplanamıyor'}</span>
                  </div>
                  <div className="text-[11px] opacity-80">
                    {selectedDossier.attendedCount} / {selectedDossier.completedSessionsCount} Oturum (Baraj: %80)
                  </div>
                  <div className="text-[10px] font-semibold pt-1">
                    {selectedDossier.attendanceEligible ? '✓ Koşul Sağlandı' : '✗ Baraj Altında'}
                  </div>
                </div>

                {/* 2. Ödev Notu */}
                <div
                  className={`p-3 rounded-lg border space-y-1 ${
                    selectedDossier.gradeEligible
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : 'bg-red-50/60 border-red-200 text-red-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>2. Ödev Ortalaması</span>
                    <span>{selectedDossier.assignmentAverage ?? 'Puan Yok'} / 100</span>
                  </div>
                  <div className="text-[11px] opacity-80">
                    Başarı Barajı: 70 / 100
                  </div>
                  <div className="text-[10px] font-semibold pt-1">
                    {selectedDossier.gradeEligible ? '✓ Koşul Sağlandı' : '✗ Baraj Altında'}
                  </div>
                </div>

                {/* 3. Zorunlu Onaylar */}
                <div
                  className={`p-3 rounded-lg border space-y-1 ${
                    selectedDossier.mandatoryEligible
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50/60 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>3. Zorunlu Onaylar</span>
                    <span>
                      {selectedDossier.mandatoryAssignmentsApproved} / {selectedDossier.mandatoryAssignmentsTotal}
                    </span>
                  </div>
                  <div className="text-[11px] opacity-80">
                    Eğitmen Onayı Şart
                  </div>
                  <div className="text-[10px] font-semibold pt-1">
                    {selectedDossier.mandatoryEligible ? '✓ Tüm Onaylar Tam' : '✗ Eksik Onay Var'}
                  </div>
                </div>
              </div>

              {/* Eksik Koşullar Listesi */}
              {selectedDossier.incompleteRequirements.length > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 space-y-1.5">
                  <span className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    Eksik Kalan Akademik Başarı Koşulları:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
                    {selectedDossier.incompleteRequirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 4. Yetkili Yönetici Karar Seçimi */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-800 text-sm">
                  4. Nihai Yönetici Kararı *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Onay Seçeneği */}
                  <label
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      modalDecision === 'approved'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    } ${!selectedDossier.academicEligible ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" /> Nihai Onay Ver
                      </span>
                      <input
                        type="radio"
                        name="adminDecisionRadio"
                        checked={modalDecision === 'approved'}
                        disabled={!selectedDossier.academicEligible}
                        onChange={() => setModalDecision('approved')}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Belge hakkı tescil edilir (İlk 3 şart zorunludur).
                    </div>
                  </label>

                  {/* Telafi Seçeneği */}
                  <label
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      modalDecision === 'remediation'
                        ? 'border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600" /> Telafi Sürecine Yönlendir
                      </span>
                      <input
                        type="radio"
                        name="adminDecisionRadio"
                        checked={modalDecision === 'remediation'}
                        onChange={() => setModalDecision('remediation')}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Eksik koşul için ek süre ve telafi hakkı tanımlanır.
                    </div>
                  </label>

                  {/* Ek İnceleme Seçeneği */}
                  <label
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      modalDecision === 'additional_review'
                        ? 'border-purple-500 bg-purple-50 text-purple-900 ring-1 ring-purple-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-purple-600" /> Ek İnceleme İste
                      </span>
                      <input
                        type="radio"
                        name="adminDecisionRadio"
                        checked={modalDecision === 'additional_review'}
                        onChange={() => setModalDecision('additional_review')}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Eğitmen veya idari değerlendirme için bekletilir.
                    </div>
                  </label>

                  {/* Başarısız Seçeneği */}
                  <label
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      modalDecision === 'rejected'
                        ? 'border-red-500 bg-red-50 text-red-900 ring-1 ring-red-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        <X className="w-4 h-4 text-red-600" /> Başarısız Olarak Sonuçlandır
                      </span>
                      <input
                        type="radio"
                        name="adminDecisionRadio"
                        checked={modalDecision === 'rejected'}
                        onChange={() => setModalDecision('rejected')}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Belge hakkı tanınmaz, dönem kapatılır.
                    </div>
                  </label>
                </div>
              </div>

              {/* Telafi Form Detayları (Eğer telafi seçildiyse) */}
              {modalDecision === 'remediation' && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg space-y-3">
                  <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Telafi Süreci Yapılandırması
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Hedef Telafi Koşulu *
                      </label>
                      <select
                        value={remediationTarget}
                        onChange={(e) =>
                          setRemediationTarget(
                            e.target.value as 'attendance' | 'assignment_grade' | 'mandatory_assignment' | 'multiple'
                          )
                        }
                        className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                      >
                        <option value="attendance">Devam Oranı Telafisi</option>
                        <option value="assignment_grade">Ödev Notu Yükseltme</option>
                        <option value="mandatory_assignment">Zorunlu Ödev Telafisi</option>
                        <option value="multiple">Çoklu Koşul Telafisi</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Son Telafi Tarihi *
                      </label>
                      <input
                        type="date"
                        value={remediationDueDate}
                        onChange={(e) => setRemediationDueDate(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Kursiyerden Beklenen Telafi Adımı *
                    </label>
                    <textarea
                      rows={2}
                      value={remediationActionNote}
                      onChange={(e) => setRemediationActionNote(e.target.value)}
                      placeholder="Örn: Hafta sonu grubunda 2 telafi dersine katılım veya eksik ödevin revize edilerek yeniden yüklenmesi..."
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Kurum İçi Gerekçe & Kursiyer Mesajı */}
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kurum İçi İdari Yönetici Notu (Zorunlu Gerekçe) *
                  </label>
                  <textarea
                    rows={2}
                    value={modalInternalNote}
                    onChange={(e) => setModalInternalNote(e.target.value)}
                    placeholder="Denetim kütüğüne işlenecek idari gerekçeyi yazınız..."
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kursiyerin Portalinde Göreceği Karar Açıklaması *
                  </label>
                  <textarea
                    rows={2}
                    value={modalTraineeMessage}
                    onChange={(e) => setModalTraineeMessage(e.target.value)}
                    placeholder="Kursiyerin panelinde gösterilecek resmi bilgilendirme metni..."
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                    required
                  />
                </div>
              </div>

              {/* Karar Tarihçesi (Eğer daha önce karar verildiyse) */}
              {dossierDecision?.decisionHistory && dossierDecision.decisionHistory.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    Önceki Karar Geçmişi ({dossierDecision.decisionHistory.length} Kayıt)
                  </span>
                  <div className="space-y-1.5">
                    {dossierDecision.decisionHistory.map((h, i) => (
                      <div key={i} className="p-2 bg-white rounded border border-slate-200 text-[11px]">
                        <div className="flex justify-between font-semibold text-slate-700">
                          <span>{h.decidedBy}</span>
                          <span>{new Date(h.decidedAt).toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="text-slate-600 italic mt-0.5">"{h.internalNote}"</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  İşlem Yapan: <strong>{currentUser.fullName}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedEnrollmentId(null)}
                  >
                    Vazgeç
                  </Button>
                  <Button type="submit">Kararı İmzala ve Tescil Et</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: DÖNEM KÜTÜĞÜ KAPANIŞ ONAYI */}
      {/* ===================================================================== */}
      {isCloseTermModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-brand-navy text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Dönem Kütüğü Resmî Kapanış Onayı</h3>
                <p className="text-xs text-blue-200 mt-0.5">2026 Güz Dönemi</p>
              </div>
              <button
                onClick={() => setIsCloseTermModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseTermSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 space-y-1">
                <strong className="block flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-700" /> Dikkat: Resmî Kütük Kapanışı
                </strong>
                <p className="leading-relaxed text-[11px]">
                  Dönem kütüğü kapatıldığında tüm kursiyer başarı kayıtları kilitlenecektir. Henüz onaylanmamış bekleyen ({awaitingAdminCount}) veya telafi sürecindeki ({remediationCount}) kursiyerlerin durumu kütük kapanış tutanağında belirtilecektir.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kütük Kapanış Tutanağı ve İdari Açıklama *
                </label>
                <textarea
                  rows={3}
                  value={closureNotes}
                  onChange={(e) => setClosureNotes(e.target.value)}
                  placeholder="Örn: 2026 Güz dönemi ders oturumları ve değerlendirme süreçleri tamamlanmış olup tescilli başarı belgeleri kütüğü resmen onaylanmıştır..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCloseTermModalOpen(false)}
                >
                  Vazgeç
                </Button>
                <Button type="submit">Kütüğü Kapat ve Kilitle</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuccessDecisionPage;
