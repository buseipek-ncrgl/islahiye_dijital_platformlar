import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  History,
  X,
  Layers,
  ChevronRight,
  LayoutGrid,
  List,
  Search,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Group, Assignment, AssignmentSubmission, AssignmentEvaluation } from '../types';
import { getStoredGroups, getGroupAssignmentsByGroup } from '../services/enrollmentStorage';
import {
  getStoredCourseAssignments,
  getStoredSubmissions,
  getStoredEvaluations,
  subscribeToAssignmentUpdates,
} from '../services/assignmentStorage';
import {
  calculateGroupAssignmentSummary,
  calculateTraineeAssignmentPerformance,
  calculateOverallSuccessPreCheck,
} from '../services/assignmentEngine';
import { calculateTraineeAttendance } from '../services/attendanceEngine';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { KpiStrip } from '../components/ui/KpiStrip';

export const AssignmentAuditPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<AssignmentSubmission[]>([]);
  const [allEvaluations, setAllEvaluations] = useState<AssignmentEvaluation[]>([]);

  // Kursiyer Detay Modalı
  const [detailTraineeId, setDetailTraineeId] = useState<string | null>(null);

  // View Mode & Filtering
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'risk' | 'normal'>('all');

  const loadData = () => {
    const grps = getStoredGroups();
    setGroups(grps);
    setAllAssignments(getStoredCourseAssignments());
    setAllSubmissions(getStoredSubmissions());
    setAllEvaluations(getStoredEvaluations());
    if (grps.length > 0 && selectedGroupId === 'all') {
      setSelectedGroupId(grps[0].id);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToAssignmentUpdates(loadData);
    return () => {
      unsub();
    };
  }, []);

  const selectedGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || groups[0] || null;
  }, [groups, selectedGroupId]);

  // Seçili grubun özet istatistikleri
  const selectedGroupSummary = useMemo(() => {
    if (!selectedGroup) return null;
    return calculateGroupAssignmentSummary(selectedGroup.id);
  }, [selectedGroup, allAssignments, allSubmissions, allEvaluations]);

  // Seçili grubun kursiyer listesi ve başarı durumları
  const traineesAnalysis = useMemo(() => {
    if (!selectedGroup) return [];
    const enrollments = getGroupAssignmentsByGroup(selectedGroup.id);

    return enrollments.map((asgn) => {
      const perf = calculateTraineeAssignmentPerformance(asgn.candidateId, selectedGroup.id);
      const preCheck = calculateOverallSuccessPreCheck(asgn.candidateId, selectedGroup.id);
      const att = calculateTraineeAttendance(asgn.candidateId, selectedGroup.id);

      return {
        traineeId: asgn.candidateId,
        traineeName: asgn.candidateName,
        enrollmentId: asgn.enrollmentId,
        assignedAt: asgn.assignedAt,
        perf,
        preCheck,
        attendanceRate: att.attendanceRate,
        isAtRisk:
          (att.attendanceRate !== null && att.attendanceRate < 80) ||
          (perf.averageScore !== null && perf.averageScore < 70) ||
          perf.missingSubmissionsCount > 0,
      };
    });
  }, [selectedGroup, allAssignments, allSubmissions, allEvaluations]);

  // Filtrelenmiş Kursiyer Listesi
  const filteredTrainees = useMemo(() => {
    return traineesAnalysis.filter((t) => {
      if (searchQuery.trim() && !t.traineeName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (riskFilter === 'risk' && !t.isAtRisk) return false;
      if (riskFilter === 'normal' && t.isAtRisk) return false;
      return true;
    });
  }, [traineesAnalysis, searchQuery, riskFilter]);

  // CSV Dışa Aktarma
  const handleExportCSV = () => {
    if (!selectedGroup) return;
    const headers = ['Kursiyer Adı', 'Devam Oranı (%)', 'Ödev Ortalaması', 'Zorunlu Ödev Onayı', 'Durum', 'Risk'];
    const rows = filteredTrainees.map((t) => [
      `"${t.traineeName}"`,
      t.attendanceRate ?? 'N/A',
      t.perf.averageScore ?? 'N/A',
      `"${t.perf.mandatoryAssignmentsApproved}/${t.perf.mandatoryAssignmentsTotal}"`,
      `"${t.preCheck.statusLabel}"`,
      t.isAtRisk ? 'Risk Altında' : 'Normal',
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Odev_Denetim_${selectedGroup.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tüm değerlendirme ve revizyon geçmişi (Audit Log)
  const auditLogs = useMemo(() => {
    if (!selectedGroup) return [];

    const groupAsgnIds = new Set(
      allAssignments.filter((a) => a.groupId === selectedGroup.id).map((a) => a.id)
    );

    const relevantSubmissions = allSubmissions.filter((s) => groupAsgnIds.has(s.assignmentId));

    // Her teslimin değerlendirmesini ve revizyon geçmişini listele
    const logs: {
      id: string;
      traineeName: string;
      assignmentTitle: string;
      version: number;
      actionDate: string;
      actionType: 'approval' | 'revision_request' | 'submission';
      decision: string;
      score?: number;
      evaluatorName?: string;
      reasonOrFeedback?: string;
    }[] = [];

    relevantSubmissions.forEach((sub) => {
      const asgn = allAssignments.find((a) => a.id === sub.assignmentId);
      const title = asgn?.title || sub.assignmentId;

      // Revizyon geçmişi adımları
      if (sub.revisionHistory && sub.revisionHistory.length > 0) {
        sub.revisionHistory.forEach((rh) => {
          logs.push({
            id: `hist-${sub.id}-${rh.revisionNumber}`,
            traineeName: sub.traineeName,
            assignmentTitle: title,
            version: rh.revisionNumber,
            actionDate: rh.requestedAt,
            actionType: 'revision_request',
            decision: 'Revizyon İstendi',
            score: rh.evaluationResult?.score,
            evaluatorName: rh.requestedBy,
            reasonOrFeedback: rh.revisionReason,
          });
        });
      }

      // Güncel değerlendirme
      const ev = allEvaluations.find((e) => e.submissionId === sub.id);
      if (ev) {
        logs.push({
          id: `eval-${ev.id}`,
          traineeName: sub.traineeName,
          assignmentTitle: title,
          version: sub.submissionVersion,
          actionDate: ev.evaluatedAt,
          actionType: ev.decision === 'approved' ? 'approval' : 'revision_request',
          decision:
            ev.decision === 'approved'
              ? 'Onaylandı'
              : ev.decision === 'revision_requested'
              ? 'Revizyon İstendi'
              : 'Reddedildi',
          score: ev.score,
          evaluatorName: ev.evaluatorName,
          reasonOrFeedback: ev.feedback,
        });
      }
    });

    // En yeni tarih en üstte
    return logs.sort(
      (a, b) => new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime()
    );
  }, [allAssignments, allSubmissions, allEvaluations, selectedGroup]);

  // Detay Modalı Seçili Kursiyer
  const detailTrainee = useMemo(() => {
    if (!detailTraineeId) return null;
    return traineesAnalysis.find((t) => t.traineeId === detailTraineeId) || null;
  }, [detailTraineeId, traineesAnalysis]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Ödev Yönetimi, Değerlendirme & Başarı Ön Denetimi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Grup bazlı ödev teslimleri, 70/100 başarı barajı, zorunlu ödev onayları ve gerekçeli revizyon geçmişi.
          </p>
        </div>
      </div>

      {/* Grup Seçim Barı */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-500 px-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-600" /> Grup Seçimi:
        </span>
        {groups.map((grp) => {
          const isSelected = grp.id === selectedGroup?.id;
          return (
            <button
              key={grp.id}
              onClick={() => setSelectedGroupId(grp.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-brand-navy text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{grp.name}</span>
              <span className="text-[10px] opacity-80">({grp.programTitle})</span>
            </button>
          );
        })}
      </div>

      {/* Üst Metrik Bandı (Stripe / Canvas LMS Standart Metrik Bandı) */}
      <KpiStrip
        items={[
          {
            label: 'Yayınlanan Ödev',
            value: selectedGroupSummary?.publishedAssignments || 0,
            icon: <Layers className="w-4 h-4" />,
            subtext: `${selectedGroupSummary?.draftAssignments || 0} Taslak Ödev`,
          },
          {
            label: 'Değerlendirme Bekleyen',
            value: selectedGroupSummary?.pendingEvaluations || 0,
            icon: <Clock className="w-4 h-4" />,
            subtext: `${selectedGroupSummary?.revisionRequests || 0} Revizyon Sürecinde`,
            badge: (selectedGroupSummary?.pendingEvaluations || 0) > 0 ? (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Bekliyor
              </span>
            ) : undefined,
          },
          {
            label: 'Grup Not Ortalaması',
            value:
              selectedGroupSummary?.groupAverageScore !== null && selectedGroupSummary?.groupAverageScore !== undefined
                ? `${selectedGroupSummary.groupAverageScore} / 100`
                : 'Henüz Not Yok',
            icon: <CheckCircle2 className="w-4 h-4" />,
            subtext: 'Başarı Barajı: 70/100',
          },
          {
            label: 'Risk Altındaki Kursiyer',
            value: `${selectedGroupSummary?.atRiskTraineesCount || 0} Kursiyer`,
            icon: <AlertTriangle className="w-4 h-4" />,
            subtext: `Toplam: ${selectedGroupSummary?.traineesCount || 0} Kursiyer`,
            badge: (selectedGroupSummary?.atRiskTraineesCount || 0) > 0 ? (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-800 border border-rose-200 animate-pulse">
                Risk
              </span>
            ) : undefined,
          },
        ]}
      />

      {/* KURSİYER BAZLI BAŞARI ÖN KONTROL TABLOSU */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                {selectedGroup?.name} — Kursiyer Başarı Ön Kontrol Raporu
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Devam (%80), Ödev Ortalaması (70/100) ve Zorunlu Ödev Onaylarının entegre denetimi
              </p>
            </div>

            {/* Toolbar: Search, Risk Filter, View Switcher, CSV Export */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Search */}
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Kursiyer ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white w-36 text-slate-800"
                />
              </div>

              {/* Risk Filter Chips */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setRiskFilter('all')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                    riskFilter === 'all' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'
                  }`}
                >
                  Tümü ({traineesAnalysis.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRiskFilter('risk')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                    riskFilter === 'risk' ? 'bg-red-50 text-red-700 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Riskli ({traineesAnalysis.filter((t) => t.isAtRisk).length})
                </button>
              </div>

              {/* View Switcher */}
              <div className="flex items-center border border-slate-300 rounded-lg p-0.5 bg-slate-100">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded text-xs flex items-center gap-1 transition ${
                    viewMode === 'list'
                      ? 'bg-white shadow-2xs text-brand-navy font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Liste Görünümü"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded text-xs flex items-center gap-1 transition ${
                    viewMode === 'grid'
                      ? 'bg-white shadow-2xs text-brand-navy font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Kart Görünümü"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* CSV Export Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="text-[11px] py-1 px-2.5 flex items-center gap-1"
                title="Raporu CSV olarak indir"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </Button>
            </div>
          </div>

          {filteredTrainees.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Filtreye uygun kursiyer kaydı bulunamadı.
            </div>
          ) : viewMode === 'list' ? (
            <div className="overflow-x-auto max-h-[580px] overflow-y-auto relative">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 bg-slate-50">Kursiyer Adı</th>
                    <th className="py-3 px-3 text-center bg-slate-50">Devam Oranı (%80)</th>
                    <th className="py-3 px-3 text-center bg-slate-50">Ödev Ortalaması (70)</th>
                    <th className="py-3 px-3 text-center bg-slate-50">Zorunlu Onay</th>
                    <th className="py-3 px-3 text-center bg-slate-50">Ön Kontrol Durumu</th>
                    <th className="py-3 px-3 text-center bg-slate-50">Risk Durumu</th>
                    <th className="py-3 px-4 text-right bg-slate-50">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTrainees.map((t) => (
                    <tr key={t.traineeId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{t.traineeName}</td>

                      {/* Devam */}
                      <td className="py-3 px-3 text-center tabular-nums">
                        {t.attendanceRate !== null ? (
                          <span
                            className={`font-bold ${
                              t.attendanceRate >= 80 ? 'text-emerald-700' : 'text-red-700'
                            }`}
                          >
                            %{t.attendanceRate}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Hesaplanamıyor</span>
                        )}
                      </td>

                      {/* Ödev Ortalaması */}
                      <td className="py-3 px-3 text-center tabular-nums">
                        {t.perf.averageScore !== null ? (
                          <span
                            className={`font-bold ${
                              t.perf.hasPassedThreshold ? 'text-emerald-700' : 'text-red-700'
                            }`}
                          >
                            {t.perf.averageScore} / 100
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Hesaplanamıyor</span>
                        )}
                      </td>

                      {/* Zorunlu Onay */}
                      <td className="py-3 px-3 text-center font-bold tabular-nums">
                        <span
                          className={
                            t.perf.isMandatoryAllApproved
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }
                        >
                          {t.perf.mandatoryAssignmentsApproved} / {t.perf.mandatoryAssignmentsTotal}
                        </span>
                      </td>

                      {/* Ön Kontrol Durumu */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.preCheck.preCheckStatus === 'requirements_met'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.preCheck.preCheckStatus === 'undetermined'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {t.preCheck.statusLabel}
                        </span>
                      </td>

                      {/* Risk Durumu */}
                      <td className="py-3 px-3 text-center">
                        {t.isAtRisk ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            Risk Altında
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Normal
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setDetailTraineeId(t.traineeId)}
                          className="text-xs text-blue-700 font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          İncele <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTrainees.map((t) => (
                <Card
                  key={t.traineeId}
                  className={`border transition-all hover:shadow-xs ${
                    t.isAtRisk ? 'border-red-200 bg-red-50/10' : 'border-slate-200'
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{t.traineeName}</h4>
                        <p className="text-[11px] text-slate-500">{selectedGroup?.name}</p>
                      </div>
                      {t.isAtRisk ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          Riskli
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          Normal
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Attendance Bar */}
                      <div>
                        <div className="flex justify-between items-center mb-1 text-[11px]">
                          <span className="text-slate-500">Devam Durumu:</span>
                          <span
                            className={`font-bold tabular-nums ${
                              t.attendanceRate !== null && t.attendanceRate >= 80
                                ? 'text-emerald-700'
                                : 'text-red-700'
                            }`}
                          >
                            %{t.attendanceRate ?? 'N/A'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              t.attendanceRate !== null && t.attendanceRate >= 80
                                ? 'bg-emerald-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, t.attendanceRate || 0)}%` }}
                          />
                        </div>
                      </div>

                      {/* Assignment Average */}
                      <div>
                        <div className="flex justify-between items-center mb-1 text-[11px]">
                          <span className="text-slate-500">Ödev Ortalaması:</span>
                          <span
                            className={`font-bold tabular-nums ${
                              t.perf.hasPassedThreshold ? 'text-emerald-700' : 'text-red-700'
                            }`}
                          >
                            {t.perf.averageScore ?? 'N/A'} / 100
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              t.perf.hasPassedThreshold ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, t.perf.averageScore || 0)}%` }}
                          />
                        </div>
                      </div>

                      {/* Mandatory count */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Zorunlu Ödevler:</span>
                        <span
                          className={`font-bold ${
                            t.perf.isMandatoryAllApproved ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {t.perf.mandatoryAssignmentsApproved} / {t.perf.mandatoryAssignmentsTotal} Onaylı
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-center text-xs"
                        onClick={() => setDetailTraineeId(t.traineeId)}
                      >
                        Ödev Dosyasını İncele
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* GEREKÇELİ DEĞERLENDİRME VE REVİZYON DENETİM GEÇMİŞİ (Audit Trail) */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <History className="w-4 h-4 text-purple-700" />
                Gerekçeli Değerlendirme ve Revizyon Denetim Geçmişi ({auditLogs.length} Kayıt)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Eğitmenlerin verdiği notlar, revizyon gerekçeleri ve onay kararlarının zaman damgalı logları
              </p>
            </div>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Bu grupta henüz kaydedilmiş değerlendirme veya revizyon hareketi bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[460px] overflow-y-auto relative">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 bg-slate-50">Zaman</th>
                    <th className="py-3 px-4 bg-slate-50">Kursiyer</th>
                    <th className="py-3 px-4 bg-slate-50">Ödev & Sürüm</th>
                    <th className="py-3 px-3 bg-slate-50">Eğitmen</th>
                    <th className="py-3 px-3 text-center bg-slate-50">Karar</th>
                    <th className="py-3 px-3 text-center bg-slate-50">Puan</th>
                    <th className="py-3 px-4 bg-slate-50">Eğitmen Gerekçesi / Geri Bildirim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                        {new Date(log.actionDate).toLocaleString('tr-TR')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{log.traineeName}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 line-clamp-1">
                          {log.assignmentTitle}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">v{log.version}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {log.evaluatorName || 'Eğitmen'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.decision === 'Onaylandı'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {log.decision}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold tabular-nums">
                        {log.score !== undefined ? `${log.score} / 100` : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs">
                        <span className="italic line-clamp-2">"{log.reasonOrFeedback || '-'}"</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===================================================================== */}
      {/* DETAY MODALI: KURSİYER BAŞARI ÖN KONTROL DETAYI */}
      {/* ===================================================================== */}
      {detailTrainee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-brand-navy text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">{detailTrainee.traineeName}</h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Ödev ve Devam Başarı Ön Kontrol İncelemesi
                </p>
              </div>
              <button
                onClick={() => setDetailTraineeId(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Devam Oranı:</span>
                  <strong className="text-slate-900">
                    {detailTrainee.attendanceRate !== null
                      ? `%${detailTrainee.attendanceRate} (Baraj: %80)`
                      : 'Henüz Hesaplanamıyor'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Ödev Not Ortalaması:</span>
                  <strong className="text-slate-900">
                    {detailTrainee.perf.averageScore !== null
                      ? `${detailTrainee.perf.averageScore} / 100 (Baraj: 70)`
                      : 'Henüz Hesaplanamıyor'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Zorunlu Ödev Onayları:</span>
                  <strong className="text-slate-900">
                    {detailTrainee.perf.mandatoryAssignmentsApproved} /{' '}
                    {detailTrainee.perf.mandatoryAssignmentsTotal} Onaylandı
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Ön Kontrol Durumu:</span>
                  <strong className="text-blue-700">{detailTrainee.preCheck.statusLabel}</strong>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 leading-relaxed">
                <strong>Açıklama:</strong> {detailTrainee.preCheck.explanation}
              </div>

              <div className="text-[11px] text-slate-500 italic">
                * Bu ekran akademik ön kontrol raporudur. Nihai resmi sertifika onayı Dönem Sonu Başarı Onay Masası üzerinden yetkili idare tarafından verilecektir.
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setDetailTraineeId(null)}>
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

export default AssignmentAuditPage;
