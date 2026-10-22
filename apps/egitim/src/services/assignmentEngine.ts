import {
  TraineeAssignmentPerformance,
  OverallSuccessPreCheck,
  OverallPreCheckStatus,
} from '../types';
import {
  getCourseAssignmentsByGroup,
  getLatestSubmission,
  getEvaluationForSubmission,
  getSubmissionsByAssignment,
} from './assignmentStorage';
import { calculateTraineeAttendance } from './attendanceEngine';
import { getGroupAssignmentsByGroup } from './enrollmentStorage';

// ============================================================================
// 1. KURSİYER ÖDEV PERFORMANSI HESAPLAMA MOTORU
// ============================================================================

export const calculateTraineeAssignmentPerformance = (
  traineeId: string,
  groupId: string
): TraineeAssignmentPerformance => {
  // Yalnızca yayınlanmış (published) ödevler değerlendirmeye dahil edilir
  const groupAssignments = getCourseAssignmentsByGroup(groupId, false);

  let mandatoryTotal = 0;
  let mandatoryApproved = 0;
  let evaluatedCount = 0;
  let totalScore = 0;
  let pendingEvaluationCount = 0;
  let revisionRequestedCount = 0;
  let missingSubmissionsCount = 0;

  let traineeName = 'Kursiyer';

  groupAssignments.forEach((asgn) => {
    if (asgn.isMandatory) {
      mandatoryTotal += 1;
    }

    const latestSub = getLatestSubmission(asgn.id, traineeId);

    if (!latestSub) {
      missingSubmissionsCount += 1;
      return;
    }

    if (latestSub.traineeName) {
      traineeName = latestSub.traineeName;
    }

    if (latestSub.status === 'revision_requested') {
      revisionRequestedCount += 1;
    } else if (latestSub.status === 'submitted' || latestSub.status === 'resubmitted') {
      pendingEvaluationCount += 1;
    }

    // Değerlendirme kaydı kontrolü
    const evaluation = getEvaluationForSubmission(latestSub.id);
    if (evaluation) {
      evaluatedCount += 1;
      totalScore += evaluation.score;

      // Zorunlu ödev onayı kontrolü: Yalnızca decision === 'approved' ise onaylanmış sayılır!
      if (asgn.isMandatory && evaluation.decision === 'approved') {
        mandatoryApproved += 1;
      }
    }
  });

  // Ortalama hesaplama: Değerlendirilmemiş ödevler sessizce 0 sayılmaz.
  // Hiç değerlendirilmiş ödev yoksa ortalama null ('Henüz Hesaplanamıyor') döner.
  const averageScore =
    evaluatedCount > 0 ? Math.round((totalScore / evaluatedCount) * 10) / 10 : null;

  const hasPassedThreshold = averageScore !== null && averageScore >= 70;
  const isMandatoryAllApproved =
    mandatoryTotal > 0 && mandatoryApproved === mandatoryTotal;

  return {
    traineeId,
    traineeName,
    groupId,
    totalAssignments: groupAssignments.length,
    mandatoryAssignmentsTotal: mandatoryTotal,
    mandatoryAssignmentsApproved: mandatoryApproved,
    isMandatoryAllApproved,
    evaluatedAssignmentsCount: evaluatedCount,
    averageScore,
    hasPassedThreshold,
    pendingEvaluationCount,
    revisionRequestedCount,
    missingSubmissionsCount,
  };
};

// ============================================================================
// 2. DEVAM + ÖDEV BİRLEŞİK BAŞARI ÖN KONTROLÜ
// ============================================================================

