/**
 * Operasyonel Raporlama ve Analitik Servisi (Sprint E05-A)
 * İslahiye Ticaret Odası Eğitim Portalı
 *
 * Raporlama ve Hesaplama İlkeleri (Section 11, 12, 13):
 * 1. Sabit sahte metrikler oluşturulmaz; tüm veriler gerçek depolardan dinamik hesaplanır.
 * 2. Kesin ayrımlar gözetilir:
 *    - Kabul Edilmiş Aday ≠ Kesin Kayıtlı Kursiyer
 *    - Kesin Kayıtlı Kursiyer ≠ Gruba Atanmış Kursiyer
 *    - Teslim Edilmiş Ödev ≠ Onaylanmış Ödev
 *    - Akademik Olarak Uygun ≠ Nihai Başarı Onayı Verilmiş
 *    - Belge Hakkı ≠ Düzenlenmiş PDF Belgesi
 * 3. Payda sıfırsa %0 yerine "Hesaplanamıyor" (null / N/A) döndürülür.
 * 4. CSV dışa aktarımı UTF-8 BOM formatında, gizli/özel verilerden arındırılmış olarak üretilir.
 */

import { getStoredApplications } from './applicationStorage';
import {
  getStoredEnrollments,
  getStoredAssignments as getStoredGroupAssignments,
  getStoredGroups,
} from './enrollmentStorage';
import { getStoredSessions } from './sessionStorage';
import {
  getStoredCourseAssignments,
  getStoredSubmissions,
  getStoredEvaluations,
} from './assignmentStorage';
import { getStoredSuccessDecisions } from './successDecisionStorage';
import { getStoredCertificates } from './certificateStorage';
import { calculateTraineeAttendance } from './attendanceEngine';
import { getStoredSystemSettings } from './systemSettingsStorage';

// -----------------------------------------------------------------------------
// RAPOR VERİ MODELLERİ
// -----------------------------------------------------------------------------

export interface ApplicationReportMetrics {
  totalApplications: number;
  underReviewCount: number;
  acceptedCount: number;
  waitlistedCount: number;
  rejectedCount: number;
  withdrawnCount: number;
  byProgram: Array<{
    programId: string;
    programTitle: string;
    total: number;
    accepted: number;
    underReview: number;
    rejected: number;
  }>;
}

export interface EnrollmentQuotaMetrics {
  acceptedCandidatesCount: number;
  confirmedEnrollmentsCount: number;
  assignedToGroupCount: number;
  pendingGroupAssignmentCount: number;
  totalQuotaCapacity: number;
  overallCapacityUtilizationRate: number | null; // Payda sıfırsa null
  groupUtilization: Array<{
    groupId: string;
    groupName: string;
    programTitle: string;
    capacity: number;
    assignedCount: number;
    occupancyRate: number;
    isFull: boolean;
  }>;
}

export interface AttendanceReportMetrics {
  totalSessions: number;
  completedAttendanceSessions: number;
  openAttendanceSessions: number;
  cancelledSessions: number;
  averageAttendanceRate: number | null; // Payda sıfırsa null
  traineesAtRiskCount: number; // <%80 devam oranı
  traineesAtRisk: Array<{
    traineeId: string;
    traineeName: string;
    groupName: string;
    attendanceRate: number;
    attendedCount: number;
    totalCompleted: number;
  }>;
}

export interface AssignmentReportMetrics {
  totalAssignmentsPublished: number;
  totalSubmissions: number;
  approvedCount: number;
  revisionRequestedCount: number;
  pendingEvaluationCount: number;
  overallAverageScore: number | null; // Payda sıfırsa null
  submissionRate: number | null;
}

export interface SuccessCertificateMetrics {
  totalEvaluatedTrainees: number;
  academicallyEligibleCount: number; // %80 devam + 70 ödev
  pendingAdminApprovalCount: number;
  approvedDecisionsCount: number;
  rejectedDecisionsCount: number;
  issuedCertificatesCount: number;
  validCertificatesCount: number;
  cancelledCertificatesCount: number;
}

export interface OperationalReportData {
  generatedAt: string;
  filterProgramId?: string;
  filterTermId?: string;
  filterGroupId?: string;
  applications: ApplicationReportMetrics;
  enrollments: EnrollmentQuotaMetrics;
  attendance: AttendanceReportMetrics;
  assignments: AssignmentReportMetrics;
  successAndCertificates: SuccessCertificateMetrics;
}

// -----------------------------------------------------------------------------
// DİNAMİK METRİK HESAPLAMA MOTORU
// -----------------------------------------------------------------------------

