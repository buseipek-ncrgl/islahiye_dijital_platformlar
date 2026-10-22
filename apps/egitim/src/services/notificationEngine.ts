/**
 * Notification Event Engine (Sprint E04-B)
 * İş akışı olaylarını bildirim sistemine bağlayan olay motoru.
 *
 * Temel İlke:
 * Bu motordaki hiçbir işlem ana başvuru, ödev, yoklama, mesaj veya belge akışını
 * engellemez veya kesintiye uğratmaz (Non-blocking & Error Isolated).
 */

import {
  ingestNotificationEvent,
  IngestNotificationEventParams,
} from './notificationStorage';
import {
  Application,
  Assignment,
  Channel,
  ChannelMessage,
  Conversation,
  DirectMessage,
  Enrollment,
  Group,
  GroupAssignment,
  Session,
  CertificateRecord,
  SuccessDecisionRecord,
  AdminAnnouncement,
} from '../types';

/**
 * Güvenli olay tetikleyici sarmalayıcı (Hata fırlatmaz)
 */
const safeIngest = (params: IngestNotificationEventParams): void => {
  try {
    ingestNotificationEvent(params);
  } catch (error) {
    console.error('Notification dispatch safely caught without blocking workflow:', error);
  }
};

// ============================================================================
// 1. ADAY VE BAŞVURU OLAYLARI
// ============================================================================

export const notifyApplicationSubmitted = (app: Application): void => {
  // 1. Adaya bildirim
  safeIngest({
    sourceType: 'application',
    sourceId: app.id,
    eventType: 'application_submitted',
    eventVersion: 1,
    recipientId: app.candidateId,
    recipientRole: 'applicant',
    category: 'application',
    title: 'Başvurunuz Başarıyla Alındı',
    description: `"${app.programTitle}" programına yaptığınız başvuru (${app.referenceNumber}) sisteme kaydedildi. İnceleme sürecini bu ekrandan takip edebilirsiniz.`,
    entityType: 'application',
    entityId: app.id,
    targetRoute: '/aday',
  });

  // 2. Yöneticiye bildirim
  safeIngest({
    sourceType: 'application',
    sourceId: app.id,
    eventType: 'admin_new_application',
    eventVersion: 1,
    recipientId: 'user-admin-01',
    recipientRole: 'admin',
    category: 'application',
    title: 'Yeni Başvuru Alındı',
    description: `${app.candidateName}, "${app.programTitle}" programına yeni bir başvuru gerçekleştirdi (${app.referenceNumber}).`,
    entityType: 'application',
    entityId: app.id,
    targetRoute: '/yonetim/basvurular',
  });
};

/**
 * Yönetici Nihai Kararı Bildirimi
 * MAHREMİYET KURALI: Kurum içi değerlendirme notu (internalNote) ASLA adaya gönderilmez!
 * Yalnızca resmi aday açıklama mesajı (candidateMessage) kullanılır.
 */
export const notifyAdminDecision = (
  app: Application,
  candidateMessage: string
): void => {
  const statusLabels: Record<string, string> = {
    accepted: 'Kabul Edildi',
    waitlisted: 'Yedek Listeye Alındı',
    rejected: 'Başvuru Sonuçlandı',
    additional_review: 'Ek İncelemeye Alındı',
  };

  const statusLabel = statusLabels[app.status] || 'Değerlendirildi';

  safeIngest({
    sourceType: 'application',
    sourceId: app.id,
    eventType: `decision_${app.status}`,
    eventVersion: (app.decisionHistory?.length || 1),
    recipientId: app.candidateId,
    recipientRole: 'applicant',
    category: 'application',
    title: `Başvuru Sonucunuz: ${statusLabel}`,
    description: candidateMessage || `"${app.programTitle}" programı başvurunuz ${statusLabel.toLowerCase()} olarak sonuçlanmıştır.`,
    entityType: 'application',
    entityId: app.id,
    targetRoute: '/aday',
  });
};

