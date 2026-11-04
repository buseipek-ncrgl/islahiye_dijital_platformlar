import {
  Session,
  SessionStatus,
  SessionAttendanceRecord,
  AttendanceMarkStatus,
  AttendanceStatus,
} from '../types';
import { educationApi, CourseSessionDto } from './apiClient';
import { getGroupAssignmentsByGroup } from './enrollmentStorage';
import {
  notifySessionScheduled,
  notifySessionCancelled,
} from './notificationEngine';

const SESSIONS_STORAGE_KEY = 'islahiye_education_sessions_v2';
const ATTENDANCE_STORAGE_KEY = 'islahiye_education_attendance_v2';

const SESSIONS_UPDATE_EVENT = 'islahiye_sessions_updated';
const ATTENDANCE_UPDATE_EVENT = 'islahiye_attendance_updated';

export const mapCourseSessionDtoToSession = (dto: CourseSessionDto): Session => {
  const sessNum = parseInt(dto.title.match(/#(\d+)/)?.[1] || '1', 10);
  const status: SessionStatus =
    dto.status === 2 ? 'completed' : dto.status === 1 ? 'active' : 'scheduled';
  return {
    id: dto.id,
    groupId: dto.groupId,
    groupName: dto.groupName,
    sessionNumber: sessNum,
    title: dto.title,
    topic: dto.notes || dto.title,
    date: dto.date,
    startTime: dto.startTime,
    endTime: dto.endTime,
    location: dto.classroom || 'Uygulama Salonu',
    isOnline: false,
    instructorId: 'usr-instructor',
    instructorName: 'Şef Mehmet Yılmaz',
    status,
    notes: dto.notes,
  };
};

export const syncSessionsWithApi = async (): Promise<Session[]> => {
  try {
    const list = await educationApi.sessions();
    if (list && list.length > 0) {
      const mapped = list.map(mapCourseSessionDtoToSession);
      const merged = [...INITIAL_SESSIONS];
      mapped.forEach((apiSess) => {
        const idx = merged.findIndex(
          (m) => m.id === apiSess.id || (m.groupId === apiSess.groupId && m.sessionNumber === apiSess.sessionNumber)
        );
        if (idx >= 0) {
          merged[idx] = { ...merged[idx], ...apiSess, id: merged[idx].id, groupId: merged[idx].groupId };
        } else {
          merged.push(apiSess);
        }
      });
      saveSessionsToStorage(merged);
      return merged;
    }
  } catch (err) {
    console.warn('API sync sessions notice:', err);
  }
  return getStoredSessions();
};

if (typeof window !== 'undefined') {
  syncSessionsWithApi().catch(() => {});
}

// -----------------------------------------------------------------------------
// SEED SESSIONS (Program -> Dönem -> Grup Hiyerarşisine Bağlı)
// -----------------------------------------------------------------------------

export const INITIAL_SESSIONS: Session[] = [
  // 1-6. Grup A: İslahiye Biberi & Tarımsal E-Ticaret (grp-01) - Şef Mehmet Yılmaz & Murat Özkan
  {
    id: 'sess-01',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-01',
    groupName: 'Grup A — Sabah Oturumu',
    sessionNumber: 1,
    title: 'Modül 1: Yöresel Ürünlerde Coğrafi İşaret ve Marka Değeri',
    topic: 'Tescilli İslahiye biberinin pazar avantajları ve ürün standardizasyonu.',
    date: '2026-10-13', // Salı
    startTime: '09:00',
    endTime: '12:00',
    location: 'IE Ana Derslik 1 (Zemin Kat)',
    isOnline: false,
    instructorId: 'usr-instructor',
    instructorName: 'Şef Mehmet Yılmaz',
    status: 'completed',
    attendanceClosedAt: '13 Ekim 2026 12:15',
    attendanceClosedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
    notes: 'İlk oturum eksiksiz tamamlandı.',
  },
  {
    id: 'sess-02',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-01',
    groupName: 'Grup A — Sabah Oturumu',
    sessionNumber: 2,
    title: 'Modül 2: E-Ticaret Altyapıları ve Pazaryeri Kurulumu',
    topic: 'Trendyol, Hepsiburada ve özel e-ticaret sitelerinde satıcı hesabı açma.',
    date: '2026-10-15', // Perşembe
    startTime: '09:00',
    endTime: '12:00',
    location: 'IE Ana Derslik 1 (Zemin Kat)',
    isOnline: false,
    instructorId: 'usr-instructor',
    instructorName: 'Şef Mehmet Yılmaz',
    status: 'completed',
    attendanceClosedAt: '15 Ekim 2026 12:10',
    attendanceClosedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'sess-03',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-01',
    groupName: 'Grup A — Sabah Oturumu',
    sessionNumber: 3,
    title: 'Modül 3: Ürün Fotoğraflama, Listeleme ve Açıklama Yazımı',
    topic: 'Görsel kalite kuralları ve müşteri güveni oluşturan ürün detayları.',
    date: '2026-10-20', // Salı
    startTime: '09:00',
    endTime: '12:00',
    location: 'IE Ana Derslik 1 (Zemin Kat)',
    isOnline: false,
    instructorId: 'usr-instructor',
    instructorName: 'Şef Mehmet Yılmaz',
    status: 'completed',
    attendanceClosedAt: '20 Ekim 2026 12:20',
    attendanceClosedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'sess-04',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-01',
    groupName: 'Grup A — Sabah Oturumu',
    sessionNumber: 4,
    title: 'Modül 4: Gıda Güvenliği, Paketleme ve Soğuk Zincir/Kargo',
    topic: 'Paketleme standartları ve lojistik anlaşmalarının yönetimi.',
    date: '2026-10-22', // Perşembe
    startTime: '09:00',
    endTime: '12:00',
    location: 'IE Ana Derslik 1 (Zemin Kat)',
    isOnline: false,
    instructorId: 'usr-instructor',
    instructorName: 'Şef Mehmet Yılmaz',
    status: 'completed',
    attendanceClosedAt: '22 Ekim 2026 12:15',
    attendanceClosedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
    notes: 'Manuel yoklama tamamlandı ve onaylandı.',
  },
  {
    id: 'sess-05',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-01',
    groupName: 'Grup A — Sabah Oturumu',
    sessionNumber: 5,
    title: 'Modül 5: Geleneksel Üretim Standartları ve Kalite Güvencesi',
    topic: 'E-Fatura, vergi muafiyeti ve sipariş karşılama simülasyonu.',
    date: '2026-10-27', // Salı
    startTime: '09:00',
    endTime: '12:00',
    location: 'IE Ana Derslik 1 (Zemin Kat)',
    isOnline: false,
    instructorId: 'usr-instructor',
    instructorName: 'Şef Mehmet Yılmaz',
    status: 'completed',
    attendanceClosedAt: '27 Ekim 2026 12:10',
    attendanceClosedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
    notes: 'Manuel yoklama tamamlandı ve onaylandı.',
  },
  {
    id: 'sess-06',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-01',
    groupName: 'Grup A — Sabah Oturumu',
    sessionNumber: 6,
    title: 'Modül 6: Sosyal Medyadan Satış ve Müşteri Hizmetleri',
    topic: 'Instagram/WhatsApp işletme hesapları ve iade süreçleri.',
    date: '2026-10-29', // Perşembe
    startTime: '09:00',
    endTime: '12:00',
    location: 'IE Ana Derslik 1 (Zemin Kat)',
    isOnline: false,
    instructorId: 'usr-instructor',
    instructorName: 'Şef Mehmet Yılmaz',
    status: 'scheduled',
  },

  // 7-10. Grup B: Dış Ticaret & İhracat Yönetimi (grp-02) - Kemal Aksoy
  {
    id: 'sess-02-01',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-02',
    groupName: 'Grup B — Öğleden Sonra Oturumu',
    sessionNumber: 1,
    title: 'Temel Dış Ticaret Kavramları ve Teslim Şekilleri (Incoterms 2020)',
    topic: 'FOB, CIF, EXW sorumluluk ve risk paylaşımı.',
    date: '2026-10-14', // Çarşamba
    startTime: '13:30',
    endTime: '16:30',
    location: 'Derslik 2',
    isOnline: false,
    instructorId: 'usr-real-8',
    instructorName: 'Kemal Aksoy',
    status: 'completed',
    attendanceClosedAt: '14 Ekim 2026 16:40',
    attendanceClosedBy: 'Kemal Aksoy (Eğitmen)',
  },
  {
    id: 'sess-02-02',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-02',
    groupName: 'Grup B — Öğleden Sonra Oturumu',
    sessionNumber: 2,
    title: 'Gümrük Mevzuatı ve İhracat Belgeleri (ATR, EUR.1)',
    topic: 'ATR, EUR1, Menşe Şahadetnamesi ve Gümrük Beyannamesi hazırlığı.',
    date: '2026-10-16', // Cuma
    startTime: '13:30',
    endTime: '16:30',
    location: 'Derslik 2',
    isOnline: false,
    instructorId: 'usr-real-8',
    instructorName: 'Kemal Aksoy',
    status: 'completed',
    attendanceClosedAt: '16 Ekim 2026 16:35',
    attendanceClosedBy: 'Kemal Aksoy (Eğitmen)',
  },
  {
    id: 'sess-02-03',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-02',
    groupName: 'Grup B — Öğleden Sonra Oturumu',
    sessionNumber: 3,
    title: 'Uluslararası Ödeme Yöntemleri ve Akreditif Operasyonları',
    topic: 'Vesaik mukabili, peşin ve akreditifli ödemelerde banka süreçleri.',
    date: '2026-10-21', // Çarşamba
    startTime: '13:30',
    endTime: '16:30',
    location: 'Derslik 2',
    isOnline: false,
    instructorId: 'usr-real-8',
    instructorName: 'Kemal Aksoy',
    status: 'completed',
    attendanceClosedAt: '21 Ekim 2026 16:40',
    attendanceClosedBy: 'Kemal Aksoy (Eğitmen)',
  },
  {
    id: 'sess-02-04',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-02',
    groupName: 'Grup B — Öğleden Sonra Oturumu',
    sessionNumber: 4,
    title: 'Sınır Kapısı ve Uluslararası Nakliye/Lojistik Yönetimi',
    topic: 'Konteyner ve karayolu sevkiyatı hazırlığı.',
    date: '2026-10-23', // Cuma
    startTime: '13:30',
    endTime: '16:30',
    location: 'Derslik 2',
    isOnline: false,
    instructorId: 'usr-real-8',
    instructorName: 'Kemal Aksoy',
    status: 'scheduled',
  },

  // 11-14. Grup C: İslahiye Gastronomi ve Mutfak Sanatları (grp-03) - Şef Mehmet Yılmaz & Ayşe Demir
  {
    id: 'sess-03-01',
    programId: 'prog-03',
    programTitle: 'İslahiye Gastronomi ve Mutfak Sanatları',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-03',
    groupName: 'Grup A — Uygulama Mutfağı',
    sessionNumber: 1,
    title: 'İslahiye Biberiyle Geleneksel Reçeteler ve Mutfak Hijyeni',
    topic: 'Bölgesel lezzet standardizasyonu ve profesyonel mutfak gereçleri.',
    date: '2026-10-12', // Pazartesi
    startTime: '14:00',
    endTime: '17:00',
    location: 'Uygulama Mutfağı Atölyesi',
    isOnline: false,
    instructorId: 'usr-instructor',
    instructorName: 'Şef Mehmet Yılmaz',
    status: 'completed',
    attendanceClosedAt: '12 Ekim 2026 17:15',
    attendanceClosedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'sess-03-02',
    programId: 'prog-03',
    programTitle: 'İslahiye Gastronomi ve Mutfak Sanatları',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-03',
    groupName: 'Grup A — Uygulama Mutfağı',
    sessionNumber: 2,
    title: 'Yöresel Kurutmalıklar, Salçalar ve Saklama Teknikleri',
    topic: 'Güneşte kurutma ve geleneksel fırınlama teknikleri.',
    date: '2026-10-17', // Cumartesi
    startTime: '10:00',
    endTime: '13:00',
    location: 'Uygulama Mutfağı Atölyesi',
    isOnline: false,
    instructorId: 'usr-instructor',
    instructorName: 'Şef Mehmet Yılmaz',
    status: 'completed',
    attendanceClosedAt: '17 Ekim 2026 13:10',
    attendanceClosedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'sess-03-03',
    programId: 'prog-03',
    programTitle: 'İslahiye Gastronomi ve Mutfak Sanatları',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-03',
    groupName: 'Grup A — Uygulama Mutfağı',
    sessionNumber: 3,
    title: 'Coğrafi İşaretli Menü Planlama ve Tabak Sunum Sanatı',
    topic: 'Modern gastronomi sunumları ve tabak kompozisyonu.',
    date: '2026-10-19', // Pazartesi
    startTime: '14:00',
    endTime: '17:00',
    location: 'Uygulama Mutfağı Atölyesi',
    isOnline: false,
    instructorId: 'usr-real-10',
    instructorName: 'Ayşe Demir',
    status: 'completed',
    attendanceClosedAt: '19 Ekim 2026 17:10',
    attendanceClosedBy: 'Ayşe Demir (Eğitmen)',
  },
  {
    id: 'sess-03-04',
    programId: 'prog-03',
    programTitle: 'İslahiye Gastronomi ve Mutfak Sanatları',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-03',
    groupName: 'Grup A — Uygulama Mutfağı',
    sessionNumber: 4,
    title: 'Yöresel Tadım Atölyesi ve Mutfak Maliyet Analizi',
    topic: 'Reçete maliyetlendirme (Food Cost) ve menü fiyatlandırması.',
    date: '2026-10-24', // Cumartesi
    startTime: '10:00',
    endTime: '13:00',
    location: 'Uygulama Mutfağı Atölyesi',
    isOnline: false,
    instructorId: 'usr-instructor',
    instructorName: 'Şef Mehmet Yılmaz',
    status: 'scheduled',
  },
];

// -----------------------------------------------------------------------------
// SEED ATTENDANCE RECORDS (Tamamlanmış oturumlar için gerçek kayıtlar)
// -----------------------------------------------------------------------------

export const INITIAL_ATTENDANCE_RECORDS: SessionAttendanceRecord[] = [
  // sess-01 (13 Ekim) - Grup A (6 Kursiyer)
  {
    id: 'att-s01-ahmet',
    sessionId: 'sess-01',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-ahmet',
    candidateId: 'usr-trainee',
    traineeId: 'usr-trainee',
    traineeName: 'Ahmet Kaya',
    status: 'attended',
    markedAt: '13 Ekim 2026 12:15',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s01-fatma',
    sessionId: 'sess-01',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-fatma',
    candidateId: 'usr-real-12',
    traineeId: 'usr-real-12',
    traineeName: 'Fatma Şahin',
    status: 'attended',
    markedAt: '13 Ekim 2026 12:15',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s01-mehmet',
    sessionId: 'sess-01',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-mehmet',
    candidateId: 'usr-real-13',
    traineeId: 'usr-real-13',
    traineeName: 'Mehmet Öztürk',
    status: 'attended',
    markedAt: '13 Ekim 2026 12:15',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s01-elif',
    sessionId: 'sess-01',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-elif',
    candidateId: 'usr-real-14',
    traineeId: 'usr-real-14',
    traineeName: 'Elif Çetin',
    status: 'attended',
    markedAt: '13 Ekim 2026 12:15',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s01-mustafa',
    sessionId: 'sess-01',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-mustafa',
    candidateId: 'usr-real-15',
    traineeId: 'usr-real-15',
    traineeName: 'Mustafa Demir',
    status: 'attended',
    markedAt: '13 Ekim 2026 12:15',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s01-emine',
    sessionId: 'sess-01',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-emine',
    candidateId: 'usr-real-16',
    traineeId: 'usr-real-16',
    traineeName: 'Emine Koç',
    status: 'excused',
    markedAt: '13 Ekim 2026 12:15',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
    correctionReason: 'Kooperatif genel kurulu için izinli sayıldı.',
  },

  // sess-02 (15 Ekim) - Grup A
  {
    id: 'att-s02-ahmet',
    sessionId: 'sess-02',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-ahmet',
    candidateId: 'usr-trainee',
    traineeId: 'usr-trainee',
    traineeName: 'Ahmet Kaya',
    status: 'attended',
    markedAt: '15 Ekim 2026 12:10',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s02-fatma',
    sessionId: 'sess-02',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-fatma',
    candidateId: 'usr-real-12',
    traineeId: 'usr-real-12',
    traineeName: 'Fatma Şahin',
    status: 'attended',
    markedAt: '15 Ekim 2026 12:10',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s02-mehmet',
    sessionId: 'sess-02',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-mehmet',
    candidateId: 'usr-real-13',
    traineeId: 'usr-real-13',
    traineeName: 'Mehmet Öztürk',
    status: 'attended',
    markedAt: '15 Ekim 2026 12:10',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s02-elif',
    sessionId: 'sess-02',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-elif',
    candidateId: 'usr-real-14',
    traineeId: 'usr-real-14',
    traineeName: 'Elif Çetin',
    status: 'attended',
    markedAt: '15 Ekim 2026 12:10',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s02-mustafa',
    sessionId: 'sess-02',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-mustafa',
    candidateId: 'usr-real-15',
    traineeId: 'usr-real-15',
    traineeName: 'Mustafa Demir',
    status: 'absent',
    markedAt: '15 Ekim 2026 12:10',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s02-emine',
    sessionId: 'sess-02',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-emine',
    candidateId: 'usr-real-16',
    traineeId: 'usr-real-16',
    traineeName: 'Emine Koç',
    status: 'attended',
    markedAt: '15 Ekim 2026 12:10',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },

  // sess-03 (20 Ekim) - Grup A
  {
    id: 'att-s03-ahmet',
    sessionId: 'sess-03',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-ahmet',
    candidateId: 'usr-trainee',
    traineeId: 'usr-trainee',
    traineeName: 'Ahmet Kaya',
    status: 'attended',
    markedAt: '20 Ekim 2026 12:20',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s03-fatma',
    sessionId: 'sess-03',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-fatma',
    candidateId: 'usr-real-12',
    traineeId: 'usr-real-12',
    traineeName: 'Fatma Şahin',
    status: 'attended',
    markedAt: '20 Ekim 2026 12:20',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s03-mehmet',
    sessionId: 'sess-03',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-mehmet',
    candidateId: 'usr-real-13',
    traineeId: 'usr-real-13',
    traineeName: 'Mehmet Öztürk',
    status: 'absent',
    markedAt: '20 Ekim 2026 12:20',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s03-elif',
    sessionId: 'sess-03',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-elif',
    candidateId: 'usr-real-14',
    traineeId: 'usr-real-14',
    traineeName: 'Elif Çetin',
    status: 'attended',
    markedAt: '20 Ekim 2026 12:20',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s03-mustafa',
    sessionId: 'sess-03',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-mustafa',
    candidateId: 'usr-real-15',
    traineeId: 'usr-real-15',
    traineeName: 'Mustafa Demir',
    status: 'attended',
    markedAt: '20 Ekim 2026 12:20',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s03-emine',
    sessionId: 'sess-03',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-emine',
    candidateId: 'usr-real-16',
    traineeId: 'usr-real-16',
    traineeName: 'Emine Koç',
    status: 'attended',
    markedAt: '20 Ekim 2026 12:20',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },

  // sess-04 (22 Ekim) - Grup A
  {
    id: 'att-s04-ahmet',
    sessionId: 'sess-04',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-ahmet',
    candidateId: 'usr-trainee',
    traineeId: 'usr-trainee',
    traineeName: 'Ahmet Kaya',
    status: 'attended',
    markedAt: '22 Ekim 2026 12:15',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s04-fatma',
    sessionId: 'sess-04',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-fatma',
    candidateId: 'usr-real-12',
    traineeId: 'usr-real-12',
    traineeName: 'Fatma Şahin',
    status: 'excused',
    markedAt: '22 Ekim 2026 12:15',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
    correctionReason: 'Sağlık raporu ibraz edildi.',
  },
  {
    id: 'att-s04-mehmet',
    sessionId: 'sess-04',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-mehmet',
    candidateId: 'usr-real-13',
    traineeId: 'usr-real-13',
    traineeName: 'Mehmet Öztürk',
    status: 'attended',
    markedAt: '22 Ekim 2026 12:15',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s04-elif',
    sessionId: 'sess-04',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-elif',
    candidateId: 'usr-real-14',
    traineeId: 'usr-real-14',
    traineeName: 'Elif Çetin',
    status: 'attended',
    markedAt: '22 Ekim 2026 12:15',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s04-mustafa',
    sessionId: 'sess-04',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-mustafa',
    candidateId: 'usr-real-15',
    traineeId: 'usr-real-15',
    traineeName: 'Mustafa Demir',
    status: 'attended',
    markedAt: '22 Ekim 2026 12:15',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s04-emine',
    sessionId: 'sess-04',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-emine',
    candidateId: 'usr-real-16',
    traineeId: 'usr-real-16',
    traineeName: 'Emine Koç',
    status: 'attended',
    markedAt: '22 Ekim 2026 12:15',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },

  // sess-05 (27 Ekim) - Grup A
  {
    id: 'att-s05-ahmet',
    sessionId: 'sess-05',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-ahmet',
    candidateId: 'usr-trainee',
    traineeId: 'usr-trainee',
    traineeName: 'Ahmet Kaya',
    status: 'attended',
    markedAt: '27 Ekim 2026 12:10',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s05-fatma',
    sessionId: 'sess-05',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-fatma',
    candidateId: 'usr-real-12',
    traineeId: 'usr-real-12',
    traineeName: 'Fatma Şahin',
    status: 'attended',
    markedAt: '27 Ekim 2026 12:10',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s05-mehmet',
    sessionId: 'sess-05',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-mehmet',
    candidateId: 'usr-real-13',
    traineeId: 'usr-real-13',
    traineeName: 'Mehmet Öztürk',
    status: 'attended',
    markedAt: '27 Ekim 2026 12:10',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s05-elif',
    sessionId: 'sess-05',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-elif',
    candidateId: 'usr-real-14',
    traineeId: 'usr-real-14',
    traineeName: 'Elif Çetin',
    status: 'attended',
    markedAt: '27 Ekim 2026 12:10',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s05-mustafa',
    sessionId: 'sess-05',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-mustafa',
    candidateId: 'usr-real-15',
    traineeId: 'usr-real-15',
    traineeName: 'Mustafa Demir',
    status: 'absent',
    markedAt: '27 Ekim 2026 12:10',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s05-emine',
    sessionId: 'sess-05',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-emine',
    candidateId: 'usr-real-16',
    traineeId: 'usr-real-16',
    traineeName: 'Emine Koç',
    status: 'attended',
    markedAt: '27 Ekim 2026 12:10',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },

  // sess-02-01 (14 Ekim) - Grup B (4 Kursiyer)
  {
    id: 'att-s201-caner',
    sessionId: 'sess-02-01',
    groupId: 'grp-02',
    enrollmentId: 'enr-trainee-caner',
    candidateId: 'usr-real-17',
    traineeId: 'usr-real-17',
    traineeName: 'Caner Yıldız',
    status: 'attended',
    markedAt: '14 Ekim 2026 16:40',
    markedBy: 'Kemal Aksoy (Eğitmen)',
  },
  {
    id: 'att-s201-busra',
    sessionId: 'sess-02-01',
    groupId: 'grp-02',
    enrollmentId: 'enr-trainee-busra',
    candidateId: 'usr-real-18',
    traineeId: 'usr-real-18',
    traineeName: 'Büşra Kurt',
    status: 'attended',
    markedAt: '14 Ekim 2026 16:40',
    markedBy: 'Kemal Aksoy (Eğitmen)',
  },
  {
    id: 'att-s201-serdar',
    sessionId: 'sess-02-01',
    groupId: 'grp-02',
    enrollmentId: 'enr-trainee-serdar',
    candidateId: 'usr-real-19',
    traineeId: 'usr-real-19',
    traineeName: 'Serdar Aslan',
    status: 'attended',
    markedAt: '14 Ekim 2026 16:40',
    markedBy: 'Kemal Aksoy (Eğitmen)',
  },
  {
    id: 'att-s201-zeynep',
    sessionId: 'sess-02-01',
    groupId: 'grp-02',
    enrollmentId: 'enr-trainee-zeynep-polat',
    candidateId: 'usr-real-20',
    traineeId: 'usr-real-20',
    traineeName: 'Zeynep Polat',
    status: 'attended',
    markedAt: '14 Ekim 2026 16:40',
    markedBy: 'Kemal Aksoy (Eğitmen)',
  },

  // sess-02-02 (16 Ekim) - Grup B
  {
    id: 'att-s202-caner',
    sessionId: 'sess-02-02',
    groupId: 'grp-02',
    enrollmentId: 'enr-trainee-caner',
    candidateId: 'usr-real-17',
    traineeId: 'usr-real-17',
    traineeName: 'Caner Yıldız',
    status: 'attended',
    markedAt: '16 Ekim 2026 16:35',
    markedBy: 'Kemal Aksoy (Eğitmen)',
  },
  {
    id: 'att-s202-busra',
    sessionId: 'sess-02-02',
    groupId: 'grp-02',
    enrollmentId: 'enr-trainee-busra',
    candidateId: 'usr-real-18',
    traineeId: 'usr-real-18',
    traineeName: 'Büşra Kurt',
    status: 'attended',
    markedAt: '16 Ekim 2026 16:35',
    markedBy: 'Kemal Aksoy (Eğitmen)',
  },
  {
    id: 'att-s202-serdar',
    sessionId: 'sess-02-02',
    groupId: 'grp-02',
    enrollmentId: 'enr-trainee-serdar',
    candidateId: 'usr-real-19',
    traineeId: 'usr-real-19',
    traineeName: 'Serdar Aslan',
    status: 'excused',
    markedAt: '16 Ekim 2026 16:35',
    markedBy: 'Kemal Aksoy (Eğitmen)',
  },
  {
    id: 'att-s202-zeynep',
    sessionId: 'sess-02-02',
    groupId: 'grp-02',
    enrollmentId: 'enr-trainee-zeynep-polat',
    candidateId: 'usr-real-20',
    traineeId: 'usr-real-20',
    traineeName: 'Zeynep Polat',
    status: 'absent',
    markedAt: '16 Ekim 2026 16:35',
    markedBy: 'Kemal Aksoy (Eğitmen)',
  },

  // sess-02-03 (21 Ekim) - Grup B
  {
    id: 'att-s203-caner',
    sessionId: 'sess-02-03',
    groupId: 'grp-02',
    enrollmentId: 'enr-trainee-caner',
    candidateId: 'usr-real-17',
    traineeId: 'usr-real-17',
    traineeName: 'Caner Yıldız',
    status: 'attended',
    markedAt: '21 Ekim 2026 16:40',
    markedBy: 'Kemal Aksoy (Eğitmen)',
  },
  {
    id: 'att-s203-busra',
    sessionId: 'sess-02-03',
    groupId: 'grp-02',
    enrollmentId: 'enr-trainee-busra',
    candidateId: 'usr-real-18',
    traineeId: 'usr-real-18',
    traineeName: 'Büşra Kurt',
    status: 'attended',
    markedAt: '21 Ekim 2026 16:40',
    markedBy: 'Kemal Aksoy (Eğitmen)',
  },
  {
    id: 'att-s203-serdar',
    sessionId: 'sess-02-03',
    groupId: 'grp-02',
    enrollmentId: 'enr-trainee-serdar',
    candidateId: 'usr-real-19',
    traineeId: 'usr-real-19',
    traineeName: 'Serdar Aslan',
    status: 'attended',
    markedAt: '21 Ekim 2026 16:40',
    markedBy: 'Kemal Aksoy (Eğitmen)',
  },
  {
    id: 'att-s203-zeynep',
    sessionId: 'sess-02-03',
    groupId: 'grp-02',
    enrollmentId: 'enr-trainee-zeynep-polat',
    candidateId: 'usr-real-20',
    traineeId: 'usr-real-20',
    traineeName: 'Zeynep Polat',
    status: 'attended',
    markedAt: '21 Ekim 2026 16:40',
    markedBy: 'Kemal Aksoy (Eğitmen)',
  },

  // sess-03-01 (12 Ekim) - Grup C (2 Kursiyer)
  {
    id: 'att-s301-ibrahim',
    sessionId: 'sess-03-01',
    groupId: 'grp-03',
    enrollmentId: 'enr-trainee-ibrahim',
    candidateId: 'usr-real-21',
    traineeId: 'usr-real-21',
    traineeName: 'İbrahim Çelik',
    status: 'attended',
    markedAt: '12 Ekim 2026 17:15',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s301-merve',
    sessionId: 'sess-03-01',
    groupId: 'grp-03',
    enrollmentId: 'enr-trainee-merve',
    candidateId: 'usr-real-22',
    traineeId: 'usr-real-22',
    traineeName: 'Merve Doğan',
    status: 'attended',
    markedAt: '12 Ekim 2026 17:15',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },

  // sess-03-02 (17 Ekim) - Grup C
  {
    id: 'att-s302-ibrahim',
    sessionId: 'sess-03-02',
    groupId: 'grp-03',
    enrollmentId: 'enr-trainee-ibrahim',
    candidateId: 'usr-real-21',
    traineeId: 'usr-real-21',
    traineeName: 'İbrahim Çelik',
    status: 'attended',
    markedAt: '17 Ekim 2026 13:10',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },
  {
    id: 'att-s302-merve',
    sessionId: 'sess-03-02',
    groupId: 'grp-03',
    enrollmentId: 'enr-trainee-merve',
    candidateId: 'usr-real-22',
    traineeId: 'usr-real-22',
    traineeName: 'Merve Doğan',
    status: 'attended',
    markedAt: '17 Ekim 2026 13:10',
    markedBy: 'Şef Mehmet Yılmaz (Eğitmen)',
  },

  // sess-03-03 (19 Ekim) - Grup C
  {
    id: 'att-s303-ibrahim',
    sessionId: 'sess-03-03',
    groupId: 'grp-03',
    enrollmentId: 'enr-trainee-ibrahim',
    candidateId: 'usr-real-21',
    traineeId: 'usr-real-21',
    traineeName: 'İbrahim Çelik',
    status: 'attended',
    markedAt: '19 Ekim 2026 17:10',
    markedBy: 'Ayşe Demir (Eğitmen)',
  },
  {
    id: 'att-s303-merve',
    sessionId: 'sess-03-03',
    groupId: 'grp-03',
    enrollmentId: 'enr-trainee-merve',
    candidateId: 'usr-real-22',
    traineeId: 'usr-real-22',
    traineeName: 'Merve Doğan',
    status: 'attended',
    markedAt: '19 Ekim 2026 17:10',
    markedBy: 'Ayşe Demir (Eğitmen)',
  },
];

// -----------------------------------------------------------------------------
// OTURUM (SESSION) CRUD & İŞ MANTIĞI
// -----------------------------------------------------------------------------

export const getStoredSessions = (): Session[] => {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(INITIAL_SESSIONS));
      return INITIAL_SESSIONS;
    }
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length >= 10 &&
      parsed.some((s) => s.groupId === 'grp-01')
    ) {
      return parsed;
    }
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(INITIAL_SESSIONS));
    return INITIAL_SESSIONS;
  } catch (err) {
    console.error('Sessions read error:', err);
    return INITIAL_SESSIONS;
  }
};

