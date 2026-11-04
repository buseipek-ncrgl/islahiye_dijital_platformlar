/**
 * Direct Messaging Storage & Integrity Service (Sprint E04-A)
 * Kursiyer ↔ Atanmış Eğitmen Birebir Özel Mesajlaşma Motoru.
 *
 * Temel Kurallar:
 * 1. Kimin kiminle mesajlaşabileceği EnrollmentRecord, GroupAssignment ve InstructorAssignment
 *    ilişkilerinden türetilir. Rastgele iki kullanıcı arasında görüşme başlatılamaz.
 * 2. Kursiyer yalnızca kendi aktif eğitim gruplarına atanmış eğitmenlerle konuşabilir.
 * 3. Eğitmen yalnızca kendisine atanmış gruplardaki kursiyerlerle görüşebilir.
 * 4. İlgisiz kursiyer ve eğitmenler birbirlerinin özel mesajlarına erişemez.
 * 5. Gerçek ağ veya WebSocket iddiası yoktur: durumlar "Yerel Demoya Kaydedildi" ve "Okundu (Demo Görüntüleme)" olarak etiketlenir.
 */

import {
  Conversation,
  DirectMessage,
  GroupAssignment,
} from '../types';
import {
  getStoredGroups,
  getStoredAssignments,
  getStoredEnrollments,
} from './enrollmentStorage';
import { notifyDirectMessageReceived } from './notificationEngine';

const CONVERSATIONS_STORAGE_KEY = 'islahiye_education_conversations_v2';
const DIRECT_MESSAGES_STORAGE_KEY = 'islahiye_education_direct_messages_v2';

export const MESSAGES_UPDATE_EVENT = 'islahiye_messages_updated';
export const CONVERSATIONS_UPDATE_EVENT = 'islahiye_conversations_updated';

// -----------------------------------------------------------------------------
// SEED CONVERSATIONS & DIRECT MESSAGES (Real 2026 Fall Data)
// -----------------------------------------------------------------------------