export const notifyEnrollmentConfirmed = (enrollment: Enrollment): void => {
  safeIngest({
    sourceType: 'enrollment',
    sourceId: enrollment.id,
    eventType: 'enrollment_completed',
    eventVersion: 1,
    recipientId: enrollment.candidateId,
    recipientRole: 'trainee',
    category: 'application',
    title: 'Kesin Kaydınız Onaylandı',
    description: `"${enrollment.programTitle}" programı ${enrollment.cohortName} için kesin kaydınız resmi olarak tamamlanmıştır. Öğrenci paneliniz aktif edildi.`,
    entityType: 'enrollment',
    entityId: enrollment.id,
    targetRoute: '/kursiyer',
  });
};

export const notifyGroupAssigned = (
  assignment: GroupAssignment,
  group: Group
): void => {
  safeIngest({
    sourceType: 'assignment',
    sourceId: assignment.id,
    eventType: 'group_assigned',
    eventVersion: 1,
    recipientId: assignment.candidateId,
    recipientRole: 'trainee',
    category: 'application',
    title: 'Eğitim Sınıfınız Belirlendi',
    description: `"${group.name}" sınıfına yerleştirildiniz. Eğitmeniniz: ${group.instructorNames.join(', ')}. Ders takviminizi inceleyebilirsiniz.`,
    entityType: 'group',
    entityId: group.id,
    targetRoute: '/kursiyer',
  });
};

// ============================================================================
// 2. DERS VE TAKVİM OLAYLARI
// ============================================================================

export const notifySessionScheduled = (
  session: Session,
  traineeIds: string[]
): void => {
  for (const traineeId of traineeIds) {
    safeIngest({
      sourceType: 'session',
      sourceId: session.id,
      eventType: 'session_scheduled',
      eventVersion: 1,
      recipientId: traineeId,
      recipientRole: 'trainee',
      category: 'session',
      title: 'Yeni Ders Oturumu Planlandı',
      description: `${session.sessionNumber}. Oturum: "${session.title}" (${session.date} ${session.startTime} - ${session.endTime}) takvime eklendi.`,
      entityType: 'session',
      entityId: session.id,
      targetRoute: '/kursiyer',
    });
  }
};

export const notifySessionRescheduled = (
  session: Session,
  traineeIds: string[]
): void => {
  for (const traineeId of traineeIds) {
    safeIngest({
      sourceType: 'session',
      sourceId: session.id,
      eventType: 'session_rescheduled',
      eventVersion: 2,
      recipientId: traineeId,
      recipientRole: 'trainee',
      category: 'session',
      title: 'Ders Saati veya Tarihi Güncellendi',
      description: `${session.sessionNumber}. Oturum (${session.title}) tarihi/saati ${session.date} ${session.startTime} olarak güncellendi.`,
      entityType: 'session',
      entityId: session.id,
      targetRoute: '/kursiyer',
    });
  }
};

export const notifySessionCancelled = (
  session: Session,
  traineeIds: string[],
  reason?: string
): void => {
  for (const traineeId of traineeIds) {
    safeIngest({
      sourceType: 'session',
      sourceId: session.id,
      eventType: 'session_cancelled',
      eventVersion: 3,
      recipientId: traineeId,
      recipientRole: 'trainee',
      category: 'session',
      title: 'Ders Oturumu İptal Edildi',
      description: `${session.sessionNumber}. Oturum (${session.date}) ${reason ? `nedeniyle iptal edildi: ${reason}` : 'iptal edilmiştir.'} Devam oranınızı etkilemeyecektir.`,
      entityType: 'session',
      entityId: session.id,
      targetRoute: '/kursiyer',
    });
  }
};

// ============================================================================
// 3. ÖDEV VE DEĞERLENDİRME OLAYLARI
// ============================================================================