export const saveSessionsToStorage = (sessions: Session[]): void => {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SESSIONS_UPDATE_EVENT, { detail: sessions }));
    }
  } catch (err) {
    console.error('Sessions write error:', err);
  }
};

export const getSessionById = (id: string): Session | undefined => {
  return getStoredSessions().find((s) => s.id === id);
};

export const getSessionsByGroup = (groupId: string): Session[] => {
  return getStoredSessions()
    .filter((s) => s.groupId === groupId)
    .sort((a, b) => a.sessionNumber - b.sessionNumber);
};

export const getSessionsByInstructor = (instructorIdOrName: string): Session[] => {
  return getStoredSessions().filter(
    (s) =>
      s.instructorId === instructorIdOrName ||
      s.instructorName.toLowerCase().includes(instructorIdOrName.toLowerCase())
  );
};

// -----------------------------------------------------------------------------
// ÇAKIŞMA KONTROLÜ (CONFLICT DETECTION ALGORITHM)
// -----------------------------------------------------------------------------

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
}

const parseTimeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const doTimeSlotsOverlap = (slotA: TimeSlot, slotB: TimeSlot): boolean => {
  if (slotA.date !== slotB.date) return false;
  const startA = parseTimeToMinutes(slotA.startTime);
  const endA = parseTimeToMinutes(slotA.endTime);
  const startB = parseTimeToMinutes(slotB.startTime);
  const endB = parseTimeToMinutes(slotB.endTime);

  return startA < endB && endA > startB;
};

