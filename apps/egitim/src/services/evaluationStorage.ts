import {
  CriteriaSet,
  Criterion,
  EvaluationResult,
  Application,
} from '../types';
import { INITIAL_DEMO_CRITERIA_SETS } from './criteriaRepository';
import { evaluateApplication, validateCriteriaWeights } from './criteriaEngine';
import { educationApi } from './apiClient';

const CRITERIA_STORAGE_KEY = 'islahiye_education_criteria_v1';
const EVALUATION_STORAGE_KEY = 'islahiye_education_evaluations_v1';

const CRITERIA_UPDATE_EVENT = 'islahiye_criteria_updated';
const EVALUATION_UPDATE_EVENT = 'islahiye_evaluations_updated';

export const syncCriteriaWithApi = async (): Promise<CriteriaSet[]> => {
  try {
    const list = await educationApi.criteria();
    if (list && list.length > 0) {
      const mapped: CriteriaSet[] = list.map((item) => ({
        id: item.id,
        programId: item.programId,
        programTitle: item.programName || 'Genel Program',
        title: `${item.programName || 'Program'} — Kriter Seti v${item.version}.0`,
        description: 'Sistem tarafından yönetilen resmî kriter ve puanlama seti.',
        version: `v${item.version}.0`,
        status: item.isActive ? 'active' : 'archived',
        createdAt: item.createdAt || new Date().toISOString(),
        publishedAt: item.createdAt,
        thresholds: {
          strong: 80,
          suitable: 65,
          reviewNeeded: 50,
        },
        allowCandidateScoreView: false,
        criteria: (item.criteria || []).map((c: any) => ({
          id: c.id,
          code: c.code,
          title: c.title,
          description: c.description || '',
          programId: item.programId,
          type: 'scale_100',
          weight: c.weight,
          maxScore: c.maxScore || 100,
          isMandatory: !!c.isPrerequisite,
          requiresVerification: false,
          isPrerequisite: !!c.isPrerequisite,
        })),
      }));
      saveCriteriaSetsToStorage(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('Criteria API sync notice:', err);
  }
  return getStoredCriteriaSets();
};

if (typeof window !== 'undefined') {
  syncCriteriaWithApi().catch(() => {});
}

// -----------------------------------------------------------------------------
// KRİTER SETİ DEPOLAMA VE SÜRÜM YÖNETİMİ
// -----------------------------------------------------------------------------

export const getStoredCriteriaSets = (): CriteriaSet[] => {
  try {
    const raw = localStorage.getItem(CRITERIA_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        CRITERIA_STORAGE_KEY,
        JSON.stringify(INITIAL_DEMO_CRITERIA_SETS)
      );
      return INITIAL_DEMO_CRITERIA_SETS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(
      CRITERIA_STORAGE_KEY,
      JSON.stringify(INITIAL_DEMO_CRITERIA_SETS)
    );
    return INITIAL_DEMO_CRITERIA_SETS;
  } catch (err) {
    console.error('Criteria storage read error:', err);
    return INITIAL_DEMO_CRITERIA_SETS;
  }
};

const saveCriteriaSetsToStorage = (sets: CriteriaSet[]): void => {
  try {
    localStorage.setItem(CRITERIA_STORAGE_KEY, JSON.stringify(sets));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(CRITERIA_UPDATE_EVENT, { detail: sets })
      );
    }
  } catch (err) {
    console.error('Criteria storage write error:', err);
  }
};

export const getActiveCriteriaSetForProgram = (
  programId: string
): CriteriaSet | undefined => {
  const sets = getStoredCriteriaSets();
  return (
    sets.find((s) => s.programId === programId && s.status === 'active') ||
    sets.find((s) => s.programId === programId) ||
    sets[0]
  );
};

export const getCriteriaSetById = (id: string): CriteriaSet | undefined => {
  const sets = getStoredCriteriaSets();
  return sets.find((s) => s.id === id);
};

export const getAllVersionsForProgram = (programId: string): CriteriaSet[] => {
  const sets = getStoredCriteriaSets();
  return sets.filter((s) => s.programId === programId);
};

/**
 * Mevcut kriter setini günceller veya taslak olarak kaydeder.
 */
export const saveCriteriaSet = (
  criteriaSet: CriteriaSet
): { success: boolean; error?: string } => {
  const all = getStoredCriteriaSets();
  const index = all.findIndex((s) => s.id === criteriaSet.id);

  if (index >= 0) {
    all[index] = criteriaSet;
  } else {
    all.push(criteriaSet);
  }

  saveCriteriaSetsToStorage(all);
  return { success: true };
};

/**
 * Yeni bir kriter sürümü yayımlar (v1.0 -> v1.1 vb.).
 * Ağırlık toplamı 100 değilse yayımlama reddedilir.
 * Önceki aktif sürüm arşivlenir; eski başvuruların puanları korunur.
 */
