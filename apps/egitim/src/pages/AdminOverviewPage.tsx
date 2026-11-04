import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Layers,
  CheckSquare,
  Award,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  FileText,
  GraduationCap,
  Filter,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { KpiStrip } from '../components/ui/KpiStrip';
import { Modal } from '../components/ui/Modal';
import { getAllApplications } from '../services/applicationStorage';
import { getStoredGroups, getStoredAssignments, getStoredEnrollments } from '../services/enrollmentStorage';
import { getStoredCertificates } from '../services/certificateStorage';
import { getStoredSessions } from '../services/sessionStorage';
import { calculateOperationalReports } from '../services/reportingService';
import { Application } from '../types';

export const AdminOverviewPage: React.FC = () => {
  const navigate = useNavigate();

  // Canlı veriler
  const [applications] = useState<Application[]>(() => getAllApplications());
  const [groups] = useState(() => getStoredGroups());
  const [inspectApp, setInspectApp] = useState<Application | null>(null);

  const activeAssignments = useMemo(() => {
    return getStoredAssignments().filter((a) => a.status === 'active');
  }, []);

  const enrollments = useMemo(() => {
    return getStoredEnrollments();
  }, []);

  const certificates = useMemo(() => {
    return getStoredCertificates();
  }, []);

  const sessions = useMemo(() => {
    return getStoredSessions();
  }, []);

  const completedSessions = useMemo(() => {
    return sessions.filter((s) => s.status === 'completed');
  }, [sessions]);

  // Sayımlar
  const totalProgramsCount = useMemo(() => {
    return new Set(groups.map((g) => g.programId)).size;
  }, [groups]);

  const totalGroupsCount = groups.length;
  const totalAssignedTrainees = activeAssignments.length;
  const totalCertificatesCount = certificates.length;

  // Huni (Funnel) Aşamaları
  const totalAppsCount = applications.length;
  const acceptedAppsCount = applications.filter((a) =>
    ['accepted', 'enrolled'].includes(a.status)
  ).length;
  const confirmedEnrollmentsCount = enrollments.filter((e) =>
    ['confirmed', 'completed'].includes(e.status)
  ).length;

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

  const operationalReport = useMemo(() => {
    return calculateOperationalReports();
  }, [applications, groups, sessions, certificates, activeAssignments]);

  const averageAttendance = operationalReport.attendance.averageAttendanceRate ?? 0;

  const groupSummaries = useMemo(() => {
    return groups.map((g) => {
      const gAssignments = activeAssignments.filter((a) => a.groupId === g.id);
      const gSessions = sessions.filter((s) => s.groupId === g.id && s.status === 'completed');

      return {
        id: g.id,
        programTitle: g.programTitle,
        groupName: g.name,
        instructorName: g.instructorNames?.[0] || 'Atanmamış',
        traineeCount: gAssignments.length,
        attendanceAverage: gSessions.length > 0 ? averageAttendance : 0,
        assignmentAverage: operationalReport.assignments.overallAverageScore ?? 0,
      };
    });
  }, [groups, activeAssignments, sessions, averageAttendance, operationalReport.assignments.overallAverageScore]);

  // Pending applicants
  const pendingApplicants = useMemo(() => {
    return applications
      .filter((app) => ['pending', 'under_review', 'submitted'].includes(app.status))
      .slice(0, 5);
  }, [applications]);

  const pendingCount = applications.filter((app) =>
    ['pending', 'under_review', 'submitted'].includes(app.status)
  ).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* ===================================================================== */}
      {/* 1. ÜST BAŞLIK VE EYLEM BUTONLARI                                     */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1">
            {formattedTodayDate}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Eğitim Yönetimi Genel Bakış
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            İslahiye Ticaret Odası eğitim programları, başvuru kararları ve operasyonel akademik performans takibi.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/yonetim/basvurular"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-2xs whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Karar Masasını Aç</span>
          </Link>
          <Link
            to="/yonetim/raporlar"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <FileText className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Raporlar</span>
          </Link>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. DÖRT KPI METRİK BANDI (STRIPE/LINEAR STANDARDI)                    */}
      {/* ===================================================================== */}
      <KpiStrip
        columns={4}
        items={[
          {
            label: 'Aktif Program & Gruplar',
            value: `${totalProgramsCount} Program • ${totalGroupsCount} Grup`,
            subtext: `${totalAssignedTrainees} Kayıtlı Kursiyer`,
            icon: <Layers className="w-3.5 h-3.5" />,
            to: '/yonetim/gruplar',
          },
          {
            label: 'Dönem Başvuruları',
            value: `${totalAppsCount} Toplam`,
            subtext: `${pendingCount} İncelenmeyi Bekleyen`,
            icon: <Clock className="w-3.5 h-3.5" />,
            badge: (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                {pendingCount} Bekleyen
              </span>
            ),
            to: '/yonetim/basvurular',
          },
          {
            label: 'Yoklama & Devam Durumu',
            value: `%${Math.round(averageAttendance)} Devam Ort.`,
            subtext: `${completedSessions.length} Oturum Onaylandı`,
            icon: <CheckSquare className="w-3.5 h-3.5" />,
            to: '/yonetim/yoklama-denetim',
          },
          {
            label: 'Belge Kütüğü & QR',
            value: `${totalCertificatesCount} Onaylı Belge`,
            subtext: '%100 Doğrulama Hazır',
            icon: <Award className="w-3.5 h-3.5" />,
            to: '/yonetim/belgeler',
          },
        ]}
      />

      {/* ===================================================================== */}
      {/* 2.5 BAŞVURU & KAYIT DÖNÜŞÜM HUNİSİ (EXECUTIVE CONVERSION PIPELINE)     */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/60">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                Aday Başvuru & Kayıt Dönüşüm Hunisi (2026 Güz Dönemi)
              </h2>
              <p className="text-[11px] text-slate-500">
                Aday havuzundan sınıf şubesine yerleşime kadar olan 4 kritik idari aşama akışı.
              </p>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Toplam Dönüşüm: %{totalAppsCount > 0 ? Math.round((totalAssignedTrainees / totalAppsCount) * 100) : 0}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Adım 1: Başvuru */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">01</span>
                1. Başvuru Havuzu
              </span>
              <span className="font-mono text-slate-700 font-bold">100%</span>
            </div>
            <div className="text-xl font-bold text-slate-900 tabular-nums">
              {totalAppsCount} Aday
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full" style={{ width: '100%' }} />
            </div>
            <span className="text-[11px] text-slate-400 block">Dönem başvuru havuzu</span>
          </div>

          {/* Adım 2: Ön Değerlendirme & Kabul */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">02</span>
                2. Asil & Kabul
              </span>
              <span className="font-mono text-slate-700 font-bold">
                %{totalAppsCount > 0 ? Math.round((acceptedAppsCount / totalAppsCount) * 100) : 0}
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 tabular-nums">
              {acceptedAppsCount} Aday
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full"
                style={{
                  width: `${totalAppsCount > 0 ? (acceptedAppsCount / totalAppsCount) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-[11px] text-slate-400 block">Kriter barajını geçenler</span>
          </div>

          {/* Adım 3: Kesin Kayıt */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">03</span>
                3. Kesin Kayıt Onaylı
              </span>
              <span className="font-mono text-slate-700 font-bold">
                %{totalAppsCount > 0 ? Math.round((confirmedEnrollmentsCount / totalAppsCount) * 100) : 0}
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 tabular-nums">
              {confirmedEnrollmentsCount} Kursiyer
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full"
                style={{
                  width: `${totalAppsCount > 0 ? (confirmedEnrollmentsCount / totalAppsCount) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-[11px] text-slate-400 block">Evrak teyidi tamamlanan</span>
          </div>

          {/* Adım 4: Gruba Yerleşen */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">04</span>
                4. Gruba Yerleşen
              </span>
              <span className="font-mono text-slate-700 font-bold">
                %{totalAppsCount > 0 ? Math.round((totalAssignedTrainees / totalAppsCount) * 100) : 0}
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900 tabular-nums">
              {totalAssignedTrainees} Kursiyer
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full"
                style={{
                  width: `${totalAppsCount > 0 ? (totalAssignedTrainees / totalAppsCount) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-[11px] text-slate-400 block">Ders programına aktif dahil</span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. ÖNCELİKLİ İDARİ GÖREVLER (TEMİZ BEYAZ KART TASARIMI - TO-DO ROWS)   */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/70">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Öncelikli İdari Görevler & Uyarılar</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Anlık Kütük Durumu</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div
            onClick={() => navigate('/yonetim/basvurular')}
            className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer transition group"
          >
            <div>
              <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition">
                {pendingCount} Başvuru Karar Bekliyor
              </span>
              <span className="text-[11px] text-slate-500">Ön kriter puanları hazır</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
          </div>

          <div
            onClick={() => navigate('/yonetim/yoklama-denetim')}
            className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer transition group"
          >
            <div>
              <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition">
                Yoklama ve Devam Denetimi
              </span>
              <span className="text-[11px] text-slate-500">%80 barajı risk analizi</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
          </div>

          <div
            onClick={() => navigate('/yonetim/basari-onay')}
            className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex items-center justify-between cursor-pointer transition group"
          >
            <div>
              <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition">
                Dönem Sonu Başarı Kütüğü
              </span>
              <span className="text-[11px] text-slate-500">Nihai yönetici onayı masası</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. İKİ KOLONLU OPERASYONEL ÇALIŞMA ALANI                              */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sol Kolon: Bekleyen Başvuru Kararları Masası (6 cols) */}
        <div className="lg:col-span-6 space-y-3.5">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>Bekleyen Başvuru Kararları</span>
                <span className="text-xs text-slate-500 font-normal">({pendingApplicants.length})</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Otomatik kriter tavsiyesi hesaplanmış, idari onay bekleyen adaylar.
              </p>
            </div>
            <Link
              to="/yonetim/basvurular"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Karar Masası</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {pendingApplicants.length === 0 ? (
              <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                İnceleme bekleyen aday başvurusu bulunmuyor.
              </div>
            ) : (
              pendingApplicants.map((app) => (
                <div
                  key={app.id}
                  className="p-4 bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-xs transition space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-slate-900">{app.candidateName}</strong>
                        <span className="font-mono text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {app.referenceNumber}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium mt-0.5">
                        {app.programTitle}
                      </div>
                    </div>

                    <StatusBadge label="İncelemede" variant="warning" size="sm" />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                    <div className="text-slate-500">
                      {app.autoScore ? (
                        <span className="text-blue-700 font-semibold">
                          Algoritmik Öneri: {app.autoScore.total} Puan
                        </span>
                      ) : (
                        <span>Ön İnceleme Kriter Havuzunda</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInspectApp(app)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                      >
                        Ön İncele
                      </button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => navigate('/yonetim/basvurular')}
                      >
                        Karar Ver →
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sağ Kolon: Aktif Eğitim Şubeleri & Durum (6 cols) */}
        <div className="lg:col-span-6 space-y-3.5">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Aktif Grup ve Şubeler</span>
                <span className="text-xs text-slate-500 font-normal">({groups.length})</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Şube kontenjanları, eğitmen atamaları ve devam ortalamaları.
              </p>
            </div>
            <Link
              to="/yonetim/gruplar"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Şube Masası</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {groupSummaries.length === 0 ? (
              <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                Tanımlı eğitim şubesi bulunamadı.
              </div>
            ) : (
              groupSummaries.map((grp) => {
                const passAttendance = grp.attendanceAverage >= 80;
                return (
                  <div
                    key={grp.id}
                    className="p-4 bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-xs transition space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{grp.groupName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{grp.programTitle}</div>
                      </div>
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        {grp.traineeCount} Kursiyer
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                      <div className="text-slate-600">
                        Eğitmen: <strong className="text-slate-800">{grp.instructorName}</strong>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Devam Ortalaması:</span>
                        <span
                          className={`font-mono font-bold ${
                            passAttendance ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          %{Math.round(grp.attendanceAverage)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Aday Ön İnceleme Modal */}
      {inspectApp && (
        <Modal
          isOpen={Boolean(inspectApp)}
          onClose={() => setInspectApp(null)}
          title={`Aday Başvuru Özeti: ${inspectApp.candidateName}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div><strong>Referans No:</strong> {inspectApp.referenceNumber}</div>
              <div><strong>Program:</strong> {inspectApp.programTitle}</div>
              <div><strong>E-Posta:</strong> {inspectApp.email}</div>
              <div><strong>Telefon:</strong> {inspectApp.phone}</div>
              <div><strong>Meslek:</strong> {inspectApp.occupation || 'Belirtilmedi'}</div>
            </div>

            {inspectApp.autoScore && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1">
                <div className="font-bold">Algoritmik Kriter Puanı: {inspectApp.autoScore.total} / 100</div>
                <div className="text-[11px]">Baraj Durumu: {inspectApp.autoScore.total >= 70 ? 'Kabul Edilebilir (>=70)' : 'İnceleme Gerekli (<70)'}</div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setInspectApp(null)}>
                Kapat
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setInspectApp(null);
                  navigate('/yonetim/basvurular');
                }}
              >
                Karar Masasına Git →
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
