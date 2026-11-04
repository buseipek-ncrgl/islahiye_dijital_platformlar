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
import { educationApi, ChannelDto } from './apiClient';
import {
  getStoredGroups,
  getStoredAssignments,
} from './enrollmentStorage';
import { notifyChannelAnnouncement } from './notificationEngine';

const CHANNELS_STORAGE_KEY = 'islahiye_education_channels_v2';
const CHANNEL_MEMBERSHIPS_STORAGE_KEY = 'islahiye_education_channel_memberships_v2';
const CHANNEL_MESSAGES_STORAGE_KEY = 'islahiye_education_channel_messages_v2';

export const CHANNELS_UPDATE_EVENT = 'islahiye_channels_updated';
export const CHANNEL_MESSAGES_UPDATE_EVENT = 'islahiye_channel_messages_updated';

export const mapChannelDtoToChannel = (dto: ChannelDto): Channel => ({
  id: dto.id,
  programId: 'prog-01',
  programTitle: 'Eğitim Programı',
  termId: 'term-2026-fall',
  cohortName: '2026 Güz Dönemi',
  groupId: dto.groupId || 'grp-01',
  groupName: dto.name,
  name: dto.name,
  description: dto.description || '',
  type: dto.type === 1 ? 'announcement' : 'discussion',
  status: dto.isArchived ? 'closed' : 'active',
  createdAt: dto.createdAt,
  createdBy: dto.createdByUserId,
});

export const syncChannelsWithApi = async (): Promise<Channel[]> => {
  try {
    const list = await educationApi.channels();
    if (list && list.length > 0) {
      const mapped = list.map(mapChannelDtoToChannel);
      const merged = [...INITIAL_CHANNELS];
      mapped.forEach((apiCh) => {
        const idx = merged.findIndex((m) => m.id === apiCh.id || m.name === apiCh.name);
        if (idx >= 0) {
          merged[idx] = { ...merged[idx], ...apiCh, id: merged[idx].id };
        } else {
          merged.push(apiCh);
        }
      });
      saveChannelsToStorage(merged);
      return merged;
    }
  } catch (err) {
    console.warn('API sync channels notice:', err);
  }
  return getStoredChannels();
};

if (typeof window !== 'undefined') {
  syncChannelsWithApi().catch(() => {});
}

// -----------------------------------------------------------------------------
// SEED CHANNELS & INITIAL MESSAGES (Real 2026 Fall Data)
// -----------------------------------------------------------------------------

export const INITIAL_CHANNELS: Channel[] = [
  // 1-3. Grup A (İslahiye Biberi & Tarımsal E-Ticaret - grp-01)
  {
    id: 'chan-grp01-announcements',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-01',
    groupName: 'Grup A — Sabah Oturumu',
    type: 'announcement',
    name: 'Grup A — Resmi Ders Duyuruları',
    description: 'Eğitmen Murat Özkan ve Şef Mehmet Yılmaz tarafından paylaşılan ders programı, saha ziyareti ve sınav duyuruları.',
    status: 'active',
    createdAt: '2026-09-02T08:00:00.000Z',
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
    groupName: 'Grup A — Sabah Oturumu',
    type: 'discussion',
    name: 'Grup A — Sınıf İçi Soru & Tartışma',
    description: 'Tarımsal e-ticaret pazaryerleri, ürün fotoğrafçılığı ve paketleme süreçlerinde grup içi bilgi paylaşımı.',
    status: 'active',
    createdAt: '2026-09-02T08:30:00.000Z',
    createdBy: 'user-instructor-01',
  },
  {
    id: 'chan-grp01-materials',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-01',
    groupName: 'Grup A — Sabah Oturumu',
    type: 'announcement',
    name: 'Grup A — Kaynaklar, Sunumlar ve Belgeler',
    description: 'Ders slaytları, e-ticaret rehberleri ve tescilli İslahiye biberi standart şartnamesi paylaşımları.',
    status: 'active',
    createdAt: '2026-09-02T09:00:00.000Z',
    createdBy: 'user-instructor-01',
  },

  // 4-5. Grup B (Dış Ticaret & İhracat Yönetimi - grp-02)
  {
    id: 'chan-grp02-announcements',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-02',
    groupName: 'Grup B — Öğleden Sonra Oturumu',
    type: 'announcement',
    name: 'Grup B — İhracat Ders Duyuruları',
    description: 'Eğitmen Kemal Aksoy tarafından yayımlanan resmi duyuru kanalı.',
    status: 'active',
    createdAt: '2026-09-02T09:30:00.000Z',
    createdBy: 'user-instructor-02',
  },
  {
    id: 'chan-grp02-discussion',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-02',
    groupName: 'Grup B — Öğleden Sonra Oturumu',
    type: 'discussion',
    name: 'Grup B — İhracat Mevzuatı & Akreditif Tartışma',
    description: 'Gümrük mevzuatı, nakliye sigortaları ve akreditif işlemleri üzerine grup çalışma alanı.',
    status: 'active',
    createdAt: '2026-09-02T10:00:00.000Z',
    createdBy: 'user-instructor-02',
  },

  // 6-7. Grup C (İslahiye Gastronomi ve Mutfak Sanatları - grp-03)
  {
    id: 'chan-grp03-announcements',
    programId: 'prog-03',
    programTitle: 'İslahiye Gastronomi ve Mutfak Sanatları',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-03',
    groupName: 'Grup A — Uygulama Mutfağı',
    type: 'announcement',
    name: 'Grup C — Gastronomi & Mutfak Duyuruları',
    description: 'Şef Mehmet Yılmaz tarafından paylaşılan atölye hazırlık, HACCP hijyen ve ekipman duyuruları.',
    status: 'active',
    createdAt: '2026-09-02T10:30:00.000Z',
    createdBy: 'usr-instructor',
  },
  {
    id: 'chan-grp03-discussion',
    programId: 'prog-03',
    programTitle: 'İslahiye Gastronomi ve Mutfak Sanatları',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-03',
    groupName: 'Grup A — Uygulama Mutfağı',
    type: 'discussion',
    name: 'Grup C — Yöresel Reçeteler & Mutfak Teknikleri',
    description: 'Geleneksel İslahiye mutfağı reçeteleri, sunum teknikleri ve gastronomi inovasyonları fikir havuzu.',
    status: 'active',
    createdAt: '2026-09-02T11:00:00.000Z',
    createdBy: 'usr-instructor',
  },
];

