import {
  SuccessDecisionRecord,
  TermRegistryRecord,
  AdminSuccessDecisionType,
  EligibilitySourceSnapshot,
  RemediationDetails,
} from '../types';
import { notifySuccessDecisionPublished } from './notificationEngine';

export const SUCCESS_DECISIONS_STORAGE_KEY = 'islahiye_education_success_decisions_v2';
export const TERM_REGISTRIES_STORAGE_KEY = 'islahiye_education_term_registries_v2';
export const SUCCESS_DECISIONS_UPDATE_EVENT = 'islahiye_education_success_decisions_updated';

// ============================================================================
// 1. BAŞLANGIÇ DEMO KARARLARI (Seed Data - Real 2026 Fall Data)
// ============================================================================

export const INITIAL_SUCCESS_DECISIONS: SuccessDecisionRecord[] = [
  // 1. Ahmet Kaya (Tam Onaylanmış Kursiyer)
  {
    decisionId: 'dec-ahmet-01',
    enrollmentId: 'enr-trainee-ahmet',
    traineeId: 'usr-trainee',
    traineeName: 'Ahmet Kaya',
    programId: 'prog-01',
    termId: 'term-2026-fall',
    groupId: 'grp-01',
    decision: 'approved',
    eligibilitySnapshot: {
      attendanceRate: 100,
      attendedCount: 4,
      completedSessionsCount: 4,
      excusedCount: 0,
      assignmentAverage: 92,
      mandatoryAssignmentsApproved: 3,
      mandatoryAssignmentsTotal: 3,
      sessionsEvaluatedCount: 4,
      capturedAt: '2026-10-20T16:00:00+03:00',
    },
    policyVersion: 'POL-2026-V1 (Devam %80, Not 70)',
    internalNote:
      'Kursiyer %100 devam oranı ve 92/100 ödev ortalaması ile tüm akademik şartları başarıyla tamamlamıştır. Başarı belgesi düzenlenmesi uygundur.',
    traineeDecisionMessage:
      'Tebrik ederiz! İslahiye Ticaret Odası Eğitim Portalı dönem sonu başarı değerlendirmeniz yetkili yönetim tarafından onaylanmış ve belge hakkınız tescil edilmiştir.',
    decidedBy: 'Selin Aydın (Eğitim Programları Müdürü)',
    decidedAt: '2026-10-20T16:00:00+03:00',
    decisionHistory: [
      {
        decision: 'approved',
        decidedBy: 'Selin Aydın (Eğitim Programları Müdürü)',
        decidedAt: '2026-10-20T16:00:00+03:00',
        internalNote: 'Tüm akademik şartlar sağlanmıştır.',
        traineeDecisionMessage: 'Başarı değerlendirmeniz onaylandı.',
        snapshot: {
          attendanceRate: 100,
          attendedCount: 4,
          completedSessionsCount: 4,
          excusedCount: 0,
          assignmentAverage: 92,
          mandatoryAssignmentsApproved: 3,
          mandatoryAssignmentsTotal: 3,
          sessionsEvaluatedCount: 4,
          capturedAt: '2026-10-20T16:00:00+03:00',
        },
      },
    ],
    status: 'active',
    certificateEligibility: 'eligible',
    createdAt: '2026-10-20T16:00:00+03:00',
    updatedAt: '2026-10-20T16:00:00+03:00',
  },
  // 2. Fatma Şahin (Tam Onaylanmış Kursiyer)
  {
    decisionId: 'dec-fatma-01',
    enrollmentId: 'enr-trainee-fatma',
    traineeId: 'usr-real-12',
    traineeName: 'Fatma Şahin',
    programId: 'prog-01',
    termId: 'term-2026-fall',
    groupId: 'grp-01',
    decision: 'approved',
    eligibilitySnapshot: {
      attendanceRate: 100,
      attendedCount: 4,
      completedSessionsCount: 4,
      excusedCount: 0,
      assignmentAverage: 95,
      mandatoryAssignmentsApproved: 3,
      mandatoryAssignmentsTotal: 3,
      sessionsEvaluatedCount: 4,
      capturedAt: '2026-10-21T16:00:00+03:00',
    },
    policyVersion: 'POL-2026-V1 (Devam %80, Not 70)',
    internalNote:
      'Kursiyer %100 devam ve 95/100 ortalama ile üstün başarı göstermiştir. Başarı belgesi düzenlenmesi uygundur.',
    traineeDecisionMessage:
      'Tebrik ederiz! Dönem sonu başarı değerlendirmeniz onaylanmış ve üstün başarı belgesi düzenlenmiştir.',
    decidedBy: 'Selin Aydın (Eğitim Programları Müdürü)',
    decidedAt: '2026-10-21T16:00:00+03:00',
    decisionHistory: [
      {
        decision: 'approved',
        decidedBy: 'Selin Aydın (Eğitim Programları Müdürü)',
        decidedAt: '2026-10-21T16:00:00+03:00',
        internalNote: 'Tüm şartlar eksiksiz sağlandı.',
        traineeDecisionMessage: 'Başarı değerlendirmeniz onaylandı.',
        snapshot: {
          attendanceRate: 100,
          attendedCount: 4,
          completedSessionsCount: 4,
          excusedCount: 0,
          assignmentAverage: 95,
          mandatoryAssignmentsApproved: 3,
          mandatoryAssignmentsTotal: 3,
          sessionsEvaluatedCount: 4,
          capturedAt: '2026-10-21T16:00:00+03:00',
        },
      },
    ],
    status: 'active',
    certificateEligibility: 'eligible',
    createdAt: '2026-10-21T16:00:00+03:00',
    updatedAt: '2026-10-21T16:00:00+03:00',
  },
  // 3. Mehmet Doğan (Örnek Telafi Sürecindeki Kursiyer)
  {
    decisionId: 'dec-mehmet-01',
    enrollmentId: 'enr-mehmet-01',
    traineeId: 't-03',
    traineeName: 'Mehmet Doğan',
    programId: 'prog-01',
    termId: 'term-2026-fall',
    groupId: 'grp-01',
    decision: 'remediation',
    eligibilitySnapshot: {
      attendanceRate: 70,
      attendedCount: 14,
      completedSessionsCount: 20,
      excusedCount: 0,
      assignmentAverage: 75,
      mandatoryAssignmentsApproved: 3,
      mandatoryAssignmentsTotal: 3,
      sessionsEvaluatedCount: 20,
      capturedAt: '2026-10-19T14:30:00+03:00',
    },
    policyVersion: 'POL-2026-V1',
    internalNote:
      'Kursiyerin devam oranı %70 olup %80 barajının altındadır. Sağlık mazereti gerekçesiyle 2 ders oturumu telafi etmesi kararlaştırılmıştır.',
    traineeDecisionMessage:
      'Eğitim dönemi devam durumunuz %80 barajının altında kalmıştır. Telafi oturumlarını tamamlamanız halinde durumunuz yeniden değerlendirilecektir.',
    remediationDetails: {
      reason: 'Devamsızlık oranı %70 (Baraj altı)',
      targetRequirement: 'attendance',
      targetRequirementLabel: 'Devam Oranı Telafisi',
      dueDate: '2026-11-10',
      requiredActionNote: 'Grup B hafta sonu oturumlarından 2 ders telafi oturumuna katılım zorunludur.',
      assignedAt: '2026-10-19T14:30:00+03:00',
      outcome: 'pending',
    },
    decidedBy: 'Mehmet Kaya (Genel Sekreter Yrd.)',
    decidedAt: '2026-10-19T14:30:00+03:00',
    decisionHistory: [],
    status: 'active',
    certificateEligibility: 'not_eligible',
    createdAt: '2026-10-19T14:30:00+03:00',
    updatedAt: '2026-10-19T14:30:00+03:00',
  },
];

