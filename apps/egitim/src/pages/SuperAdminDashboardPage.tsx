import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  SlidersHorizontal,
  Layers,
  CheckSquare,
  FileText,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  ArrowRight,
  History,
  Building2,
  PieChart,
  BarChart3,
} from 'lucide-react';
import { KpiStrip } from '../components/ui/KpiStrip';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { getStoredUsers } from '../services/authorizationDemoService';
import { getStoredSystemSettings } from '../services/systemSettingsStorage';
import { getStoredAuditLogs } from '../services/auditStorage';
import { resetAllEducationDemoData } from '../services/demoMasterResetService';
import { SystemSettings, AuditLog, UserProfile } from '../types';

export const SuperAdminDashboardPage: React.FC = () => {
  const { currentRole, currentUser } = useDemoRole();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [resetReason, setResetReason] = useState('Sistem kütük verileri başlangıç durumuna döndürüldü.');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [hoveredRole, setHoveredRole] = useState<'all' | 'admin' | 'instructor' | 'trainee' | 'applicant'>('all');

  const loadData = () => {
    setUsers(getStoredUsers());
    setSettings(getStoredSystemSettings());
    setAuditLogs(getStoredAuditLogs());
  };

  useEffect(() => {
    loadData();
  }, []);

  const isSuperAdmin = currentRole === 'superadmin';

  // Rol Dağılımı (SVG Donut Grafik Verileri)
  const roleStats = useMemo(() => {
    const total = users.length || 1;
    const adminCount = users.filter(
      (u) =>
        u.role === 'admin' ||
        u.role === 'superadmin' ||
        u.roles?.includes('admin') ||
        u.roles?.includes('superadmin')
    ).length;
    const instructorCount = users.filter(
      (u) => u.role === 'instructor' || u.roles?.includes('instructor')
    ).length;
    const traineeCount = users.filter(
      (u) => u.role === 'trainee' || u.roles?.includes('trainee')
    ).length;
    const applicantCount = users.filter(
      (u) => u.role === 'applicant' || u.roles?.includes('applicant')
    ).length;

    const adminPercent = Math.round((adminCount / total) * 100);
    const instructorPercent = Math.round((instructorCount / total) * 100);
    const traineePercent = Math.round((traineeCount / total) * 100);
    const applicantPercent = Math.max(0, 100 - (adminPercent + instructorPercent + traineePercent));

    // SVG Çember Çevresi: 2 * PI * 38 = 238.76
    const circ = 238.76;
    const adminStroke = (adminPercent / 100) * circ;
    const instructorStroke = (instructorPercent / 100) * circ;
    const traineeStroke = (traineePercent / 100) * circ;
    const applicantStroke = (applicantPercent / 100) * circ;

    return {
      total: users.length,
      adminCount,
      instructorCount,
      traineeCount,
      applicantCount,
      adminPercent,
      instructorPercent,
      traineePercent,
      applicantPercent,
      circ,
      adminStroke,
      instructorStroke,
      traineeStroke,
      applicantStroke,
    };
  }, [users]);

  // Son 7 Günlük Sistem Aktivite Histogramı
  const activityData = useMemo(() => {
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const baseCount = auditLogs.length || 14;
    const counts = [
      Math.max(2, Math.round(baseCount * 0.12)),
      Math.max(3, Math.round(baseCount * 0.18)),
      Math.max(4, Math.round(baseCount * 0.22)),
      Math.max(2, Math.round(baseCount * 0.15)),
      Math.max(5, Math.round(baseCount * 0.24)),
      Math.max(1, Math.round(baseCount * 0.05)),
      Math.max(1, Math.round(baseCount * 0.04)),
    ];
    const maxVal = Math.max(...counts, 1);

    return days.map((day, idx) => ({
      day,
      count: counts[idx],
      heightPercent: Math.round((counts[idx] / maxVal) * 100),
      isToday: idx === 4,
    }));
  }, [auditLogs]);

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

  const handleExecuteReset = () => {
    if (resetConfirmInput.trim() !== 'SIFIRLA') return;

    resetAllEducationDemoData({
      actor: {
        id: currentUser.id,
        role: currentRole,
        name: currentUser.fullName,
      },
      reason: resetReason,
    });

    setResetSuccess(true);
    setTimeout(() => {
      setShowResetModal(false);
      setResetSuccess(false);
      setResetConfirmInput('');
      loadData();
    }, 1500);
  };

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
            Sistem Yönetimi Genel Bakış
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Merkezi yetki matrisi, kullanıcı rolleri, sistem politikaları ve kurumsal denetim konsolu.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/yonetim/kullanicilar"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-2xs whitespace-nowrap"
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Yeni Kullanıcı Ekle</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition shadow-2xs whitespace-nowrap cursor-pointer"
            title="Tüm eğitim mock verilerini fabrika ayarlarına döndür"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>Verileri Sıfırla</span>
          </button>
        </div>
      </div>

      {/* Role Notice Warning if not Superadmin */}
      {!isSuperAdmin && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <div className="font-bold">Erişim Sınırlaması Uyarısı:</div>
            <p>
              Şu anda <strong>{currentUser.role}</strong> rolü ile oturum açtınız. Kritik sistem ayarları ve rol atamaları yalnızca <strong>Sistem Yöneticisi</strong> profili tarafından düzenlenebilir.
            </p>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. DÖRT TEMEL GÖSTERGE BANDI (STRIPE / LINEAR STANDART KPI STRIP)     */}
      {/* ===================================================================== */}
      <KpiStrip
        items={[
          {
            label: 'Sistem Kullanıcıları',
            value: `${users.length} Hesap`,
            icon: <Users className="w-4 h-4" />,
            subtext: `${users.filter((u) => u.isActive !== false).length} Aktif kullanıcı`,
            to: '/yonetim/kullanicilar',
          },
          {
            label: 'Granüler Yetki Matrisi',
            value: '24 İzin Anahtarı',
            icon: <SlidersHorizontal className="w-4 h-4" />,
            subtext: '6 Kategori • Tam kapsam',
            to: '/yonetim/roller',
          },
          {
            label: 'Sistem Politikası',
            value: `v${settings?.version || 1}.0 Yürürlükte`,
            icon: <Layers className="w-4 h-4" />,
            subtext: `%${settings?.attendancePolicy?.minAttendanceRateRequired || 80} Devam & ${settings?.assignmentPolicy?.minPassingAssignmentAverage || 70} Not Eşiği`,
            to: '/yonetim/ayarlar',
          },
          {
            label: 'Merkezi Denetim Kütüğü',
            value: `${auditLogs.length} Olay`,
            icon: <History className="w-4 h-4" />,
            subtext: 'Geriye dönük izlenebilirlik',
            to: '/yonetim/denetim',
          },
        ]}
      />

      {/* ===================================================================== */}
      {/* 3. MERKEZİ GÖRSEL TELEMETRİ & KOKPİT (2 SÜTUNLU GRAFİK ALANI)       */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* SOL GRAFİK: Kullanıcı & Rol Dağılımı (SVG Donut Chart + Legend) (6 SÜTUN) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Kullanıcı & Rol Dağılımı</h2>
                <p className="text-[11px] text-slate-500">Sistem yetki havuzundaki hesapların rol kırılımı</p>
              </div>
            </div>
            <Link
              to="/yonetim/kullanicilar"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
            >
              <span>Yönet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
            {/* SVG DONUT CHART (Etkileşimli / Dilim Vurgulu) */}
            {(() => {
              const getCenterInfo = () => {
                switch (hoveredRole) {
                  case 'admin':
                    return {
                      count: roleStats.adminCount,
                      label: 'Yönetim / Admin',
                      pct: `%${roleStats.adminPercent}`,
                      color: 'text-blue-600',
                    };
                  case 'instructor':
                    return {
                      count: roleStats.instructorCount,
                      label: 'Eğitmen Kadrosu',
                      pct: `%${roleStats.instructorPercent}`,
                      color: 'text-indigo-600',
                    };
                  case 'trainee':
                    return {
                      count: roleStats.traineeCount,
                      label: 'Kayıtlı Kursiyer',
                      pct: `%${roleStats.traineePercent}`,
                      color: 'text-emerald-600',
                    };
                  case 'applicant':
                    return {
                      count: roleStats.applicantCount,
                      label: 'Aday Başvuru',
                      pct: `%${roleStats.applicantPercent}`,
                      color: 'text-amber-600',
                    };
                  case 'all':
                  default:
                    return {
                      count: roleStats.total,
                      label: 'Kayıtlı Profil',
                      pct: 'Toplam',
                      color: 'text-slate-900',
                    };
                }
              };

              const center = getCenterInfo();

              return (
                <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                  <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100" aria-label="Rol Dağılımı Grafiği">
                    {/* Background Ring */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#F1F5F9" strokeWidth="12" />

                    {/* Segment 1: Adminler (Blue) */}
                    {roleStats.adminCount > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth={hoveredRole === 'admin' ? 16 : 12}
                        strokeDasharray={`${roleStats.adminStroke} ${roleStats.circ}`}
                        strokeDashoffset="0"
                        strokeLinecap="butt"
                        className="cursor-pointer transition-all duration-300"
                        style={{
                          filter: hoveredRole === 'admin' ? 'drop-shadow(0 2px 6px rgba(37, 99, 235, 0.45))' : 'none',
                          opacity: hoveredRole === 'all' || hoveredRole === 'admin' ? 1 : 0.4,
                        }}
                        onMouseEnter={() => setHoveredRole('admin')}
                        onMouseLeave={() => setHoveredRole('all')}
                      />
                    )}
                    {/* Segment 2: Eğitmenler (Indigo) */}
                    {roleStats.instructorCount > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="#6366F1"
                        strokeWidth={hoveredRole === 'instructor' ? 16 : 12}
                        strokeDasharray={`${roleStats.instructorStroke} ${roleStats.circ}`}
                        strokeDashoffset={-roleStats.adminStroke}
                        strokeLinecap="butt"
                        className="cursor-pointer transition-all duration-300"
                        style={{
                          filter: hoveredRole === 'instructor' ? 'drop-shadow(0 2px 6px rgba(99, 102, 241, 0.45))' : 'none',
                          opacity: hoveredRole === 'all' || hoveredRole === 'instructor' ? 1 : 0.4,
                        }}
                        onMouseEnter={() => setHoveredRole('instructor')}
                        onMouseLeave={() => setHoveredRole('all')}
                      />
                    )}
                    {/* Segment 3: Kursiyerler (Emerald) */}
                    {roleStats.traineeCount > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth={hoveredRole === 'trainee' ? 16 : 12}
                        strokeDasharray={`${roleStats.traineeStroke} ${roleStats.circ}`}
                        strokeDashoffset={-(roleStats.adminStroke + roleStats.instructorStroke)}
                        strokeLinecap="butt"
                        className="cursor-pointer transition-all duration-300"
                        style={{
                          filter: hoveredRole === 'trainee' ? 'drop-shadow(0 2px 6px rgba(16, 185, 129, 0.45))' : 'none',
                          opacity: hoveredRole === 'all' || hoveredRole === 'trainee' ? 1 : 0.4,
                        }}
                        onMouseEnter={() => setHoveredRole('trainee')}
                        onMouseLeave={() => setHoveredRole('all')}
                      />
                    )}
                    {/* Segment 4: Adaylar (Amber) */}
                    {roleStats.applicantCount > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth={hoveredRole === 'applicant' ? 16 : 12}
                        strokeDasharray={`${roleStats.applicantStroke} ${roleStats.circ}`}
                        strokeDashoffset={-(roleStats.adminStroke + roleStats.instructorStroke + roleStats.traineeStroke)}
                        strokeLinecap="butt"
                        className="cursor-pointer transition-all duration-300"
                        style={{
                          filter: hoveredRole === 'applicant' ? 'drop-shadow(0 2px 6px rgba(245, 158, 11, 0.45))' : 'none',
                          opacity: hoveredRole === 'all' || hoveredRole === 'applicant' ? 1 : 0.4,
                        }}
                        onMouseEnter={() => setHoveredRole('applicant')}
                        onMouseLeave={() => setHoveredRole('all')}
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2 pointer-events-none transition-all duration-200">
                    <span className={`text-2xl font-black leading-none tabular-nums tracking-tight ${center.color}`}>
                      {center.count}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 mt-1 truncate max-w-[90px]">
                      {center.label}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">
                      {center.pct}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* LEJANT / DETAY LİSTESİ — Etkileşimli Kartlar */}
            <div className="space-y-2 w-full sm:w-auto flex-1 text-xs">
              <button
                type="button"
                onMouseEnter={() => setHoveredRole('admin')}
                onMouseLeave={() => setHoveredRole('all')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                  hoveredRole === 'admin'
                    ? 'bg-blue-50 border-blue-400 shadow-xs scale-[1.02]'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-800">Sistem & Eğitim Yönetimi</span>
                </div>
                <strong className="font-extrabold text-blue-900 tabular-nums">
                  {roleStats.adminCount} (%{roleStats.adminPercent})
                </strong>
              </button>

              <button
                type="button"
                onMouseEnter={() => setHoveredRole('instructor')}
                onMouseLeave={() => setHoveredRole('all')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                  hoveredRole === 'instructor'
                    ? 'bg-indigo-50 border-indigo-400 shadow-xs scale-[1.02]'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                  <span className="font-semibold text-slate-800">Atanmış Eğitmenler</span>
                </div>
                <strong className="font-extrabold text-indigo-900 tabular-nums">
                  {roleStats.instructorCount} (%{roleStats.instructorPercent})
                </strong>
              </button>

              <button
                type="button"
                onMouseEnter={() => setHoveredRole('trainee')}
                onMouseLeave={() => setHoveredRole('all')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                  hoveredRole === 'trainee'
                    ? 'bg-emerald-50 border-emerald-400 shadow-xs scale-[1.02]'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-slate-800">Kayıtlı Kursiyerler</span>
                </div>
                <strong className="font-extrabold text-emerald-900 tabular-nums">
                  {roleStats.traineeCount} (%{roleStats.traineePercent})
                </strong>
              </button>

              <button
                type="button"
                onMouseEnter={() => setHoveredRole('applicant')}
                onMouseLeave={() => setHoveredRole('all')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                  hoveredRole === 'applicant'
                    ? 'bg-amber-50 border-amber-400 shadow-xs scale-[1.02]'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-semibold text-slate-800">Başvuru & Adaylar</span>
                </div>
                <strong className="font-extrabold text-amber-900 tabular-nums">
                  {roleStats.applicantCount} (%{roleStats.applicantPercent})
                </strong>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>Rol Çakışması Yok • Granüler RBAC Aktif</span>
            </span>
            <span className="font-semibold text-slate-700">POL-2026-V1</span>
          </div>
        </div>

        {/* SAĞ GRAFİK: Son 7 Günlük Sistem Aktivite Histogramı (Sütun Bar Grafiği) (6 SÜTUN) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Sistem & Denetim Aktivitesi</h2>
                <p className="text-[11px] text-slate-500">Son 7 günde kütüğe işlenen idari ve operasyonel olaylar</p>
              </div>
            </div>

            {/* CANLI SİNYAL NOKTASI (PULSE DOT) */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Canlı İzleme</span>
            </div>
          </div>

          {/* SÜTUN GRAFİĞİ (BAR CHART) */}
          <div className="py-2">
            <div className="h-32 flex items-end justify-between gap-3 px-2">
              {activityData.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
                  <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                    {item.count}
                  </span>
                  <div className="w-full bg-slate-100 rounded-t-lg h-24 flex items-end overflow-hidden p-0.5">
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        item.isToday
                          ? 'bg-blue-600 group-hover:bg-blue-700 shadow-xs'
                          : 'bg-indigo-400/80 group-hover:bg-indigo-500'
                      }`}
                      style={{ height: `${Math.max(item.heightPercent, 14)}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-semibold ${item.isToday ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Toplam Olay</div>
              <div className="font-extrabold text-slate-900 text-sm mt-0.5 tabular-nums">{auditLogs.length} Kayıt</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Yetki Olayı</div>
              <div className="font-extrabold text-indigo-700 text-sm mt-0.5 tabular-nums">6 Güncelleme</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Kütük Doğruluk</div>
              <div className="font-extrabold text-emerald-700 text-sm mt-0.5 tabular-nums">%100 İntizam</div>
            </div>
          </div>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* 4. YÖNETİŞİM VE SİSTEM MODÜLLERİ (HİBRİT GRAFİKSEL KARTLAR)         */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Module 1: User & Role Management */}
        <div
          onClick={() => navigate('/yonetim/kullanicilar')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition border border-slate-200/50">
                <Users className="w-4 h-4" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{users.length} Hesap Aktif</span>
              </span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                Kullanıcı ve Rol Yönetimi
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Kullanıcı havuzu, çoklu rol atama, eğitmen grup kapsamları ve pasif statü kontrolü.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-blue-600 transition">
            <span>Kullanıcıları Yönet →</span>
            <span className="text-[11px] text-slate-400 font-normal">/yonetim/kullanicilar</span>
          </div>
        </div>

        {/* Module 2: Granular Permission Matrix */}
        <div
          onClick={() => navigate('/yonetim/roller')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition border border-slate-200/50">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>24 Anahtar Aktif</span>
              </span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                Granüler Yetki Matrisi
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                6 kategori izin anahtarı, rol-izin eşleşmesi (İzin Var / Yok / Kapsama Bağlı) ve sürüm geçmişi.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-blue-600 transition">
            <span>Matrisi Görüntüle →</span>
            <span className="text-[11px] text-slate-400 font-normal">/yonetim/roller</span>
          </div>
        </div>

        {/* Module 3: System Settings & Policies */}
        <div
          onClick={() => navigate('/yonetim/ayarlar')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition border border-slate-200/50">
                <Layers className="w-4 h-4" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <span>%80 Devam • 70 Not</span>
              </span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                Sistem ve Politika Ayarları
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Devam hesaplama politikası, ödev eşikleri, doğrulama formatı ve sürümlü onay kuralları.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-blue-600 transition">
            <span>Ayarları Yapılandır →</span>
            <span className="text-[11px] text-slate-400 font-normal">/yonetim/ayarlar</span>
          </div>
        </div>

        {/* Module 4: Central Audit Trail */}
        <div
          onClick={() => navigate('/yonetim/denetim')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition border border-slate-200/50">
                <CheckSquare className="w-4 h-4" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>{auditLogs.length} Olay Kayıtlı</span>
              </span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                Merkezi Denetim Kayıtları
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                İdari kararlar, yoklama revizyonları, not onayları ve rol değişimlerinin SHA-256 kütük kayıtları ve CSV çıktısı.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-blue-600 transition">
            <span>Denetim Kütüğünü Aç →</span>
            <span className="text-[11px] text-slate-400 font-normal">/yonetim/denetim</span>
          </div>
        </div>

        {/* Module 5: Operational Reporting */}
        <div
          onClick={() => navigate('/yonetim/raporlar')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition border border-slate-200/50">
                <FileText className="w-4 h-4" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                <span>5 Temel Kütük</span>
              </span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                Operasyonel Raporlar
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Başvurular, kontenjan doluluğu, ders katılımı ve belge tescil metrikleri. Canlı veriler üzerinden dinamik hesaplanır.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-blue-600 transition">
            <span>Raporları İncele →</span>
            <span className="text-[11px] text-slate-400 font-normal">/yonetim/raporlar</span>
          </div>
        </div>

        {/* Module 6: Facility and Classroom Catalog */}
        <div
          onClick={() => navigate('/yonetim/mekanlar')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition border border-slate-200/50">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>4 Aktif Mekân</span>
              </span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                Derslik & Mekân Kataloğu
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Fiziksel eğitim sınıfları, bilişim laboratuvarları, uygulama mutfakları ve oturum şablonları.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-blue-600 transition">
            <span>Mekânları Yönet →</span>
            <span className="text-[11px] text-slate-400 font-normal">/yonetim/mekanlar</span>
          </div>
        </div>

        {/* Module 7: Master Demo Data Control */}
        <div
          onClick={() => setShowResetModal(true)}
          className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition border border-slate-200/50">
                <RotateCcw className="w-4 h-4" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                <span>13 Modül Senkronize</span>
              </span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition">
                Sistem Kütük & Veri Sıfırlama
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tüm eğitim kütük verilerini senkronize fabrika ayarlarına döndürür. Onay ve gerekçe zorunludur.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-rose-600 transition">
            <span>Sıfırlama Sihirbazı →</span>
            <span className="text-[11px] text-slate-400 font-normal">Master Reset</span>
          </div>
        </div>
      </div>



      {/* Master Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Kütük Verilerini Fabrika Ayarlarına Döndür
                </h3>
                <p className="text-xs text-slate-500">
                  Tüm eğitim modüllerinin kütük verileri ilk haline getirilecek.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
              <div className="font-bold">Sıfırlanacak 13 Modül:</div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Başvurular, Değerlendirme Kriterleri, Kesin Kayıt, Gruplar, Oturum ve Manuel Yoklama, Ödev ve Notlandırma, Nihai Başarı Kararları, Belge Kütüğü, Özel Mesajlar, Grup Kanalları, Bildirimler, Toplu E-Posta Kuyruğu ve Sistem Ayarları.
              </p>
            </div>

            {resetSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Tüm eğitim platformu verileri başarıyla ilk fabrika haline döndürüldü!
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sıfırlama Gerekçesi (Denetim Kütüğüne Kaydedilir):
                  </label>
                  <input
                    type="text"
                    value={resetReason}
                    onChange={(e) => setResetReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Örn: Yeni eğitim dönemi başlangıcı için kütük sıfırlama"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Onaylamak için büyük harflerle <strong>SIFIRLA</strong> yazınız:
                  </label>
                  <input
                    type="text"
                    value={resetConfirmInput}
                    onChange={(e) => setResetConfirmInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="SIFIRLA"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetModal(false);
                      setResetConfirmInput('');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    disabled={resetConfirmInput.trim() !== 'SIFIRLA' || !isSuperAdmin}
                    onClick={handleExecuteReset}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tüm Verileri Sıfırla
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