export const notifyAssignmentPublished = (
  assignment: Assignment,
  traineeIds: string[]
): void => {
  // Taslak ödevler kesinlikle bildirim üretmez!
  if (assignment.publicationStatus === 'draft') {
    return;
  }

  for (const traineeId of traineeIds) {
    safeIngest({
      sourceType: 'assignment',
      sourceId: assignment.id,
      eventType: 'assignment_published',
      eventVersion: 1,
      recipientId: traineeId,
      recipientRole: 'trainee',
      category: 'assignment',
      title: 'Yeni Ödev Yayımlandı',
      description: `"${assignment.title}" ödevi paylaşıldı. Son teslim tarihi: ${assignment.dueDate || 'Belirtilmedi'}.`,
      entityType: 'assignment',
      entityId: assignment.id,
      targetRoute: '/kursiyer#odevler',
    });
  }
};

export const notifyAssignmentRevisionRequested = (
  assignment: Assignment,
  traineeId: string,
  revisionNote?: string
): void => {
  safeIngest({
    sourceType: 'assignment',
    sourceId: assignment.id,
    eventType: 'assignment_revision_requested',
    eventVersion: Date.now(),
    recipientId: traineeId,
    recipientRole: 'trainee',
    category: 'assignment',
    title: 'Ödeviniz İçin Revizyon İstendi',
    description: `"${assignment.title}" ödeviniz için eğitmeniniz revizyon talep etti. ${revisionNote ? `Eğitmen Notu: ${revisionNote}` : 'Lütfen detayları inceleyip tekrar yükleyiniz.'}`,
    entityType: 'assignment',
    entityId: assignment.id,
    targetRoute: '/kursiyer#odevler',
  });
};

export const notifyAssignmentEvaluated = (
  assignment: Assignment,
  traineeId: string,
  score: number,
  isApproved: boolean
): void => {
  safeIngest({
    sourceType: 'assignment',
    sourceId: assignment.id,
    eventType: 'assignment_evaluated',
    eventVersion: Date.now(),
    recipientId: traineeId,
    recipientRole: 'trainee',
    category: 'assignment',
    title: isApproved ? 'Ödeviniz Onaylandı' : 'Ödev Değerlendirmeniz Tamamlandı',
    description: `"${assignment.title}" ödeviniz değerlendirildi. Notunuz: ${score} / ${assignment.maxScore || 100}.`,
    entityType: 'assignment',
    entityId: assignment.id,
    targetRoute: '/kursiyer#odevler',
  });
};

// ============================================================================
// 4. MESAJLAŞMA VE KANAL OLAYLARI
// ============================================================================

/**
 * Yeni Özel Mesaj Bildirimi
 * MAHREMİYET KURALI: Özel mesajın tam metni bildirimde açığa çıkarılmaz!
 */
export const notifyDirectMessageReceived = (
  conversation: Conversation,
  message: DirectMessage
): void => {
  const isFromTrainee = message.senderRole === 'trainee';
  const recipientId = isFromTrainee ? conversation.instructorId : conversation.traineeId;
  const recipientRole = isFromTrainee ? 'instructor' : 'trainee';
  const targetRoute = isFromTrainee ? '/egitmen/mesajlar' : '/kursiyer/mesajlar';

  safeIngest({
    sourceType: 'conversation',
    sourceId: conversation.id,
    eventType: 'direct_message_received',
    eventVersion: Date.now(),
    recipientId,
    recipientRole,
    category: 'communication',
    title: isFromTrainee ? 'Kursiyerinizden Yeni Mesaj' : 'Eğitmeninizden Yeni Mesaj',
    description: isFromTrainee
      ? `${conversation.traineeName} (${conversation.groupName}) size yeni bir mesaj iletti.`
      : `Eğitmeniniz ${conversation.instructorName} size yeni bir mesaj gönderdi.`,
    entityType: 'conversation',
    entityId: conversation.id,
    targetRoute,
  });
};

/**
 * Grup Duyurusu Yayımlandı
 * Yalnızca o grubun aktif üyelerine iletilir; grup dışındakilere gitmez.
 */
