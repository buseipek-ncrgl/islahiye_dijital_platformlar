import { UserRole } from './index';

export type NotificationRecipientRole = UserRole;

export type NotificationCategory =
  | 'application'   // Başvuru ve Kayıt
  | 'session'       // Ders ve Takvim
  | 'assignment'    // Ödev ve Değerlendirme
  | 'communication' // Mesajlar ve Kanallar
  | 'certificate'   // Başarı ve Belgeler
  | 'announcement'  // Kurumsal / Grup Duyuruları
  | 'system';       // Sistem ve Denetim

export type NotificationStatus = 'unread' | 'read' | 'dismissed';

export type NotificationEventStatus = 'pending' | 'created' | 'failed' | 'retry_pending';

/**
 * Tekil bildirim olay kaydı (Event Store)
 * İdempotency anahtarı: sourceType + sourceId + eventType + eventVersion + recipientId
 */
export interface NotificationEvent {
  id: string;
  idempotencyKey: string;
  eventType: string;
  sourceType: string;
  sourceId: string;
  eventVersion: number;
  recipientId: string;
  recipientRole: NotificationRecipientRole;
  category: NotificationCategory;
  title: string;
  description: string;
  entityType: string;
  entityId: string;
  targetRoute: string;
  createdAt: string;
  status: NotificationEventStatus;
  retryCount: number;
  lastAttemptAt?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
}

/**
 * Kullanıcıya iletilen bildirim kaydı
 * Her bildirim somut bir tekil kullanıcı kimliğine (recipientId) bağlıdır.
 */
export interface AppNotification {
  id: string;
  eventId: string;
  recipientId: string;
  recipientRole: NotificationRecipientRole;
  category: NotificationCategory;
  title: string;
  description: string;
  entityType: string;
  entityId: string;
  targetRoute: string;
  createdAt: string;
  readAt?: string;
  dismissedAt?: string;
  status: NotificationStatus;
  metadata?: Record<string, any>;
}

/**
 * Yönetici Genel / Kurumsal Duyuru Modeli
 */
export interface AdminAnnouncement {
  id: string;
  title: string;
  content: string;
  targetAudience: 'all' | 'program' | 'term' | 'group' | 'trainees' | 'instructors';
  targetProgramId?: string;
  targetProgramTitle?: string;
  targetTermId?: string;
  targetCohortName?: string;
  targetGroupId?: string;
  targetGroupName?: string;
  status: 'draft' | 'published';
  publishDate: string;
  createdBy: string;
  createdByName: string;
  recipientCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Toplu E-Posta Şablon Modeli
 */
export interface MassEmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  availableVariables: string[];
  createdAt: string;
  updatedAt: string;
}

export type MassEmailQueueStatus =
  | 'draft'
  | 'queued_demo'
  | 'processed_in_simulation'
  | 'failed_demo'
  | 'cancelled';

/**
 * Toplu E-Posta Demo Kuyruk Kaydı
 */
export interface MassEmailQueueItem {
  id: string;
  createdBy: string;
  createdByName: string;
  targetProgramId?: string;
  targetProgramTitle?: string;
  targetTermId?: string;
  targetCohortName?: string;
  targetGroupIds: string[];
  targetGroupNames: string[];
  targetAudienceRole: 'trainee' | 'instructor' | 'all';
  recipientSnapshot: Array<{
    id: string;
    fullName: string;
    email: string;
    role: string;
    groupName?: string;
  }>;
  recipientCount: number;
  subject: string;
  body: string;
  templateId?: string;
  status: MassEmailQueueStatus;
  createdAt: string;
  queuedAt?: string;
  simulatedAt?: string;
  cancellationReason?: string;
  notes?: string;
}
