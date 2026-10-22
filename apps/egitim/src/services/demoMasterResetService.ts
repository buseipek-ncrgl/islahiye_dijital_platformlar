/**
 * Master Demo Data Reset & Consistency Coordinator (Sprint E05-A)
 * İslahiye Ticaret Odası Eğitim Portalı
 *
 * Kurallar (Section 15):
 * 1. Sıfırlama işlemi açık onay gerektirir.
 * 2. İlişkili veriler (başvuru, kriter, kayıt, grup, oturum, yoklama, ödev,
 *    başarı, belge, mesaj, kanal, bildirim, kuyruk, ayarlar ve yetkiler)
 *    tutarlı biçimde başlangıç senaryolarına döndürülür.
 * 3. Sıfırlama sonrasında hiçbir modülde öksüz (orphan) veya tutarsız kimlik kalmaz.
 * 4. Kullanıcıya sahte yedekleme/geri yükleme garantisi verilmez.
 */

import { resetApplicationsToDefaults } from './applicationStorage';
import { resetEnrollmentsToDefaults } from './enrollmentStorage';
import { resetSessionStorageToDefaults } from './sessionStorage';
import { resetAssignmentStorageToInitial } from './assignmentStorage';
import { resetSuccessDecisionsToInitial } from './successDecisionStorage';
import { resetCertificateDemoData } from './certificateStorage';
import { resetMessageStorage } from './messageStorage';
import { resetChannelStorage } from './channelStorage';
import { resetNotificationStorage } from './notificationStorage';
import { resetEmailStorage } from './massEmailStorage';
import { resetAuthorizationStorage } from './authorizationDemoService';
import { resetSystemSettingsStorage } from './systemSettingsStorage';
import { resetAuditStorage, recordAuditLog } from './auditStorage';

export interface ResetOptions {
  actor: {
    id: string;
    role: string;
    name: string;
  };
  reason: string;
}

export const ALL_EDUCATION_STORAGE_KEYS = [
  'islahiye_education_applications_v1',
  'islahiye_education_scoring_history_v1',
  'islahiye_education_criteria_v1',
  'islahiye_education_enrollments_v1',
  'islahiye_education_group_assignments_v1',
  'islahiye_education_groups_v1',
  'islahiye_education_sessions_v1',
  'islahiye_education_attendance_records_v1',
  'islahiye_education_course_assignments_v1',
  'islahiye_education_submissions_v1',
  'islahiye_education_evaluations_v1',
  'islahiye_education_success_decisions_v1',
  'islahiye_education_certificates_v1',
  'islahiye_education_conversations_v1',
  'islahiye_education_direct_messages_v1',
  'islahiye_education_channels_v1',
  'islahiye_education_channel_memberships_v1',
  'islahiye_education_channel_messages_v1',
  'islahiye_education_notifications_v1',
  'islahiye_education_mass_email_campaigns_v1',
  'islahiye_education_email_templates_v1',
  'islahiye_education_users_v1',
  'islahiye_education_role_matrix_v1',
  'islahiye_education_matrix_version_v1',
  'islahiye_education_system_settings_v1',
  'islahiye_education_system_settings_history_v1',
  'islahiye_education_audit_logs_v1',
];

export const createEmergencyBackupSnapshot = (): Record<string, string | null> => {
  const snapshot: Record<string, string | null> = {};
  if (typeof localStorage === 'undefined') return snapshot;
  ALL_EDUCATION_STORAGE_KEYS.forEach((key) => {
    snapshot[key] = localStorage.getItem(key);
  });
  return snapshot;
};

export const restoreBackupSnapshot = (snapshot: Record<string, string | null>): void => {
  if (typeof localStorage === 'undefined') return;
  Object.entries(snapshot).forEach(([key, val]) => {
    if (val !== null) {
      localStorage.setItem(key, val);
    } else {
      localStorage.removeItem(key);
    }
  });
};

export const resetAllEducationDemoData = (
  options: ResetOptions
): {
  success: boolean;
  message: string;
  resetModuleCount?: number;
  isSimulatedTransaction: boolean;
  disclaimer: string;
} => {
  // Demo sınırlama beyanı
  const disclaimer =
    'Bu sıfırlama işlemi tarayıcı localStorage bellek alanında çalışmaktadır; gerçek bir ACID/RDBMS veritabanı transaction veya distributed lock garantisi sunmaz.';

  // 1. Olası kısmi bozulmaya karşı acil durum snapshot'ı al
  const snapshot = createEmergencyBackupSnapshot();

  try {
    // 2. Tüm alt modül depolarını başlangıç tohumlarına sıfırla
    resetApplicationsToDefaults();
    resetEnrollmentsToDefaults();
    resetSessionStorageToDefaults();
    resetAssignmentStorageToInitial();
    resetSuccessDecisionsToInitial();
    resetCertificateDemoData();
    resetMessageStorage();
    resetChannelStorage();
    resetNotificationStorage();
    resetEmailStorage();
    resetAuthorizationStorage();
    resetSystemSettingsStorage();
    resetAuditStorage();

    // 3. Sıfırlama işlemini denetim kaydına yaz
    recordAuditLog({
      actorId: options.actor.id,
      actorRole: options.actor.role as any,
      actorName: options.actor.name,
      action: 'demo_data.reset',
      resourceType: 'system_settings',
      resourceId: 'master-reset',
      resourceTitle: 'Tüm Demo Veri Havuzunu Sıfırlama',
      reason: options.reason || 'Kullanıcı talebiyle tüm portallar fabrika ayarlarına döndürüldü.',
      previousStateSummary: 'Önceki Oturum Verileri',
      nextStateSummary: 'Başlangıç Tohum Durumu (v1.0)',
      sourceModule: 'demoMasterResetService',
      outcome: 'success',
    });

    return {
      success: true,
      resetModuleCount: 13,
      message: 'Tüm eğitim portali demo depoları ve ilişkili kayıtlar başarıyla başlangıç durumuna sıfırlandı.',
      isSimulatedTransaction: true,
      disclaimer,
    };
  } catch (err: any) {
    console.error('Master reset error, rolling back from snapshot:', err);
    // Kısmi hata oluşursa anında geri al (Rollback simülasyonu)
    restoreBackupSnapshot(snapshot);

    return {
      success: false,
      message: `Sıfırlama sırasında hata oluştu, önceki oturum snapshot'tan geri yüklendi: ${err?.message || 'Bilinmeyen hata'}`,
      isSimulatedTransaction: true,
      disclaimer,
    };
  }
};
