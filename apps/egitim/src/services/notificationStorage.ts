/**
 * Unified Notification Center & Event Store Service (Sprint E04-B)
 * İslahiye Ticaret Odası Eğitim Portalı — Bildirim Mimarisi.
 *
 * Temel Kurallar:
 * 1. Bildirim, ilgili işleme bağlı bir bilgilendirme kaydıdır. Bildirim üretilememesi
 *    asıl başvuru, ödev, mesaj veya belge işlemini ASLA geri almaz.
 * 2. Bildirimler somut bir kişinin kimliğine (recipientId) bağlıdır; sadece 'trainee' veya
 *    'applicant' gibi genel rol torbaları kullanılmaz.
 * 3. İdempotency Kuralı: sourceType + sourceId + eventType + eventVersion + recipientId
 *    bileşeni ile mükerrer bildirim üretimi kesin olarak engellenir.
 * 4. Mahremiyet Kuralı: Kurum içi idari karar notları, TCKN ve özel mesajların tam metni
 *    bildirim özetine asla konulmaz.
 * 5. Frontend simülasyonu: localStorage tabanlıdır; gerçek sunucu tarafı transaction veya
 *    kuyruk garantisi bulunmadığı açıkça belgelenmiştir.
 */

import {
  AppNotification,
  NotificationCategory,
  NotificationEvent,
  NotificationRecipientRole,
  AdminAnnouncement,
} from '../types';

const NOTIFICATIONS_STORAGE_KEY = 'islahiye_education_notifications_v1';
const NOTIFICATION_EVENTS_STORAGE_KEY = 'islahiye_education_notification_events_v1';
const ADMIN_ANNOUNCEMENTS_STORAGE_KEY = 'islahiye_education_admin_announcements_v1';

export const NOTIFICATIONS_UPDATE_EVENT = 'islahiye_notifications_updated';
export const ADMIN_ANNOUNCEMENTS_UPDATE_EVENT = 'islahiye_admin_announcements_updated';

// -----------------------------------------------------------------------------
// SEED NOTIFICATION EVENTS & NOTIFICATIONS
// -----------------------------------------------------------------------------