export const checkSessionConflict = (
  candidateSession: {
    id?: string;
    groupId: string;
    instructorId?: string;
    instructorName: string;
    date: string;
    startTime: string;
    endTime: string;
  }
): { hasConflict: boolean; reason?: string; conflictingSession?: Session } => {
  const allSessions = getStoredSessions();

  for (const session of allSessions) {
    // İptal edilen veya kontrol edilen oturumun kendisi ise atla
    if (session.status === 'cancelled') continue;
    if (candidateSession.id && session.id === candidateSession.id) continue;

    const overlaps = doTimeSlotsOverlap(
      {
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
      },
      {
        date: candidateSession.date,
        startTime: candidateSession.startTime,
        endTime: candidateSession.endTime,
      }
    );

    if (overlaps) {
      // Durum 1: Aynı grup aynı saatte başka derse sahip
      if (session.groupId === candidateSession.groupId) {
        return {
          hasConflict: true,
          conflictingSession: session,
          reason: `Grup Çakışması: Bu grup için ${session.date} tarihinde ${session.startTime} - ${session.endTime} saatleri arasında zaten "${session.title}" (Oturum ${session.sessionNumber}) oturumu planlanmıştır.`,
        };
      }

      // Durum 2: Aynı eğitmen aynı saatte başka bir grupta derste
      const sameInstructor =
        (candidateSession.instructorId && session.instructorId === candidateSession.instructorId) ||
        (candidateSession.instructorName &&
          session.instructorName.toLowerCase() === candidateSession.instructorName.toLowerCase());

      if (sameInstructor) {
        return {
          hasConflict: true,
          conflictingSession: session,
          reason: `Eğitmen Çakışması: ${session.instructorName} isimli eğitmen aynı tarih (${session.date} ${session.startTime} - ${session.endTime}) aralığında "${session.groupName || session.groupId}" grubundaki derse görevlendirilmiştir.`,
        };
      }
    }
  }

  return { hasConflict: false };
};