export const notifyChannelAnnouncement = (
  channel: Channel,
  message: ChannelMessage,
  activeMemberIds: string[]
): void => {
  for (const memberId of activeMemberIds) {
    if (memberId === message.senderId) continue; // Gönderene kendi duyurusu bildirilmez

    safeIngest({
      sourceType: 'channel',
      sourceId: channel.id,
      eventType: 'channel_announcement_published',
      eventVersion: Date.now(),
      recipientId: memberId,
      recipientRole: 'trainee',
      category: 'announcement',
      title: `Resmi Grup Duyurusu: ${message.title || channel.name}`,
      description: `Eğitmeniniz ${message.senderName}, "${channel.name}" kanalında yeni bir duyuru paylaştı.`,
      entityType: 'channel',
      entityId: channel.id,
      targetRoute: '/kursiyer/kanallar',
    });
  }
};

// ============================================================================
// 5. BAŞARI VE BELGE OLAYLARI
// ============================================================================

export const notifySuccessDecisionPublished = (
  decision: SuccessDecisionRecord | { id: string; candidateId: string; decision: string; cohortName?: string }
): void => {
  const isApproved = decision.decision === 'approved' || decision.decision === 'certified';
  const decisionId = 'decisionId' in decision ? decision.decisionId : decision.id;
  const traineeId = 'traineeId' in decision ? decision.traineeId : decision.candidateId;
  const cohort = 'cohortName' in decision ? decision.cohortName : '2026 Güz Dönemi';

  safeIngest({
    sourceType: 'success_decision',
    sourceId: decisionId,
    eventType: 'success_decision_published',
    eventVersion: 1,
    recipientId: traineeId,
    recipientRole: 'trainee',
    category: 'certificate',
    title: isApproved ? 'Dönem Sonu Başarı Kararınız Onaylandı' : 'Dönem Sonu Başarı Kararı Açıklandı',
    description: isApproved
      ? `Tebrikler! ${cohort || '2026 Güz Dönemi'} dönemi akademik başarı şartlarını eksiksiz sağlayarak resmi başarı onayını aldınız.`
      : `Dönem sonu başarı değerlendirmeniz sonuçlanmıştır. Ayrıntıları öğrenci panelinizden inceleyebilirsiniz.`,
    entityType: 'success_decision',
    entityId: decisionId,
    targetRoute: '/kursiyer#belgeler',
  });
};


export const notifyCertificateIssued = (
  cert: CertificateRecord
): void => {
  safeIngest({
    sourceType: 'certificate',
    sourceId: cert.id,
    eventType: 'certificate_issued',
    eventVersion: 1,
    recipientId: cert.candidateId,
    recipientRole: 'trainee',
    category: 'certificate',
    title: 'Demo Başarı Belgeniz Hazırlandı',
    description: `"${cert.certificateTypeLabel}" belgeniz (${cert.certificateNumber}) düzenlenmiştir. Karekodlu dijital belgenizi görüntüleyebilir veya indirebilirsiniz.`,
    entityType: 'certificate',
    entityId: cert.id,
    targetRoute: '/kursiyer#belgeler',
  });
};

// ============================================================================
// 6. YÖNETİCİ GENEL DUYURULARI
// ============================================================================

export const notifyAdminAnnouncementPublished = (
  announcement: AdminAnnouncement,
  recipientUserIds: Array<{ id: string; role: 'applicant' | 'trainee' | 'instructor' | 'admin' }>
): void => {
  for (const recipient of recipientUserIds) {
    safeIngest({
      sourceType: 'admin_announcement',
      sourceId: announcement.id,
      eventType: 'admin_announcement_published',
      eventVersion: 1,
      recipientId: recipient.id,
      recipientRole: recipient.role,
      category: 'announcement',
      title: `Kurumsal Duyuru: ${announcement.title}`,
      description: `${announcement.createdByName} tarafından yayımlanan kurumsal bilgilendirme mevcuttur.`,
      entityType: 'announcement',
      entityId: announcement.id,
      targetRoute: '/bildirimler',
    });
  }
};
