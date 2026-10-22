import {
  Assignment,
  AssignmentSubmission,
  AssignmentEvaluation,
  SubmissionStatus,
  EvaluationDecision,
  AssignmentRevisionHistoryItem,
  AssignmentSubmissionContent,
} from '../types';
import { DEMO_TRAINEE_ASSIGNMENTS } from '../data/educationData';
import { getGroupAssignmentsByGroup } from './enrollmentStorage';
import {
  notifyAssignmentPublished,
  notifyAssignmentRevisionRequested,
  notifyAssignmentEvaluated,
} from './notificationEngine';

export const COURSE_ASSIGNMENTS_STORAGE_KEY = 'islahiye_education_course_assignments_v1';
export const SUBMISSIONS_STORAGE_KEY = 'islahiye_education_submissions_v1';
export const EVALUATIONS_STORAGE_KEY = 'islahiye_education_evaluations_v1';
export const ASSIGNMENTS_UPDATE_EVENT = 'islahiye_education_assignments_updated';

// ============================================================================
// 1. BAŞLANGIÇ DEMO ÖDEV TANIMLARI
// ============================================================================
export const INITIAL_COURSE_ASSIGNMENTS: Assignment[] = [
  ...DEMO_TRAINEE_ASSIGNMENTS,
  {
    id: 'asg-04',
    programId: 'prog-01',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-01',
    groupName: 'Grup A (Hafta İçi Akşam)',
    instructorId: 'user-instructor-01',
    instructorName: 'Murat Özkan',
    title: 'Ödev #4: Sosyal Medya İletişim & Dijital Tanıtım Şablonu (İsteğe Bağlı)',
    description: 'Yöresel gastronomi ürününün sosyal medya tanıtımı için 1 adet gönderi metni ve etiket stratejisi oluşturma.',
    assignedAt: '2026-10-21T10:00:00+03:00',
    dueAt: '2026-11-05T23:59:00+03:00',
    dueDate: '5 Kasım 2026',
    maxScore: 100,
    isMandatory: false,
    isRequired: false,
    acceptedSubmissionTypes: ['text', 'link'],
    lateSubmissionPolicy: 'allow_with_flag',
    publicationStatus: 'published',
    createdAt: '2026-10-21T10:00:00+03:00',
    updatedAt: '2026-10-21T10:00:00+03:00',
  },
  {
    id: 'asg-05-draft',
    programId: 'prog-01',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-01',
    groupName: 'Grup A (Hafta İçi Akşam)',
    instructorId: 'user-instructor-01',
    instructorName: 'Murat Özkan',
    title: 'Taslak Ödev #5: Gelişmiş İhracat Dokümantasyonu ve Akreditif Simülasyonu',
    description: 'Akreditifli satış sürecinde düzenlenmesi gereken konşimento ve menşe şahadetnamesi taslağı hazırlığı.',
    assignedAt: '2026-10-21T14:00:00+03:00',
    dueAt: '2026-11-15T23:59:00+03:00',
    dueDate: '15 Kasım 2026',
    maxScore: 100,
    isMandatory: true,
    isRequired: true,
    acceptedSubmissionTypes: ['file', 'text'],
    lateSubmissionPolicy: 'allow',
    publicationStatus: 'draft', // Kursiyere görünmez!
    createdAt: '2026-10-21T14:00:00+03:00',
    updatedAt: '2026-10-21T14:00:00+03:00',
  },
  {
    id: 'asg-06-grp2',
    programId: 'prog-02',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-02',
    groupName: 'Grup B (Hafta Sonu Gündüz)',
    instructorId: 'user-instructor-02',
    instructorName: 'Selin Yılmaz',
    title: 'Ödev #1: Pazaryeri Mağaza Açılış Evrakları ve Sözleşme İncelemesi',
    description: 'E-Ticaret pazaryerinde kurumsal satıcı hesabı başvurusu için gerekli vergi levhası ve imza sirküleri kontrol listesi.',
    assignedAt: '2026-10-18T10:00:00+03:00',
    dueAt: '2026-10-28T23:59:00+03:00',
    dueDate: '28 Ekim 2026',
    maxScore: 100,
    isMandatory: true,
    isRequired: true,
    acceptedSubmissionTypes: ['text', 'file'],
    lateSubmissionPolicy: 'allow_with_flag',
    publicationStatus: 'published',
    createdAt: '2026-10-18T10:00:00+03:00',
    updatedAt: '2026-10-18T10:00:00+03:00',
  },
];