// -----------------------------------------------------------------------------
// YENİ OTURUM OLUŞTURMA
// -----------------------------------------------------------------------------

export const createSession = (
  sessionData: Omit<Session, 'id'> & { id?: string }
): { success: boolean; session?: Session; error?: string } => {
  if (!sessionData.title?.trim()) {
    return { success: false, error: 'Oturum başlığı zorunludur.' };
  }
  if (!sessionData.date || !sessionData.startTime || !sessionData.endTime) {
    return { success: false, error: 'Tarih, başlangıç ve bitiş saati zorunludur.' };
  }

  // Çakışma kontrolü
  const conflict = checkSessionConflict({
    groupId: sessionData.groupId,
    instructorId: sessionData.instructorId,
    instructorName: sessionData.instructorName,
    date: sessionData.date,
    startTime: sessionData.startTime,
    endTime: sessionData.endTime,
  });

  if (conflict.hasConflict) {
    return { success: false, error: conflict.reason };
  }

  const all = getStoredSessions();
  const groupSessions = all.filter((s) => s.groupId === sessionData.groupId);
  const nextNumber = sessionData.sessionNumber || groupSessions.length + 1;

  const newSession: Session = {
    ...sessionData,
    id: sessionData.id || `sess-${Date.now()}`,
    sessionNumber: nextNumber,
    status: sessionData.status || 'scheduled',
  };

  all.push(newSession);
  saveSessionsToStorage(all);

  // Bildirim tetikle (Non-blocking)
  try {
    const traineeIds = getGroupAssignmentsByGroup(newSession.groupId).map((a) => a.candidateId);
    notifySessionScheduled(newSession, traineeIds);
  } catch (err) {
    console.warn('Oturum planlama bildirimi tetiklenirken hata:', err);
  }

  return { success: true, session: newSession };
};