// ============================================================================
// 2. BAŞLANGIÇ DÖNEM SONU KÜTÜKLERİ (Term Registries)
// ============================================================================

export const INITIAL_TERM_REGISTRIES: TermRegistryRecord[] = [
  {
    registryId: 'reg-prog01-fall2026',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    isClosed: false,
    totalEnrollments: 20,
    academicPassedCount: 2,
    approvedCount: 1,
    remediationCount: 1,
    rejectedCount: 0,
    pendingCount: 18,
    createdAt: '2026-10-15T10:00:00+03:00',
    updatedAt: '2026-10-21T18:00:00+03:00',
  },
  {
    registryId: 'reg-prog02-fall2026',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    isClosed: false,
    totalEnrollments: 18,
    academicPassedCount: 0,
    approvedCount: 0,
    remediationCount: 0,
    rejectedCount: 0,
    pendingCount: 18,
    createdAt: '2026-10-15T10:00:00+03:00',
    updatedAt: '2026-10-21T18:00:00+03:00',
  },
];

// ============================================================================
// 3. STORAGE İŞLEMLERİ & YAYIN
// ============================================================================

const notifyUpdates = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SUCCESS_DECISIONS_UPDATE_EVENT));
  }
};

export const getStoredSuccessDecisions = (): SuccessDecisionRecord[] => {
  try {
    const raw = localStorage.getItem(SUCCESS_DECISIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        SUCCESS_DECISIONS_STORAGE_KEY,
        JSON.stringify(INITIAL_SUCCESS_DECISIONS)
      );
      return INITIAL_SUCCESS_DECISIONS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < 2) {
      localStorage.setItem(
        SUCCESS_DECISIONS_STORAGE_KEY,
        JSON.stringify(INITIAL_SUCCESS_DECISIONS)
      );
      return INITIAL_SUCCESS_DECISIONS;
    }
    return parsed;
  } catch (err) {
    console.error('getStoredSuccessDecisions error:', err);
    return INITIAL_SUCCESS_DECISIONS;
  }
};