export const INITIAL_NOTIFICATION_EVENTS: NotificationEvent[] = [
  // Aday: Fatma Şahin (user-applicant-01)
  {
    id: 'evt-seed-app-01',
    idempotencyKey: 'application:app-01:under_review:1:user-applicant-01',
    eventType: 'application_under_review',
    sourceType: 'application',
    sourceId: 'app-01',
    eventVersion: 1,
    recipientId: 'user-applicant-01',
    recipientRole: 'applicant',
    category: 'application',
    title: 'Başvurunuz Ön İncelemeye Alındı',
    description: 'İslahiye Biberi & Tarımsal E-Ticaret programı başvurunuz evrak ve ön kriter değerlendirmesine alınmıştır.',
    entityType: 'application',
    entityId: 'app-01',
    targetRoute: '/aday',
    createdAt: '2026-10-18T10:00:00.000Z',
    status: 'created',
    retryCount: 0,
  },
  {
    id: 'evt-seed-app-02',
    idempotencyKey: 'application:app-01:criteria_scored:1:user-applicant-01',
    eventType: 'criteria_scored',
    sourceType: 'application',
    sourceId: 'app-01',
    eventVersion: 1,
    recipientId: 'user-applicant-01',
    recipientRole: 'applicant',
    category: 'application',
    title: 'Kriter Ön Değerlendirmesi Tamamlandı',
    description: 'Başvuru formunuz objektif kriter puanlama algoritması tarafından başarıyla değerlendirildi.',
    entityType: 'application',
    entityId: 'app-01',
    targetRoute: '/aday',
    createdAt: '2026-10-19T14:30:00.000Z',
    status: 'created',
    retryCount: 0,
  },
  // Kursiyer: Ayşe Demir (user-trainee-01)
  {
    id: 'evt-seed-trn-01',
    idempotencyKey: 'enrollment:enr-trainee-01:confirmed:1:user-trainee-01',
    eventType: 'enrollment_completed',
    sourceType: 'enrollment',
    sourceId: 'enr-trainee-01',
    eventVersion: 1,
    recipientId: 'user-trainee-01',
    recipientRole: 'trainee',
    category: 'application',
    title: 'Kesin Kaydınız Tamamlandı',
    description: 'İslahiye Biberi & Tarımsal E-Ticaret 2026 Güz Dönemi kesin kaydınız resmi olarak onaylanmıştır.',
    entityType: 'enrollment',
    entityId: 'enr-trainee-01',
    targetRoute: '/kursiyer',
    createdAt: '2026-10-20T09:00:00.000Z',
    status: 'created',
    retryCount: 0,
  },
  {
    id: 'evt-seed-trn-02',
    idempotencyKey: 'group:grp-01:assigned:1:user-trainee-01',
    eventType: 'group_assigned',
    sourceType: 'group',
    sourceId: 'grp-01',
    eventVersion: 1,
    recipientId: 'user-trainee-01',
    recipientRole: 'trainee',
    category: 'application',
    title: 'Eğitim Grubunuz Belirlendi',
    description: 'Grup A (Hafta İçi Öğleden Sonra) sınıfına yerleştirildiniz. Eğitmeniniz: Murat Özkan.',
    entityType: 'group',
    entityId: 'grp-01',
    targetRoute: '/kursiyer',
    createdAt: '2026-10-20T09:15:00.000Z',
    status: 'created',
    retryCount: 0,
  },
  {
    id: 'evt-seed-trn-03',
    idempotencyKey: 'assignment:asg-01:published:1:user-trainee-01',
    eventType: 'assignment_published',
    sourceType: 'assignment',
    sourceId: 'asg-01',
    eventVersion: 1,
    recipientId: 'user-trainee-01',
    recipientRole: 'trainee',
    category: 'assignment',
    title: 'Yeni Ödev Yayımlandı',
    description: 'Ödev #1: Coğrafi İşaret ve E-Ticaret Uygunluk Analizi çalışması yayımlandı. Son teslim tarihini inceleyebilirsiniz.',
    entityType: 'assignment',
    entityId: 'asg-01',
    targetRoute: '/kursiyer#odevler',
    createdAt: '2026-10-20T11:00:00.000Z',
    status: 'created',
    retryCount: 0,
  },
  {
    id: 'evt-seed-trn-04',
    idempotencyKey: 'channel:chan-grp01-announcements:notice:1:user-trainee-01',
    eventType: 'channel_announcement_published',
    sourceType: 'channel',
    sourceId: 'chan-grp01-announcements',
    eventVersion: 1,
    recipientId: 'user-trainee-01',
    recipientRole: 'trainee',
    category: 'announcement',
    title: 'Sınıf Duyurusu Yayımlandı',
    description: 'Eğitmeniniz Murat Özkan, resmi duyuru kanalında yeni bir sınıf bilgilendirmesi paylaştı.',
    entityType: 'channel',
    entityId: 'chan-grp01-announcements',
    targetRoute: '/kursiyer/kanallar',
    createdAt: '2026-10-21T14:00:00.000Z',
    status: 'created',
    retryCount: 0,
  },
  {
    id: 'evt-seed-trn-05',
    idempotencyKey: 'direct_message:conv-user-trainee-01-user-instructor-01-grp-01:new:1:user-trainee-01',
    eventType: 'direct_message_received',
    sourceType: 'conversation',
    sourceId: 'conv-user-trainee-01-user-instructor-01-grp-01',
    eventVersion: 1,
    recipientId: 'user-trainee-01',
    recipientRole: 'trainee',
    category: 'communication',
    title: 'Eğitmeninizden Yeni Mesaj',
    description: 'Eğitmeniniz Murat Özkan size doğrudan bir özel mesaj iletti.',
    entityType: 'conversation',
    entityId: 'conv-user-trainee-01-user-instructor-01-grp-01',
    targetRoute: '/kursiyer/mesajlar',
    createdAt: '2026-10-21T16:00:00.000Z',
    status: 'created',
    retryCount: 0,
  },
  // Eğitmen: Murat Özkan (user-instructor-01)
  {
    id: 'evt-seed-ins-01',
    idempotencyKey: 'group:grp-01:instructor_assigned:1:user-instructor-01',
    eventType: 'instructor_group_assigned',
    sourceType: 'group',
    sourceId: 'grp-01',
    eventVersion: 1,
    recipientId: 'user-instructor-01',
    recipientRole: 'instructor',
    category: 'session',
    title: 'Grup Görevlendirmesi',
    description: 'Grup A (Hafta İçi Öğleden Sonra) sınıfına eğitmen olarak atandınız. Oturum takviminizi inceleyebilirsiniz.',
    entityType: 'group',
    entityId: 'grp-01',
    targetRoute: '/egitmen',
    createdAt: '2026-10-15T09:00:00.000Z',
    status: 'created',
    retryCount: 0,
  },
  {
    id: 'evt-seed-ins-02',
    idempotencyKey: 'direct_message:conv-user-trainee-01-user-instructor-01-grp-01:new_from_trainee:1:user-instructor-01',
    eventType: 'direct_message_received',
    sourceType: 'conversation',
    sourceId: 'conv-user-trainee-01-user-instructor-01-grp-01',
    eventVersion: 1,
    recipientId: 'user-instructor-01',
    recipientRole: 'instructor',
    category: 'communication',
    title: 'Kursiyerinizden Yeni Mesaj',
    description: 'Ayşe Demir (Grup A) tarafından bir soru mesajı gönderildi.',
    entityType: 'conversation',
    entityId: 'conv-user-trainee-01-user-instructor-01-grp-01',
    targetRoute: '/egitmen/mesajlar',
    createdAt: '2026-10-21T15:45:00.000Z',
    status: 'created',
    retryCount: 0,
  },
  // Yönetici: Selin Aydın (user-admin-01)
  {
    id: 'evt-seed-adm-01',
    idempotencyKey: 'application:app-02:submitted:1:user-admin-01',
    eventType: 'application_submitted',
    sourceType: 'application',
    sourceId: 'app-02',
    eventVersion: 1,
    recipientId: 'user-admin-01',
    recipientRole: 'admin',
    category: 'application',
    title: 'Yeni Başvuru Alındı',
    description: 'Ahmet Karataş, Dış Ticaret & İhracat Yönetimi programına yeni başvuru gerçekleştirdi.',
    entityType: 'application',
    entityId: 'app-02',
    targetRoute: '/yonetim/basvurular',
    createdAt: '2026-10-21T11:20:00.000Z',
    status: 'created',
    retryCount: 0,
  },
  {
    id: 'evt-seed-adm-02',
    idempotencyKey: 'attendance:sess-01:adjusted:1:user-admin-01',
    eventType: 'attendance_adjusted',
    sourceType: 'session',
    sourceId: 'sess-01',
    eventVersion: 1,
    recipientId: 'user-admin-01',
    recipientRole: 'admin',
    category: 'session',
    title: 'Gerekçeli Yoklama Düzeltmesi',
    description: 'Murat Özkan tarafından 1. Oturum yoklama kaydında idari gerekçeli durum güncellemesi yapıldı.',
    entityType: 'session',
    entityId: 'sess-01',
    targetRoute: '/yonetim/denetim',
    createdAt: '2026-10-21T17:00:00.000Z',
    status: 'created',
    retryCount: 0,
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-seed-app-01',
    eventId: 'evt-seed-app-01',
    recipientId: 'user-applicant-01',
    recipientRole: 'applicant',
    category: 'application',
    title: 'Başvurunuz Ön İncelemeye Alındı',
    description: 'İslahiye Biberi & Tarımsal E-Ticaret programı başvurunuz evrak ve ön kriter değerlendirmesine alınmıştır.',
    entityType: 'application',
    entityId: 'app-01',
    targetRoute: '/aday',
    createdAt: '2026-10-18T10:00:00.000Z',
    status: 'read',
    readAt: '2026-10-18T12:00:00.000Z',
  },
  {
    id: 'notif-seed-app-02',
    eventId: 'evt-seed-app-02',
    recipientId: 'user-applicant-01',
    recipientRole: 'applicant',
    category: 'application',
    title: 'Kriter Ön Değerlendirmesi Tamamlandı',
    description: 'Başvuru formunuz objektif kriter puanlama algoritması tarafından başarıyla değerlendirildi.',
    entityType: 'application',
    entityId: 'app-01',
    targetRoute: '/aday',
    createdAt: '2026-10-19T14:30:00.000Z',
    status: 'unread',
  },
  {
    id: 'notif-seed-trn-01',
    eventId: 'evt-seed-trn-01',
    recipientId: 'user-trainee-01',
    recipientRole: 'trainee',
    category: 'application',
    title: 'Kesin Kaydınız Tamamlandı',
    description: 'İslahiye Biberi & Tarımsal E-Ticaret 2026 Güz Dönemi kesin kaydınız resmi olarak onaylanmıştır.',
    entityType: 'enrollment',
    entityId: 'enr-trainee-01',
    targetRoute: '/kursiyer',
    createdAt: '2026-10-20T09:00:00.000Z',
    status: 'read',
    readAt: '2026-10-20T10:00:00.000Z',
  },
  {
    id: 'notif-seed-trn-02',
    eventId: 'evt-seed-trn-02',
    recipientId: 'user-trainee-01',
    recipientRole: 'trainee',
    category: 'application',
    title: 'Eğitim Grubunuz Belirlendi',
    description: 'Grup A (Hafta İçi Öğleden Sonra) sınıfına yerleştirildiniz. Eğitmeniniz: Murat Özkan.',
    entityType: 'group',
    entityId: 'grp-01',
    targetRoute: '/kursiyer',
    createdAt: '2026-10-20T09:15:00.000Z',
    status: 'read',
    readAt: '2026-10-20T10:05:00.000Z',
  },
  {
    id: 'notif-seed-trn-03',
    eventId: 'evt-seed-trn-03',
    recipientId: 'user-trainee-01',
    recipientRole: 'trainee',
    category: 'assignment',
    title: 'Yeni Ödev Yayımlandı',
    description: 'Ödev #1: Coğrafi İşaret ve E-Ticaret Uygunluk Analizi çalışması yayımlandı. Son teslim tarihini inceleyebilirsiniz.',
    entityType: 'assignment',
    entityId: 'asg-01',
    targetRoute: '/kursiyer#odevler',
    createdAt: '2026-10-20T11:00:00.000Z',
    status: 'unread',
  },
  {
    id: 'notif-seed-trn-04',
    eventId: 'evt-seed-trn-04',
    recipientId: 'user-trainee-01',
    recipientRole: 'trainee',
    category: 'announcement',
    title: 'Sınıf Duyurusu Yayımlandı',
    description: 'Eğitmeniniz Murat Özkan, resmi duyuru kanalında yeni bir sınıf bilgilendirmesi paylaştı.',
    entityType: 'channel',
    entityId: 'chan-grp01-announcements',
    targetRoute: '/kursiyer/kanallar',
    createdAt: '2026-10-21T14:00:00.000Z',
    status: 'unread',
  },
  {
    id: 'notif-seed-trn-05',
    eventId: 'evt-seed-trn-05',
    recipientId: 'user-trainee-01',
    recipientRole: 'trainee',
    category: 'communication',
    title: 'Eğitmeninizden Yeni Mesaj',
    description: 'Eğitmeniniz Murat Özkan size doğrudan bir özel mesaj iletti.',
    entityType: 'conversation',
    entityId: 'conv-user-trainee-01-user-instructor-01-grp-01',
    targetRoute: '/kursiyer/mesajlar',
    createdAt: '2026-10-21T16:00:00.000Z',
    status: 'unread',
  },
  {
    id: 'notif-seed-ins-01',
    eventId: 'evt-seed-ins-01',
    recipientId: 'user-instructor-01',
    recipientRole: 'instructor',
    category: 'session',
    title: 'Grup Görevlendirmesi',
    description: 'Grup A (Hafta İçi Öğleden Sonra) sınıfına eğitmen olarak atandınız. Oturum takviminizi inceleyebilirsiniz.',
    entityType: 'group',
    entityId: 'grp-01',
    targetRoute: '/egitmen',
    createdAt: '2026-10-15T09:00:00.000Z',
    status: 'read',
    readAt: '2026-10-15T11:00:00.000Z',
  },
  {
    id: 'notif-seed-ins-02',
    eventId: 'evt-seed-ins-02',
    recipientId: 'user-instructor-01',
    recipientRole: 'instructor',
    category: 'communication',
    title: 'Kursiyerinizden Yeni Mesaj',
    description: 'Ayşe Demir (Grup A) tarafından bir soru mesajı gönderildi.',
    entityType: 'conversation',
    entityId: 'conv-user-trainee-01-user-instructor-01-grp-01',
    targetRoute: '/egitmen/mesajlar',
    createdAt: '2026-10-21T15:45:00.000Z',
    status: 'unread',
  },
  {
    id: 'notif-seed-adm-01',
    eventId: 'evt-seed-adm-01',
    recipientId: 'user-admin-01',
    recipientRole: 'admin',
    category: 'application',
    title: 'Yeni Başvuru Alındı',
    description: 'Ahmet Karataş, Dış Ticaret & İhracat Yönetimi programına yeni başvuru gerçekleştirdi.',
    entityType: 'application',
    entityId: 'app-02',
    targetRoute: '/yonetim/basvurular',
    createdAt: '2026-10-21T11:20:00.000Z',
    status: 'unread',
  },
  {
    id: 'notif-seed-adm-02',
    eventId: 'evt-seed-adm-02',
    recipientId: 'user-admin-01',
    recipientRole: 'admin',
    category: 'session',
    title: 'Gerekçeli Yoklama Düzeltmesi',
    description: 'Murat Özkan tarafından 1. Oturum yoklama kaydında idari gerekçeli durum güncellemesi yapıldı.',
    entityType: 'session',
    entityId: 'sess-01',
    targetRoute: '/yonetim/denetim',
    createdAt: '2026-10-21T17:00:00.000Z',
    status: 'unread',
  },
];