export const INITIAL_CONVERSATIONS: Conversation[] = [
  // 1. Ahmet Kaya ↔ Murat Özkan (Grup A - E-Ticaret)
  {
    id: 'conv-ahmet-murat-grp01',
    traineeId: 'usr-trainee',
    traineeName: 'Ahmet Kaya',
    instructorId: 'user-instructor-01',
    instructorName: 'Murat Özkan',
    enrollmentId: 'enr-trainee-ahmet',
    groupId: 'grp-01',
    groupName: 'Grup A — Sabah Oturumu',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    status: 'active',
    createdAt: '2026-10-14T09:30:00.000Z',
    updatedAt: '2026-10-21T16:45:00.000Z',
    lastMessagePreview: 'Rica ederim Ahmet Bey, sunum dosyanızı Salı günkü oturumda birlikte inceleyeceğiz.',
    lastMessageAt: '2026-10-21T16:45:00.000Z',
    unreadCountTrainee: 0,
    unreadCountInstructor: 0,
  },
  // 2. Ahmet Kaya ↔ Şef Mehmet Yılmaz (Grup A - Gastronomi & İşleme)
  {
    id: 'conv-ahmet-mehmet-grp01',
    traineeId: 'usr-trainee',
    traineeName: 'Ahmet Kaya',
    instructorId: 'usr-instructor',
    instructorName: 'Şef Mehmet Yılmaz',
    enrollmentId: 'enr-trainee-ahmet',
    groupId: 'grp-01',
    groupName: 'Grup A — Sabah Oturumu',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    status: 'active',
    createdAt: '2026-10-18T11:00:00.000Z',
    updatedAt: '2026-10-22T14:15:00.000Z',
    lastMessagePreview: 'Közleme derecesi ve nem oranı tespiti için numune hazırlayabilirsiniz.',
    lastMessageAt: '2026-10-22T14:15:00.000Z',
    unreadCountTrainee: 0,
    unreadCountInstructor: 1,
  },
  // 3. Fatma Şahin ↔ Murat Özkan (Grup A)
  {
    id: 'conv-fatma-murat-grp01',
    traineeId: 'usr-real-12',
    traineeName: 'Fatma Şahin',
    instructorId: 'user-instructor-01',
    instructorName: 'Murat Özkan',
    enrollmentId: 'enr-trainee-fatma',
    groupId: 'grp-01',
    groupName: 'Grup A — Sabah Oturumu',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    status: 'active',
    createdAt: '2026-10-15T10:00:00.000Z',
    updatedAt: '2026-10-23T11:20:00.000Z',
    lastMessagePreview: 'Ödev tesliminizi inceledim, pazar araştırması bölümü oldukça detaylı olmuş.',
    lastMessageAt: '2026-10-23T11:20:00.000Z',
    unreadCountTrainee: 0,
    unreadCountInstructor: 0,
  },
  // 4. Caner Yıldız ↔ Kemal Aksoy (Grup B - İhracat)
  {
    id: 'conv-caner-kemal-grp02',
    traineeId: 'usr-real-17',
    traineeName: 'Caner Yıldız',
    instructorId: 'user-instructor-02',
    instructorName: 'Kemal Aksoy',
    enrollmentId: 'enr-trainee-caner',
    groupId: 'grp-02',
    groupName: 'Grup B — Öğleden Sonra Oturumu',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    status: 'active',
    createdAt: '2026-10-16T14:00:00.000Z',
    updatedAt: '2026-10-24T15:30:00.000Z',
    lastMessagePreview: 'EUR.1 dolaşım belgesi taslağını sisteme ekledim, inceleyebilirsiniz.',
    lastMessageAt: '2026-10-24T15:30:00.000Z',
    unreadCountTrainee: 0,
    unreadCountInstructor: 0,
  },
  // 5. İbrahim Çelik ↔ Şef Mehmet Yılmaz (Grup C - Gastronomi)
  {
    id: 'conv-ibrahim-mehmet-grp03',
    traineeId: 'usr-real-21',
    traineeName: 'İbrahim Çelik',
    instructorId: 'usr-instructor',
    instructorName: 'Şef Mehmet Yılmaz',
    enrollmentId: 'enr-trainee-ibrahim',
    groupId: 'grp-03',
    groupName: 'Grup A — Uygulama Mutfağı',
    programId: 'prog-03',
    programTitle: 'İslahiye Gastronomi ve Mutfak Sanatları',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    status: 'active',
    createdAt: '2026-10-17T09:00:00.000Z',
    updatedAt: '2026-10-25T16:00:00.000Z',
    lastMessagePreview: 'Pazartesi günü uygulama mutfağında İslahiye Biberli İçli Köfte reçetesini çalışacağız.',
    lastMessageAt: '2026-10-25T16:00:00.000Z',
    unreadCountTrainee: 0,
    unreadCountInstructor: 0,
  },
];

