import {
  AttendanceCalculationResult,
  GroupAttendanceSummary,
  AttendanceStatus,
} from '../types';
import { getStoredSessions } from './sessionStorage';
import { getStoredAttendanceRecords } from './sessionStorage';
import { getStoredEnrollments, getGroupAssignmentsByGroup } from './enrollmentStorage';

export type ExcusedPolicy =
  | 'exclude_from_denominator' // Standart: Mazeretli oturum devam paydasından düşülür
  | 'count_as_attended'        // Mazeretli oturum geçerli katılım sayılır
  | 'neutral_academic';        // Mazeret belgesi inceleniyor / muaf

export interface AttendanceCalculationOptions {
  excusedPolicy?: ExcusedPolicy;
  enrollmentDate?: string; // Bu tarihten önceki oturumlar hesaba katılmaz
}

/**
 * Tekil Kursiyer İçin Devam Oranı Hesaplama Motoru
 * (Sprint E03-A Kesin Kurallarına Uygun)
 */
export const calculateTraineeAttendance = (
  candidateId: string,
  groupId: string,
  options: AttendanceCalculationOptions = {}
): AttendanceCalculationResult => {
  const { excusedPolicy = 'exclude_from_denominator', enrollmentDate } = options;

  // 1. Gruba ait tüm oturumları getir
  const allSessions = getStoredSessions().filter((s) => s.groupId === groupId);

  // 2. İptal edilen oturumları doğrudan ele (Kural: İptal edilen oturumlar hesaba alınmaz)
  const nonCancelledSessions = allSessions.filter((s) => s.status !== 'cancelled');

  // 3. Kursiyerin kesin kayıt tarihinden önceki oturumları filtrele (Kural: Eski oturumlar devamsızlık sayılmaz)
  const eligibleSessions = nonCancelledSessions.filter((s) => {
    if (!enrollmentDate) return true;
    // Eğer ISO formatında (YYYY-MM-DD) ise karşılaştır
    if (/^\d{4}-\d{2}-\d{2}/.test(enrollmentDate)) {
      return s.date >= enrollmentDate.substring(0, 10);
    }
    // Değilse oturumu hariç tutma (güvenli fallback)
    return true;
  });

  // 4. Yalnızca yoklaması onaylanıp KAPATILMIŞ ('completed') oturumları kesin devam hesabına dahil et
  const completedSessions = eligibleSessions.filter((s) => s.status === 'completed');

  // 5. Kursiyerin yoklama kayıtlarını getir (Mükerrerlikleri tekilleştir)
  const allRecords = getStoredAttendanceRecords();
  const sessionRecordMap = new Map<string, AttendanceStatus | 'unmarked'>();

  allRecords
    .filter(
      (r) =>
        (r.candidateId === candidateId || r.traineeId === candidateId) &&
        r.groupId === groupId
    )
    .forEach((r) => {
      // Oturum bazında tekil kayıt sakla (en son güncel kayıt esastır)
      sessionRecordMap.set(r.sessionId, r.status);
    });

  let attendedCount = 0;
  let absentCount = 0;
  let excusedCount = 0;
  let unmarkedCount = 0;

  completedSessions.forEach((sess) => {
    const status = sessionRecordMap.get(sess.id);
    if (status === 'attended') {
      attendedCount++;
    } else if (status === 'absent') {
      absentCount++;
    } else if (status === 'excused') {
      excusedCount++;
    } else {
      unmarkedCount++;
    }
  });

  // 6. Payda ve Pay Hesaplama Politikası
  let denominator = completedSessions.length;
  let numerator = attendedCount;

  if (excusedPolicy === 'exclude_from_denominator') {
    // Mazeretli oturumlar paydadan çıkarılır (Örn: 10 oturum, 1 mazeretli -> payda 9)
    denominator = Math.max(0, denominator - excusedCount);
  } else if (excusedPolicy === 'count_as_attended') {
    // Mazeretli katılım sayılır
    numerator += excusedCount;
  }

  // 7. Sıfır Payda Kuralı (Payda sıfır ise "%0" değil "Henüz Hesaplanamıyor" göster)
  let attendanceRate: number | null = null;
  let statusText = 'Henüz Hesaplanamıyor';
  let hasPassedThreshold = false;
  let isAtRisk = false;

  if (denominator > 0) {
    attendanceRate = Math.round((numerator / denominator) * 100);
    hasPassedThreshold = attendanceRate >= 80;
    isAtRisk = attendanceRate < 80;
    statusText = hasPassedThreshold ? 'Devam Koşulu Sağlandı ✓' : 'Kritik Devam Uyarısı (%80 Altı)';
  } else {
    statusText = 'Henüz Hesaplanamıyor';
  }

  const policyNote =
    excusedPolicy === 'exclude_from_denominator'
      ? 'Mazeretli oturumlar devam paydasından muaf tutulmuştur.'
      : 'Mazeretli oturumlar geçerli katılım olarak değerlendirilmiştir.';

  // Kursiyerin enrollment kimliğini bul
  const enrollments = getStoredEnrollments();
  const enr = enrollments.find(
    (e) => e.candidateId === candidateId && e.status !== 'cancelled'
  );

  return {
    candidateId,
    enrollmentId: enr?.id,
    groupId,
    totalSessions: allSessions.length,
    eligibleSessionsCount: eligibleSessions.length,
    completedSessionsCount: completedSessions.length,
    attendedCount,
    absentCount,
    excusedCount,
    unmarkedCount,
    attendanceRate,
    hasPassedThreshold,
    isAtRisk,
    statusText,
    policyNote,
  };
};

/**
 * Grup Bazında Genel Devam Özeti ve Risk Analizi
 * (Eğitmen ve Yönetici Denetim Ekranları İçin)
 */
export const calculateGroupAttendanceSummary = (
  groupId: string,
  options: AttendanceCalculationOptions = {}
): GroupAttendanceSummary => {
  const allSessions = getStoredSessions().filter((s) => s.groupId === groupId);
  const completedSessions = allSessions.filter((s) => s.status === 'completed');
  const pendingAttendanceSessions = allSessions.filter((s) => s.status === 'attendance_open');
  const scheduledSessions = allSessions.filter((s) => s.status === 'scheduled');
  const cancelledSessions = allSessions.filter((s) => s.status === 'cancelled');

  const activeAssignments = getGroupAssignmentsByGroup(groupId);
  const totalTrainees = activeAssignments.length;

  let totalRatesSum = 0;
  let calculatedCount = 0;
  let atRiskCount = 0;

  activeAssignments.forEach((asgn) => {
    const res = calculateTraineeAttendance(asgn.candidateId, groupId, options);
    if (res.attendanceRate !== null) {
      totalRatesSum += res.attendanceRate;
      calculatedCount++;
      if (res.isAtRisk) {
        atRiskCount++;
      }
    }
  });

  const averageAttendanceRate =
    calculatedCount > 0 ? Math.round(totalRatesSum / calculatedCount) : null;

  const groupName =
    allSessions[0]?.groupName || activeAssignments[0]?.groupName || 'Eğitim Grubu';

  return {
    groupId,
    groupName,
    totalSessions: allSessions.length,
    completedSessions: completedSessions.length,
    pendingAttendanceSessions: pendingAttendanceSessions.length,
    scheduledSessions: scheduledSessions.length,
    cancelledSessions: cancelledSessions.length,
    averageAttendanceRate,
    atRiskTraineesCount: atRiskCount,
    totalTrainees,
  };
};