export const INITIAL_ADMIN_ANNOUNCEMENTS: AdminAnnouncement[] = [
  {
    id: 'ann-admin-01',
    title: '2026 Güz Dönemi Açılış ve Oryantasyon Semineri',
    content:
      'İslahiye Dijital Platformlar Eğitim Portalı bünyesinde açılan tüm programların ortak açılış ve oryantasyon oturumu 25 Ekim 2026 tarihinde İE Ana Konferans Salonunda gerçekleştirilecektir. Tüm kursiyerlerimizin ve eğitmenlerimizin katılımı rica olunur.',
    targetAudience: 'all',
    status: 'published',
    publishDate: '2026-10-16T10:00:00.000Z',
    createdBy: 'user-admin-01',
    createdByName: 'Selin Aydın (Yetkili Yönetici)',
    recipientCount: 156,
    createdAt: '2026-10-16T09:30:00.000Z',
    updatedAt: '2026-10-16T10:00:00.000Z',
  },
  {
    id: 'ann-admin-02',
    title: 'KOSGEB & İhracat Destekleri Bölgesel Bilgilendirme Günü',
    content:
      'Tarımsal E-Ticaret ve Dış Ticaret programlarımızdaki kursiyerlerimiz için Güneydoğu Anadolu İhracatçı Birlikleri (GAİB) uzmanları katılımıyla mikro ihracat teşvikleri atölyesi düzenlenecektir.',
    targetAudience: 'program',
    targetProgramId: 'prog-01',
    targetProgramTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    targetTermId: 'term-2026-fall',
    targetCohortName: '2026 Güz Dönemi',
    status: 'published',
    publishDate: '2026-10-19T11:00:00.000Z',
    createdBy: 'user-admin-01',
    createdByName: 'Selin Aydın (Yetkili Yönetici)',
    recipientCount: 20,
    createdAt: '2026-10-19T10:30:00.000Z',
    updatedAt: '2026-10-19T11:00:00.000Z',
  },
  {
    id: 'ann-admin-03-draft',
    title: 'Dönem Sonu Başarı Belgeleri ve Tescil Töreni Planlaması (Taslak)',
    content:
      'Kasım ayı sonunda tamamlanacak eğitimlerin resmi başarı belgeleri ve QR kodlu sertifikaları İslahiye Ticaret Odası Yönetim Kurulu huzurunda takdim edilecektir.',
    targetAudience: 'trainees',
    status: 'draft',
    publishDate: '2026-11-01T10:00:00.000Z',
    createdBy: 'user-admin-01',
    createdByName: 'Selin Aydın (Yetkili Yönetici)',
    recipientCount: 0,
    createdAt: '2026-10-21T15:00:00.000Z',
    updatedAt: '2026-10-21T15:00:00.000Z',
  },
];

