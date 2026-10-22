import {
  Application,
  ApplicationStatus,
  DecisionHistoryItem,
  ProgramQuotaStats,
} from '../types';
import { DEMO_APPLICATIONS } from '../data/educationData';
import {
  getActiveCriteriaSetForProgram,
  evaluateAndStoreApplication,
  resetCriteriaToDefaults,
} from './evaluationStorage';
import {
  notifyApplicationSubmitted,
  notifyAdminDecision,
} from './notificationEngine';

const STORAGE_KEY = 'islahiye_education_applications_v1';
const UPDATE_EVENT = 'islahiye_applications_updated';

/**
 * Başvuru yerel deposunu ilklendirir veya mevcut veriyi döndürür.
 */
export const getStoredApplications = (): Application[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_APPLICATIONS));
      return DEMO_APPLICATIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_APPLICATIONS));
    return DEMO_APPLICATIONS;
  } catch (err) {
    console.error('LocalStorage read error:', err);
    return DEMO_APPLICATIONS;
  }
};

/**
 * Veriyi yerel depoya kaydeder ve güncellemeyi duyurur.
 */
const saveToStorage = (apps: Application[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: apps }));
    }
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
};

/**
 * Rastgele referans takip numarası üretir (Örn: ISL-2026-0942)
 */
export const generateReferenceNumber = (): string => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `ISL-2026-${num}`;
};

/**
 * Tarih ve saat formatı (Türkçe)
 */
