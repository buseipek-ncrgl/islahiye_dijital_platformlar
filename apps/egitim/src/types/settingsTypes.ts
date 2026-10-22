/**
 * Sistem Ayarları ve Sürüm Yönetimi Veri Modelleri (Sprint E05-A)
 * İslahiye Ticaret Odası Eğitim Portalı
 *
 * Kurallar:
 * 1. %80 devam ve 70/100 ödev başarı eşikleri herhangi bir yönetici tarafından
 *    sessizce değiştirilemez. Değişiklik sürüm, gerekçe ve süper yönetici yetkisi gerektirir.
 * 2. Mazeretli yoklamanın devam hesabına etkisi yapılandırılabilir (exclude vs count).
 * 3. Belge doğrulama temel URL'si geçerli URL formatı doğrulamasına tabidir.
 */

import { ExcusedPolicy } from '../services/attendanceEngine';

export interface AttendancePolicySettings {
  minAttendanceRateRequired: number; // Varsayılan: 80 (%)
  excusedPolicy: ExcusedPolicy; // 'exclude_from_denominator' | 'count_as_attended' | 'neutral_academic'
  allowAttendanceCorrectionDays: number; // Varsayılan: 7 gün
}

export interface AssignmentPolicySettings {
  minPassingAssignmentAverage: number; // Varsayılan: 70 (/100)
  requireAllMandatoryApproved: boolean; // Varsayılan: true
  allowLateSubmissions: boolean; // Varsayılan: true
  maxRevisionAttempts: number; // Varsayılan: 3
}

export interface VerificationSettings {
  baseUrl: string; // Varsayılan: 'http://localhost:5174/belge-dogrula'
  enablePublicVerification: boolean; // Varsayılan: true
  enforceDemoDisclaimerOnCertificates: boolean; // Varsayılan: true
}

export interface NotificationSettings {
  enableInAppNotifications: boolean; // Varsayılan: true
  enableEmailSimulationQueue: boolean; // Varsayılan: true
  notifyAdminsOnNewApplication: boolean; // Varsayılan: true
  notifyTraineeOnSessionChange: boolean; // Varsayılan: true
}

export interface SystemSettings {
  version: number;
  updatedAt: string; // ISO String
  updatedBy: string; // Aktör adı
  updatedByRole: string;
  changeReason: string;
  affectsPastRecords: boolean; // Geçmiş kayıtları etkileyip etkilemediği
  attendancePolicy: AttendancePolicySettings;
  assignmentPolicy: AssignmentPolicySettings;
  verification: VerificationSettings;
  notifications: NotificationSettings;
}

export interface SystemSettingsHistoryItem {
  id: string;
  version: number;
  timestamp: string;
  updatedBy: string;
  changeReason: string;
  settingsSnapshot: SystemSettings;
}
