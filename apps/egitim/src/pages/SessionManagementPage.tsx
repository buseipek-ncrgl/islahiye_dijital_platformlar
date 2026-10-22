import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Video,
} from 'lucide-react';
import { Session, SessionStatus, Group } from '../types';
import {
  getStoredSessions,
  createSession,
  updateSessionStatus,
  checkSessionConflict,
  subscribeToSessionUpdates,
} from '../services/sessionStorage';
import { getStoredGroups } from '../services/enrollmentStorage';
import { useDemoRole } from '../components/layout/DemoRoleContext';

export const SessionManagementPage: React.FC = () => {
  const { currentUser } = useDemoRole();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cancelModalSession, setCancelModalSession] = useState<Session | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // New session form
  const [newGroupId, setNewGroupId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newDate, setNewDate] = useState('2026-10-26');
  const [newStartTime, setNewStartTime] = useState('14:00');
  const [newEndTime, setNewEndTime] = useState('17:00');
  const [newLocation, setNewLocation] = useState('Seminer Salonu B');
  const [newIsOnline, setNewIsOnline] = useState(false);
  const [newOnlineUrl, setNewOnlineUrl] = useState('');
  const [newInstructorId, setNewInstructorId] = useState('user-instructor-01');

  // Feedback toast
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = () => {
    const s = getStoredSessions();
    const g = getStoredGroups();
    setSessions(s);
    setGroups(g);
    if (g.length > 0 && !newGroupId) {
      setNewGroupId(g[0].id);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToSessionUpdates(loadData);
    return () => unsub();
  }, []);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (selectedGroupId !== 'all' && s.groupId !== selectedGroupId) return false;
      if (selectedStatus !== 'all' && s.status !== selectedStatus) return false;
      return true;
    });
  }, [sessions, selectedGroupId, selectedStatus]);

  // Overall statistics
  const stats = useMemo(() => {
    const total = sessions.length;
    const completed = sessions.filter((s) => s.status === 'completed').length;
    const openAttendance = sessions.filter(
      (s) => s.status === 'attendance_open' || s.status === 'active'
    ).length;
    const scheduled = sessions.filter((s) => s.status === 'scheduled').length;
    const cancelled = sessions.filter((s) => s.status === 'cancelled').length;

    return { total, completed, openAttendance, scheduled, cancelled };
  }, [sessions]);

  // Instructor options
  const instructorOptions = [
    { id: 'user-instructor-01', name: 'Murat Özkan', expertise: 'E-Ticaret & Bilişim' },
    { id: 'user-instructor-02', name: 'Kemal Aksoy', expertise: 'Dış Ticaret & Gümrük' },
    { id: 'user-instructor-03', name: 'Fatma Yıldırım', expertise: 'Dijital Pazarlama & İletişim' },
  ];

  // Live conflict warning during modal input
  const liveConflictWarning = useMemo(() => {
    if (!showCreateModal || !newGroupId || !newDate || !newStartTime || !newEndTime) return null;
    const inst = instructorOptions.find((i) => i.id === newInstructorId);
    const res = checkSessionConflict({
      groupId: newGroupId,
      instructorId: newInstructorId,
      instructorName: inst?.name || 'Murat Özkan',
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
    });
    return res.hasConflict ? res.reason : null;
  }, [showCreateModal, newGroupId, newDate, newStartTime, newEndTime, newInstructorId]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFeedback({ type: 'error', message: 'Lütfen oturum başlığı giriniz.' });
      return;
    }

    const group = groups.find((g) => g.id === newGroupId);
    const inst = instructorOptions.find((i) => i.id === newInstructorId);

    const res = createSession({
      programId: group?.programId,
      programTitle: group?.programTitle,
      termId: group?.termId,
      cohortName: group?.cohortName,
      groupId: newGroupId,
      groupName: group?.name,
      sessionNumber: 0, // Auto-incremented in storage
      title: newTitle.trim(),
      topic: newTopic.trim(),
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      location: newLocation.trim(),
      isOnline: newIsOnline,
      onlineMeetingUrl: newIsOnline ? newOnlineUrl.trim() : undefined,
      instructorId: inst?.id,
      instructorName: inst?.name || 'Murat Özkan',
      status: 'scheduled',
    });

    if (res.success && res.session) {
      setFeedback({
        type: 'success',
        message: `"${res.session.title}" (Oturum ${res.session.sessionNumber}) başarıyla planlandı.`,
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewTopic('');
      loadData();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Oturum oluşturulamadı.' });
    }
  };

  const handleStatusChange = (sessionId: string, newStatus: SessionStatus) => {
    const res = updateSessionStatus(sessionId, newStatus, currentUser.fullName);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Oturum durumu başarıyla güncellendi: ${newStatus}`,
      });
      loadData();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Durum güncellenemedi.' });
    }
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalSession) return;
    if (!cancelReason.trim()) {
      setFeedback({ type: 'error', message: 'Lütfen iptal gerekçesi belirtiniz.' });
      return;
    }

    const res = updateSessionStatus(
      cancelModalSession.id,
      'cancelled',
      currentUser.fullName,
      cancelReason.trim()
    );

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `"${cancelModalSession.title}" oturumu iptal edildi. Devam hesaplama paydasından çıkarıldı.`,
      });
      setCancelModalSession(null);
      setCancelReason('');
      loadData();
    } else {
      setFeedback({ type: 'error', message: res.error || 'İşlem başarısız.' });
    }
  };

  const getStatusBadge = (status: SessionStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Tamamlandı
          </span>
        );
      case 'attendance_open':
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            Yoklama Açık
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <XCircle className="w-3.5 h-3.5" />
            İptal Edildi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <Calendar className="w-3.5 h-3.5" />
            Planlandı
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-brand-navy">Oturum & Takvim Planlama Masası</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              Sprint E03-A
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Grup bazlı ders oturumları, eğitmen görevlendirmesi, çakışma kontrolü ve yoklama durumu yönetimi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-navy hover:bg-slate-800 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Yeni Oturum Planla
          </button>
        </div>
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
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Toplam Oturum</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-emerald-700 font-medium">Tamamlanan</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.completed}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-amber-700 font-medium">Yoklama Açık</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{stats.openAttendance}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-blue-700 font-medium">Planlanan</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{stats.scheduled}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-red-700 font-medium">İptal Edilen</div>
          <div className="text-2xl font-bold text-red-700 mt-1">{stats.cancelled}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Grup Filtresi
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="text-xs border-slate-300 rounded-lg p-2 bg-slate-50 text-slate-800"
            >
              <option value="all">Tüm Gruplar ({groups.length} Grup)</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.programTitle} — {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">
              Durum Filtresi
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs border-slate-300 rounded-lg p-2 bg-slate-50 text-slate-800"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="scheduled">Planlandı</option>
              <option value="attendance_open">Yoklama Açık</option>
              <option value="completed">Tamamlandı</option>
              <option value="cancelled">İptal Edildi</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Yerel Saat Dilimi: <strong>Europe/Istanbul (TSİ)</strong></span>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            Ders Oturumları Listesi ({filteredSessions.length})
          </h2>
          <span className="text-xs text-slate-500">Program ve şube bazında planlanmış dersler</span>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-sm text-slate-700">Bu filtreye uygun oturum bulunamadı.</p>
            <p className="text-xs text-slate-400 mt-1">
              Yukarıdaki "Yeni Oturum Planla" butonu ile ilk oturumu ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">No / Başlık</th>
                  <th className="py-3 px-3">Grup & Program</th>
                  <th className="py-3 px-3">Tarih & Saat</th>
                  <th className="py-3 px-3">Eğitmen & Yer</th>
                  <th className="py-3 px-3">Durum</th>
                  <th className="py-3 px-4 text-right">Yönetim Aksiyonu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        Oturum {sess.sessionNumber}: {sess.title}
                      </div>
                      {sess.topic && (
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{sess.topic}</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{sess.groupName}</div>
                      <div className="text-[10px] text-slate-500">{sess.programTitle}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {sess.date}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {sess.startTime} - {sess.endTime}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{sess.instructorName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        {sess.isOnline ? (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Video className="w-3 h-3" /> Online Ders
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3 h-3 text-slate-400" /> {sess.location}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">{getStatusBadge(sess.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {sess.status === 'scheduled' && (
                          <button
                            onClick={() => handleStatusChange(sess.id, 'attendance_open')}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded font-medium text-[11px] transition-colors"
                            title="Yoklamayı aç"
                          >
                            Yoklamayı Aç
                          </button>
                        )}
                        {sess.status !== 'cancelled' && (
                          <button
                            onClick={() => setCancelModalSession(sess)}
                            className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-600 border border-slate-300 hover:border-red-300 rounded font-medium text-[11px] transition-colors"
                            title="Oturumu iptal et"
                          >
                            İptal Et
                          </button>
                        )}
                        {sess.status === 'completed' && sess.attendanceClosedAt && (
                          <span className="text-[10px] text-slate-400 italic">
                            Kapatıldı ({sess.attendanceClosedAt})
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 1. YENİ OTURUM OLUŞTURMA MODALI (Çakışma Kontrollü) */}
      {/* ===================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-brand-navy text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Yeni Ders Oturumu Planla</h3>
                <p className="text-xs text-slate-300 mt-0.5">Program, grup, eğitmen ve saat tanımlama</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              {/* Canlı Çakışma Uyarısı */}
              {liveConflictWarning && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Çakışma Tespit Edildi!</span>
                    <p className="mt-0.5 text-[11px] leading-relaxed">{liveConflictWarning}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Eğitim Grubu *</label>
                <select
                  value={newGroupId}
                  onChange={(e) => setNewGroupId(e.target.value)}
                  className="w-full text-xs border-slate-300 rounded-lg p-2.5 bg-slate-50"
                  required
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.programTitle} — {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Oturum Başlığı *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Örn: Pazaryeri Entegrasyonu ve Kargo Barkod Uygulaması"
                  className="w-full text-xs border-slate-300 rounded-lg p-2.5"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ders İçeriği / Konu Özeti</label>
                <textarea
                  rows={2}
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Örn: Barkod basımı, lojistik anlaşmaları ve müşteri karşılama standartları."
                  className="w-full text-xs border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tarih *</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full text-xs border-slate-300 rounded-lg p-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Başlangıç *</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full text-xs border-slate-300 rounded-lg p-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bitiş *</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full text-xs border-slate-300 rounded-lg p-2.5"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Görevli Eğitmen *</label>
                  <select
                    value={newInstructorId}
                    onChange={(e) => setNewInstructorId(e.target.value)}
                    className="w-full text-xs border-slate-300 rounded-lg p-2.5 bg-slate-50"
                    required
                  >
                    {instructorOptions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.expertise})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Derslik / Konum *</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Örn: Seminer Salonu B"
                    className="w-full text-xs border-slate-300 rounded-lg p-2.5"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isOnlineCheck"
                  checked={newIsOnline}
                  onChange={(e) => setNewIsOnline(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isOnlineCheck" className="text-slate-700 font-medium">
                  Bu oturum çevrimiçi (online) olarak gerçekleştirilecek
                </label>
              </div>

              {newIsOnline && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Toplantı Bağlantısı (URL)</label>
                  <input
                    type="url"
                    value={newOnlineUrl}
                    onChange={(e) => setNewOnlineUrl(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full text-xs border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={Boolean(liveConflictWarning)}
                  className={`px-4 py-2 text-white rounded-lg transition-colors font-semibold shadow-sm ${
                    liveConflictWarning
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-brand-navy hover:bg-slate-800'
                  }`}
                >
                  Oturumu Kaydet ve Planla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. OTURUM İPTAL MODALI (Gerekçeli ve Hesap Dışı Bırakan) */}
      {/* ===================================================================== */}
      {cancelModalSession && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-red-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Ders Oturumunu İptal Et</h3>
                <p className="text-xs text-red-200 mt-0.5">
                  Oturum {cancelModalSession.sessionNumber}: {cancelModalSession.title}
                </p>
              </div>
              <button
                onClick={() => setCancelModalSession(null)}
                className="text-red-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900">
                <p className="font-bold">Devam Oranı Politikası Hatırlatması:</p>
                <p className="mt-1 text-[11px] leading-relaxed">
                  İptal edilen oturumlar kursiyerlerin devam hesaplama paydasına katılmaz. Bu oturum için kursiyerlere devamsızlık yazılmaz.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  İptal Gerekçesi (Zorunlu) *
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Örn: Resmî tatil ve eğitmen mazereti sebebiyle oturum iptal edilmiş olup telafi dersi planlanacaktır."
                  className="w-full text-xs border-slate-300 rounded-lg p-2.5"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancelModalSession(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold shadow-sm"
                >
                  Oturumu İptal Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManagementPage;
