import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  History,
  X,
  Layers,
  ChevronRight,
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

export const AssignmentAuditPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<AssignmentSubmission[]>([]);
  const [allEvaluations, setAllEvaluations] = useState<AssignmentEvaluation[]>([]);

  // Kursiyer Detay Modalı
  const [detailTraineeId, setDetailTraineeId] = useState<string | null>(null);

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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <span className="text-xs text-slate-500 font-medium">Yönetici Denetim Masası:</span>
          <h2 className="text-xl font-bold text-brand-navy">
            Ödev Yönetimi, Değerlendirme & Başarı Ön Denetimi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Grup bazlı ödev teslimleri, 70/100 başarı barajı, zorunlu ödev onayları ve gerekçeli revizyon geçmişi
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

      {/* Üst Metrik Kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-slate-500">Yayınlanan Ödev</span>
            <div className="text-2xl font-bold text-slate-900">
              {selectedGroupSummary?.publishedAssignments || 0}
            </div>
            <div className="text-[11px] text-slate-400">
              {selectedGroupSummary?.draftAssignments || 0} Taslak Ödev
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-slate-500">Değerlendirme Bekleyen</span>
            <div className="text-2xl font-bold text-amber-700">
              {selectedGroupSummary?.pendingEvaluations || 0}
            </div>
            <div className="text-[11px] text-amber-800">
              {selectedGroupSummary?.revisionRequests || 0} Revizyon Sürecinde
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-slate-500">Grup Not Ortalaması</span>
            <div className="text-2xl font-bold text-blue-700">
              {selectedGroupSummary?.groupAverageScore !== null
                ? `${selectedGroupSummary?.groupAverageScore} / 100`
                : 'Hesaplanamıyor'}
            </div>
            <div className="text-[11px] text-slate-400">Başarı Barajı: 70/100</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-slate-500">Risk Altındaki Kursiyer</span>
            <div className="text-2xl font-bold text-red-600">
              {selectedGroupSummary?.atRiskTraineesCount || 0} Kursiyer
            </div>
            <div className="text-[11px] text-red-700">
              Toplam: {selectedGroupSummary?.traineesCount || 0} Kursiyer
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KURSİYER BAZLI BAŞARI ÖN KONTROL TABLOSU */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                {selectedGroup?.name} — Kursiyer Başarı Ön Kontrol Raporu
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Devam (%80), Ödev Ortalaması (70/100) ve Zorunlu Ödev Onaylarının entegre denetimi
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Toplam Kursiyer: <strong>{traineesAnalysis.length}</strong>
            </div>
          </div>

          {traineesAnalysis.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Bu grupta kayıtlı kursiyer bulunmuyor.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Kursiyer Adı</th>
                    <th className="py-3 px-3 text-center">Devam Oranı (%80)</th>
                    <th className="py-3 px-3 text-center">Ödev Ortalaması (70)</th>
                    <th className="py-3 px-3 text-center">Zorunlu Onay</th>
                    <th className="py-3 px-3 text-center">Ön Kontrol Durumu</th>
                    <th className="py-3 px-3 text-center">Risk Durumu</th>
                    <th className="py-3 px-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {traineesAnalysis.map((t) => (
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
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                            Risk Altında
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Zaman</th>
                    <th className="py-3 px-4">Kursiyer</th>
                    <th className="py-3 px-4">Ödev & Sürüm</th>
                    <th className="py-3 px-3">Eğitmen</th>
                    <th className="py-3 px-3 text-center">Karar</th>
                    <th className="py-3 px-3 text-center">Puan</th>
                    <th className="py-3 px-4">Eğitmen Gerekçesi / Geri Bildirim</th>
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
                * Bu ekran ön kontrol raporudur. Nihai resmi onay Sprint E03-C kapsamında yönetici tarafından verilecektir.
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
