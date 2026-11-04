import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Save,
  History,
  CheckCircle,
  AlertTriangle,
  Calendar,
  FileCheck,
  Bell,
  Award,
  MapPin,
  Clock,
  Plus,
  Trash2,
  Building2,
  RotateCcw,
  Sliders,
  Check,
  X,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Search,
} from 'lucide-react';
import { ActionConfirmModal } from '../components/common/ActionConfirmModal';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import {
  getStoredSystemSettings,
  getStoredSettingsHistory,
  updateSystemSettings,
  subscribeToSettingsUpdates,
} from '../services/systemSettingsStorage';
import {
  getStoredLocations,
  addStoredLocation,
  removeStoredLocation,
  getStoredSchedules,
  addStoredSchedule,
  removeStoredSchedule,
  resetFacilityCatalog,
  subscribeToFacilityCatalog,
} from '../services/facilityCatalogService';
import { SystemSettings, SystemSettingsHistoryItem } from '../types';
import { ExcusedPolicy } from '../services/attendanceEngine';

type ActiveSettingsTab =
  | 'attendance'
  | 'grading'
  | 'verification'
  | 'catalog'
  | 'notifications'
  | 'changelog';

export const SystemSettingsPage: React.FC = () => {
  const { currentRole, currentUser } = useDemoRole();
  const [settings, setSettings] = useState<SystemSettings>(getStoredSystemSettings());
  const [history, setHistory] = useState<SystemSettingsHistoryItem[]>(getStoredSettingsHistory());
  const [activeTab, setActiveTab] = useState<ActiveSettingsTab>('attendance');

  // Form states (synced with settings initially)
  const [minAttendance, setMinAttendance] = useState(settings.attendancePolicy.minAttendanceRateRequired);
  const [excusedPolicy, setExcusedPolicy] = useState<ExcusedPolicy>(settings.attendancePolicy.excusedPolicy);
  const [correctionDays, setCorrectionDays] = useState(settings.attendancePolicy.allowAttendanceCorrectionDays);

  const [minAssignmentAvg, setMinAssignmentAvg] = useState(settings.assignmentPolicy.minPassingAssignmentAverage);
  const [requireAllMandatory, setRequireAllMandatory] = useState(settings.assignmentPolicy.requireAllMandatoryApproved);
  const [allowLateSubmissions, setAllowLateSubmissions] = useState(settings.assignmentPolicy.allowLateSubmissions);
  const [maxRevisions, setMaxRevisions] = useState(settings.assignmentPolicy.maxRevisionAttempts);

  const [verifyBaseUrl, setVerifyBaseUrl] = useState(settings.verification.baseUrl);
  const [enablePublicVerify, setEnablePublicVerify] = useState(settings.verification.enablePublicVerification);
  const [enforceDisclaimer, setEnforceDisclaimer] = useState(settings.verification.enforceDemoDisclaimerOnCertificates);

  const [inAppNotifs, setInAppNotifs] = useState(settings.notifications.enableInAppNotifications);
  const [emailQueue, setEmailQueue] = useState(settings.notifications.enableEmailSimulationQueue);
  const [notifyAdmins, setNotifyAdmins] = useState(settings.notifications.notifyAdminsOnNewApplication ?? true);
  const [notifyTrainees, setNotifyTrainees] = useState(settings.notifications.notifyTraineeOnSessionChange ?? true);

  // Facility & Schedule Catalog State
  const [locations, setLocations] = useState<string[]>(getStoredLocations());
  const [schedules, setSchedules] = useState<string[]>(getStoredSchedules());
  const [newLocationInput, setNewLocationInput] = useState('');
  const [newScheduleInput, setNewScheduleInput] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [scheduleSearch, setScheduleSearch] = useState('');
  const [catalogFeedback, setCatalogFeedback] = useState<string | null>(null);

  // Policy Versioning Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [affectsPastRecords, setAffectsPastRecords] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Reusable in-app popup modal (No window.alert / window.confirm)
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    isAlertOnly?: boolean;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    const unsub = subscribeToSettingsUpdates((s) => {
      setSettings(s);
      setHistory(getStoredSettingsHistory());
      // Re-sync form if not dirty
      setMinAttendance(s.attendancePolicy.minAttendanceRateRequired);
      setExcusedPolicy(s.attendancePolicy.excusedPolicy);
      setCorrectionDays(s.attendancePolicy.allowAttendanceCorrectionDays);
      setMinAssignmentAvg(s.assignmentPolicy.minPassingAssignmentAverage);
      setRequireAllMandatory(s.assignmentPolicy.requireAllMandatoryApproved);
      setAllowLateSubmissions(s.assignmentPolicy.allowLateSubmissions);
      setMaxRevisions(s.assignmentPolicy.maxRevisionAttempts);
      setVerifyBaseUrl(s.verification.baseUrl);
      setEnablePublicVerify(s.verification.enablePublicVerification);
      setEnforceDisclaimer(s.verification.enforceDemoDisclaimerOnCertificates);
      setInAppNotifs(s.notifications.enableInAppNotifications);
      setEmailQueue(s.notifications.enableEmailSimulationQueue);
      setNotifyAdmins(s.notifications.notifyAdminsOnNewApplication ?? true);
      setNotifyTrainees(s.notifications.notifyTraineeOnSessionChange ?? true);
    });

    const unsubFacility = subscribeToFacilityCatalog(() => {
      setLocations(getStoredLocations());
      setSchedules(getStoredSchedules());
    });

    return () => {
      unsub();
      unsubFacility();
    };
  }, []);

  const isSuperAdmin = currentRole === 'superadmin';

  // Check if form is dirty (differs from saved policy)
  const isDirty = useMemo(() => {
    return (
      minAttendance !== settings.attendancePolicy.minAttendanceRateRequired ||
      excusedPolicy !== settings.attendancePolicy.excusedPolicy ||
      correctionDays !== settings.attendancePolicy.allowAttendanceCorrectionDays ||
      minAssignmentAvg !== settings.assignmentPolicy.minPassingAssignmentAverage ||
      requireAllMandatory !== settings.assignmentPolicy.requireAllMandatoryApproved ||
      allowLateSubmissions !== settings.assignmentPolicy.allowLateSubmissions ||
      maxRevisions !== settings.assignmentPolicy.maxRevisionAttempts ||
      verifyBaseUrl.trim() !== settings.verification.baseUrl ||
      enablePublicVerify !== settings.verification.enablePublicVerification ||
      enforceDisclaimer !== settings.verification.enforceDemoDisclaimerOnCertificates ||
      inAppNotifs !== settings.notifications.enableInAppNotifications ||
      emailQueue !== settings.notifications.enableEmailSimulationQueue ||
      notifyAdmins !== (settings.notifications.notifyAdminsOnNewApplication ?? true) ||
      notifyTrainees !== (settings.notifications.notifyTraineeOnSessionChange ?? true)
    );
  }, [
    minAttendance,
    excusedPolicy,
    correctionDays,
    minAssignmentAvg,
    requireAllMandatory,
    allowLateSubmissions,
    maxRevisions,
    verifyBaseUrl,
    enablePublicVerify,
    enforceDisclaimer,
    inAppNotifs,
    emailQueue,
    notifyAdmins,
    notifyTrainees,
    settings,
  ]);

  // Compute Diff Summary for the confirmation dialog
  const diffList = useMemo(() => {
    const diffs: { label: string; from: string; to: string }[] = [];

    if (minAttendance !== settings.attendancePolicy.minAttendanceRateRequired) {
      diffs.push({
        label: 'Asgari Devam Oranı Barajı',
        from: `%${settings.attendancePolicy.minAttendanceRateRequired}`,
        to: `%${minAttendance}`,
      });
    }
    if (excusedPolicy !== settings.attendancePolicy.excusedPolicy) {
      diffs.push({
        label: 'Mazeretli Oturum Devam Hesabı',
        from: settings.attendancePolicy.excusedPolicy,
        to: excusedPolicy,
      });
    }
    if (correctionDays !== settings.attendancePolicy.allowAttendanceCorrectionDays) {
      diffs.push({
        label: 'Yoklama İtiraz Süresi',
        from: `${settings.attendancePolicy.allowAttendanceCorrectionDays} Gün`,
        to: `${correctionDays} Gün`,
      });
    }
    if (minAssignmentAvg !== settings.assignmentPolicy.minPassingAssignmentAverage) {
      diffs.push({
        label: 'Asgari Ödev Not Ortalaması',
        from: `${settings.assignmentPolicy.minPassingAssignmentAverage} Puan`,
        to: `${minAssignmentAvg} Puan`,
      });
    }
    if (requireAllMandatory !== settings.assignmentPolicy.requireAllMandatoryApproved) {
      diffs.push({
        label: 'Tüm Zorunlu Ödevlerin Onayı Şartı',
        from: settings.assignmentPolicy.requireAllMandatoryApproved ? 'Zorunlu' : 'Opsiyonel',
        to: requireAllMandatory ? 'Zorunlu' : 'Opsiyonel',
      });
    }
    if (allowLateSubmissions !== settings.assignmentPolicy.allowLateSubmissions) {
      diffs.push({
        label: 'Gecikmeli Ödev Teslimine İzin',
        from: settings.assignmentPolicy.allowLateSubmissions ? 'Açık' : 'Kapalı',
        to: allowLateSubmissions ? 'Açık' : 'Kapalı',
      });
    }
    if (maxRevisions !== settings.assignmentPolicy.maxRevisionAttempts) {
      diffs.push({
        label: 'Azami Revizyon Hakkı',
        from: `${settings.assignmentPolicy.maxRevisionAttempts} Hak`,
        to: `${maxRevisions} Hak`,
      });
    }
    if (verifyBaseUrl.trim() !== settings.verification.baseUrl) {
      diffs.push({
        label: 'Karekod Doğrulama URL',
        from: settings.verification.baseUrl,
        to: verifyBaseUrl.trim(),
      });
    }
    if (enablePublicVerify !== settings.verification.enablePublicVerification) {
      diffs.push({
        label: 'Kamusal Doğrulama Sayfası',
        from: settings.verification.enablePublicVerification ? 'Açık' : 'Kapalı',
        to: enablePublicVerify ? 'Açık' : 'Kapalı',
      });
    }
    if (enforceDisclaimer !== settings.verification.enforceDemoDisclaimerOnCertificates) {
      diffs.push({
        label: 'Belge Demo / Filigran İbaresi',
        from: settings.verification.enforceDemoDisclaimerOnCertificates ? 'Zorunlu' : 'Serbest',
        to: enforceDisclaimer ? 'Zorunlu' : 'Serbest',
      });
    }
    if (inAppNotifs !== settings.notifications.enableInAppNotifications) {
      diffs.push({
        label: 'Sistem İçi Bildirimler',
        from: settings.notifications.enableInAppNotifications ? 'Açık' : 'Kapalı',
        to: inAppNotifs ? 'Açık' : 'Kapalı',
      });
    }
    if (emailQueue !== settings.notifications.enableEmailSimulationQueue) {
      diffs.push({
        label: 'E-posta Simülasyon Kuyruğu',
        from: settings.notifications.enableEmailSimulationQueue ? 'Açık' : 'Kapalı',
        to: emailQueue ? 'Açık' : 'Kapalı',
      });
    }

    return diffs;
  }, [
    minAttendance,
    excusedPolicy,
    correctionDays,
    minAssignmentAvg,
    requireAllMandatory,
    allowLateSubmissions,
    maxRevisions,
    verifyBaseUrl,
    enablePublicVerify,
    enforceDisclaimer,
    inAppNotifs,
    emailQueue,
    settings,
  ]);

  // Reset local state back to current settings
  const handleResetForm = () => {
    setMinAttendance(settings.attendancePolicy.minAttendanceRateRequired);
    setExcusedPolicy(settings.attendancePolicy.excusedPolicy);
    setCorrectionDays(settings.attendancePolicy.allowAttendanceCorrectionDays);
    setMinAssignmentAvg(settings.assignmentPolicy.minPassingAssignmentAverage);
    setRequireAllMandatory(settings.assignmentPolicy.requireAllMandatoryApproved);
    setAllowLateSubmissions(settings.assignmentPolicy.allowLateSubmissions);
    setMaxRevisions(settings.assignmentPolicy.maxRevisionAttempts);
    setVerifyBaseUrl(settings.verification.baseUrl);
    setEnablePublicVerify(settings.verification.enablePublicVerification);
    setEnforceDisclaimer(settings.verification.enforceDemoDisclaimerOnCertificates);
    setInAppNotifs(settings.notifications.enableInAppNotifications);
    setEmailQueue(settings.notifications.enableEmailSimulationQueue);
    setNotifyAdmins(settings.notifications.notifyAdminsOnNewApplication ?? true);
    setNotifyTrainees(settings.notifications.notifyTraineeOnSessionChange ?? true);
  };

  // Facility Handlers
  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationInput.trim()) return;
    addStoredLocation(newLocationInput.trim());
    setNewLocationInput('');
    setCatalogFeedback('Yeni derslik kataloğa başarıyla eklendi.');
    setTimeout(() => setCatalogFeedback(null), 3000);
  };

  const handleRemoveLocation = (loc: string) => {
    if (locations.length <= 1) {
      setModalConfig({
        isOpen: true,
        title: 'İşlem Sınırı',
        message: 'Katalogda en az bir aktif derslik bulunmalıdır. Son derslik silinemez.',
        variant: 'warning',
        isAlertOnly: true,
      });
      return;
    }
    setModalConfig({
      isOpen: true,
      title: 'Dersliği Katalogdan Kaldır',
      message: `"${loc}" mekânı derslik kataloğundan silinsin mi?`,
      confirmText: 'Evet, Kaldır',
      variant: 'danger',
      onConfirm: () => {
        removeStoredLocation(loc);
        setCatalogFeedback('Derslik katalogdan kaldırıldı.');
        setTimeout(() => setCatalogFeedback(null), 3000);
      },
    });
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleInput.trim()) return;
    addStoredSchedule(newScheduleInput.trim());
    setNewScheduleInput('');
    setCatalogFeedback('Yeni saat şablonu kataloğa başarıyla eklendi.');
    setTimeout(() => setCatalogFeedback(null), 3000);
  };

  const handleRemoveSchedule = (sched: string) => {
    if (schedules.length <= 1) {
      setModalConfig({
        isOpen: true,
        title: 'İşlem Sınırı',
        message: 'Katalogda en az bir aktif oturum saati şablonu bulunmalıdır. Son şablon silinemez.',
        variant: 'warning',
        isAlertOnly: true,
      });
      return;
    }
    setModalConfig({
      isOpen: true,
      title: 'Saat Şablonunu Kaldır',
      message: `"${sched}" saat şablonu katalogdan silinsin mi?`,
      confirmText: 'Evet, Kaldır',
      variant: 'danger',
      onConfirm: () => {
        removeStoredSchedule(sched);
        setCatalogFeedback('Saat şablonu katalogdan kaldırıldı.');
        setTimeout(() => setCatalogFeedback(null), 3000);
      },
    });
  };

  const handleResetCatalog = () => {
    setModalConfig({
      isOpen: true,
      title: 'Kataloğu Sıfırla',
      message: 'Tüm derslik ve saat şablonları başlangıç fabrika ayarlarına döndürülsün mü? Eklediğiniz özel tanımlar sıfırlanacaktır.',
      confirmText: 'Fabrika Ayarlarına Sıfırla',
      variant: 'danger',
      onConfirm: () => {
        resetFacilityCatalog();
        setCatalogFeedback('Mekân ve takvim kataloğu varsayılanlara sıfırlandı.');
        setTimeout(() => setCatalogFeedback(null), 3500);
      },
    });
  };

  const handleOpenConfirmModal = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!isSuperAdmin) {
      setErrorMessage('Sistem politikalarını yalnızca Sistem Yöneticisi güncelleyebilir.');
      return;
    }

    if (!verifyBaseUrl.startsWith('http://') && !verifyBaseUrl.startsWith('https://')) {
      setErrorMessage('Doğrulama URL adresi mutlaka http:// veya https:// ile başlamalıdır.');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleExecuteSave = () => {
    if (!changeReason.trim()) {
      setErrorMessage('Politika değişikliği için resmi kurumsal gerekçe girilmesi zorunludur.');
      return;
    }

    const res = updateSystemSettings({
      updates: {
        attendancePolicy: {
          minAttendanceRateRequired: Number(minAttendance),
          excusedPolicy,
          allowAttendanceCorrectionDays: Number(correctionDays),
        },
        assignmentPolicy: {
          minPassingAssignmentAverage: Number(minAssignmentAvg),
          requireAllMandatoryApproved: requireAllMandatory,
          allowLateSubmissions,
          maxRevisionAttempts: Number(maxRevisions),
        },
        verification: {
          baseUrl: verifyBaseUrl.trim(),
          enablePublicVerification: enablePublicVerify,
          enforceDemoDisclaimerOnCertificates: enforceDisclaimer,
        },
        notifications: {
          enableInAppNotifications: inAppNotifs,
          enableEmailSimulationQueue: emailQueue,
          notifyAdminsOnNewApplication: notifyAdmins,
          notifyTraineeOnSessionChange: notifyTrainees,
        },
      },
      actor: {
        id: currentUser.id,
        role: currentRole,
        name: currentUser.fullName,
      },
      changeReason,
      affectsPastRecords,
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Ayarlar kaydedilemedi.');
    } else {
      setSuccessMessage(`Sistem politikaları v${res.settings?.version}.0 olarak başarıyla tescil edildi.`);
      setTimeout(() => {
        setShowConfirmModal(false);
        setChangeReason('');
        setErrorMessage('');
      }, 1200);
    }
  };

  // Filtered lists for catalog
  const filteredLocations = locations.filter((l) =>
    l.toLowerCase().includes(locationSearch.toLowerCase())
  );
  const filteredSchedules = schedules.filter((s) =>
    s.toLowerCase().includes(scheduleSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Sistem Politikaları ve Yönetişim Yapılandırması
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              v{settings.version}.0 Yürürlükte
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Devam barajları (%80), ödev başarı eşikleri (70/100), karekod tescili ve mekân kataloğu sürümlenerek denetim kütüğüne kaydedilir.
          </p>
        </div>

        {/* Current Version & Actor Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-right shrink-0">
          <div className="text-xs font-bold text-slate-900">
            Son Tescil: {new Date(settings.updatedAt).toLocaleDateString('tr-TR')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Yetkili: <strong>{settings.updatedBy}</strong> ({settings.updatedByRole})
          </div>
        </div>
      </div>

      {/* Global Superadmin Guard Notification */}
      {!isSuperAdmin && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <div className="font-bold">Salt Okunur İzleme Modu:</div>
            <p>
              Şu an <strong>{currentUser.role}</strong> profilindesiniz. Başarı eşiklerini ve sistem politikalarını yalnızca <strong>Sistem Yöneticisi (Kemal Ertürk)</strong> değiştirebilir.
            </p>
          </div>
        </div>
      )}

      {/* Benchmark SaaS Navigation Tabs (Stripe / GitHub style) */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-2xs flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'attendance'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Devam & Mazeret</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('grading')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'grading'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Ödev & Başarı</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('verification')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'verification'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Karekod & Belge</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'catalog'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Mekân & Takvim Kataloğu</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'notifications'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Bildirim & Kuyruk</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('changelog')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ml-auto ${
            activeTab === 'changelog'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Sürüm Tarihçesi ({history.length})</span>
        </button>
      </div>

      {/* TAB CONTENT AREAS */}

      {/* TAB 1: ATTENDANCE POLICY */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Devam ve Mazeret Hesaplama Politikası
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Kursiyerlerin sertifikasyona hak kazanması için gereken asgari katılım oranı ve mazeret formülü.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Setting 1: Min Attendance Threshold */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-900">
                    Asgari Devam Oranı Şartı
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Resmi İslahiye Ticaret Odası taban kuralı: <strong>%80</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-blue-600 font-mono">
                    %{minAttendance}
                  </span>
                </div>
              </div>

              {/* Slider & Indicator */}
              <div className="space-y-1 pt-1">
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={5}
                  disabled={!isSuperAdmin}
                  value={minAttendance}
                  onChange={(e) => setMinAttendance(Number(e.target.value))}
                  className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer disabled:opacity-40"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>%50 (Asgari)</span>
                  <span className="text-blue-700 font-bold">%80 (Resmi Taban)</span>
                  <span>%100 (Tam Katılım)</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Devam Formülü Özeti:
                </div>
                <p className="text-[11px] leading-relaxed">
                  Devam Oranı = (Katılınan Oturumlar / Toplam Oturumlar) × 100. İptal edilen dersler paydadan tamamen hariç tutulur.
                </p>
              </div>
            </div>

            {/* Setting 2: Excused Policy Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-900">
                Mazeretli Oturumların Devam Hesabına Etkisi
              </label>

              <div className="space-y-2.5">
                <label
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer block transition ${
                    excusedPolicy === 'exclude_from_denominator'
                      ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="excusedPolicy"
                      disabled={!isSuperAdmin}
                      checked={excusedPolicy === 'exclude_from_denominator'}
                      onChange={() => setExcusedPolicy('exclude_from_denominator')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900">
                        Mazeretli oturumları paydadan düş (exclude_from_denominator) — [Önerilen]
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Resmi mazereti onaylanan oturumlar toplam ders yükümlülüğünden düşülür. Kursiyer haksız devamsızlıktan etkilenmez.
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer block transition ${
                    excusedPolicy === 'count_as_attended'
                      ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="excusedPolicy"
                      disabled={!isSuperAdmin}
                      checked={excusedPolicy === 'count_as_attended'}
                      onChange={() => setExcusedPolicy('count_as_attended')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <div className="font-bold text-slate-900">
                        Mazeretli oturumları katıldı say (count_as_attended)
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Mazeretli oturumlar doğrudan katılım payına eklenir.
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Setting 3: Dispute correction window */}
              <div className="pt-2">
                <label className="text-xs font-bold text-slate-900 block mb-1">
                  Yoklama Düzeltme & İtiraz Süresi (Gün)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    disabled={!isSuperAdmin}
                    value={correctionDays}
                    onChange={(e) => setCorrectionDays(Number(e.target.value))}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-500">
                    Eğitmen oturum tamamlandıktan sonra en geç {correctionDays} gün içinde yoklamayı revize edebilir.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GRADING & SUCCESS POLICY */}
      {activeTab === 'grading' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              Ödev, Notlandırma ve Başarı Politikası
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Mezuniyet ve sertifika hakkı için geçer not baremleri ve teslim kuralları.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Setting 1: Min Grade Threshold */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-900">
                    Asgari Başarı Puan Ortalaması (100 Üzerinden)
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Resmi İslahiye Ticaret Odası taban kuralı: <strong>70/100</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-blue-600 font-mono">
                    {minAssignmentAvg}/100
                  </span>
                </div>
              </div>

              {/* Slider & Indicator */}
              <div className="space-y-1">
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={5}
                  disabled={!isSuperAdmin}
                  value={minAssignmentAvg}
                  onChange={(e) => setMinAssignmentAvg(Number(e.target.value))}
                  className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer disabled:opacity-40"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>50 (Geçer Taban)</span>
                  <span className="text-blue-700 font-bold">70 (Resmi Başarı Eşiği)</span>
                  <span>100 (Mükemmel)</span>
                </div>
              </div>

              {/* Setting: Max revisions */}
              <div className="pt-2">
                <label className="text-xs font-bold text-slate-900 block mb-1">
                  Azami Ödev Revizyon Hakkı (Deneme)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={5}
                    disabled={!isSuperAdmin}
                    value={maxRevisions}
                    onChange={(e) => setMaxRevisions(Number(e.target.value))}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-500">
                    Eğitmen yetersiz bulduğu ödeve en fazla {maxRevisions} kez revizyon talep edebilir.
                  </span>
                </div>
              </div>
            </div>

            {/* Setting 2: Toggles */}
            <div className="space-y-4">
              {/* Toggle 1: All Mandatory Homework */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Tüm Zorunlu Ödevlerin Onaylanması Şartı
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Etkinleştirildiğinde, kursiyer 70 ortalamayı yakalasa bile zorunlu olarak işaretlenmiş ödevlerden biri eksik veya reddedilmiş ise mezuniyet onayı alamaz.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={requireAllMandatory}
                  disabled={!isSuperAdmin}
                  onClick={() => setRequireAllMandatory(!requireAllMandatory)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    requireAllMandatory ? 'bg-blue-600' : 'bg-slate-300'
                  } disabled:opacity-40`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      requireAllMandatory ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2: Late submissions */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Gecikmeli Ödev Teslimine İzin Ver
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Son teslim tarihi geçen ödevlerde sistem teslimi kapatmak yerine 'Gecikmeli Teslim' etiketiyle kabul eder ve eğitmene bildirir.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={allowLateSubmissions}
                  disabled={!isSuperAdmin}
                  onClick={() => setAllowLateSubmissions(!allowLateSubmissions)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    allowLateSubmissions ? 'bg-blue-600' : 'bg-slate-300'
                  } disabled:opacity-40`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      allowLateSubmissions ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VERIFICATION & QR SETTINGS */}
      {activeTab === 'verification' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Karekod ve Belge Doğrulama Tescil Ayarları
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Üretilen dijital sertifikaların kamusal sorgulama adresleri ve güvenlik filigranı kuralları.
            </p>
          </div>

          <div className="space-y-6 max-w-3xl">
            {/* Base URL */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 block">
                Belge Doğrulama Temel URL Adresi
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={verifyBaseUrl}
                  onChange={(e) => setVerifyBaseUrl(e.target.value)}
                  placeholder="http://localhost:5174/belge-dogrula"
                  className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                />
                <a
                  href={verifyBaseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition flex items-center gap-1.5 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test Et</span>
                </a>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                {verifyBaseUrl.startsWith('http://') || verifyBaseUrl.startsWith('https://') ? (
                  <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                    <Check className="w-3.5 h-3.5" /> Geçerli protokol doğrulaması yapıldı
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1 font-semibold">
                    <X className="w-3.5 h-3.5" /> URL mutlaka 'http://' veya 'https://' ile başlamalıdır
                  </span>
                )}
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Kamusal Doğrulama Sayfası
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Karekod okutulduğunda yetkisiz ziyaretçilerin sertifika geçerliliğini teyit edebileceği halka açık ekranı aktif tutar.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enablePublicVerify}
                  disabled={!isSuperAdmin}
                  onClick={() => setEnablePublicVerify(!enablePublicVerify)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    enablePublicVerify ? 'bg-blue-600' : 'bg-slate-300'
                  } disabled:opacity-40`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      enablePublicVerify ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Demo Filigranı & Güvenlik Uyarısı
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sertifika üzerinde resmi akreditasyon ve demo bilgilendirme etiketini zorunlu kılar.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enforceDisclaimer}
                  disabled={!isSuperAdmin}
                  onClick={() => setEnforceDisclaimer(!enforceDisclaimer)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    enforceDisclaimer ? 'bg-blue-600' : 'bg-slate-300'
                  } disabled:opacity-40`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      enforceDisclaimer ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FACILITY & SCHEDULE CATALOG */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Eğitim Mekânları, Derslikler ve Takvim Şablonları Kataloğu
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Yeni grup ve oturum oluşturulurken seçilen derslikler ve zaman çizelgeleri master kataloğu.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetCatalog}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kataloğu Sıfırla</span>
            </button>
          </div>

          {catalogFeedback && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{catalogFeedback}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Column 1: Locations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Derslikler ve Salonlar</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {locations.length} Tanımlı
                </span>
              </div>

              {/* Add form */}
              <form onSubmit={handleAddLocation} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Yeni derslik adı (örn: Kat 2 Bilişim Lab)..."
                  value={newLocationInput}
                  onChange={(e) => setNewLocationInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ekle</span>
                </button>
              </form>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Derslik filtrele..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-slate-50"
                />
              </div>

              {/* List */}
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {filteredLocations.map((loc) => (
                  <div
                    key={loc}
                    className="px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition group"
                  >
                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span>{loc}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLocation(loc)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition p-1"
                      title="Katalogdan Kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Schedules */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Oturum ve Takvim Şablonları</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {schedules.length} Tanımlı
                </span>
              </div>

              {/* Add form */}
              <form onSubmit={handleAddSchedule} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Yeni saat şablonu (örn: Hafta Sonu 10:00 - 13:00)..."
                  value={newScheduleInput}
                  onChange={(e) => setNewScheduleInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ekle</span>
                </button>
              </form>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Saat şablonu filtrele..."
                  value={scheduleSearch}
                  onChange={(e) => setScheduleSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-slate-50"
                />
              </div>

              {/* List */}
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {filteredSchedules.map((sched) => (
                  <div
                    key={sched}
                    className="px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition group"
                  >
                    <div className="flex items-center gap-2 text-slate-800 font-medium">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span>{sched}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSchedule(sched)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition p-1"
                      title="Katalogdan Kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: NOTIFICATIONS & QUEUES */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Bildirim ve İletişim Tercihleri
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Sistem içi popover uyarılar, e-posta simülasyon kuyrukları ve bildirim tetikleyicileri.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Sistem İçi Anlık Bildirim Merkezi
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Kullanıcı oturumunda popover ve sağ üst zil rozetiyle bildirim gösterimini aktif tutar.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={inAppNotifs}
                disabled={!isSuperAdmin}
                onClick={() => setInAppNotifs(!inAppNotifs)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  inAppNotifs ? 'bg-blue-600' : 'bg-slate-300'
                } disabled:opacity-40`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    inAppNotifs ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  E-Posta Gönderim Simülasyon Kuyruğu
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Toplu ve bireysel e-postaları gerçek SMTP yerine denetim kütüğü ve simülasyon kuyruğuna yazar.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={emailQueue}
                disabled={!isSuperAdmin}
                onClick={() => setEmailQueue(!emailQueue)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  emailQueue ? 'bg-blue-600' : 'bg-slate-300'
                } disabled:opacity-40`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    emailQueue ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Yeni Başvuru Geldiğinde Yöneticilere Bildir
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Aday başvurusu yapıldığında eğitim koordinatörlerine inceleme bildirimi iletir.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifyAdmins}
                disabled={!isSuperAdmin}
                onClick={() => setNotifyAdmins(!notifyAdmins)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifyAdmins ? 'bg-blue-600' : 'bg-slate-300'
                } disabled:opacity-40`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    notifyAdmins ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Oturum veya Derslik Değişikliğinde Kursiyere Bildir
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ders saati veya salonu güncellendiğinde kayıtlı öğrencilere anında uyarı iletir.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifyTrainees}
                disabled={!isSuperAdmin}
                onClick={() => setNotifyTrainees(!notifyTrainees)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifyTrainees ? 'bg-blue-600' : 'bg-slate-300'
                } disabled:opacity-40`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    notifyTrainees ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CHANGELOG / SÜRÜM GEÇMİŞİ */}
      {activeTab === 'changelog' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-700" />
              Politika Sürüm ve Değişiklik Tarihçesi (Audit Trail)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tüm sistem ve başarı politikaları değişiklikleri gerekçesi, zaman damgası ve aktör bilgisiyle saklanır.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3">Sürüm</th>
                  <th className="py-3 px-3">Tescil Tarihi</th>
                  <th className="py-3 px-3">Yetkili Aktör</th>
                  <th className="py-3 px-3">Resmi Gerekçe</th>
                  <th className="py-3 px-3">Kritik Parametreler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        v{h.version}.0
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(h.timestamp).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{h.updatedBy}</td>
                    <td className="py-3 px-3 text-slate-600 max-w-sm">{h.changeReason}</td>
                    <td className="py-3 px-3 text-[11px] font-mono text-slate-500">
                      Devam: %{h.settingsSnapshot.attendancePolicy.minAttendanceRateRequired} | Not: {h.settingsSnapshot.assignmentPolicy.minPassingAssignmentAverage} | Mazeret: {h.settingsSnapshot.attendancePolicy.excusedPolicy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Unsaved Changes Ribbon (Stripe / GitHub style) */}
      {isDirty && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 max-w-4xl w-[92vw] animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold">
                Kaydedilmemiş Politika Değişiklikleri Mevcut ({diffList.length} Alan)
              </div>
              <div className="text-[10px] text-slate-400">
                Yapılan değişiklikler onaylanana kadar yürürlüğe girmez.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white font-medium transition"
            >
              Geri Al
            </button>
            <button
              type="button"
              onClick={handleOpenConfirmModal}
              disabled={!isSuperAdmin}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5 disabled:opacity-40"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Değişiklikleri İncele & Sürümle (v{settings.version + 1}.0)</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation & Versioning Modal with Diff Inspection */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Politika Değişikliğini Onayla ve Sürümle
                </h3>
                <p className="text-xs text-slate-500">
                  v{settings.version}.0 ➔ <strong>v{settings.version + 1}.0</strong> olarak tescillenecek.
                </p>
              </div>
            </div>

            {/* Visual Diff Summary */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-1">
                Değiştirilecek Parametreler:
              </div>
              <div className="divide-y divide-slate-200 max-h-40 overflow-y-auto">
                {diffList.map((d) => (
                  <div key={d.label} className="py-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">{d.label}:</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-slate-400 line-through">{d.from}</span>
                      <ArrowRight className="w-3 h-3 text-blue-500" />
                      <span className="font-bold text-blue-700">{d.to}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                {successMessage}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resmi Değişiklik Gerekçesi (Zorunlu - Denetim Kütüğüne Yazılır):
                </label>
                <textarea
                  rows={3}
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Örn: 2026 Güz Dönemi İslahiye Yönetim Kurulu kararı uyarınca devam barajı ve revizyon politikası güncellendi."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={affectsPastRecords}
                    onChange={(e) => setAffectsPastRecords(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded mt-0.5"
                  />
                  <span>
                    <strong>Geçmiş kayıtları etkilesin:</strong> İşaretlenirse mevcut geçmiş oturum ve kursiyer başarı kayıtları bu yeni eşiklerle yeniden hesaplanır.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSave}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                >
                  Onayla ve Yürürlüğe Al
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reusable In-App Action / Alert Modal */}
      <ActionConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        variant={modalConfig.variant}
        isAlertOnly={modalConfig.isAlertOnly}
      />
    </div>
  );
};
