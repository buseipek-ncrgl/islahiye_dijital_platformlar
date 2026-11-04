import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  AlertTriangle,
  CheckCircle2,
  Users,
  Calendar,
  History,
  X,
  LayoutGrid,
  List,
  Search,
  Download,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { KpiStrip } from '../components/ui/KpiStrip';
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

  // View Mode & Filtering
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'safe' | 'risk'>('all');

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

  // Filtrelenmiş Kursiyer Listesi
  const filteredTrainees = useMemo(() => {
    return groupTrainees.filter(({ candidateName, calc }) => {
      if (searchQuery.trim() && !candidateName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (statusFilter === 'safe' && (calc.attendanceRate === null || calc.attendanceRate < 80)) return false;
      if (statusFilter === 'risk' && (calc.attendanceRate === null || calc.attendanceRate >= 80)) return false;
      return true;
    });
  }, [groupTrainees, searchQuery, statusFilter]);

  // CSV Dışa Aktar
  const handleExportCSV = () => {
    if (!selectedGroup) return;
    const headers = ['Kursiyer Adı', 'E-Posta', 'Katıldı', 'Mazeretli', 'Katılmadı', 'Devam Oranı (%)', 'Durum'];
    const rows = filteredTrainees.map(({ candidateName, candidateEmail, calc }) => [
      `"${candidateName}"`,
      `"${candidateEmail}"`,
      calc.attendedCount,
      calc.excusedCount,
      calc.absentCount,
      calc.attendanceRate !== null ? calc.attendanceRate : 'N/A',
      calc.attendanceRate !== null && calc.attendanceRate >= 80 ? 'Normal (%80+)' : 'Risk Altında',
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Yoklama_Raporu_${selectedGroup.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Yoklama ve Devam Denetimi Masası
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Grup ve oturum bazında katılım denetimi, %80 barajı risk analizi ve yoklama düzeltme tarihçesi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Başarı Barajı: <strong>En az %80 Devam</strong>
          </span>
        </div>
      </div>

      {/* Standard 4 KPI Strip (Stripe / Canvas LMS Standart Metrik Bandı) */}
      <KpiStrip
        items={[
          {
            label: 'Toplam Oturum',
            value: `${groupSummary?.totalSessions || 0} Oturum`,
            icon: <Calendar className="w-4 h-4" />,
            subtext: `${groupSummary?.completedSessions || 0} Tamamlandı`,
          },
          {
            label: 'Bekleyen Yoklama',
            value: groupSummary?.pendingAttendanceSessions || 0,
            icon: <Calendar className="w-4 h-4" />,
            subtext: 'Eğitmen onayı bekleniyor',
            badge: (groupSummary?.pendingAttendanceSessions || 0) > 0 ? (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Giriş Bekliyor
              </span>
            ) : undefined,
          },
          {
            label: 'Grup Devam Ortalaması',
            value:
              groupSummary && groupSummary.averageAttendanceRate !== null
                ? `%${groupSummary.averageAttendanceRate}`
                : 'Hesaplanamıyor',
            icon: <CheckSquare className="w-4 h-4" />,
            subtext:
              groupSummary && groupSummary.averageAttendanceRate !== null && groupSummary.averageAttendanceRate >= 80
                ? 'Genel başarı koşulu sağlandı'
                : 'Ortalama %80 barajının altında',
          },
          {
            label: 'Risk Altındaki Kursiyer',
            value: `${groupSummary?.atRiskTraineesCount || 0} Kişi`,
            icon: <AlertTriangle className="w-4 h-4" />,
            subtext: `Toplam: ${groupSummary?.totalTrainees || 0} Kursiyer`,
            badge: (groupSummary?.atRiskTraineesCount || 0) > 0 ? (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-800 border border-rose-200">
                Kritik
              </span>
            ) : undefined,
          },
        ]}
      />

      {/* Group Selector Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Denetlenecek Grup:</span>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-300 bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.programTitle} — {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="text-slate-500 flex items-center gap-1.5 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Dönem: {selectedGroup?.cohortName || '2026 Güz'}</span>
        </div>
      </div>

      {/* Trainees Attendance Roster View */}
      <div className="space-y-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {selectedGroup?.name} — Kursiyer Devam Masası ({groupTrainees.length} Kursiyer)
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              İptal oturumlar devam paydasına katılmaz; mazeretli oturumlar paydadan muaf tutulur.
            </p>
          </div>

          {/* Search, Filter Chips, View Switcher & CSV */}
          <div className="flex flex-wrap items-center gap-2">
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

            {/* Filter Chips */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                  statusFilter === 'all' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'
                }`}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('safe')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                  statusFilter === 'safe' ? 'bg-emerald-50 text-emerald-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                %80+
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('risk')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                  statusFilter === 'risk' ? 'bg-red-50 text-red-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Riskli
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

            {/* CSV Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="text-[11px] py-1 px-2.5 flex items-center gap-1"
              title="CSV olarak indir"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </Button>
          </div>
        </div>

        {filteredTrainees.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-500 text-xs">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold">Kriterlere uygun kursiyer kaydı bulunamadı.</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[580px] overflow-y-auto relative">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 bg-slate-50">Kursiyer Adı Soyadı</th>
                    <th className="py-3 px-3 bg-slate-50">İletişim</th>
                    <th className="py-3 px-3 text-center bg-slate-50">Katıldı</th>
                    <th className="py-3 px-3 text-center bg-slate-50">Mazeretli</th>
                    <th className="py-3 px-3 text-center bg-slate-50">Katılmadı</th>
                    <th className="py-3 px-3 text-center bg-slate-50">Devam Oranı</th>
                    <th className="py-3 px-3 bg-slate-50">Durum</th>
                    <th className="py-3 px-4 text-right bg-slate-50">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTrainees.map(({ candidateId, candidateName, candidateEmail, calc }) => (
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
          </div>
        ) : (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrainees.map(({ candidateId, candidateName, candidateEmail, calc }) => {
              const isSafe = calc.attendanceRate !== null && calc.attendanceRate >= 80;
              return (
                <Card
                  key={candidateId}
                  className={`border transition-all hover:shadow-xs ${
                    !isSafe ? 'border-red-200 bg-red-50/10' : 'border-slate-200'
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{candidateName}</h4>
                        <p className="text-[11px] text-slate-500 truncate max-w-[170px]">{candidateEmail}</p>
                      </div>
                      {isSafe ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          %80+ Başarılı
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          Riskli
                        </span>
                      )}
                    </div>

                    {/* Attendance Progress Bar */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500 font-medium">Devam Oranı:</span>
                        <span
                          className={`font-bold tabular-nums ${
                            isSafe ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          %{calc.attendanceRate ?? 'N/A'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isSafe ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, calc.attendanceRate || 0)}%` }}
                        />
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-400"
                          style={{ left: '80%' }}
                          title="%80 Barajı"
                        />
                      </div>
                    </div>

                    {/* Stats Pill Row */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                      <div className="p-1.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-100">
                        <div className="font-bold">{calc.attendedCount}</div>
                        <div className="text-[10px] text-emerald-700">Katıldı</div>
                      </div>
                      <div className="p-1.5 rounded bg-amber-50 text-amber-900 border border-amber-100">
                        <div className="font-bold">{calc.excusedCount}</div>
                        <div className="text-[10px] text-amber-700">Mazeretli</div>
                      </div>
                      <div className="p-1.5 rounded bg-red-50 text-red-900 border border-red-100">
                        <div className="font-bold">{calc.absentCount}</div>
                        <div className="text-[10px] text-red-700">Katılmadı</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-center text-xs"
                        onClick={() => setDetailModalTraineeId(candidateId)}
                      >
                        Oturum Dökümünü İncele
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
          <div className="overflow-x-auto max-h-[460px] overflow-y-auto relative rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 bg-slate-50">Kursiyer Adı</th>
                  <th className="py-3 px-3 bg-slate-50">Oturum</th>
                  <th className="py-3 px-3 bg-slate-50">Eski Durum → Yeni Durum</th>
                  <th className="py-3 px-3 bg-slate-50">Düzeltme Gerekçesi</th>
                  <th className="py-3 px-3 bg-slate-50">İşlem Yapan</th>
                  <th className="py-3 px-4 text-right bg-slate-50">Tarih</th>
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
