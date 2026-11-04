import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Check,
  X,
  Filter,
  Calendar,
  Search,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { KpiStrip } from '../components/ui/KpiStrip';
import {
  getActiveAssignmentForCandidate,
  getGroupById,
  getStoredGroups,
} from '../services/enrollmentStorage';
import {
  getCourseAssignmentsByGroup,
  getLatestSubmission,
  getEvaluationForSubmission,
  submitAssignment,
  subscribeToAssignmentUpdates,
} from '../services/assignmentStorage';
import { calculateTraineeAssignmentPerformance } from '../services/assignmentEngine';
import { Assignment, AssignmentSubmission } from '../types';

export const TraineeAssignmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useDemoRole();

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'revision' | 'approved'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [searchQuery, setSearchQuery] = useState('');

  // Modallar
  const [selectedAssignmentForSubmit, setSelectedAssignmentForSubmit] = useState<Assignment | null>(null);
  const [selectedSubmissionForView, setSelectedSubmissionForView] = useState<{
    assignment: Assignment;
    submission: AssignmentSubmission;
  } | null>(null);

  // Form State
  const [submitText, setSubmitText] = useState('');
  const [submitLink, setSubmitLink] = useState('');
  const [submitFileName, setSubmitFileName] = useState('');
  const [submitFileSize, setSubmitFileSize] = useState('1.5 MB');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const unsub = subscribeToAssignmentUpdates(() => setRefreshTrigger((p) => p + 1));
    return () => unsub();
  }, []);

  const activeAssignment = useMemo(() => {
    return getActiveAssignmentForCandidate(currentUser.id);
  }, [currentUser.id, refreshTrigger]);

  const assignedGroup = useMemo(() => {
    if (activeAssignment) {
      const g = getGroupById(activeAssignment.groupId);
      if (g) return g;
    }
    const allGroups = getStoredGroups();
    return allGroups[0] || null;
  }, [activeAssignment, refreshTrigger]);

  const groupAssignments = useMemo(() => {
    if (!assignedGroup) return [];
    return getCourseAssignmentsByGroup(assignedGroup.id, false);
  }, [assignedGroup, refreshTrigger]);

  const assignmentPerf = useMemo(() => {
    if (!assignedGroup) return null;
    return calculateTraineeAssignmentPerformance(currentUser.id, assignedGroup.id);
  }, [currentUser.id, assignedGroup, refreshTrigger]);

  const handleOpenSubmitModal = (asgn: Assignment) => {
    setSelectedAssignmentForSubmit(asgn);
    setSubmitText('');
    setSubmitLink('');
    setSubmitFileName('');
  };

  const handleSubmitAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentForSubmit) return;

    if (!submitText.trim() && !submitLink.trim() && !submitFileName.trim()) {
      setFeedbackMsg({
        type: 'error',
        message: 'Lütfen en az bir metin açıklaması, harici proje bağlantısı veya dosya ekleyiniz.',
      });
      return;
    }

    const res = submitAssignment({
      assignmentId: selectedAssignmentForSubmit.id,
      enrollmentId: activeAssignment?.id || `enr-${currentUser.id}`,
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
      setFeedbackMsg({
        type: 'success',
        message: `"${selectedAssignmentForSubmit.title}" ödev tesliminiz (v${res.submission?.submissionVersion}) başarıyla kütüğe kaydedildi.`,
      });
      setSelectedAssignmentForSubmit(null);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } else {
      setFeedbackMsg({
        type: 'error',
        message: res.error || 'Ödev teslimi sırasında bir hata oluştu.',
      });
    }
  };

  // Filtreleme
  const filteredAssignments = useMemo(() => {
    return groupAssignments.filter((asgn) => {
      const latestSub = getLatestSubmission(asgn.id, currentUser.id);
      if (filterTab === 'pending' && latestSub) return false;
      if (filterTab === 'revision' && latestSub?.status !== 'revision_requested') return false;
      if (filterTab === 'approved' && latestSub?.status !== 'approved') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = asgn.title.toLowerCase().includes(q);
        const matchesDesc = asgn.description ? asgn.description.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });
  }, [groupAssignments, filterTab, searchQuery, currentUser.id]);

  const pendingCount = groupAssignments.filter((a) => !getLatestSubmission(a.id, currentUser.id)).length;
  const revisionCount = groupAssignments.filter((a) => getLatestSubmission(a.id, currentUser.id)?.status === 'revision_requested').length;
  const approvedCount = groupAssignments.filter((a) => getLatestSubmission(a.id, currentUser.id)?.status === 'approved').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Üst Başlık & Hızlı Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Ödevlerim & Proje Teslim Masası
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {assignedGroup
              ? `${assignedGroup.name} eğitim grubu ödev yönergeleri, revizyon notları ve teslim geçmişi.`
              : 'Kayıtlı olduğunuz eğitim grubu ödevleri.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/kursiyer/takvim')}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Teslim Takvimi</span>
          </button>
          <button
            onClick={() => navigate('/kursiyer/devam')}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <span>Devam Durumu →</span>
          </button>
        </div>
      </div>

      {/* Geri Bildirim Mesajı */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedbackMsg.message}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Ödev Başarı Metrik Kartları (KpiStrip Standardı) */}
      <KpiStrip
        columns={3}
        items={[
          {
            label: 'Genel Ödev Ortalaması',
            value:
              assignmentPerf?.averageScore !== null && assignmentPerf?.averageScore !== undefined
                ? `${assignmentPerf.averageScore} / 100`
                : '85 / 100',
            subtext: 'Resmî baraj: 70/100',
            icon: <FileText className="w-3.5 h-3.5 text-blue-600" />,
            badge: (
              <StatusBadge
                label={
                  (assignmentPerf?.averageScore ?? 85) >= 70 ? 'Baraj Sağlandı' : 'Değerlendirmede'
                }
                variant={(assignmentPerf?.averageScore ?? 85) >= 70 ? 'success' : 'warning'}
                size="sm"
              />
            ),
          },
          {
            label: 'Onaylanan Zorunlu Ödevler',
            value: `${assignmentPerf?.mandatoryAssignmentsApproved || 3} / ${assignmentPerf?.mandatoryAssignmentsTotal || 3}`,
            subtext: 'Tüm zorunlu ödevlerin onayı şarttır',
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
            badge: (
              <StatusBadge
                label={assignmentPerf?.isMandatoryAllApproved !== false ? 'Tümü Onaylandı' : 'Bekleyen Var'}
                variant={assignmentPerf?.isMandatoryAllApproved !== false ? 'success' : 'warning'}
                size="sm"
              />
            ),
          },
          {
            label: 'Revizyon Durumu',
            value: `${revisionCount} Ödev`,
            subtext: revisionCount > 0 ? 'Revizyon bekleniyor' : 'Bekleyen revizyon yok',
            icon: <Clock className="w-3.5 h-3.5 text-slate-500" />,
          },
        ]}
      />

      {/* Filtre Tabları & Arama & Görünüm Değiştirici */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-xs font-bold text-slate-700 shrink-0">Filtrele:</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tümü ({groupAssignments.length})
            </button>
            <button
              onClick={() => setFilterTab('revision')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterTab === 'revision'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Revizyon İstenenler ({revisionCount})
            </button>
            <button
              onClick={() => setFilterTab('approved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterTab === 'approved'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Onaylananlar ({approvedCount})
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterTab === 'pending'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Teslim Bekleyenler ({pendingCount})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ödevlerde ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-medium transition ${
                viewMode === 'cards'
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
      </div>

      {/* Ödev Listesi Kartları / Tablosu */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Ödev Bulunamadı</h3>
            <p className="text-xs text-slate-500">
              {searchQuery ? 'Arama kriterlerine uygun ödev bulunamadı.' : 'Seçili filtreye ait herhangi bir ödev kaydı bulunmuyor.'}
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          filteredAssignments.map((asgn) => {
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
                className="p-6 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-xs space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {asgn.isMandatory ? (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                          Zorunlu Ödev
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          İsteğe Bağlı
                        </span>
                      )}

                      {/* Teslim / Değerlendirme Durumu Rozeti */}
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Onaylandı ({evaluation?.score} Puan)
                        </span>
                      ) : isRevision ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1 rounded-full">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Revizyon İstendi (v{latestSub?.submissionVersion})
                        </span>
                      ) : isUnderReview ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">
                          <Clock className="w-3.5 h-3.5 text-blue-600" /> Değerlendirme Bekliyor (v{latestSub?.submissionVersion})
                        </span>
                      ) : (
                        <span className="text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
                          Henüz Teslim Edilmedi
                        </span>
                      )}

                      <span className="text-xs text-slate-500 ml-auto sm:ml-0">
                        Son Teslim: <strong className="text-slate-800">{asgn.dueDate || asgn.dueAt}</strong>
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900">{asgn.title}</h2>
                    <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                      {asgn.description}
                    </p>

                    {/* Revizyon Gerekçesi Kutusu */}
                    {isRevision && latestSub?.revisionHistory && latestSub.revisionHistory.length > 0 && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 mt-2 space-y-1.5">
                        <span className="font-bold flex items-center gap-1.5 text-amber-800">
                          <AlertTriangle className="w-4 h-4 text-amber-700" /> Eğitmeninizin Revizyon Notu:
                        </span>
                        <p className="italic text-slate-700 pl-5">
                          "{latestSub.revisionHistory[latestSub.revisionHistory.length - 1]?.revisionReason}"
                        </p>
                        {evaluation && (
                          <div className="text-[11px] text-amber-800 pl-5 pt-1">
                            Geçici Puan: <strong>{evaluation.score} / 100</strong> (Düzeltme gönderildikten sonra güncellenecektir)
                          </div>
                        )}
                      </div>
                    )}

                    {/* Onaylanmış Ödev Geri Bildirimi */}
                    {isApproved && evaluation?.feedback && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 mt-1">
                        <strong className="text-emerald-800">Eğitmen Değerlendirmesi:</strong> "{evaluation.feedback}"
                      </div>
                    )}
                  </div>

                  {/* İşlem Butonları (44px) */}
                  <div className="shrink-0 flex items-center gap-2 pt-1 lg:pt-0">
                    {!isSubmitted ? (
                      <Button
                        variant="primary"
                        size="md"
                        leftIcon={<Upload className="w-4 h-4" />}
                        onClick={() => handleOpenSubmitModal(asgn)}
                      >
                        Teslim Et
                      </Button>
                    ) : isRevision ? (
                      <Button
                        variant="primary"
                        size="md"
                        leftIcon={<Upload className="w-4 h-4" />}
                        onClick={() => handleOpenSubmitModal(asgn)}
                      >
                        Yeniden Gönder (v{(latestSub?.submissionVersion || 1) + 1})
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => setSelectedSubmissionForView({ assignment: asgn, submission: latestSub! })}
                      >
                        Teslimi İncele
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ödev Başlığı</th>
                  <th className="py-3 px-3 text-center">Zorunluluk</th>
                  <th className="py-3 px-3">Son Teslim</th>
                  <th className="py-3 px-3 text-center">Durum</th>
                  <th className="py-3 px-3 text-center">Puan</th>
                  <th className="py-3 px-3 text-right">Eylem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssignments.map((asgn) => {
                  const latestSub = getLatestSubmission(asgn.id, currentUser.id);
                  const evaluation = latestSub ? getEvaluationForSubmission(latestSub.id) : null;
                  const isSubmitted = Boolean(latestSub);
                  const isApproved = latestSub?.status === 'approved';
                  const isRevision = latestSub?.status === 'revision_requested';

                  return (
                    <tr key={asgn.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{asgn.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{asgn.description}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {asgn.isMandatory ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            Zorunlu
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] text-slate-500">
                            İsteğe Bağlı
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        {asgn.dueDate || asgn.dueAt}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isApproved ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Onaylandı
                          </span>
                        ) : isRevision ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Revizyon
                          </span>
                        ) : isSubmitted ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            İnceleniyor
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] text-slate-400">
                            Bekliyor
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold tabular-nums">
                        {evaluation ? `${evaluation.score}/100` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!isSubmitted || isRevision ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenSubmitModal(asgn)}
                          >
                            {isRevision ? 'Yeniden Gönder' : 'Teslim Et'}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSubmissionForView({ assignment: asgn, submission: latestSub! })}
                          >
                            İncele
                          </Button>
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

      {/* Ödev Teslim Modalı */}
      {selectedAssignmentForSubmit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Ödev Teslim Masası</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {selectedAssignmentForSubmit.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedAssignmentForSubmit(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Son Teslim Tarihi:</span>
                  <span className="text-blue-700">{selectedAssignmentForSubmit.dueDate || selectedAssignmentForSubmit.dueAt}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ödev Türü:</span>
                  <span className={selectedAssignmentForSubmit.isMandatory ? 'text-red-700 font-bold' : 'text-slate-600'}>
                    {selectedAssignmentForSubmit.isMandatory ? 'Zorunlu Ödev (Başarı Şartı)' : 'İsteğe Bağlı'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Açıklama & Çalışma Notunuz:
                </label>
                <textarea
                  rows={3}
                  value={submitText}
                  onChange={(e) => setSubmitText(e.target.value)}
                  placeholder="Yaptığınız çalışma hakkında özet bilgi veya eğitmeninize iletmek istediğiniz not..."
                  className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Proje / Kod / Doküman Bağlantısı (İsteğe Bağlı):
                </label>
                <input
                  type="url"
                  value={submitLink}
                  onChange={(e) => setSubmitLink(e.target.value)}
                  placeholder="https://github.com/... veya https://drive.google.com/..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Dosya Ekleme:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={submitFileName}
                    onChange={(e) => setSubmitFileName(e.target.value)}
                    placeholder="Dosya Adı (Örn: Proje_Raporu_v1.pdf)"
                    className="flex-1 p-2.5 text-xs border border-slate-300 rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSubmitFileName(`Odev_${currentUser.fullName.replace(/\s+/g, '_')}_Final.pdf`);
                      setSubmitFileSize('2.4 MB');
                    }}
                  >
                    Örnek Dosya Seç
                  </Button>
                </div>
                <p className="text-[11px] text-slate-500">
                  * Kabul edilen dosya formatları: PDF, ZIP, DOCX (Maks. 25 MB)
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setSelectedAssignmentForSubmit(null)}
                >
                  Vazgeç
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  Teslimi Onayla ve Gönder
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teslim İnceleme Modalı */}
      {selectedSubmissionForView && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Teslim Detayı</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {selectedSubmissionForView.assignment.title} (v{selectedSubmissionForView.submission.submissionVersion})
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmissionForView(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Teslim Tarihi:</span>
                  <span className="font-semibold text-slate-900">{selectedSubmissionForView.submission.submittedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Durum:</span>
                  <span className="font-bold capitalize text-blue-700">
                    {selectedSubmissionForView.submission.status.replace('_', ' ')}
                  </span>
                </div>
                {selectedSubmissionForView.submission.content.fileName && (
                  <div className="flex justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">Yüklenen Dosya:</span>
                    <span className="font-mono text-slate-800">{selectedSubmissionForView.submission.content.fileName}</span>
                  </div>
                )}
              </div>

              {selectedSubmissionForView.submission.content.text && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 block">Kursiyer Açıklaması:</span>
                  <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 italic">
                    "{selectedSubmissionForView.submission.content.text}"
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setSelectedSubmissionForView(null)}
                >
                  Kapat
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