// ============================================================================
// 2. BAŞLANGIÇ DEMO TESLİMLERİ (Submissions)
// ============================================================================
export const INITIAL_SUBMISSIONS: AssignmentSubmission[] = [
  // Ayşe Demir (user-trainee-01 / t-02) -> Ödev #1 (Onaylandı)
  {
    id: 'sub-ayse-01',
    assignmentId: 'asg-01',
    enrollmentId: 'enr-ayse-01',
    traineeId: 'user-trainee-01',
    traineeName: 'Ayşe Demir',
    submittedAt: '2026-10-14T14:30:00+03:00',
    submissionVersion: 1,
    content: {
      text: 'Tescilli İslahiye biberi için pazaryeri standartlarına uygun 3 adet ürün başlığı ve içerik açıklaması hazırlandı. Gramaj ve acılık skalası belirtildi.',
      linkUrl: 'https://ornek-pazaryeri.com/magaza/islahiye-biberi-urun-01',
    },
    status: 'approved',
    isLate: false,
    createdAt: '2026-10-14T14:30:00+03:00',
    updatedAt: '2026-10-15T11:00:00+03:00',
  },
  // Ayşe Demir -> Ödev #2 (Revizyon İstendi - Sürüm 1)
  {
    id: 'sub-ayse-02',
    assignmentId: 'asg-02',
    enrollmentId: 'enr-ayse-01',
    traineeId: 'user-trainee-01',
    traineeName: 'Ayşe Demir',
    submittedAt: '2026-10-18T16:20:00+03:00',
    submissionVersion: 1,
    content: {
      text: 'Pazaryeri panel simülatöründe mağaza açılış ekran görüntüsü ve kargo etiket taslağı hazırlandı.',
      linkUrl: 'https://ornek-depo.com/kargo-taslak-ayse.pdf',
      fileName: 'kargo_etiket_taslak.pdf',
      fileSize: '1.2 MB',
    },
    status: 'revision_requested',
    isLate: false,
    revisionHistory: [
      {
        revisionNumber: 1,
        previousSubmissionId: 'sub-ayse-02',
        requestedAt: '2026-10-19T10:00:00+03:00',
        requestedBy: 'Murat Özkan',
        revisionReason:
          'Kargo desi bilgisi ve barkod formatı eksik. Lütfen standart barkod formatını ekleyerek tekrar yükleyiniz.',
        evaluationResult: {
          score: 65,
          feedback:
            'Kargo desi bilgisi ve barkod formatı eksik. Lütfen standart barkod formatını ekleyerek tekrar yükleyiniz.',
          decision: 'revision_requested',
          evaluatedAt: '2026-10-19T10:00:00+03:00',
        },
      },
    ],
    createdAt: '2026-10-18T16:20:00+03:00',
    updatedAt: '2026-10-19T10:00:00+03:00',
  },
  // Ahmet Karataş (user-trainee-02 / t-01) -> Ödev #1 (Onaylandı)
  {
    id: 'sub-ahmet-01',
    assignmentId: 'asg-01',
    enrollmentId: 'enr-ahmet-01',
    traineeId: 'user-trainee-02',
    traineeName: 'Ahmet Karataş',
    submittedAt: '2026-10-15T09:15:00+03:00',
    submissionVersion: 1,
    content: {
      text: 'Biber salçası ve pul biber için ürün kartları ve SEO açıklamaları eksiksiz hazırlandı.',
      linkUrl: 'https://ornek-pazaryeri.com/ahmet-biber',
    },
    status: 'approved',
    isLate: false,
    createdAt: '2026-10-15T09:15:00+03:00',
    updatedAt: '2026-10-15T14:00:00+03:00',
  },
  // Fatma Şahin (user-applicant-01 / t-06) -> Ödev #1 (Değerlendirme Bekliyor)
  {
    id: 'sub-fatma-01',
    assignmentId: 'asg-01',
    enrollmentId: 'enr-fatma-01',
    traineeId: 'user-applicant-01',
    traineeName: 'Fatma Şahin',
    submittedAt: '2026-10-15T22:30:00+03:00',
    submissionVersion: 1,
    content: {
      text: 'Kurutmalık biber ve pul biber ihracat ambalajı açıklamaları hazırlandı.',
    },
    status: 'submitted',
    isLate: false,
    createdAt: '2026-10-15T22:30:00+03:00',
    updatedAt: '2026-10-15T22:30:00+03:00',
  },
];

