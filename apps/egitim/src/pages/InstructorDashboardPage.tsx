import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Save,
  Users,
  Clock,
  MapPin,
  Layers,
  AlertTriangle,
  History,
  X,
  Lock,
  Edit3,
  FileText,
  ClipboardList,
  Plus,
  Calendar,
  ExternalLink,
  FileCheck,
  Check,
  Award,
  MessageSquare,
  Hash,
  LayoutDashboard,
  ArrowRight,
} from 'lucide-react';
import {
  Session,
  Group,
  AttendanceMarkStatus,
  AttendanceStatus,
  Assignment,
  AssignmentSubmission,
  EvaluationDecision,
  SubmissionType,
  LateSubmissionPolicy,
  AssignmentPublicationStatus,
} from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { PageHeader } from '../components/layout/PageHeader';
import { DashboardContent } from '../components/layout/DashboardContent';
import { getStoredGroups, getGroupCapacityStats } from '../services/enrollmentStorage';
import {
  getSessionsByGroup,
  getOrInitializeSessionAttendance,
  saveDraftAttendance,
  closeSessionAttendance,
  correctAttendanceRecord,
  updateSessionStatus,
  subscribeToSessionUpdates,
  subscribeToAttendanceUpdates,
} from '../services/sessionStorage';
import {
  calculateGroupAttendanceSummary,
  calculateTraineeAttendance,
} from '../services/attendanceEngine';
import {
  getCourseAssignmentsByGroup,
  createCourseAssignment,
  updateCourseAssignment,
  getStoredSubmissions,
  getEvaluationForSubmission,
  evaluateSubmission,
  subscribeToAssignmentUpdates,
} from '../services/assignmentStorage';
import { calculateGroupAssignmentSummary } from '../services/assignmentEngine';
import { calculateBatchEligibility } from '../services/successEngine';