export const calculateOperationalReports = (filters?: {
  programId?: string;
  termId?: string;
  groupId?: string;
}): OperationalReportData => {
  const { programId, termId, groupId } = filters || {};
  const settings = getStoredSystemSettings();
  const minAttendance = settings.attendancePolicy.minAttendanceRateRequired; // 80
  const minAssignment = settings.assignmentPolicy.minPassingAssignmentAverage; // 70

  // 1. Veri depolarından ham kayıtları çek
  let applications = getStoredApplications();
  let enrollments = getStoredEnrollments();
  let groupAssignments = getStoredGroupAssignments();
  let groups = getStoredGroups();
  let sessions = getStoredSessions();
  let courseAssignments = getStoredCourseAssignments();
  let submissions = getStoredSubmissions();
  let successDecisions = getStoredSuccessDecisions();
  let certificates = getStoredCertificates();

  // 2. Filtreleri uygula
  if (programId && programId !== 'all') {
    applications = applications.filter((a) => a.programId === programId);
    enrollments = enrollments.filter((e) => e.programId === programId);
    groupAssignments = groupAssignments.filter((g) => g.programId === programId);
    groups = groups.filter((g) => g.programId === programId);
    sessions = sessions.filter((s) => s.programId === programId);
    courseAssignments = courseAssignments.filter((c) => c.programId === programId);
    successDecisions = successDecisions.filter((d) => d.programId === programId);
    certificates = certificates.filter((c) => c.programId === programId);
  }

  if (termId && termId !== 'all') {
    enrollments = enrollments.filter((e) => e.termId === termId || e.cohortName === termId);
    groupAssignments = groupAssignments.filter((g) => g.termId === termId);
    groups = groups.filter((g) => g.termId === termId || g.cohortName === termId);
    sessions = sessions.filter((s) => s.termId === termId || s.cohortName === termId);
    successDecisions = successDecisions.filter((d) => d.termId === termId);
    certificates = certificates.filter((c) => c.termId === termId || c.cohortName === termId);
  }

  if (groupId && groupId !== 'all') {
    groupAssignments = groupAssignments.filter((g) => g.groupId === groupId);
    groups = groups.filter((g) => g.id === groupId);
    sessions = sessions.filter((s) => s.groupId === groupId);
    courseAssignments = courseAssignments.filter((c) => c.groupId === groupId);
    successDecisions = successDecisions.filter((d) => d.groupId === groupId);
    certificates = certificates.filter((c) => c.groupId === groupId);
  }

  // --- A. BAŞVURU METRİKLERİ ---
  const appByProgMap = new Map<string, { title: string; total: number; accepted: number; review: number; rejected: number }>();
  applications.forEach((a) => {
    if (!appByProgMap.has(a.programId)) {
      appByProgMap.set(a.programId, {
        title: a.programTitle,
        total: 0,
        accepted: 0,
        review: 0,
        rejected: 0,
      });
    }
    const item = appByProgMap.get(a.programId)!;
    item.total++;
    if (a.status === 'accepted') item.accepted++;
    else if (a.status === 'under_review' || a.status === 'submitted') item.review++;
    else if (a.status === 'rejected') item.rejected++;
  });

  const appMetrics: ApplicationReportMetrics = {
    totalApplications: applications.length,
    underReviewCount: applications.filter((a) => a.status === 'under_review' || a.status === 'submitted').length,
    acceptedCount: applications.filter((a) => a.status === 'accepted').length,
    waitlistedCount: applications.filter((a) => a.status === 'waitlisted').length,
    rejectedCount: applications.filter((a) => a.status === 'rejected').length,
    withdrawnCount: applications.filter((a) => a.status === 'withdrawn').length,
    byProgram: Array.from(appByProgMap.entries()).map(([pId, v]) => ({
      programId: pId,
      programTitle: v.title,
      total: v.total,
      accepted: v.accepted,
      underReview: v.review,
      rejected: v.rejected,
    })),
  };

  // --- B. KESİN KAYIT VE KONTENJAN METRİKLERİ ---
  const confirmedEnrollments = enrollments.filter((e) => e.status === 'confirmed');
  const activeAssignments = groupAssignments.filter((a) => a.status === 'active');
  const assignedCandidateIds = new Set(activeAssignments.map((a) => a.candidateId));

  const pendingGroupAssignmentCount = confirmedEnrollments.filter(
    (e) => !assignedCandidateIds.has(e.candidateId)
  ).length;

  let totalQuota = 0;
  const groupUtilList = groups.map((g) => {
    totalQuota += g.capacity;
    const assigned = activeAssignments.filter((a) => a.groupId === g.id).length;
    const occupancyRate = g.capacity > 0 ? Math.round((assigned / g.capacity) * 100) : 0;
    return {
      groupId: g.id,
      groupName: g.name,
      programTitle: g.programTitle || 'Eğitim Programı',
      capacity: g.capacity,
      assignedCount: assigned,
      occupancyRate,
      isFull: assigned >= g.capacity,
    };
  });

  const overallUtilization = totalQuota > 0
    ? Math.round((activeAssignments.length / totalQuota) * 100)
    : null;

  const enrollmentMetrics: EnrollmentQuotaMetrics = {
    acceptedCandidatesCount: appMetrics.acceptedCount,
    confirmedEnrollmentsCount: confirmedEnrollments.length,
    assignedToGroupCount: activeAssignments.length,
    pendingGroupAssignmentCount,
    totalQuotaCapacity: totalQuota,
    overallCapacityUtilizationRate: overallUtilization,
    groupUtilization: groupUtilList,
  };

  // --- C. DERS VE DEVAM METRİKLERİ ---
  const completedSessions = sessions.filter(
    (s) => s.status === 'completed' || s.attendanceClosedAt
  );
  const openSessions = sessions.filter((s) => s.status === 'attendance_open');
  const cancelledSessions = sessions.filter((s) => s.status === 'cancelled');

  // Her kayıtlı kursiyer için devam oranı hesapla
  const atRiskList: AttendanceReportMetrics['traineesAtRisk'] = [];
  let totalRateSum = 0;
  let evaluatedTraineeCount = 0;

  activeAssignments.forEach((asgn) => {
    const calc = calculateTraineeAttendance(asgn.candidateId, asgn.groupId);
    if (calc && typeof calc.attendanceRate === 'number' && calc.completedSessionsCount > 0) {
      const rate = calc.attendanceRate;
      evaluatedTraineeCount++;
      totalRateSum += rate;

      if (rate < minAttendance) {
        atRiskList.push({
          traineeId: asgn.candidateId,
          traineeName: asgn.candidateName,
          groupName: asgn.groupName,
          attendanceRate: rate,
          attendedCount: calc.attendedCount,
          totalCompleted: calc.completedSessionsCount,
        });
      }
    }
  });

  const avgAttendance = evaluatedTraineeCount > 0
    ? Math.round(totalRateSum / evaluatedTraineeCount)
    : null;

  const attendanceMetrics: AttendanceReportMetrics = {
    totalSessions: sessions.length,
    completedAttendanceSessions: completedSessions.length,
    openAttendanceSessions: openSessions.length,
    cancelledSessions: cancelledSessions.length,
    averageAttendanceRate: avgAttendance,
    traineesAtRiskCount: atRiskList.length,
    traineesAtRisk: atRiskList,
  };

  // --- D. ÖDEV VE DEĞERLENDİRME METRİKLERİ ---
  let evaluations = getStoredEvaluations();
  if (courseAssignments.length > 0) {
    const validAsgIds = new Set(courseAssignments.map((a) => a.id));
    evaluations = evaluations.filter((ev) => validAsgIds.has(ev.assignmentId));
    submissions = submissions.filter((s) => validAsgIds.has(s.assignmentId));
  } else if (programId && programId !== 'all') {
    evaluations = [];
    submissions = [];
  }

  let scoreSum = 0;
  let scoredSubmissionsCount = 0;

  evaluations.forEach((ev) => {
    if (typeof ev.score === 'number') {
      scoreSum += ev.score;
      scoredSubmissionsCount++;
    }
  });

  const avgScore = scoredSubmissionsCount > 0
    ? Math.round(scoreSum / scoredSubmissionsCount)
    : null;

  const assignmentMetrics: AssignmentReportMetrics = {
    totalAssignmentsPublished: courseAssignments.filter((a) => a.publicationStatus === 'published').length,
    totalSubmissions: submissions.length,
    approvedCount: submissions.filter((s) => s.status === 'approved').length,
    revisionRequestedCount: submissions.filter((s) => s.status === 'revision_requested').length,
    pendingEvaluationCount: submissions.filter((s) => s.status === 'submitted').length,
    overallAverageScore: avgScore,
    submissionRate: activeAssignments.length > 0
      ? Math.round((submissions.length / (activeAssignments.length * Math.max(1, courseAssignments.length))) * 100)
      : null,
  };

  // --- E. BAŞARI VE BELGE METRİKLERİ ---
  const validCerts = certificates.filter((c) => c.status === 'issued');
  const cancelledCerts = certificates.filter((c) => c.status === 'cancelled');

  const successMetrics: SuccessCertificateMetrics = {
    totalEvaluatedTrainees: successDecisions.length,
    academicallyEligibleCount: successDecisions.filter(
      (d) =>
        d.eligibilitySnapshot &&
        (d.eligibilitySnapshot.attendanceRate || 0) >= minAttendance &&
        (d.eligibilitySnapshot.assignmentAverage || 0) >= minAssignment
    ).length,
    pendingAdminApprovalCount: successDecisions.filter(
      (d) => d.decision === 'additional_review' || !d.decision
    ).length,
    approvedDecisionsCount: successDecisions.filter((d) => d.decision === 'approved').length,
    rejectedDecisionsCount: successDecisions.filter((d) => d.decision === 'rejected').length,
    issuedCertificatesCount: certificates.length,
    validCertificatesCount: validCerts.length,
    cancelledCertificatesCount: cancelledCerts.length,
  };

  return {
    generatedAt: new Date().toISOString(),
    filterProgramId: programId,
    filterTermId: termId,
    filterGroupId: groupId,
    applications: appMetrics,
    enrollments: enrollmentMetrics,
    attendance: attendanceMetrics,
    assignments: assignmentMetrics,
    successAndCertificates: successMetrics,
  };
};