// ============================================================================
// 3. BAŞLANGIÇ DEMO DEĞERLENDİRMELERİ (Evaluations)
// ============================================================================
export const INITIAL_EVALUATIONS: AssignmentEvaluation[] = [
  // Ayşe Demir -> Ödev #1
  {
    id: 'eval-ayse-01',
    submissionId: 'sub-ayse-01',
    assignmentId: 'asg-01',
    traineeId: 'user-trainee-01',
    evaluatorId: 'user-instructor-01',
    evaluatorName: 'Murat Özkan',
    score: 85,
    feedback: 'Ürün açıklamaları çok başarılı. Coğrafi işaret ve gramaj detayları eklenmiş.',
    decision: 'approved',
    evaluatedAt: '2026-10-15T11:00:00+03:00',
    revisionRequested: false,
    evaluationVersion: 1,
  },
  // Ayşe Demir -> Ödev #2 (Revizyon Kararı)
  {
    id: 'eval-ayse-02',
    submissionId: 'sub-ayse-02',
    assignmentId: 'asg-02',
    traineeId: 'user-trainee-01',
    evaluatorId: 'user-instructor-01',
    evaluatorName: 'Murat Özkan',
    score: 65,
    feedback:
      'Kargo desi bilgisi ve barkod formatı eksik. Lütfen standart barkod formatını ekleyerek tekrar yükleyiniz.',
    decision: 'revision_requested',
    evaluatedAt: '2026-10-19T10:00:00+03:00',
    revisionRequested: true,
    evaluationVersion: 1,
  },
  // Ahmet Karataş -> Ödev #1
  {
    id: 'eval-ahmet-01',
    submissionId: 'sub-ahmet-01',
    assignmentId: 'asg-01',
    traineeId: 'user-trainee-02',
    evaluatorId: 'user-instructor-01',
    evaluatorName: 'Murat Özkan',
    score: 90,
    feedback: 'Kapsamlı ve eksiksiz ürün girişi. Tebrikler.',
    decision: 'approved',
    evaluatedAt: '2026-10-15T14:00:00+03:00',
    revisionRequested: false,
    evaluationVersion: 1,
  },
];

// ============================================================================
// 4. STORAGE YÖNETİMİ & EVENT YAYINI
// ============================================================================

const notifyUpdates = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ASSIGNMENTS_UPDATE_EVENT));
  }
};

// --- ÖDEVLER (Course Assignments) ---
export const getStoredCourseAssignments = (): Assignment[] => {
  try {
    const raw = localStorage.getItem(COURSE_ASSIGNMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        COURSE_ASSIGNMENTS_STORAGE_KEY,
        JSON.stringify(INITIAL_COURSE_ASSIGNMENTS)
      );
      return INITIAL_COURSE_ASSIGNMENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_COURSE_ASSIGNMENTS;
  } catch (err) {
    console.error('getStoredCourseAssignments error:', err);
    return INITIAL_COURSE_ASSIGNMENTS;
  }
};

