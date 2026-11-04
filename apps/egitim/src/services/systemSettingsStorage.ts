/**
 * Sistem Ayarları ve Politika Sürümleme Servisi (Sprint E05-A)
 * İslahiye Ticaret Odası Eğitim Portalı
 *
 * Kurallar:
 * 1. %80 devam ve 70/100 ödev başarı eşikleri herhangi bir yönetici tarafından
 *    sessizce değiştirilemez; değişiklik sürüm, gerekçe ve süper yönetici yetkisi gerektirir.
 * 2. Mazeretli yoklamanın devam hesabına etkisi (exclude vs count) yapılandırılabilir.
 * 3. Doğrulama temel URL'si geçerli URL formatı denetiminden geçer.
 */

import {
  SystemSettings,
  SystemSettingsHistoryItem,
  UserRole,
} from '../types';
import { educationApi } from './apiClient';
import { recordAuditLog } from './auditStorage';

const SETTINGS_STORAGE_KEY = 'islahiye_education_system_settings_v1';
const SETTINGS_HISTORY_STORAGE_KEY = 'islahiye_education_settings_history_v1';
export const SETTINGS_UPDATE_EVENT = 'islahiye_system_settings_updated';

export const syncSystemSettingsWithApi = async (): Promise<SystemSettings> => {
  try {
    const list = await educationApi.systemSettings();
    if (list && list.length > 0) {
      const current = getStoredSystemSettings();
      const attSetting = list.find((s) => s.key === 'AttendanceMinPercentage');
      const asgSetting = list.find((s) => s.key === 'AssignmentPassGrade');

      const updated: SystemSettings = {
        ...current,
        attendancePolicy: {
          ...current.attendancePolicy,
          minAttendanceRateRequired: attSetting ? parseInt(attSetting.value, 10) : current.attendancePolicy.minAttendanceRateRequired,
        },
        assignmentPolicy: {
          ...current.assignmentPolicy,
          minPassingAssignmentAverage: asgSetting ? parseInt(asgSetting.value, 10) : current.assignmentPolicy.minPassingAssignmentAverage,
        },
      };
      saveSettingsToStorage(updated, getStoredSettingsHistory());
      return updated;
    }
  } catch (err) {
    console.warn('API sync settings notice:', err);
  }
  return getStoredSystemSettings();
};

if (typeof window !== 'undefined') {
  syncSystemSettingsWithApi().catch(() => {});
}

export const INITIAL_SYSTEM_SETTINGS: SystemSettings = {
  version: 1,
  updatedAt: '2026-08-01T10:00:00.000Z',
  updatedBy: 'Kemal Ertürk',
  updatedByRole: 'superadmin',
  changeReason: '2026 Güz Dönemi resmi sistem ve değerlendirme politikası yürürlüğe alındı.',
  affectsPastRecords: false,
  attendancePolicy: {
    minAttendanceRateRequired: 80,
    excusedPolicy: 'exclude_from_denominator',
    allowAttendanceCorrectionDays: 7,
  },
  assignmentPolicy: {
    minPassingAssignmentAverage: 70,
    requireAllMandatoryApproved: true,
    allowLateSubmissions: true,
    maxRevisionAttempts: 3,
  },
  verification: {
    baseUrl: 'http://localhost:5174/belge-dogrula',
    enablePublicVerification: true,
    enforceDemoDisclaimerOnCertificates: true,
  },
  notifications: {
    enableInAppNotifications: true,
    enableEmailSimulationQueue: true,
    notifyAdminsOnNewApplication: true,
    notifyTraineeOnSessionChange: true,
  },
};

export const INITIAL_SETTINGS_HISTORY: SystemSettingsHistoryItem[] = [
  {
    id: 'set-hist-v1',
    version: 1,
    timestamp: '2026-08-01T10:00:00.000Z',
    updatedBy: 'Kemal Ertürk (Süper Yönetici)',
    changeReason: 'İlk kurumsal sistem ayarları ve %80 devam / 70 ödev başarı eşikleri tescil edildi.',
    settingsSnapshot: INITIAL_SYSTEM_SETTINGS,
  },
];

export const getStoredSystemSettings = (): SystemSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.version) {
        return parsed;
      }
    }
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(INITIAL_SYSTEM_SETTINGS));
    return INITIAL_SYSTEM_SETTINGS;
  } catch (err) {
    console.error('System settings read error:', err);
    return INITIAL_SYSTEM_SETTINGS;
  }
};

