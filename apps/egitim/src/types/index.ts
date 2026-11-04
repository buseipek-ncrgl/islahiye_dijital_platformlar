/**
 * İslahiye Eğitim Portalı
 * Tip Tanımları (TypeScript Models)
 */

export type UserRole = 'visitor' | 'applicant' | 'trainee' | 'instructor' | 'admin' | 'superadmin';

export interface UserProfile {
  id: string;
  fullName: string;
  name?: string;
  email: string;
  role: UserRole;
  roles?: UserRole[]; // Kullanıcının sahip olduğu tüm roller (Çoklu rol ve ilişki ayrımı)
  title?: string;
  department?: string;
  groupName?: string;
  assignedGroupIds?: string[]; // Görevli/kayıtlı olduğu eğitim grupları
  assignedProgramIds?: string[];
  phone?: string;
  residenceDistrict?: string;
  occupation?: string;
  isActive?: boolean; // Pasif durumdaki kullanıcı işlem yapamaz
  statusReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ProgramCategory =
  | 'Tarım & E-Ticaret'
  | 'Dış Ticaret'
  | 'Dijital Beceriler'
  | 'Pazarlama'
  | 'Girişimcilik ve İşletme'
  | 'El Sanatları'
  | 'Gastronomi'
  | string;
export type ProgramStatus = 'open' | 'pre_registration' | 'almost_full' | 'planned';
export type TrainingMode = 'Yüz Yüze' | 'Hibrit' | 'Çevrimiçi';

export interface CurriculumModule {
  sessionNumber: number;
  title: string;
  hours: number;
  description: string;
}

export interface Program {
  id: string;
  title: string;
  category: ProgramCategory;
  description: string;
  targetAudience: string;
  durationWeeks: number;
  totalHours: number;
  cohortName: string;
  quota: number;
  enrolledCount: number;
  location: string;
  mode: TrainingMode;
  status: ProgramStatus;
  curriculumModules: CurriculumModule[];
  image?: string;
  badgeColor?: string;
  level?: string;
  term?: string;
  durationMonths?: string;
  type?: string;
  certified?: boolean | string;
  highlights?: string[];
}

export type SessionStatus =
  | 'scheduled'
  | 'active'
  | 'attendance_open'
  | 'completed'
  | 'cancelled';

export interface Session {
  id: string;
  programId?: string;
  programTitle?: string;
  termId?: string;
  cohortName?: string;
  groupId: string;
  groupName?: string;
  sessionNumber: number;
  title: string;
  topic?: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  isOnline?: boolean;
  onlineMeetingUrl?: string;
  instructorId?: string;
  instructorName: string;
  status: SessionStatus;
  attendanceClosedAt?: string;
  attendanceClosedBy?: string;
  attendanceCorrectionReason?: string;
  notes?: string;
}

export type AttendanceStatus = 'attended' | 'absent' | 'excused';
export type AttendanceMarkStatus = AttendanceStatus | 'unmarked';

export interface AttendanceCorrectionHistoryItem {
  id: string;
  fromStatus: AttendanceMarkStatus;
  toStatus: AttendanceStatus;
  reason: string;
  correctedBy: string;
  correctedAt: string;
}

export interface AttendanceRecord {
  traineeId: string;
  traineeName: string;
  previousRate: number;
  attendedSessions: number;
  totalCompletedSessions: number;
  status?: AttendanceStatus;
}

export interface SessionAttendanceRecord {
  id: string;
  sessionId: string;
  groupId: string;
  enrollmentId?: string;
  candidateId: string;
  traineeId: string; // Aday / kursiyer kimliği
  traineeName: string;
  status: AttendanceMarkStatus;
  markedAt?: string;
  markedBy?: string;
  correctionReason?: string;
  correctionHistory?: AttendanceCorrectionHistoryItem[];
}

export interface AttendanceCalculationResult {
  candidateId: string;
  enrollmentId?: string;
  groupId: string;
  totalSessions: number;
  eligibleSessionsCount: number;
  completedSessionsCount: number;
  attendedCount: number;
  absentCount: number;
  excusedCount: number;
  unmarkedCount: number;
  attendanceRate: number | null; // null ise "Henüz Hesaplanamıyor"
  hasPassedThreshold: boolean;
  isAtRisk: boolean;
  statusText: string;
  policyNote: string;
}

export interface GroupAttendanceSummary {
  groupId: string;
  groupName: string;
  totalSessions: number;
  completedSessions: number;
  pendingAttendanceSessions: number;
  scheduledSessions: number;
  cancelledSessions: number;
  averageAttendanceRate: number | null;
  atRiskTraineesCount: number;
  totalTrainees: number;
}

export type SubmissionType = 'text' | 'link' | 'file';
export type LateSubmissionPolicy = 'allow' | 'allow_with_flag' | 'disallow';
export type AssignmentPublicationStatus = 'draft' | 'published';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  programId: string;
  termId: string;
  cohortName?: string;
  groupId: string;
  groupName?: string;
  instructorId: string;
  instructorName?: string;
  relatedSessionId?: string;
  assignedAt: string;
  dueAt: string; // ISO string or formatted date
  dueDate?: string; // backward compat
  maxScore: number; // varsayılan 100
  isMandatory: boolean;
  isRequired?: boolean; // backward compat
  acceptedSubmissionTypes: SubmissionType[];
  lateSubmissionPolicy: LateSubmissionPolicy;
  publicationStatus: AssignmentPublicationStatus;
  status?: 'pending' | 'submitted' | 'approved' | 'revision_requested'; // backward compat
  grade?: number; // backward compat
  instructorFeedback?: string; // backward compat
  revisionsCount?: number; // backward compat
  submittedAt?: string; // backward compat
  createdAt: string;
  updatedAt: string;
}