export const saveCourseAssignmentsToStorage = (assignments: Assignment[]): void => {
  try {
    localStorage.setItem(COURSE_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
    notifyUpdates();
  } catch (err) {
    console.error('saveCourseAssignmentsToStorage error:', err);
  }
};

export const getCourseAssignmentsByGroup = (
  groupId: string,
  includeDrafts = false
): Assignment[] => {
  const all = getStoredCourseAssignments();
  return all.filter((a) => {
    if (a.groupId !== groupId) return false;
    if (!includeDrafts && a.publicationStatus === 'draft') return false;
    return true;
  });
};

export const createCourseAssignment = (
  data: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>
): { success: boolean; assignment?: Assignment; error?: string } => {
  try {
    if (!data.title.trim()) {
      return { success: false, error: 'Ödev başlığı zorunludur.' };
    }
    if (!data.groupId) {
      return { success: false, error: 'Eğitim grubu seçimi zorunludur.' };
    }
    if (!data.dueAt) {
      return { success: false, error: 'Son teslim tarihi zorunludur.' };
    }

    const all = getStoredCourseAssignments();
    const nowIso = new Date().toISOString();
    const newId = `asg-${Date.now().toString().slice(-6)}`;

    const newAssignment: Assignment = {
      ...data,
      id: newId,
      maxScore: data.maxScore || 100,
      isMandatory: data.isMandatory !== undefined ? data.isMandatory : true,
      isRequired: data.isMandatory !== undefined ? data.isMandatory : true,
      acceptedSubmissionTypes:
        data.acceptedSubmissionTypes?.length > 0
          ? data.acceptedSubmissionTypes
          : ['text', 'link'],
      lateSubmissionPolicy: data.lateSubmissionPolicy || 'allow_with_flag',
      publicationStatus: data.publicationStatus || 'published',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    all.push(newAssignment);
    saveCourseAssignmentsToStorage(all);

    // Bildirim tetikle (Yalnızca yayınlanmış ödevler için, taslaklar bildirim üretmez!)
    try {
      if (newAssignment.publicationStatus === 'published') {
        const traineeIds = getGroupAssignmentsByGroup(newAssignment.groupId).map((a) => a.candidateId);
        notifyAssignmentPublished(newAssignment, traineeIds);
      }
    } catch (notifErr) {
      console.warn('Ödev bildirim hatası:', notifErr);
    }

    return { success: true, assignment: newAssignment };
  } catch (err) {
    return { success: false, error: 'Ödev oluşturulurken hata meydana geldi.' };
  }
};

export const updateCourseAssignment = (
  id: string,
  updates: Partial<Assignment>
): { success: boolean; error?: string } => {
  try {
    const all = getStoredCourseAssignments();
    const index = all.findIndex((a) => a.id === id);
    if (index === -1) {
      return { success: false, error: 'Ödev bulunamadı.' };
    }

    const nowIso = new Date().toISOString();
    all[index] = {
      ...all[index],
      ...updates,
      updatedAt: nowIso,
    };

    saveCourseAssignmentsToStorage(all);
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Ödev güncellenirken hata meydana geldi.' };
  }
};

// --- TESLİMLER (Submissions) ---
export const getStoredSubmissions = (): AssignmentSubmission[] => {
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(INITIAL_SUBMISSIONS));
      return INITIAL_SUBMISSIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SUBMISSIONS;
  } catch (err) {
    console.error('getStoredSubmissions error:', err);
    return INITIAL_SUBMISSIONS;
  }
};

export const saveSubmissionsToStorage = (submissions: AssignmentSubmission[]): void => {
  try {
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions));
    notifyUpdates();
  } catch (err) {
    console.error('saveSubmissionsToStorage error:', err);
  }
};

export const getSubmissionsByAssignment = (assignmentId: string): AssignmentSubmission[] => {
  const all = getStoredSubmissions();
  return all.filter((s) => s.assignmentId === assignmentId);
};

export const getSubmissionsByTrainee = (traineeId: string): AssignmentSubmission[] => {
  const all = getStoredSubmissions();
  return all.filter((s) => s.traineeId === traineeId);
};

export const getLatestSubmission = (
  assignmentId: string,
  traineeId: string
): AssignmentSubmission | null => {
  const all = getStoredSubmissions();
  const matched = all
    .filter((s) => s.assignmentId === assignmentId && s.traineeId === traineeId)
    .sort((a, b) => b.submissionVersion - a.submissionVersion);
  return matched[0] || null;
};

