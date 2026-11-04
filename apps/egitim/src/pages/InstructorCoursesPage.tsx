import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Lock,
  AlertTriangle,
  History,
  X,
  Users,
  FileText,
  Save,
  Check,
  CheckCheck,
  RotateCcw,
  UserCheck,
  UserX,
  Clock3,
} from 'lucide-react';
import {
  Session,
  Group,
  AttendanceMarkStatus,
  AttendanceStatus,
} from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useDemoRole } from '../components/layout/DemoRoleContext';
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
import { calculateTraineeAttendance } from '../services/attendanceEngine';

export const InstructorCoursesPage: React.FC = () => {
  const { currentUser } = useDemoRole();

  // Gruplar ve Oturumlar Durumu
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [groupSessions, setGroupSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  // Seçili oturumun yoklama listesi
  const [sessionAttendance, setSessionAttendance] = useState<{
    recordId: string;
    traineeId: string;
    traineeName: string;
    status: AttendanceMarkStatus;
  }[]>([]);

  // Gerekçeli Yoklama Düzeltme Modalı
  const [correctModalRecord, setCorrectModalRecord] = useState<{
    recordId: string;
    traineeName: string;
    currentStatus: AttendanceMarkStatus;
  } | null>(null);
  const [correctNewStatus, setCorrectNewStatus] = useState<AttendanceStatus>('attended');
  const [correctReason, setCorrectReason] = useState('');

  // Geri bildirim mesajı
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = () => {
    const grps = getStoredGroups();
    setAllGroups(grps);
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

    return () => {
      unsub1();
      unsub2();
    };
  }, [selectedGroupId, selectedSessionId]);

  // Eğitmene atanmış gruplar
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

  // Varsayılan grup seçimi
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

  // Grup değişince oturumları yükle
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
    }
  }, [selectedGroup]);

  // Seçili oturum objesi
  const currentSession = useMemo(() => {
    return groupSessions.find((s) => s.id === selectedSessionId) || groupSessions[0] || null;
  }, [groupSessions, selectedSessionId]);

  // Seçili oturumun yoklama verilerini yenile
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

  // Yerel yoklama statü değişikliği
  const handleStatusChange = (traineeId: string, status: AttendanceMarkStatus) => {
    if (currentSession?.status === 'completed') return;
    setSessionAttendance((prev) =>
      prev.map((item) => (item.traineeId === traineeId ? { ...item, status } : item))
    );
  };

  // Tüm sınıfı tek tıkla 'Katıldı' olarak işaretleme
  const handleMarkAllAttended = () => {
    if (currentSession?.status === 'completed') return;
    setSessionAttendance((prev) =>
      prev.map((item) => ({ ...item, status: 'attended' }))
    );
    setFeedback({
      type: 'success',
      message: 'Sınıftaki tüm kursiyerler "Katıldı" olarak işaretlendi. Gelmeyen kursiyerleri listeden değiştirebilirsiniz.',
    });
  };

  // İşaretlemeleri sıfırlama
  const handleResetAttendance = () => {
    if (currentSession?.status === 'completed') return;
    setSessionAttendance((prev) =>
      prev.map((item) => ({ ...item, status: 'unmarked' }))
    );
  };

  // İstatistikler
  const totalStudents = sessionAttendance.length;
  const attendedCount = sessionAttendance.filter((a) => a.status === 'attended').length;
  const absentCount = sessionAttendance.filter((a) => a.status === 'absent').length;
  const excusedCount = sessionAttendance.filter((a) => a.status === 'excused').length;
  const unmarkedCount = sessionAttendance.filter((a) => a.status === 'unmarked' || !a.status).length;

  // Eylemler
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
        message: `${correctModalRecord.traineeName} için yoklama düzeltmesi kaydedildi ve denetim kütüğüne eklendi.`,
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Üst Başlık & Hızlı Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Ders Oturumları & Manuel Yoklama Masası
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {selectedGroup
              ? `${selectedGroup.programTitle} — ${selectedGroup.name} ders oturumları ve resmî katılım kütüğü.`
              : 'Ders oturumlarınızı yönetin ve manuel yoklama girişlerini yapın.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/egitmen/takvim"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
            <span>Eğitim Takvimim</span>
          </Link>
          <Link
            to="/egitmen/odevler"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <FileText className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Ödev Masası</span>
          </Link>
          <Link
            to="/egitmen/gruplar"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <Users className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Gruplarım</span>
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

      {/* Oturum Takvimi ve Yatay Oturum Kartları */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
          <span className="font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            {selectedGroup?.programTitle} — Oturum Takvimi ({groupSessions.length} Oturum)
          </span>
          <span className="text-slate-500 text-[11px]">Yoklama almak için oturuma tıklayınız</span>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 text-xs">
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
                  className={`px-3.5 py-2.5 rounded-xl border text-left shrink-0 transition ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-slate-900">Oturum {sess.sessionNumber}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
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
                  <div className="text-[11px] text-slate-600 font-medium mt-1 truncate max-w-[200px]">
                    {sess.title}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{sess.date} • {sess.startTime}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* MANUEL YOKLAMA MASASI (Aktif Oturum) */}
      {currentSession ? (
        <Card>
          <CardContent className="p-4 sm:p-5 space-y-5">
            {/* Oturum Başlık Bilgisi */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    Seçili Ders Oturumu
                  </span>
                  <span className="text-xs text-slate-500">{currentSession.date}</span>
                  <span className="text-xs font-semibold text-blue-800">• {selectedGroup?.name}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Oturum {currentSession.sessionNumber}: {currentSession.title}
                </h3>
                <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-4">
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
                </div>
              </div>

              {/* Statü & Aksiyonlar */}
              <div className="shrink-0 flex items-center gap-2">
                {currentSession.status === 'scheduled' && (
                  <Button size="sm" onClick={handleOpenAttendance}>
                    Yoklamayı Başlat
                  </Button>
                )}
                {currentSession.status === 'completed' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Yoklama Onaylandı ({currentSession.attendanceClosedAt || 'Kayıtlı'})</span>
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

            {/* Canlı Katılım İstatistik Sayacı ve Hızlı Toplu Aksiyon Çubuğu */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                {/* Donut / Yüzdelik Göstergesi */}
                <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="w-10 h-10 rounded-full border-2 border-slate-200 relative flex items-center justify-center bg-slate-50">
                    <span className="text-xs font-extrabold text-blue-700 tabular-nums">
                      %{totalStudents > 0 ? Math.round(((attendedCount + excusedCount) / totalStudents) * 100) : 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Oturum Katılımı</span>
                    <strong className="text-slate-900 text-xs tabular-nums">
                      {attendedCount + excusedCount} / {totalStudents} Kursiyer
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-xl font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Katıldı:</span>
                  <strong className="tabular-nums">{attendedCount}</strong>
                </div>

                <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-xl font-semibold">
                  <UserX className="w-3.5 h-3.5 text-rose-600" />
                  <span>Katılmadı:</span>
                  <strong className="tabular-nums">{absentCount}</strong>
                </div>

                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl font-semibold">
                  <Clock3 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Mazeretli:</span>
                  <strong className="tabular-nums">{excusedCount}</strong>
                </div>

                {unmarkedCount > 0 && (
                  <span className="text-amber-900 font-bold bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                    <span>{unmarkedCount} Kursiyer Bekliyor</span>
                  </span>
                )}
              </div>

              {/* Hızlı Toplu İşlem Butonları */}
              {currentSession.status !== 'completed' && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleMarkAllAttended}
                    className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                    title="Tüm sınıfı tek tıkla katıldı olarak işaretle"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Tümünü Katıldı İşaretle</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetAttendance}
                    className="h-9 px-3 inline-flex items-center justify-center gap-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-medium transition cursor-pointer"
                    title="İşaretlemeleri sıfırla"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Sıfırla</span>
                  </button>
                </div>
              )}
            </div>

            {/* Yoklama Listesi Tablosu */}
            {sessionAttendance.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-semibold text-sm text-slate-700">Bu grupta kayıtlı kursiyer bulunmuyor.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">No</th>
                      <th className="py-3 px-4">Kursiyer Adı Soyadı</th>
                      <th className="py-3 px-3">Genel Devam Oranı</th>
                      <th className="py-3 px-3 text-center">Katıldı</th>
                      <th className="py-3 px-3 text-center">Katılmadı</th>
                      <th className="py-3 px-3 text-center">Mazeretli</th>
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
                              <div className="space-y-0.5">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold tabular-nums border ${
                                    traineeCalc.hasPassedThreshold
                                      ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                                      : 'text-rose-800 bg-rose-50 border-rose-200'
                                  }`}
                                >
                                  {traineeCalc.hasPassedThreshold ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  )}
                                  <span>%{traineeCalc.attendanceRate}</span>
                                </span>
                                <span className="block text-[10px] text-slate-400 font-medium">
                                  {traineeCalc.hasPassedThreshold ? 'Baraj Sağlandı (≥%80)' : '⚠️ Devamsızlık Riski'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">
                                Henüz Hesaplanmadı
                              </span>
                            )}
                          </td>
                          {/* Katıldı */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => handleStatusChange(item.traineeId, 'attended')}
                              className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                item.status === 'attended'
                                  ? 'bg-emerald-600 text-white shadow-xs scale-102 ring-2 ring-emerald-300'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                              } disabled:opacity-60 cursor-pointer`}
                              title="Katıldı Olarak İşaretle"
                            >
                              <UserCheck className="w-3.5 h-3.5 shrink-0" />
                              <span className="hidden sm:inline">Katıldı</span>
                            </button>
                          </td>
                          {/* Katılmadı */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => handleStatusChange(item.traineeId, 'absent')}
                              className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                item.status === 'absent'
                                  ? 'bg-rose-600 text-white shadow-xs scale-102 ring-2 ring-rose-300'
                                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                              } disabled:opacity-60 cursor-pointer`}
                              title="Katılmadı Olarak İşaretle"
                            >
                              <UserX className="w-3.5 h-3.5 shrink-0" />
                              <span className="hidden sm:inline">Katılmadı</span>
                            </button>
                          </td>
                          {/* Mazeretli */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              disabled={isLocked}
                              onClick={() => handleStatusChange(item.traineeId, 'excused')}
                              className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                item.status === 'excused'
                                  ? 'bg-amber-500 text-white shadow-xs scale-102 ring-2 ring-amber-300'
                                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
                              } disabled:opacity-60 cursor-pointer`}
                              title="Mazeretli Olarak İşaretle"
                            >
                              <Clock3 className="w-3.5 h-3.5 shrink-0" />
                              <span className="hidden sm:inline">Mazeretli</span>
                            </button>
                          </td>
                          {/* Kapatılmışsa Düzeltme Butonu */}
                          {currentSession.status === 'completed' && (
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  setCorrectModalRecord({
                                    recordId: item.recordId,
                                    traineeName: item.traineeName,
                                    currentStatus: item.status,
                                  });
                                  setCorrectNewStatus(
                                    item.status === 'attended'
                                      ? 'absent'
                                      : item.status === 'absent'
                                      ? 'excused'
                                      : 'attended'
                                  );
                                }}
                                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition"
                              >
                                Gerekçeli Düzelt
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

            {/* Yoklama İşlem Butonları */}
            {currentSession.status !== 'completed' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-500">
                  {unmarkedCount > 0 ? (
                    <span className="text-amber-700 font-semibold">
                      Uyarı: {unmarkedCount} kursiyer henüz işaretlenmedi. Taslak kaydedebilir veya tamamlayarak onaylayabilirsiniz.
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold">
                      Tüm kursiyerler işaretlendi. Yoklamayı kapatmaya hazırsınız.
                    </span>
                  )}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Save className="w-3.5 h-3.5 text-slate-600" />}
                    onClick={handleSaveDraft}
                  >
                    Taslak Olarak Kaydet
                  </Button>
                  <Button
                    size="sm"
                    leftIcon={<Check className="w-3.5 h-3.5" />}
                    onClick={handleCloseAttendance}
                    disabled={unmarkedCount > 0}
                  >
                    Yoklamayı Kapat & Onayla
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            Bir oturum seçilmedi. Lütfen yukarıdaki oturum takviminden seçim yapınız.
          </CardContent>
        </Card>
      )}

      {/* Gerekçeli Yoklama Düzeltme Modalı */}
      {correctModalRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Gerekçeli Yoklama Düzeltmesi</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {correctModalRecord.traineeName} — {currentSession?.title}
                </p>
              </div>
              <button
                onClick={() => setCorrectModalRecord(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
                <p className="font-bold flex items-center gap-1.5">
                  <History className="w-4 h-4 text-amber-700" /> Resmî Kütük Düzeltme Denetimi
                </p>
                <p className="mt-1 text-[11px] leading-relaxed">
                  Onaylanmış yoklamaların değiştirilmesi denetim kütüğüne işlenir ve oda idari yöneticileri tarafından incelenebilir.
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Mevcut Durum:</span>
                <span className="font-bold text-slate-800 ml-2 uppercase">
                  {correctModalRecord.currentStatus === 'attended'
                    ? 'Katıldı'
                    : correctModalRecord.currentStatus === 'absent'
                    ? 'Katılmadı'
                    : correctModalRecord.currentStatus === 'excused'
                    ? 'Mazeretli'
                    : 'İşaretlenmedi'}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Yeni Durum *</label>
                <select
                  value={correctNewStatus}
                  onChange={(e) => setCorrectNewStatus(e.target.value as AttendanceStatus)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50"
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
                  value={correctReason}
                  onChange={(e) => setCorrectReason(e.target.value)}
                  placeholder="Örn: Kursiyer mazeret dilekçesi ibraz etti veya sehven yanlış işaretleme düzeltildi..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 min-h-[90px]"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCorrectModalRecord(null)}
                >
                  Vazgeç
                </Button>
                <Button size="sm" type="submit">
                  Düzeltmeyi Kütüğe İşle
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
