/**
 * Group Communication Channels Storage & Integrity Service (Sprint E04-A)
 * Sınıf/Grup Kanalları — Duyuru ve Tartışma Motoru.
 *
 * Temel Kurallar:
 * 1. Kanallar Program > Dönem > Grup modeline kesin olarak bağlıdır.
 * 2. Duyuru Kanalı (Announcement): Eğitmen resmi duyuru yayınlar, kursiyer okur; kursiyer mesaj yazamaz.
 * 3. Tartışma Kanalı (Discussion): Grup kursiyerleri ve atanmış eğitmenler katılabilir.
 * 4. Grup dışındaki kullanıcılar kanal kimliğini bilseler dahi mesajlara ve kanala erişemez.
 * 5. Grup transferinde eski kanal geçmişi korunur (arşiv/salt okunur); yeni gruba üyelik açılır.
 * 6. Kesin kaydı iptal edilen kursiyerin aktif kanallara mesaj gönderme yetkisi kaldırılır.
 * 7. Yönetici kanalları idari olarak açıp kapatabilir, ancak özel birebir mesajları denetleme yetkisi almaz.
 */

import {
  Channel,
  ChannelMembership,
  ChannelMessage,
  ChannelType,
  ConversationParticipantRole,
  GroupAssignment,
} from '../types';
import {
  getStoredGroups,
  getStoredAssignments,
} from './enrollmentStorage';
import { notifyChannelAnnouncement } from './notificationEngine';

const CHANNELS_STORAGE_KEY = 'islahiye_education_channels_v1';
const CHANNEL_MEMBERSHIPS_STORAGE_KEY = 'islahiye_education_channel_memberships_v1';
const CHANNEL_MESSAGES_STORAGE_KEY = 'islahiye_education_channel_messages_v1';

export const CHANNELS_UPDATE_EVENT = 'islahiye_channels_updated';
export const CHANNEL_MESSAGES_UPDATE_EVENT = 'islahiye_channel_messages_updated';

// -----------------------------------------------------------------------------
// SEED CHANNELS & INITIAL MESSAGES
// -----------------------------------------------------------------------------

export const INITIAL_CHANNELS: Channel[] = [
  // Grup 01 (İslahiye Biberi - Grup A) Kanalları
  {
    id: 'chan-grp01-announcements',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-01',
    groupName: 'Grup A (Hafta İçi Öğleden Sonra)',
    type: 'announcement',
    name: 'Grup A — Resmi Ders Duyuruları',
    description: 'Eğitmen Murat Özkan tarafından paylaşılan ders programı, saha ziyareti ve ödev duyuruları.',
    status: 'active',
    createdAt: '2026-10-10T08:00:00.000Z',
    createdBy: 'user-instructor-01',
    pinnedMessageId: 'cmsg-grp01-ann-01',
  },
  {
    id: 'chan-grp01-discussion',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-01',
    groupName: 'Grup A (Hafta İçi Öğleden Sonra)',
    type: 'discussion',
    name: 'Grup A — Sınıf İçi Soru & Tartışma',
    description: 'E-ticaret pazaryerleri, ürün fotoğrafçılığı ve paketleme süreçlerinde grup içi bilgi paylaşımı.',
    status: 'active',
    createdAt: '2026-10-10T08:30:00.000Z',
    createdBy: 'user-instructor-01',
  },
  // Grup 02 (Dış Ticaret - Grup B) Kanalları
  {
    id: 'chan-grp02-announcements',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-02',
    groupName: 'Grup B (Hafta Sonu)',
    type: 'announcement',
    name: 'Grup B — İhracat Ders Duyuruları',
    description: 'Eğitmen Kemal Aksoy tarafından yayımlanan resmi duyuru kanalı.',
    status: 'active',
    createdAt: '2026-10-10T09:00:00.000Z',
    createdBy: 'user-instructor-02',
  },
  {
    id: 'chan-grp02-discussion',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-02',
    groupName: 'Grup B (Hafta Sonu)',
    type: 'discussion',
    name: 'Grup B — İhracat Mevzuatı Tartışma',
    description: 'Gümrük mevzuatı ve akreditif işlemleri üzerine grup çalışma alanı.',
    status: 'active',
    createdAt: '2026-10-10T09:15:00.000Z',
    createdBy: 'user-instructor-02',
  },
];