export const submitAssignment = ({
  assignmentId,
  enrollmentId,
  traineeId,
  traineeName,
  content,
  attachmentRefs,
  lateReason,
}: {
  assignmentId: string;
  enrollmentId: string;
  traineeId: string;
  traineeName: string;
  content: AssignmentSubmissionContent;
  attachmentRefs?: string[];
  lateReason?: string;
}): { success: boolean; submission?: AssignmentSubmission; error?: string } => {
  try {
    if (!assignmentId || !traineeId) {
      return { success: false, error: 'Eksik ödev veya kursiyer bilgisi.' };
    }

    // Doğrulama: En az bir içerik alanı dolu olmalı
    const hasText = content.text && content.text.trim().length > 0;
    const hasLink = content.linkUrl && content.linkUrl.trim().length > 0;
    const hasFile = content.fileName && content.fileName.trim().length > 0;
    if (!hasText && !hasLink && !hasFile) {
      return {
        success: false,
        error: 'Lütfen teslim için metin açıklaması, bağlantı URL veya dosya ekleyiniz.',
      };
    }

    const assignments = getStoredCourseAssignments();
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) {
      return { success: false, error: 'Ödev tanımı sistemde bulunamadı.' };
    }

    const allSubmissions = getStoredSubmissions();
    const prevSub = getLatestSubmission(assignmentId, traineeId);

    const now = new Date();
    const nowIso = now.toISOString();

    // Geç teslim kontrolü
    let isLate = false;
    if (assignment.dueAt) {
      const dueDate = new Date(assignment.dueAt);
      if (now.getTime() > dueDate.getTime()) {
        isLate = true;
        if (assignment.lateSubmissionPolicy === 'disallow') {
          return {
            success: false,
            error: 'Bu ödev için son teslim tarihi geçmiştir ve geç teslime izin verilmemektedir.',
          };
        }
      }
    }

    const nextVersion = prevSub ? prevSub.submissionVersion + 1 : 1;
    const newSubId = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Revizyon geçmişi
    const existingHistory: AssignmentRevisionHistoryItem[] = prevSub?.revisionHistory
      ? [...prevSub.revisionHistory]
      : [];

    if (prevSub && prevSub.status === 'revision_requested') {
      // Önceki teslim revizyon istendiyse ve tekrar gönderiliyorsa, geçmişe işaretle
      const lastHistIndex = existingHistory.length - 1;
      if (lastHistIndex >= 0) {
        existingHistory[lastHistIndex].resubmittedAt = nowIso;
      }
    }

    const newStatus: SubmissionStatus = prevSub ? 'resubmitted' : 'submitted';

    const newSubmission: AssignmentSubmission = {
      id: newSubId,
      assignmentId,
      enrollmentId,
      traineeId,
      traineeName,
      submittedAt: nowIso,
      submissionVersion: nextVersion,
      content,
      attachmentRefs,
      status: newStatus,
      isLate,
      lateReason,
      revisionHistory: existingHistory,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    allSubmissions.push(newSubmission);
    saveSubmissionsToStorage(allSubmissions);

    return { success: true, submission: newSubmission };
  } catch (err) {
    return { success: false, error: 'Teslim işlemi kaydedilirken hata oluştu.' };
  }
};

// --- DEĞERLENDİRMELER (Evaluations) ---
export const getStoredEvaluations = (): AssignmentEvaluation[] => {
  try {
    const raw = localStorage.getItem(EVALUATIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EVALUATIONS_STORAGE_KEY, JSON.stringify(INITIAL_EVALUATIONS));
      return INITIAL_EVALUATIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_EVALUATIONS;
  } catch (err) {
    console.error('getStoredEvaluations error:', err);
    return INITIAL_EVALUATIONS;
  }
};

export const saveEvaluationsToStorage = (evaluations: AssignmentEvaluation[]): void => {
  try {
    localStorage.setItem(EVALUATIONS_STORAGE_KEY, JSON.stringify(evaluations));
    notifyUpdates();
  } catch (err) {
    console.error('saveEvaluationsToStorage error:', err);
  }
};

export const getEvaluationForSubmission = (
  submissionId: string
): AssignmentEvaluation | null => {
  const all = getStoredEvaluations();
  return all.find((e) => e.submissionId === submissionId) || null;
};