export const calculateOverallSuccessPreCheck = (
  traineeId: string,
  groupId: string
): OverallSuccessPreCheck => {
  const attendanceRes = calculateTraineeAttendance(traineeId, groupId);
  const assignmentPerf = calculateTraineeAssignmentPerformance(traineeId, groupId);

  const attendancePassed = attendanceRes.hasPassedThreshold;
  const assignmentPassed = assignmentPerf.hasPassedThreshold;
  const mandatoryPassed = assignmentPerf.isMandatoryAllApproved;

  let preCheckStatus: OverallPreCheckStatus = 'undetermined';
  let statusLabel = 'Henüz Hesaplanamıyor';
  let explanation =
    'Kursiyerin devam ve ödev değerlendirmeleri devam etmekte olup başarı koşulları henüz kesinleşmemiştir.';

  const isAttendanceDetermined = attendanceRes.attendanceRate !== null;
  const isAssignmentDetermined = assignmentPerf.averageScore !== null;

  if (attendancePassed && assignmentPassed && mandatoryPassed) {
    preCheckStatus = 'requirements_met';
    statusLabel = 'Ön Koşullar Sağlandı';
    explanation =
      'Kursiyer %80 devam barajını, 70/100 ödev ortalamasını ve tüm zorunlu ödev onaylarını başarıyla tamamlamıştır. Dönem sonu yetkili yönetici onayı beklenmektedir.';
  } else if (!attendancePassed && isAttendanceDetermined) {
    preCheckStatus = 'attendance_insufficient';
    statusLabel = 'Devam Yetersiz';
    explanation = `Kursiyerin devam oranı %${attendanceRes.attendanceRate} olup %80 barajının altındadır.`;
  } else if (!assignmentPassed && isAssignmentDetermined) {
    preCheckStatus = 'average_insufficient';
    statusLabel = 'Ödev Ortalaması Yetersiz';
    explanation = `Kursiyerin mevcut ödev ortalaması ${assignmentPerf.averageScore}/100 olup 70 barajının altındadır.`;
  } else if (!mandatoryPassed && assignmentPerf.mandatoryAssignmentsTotal > 0) {
    if (assignmentPerf.missingSubmissionsCount > 0) {
      preCheckStatus = 'missing_assignments';
      statusLabel = 'Eksik Ödev Var';
      explanation = `Onay bekleyen ${
        assignmentPerf.mandatoryAssignmentsTotal - assignmentPerf.mandatoryAssignmentsApproved
      } zorunlu ödev bulunmaktadır.`;
    } else {
      preCheckStatus = 'evaluations_in_progress';
      statusLabel = 'Değerlendirmeler Devam Ediyor';
      explanation = 'Zorunlu ödevlerin teslimleri yapılmış olup eğitmen değerlendirme süreci sürmektedir.';
    }
  } else if (!isAttendanceDetermined && !isAssignmentDetermined) {
    preCheckStatus = 'undetermined';
    statusLabel = 'Henüz Hesaplanamıyor';
    explanation = 'Dönemin henüz başlangıcında olunduğundan yeterli oturum ve ödev verisi oluşmamıştır.';
  } else {
    preCheckStatus = 'evaluations_in_progress';
    statusLabel = 'Değerlendirmeler Devam Ediyor';
    explanation = 'Dönem içi ders oturumları ve ödev değerlendirme döngüsü devam etmektedir.';
  }

  return {
    traineeId,
    traineeName: assignmentPerf.traineeName || 'Kursiyer',
    attendanceRate: attendanceRes.attendanceRate,
    attendancePassed,
    assignmentAverage: assignmentPerf.averageScore,
    assignmentPassed,
    mandatoryTotal: assignmentPerf.mandatoryAssignmentsTotal,
    mandatoryApproved: assignmentPerf.mandatoryAssignmentsApproved,
    mandatoryPassed,
    adminApproved: false, // Sprint E03-C kapsamında yönetici tarafından verilecektir
    isCertified: false,   // Otomatik sertifika kesinlikle verilmez
    preCheckStatus,
    statusLabel,
    explanation,
  };
};

// ============================================================================
// 3. GRUP BAZLI ÖDEV DENETİM VE ÖZET MOTORU (Yönetici & Eğitmen Masası)
// ============================================================================

export interface GroupAssignmentSummary {
  groupId: string;
  totalAssignments: number;
  publishedAssignments: number;
  draftAssignments: number;
  totalSubmissions: number;
  pendingEvaluations: number;
  revisionRequests: number;
  approvedSubmissions: number;
  groupAverageScore: number | null;
  traineesCount: number;
  atRiskTraineesCount: number;
}

export const calculateGroupAssignmentSummary = (groupId: string): GroupAssignmentSummary => {
  const allGroupAssignments = getCourseAssignmentsByGroup(groupId, true);
  const publishedAssignments = allGroupAssignments.filter((a) => a.publicationStatus === 'published');
  const draftAssignments = allGroupAssignments.filter((a) => a.publicationStatus === 'draft');

  let totalSubmissions = 0;
  let pendingEvaluations = 0;
  let revisionRequests = 0;
  let approvedSubmissions = 0;
  let totalScore = 0;
  let scoredCount = 0;

  publishedAssignments.forEach((asgn) => {
    const subs = getSubmissionsByAssignment(asgn.id);
    totalSubmissions += subs.length;

    subs.forEach((sub) => {
      if (sub.status === 'submitted' || sub.status === 'resubmitted') {
        pendingEvaluations += 1;
      } else if (sub.status === 'revision_requested') {
        revisionRequests += 1;
      } else if (sub.status === 'approved') {
        approvedSubmissions += 1;
      }

      const evalRecord = getEvaluationForSubmission(sub.id);
      if (evalRecord) {
        totalScore += evalRecord.score;
        scoredCount += 1;
      }
    });
  });

  const groupAverageScore =
    scoredCount > 0 ? Math.round((totalScore / scoredCount) * 10) / 10 : null;

  // Grup kursiyerleri risk analizi
  const groupTrainees = getGroupAssignmentsByGroup(groupId);
  let atRiskCount = 0;

  groupTrainees.forEach((asgn) => {
    const tId = asgn.candidateId;
    const perf = calculateTraineeAssignmentPerformance(tId, groupId);
    if ((perf.averageScore !== null && perf.averageScore < 70) || perf.missingSubmissionsCount > 0) {
      atRiskCount += 1;
    }
  });

  return {
    groupId,
    totalAssignments: allGroupAssignments.length,
    publishedAssignments: publishedAssignments.length,
    draftAssignments: draftAssignments.length,
    totalSubmissions,
    pendingEvaluations,
    revisionRequests,
    approvedSubmissions,
    groupAverageScore,
    traineesCount: groupTrainees.length,
    atRiskTraineesCount: atRiskCount,
  };
};