export const INITIAL_CHANNEL_MEMBERSHIPS: ChannelMembership[] = [
  // grp-01 Duyuru Kanalı Üyeleri
  {
    id: 'cmem-01',
    channelId: 'chan-grp01-announcements',
    participantId: 'user-instructor-01',
    participantName: 'Murat Özkan',
    role: 'instructor',
    status: 'active',
    joinedAt: '2026-10-10T08:00:00.000Z',
  },
  {
    id: 'cmem-02',
    channelId: 'chan-grp01-announcements',
    participantId: 'user-trainee-01',
    participantName: 'Ayşe Demir',
    role: 'trainee',
    status: 'active',
    joinedAt: '2026-10-10T08:05:00.000Z',
  },
  // grp-01 Tartışma Kanalı Üyeleri
  {
    id: 'cmem-03',
    channelId: 'chan-grp01-discussion',
    participantId: 'user-instructor-01',
    participantName: 'Murat Özkan',
    role: 'instructor',
    status: 'active',
    joinedAt: '2026-10-10T08:30:00.000Z',
  },
  {
    id: 'cmem-04',
    channelId: 'chan-grp01-discussion',
    participantId: 'user-trainee-01',
    participantName: 'Ayşe Demir',
    role: 'trainee',
    status: 'active',
    joinedAt: '2026-10-10T08:35:00.000Z',
  },
  // grp-02 Üyeleri
  {
    id: 'cmem-05',
    channelId: 'chan-grp02-announcements',
    participantId: 'user-instructor-02',
    participantName: 'Kemal Aksoy',
    role: 'instructor',
    status: 'active',
    joinedAt: '2026-10-10T09:00:00.000Z',
  },
];

export const INITIAL_CHANNEL_MESSAGES: ChannelMessage[] = [
  {
    id: 'cmsg-grp01-ann-01',
    channelId: 'chan-grp01-announcements',
    senderId: 'user-instructor-01',
    senderName: 'Murat Özkan',
    senderRole: 'instructor',
    title: 'Dönem Başlangıcı ve Seminer Salonu Bilgilendirmesi',
    content:
      'Değerli kursiyerlerimiz, İslahiye Biberi & Tarımsal E-Ticaret programımızın ilk yüz yüze oturumu 13 Ekim Salı günü Seminer Salonu B salonunda gerçekleştirilecektir. Katılımcıların yanlarında taşınabilir bilgisayar veya tablet getirmeleri rica olunur.',
    isPinned: true,
    createdAt: '2026-10-10T09:00:00.000Z',
    status: 'saved_locally',
  },
  {
    id: 'cmsg-grp01-ann-02',
    channelId: 'chan-grp01-announcements',
    senderId: 'user-instructor-01',
    senderName: 'Murat Özkan',
    senderRole: 'instructor',
    title: '2. Hafta Ödev Teslim Hatırlatması',
    content:
      'E-ticaret lojistik ve coğrafi işaretli ambalaj analizi ödev taslaklarınızı Cuma gününe kadar ilgili ödev masası üzerinden yükleyebilirsiniz. Sistem üzerinden gecikme politikası kuralları geçerlidir.',
    isPinned: false,
    createdAt: '2026-10-14T14:00:00.000Z',
    status: 'saved_locally',
  },
  {
    id: 'cmsg-grp01-disc-01',
    channelId: 'chan-grp01-discussion',
    senderId: 'user-trainee-01',
    senderName: 'Ayşe Demir',
    senderRole: 'trainee',
    content: 'Trendyol satıcı panelinde kooperatif adına mağaza açarken çiftçi kayıt belgesi yüklemek gerekiyor mu?',
    createdAt: '2026-10-14T15:20:00.000Z',
    status: 'saved_locally',
  },
  {
    id: 'cmsg-grp01-disc-02',
    channelId: 'chan-grp01-discussion',
    senderId: 'user-instructor-01',
    senderName: 'Murat Özkan',
    senderRole: 'instructor',
    content:
      'Evet Ayşe Hanım, vergi levhası ve imza sirkülerine ek olarak tarımsal üretici teyidi için ÇKS (Çiftçi Kayıt Sistemi) belgesi veya oda faaliyet belgesi yüklenmesi gerekmektedir.',
    createdAt: '2026-10-14T15:45:00.000Z',
    status: 'saved_locally',
  },
];

