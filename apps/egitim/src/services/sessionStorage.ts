import {
  Session,
  SessionStatus,
  SessionAttendanceRecord,
  AttendanceMarkStatus,
  AttendanceStatus,
} from '../types';
import { getGroupAssignmentsByGroup } from './enrollmentStorage';
import {
  notifySessionScheduled,
  notifySessionCancelled,
} from './notificationEngine';

const SESSIONS_STORAGE_KEY = 'islahiye_education_sessions_v1';
const ATTENDANCE_STORAGE_KEY = 'islahiye_education_attendance_v1';

const SESSIONS_UPDATE_EVENT = 'islahiye_sessions_updated';
const ATTENDANCE_UPDATE_EVENT = 'islahiye_attendance_updated';

// -----------------------------------------------------------------------------
// SEED SESSIONS (Program -> Dönem -> Grup Hiyerarşisine Bağlı)
// -----------------------------------------------------------------------------

export const INITIAL_SESSIONS: Session[] = [
  // Grup A: İslahiye Biberi & Tarımsal E-Ticaret (grp-01)
  {
    id: 'sess-01',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-01',
    groupName: 'Grup A (Hafta İçi Öğleden Sonra)',
    sessionNumber: 1,
    title: 'Yöresel Ürünlerde Coğrafi İşaret ve Marka Değeri',
    topic: 'Tescilli İslahiye biberinin pazar avantajları ve ürün standardizasyonu.',
    date: '2026-10-13',
    startTime: '14:00',
    endTime: '17:00',
    location: 'Seminer Salonu B',
    isOnline: false,
    instructorId: 'user-instructor-01',
    instructorName: 'Murat Özkan',
    status: 'completed',
    attendanceClosedAt: '13 Ekim 2026 17:15',
    attendanceClosedBy: 'Murat Özkan (Eğitmen)',
    notes: 'İlk oturum eksiksiz tamamlandı.',
  },
  {
    id: 'sess-02',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-01',
    groupName: 'Grup A (Hafta İçi Öğleden Sonra)',
    sessionNumber: 2,
    title: 'E-Ticaret Altyapıları ve Pazaryeri Kurulumu',
    topic: 'Trendyol, Hepsiburada ve özel e-ticaret sitelerinde satıcı hesabı açma.',
    date: '2026-10-15',
    startTime: '14:00',
    endTime: '17:00',
    location: 'Seminer Salonu B',
    isOnline: false,
    instructorId: 'user-instructor-01',
    instructorName: 'Murat Özkan',
    status: 'completed',
    attendanceClosedAt: '15 Ekim 2026 17:10',
    attendanceClosedBy: 'Murat Özkan (Eğitmen)',
  },
  {
    id: 'sess-03',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-01',
    groupName: 'Grup A (Hafta İçi Öğleden Sonra)',
    sessionNumber: 3,
    title: 'Ürün Fotoğraflama, Listeleme ve Açıklama Yazımı',
    topic: 'Görsel kalite kuralları ve müşteri güveni oluşturan ürün detayları.',
    date: '2026-10-20',
    startTime: '14:00',
    endTime: '17:00',
    location: 'Seminer Salonu B',
    isOnline: false,
    instructorId: 'user-instructor-01',
    instructorName: 'Murat Özkan',
    status: 'completed',
    attendanceClosedAt: '20 Ekim 2026 17:20',
    attendanceClosedBy: 'Murat Özkan (Eğitmen)',
  },
  {
    id: 'sess-04',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-01',
    groupName: 'Grup A (Hafta İçi Öğleden Sonra)',
    sessionNumber: 4,
    title: 'Gıda Güvenliği, Paketleme ve Soğuk Zincir/Kargo',
    topic: 'Paketleme standartları ve lojistik anlaşmalarının yönetimi.',
    date: '2026-10-22',
    startTime: '14:00',
    endTime: '17:00',
    location: 'Seminer Salonu B',
    isOnline: false,
    instructorId: 'user-instructor-01',
    instructorName: 'Murat Özkan',
    status: 'attendance_open',
    notes: 'Bugünkü aktif oturum: Manuel yoklama alınmaktadır.',
  },
  {
    id: 'sess-05',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-01',
    groupName: 'Grup A (Hafta İçi Öğleden Sonra)',
    sessionNumber: 5,
    title: 'Stok Takibi ve Fatura Entegrasyonu',
    topic: 'E-Fatura, vergi muafiyeti ve sipariş karşılama simülasyonu.',
    date: '2026-10-27',
    startTime: '14:00',
    endTime: '17:00',
    location: 'Seminer Salonu B',
    isOnline: false,
    instructorId: 'user-instructor-01',
    instructorName: 'Murat Özkan',
    status: 'scheduled',
  },
  {
    id: 'sess-06',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-01',
    groupName: 'Grup A (Hafta İçi Öğleden Sonra)',
    sessionNumber: 6,
    title: 'Sosyal Medyadan Satış ve Müşteri Hizmetleri',
    topic: 'Instagram/WhatsApp işletme hesapları ve iade süreçleri.',
    date: '2026-10-29',
    startTime: '14:00',
    endTime: '17:00',
    location: 'Seminer Salonu B',
    isOnline: false,
    instructorId: 'user-instructor-01',
    instructorName: 'Murat Özkan',
    status: 'scheduled',
  },

  // Grup B: Dış Ticaret & İhracat Yönetimi (grp-02)
  {
    id: 'sess-02-01',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-02',
    groupName: 'Grup B (Hafta Sonu)',
    sessionNumber: 1,
    title: 'Temel Dış Ticaret Kavramları ve Teslim Şekilleri (Incoterms 2020)',
    topic: 'FOB, CIF, EXW sorumluluk ve risk paylaşımı.',
    date: '2026-10-17',
    startTime: '10:00',
    endTime: '13:00',
    location: 'Derslik 2',
    isOnline: false,
    instructorId: 'user-instructor-02',
    instructorName: 'Kemal Aksoy',
    status: 'completed',
    attendanceClosedAt: '17 Ekim 2026 13:10',
    attendanceClosedBy: 'Kemal Aksoy (Eğitmen)',
  },
  {
    id: 'sess-02-02',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-02',
    groupName: 'Grup B (Hafta Sonu)',
    sessionNumber: 2,
    title: 'Gümrük Mevzuatı ve İhracat Belgeleri',
    topic: 'ATR, EUR1, Menşe Şahadetnamesi ve Gümrük Beyannamesi hazırlığı.',
    date: '2026-10-24',
    startTime: '10:00',
    endTime: '13:00',
    location: 'Derslik 2',
    isOnline: false,
    instructorId: 'user-instructor-02',
    instructorName: 'Kemal Aksoy',
    status: 'scheduled',
  },
];