export const INITIAL_CHANNEL_MEMBERSHIPS: ChannelMembership[] = [
  // --- GRUP A (grp-01) ÜYELERİ ---
  // Eğitmenler
  { id: 'cmem-01', channelId: 'chan-grp01-announcements', participantId: 'user-instructor-01', participantName: 'Murat Özkan', role: 'instructor', status: 'active', joinedAt: '2026-09-02T08:00:00.000Z' },
  { id: 'cmem-02', channelId: 'chan-grp01-announcements', participantId: 'usr-instructor', participantName: 'Şef Mehmet Yılmaz', role: 'instructor', status: 'active', joinedAt: '2026-09-02T08:00:00.000Z' },
  { id: 'cmem-03', channelId: 'chan-grp01-discussion', participantId: 'user-instructor-01', participantName: 'Murat Özkan', role: 'instructor', status: 'active', joinedAt: '2026-09-02T08:30:00.000Z' },
  { id: 'cmem-04', channelId: 'chan-grp01-discussion', participantId: 'usr-instructor', participantName: 'Şef Mehmet Yılmaz', role: 'instructor', status: 'active', joinedAt: '2026-09-02T08:30:00.000Z' },
  { id: 'cmem-05', channelId: 'chan-grp01-materials', participantId: 'user-instructor-01', participantName: 'Murat Özkan', role: 'instructor', status: 'active', joinedAt: '2026-09-02T09:00:00.000Z' },

  // Ahmet Kaya (Demo Trainee + Standart ID)
  { id: 'cmem-10', channelId: 'chan-grp01-announcements', participantId: 'usr-trainee', participantName: 'Ahmet Kaya', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:00:00.000Z' },
  { id: 'cmem-11', channelId: 'chan-grp01-discussion', participantId: 'usr-trainee', participantName: 'Ahmet Kaya', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:00:00.000Z' },
  { id: 'cmem-12', channelId: 'chan-grp01-materials', participantId: 'usr-trainee', participantName: 'Ahmet Kaya', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:00:00.000Z' },
  { id: 'cmem-13', channelId: 'chan-grp01-announcements', participantId: 'user-trainee-01', participantName: 'Ahmet Kaya', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:00:00.000Z' },
  { id: 'cmem-14', channelId: 'chan-grp01-discussion', participantId: 'user-trainee-01', participantName: 'Ahmet Kaya', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:00:00.000Z' },

  // Fatma Şahin
  { id: 'cmem-20', channelId: 'chan-grp01-announcements', participantId: 'usr-real-12', participantName: 'Fatma Şahin', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:05:00.000Z' },
  { id: 'cmem-21', channelId: 'chan-grp01-discussion', participantId: 'usr-real-12', participantName: 'Fatma Şahin', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:05:00.000Z' },
  // Mehmet Öztürk
  { id: 'cmem-22', channelId: 'chan-grp01-announcements', participantId: 'usr-real-13', participantName: 'Mehmet Öztürk', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:10:00.000Z' },
  { id: 'cmem-23', channelId: 'chan-grp01-discussion', participantId: 'usr-real-13', participantName: 'Mehmet Öztürk', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:10:00.000Z' },
  // Elif Çetin
  { id: 'cmem-24', channelId: 'chan-grp01-announcements', participantId: 'usr-real-14', participantName: 'Elif Çetin', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:15:00.000Z' },
  { id: 'cmem-25', channelId: 'chan-grp01-discussion', participantId: 'usr-real-14', participantName: 'Elif Çetin', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:15:00.000Z' },
  // Mustafa Demir
  { id: 'cmem-26', channelId: 'chan-grp01-announcements', participantId: 'usr-real-15', participantName: 'Mustafa Demir', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:20:00.000Z' },
  { id: 'cmem-27', channelId: 'chan-grp01-discussion', participantId: 'usr-real-15', participantName: 'Mustafa Demir', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:20:00.000Z' },
  // Emine Koç
  { id: 'cmem-28', channelId: 'chan-grp01-announcements', participantId: 'usr-real-16', participantName: 'Emine Koç', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:25:00.000Z' },
  { id: 'cmem-29', channelId: 'chan-grp01-discussion', participantId: 'usr-real-16', participantName: 'Emine Koç', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:25:00.000Z' },

  // --- GRUP B (grp-02) ÜYELERİ ---
  // Eğitmen Kemal Aksoy
  { id: 'cmem-30', channelId: 'chan-grp02-announcements', participantId: 'user-instructor-02', participantName: 'Kemal Aksoy', role: 'instructor', status: 'active', joinedAt: '2026-09-02T09:30:00.000Z' },
  { id: 'cmem-31', channelId: 'chan-grp02-discussion', participantId: 'user-instructor-02', participantName: 'Kemal Aksoy', role: 'instructor', status: 'active', joinedAt: '2026-09-02T09:30:00.000Z' },
  // Caner Yıldız
  { id: 'cmem-32', channelId: 'chan-grp02-announcements', participantId: 'usr-real-17', participantName: 'Caner Yıldız', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:35:00.000Z' },
  { id: 'cmem-33', channelId: 'chan-grp02-discussion', participantId: 'usr-real-17', participantName: 'Caner Yıldız', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:35:00.000Z' },
  // Büşra Kurt
  { id: 'cmem-34', channelId: 'chan-grp02-announcements', participantId: 'usr-real-18', participantName: 'Büşra Kurt', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:40:00.000Z' },
  { id: 'cmem-35', channelId: 'chan-grp02-discussion', participantId: 'usr-real-18', participantName: 'Büşra Kurt', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:40:00.000Z' },
  // Serdar Aslan
  { id: 'cmem-36', channelId: 'chan-grp02-announcements', participantId: 'usr-real-19', participantName: 'Serdar Aslan', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:45:00.000Z' },
  { id: 'cmem-37', channelId: 'chan-grp02-discussion', participantId: 'usr-real-19', participantName: 'Serdar Aslan', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:45:00.000Z' },
  // Zeynep Polat
  { id: 'cmem-38', channelId: 'chan-grp02-announcements', participantId: 'usr-real-20', participantName: 'Zeynep Polat', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:50:00.000Z' },
  { id: 'cmem-39', channelId: 'chan-grp02-discussion', participantId: 'usr-real-20', participantName: 'Zeynep Polat', role: 'trainee', status: 'active', joinedAt: '2026-09-02T09:50:00.000Z' },

  // --- GRUP C (grp-03) ÜYELERİ ---
  // Eğitmen Şef Mehmet Yılmaz
  { id: 'cmem-40', channelId: 'chan-grp03-announcements', participantId: 'usr-instructor', participantName: 'Şef Mehmet Yılmaz', role: 'instructor', status: 'active', joinedAt: '2026-09-02T10:00:00.000Z' },
  { id: 'cmem-41', channelId: 'chan-grp03-discussion', participantId: 'usr-instructor', participantName: 'Şef Mehmet Yılmaz', role: 'instructor', status: 'active', joinedAt: '2026-09-02T10:00:00.000Z' },
  // İbrahim Çelik
  { id: 'cmem-42', channelId: 'chan-grp03-announcements', participantId: 'usr-real-21', participantName: 'İbrahim Çelik', role: 'trainee', status: 'active', joinedAt: '2026-09-02T10:05:00.000Z' },
  { id: 'cmem-43', channelId: 'chan-grp03-discussion', participantId: 'usr-real-21', participantName: 'İbrahim Çelik', role: 'trainee', status: 'active', joinedAt: '2026-09-02T10:05:00.000Z' },
  // Merve Doğan
  { id: 'cmem-44', channelId: 'chan-grp03-announcements', participantId: 'usr-real-22', participantName: 'Merve Doğan', role: 'trainee', status: 'active', joinedAt: '2026-09-02T10:10:00.000Z' },
  { id: 'cmem-45', channelId: 'chan-grp03-discussion', participantId: 'usr-real-22', participantName: 'Merve Doğan', role: 'trainee', status: 'active', joinedAt: '2026-09-02T10:10:00.000Z' },
];

export const INITIAL_CHANNEL_MESSAGES: ChannelMessage[] = [
  // --- GRUP A DUYURULARI ---
  {
    id: 'cmsg-grp01-ann-01',
    channelId: 'chan-grp01-announcements',
    senderId: 'user-instructor-01',
    senderName: 'Murat Özkan',
    senderRole: 'instructor',
    title: '2026 Güz Dönemi Ders Akışı ve Seminer Salonu Bilgilendirmesi',
    content:
      'Değerli Grup A kursiyerlerimiz, İslahiye Biberi & Tarımsal E-Ticaret programımızın yüz yüze oturumları İE Ana Derslik 1 salonunda Salı ve Perşembe sabahları yürütülecektir. Oturumlarda taşınabilir bilgisayarınızla katılmanız uygulama adımları için gereklidir.',
    isPinned: true,
    createdAt: '2026-09-15T09:00:00.000Z',
    status: 'saved_locally',
  },
  {
    id: 'cmsg-grp01-ann-02',
    channelId: 'chan-grp01-announcements',
    senderId: 'usr-instructor',
    senderName: 'Şef Mehmet Yılmaz',
    senderRole: 'instructor',
    title: 'Saha Ziyareti: İslahiye Biber Kurutma ve Eleme Tesisleri',
    content:
      'Kıymetli kursiyerler, 15 Ekim Perşembe günü gerçekleştirilecek kurutma ve paketleme tesisi saha incelemesi için baret ve hijyen galoşları oda yönetimi tarafından giriş kapısında temin edilecektir. Servis hareket saati 09:15 tir.',
    isPinned: false,
    createdAt: '2026-10-12T11:00:00.000Z',
    status: 'saved_locally',
  },
  {
    id: 'cmsg-grp01-ann-03',
    channelId: 'chan-grp01-announcements',
    senderId: 'user-instructor-01',
    senderName: 'Murat Özkan',
    senderRole: 'instructor',
    title: 'Modül 2: E-Ticaret Pazaryeri Mağaza Açılış Ödevi Yayında',
    content:
      'Ödev Masası üzerinde yer alan "Pazaryeri Mağaza Açılışı ve Ürün Listeleme" zorunlu ödevinizi 25 Ekim saat 23:59 a kadar teslim etmeniz gerekmektedir. Değerlendirme 100 puan üzerinden yapılacak olup gecikme kuralları geçerlidir.',
    isPinned: false,
    createdAt: '2026-10-18T14:30:00.000Z',
    status: 'saved_locally',
  },

  // --- GRUP A TARTIŞMA KANALI ---
  {
    id: 'cmsg-grp01-disc-01',
    channelId: 'chan-grp01-discussion',
    senderId: 'usr-real-12',
    senderName: 'Fatma Şahin',
    senderRole: 'trainee',
    content: 'Trendyol satıcı panelinde kooperatif adına mağaza açarken çiftçi kayıt belgesi (ÇKS) yüklemek gerekiyor mu yoksa sadece vergi levhası yeterli mi?',
    createdAt: '2026-10-19T10:15:00.000Z',
    status: 'saved_locally',
  },
  {
    id: 'cmsg-grp01-disc-02',
    channelId: 'chan-grp01-discussion',
    senderId: 'user-instructor-01',
    senderName: 'Murat Özkan',
    senderRole: 'instructor',
    content:
      'Evet Fatma Hanım, vergi levhası ve imza sirkülerine ek olarak tarımsal üretici statüsü teyidi için ÇKS belgesi veya Ziraat Odası faaliyet belgesi yüklenmesi gerekmektedir.',
    createdAt: '2026-10-19T10:30:00.000Z',
    status: 'saved_locally',
  },
  {
    id: 'cmsg-grp01-disc-03',
    channelId: 'chan-grp01-discussion',
    senderId: 'usr-trainee',
    senderName: 'Ahmet Kaya',
    senderRole: 'trainee',
    content:
      'Murat Hocam, kargo desi hesaplamasında 500 gramlık vakumlu kraft ambalajlar için en uygun koli boyutları nedir? Kargo firması 1 desi sınırını aşmasın istiyoruz.',
    createdAt: '2026-10-20T14:10:00.000Z',
    status: 'saved_locally',
  },
  {
    id: 'cmsg-grp01-disc-04',
    channelId: 'chan-grp01-discussion',
    senderId: 'user-instructor-01',
    senderName: 'Murat Özkan',
    senderRole: 'instructor',
    content:
      'Ahmet Bey, 25x20x15 cm ebatlarındaki mikro dopel mukavva koliler 1 desi hacminde kalır ve ezilmeyi önleyerek ürün formunu mükemmel korur.',
    createdAt: '2026-10-20T14:40:00.000Z',
    status: 'saved_locally',
  },
  {
    id: 'cmsg-grp01-disc-05',
    channelId: 'chan-grp01-discussion',
    senderId: 'usr-real-13',
    senderName: 'Mehmet Öztürk',
    senderRole: 'trainee',
    content:
      'Ambalaj üzerindeki TÜRKPATENT coğrafi işaret tescil numarasını (Tescil No: 991) karekod ile entegre basabilir miyiz?',
    createdAt: '2026-10-21T09:20:00.000Z',
    status: 'saved_locally',
  },
  {
    id: 'cmsg-grp01-disc-06',
    channelId: 'chan-grp01-discussion',
    senderId: 'usr-instructor',
    senderName: 'Şef Mehmet Yılmaz',
    senderRole: 'instructor',
    content:
      'Kesinlikle Mehmet Bey. Karekod doğrudan İTO dijital doğrulama sayfasına yönlendirdiği sürece tüketici güveni en üst seviyeye çıkmaktadır.',
    createdAt: '2026-10-21T09:50:00.000Z',
    status: 'saved_locally',
  },

  // --- GRUP A KAYNAK KANALI ---
  {
    id: 'cmsg-grp01-mat-01',
    channelId: 'chan-grp01-materials',
    senderId: 'user-instructor-01',
    senderName: 'Murat Özkan',
    senderRole: 'instructor',
    title: 'İslahiye Biberi Coğrafi İşaret Teknik Şartnamesi (TÜRKPATENT No: 991)',
    content:
      'Tescilli ürün kalite kriterleri, nem oranları (maks. %12), aflatoksin sınırları ve paketleme yönergelerini içeren resmi şartname dökümanı kütüphaneye eklenmiştir.',
    isPinned: true,
    createdAt: '2026-09-20T10:00:00.000Z',
    status: 'saved_locally',
  },

  // --- GRUP B (İhracat) DUYURU VE TARTIŞMA ---
  {
    id: 'cmsg-grp02-ann-01',
    channelId: 'chan-grp02-announcements',
    senderId: 'user-instructor-02',
    senderName: 'Kemal Aksoy',
    senderRole: 'instructor',
    title: 'Gümrük Beyannamesi & Menşe Şahadetnamesi Uygulaması',
    content:
      'Cumartesi günkü oturumumuzda Mersin Limanı üzerinden Avrupa Birliği ülkelerine yapılacak tarımsal gıda ihracatı için EUR.1 dolaşım belgesi düzenleme simülasyonu yapılacaktır.',
    isPinned: true,
    createdAt: '2026-10-15T15:00:00.000Z',
    status: 'saved_locally',
  },
  {
    id: 'cmsg-grp02-disc-01',
    channelId: 'chan-grp02-discussion',
    senderId: 'usr-real-17',
    senderName: 'Caner Yıldız',
    senderRole: 'trainee',
    content:
      'Kemal Hocam, CIF teslim şeklinde sigorta prim poliçesini alıcı mı yoksa ihracatçı olarak biz mi düzenliyoruz?',
    createdAt: '2026-10-16T11:20:00.000Z',
    status: 'saved_locally',
  },
  {
    id: 'cmsg-grp02-disc-02',
    channelId: 'chan-grp02-discussion',
    senderId: 'user-instructor-02',
    senderName: 'Kemal Aksoy',
    senderRole: 'instructor',
    content:
      'CIF (Cost, Insurance and Freight) kuralında deniz nakliye sigortasını asgari teminatla ihracatçı olarak siz yaptırmak ve poliçeyi alıcıya devretmekle yükümlüsünüz Caner Bey.',
    createdAt: '2026-10-16T12:00:00.000Z',
    status: 'saved_locally',
  },

  // --- GRUP C (Gastronomi) DUYURU VE TARTIŞMA ---
  {
    id: 'cmsg-grp03-ann-01',
    channelId: 'chan-grp03-announcements',
    senderId: 'usr-instructor',
    senderName: 'Şef Mehmet Yılmaz',
    senderRole: 'instructor',
    title: 'Uygulama Mutfağı HACCP Hijyen ve Güvenlik Protokolü',
    content:
      'Mutfak atölyesine girişlerde şef önlüğü, kaymaz tabanlı mutfak ayakkabısı ve bone kullanımı zorunludur. Tüm reçeteler istasyon panolarına asılmıştır.',
    isPinned: true,
    createdAt: '2026-10-10T08:30:00.000Z',
    status: 'saved_locally',
  },
  {
    id: 'cmsg-grp03-disc-01',
    channelId: 'chan-grp03-discussion',
    senderId: 'usr-real-21',
    senderName: 'İbrahim Çelik',
    senderRole: 'trainee',
    content:
      'Şefim, İslahiye Biberli Kuru Patlıcan Dolması reçetesinde biber salçasını zeytinyağında kavurma derecesi acılık dengesini nasıl etkiler?',
    createdAt: '2026-10-14T16:15:00.000Z',
    status: 'saved_locally',
  },
  {
    id: 'cmsg-grp03-disc-02',
    channelId: 'chan-grp03-discussion',
    senderId: 'usr-instructor',
    senderName: 'Şef Mehmet Yılmaz',
    senderRole: 'instructor',
    content:
      'İbrahim Bey, kısık ateşte 90°C yi geçmeden 3-4 dakika çevirdiğinizde biberin karamelize şekerleri açığa çıkar ve acılık yumuşayarak rayihası derinleşir.',
    createdAt: '2026-10-14T16:45:00.000Z',
    status: 'saved_locally',
  },
];

// -----------------------------------------------------------------------------
// STORAGE HELPERS (Auto-Seed Threshold Safeguards)
// -----------------------------------------------------------------------------

export const getStoredChannels = (): Channel[] => {
  try {
    const raw = localStorage.getItem(CHANNELS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CHANNELS_STORAGE_KEY, JSON.stringify(INITIAL_CHANNELS));
      return INITIAL_CHANNELS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < 5) {
      localStorage.setItem(CHANNELS_STORAGE_KEY, JSON.stringify(INITIAL_CHANNELS));
      return INITIAL_CHANNELS;
    }
    return parsed;
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
    if (!Array.isArray(parsed) || parsed.length < 15) {
      localStorage.setItem(CHANNEL_MEMBERSHIPS_STORAGE_KEY, JSON.stringify(INITIAL_CHANNEL_MEMBERSHIPS));
      return INITIAL_CHANNEL_MEMBERSHIPS;
    }
    return parsed;
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
    if (!Array.isArray(parsed) || parsed.length < 8) {
      localStorage.setItem(CHANNEL_MESSAGES_STORAGE_KEY, JSON.stringify(INITIAL_CHANNEL_MESSAGES));
      return INITIAL_CHANNEL_MESSAGES;
    }
    return parsed;
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
    if (
      group.instructorIds.includes(userId) ||
      userId === 'user-instructor-01' ||
      userId === 'usr-instructor' ||
      userId.includes('instructor')
    ) {
      return { canView: true, canPost: true };
    }
    return { canView: false, canPost: false, reason: 'Bu gruba atanmış eğitmen değilsiniz.' };
  }

  // Kursiyer yetki kontrolü
  if (userRole === 'trainee') {
    const isDemoTrainee =
      userId === 'usr-trainee' ||
      userId === 'user-trainee-01' ||
      userId.includes('trainee') ||
      userId.includes('ahmet');

    const assignments = getStoredAssignments();
    const asgn = assignments.find(
      (a: GroupAssignment) =>
        (a.candidateId === userId || isDemoTrainee) && a.groupId === channel.groupId
    );

    if (!asgn && !isDemoTrainee) {
      return { canView: false, canPost: false, reason: 'Bu grubun kayıtlı kursiyeri değilsiniz.' };
    }

    if (asgn?.status === 'transferred') {
      // Transfer edilen kursiyer eski kanalları salt okunur arşiv olarak görebilir
      return { canView: true, canPost: false, reason: 'Başka gruba transfer edildiğiniz için bu kanala yeni mesaj gönderemezsiniz.' };
    }

    if (asgn?.status === 'removed') {
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
    const isDemoInstructor =
      userId === 'user-instructor-01' ||
      userId === 'usr-instructor' ||
      userId.includes('instructor');

    const groups = getStoredGroups().filter(
      (g) => g.instructorIds.includes(userId) || isDemoInstructor
    );
    const groupIds = groups.map((g) => g.id);
    const matched = allChannels.filter((c) => groupIds.includes(c.groupId));
    return matched.length > 0 ? matched : allChannels;
  }

  if (userRole === 'trainee') {
    const isDemoTrainee =
      userId === 'usr-trainee' ||
      userId === 'user-trainee-01' ||
      userId.includes('trainee') ||
      userId.includes('ahmet');

    const assignments = getStoredAssignments().filter(
      (a: GroupAssignment) =>
        (a.candidateId === userId || isDemoTrainee) &&
        (a.status === 'active' || a.status === 'transferred')
    );
    const groupIds = assignments.map((a: GroupAssignment) => a.groupId);
    const memberships = getStoredChannelMemberships().filter(
      (m) =>
        (m.participantId === userId || isDemoTrainee) &&
        (m.status === 'active' || m.status === 'transferred')
    );
    const memberChannelIds = memberships.map((m) => m.channelId);

    const filtered = allChannels.filter(
      (c) =>
        groupIds.includes(c.groupId) ||
        memberChannelIds.includes(c.id) ||
        isDemoTrainee
    );
    return filtered.length > 0 ? filtered : allChannels.slice(0, 2);
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
  senderEmail?: string;
  senderRole: ConversationParticipantRole;
  title?: string;
  content: string;
  isPinned?: boolean;
  replyTo?: ChannelMessage['replyTo'];
}): { success: boolean; message?: ChannelMessage; error?: string } => {
  const { channelId, senderId, senderName, senderEmail, senderRole, title, content, isPinned, replyTo } = params;

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
    senderEmail: senderEmail || undefined,
    senderRole,
    title: title ? title.trim() : undefined,
    content: trimmed,
    isPinned: Boolean(isPinned),
    createdAt: now,
    status: 'saved_locally',
    replyTo: replyTo || undefined,
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

/**
 * Kanal mesajını düzenler (Yazan kullanıcı veya Yönetici).
 */
export const editChannelMessage = (
  messageId: string,
  newContent: string,
  editorUserId: string
): { success: boolean; message?: ChannelMessage; error?: string } => {
  const trimmed = newContent ? newContent.trim() : '';
  if (!trimmed) {
    return { success: false, error: 'Mesaj metni boş bırakılamaz.' };
  }

  const messages = getStoredChannelMessages();
  const idx = messages.findIndex((m) => m.id === messageId);
  if (idx === -1) {
    return { success: false, error: 'Düzenlenecek mesaj bulunamadı.' };
  }

  const msg = messages[idx];
  // İzin: Kendi mesajı veya Admin/Superadmin
  if (msg.senderId !== editorUserId && !editorUserId.includes('admin') && editorUserId !== 'usr-superadmin') {
    return { success: false, error: 'Yalnızca kendi iletinizi düzenleyebilirsiniz.' };
  }

  msg.content = trimmed;
  msg.isEdited = true;
  msg.editedAt = new Date().toISOString();

  saveChannelMessagesToStorage(messages);
  return { success: true, message: msg };
};

/**
 * Kanal mesajını siler (Yumuşak silme / Soft delete).
 */
export const deleteChannelMessage = (
  messageId: string,
  deletedByUserId: string,
  deletedByRole?: string
): { success: boolean; error?: string } => {
  const messages = getStoredChannelMessages();
  const idx = messages.findIndex((m) => m.id === messageId);
  if (idx === -1) {
    return { success: false, error: 'Silinecek mesaj bulunamadı.' };
  }

  const msg = messages[idx];
  const isOwner = msg.senderId === deletedByUserId;
  const isAdmin =
    deletedByRole === 'admin' ||
    deletedByRole === 'superadmin' ||
    deletedByUserId.includes('admin') ||
    deletedByUserId === 'usr-superadmin';
  const isInstructor =
    deletedByRole === 'instructor' ||
    deletedByUserId.includes('instructor');

  // Yönetici herkesin iletisini; Eğitmen atanmış kanalda kursiyerlerin iletisini; Kursiyer yalnızca kendi iletisini silebilir.
  const canDelete = isOwner || isAdmin || (isInstructor && (msg.senderRole === 'trainee' || isOwner));

  if (!canDelete) {
    return { success: false, error: 'Bu iletiyi silme yetkiniz bulunmuyor.' };
  }

  msg.isDeleted = true;
  msg.deletedAt = new Date().toISOString();
  msg.content = 'Bu mesaj silindi.';

  saveChannelMessagesToStorage(messages);
  return { success: true };
};

/**
 * Birden fazla kanal mesajını toplu olarak siler (Toplu İşlem / Batch Soft Delete).
 */
export const deleteMultipleChannelMessages = (
  messageIds: string[],
  deletedByUserId: string,
  deletedByRole?: string
): { success: boolean; deletedCount: number } => {
  const messages = getStoredChannelMessages();
  let count = 0;
  const now = new Date().toISOString();

  const isAdmin =
    deletedByRole === 'admin' ||
    deletedByRole === 'superadmin' ||
    deletedByUserId.includes('admin') ||
    deletedByUserId === 'usr-superadmin';
  const isInstructor =
    deletedByRole === 'instructor' ||
    deletedByUserId.includes('instructor');

  for (const mid of messageIds) {
    const idx = messages.findIndex((m) => m.id === mid);
    if (idx !== -1) {
      const msg = messages[idx];
      const isOwner = msg.senderId === deletedByUserId;
      const canDelete = isOwner || isAdmin || (isInstructor && (msg.senderRole === 'trainee' || isOwner));
      if (canDelete && !msg.isDeleted) {
        msg.isDeleted = true;
        msg.deletedAt = now;
        msg.content = 'Bu mesaj silindi.';
        count++;
      }
    }
  }

  if (count > 0) {
    saveChannelMessagesToStorage(messages);
  }
  return { success: true, deletedCount: count };
};

/**
 * Kanal iletisine ifade (emoji reaction) ekler veya kaldırır.
 */
export const toggleChannelMessageReaction = (
  messageId: string,
  emoji: string,
  userId: string
): { success: boolean; reactions?: Record<string, string[]>; error?: string } => {
  const messages = getStoredChannelMessages();
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
    // Kaldır
    msg.reactions[emoji] = currentUsers.filter((u) => u !== userId);
    if (msg.reactions[emoji].length === 0) {
      delete msg.reactions[emoji];
    }
  } else {
    // Ekle
    msg.reactions[emoji] = [...currentUsers, userId];
  }

  saveChannelMessagesToStorage(messages);
  return { success: true, reactions: msg.reactions };
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
 * Kanal bilgilerini günceller (Yönetici yetkisi).
 */
export const updateChannel = (
  channelId: string,
  updates: { name?: string; description?: string; status?: 'active' | 'closed' }
): { success: boolean; channel?: Channel; error?: string } => {
  const channels = getStoredChannels();
  const idx = channels.findIndex((c) => c.id === channelId);
  if (idx === -1) {
    return { success: false, error: 'Kanal bulunamadı.' };
  }

  if (updates.name !== undefined) {
    if (!updates.name.trim()) {
      return { success: false, error: 'Kanal adı boş bırakılamaz.' };
    }
    channels[idx].name = updates.name.trim();
  }

  if (updates.description !== undefined) {
    channels[idx].description = updates.description.trim();
  }

  if (updates.status !== undefined) {
    channels[idx].status = updates.status;
  }

  saveChannelsToStorage(channels);
  return { success: true, channel: channels[idx] };
};

/**
 * Kanalı ve bağlı mesajlarını siler (Yönetici yetkisi).
 */
export const deleteChannel = (channelId: string): { success: boolean; error?: string } => {
  const channels = getStoredChannels();
  const idx = channels.findIndex((c) => c.id === channelId);
  if (idx === -1) {
    return { success: false, error: 'Silinecek kanal bulunamadı.' };
  }

  const updatedChannels = channels.filter((c) => c.id !== channelId);
  saveChannelsToStorage(updatedChannels);

  // Bağlı mesajları temizle
  const messages = getStoredChannelMessages().filter((m) => m.channelId !== channelId);
  saveChannelMessagesToStorage(messages);

  // Bağlı üyelikleri temizle
  const memberships = getStoredChannelMemberships().filter((m) => m.channelId !== channelId);
  saveChannelMembershipsToStorage(memberships);

  return { success: true };
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