// -----------------------------------------------------------------------------
// STORAGE READ / WRITE HELPERS
// -----------------------------------------------------------------------------

export const getStoredNotifications = (): AppNotification[] => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_NOTIFICATIONS;
  } catch (err) {
    console.error('Notifications read error:', err);
    return INITIAL_NOTIFICATIONS;
  }
};

export const saveNotificationsToStorage = (notifications: AppNotification[]): void => {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATE_EVENT, { detail: notifications }));
    }
  } catch (err) {
    console.error('Notifications write error:', err);
  }
};

export const getStoredNotificationEvents = (): NotificationEvent[] => {
  try {
    const raw = localStorage.getItem(NOTIFICATION_EVENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFICATION_EVENTS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATION_EVENTS));
      return INITIAL_NOTIFICATION_EVENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_NOTIFICATION_EVENTS;
  } catch (err) {
    console.error('Notification events read error:', err);
    return INITIAL_NOTIFICATION_EVENTS;
  }
};

export const saveNotificationEventsToStorage = (events: NotificationEvent[]): void => {
  try {
    localStorage.setItem(NOTIFICATION_EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch (err) {
    console.error('Notification events write error:', err);
  }
};

export const getStoredAdminAnnouncements = (): AdminAnnouncement[] => {
  try {
    const raw = localStorage.getItem(ADMIN_ANNOUNCEMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ADMIN_ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(INITIAL_ADMIN_ANNOUNCEMENTS));
      return INITIAL_ADMIN_ANNOUNCEMENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_ADMIN_ANNOUNCEMENTS;
  } catch (err) {
    console.error('Admin announcements read error:', err);
    return INITIAL_ADMIN_ANNOUNCEMENTS;
  }
};

export const saveAdminAnnouncementsToStorage = (announcements: AdminAnnouncement[]): void => {
  try {
    localStorage.setItem(ADMIN_ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(ADMIN_ANNOUNCEMENTS_UPDATE_EVENT, { detail: announcements })
      );
    }
  } catch (err) {
    console.error('Admin announcements write error:', err);
  }
};

// -----------------------------------------------------------------------------
// IDEMPOTENCY KEY GENERATION & EVENT INGESTION
// -----------------------------------------------------------------------------

/**
 * İdempotency Anahtarı Üretici
 * Biçim: sourceType + ":" + sourceId + ":" + eventType + ":" + eventVersion + ":" + recipientId
 */
export const generateIdempotencyKey = (
  sourceType: string,
  sourceId: string,
  eventType: string,
  eventVersion = 1,
  recipientId: string
): string => {
  return `${sourceType}:${sourceId}:${eventType}:${eventVersion}:${recipientId}`;
};

export interface IngestNotificationEventParams {
  sourceType: string;
  sourceId: string;
  eventType: string;
  eventVersion?: number;
  recipientId: string;
  recipientRole: NotificationRecipientRole;
  category: NotificationCategory;
  title: string;
  description: string;
  entityType: string;
  entityId: string;
  targetRoute: string;
  metadata?: Record<string, any>;
  simulateFailure?: boolean; // For testing failed queue scenarios
}

/**
 * Olay Kaydı ve İdempotent Bildirim Üretimi
 * - Birincil kural: Aynı idempotencyKey daha önce işlenmişse ikinci bildirim ÜRETİLMEZ.
 * - Hata izolasyonu: Bildirim başarısız olsa dahi hata yakalanır ve 'failed' olarak günlüğe yazılır.
 */
export const ingestNotificationEvent = (
  params: IngestNotificationEventParams
): { success: boolean; event: NotificationEvent; notification?: AppNotification; isDuplicate?: boolean } => {
  try {
    const {
      sourceType,
      sourceId,
      eventType,
      eventVersion = 1,
      recipientId,
      recipientRole,
      category,
      title,
      description,
      entityType,
      entityId,
      targetRoute,
      metadata,
      simulateFailure,
    } = params;

    const idempotencyKey = generateIdempotencyKey(
      sourceType,
      sourceId,
      eventType,
      eventVersion,
      recipientId
    );

    const events = getStoredNotificationEvents();
    const existingEvent = events.find((e) => e.idempotencyKey === idempotencyKey);

    if (existingEvent) {
      // Zaten işlenmiş olay; mükerrer bildirim oluşturma
      const notifications = getStoredNotifications();
      const existingNotif = notifications.find((n) => n.eventId === existingEvent.id);
      return {
        success: existingEvent.status === 'created',
        event: existingEvent,
        notification: existingNotif,
        isDuplicate: true,
      };
    }

    const now = new Date().toISOString();
    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Simüle edilen hata testi kontrolü
    if (simulateFailure) {
      const failedEvent: NotificationEvent = {
        id: eventId,
        idempotencyKey,
        eventType,
        sourceType,
        sourceId,
        eventVersion,
        recipientId,
        recipientRole,
        category,
        title,
        description,
        entityType,
        entityId,
        targetRoute,
        createdAt: now,
        status: 'failed',
        retryCount: 1,
        lastAttemptAt: now,
        failureReason: 'Demo bildirim dağıtım kuyruğu simüle edilmiş hata üretti.',
        metadata,
      };
      events.push(failedEvent);
      saveNotificationEventsToStorage(events);
      return { success: false, event: failedEvent, isDuplicate: false };
    }

    const newEvent: NotificationEvent = {
      id: eventId,
      idempotencyKey,
      eventType,
      sourceType,
      sourceId,
      eventVersion,
      recipientId,
      recipientRole,
      category,
      title,
      description,
      entityType,
      entityId,
      targetRoute,
      createdAt: now,
      status: 'created',
      retryCount: 0,
      metadata,
    };

    const newNotification: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      eventId,
      recipientId,
      recipientRole,
      category,
      title,
      description,
      entityType,
      entityId,
      targetRoute,
      createdAt: now,
      status: 'unread',
      metadata,
    };

    events.push(newEvent);
    saveNotificationEventsToStorage(events);

    const notifications = getStoredNotifications();
    notifications.unshift(newNotification);
    saveNotificationsToStorage(notifications);

    return {
      success: true,
      event: newEvent,
      notification: newNotification,
      isDuplicate: false,
    };
  } catch (error: any) {
    console.error('Critical notification ingestion error caught safely:', error);
    // Güvenli fallback: Çağıran ana işlem geri alınmaz
    const fallbackEvent: NotificationEvent = {
      id: `evt-err-${Date.now()}`,
      idempotencyKey: `err:${Date.now()}`,
      eventType: params.eventType,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      eventVersion: params.eventVersion || 1,
      recipientId: params.recipientId,
      recipientRole: params.recipientRole,
      category: params.category,
      title: params.title,
      description: params.description,
      entityType: params.entityType,
      entityId: params.entityId,
      targetRoute: params.targetRoute,
      createdAt: new Date().toISOString(),
      status: 'failed',
      retryCount: 1,
      failureReason: error?.message || 'Bilinmeyen depolama hatası',
    };
    return { success: false, event: fallbackEvent, isDuplicate: false };
  }
};

