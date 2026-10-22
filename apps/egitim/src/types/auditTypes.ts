/**
 * Merkezi Denetim Kayıtları Veri Modeli (Sprint E05-A)
 * İslahiye Ticaret Odası Eğitim Portalı
 *
 * Denetim Güvenilirliği ve Mahremiyet İlkesi:
 * 1. Kayıtlar silinmez ve keyfi olarak değiştirilemez (Demo Audit Trail).
 * 2. Parola, T.C. kimlik numarası, özel mesaj metni ve gizli yönetici notları ASLA loglanmaz!
 * 3. Frontend localStorage yapısının yarış koşullarında mutlak transaction garantisi
 *    vermediği, gerçek denetim bütünlüğünün sunucu tarafında sağlanacağı belgelenir.
 */

import { UserRole } from './index';

export type AuditResourceType =
  | 'application'
  | 'criteria'
  | 'enrollment'
  | 'group'
  | 'session'
  | 'attendance'
  | 'assignment'
  | 'evaluation'
  | 'success_decision'
  | 'certificate'
  | 'role_assignment'
  | 'permission_matrix'
  | 'system_settings'
  | 'mass_email'
  | 'security';

export type AuditAction =
  // Başvuru ve Kriter
  | 'application.created'
  | 'application.evaluated'
  | 'application.accepted'
  | 'application.rejected'
  | 'application.waitlisted'
  | 'criteria.version_published'
  // Kayıt ve Grup
  | 'enrollment.confirmed'
  | 'enrollment.cancelled'
  | 'group.trainee_assigned'
  | 'group.trainee_transferred'
  | 'group.trainee_removed'
  // Oturum ve Yoklama
  | 'session.created'
  | 'session.updated'
  | 'session.cancelled'
  | 'attendance.taken'
  | 'attendance.corrected'
  // Ödev ve Başarı
  | 'assignment.published'
  | 'assignment.evaluated'
  | 'assignment.revision_requested'
  | 'success.approved'
  | 'success.certified'
  // Belge
  | 'certificate.generated'
  | 'certificate.cancelled'
  | 'certificate.downloaded'
  // Yönetişim
  | 'user.role_assigned'
  | 'user.role_revoked'
  | 'permission.matrix_updated'
  | 'settings.updated'
  | 'demo_data.reset'
  // İletişim
  | 'mass_email.queued'
  | 'mass_email.processed'
  | 'mass_email.cancelled'
  // Güvenlik
  | 'access.denied';

export type AuditOutcome = 'success' | 'denied' | 'failed';

export interface AuditLog {
  id: string;
  eventId: string;
  actorId: string;
  actorRole: UserRole;
  actorName: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string;
  resourceTitle?: string;
  timestamp: string; // ISO String
  reason?: string;
  previousStateSummary?: string;
  nextStateSummary?: string;
  correlationId?: string;
  sourceModule: string;
  outcome: AuditOutcome;
  metadata?: Record<string, any>; // Mahremiyet filtresinden geçmiş güvenli ek veriler
}

export interface AuditFilterOptions {
  resourceType?: AuditResourceType | 'all';
  actorRole?: UserRole | 'all';
  outcome?: AuditOutcome | 'all';
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}