// -----------------------------------------------------------------------------
// STORAGE HELPERS
// -----------------------------------------------------------------------------

export const getStoredChannels = (): Channel[] => {
  try {
    const raw = localStorage.getItem(CHANNELS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CHANNELS_STORAGE_KEY, JSON.stringify(INITIAL_CHANNELS));
      return INITIAL_CHANNELS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_CHANNELS;
  } catch (err) {
    console.error('Channels read error:', err);
    return INITIAL_CHANNELS;
  }
};

const saveChannelsToStorage = (channels: Channel[]): void => {
  try {
    localStorage.setItem(CHANNELS_STORAGE_KEY, JSON.stringify(channels));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CHANNELS_UPDATE_EVENT, { detail: channels }));
    }
  } catch (err) {
    console.error('Channels write error:', err);
  }
};

export const getStoredChannelMemberships = (): ChannelMembership[] => {
  try {
    const raw = localStorage.getItem(CHANNEL_MEMBERSHIPS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CHANNEL_MEMBERSHIPS_STORAGE_KEY, JSON.stringify(INITIAL_CHANNEL_MEMBERSHIPS));
      return INITIAL_CHANNEL_MEMBERSHIPS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_CHANNEL_MEMBERSHIPS;
  } catch (err) {
    console.error('Memberships read error:', err);
    return INITIAL_CHANNEL_MEMBERSHIPS;
  }
};

const saveChannelMembershipsToStorage = (memberships: ChannelMembership[]): void => {
  try {
    localStorage.setItem(CHANNEL_MEMBERSHIPS_STORAGE_KEY, JSON.stringify(memberships));
  } catch (err) {
    console.error('Memberships write error:', err);
  }
};

export const getStoredChannelMessages = (): ChannelMessage[] => {
  try {
    const raw = localStorage.getItem(CHANNEL_MESSAGES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CHANNEL_MESSAGES_STORAGE_KEY, JSON.stringify(INITIAL_CHANNEL_MESSAGES));
      return INITIAL_CHANNEL_MESSAGES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_CHANNEL_MESSAGES;
  } catch (err) {
    console.error('Channel messages read error:', err);
    return INITIAL_CHANNEL_MESSAGES;
  }
};

const saveChannelMessagesToStorage = (messages: ChannelMessage[]): void => {
  try {
    localStorage.setItem(CHANNEL_MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CHANNEL_MESSAGES_UPDATE_EVENT, { detail: messages }));
    }
  } catch (err) {
    console.error('Channel messages write error:', err);
  }
};

// -----------------------------------------------------------------------------
// CHANNEL ACCESS & MEMBERSHIP RULES
// -----------------------------------------------------------------------------

/**
 * Kullanıcının belirli bir kanala erişim (okuma) ve yazma yetkilerini denetler.
 */