export const INITIAL_DIRECT_MESSAGES: DirectMessage[] = [
  // Ahmet Kaya ↔ Murat Özkan
  {
    id: 'dm-001',
    conversationId: 'conv-ahmet-murat-grp01',
    senderId: 'usr-trainee',
    senderRole: 'trainee',
    senderName: 'Ahmet Kaya',
    body: 'Murat Hocam merhaba, 2. hafta e-ticaret lojistik ödevi için tescilli ambalaj sertifikasını rapora eklemem gerekiyor mu?',
    createdAt: '2026-10-14T09:30:00.000Z',
    status: 'saved_locally',
    readAt: '2026-10-14T09:45:00.000Z',
  },
  {
    id: 'dm-002',
    conversationId: 'conv-ahmet-murat-grp01',
    senderId: 'user-instructor-01',
    senderRole: 'instructor',
    senderName: 'Murat Özkan',
    body: 'Merhaba Ahmet Bey, evet coğrafi işaret standartları gereği ambalaj etiket formatını ödev ekine koymanız değerlendirme puanı açısından kritik.',
    createdAt: '2026-10-14T10:15:00.000Z',
    status: 'saved_locally',
    readAt: '2026-10-14T10:30:00.000Z',
  },
  {
    id: 'dm-003',
    conversationId: 'conv-ahmet-murat-grp01',
    senderId: 'usr-trainee',
    senderRole: 'trainee',
    senderName: 'Ahmet Kaya',
    body: 'Teşekkür ederim hocam, taslağı hazırlayıp ödev modülünden yükleyeceğim.',
    createdAt: '2026-10-21T16:00:00.000Z',
    status: 'saved_locally',
    readAt: '2026-10-21T16:30:00.000Z',
  },
  {
    id: 'dm-004',
    conversationId: 'conv-ahmet-murat-grp01',
    senderId: 'user-instructor-01',
    senderRole: 'instructor',
    senderName: 'Murat Özkan',
    body: 'Rica ederim Ahmet Bey, sunum dosyanızı Salı günkü oturumda birlikte inceleyeceğiz.',
    createdAt: '2026-10-21T16:45:00.000Z',
    status: 'saved_locally',
    readAt: '2026-10-21T17:00:00.000Z',
  },

  // Ahmet Kaya ↔ Şef Mehmet Yılmaz
  {
    id: 'dm-101',
    conversationId: 'conv-ahmet-mehmet-grp01',
    senderId: 'usr-trainee',
    senderRole: 'trainee',
    senderName: 'Ahmet Kaya',
    body: 'Şefim iyi günler, közlenmiş biber konservesi yaparken pastörizasyon süresini 85 derecede kaç dakika tutmalıyız?',
    createdAt: '2026-10-22T13:40:00.000Z',
    status: 'saved_locally',
    readAt: '2026-10-22T14:00:00.000Z',
  },
  {
    id: 'dm-102',
    conversationId: 'conv-ahmet-mehmet-grp01',
    senderId: 'usr-instructor',
    senderRole: 'instructor',
    senderName: 'Şef Mehmet Yılmaz',
    body: 'Ahmet Bey selamlar. 500 cc kavanozlar için çekirdek sıcaklığı 85°C ye ulaştıktan sonra net 20 dakika tutulmalı. Közleme derecesi ve nem oranı tespiti için numune hazırlayabilirsiniz.',
    createdAt: '2026-10-22T14:15:00.000Z',
    status: 'saved_locally',
  },

  // Fatma Şahin ↔ Murat Özkan
  {
    id: 'dm-201',
    conversationId: 'conv-fatma-murat-grp01',
    senderId: 'usr-real-12',
    senderRole: 'trainee',
    senderName: 'Fatma Şahin',
    body: 'Murat Hocam merhaba, kooperatif e-ticaret lojistik analizi ödevimi teslim ettim. Pazar araştırması kısmını inceleyebilir misiniz?',
    createdAt: '2026-10-23T10:45:00.000Z',
    status: 'saved_locally',
    readAt: '2026-10-23T11:00:00.000Z',
  },
  {
    id: 'dm-202',
    conversationId: 'conv-fatma-murat-grp01',
    senderId: 'user-instructor-01',
    senderRole: 'instructor',
    senderName: 'Murat Özkan',
    body: 'Merhaba Fatma Hanım. Ödev tesliminizi inceledim, pazar araştırması bölümü oldukça detaylı olmuş. Elinize sağlık, 95 puanla sisteme işledim.',
    createdAt: '2026-10-23T11:20:00.000Z',
    status: 'saved_locally',
    readAt: '2026-10-23T11:30:00.000Z',
  },

  // Caner Yıldız ↔ Kemal Aksoy
  {
    id: 'dm-301',
    conversationId: 'conv-caner-kemal-grp02',
    senderId: 'usr-real-17',
    senderRole: 'trainee',
    senderName: 'Caner Yıldız',
    body: 'Kemal Hocam, İslahiye Biberi için Almanya gıda ithalatında aranan mikrobiyolojik analiz sertifikası örneği var mıdır?',
    createdAt: '2026-10-24T14:50:00.000Z',
    status: 'saved_locally',
    readAt: '2026-10-24T15:10:00.000Z',
  },
  {
    id: 'dm-302',
    conversationId: 'conv-caner-kemal-grp02',
    senderId: 'user-instructor-02',
    senderRole: 'instructor',
    senderName: 'Kemal Aksoy',
    body: 'EUR.1 dolaşım belgesi taslağını sisteme ekledim, inceleyebilirsiniz. Akredite laboratuvar analiz şablonunu da ders materyallerine yüklüyorum.',
    createdAt: '2026-10-24T15:30:00.000Z',
    status: 'saved_locally',
    readAt: '2026-10-24T15:45:00.000Z',
  },

  // İbrahim Çelik ↔ Şef Mehmet Yılmaz
  {
    id: 'dm-401',
    conversationId: 'conv-ibrahim-mehmet-grp03',
    senderId: 'usr-real-21',
    senderRole: 'trainee',
    senderName: 'İbrahim Çelik',
    body: 'Şefim hayırlı günler, gastronomi atölyesindeki bir sonraki reçete çalışmamız ne zaman olacak?',
    createdAt: '2026-10-25T15:10:00.000Z',
    status: 'saved_locally',
    readAt: '2026-10-25T15:30:00.000Z',
  },
  {
    id: 'dm-402',
    conversationId: 'conv-ibrahim-mehmet-grp03',
    senderId: 'usr-instructor',
    senderRole: 'instructor',
    senderName: 'Şef Mehmet Yılmaz',
    body: 'İbrahim Bey merhaba, Pazartesi günü uygulama mutfağında İslahiye Biberli İçli Köfte reçetesini çalışacağız.',
    createdAt: '2026-10-25T16:00:00.000Z',
    status: 'saved_locally',
    readAt: '2026-10-25T16:15:00.000Z',
  },
];