export const updateSessionStatus = (
  sessionId: string,
  newStatus: SessionStatus,
  actionUser?: string,
  reason?: string
): { success: boolean; session?: Session; error?: string } => {
  const all = getStoredSessions();
  const index = all.findIndex((s) => s.id === sessionId);
  if (index === -1) return { success: false, error: 'Oturum bulunamadı.' };

  const current = all[index];
  const updated: Session = {
    ...current,
    status: newStatus,
  };

  if (newStatus === 'completed') {
    updated.attendanceClosedAt = new Date().toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    updated.attendanceClosedBy = actionUser || 'Yetkili Eğitmen';
  }

  if (reason) {
    updated.attendanceCorrectionReason = reason;
  }

  all[index] = updated;
  saveSessionsToStorage(all);

  // İptal durumu bildirimi tetikle (Non-blocking)
  if (newStatus === 'cancelled') {
    try {
      const traineeIds = getGroupAssignmentsByGroup(updated.groupId).map((a) => a.candidateId);
      notifySessionCancelled(updated, traineeIds, reason);
    } catch (err) {
      console.warn('Oturum iptal bildirimi tetiklenirken hata:', err);
    }
  }

  return { success: true, session: updated };
};

// -----------------------------------------------------------------------------
// YOKLAMA KAYITLARI (ATTENDANCE RECORDS) CRUD & DENETİM
// -----------------------------------------------------------------------------