export const checkChannelAccess = (
  channelId: string,
  userId: string,
  userRole: ConversationParticipantRole
): { canView: boolean; canPost: boolean; reason?: string } => {
  // Admin kanalları idari olarak inceleyebilir
  if (userRole === 'admin') {
    return { canView: true, canPost: true };
  }

  const channel = getStoredChannels().find((c) => c.id === channelId);
  if (!channel) {
    return { canView: false, canPost: false, reason: 'Kanal bulunamadı.' };
  }

  const group = getStoredGroups().find((g) => g.id === channel.groupId);
  if (!group || group.status !== 'active') {
    return { canView: false, canPost: false, reason: 'İlgili eğitim grubu aktif değil.' };
  }

  if (channel.status === 'closed') {
    return { canView: true, canPost: false, reason: 'Bu kanal yönetici tarafından kapatılmıştır. Yalnızca salt-okunurdur.' };
  }

  // Eğitmen yetki kontrolü
  if (userRole === 'instructor') {
    if (group.instructorIds.includes(userId)) {
      return { canView: true, canPost: true };
    }
    return { canView: false, canPost: false, reason: 'Bu gruba atanmış eğitmen değilsiniz.' };
  }

  // Kursiyer yetki kontrolü
  if (userRole === 'trainee') {
    const assignments = getStoredAssignments();
    const asgn = assignments.find((a: GroupAssignment) => a.candidateId === userId && a.groupId === channel.groupId);

    if (!asgn) {
      return { canView: false, canPost: false, reason: 'Bu grubun kayıtlı kursiyeri değilsiniz.' };
    }

    if (asgn.status === 'transferred') {
      // Transfer edilen kursiyer eski kanalları salt okunur arşiv olarak görebilir
      return { canView: true, canPost: false, reason: 'Başka gruba transfer edildiğiniz için bu kanala yeni mesaj gönderemezsiniz.' };
    }

    if (asgn.status === 'removed') {
      return { canView: false, canPost: false, reason: 'Grup kaydınız sonlandırıldığı için kanal erişiminiz durdurulmuştur.' };
    }

    // Duyuru kanalı kuralı: Kursiyer duyuru kanalına mesaj YAZAMAZ
    if (channel.type === 'announcement') {
      return { canView: true, canPost: false, reason: 'Duyuru kanalına yalnızca yetkili eğitmenler duyuru yayımlayabilir.' };
    }

    // Tartışma kanalı: Aktif kursiyer mesaj yazabilir
    return { canView: true, canPost: true };
  }

  return { canView: false, canPost: false, reason: 'Geçersiz rol.' };
};

/**
 * Kullanıcının dahil olduğu (veya eğitmenin atandığı) kanalları listeler.
 */
export const getChannelsForUser = (
  userId: string,
  userRole: ConversationParticipantRole
): Channel[] => {
  const allChannels = getStoredChannels();

  if (userRole === 'admin') {
    return allChannels;
  }

  if (userRole === 'instructor') {
    const groups = getStoredGroups().filter((g) => g.instructorIds.includes(userId));
    const groupIds = groups.map((g) => g.id);
    return allChannels.filter((c) => groupIds.includes(c.groupId));
  }

  if (userRole === 'trainee') {
    const assignments = getStoredAssignments().filter(
      (a: GroupAssignment) => a.candidateId === userId && (a.status === 'active' || a.status === 'transferred')
    );
    const groupIds = assignments.map((a: GroupAssignment) => a.groupId);
    const memberships = getStoredChannelMemberships().filter(
      (m) => m.participantId === userId && (m.status === 'active' || m.status === 'transferred')
    );
    const memberChannelIds = memberships.map((m) => m.channelId);

    return allChannels.filter(
      (c) => groupIds.includes(c.groupId) || memberChannelIds.includes(c.id)
    );
  }

  return [];
};

/**
 * Belirli bir grubun tüm kanallarını döndürür.
 */
export const getChannelsByGroup = (groupId: string): Channel[] => {
  return getStoredChannels().filter((c) => c.groupId === groupId);
};

/**
 * Kanalın mesajlarını güvenli bir şekilde döner.
 */