// -----------------------------------------------------------------------------
// STORAGE HELPERS (Auto-Seed Threshold Safeguards)
// -----------------------------------------------------------------------------

export const getStoredConversations = (): Conversation[] => {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(INITIAL_CONVERSATIONS));
      return INITIAL_CONVERSATIONS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < 3) {
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(INITIAL_CONVERSATIONS));
      return INITIAL_CONVERSATIONS;
    }
    return parsed;
  } catch (err) {
    console.error('Conversations read error:', err);
    return INITIAL_CONVERSATIONS;
  }
};

const saveConversationsToStorage = (conversations: Conversation[]): void => {
  try {
    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CONVERSATIONS_UPDATE_EVENT, { detail: conversations }));
    }
  } catch (err) {
    console.error('Conversations write error:', err);
  }
};

export const getStoredDirectMessages = (): DirectMessage[] => {
  try {
    const raw = localStorage.getItem(DIRECT_MESSAGES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DIRECT_MESSAGES_STORAGE_KEY, JSON.stringify(INITIAL_DIRECT_MESSAGES));
      return INITIAL_DIRECT_MESSAGES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < 5) {
      localStorage.setItem(DIRECT_MESSAGES_STORAGE_KEY, JSON.stringify(INITIAL_DIRECT_MESSAGES));
      return INITIAL_DIRECT_MESSAGES;
    }
    return parsed;
  } catch (err) {
    console.error('Direct messages read error:', err);
    return INITIAL_DIRECT_MESSAGES;
  }
};

const saveDirectMessagesToStorage = (messages: DirectMessage[]): void => {
  try {
    localStorage.setItem(DIRECT_MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(MESSAGES_UPDATE_EVENT, { detail: messages }));
    }
  } catch (err) {
    console.error('Direct messages write error:', err);
  }
};

// -----------------------------------------------------------------------------
// RELATIONSHIP & ELIGIBILITY DERIVATION
// -----------------------------------------------------------------------------

export interface EligibleInstructorContext {
  instructorId: string;
  instructorName: string;
  groupId: string;
  groupName: string;
  programId: string;
  programTitle: string;
  termId: string;
  cohortName: string;
  enrollmentId: string;
}

export interface EligibleTraineeContext {
  traineeId: string;
  traineeName: string;
  traineeEmail?: string;
  groupId: string;
  groupName: string;
  programId: string;
  programTitle: string;
  termId: string;
  cohortName: string;
  enrollmentId: string;
}

/**
 * Kursiyerin mesajlaşabileceği yetkili eğitmen listesini döndürür.
 * Yalnızca kursiyerin aktif olarak atandığı grupların atanmış eğitmenleri listelenir.
 */
export const getEligibleInstructorsForTrainee = (traineeId: string): EligibleInstructorContext[] => {
  const isDemoTrainee =
    traineeId === 'usr-trainee' ||
    traineeId === 'user-trainee-01' ||
    traineeId.includes('trainee') ||
    traineeId.includes('ahmet');

  const assignments = getStoredAssignments().filter(
    (a: GroupAssignment) =>
      (a.candidateId === traineeId || (isDemoTrainee && (a.candidateId === 'usr-trainee' || a.candidateId === 'user-trainee-01'))) &&
      a.status === 'active'
  );
  const groups = getStoredGroups();
  const eligible: EligibleInstructorContext[] = [];

  for (const asgn of assignments) {
    const group = groups.find((g) => g.id === asgn.groupId && g.status === 'active');
    if (!group) continue;

    for (let i = 0; i < group.instructorIds.length; i++) {
      const instId = group.instructorIds[i];
      const instName = group.instructorNames[i] || 'Eğitmen';

      // Duplicate prevention for same instructor & group
      if (!eligible.some((e) => e.instructorId === instId && e.groupId === group.id)) {
        eligible.push({
          instructorId: instId,
          instructorName: instName,
          groupId: group.id,
          groupName: group.name,
          programId: group.programId,
          programTitle: group.programTitle,
          termId: group.termId,
          cohortName: group.cohortName,
          enrollmentId: asgn.enrollmentId,
        });
      }
    }
  }

  return eligible;
};

