import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  FileText,
  MessageSquare,
  ChevronRight,
  ArrowRight,
  BarChart3,
  UserCheck,
  ListOrdered,
  X,
  Bell,
  Info,
  TrendingUp,
} from 'lucide-react';
import {
  Session,
  Assignment,
  Conversation,
} from '../types';
import { AdminAnnouncement } from '../types/notificationTypes';
import { Button } from '../components/ui/Button';
import { KpiStrip } from '../components/ui/KpiStrip';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { getStoredGroups, getGroupCapacityStats } from '../services/enrollmentStorage';
import {
  getSessionsByGroup,
  subscribeToSessionUpdates,
  subscribeToAttendanceUpdates,
} from '../services/sessionStorage';
import {
  getCourseAssignmentsByGroup,
  getStoredSubmissions,
  subscribeToAssignmentUpdates,
} from '../services/assignmentStorage';
import { calculateGroupAttendanceSummary } from '../services/attendanceEngine';
import {
  getStoredAdminAnnouncements,
  subscribeToAdminAnnouncementUpdates,
} from '../services/notificationStorage';
import {
  getStoredConversations,
  CONVERSATIONS_UPDATE_EVENT,
} from '../services/messageStorage';
import { calculateBatchEligibility } from '../services/successEngine';

interface TraineeSummaryRow {
  traineeId: string;
  traineeName: string;
  groupName: string;
  attendanceRate: number;
  approvedAssignments: number;
  totalAssignments: number;
  assignmentPercent: number;
  status: 'active' | 'warning' | 'not_started';
  statusLabel: string;
}