export type CourseAssignment = Assignment;

export type SubmissionStatus =
  | 'submitted'
  | 'under_review'
  | 'revision_requested'
  | 'resubmitted'
  | 'evaluated'
  | 'approved'
  | 'rejected';

export interface AssignmentSubmissionContent {
  text?: string;
  linkUrl?: string;
  fileName?: string;
  fileSize?: string;
  fileDataUrl?: string;
}

export interface AssignmentRevisionHistoryItem {
  revisionNumber: number;
  previousSubmissionId: string;
  requestedAt: string;
  requestedBy: string;
  revisionReason: string;
  resubmittedAt?: string;
  evaluationResult?: {
    score: number;
    feedback: string;
    decision: 'approved' | 'revision_requested' | 'rejected';
    evaluatedAt: string;
  };
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  enrollmentId: string;
  traineeId: string;
  traineeName: string;
  submittedAt: string;
  submissionVersion: number;
  content: AssignmentSubmissionContent;
  attachmentRefs?: string[];
  status: SubmissionStatus;
  isLate: boolean;
  lateReason?: string;
  revisionHistory?: AssignmentRevisionHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export type EvaluationDecision = 'approved' | 'revision_requested' | 'rejected';

export interface AssignmentEvaluation {
  id: string;
  submissionId: string;
  assignmentId: string;
  traineeId: string;
  evaluatorId: string;
  evaluatorName: string;
  score: number; // 0 - 100
  feedback: string;
  decision: EvaluationDecision;
  evaluatedAt: string;
  revisionRequested: boolean;
  evaluationVersion: number;
}

export interface TraineeAssignmentPerformance {
  traineeId: string;
  traineeName: string;
  groupId: string;
  totalAssignments: number;
  mandatoryAssignmentsTotal: number;
  mandatoryAssignmentsApproved: number;
  isMandatoryAllApproved: boolean;
  evaluatedAssignmentsCount: number;
  averageScore: number | null; // null if no evaluated assignments yet -> "Henüz Hesaplanamıyor"
  hasPassedThreshold: boolean; // averageScore !== null && averageScore >= 70
  pendingEvaluationCount: number;
  revisionRequestedCount: number;
  missingSubmissionsCount: number;
}

export type OverallPreCheckStatus =
  | 'requirements_met'
  | 'missing_assignments'
  | 'attendance_insufficient'
  | 'average_insufficient'
  | 'evaluations_in_progress'
  | 'undetermined';

export interface OverallSuccessPreCheck {
  traineeId: string;
  traineeName: string;
  attendanceRate: number | null;
  attendancePassed: boolean;
  assignmentAverage: number | null;
  assignmentPassed: boolean;
  mandatoryTotal: number;
  mandatoryApproved: number;
  mandatoryPassed: boolean;
  adminApproved: boolean; // strictly false in E03-B
  isCertified: boolean;   // strictly false in E03-B
  preCheckStatus: OverallPreCheckStatus;
  statusLabel: string;
  explanation: string;
}

// =============================================================================
// SPRINT E03-C: NİHAİ BAŞARI DEĞERLENDİRMESİ, YÖNETİCİ ONAYI VE DÖNEM SONU KÜTÜĞÜ
// =============================================================================

export type AcademicEligibilityStatus =
  | 'undetermined'                 // Henüz Değerlendirilemiyor
  | 'evaluations_in_progress'      // Değerlendirmeler Devam Ediyor
  | 'missing_mandatory'            // Eksik Zorunlu Ödev Var
  | 'attendance_failed'            // Devam Koşulu Sağlanmadı (< %80)
  | 'grade_failed'                 // Ödev Ortalama Koşulu Sağlanmadı (< 70)
  | 'academic_requirements_met';   // Tüm Akademik Koşullar Sağlandı

export type FinalSuccessStatus =
  | 'undetermined'                 // Henüz Değerlendirilemiyor
  | 'evaluations_in_progress'      // Değerlendirmeler Devam Ediyor
  | 'missing_requirements'         // Eksik Koşul(lar) Var
  | 'awaiting_admin_decision'      // Akademik Koşullar Tamam — Yönetici Kararı Bekleniyor
  | 'admin_approved'               // Nihai Onay Verildi (Belgeye Hak Kazandı)
  | 'remediation'                  // Telafi Sürecinde
  | 'under_review'                 // Ek İnceleme İsteniyor
  | 'rejected'                     // Başarısız
  | 'cancelled';                   // Kayıt / Değerlendirme İptal Edildi

export type AdminSuccessDecisionType =
  | 'approved'                     // Nihai Başarı Onayı Ver
  | 'remediation'                  // Telafi Sürecine Yönlendir
  | 'additional_review'            // Ek İnceleme İste
  | 'rejected';                    // Başarısız Olarak Sonuçlandır

export interface EligibilitySourceSnapshot {
  attendanceRate: number | null;
  attendedCount: number;
  completedSessionsCount: number;
  excusedCount: number;
  assignmentAverage: number | null;
  mandatoryAssignmentsApproved: number;
  mandatoryAssignmentsTotal: number;
  sessionsEvaluatedCount: number;
  capturedAt: string;
}

export interface FinalEligibilityResult {
  enrollmentId: string;
  traineeId: string;
  traineeName: string;
  traineeEmail?: string;
  programId: string;
  programTitle: string;
  termId: string;
  cohortName: string;
  groupId: string;
  groupName: string;
  instructorNames: string[];
  attendanceRate: number | null;
  attendanceEligible: boolean;
  completedSessionsCount: number;
  attendedCount: number;
  absentCount: number;
  excusedCount: number;
  assignmentAverage: number | null;
  gradeEligible: boolean;
  mandatoryAssignmentsTotal: number;
  mandatoryAssignmentsApproved: number;
  mandatoryEligible: boolean;
  outstandingEvaluations: number;
  incompleteRequirements: string[];
  academicEligible: boolean;
  eligibilityStatus: AcademicEligibilityStatus;
  finalStatus: FinalSuccessStatus;
  statusLabel: string;
  explanation: string;
  calculatedAt: string;
  policyVersion: string;
  sourceSnapshot: EligibilitySourceSnapshot;
  hasDiscrepancyWithSavedSnapshot?: boolean;
}

export interface RemediationDetails {
  reason: string;
  targetRequirement: 'attendance' | 'assignment_grade' | 'mandatory_assignment' | 'multiple';
  targetRequirementLabel: string;
  dueDate: string;
  requiredActionNote: string;
  assignedAt: string;
  completedAt?: string;
  outcome?: 'successful' | 'unsuccessful' | 'pending';
  resolutionNote?: string;
}

export interface DecisionAuditHistoryItem {
  decision: AdminSuccessDecisionType;
  decidedBy: string;
  decidedAt: string;
  internalNote: string;
  traineeDecisionMessage: string;
  snapshot: EligibilitySourceSnapshot;
}

export interface SuccessDecisionRecord {
  decisionId: string;
  enrollmentId: string;
  traineeId: string;
  traineeName: string;
  programId: string;
  termId: string;
  groupId: string;
  decision: AdminSuccessDecisionType;
  eligibilitySnapshot: EligibilitySourceSnapshot;
  policyVersion: string;
  internalNote: string;
  traineeDecisionMessage: string;
  remediationDetails?: RemediationDetails;
  decidedBy: string;
  decidedAt: string;
  decisionHistory: DecisionAuditHistoryItem[];
  status: 'active' | 'superseded';
  certificateEligibility: 'eligible' | 'not_eligible' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface TermRegistryRecord {
  registryId: string;
  programId: string;
  programTitle: string;
  termId: string;
  cohortName: string;
  isClosed: boolean;
  closedAt?: string;
  closedBy?: string;
  closureNotes?: string;
  totalEnrollments: number;
  academicPassedCount: number;
  approvedCount: number;
  remediationCount: number;
  rejectedCount: number;
  pendingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SuccessCriteria {
  attendanceRate: number;         // En az %80
  attendancePassed: boolean;
  assignmentAverage: number;      // En az 70/100
  assignmentPassed: boolean;
  mandatoryAssignmentsTotal: number;
  mandatoryAssignmentsApproved: number;
  mandatoryPassed: boolean;
  adminApproved: boolean;         // Nihai admin onayı
  isCertified: boolean;
  qrVerificationCode?: string;
}

export type ApplicationWorkflowStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'waitlisted'
  | 'rejected'
  | 'withdrawn';

export type ApplicationStatus = ApplicationWorkflowStatus | 'pending' | 'reserve';

export interface AutoScoreBreakdown {
  total: number;
  ruleVersion: string;
  residencePoints: number; // İslahiye ikameti
  educationPoints: number; // İlgili okul/bölüm mezuniyeti
  experiencePoints: number; // Tarımsal/ticari üretim faaliyeti
}

// =============================================================================
// SPRINT E02-B: DİNAMİK KRİTERLER, SÜRÜMLÜ PUANLAMA VE KARAR DESTEK MODELLERİ
// =============================================================================

export type CriterionType =
  | 'single_choice'
  | 'multi_choice'
  | 'numeric'
  | 'boolean'
  | 'text'
  | 'verified_statement'
  | 'scale_100';

export interface CriterionOption {
  id: string;
  label: string;
  points: number;
  isDisqualifier?: boolean;
}

export interface CriterionNumericThreshold {
  min: number;
  max: number;
  points: number;
  label: string;
}

export interface Criterion {
  id: string;
  code: string; // EXP_01, EDU_01 vb.
  title: string;
  description: string;
  programId: string;
  type: CriterionType;
  isMandatory: boolean;
  weight: number; // Ağırlık yüzdesi (Aktif kriterlerin toplamı 100 olmalı)
  maxScore: number; // Kriterin maksimum ham puanı
  options?: CriterionOption[];
  numericThresholds?: CriterionNumericThreshold[];
  requiresVerification: boolean; // İdari belge doğrulaması gerektirir mi?
  isPrerequisite?: boolean; // Karşılanmazsa ön koşul incelemesi bayrağı açar
  prerequisiteCondition?: string;
}

export interface RecommendationThresholds {
  strong: number; // >= 80 Güçlü Aday
  suitable: number; // 65 - 79 Değerlendirmeye Uygun
  reviewNeeded: number; // 50 - 64 Ek İnceleme Gerekli
}

export type RecommendationStatus =
  | 'strong'
  | 'suitable'
  | 'review_needed'
  | 'prerequisite_review';

export type CriteriaSetStatus = 'active' | 'draft' | 'archived';

export interface CriteriaSet {
  id: string;
  programId: string;
  programTitle: string;
  version: string; // 'v1.0', 'v1.1' vb.
  title: string;
  description: string;
  status: CriteriaSetStatus;
  createdAt: string;
  publishedAt?: string;
  criteria: Criterion[];
  thresholds: RecommendationThresholds;
  allowCandidateScoreView?: boolean; // Varsayılan: false (Adaya yalnızca idari karar ve mesaj görünür)
}

export interface CriterionScoreDetail {
  criterionId: string;
  criterionCode: string;
  criterionTitle: string;
  type: CriterionType;
  weight: number;
  maxScore: number;
  earnedRawScore: number;
  earnedWeightedScore: number;
  explanation: string;
  isMissingMandatory: boolean;
  requiresVerification: boolean;
  isVerified?: boolean;
  prerequisiteMet: boolean;
  candidateAnswerText?: string;
}

export interface EvaluationResult {
  applicationId: string;
  criteriaSetId: string;
  criteriaVersion: string;
  evaluatedAt: string;
  totalWeightedScore: number; // 0 - 100
  recommendation: RecommendationStatus;
  recommendationLabel: string;
  prerequisitesMet: boolean;
  hasUnverifiedStatements: boolean;
  unverifiedStatementsCount: number;
  missingMandatoryCount: number;
  scoreBreakdown: CriterionScoreDetail[];
  notes?: string;
}

export interface DecisionHistoryItem {
  status: ApplicationStatus;
  decidedAt: string;
  decidedBy: string;
  internalDecisionNote: string;
  candidateDecisionMessage: string;
  deviationReason?: string;
  criteriaVersionId?: string;
  score?: number;
}

export interface ApplicationStatusHistoryItem {
  status: ApplicationStatus;
  changedAt: string;
  note?: string;
  changedBy?: string;
}

export interface Application {
  id: string;
  referenceNumber: string;
  candidateId: string;
  candidateName: string;
  phone: string;
  email: string;
  programId: string;
  programTitle: string;
  termId?: string; // SPRINT E02-B: Mükerrer başvuru candidateId + programId + termId kontrolü için
  cohortName?: string;
  appliedAt: string;
  updatedAt?: string;
  educationLevel: string;
  occupation: string;
  residenceDistrict?: string;
  experienceYears?: string;
  specificAnswers?: Record<string, string | boolean>;
  statement: string;
  commitments?: {
    attendanceAccepted: boolean;
    assignmentsAccepted: boolean;
    truthfulnessAccepted: boolean;
  };
  autoScore?: AutoScoreBreakdown;
  criteriaVersionId?: string; // Kullanılan kriter sürümü
  evaluationResult?: EvaluationResult; // Ayrıntılı kriter puanlama sonucu
  status: ApplicationStatus;
  statusHistory?: ApplicationStatusHistoryItem[];

  // Karar gerekçelerinin ayrılması (SPRINT E02-B):
  internalDecisionNote?: string; // Yalnızca idari masada görünür, adaya ASLA gösterilmez
  candidateDecisionMessage?: string; // Aday paneline gönderilen resmi sonuç açıklaması
  deviationReason?: string; // Algoritma tavsiyesinden sapma varsa zorunlu gerekçe
  decisionHistory?: DecisionHistoryItem[]; // Karar değişiklik geçmişi (eski kararlar silinmez)

  // Geriye dönük uyumluluk:
  adminJustification?: string;
  decidedAt?: string;
  decidedBy?: string;
}

export interface ProgramQuotaStats {
  programId: string;
  programTitle: string;
  termId: string;
  cohortName: string;
  quota: number;
  acceptedCount: number;
  waitlistedCount: number;
  pendingCount: number;
  rejectedCount: number;
  withdrawnCount: number;
  isQuotaFull: boolean;
}

export interface GroupSummary {
  id: string;
  programTitle: string;
  groupName: string;
  instructorName: string;
  traineeCount: number;
  attendanceAverage: number;
  assignmentAverage: number;
}

// =============================================================================
// SPRINT E02-C: KESİN KAYIT, GRUP ATAMASI VE KURSİYER AKTİVASYONU MODELLERİ
// =============================================================================

export type EnrollmentStatus =
  | 'pending_confirmation' // Başvuru kabul edildi, kesin kayıt onayı bekleniyor
  | 'confirmed'            // Kesin kayıt tamamlandı (Grup ataması bekleniyor veya yapıldı)
  | 'cancelled';           // Kesin kayıt iptal edildi

export interface Enrollment {
  id: string;              // enr-xxx
  applicationId: string;   // app-xxx
  candidateId: string;     // user-applicant-01 / user-trainee-01
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  programId: string;       // prog-01
  programTitle: string;
  termId: string;          // term-2026-fall
  cohortName: string;      // 2026 Güz Dönemi
  status: EnrollmentStatus;
  confirmedAt?: string;
  confirmedBy?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export type GroupStatus = 'active' | 'completed' | 'cancelled';

export interface Group {
  id: string;              // grp-01
  programId: string;       // prog-01
  programTitle: string;
  termId: string;          // term-2026-fall
  cohortName: string;      // 2026 Güz Dönemi
  name: string;            // 'Grup A (Hafta İçi Öğleden Sonra)'
  capacity: number;        // e.g. 20
  instructorIds: string[]; // ['user-instructor-01']
  instructorNames: string[]; // ['Murat Özkan']
  scheduleSummary: string; // 'Salı & Perşembe 14:00 - 17:00'
  location: string;        // 'Derslik 1 / Laboratuvar'
  status: GroupStatus;
  createdAt: string;
}

export interface GroupTransferHistoryItem {
  fromGroupId: string;
  fromGroupName: string;
  toGroupId: string;
  toGroupName: string;
  transferredAt: string;
  transferredBy: string;
  reason: string;
}

export type GroupAssignmentStatus = 'active' | 'transferred' | 'removed';

export interface GroupAssignment {
  id: string;              // asgn-xxx
  enrollmentId: string;    // enr-xxx
  candidateId: string;     // user-trainee-01
  candidateName: string;
  candidateEmail?: string;
  groupId: string;         // grp-01
  groupName: string;       // 'Grup A'
  programId: string;       // prog-01
  programTitle: string;
  termId: string;          // term-2026-fall
  status: GroupAssignmentStatus;
  assignedAt: string;
  assignedBy: string;
  removalReason?: string;
  transferHistory?: GroupTransferHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupCapacityStats {
  groupId: string;
  groupName: string;
  capacity: number;
  assignedCount: number;
  availableSeats: number;
  isFull: boolean;
}

// =============================================================================
// SPRINT E03-D: BAŞARI BELGESİ, QR DOĞRULAMA VE BELGE YÖNETİMİ MODELLERİ
// =============================================================================

export type CertificateType = 'achievement' | 'participation' | 'specialized';

export type CertificateStatus =
  | 'draft'               // Taslak
  | 'issued'              // Düzenlendi (Geçerli)
  | 'under_review'        // Yeniden İnceleme Gerekli (Akademik veri uyumsuzluğu)
  | 'cancelled'           // İptal Edildi
  | 'superseded';         // Yerine Yeni Belge Düzenlendi

export interface CertificateAuditHistoryItem {
  action: 'issued' | 'cancelled' | 'reissued' | 'status_changed' | 'flagged_discrepancy';
  performedBy: string;
  performedAt: string;
  previousStatus?: CertificateStatus;
  newStatus: CertificateStatus;
  reason?: string;
  note?: string;
}

export interface CertificateRecord {
  id: string;                         // cert-xxx
  certificateNumber: string;          // İE-2026-BB-001 (tekil)
  enrollmentId: string;               // enr-xxx
  candidateId: string;                // user-trainee-xxx
  traineeName: string;
  traineeEmail?: string;
  programId: string;                  // prog-01
  programTitle: string;
  termId: string;                     // term-2026-fall
  cohortName: string;
  groupId: string;
  groupName: string;
  certificateType: CertificateType;   // varsayılan: 'achievement'
  certificateTypeLabel: string;       // 'Eğitim Başarı Belgesi'
  status: CertificateStatus;
  issuedAt: string;
  issuedBy: string;                   // 'Selin Aydın (Yetkili Yönetici)'
  successDecisionId: string;          // dec-xxx
  eligibilitySnapshot: EligibilitySourceSnapshot; // Karar anındaki kanıt özeti
  verificationCode: string;           // IE-VER-89104 (tekil)
  verificationUrl: string;            // '/belge-dogrula/IE-VER-89104'
  cancelledAt?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  supersededByCertificateId?: string; // Yerine düzenlenen belgenin ID'si
  supersededFromCertificateId?: string;// Hangi belgenin yerine düzenlendiği
  supersededReason?: string;
  auditHistory?: CertificateAuditHistoryItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateIssuanceCheckResult {
  canIssue: boolean;
  reasons: string[];
  eligibilityResult?: FinalEligibilityResult;
  existingCertificate?: CertificateRecord;
}

// =============================================================================
// SPRINT E04-A: KURSİYER - EĞİTMEN ÖZEL MESAJLAŞMASI & GRUP KANALLARI TİPLERİ
// =============================================================================

export type ConversationParticipantRole = 'trainee' | 'instructor' | 'admin';
export type ConversationStatus = 'active' | 'archived' | 'suspended';
export type DirectMessageStatus = 'saved_locally'; // "Yerel Demoya Kaydedildi"

export interface ConversationParticipant {
  conversationId: string;
  participantId: string;
  participantRole: ConversationParticipantRole;
  participantName: string;
  membershipStatus: 'active' | 'left' | 'cancelled';
}

export interface Conversation {
  id: string;
  traineeId: string;
  traineeName: string;
  instructorId: string;
  instructorName: string;
  enrollmentId: string;
  groupId: string;
  groupName: string;
  programId: string;
  programTitle: string;
  termId: string;
  cohortName: string;
  status: ConversationStatus;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  unreadCountTrainee: number;
  unreadCountInstructor: number;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'trainee' | 'instructor';
  senderName: string;
  body: string;
  createdAt: string;
  status: DirectMessageStatus;
  readAt?: string; // "Okundu (Demo Görüntüleme)"
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  replyTo?: {
    id: string;
    senderName: string;
    senderRole?: string;
    content: string;
  };
  reactions?: Record<string, string[]>; // emoji -> array of userIds
}

export type ChannelType = 'announcement' | 'discussion';
export type ChannelStatus = 'active' | 'closed';

export interface Channel {
  id: string;
  programId: string;
  programTitle: string;
  termId: string;
  cohortName: string;
  groupId: string;
  groupName: string;
  type: ChannelType;
  name: string;
  description: string;
  status: ChannelStatus;
  createdAt: string;
  createdBy: string;
  pinnedMessageId?: string;
}

export interface ChannelMembership {
  id: string;
  channelId: string;
  participantId: string;
  participantName: string;
  role: ConversationParticipantRole;
  status: 'active' | 'transferred' | 'cancelled';
  joinedAt: string;
  leftAt?: string;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: ConversationParticipantRole;
  senderEmail?: string;
  title?: string; // Duyuru başlığı
  content: string;
  isPinned?: boolean;
  createdAt: string;
  status: 'saved_locally';
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  replyTo?: {
    id: string;
    senderName: string;
    senderRole?: string;
    content: string;
  };
  reactions?: Record<string, string[]>; // emoji -> array of userIds
}

export * from './notificationTypes';
export * from './permissionTypes';
export * from './auditTypes';
export * from './settingsTypes';
export * from './authTypes';