/**
 * Eğitmenin mesajlaşabileceği yetkili kursiyer listesini döndürür.
 * Yalnızca eğitmenin atandığı gruplardaki aktif kursiyerler listelenir.
 */
export const getEligibleTraineesForInstructor = (instructorId: string): EligibleTraineeContext[] => {
  const isDemoInstructor =
    instructorId === 'usr-instructor' ||
    instructorId === 'user-instructor-01' ||
    instructorId.includes('instructor') ||
    instructorId.includes('mehmet');

  const groups = getStoredGroups().filter(
    (g) =>
      g.status === 'active' &&
      (g.instructorIds.includes(instructorId) || (isDemoInstructor && g.instructorIds.some((id) => id === 'usr-instructor' || id === 'user-instructor-01')))
  );
  const assignments = getStoredAssignments().filter((a: GroupAssignment) => a.status === 'active');
  const eligible: EligibleTraineeContext[] = [];

  for (const grp of groups) {
    const groupAssignments = assignments.filter((a: GroupAssignment) => a.groupId === grp.id);
    for (const asgn of groupAssignments) {
      if (!eligible.some((e) => e.traineeId === asgn.candidateId && e.groupId === grp.id)) {
        eligible.push({
          traineeId: asgn.candidateId,
          traineeName: asgn.candidateName,
          traineeEmail: asgn.candidateEmail,
          groupId: grp.id,
          groupName: grp.name,
          programId: grp.programId,
          programTitle: grp.programTitle,
          termId: grp.termId,
          cohortName: grp.cohortName,
          enrollmentId: asgn.enrollmentId,
        });
      }
    }
  }

  return eligible;
};

/**
 * İki kullanıcı arasında belirli bir grup bağlamında mesajlaşma yetkisi olup olmadığını doğrular.
 */
export const validateMessagingPermission = (
  traineeId: string,
  instructorId: string,
  groupId: string
): { allowed: boolean; reason?: string } => {
  const groups = getStoredGroups();
  const group = groups.find((g) => g.id === groupId);

  if (!group || group.status !== 'active') {
    return { allowed: false, reason: 'Eğitim grubu aktif değil veya bulunamadı.' };
  }

  if (!group.instructorIds.includes(instructorId)) {
    return { allowed: false, reason: 'Eğitmen bu gruba atanmamış.' };
  }

  const assignments = getStoredAssignments();
  const traineeAssignment = assignments.find(
    (a: GroupAssignment) => a.candidateId === traineeId && a.groupId === groupId && a.status === 'active'
  );

  if (!traineeAssignment) {
    return { allowed: false, reason: 'Kursiyerin bu grupta aktif bir grup ataması bulunmuyor.' };
  }

  const enrollments = getStoredEnrollments();
  const enrollment = enrollments.find((e) => e.id === traineeAssignment.enrollmentId);

  if (enrollment && enrollment.status === 'cancelled') {
    return { allowed: false, reason: 'Kursiyerin kesin kaydı iptal edilmiş, mesajlaşma askıya alındı.' };
  }

  return { allowed: true };
};

// -----------------------------------------------------------------------------
// CONVERSATION CRUD
// -----------------------------------------------------------------------------

/**
 * Kursiyer ve eğitmen arasındaki konuşmayı getirir veya yoksa oluşturur.
 */