export const getMessagesForChannel = (
  channelId: string,
  userId: string,
  userRole: ConversationParticipantRole
): { messages: ChannelMessage[]; error?: string } => {
  const access = checkChannelAccess(channelId, userId, userRole);
  if (!access.canView) {
    return { messages: [], error: access.reason || 'Bu kanalın mesajlarını görme yetkiniz yok.' };
  }

  const allMessages = getStoredChannelMessages();
  const channelMsgs = allMessages
    .filter((m) => m.channelId === channelId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return { messages: channelMsgs };
};

/**
 * Kanala yeni mesaj veya duyuru gönderir.
 */
export const sendChannelMessage = (params: {
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: ConversationParticipantRole;
  title?: string;
  content: string;
  isPinned?: boolean;
}): { success: boolean; message?: ChannelMessage; error?: string } => {
  const { channelId, senderId, senderName, senderRole, title, content, isPinned } = params;

  const access = checkChannelAccess(channelId, senderId, senderRole);
  if (!access.canPost) {
    return { success: false, error: access.reason || 'Bu kanala mesaj gönderme yetkiniz bulunmuyor.' };
  }

  const trimmed = content ? content.trim() : '';
  if (!trimmed) {
    return { success: false, error: 'Boş mesaj veya duyuru gönderilemez.' };
  }

  if (trimmed.length > 3000) {
    return { success: false, error: 'Mesaj metni en fazla 3000 karakter olabilir.' };
  }

  const channel = getStoredChannels().find((c) => c.id === channelId);
  if (channel?.type === 'announcement' && (!title || !title.trim())) {
    return { success: false, error: 'Duyuru mesajı için bir başlık girilmesi zorunludur.' };
  }

  const now = new Date().toISOString();
  const newMsg: ChannelMessage = {
    id: `cmsg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    channelId,
    senderId,
    senderName,
    senderRole,
    title: title ? title.trim() : undefined,
    content: trimmed,
    isPinned: Boolean(isPinned),
    createdAt: now,
    status: 'saved_locally',
  };

  const messages = getStoredChannelMessages();
  messages.push(newMsg);
  saveChannelMessagesToStorage(messages);

  // Pinleme durumu varsa kanala ata
  if (isPinned && channel) {
    channel.pinnedMessageId = newMsg.id;
    const channels = getStoredChannels();
    const idx = channels.findIndex((c) => c.id === channelId);
    if (idx !== -1) {
      channels[idx] = channel;
      saveChannelsToStorage(channels);
    }
  }

  // Duyuru kanalı ise ilgili grup kursiyerlerine bildirim üret (Non-blocking)
  if (channel && channel.type === 'announcement') {
    try {
      const activeMembers = getStoredChannelMemberships()
        .filter((m) => m.channelId === channelId && m.status === 'active')
        .map((m) => m.participantId);
      notifyChannelAnnouncement(channel, newMsg, activeMembers);
    } catch (err) {
      console.warn('Grup duyurusu bildirimi tetiklenirken hata:', err);
    }
  }

  return { success: true, message: newMsg };
};

// -----------------------------------------------------------------------------
// ADMIN OPERATIONS & LIFECYCLE MANAGEMENT
// -----------------------------------------------------------------------------

/**
 * Yeni bir kanal oluşturur (Yönetici yetkisi).
 */
export const createChannel = (params: {
  programId: string;
  termId: string;
  groupId: string;
  type: ChannelType;
  name: string;
  description: string;
  createdBy: string;
}): { success: boolean; channel?: Channel; error?: string } => {
  const { programId, termId, groupId, type, name, description, createdBy } = params;

  if (!name.trim()) {
    return { success: false, error: 'Kanal adı boş bırakılamaz.' };
  }

  const group = getStoredGroups().find((g) => g.id === groupId);
  if (!group) {
    return { success: false, error: 'Bağlı eğitim grubu bulunamadı.' };
  }

  const channels = getStoredChannels();
  const newChan: Channel = {
    id: `chan-${groupId}-${type}-${Date.now().toString(36)}`,
    programId,
    programTitle: group.programTitle,
    termId,
    cohortName: group.cohortName,
    groupId,
    groupName: group.name,
    type,
    name: name.trim(),
    description: description ? description.trim() : '',
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy,
  };

  channels.push(newChan);
  saveChannelsToStorage(channels);

  // Mevcut grup kursiyerlerini ve eğitmenleri otomatik kanala üye yap
  syncChannelMembershipsForGroup(groupId);

  return { success: true, channel: newChan };
};

/**
 * Kanal durumunu açar veya kapatır (Aktif / Kapatıldı).
 */
export const toggleChannelStatus = (channelId: string): { success: boolean; channel?: Channel; error?: string } => {
  const channels = getStoredChannels();
  const idx = channels.findIndex((c) => c.id === channelId);
  if (idx === -1) {
    return { success: false, error: 'Kanal bulunamadı.' };
  }

  channels[idx].status = channels[idx].status === 'active' ? 'closed' : 'active';
  saveChannelsToStorage(channels);

  return { success: true, channel: channels[idx] };
};

/**
 * Bir grubun üyelerini o grubun tüm kanallarıyla senkronize eder.
 */
export const syncChannelMembershipsForGroup = (groupId: string): void => {
  const group = getStoredGroups().find((g) => g.id === groupId);
  if (!group) return;

  const channels = getStoredChannels().filter((c) => c.groupId === groupId);
  const assignments = getStoredAssignments().filter((a: GroupAssignment) => a.groupId === groupId);
  const memberships = getStoredChannelMemberships();

  for (const channel of channels) {
    // 1. Eğitmen üyeliği
    for (let i = 0; i < group.instructorIds.length; i++) {
      const instId = group.instructorIds[i];
      const instName = group.instructorNames[i] || 'Eğitmen';
      const exists = memberships.find((m) => m.channelId === channel.id && m.participantId === instId);
      if (!exists) {
        memberships.push({
          id: `cmem-${channel.id}-${instId}`,
          channelId: channel.id,
          participantId: instId,
          participantName: instName,
          role: 'instructor',
          status: 'active',
          joinedAt: new Date().toISOString(),
        });
      }
    }

    // 2. Kursiyer üyelikleri
    for (const asgn of assignments) {
      const exists = memberships.find((m) => m.channelId === channel.id && m.participantId === asgn.candidateId);
      if (!exists) {
        memberships.push({
          id: `cmem-${channel.id}-${asgn.candidateId}`,
          channelId: channel.id,
          participantId: asgn.candidateId,
          participantName: asgn.candidateName,
          role: 'trainee',
          status: asgn.status === 'active' ? 'active' : asgn.status === 'transferred' ? 'transferred' : 'cancelled',
          joinedAt: new Date().toISOString(),
        });
      } else {
        exists.status = asgn.status === 'active' ? 'active' : asgn.status === 'transferred' ? 'transferred' : 'cancelled';
      }
    }
  }

  saveChannelMembershipsToStorage(memberships);
};

/**
 * Grup transferi gerçekleştiğinde kursiyerin kanal üyeliklerini günceller.
 */
export const handleTraineeChannelTransfer = (
  traineeId: string,
  oldGroupId: string,
  newGroupId: string,
  traineeName = 'Kursiyer'
): void => {
  const memberships = getStoredChannelMemberships();
  const oldChannels = getStoredChannels().filter((c) => c.groupId === oldGroupId);

  // Eski kanallardaki üyelikleri 'transferred' yap (arşivleme)
  for (const oc of oldChannels) {
    const mem = memberships.find((m) => m.channelId === oc.id && m.participantId === traineeId);
    if (mem) {
      mem.status = 'transferred';
      mem.leftAt = new Date().toISOString();
    }
  }

  // Yeni grup kanallarına aktif üyelik ekle
  const newChannels = getStoredChannels().filter((c) => c.groupId === newGroupId);
  for (const nc of newChannels) {
    const exists = memberships.find((m) => m.channelId === nc.id && m.participantId === traineeId);
    if (!exists) {
      memberships.push({
        id: `cmem-${nc.id}-${traineeId}`,
        channelId: nc.id,
        participantId: traineeId,
        participantName: traineeName,
        role: 'trainee',
        status: 'active',
        joinedAt: new Date().toISOString(),
      });
    } else {
      exists.status = 'active';
      exists.leftAt = undefined;
    }
  }

  saveChannelMembershipsToStorage(memberships);
  syncChannelMembershipsForGroup(newGroupId);
};

/**
 * Demo verilerini başlangıç durumuna döndürür.
 */
export const resetChannelStorage = (): void => {
  localStorage.setItem(CHANNELS_STORAGE_KEY, JSON.stringify(INITIAL_CHANNELS));
  localStorage.setItem(CHANNEL_MEMBERSHIPS_STORAGE_KEY, JSON.stringify(INITIAL_CHANNEL_MEMBERSHIPS));
  localStorage.setItem(CHANNEL_MESSAGES_STORAGE_KEY, JSON.stringify(INITIAL_CHANNEL_MESSAGES));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CHANNELS_UPDATE_EVENT, { detail: INITIAL_CHANNELS }));
    window.dispatchEvent(new CustomEvent(CHANNEL_MESSAGES_UPDATE_EVENT, { detail: INITIAL_CHANNEL_MESSAGES }));
  }
};
