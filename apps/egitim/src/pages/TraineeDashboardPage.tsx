import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  CheckSquare,
  Award,
  ArrowRight,
  ChevronRight,
  FileText,
  Bell,
  MessageSquare,
  Info,
  BarChart3,
  MapPin,
  Clock,
  User,
} from 'lucide-react';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { KpiStrip } from '../components/ui/KpiStrip';
import {
  getActiveAssignmentForCandidate,
  getGroupById,
  getStoredGroups,
} from '../services/enrollmentStorage';
import {
  getSessionsByGroup,
  getStoredAttendanceRecords,
  subscribeToSessionUpdates,
  subscribeToAttendanceUpdates,
} from '../services/sessionStorage';
import { calculateTraineeAttendance } from '../services/attendanceEngine';
import {
  getCourseAssignmentsByGroup,
  getLatestSubmission,
  subscribeToAssignmentUpdates,
} from '../services/assignmentStorage';
import { calculateTraineeAssignmentPerformance } from '../services/assignmentEngine';
import {
  getCertificatesByCandidateId,
  subscribeToCertificateUpdates,
} from '../services/certificateStorage';
import {
  getStoredAdminAnnouncements,
  subscribeToAdminAnnouncementUpdates,
} from '../services/notificationStorage';
import {
  getStoredConversations,
  CONVERSATIONS_UPDATE_EVENT,
} from '../services/messageStorage';
import {
  getStoredTraineeProfile,
  subscribeToProfileUpdates,
} from '../services/traineeProfileStorage';
import { Session, AdminAnnouncement } from '../types';