export const getOrCreateConversation = (
  traineeId: string,
  traineeName: string,
  instructorId: string,
  instructorName: string,
  groupId: string
): { conversation?: Conversation; error?: string } => {
  const perm = validateMessagingPermission(traineeId, instructorId, groupId);
  if (!perm.allowed) {
    return { error: perm.reason || 'Mesajlaşma yetkisi doğrulanamadı.' };
  }

  const conversations = getStoredConversations();
  const existing = conversations.find(
    (c) => c.traineeId === traineeId && c.instructorId === instructorId && c.groupId === groupId
  );

  if (existing) {
    return { conversation: existing };
  }

  const group = getStoredGroups().find((g) => g.id === groupId);
  const assignments = getStoredAssignments();
  const asgn = assignments.find((a: GroupAssignment) => a.candidateId === traineeId && a.groupId === groupId);

  const newConv: Conversation = {
    id: `conv-${traineeId}-${instructorId}-${groupId}`,
    traineeId,
    traineeName,
    instructorId,
    instructorName,
    enrollmentId: asgn?.enrollmentId || 'enr-unknown',
    groupId,
    groupName: group?.name || 'Grup',
    programId: group?.programId || 'prog-unknown',
    programTitle: group?.programTitle || 'Eğitim Programı',
    termId: group?.termId || 'term-unknown',
    cohortName: group?.cohortName || 'Dönem',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    unreadCountTrainee: 0,
    unreadCountInstructor: 0,
  };

  conversations.push(newConv);
  saveConversationsToStorage(conversations);

  return { conversation: newConv };
};

/**
 * Belirli bir kullanıcının (kursiyer veya eğitmen) erişebileceği konuşmaları filtreler.
 */