export const getStoredAttendanceRecords = (): SessionAttendanceRecord[] => {
  try {
    const raw = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(INITIAL_ATTENDANCE_RECORDS));
      return INITIAL_ATTENDANCE_RECORDS;
    }
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length >= 25 &&
      parsed.some((r) => r.candidateId === 'usr-trainee' || r.traineeId === 'usr-trainee')
    ) {
      return parsed;
    }
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(INITIAL_ATTENDANCE_RECORDS));
    return INITIAL_ATTENDANCE_RECORDS;
  } catch (err) {
    console.error('Attendance read error:', err);
    return INITIAL_ATTENDANCE_RECORDS;
  }
};

export const saveAttendanceRecordsToStorage = (records: SessionAttendanceRecord[]): void => {
  try {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(ATTENDANCE_UPDATE_EVENT, { detail: records }));
    }
  } catch (err) {
    console.error('Attendance write error:', err);
  }
};

export const getAttendanceForSession = (sessionId: string): SessionAttendanceRecord[] => {
  return getStoredAttendanceRecords().filter((r) => r.sessionId === sessionId);
};

export const getAttendanceForTrainee = (traineeId: string): SessionAttendanceRecord[] => {
  return getStoredAttendanceRecords().filter(
    (r) => r.candidateId === traineeId || r.traineeId === traineeId
  );
};