export const publishNewCriteriaVersion = (
  programId: string,
  updatedCriteria: Criterion[],
  versionNotes: string,
  newVersionLabel?: string
): { success: boolean; newSet?: CriteriaSet; error?: string } => {
  // Ağırlık doğrulaması
  const validation = validateCriteriaWeights(updatedCriteria);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || 'Ağırlık toplamı 100 olmalıdır.',
    };
  }

  const all = getStoredCriteriaSets();
  const programSets = all.filter((s) => s.programId === programId);
  const currentActive = programSets.find((s) => s.status === 'active');

  // Sürüm numaralandırma
  let nextVersion = newVersionLabel;
  if (!nextVersion) {
    const activeVersionNum = currentActive
      ? parseFloat(currentActive.version.replace('v', ''))
      : 1.0;
    nextVersion = `v${(activeVersionNum + 0.1).toFixed(1)}`;
  }

  // Önceki aktif sürümü arşive al
  all.forEach((s) => {
    if (s.programId === programId && s.status === 'active') {
      s.status = 'archived';
    }
  });

  const timestamp = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const newSet: CriteriaSet = {
    id: `critset-${programId}-${nextVersion.replace('.', '')}-${Date.now()}`,
    programId,
    programTitle: currentActive?.programTitle || 'Eğitim Programı',
    version: nextVersion,
    title: `${currentActive?.programTitle || 'Program'} — Kriter Seti ${nextVersion}`,
    description: versionNotes || 'Yönetici tarafından güncellenen kriter ve puanlama seti.',
    status: 'active',
    createdAt: timestamp,
    publishedAt: timestamp,
    allowCandidateScoreView: currentActive?.allowCandidateScoreView || false,
    thresholds: currentActive?.thresholds || {
      strong: 80,
      suitable: 65,
      reviewNeeded: 50,
    },
    criteria: updatedCriteria,
  };

  all.unshift(newSet);
  saveCriteriaSetsToStorage(all);

  educationApi.createCriteriaVersion({
    programId,
    isActive: true,
    criteria: updatedCriteria.map((c) => ({
      code: c.code,
      title: c.title,
      description: c.description || '',
      category: (c as any).category || 'Genel',
      weight: c.weight,
      maxScore: c.maxScore || 100,
      isPrerequisite: !!c.isPrerequisite,
    })),
  }).catch((err) => console.warn('Criteria API publish notice:', err));

  return { success: true, newSet };
};

// -----------------------------------------------------------------------------
// DEĞERLENDİRME VE PUANLAMA DEPOLAMA (EVALUATION RESULTS)
// -----------------------------------------------------------------------------

export const getStoredEvaluations = (): Record<string, EvaluationResult> => {
  try {
    const raw = localStorage.getItem(EVALUATION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (err) {
    console.error('Evaluation storage read error:', err);
    return {};
  }
};

const saveEvaluationsToStorage = (
  evaluations: Record<string, EvaluationResult>
): void => {
  try {
    localStorage.setItem(EVALUATION_STORAGE_KEY, JSON.stringify(evaluations));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(EVALUATION_UPDATE_EVENT, { detail: evaluations })
      );
    }
  } catch (err) {
    console.error('Evaluation storage write error:', err);
  }
};

export const getEvaluationForApplication = (
  applicationId: string
): EvaluationResult | undefined => {
  const map = getStoredEvaluations();
  return map[applicationId];
};

/**
 * Başvuruyu aktif kriter seti ile değerlendirir ve yerel depoya kaydeder.
 */
export const evaluateAndStoreApplication = (
  app: Application,
  forceCriteriaSet?: CriteriaSet
): EvaluationResult => {
  const criteriaSet =
    forceCriteriaSet ||
    (app.criteriaVersionId
      ? getCriteriaSetById(app.criteriaVersionId)
      : undefined) ||
    getActiveCriteriaSetForProgram(app.programId);

  if (!criteriaSet) {
    throw new Error(`Kriter seti bulunamadı (Program: ${app.programId})`);
  }

  const result = evaluateApplication(app, criteriaSet);

  const map = getStoredEvaluations();
  map[app.id] = result;
  saveEvaluationsToStorage(map);

  return result;
};

/**
 * Beyan doğrulama durumunu günceller (Yönetici evrak kontrolü)
 */
export const updateCriterionVerificationStatus = (
  applicationId: string,
  criterionId: string,
  isVerified: boolean
): { success: boolean; result?: EvaluationResult } => {
  const map = getStoredEvaluations();
  const evaluation = map[applicationId];

  if (!evaluation) {
    return { success: false };
  }

  const breakdownItem = evaluation.scoreBreakdown.find(
    (b) => b.criterionId === criterionId
  );
  if (breakdownItem) {
    breakdownItem.isVerified = isVerified;
    evaluation.unverifiedStatementsCount = evaluation.scoreBreakdown.filter(
      (b) => b.requiresVerification && !b.isVerified
    ).length;
    evaluation.hasUnverifiedStatements =
      evaluation.unverifiedStatementsCount > 0;
    map[applicationId] = evaluation;
    saveEvaluationsToStorage(map);
    return { success: true, result: evaluation };
  }

  return { success: false };
};

/**
 * Tüm kriter ve değerlendirme verilerini fabrika ayarlarına sıfırlar.
 */
export const resetCriteriaToDefaults = (): void => {
  localStorage.setItem(
    CRITERIA_STORAGE_KEY,
    JSON.stringify(INITIAL_DEMO_CRITERIA_SETS)
  );
  localStorage.removeItem(EVALUATION_STORAGE_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(CRITERIA_UPDATE_EVENT, {
        detail: INITIAL_DEMO_CRITERIA_SETS,
      })
    );
    window.dispatchEvent(
      new CustomEvent(EVALUATION_UPDATE_EVENT, { detail: {} })
    );
  }
};

/**
 * Depo güncellemelerini dinlemek için olay aboneliği.
 */
export const subscribeToCriteriaUpdates = (
  callback: (criteriaSets: CriteriaSet[]) => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const handler = () => {
    callback(getStoredCriteriaSets());
  };

  window.addEventListener(CRITERIA_UPDATE_EVENT, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(CRITERIA_UPDATE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};

export const subscribeToEvaluationUpdates = (
  callback: (evaluations: Record<string, EvaluationResult>) => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const handler = () => {
    callback(getStoredEvaluations());
  };

  window.addEventListener(EVALUATION_UPDATE_EVENT, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(EVALUATION_UPDATE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};
