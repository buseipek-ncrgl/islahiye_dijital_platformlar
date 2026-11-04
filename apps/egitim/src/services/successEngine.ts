import {
  FinalEligibilityResult,
  AcademicEligibilityStatus,
  FinalSuccessStatus,
  EligibilitySourceSnapshot,
} from '../types';
import {
  getStoredEnrollments,
  getStoredAssignments,
  getGroupById,
} from './enrollmentStorage';
import { calculateTraineeAttendance } from './attendanceEngine';
import { calculateTraineeAssignmentPerformance } from './assignmentEngine';
import { getSuccessDecisionByEnrollment } from './successDecisionStorage';

// ============================================================================
// 1. TEKİL KURSİYER NİHAİ BAŞARI DEĞERLENDİRME MOTORU
// ============================================================================

export const calculateFinalEligibility = (
  enrollmentId: string,
  termId?: string
): FinalEligibilityResult => {
  const allEnrollments = getStoredEnrollments();
  const allGroupAssignments = getStoredAssignments();

  // Esnek Eşleştirme: enrollmentId doğrudan id, candidateId, veya assignment id olabilir
  let enrollment = allEnrollments.find(
    (e) => e.id === enrollmentId || e.candidateId === enrollmentId || e.candidateEmail === enrollmentId
  );

  if (!enrollment) {
    const matchedAssignment = allGroupAssignments.find(
      (a) => a.id === enrollmentId || a.candidateId === enrollmentId || a.candidateEmail === enrollmentId
    );
    if (matchedAssignment) {
      enrollment = allEnrollments.find(
        (e) => e.id === matchedAssignment.enrollmentId || e.candidateId === matchedAssignment.candidateId
      );
    }
  }

  // Demo ortamı için varsayılan kursiyer kaydı eşleştirmesi
  if (!enrollment && (enrollmentId.includes('trainee') || enrollmentId.includes('ahmet') || enrollmentId === 'usr-trainee')) {
    enrollment = allEnrollments[0];
  }

  const nowIso = new Date().toISOString();
  const policyVersion = 'POL-2026-V1 (%80 Devam, 70/100 Ödev, Zorunlu Onaylar, Yönetici Onayı)';

  const fallbackSnapshot: EligibilitySourceSnapshot = {
    attendanceRate: null,
    attendedCount: 0,
    completedSessionsCount: 0,
    excusedCount: 0,
    assignmentAverage: null,
    mandatoryAssignmentsApproved: 0,
    mandatoryAssignmentsTotal: 0,
    sessionsEvaluatedCount: 0,
    capturedAt: nowIso,
  };

  if (!enrollment) {
    return {
      enrollmentId,
      traineeId: 'unknown',
      traineeName: 'Bilinmeyen Kursiyer',
      programId: 'unknown',
      programTitle: 'Bilinmeyen Program',
      termId: termId || 'unknown',
      cohortName: 'Bilinmeyen Dönem',
      groupId: 'unknown',
      groupName: 'Grup Yok',
      instructorNames: [],
      attendanceRate: null,
      attendanceEligible: false,
      completedSessionsCount: 0,
      attendedCount: 0,
      absentCount: 0,
      excusedCount: 0,
      assignmentAverage: null,
      gradeEligible: false,
      mandatoryAssignmentsTotal: 0,
      mandatoryAssignmentsApproved: 0,
      mandatoryEligible: false,
      outstandingEvaluations: 0,
      incompleteRequirements: ['Kesin kayıt kaydı bulunamadı'],
      academicEligible: false,
      eligibilityStatus: 'undetermined',
      finalStatus: 'undetermined',
      statusLabel: 'Kayıt Bulunamadı',
      explanation: 'Sistemde bu kimlikle kesin kayıt bulunamamıştır.',
      calculatedAt: nowIso,
      policyVersion,
      sourceSnapshot: fallbackSnapshot,
    };
  }

  // Grup ataması kontrolü
  const userAssignments = allGroupAssignments.filter(
    (a) => a.enrollmentId === enrollment.id || a.candidateId === enrollment.candidateId
  );

  const activeGroupAssignment =
    userAssignments.find((a) => a.status === 'active') || userAssignments[0] || null;

  const group = activeGroupAssignment ? getGroupById(activeGroupAssignment.groupId) : null;
  const groupId = group?.id || activeGroupAssignment?.groupId || 'grp-01';
  const groupName = group?.name || activeGroupAssignment?.groupName || 'Eğitim Grubu';
  const instructorNames = group?.instructorNames || ['Murat Özkan'];

  // 1. DEVAM MOTORU HESAPLAMASI (attendanceEngine)
  const attendanceRes = calculateTraineeAttendance(enrollment.candidateId, groupId, {
    enrollmentDate: activeGroupAssignment?.assignedAt || enrollment.createdAt,
  });

  const attendanceRate = attendanceRes.attendanceRate;
  const attendanceEligible = attendanceRate !== null && attendanceRate >= 80;

  // 2. ÖDEV MOTORU HESAPLAMASI (assignmentEngine)
  const assignmentPerf = calculateTraineeAssignmentPerformance(
    enrollment.candidateId,
    groupId
  );

  const assignmentAverage = assignmentPerf.averageScore;
  const gradeEligible = assignmentAverage !== null && assignmentAverage >= 70;
  const mandatoryAssignmentsTotal = assignmentPerf.mandatoryAssignmentsTotal;
  const mandatoryAssignmentsApproved = assignmentPerf.mandatoryAssignmentsApproved;
  const mandatoryEligible =
    mandatoryAssignmentsTotal > 0 &&
    mandatoryAssignmentsApproved === mandatoryAssignmentsTotal;

  // 3. EKSİK İNCELEMELER VE KOŞUL DÖKÜMÜ
  const incompleteRequirements: string[] = [];

  if (attendanceRate === null) {
    incompleteRequirements.push('Devam Oranı Henüz Hesaplanamıyor (Tamamlanmış ders yok)');
  } else if (!attendanceEligible) {
    incompleteRequirements.push(
      `Devam Oranı Yetersiz (%${attendanceRate} / Başarı Barajı: %80)`
    );
  }

  if (assignmentAverage === null) {
    incompleteRequirements.push(
      'Ödev Not Ortalaması Henüz Hesaplanamıyor (Değerlendirilmiş ödev yok)'
    );
  } else if (!gradeEligible) {
    incompleteRequirements.push(
      `Ödev Not Ortalaması Yetersiz (${assignmentAverage}/100 / Başarı Barajı: 70)`
    );
  }

  if (mandatoryAssignmentsTotal > 0 && !mandatoryEligible) {
    incompleteRequirements.push(
      `Eksik Zorunlu Ödev Onayı (${mandatoryAssignmentsApproved}/${mandatoryAssignmentsTotal} Onaylandı)`
    );
  }

  if (assignmentPerf.pendingEvaluationCount > 0) {
    incompleteRequirements.push(
      `Eğitmen Değerlendirmesi Bekleyen ${assignmentPerf.pendingEvaluationCount} Teslim Var`
    );
  }

  if (assignmentPerf.revisionRequestedCount > 0) {
    incompleteRequirements.push(
      `Revizyon Sürecinde ${assignmentPerf.revisionRequestedCount} Ödev Var`
    );
  }

  // 4. AKADEMİK KOŞULLARIN TÜMÜ SAĞLANDI MI?
  const academicEligible = attendanceEligible && gradeEligible && mandatoryEligible;

  let eligibilityStatus: AcademicEligibilityStatus = 'undetermined';
  if (academicEligible) {
    eligibilityStatus = 'academic_requirements_met';
  } else if (attendanceRate !== null && !attendanceEligible) {
    eligibilityStatus = 'attendance_failed';
  } else if (assignmentAverage !== null && !gradeEligible) {
    eligibilityStatus = 'grade_failed';
  } else if (mandatoryAssignmentsTotal > 0 && !mandatoryEligible) {
    eligibilityStatus = 'missing_mandatory';
  } else if (assignmentPerf.pendingEvaluationCount > 0 || assignmentPerf.revisionRequestedCount > 0) {
    eligibilityStatus = 'evaluations_in_progress';
  } else {
    eligibilityStatus = 'undetermined';
  }

  // 5. YÖNETİCİ NİHAİ KARARI KONTROLÜ (successDecisionStorage)
  const savedDecision = getSuccessDecisionByEnrollment(enrollment.id);

  let finalStatus: FinalSuccessStatus = 'undetermined';
  let statusLabel = 'Henüz Değerlendirilemiyor';
  let explanation = 'Dönem dersleri ve ödev değerlendirmeleri devam etmektedir.';

  if (savedDecision) {
    if (savedDecision.decision === 'approved') {
      finalStatus = 'admin_approved';
      statusLabel = 'Nihai Onay Verildi (Belgeye Hak Kazandı)';
      explanation =
        savedDecision.traineeDecisionMessage ||
        'Kursiyerin dönem sonu başarı değerlendirmesi yetkili oda yöneticisi tarafından onaylanmış ve belge hakkı tescil edilmiştir.';
    } else if (savedDecision.decision === 'remediation') {
      finalStatus = 'remediation';
      statusLabel = 'Telafi Sürecinde';
      explanation =
        savedDecision.traineeDecisionMessage ||
        'Kursiyer eksik akademik koşul(lar) doğrultusunda yetkili yönetici tarafından telafi sürecine yönlendirilmiştir.';
    } else if (savedDecision.decision === 'additional_review') {
      finalStatus = 'under_review';
      statusLabel = 'Ek İnceleme İsteniyor';
      explanation = savedDecision.traineeDecisionMessage || savedDecision.internalNote;
    } else if (savedDecision.decision === 'rejected') {
      finalStatus = 'rejected';
      statusLabel = 'Başarısız (Belge Verilemez)';
      explanation = savedDecision.traineeDecisionMessage || 'Dönem sonu başarı koşulları sağlanamamıştır.';
    }
  } else {
    // Yönetici kararı henüz yok
    if (academicEligible) {
      finalStatus = 'awaiting_admin_decision';
      statusLabel = 'Tüm Akademik Koşullar Sağlandı (Yönetici Onayı Bekleniyor)';
      explanation =
        'Kursiyer %80 devam, 70 ödev ortalaması ve tüm zorunlu ödev onaylarını başarıyla tamamlamıştır. Nihai başarı tescili için yetkili oda yöneticisinin gerekçeli kararı beklenmektedir.';
    } else if (incompleteRequirements.length > 0) {
      finalStatus = 'missing_requirements';
      statusLabel = 'Eksik Koşul(lar) Bulunuyor';
      explanation = 'Kursiyer henüz gerekli akademik başarı koşullarını tamamlamamıştır.';
    } else {
      finalStatus = 'undetermined';
      statusLabel = 'Henüz Değerlendirilemiyor';
      explanation = 'Dönem başında olunduğundan yeterli oturum ve ödev verisi oluşmamıştır.';
    }
  }

  // 6. SNAPSHOT VE DÜZELTME TUTARSIZLIK KONTROLÜ
  const currentSnapshot: EligibilitySourceSnapshot = {
    attendanceRate,
    attendedCount: attendanceRes.attendedCount,
    completedSessionsCount: attendanceRes.completedSessionsCount,
    excusedCount: attendanceRes.excusedCount,
    assignmentAverage,
    mandatoryAssignmentsApproved,
    mandatoryAssignmentsTotal,
    sessionsEvaluatedCount: attendanceRes.completedSessionsCount,
    capturedAt: nowIso,
  };

  let hasDiscrepancy = false;
  if (savedDecision && savedDecision.eligibilitySnapshot) {
    const s = savedDecision.eligibilitySnapshot;
    if (
      s.attendanceRate !== attendanceRate ||
      s.assignmentAverage !== assignmentAverage ||
      s.mandatoryAssignmentsApproved !== mandatoryAssignmentsApproved
    ) {
      hasDiscrepancy = true;
    }
  }

  return {
    enrollmentId: enrollment.id,
    traineeId: enrollment.candidateId,
    traineeName: enrollment.candidateName,
    traineeEmail: enrollment.candidateEmail,
    programId: enrollment.programId,
    programTitle: enrollment.programTitle,
    termId: enrollment.termId || termId || 'term-2026-fall',
    cohortName: enrollment.cohortName || '2026 Güz Dönemi',
    groupId,
    groupName,
    instructorNames,
    attendanceRate,
    attendanceEligible,
    completedSessionsCount: attendanceRes.completedSessionsCount,
    attendedCount: attendanceRes.attendedCount,
    absentCount: attendanceRes.absentCount,
    excusedCount: attendanceRes.excusedCount,
    assignmentAverage,
    gradeEligible,
    mandatoryAssignmentsTotal,
    mandatoryAssignmentsApproved,
    mandatoryEligible,
    outstandingEvaluations:
      assignmentPerf.pendingEvaluationCount + assignmentPerf.revisionRequestedCount,
    incompleteRequirements,
    academicEligible,
    eligibilityStatus,
    finalStatus,
    statusLabel,
    explanation,
    calculatedAt: nowIso,
    policyVersion,
    sourceSnapshot: currentSnapshot,
    hasDiscrepancyWithSavedSnapshot: hasDiscrepancy,
  };
};

// ============================================================================
// 2. TOPLU / GRUP BAZLI BAŞARI RAPORU MOTORU (Yönetici Masası İçin)
// ============================================================================

export const calculateBatchEligibility = (
  programId?: string,
  termId?: string,
  groupId?: string
): FinalEligibilityResult[] => {
  const allEnrollments = getStoredEnrollments();
  const allAssignments = getStoredAssignments();

  // Kesin kayıtları filtrele (yalnızca kesin kayıtlı ve aktif olanlar)
  const filteredEnrollments = allEnrollments.filter((e) => {
    if (e.status !== 'confirmed') return false;
    if (programId && programId !== 'all' && e.programId !== programId) return false;
    if (termId && termId !== 'all' && e.termId !== termId) return false;

    if (groupId && groupId !== 'all') {
      const matchAsgn = allAssignments.find(
        (a) => (a.enrollmentId === e.id || a.candidateId === e.candidateId) && a.status === 'active'
      );
      if (!matchAsgn || matchAsgn.groupId !== groupId) return false;
    }

    return true;
  });

  return filteredEnrollments.map((enr) => calculateFinalEligibility(enr.id, termId));
};
