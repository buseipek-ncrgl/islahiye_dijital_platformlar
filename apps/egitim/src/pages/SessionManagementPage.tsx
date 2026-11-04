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
  ListFilter,
  CalendarDays,
  Building2,
  ShieldCheck,
  Search,
  Users,
} from 'lucide-react';
import { Session, SessionStatus, Group, Program, CurriculumModule } from '../types';
import { DEMO_PROGRAMS } from '../data/educationData';
import {
  getStoredSessions,
  createSession,
  updateSessionStatus,
  checkSessionConflict,
  subscribeToSessionUpdates,
} from '../services/sessionStorage';
import { getStoredGroups } from '../services/enrollmentStorage';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import {
  getStoredLocations,
  addStoredLocation,
  subscribeToFacilityCatalog,
} from '../services/facilityCatalogService';
import { VenuePicker } from '../components/common/VenuePicker';
import { KpiStrip } from '../components/ui/KpiStrip';

export const SessionManagementPage: React.FC = () => {
  const { currentUser } = useDemoRole();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'timetable'>('timetable');
  const [selectedWeek, setSelectedWeek] = useState<string>('all');
  const [dayRange, setDayRange] = useState<'5days' | '7days'>('7days');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cancelModalSession, setCancelModalSession] = useState<Session | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // New session form
  const [locations, setLocations] = useState<string[]>(getStoredLocations());
  const [customLocation, setCustomLocation] = useState<string>('');
  const [newGroupId, setNewGroupId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newDate, setNewDate] = useState('2026-10-26');
  const [newStartTime, setNewStartTime] = useState('14:00');
  const [newEndTime, setNewEndTime] = useState('17:00');
  const [newLocation, setNewLocation] = useState(getStoredLocations()[0] || '');
  const [newIsOnline, setNewIsOnline] = useState(false);
  const [newOnlineUrl, setNewOnlineUrl] = useState('');
  const [newInstructorId, setNewInstructorId] = useState('user-instructor-01');

  // Selected Group and Matched Program Modules from Catalog
  const selectedGroupObj = useMemo(() => {
    return groups.find((g) => g.id === newGroupId);
  }, [groups, newGroupId]);

  const matchedProgram = useMemo(() => {
    if (!selectedGroupObj) return null;
    return (
      DEMO_PROGRAMS.find(
        (p: Program) => p.id === selectedGroupObj.programId || p.title === selectedGroupObj.programTitle
      ) || null
    );
  }, [selectedGroupObj]);

  const availableModules: CurriculumModule[] = useMemo(() => {
    return (matchedProgram?.curriculumModules as CurriculumModule[]) || [];
  }, [matchedProgram]);

  const handleSelectModule = (modTitle: string) => {
    if (!modTitle) return;
    const found = availableModules.find((m: CurriculumModule) => m.title === modTitle);
    if (found) {
      setNewTitle(found.title);
      setNewTopic(found.description);
    }
  };

  // Feedback toast
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [createModalError, setCreateModalError] = useState<string | null>(null);
  const [cancelModalError, setCancelModalError] = useState<string | null>(null);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

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
    const unsub1 = subscribeToSessionUpdates(loadData);
    const unsub2 = subscribeToFacilityCatalog(() => {
      setLocations(getStoredLocations());
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (selectedGroupId !== 'all' && s.groupId !== selectedGroupId) return false;
      if (selectedStatus !== 'all' && s.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = s.title?.toLowerCase().includes(q);
        const matchInstructor = s.instructorName?.toLowerCase().includes(q);
        const matchGroup = s.groupName?.toLowerCase().includes(q);
        const matchLocation = s.location?.toLowerCase().includes(q);
        if (!matchTitle && !matchInstructor && !matchGroup && !matchLocation) return false;
      }
      return true;
    });
  }, [sessions, selectedGroupId, selectedStatus, searchQuery]);

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
    setCreateModalError(null);
    if (!newTitle.trim()) {
      setCreateModalError('Lütfen oturum başlığı giriniz.');
      return;
    }

    let finalLocation = newLocation;
    if (newLocation === 'custom') {
      if (!customLocation.trim()) {
        setCreateModalError('Lütfen yeni derslik adını giriniz.');
        return;
      }
      addStoredLocation(customLocation.trim());
      finalLocation = customLocation.trim();
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
      sessionNumber: 0,
      title: newTitle.trim(),
      topic: newTopic.trim(),
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      location: finalLocation.trim(),
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
      setCreateModalError(null);
      setNewTitle('');
      setNewTopic('');
      setCustomLocation('');
      loadData();
    } else {
      setCreateModalError(res.error || 'Oturum oluşturulamadı.');
    }
  };

  const handleStatusChange = (sessionId: string, newStatus: SessionStatus) => {
    const res = updateSessionStatus(sessionId, newStatus, currentUser.fullName);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Oturum durumu güncellendi: ${newStatus === 'attendance_open' ? 'Yoklama Açıldı' : newStatus}`,
      });
      loadData();
    } else {
      setFeedback({ type: 'error', message: res.error || 'Durum güncellenemedi.' });
    }
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCancelModalError(null);
    if (!cancelModalSession) return;
    if (!cancelReason.trim()) {
      setCancelModalError('Lütfen iptal gerekçesi belirtiniz.');
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
        message: `Oturum ${cancelModalSession.sessionNumber} gerekçeli olarak iptal edildi. Bu oturum kursiyer devam paydasına dahil edilmeyecektir.`,
      });
      setCancelModalSession(null);
      setCancelReason('');
      loadData();
    } else {
      setCancelModalError(res.error || 'İptal işlemi başarısız oldu.');
    }
  };

  // Status Badge with Pulse Indicator
  const getStatusBadge = (status: SessionStatus, isCompact = false) => {
    switch (status) {
      case 'completed':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 ${
            isCompact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}>
            <CheckCircle2 className={isCompact ? 'w-3 h-3 text-emerald-600' : 'w-3.5 h-3.5 text-emerald-600'} />
            <span>Tamamlandı</span>
          </span>
        );
      case 'attendance_open':
      case 'active':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full font-bold bg-amber-50 text-amber-900 border border-amber-300 ${
            isCompact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}>
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-600"></span>
            </span>
            <span>Yoklama Açık</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className={`inline-flex items-center gap-1 rounded-full font-semibold bg-rose-50 text-rose-800 border border-rose-200 ${
            isCompact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}>
            <XCircle className={isCompact ? 'w-3 h-3 text-rose-600' : 'w-3.5 h-3.5 text-rose-600'} />
            <span>İptal Edildi</span>
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1 rounded-full font-semibold bg-blue-50 text-blue-800 border border-blue-200 ${
            isCompact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}>
            <Calendar className={isCompact ? 'w-3 h-3 text-blue-600' : 'w-3.5 h-3.5 text-blue-600'} />
            <span>Planlandı</span>
          </span>
        );
    }
  };

  // Week Options for Timetable Matrix
  const weekOptions = [
    { id: 'all', label: 'Tüm Dönem (Genel Şablon)' },
    { id: 'w1', label: '1. Hafta (12 - 18 Ekim)', start: '2026-10-12', end: '2026-10-18' },
    { id: 'w2', label: '2. Hafta (19 - 25 Ekim)', start: '2026-10-19', end: '2026-10-25' },
    { id: 'w3', label: '3. Hafta (26 Ekim - 1 Kasım)', start: '2026-10-26', end: '2026-11-01' },
  ];

  // Days of week representation for Timetable Matrix
  const daysOfWeek = useMemo(() => {
    const allDays = [
      { key: 'Monday', label: 'Pazartesi' },
      { key: 'Tuesday', label: 'Salı' },
      { key: 'Wednesday', label: 'Çarşamba' },
      { key: 'Thursday', label: 'Perşembe' },
      { key: 'Friday', label: 'Cuma' },
      { key: 'Saturday', label: 'Cumartesi' },
      { key: 'Sunday', label: 'Pazar' },
    ];
    return dayRange === '5days' ? allDays.slice(0, 5) : allDays;
  }, [dayRange]);

  const getDayName = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const dayIdx = d.getDay();
      const map = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return map[dayIdx];
    } catch {
      return 'Monday';
    }
  };

  // Group sessions by day for Timetable View
  const sessionsByDay = useMemo(() => {
    const grouped: Record<string, Session[]> = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    const targetWeek = weekOptions.find((w) => w.id === selectedWeek);

    filteredSessions.forEach((s) => {
      if (targetWeek && targetWeek.start && targetWeek.end) {
        if (s.date < targetWeek.start || s.date > targetWeek.end) return;
      }
      const day = getDayName(s.date);
      if (grouped[day]) {
        grouped[day].push(s);
      } else {
        grouped.Monday.push(s);
      }
    });

    // Sort each day by startTime
    Object.keys(grouped).forEach((d) => {
      grouped[d].sort((a, b) => (a.startTime > b.startTime ? 1 : -1));
    });

    return grouped;
  }, [filteredSessions, selectedWeek]);

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-16">
      {/* 1. Sayfa Başlığı ve Hızlı Eylem */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ders Oturumu & Takvim Planlama Masası
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Grup bazlı ders oturumları, eğitmen görevlendirmesi, salon tahsisi, çakışma önleme ve canlı yoklama yönetimi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="h-9 px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Yeni Oturum Planla</span>
          </button>
        </div>
      </div>

      {/* Geri Bildirim Bildirimi */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-start justify-between text-xs sm:text-sm shadow-xs transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-medium leading-relaxed">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 ml-4 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. REFERANS LMS STANDARDI: KPI Kartları + Çakışma Telemetrisi */}
      <div className="space-y-3">
        <KpiStrip
          columns={5}
          items={[
            {
              label: 'Toplam Oturum',
              value: stats.total,
              icon: <Calendar className="w-4 h-4" />,
              subtext: 'Kayıtlı oturum havuzu',
            },
            {
              label: 'Yoklama Açık',
              value: stats.openAttendance,
              icon: <Clock className="w-4 h-4" />,
              subtext: 'Eğitmen girişi bekleniyor',
              badge: (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
                </span>
              ),
            },
            {
              label: 'Planlanan',
              value: stats.scheduled,
              icon: <Calendar className="w-4 h-4" />,
              subtext: 'Takvimde bekleyen ders',
            },
            {
              label: 'Tamamlanan',
              value: stats.completed,
              icon: <CheckCircle2 className="w-4 h-4" />,
              subtext: 'Yoklaması kapatıldı',
            },
            {
              label: 'İptal Edilen',
              value: stats.cancelled,
              icon: <XCircle className="w-4 h-4" />,
              subtext: 'Paydadan muaf tutuldu',
            },
          ]}
        />

        {/* Telemetri Güvenlik Şeridi: Çakışma ve Salon Durumu */}
        <div className="p-3.5 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Çakışma Güvenlik Radarı:</strong> Sistemde planlanan tüm oturumlar eğitmen ve derslik bazında ayrıştırılmıştır. (0 Çakışma)
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Saat Dilimi: <strong>Europe/Istanbul (TSİ)</strong></span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Tanımlı Mekân: <strong>{locations.length} Salon</strong></span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. FİLTRELEME & GÖRÜNÜM SEÇİCİ ŞERİDİ (LINEAR & CANVAS LMS STANDARDI) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Sol Alan: Arama ve Seçici Filtreler */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Hızlı Arama */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ders, eğitmen veya salon ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Grup Filtresi */}
          <div className="w-full sm:w-auto">
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Tüm Gruplar ({groups.length} Şube)</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.programTitle} — {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Durum Filtresi */}
          <div className="w-full sm:w-auto">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="scheduled">Planlandı</option>
              <option value="attendance_open">Yoklama Açık</option>
              <option value="completed">Tamamlandı</option>
              <option value="cancelled">İptal Edildi</option>
            </select>
          </div>

          {(searchQuery || selectedGroupId !== 'all' || selectedStatus !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedGroupId('all');
                setSelectedStatus('all');
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Filtreleri Temizle</span>
            </button>
          )}
        </div>

        {/* Sağ Alan: İkili Görünüm Anahtarı (Tablo vs Haftalık Çizelge) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('timetable')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'timetable'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Haftalık Çizelge</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'table'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Liste Tablosu</span>
          </button>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* 4. A. HAFTALIK ZAMAN ÇİZELGESİ (TIMETABLE MATRIX VIEW)                 */}
      {/* ===================================================================== */}
      {viewMode === 'timetable' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                <span>Haftalık Oturum & Salon Matrisi</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Oturumların haftalık takvim akışındaki dağılımı ve derslik tahsisleri.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Hafta Seçici */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Hafta:</span>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                >
                  {weekOptions.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gün Aralığı Seçici (5 Gün vs 7 Gün) */}
              <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-white shadow-2xs h-8">
                <button
                  type="button"
                  onClick={() => setDayRange('5days')}
                  className={`h-6 px-2 rounded-md text-[11px] font-semibold transition ${
                    dayRange === '5days'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Pazartesi - Cuma (Haftaiçi)"
                >
                  5 Gün
                </button>
                <button
                  type="button"
                  onClick={() => setDayRange('7days')}
                  className={`h-6 px-2 rounded-md text-[11px] font-semibold transition ${
                    dayRange === '7days'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Pazartesi - Pazar (Tüm Hafta)"
                >
                  7 Gün
                </button>
              </div>
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-semibold text-sm text-slate-800">Seçili filtrelere uygun oturum bulunamadı.</p>
              <p className="text-xs text-slate-400">
                Filtreleri sıfırlayarak veya yeni oturum planlayarak takvimi görüntüleyebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="p-4 sm:p-5 overflow-x-auto [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              <div
                className={`grid gap-3.5 ${
                  dayRange === '5days'
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-5 min-w-[950px]'
                    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 min-w-[1250px]'
                }`}
              >
                {daysOfWeek.map((day) => {
                  const daySessions = sessionsByDay[day.key] || [];
                  const hasSessions = daySessions.length > 0;

                  return (
                    <div
                      key={day.key}
                      className={`rounded-xl border flex flex-col min-h-[340px] transition-all min-w-[170px] ${
                        hasSessions ? 'bg-slate-50/60 border-slate-200' : 'bg-slate-50/20 border-slate-200/50'
                      }`}
                    >
                      {/* Gün Başlığı */}
                      <div className="p-3 border-b border-slate-200/80 bg-white rounded-t-xl flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{day.label}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            hasSessions
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {daySessions.length} Ders
                        </span>
                      </div>

                      {/* Gün İçi Oturum Kartları */}
                      <div className="p-2 space-y-2.5 flex-1">
                        {daySessions.length === 0 ? (
                          <div className="h-full flex items-center justify-center p-4 text-center">
                            <span className="text-[11px] text-slate-400 italic">Ders planlanmadı</span>
                          </div>
                        ) : (
                          daySessions.map((sess) => {
                            const isLive = sess.status === 'attendance_open' || sess.status === 'active';
                            const isDone = sess.status === 'completed';
                            const isCancelled = sess.status === 'cancelled';

                            return (
                              <div
                                key={sess.id}
                                className={`p-3 rounded-xl border text-xs space-y-2 transition-all shadow-2xs ${
                                  isLive
                                    ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300/50'
                                    : isDone
                                    ? 'bg-white border-slate-200 opacity-90'
                                    : isCancelled
                                    ? 'bg-rose-50/60 border-rose-200 opacity-70'
                                    : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                                }`}
                              >
                                {/* Saat & Durum Rozeti (Taşma Önleyici Kompakt Tasarım) */}
                                <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-100">
                                  <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1 tabular-nums">
                                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{sess.startTime}</span>
                                  </span>

                                  <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                                      isLive
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : isDone
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : isCancelled
                                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        isLive
                                          ? 'bg-amber-600'
                                          : isDone
                                          ? 'bg-emerald-600'
                                          : isCancelled
                                          ? 'bg-rose-600'
                                          : 'bg-slate-400'
                                      }`}
                                    />
                                    <span>
                                      {isLive
                                        ? 'Yoklama Açık'
                                        : isDone
                                        ? 'Tamamlandı'
                                        : isCancelled
                                        ? 'İptal'
                                        : 'Planlandı'}
                                    </span>
                                  </span>
                                </div>

                                {/* Oturum Başlığı & Grup */}
                                <div className="space-y-0.5">
                                  <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2" title={sess.title}>
                                    Oturum {sess.sessionNumber}: {sess.title}
                                  </h4>
                                  <p className="text-[10px] text-slate-500 font-medium truncate" title={sess.groupName}>
                                    {sess.groupName}
                                  </p>
                                </div>

                                {/* Eğitmen & Derslik Bilgisi */}
                                <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                                  <div className="flex items-center gap-1.5 truncate font-medium">
                                    <Users className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{sess.instructorName}</span>
                                  </div>

                                  <div className="flex items-center gap-1.5 truncate">
                                    {sess.isOnline ? (
                                      <span className="text-blue-600 font-semibold flex items-center gap-1">
                                        <Video className="w-3 h-3 shrink-0" /> Online Ders
                                      </span>
                                    ) : (
                                      <span className="text-slate-500 flex items-center gap-1 truncate">
                                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span className="truncate">{sess.location}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Kart İçi Hızlı Aksiyon */}
                                <div className="pt-1.5 flex items-center justify-end gap-1.5 border-t border-slate-100">
                                  {sess.status === 'scheduled' && (
                                    <button
                                      type="button"
                                      onClick={() => handleStatusChange(sess.id, 'attendance_open')}
                                      className="text-[10px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                                      title="Yoklamayı derse hazırla"
                                    >
                                      Yoklamayı Aç
                                    </button>
                                  )}
                                  {sess.status !== 'cancelled' && sess.status !== 'completed' && (
                                    <button
                                      type="button"
                                      onClick={() => setCancelModalSession(sess)}
                                      className="text-[10px] font-medium text-slate-400 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                                    >
                                      İptal
                                    </button>
                                  )}
                                </div>

                              </div>
                            );
                          })
                        )}
                      </div>

                    </div>
                  );
                })}

              </div>
            </div>
          )}

        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. B. LİSTE TABLOSU GÖRÜNÜMÜ (TABLE VIEW)                            */}
      {/* ===================================================================== */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-blue-600" />
              <span>Ders Oturumları Listesi ({filteredSessions.length} Oturum)</span>
            </h2>
            <span className="text-xs text-slate-500">Program ve şube bazında planlanmış dersler</span>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
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
                    <th className="py-3 px-4">No / Oturum Başlığı</th>
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
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          Oturum {sess.sessionNumber}: {sess.title}
                        </div>
                        {sess.topic && (
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{sess.topic}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800">{sess.groupName}</div>
                        <div className="text-[10px] text-slate-500">{sess.programTitle}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-medium text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sess.date}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sess.startTime} - {sess.endTime}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-800">{sess.instructorName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          {sess.isOnline ? (
                            <span className="flex items-center gap-1 text-blue-600 font-medium">
                              <Video className="w-3 h-3" /> Online Ders
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-600">
                              <MapPin className="w-3 h-3 text-slate-400" /> {sess.location}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">{getStatusBadge(sess.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {sess.status === 'scheduled' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(sess.id, 'attendance_open')}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-semibold text-[11px] transition cursor-pointer"
                              title="Yoklamayı aç"
                            >
                              Yoklamayı Aç
                            </button>
                          )}
                          {sess.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => setCancelModalSession(sess)}
                              className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-300 rounded-lg font-semibold text-[11px] transition cursor-pointer"
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
      )}

      {/* ===================================================================== */}
      {/* 5. YENİ OTURUM OLUŞTURMA MODALI (Çakışma Kontrollü)                   */}
      {/* ===================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-brand-navy text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base">Yeni Ders Oturumu Planla</h3>
                <p className="text-xs text-slate-300 mt-0.5">Program, grup, eğitmen ve saat tanımlama</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowCreateModal(false); setCreateModalError(null); }}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden text-xs">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Modal Hata Uyarısı */}
              {createModalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="font-semibold">{createModalError}</span>
                </div>
              )}

              {/* Canlı Çakışma Uyarısı */}
              {liveConflictWarning && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Çakışma Tespit Edildi!</span>
                    <p className="mt-0.5 text-[11px] leading-relaxed">{liveConflictWarning}</p>
                  </div>
                </div>
              )}

              {/* Grup Seçimi */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Eğitim Grubu / Şube *
                </label>
                <select
                  value={newGroupId}
                  onChange={(e) => {
                    setNewGroupId(e.target.value);
                    setNewTitle('');
                    setNewTopic('');
                  }}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-800"
                  required
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.programTitle} — {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Müfredat Modülü Şablon Seçimi */}
              {availableModules.length > 0 && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
                  <label className="block font-bold text-blue-900 text-[11px]">
                    Katalog Müfredat Modülünden Otomatik Doldur:
                  </label>
                  <select
                    onChange={(e) => handleSelectModule(e.target.value)}
                    defaultValue=""
                    className="w-full text-xs border border-blue-300 rounded-lg p-2 bg-white text-slate-800"
                  >
                    <option value="">-- Müfredattan Ders Konusu Seçiniz --</option>
                    {availableModules.map((m: CurriculumModule, idx: number) => (
                      <option key={idx} value={m.title}>
                        Oturum {m.sessionNumber || idx + 1}: {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Başlık & Konu */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Oturum Başlığı *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Örn: E-Ticaret Altyapıları ve Pazaryeri Entegrasyonu"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  İşlenecek Konu Detayı (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Örn: API anahtarları, XML ürün aktarımı, stok senkronizasyonu"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              {/* Tarih ve Saatler */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tarih *</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Başlangıç *</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bitiş *</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                    required
                  />
                </div>
              </div>

              {/* Eğitmen ve Yer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Eğitmen *</label>
                  <select
                    value={newInstructorId}
                    onChange={(e) => setNewInstructorId(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-800"
                  >
                    {instructorOptions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.expertise})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <VenuePicker
                    value={newLocation}
                    onChange={(val) => setNewLocation(val)}
                    customValue={customLocation}
                    onCustomChange={(val) => setCustomLocation(val)}
                    label="Derslik ve Oturum Mekânı"
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
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              )}

              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setCreateModalError(null); }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition font-medium cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={Boolean(liveConflictWarning)}
                  className={`px-4 py-2 text-white rounded-xl transition font-semibold shadow-xs cursor-pointer ${
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
      {/* 6. OTURUM İPTAL MODALI (Gerekçeli ve Hesap Dışı Bırakan)              */}
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
                type="button"
                onClick={() => { setCancelModalSession(null); setCancelModalError(null); }}
                className="text-red-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="p-6 space-y-4 text-xs">
              {cancelModalError && (
                <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-950 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                  <span className="font-semibold">{cancelModalError}</span>
                </div>
              )}

              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-900">
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
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setCancelModalSession(null); setCancelModalError(null); }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition font-semibold shadow-xs cursor-pointer"
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
