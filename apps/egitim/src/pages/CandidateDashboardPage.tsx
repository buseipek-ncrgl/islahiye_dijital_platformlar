import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  ExternalLink,
  Info,
  Building,
  GraduationCap,
  FileCheck,
  Printer,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { Application, ApplicationStatus } from '../types';
import {
  getApplicationsByCandidateId,
  withdrawApplication,
  subscribeToApplicationUpdates,
} from '../services/applicationStorage';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { StatCard } from '../components/ui/StatCard';
import { Modal } from '../components/ui/Modal';
import { Toast } from '../components/ui/Toast';
import {
  getStoredEnrollments,
  getActiveAssignmentForEnrollment,
  subscribeToEnrollmentUpdates,
} from '../services/enrollmentStorage';

export const CandidateDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, currentRole, setRole } = useDemoRole();

  // If role is not applicant, switch to applicant
  useEffect(() => {
    if (currentRole !== 'applicant') {
      setRole('applicant');
    }
  }, [currentRole, setRole]);

  // Load applications for current candidate
  const [candidateApps, setCandidateApps] = useState<Application[]>(() =>
    getApplicationsByCandidateId(currentUser.id)
  );

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'review' | 'accepted' | 'draft'>('all');
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawNotice, setWithdrawNotice] = useState<string | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [hoveredStatus, setHoveredStatus] = useState<'all' | 'accepted' | 'in_review' | 'draft'>('all');

  // Sync state on candidate change or storage updates
  useEffect(() => {
    const apps = getApplicationsByCandidateId(currentUser.id);
    setCandidateApps(apps);
    if (apps.length > 0) {
      setSelectedAppId((prev) => (apps.some((a) => a.id === prev) ? prev : apps[0].id));
    } else {
      setSelectedAppId(null);
    }

    const unsubscribe = subscribeToApplicationUpdates(() => {
      const updated = getApplicationsByCandidateId(currentUser.id);
      setCandidateApps(updated);
    });

    return () => unsubscribe();
  }, [currentUser.id]);

  // Enrollment and Group Assignment tracking
  const [enrollments, setEnrollments] = useState(() => getStoredEnrollments());

  useEffect(() => {
    const unsub = subscribeToEnrollmentUpdates(() => {
      setEnrollments(getStoredEnrollments());
    });
    return () => unsub();
  }, []);

  const selectedApp = candidateApps.find((a) => a.id === selectedAppId) || candidateApps[0] || null;

  const selectedEnrollment = useMemo(() => {
    if (!selectedApp) return null;
    return (
      enrollments.find((e) => e.applicationId === selectedApp.id) ||
      enrollments.find(
        (e) =>
          e.candidateId === selectedApp.candidateId &&
          e.programId === selectedApp.programId
      ) ||
      null
    );
  }, [selectedApp, enrollments]);

  const selectedAssignment = useMemo(() => {
    if (!selectedEnrollment) return null;
    return getActiveAssignmentForEnrollment(selectedEnrollment.id) || null;
  }, [selectedEnrollment]);

  // Filtered applications
  const filteredApps = useMemo(() => {
    switch (filterTab) {
      case 'review':
        return candidateApps.filter((a) =>
          ['submitted', 'under_review', 'pending'].includes(a.status)
        );
      case 'accepted':
        return candidateApps.filter((a) => a.status === 'accepted');
      case 'draft':
        return candidateApps.filter((a) => a.status === 'draft');
      default:
        return candidateApps;
    }
  }, [candidateApps, filterTab]);

  // Status badge styling helper
  const getStatusBadgeInfo = (
    status: ApplicationStatus
  ): { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' } => {
    switch (status) {
      case 'draft':
        return { label: 'Taslak', variant: 'neutral' };
      case 'submitted':
        return { label: 'Gönderildi', variant: 'info' };
      case 'under_review':
      case 'pending':
        return { label: 'İdari İncelemede', variant: 'warning' };
      case 'accepted':
        return { label: 'Kabul Edildi', variant: 'success' };
      case 'waitlisted':
      case 'reserve':
        return { label: 'Yedek Listede', variant: 'info' };
      case 'rejected':
        return { label: 'Kabul Edilemedi', variant: 'danger' };
      case 'withdrawn':
        return { label: 'Geri Çekildi', variant: 'neutral' };
      default:
        return { label: status, variant: 'neutral' };
    }
  };

  // Withdraw action handler
  const handleConfirmWithdraw = () => {
    if (!selectedApp) return;
    const res = withdrawApplication(selectedApp.id, currentUser.id, withdrawReason.trim());
    if (res.success) {
      setWithdrawModalOpen(false);
      setWithdrawReason('');
      setWithdrawNotice(`Başvurunuz (${selectedApp.referenceNumber}) başarıyla geri çekildi.`);
      setTimeout(() => setWithdrawNotice(null), 5000);
      const updated = getApplicationsByCandidateId(currentUser.id);
      setCandidateApps(updated);
    } else {
      setWithdrawNotice(res.error || 'Başvuru geri çekilemedi.');
      setTimeout(() => setWithdrawNotice(null), 5000);
    }
  };

  // Metric counts
  const totalCount = candidateApps.length;
  const inReviewCount = candidateApps.filter((a) =>
    ['submitted', 'under_review', 'pending'].includes(a.status)
  ).length;
  const acceptedCount = candidateApps.filter((a) => a.status === 'accepted').length;
  const draftCount = candidateApps.filter((a) => a.status === 'draft').length;

  // Visual Stepper Step Calculation for Selected App
  const getStepperStep = (status: ApplicationStatus): number => {
    switch (status) {
      case 'draft':
        return 1;
      case 'submitted':
        return 2;
      case 'under_review':
      case 'pending':
        return 3;
      case 'accepted':
      case 'reserve':
      case 'waitlisted':
      case 'rejected':
      case 'withdrawn':
        return 4;
      default:
        return 2;
    }
  };

  const currentStep = selectedApp ? getStepperStep(selectedApp.status) : 1;

  // Donut chart calculations
  const totalForChart = Math.max(totalCount, 1);
  const acceptedRatio = (acceptedCount / totalForChart) * 100;
  const inReviewRatio = (inReviewCount / totalForChart) * 100;
  const draftRatio = (draftCount / totalForChart) * 100;

  // Circumference for r=36 is 2 * PI * 36 = 226.2
  const circ = 226.2;
  const acceptedStroke = (acceptedRatio / 100) * circ;
  const inReviewStroke = (inReviewRatio / 100) * circ;
  const draftStroke = (draftRatio / 100) * circ;

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
            İslahiye Ticaret Odası eğitim programlarına yaptığınız başvuruları ve kesin kayıt sürecini buradan takip edebilirsiniz.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/aday/katalog"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-2xs whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Yeni Programa Başvur</span>
          </Link>
          <Link
            to="/aday/rehber"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Başvuru Rehberi</span>
          </Link>
          <Link
            to="/aday/katalog"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <Building className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Eğitim Kataloğu</span>
          </Link>
        </div>
      </div>

      {/* Withdraw Notice (Floating Toast - Zero Layout Shift) */}
      <Toast message={withdrawNotice} onClose={() => setWithdrawNotice(null)} type="info" />

      {/* ===================================================================== */}
      {/* 2. DÖRT TEMEL GÖSTERGE KARTI (4 KPI METRIC CARDS)                      */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <StatCard
          title="Toplam Başvuru"
          value={totalCount}
          icon={<FileText className="w-4 h-4" />}
          variant="blue"
          subtitle="Kayıtlı başvuru sayısı"
          progress={{ value: 100, colorClass: 'bg-blue-600' }}
        />

        <StatCard
          title="İdari İncelemede"
          value={inReviewCount}
          icon={<Clock className="w-4 h-4" />}
          variant="amber"
          subtitle="Kriter ve evrak havuzunda"
          progress={{
            value: Math.min(100, Math.round((inReviewCount / (totalCount || 1)) * 100)),
            colorClass: 'bg-amber-500',
          }}
        />

        <StatCard
          title="Kabul Edilen"
          value={acceptedCount}
          icon={<CheckCircle2 className="w-4 h-4" />}
          variant="emerald"
          subtitle="Kesin kayıt veya eğitime hazır"
          progress={{
            value: Math.min(100, Math.round((acceptedCount / (totalCount || 1)) * 100)),
            colorClass: 'bg-emerald-500',
          }}
        />

        <StatCard
          title="Taslak Başvurular"
          value={draftCount}
          icon={<FileCheck className="w-4 h-4" />}
          variant="default"
          subtitle="Tamamlanmayı bekleyen"
          progress={{
            value: Math.min(100, Math.round((draftCount / (totalCount || 1)) * 100)),
            colorClass: 'bg-slate-400',
          }}
        />
      </div>

      {/* 3. Visual Progression & Institutional Health Summary Row (SVG Donut Chart - Etkileşimli) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 w-full md:w-auto">
          {/* SVG Donut Chart (Etkileşimli / Dilim Vurgulu) */}
          {(() => {
            const getCenterDisplay = () => {
              switch (hoveredStatus) {
                case 'accepted':
                  return { count: acceptedCount, label: 'Kabul Edilen', color: 'text-emerald-600' };
                case 'in_review':
                  return { count: inReviewCount, label: 'İnceleniyor', color: 'text-amber-600' };
                case 'draft':
                  return { count: draftCount, label: 'Taslak', color: 'text-slate-500' };
                case 'all':
                default:
                  return { count: totalCount, label: 'Başvuru', color: 'text-slate-900' };
              }
            };
            const centerInfo = getCenterDisplay();

            return (
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 96 96">
                  {/* Background circle */}
                  <circle
                    cx="48"
                    cy="48"
                    r="36"
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth="10"
                  />
                  {/* Accepted Segment */}
                  {acceptedCount > 0 && (
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth={hoveredStatus === 'accepted' ? 14 : 10}
                      strokeDasharray={`${acceptedStroke} ${circ}`}
                      strokeDashoffset="0"
                      className="cursor-pointer transition-all duration-300"
                      style={{
                        filter: hoveredStatus === 'accepted' ? 'drop-shadow(0 2px 6px rgba(16, 185, 129, 0.45))' : 'none',
                        opacity: hoveredStatus === 'all' || hoveredStatus === 'accepted' ? 1 : 0.4,
                      }}
                      onMouseEnter={() => setHoveredStatus('accepted')}
                      onMouseLeave={() => setHoveredStatus('all')}
                    />
                  )}
                  {/* In Review Segment */}
                  {inReviewCount > 0 && (
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth={hoveredStatus === 'in_review' ? 14 : 10}
                      strokeDasharray={`${inReviewStroke} ${circ}`}
                      strokeDashoffset={`-${acceptedStroke}`}
                      className="cursor-pointer transition-all duration-300"
                      style={{
                        filter: hoveredStatus === 'in_review' ? 'drop-shadow(0 2px 6px rgba(245, 158, 11, 0.45))' : 'none',
                        opacity: hoveredStatus === 'all' || hoveredStatus === 'in_review' ? 1 : 0.4,
                      }}
                      onMouseEnter={() => setHoveredStatus('in_review')}
                      onMouseLeave={() => setHoveredStatus('all')}
                    />
                  )}
                  {/* Draft Segment */}
                  {draftCount > 0 && (
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      fill="none"
                      stroke="#94A3B8"
                      strokeWidth={hoveredStatus === 'draft' ? 14 : 10}
                      strokeDasharray={`${draftStroke} ${circ}`}
                      strokeDashoffset={`-${acceptedStroke + inReviewStroke}`}
                      className="cursor-pointer transition-all duration-300"
                      style={{
                        filter: hoveredStatus === 'draft' ? 'drop-shadow(0 2px 6px rgba(148, 163, 184, 0.45))' : 'none',
                        opacity: hoveredStatus === 'all' || hoveredStatus === 'draft' ? 1 : 0.4,
                      }}
                      onMouseEnter={() => setHoveredStatus('draft')}
                      onMouseLeave={() => setHoveredStatus('all')}
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none transition-all duration-200">
                  <span className={`text-base font-black leading-none ${centerInfo.color}`}>{centerInfo.count}</span>
                  <span className="text-[9px] text-slate-500 font-medium mt-0.5">{centerInfo.label}</span>
                </div>
              </div>
            );
          })()}

          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-sm font-bold text-slate-900">Başvuru Dağılımı ve Süreç Durumu</h2>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                Kütük Aktif
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              Tüm başvurularınız İslahiye Ticaret Odası Eğitim Kütüğü koruması altındadır. İdari kararlar kesinleştiğinde sistem üzerinden ve kayıtlı iletişim kanallarınızdan anlık teyit bildirimi alırsınız.
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-[11px] text-slate-600">
              <button
                type="button"
                onMouseEnter={() => setHoveredStatus('accepted')}
                onMouseLeave={() => setHoveredStatus('all')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  hoveredStatus === 'accepted' ? 'bg-emerald-50 border-emerald-300 font-bold scale-105' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Kabul: <strong>{acceptedCount}</strong></span>
              </button>
              <button
                type="button"
                onMouseEnter={() => setHoveredStatus('in_review')}
                onMouseLeave={() => setHoveredStatus('all')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  hoveredStatus === 'in_review' ? 'bg-amber-50 border-amber-300 font-bold scale-105' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>İncelemede: <strong>{inReviewCount}</strong></span>
              </button>
              <button
                type="button"
                onMouseEnter={() => setHoveredStatus('draft')}
                onMouseLeave={() => setHoveredStatus('all')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  hoveredStatus === 'draft' ? 'bg-slate-100 border-slate-300 font-bold scale-105' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span>Taslak: <strong>{draftCount}</strong></span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <Link
            to="/aday/profil"
            className="w-full sm:w-auto text-center px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition"
          >
            Aday Profilimi Güncelle →
          </Link>
        </div>
      </div>

      {/* 4. Main Dual-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Başvurularım (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* Subtabs Filter */}
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Başvurularım</span>
              <span className="text-xs text-slate-500 font-normal">({candidateApps.length})</span>
            </h2>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-2 py-1 rounded-md font-medium transition ${
                  filterTab === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('review')}
                className={`px-2 py-1 rounded-md font-medium transition ${
                  filterTab === 'review'
                    ? 'bg-white text-amber-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                İnceleme
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('accepted')}
                className={`px-2 py-1 rounded-md font-medium transition ${
                  filterTab === 'accepted'
                    ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kabul
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('draft')}
                className={`px-2 py-1 rounded-md font-medium transition ${
                  filterTab === 'draft'
                    ? 'bg-white text-slate-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Taslak
              </button>
            </div>
          </div>

          {filteredApps.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs space-y-3">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">Seçilen filtrede başvuru kaydı bulunmuyor.</p>
              <p className="text-[11px] text-slate-400">
                Açık eğitim programlarını inceleyerek ilçemizdeki ücretsiz mesleki atölyelere ön başvuru yapabilirsiniz.
              </p>
              <Button size="sm" onClick={() => navigate('/aday/katalog')}>
                Eğitim Kataloğunu İncele
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredApps.map((app) => {
                const badge = getStatusBadgeInfo(app.status);
                const isSelected = selectedApp?.id === app.id;
                const step = getStepperStep(app.status);

                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/40 border-blue-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {app.referenceNumber}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {app.cohortName || '2026 Güz Dönemi'}
                        </span>
                      </div>
                      <StatusBadge label={badge.label} variant={badge.variant} size="sm" />
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mt-1">
                      {app.programTitle}
                    </h3>

                    {/* Mini Stepper Progress Bar */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Aşama {step}/4</span>
                        <span>{app.appliedAt}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-300 ${
                            app.status === 'accepted'
                              ? 'bg-emerald-500'
                              : app.status === 'rejected'
                              ? 'bg-rose-500'
                              : app.status === 'withdrawn'
                              ? 'bg-slate-400'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${(step / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Seçili Başvuru İdari Süreç Prospektüsü (7 cols) */}
        <div className="lg:col-span-7">
          {selectedApp ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
              {/* Header with Reference, Program Title & Status */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                      {selectedApp.referenceNumber}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Dönem: {selectedApp.cohortName || '2026 Güz Dönemi'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      • Başvuru: {selectedApp.appliedAt}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    {selectedApp.programTitle}
                  </h2>
                </div>

                <div className="shrink-0">
                  <StatusBadge
                    label={getStatusBadgeInfo(selectedApp.status).label}
                    variant={getStatusBadgeInfo(selectedApp.status).variant}
                    size="md"
                  />
                </div>
              </div>

              {/* 4-Stage Interactive Visual Stepper Bar */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Başvuru Süreç Aşamaları</span>
                  <span className="text-[11px] text-blue-600 font-semibold">
                    Aşama {currentStep} / 4
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {/* Step 1 */}
                  <div className="space-y-1">
                    <div
                      className={`h-2 rounded-full transition-colors ${
                        currentStep >= 1 ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-semibold block leading-tight ${
                        currentStep >= 1 ? 'text-blue-900' : 'text-slate-400'
                      }`}
                    >
                      1. Başvuru Alındı
                    </span>
                  </div>

                  {/* Step 2 */}
                  <div className="space-y-1">
                    <div
                      className={`h-2 rounded-full transition-colors ${
                        currentStep >= 2 ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-semibold block leading-tight ${
                        currentStep >= 2 ? 'text-blue-900' : 'text-slate-400'
                      }`}
                    >
                      2. Ön İnceleme
                    </span>
                  </div>

                  {/* Step 3 */}
                  <div className="space-y-1">
                    <div
                      className={`h-2 rounded-full transition-colors ${
                        currentStep >= 3 ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-semibold block leading-tight ${
                        currentStep >= 3 ? 'text-blue-900' : 'text-slate-400'
                      }`}
                    >
                      3. Kriter Değerlendirme
                    </span>
                  </div>

                  {/* Step 4 */}
                  <div className="space-y-1">
                    <div
                      className={`h-2 rounded-full transition-colors ${
                        currentStep >= 4
                          ? selectedApp.status === 'accepted'
                            ? 'bg-emerald-600'
                            : selectedApp.status === 'rejected'
                            ? 'bg-rose-600'
                            : 'bg-blue-600'
                          : 'bg-slate-200'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-semibold block leading-tight ${
                        currentStep >= 4
                          ? selectedApp.status === 'accepted'
                            ? 'text-emerald-700 font-bold'
                            : selectedApp.status === 'rejected'
                            ? 'text-rose-700 font-bold'
                            : 'text-blue-900'
                          : 'text-slate-400'
                      }`}
                    >
                      4. Yönetim Kararı
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Status Action & Guidance Banner */}
              {selectedApp.status === 'draft' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>
                      Bu başvuru henüz <strong>Taslak</strong> aşamasındadır. İdari değerlendirmeye girmesi için formu tamamlayıp gönderiniz.
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/aday/basvuru/${selectedApp.programId}`)}
                    className="shrink-0"
                  >
                    Taslağı Tamamla & Gönder →
                  </Button>
                </div>
              )}

              {['submitted', 'under_review', 'pending'].includes(selectedApp.status) && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>İdari Değerlendirme Sürecindedir</span>
                  </div>
                  <p className="leading-relaxed text-slate-700">
                    Başvurunuz başarıyla kaydedilmiştir. Aday kütük bilgileri ve uygunluk kriterleri İslahiye Ticaret Odası Eğitim İşleri yetkili yöneticisi tarafından incelenmektedir. Sonuç ilan edildiğinde sistem bildiriminiz aktif olacaktır.
                  </p>
                </div>
              )}

              {selectedApp.status === 'accepted' && (
                <div className="space-y-3">
                  {/* Durum A: Kesin Kayıt İptal Edilmişse */}
                  {selectedEnrollment?.status === 'cancelled' && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-950 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-red-800">
                        <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Kayıt İptal Edildi</span>
                      </div>
                      <p className="leading-relaxed">
                        Bu programa ilişkin kesin kayıt işlemi idari yönetim tarafından iptal edilmiştir.
                      </p>
                      {selectedEnrollment.cancellationReason && (
                        <div className="p-2.5 bg-white/80 rounded border border-red-200 text-[11px] font-mono text-red-900">
                          <strong>İptal Gerekçesi:</strong> {selectedEnrollment.cancellationReason}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Durum B: Kesin Kayıt Bekleniyor */}
                  {(!selectedEnrollment || selectedEnrollment.status === 'pending_confirmation') && (
                    <div className="p-4 sm:p-5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-3">
                      <div className="flex items-center gap-2 font-bold text-amber-900">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Başvurunuz Kabul Edildi — Kesin Kayıt Onayı Bekleniyor</span>
                      </div>
                      <p className="leading-relaxed text-slate-700">
                        Tebrikler! Ön başvurunuz İslahiye Ticaret Odası yetkili idari yöneticisi tarafından <strong>kabul edilmiştir</strong>. Şu anda Eğitim İşleri tarafından evrak doğrulaması ve kesin kayıt listesi onaylanmaktadır.
                      </p>
                      <div className="p-2.5 bg-amber-100/70 rounded-lg text-[11px] text-amber-900 flex items-center justify-between">
                        <span>Aşama 1/3: Başvuru Kabulü Tamamlandı ✓</span>
                        <span className="font-semibold">Aşama 2: Kesin Kayıt Onayı (Sırada)</span>
                      </div>
                    </div>
                  )}

                  {/* Durum C: Kesin Kayıt Tamamlandı, Grup Ataması Bekleniyor */}
                  {selectedEnrollment?.status === 'confirmed' && !selectedAssignment && (
                    <div className="p-4 sm:p-5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-3">
                      <div className="flex items-center gap-2 font-bold text-blue-900">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Kesin Kayıt Onaylandı — Sınıf & Grup Ataması Bekleniyor</span>
                      </div>
                      <p className="leading-relaxed text-slate-700">
                        Kesin kaydınız <strong>{selectedEnrollment.confirmedAt}</strong> tarihinde onaylanmıştır. Eğitim grubu şube ve kontenjan planlaması yapılmaktadır. Sınıf atamanız yapıldığında ders programınız aktifleşecektir.
                      </p>
                      <div className="p-2.5 bg-blue-100/70 rounded-lg text-[11px] text-blue-900 flex items-center justify-between">
                        <span>Aşama 2/3: Kesin Kayıt Onaylandı ✓</span>
                        <span className="font-semibold">Aşama 3: Grup Şubesi Yerleşimi (Sırada)</span>
                      </div>
                    </div>
                  )}

                  {/* Durum D: Gruba Yerleştirildi — Kursiyer Paneli Aktif! */}
                  {selectedEnrollment?.status === 'confirmed' && selectedAssignment && (
                    <div className="p-4 sm:p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-3">
                      <div className="flex items-center gap-2 font-bold text-emerald-900">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Gruba Yerleştirildi — Kursiyerlik Başladı!</span>
                      </div>
                      <p className="leading-relaxed text-slate-700">
                        Tebrikler! Kesin kaydınız tamamlanmış ve <strong>{selectedAssignment.groupName}</strong> grubuna yerleştirildiniz. Kursiyer paneline geçiş yaparak derslerinizi, yoklama durumunuzu ve ödevlerinizi takip edebilirsiniz.
                      </p>
                      <div className="p-3 bg-white rounded-lg border border-emerald-200 text-slate-700 space-y-1">
                        <div><strong>Atandığı Şube / Grup:</strong> {selectedAssignment.groupName}</div>
                        <div><strong>Yerleşim Tarihi:</strong> {selectedAssignment.assignedAt}</div>
                      </div>
                      <div className="pt-1">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setRole('trainee');
                            navigate('/kursiyer');
                          }}
                        >
                          Kursiyer Paneline Geçiş Yap →
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {['waitlisted', 'reserve'].includes(selectedApp.status) && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-blue-900">
                    <Info className="w-4 h-4 shrink-0 text-blue-600" />
                    <span>Yedek Kontenjan Listesindesiniz</span>
                  </div>
                  <p className="leading-relaxed text-slate-700">
                    Kontenjan doluluğu sebebiyle başvurunuz yedek listeye kaydedilmiştir. Asil kursiyerlerden feragat eden olması durumunda kütük sıranıza göre adınıza kesin kayıt oluşturulacaktır.
                  </p>
                </div>
              )}

              {selectedApp.status === 'rejected' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-900">
                    <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Başvuru Bu Dönem İçin Uygun Görülmemiştir</span>
                  </div>
                  <p className="leading-relaxed text-slate-700">
                    Başvurunuz idari değerlendirme sonucunda bu dönem için kabul edilememiştir. Bir sonraki eğitim döneminde tekrar başvuru yapabilirsiniz.
                  </p>
                </div>
              )}

              {selectedApp.status === 'withdrawn' && (
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 space-y-1">
                  <strong className="block text-slate-900">Başvuru Geri Çekildi</strong>
                  <p>Bu başvuru aday talebi doğrultusunda idari süreçten çekilmiştir.</p>
                </div>
              )}

              {/* Administrative Result Message (Candidate Facing) */}
              {(selectedApp.candidateDecisionMessage || selectedApp.adminJustification) && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-800 block">
                    Yetkili İdari Yönetici Açıklaması:
                  </span>
                  <p className="text-slate-700 leading-relaxed italic bg-white p-3 rounded-lg border border-slate-200">
                    "{selectedApp.candidateDecisionMessage || selectedApp.adminJustification}"
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Karar Veren: {selectedApp.decidedBy || 'Selin Aydın (Yönetici)'}</span>
                    <span>Tarih: {selectedApp.decidedAt || selectedApp.appliedAt}</span>
                  </div>
                </div>
              )}

              {/* Program & Candidate Snapshot Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
                  <strong className="text-slate-900 block font-semibold flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <span>Aday Kütük Bilgileri</span>
                  </strong>
                  <div className="text-slate-600 space-y-1 text-[11px]">
                    <div><strong>Aday:</strong> {selectedApp.candidateName}</div>
                    <div><strong>E-Posta:</strong> {selectedApp.email}</div>
                    <div><strong>İkamet:</strong> {selectedApp.residenceDistrict || 'İslahiye Merkez'}</div>
                    <div><strong>Meslek:</strong> {selectedApp.occupation}</div>
                    <div><strong>Eğitim:</strong> {selectedApp.educationLevel}</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
                  <strong className="text-slate-900 block font-semibold flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span>Program Detayı</span>
                  </strong>
                  <div className="text-slate-600 space-y-1 text-[11px]">
                    <div><strong>Eğitim:</strong> {selectedApp.programTitle}</div>
                    <div><strong>Dönem:</strong> {selectedApp.cohortName || '2026 Güz Dönemi'}</div>
                    <div><strong>Başvuru Tarihi:</strong> {selectedApp.appliedAt}</div>
                    <div className="pt-1.5">
                      <Link
                        to={`/aday/katalog/${selectedApp.programId}`}
                        className="text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
                      >
                        Program Müfredatını İncele <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Motivation Statement Snapshot */}
              {selectedApp.statement && (
                <div className="space-y-1.5 text-xs pt-1">
                  <strong className="text-slate-800 block">Başvuru Motivasyon Beyanı:</strong>
                  <p className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed text-[11px]">
                    "{selectedApp.statement}"
                  </p>
                </div>
              )}

              {/* Process History (Zaman Çizelgesi) */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Başvuru Süreç Geçmişi
                </h3>
                <div className="space-y-2 border-l-2 border-slate-200 pl-4 ml-2 text-xs">
                  {selectedApp.statusHistory && selectedApp.statusHistory.length > 0 ? (
                    selectedApp.statusHistory.map((item, idx) => (
                      <div key={idx} className="relative pb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 absolute -left-[21px] top-1" />
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800 capitalize">
                            {getStatusBadgeInfo(item.status).label}
                          </span>
                          <span className="text-slate-400">{item.changedAt}</span>
                        </div>
                        {item.note && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.note}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="relative pb-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600 absolute -left-[21px] top-1" />
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800">
                          {getStatusBadgeInfo(selectedApp.status).label}
                        </span>
                        <span className="text-slate-400">{selectedApp.appliedAt}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Başvuru sisteme kaydedildi.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                {['draft', 'submitted', 'under_review', 'pending'].includes(selectedApp.status) ? (
                  <button
                    type="button"
                    onClick={() => setWithdrawModalOpen(true)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-medium hover:underline"
                  >
                    Başvurumu Geri Çekmek İstiyorum
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Sonuçlanan başvurular üzerinde geri çekme işlemi yapılamaz.
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReceiptModalOpen(true)}
                  >
                    <Printer className="w-3.5 h-3.5 mr-1" />
                    Başvuru Belgesi
                  </Button>

                  {selectedApp.status === 'draft' && (
                    <Button
                      size="sm"
                      onClick={() => navigate(`/aday/basvuru/${selectedApp.programId}`)}
                    >
                      Taslağı Tamamla →
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
              İncelemek istediğiniz başvuruyu soldaki listeden seçiniz.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Başvuruyu Geri Çekme Onay Modalı */}
      {selectedApp && (
        <Modal
          isOpen={withdrawModalOpen}
          onClose={() => setWithdrawModalOpen(false)}
          title="Başvuruyu Geri Çekme Onayı"
          maxWidth="max-w-md"
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <Button variant="outline" size="sm" onClick={() => setWithdrawModalOpen(false)}>
                Vazgeç
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmWithdraw}
              >
                Geri Çekmeyi Onayla
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <p>
              <strong>{selectedApp.programTitle}</strong> programına ait <strong>{selectedApp.referenceNumber}</strong> nolu başvurunuzu geri çekmek üzeresiniz.
            </p>
            <p className="text-slate-500">
              Geri çekilen başvurular idari değerlendirme havuzundan çıkarılır. İstediğiniz zaman aynı veya başka bir programa yeniden başvuru yapabilirsiniz.
            </p>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Geri Çekme Nedeni (İsteğe Bağlı):
              </label>
              <textarea
                rows={2}
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="Örn: Çalışma takvimim değişti, bir sonraki dönem başvuracağım..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: Resmi Başvuru Kayıt Belgesi / Alındı Yazısı */}
      {selectedApp && (
        <Modal
          isOpen={receiptModalOpen}
          onClose={() => setReceiptModalOpen(false)}
          title="İTO Eğitim Başvuru Belgesi"
          maxWidth="max-w-2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-slate-400">
                Belge No: {selectedApp.referenceNumber}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Yazdır
                </Button>
                <Button size="sm" onClick={() => setReceiptModalOpen(false)}>
                  Kapat
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-5 text-xs text-slate-700 p-2">
            {/* Header of Certificate */}
            <div className="text-center pb-4 border-b border-slate-200 space-y-1">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs mx-auto mb-2">
                İE
              </div>
              <h3 className="font-bold text-sm text-slate-900">İSLAHİYE TİCARET ODASI</h3>
              <p className="text-[11px] text-slate-500 font-medium">Mesleki Eğitim ve Dijital Dönüşüm Merkezi</p>
              <h4 className="text-xs font-bold text-blue-900 pt-1">EĞİTİM PROGRAMI ÖN BAŞVURU TEYİT BELGESİ</h4>
            </div>

            {/* Document Details Grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-400 block">Başvuru Referans Kodu:</span>
                <strong className="text-slate-900 font-mono text-xs">{selectedApp.referenceNumber}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Kayıt Tarihi & Saati:</span>
                <strong className="text-slate-900">{selectedApp.appliedAt}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Aday Adı Soyadı:</span>
                <strong className="text-slate-900">{selectedApp.candidateName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">İletişim E-Postası:</span>
                <strong className="text-slate-900">{selectedApp.email}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Başvurulan Eğitim Programı:</span>
                <strong className="text-slate-900">{selectedApp.programTitle}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Eğitim Dönemi:</span>
                <strong className="text-slate-900">{selectedApp.cohortName || '2026 Güz Dönemi'}</strong>
              </div>
            </div>

            {/* Candidate Declarations */}
            <div className="space-y-2 border-t border-slate-200 pt-3 text-[11px]">
              <strong className="text-slate-900 block font-semibold">Taahhüt ve Katılım Beyanları:</strong>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                <li>Ders oturumlarına en az %80 devam koşulunu kabul etmiştir.</li>
                <li>Bireysel ödevleri tamamlayacağını ve 70/100 başarı barajını hedeflediğini taahhüt etmiştir.</li>
                <li>Beyan ettiği ikametgâh, mesleki deneyim ve eğitim bilgilerinin doğruluğunu onaylamıştır.</li>
              </ul>
            </div>

            {/* Verification Note */}
            <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900 flex items-center justify-between">
              <span>Bu belge İslahiye Ticaret Odası Eğitim Portalı kütük kaydının resmi elektronik özetidir.</span>
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