export const formatCurrentTimestamp = (): string => {
  return new Date().toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Tüm kayıtlı başvuruları listeler (Yönetici masası için)
 */
export const getAllApplications = (): Application[] => {
  return getStoredApplications();
};

/**
 * Belirli bir adayın başvurularını getirir (Aday Mahremiyeti ve İzolasyonu)
 */
export const getApplicationsByCandidateId = (candidateId: string): Application[] => {
  const all = getStoredApplications();
  return all.filter((app) => app.candidateId === candidateId);
};

/**
 * Tek bir başvuruyu ID veya referans numarasına göre getirir.
 */
export const getApplicationById = (idOrRef: string): Application | undefined => {
  const all = getStoredApplications();
  return all.find((app) => app.id === idOrRef || app.referenceNumber === idOrRef);
};

/**
 * Bir adayın belirli bir program ve dönemde aktif (devam eden) başvurusu olup olmadığını denetler.
 * SPRINT E02-B: Mükerrer kontrolü candidateId + programId + termId birleşimine dayanır.
 */
export const hasActiveApplication = (
  candidateId: string,
  programId: string,
  termId?: string,
  excludeAppId?: string
): boolean => {
  const candidateApps = getApplicationsByCandidateId(candidateId);
  const targetTerm = termId || 'term-2026-fall';

  return candidateApps.some((app) => {
    if (excludeAppId && app.id === excludeAppId) return false;
    if (app.programId !== programId) return false;

    // Farklı bir dönem ise mükerrer sayılmaz (sonraki dönem başvurusu engellenmez)
    const norm = (val?: string) => (val === '2026 Güz Dönemi' ? 'term-2026-fall' : val);
    const appTerm = norm(app.termId || app.cohortName) || 'term-2026-fall';
    const targetNorm = norm(targetTerm) || 'term-2026-fall';
    if (appTerm !== targetNorm && app.cohortName !== targetTerm && app.termId !== targetTerm) return false;

    // Taslak, geri çekilen veya reddedilenler yeni başvuruya engel olmaz
    return !['withdrawn', 'rejected', 'draft'].includes(app.status);
  });
};

/**
 * Taslak başvuru kaydetme veya güncelleme
 */
export const saveDraftApplication = (
  appData: Partial<Application> & {
    candidateId: string;
    programId: string;
    programTitle: string;
  }
): { success: boolean; application?: Application; error?: string } => {
  const all = getStoredApplications();
  const termId = appData.termId || appData.cohortName || 'term-2026-fall';

  const existingIndex = all.findIndex(
    (a) =>
      a.id === appData.id ||
      (a.candidateId === appData.candidateId &&
        a.programId === appData.programId &&
        (a.termId || a.cohortName || 'term-2026-fall') === termId &&
        a.status === 'draft')
  );

  const timestamp = formatCurrentTimestamp();

  if (existingIndex >= 0) {
    const existing = all[existingIndex];
    const updated: Application = {
      ...existing,
      ...appData,
      id: existing.id,
      termId,
      status: 'draft',
      updatedAt: timestamp,
      statusHistory: [
        ...(existing.statusHistory || []),
        {
          status: 'draft',
          changedAt: timestamp,
          note: 'Taslak güncellendi.',
        },
      ],
    };
    all[existingIndex] = updated;
    saveToStorage(all);
    return { success: true, application: updated };
  }

  // Yeni taslak oluşturma öncesi aynı dönem ve programda aktif başvuru var mı?
  if (hasActiveApplication(appData.candidateId, appData.programId, termId)) {
    return {
      success: false,
      error: 'Bu eğitim programının bu dönemine ait zaten aktif bir başvurunuz bulunmaktadır.',
    };
  }

  const newDraft: Application = {
    id: appData.id || `app-${Date.now()}`,
    referenceNumber: appData.referenceNumber || generateReferenceNumber(),
    candidateId: appData.candidateId,
    candidateName: appData.candidateName || 'Demo Aday',
    phone: appData.phone || '0544 *** ** 28',
    email: appData.email || 'aday@islahiye-dijital.org',
    programId: appData.programId,
    programTitle: appData.programTitle,
    termId,
    cohortName: appData.cohortName || '2026 Güz Dönemi',
    appliedAt: timestamp,
    updatedAt: timestamp,
    educationLevel: appData.educationLevel || '',
    occupation: appData.occupation || '',
    residenceDistrict: appData.residenceDistrict || 'İslahiye Merkez',
    experienceYears: appData.experienceYears || '1-3 Yıl',
    specificAnswers: appData.specificAnswers || {},
    statement: appData.statement || '',
    commitments: appData.commitments || {
      attendanceAccepted: false,
      assignmentsAccepted: false,
      truthfulnessAccepted: false,
    },
    status: 'draft',
    statusHistory: [
      {
        status: 'draft',
        changedAt: timestamp,
        note: 'Başvuru taslağı kaydedildi.',
      },
    ],
  };

  all.unshift(newDraft);
  saveToStorage(all);
  return { success: true, application: newDraft };
};

/**
 * Başvuruyu tamamlama ve idari incelemeye gönderme
 * SPRINT E02-B:
 * - candidateId + programId + termId birleşimine göre mükerrer aktif başvuru kontrolü yapılır.
 * - Başvuru anında geçerli kriter seti (criteriaVersionId) kaydedilir.
 * - Kriter motoru otomatik ön inceleme puanını ve tavsiyesini hesaplar.
 */
export const submitApplication = (
  appData: Partial<Application> & {
    candidateId: string;
    programId: string;
    programTitle: string;
    candidateName: string;
    statement: string;
  }
): { success: boolean; application?: Application; error?: string } => {
  const all = getStoredApplications();
  const termId = appData.termId || appData.cohortName || 'term-2026-fall';

  // Mükerrer başvuru kontrolü:
  if (hasActiveApplication(appData.candidateId, appData.programId, termId, appData.id)) {
    return {
      success: false,
      error: `Bu programa (${appData.programTitle || 'seçilen program'}) ve döneme ait zaten aktif bir başvurunuz bulunmaktadır. Tekrar başvuru yapılamaz.`,
    };
  }

  const timestamp = formatCurrentTimestamp();

  // Aktif kriter seti eşleştirmesi
  const activeCriteriaSet = getActiveCriteriaSetForProgram(appData.programId);
  const criteriaVersionId = activeCriteriaSet?.id;

  // Eğer mevcut bir taslak ID'si geldiyse ya da bu programa/döneme ait taslak varsa onu 'submitted' yap:
  let existingIndex = appData.id ? all.findIndex((a) => a.id === appData.id) : -1;
  if (existingIndex === -1) {
    existingIndex = all.findIndex(
      (a) =>
        a.candidateId === appData.candidateId &&
        a.programId === appData.programId &&
        (a.termId || a.cohortName || 'term-2026-fall') === termId &&
        a.status === 'draft'
    );
  }

  let finalApp: Application;

  if (existingIndex >= 0) {
    const existing = all[existingIndex];
    finalApp = {
      ...existing,
      ...appData,
      termId,
      criteriaVersionId: existing.criteriaVersionId || criteriaVersionId,
      status: 'submitted',
      appliedAt: timestamp,
      updatedAt: timestamp,
      statusHistory: [
        ...(existing.statusHistory || []),
        {
          status: 'submitted',
          changedAt: timestamp,
          note: 'Başvuru aday tarafından onaylanarak gönderildi.',
        },
      ],
    };
    all[existingIndex] = finalApp;
  } else {
    finalApp = {
      id: appData.id || `app-${Date.now()}`,
      referenceNumber: appData.referenceNumber || generateReferenceNumber(),
      candidateId: appData.candidateId,
      candidateName: appData.candidateName,
      phone: appData.phone || '0544 *** ** 28',
      email: appData.email || 'aday@islahiye-dijital.org',
      programId: appData.programId,
      programTitle: appData.programTitle,
      termId,
      cohortName: appData.cohortName || '2026 Güz Dönemi',
      appliedAt: timestamp,
      updatedAt: timestamp,
      educationLevel: appData.educationLevel || 'Ön Lisans',
      occupation: appData.occupation || 'Tarımsal Üretici',
      residenceDistrict: appData.residenceDistrict || 'İslahiye Merkez',
      experienceYears: appData.experienceYears || '1-3 Yıl',
      specificAnswers: appData.specificAnswers || {},
      statement: appData.statement || '',
      commitments: appData.commitments || {
        attendanceAccepted: true,
        assignmentsAccepted: true,
        truthfulnessAccepted: true,
      },
      criteriaVersionId,
      status: 'submitted',
      statusHistory: [
        {
          status: 'submitted',
          changedAt: timestamp,
          note: 'Başvuru aday tarafından onaylanarak gönderildi.',
        },
      ],
    };
    all.unshift(finalApp);
  }

  // Puanlama motoru ile otomatik ön değerlendirme hesapla ve kaydet
  try {
    if (activeCriteriaSet) {
      const evaluation = evaluateAndStoreApplication(finalApp, activeCriteriaSet);
      finalApp.evaluationResult = evaluation;
      finalApp.autoScore = {
        total: evaluation.totalWeightedScore,
        ruleVersion: activeCriteriaSet.version,
        residencePoints: evaluation.scoreBreakdown.find((b) => b.criterionCode.includes('RES'))?.earnedWeightedScore || 0,
        educationPoints: evaluation.scoreBreakdown.find((b) => b.criterionCode.includes('EDU'))?.earnedWeightedScore || 0,
        experiencePoints: evaluation.scoreBreakdown.find((b) => b.criterionCode.includes('EXP'))?.earnedWeightedScore || 0,
      };
    }
  } catch (err) {
    console.warn('Otomatik değerlendirme hesaplanırken uyarı:', err);
  }

  saveToStorage(all);

  // Bildirim tetikle (Non-blocking)
  try {
    notifyApplicationSubmitted(finalApp);
  } catch (notifErr) {
    console.warn('Başvuru bildirimi gönderilirken hata oluştu:', notifErr);
  }

  return { success: true, application: finalApp };
};

/**
 * Başvuruyu geri çekme (Yalnızca taslak, gönderildi veya incelemede durumlarında izin verilir)
 */
export const withdrawApplication = (
  appId: string,
  candidateId: string,
  reason?: string
): { success: boolean; error?: string } => {
  const all = getStoredApplications();
  const index = all.findIndex((a) => a.id === appId);

  if (index === -1) {
    return { success: false, error: 'Başvuru bulunamadı.' };
  }

  const app = all[index];
  if (app.candidateId !== candidateId) {
    return { success: false, error: 'Bu işlem için yetkiniz bulunmamaktadır.' };
  }

  if (['accepted', 'rejected', 'withdrawn'].includes(app.status)) {
    return {
      success: false,
      error: 'Sonuçlanmış veya zaten geri çekilmiş bir başvuru üzerinde bu işlem yapılamaz.',
    };
  }

  const timestamp = formatCurrentTimestamp();
  all[index] = {
    ...app,
    status: 'withdrawn',
    updatedAt: timestamp,
    statusHistory: [
      ...(app.statusHistory || []),
      {
        status: 'withdrawn',
        changedAt: timestamp,
        note: reason || 'Aday talebiyle başvuru geri çekildi.',
      },
    ],
  };

  saveToStorage(all);
  return { success: true };
};

/**
 * Yönetici nihai kararı uygulama (Kabul, Yedek, Reddet, Ek İnceleme)
 * SPRINT E02-B:
 * - internalDecisionNote: Sadece kurum içi idari masada görünür, adaya gösterilmez.
 * - candidateDecisionMessage: Aday paneline iletilecek resmi sonuç açıklaması.
 * - deviationReason: Algoritma tavsiyesinden sapma varsa zorunlu gerekçe.
 * - Eski kararlar silinmez, decisionHistory içinde kayıt altına alınır.
 */
export const updateAdminDecision = (
  appId: string,
  newStatus: ApplicationStatus,
  internalDecisionNoteOrJustification: string,
  candidateDecisionMessageOrDecidedBy: string,
  decidedByOrDeviationReason?: string,
  deviationReason?: string
): { success: boolean; error?: string } => {
  const all = getStoredApplications();
  const index = all.findIndex((a) => a.id === appId);

  if (index === -1) {
    return { success: false, error: 'Başvuru bulunamadı.' };
  }

  const app = all[index];
  const timestamp = formatCurrentTimestamp();

  // Parametre normalizasyonu (yeni ayrılmış gerekçeler veya geriye dönük çağrı):
  let internalNote = internalDecisionNoteOrJustification.trim();
  let candidateMessage = candidateDecisionMessageOrDecidedBy.trim();
  let managerName = decidedByOrDeviationReason?.trim() || 'Selin Aydın (Yönetici)';
  let devReason = deviationReason?.trim();

  // Eski 4 parametreli imza kontrolü: updateAdminDecision(appId, newStatus, justification, decidedBy)
  if (!devReason && candidateDecisionMessageOrDecidedBy.includes('(')) {
    // 3. parametre decidedBy gibi görünüyor
    managerName = candidateDecisionMessageOrDecidedBy.trim();
    candidateMessage = internalDecisionNoteOrJustification.trim();
  }

  if (!internalNote) {
    return { success: false, error: 'Kurum içi değerlendirme notu zorunludur.' };
  }
  if (!candidateMessage) {
    return { success: false, error: 'Adaya iletilecek sonuç açıklaması zorunludur.' };
  }

  // Karar geçmişi öğesi
  const decisionRecord: DecisionHistoryItem = {
    status: newStatus,
    decidedAt: timestamp,
    decidedBy: managerName,
    internalDecisionNote: internalNote,
    candidateDecisionMessage: candidateMessage,
    deviationReason: devReason,
    criteriaVersionId: app.criteriaVersionId,
    score: app.evaluationResult?.totalWeightedScore ?? app.autoScore?.total,
  };

  all[index] = {
    ...app,
    status: newStatus,
    internalDecisionNote: internalNote,
    candidateDecisionMessage: candidateMessage,
    deviationReason: devReason,
    adminJustification: candidateMessage, // Geriye dönük uyumluluk
    decidedAt: timestamp,
    decidedBy: managerName,
    updatedAt: timestamp,
    decisionHistory: [
      ...(app.decisionHistory || []),
      decisionRecord,
    ],
    statusHistory: [
      ...(app.statusHistory || []),
      {
        status: newStatus,
        changedAt: timestamp,
        note: `Nihai Karar: ${candidateMessage}`,
        changedBy: managerName,
      },
    ],
  };

  saveToStorage(all);

  // Bildirim tetikle (Non-blocking - Mahremiyet Korumalı)
  try {
    notifyAdminDecision(all[index], candidateMessage);
  } catch (notifErr) {
    console.warn('Karar bildirimi gönderilirken hata oluştu:', notifErr);
  }

  return { success: true };
};

/**
 * Program ve dönem bazlı kontenjan istatistiklerini hesaplar.
 */
export const getProgramQuotaStats = (
  programId: string,
  termId: string = 'term-2026-fall',
  defaultQuota: number = 20
): ProgramQuotaStats => {
  const all = getStoredApplications();
  const programApps = all.filter(
    (a) => a.programId === programId && (a.termId || a.cohortName || 'term-2026-fall') === termId
  );

  const acceptedCount = programApps.filter((a) => a.status === 'accepted').length;
  const waitlistedCount = programApps.filter((a) => ['waitlisted', 'reserve'].includes(a.status)).length;
  const pendingCount = programApps.filter((a) => ['submitted', 'under_review', 'pending'].includes(a.status)).length;
  const rejectedCount = programApps.filter((a) => a.status === 'rejected').length;
  const withdrawnCount = programApps.filter((a) => a.status === 'withdrawn').length;

  return {
    programId,
    programTitle: programApps[0]?.programTitle || 'Eğitim Programı',
    termId,
    cohortName: programApps[0]?.cohortName || '2026 Güz Dönemi',
    quota: defaultQuota,
    acceptedCount,
    waitlistedCount,
    pendingCount,
    rejectedCount,
    withdrawnCount,
    isQuotaFull: acceptedCount >= defaultQuota,
  };
};

/**
 * Demo verilerini fabrika ayarlarına sıfırlar (Hem başvuruları hem kriter setlerini sıfırlar)
 */
export const resetApplicationsToDefaults = (): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_APPLICATIONS));
  resetCriteriaToDefaults();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(UPDATE_EVENT, { detail: DEMO_APPLICATIONS })
    );
  }
};

/**
 * Başvuru değişikliklerini dinleyen event listener bağlayıcı
 */
export const subscribeToApplicationUpdates = (
  callback: (apps: Application[]) => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const custom = e as CustomEvent<Application[]>;
    callback(custom.detail || getStoredApplications());
  };
  window.addEventListener(UPDATE_EVENT, handler);
  return () => window.removeEventListener(UPDATE_EVENT, handler);
};