// -----------------------------------------------------------------------------
// SEED ATTENDANCE RECORDS (Tamamlanmış oturumlar için gerçek kayıtlar)
// -----------------------------------------------------------------------------

export const INITIAL_ATTENDANCE_RECORDS: SessionAttendanceRecord[] = [
  // sess-01 (Ayşe Demir & Diğerleri)
  {
    id: 'att-s01-u01',
    sessionId: 'sess-01',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-01',
    candidateId: 'user-trainee-01',
    traineeId: 'user-trainee-01',
    traineeName: 'Ayşe Demir',
    status: 'attended',
    markedAt: '13 Ekim 2026 17:15',
    markedBy: 'Murat Özkan (Eğitmen)',
  },
  // sess-02 (Ayşe Demir)
  {
    id: 'att-s02-u01',
    sessionId: 'sess-02',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-01',
    candidateId: 'user-trainee-01',
    traineeId: 'user-trainee-01',
    traineeName: 'Ayşe Demir',
    status: 'attended',
    markedAt: '15 Ekim 2026 17:10',
    markedBy: 'Murat Özkan (Eğitmen)',
  },
  // sess-03 (Ayşe Demir)
  {
    id: 'att-s03-u01',
    sessionId: 'sess-03',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-01',
    candidateId: 'user-trainee-01',
    traineeId: 'user-trainee-01',
    traineeName: 'Ayşe Demir',
    status: 'attended',
    markedAt: '20 Ekim 2026 17:20',
    markedBy: 'Murat Özkan (Eğitmen)',
  },
  // sess-04 (Ayşe Demir - Yoklama Açık, taslak işaretlendi)
  {
    id: 'att-s04-u01',
    sessionId: 'sess-04',
    groupId: 'grp-01',
    enrollmentId: 'enr-trainee-01',
    candidateId: 'user-trainee-01',
    traineeId: 'user-trainee-01',
    traineeName: 'Ayşe Demir',
    status: 'attended',
    markedAt: '22 Ekim 2026 14:15',
    markedBy: 'Murat Özkan (Eğitmen)',
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
    if (Array.isArray(parsed) && parsed.length > 0) {
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
    return Array.isArray(parsed) ? parsed : INITIAL_ATTENDANCE_RECORDS;
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