export const saveSuccessDecisionsToStorage = (decisions: SuccessDecisionRecord[]): void => {
  try {
    localStorage.setItem(SUCCESS_DECISIONS_STORAGE_KEY, JSON.stringify(decisions));
    notifyUpdates();
  } catch (err) {
    console.error('saveSuccessDecisionsToStorage error:', err);
  }
};

export const getSuccessDecisionByEnrollment = (
  enrollmentId: string
): SuccessDecisionRecord | null => {
  const all = getStoredSuccessDecisions();
  return all.find((d) => d.enrollmentId === enrollmentId && d.status === 'active') || null;
};

// ============================================================================
// 4. YÖNETİCİ NİHAİ KARAR VERME MASASI İŞLEMİ
// ============================================================================

export const recordAdminSuccessDecision = ({
  enrollmentId,
  traineeId,
  traineeName,
  programId,
  termId,
  groupId,
  decision,
  eligibilitySnapshot,
  internalNote,
  traineeDecisionMessage,
  remediationDetails,
  decidedBy,
  academicEligible,
}: {
  enrollmentId: string;
  traineeId: string;
  traineeName: string;
  programId: string;
  termId: string;
  groupId: string;
  decision: AdminSuccessDecisionType;
  eligibilitySnapshot: EligibilitySourceSnapshot;
  internalNote: string;
  traineeDecisionMessage: string;
  remediationDetails?: RemediationDetails;
  decidedBy: string;
  academicEligible: boolean;
}): { success: boolean; record?: SuccessDecisionRecord; error?: string } => {
  try {
    // 1. ZORUNLU KURAL: 3 akademik şart tamamlanmadan "approved" kararı verilemez!
    if (decision === 'approved' && !academicEligible) {
      return {
        success: false,
        error:
          'Zorunlu İş Kuralı İhlali: Devam oranı en az %80, ödev not ortalaması en az 70 ve tüm zorunlu ödev onayları tamamlanmadan nihai başarı onayı verilemez.',
      };
    }

    if (!internalNote.trim()) {
      return { success: false, error: 'Kurum içi yönetici gerekçesi yazılması zorunludur.' };
    }
    if (!traineeDecisionMessage.trim()) {
      return { success: false, error: 'Kursiyere iletilecek sonuç açıklaması zorunludur.' };
    }

    if (decision === 'remediation' && !remediationDetails?.reason) {
      return {
        success: false,
        error: 'Telafi kararı için telafi nedeni ve hedef eksik koşul belirtilmelidir.',
      };
    }

    const allDecisions = getStoredSuccessDecisions();
    const existingIndex = allDecisions.findIndex(
      (d) => d.enrollmentId === enrollmentId && d.status === 'active'
    );

    const nowIso = new Date().toISOString();
    const newDecisionId = `dec-${Date.now().toString().slice(-7)}`;

    // Eski kararın denetim geçmişi (audit history)
    const existingHistory =
      existingIndex !== -1 && allDecisions[existingIndex].decisionHistory
        ? [...allDecisions[existingIndex].decisionHistory]
        : [];

    if (existingIndex !== -1) {
      const prev = allDecisions[existingIndex];
      existingHistory.push({
        decision: prev.decision,
        decidedBy: prev.decidedBy,
        decidedAt: prev.decidedAt,
        internalNote: prev.internalNote,
        traineeDecisionMessage: prev.traineeDecisionMessage,
        snapshot: prev.eligibilitySnapshot,
      });
      // Eski kaydı süperseed et
      allDecisions[existingIndex].status = 'superseded';
    }

    const newRecord: SuccessDecisionRecord = {
      decisionId: newDecisionId,
      enrollmentId,
      traineeId,
      traineeName,
      programId,
      termId,
      groupId,
      decision,
      eligibilitySnapshot,
      policyVersion: 'POL-2026-V1 (%80 Devam, 70/100 Ödev, Zorunlu Onaylar)',
      internalNote: internalNote.trim(),
      traineeDecisionMessage: traineeDecisionMessage.trim(),
      remediationDetails: decision === 'remediation' ? remediationDetails : undefined,
      decidedBy,
      decidedAt: nowIso,
      decisionHistory: existingHistory,
      status: 'active',
      certificateEligibility: decision === 'approved' ? 'eligible' : 'not_eligible',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    allDecisions.push(newRecord);
    saveSuccessDecisionsToStorage(allDecisions);

    // Bildirim tetikle (Non-blocking)
    try {
      notifySuccessDecisionPublished({
        id: newRecord.decisionId,
        candidateId: newRecord.traineeId,
        decision: newRecord.decision === 'approved' ? 'certified' : 'failed',
        cohortName: newRecord.termId,
      } as any);
    } catch (notifErr) {
      console.warn('Başarı kararı bildirim hatası:', notifErr);
    }

    return { success: true, record: newRecord };
  } catch (err) {
    console.error('recordAdminSuccessDecision error:', err);
    return { success: false, error: 'Karar kaydedilirken beklenmedik hata oluştu.' };
  }
};

// Telafi sonucunu tamamlama
export const resolveRemediation = (
  enrollmentId: string,
  outcome: 'successful' | 'unsuccessful',
  resolutionNote: string,
  resolvedBy: string
): { success: boolean; error?: string } => {
  const all = getStoredSuccessDecisions();
  const index = all.findIndex((d) => d.enrollmentId === enrollmentId && d.status === 'active');
  if (index === -1) {
    return { success: false, error: 'Kayıt bulunamadı.' };
  }

  const record = all[index];
  if (!record.remediationDetails) {
    return { success: false, error: 'Bu kayıt için aktif telafi süreci bulunmuyor.' };
  }

  record.remediationDetails.outcome = outcome;
  record.remediationDetails.completedAt = new Date().toISOString();
  record.remediationDetails.resolutionNote = resolutionNote;
  record.updatedAt = new Date().toISOString();

  // Denetim loguna ekle
  record.decisionHistory.push({
    decision: 'remediation',
    decidedBy: resolvedBy,
    decidedAt: new Date().toISOString(),
    internalNote: `Telafi süreci ${outcome === 'successful' ? 'başarıyla' : 'başarısızlıkla'} tamamlandı: ${resolutionNote}`,
    traineeDecisionMessage: `Telafi incelemeniz sonuçlandı: ${resolutionNote}`,
    snapshot: record.eligibilitySnapshot,
  });

  all[index] = record;
  saveSuccessDecisionsToStorage(all);
  return { success: true };
};

// ============================================================================
// 5. DÖNEM SONU KÜTÜĞÜ VE DÖNEM KAPANIŞI (Term Registry)
// ============================================================================

export const getStoredTermRegistries = (): TermRegistryRecord[] => {
  try {
    const raw = localStorage.getItem(TERM_REGISTRIES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        TERM_REGISTRIES_STORAGE_KEY,
        JSON.stringify(INITIAL_TERM_REGISTRIES)
      );
      return INITIAL_TERM_REGISTRIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_TERM_REGISTRIES;
  } catch (err) {
    console.error('getStoredTermRegistries error:', err);
    return INITIAL_TERM_REGISTRIES;
  }
};

export const saveTermRegistriesToStorage = (registries: TermRegistryRecord[]): void => {
  try {
    localStorage.setItem(TERM_REGISTRIES_STORAGE_KEY, JSON.stringify(registries));
    notifyUpdates();
  } catch (err) {
    console.error('saveTermRegistriesToStorage error:', err);
  }
};

export const closeTermRegistry = (
  programId: string,
  termId: string,
  closedBy: string,
  closureNotes: string
): { success: boolean; registry?: TermRegistryRecord; error?: string } => {
  try {
    const registries = getStoredTermRegistries();
    const index = registries.findIndex(
      (r) => r.programId === programId && r.termId === termId
    );

    if (index === -1) {
      return { success: false, error: 'Dönem kütük kaydı bulunamadı.' };
    }

    const reg = registries[index];
    if (reg.isClosed) {
      return { success: false, error: 'Bu eğitim dönemi kütüğü zaten resmi olarak kapatılmıştır.' };
    }

    const nowIso = new Date().toISOString();
    reg.isClosed = true;
    reg.closedAt = nowIso;
    reg.closedBy = closedBy;
    reg.closureNotes = closureNotes.trim();
    reg.updatedAt = nowIso;

    registries[index] = reg;
    saveTermRegistriesToStorage(registries);
    return { success: true, registry: reg };
  } catch (err) {
    return { success: false, error: 'Dönem kütüğü kapatılırken hata oluştu.' };
  }
};

// Abonelik
export const subscribeToSuccessDecisionUpdates = (callback: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(SUCCESS_DECISIONS_UPDATE_EVENT, callback);
  return () => {
    window.removeEventListener(SUCCESS_DECISIONS_UPDATE_EVENT, callback);
  };
};

export const resetSuccessDecisionsToInitial = (): void => {
  localStorage.setItem(
    SUCCESS_DECISIONS_STORAGE_KEY,
    JSON.stringify(INITIAL_SUCCESS_DECISIONS)
  );
  localStorage.setItem(
    TERM_REGISTRIES_STORAGE_KEY,
    JSON.stringify(INITIAL_TERM_REGISTRIES)
  );
  notifyUpdates();
};