export const evaluateSubmission = ({
  submissionId,
  evaluatorId,
  evaluatorName,
  score,
  feedback,
  decision,
}: {
  submissionId: string;
  evaluatorId: string;
  evaluatorName: string;
  score: number;
  feedback: string;
  decision: EvaluationDecision;
}): { success: boolean; evaluation?: AssignmentEvaluation; error?: string } => {
  try {
    if (score < 0 || score > 100 || isNaN(score)) {
      return { success: false, error: 'Ödev puanı 0 ile 100 arasında bir sayı olmalıdır.' };
    }

    if (decision === 'revision_requested' && !feedback.trim()) {
      return {
        success: false,
        error: 'Revizyon talebi için eğitmen gerekçesi ve yönlendirici geri bildirim zorunludur.',
      };
    }

    const allSubmissions = getStoredSubmissions();
    const subIndex = allSubmissions.findIndex((s) => s.id === submissionId);
    if (subIndex === -1) {
      return { success: false, error: 'Değerlendirilecek teslim kaydı bulunamadı.' };
    }

    const submission = allSubmissions[subIndex];
    const nowIso = new Date().toISOString();

    // Yeni Değerlendirme Kaydı
    const allEvaluations = getStoredEvaluations();
    const evalId = `eval-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const newEvaluation: AssignmentEvaluation = {
      id: evalId,
      submissionId,
      assignmentId: submission.assignmentId,
      traineeId: submission.traineeId,
      evaluatorId,
      evaluatorName,
      score,
      feedback: feedback.trim(),
      decision,
      evaluatedAt: nowIso,
      revisionRequested: decision === 'revision_requested',
      evaluationVersion: submission.submissionVersion,
    };

    allEvaluations.push(newEvaluation);
    saveEvaluationsToStorage(allEvaluations);

    // Teslim kaydının statüsünü ve revizyon geçmişini güncelle
    const updatedHistory: AssignmentRevisionHistoryItem[] = submission.revisionHistory
      ? [...submission.revisionHistory]
      : [];

    if (decision === 'revision_requested') {
      updatedHistory.push({
        revisionNumber: submission.submissionVersion,
        previousSubmissionId: submission.id,
        requestedAt: nowIso,
        requestedBy: evaluatorName,
        revisionReason: feedback.trim(),
        evaluationResult: {
          score,
          feedback: feedback.trim(),
          decision: 'revision_requested',
          evaluatedAt: nowIso,
        },
      });
      submission.status = 'revision_requested';
    } else if (decision === 'approved') {
      submission.status = 'approved';
    } else {
      submission.status = 'rejected';
    }

    submission.revisionHistory = updatedHistory;
    submission.updatedAt = nowIso;
    allSubmissions[subIndex] = submission;
    saveSubmissionsToStorage(allSubmissions);

    // Bildirim tetikle (Non-blocking)
    try {
      const assignment = getStoredCourseAssignments().find((a) => a.id === submission.assignmentId);
      if (assignment) {
        if (decision === 'revision_requested') {
          notifyAssignmentRevisionRequested(assignment, submission.traineeId, feedback.trim());
        } else {
          notifyAssignmentEvaluated(assignment, submission.traineeId, score, decision === 'approved');
        }
      }
    } catch (notifErr) {
      console.warn('Ödev değerlendirme bildirim hatası:', notifErr);
    }

    return { success: true, evaluation: newEvaluation };
  } catch (err) {
    return { success: false, error: 'Değerlendirme kaydedilirken hata oluştu.' };
  }
};

// --- REAKTİF ABONELİK ---
export const subscribeToAssignmentUpdates = (callback: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(ASSIGNMENTS_UPDATE_EVENT, callback);
  return () => {
    window.removeEventListener(ASSIGNMENTS_UPDATE_EVENT, callback);
  };
};

export const resetAssignmentStorageToInitial = (): void => {
  localStorage.setItem(
    COURSE_ASSIGNMENTS_STORAGE_KEY,
    JSON.stringify(INITIAL_COURSE_ASSIGNMENTS)
  );
  localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(INITIAL_SUBMISSIONS));
  localStorage.setItem(EVALUATIONS_STORAGE_KEY, JSON.stringify(INITIAL_EVALUATIONS));
  notifyUpdates();
};