export const InstructorDashboardPage: React.FC = () => {
  const { currentUser } = useDemoRole();
  const navigate = useNavigate();

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedTraineeModal, setSelectedTraineeModal] = useState<TraineeSummaryRow | null>(null);
  const [selectedAnnouncementModal, setSelectedAnnouncementModal] = useState<AdminAnnouncement | null>(null);

  // Reaktif veri dinleyicileri
  useEffect(() => {
    const unsubSession = subscribeToSessionUpdates(() => setRefreshTrigger((p) => p + 1));
    const unsubAttendance = subscribeToAttendanceUpdates(() => setRefreshTrigger((p) => p + 1));
    const unsubAssignment = subscribeToAssignmentUpdates(() => setRefreshTrigger((p) => p + 1));
    const unsubAnnouncements = subscribeToAdminAnnouncementUpdates(() => setRefreshTrigger((p) => p + 1));

    const handleConv = () => setRefreshTrigger((p) => p + 1);
    window.addEventListener(CONVERSATIONS_UPDATE_EVENT, handleConv);

    return () => {
      unsubSession();
      unsubAttendance();
      unsubAssignment();
      unsubAnnouncements();
      window.removeEventListener(CONVERSATIONS_UPDATE_EVENT, handleConv);
    };
  }, []);

  // Tüm Gruplar ve Eğitmene Atanmış Gruplar
  const allGroups = useMemo(() => {
    return getStoredGroups();
  }, [refreshTrigger]);

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

  const primaryGroup = instructorAssignedGroups[0] || null;

  // Eğitmenin gruplarına ait oturumlar
  const allInstructorSessions = useMemo(() => {
    const sessions: Session[] = [];
    instructorAssignedGroups.forEach((grp) => {
      const list = getSessionsByGroup(grp.id);
      sessions.push(...list);
    });
    return sessions;
  }, [instructorAssignedGroups, refreshTrigger]);

  // Eğitmenin gruplarına ait ödevler ve teslimler
  const allInstructorAssignments = useMemo(() => {
    const assignments: Assignment[] = [];
    instructorAssignedGroups.forEach((grp) => {
      const list = getCourseAssignmentsByGroup(grp.id, true);
      assignments.push(...list);
    });
    return assignments;
  }, [instructorAssignedGroups, refreshTrigger]);

  const allSubmissions = useMemo(() => {
    const raw = getStoredSubmissions();
    const assignmentIds = new Set(allInstructorAssignments.map((a) => a.id));
    return raw.filter((s) => assignmentIds.has(s.assignmentId));
  }, [allInstructorAssignments, refreshTrigger]);

  // Değerlendirme bekleyen ödev teslimleri
  const pendingSubmissions = useMemo(() => {
    return allSubmissions.filter(
      (s) => s.status === 'under_review' || s.status === 'resubmitted' || s.status === 'submitted'
    );
  }, [allSubmissions]);

  // Yoklama bekleyen oturumlar
  const pendingAttendanceSessions = useMemo(() => {
    return allInstructorSessions.filter(
      (s) => s.status === 'attendance_open' || s.status === 'scheduled' || s.status === 'active'
    );
  }, [allInstructorSessions]);

  // Bugünkü oturum sayısı (Gerçek veri kontrolü)
  const todaySessionsCount = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return allInstructorSessions.filter(
      (s) => s.date === todayStr || s.status === 'attendance_open' || s.status === 'active'
    ).length;
  }, [allInstructorSessions]);

  const pendingAttendanceCount = useMemo(() => {
    return pendingAttendanceSessions.length;
  }, [pendingAttendanceSessions]);

  const pendingSubmissionsCount = useMemo(() => {
    return pendingSubmissions.length;
  }, [pendingSubmissions]);

  // Sınıf Katılım Oranı Hesaplaması
  const overallAttendanceRate = useMemo(() => {
    const rates: number[] = [];
    instructorAssignedGroups.forEach((g) => {
      const summary = calculateGroupAttendanceSummary(g.id);
      if (summary.averageAttendanceRate !== null) {
        rates.push(summary.averageAttendanceRate);
      }
    });
    if (rates.length === 0) return 0;
    return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
  }, [instructorAssignedGroups, refreshTrigger]);

  // Eğitmene gelen kursiyer mesajları
  const conversations = useMemo(() => {
    const all = getStoredConversations();
    const matched = all.filter((c: Conversation) => c.instructorId === currentUser.id);
    return matched.length > 0 ? matched : [];
  }, [currentUser.id, refreshTrigger]);

  // Kurumsal Oda Duyuruları
  const announcements = useMemo(() => {
    const all = getStoredAdminAnnouncements();
    return all.filter((a: AdminAnnouncement) => a.status === 'published').slice(0, 2);
  }, [refreshTrigger]);

  // Kısa Özet Tablosu için Kursiyer İlerleme Verileri
  const traineeProgressSummary = useMemo<TraineeSummaryRow[]>(() => {
    const rows: TraineeSummaryRow[] = [];

    if (primaryGroup) {
      const batch = calculateBatchEligibility(undefined, undefined, primaryGroup.id);
      if (batch.length > 0) {
        batch.slice(0, 5).forEach((item, idx) => {
          const rate = item.attendanceRate !== null && item.attendanceRate !== undefined ? item.attendanceRate : 0;
          const approved = item.mandatoryAssignmentsApproved ?? 0;
          const total = item.mandatoryAssignmentsTotal || 0;
          const percent = total > 0 ? Math.round((approved / total) * 100) : 0;

          let status: 'active' | 'warning' | 'not_started' = 'active';
          let statusLabel = 'Aktif';

          if (rate === 0 && approved === 0) {
            status = 'not_started';
            statusLabel = 'Başlamadı';
          } else if (rate < 70 || approved < (total > 0 ? 1 : 0)) {
            status = 'warning';
            statusLabel = 'Takip Gerekiyor';
          }

          rows.push({
            traineeId: item.traineeId || `tr-${idx}`,
            traineeName: item.traineeName,
            groupName: primaryGroup.name.split(' ')[0] + ' ' + (primaryGroup.name.split(' ')[1] || 'A'),
            attendanceRate: rate,
            approvedAssignments: approved,
            totalAssignments: total,
            assignmentPercent: percent,
            status,
            statusLabel,
          });
        });
      }
    }

    return rows;
  }, [primaryGroup, refreshTrigger]);

  // Günün Türkçe Tarih Bilgisi
  const formattedTodayDate = useMemo(() => {
    const now = new Date();
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
    ];
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${days[now.getDay()]}`;
  }, []);

  const todayDateObj = useMemo(() => new Date(), []);
  const todayDayNumber = todayDateObj.getDate();
  const monthLabels = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const dayLabels = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const todayMonthLabel = monthLabels[todayDateObj.getMonth()];
  const todayDayName = dayLabels[todayDateObj.getDay()];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* ===================================================================== */}
      {/* 1. ÜST BAŞLIK VE HIZLI İŞLEM BUTONLARI (STANDART DÜZ BAŞLIK)         */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1">
            {formattedTodayDate}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Merhaba, <span className="text-blue-600">{currentUser.fullName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Bugünkü ders oturumlarınızı, manuel yoklama girişlerini ve ödev değerlendirmelerinizi buradan yönetin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/egitmen/dersler"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-2xs whitespace-nowrap"
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>Manuel Yoklama Al</span>
          </Link>
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
            <span>Ödev Değerlendirme</span>
          </Link>
          <Link
            to="/egitmen/mesajlar"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <MessageSquare className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Kursiyer Mesajları</span>
          </Link>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. DÖRT TEMEL GÖSTERGE METRİK BANDI (CANVAS LMS / STRIPE STANDARDI)  */}
      {/* ===================================================================== */}
      <KpiStrip
        items={[
          {
            label: 'Atanmış Gruplarım',
            value: `${instructorAssignedGroups.length} Grup`,
            icon: <Users className="w-4 h-4" />,
            subtext: primaryGroup ? primaryGroup.name : 'Atanmış şube',
            to: '/egitmen/dersler',
          },
          {
            label: 'Bugünkü Oturumlar',
            value: `${todaySessionsCount} Oturum`,
            icon: <Calendar className="w-4 h-4" />,
            subtext: todaySessionsCount > 0 ? 'Ders planı hazır' : 'Bugün planlanmış ders yok',
            to: '/egitmen/takvim',
          },
          {
            label: 'Yoklama Bekleyen',
            value: `${pendingAttendanceCount} Ders`,
            icon: <UserCheck className="w-4 h-4" />,
            subtext: pendingAttendanceCount > 0 ? 'Manuel onay bekleniyor' : 'Tüm yoklamalar tamamlandı',
            to: '/egitmen/dersler',
            badge: pendingAttendanceCount > 0 ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Açık
              </span>
            ) : undefined,
          },
          {
            label: 'Değerlendirme Bekleyen',
            value: `${pendingSubmissionsCount} Teslim`,
            icon: <FileText className="w-4 h-4" />,
            subtext: pendingSubmissionsCount > 0 ? 'Puanlama & revizyon havuzu' : 'Tüm teslimler incelendi',
            to: '/egitmen/odevler',
            badge: pendingSubmissionsCount > 0 ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Bekliyor
              </span>
            ) : undefined,
          },
        ]}
      />

      {/* ===================================================================== */}
      {/* 3. ORTA SATIR: ÖNCELİKLİ İŞLERİM & DUYURULAR (SOL) • PROGRAM & KATILIM & GRUPLAR (SAĞ) */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* SOL KOLON: Öncelikli İşlerim + Kurumsal Duyurular (~60% / 7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 3.1 Öncelikli İşlerim */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Öncelikli İşlerim</h2>
              </div>
              <Link
                to="/egitmen/dersler"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
              >
                Tümünü Gör <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>

            <div className="space-y-3">
              {/* İş 1: Yoklama */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-50/70 transition gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">Yoklama tamamlanacak</h4>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5">
                      {primaryGroup?.programTitle || 'İslahiye Biberi & Tarımsal E-Ticaret'} • {primaryGroup?.name.split(' ')[0] || 'Grup A'}
                    </p>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Bugün 14:00 – 17:00 • Seminer Salonu B
                    </span>
                  </div>
                </div>
                <Link
                  to="/egitmen/dersler"
                  className="px-3.5 py-1.5 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-semibold transition shrink-0 whitespace-nowrap"
                >
                  Yoklamayı Aç
                </Link>
              </div>

              {/* İş 2: Ödev Değerlendirme */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-50/70 transition gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {pendingSubmissionsCount} ödev teslimi değerlendirme bekliyor
                    </h4>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5">
                      Ürün Listeleme ve Kargo • {primaryGroup?.name.split(' ')[0] || 'Grup A'}
                    </p>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Son teslim: 22 Tem 2026
                    </span>
                  </div>
                </div>
                <Link
                  to="/egitmen/odevler"
                  className="px-3.5 py-1.5 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-semibold transition shrink-0 whitespace-nowrap"
                >
                  Değerlendir
                </Link>
              </div>

              {/* İş 3: Yeni Kursiyer Mesajı */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-50/70 transition gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">Yeni kursiyer mesajı</h4>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5">
                      {primaryGroup?.name.split(' ')[0] || 'Grup A'} • Danışma görüşmesi
                    </p>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {conversations[0]?.traineeName || 'Ayşe Yılmaz'} tarafından gönderildi • 10:24
                    </span>
                  </div>
                </div>
                <Link
                  to="/egitmen/mesajlar"
                  className="px-3.5 py-1.5 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-semibold transition shrink-0 whitespace-nowrap"
                >
                  Mesajı Gör
                </Link>
              </div>
            </div>
          </div>

          {/* 3.2 Kurumsal Oda Duyuruları (Faydalı Eski Öğe) */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Kurumsal Duyurular</h2>
              </div>
              <Link
                to="/bildirimler"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
              >
                Tümünü Gör <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {announcements.map((ann, i) => (
                <div
                  key={ann.id}
                  onClick={() => setSelectedAnnouncementModal(ann)}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50/70 transition cursor-pointer group"
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      i === 0 ? 'bg-red-500 ring-2 ring-red-100' : 'bg-blue-500 ring-2 ring-blue-100'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                      {ann.title}
                    </h4>
                    <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                      İslahiye Ticaret Odası • {new Date(ann.publishDate || ann.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: Program + Sınıf Katılım Dairesel Grafiği + Gruplar (~40% / 5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 3.3 Bugünkü Program */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Bugünkü Program</h2>
              </div>
              <Link
                to="/egitmen/dersler"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
              >
                Tüm Takvim <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>

            <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-lg w-12 h-14 shrink-0 shadow-2xs">
                <span className="text-base font-extrabold text-slate-900 leading-none">{todayDayNumber}</span>
                <span className="text-[10px] font-bold text-blue-600 uppercase mt-0.5">{todayMonthLabel}</span>
                <span className="text-[9px] text-slate-400">{todayDayName}</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {primaryGroup?.programTitle || 'İslahiye Biberi & Tarımsal E-Ticaret'}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  {primaryGroup?.name.split(' ')[0] || 'Grup A'} • 14:00 – 17:00
                </p>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/60 text-[11px]">
                  <span className="text-slate-500">Seminer Salonu B</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Planlandı
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3.4 Sınıf Katılım & Baraj Sağlığı (Dairesel Grafik — Donut Chart) */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Katılım & Başarı Sağlığı</h2>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Hedef %80
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 justify-between">
              {/* Dairesel SVG Grafiği */}
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                  {/* Arka Plan Çemberi */}
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    className="stroke-slate-100"
                    strokeWidth="11"
                    fill="transparent"
                  />
                  {/* Aktif Devam Çemberi */}
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    className="stroke-blue-600 transition-all duration-700"
                    strokeWidth="11"
                    strokeDasharray={289}
                    strokeDashoffset={289 - (289 * overallAttendanceRate) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold text-slate-900 leading-none">
                    %{overallAttendanceRate}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mt-1">
                    Ortalama Devam
                  </span>
                </div>
              </div>

              {/* Lejant Bilgileri */}
              <div className="space-y-2 text-xs w-full sm:w-auto">
                <div className="flex items-center justify-between sm:justify-start gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                    <span className="text-slate-600">%80 Devam Barajı</span>
                  </div>
                  <strong className="font-bold text-emerald-700 ml-auto">Uygun</strong>
                </div>

                <div className="flex items-center justify-between sm:justify-start gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-slate-600">Ödev Ortalaması</span>
                  </div>
                  <strong className="font-bold text-slate-900 ml-auto">Min 70</strong>
                </div>

                <div className="flex items-center justify-between sm:justify-start gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                    <span className="text-slate-600">Zorunlu Ödevler</span>
                  </div>
                  <strong className="font-bold text-slate-900 ml-auto">Onay Şartı</strong>
                </div>
              </div>
            </div>

            {/* Alt Mikro Bilgilendirme */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-slate-600">
              <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Sınıf genelinde devam oranı %80 barajının üzerindedir. Nihai başarı tescili oda yönetimi tarafından onaylanır.
              </p>
            </div>
          </div>

          {/* 3.5 Atandığım Gruplar */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Atandığım Gruplar</h2>
              </div>
              <Link
                to="/egitmen/gruplar"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
              >
                Grupları Gör <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>

            <div className="space-y-2">
              {instructorAssignedGroups.slice(0, 2).map((grp) => {
                const stats = getGroupCapacityStats(grp.id);
                const traineeCount = stats.assignedCount;

                return (
                  <Link
                    key={grp.id}
                    to="/egitmen/gruplar"
                    className="flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50/70 transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                          {grp.name.split(' (')[0]}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {grp.programTitle}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-slate-500 group-hover:text-blue-600 flex items-center gap-1 shrink-0">
                      {traineeCount} kursiyer <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. ALT SATIR: KURSİYER İLERLEMESİ — KISA ÖZET TABLOSU (TAM GENİŞLİK)  */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Kursiyer İlerlemesi — Kısa Özet</h2>
          </div>
          <Link
            to="/egitmen/ilerleme"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
          >
            Tüm Kursiyerleri Gör <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        <div className="overflow-x-auto max-h-[460px] overflow-y-auto relative rounded-lg border border-slate-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs">
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 font-semibold bg-slate-50">Kursiyer</th>
                <th className="py-2.5 px-3 font-semibold bg-slate-50">Grup</th>
                <th className="py-2.5 px-3 font-semibold bg-slate-50">Devam</th>
                <th className="py-2.5 px-3 font-semibold bg-slate-50">Ödev</th>
                <th className="py-2.5 px-3 font-semibold bg-slate-50">Durum</th>
                <th className="py-2.5 px-3 font-semibold text-right bg-slate-50">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {traineeProgressSummary.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    Henüz kayıtlı kursiyer veya hesaplanmış akademik ilerleme verisi bulunmuyor.
                  </td>
                </tr>
              ) : (
                traineeProgressSummary.map((item) => (
                <tr key={item.traineeId} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-3 font-bold text-slate-900">{item.traineeName}</td>
                  <td className="py-3.5 px-3 text-slate-600">{item.groupName}</td>

                  {/* Devam Çubuğu */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-slate-800 w-9 tabular-nums">%{item.attendanceRate}</span>
                      <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{ width: `${item.attendanceRate}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Ödev Çubuğu */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-slate-800 w-9 tabular-nums">
                        {item.approvedAssignments} / {item.totalAssignments}
                      </span>
                      <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            item.assignmentPercent >= 60 ? 'bg-emerald-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${item.assignmentPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Durum Rozeti */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold inline-block ${
                        item.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'warning'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {item.statusLabel}
                    </span>
                  </td>

                  {/* Detayları Gör İşlemi */}
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => setSelectedTraineeModal(item)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                    >
                      <span>Detayları Gör</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* KURSİYER HIZLI İNCELEME MODALI                                        */}
      {/* ===================================================================== */}
      {selectedTraineeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">{selectedTraineeModal.traineeName}</h3>
                <p className="text-xs text-slate-300 mt-0.5">{selectedTraineeModal.groupName} — İlerleme Özeti</p>
              </div>
              <button
                onClick={() => setSelectedTraineeModal(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Devam Durumu:</span>
                  <span className={`font-bold text-sm ${selectedTraineeModal.attendanceRate >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    %{selectedTraineeModal.attendanceRate} {selectedTraineeModal.attendanceRate >= 80 ? '(Baraj Sağlandı)' : '(Baraj Altında)'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Zorunlu Ödev Onayları:</span>
                  <span className="font-bold text-sm text-slate-900">
                    {selectedTraineeModal.approvedAssignments} / {selectedTraineeModal.totalAssignments} Onaylı
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-700 font-semibold">Genel Başarı Durumu:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedTraineeModal.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedTraineeModal.status === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {selectedTraineeModal.statusLabel}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedTraineeModal(null)}>
                  Kapat
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedTraineeModal(null);
                    navigate('/egitmen/ilerleme');
                  }}
                >
                  Tam Kütük Sayfasını Aç →
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* KURUMSAL DUYURU DETAY MODALI                                          */}
      {/* ===================================================================== */}
      {selectedAnnouncementModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">{selectedAnnouncementModal.title}</h3>
                <p className="text-xs text-slate-300 mt-0.5">İslahiye Ticaret Odası Kurumsal Duyurusu</p>
              </div>
              <button
                onClick={() => setSelectedAnnouncementModal(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {selectedAnnouncementModal.content}
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                <Button size="sm" onClick={() => setSelectedAnnouncementModal(null)}>
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