// -----------------------------------------------------------------------------
// USER QUERY & MUTATION OPERATIONS
// -----------------------------------------------------------------------------

/**
 * Belirli bir kullanıcının bildirimlerini döner.
 * Yalnızca ilgili kullanıcının (recipientId) bildirimleri görünür (İzolasyon & Mahremiyet).
 */
export const getNotificationsForUser = (userId: string): AppNotification[] => {
  const all = getStoredNotifications();
  return all
    .filter((n) => n.recipientId === userId && n.status !== 'dismissed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

/**
 * Kullanıcının okunmamış bildirim sayısı.
 */
export const getUnreadNotificationCountForUser = (userId: string): number => {
  const userNotifications = getNotificationsForUser(userId);
  return userNotifications.filter((n) => n.status === 'unread').length;
};

/**
 * Bildirimi okundu olarak işaretler.
 */
export const markNotificationAsRead = (
  notificationId: string,
  userId: string
): { success: boolean; notification?: AppNotification; error?: string } => {
  const all = getStoredNotifications();
  const index = all.findIndex((n) => n.id === notificationId && n.recipientId === userId);

  if (index === -1) {
    return { success: false, error: 'Bildirim bulunamadı veya erişim yetkiniz yok.' };
  }

  all[index] = {
    ...all[index],
    status: 'read',
    readAt: new Date().toISOString(),
  };

  saveNotificationsToStorage(all);
  return { success: true, notification: all[index] };
};

/**
 * Kullanıcının tüm okunmamış bildirimlerini okundu yapar.
 */
export const markAllNotificationsAsRead = (userId: string): { success: boolean; updatedCount: number } => {
  const all = getStoredNotifications();
  let updatedCount = 0;
  const now = new Date().toISOString();

  const updatedAll = all.map((n) => {
    if (n.recipientId === userId && n.status === 'unread') {
      updatedCount++;
      return {
        ...n,
        status: 'read' as const,
        readAt: now,
      };
    }
    return n;
  });

  saveNotificationsToStorage(updatedAll);
  return { success: true, updatedCount };
};

/**
 * Bildirimi listeden gizler (Dismiss).
 * DİKKAT: Bu işlem asıl akademik veya başvuru kaydını KESİNLİKLE silmez.
 */
export const dismissNotification = (
  notificationId: string,
  userId: string
): { success: boolean; error?: string } => {
  const all = getStoredNotifications();
  const index = all.findIndex((n) => n.id === notificationId && n.recipientId === userId);

  if (index === -1) {
    return { success: false, error: 'Bildirim bulunamadı veya yetkiniz yok.' };
  }

  all[index] = {
    ...all[index],
    status: 'dismissed',
    dismissedAt: new Date().toISOString(),
  };

  saveNotificationsToStorage(all);
  return { success: true };
};

/**
 * Başarısız olmuş bir bildirim olayını kontrollü olarak yeniden dener (Demo Retry Mechanism).
 */
export const retryFailedNotificationEvent = (
  eventId: string
): { success: boolean; event?: NotificationEvent; notification?: AppNotification; error?: string } => {
  const events = getStoredNotificationEvents();
  const eventIndex = events.findIndex((e) => e.id === eventId);

  if (eventIndex === -1) {
    return { success: false, error: 'Olay kaydı bulunamadı.' };
  }

  const evt = events[eventIndex];
  const now = new Date().toISOString();

  // Olayı başarılı oluşturma durumuna geçir
  evt.status = 'created';
  evt.retryCount = (evt.retryCount || 0) + 1;
  evt.lastAttemptAt = now;
  evt.failureReason = undefined;

  events[eventIndex] = evt;
  saveNotificationEventsToStorage(events);

  // İlgili bildirimi oluştur veya etkinleştir
  const notifications = getStoredNotifications();
  let notif = notifications.find((n) => n.eventId === eventId);

  if (!notif) {
    notif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      eventId: evt.id,
      recipientId: evt.recipientId,
      recipientRole: evt.recipientRole,
      category: evt.category,
      title: evt.title,
      description: evt.description,
      entityType: evt.entityType,
      entityId: evt.entityId,
      targetRoute: evt.targetRoute,
      createdAt: now,
      status: 'unread',
      metadata: evt.metadata,
    };
    notifications.unshift(notif);
    saveNotificationsToStorage(notifications);
  }

  return { success: true, event: evt, notification: notif };
};

// -----------------------------------------------------------------------------
// ADMIN ANNOUNCEMENTS MANAGEMENT
// -----------------------------------------------------------------------------

export const createAdminAnnouncement = (params: {
  title: string;
  content: string;
  targetAudience: AdminAnnouncement['targetAudience'];
  targetProgramId?: string;
  targetProgramTitle?: string;
  targetTermId?: string;
  targetCohortName?: string;
  targetGroupId?: string;
  targetGroupName?: string;
  status: 'draft' | 'published';
  createdBy: string;
  createdByName: string;
  recipientCount: number;
}): { success: boolean; announcement?: AdminAnnouncement; error?: string } => {
  if (!params.title.trim() || !params.content.trim()) {
    return { success: false, error: 'Başlık ve duyuru içeriği zorunludur.' };
  }

  const announcements = getStoredAdminAnnouncements();
  const now = new Date().toISOString();

  const newAnn: AdminAnnouncement = {
    id: `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: params.title.trim(),
    content: params.content.trim(),
    targetAudience: params.targetAudience,
    targetProgramId: params.targetProgramId,
    targetProgramTitle: params.targetProgramTitle,
    targetTermId: params.targetTermId,
    targetCohortName: params.targetCohortName,
    targetGroupId: params.targetGroupId,
    targetGroupName: params.targetGroupName,
    status: params.status,
    publishDate: params.status === 'published' ? now : '',
    createdBy: params.createdBy,
    createdByName: params.createdByName,
    recipientCount: params.recipientCount,
    createdAt: now,
    updatedAt: now,
  };

  announcements.unshift(newAnn);
  saveAdminAnnouncementsToStorage(announcements);

  return { success: true, announcement: newAnn };
};

export const publishAdminAnnouncement = (
  announcementId: string
): { success: boolean; announcement?: AdminAnnouncement; error?: string } => {
  const announcements = getStoredAdminAnnouncements();
  const index = announcements.findIndex((a) => a.id === announcementId);

  if (index === -1) {
    return { success: false, error: 'Duyuru bulunamadı.' };
  }

  const ann = announcements[index];
  const now = new Date().toISOString();

  ann.status = 'published';
  ann.publishDate = now;
  ann.updatedAt = now;

  announcements[index] = ann;
  saveAdminAnnouncementsToStorage(announcements);

  return { success: true, announcement: ann };
};

// -----------------------------------------------------------------------------
// EVENT SUBSCRIPTION & RESET
// -----------------------------------------------------------------------------

export const subscribeToNotificationUpdates = (callback: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(NOTIFICATIONS_UPDATE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(NOTIFICATIONS_UPDATE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};

export const subscribeToAdminAnnouncementUpdates = (callback: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(ADMIN_ANNOUNCEMENTS_UPDATE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(ADMIN_ANNOUNCEMENTS_UPDATE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};

export const resetNotificationStorage = (): void => {
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
  localStorage.setItem(NOTIFICATION_EVENTS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATION_EVENTS));
  localStorage.setItem(ADMIN_ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(INITIAL_ADMIN_ANNOUNCEMENTS));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(NOTIFICATIONS_UPDATE_EVENT, { detail: INITIAL_NOTIFICATIONS })
    );
    window.dispatchEvent(
      new CustomEvent(ADMIN_ANNOUNCEMENTS_UPDATE_EVENT, { detail: INITIAL_ADMIN_ANNOUNCEMENTS })
    );
  }
};
