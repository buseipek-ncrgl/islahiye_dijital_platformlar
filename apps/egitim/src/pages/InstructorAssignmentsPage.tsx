import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  FileCheck,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  X,
  ExternalLink,
  Users,
  Filter,
  LayoutGrid,
  List,
  Search,
} from 'lucide-react';
import {
  Group,
  Assignment,
  AssignmentSubmission,
  EvaluationDecision,
  SubmissionType,
  LateSubmissionPolicy,
  AssignmentPublicationStatus,
  Session,
} from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { KpiStrip } from '../components/ui/KpiStrip';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { getStoredGroups, getGroupCapacityStats } from '../services/enrollmentStorage';
import { getSessionsByGroup } from '../services/sessionStorage';
import {
  getCourseAssignmentsByGroup,
  createCourseAssignment,
  getStoredSubmissions,
  getEvaluationForSubmission,
  evaluateSubmission,
  subscribeToAssignmentUpdates,
} from '../services/assignmentStorage';
import { calculateGroupAssignmentSummary } from '../services/assignmentEngine';

export const InstructorAssignmentsPage: React.FC = () => {
  const { currentUser } = useDemoRole();

  // Gruplar ve Oturumlar
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [groupSessions, setGroupSessions] = useState<Session[]>([]);

  // Ödev State
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'grading'>('list');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchAssignmentQuery, setSearchAssignmentQuery] = useState('');
  const [searchSubmissionQuery, setSearchSubmissionQuery] = useState('');
  const [courseAssignments, setCourseAssignments] = useState<Assignment[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<AssignmentSubmission[]>([]);
  const [gradingFilterAssignmentId, setGradingFilterAssignmentId] = useState<string>('all');
  const [gradingFilterStatus, setGradingFilterStatus] = useState<string>('all');

  // Yeni Ödev Modalı
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRelatedSessionId, setNewRelatedSessionId] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDueTime, setNewDueTime] = useState('23:59');
  const [newIsMandatory, setNewIsMandatory] = useState(true);
  const newAcceptedTypes: SubmissionType[] = ['text', 'link'];
  const newLatePolicy: LateSubmissionPolicy = 'allow_with_flag';
  const [newPubStatus, setNewPubStatus] = useState<AssignmentPublicationStatus>('published');

  // Puanlama / Değerlendirme Modalı
  const [gradingModalSub, setGradingModalSub] = useState<AssignmentSubmission | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(85);
  const [gradingDecision, setGradingDecision] = useState<EvaluationDecision>('approved');
  const [gradingFeedback, setGradingFeedback] = useState<string>('');
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);

  // Geri bildirim mesajı
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
    const unsub = subscribeToAssignmentUpdates(() => {
      loadAssignmentsData();
    });
    return () => unsub();
  }, [selectedGroupId]);

  // Atanmış Gruplar
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

  useEffect(() => {
    if (selectedGroup) {
      setGroupSessions(getSessionsByGroup(selectedGroup.id));
      loadAssignmentsData();
    }
  }, [selectedGroup]);

  // Ödev Özet İstatistikleri
  const groupAssignmentSummary = useMemo(() => {
    if (!selectedGroup) return null;
    return calculateGroupAssignmentSummary(selectedGroup.id);
  }, [selectedGroup, courseAssignments, allSubmissions]);

  // Seçili gruba ait teslimler
  const groupSubmissions = useMemo(() => {
    const assignmentIds = new Set(courseAssignments.map((a) => a.id));
    return allSubmissions.filter((s) => assignmentIds.has(s.assignmentId));
  }, [courseAssignments, allSubmissions]);

  // İnceleme bekleyenler
  const pendingGradingCount = useMemo(() => {
    return groupSubmissions.filter(
      (s) => s.status === 'under_review' || s.status === 'resubmitted' || s.status === 'submitted'
    ).length;
  }, [groupSubmissions]);

  // Filtrelenmiş ödev listesi
  const filteredCourseAssignments = useMemo(() => {
    return courseAssignments.filter((a) => {
      if (!searchAssignmentQuery.trim()) return true;
      const q = searchAssignmentQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q))
      );
    });
  }, [courseAssignments, searchAssignmentQuery]);

  // Filtrelenmiş teslim listesi
  const filteredSubmissions = useMemo(() => {
    return groupSubmissions.filter((sub) => {
      if (gradingFilterAssignmentId !== 'all' && sub.assignmentId !== gradingFilterAssignmentId) {
        return false;
      }
      if (gradingFilterStatus !== 'all' && sub.status !== gradingFilterStatus) {
        return false;
      }
      if (searchSubmissionQuery.trim()) {
        const q = searchSubmissionQuery.toLowerCase();
        const asgn = courseAssignments.find((a) => a.id === sub.assignmentId);
        const matchesName = sub.traineeName.toLowerCase().includes(q);
        const matchesTitle = asgn?.title.toLowerCase().includes(q) ?? false;
        if (!matchesName && !matchesTitle) return false;
      }
      return true;
    });
  }, [groupSubmissions, gradingFilterAssignmentId, gradingFilterStatus, searchSubmissionQuery, courseAssignments]);

  // Yeni Ödev Oluşturma Formu
  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    if (!newTitle.trim() || !newDescription.trim() || !newDueDate) {
      setFeedback({ type: 'error', message: 'Lütfen zorunlu alanları (başlık, açıklama, tarih) doldurunuz.' });
      return;
    }

    const res = createCourseAssignment({
      groupId: selectedGroup.id,
      termId: selectedGroup.termId || 'term-2026-fall',
      cohortName: selectedGroup.cohortName || '2026 Güz Dönemi',
      programId: selectedGroup.programId,
      instructorId: currentUser.id,
      instructorName: currentUser.fullName,
      title: newTitle.trim(),
      description: newDescription.trim(),
      relatedSessionId: newRelatedSessionId || undefined,
      assignedAt: new Date().toISOString(),
      dueAt: `${newDueDate}T${newDueTime}:00`,
      maxScore: 100,
      isMandatory: newIsMandatory,
      acceptedSubmissionTypes: newAcceptedTypes,
      lateSubmissionPolicy: newLatePolicy,
      publicationStatus: newPubStatus,
    });

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `"${newTitle}" ödevi başarıyla oluşturuldu ve kütüğe eklendi.`,
      });
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewRelatedSessionId('');
      setNewDueDate('');
      loadAssignmentsData();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Ödev oluşturulamadı.' });
    }
  };

  // Puanlama Formu Gönderimi
  const handleGradingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingModalSub) return;

    const res = evaluateSubmission({
      submissionId: gradingModalSub.id,
      evaluatorId: currentUser.id,
      evaluatorName: currentUser.fullName,
      score: gradingScore,
      decision: gradingDecision,
      feedback: gradingFeedback.trim(),
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
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Üst Başlık & Hızlı Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Ödev Yönetimi & Puanlama Masası
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {selectedGroup
              ? `${selectedGroup.programTitle} — ${selectedGroup.name} ödev yönergeleri ve gelen teslim incelemeleri.`
              : 'Ödev tanımlayın, gelen teslimleri inceleyin ve puanlayın.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Yeni Ödev Tanımla</span>
          </button>
          <Link
            to="/egitmen/dersler"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Derslerim</span>
          </Link>
        </div>
      </div>

      {/* Geri Bildirim Bildirimi */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-start justify-between text-xs sm:text-sm border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
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

      {/* Ortak Grup Seçici */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-600 px-2 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-blue-600" /> Atanmış Grup:
        </span>
        {instructorAssignedGroups.map((grp) => {
          const stats = getGroupCapacityStats(grp.id);
          const isSelected = grp.id === selectedGroup?.id;
          return (
            <button
              key={grp.id}
              onClick={() => setSelectedGroupId(grp.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
                isSelected
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{grp.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {stats.assignedCount} Kursiyer
              </span>
            </button>
          );
        })}
      </div>

      {/* 4 Özet KPI Metrik Bandı (Stripe / Canvas LMS Standart Metrik Bandı) */}
      <KpiStrip
        items={[
          {
            label: 'Yayınlanan Ödev',
            value: groupAssignmentSummary?.publishedAssignments || 0,
            icon: <FileText className="w-4 h-4" />,
            subtext: `${groupAssignmentSummary?.draftAssignments || 0} Taslak ödev`,
          },
          {
            label: 'Gelen Teslimler',
            value: groupAssignmentSummary?.totalSubmissions || 0,
            icon: <FileCheck className="w-4 h-4" />,
            subtext: `${groupAssignmentSummary?.approvedSubmissions || 0} Onaylandı`,
          },
          {
            label: 'İncelenecek Teslim',
            value: pendingGradingCount,
            icon: <Clock className="w-4 h-4" />,
            subtext: `${groupAssignmentSummary?.revisionRequests || 0} Revizyon istendi`,
            badge: pendingGradingCount > 0 ? (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Bekliyor
              </span>
            ) : undefined,
          },
          {
            label: 'Ödev Başarı Ortalaması',
            value:
              groupAssignmentSummary?.groupAverageScore !== null && groupAssignmentSummary?.groupAverageScore !== undefined
                ? `${groupAssignmentSummary.groupAverageScore}/100`
                : 'Henüz Yok',
            icon: <CheckCircle2 className="w-4 h-4" />,
            subtext: 'Min 70/100 barajı',
          },
        ]}
      />

      {/* Alt Sekme Seçici & Arama / Görünüm Değiştirici */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'list'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Grup Ödevleri ({courseAssignments.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('grading')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'grading'
                ? 'bg-slate-900 text-white shadow-xs'
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

        {activeSubTab === 'list' && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ödevlerde ara..."
                value={searchAssignmentQuery}
                onChange={(e) => setSearchAssignmentQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
              />
            </div>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs font-medium transition ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Kart Görünümü"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md text-xs font-medium transition ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Liste Görünümü"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1. ALT GÖRÜNÜM: GRUP ÖDEVLERİ LİSTESİ */}
      {activeSubTab === 'list' && (
        <div className="space-y-4">
          {filteredCourseAssignments.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-slate-500">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-sm text-slate-700">
                  {searchAssignmentQuery ? 'Arama kriterine uygun ödev bulunamadı.' : 'Bu grupta tanımlanmış ödev bulunmuyor.'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Sağ üstteki "Yeni Ödev Tanımla" butonuna tıklayarak ilk ödevi oluşturabilirsiniz.
                </p>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCourseAssignments.map((asgn) => {
                const subsForThis = allSubmissions.filter((s) => s.assignmentId === asgn.id);
                const approvedCount = subsForThis.filter((s) => s.status === 'approved').length;
                const isPublished = asgn.publicationStatus === 'published';

                return (
                  <div
                    key={asgn.id}
                    className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition space-y-3.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isPublished
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {isPublished ? 'Yayında' : 'Taslak'}
                          </span>
                          {asgn.isMandatory && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                              Zorunlu
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Son: {asgn.dueAt ? new Date(asgn.dueAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : asgn.dueDate || 'Belirtilmedi'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mt-2">{asgn.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                        {asgn.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <span>Teslim: <strong className="text-slate-900">{subsForThis.length}</strong></span>
                        <span>•</span>
                        <span>Onaylı: <strong className="text-emerald-700">{approvedCount}</strong></span>
                      </div>

                      <button
                        onClick={() => {
                          setGradingFilterAssignmentId(asgn.id);
                          setActiveSubTab('grading');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 text-xs transition"
                      >
                        Teslimleri İncele →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Ödev Başlığı</th>
                    <th className="py-3 px-3 text-center">Durum</th>
                    <th className="py-3 px-3 text-center">Zorunluluk</th>
                    <th className="py-3 px-3">Son Teslim Tarihi</th>
                    <th className="py-3 px-3 text-center">Teslimler</th>
                    <th className="py-3 px-3 text-right">Eylem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCourseAssignments.map((asgn) => {
                    const subsForThis = allSubmissions.filter((s) => s.assignmentId === asgn.id);
                    const approvedCount = subsForThis.filter((s) => s.status === 'approved').length;
                    const isPublished = asgn.publicationStatus === 'published';

                    return (
                      <tr key={asgn.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{asgn.title}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1 max-w-md">{asgn.description}</div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isPublished
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {isPublished ? 'Yayında' : 'Taslak'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {asgn.isMandatory ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                              Zorunlu
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-500">
                              İsteğe Bağlı
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                          {asgn.dueAt ? new Date(asgn.dueAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : asgn.dueDate || 'Belirtilmedi'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-bold text-slate-900">{subsForThis.length}</span>
                          <span className="text-slate-400 text-[10px] ml-1">({approvedCount} onay)</span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setGradingFilterAssignmentId(asgn.id);
                              setActiveSubTab('grading');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 text-xs transition"
                          >
                            İncele →
                          </button>
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

      {/* 2. ALT GÖRÜNÜM: TESLİM DEĞERLENDİRME MASASI */}
      {activeSubTab === 'grading' && (
        <Card>
          <CardContent className="p-4 sm:p-5 space-y-4">
            {/* Filtre Barı */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" /> Filtrele:
                </span>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Kursiyer veya ödev adı..."
                    value={searchSubmissionQuery}
                    onChange={(e) => setSearchSubmissionQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
                  />
                </div>

                <select
                  value={gradingFilterAssignmentId}
                  onChange={(e) => setGradingFilterAssignmentId(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg p-1.5 bg-white text-slate-700"
                >
                  <option value="all">Tüm Ödevler ({courseAssignments.length})</option>
                  {courseAssignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>

                <select
                  value={gradingFilterStatus}
                  onChange={(e) => setGradingFilterStatus(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg p-1.5 bg-white text-slate-700"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="submitted">İnceleme Bekleyen (İlk Teslim)</option>
                  <option value="revision_submitted">Revizyon Teslim Edildi</option>
                  <option value="approved">Onaylananlar</option>
                  <option value="revision_requested">Revizyon İstenenler</option>
                  <option value="rejected">Reddedilenler</option>
                </select>
              </div>

              <span className="text-[11px] text-slate-500">
                Toplam <strong>{filteredSubmissions.length}</strong> teslim listeleniyor
              </span>
            </div>

            {/* Teslim Listesi Tablosu */}
            {filteredSubmissions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Seçilen filtre kriterlerine uygun ödev teslimi bulunamadı.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3">Kursiyer</th>
                      <th className="py-3 px-3">Ödev Başlığı</th>
                      <th className="py-3 px-3">Teslim Zamanı</th>
                      <th className="py-3 px-3 text-center">Sürüm</th>
                      <th className="py-3 px-3 text-center">Durum</th>
                      <th className="py-3 px-3 text-center">Puan</th>
                      <th className="py-3 px-3 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubmissions.map((sub) => {
                      const asgn = courseAssignments.find((a) => a.id === sub.assignmentId);
                      const currentEval = getEvaluationForSubmission(sub.id);

                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            {sub.traineeName}
                          </td>
                          <td className="py-3 px-3 text-slate-700 font-medium">
                            {asgn?.title || 'Ödev'}
                          </td>
                          <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                            {sub.submittedAt}
                            {sub.isLate && (
                              <span className="ml-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-bold">
                                Geç
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">
                              v{sub.submissionVersion}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                sub.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : sub.status === 'revision_requested'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : sub.status === 'rejected'
                                  ? 'bg-red-50 text-red-800 border border-red-200'
                                  : 'bg-blue-50 text-blue-800 border border-blue-200 animate-pulse'
                              }`}
                            >
                              {sub.status === 'approved'
                                ? 'Onaylandı'
                                : sub.status === 'revision_requested'
                                ? 'Revizyon'
                                : sub.status === 'rejected'
                                ? 'Reddedildi'
                                : 'İnceleme Bekliyor'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold tabular-nums">
                            {currentEval ? `${currentEval.score}/100` : '-'}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Button
                              size="sm"
                              variant={sub.status === 'approved' ? 'outline' : 'primary'}
                              onClick={() => {
                                setGradingModalSub(sub);
                                setGradingScore(currentEval?.score ?? 80);
                                setGradingDecision(currentEval?.decision ?? 'approved');
                                setGradingFeedback(currentEval?.feedback || '');
                                setShowRevisionHistory(false);
                              }}
                            >
                              {currentEval ? 'Tekrar İncele' : 'Puanla'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* YENİ ÖDEV TANIMLAMA MODALI */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Yeni Grup Ödevi Tanımla</h3>
                <p className="text-xs text-slate-300 mt-0.5">{selectedGroup?.name}</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ödev Başlığı *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Örn: Bölüm 2 — Vaka Analizi ve Raporlama"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ödev Yönergesi & Açıklama *
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ödev kapsamı, teslim formatı ve beklentilerinizi yazınız..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 min-h-[90px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">İlişkili Oturum</label>
                  <select
                    value={newRelatedSessionId}
                    onChange={(e) => setNewRelatedSessionId(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50"
                  >
                    <option value="">İlişkili Oturum Yok</option>
                    {groupSessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        Oturum {s.sessionNumber}: {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Zorunluluk Durumu</label>
                  <select
                    value={newIsMandatory ? 'yes' : 'no'}
                    onChange={(e) => setNewIsMandatory(e.target.value === 'yes')}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50"
                  >
                    <option value="yes">Zorunlu Ödev (Belge için şart)</option>
                    <option value="no">İsteğe Bağlı / Ek Pratik</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Son Teslim Tarihi *</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Son Teslim Saati</label>
                  <input
                    type="time"
                    value={newDueTime}
                    onChange={(e) => setNewDueTime(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Yayın Durumu</label>
                <select
                  value={newPubStatus}
                  onChange={(e) => setNewPubStatus(e.target.value as AssignmentPublicationStatus)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50"
                >
                  <option value="published">Hemen Yayınla (Kursiyerlere Açık)</option>
                  <option value="draft">Taslak Kaydet (Yalnızca Eğitmene Görünür)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Vazgeç
                </Button>
                <Button size="sm" type="submit">
                  Ödevi Kaydet
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PUANLAMA / DEĞERLENDİRME MODALI */}
      {gradingModalSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Teslim Puanlama & Değerlendirme</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {gradingModalSub.traineeName} — Sürüm v{gradingModalSub.submissionVersion}
                </p>
              </div>
              <button
                onClick={() => setGradingModalSub(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGradingSubmit} className="p-6 space-y-4 text-xs">
              {/* Kursiyer Teslim Detayları */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Kursiyer Teslim İçeriği:</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Teslim Zamanı: {gradingModalSub.submittedAt}
                  </span>
                </div>

                {gradingModalSub.content.text && (
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-xs">
                    {gradingModalSub.content.text}
                  </p>
                )}

                {gradingModalSub.content.linkUrl && (
                  <div className="text-xs">
                    <span className="text-slate-500 mr-1">Bağlantı:</span>
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
                    <span className="font-semibold text-slate-500">Eklenen Dosya:</span>
                    <span className="font-mono bg-slate-200 px-2 py-0.5 rounded text-[11px]">
                      {gradingModalSub.content.fileName} ({gradingModalSub.content.fileSize || '1 MB'})
                    </span>
                  </div>
                )}
              </div>

              {/* Önceki Revizyon Geçmişi (Eğer varsa) */}
              {gradingModalSub.revisionHistory && gradingModalSub.revisionHistory.length > 0 && (
                <div className="border border-purple-200 bg-purple-50/40 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-purple-700" />
                      Önceki Revizyon Geçmişi ({gradingModalSub.revisionHistory.length} Kayıt)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowRevisionHistory(!showRevisionHistory)}
                      className="text-purple-700 font-semibold hover:underline text-[11px]"
                    >
                      {showRevisionHistory ? 'Gizle' : 'Göster'}
                    </button>
                  </div>

                  {showRevisionHistory && (
                    <div className="space-y-2 pt-2 border-t border-purple-100">
                      {gradingModalSub.revisionHistory.map((rev) => (
                        <div key={rev.revisionNumber} className="bg-white p-2.5 rounded-lg border border-purple-100 text-[11px]">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span>Revizyon #{rev.revisionNumber} Talebi</span>
                            <span>{rev.resubmittedAt || rev.requestedAt}</span>
                          </div>
                          {rev.revisionReason && (
                            <p className="text-slate-600 mt-1">
                              <strong>Gerekçe:</strong> {rev.revisionReason}
                            </p>
                          )}
                          {rev.evaluationResult?.feedback && (
                            <p className="text-slate-500 mt-0.5 italic">
                              Önceki Not: {rev.evaluationResult.score}/100 — {rev.evaluationResult.feedback}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Değerlendirme Formu */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">
                        Değerlendirme Puanı (0 - 100) *
                      </label>
                      <span className={`text-[11px] font-bold ${gradingScore >= 70 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {gradingScore >= 70 ? '✓ Geçer (≥70)' : '✗ Baraj Altı (<70)'}
                      </span>
                    </div>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={gradingScore}
                      onChange={(e) => {
                        const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                        setGradingScore(val);
                        if (val < 70 && gradingDecision === 'approved') {
                          setGradingDecision('revision_requested');
                        } else if (val >= 70 && gradingDecision === 'revision_requested') {
                          setGradingDecision('approved');
                        }
                      }}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 font-bold tabular-nums"
                      required
                    />

                    {/* Hızlı Puan Ön Ayar Butonları */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400 font-semibold mr-0.5">Hızlı Not:</span>
                      {[
                        { score: 70, label: '70 (Geçer)', decision: 'approved' as EvaluationDecision },
                        { score: 85, label: '85 (İyi)', decision: 'approved' as EvaluationDecision },
                        { score: 95, label: '95 (Pekiyi)', decision: 'approved' as EvaluationDecision },
                        { score: 100, label: '100 (Tam)', decision: 'approved' as EvaluationDecision },
                        { score: 60, label: '60 (Revizyon)', decision: 'revision_requested' as EvaluationDecision },
                      ].map((preset) => (
                        <button
                          key={preset.score}
                          type="button"
                          onClick={() => {
                            setGradingScore(preset.score);
                            setGradingDecision(preset.decision);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                            gradingScore === preset.score
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Değerlendirme Kararı *</label>
                    <select
                      value={gradingDecision}
                      onChange={(e) => setGradingDecision(e.target.value as EvaluationDecision)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-semibold"
                      required
                    >
                      <option value="approved">Onaylandı (Yeterli)</option>
                      <option value="revision_requested">Revizyon İstendi (Geliştirilmeli)</option>
                      <option value="rejected">Reddedildi (Yetersiz)</option>
                    </select>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Belge yeterlilik şartı için asgari 70 puan ve tüm zorunlu ödevlerin onayı gereklidir.
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">
                      Eğitmen Geri Bildirim Notu {gradingDecision === 'revision_requested' ? '*' : '(İsteğe Bağlı)'}
                    </label>
                    <span className="text-[10px] text-slate-400">Şablon veya serbest metin</span>
                  </div>

                  {/* Hızlı Geri Bildirim Şablonları */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {[
                      'Ödev yönergeye uygun ve eksiksiz hazırlanmış, tebrikler.',
                      'Analiz ve yöntem başarılı; görsel sunum düzeni geliştirilebilir.',
                      'Eksik bölümler mevcut; lütfen belirtilen hususları revize edip tekrar yükleyiniz.',
                      'Harika bir çalışma örneği, elinize sağlık.',
                    ].map((text, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setGradingFeedback(text);
                        }}
                        className="text-[10px] text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-2 py-0.5 rounded transition cursor-pointer text-left truncate max-w-full"
                        title={text}
                      >
                        + {text.slice(0, 42)}...
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={gradingFeedback}
                    onChange={(e) => setGradingFeedback(e.target.value)}
                    placeholder="Kursiyere iletilecek resmî akademik değerlendirme notunuz..."
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 min-h-[90px]"
                    required={gradingDecision === 'revision_requested'}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setGradingModalSub(null)}
                >
                  Vazgeç
                </Button>
                <Button size="sm" type="submit">
                  Değerlendirmeyi Kaydet
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