/**
 * Oturum İçin Kursiyer Yoklama Listesini Başlatma/Getirme
 * Henüz kayıt yoksa grubun aktif kursiyerlerini 'unmarked' olarak yükler
 */
export const getOrInitializeSessionAttendance = (
  sessionId: string,
  groupId: string
): SessionAttendanceRecord[] => {
  const existing = getAttendanceForSession(sessionId);
  const activeAssignments = getGroupAssignmentsByGroup(groupId);

  if (existing.length === 0 && activeAssignments.length > 0) {
    const initialRecords: SessionAttendanceRecord[] = activeAssignments.map((asgn) => ({
      id: `att-${sessionId}-${asgn.candidateId}`,
      sessionId,
      groupId,
      enrollmentId: asgn.enrollmentId,
      candidateId: asgn.candidateId,
      traineeId: asgn.candidateId,
      traineeName: asgn.candidateName,
      status: 'unmarked',
    }));

    const all = getStoredAttendanceRecords();
    const updated = [...all, ...initialRecords];
    saveAttendanceRecordsToStorage(updated);
    return initialRecords;
  }

  // Eğer yeni kursiyer gruba katılmışsa ve bu oturumda kaydı yoksa ekle
  let mutated = false;
  const currentRecords = [...existing];
  activeAssignments.forEach((asgn) => {
    const found = currentRecords.find((r) => r.candidateId === asgn.candidateId);
    if (!found) {
      const newRec: SessionAttendanceRecord = {
        id: `att-${sessionId}-${asgn.candidateId}`,
        sessionId,
        groupId,
        enrollmentId: asgn.enrollmentId,
        candidateId: asgn.candidateId,
        traineeId: asgn.candidateId,
        traineeName: asgn.candidateName,
        status: 'unmarked',
      };
      currentRecords.push(newRec);
      mutated = true;
    }
  });

  if (mutated) {
    const all = getStoredAttendanceRecords();
    const otherSessions = all.filter((r) => r.sessionId !== sessionId);
    saveAttendanceRecordsToStorage([...otherSessions, ...currentRecords]);
  }

  return currentRecords;
};