// -----------------------------------------------------------------------------
// CSV RAPOR ÇIKTISI (UTF-8 BOM ile Excel Uyumlu)
// -----------------------------------------------------------------------------

export const generateOperationalReportCSV = (report: OperationalReportData): string => {
  const lines: string[] = [];

  lines.push('İSLAHİYE TİCARET ODASI EĞİTİM PORTALI - OPERASYONEL RAPOR ÖZETİ (DEMO SİMÜLASYONU)');
  lines.push(`Rapor Üretim Tarihi:;${new Date(report.generatedAt).toLocaleString('tr-TR')}`);
  lines.push('');

  // 1. Başvurular
  lines.push('1. BAŞVURU İSTATİSTİKLERİ');
  lines.push('Toplam Başvuru;İncelemede;Kabul Edildi;Yedek Liste;Reddedildi;Geri Çekildi');
  lines.push(
    `${report.applications.totalApplications};${report.applications.underReviewCount};${report.applications.acceptedCount};${report.applications.waitlistedCount};${report.applications.rejectedCount};${report.applications.withdrawnCount}`
  );
  lines.push('');

  // 2. Kesin Kayıt ve Kontenjan
  lines.push('2. KESİN KAYIT VE KONTENJAN DURUMU');
  lines.push('Kabul Edilen Aday;Kesin Kayıtlı Kursiyer;Sınıfa Atanmış;Grup Ataması Bekleyen;Toplam Kontenjan;Genel Doluluk Oranı');
  lines.push(
    `${report.enrollments.acceptedCandidatesCount};${report.enrollments.confirmedEnrollmentsCount};${report.enrollments.assignedToGroupCount};${report.enrollments.pendingGroupAssignmentCount};${report.enrollments.totalQuotaCapacity};${report.enrollments.overallCapacityUtilizationRate !== null ? `%${report.enrollments.overallCapacityUtilizationRate}` : 'Hesaplanamıyor'}`
  );
  lines.push('');

  // 3. Grup Doluluk Dağılımı
  lines.push('Grup Adı;Program;Kontenjan;Kayıtlı Kursiyer;Doluluk Oranı;Durum');
  report.enrollments.groupUtilization.forEach((g) => {
    lines.push(`"${g.groupName}";"${g.programTitle}";${g.capacity};${g.assignedCount};%${g.occupancyRate};${g.isFull ? 'Dolu' : 'Açık'}`);
  });
  lines.push('');

  // 4. Ders ve Devam Durumu
  lines.push('3. DERS VE DEVAM DURUMU');
  lines.push('Toplam Oturum;Yoklaması Tamamlanan;Yoklaması Açık;İptal Edilen;Genel Devam Ortalaması;Devam Riski Olan (<%80)');
  lines.push(
    `${report.attendance.totalSessions};${report.attendance.completedAttendanceSessions};${report.attendance.openAttendanceSessions};${report.attendance.cancelledSessions};${report.attendance.averageAttendanceRate !== null ? `%${report.attendance.averageAttendanceRate}` : 'Hesaplanamıyor'};${report.attendance.traineesAtRiskCount}`
  );
  lines.push('');

  // 5. Başarı ve Belge
  lines.push('4. DÖNEM SONU BAŞARI VE BELGELER');
  lines.push('Akademik Şartları Sağlayan;Yönetici Onayı Bekleyen;Nihai Onaylanan;Düzenlenen Belge (PDF);Geçerli Belge;İptal Edilen Belge');
  lines.push(
    `${report.successAndCertificates.academicallyEligibleCount};${report.successAndCertificates.pendingAdminApprovalCount};${report.successAndCertificates.approvedDecisionsCount};${report.successAndCertificates.issuedCertificatesCount};${report.successAndCertificates.validCertificatesCount};${report.successAndCertificates.cancelledCertificatesCount}`
  );
  lines.push('');
  lines.push('NOT: Bu rapor İslahiye Ticaret Odası Eğitim Portalı sentetik demo verilerinden türetilmiştir. Hiçbir gerçek kişisel veri içermez.');

  const csv = lines.join('\r\n');
  return '\uFEFF' + csv; // UTF-8 BOM
};
