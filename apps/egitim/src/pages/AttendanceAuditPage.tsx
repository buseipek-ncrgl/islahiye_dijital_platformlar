import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  Users,
  Calendar,
  History,
  X,
} from 'lucide-react';
import { Group, SessionAttendanceRecord } from '../types';
import { getStoredGroups, getGroupAssignmentsByGroup } from '../services/enrollmentStorage';
import {
  calculateTraineeAttendance,
  calculateGroupAttendanceSummary,
} from '../services/attendanceEngine';
import {
  getStoredSessions,
  getStoredAttendanceRecords,
  subscribeToAttendanceUpdates,
  subscribeToSessionUpdates,
} from '../services/sessionStorage';

export const AttendanceAuditPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [allAttendance, setAllAttendance] = useState<SessionAttendanceRecord[]>([]);

  // Detailed modal
  const [detailModalTraineeId, setDetailModalTraineeId] = useState<string | null>(null);

  const loadData = () => {
    const grps = getStoredGroups();
    const atts = getStoredAttendanceRecords();
    setGroups(grps);
    setAllAttendance(atts);
    if (grps.length > 0 && selectedGroupId === 'all') {
      setSelectedGroupId(grps[0].id);
    }
  };

  useEffect(() => {
    loadData();
    const unsub1 = subscribeToAttendanceUpdates(loadData);
    const unsub2 = subscribeToSessionUpdates(loadData);
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const selectedGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || groups[0] || null;
  }, [groups, selectedGroupId]);

  // Group summary from attendance engine
  const groupSummary = useMemo(() => {
    if (!selectedGroup) return null;
    return calculateGroupAttendanceSummary(selectedGroup.id);
  }, [selectedGroup, allAttendance]);

  // Active trainees in selected group
  const groupTrainees = useMemo(() => {
    if (!selectedGroup) return [];
    const assignments = getGroupAssignmentsByGroup(selectedGroup.id);
    return assignments.map((asgn) => {
      const calc = calculateTraineeAttendance(asgn.candidateId, selectedGroup.id);
      return {
        ...asgn,
        calc,
      };
    });
  }, [selectedGroup, allAttendance]);

  // Global correction audit history (Tüm düzeltilmiş yoklama hareketleri)
  const correctionLogs = useMemo(() => {
    const logs: {
      recordId: string;
      sessionId: string;
      candidateName: string;
      fromStatus: string;
      toStatus: string;
      reason: string;
      correctedBy: string;
      correctedAt: string;
    }[] = [];

    const sessions = getStoredSessions();

    allAttendance.forEach((rec) => {
      if (rec.correctionHistory && rec.correctionHistory.length > 0) {
        const sess = sessions.find((s) => s.id === rec.sessionId);
        rec.correctionHistory.forEach((hist) => {
          logs.push({
            recordId: rec.id,
            sessionId: sess ? `Oturum ${sess.sessionNumber}: ${sess.title}` : rec.sessionId,
            candidateName: rec.traineeName,
            fromStatus: hist.fromStatus,
            toStatus: hist.toStatus,
            reason: hist.reason,
            correctedBy: hist.correctedBy,
            correctedAt: hist.correctedAt,
          });
        });
      }
    });

    return logs.sort((a, b) => b.correctedAt.localeCompare(a.correctedAt));
  }, [allAttendance]);

  // Trainee detail calculation for modal
  const selectedTraineeDetail = useMemo(() => {
    if (!detailModalTraineeId || !selectedGroup) return null;
    const trainee = groupTrainees.find((t) => t.candidateId === detailModalTraineeId);
    if (!trainee) return null;

    const sessions = getStoredSessions().filter((s) => s.groupId === selectedGroup.id);
    const traineeRecords = allAttendance.filter(
      (r) =>
        (r.candidateId === detailModalTraineeId || r.traineeId === detailModalTraineeId) &&
        r.groupId === selectedGroup.id
    );

    return {
      trainee,
      sessions,
      traineeRecords,
    };
  }, [detailModalTraineeId, selectedGroup, groupTrainees, allAttendance]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-brand-navy">Yoklama ve Devam Denetimi Masası</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Sprint E03-A Denetim
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Grup ve oturum bazında katılım denetimi, %80 barajı risk analizi ve yoklama düzeltme tarihçesi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Başarı Barajı: <strong className="text-emerald-700 font-bold">En az %80 Devam</strong>
          </div>
        </div>
      </div>

      {/* Group Selector & Top Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
            Denetlenecek Grup
          </label>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full text-xs border-slate-300 rounded-lg p-2.5 bg-slate-50 text-slate-800"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.programTitle} — {g.name}
              </option>
            ))}
          </select>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Dönem: {selectedGroup?.cohortName || '2026 Güz'}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Grup Oturumları</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {groupSummary?.completedSessions}{' '}
              <span className="text-sm font-normal text-slate-500">
                / {groupSummary?.totalSessions} Tamamlandı
              </span>
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5">
              {groupSummary?.pendingAttendanceSessions} Bekleyen Yoklama
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Grup Devam Ortalaması</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {groupSummary && groupSummary.averageAttendanceRate !== null ? (
                <span
                  className={
                    groupSummary.averageAttendanceRate >= 80 ? 'text-emerald-700' : 'text-red-600'
                  }
                >
                  %{groupSummary.averageAttendanceRate}
                </span>
              ) : (
                <span className="text-slate-400 text-sm font-medium">Hesaplanamıyor</span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {groupSummary &&
              groupSummary.averageAttendanceRate !== null &&
              groupSummary.averageAttendanceRate >= 80
                ? 'Genel Başarı Koşulu Sağlandı ✓'
                : 'Ortalama %80 Barajının Altında'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Risk Altındaki Kursiyerler</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {groupSummary?.atRiskTraineesCount}{' '}
              <span className="text-sm font-normal text-slate-500">/ {groupSummary?.totalTrainees} Kişi</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {groupSummary?.atRiskTraineesCount === 0
                ? 'Kritik devamsızlık riski yok'
                : 'İdari ikaz gerektiren kursiyer'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Trainees Attendance Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {selectedGroup?.name} — Kursiyer Devam Tablosu ({groupTrainees.length} Kursiyer)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Yalnızca tamamlanmış oturumlar hesaplanır; mazeretli oturumlar devam paydasından muaf tutulur.
            </p>
          </div>
        </div>

        {groupTrainees.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-sm">Bu grupta kayıtlı aktif kursiyer bulunmuyor.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Kursiyer Adı Soyadı</th>
                  <th className="py-3 px-3">İletişim</th>
                  <th className="py-3 px-3 text-center">Katıldı</th>
                  <th className="py-3 px-3 text-center">Mazeretli</th>
                  <th className="py-3 px-3 text-center">Katılmadı</th>
                  <th className="py-3 px-3 text-center">Devam Oranı</th>
                  <th className="py-3 px-3">Durum</th>
                  <th className="py-3 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {groupTrainees.map(({ candidateId, candidateName, candidateEmail, calc }) => (
                  <tr key={candidateId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{candidateName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {candidateId}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{candidateEmail}</td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-700">
                      {calc.attendedCount}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-amber-700">
                      {calc.excusedCount}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-red-600">
                      {calc.absentCount}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {calc.attendanceRate !== null ? (
                        <span
                          className={`font-bold text-sm ${
                            calc.attendanceRate >= 80 ? 'text-emerald-700' : 'text-red-600'
                          }`}
                        >
                          %{calc.attendanceRate}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Hesaplanamıyor</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {calc.attendanceRate === null ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                          Hesaplanamıyor
                        </span>
                      ) : calc.hasPassedThreshold ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> %80 Başarılı
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800 border border-red-200">
                          <AlertTriangle className="w-3 h-3" /> Risk Altında (%{calc.attendanceRate})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setDetailModalTraineeId(candidateId)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-medium transition-colors"
                      >
                        Oturum Dökümü
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Yoklama Düzeltme Denetim Tarihçesi (Audit Trail) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-purple-700" />
            <h2 className="text-sm font-bold text-slate-900">
              Yoklama Düzeltme Denetim Tarihçesi (Gerekçeli Düzeltmeler)
            </h2>
          </div>
          <span className="text-xs text-slate-500">{correctionLogs.length} Kayıtlı Düzeltme Hareketi</span>
        </div>

        {correctionLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Henüz kapatılmış bir oturum için gerekçeli yoklama düzeltmesi yapılmamıştır.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Kursiyer Adı</th>
                  <th className="py-3 px-3">Oturum</th>
                  <th className="py-3 px-3">Eski Durum → Yeni Durum</th>
                  <th className="py-3 px-3">Düzeltme Gerekçesi</th>
                  <th className="py-3 px-3">İşlem Yapan</th>
                  <th className="py-3 px-4 text-right">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {correctionLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{log.candidateName}</td>
                    <td className="py-3 px-3 text-slate-600">{log.sessionId}</td>
                    <td className="py-3 px-3">
                      <span className="text-slate-500 line-through mr-1">{log.fromStatus}</span>
                      <span className="font-bold text-blue-700">→ {log.toStatus}</span>
                    </td>
                    <td className="py-3 px-3 italic text-slate-700 max-w-xs truncate">
                      "{log.reason}"
                    </td>
                    <td className="py-3 px-3 text-slate-600">{log.correctedBy}</td>
                    <td className="py-3 px-4 text-right text-slate-400">{log.correctedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* KURSİYER OTURUM DÖKÜMÜ MODALI */}
      {/* ===================================================================== */}
      {selectedTraineeDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="p-5 bg-brand-navy text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base">
                  {selectedTraineeDetail.trainee.candidateName} — Devam Dökümü
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {selectedGroup?.name} • Devam Oranı: %
                  {selectedTraineeDetail.trainee.calc.attendanceRate ?? 'Hesaplanamıyor'}
                </p>
              </div>
              <button
                onClick={() => setDetailModalTraineeId(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-slate-400 text-[10px]">Toplam Oturum</div>
                  <div className="text-lg font-bold text-slate-900">
                    {selectedTraineeDetail.trainee.calc.totalSessions}
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900">
                  <div className="text-[10px]">Katıldı</div>
                  <div className="text-lg font-bold">
                    {selectedTraineeDetail.trainee.calc.attendedCount}
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                  <div className="text-[10px]">Mazeretli</div>
                  <div className="text-lg font-bold">
                    {selectedTraineeDetail.trainee.calc.excusedCount}
                  </div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-red-900">
                  <div className="text-[10px]">Katılmadı</div>
                  <div className="text-lg font-bold">
                    {selectedTraineeDetail.trainee.calc.absentCount}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-950 text-[11px]">
                <strong>İdari Devam Politikası:</strong> {selectedTraineeDetail.trainee.calc.policyNote}
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Oturum Bazında Katılım Kayıtları
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {selectedTraineeDetail.sessions.map((sess) => {
                    const record = selectedTraineeDetail.traineeRecords.find(
                      (r) => r.sessionId === sess.id
                    );
                    const st = record ? record.status : 'unmarked';

                    return (
                      <div
                        key={sess.id}
                        className="p-3 flex items-center justify-between bg-white hover:bg-slate-50/60"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">
                            Oturum {sess.sessionNumber}: {sess.title}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {sess.date} • {sess.startTime} - {sess.endTime} ({sess.location})
                          </div>
                        </div>

                        <div>
                          {sess.status === 'cancelled' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">
                              Oturum İptal Edildi
                            </span>
                          ) : st === 'attended' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              Katıldı ✓
                            </span>
                          ) : st === 'excused' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                              Mazeretli
                            </span>
                          ) : st === 'absent' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800">
                              Katılmadı
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500">
                              İşaretlenmedi / Gelecek Oturum
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setDetailModalTraineeId(null)}
                className="px-4 py-2 bg-brand-navy hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceAuditPage;
