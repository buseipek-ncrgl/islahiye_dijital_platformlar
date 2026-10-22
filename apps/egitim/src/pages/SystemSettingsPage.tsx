import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import {
  getStoredSystemSettings,
  getStoredSettingsHistory,
  updateSystemSettings,
  subscribeToSettingsUpdates,
} from '../services/systemSettingsStorage';
import { SystemSettings, SystemSettingsHistoryItem } from '../types';

export const SystemSettingsPage: React.FC = () => {
  const { currentRole, currentUser } = useDemoRole();
  const [settings, setSettings] = useState<SystemSettings>(getStoredSystemSettings());
  const [history, setHistory] = useState<SystemSettingsHistoryItem[]>(getStoredSettingsHistory());

  // Form State
  const [minAttendance, setMinAttendance] = useState(settings.attendancePolicy.minAttendanceRateRequired);
  const [excusedPolicy, setExcusedPolicy] = useState(settings.attendancePolicy.excusedPolicy);
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

  // Policy Versioning Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [affectsPastRecords, setAffectsPastRecords] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const unsub = subscribeToSettingsUpdates((s) => {
      setSettings(s);
      setHistory(getStoredSettingsHistory());
    });
    return () => unsub();
  }, []);

  const isSuperAdmin = currentRole === 'superadmin';

  const handleOpenConfirmModal = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!isSuperAdmin) {
      setErrorMessage('Sistem ayarlarını ve politikalarını yalnızca Süper Yönetici güncelleyebilir.');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleExecuteSave = () => {
    if (!changeReason.trim()) {
      setErrorMessage('Politika değişikliği için kurumsal gerekçe girilmesi zorunludur.');
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
          notifyAdminsOnNewApplication: settings.notifications.notifyAdminsOnNewApplication,
          notifyTraineeOnSessionChange: settings.notifications.notifyTraineeOnSessionChange,
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
      setSuccessMessage(`Sistem politikaları v${res.settings?.version}.0 olarak başarıyla güncellendi.`);
      setTimeout(() => {
        setShowConfirmModal(false);
        setChangeReason('');
        setErrorMessage('');
      }, 1200);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-brand-border p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Sistem & Politika Ayarları
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500 font-medium">Sprint E05-A</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Eğitim ve Başarı Politikaları Yapılandırması
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Devam, ödev ve doğrulama kuralları sürümlenir; değişiklikler gerekçeli olarak denetim kütüğüne işlenir.
          </p>
        </div>

        {/* Current Version Badge */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-right">
          <div className="text-xs font-bold text-slate-900">Yürürlükteki Politika: v{settings.version}.0</div>
          <div className="text-[11px] text-slate-500">
            Son Güncelleme: {new Date(settings.updatedAt).toLocaleDateString('tr-TR')} ({settings.updatedBy})
          </div>
        </div>
      </div>

      {/* Global Superadmin Guard Notification */}
      {!isSuperAdmin && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <div className="font-bold">Salt Okunur Mod:</div>
            <p>
              Şu an <strong>{currentUser.role}</strong> rolündesiniz. Başarı eşiklerini (%80 devam ve 70 ödev ortalaması) ve doğrulama ayarlarını yalnızca <strong>Süper Yönetici</strong> değiştirebilir.
            </p>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleOpenConfirmModal} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Attendance Policy */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Devam & Yoklama Hesaplama Politikası</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Asgari Devam Oranı Şartı (%):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={50}
                    max={100}
                    disabled={!isSuperAdmin}
                    value={minAttendance}
                    onChange={(e) => setMinAttendance(Number(e.target.value))}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 font-bold text-center"
                  />
                  <span className="text-slate-500 text-[11px]">
                    (Resmi kurum tabanı: <strong>%80</strong>)
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mazeretli Yoklamanın Devam Hesabına Etkisi:
                </label>
                <select
                  disabled={!isSuperAdmin}
                  value={excusedPolicy}
                  onChange={(e) => setExcusedPolicy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                >
                  <option value="exclude_from_denominator">
                    Mazeretli oturumları paydadan düş (exclude_from_denominator) — [Önerilen]
                  </option>
                  <option value="count_as_attended">
                    Mazeretli oturumları katıldı olarak say (count_as_attended)
                  </option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  İptal edilen oturumlar hiçbir koşulda devam paydasına dahil edilmez.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Yoklama Düzeltme İtiraz Süresi (Gün):
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  disabled={!isSuperAdmin}
                  value={correctionDays}
                  onChange={(e) => setCorrectionDays(Number(e.target.value))}
                  className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 font-bold text-center"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Assignment & Success Policy */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <FileCheck className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Ödev & Değerlendirme Politikası</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Asgari Başarı Puan Ortalaması (100 Üzerinden):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={50}
                    max={100}
                    disabled={!isSuperAdmin}
                    value={minAssignmentAvg}
                    onChange={(e) => setMinAssignmentAvg(Number(e.target.value))}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 font-bold text-center"
                  />
                  <span className="text-slate-500 text-[11px]">
                    (Resmi kurum tabanı: <strong>70/100</strong>)
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 font-medium text-slate-700">
                  <input
                    type="checkbox"
                    disabled={!isSuperAdmin}
                    checked={requireAllMandatory}
                    onChange={(e) => setRequireAllMandatory(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Tüm zorunlu ödevlerin eğitmen tarafından onaylanması şartı</span>
                </label>

                <label className="flex items-center gap-2 font-medium text-slate-700">
                  <input
                    type="checkbox"
                    disabled={!isSuperAdmin}
                    checked={allowLateSubmissions}
                    onChange={(e) => setAllowLateSubmissions(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Süresi geçen ödevlerde gecikmeli teslime izin ver</span>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Azami Revizyon Hakkı:
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  disabled={!isSuperAdmin}
                  value={maxRevisions}
                  onChange={(e) => setMaxRevisions(Number(e.target.value))}
                  className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 font-bold text-center"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Certificate Verification URL */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Award className="w-5 h-5 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">Belge Doğrulama ve QR Demo Ayarları</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Belge Karekod Doğrulama Temel URL'si:
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={verifyBaseUrl}
                  onChange={(e) => setVerifyBaseUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 font-mono text-[11px]"
                  placeholder="http://localhost:5174/belge-dogrula"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Format kontrolü: URL mutlaka <code>http://</code> veya <code>https://</code> ile başlamalıdır.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 font-medium text-slate-700">
                  <input
                    type="checkbox"
                    disabled={!isSuperAdmin}
                    checked={enablePublicVerify}
                    onChange={(e) => setEnablePublicVerify(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Halka açık karekod sorgulama sayfasını aktif tut</span>
                </label>

                <label className="flex items-center gap-2 font-medium text-slate-700">
                  <input
                    type="checkbox"
                    disabled={!isSuperAdmin}
                    checked={enforceDisclaimer}
                    onChange={(e) => setEnforceDisclaimer(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Belge üzerinde "Örnek / Demo Simülasyonu" ibaresini zorunlu tut</span>
                </label>
              </div>
            </div>
          </div>

          {/* Card 4: Notification Channels */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Bell className="w-5 h-5 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">Bildirim ve Simülasyon Tercihleri</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-2">
                <label className="flex items-center gap-2 font-medium text-slate-700">
                  <input
                    type="checkbox"
                    disabled={!isSuperAdmin}
                    checked={inAppNotifs}
                    onChange={(e) => setInAppNotifs(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Sistem içi anlık bildirim popover ve merkezini aktif tut</span>
                </label>

                <label className="flex items-center gap-2 font-medium text-slate-700">
                  <input
                    type="checkbox"
                    disabled={!isSuperAdmin}
                    checked={emailQueue}
                    onChange={(e) => setEmailQueue(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Toplu e-posta gönderim simülasyon kuyruğunu aktif tut</span>
                </label>
              </div>

              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-[11px] text-purple-900 leading-relaxed">
                Bildirim olaylarında gerçek SMTP veya e-posta sunucusu kullanılmaz; tüm işlemler <code>notificationStorage</code> ve <code>massEmailStorage</code> üzerinde sentetik kuyruk olarak simüle edilir.
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500">
            {isSuperAdmin
              ? 'Yapılan tüm politika değişiklikleri yeni sürüm numarası ve denetim gerekçesiyle saklanır.'
              : 'Değişiklik yapabilmek için Süper Yönetici profiline geçiniz.'}
          </div>
          <button
            type="submit"
            disabled={!isSuperAdmin}
            className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Politika Değişikliğini Onayla ve Sürümle
          </button>
        </div>
      </form>

      {/* Version History Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <History className="w-4 h-4 text-slate-500" />
          <span>Politika Sürüm ve Değişiklik Geçmişi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3">Sürüm</th>
                <th className="py-2.5 px-3">Tarih</th>
                <th className="py-2.5 px-3">İşlemi Yapan</th>
                <th className="py-2.5 px-3">Resmi Gerekçe</th>
                <th className="py-2.5 px-3">Kritik Parametreler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3 font-bold text-slate-900">v{h.version}.0</td>
                  <td className="py-3 px-3 text-slate-500">
                    {new Date(h.timestamp).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-3 font-medium">{h.updatedBy}</td>
                  <td className="py-3 px-3 text-slate-600 max-w-xs">{h.changeReason}</td>
                  <td className="py-3 px-3 text-[11px] text-slate-500 font-mono">
                    Devam: %{h.settingsSnapshot.attendancePolicy.minAttendanceRateRequired} | Ödev: {h.settingsSnapshot.assignmentPolicy.minPassingAssignmentAverage} Puan
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Politika Değişikliğini Onayla (v{settings.version + 1}.0)
                </h3>
                <p className="text-xs text-slate-500">
                  Yeni ayarlar tescil edilecek ve denetim kütüğüne yazılacaktır.
                </p>
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
                  Resmi Değişiklik Gerekçesi (Zorunlu):
                </label>
                <textarea
                  rows={3}
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Örn: Yönetim Kurulu kararıyla mazeretli yoklama politikasında güncelleme yapıldı."
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
                    <strong>Eski kayıtları etkilesin:</strong> İşaretlenmezse mevcut geçmiş oturum ve başarı kayıtları bu değişiklikten etkilenmez.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
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
    </div>
  );
};