export const getStoredSettingsHistory = (): SystemSettingsHistoryItem[] => {
  try {
    const raw = localStorage.getItem(SETTINGS_HISTORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    localStorage.setItem(SETTINGS_HISTORY_STORAGE_KEY, JSON.stringify(INITIAL_SETTINGS_HISTORY));
    return INITIAL_SETTINGS_HISTORY;
  } catch (err) {
    console.error('Settings history read error:', err);
    return INITIAL_SETTINGS_HISTORY;
  }
};

const saveSettingsToStorage = (settings: SystemSettings, history: SystemSettingsHistoryItem[]): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    localStorage.setItem(SETTINGS_HISTORY_STORAGE_KEY, JSON.stringify(history));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SETTINGS_UPDATE_EVENT, { detail: settings }));
    }
  } catch (err) {
    console.error('Settings write error:', err);
  }
};

/**
 * URL format doğrulayıcı
 */
const isValidUrl = (urlStr: string): boolean => {
  try {
    const url = new URL(urlStr);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Sistem ayarlarını kontrollü ve sürümlü olarak günceller.
 */
export const updateSystemSettings = (params: {
  updates: Partial<SystemSettings>;
  actor: { id: string; role: UserRole; name: string };
  changeReason: string;
  affectsPastRecords?: boolean;
}): { success: boolean; settings?: SystemSettings; error?: string } => {
  const { updates, actor, changeReason, affectsPastRecords = false } = params;

  // 1. Yetki kontrolü (Yalnızca Süper Yönetici değiştirebilir)
  if (actor.role !== 'superadmin') {
    return {
      success: false,
      error: 'Kritik sistem ayarlarını ve başarı politikalarını yalnızca Süper Yönetici güncelleyebilir.',
    };
  }

  // 2. Gerekçe zorunluluğu
  if (!changeReason.trim()) {
    return {
      success: false,
      error: 'Sistem ayarı değişikliği için resmi gerekçe belirtilmesi zorunludur.',
    };
  }

  // 3. Doğrulama URL kontrolü
  if (updates.verification?.baseUrl && !isValidUrl(updates.verification.baseUrl)) {
    return {
      success: false,
      error: 'Geçersiz Belge Doğrulama URL formatı. Lütfen http:// veya https:// ile başlayan geçerli bir adres giriniz.',
    };
  }

  const current = getStoredSystemSettings();
  const history = getStoredSettingsHistory();
  const nextVersion = current.version + 1;
  const now = new Date().toISOString();

  const updatedSettings: SystemSettings = {
    ...current,
    ...updates,
    version: nextVersion,
    updatedAt: now,
    updatedBy: actor.name,
    updatedByRole: actor.role,
    changeReason: changeReason.trim(),
    affectsPastRecords,
    attendancePolicy: {
      ...current.attendancePolicy,
      ...(updates.attendancePolicy || {}),
    },
    assignmentPolicy: {
      ...current.assignmentPolicy,
      ...(updates.assignmentPolicy || {}),
    },
    verification: {
      ...current.verification,
      ...(updates.verification || {}),
    },
    notifications: {
      ...current.notifications,
      ...(updates.notifications || {}),
    },
  };

  const newHistoryItem: SystemSettingsHistoryItem = {
    id: `set-hist-v${nextVersion}`,
    version: nextVersion,
    timestamp: now,
    updatedBy: `${actor.name} (${actor.role})`,
    changeReason: changeReason.trim(),
    settingsSnapshot: updatedSettings,
  };

  history.unshift(newHistoryItem);
  saveSettingsToStorage(updatedSettings, history);

  // Denetim kaydı oluştur
  recordAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    actorName: actor.name,
    action: 'settings.updated',
    resourceType: 'system_settings',
    resourceId: `settings-v${nextVersion}`,
    resourceTitle: `Sistem Ayarları Revizyonu (v${nextVersion})`,
    reason: changeReason.trim(),
    previousStateSummary: `Sürüm ${current.version} (%${current.attendancePolicy.minAttendanceRateRequired} Devam / ${current.assignmentPolicy.minPassingAssignmentAverage} Ödev Eşiği)`,
    nextStateSummary: `Sürüm ${nextVersion} (%${updatedSettings.attendancePolicy.minAttendanceRateRequired} Devam / ${updatedSettings.assignmentPolicy.minPassingAssignmentAverage} Ödev Eşiği)`,
    sourceModule: 'systemSettingsStorage',
    outcome: 'success',
  });

  return { success: true, settings: updatedSettings };
};

export const subscribeToSettingsUpdates = (callback: (settings: SystemSettings) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback(getStoredSystemSettings());
  window.addEventListener(SETTINGS_UPDATE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(SETTINGS_UPDATE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};

export const resetSystemSettingsStorage = (): void => {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(INITIAL_SYSTEM_SETTINGS));
  localStorage.setItem(SETTINGS_HISTORY_STORAGE_KEY, JSON.stringify(INITIAL_SETTINGS_HISTORY));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SETTINGS_UPDATE_EVENT, { detail: INITIAL_SYSTEM_SETTINGS }));
  }
};