export const InstructorDashboardPage: React.FC = () => {
  const { currentUser } = useDemoRole();

  // Navigation tab: 'overview' | 'attendance' | 'assignments' | 'groups' | 'eligibility'
  type InstructorTab = 'overview' | 'attendance' | 'assignments' | 'groups' | 'eligibility';
  const [activeMainTab, setActiveMainTab] = useState<InstructorTab>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#yoklama') return 'attendance';
      if (hash === '#odevler') return 'assignments';
      if (hash === '#gruplar') return 'groups';
      if (hash === '#ilerleme') return 'eligibility';
    }
    return 'overview';
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#yoklama') setActiveMainTab('attendance');
      else if (hash === '#odevler') setActiveMainTab('assignments');
      else if (hash === '#gruplar') setActiveMainTab('groups');
      else if (hash === '#ilerleme') setActiveMainTab('eligibility');
      else if (!hash) setActiveMainTab('overview');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Groups and Sessions state
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [groupSessions, setGroupSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  // Attendance local state for selected session
  const [sessionAttendance, setSessionAttendance] = useState<{
    recordId: string;
    traineeId: string;
    traineeName: string;
    status: AttendanceMarkStatus;
  }[]>([]);

  // Correction modal state (Attendance)
  const [correctModalRecord, setCorrectModalRecord] = useState<{
    recordId: string;
    traineeName: string;
    currentStatus: AttendanceMarkStatus;
  } | null>(null);
  const [correctNewStatus, setCorrectNewStatus] = useState<AttendanceStatus>('attended');
  const [correctReason, setCorrectReason] = useState('');

  // Feedback message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // =========================================================================
  // ÖDEV YÖNETİMİ & DEĞERLENDİRME MASASI STATE
  // =========================================================================
  const [assignmentSubTab, setAssignmentSubTab] = useState<'list' | 'grading'>('list');
  const [courseAssignments, setCourseAssignments] = useState<Assignment[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<AssignmentSubmission[]>([]);
  const [gradingFilterAssignmentId, setGradingFilterAssignmentId] = useState<string>('all');
  const [gradingFilterStatus, setGradingFilterStatus] = useState<string>('all');

  // Create Assignment Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRelatedSessionId, setNewRelatedSessionId] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDueTime, setNewDueTime] = useState('23:59');
  const [newIsMandatory, setNewIsMandatory] = useState(true);
  const [newAcceptedTypes, setNewAcceptedTypes] = useState<SubmissionType[]>(['text', 'link']);
  const [newLatePolicy, setNewLatePolicy] = useState<LateSubmissionPolicy>('allow_with_flag');
  const [newPubStatus, setNewPubStatus] = useState<AssignmentPublicationStatus>('published');

  // Grading Modal
  const [gradingModalSub, setGradingModalSub] = useState<AssignmentSubmission | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(85);
  const [gradingDecision, setGradingDecision] = useState<EvaluationDecision>('approved');
  const [gradingFeedback, setGradingFeedback] = useState<string>('');
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);

  // =========================================================================
  // DATA LOADING
  // =========================================================================
  const loadData = () => {
    const grps = getStoredGroups();
    setAllGroups(grps);
  };

  const loadAssignmentsData = () => {
    if (selectedGroupId) {
      setCourseAssignments(getCourseAssignmentsByGroup(selectedGroupId, true));
    }
    setAllSubmissions(getStoredSubmissions());
  };

  useEffect(() => {
    loadData();
    const unsub1 = subscribeToSessionUpdates(() => {
      loadData();
      if (selectedGroupId) {
        setGroupSessions(getSessionsByGroup(selectedGroupId));
      }
    });
    const unsub2 = subscribeToAttendanceUpdates(() => {
      if (selectedSessionId && selectedGroupId) {
        refreshSessionAttendance(selectedSessionId, selectedGroupId);
      }
    });
    const unsub3 = subscribeToAssignmentUpdates(() => {
      loadAssignmentsData();
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [selectedGroupId, selectedSessionId]);

  // Filter groups assigned to current instructor
  const instructorAssignedGroups = useMemo(() => {
    const matched = allGroups.filter(
      (g) =>
        g.instructorIds?.includes(currentUser.id) ||
        g.instructorNames?.some((n) => n.toLowerCase().includes(currentUser.fullName.toLowerCase()))
    );

    if (matched.length > 0) return matched;
    const defaultMatched = allGroups.filter((g) => g.instructorIds?.includes('user-instructor-01'));
    return defaultMatched.length > 0 ? defaultMatched : allGroups;
  }, [allGroups, currentUser]);

  // Set default selected group
  useEffect(() => {
    if (
      instructorAssignedGroups.length > 0 &&
      (!selectedGroupId || !instructorAssignedGroups.some((g) => g.id === selectedGroupId))
    ) {
      setSelectedGroupId(instructorAssignedGroups[0].id);
    }
  }, [instructorAssignedGroups, selectedGroupId]);

  const selectedGroup = useMemo(() => {
    return allGroups.find((g) => g.id === selectedGroupId) || instructorAssignedGroups[0] || null;
  }, [allGroups, selectedGroupId, instructorAssignedGroups]);

  // Load sessions and assignments when selected group changes
  useEffect(() => {
    if (selectedGroup) {
      const sessList = getSessionsByGroup(selectedGroup.id);
      setGroupSessions(sessList);

      const openSess = sessList.find((s) => s.status === 'attendance_open' || s.status === 'active');
      const scheduledSess = sessList.find((s) => s.status === 'scheduled');
      const initialSess = openSess || scheduledSess || sessList[0];

      if (initialSess && (!selectedSessionId || !sessList.some((s) => s.id === selectedSessionId))) {
        setSelectedSessionId(initialSess.id);
      }

      loadAssignmentsData();
    }
  }, [selectedGroup]);

  // Selected session object
  const currentSession = useMemo(() => {
    return groupSessions.find((s) => s.id === selectedSessionId) || groupSessions[0] || null;
  }, [groupSessions, selectedSessionId]);

  // Refresh attendance records for selected session
  const refreshSessionAttendance = (sessId: string, grpId: string) => {
    const records = getOrInitializeSessionAttendance(sessId, grpId);
    setSessionAttendance(
      records.map((r) => ({
        recordId: r.id,
        traineeId: r.candidateId || r.traineeId,
        traineeName: r.traineeName,
        status: r.status,
      }))
    );
  };

  useEffect(() => {
    if (currentSession && selectedGroup) {
      refreshSessionAttendance(currentSession.id, selectedGroup.id);
    }
  }, [currentSession, selectedGroup]);

  // Handle local attendance status change
  const handleStatusChange = (traineeId: string, status: AttendanceMarkStatus) => {
    if (currentSession?.status === 'completed') return;
    setSessionAttendance((prev) =>
      prev.map((item) => (item.traineeId === traineeId ? { ...item, status } : item))
    );
  };

  // Attendance counts
  const totalStudents = sessionAttendance.length;
  const attendedCount = sessionAttendance.filter((a) => a.status === 'attended').length;
  const absentCount = sessionAttendance.filter((a) => a.status === 'absent').length;
  const excusedCount = sessionAttendance.filter((a) => a.status === 'excused').length;
  const unmarkedCount = sessionAttendance.filter((a) => a.status === 'unmarked' || !a.status).length;

  // Attendance actions
  const handleOpenAttendance = () => {
    if (!currentSession) return;
    const res = updateSessionStatus(currentSession.id, 'attendance_open', currentUser.fullName);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Oturum ${currentSession.sessionNumber} için manuel yoklama başlatıldı.`,
      });
      loadData();
    }
  };

  const handleSaveDraft = () => {
    if (!currentSession) return;
    const res = saveDraftAttendance(
      currentSession.id,
      sessionAttendance.map((s) => ({ traineeId: s.traineeId, status: s.status })),
      currentUser.fullName
    );
    if (res.success) {
      setFeedback({
        type: 'success',
        message: 'Yoklama taslağı kaydedildi. Eksik işaretlemeler oturum kapatılmadan tamamlanabilir.',
      });
    }
  };

  const handleCloseAttendance = () => {
    if (!currentSession) return;
    const res = closeSessionAttendance(
      currentSession.id,
      sessionAttendance.map((s) => ({ traineeId: s.traineeId, status: s.status })),
      currentUser.fullName
    );

    if (res.success) {
      setFeedback({
        type: 'success',
        message: 'Yoklama başarıyla onaylandı ve oturum kapatıldı. Devam istatistikleri güncellendi.',
      });
      loadData();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Yoklama kapatılamadı.' });
    }
  };

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctModalRecord) return;
    if (!correctReason.trim()) {
      setFeedback({ type: 'error', message: 'Lütfen zorunlu düzeltme gerekçesi belirtiniz.' });
      return;
    }

    const res = correctAttendanceRecord(
      correctModalRecord.recordId,
      correctNewStatus,
      correctReason.trim(),
      currentUser.fullName
    );

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `${correctModalRecord.traineeName} için yoklama düzeltmesi kaydedildi ve denetim tarihçesine eklendi.`,
      });
      setCorrectModalRecord(null);
      setCorrectReason('');
      if (currentSession && selectedGroup) {
        refreshSessionAttendance(currentSession.id, selectedGroup.id);
      }
    } else {
      setFeedback({ type: 'error', message: res.error || 'Düzeltme yapılamadı.' });
    }
  };

  // Group summary (Attendance)
  const groupSummary = useMemo(() => {
    if (!selectedGroup) return null;
    return calculateGroupAttendanceSummary(selectedGroup.id);
  }, [selectedGroup, sessionAttendance]);

  // =========================================================================
  // ASSIGNMENT OPERATIONS
  // =========================================================================

  // Group summary (Assignment)
  const groupAssignmentSummary = useMemo(() => {
    if (!selectedGroup) return null;
    return calculateGroupAssignmentSummary(selectedGroup.id);
  }, [selectedGroup, courseAssignments, allSubmissions]);

  // Sprint E03-C: Grup Kursiyerleri Akademik Başarı Ön Kontrolü
  const groupEligibilityList = useMemo(() => {
    if (!selectedGroup) return [];
    return calculateBatchEligibility(selectedGroup.programId, selectedGroup.termId, selectedGroup.id);
  }, [selectedGroup, sessionAttendance, allSubmissions]);

  // Submissions filtered for grading desk
  const filteredSubmissions = useMemo(() => {
    if (!selectedGroup) return [];

    // Önce seçili grubun ödev kimliklerini al
    const groupAssignmentIds = new Set(courseAssignments.map((a) => a.id));

    return allSubmissions.filter((sub) => {
      if (!groupAssignmentIds.has(sub.assignmentId)) return false;

      if (gradingFilterAssignmentId !== 'all' && sub.assignmentId !== gradingFilterAssignmentId) {
        return false;
      }

      if (gradingFilterStatus !== 'all') {
        if (gradingFilterStatus === 'pending') {
          return sub.status === 'submitted' || sub.status === 'resubmitted';
        }
        return sub.status === gradingFilterStatus;
      }

      return true;
    });
  }, [allSubmissions, courseAssignments, selectedGroup, gradingFilterAssignmentId, gradingFilterStatus]);

  // Toplam bekleyen ödev sayısı
  const pendingGradingCount = useMemo(() => {
    const groupAssignmentIds = new Set(courseAssignments.map((a) => a.id));
    return allSubmissions.filter(
      (s) =>
        groupAssignmentIds.has(s.assignmentId) &&
        (s.status === 'submitted' || s.status === 'resubmitted')
    ).length;
  }, [allSubmissions, courseAssignments]);

  const pendingGradingSubmissions = useMemo(() => {
    const groupAssignmentIds = new Set(courseAssignments.map((a) => a.id));
    return allSubmissions.filter(
      (s) =>
        groupAssignmentIds.has(s.assignmentId) &&
        (s.status === 'submitted' || s.status === 'resubmitted')
    );
  }, [allSubmissions, courseAssignments]);

  // Yeni Ödev Oluşturma Formu
  const handleCreateAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    if (!newTitle.trim()) {
      setFeedback({ type: 'error', message: 'Lütfen ödev başlığı giriniz.' });
      return;
    }
    if (!newDueDate) {
      setFeedback({ type: 'error', message: 'Lütfen son teslim tarihi seçiniz.' });
      return;
    }

    const dueAtIso = `${newDueDate}T${newDueTime}:00+03:00`;

    const res = createCourseAssignment({
      title: newTitle.trim(),
      description: newDescription.trim(),
      programId: selectedGroup.programId,
      termId: selectedGroup.termId,
      cohortName: selectedGroup.cohortName,
      groupId: selectedGroup.id,
      groupName: selectedGroup.name,
      instructorId: currentUser.id,
      instructorName: currentUser.fullName,
      relatedSessionId: newRelatedSessionId || undefined,
      assignedAt: new Date().toISOString(),
      dueAt: dueAtIso,
      dueDate: `${newDueDate} (${newDueTime})`,
      maxScore: 100,
      isMandatory: newIsMandatory,
      acceptedSubmissionTypes: newAcceptedTypes,
      lateSubmissionPolicy: newLatePolicy,
      publicationStatus: newPubStatus,
    });

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `"${newTitle}" ödevi ${newPubStatus === 'published' ? 'başarıyla yayınlandı' : 'taslak olarak kaydedildi'}.`,
      });
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
      loadAssignmentsData();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Ödev oluşturulamadı.' });
    }
  };

  // Taslaktaki ödevi yayına alma
  const handlePublishAssignment = (asgnId: string) => {
    const res = updateCourseAssignment(asgnId, { publicationStatus: 'published' });
    if (res.success) {
      setFeedback({ type: 'success', message: 'Ödev başarıyla yayına alındı ve kursiyerlere açıldı.' });
      loadAssignmentsData();
    } else {
      setFeedback({ type: 'error', message: 'Ödev yayınlanamadı.' });
    }
  };

  // Değerlendirme Modalı Açma
  const handleOpenGradingModal = (sub: AssignmentSubmission) => {
    setGradingModalSub(sub);
    const existingEval = getEvaluationForSubmission(sub.id);
    if (existingEval) {
      setGradingScore(existingEval.score);
      setGradingDecision(existingEval.decision);
      setGradingFeedback(existingEval.feedback);
    } else {
      setGradingScore(85);
      setGradingDecision('approved');
      setGradingFeedback('');
    }
    setShowRevisionHistory(false);
  };

  // Değerlendirme Kaydetme
  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingModalSub) return;

    if (gradingDecision === 'revision_requested' && !gradingFeedback.trim()) {
      setFeedback({
        type: 'error',
        message: 'Revizyon talebinde bulunurken kursiyere yönlendirici gerekçe yazılması zorunludur.',
      });
      return;
    }

    const res = evaluateSubmission({
      submissionId: gradingModalSub.id,
      evaluatorId: currentUser.id,
      evaluatorName: currentUser.fullName,
      score: Number(gradingScore),
      feedback: gradingFeedback.trim(),
      decision: gradingDecision,
    });

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `${gradingModalSub.traineeName} kursiyerinin teslimi "${
          gradingDecision === 'approved'
            ? 'Onaylandı'
            : gradingDecision === 'revision_requested'
            ? 'Revizyon İstendi'
            : 'Reddedildi'
        }" kararıyla puanlandı (${gradingScore}/100).`,
      });
      setGradingModalSub(null);
      loadAssignmentsData();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Değerlendirme kaydedilemedi.' });
    }
  };

  return (
    <DashboardContent className="space-y-6">
      {/* Top Header */}
      <PageHeader
        category="EĞİTİM OPERASYON MASASI"
        title={`${currentUser.fullName} — Eğitmen Masası`}
        description="Ders oturumları, manuel yoklama girişleri, ödev değerlendirmeleri ve kursiyer devam/başarı durumunu tek merkezden yönetin."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/egitmen/mesajlar"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Kursiyer Mesajları</span>
            </Link>
            <Link
              to="/egitmen/kanallar"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <Hash className="w-3.5 h-3.5 text-blue-600" />
              <span>Sınıf Kanalları</span>
            </Link>
          </div>
        }
      />

      {/* Ana İşlem Sekmeleri (Tab Switcher) */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveMainTab('overview')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeMainTab === 'overview'
              ? 'border-blue-600 text-brand-navy'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-blue-600" />
          <span>Genel Bakış</span>
        </button>

        <button
          onClick={() => setActiveMainTab('attendance')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeMainTab === 'attendance'
              ? 'border-blue-600 text-brand-navy'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-blue-600" />
          <span>Derslerim & Yoklama</span>
        </button>

        <button
          onClick={() => setActiveMainTab('assignments')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeMainTab === 'assignments'
              ? 'border-blue-600 text-brand-navy'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Ödevler & Değerlendirme</span>
          {pendingGradingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
              {pendingGradingCount} Bekleyen
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveMainTab('groups')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeMainTab === 'groups'
              ? 'border-blue-600 text-brand-navy'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4 text-blue-600" />
          <span>Gruplarım</span>
        </button>

        <button
          onClick={() => setActiveMainTab('eligibility')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
            activeMainTab === 'eligibility'
              ? 'border-blue-600 text-brand-navy'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Award className="w-4 h-4 text-blue-600" />
          <span>Kursiyer İlerlemesi</span>
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

      {/* Assigned Groups Tabs (Ortak Grup Seçici) */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 px-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-600" /> Atanmış Gruplarım:
        </span>
        {instructorAssignedGroups.map((grp) => {
          const stats = getGroupCapacityStats(grp.id);
          const isSelected = grp.id === selectedGroup?.id;
          return (
            <button
              key={grp.id}
              onClick={() => setSelectedGroupId(grp.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-brand-navy text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{grp.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {stats.assignedCount} Kursiyer
              </span>
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* 0. SEKME — GENEL BAKIŞ (Executive Overview) */}
      {/* ===================================================================== */}
      {activeMainTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Atanmış Gruplarım</div>
              <div className="text-2xl font-black text-brand-navy mt-1">
                {instructorAssignedGroups.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Aktif eğitim grubu</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Planlanan Oturumlar</div>
              <div className="text-2xl font-black text-blue-600 mt-1">
                {groupSessions.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {groupSessions.filter((s) => s.status === 'completed').length} tamamlandı
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Yoklama Bekleyen</div>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {groupSessions.filter((s) => s.status === 'attendance_open' || s.status === 'scheduled').length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Açık / planlı oturum</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Değerlendirme Bekleyen</div>
              <div className="text-2xl font-black text-indigo-600 mt-1">
                {pendingGradingCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Ödev teslimi incelenecek</div>
            </div>
          </div>

          {/* 2-Column Split: Upcoming Sessions & Pending Submissions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sol Panel: Yaklaşan Oturumlar */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-sm text-slate-900">
                      Yaklaşan & Güncel Oturumlar
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveMainTab('attendance')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>Tümünü Gör</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {groupSessions.slice(0, 3).map((sess) => (
                    <div
                      key={sess.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            Oturum {sess.sessionNumber}: {sess.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {sess.date} • {sess.startTime} - {sess.endTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {sess.location}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedSessionId(sess.id);
                          setActiveMainTab('attendance');
                        }}
                        className="px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold hover:bg-blue-100 text-[11px] shrink-0"
                      >
                        Yoklama Al
                      </button>
                    </div>
                  ))}
                  {groupSessions.length === 0 && (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      Planlanmış ders oturumu bulunmuyor.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sağ Panel: Değerlendirme Bekleyen Ödevler */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-sm text-slate-900">
                      Değerlendirme Bekleyen Teslimler
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setActiveMainTab('assignments');
                      setAssignmentSubTab('grading');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>Masaya Git</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {pendingGradingSubmissions.slice(0, 3).map((sub) => {
                    const asgn = courseAssignments.find((a) => a.id === sub.assignmentId);
                    return (
                      <div
                        key={sub.id}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900">{sub.traineeName}</div>
                          <div className="text-[11px] text-slate-500">
                            {asgn?.title || 'Ödev'} • Sürüm v{sub.submissionVersion}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => {
                            const prevEval = getEvaluationForSubmission(sub.id);
                            setGradingModalSub(sub);
                            setGradingScore(prevEval?.score ?? 80);
                            setGradingDecision(prevEval?.decision ?? 'approved');
                            setGradingFeedback(prevEval?.feedback || '');
                          }}
                        >
                          Puanla
                        </Button>
                      </div>
                    );
                  })}
                  {pendingGradingSubmissions.length === 0 && (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      İncelenmeyi bekleyen ödev teslimi bulunmuyor.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hızlı İşlemler Kartı */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-600 font-medium">
              Eğitmen operasyonlarını hızlandırmak için kısayollar:
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveMainTab('assignments');
                  setIsCreateModalOpen(true);
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1 text-blue-600" /> Yeni Ödev Tanımla
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveMainTab('eligibility')}
              >
                <Award className="w-3.5 h-3.5 mr-1 text-blue-600" /> Kursiyer İlerlemesi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* GRUPLARIM SEKME İÇERİĞİ */}
      {/* ===================================================================== */}
      {activeMainTab === 'groups' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {instructorAssignedGroups.map((grp) => {
              const stats = getGroupCapacityStats(grp.id);
              const gSum = calculateGroupAttendanceSummary(grp.id);
              const isSelected = grp.id === selectedGroup?.id;

              return (
                <div
                  key={grp.id}
                  className={`p-5 rounded-xl border transition ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                        {grp.cohortName}
                      </span>
                      <h4 className="text-base font-bold text-slate-950 mt-0.5">{grp.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{grp.programTitle}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                      {stats.assignedCount} / {grp.capacity} Kursiyer
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ders Programı:</span>
                      <span className="font-semibold text-slate-800">{grp.scheduleSummary}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ortalama Devam:</span>
                      <span className="font-bold text-emerald-700">
                        {gSum.averageAttendanceRate !== null
                          ? `%${gSum.averageAttendanceRate}`
                          : 'Henüz hesaplanmadı'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedGroupId(grp.id);
                        setActiveMainTab('attendance');
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Yoklama Aç
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGroupId(grp.id);
                        setActiveMainTab('assignments');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-brand-navy text-white text-xs font-semibold hover:bg-slate-800"
                    >
                      Ödevleri Yönet
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. SEKME — DERS OTURUMLARI & MANUEL YOKLAMA (Sprint E03-A) */}
      {/* ===================================================================== */}
      {activeMainTab === 'attendance' && (
        <>
          {/* Group Sessions Bar (Oturum Seçici) */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
              <span className="font-bold text-slate-800">
                {selectedGroup?.programTitle} — Oturum Takvimi ({groupSessions.length} Oturum)
              </span>
              <span className="text-slate-500">Yoklama almak için oturuma tıklayınız</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 text-xs">
              {groupSessions.length === 0 ? (
                <span className="text-slate-400 italic py-2">Bu grup için henüz oturum planlanmamış.</span>
              ) : (
                groupSessions.map((sess) => {
                  const isSelected = sess.id === currentSession?.id;
                  const isCompleted = sess.status === 'completed';
                  const isOpen = sess.status === 'attendance_open' || sess.status === 'active';
                  const isCancelled = sess.status === 'cancelled';

                  return (
                    <button
                      key={sess.id}
                      onClick={() => setSelectedSessionId(sess.id)}
                      className={`px-3 py-2 rounded-lg border text-left shrink-0 transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">Oturum {sess.sessionNumber}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isOpen
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : isCancelled
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isCompleted
                            ? 'Tamamlandı'
                            : isOpen
                            ? 'Yoklama Açık'
                            : isCancelled
                            ? 'İptal'
                            : 'Planlandı'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 truncate max-w-[180px]">
                        {sess.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{sess.date}</div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* MANUEL YOKLAMA MASASI (Aktif Oturum Kartı) */}
          {currentSession ? (
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Header Info */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
                        Seçili Ders Oturumu
                      </span>
                      <span className="text-xs text-slate-500">{currentSession.date}</span>
                      <span className="text-xs font-semibold text-blue-800">• {selectedGroup?.name}</span>
                    </div>
                    <h3 className="text-base font-bold text-brand-textPrimary mt-1">
                      Oturum {currentSession.sessionNumber}: {currentSession.title}
                    </h3>
                    <p className="text-xs text-brand-textSecondary mt-0.5 flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Saat: <strong>{currentSession.startTime} - {currentSession.endTime}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        Konum: <strong>{currentSession.location}</strong>
                      </span>
                      {currentSession.topic && (
                        <span className="text-slate-500 italic max-w-md truncate">
                          Konu: {currentSession.topic}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Status & Open Attendance Action */}
                  <div className="shrink-0 flex items-center gap-2">
                    {currentSession.status === 'scheduled' && (
                      <Button size="sm" onClick={handleOpenAttendance}>
                        Yoklamayı Başlat
                      </Button>
                    )}
                    {currentSession.status === 'completed' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Yoklama Kapatıldı ({currentSession.attendanceClosedAt})</span>
                      </span>
                    )}
                    {(currentSession.status === 'attendance_open' || currentSession.status === 'active') && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Manuel Yoklama Süreci Aktif</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Live Tally Counter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="font-semibold text-slate-700">
                      Kayıtlı Kursiyer: <strong className="text-slate-900 tabular-nums">{totalStudents} Kişi</strong>
                    </span>
                    <span className="text-emerald-700 font-semibold">
                      Katıldı: <strong className="tabular-nums">{attendedCount}</strong>
                    </span>
                    <span className="text-brand-danger font-semibold">
                      Katılmadı: <strong className="tabular-nums">{absentCount}</strong>
                    </span>
                    <span className="text-amber-700 font-semibold">
                      Mazeretli: <strong className="tabular-nums">{excusedCount}</strong>
                    </span>
                    {unmarkedCount > 0 && (
                      <span className="text-slate-500 font-medium italic bg-amber-100/70 px-2 py-0.5 rounded text-[11px]">
                        ({unmarkedCount} Henüz İşaretlenmedi)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 italic">
                    * Henüz İşaretlenmedi, Katılmadı anlamına gelmez. QR yoklama sistemi yoktur.
                  </div>
                </div>

                {/* Attendance Roster Table */}
                {sessionAttendance.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold text-sm text-slate-700">Bu grupta kayıtlı kursiyer bulunmuyor.</p>
                  </div>
                ) : (
                  <div className="border border-brand-border rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-brand-border">
                        <tr>
                          <th className="py-3 px-4">No</th>
                          <th className="py-3 px-4">Kursiyer Adı Soyadı</th>
                          <th className="py-3 px-3">Genel Devam Oranı</th>
                          <th className="py-3 px-4 text-center">Katıldı</th>
                          <th className="py-3 px-4 text-center">Katılmadı</th>
                          <th className="py-3 px-4 text-center">Mazeretli</th>
                          <th className="py-3 px-4 text-center">İşaretlenmedi</th>
                          {currentSession.status === 'completed' && (
                            <th className="py-3 px-4 text-right">Düzeltme</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sessionAttendance.map((item, idx) => {
                          const traineeCalc = calculateTraineeAttendance(
                            item.traineeId,
                            selectedGroup?.id || ''
                          );
                          const isLocked = currentSession.status === 'completed';

                          return (
                            <tr key={item.traineeId} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-900">
                                {item.traineeName}
                              </td>
                              <td className="py-3 px-3">
                                {traineeCalc.attendanceRate !== null ? (
                                  <span
                                    className={`font-bold tabular-nums ${
                                      traineeCalc.hasPassedThreshold
                                        ? 'text-emerald-700'
                                        : 'text-red-700'
                                    }`}
                                  >
                                    %{traineeCalc.attendanceRate}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">
                                    Henüz Hesaplanamıyor
                                  </span>
                                )}
                              </td>
                              {/* Katıldı */}
                              <td className="py-3 px-4 text-center">
                                <input
                                  type="radio"
                                  name={`status-${item.traineeId}`}
                                  checked={item.status === 'attended'}
                                  disabled={isLocked}
                                  onChange={() => handleStatusChange(item.traineeId, 'attended')}
                                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-60"
                                />
                              </td>
                              {/* Katılmadı */}
                              <td className="py-3 px-4 text-center">
                                <input
                                  type="radio"
                                  name={`status-${item.traineeId}`}
                                  checked={item.status === 'absent'}
                                  disabled={isLocked}
                                  onChange={() => handleStatusChange(item.traineeId, 'absent')}
                                  className="w-4 h-4 text-red-600 focus:ring-red-500 cursor-pointer disabled:opacity-60"
                                />
                              </td>
                              {/* Mazeretli */}
                              <td className="py-3 px-4 text-center">
                                <input
                                  type="radio"
                                  name={`status-${item.traineeId}`}
                                  checked={item.status === 'excused'}
                                  disabled={isLocked}
                                  onChange={() => handleStatusChange(item.traineeId, 'excused')}
                                  className="w-4 h-4 text-amber-600 focus:ring-amber-500 cursor-pointer disabled:opacity-60"
                                />
                              </td>
                              {/* İşaretlenmedi */}
                              <td className="py-3 px-4 text-center">
                                <input
                                  type="radio"
                                  name={`status-${item.traineeId}`}
                                  checked={item.status === 'unmarked' || !item.status}
                                  disabled={isLocked}
                                  onChange={() => handleStatusChange(item.traineeId, 'unmarked')}
                                  className="w-4 h-4 text-slate-400 focus:ring-slate-400 cursor-pointer disabled:opacity-60"
                                />
                              </td>
                              {/* Düzeltme Butonu (Kapatılmış yoklamalar için) */}
                              {isLocked && (
                                <td className="py-3 px-4 text-right">
                                  <button
                                    onClick={() =>
                                      setCorrectModalRecord({
                                        recordId: item.recordId,
                                        traineeName: item.traineeName,
                                        currentStatus: item.status,
                                      })
                                    }
                                    className="text-xs text-purple-700 hover:text-purple-900 font-semibold hover:underline inline-flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" /> Düzelt
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Operations Footer */}
                {currentSession.status !== 'completed' && (
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      {unmarkedCount > 0 ? (
                        <span className="text-amber-800 font-medium">
                          ⚠️ {unmarkedCount} kursiyer için yoklama işaretlenmemiştir. Yoklamayı kapatmak için tüm kayıtlar işaretlenmelidir.
                        </span>
                      ) : (
                        <span className="text-emerald-800 font-medium">
                          ✓ Tüm kursiyerler işaretlendi. Yoklamayı onaylayıp oturumu kapatabilirsiniz.
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Save className="w-4 h-4" />}
                        onClick={handleSaveDraft}
                      >
                        Taslak Kaydet
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        onClick={handleCloseAttendance}
                        disabled={unmarkedCount > 0}
                      >
                        Yoklamayı Onayla ve Oturumu Kapat
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-slate-500 space-y-2">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="font-bold text-slate-800">Lütfen yukarıdan bir oturum seçiniz.</h3>
              </CardContent>
            </Card>
          )}

          {/* Gruba Göre Devam Özeti Kartı */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {selectedGroup?.name} — Devam Durumu Özeti
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between p-2.5 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-600">Toplam Oturum:</span>
                    <strong className="text-slate-900">{groupSummary?.totalSessions || 0}</strong>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-600">Tamamlanan Oturum:</span>
                    <strong className="text-emerald-700">{groupSummary?.completedSessions || 0}</strong>
                  </div>
                  <div className="flex justify-between p-2.5 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-600">Grup Devam Ortalaması:</span>
                    <strong className="text-blue-700 font-bold">
                      {groupSummary?.averageAttendanceRate !== null
                        ? `%${groupSummary?.averageAttendanceRate}`
                        : 'Henüz Hesaplanamıyor'}
                    </strong>
                  </div>
                  <div className="flex justify-between p-2.5 bg-red-50/60 rounded border border-red-200">
                    <span className="text-red-800 font-medium">%80 Devam Barajı Altındaki Kursiyer:</span>
                    <strong className="text-red-700 font-bold">
                      {groupSummary?.atRiskTraineesCount || 0} Kursiyer
                    </strong>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Tüm Atanmış Gruplarım
                </h3>

                <div className="space-y-2.5 text-xs">
                  {instructorAssignedGroups.map((grp) => {
                    const stats = getGroupCapacityStats(grp.id);
                    const gSum = calculateGroupAttendanceSummary(grp.id);
                    return (
                      <div key={grp.id} className="p-3 border border-slate-200 rounded-lg space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{grp.name}</span>
                          <span className="text-blue-600 font-semibold">{grp.cohortName}</span>
                        </div>
                        <div className="text-slate-500 text-[11px] flex justify-between">
                          <span>
                            {stats.assignedCount} / {grp.capacity} Kursiyer • {grp.scheduleSummary}
                          </span>
                          <span className="font-semibold text-emerald-700">
                            {gSum.averageAttendanceRate !== null
                              ? `%${gSum.averageAttendanceRate} Devam`
                              : 'Devam Hesaplanamıyor'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* ===================================================================== */}
      {/* 2. SEKME — ÖDEV YÖNETİMİ & DEĞERLENDİRME MASASI (Sprint E03-B) */}
      {/* ===================================================================== */}
      {activeMainTab === 'assignments' && (
        <div className="space-y-6">
          {/* Subtabs for Assignments */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAssignmentSubTab('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  assignmentSubTab === 'list'
                    ? 'bg-brand-navy text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Grup Ödevleri ({courseAssignments.length})</span>
              </button>
              <button
                onClick={() => setAssignmentSubTab('grading')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  assignmentSubTab === 'grading'
                    ? 'bg-brand-navy text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Teslim Değerlendirme Masası</span>
                {pendingGradingCount > 0 && (
                  <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                    {pendingGradingCount}
                  </span>
                )}
              </button>
            </div>

            <Button
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Yeni Ödev Tanımla
            </Button>
          </div>

          {/* Ödev Özet İstatistikleri Kartı */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium">Yayınlanan Ödev</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                {groupAssignmentSummary?.publishedAssignments || 0}
              </div>
              <div className="text-[10px] text-slate-400">
                {groupAssignmentSummary?.draftAssignments || 0} Taslak
              </div>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium">Gelen Teslimler</div>
              <div className="text-xl font-extrabold text-blue-700 mt-0.5">
                {groupAssignmentSummary?.totalSubmissions || 0}
              </div>
              <div className="text-[10px] text-slate-400">
                {groupAssignmentSummary?.approvedSubmissions || 0} Onaylandı
              </div>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-amber-200 bg-amber-50/30 shadow-xs">
              <div className="text-[11px] text-amber-900 font-medium">Değerlendirme Bekleyen</div>
              <div className="text-xl font-extrabold text-amber-700 mt-0.5">
                {groupAssignmentSummary?.pendingEvaluations || 0}
              </div>
              <div className="text-[10px] text-amber-800">
                {groupAssignmentSummary?.revisionRequests || 0} Revizyon İstendi
              </div>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium">Grup Not Ortalaması</div>
              <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
                {groupAssignmentSummary?.groupAverageScore !== null
                  ? `${groupAssignmentSummary?.groupAverageScore} / 100`
                  : 'Hesaplanamıyor'}
              </div>
              <div className="text-[10px] text-slate-400">Baraj: En az 70/100</div>
            </div>
          </div>

          {/* SUBTAB 1: ÖDEV LİSTESİ */}
          {assignmentSubTab === 'list' && (
            <div className="space-y-4">
              {courseAssignments.length === 0 ? (
                <div className="p-10 text-center bg-white rounded-xl border border-dashed border-slate-300 space-y-2">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-800">Bu grupta henüz tanımlanmış ödev bulunmuyor.</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Yukarıdaki "Yeni Ödev Tanımla" butonunu kullanarak bu grup için ilk ödevi oluşturabilirsiniz.
                  </p>
                </div>
              ) : (
                courseAssignments.map((asgn) => {
                  const subs = allSubmissions.filter((s) => s.assignmentId === asgn.id);
                  const isDraft = asgn.publicationStatus === 'draft';

                  return (
                    <div
                      key={asgn.id}
                      className={`p-5 rounded-xl border bg-white shadow-xs transition-all space-y-3 ${
                        isDraft ? 'border-dashed border-amber-300 bg-amber-50/20' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {asgn.isMandatory ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                Zorunlu Ödev
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                İsteğe Bağlı
                              </span>
                            )}

                            {isDraft ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                                Taslak (Kursiyere Görünmez)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                Yayında
                              </span>
                            )}

                            <span className="text-xs text-slate-500">
                              Son Teslim: <strong>{asgn.dueDate || asgn.dueAt}</strong>
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-brand-navy">{asgn.title}</h3>
                          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                            {asgn.description}
                          </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {isDraft && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handlePublishAssignment(asgn.id)}
                            >
                              Yayına Al
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => {
                              setGradingFilterAssignmentId(asgn.id);
                              setAssignmentSubTab('grading');
                            }}
                          >
                            Teslimleri İncele ({subs.length})
                          </Button>
                        </div>
                      </div>

                      {/* Teslim Tipleri & İstatistikler */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                        <div className="flex items-center gap-4">
                          <span>
                            Kabul Edilen Teslim Türleri:{' '}
                            <strong className="text-slate-800">
                              {asgn.acceptedSubmissionTypes?.map((t) => (t === 'text' ? 'Metin' : t === 'link' ? 'Bağlantı URL' : 'Dosya')).join(', ')}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Maksimum Puan: <strong className="text-slate-800">{asgn.maxScore}</strong>
                          </span>
                        </div>
                        <div>
                          <span>Toplam Teslim: <strong>{subs.length}</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* SUBTAB 2: TESLİM DEĞERLENDİRME MASASI */}
          {assignmentSubTab === 'grading' && (
            <div className="space-y-4">
              {/* Filtre Barı */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold text-slate-600">Ödev Filtresi:</span>
                  <select
                    value={gradingFilterAssignmentId}
                    onChange={(e) => setGradingFilterAssignmentId(e.target.value)}
                    className="border border-slate-300 rounded-lg p-2 bg-slate-50 text-xs font-medium text-slate-800"
                  >
                    <option value="all">Tüm Ödevler ({courseAssignments.length})</option>
                    {courseAssignments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="font-semibold text-slate-600 mr-1">Durum:</span>
                  {[
                    { key: 'all', label: 'Tümü' },
                    { key: 'pending', label: 'Değerlendirme Bekleyen' },
                    { key: 'revision_requested', label: 'Revizyon İstendi' },
                    { key: 'approved', label: 'Onaylandı' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setGradingFilterStatus(f.key)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                        gradingFilterStatus === f.key
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submissions Table */}
              {filteredSubmissions.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Seçili filtreye uygun teslim kaydı bulunamadı.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Kursiyer Adı</th>
                        <th className="py-3 px-4">Ödev Başlığı</th>
                        <th className="py-3 px-3 text-center">Sürüm</th>
                        <th className="py-3 px-3">Teslim Tarihi</th>
                        <th className="py-3 px-3 text-center">Geç Teslim</th>
                        <th className="py-3 px-3 text-center">Durum</th>
                        <th className="py-3 px-3 text-center">Puan</th>
                        <th className="py-3 px-4 text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSubmissions.map((sub) => {
                        const asgn = courseAssignments.find((a) => a.id === sub.assignmentId);
                        const evalRecord = getEvaluationForSubmission(sub.id);
                        const isPending = sub.status === 'submitted' || sub.status === 'resubmitted';

                        return (
                          <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {sub.traineeName}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800 line-clamp-1">
                                {asgn?.title || sub.assignmentId}
                              </div>
                              {asgn?.isMandatory && (
                                <span className="text-[10px] text-red-700 font-bold">Zorunlu</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-slate-600">
                              v{sub.submissionVersion}
                            </td>
                            <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                              {new Date(sub.submittedAt).toLocaleDateString('tr-TR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {sub.isLate ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                                  Geç Teslim
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                                  Zamanında
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {sub.status === 'approved' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Onaylandı
                                </span>
                              ) : sub.status === 'revision_requested' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Revizyon İstendi
                                </span>
                              ) : sub.status === 'resubmitted' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 animate-pulse">
                                  Yeniden Teslim
                                </span>
                              ) : isPending ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 animate-pulse">
                                  Değerlendirme Bekliyor
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                                  {sub.status}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center font-bold tabular-nums">
                              {evalRecord ? (
                                <span className={evalRecord.score >= 70 ? 'text-emerald-700' : 'text-red-700'}>
                                  {evalRecord.score} / 100
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal italic">Puan Yok</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                size="sm"
                                variant={isPending ? 'primary' : 'outline'}
                                onClick={() => handleOpenGradingModal(sub)}
                              >
                                {isPending ? 'Not Ver' : 'Düzenle'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. SEKME — KURSİYER AKADEMİK BAŞARI ÖN KONTROLÜ (Sprint E03-C) */}
      {/* ===================================================================== */}
      {activeMainTab === 'eligibility' && (
        <div className="space-y-6">
          {/* Başlık ve KPI Özeti */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium">Grup Kursiyeri</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                {groupEligibilityList.length}
              </div>
              <div className="text-[10px] text-slate-400">Aktif Kesin Kayıt</div>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium">Akademik Şartları Sağlayan</div>
              <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
                {groupEligibilityList.filter((e) => e.academicEligible).length}
              </div>
              <div className="text-[10px] text-emerald-600">%80 Devam & 70 Not & Zorunlu Tam</div>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium">Eksik Akademik Koşulu Olan</div>
              <div className="text-xl font-extrabold text-amber-700 mt-0.5">
                {groupEligibilityList.filter((e) => !e.academicEligible).length}
              </div>
              <div className="text-[10px] text-amber-600">Devam / Ödev / Onay Eksik</div>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500 font-medium">Yönetici Nihai Onayı</div>
              <div className="text-xl font-extrabold text-blue-700 mt-0.5">
                {groupEligibilityList.filter((e) => e.finalStatus === 'admin_approved').length}
              </div>
              <div className="text-[10px] text-blue-600">Oda Yönetimince Onaylandı</div>
            </div>
          </div>

          {/* Bilgilendirme */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-700">
            <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-slate-900">
                Kursiyer Akademik İlerleme Takibi
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Bu ekran eğitmenler için ders oturumu devam ve ödev tamamlama süreçlerinin izlendiği takip görünümüdür.
                Kursiyerlerin dijital başarı belgesine hak kazanabilmesi için %80 devam, 70/100 ödev ortalaması, tüm zorunlu ödevlerin onayı ve ardından İslahiye Ticaret Odası yönetiminin nihai onay kararı gereklidir.
              </p>
            </div>
          </div>

          {/* Grup Kursiyerleri Akademik Ön Kontrol Tablosu */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedGroup?.name} — Kursiyer Akademik Durum ve Ön Kontrol Kütüğü
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  İlk 3 şart (Devam, Ödev Ortalaması, Zorunlu Ödev Onayları) sistem tarafından dinamik hesaplanır.
                </p>
              </div>
              <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                Grup: <strong>{selectedGroup?.programTitle}</strong>
              </span>
            </div>

            {groupEligibilityList.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                Bu gruba atanmış kesin kayıtlı kursiyer bulunamadı.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">Kursiyer</th>
                      <th className="py-3 px-3 text-center">1. Devam Oranı (%80)</th>
                      <th className="py-3 px-3 text-center">2. Ödev Ort. (70/100)</th>
                      <th className="py-3 px-3 text-center">3. Zorunlu Onaylar</th>
                      <th className="py-3 px-3 text-center">Akademik Ön Kontrol</th>
                      <th className="py-3 px-3 text-center">4. Yönetici Kararı (Salt Okunur)</th>
                      <th className="py-3 px-3 text-right">Eğitmen İncelemesi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groupEligibilityList.map((trainee) => {
                      return (
                        <tr key={trainee.enrollmentId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{trainee.traineeName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Kayıt: {trainee.enrollmentId}
                            </div>
                          </td>

                          {/* 1. Devam */}
                          <td className="py-3 px-3 text-center">
                            {trainee.attendanceRate !== null ? (
                              <div>
                                <span
                                  className={`inline-block font-extrabold tabular-nums px-2 py-0.5 rounded text-[11px] ${
                                    trainee.attendanceEligible
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  %{trainee.attendanceRate}
                                </span>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {trainee.attendedCount}/{trainee.completedSessionsCount} Oturum
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Hesaplanamıyor</span>
                            )}
                          </td>

                          {/* 2. Ödev Ortalaması */}
                          <td className="py-3 px-3 text-center">
                            {trainee.assignmentAverage !== null ? (
                              <div>
                                <span
                                  className={`inline-block font-extrabold tabular-nums px-2 py-0.5 rounded text-[11px] ${
                                    trainee.gradeEligible
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {trainee.assignmentAverage} / 100
                                </span>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {trainee.gradeEligible ? 'Baraj Üzerinde' : 'Baraj Altında'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Not Yok</span>
                            )}
                          </td>

                          {/* 3. Zorunlu Ödev Onayları */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block font-bold tabular-nums px-2 py-0.5 rounded text-[11px] ${
                                trainee.mandatoryEligible
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {trainee.mandatoryAssignmentsApproved} / {trainee.mandatoryAssignmentsTotal}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {trainee.mandatoryEligible ? 'Tamamı Onaylı' : 'Eksik Onay'}
                            </div>
                          </td>

                          {/* Akademik Ön Kontrol */}
                          <td className="py-3 px-3 text-center">
                            {trainee.academicEligible ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                3/3 Şart Sağlandı
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Eksik Koşul ({trainee.incompleteRequirements.length})
                              </span>
                            )}
                          </td>

                          {/* 4. Yönetici Kararı */}
                          <td className="py-3 px-3 text-center">
                            {trainee.finalStatus === 'admin_approved' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-block">
                                Nihai Onay Verildi
                              </span>
                            ) : trainee.finalStatus === 'remediation' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300 inline-block">
                                Telafi Sürecinde
                              </span>
                            ) : trainee.finalStatus === 'rejected' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 inline-block">
                                Başarısız
                              </span>
                            ) : trainee.academicEligible ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 inline-block">
                                Yönetici Kararı Bekleniyor
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 inline-block">
                                Ön Koşullar Bekleniyor
                              </span>
                            )}
                          </td>

                          {/* Eğitmen İşlemleri (Kesinlikle yönetici onay butonu yok) */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setActiveMainTab('assignments');
                                  setAssignmentSubTab('grading');
                                }}
                                className="text-[11px] py-1 px-2"
                              >
                                Ödev Değerlendir
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setActiveMainTab('attendance');
                                }}
                                className="text-[11px] py-1 px-2"
                              >
                                Yoklama
                              </Button>
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
        </div>
      )}

      {/* ===================================================================== */}
      {/* YENİ ÖDEV TANIMLAMA MODALI */}
      {/* ===================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-brand-navy text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Grup İçin Yeni Ödev Tanımla</h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Hedef Grup: <strong>{selectedGroup?.name}</strong> ({selectedGroup?.programTitle})
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignmentSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ödev Başlığı (Zorunlu) *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Örn: Ödev #4: İhracat Akreditif Şablonu Hazırlama"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ödev Açıklaması ve Yönergeler *
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Kursiyerden beklenen çıktıları, standartları ve teslim formatını belirtiniz..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    İlişkili Ders Oturumu (Opsiyonel)
                  </label>
                  <select
                    value={newRelatedSessionId}
                    onChange={(e) => setNewRelatedSessionId(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50"
                  >
                    <option value="">İlişkisiz / Genel Program Ödevi</option>
                    {groupSessions.map((sess) => (
                      <option key={sess.id} value={sess.id}>
                        Oturum {sess.sessionNumber}: {sess.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Zorunluluk Durumu *
                  </label>
                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="mandatoryRadio"
                        checked={newIsMandatory}
                        onChange={() => setNewIsMandatory(true)}
                        className="text-blue-600"
                      />
                      <span className="font-semibold text-slate-900">Zorunlu (Onay Şart)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="mandatoryRadio"
                        checked={!newIsMandatory}
                        onChange={() => setNewIsMandatory(false)}
                        className="text-slate-600"
                      />
                      <span className="text-slate-600">İsteğe Bağlı</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Son Teslim Tarihi (Europe/Istanbul) *
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Saat *</label>
                  <input
                    type="time"
                    value={newDueTime}
                    onChange={(e) => setNewDueTime(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                    required
                  />
                </div>
              </div>

              {/* Kabul Edilen Teslim Türleri */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  İzin Verilen Teslim Formatları
                </label>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAcceptedTypes.includes('text')}
                      onChange={(e) => {
                        if (e.target.checked) setNewAcceptedTypes([...newAcceptedTypes, 'text']);
                        else setNewAcceptedTypes(newAcceptedTypes.filter((t) => t !== 'text'));
                      }}
                      className="rounded text-blue-600"
                    />
                    <span>Metin / Açıklama</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAcceptedTypes.includes('link')}
                      onChange={(e) => {
                        if (e.target.checked) setNewAcceptedTypes([...newAcceptedTypes, 'link']);
                        else setNewAcceptedTypes(newAcceptedTypes.filter((t) => t !== 'link'));
                      }}
                      className="rounded text-blue-600"
                    />
                    <span>Bağlantı (URL / Repo / Drive)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAcceptedTypes.includes('file')}
                      onChange={(e) => {
                        if (e.target.checked) setNewAcceptedTypes([...newAcceptedTypes, 'file']);
                        else setNewAcceptedTypes(newAcceptedTypes.filter((t) => t !== 'file'));
                      }}
                      className="rounded text-blue-600"
                    />
                    <span>Dosya Eki (PDF / Görsel)</span>
                  </label>
                </div>
              </div>

              {/* Geç Teslim Politikası */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Geç Teslim Politikası
                </label>
                <select
                  value={newLatePolicy}
                  onChange={(e) => setNewLatePolicy(e.target.value as LateSubmissionPolicy)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50"
                >
                  <option value="allow_with_flag">Geç Teslim Edilebilir (Gecikme Bayrağı ile İşaretlenir)</option>
                  <option value="allow">Geç Teslime Koşulsuz İzin Ver</option>
                  <option value="disallow">Son Teslim Tarihi Sonrasında Teslim Kabul Etme</option>
                </select>
              </div>

              {/* Yayın Durumu Seçimi */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">Yayınlama Durumu</div>
                  <div className="text-[11px] text-slate-500">
                    Taslak ödevler kursiyer panellerinde görünmez; daha sonra yayına alabilirsiniz.
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="pubStatusRadio"
                      checked={newPubStatus === 'published'}
                      onChange={() => setNewPubStatus('published')}
                    />
                    <span className="font-semibold text-emerald-800">Doğrudan Yayınla</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="pubStatusRadio"
                      checked={newPubStatus === 'draft'}
                      onChange={() => setNewPubStatus('draft')}
                    />
                    <span className="text-amber-800">Taslak Kaydet</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Vazgeç
                </Button>
                <Button type="submit">Ödevi Kaydet</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DEĞERLENDİRME & PUANLAMA MODALI */}
      {/* ===================================================================== */}
      {gradingModalSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-brand-navy text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Ödev Teslim Değerlendirme Masası</h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  {gradingModalSub.traineeName} — Sürüm v{gradingModalSub.submissionVersion}
                </p>
              </div>
              <button
                onClick={() => setGradingModalSub(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGradeSubmit} className="p-6 space-y-4 text-xs">
              {/* Teslim İçeriği İnceleme */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-slate-500 font-medium">
                  <span>Kursiyerin Gönderdiği Teslim İçeriği:</span>
                  <span className="text-slate-400">
                    {new Date(gradingModalSub.submittedAt).toLocaleString('tr-TR')}
                  </span>
                </div>

                {gradingModalSub.content.text && (
                  <p className="text-slate-800 font-medium whitespace-pre-wrap bg-white p-2.5 rounded border border-slate-200">
                    {gradingModalSub.content.text}
                  </p>
                )}

                {gradingModalSub.content.linkUrl && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-slate-500 font-semibold">Harici Bağlantı:</span>
                    <a
                      href={gradingModalSub.content.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 font-medium hover:underline inline-flex items-center gap-1"
                    >
                      {gradingModalSub.content.linkUrl} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {gradingModalSub.content.fileName && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-semibold text-slate-500">Eklenen Dosya (Simülasyon):</span>
                    <span className="font-mono bg-slate-200 px-2 py-0.5 rounded text-[11px]">
                      {gradingModalSub.content.fileName} ({gradingModalSub.content.fileSize || '1 MB'})
                    </span>
                  </div>
                )}
              </div>

              {/* Önceki Revizyon Geçmişi (Eğer varsa) */}
              {gradingModalSub.revisionHistory && gradingModalSub.revisionHistory.length > 0 && (
                <div className="border border-purple-200 bg-purple-50/40 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-purple-700" />
                      Önceki Revizyon Geçmişi ({gradingModalSub.revisionHistory.length} Kayıt)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowRevisionHistory(!showRevisionHistory)}
                      className="text-purple-700 font-semibold text-[11px] hover:underline"
                    >
                      {showRevisionHistory ? 'Gizle' : 'Geçmişi Göster'}
                    </button>
                  </div>

                  {showRevisionHistory && (
                    <div className="space-y-2 pt-1">
                      {gradingModalSub.revisionHistory.map((hist, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-white rounded border border-purple-200 text-[11px] space-y-1"
                        >
                          <div className="flex items-center justify-between text-purple-800 font-semibold">
                            <span>Sürüm {hist.revisionNumber} Talebi:</span>
                            <span>{new Date(hist.requestedAt).toLocaleDateString('tr-TR')}</span>
                          </div>
                          <p className="text-slate-700 italic">"{hist.revisionReason}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Puan Girişi */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ödev Puanı (0–100) *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={gradingScore}
                    onChange={(e) => setGradingScore(Number(e.target.value))}
                    className="w-32 text-sm font-bold border border-slate-300 rounded-lg p-2.5"
                    required
                  />
                  <span className="text-slate-500 text-xs">
                    * Başarı barajı en az <strong>70 / 100</strong> puandır.
                  </span>
                </div>
              </div>

              {/* Değerlendirme Kararı */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Değerlendirme Kararı *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label
                    className={`p-3 rounded-lg border cursor-pointer text-center transition-all ${
                      gradingDecision === 'approved'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decisionRadio"
                      checked={gradingDecision === 'approved'}
                      onChange={() => setGradingDecision('approved')}
                      className="sr-only"
                    />
                    <div className="font-bold flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Onayla
                    </div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">Zorunlu koşulu sağlar</div>
                  </label>

                  <label
                    className={`p-3 rounded-lg border cursor-pointer text-center transition-all ${
                      gradingDecision === 'revision_requested'
                        ? 'border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decisionRadio"
                      checked={gradingDecision === 'revision_requested'}
                      onChange={() => setGradingDecision('revision_requested')}
                      className="sr-only"
                    />
                    <div className="font-bold flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Revizyon İste
                    </div>
                    <div className="text-[10px] text-amber-700 mt-0.5">Yeniden teslim gerekir</div>
                  </label>

                  <label
                    className={`p-3 rounded-lg border cursor-pointer text-center transition-all ${
                      gradingDecision === 'rejected'
                        ? 'border-red-500 bg-red-50 text-red-900 ring-1 ring-red-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decisionRadio"
                      checked={gradingDecision === 'rejected'}
                      onChange={() => setGradingDecision('rejected')}
                      className="sr-only"
                    />
                    <div className="font-bold flex items-center justify-center gap-1">
                      <X className="w-3.5 h-3.5 text-red-600" /> Reddet
                    </div>
                    <div className="text-[10px] text-red-700 mt-0.5">Teslim kabul edilmedi</div>
                  </label>
                </div>
              </div>

              {/* Eğitmen Geri Bildirimi / Revizyon Gerekçesi */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Eğitmen Geri Bildirimi {gradingDecision === 'revision_requested' ? '(Zorunlu Gerekçe) *' : '(Opsiyonel)'}
                </label>
                <textarea
                  rows={3}
                  value={gradingFeedback}
                  onChange={(e) => setGradingFeedback(e.target.value)}
                  placeholder={
                    gradingDecision === 'revision_requested'
                      ? 'Lütfen kursiyerin düzeltmesi gereken eksik noktaları açık ve yönlendirici biçimde yazınız...'
                      : 'Kursiyerin performansı hakkında yapıcı değerlendirme notunuz...'
                  }
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                  required={gradingDecision === 'revision_requested'}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setGradingModalSub(null)}
                >
                  Vazgeç
                </Button>
                <Button type="submit">Değerlendirmeyi Kaydet ve İmzala</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* GEREKÇELİ YOKLAMA DÜZELTME MODALI (Sprint E03-A) */}
      {/* ===================================================================== */}
      {correctModalRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-purple-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Gerekçeli Yoklama Düzeltmesi</h3>
                <p className="text-xs text-purple-200 mt-0.5">
                  {correctModalRecord.traineeName} — {currentSession?.title}
                </p>
              </div>
              <button
                onClick={() => setCorrectModalRecord(null)}
                className="text-purple-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-900">
                <p className="font-bold flex items-center gap-1.5">
                  <History className="w-4 h-4 text-purple-700" /> Denetim Kaydı Zorunludur
                </p>
                <p className="mt-1 text-[11px] leading-relaxed">
                  Kapatılmış yoklamaların değiştirilmesi sistem loglarına kaydedilir ve yönetim denetim masasında gerekçesiyle listelenir.
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Mevcut Durum:</span>
                <span className="font-bold text-slate-800 ml-2 uppercase">
                  {correctModalRecord.currentStatus}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Yeni Durum *</label>
                <select
                  value={correctNewStatus}
                  onChange={(e) => setCorrectNewStatus(e.target.value as AttendanceStatus)}
                  className="w-full text-xs border-slate-300 rounded-lg p-2.5 bg-slate-50"
                  required
                >
                  <option value="attended">Katıldı</option>
                  <option value="absent">Katılmadı</option>
                  <option value="excused">Mazeretli</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Düzeltme Gerekçesi (Zorunlu) *
                </label>
                <textarea
                  rows={3}
                  value={correctReason}
                  onChange={(e) => setCorrectReason(e.target.value)}
                  placeholder="Örn: Kursiyer resmî sağlık raporunu ibraz ettiği için devamsızlık durumu mazeretli olarak güncellendi."
                  className="w-full text-xs border-slate-300 rounded-lg p-2.5"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectModalRecord(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg transition-colors font-semibold shadow-sm"
                >
                  Düzeltmeyi Kaydet ve İmzala
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardContent>
  );
};

export default InstructorDashboardPage;