export const getConversationsForUser = (
  userId: string,
  role: 'trainee' | 'instructor'
): Conversation[] => {
  const conversations = getStoredConversations();

  if (role === 'trainee') {
    const isDemoTrainee =
      userId === 'usr-trainee' ||
      userId === 'user-trainee-01' ||
      userId.includes('trainee') ||
      userId.includes('ahmet');

    return conversations
      .filter(
        (c) =>
          c.traineeId === userId ||
          (isDemoTrainee && (c.traineeId === 'usr-trainee' || c.traineeId === 'user-trainee-01'))
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } else if (role === 'instructor') {
    const isDemoInstructor =
      userId === 'usr-instructor' ||
      userId === 'user-instructor-01' ||
      userId.includes('instructor') ||
      userId.includes('mehmet');

    return conversations
      .filter(
        (c) =>
          c.instructorId === userId ||
          (isDemoInstructor && (c.instructorId === 'usr-instructor' || c.instructorId === 'user-instructor-01'))
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  return [];
};

/**
 * Konuşmanın mesaj geçmişini döner. Yetkisiz erişim kontrolü yapar.
 */
export const getMessagesForConversation = (
  conversationId: string,
  requestingUserId: string
): { messages: DirectMessage[]; error?: string } => {
  const conversations = getStoredConversations();
  const conv = conversations.find((c) => c.id === conversationId);

  if (!conv) {
    return { messages: [], error: 'Konuşma bulunamadı.' };
  }

  const isDemoTrainee = (id: string) => id === 'usr-trainee' || id === 'user-trainee-01' || id.includes('trainee') || id.includes('ahmet');
  const isDemoInstructor = (id: string) => id === 'usr-instructor' || id === 'user-instructor-01' || id.includes('instructor') || id.includes('mehmet');

  const isTraineeMatch = conv.traineeId === requestingUserId || (isDemoTrainee(conv.traineeId) && isDemoTrainee(requestingUserId));
  const isInstructorMatch = conv.instructorId === requestingUserId || (isDemoInstructor(conv.instructorId) && isDemoInstructor(requestingUserId));

  // Mahremiyet Kuralı: Yalnızca konuşmanın tarafları okuyabilir
  if (!isTraineeMatch && !isInstructorMatch) {
    return { messages: [], error: 'Bu konuşmaya erişim yetkiniz bulunmamaktadır.' };
  }

  const allMessages = getStoredDirectMessages();
  const filtered = allMessages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return { messages: filtered };
};

/**
 * Doğrulanmış bir konuşmaya yeni mesaj ekler.
 */
export const sendDirectMessage = (params: {
  conversationId: string;
  senderId: string;
  senderRole: 'trainee' | 'instructor';
  senderName: string;
  body: string;
  replyTo?: DirectMessage['replyTo'];
}): { success: boolean; message?: DirectMessage; error?: string } => {
  const { conversationId, senderId, senderRole, senderName, body, replyTo } = params;

  // Boş ve uzunluk doğrulaması
  const trimmed = body ? body.trim() : '';
  if (!trimmed) {
    return { success: false, error: 'Boş mesaj gönderilemez.' };
  }

  if (trimmed.length > 2000) {
    return { success: false, error: 'Mesaj metni en fazla 2000 karakter olabilir.' };
  }

  const conversations = getStoredConversations();
  const convIndex = conversations.findIndex((c) => c.id === conversationId);
  if (convIndex === -1) {
    return { success: false, error: 'İlgili konuşma bulunamadı.' };
  }

  const conv = conversations[convIndex];

  const isDemoTrainee = (id: string) => id === 'usr-trainee' || id === 'user-trainee-01' || id.includes('trainee') || id.includes('ahmet');
  const isDemoInstructor = (id: string) => id === 'usr-instructor' || id === 'user-instructor-01' || id.includes('instructor') || id.includes('mehmet');

  const isTraineeMatch = conv.traineeId === senderId || (isDemoTrainee(conv.traineeId) && isDemoTrainee(senderId));
  const isInstructorMatch = conv.instructorId === senderId || (isDemoInstructor(conv.instructorId) && isDemoInstructor(senderId));

  // Taraflık kontrolü
  if (!isTraineeMatch && !isInstructorMatch) {
    return { success: false, error: 'Bu konuşmaya mesaj gönderme yetkiniz yok.' };
  }

  // Askıya alınmış veya kesin kaydı iptal edilmiş mi?
  if (conv.status === 'suspended') {
    return { success: false, error: 'Bu konuşma askıya alınmıştır. Yeni mesaj gönderilemez.' };
  }

  // Güncel atama ve kayıt durumu denetimi
  const perm = validateMessagingPermission(conv.traineeId, conv.instructorId, conv.groupId);
  if (!perm.allowed) {
    return { success: false, error: perm.reason || 'Aktif mesajlaşma izniniz bulunmuyor.' };
  }

  const now = new Date().toISOString();
  const newMsg: DirectMessage = {
    id: `dm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    conversationId,
    senderId,
    senderRole,
    senderName,
    body: trimmed,
    createdAt: now,
    status: 'saved_locally', // Dürüst Demo: "Yerel Demoya Kaydedildi"
    replyTo: replyTo || undefined,
  };

  const messages = getStoredDirectMessages();
  messages.push(newMsg);
  saveDirectMessagesToStorage(messages);

  // Konuşmayı güncelle
  conv.updatedAt = now;
  conv.lastMessageAt = now;
  conv.lastMessagePreview = trimmed.length > 60 ? trimmed.substring(0, 57) + '...' : trimmed;

  if (senderRole === 'trainee') {
    conv.unreadCountInstructor = (conv.unreadCountInstructor || 0) + 1;
  } else {
    conv.unreadCountTrainee = (conv.unreadCountTrainee || 0) + 1;
  }

  conversations[convIndex] = conv;
  saveConversationsToStorage(conversations);

  // Bildirim tetikle (Non-blocking - Mahremiyet Korumalı)
  try {
    notifyDirectMessageReceived(conv, newMsg);
  } catch (err) {
    console.warn('Mesaj bildirimi tetiklenirken hata:', err);
  }

  return { success: true, message: newMsg };
};

/**
 * Birebir mesajı düzenler.
 */
export const editDirectMessage = (
  messageId: string,
  newBody: string,
  editorUserId: string
): { success: boolean; message?: DirectMessage; error?: string } => {
  const trimmed = newBody ? newBody.trim() : '';
  if (!trimmed) {
    return { success: false, error: 'Mesaj metni boş bırakılamaz.' };
  }

  const messages = getStoredDirectMessages();
  const idx = messages.findIndex((m) => m.id === messageId);
  if (idx === -1) {
    return { success: false, error: 'Düzenlenecek mesaj bulunamadı.' };
  }

  const msg = messages[idx];
  if (msg.senderId !== editorUserId && !editorUserId.includes(msg.senderRole)) {
    return { success: false, error: 'Yalnızca kendi iletinizi düzenleyebilirsiniz.' };
  }

  msg.body = trimmed;
  msg.isEdited = true;
  msg.editedAt = new Date().toISOString();

  saveDirectMessagesToStorage(messages);
  return { success: true, message: msg };
};

/**
 * Birebir mesajı siler (Soft delete).
 */
export const deleteDirectMessage = (
  messageId: string,
  deletedByUserId: string
): { success: boolean; error?: string } => {
  const messages = getStoredDirectMessages();
  const idx = messages.findIndex((m) => m.id === messageId);
  if (idx === -1) {
    return { success: false, error: 'Silinecek mesaj bulunamadı.' };
  }

  const msg = messages[idx];
  if (msg.senderId !== deletedByUserId && !deletedByUserId.includes(msg.senderRole)) {
    return { success: false, error: 'Yalnızca kendi iletinizi silebilirsiniz.' };
  }

  msg.isDeleted = true;
  msg.deletedAt = new Date().toISOString();
  msg.body = 'Bu mesaj silindi.';

  saveDirectMessagesToStorage(messages);
  return { success: true };
};

/**
 * Birebir mesaja ifade (emoji reaction) ekler veya kaldırır.
 */
export const toggleDirectMessageReaction = (
  messageId: string,
  emoji: string,
  userId: string
): { success: boolean; reactions?: Record<string, string[]>; error?: string } => {
  const messages = getStoredDirectMessages();
  const idx = messages.findIndex((m) => m.id === messageId);
  if (idx === -1) {
    return { success: false, error: 'Mesaj bulunamadı.' };
  }

  const msg = messages[idx];
  if (msg.isDeleted) {
    return { success: false, error: 'Silinmiş mesaja ifade bırakılamaz.' };
  }

  if (!msg.reactions) {
    msg.reactions = {};
  }

  const currentUsers = msg.reactions[emoji] || [];
  if (currentUsers.includes(userId)) {
    msg.reactions[emoji] = currentUsers.filter((u) => u !== userId);
    if (msg.reactions[emoji].length === 0) {
      delete msg.reactions[emoji];
    }
  } else {
    msg.reactions[emoji] = [...currentUsers, userId];
  }

  saveDirectMessagesToStorage(messages);
  return { success: true, reactions: msg.reactions };
};

/**
 * Konuşmayı okundu olarak işaretler (Unread sayısını sıfırlar, demo readAt bilgisini günceller).
 */
export const markConversationAsRead = (
  conversationId: string,
  readerId: string,
  readerRole: 'trainee' | 'instructor'
): void => {
  const conversations = getStoredConversations();
  const convIndex = conversations.findIndex((c) => c.id === conversationId);
  if (convIndex === -1) return;

  const conv = conversations[convIndex];
  if (conv.traineeId !== readerId && conv.instructorId !== readerId) return;

  let changed = false;
  if (readerRole === 'trainee' && conv.unreadCountTrainee > 0) {
    conv.unreadCountTrainee = 0;
    changed = true;
  } else if (readerRole === 'instructor' && conv.unreadCountInstructor > 0) {
    conv.unreadCountInstructor = 0;
    changed = true;
  }

  if (changed) {
    conversations[convIndex] = conv;
    saveConversationsToStorage(conversations);
  }

  // Karşı tarafın mesajlarına okundu zamanı ekle
  const messages = getStoredDirectMessages();
  let msgsChanged = false;
  const now = new Date().toISOString();

  for (const m of messages) {
    if (m.conversationId === conversationId && m.senderId !== readerId && !m.readAt) {
      m.readAt = now;
      msgsChanged = true;
    }
  }

  if (msgsChanged) {
    saveDirectMessagesToStorage(messages);
  }
};

/**
 * Grup transferi veya kayıt iptalinde konuşma durumunu günceller.
 */
export const updateConversationStatusOnTransferOrCancel = (
  traineeId: string,
  groupId: string,
  newStatus: 'archived' | 'suspended'
): void => {
  const conversations = getStoredConversations();
  let changed = false;

  for (const c of conversations) {
    if (c.traineeId === traineeId && c.groupId === groupId) {
      c.status = newStatus;
      c.updatedAt = new Date().toISOString();
      changed = true;
    }
  }

  if (changed) {
    saveConversationsToStorage(conversations);
  }
};

/**
 * Demo verilerini sıfırlar.
 */
export const resetMessageStorage = (): void => {
  localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(INITIAL_CONVERSATIONS));
  localStorage.setItem(DIRECT_MESSAGES_STORAGE_KEY, JSON.stringify(INITIAL_DIRECT_MESSAGES));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONVERSATIONS_UPDATE_EVENT, { detail: INITIAL_CONVERSATIONS }));
    window.dispatchEvent(new CustomEvent(MESSAGES_UPDATE_EVENT, { detail: INITIAL_DIRECT_MESSAGES }));
  }
};