/**
 * Taslak Yoklama Kaydetme (Oturum kapatılmaz, 'unmarked' kursiyerler kalabilir)
 */
export const saveDraftAttendance = (
  sessionId: string,
  updatedList: { traineeId: string; status: AttendanceMarkStatus }[],
  markedBy: string
): { success: boolean } => {
  const all = getStoredAttendanceRecords();
  const session = getSessionById(sessionId);
  const timestamp = new Date().toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updatedAll = all.map((r) => {
    if (r.sessionId !== sessionId) return r;
    const match = updatedList.find((u) => u.traineeId === r.candidateId || u.traineeId === r.traineeId);
    if (match) {
      return {
        ...r,
        status: match.status,
        markedAt: timestamp,
        markedBy,
      };
    }
    return r;
  });

  // Eğer listedeki kursiyer henüz depoda yoksa kaydını ekle (yeni atanmış kursiyer desteği)
  updatedList.forEach((u) => {
    const exists = updatedAll.some(
      (r) => r.sessionId === sessionId && (r.candidateId === u.traineeId || r.traineeId === u.traineeId)
    );
    if (!exists) {
      updatedAll.push({
        id: `att-${sessionId}-${u.traineeId}`,
        sessionId,
        groupId: session?.groupId || '',
        candidateId: u.traineeId,
        traineeId: u.traineeId,
        traineeName: u.traineeId,
        status: u.status,
        markedAt: timestamp,
        markedBy,
      });
    }
  });

  saveAttendanceRecordsToStorage(updatedAll);
  return { success: true };
};

/**
 * Yoklamayı Onayla ve Oturumu Kapat
 * Kural: 'unmarked' ("Henüz İşaretlenmedi") kursiyer kalmışsa kapatma engellenir!
 */
export const closeSessionAttendance = (
  sessionId: string,
  updatedList: { traineeId: string; status: AttendanceMarkStatus }[],
  closedBy: string
): { success: boolean; error?: string } => {
  const hasUnmarked = updatedList.some((u) => u.status === 'unmarked' || !u.status);
  if (hasUnmarked) {
    return {
      success: false,
      error: 'Tüm kursiyerlerin durumu (Katıldı / Katılmadı / Mazeretli) belirlenmeden yoklama onaylanıp kapatılamaz.',
    };
  }

  // Önce taslağı kaydet
  saveDraftAttendance(sessionId, updatedList, closedBy);

  // Oturumu tamamlandı yap
  const statusRes = updateSessionStatus(sessionId, 'completed', closedBy);
  if (!statusRes.success) {
    return { success: false, error: statusRes.error };
  }

  // Canlı backend API ile senkronize et
  try {
    educationApi.saveSessionAttendance(
      sessionId,
      updatedList.map((u) => ({
        studentUserId: u.traineeId,
        status: u.status === 'attended' ? 1 : u.status === 'excused' ? 2 : 0,
        notes: `Yoklama eğitmen (${closedBy}) tarafından manuel kaydedildi.`,
      }))
    ).catch((err) => console.warn('API sync attendance notice:', err));
  } catch (err) {
    console.warn('API sync attendance skipped:', err);
  }

  return { success: true };
};

/**
 * Tamamlanmış/Kapatılmış Oturumda Gerekçeli Yoklama Düzeltmesi (Audit Trail)
 */
export const correctAttendanceRecord = (
  recordId: string,
  newStatus: AttendanceStatus,
  reason: string,
  correctedBy: string
): { success: boolean; record?: SessionAttendanceRecord; error?: string } => {
  if (!reason.trim()) {
    return { success: false, error: 'Yoklama düzeltmesi için zorunlu idari gerekçe belirtilmelidir.' };
  }

  const all = getStoredAttendanceRecords();
  const index = all.findIndex((r) => r.id === recordId);
  if (index === -1) {
    return { success: false, error: 'Yoklama kaydı bulunamadı.' };
  }

  const current = all[index];
  if (current.status === newStatus) {
    return { success: false, error: 'Yeni durum ile mevcut durum aynıdır.' };
  }

  const timestamp = new Date().toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const historyItem = {
    id: `corr-${Date.now()}`,
    fromStatus: current.status,
    toStatus: newStatus,
    reason: reason.trim(),
    correctedBy,
    correctedAt: timestamp,
  };

  const updatedRecord: SessionAttendanceRecord = {
    ...current,
    status: newStatus,
    correctionReason: reason.trim(),
    correctionHistory: [...(current.correctionHistory || []), historyItem],
    markedAt: timestamp,
    markedBy: `${correctedBy} (Düzeltme)`,
  };

  all[index] = updatedRecord;
  saveAttendanceRecordsToStorage(all);
  return { success: true, record: updatedRecord };
};

// -----------------------------------------------------------------------------
// ABONELİKLER
// -----------------------------------------------------------------------------

export const subscribeToSessionUpdates = (callback: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(SESSIONS_UPDATE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(SESSIONS_UPDATE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};

export const subscribeToAttendanceUpdates = (callback: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(ATTENDANCE_UPDATE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(ATTENDANCE_UPDATE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};

export const resetSessionStorageToDefaults = (): void => {
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(INITIAL_SESSIONS));
  localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(INITIAL_ATTENDANCE_RECORDS));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SESSIONS_UPDATE_EVENT, { detail: INITIAL_SESSIONS }));
    window.dispatchEvent(new CustomEvent(ATTENDANCE_UPDATE_EVENT, { detail: INITIAL_ATTENDANCE_RECORDS }));
  }
};