export const TraineeDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useDemoRole();

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [profile, setProfile] = useState(getStoredTraineeProfile);
  const [selectedSessionModal, setSelectedSessionModal] = useState<Session | null>(null);
  const [selectedAnnouncementModal, setSelectedAnnouncementModal] = useState<AdminAnnouncement | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');

  // Reaktif veri güncellemeleri
  useEffect(() => {
    const unsubSession = subscribeToSessionUpdates(() => setRefreshTrigger((p) => p + 1));
    const unsubAttendance = subscribeToAttendanceUpdates(() => setRefreshTrigger((p) => p + 1));
    const unsubAssignment = subscribeToAssignmentUpdates(() => setRefreshTrigger((p) => p + 1));
    const unsubCertificate = subscribeToCertificateUpdates(() => setRefreshTrigger((p) => p + 1));
    const unsubAnnouncements = subscribeToAdminAnnouncementUpdates(() => setRefreshTrigger((p) => p + 1));
    const unsubProfile = subscribeToProfileUpdates((updated) => setProfile(updated));

    const handleConv = () => setRefreshTrigger((p) => p + 1);
    window.addEventListener(CONVERSATIONS_UPDATE_EVENT, handleConv);

    return () => {
      unsubSession();
      unsubAttendance();
      unsubAssignment();
      unsubCertificate();
      unsubAnnouncements();
      unsubProfile();
      window.removeEventListener(CONVERSATIONS_UPDATE_EVENT, handleConv);
    };
  }, []);

  // Aktif Kayıt & Grup
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

  // Oturumlar
  const groupSessions = useMemo(() => {
    if (!assignedGroup) return [];
    return getSessionsByGroup(assignedGroup.id);
  }, [assignedGroup, refreshTrigger]);

  // Yoklama Verileri
  const attendanceCalc = useMemo(() => {
    if (!assignedGroup) return null;
    return calculateTraineeAttendance(currentUser.id, assignedGroup.id, {
      enrollmentDate: activeAssignment?.assignedAt,
    });
  }, [currentUser.id, assignedGroup, activeAssignment, refreshTrigger]);

  const traineeAttendanceMap = useMemo(() => {
    const all = getStoredAttendanceRecords();
    const map = new Map<string, string>();
    all
      .filter((r) => r.traineeId === currentUser.id)
      .forEach((r) => map.set(r.sessionId, r.status));
    return map;
  }, [currentUser.id, refreshTrigger]);

  // Ödevler & Performans
  const groupAssignments = useMemo(() => {
    if (!assignedGroup) return [];
    return getCourseAssignmentsByGroup(assignedGroup.id);
  }, [assignedGroup, refreshTrigger]);

  const assignmentPerf = useMemo(() => {
    if (!assignedGroup) return null;
    return calculateTraineeAssignmentPerformance(currentUser.id, assignedGroup.id);
  }, [currentUser.id, assignedGroup, refreshTrigger]);

  // Belgeler
  const traineeCertificates = useMemo(() => {
    return getCertificatesByCandidateId(currentUser.id);
  }, [currentUser.id, refreshTrigger]);

  // Duyurular
  const announcements = useMemo(() => {
    const all = getStoredAdminAnnouncements();
    return all.filter((a) => a.status === 'published').slice(0, 3);
  }, [refreshTrigger]);

  // Mesajlar (Atanmış Eğitmen Görüşmeleri)
  const conversations = useMemo(() => {
    const all = getStoredConversations();
    return all.filter((c) => c.traineeId === currentUser.id || c.instructorId === currentUser.id).slice(0, 3);
  }, [currentUser.id, refreshTrigger]);

  // İsim formatlama
  const firstName = useMemo(() => {
    const name = profile.fullName || currentUser.fullName || 'Kursiyer';
    return name.split(' ')[0];
  }, [profile.fullName, currentUser.fullName]);

  // Bugünün Türkçe Tarihi
  const formattedTodayDate = useMemo(() => {
    const now = new Date();
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
    ];
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${days[now.getDay()]}`;
  }, []);

  // Yaklaşan Ders
  const upcomingSession = useMemo(() => {
    const sorted = [...groupSessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const future = sorted.find((s) => s.status === 'scheduled');
    return future || sorted[sorted.length - 1] || null;
  }, [groupSessions]);

  // Metrik Hesaplamaları (Gerçek Veri Bağlantısı)
  const attendedCount = attendanceCalc?.attendedCount ?? 0;
  const totalHeldSessions = attendanceCalc?.completedSessionsCount ?? groupSessions.filter((s) => s.status === 'completed').length;
  const attendanceRate = attendanceCalc?.attendanceRate ?? 0;

  const mandatoryTotal = assignmentPerf?.mandatoryAssignmentsTotal ?? groupAssignments.filter((a) => a.isMandatory || a.isRequired).length;
  const mandatoryApproved = assignmentPerf?.mandatoryAssignmentsApproved ?? 0;

  // Modül ve Oturum İlerlemesi
  const completedModules = groupSessions.filter((s) => s.status === 'completed').length;
  const inProgressModules = groupSessions.filter((s) => s.status === 'attendance_open' || s.status === 'active').length;
  const notStartedModules = groupSessions.filter((s) => s.status === 'scheduled').length;
  const overallProgressPercentage = groupSessions.length > 0 ? Math.round((completedModules / groupSessions.length) * 100) : 0;

  // Görüntülenecek Mesajlar
  const displayMessages = useMemo(() => {
    if (conversations.length > 0) {
      return conversations.map((c) => ({
        id: c.id,
        initials: (c.instructorName || 'Eğitmen')
          .split(' ')
          .map((p) => p[0])
          .join('')
          .slice(0, 2),
        color: 'bg-blue-600 text-white',
        name: c.instructorName,
        text: c.lastMessagePreview || 'Yeni mesaj...',
        time: c.lastMessageAt
          ? new Date(c.lastMessageAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
          : '14:32',
        unread: (c.unreadCountTrainee || 0) > 0,
      }));
    }
    return [];
  }, [conversations]);

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
            Merhaba, <span className="text-blue-600">{currentUser.fullName || firstName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Eğitim sürecinizle ilgili güncel bilgilere buradan ulaşabilirsiniz.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/kursiyer/dersler"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-2xs whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Derslerim</span>
          </Link>
          <Link
            to="/kursiyer/takvim"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Eğitim Takvimi</span>
          </Link>
          <Link
            to="/kursiyer/odevler"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Ödev Teslimi</span>
          </Link>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. KAYITLI AKTİF EĞİTİM PROGRAMI VE ŞUBE BİLGİSİ (HERO BANNER)         */}
      {/* ===================================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 md:p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Kayıtlı Aktif Program
            </span>
            <span className="text-xs text-slate-300 font-medium">
              {assignedGroup?.cohortName || '2026 Güz Dönemi'} • {assignedGroup?.name || 'Grup A — Sabah Oturumu'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {assignedGroup?.programTitle || 'İslahiye Biberi & Tarımsal E-Ticaret'}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Eğitmen: <strong className="text-white">{assignedGroup?.instructorNames?.[0] || 'Murat Özkan'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Derslik: <strong className="text-white">{assignedGroup?.location || 'İE Ana Derslik 1 (Zemin Kat)'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Zaman: <strong className="text-white">{assignedGroup?.scheduleSummary || 'Pazartesi & Çarşamba 09:30 - 12:30'}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
          <Link
            to="/kursiyer/dersler"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Müfredat Akışı</span>
          </Link>
          <Link
            to="/kursiyer/mesajlar"
            className="px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Eğitmene Yaz</span>
          </Link>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. DÖRT TEMEL GÖSTERGE METRİK BANDI (COURSERA / STRIPE STANDARDI)     */}
      {/* ===================================================================== */}
      <KpiStrip
        items={[
          {
            label: 'Devam Durumum',
            value: `%${attendanceRate}`,
            icon: <BookOpen className="w-4 h-4" />,
            subtext: `${attendedCount} / ${totalHeldSessions} Oturum Katılımı`,
            to: '/kursiyer/devam',
            badge: (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${attendanceRate >= 80 ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}>
                {attendanceRate >= 80 ? 'Baraj Geçildi' : 'Min %80'}
              </span>
            ),
          },
          {
            label: 'Tamamlanan Ödevler',
            value: `${mandatoryApproved} / ${mandatoryTotal}`,
            icon: <CheckSquare className="w-4 h-4" />,
            subtext: mandatoryTotal === 0
              ? 'Tanımlı ödev yok'
              : assignmentPerf?.isMandatoryAllApproved
                ? 'Tüm teslimler onaylandı'
                : 'Zorunlu ödevler inceleniyor',
            to: '/kursiyer/odevler',
          },
          {
            label: 'Alınan Belgeler',
            value: `${traineeCertificates.length} Belge`,
            icon: <Award className="w-4 h-4" />,
            subtext: traineeCertificates.length > 0
              ? traineeCertificates.map((c) => c.certificateTypeLabel).join(', ')
              : 'Dönem sonunda tescil edilir',
            to: '/kursiyer/belgeler',
          },
          {
            label: 'Yaklaşan Ders',
            value: upcomingSession
              ? `${upcomingSession.startTime} - ${upcomingSession.endTime}`
              : 'Planlanmış ders yok',
            icon: <Calendar className="w-4 h-4" />,
            subtext: upcomingSession
              ? (upcomingSession.topic || upcomingSession.title)
              : 'Gelecek dersler takvime işlendiğinde görünür',
            to: '/kursiyer/takvim',
          },
        ]}
      />

      {/* ===================================================================== */}
      {/* 3. ORTA SATIR: BU HAFTA DERSLERİM & EĞİTİM İLERLEMESİ (2 SÜTUN)       */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* SOL: Bu Hafta Derslerim (7 Sütun) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-base md:text-lg font-bold text-slate-900">
                Bu Hafta Derslerim
              </h2>
            </div>
            <Link
              to="/kursiyer/takvim"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
            >
              Tüm Takvimi Gör{' '}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          {/* Oturum Akışı Listesi (Timeline Format) */}
          <div className="space-y-3 pt-1">
            {groupSessions.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Bu Hafta İçin Planlanmış Ders Bulunmuyor</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                  Ders oturumları eğitmeniniz tarafından takvime işlendiğinde burada kronolojik olarak görüntülenecektir.
                </p>
              </div>
            ) : (
              groupSessions.slice(0, 3).map((session, index) => {
                const attStatus = traineeAttendanceMap.get(session.id);
                const isFirst = index === 0;
                const isCompleted = session.status === 'completed';

                // Tarih parçaları
                const dateObj = new Date(session.date);
                const dayNum = dateObj.getDate() || 22 + index * 2;
                const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
                const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cts'];
                const monthName = months[dateObj.getMonth()] || 'Eki';
                const dayName = days[dateObj.getDay()] || 'Sal';

                return (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSessionModal(session)}
                    className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition cursor-pointer group"
                  >
                    {/* Sol Tarih Bloğu */}
                    <div className="w-12 h-14 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col items-center justify-center shrink-0 text-center">
                      <span className="text-sm font-extrabold text-slate-900 leading-none">
                        {dayNum}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5 leading-none">
                        {monthName} {dayName}
                      </span>
                    </div>

                    {/* Zaman Çizgisi Noktası */}
                    <div className="flex flex-col items-center shrink-0">
                      <div
                        className={`w-3 h-3 rounded-full border-2 border-white shadow-xs ${isFirst
                          ? 'bg-blue-600'
                          : isCompleted
                            ? 'bg-emerald-600'
                            : 'bg-slate-300'
                          }`}
                      />
                    </div>

                    {/* Oturum İçeriği */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                        {session.topic || session.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <span>{session.startTime} - {session.endTime}</span>
                        <span>•</span>
                        <span className="truncate">{session.location || 'Seminer Salonu B'}</span>
                      </div>
                    </div>

                    {/* Durum Rozeti */}
                    <div className="shrink-0">
                      {isFirst ? (
                        <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 px-3 py-1 rounded-full">
                          Yaklaşıyor
                        </span>
                      ) : isCompleted ? (
                        <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-3 py-1 rounded-full">
                          {attStatus === 'attended' ? 'Katıldı' : 'Tamamlandı'}
                        </span>
                      ) : (
                        <span className="text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/60 px-3 py-1 rounded-full">
                          Planlandı
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SAĞ: Eğitim İlerlemesi (5 Sütun Donut Chart) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-5 md:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h2 className="text-base md:text-lg font-bold text-slate-900">
                  Eğitim İlerlemesi
                </h2>
              </div>
              <Link
                to="/kursiyer/dersler"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
              >
                Detaylı Gör{' '}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>

            {/* Donut Chart ve Lejant Izgarası (Etkileşimli / Dilim Vurgulu) */}
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-4">
              {/* SVG Donut Grafiği */}
              {(() => {
                const totalSessions = groupSessions.length || 1;
                const circ = 289;
                const completedStroke = (completedModules / totalSessions) * circ;
                const inProgressStroke = (inProgressModules / totalSessions) * circ;
                const notStartedStroke = (notStartedModules / totalSessions) * circ;

                const getCenterDisplay = () => {
                  switch (hoveredSegment) {
                    case 'completed':
                      return {
                        value: `${completedModules}`,
                        sub: 'Tamamlandı',
                        rate: `%${Math.round((completedModules / totalSessions) * 100)}`,
                        color: 'text-blue-700',
                      };
                    case 'in_progress':
                      return {
                        value: `${inProgressModules}`,
                        sub: 'Devam Eden',
                        rate: `%${Math.round((inProgressModules / totalSessions) * 100)}`,
                        color: 'text-blue-500',
                      };
                    case 'not_started':
                      return {
                        value: `${notStartedModules}`,
                        sub: 'Başlamayan',
                        rate: `%${Math.round((notStartedModules / totalSessions) * 100)}`,
                        color: 'text-slate-500',
                      };
                    case 'all':
                    default:
                      return {
                        value: `%${overallProgressPercentage}`,
                        sub: 'Genel İlerleme',
                        rate: `${completedModules}/${totalSessions} Oturum`,
                        color: 'text-slate-900',
                      };
                  }
                };

                const centerInfo = getCenterDisplay();

                return (
                  <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                    <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
                      {/* Arka plan halkası */}
                      <circle
                        cx="60"
                        cy="60"
                        r="46"
                        className="stroke-slate-100"
                        strokeWidth="12"
                        fill="transparent"
                      />
                      {/* Tamamlanan Modüller Segmenti */}
                      {completedModules > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r="46"
                          stroke="#1D4ED8"
                          strokeWidth={hoveredSegment === 'completed' ? 16 : 12}
                          strokeDasharray={`${completedStroke} ${circ}`}
                          strokeDashoffset="0"
                          fill="transparent"
                          className="cursor-pointer transition-all duration-300"
                          style={{
                            filter: hoveredSegment === 'completed' ? 'drop-shadow(0 2px 8px rgba(29, 78, 216, 0.45))' : 'none',
                            opacity: hoveredSegment === 'all' || hoveredSegment === 'completed' ? 1 : 0.45,
                          }}
                          onMouseEnter={() => setHoveredSegment('completed')}
                          onMouseLeave={() => setHoveredSegment('all')}
                        />
                      )}
                      {/* Devam Eden Modüller Segmenti */}
                      {inProgressModules > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r="46"
                          stroke="#3B82F6"
                          strokeWidth={hoveredSegment === 'in_progress' ? 16 : 12}
                          strokeDasharray={`${inProgressStroke} ${circ}`}
                          strokeDashoffset={`-${completedStroke}`}
                          fill="transparent"
                          className="cursor-pointer transition-all duration-300"
                          style={{
                            filter: hoveredSegment === 'in_progress' ? 'drop-shadow(0 2px 8px rgba(59, 130, 246, 0.45))' : 'none',
                            opacity: hoveredSegment === 'all' || hoveredSegment === 'in_progress' ? 1 : 0.45,
                          }}
                          onMouseEnter={() => setHoveredSegment('in_progress')}
                          onMouseLeave={() => setHoveredSegment('all')}
                        />
                      )}
                      {/* Başlamayan Modüller Segmenti */}
                      {notStartedModules > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r="46"
                          stroke="#CBD5E1"
                          strokeWidth={hoveredSegment === 'not_started' ? 16 : 12}
                          strokeDasharray={`${notStartedStroke} ${circ}`}
                          strokeDashoffset={`-${completedStroke + inProgressStroke}`}
                          fill="transparent"
                          className="cursor-pointer transition-all duration-300"
                          style={{
                            filter: hoveredSegment === 'not_started' ? 'drop-shadow(0 2px 6px rgba(148, 163, 184, 0.45))' : 'none',
                            opacity: hoveredSegment === 'all' || hoveredSegment === 'not_started' ? 1 : 0.45,
                          }}
                          onMouseEnter={() => setHoveredSegment('not_started')}
                          onMouseLeave={() => setHoveredSegment('all')}
                        />
                      )}
                    </svg>

                    {/* Donut İçi Yazı — Dinamik Hover Etkileşimi */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2 pointer-events-none transition-all duration-200">
                      <span className={`text-2xl font-black leading-none tracking-tight ${centerInfo.color}`}>
                        {centerInfo.value}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-1 truncate max-w-[90px]">
                        {centerInfo.sub}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium">
                        {centerInfo.rate}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Lejant Bilgileri — Etkileşimli Seçim Kartları */}
              <div className="space-y-2 text-xs w-full sm:w-auto">
                <button
                  type="button"
                  onMouseEnter={() => setHoveredSegment('completed')}
                  onMouseLeave={() => setHoveredSegment('all')}
                  className={`w-full flex items-center justify-between sm:justify-start gap-4 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    hoveredSegment === 'completed'
                      ? 'bg-blue-50 border-blue-400 shadow-xs scale-[1.02]'
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-700 shrink-0" />
                    <span className="text-slate-700 font-semibold">Tamamlanan Modüller</span>
                  </div>
                  <strong className="font-extrabold text-blue-900 ml-auto">{completedModules}</strong>
                </button>

                <button
                  type="button"
                  onMouseEnter={() => setHoveredSegment('in_progress')}
                  onMouseLeave={() => setHoveredSegment('all')}
                  className={`w-full flex items-center justify-between sm:justify-start gap-4 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    hoveredSegment === 'in_progress'
                      ? 'bg-blue-50 border-blue-400 shadow-xs scale-[1.02]'
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-slate-700 font-semibold">Devam Eden Modüller</span>
                  </div>
                  <strong className="font-extrabold text-blue-800 ml-auto">{inProgressModules}</strong>
                </button>

                <button
                  type="button"
                  onMouseEnter={() => setHoveredSegment('not_started')}
                  onMouseLeave={() => setHoveredSegment('all')}
                  className={`w-full flex items-center justify-between sm:justify-start gap-4 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    hoveredSegment === 'not_started'
                      ? 'bg-slate-100 border-slate-300 shadow-xs scale-[1.02]'
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                    <span className="text-slate-700 font-semibold">Başlamayan Modüller</span>
                  </div>
                  <strong className="font-extrabold text-slate-800 ml-auto">{notStartedModules}</strong>
                </button>
              </div>
            </div>
          </div>

          {/* Alt Mavi Bilgilendirme Kutusu */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-blue-900 mt-5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Eğitim programının tüm modüllerini tamamlayarak başarı belgesi almaya hak kazanabilirsin.
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. ALT SATIR: SON ÖDEVLERİM • DUYURULAR • SON MESAJLAR (3 EŞİT SÜTUN) */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* SÜTUN 1: Son Ödevlerim */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Son Ödevlerim</h2>
              </div>
              <Link
                to="/kursiyer/odevler"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
              >
                Tüm Ödevleri Gör{' '}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>

            <div className="space-y-3 pt-2">
              {groupAssignments.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Aktif Ödev Bulunmuyor</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Eğitmeniniz tarafından yeni bir ödev veya proje atandığında burada listelenecektir.
                  </p>
                </div>
              ) : (
                groupAssignments.slice(0, 3).map((asgn) => {
                  const sub = getLatestSubmission(asgn.id, currentUser.id);

                  let badgeText = 'Değerlendiriliyor';
                  let badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';

                  if (sub?.status === 'approved') {
                    badgeText = 'Tamamlandı';
                    badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  } else if (sub?.status === 'revision_requested') {
                    badgeText = 'Revizyon';
                    badgeClass = 'bg-red-50 text-red-700 border-red-200';
                  } else if (!sub) {
                    badgeText = 'Teslim Bekliyor';
                    badgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
                  }

                  return (
                    <Link
                      key={asgn.id}
                      to="/kursiyer/odevler"
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50/70 transition group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                          {asgn.title}
                        </h4>
                        <span className="text-[11px] text-slate-500 block truncate">
                          Son Teslim: {asgn.dueDate || '28 Eki 2026'}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${badgeClass}`}
                      >
                        {badgeText}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* SÜTUN 2: Duyurular */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Duyurular</h2>
              </div>
              <Link
                to="/bildirimler"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
              >
                Tüm Duyuruları Gör{' '}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>

            <div className="space-y-3 pt-2">
              {announcements.length > 0 ? (
                announcements.map((ann, i) => {
                  const isUnread = i === 0;
                  return (
                    <div
                      key={ann.id}
                      onClick={() => setSelectedAnnouncementModal(ann)}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50/70 transition cursor-pointer group"
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${isUnread ? 'bg-red-500 ring-2 ring-red-100' : 'bg-slate-300'
                          }`}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                          {ann.title}
                        </h4>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {new Date(ann.publishDate || ann.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition shrink-0" />
                    </div>
                  );
                })
              ) : (
                <div className="py-8 px-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Yayınlanmış Duyuru Bulunmuyor</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Eğitim yönetimi tarafından yeni bir duyuru yapıldığında burada görüntülenecektir.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SÜTUN 3: Son Mesajlar */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Son Mesajlar</h2>
              </div>
              <Link
                to="/kursiyer/mesajlar"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
              >
                Tüm Mesajları Gör{' '}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>

            <div className="space-y-3 pt-2">
              {displayMessages.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Yeni Mesaj Bulunmuyor</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Eğitmeninizle başlattığınız birebir mesajlaşmalar burada listelenir.
                  </p>
                </div>
              ) : (
                displayMessages.map((msg) => (
                  <Link
                    key={msg.id}
                    to="/kursiyer/mesajlar"
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50/70 transition group"
                  >
                    <div
                      className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${msg.color}`}
                    >
                      {msg.initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                          {msg.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {msg.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {msg.text}
                      </p>
                    </div>

                    {msg.unread && (
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5. OTURUM DETAY MODALI                                                */}
      {/* ===================================================================== */}
      {selectedSessionModal && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedSessionModal(null)}
          title={`Oturum #${selectedSessionModal.sessionNumber}: ${selectedSessionModal.topic || selectedSessionModal.title}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tarih:</span>
                <span className="font-semibold text-slate-900">{selectedSessionModal.date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Saat:</span>
                <span className="font-semibold text-slate-900">
                  {selectedSessionModal.startTime} - {selectedSessionModal.endTime}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Derslik / Lokasyon:</span>
                <span className="font-semibold text-slate-900">
                  {selectedSessionModal.location || 'Seminer Salonu B'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Eğitmen:</span>
                <span className="font-bold text-blue-700">{selectedSessionModal.instructorName}</span>
              </div>
            </div>

            {selectedSessionModal.notes && (
              <div className="space-y-1">
                <span className="font-bold text-slate-800 block">Ders & Müfredat Notları:</span>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 leading-relaxed">
                  {selectedSessionModal.notes}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setSelectedSessionModal(null);
                  navigate('/kursiyer/dersler');
                }}
              >
                Müfredatta Gör
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setSelectedSessionModal(null)}
              >
                Tamam
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ===================================================================== */}
      {/* 6. DUYURU DETAY MODALI                                                */}
      {/* ===================================================================== */}
      {selectedAnnouncementModal && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedAnnouncementModal(null)}
          title={selectedAnnouncementModal.title}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <span className="text-slate-500">Yayın Tarihi:</span>
              <span className="font-bold text-slate-900">
                {new Date(selectedAnnouncementModal.publishDate || selectedAnnouncementModal.createdAt).toLocaleDateString('tr-TR')}
              </span>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-800 block">Duyuru Metni:</span>
              <p className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed">
                {selectedAnnouncementModal.content}
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <Button
                variant="primary"
                size="md"
                onClick={() => setSelectedAnnouncementModal(null)}
              >
                Kapat
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
