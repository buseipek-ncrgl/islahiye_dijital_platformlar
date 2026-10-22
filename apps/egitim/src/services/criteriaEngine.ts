import {
  Application,
  CriteriaSet,
  Criterion,
  CriterionScoreDetail,
  EvaluationResult,
  RecommendationStatus,
  RecommendationThresholds,
} from '../types';

/**
 * Kriter setinin ağırlık toplamını doğrular.
 * Yayımlanabilmesi için aktif kriterlerin ağırlık toplamı tam olarak 100 olmalıdır.
 */
export const validateCriteriaWeights = (
  criteria: Criterion[]
): { valid: boolean; totalWeight: number; error?: string } => {
  const activeScored = criteria.filter((c) => c.type !== 'text');
  const totalWeight = activeScored.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);

  if (totalWeight !== 100) {
    return {
      valid: false,
      totalWeight,
      error: `Aktif puanlanan kriterlerin ağırlık toplamı 100 olmalıdır (Şu anki toplam: ${totalWeight}).`,
    };
  }

  return { valid: true, totalWeight };
};

/**
 * Puan ve ön koşul durumuna göre tavsiye üretir.
 * Bu bir karar değil, yalnızca yetkili yönetici için tavsiyedir.
 */
export const calculateRecommendation = (
  score: number,
  prerequisitesMet: boolean,
  thresholds: RecommendationThresholds
): { status: RecommendationStatus; label: string } => {
  if (!prerequisitesMet) {
    return {
      status: 'prerequisite_review',
      label: 'Ön Koşul İncelemesi Gerekli',
    };
  }

  if (score >= thresholds.strong) {
    return {
      status: 'strong',
      label: 'Güçlü Aday',
    };
  }

  if (score >= thresholds.suitable) {
    return {
      status: 'suitable',
      label: 'Değerlendirmeye Uygun',
    };
  }

  if (score >= thresholds.reviewNeeded) {
    return {
      status: 'review_needed',
      label: 'Ek İnceleme Gerekli',
    };
  }

  return {
    status: 'prerequisite_review',
    label: 'Ön Koşul / Puan Yetersiz (İnceleme Gerekli)',
  };
};

/**
 * Tek bir kriter için adayın yanıtını puanlar.
 */
export const evaluateSingleCriterion = (
  criterion: Criterion,
  app: Application
): CriterionScoreDetail => {
  let earnedRawScore = 0;
  let explanation = '';
  let isMissingMandatory = false;
  let prerequisiteMet = true;
  let candidateAnswerText = '';

  const specificAnswers = app.specificAnswers || {};
  const commitments = app.commitments || {
    attendanceAccepted: false,
    assignmentsAccepted: false,
    truthfulnessAccepted: false,
  };
  const rawAnswer = specificAnswers[criterion.code] ?? specificAnswers[criterion.id];

  switch (criterion.type) {
    case 'single_choice': {
      candidateAnswerText = String(rawAnswer || app.residenceDistrict || app.experienceYears || app.educationLevel || '');
      if (criterion.options && criterion.options.length > 0) {
        // Seçenek eşleştirmesi
        const matched = criterion.options.find(
          (opt) =>
            opt.id === rawAnswer ||
            opt.label.toLowerCase() === candidateAnswerText.toLowerCase() ||
            candidateAnswerText.toLowerCase().includes(opt.label.toLowerCase()) ||
            opt.label.toLowerCase().includes(candidateAnswerText.toLowerCase())
        );

        if (matched) {
          earnedRawScore = matched.points;
          explanation = `Eşleşen Seçenek: "${matched.label}" (${matched.points} puan)`;
          if (matched.isDisqualifier) {
            prerequisiteMet = false;
            explanation += ' [Ön Koşul Karşılanmadı]';
          }
        } else if (criterion.isMandatory && !rawAnswer) {
          isMissingMandatory = true;
          earnedRawScore = 0;
          explanation = 'Zorunlu alan yanıtlanmamış.';
        } else {
          // Varsayılan temel puan
          earnedRawScore = criterion.options[criterion.options.length - 1]?.points || 0;
          explanation = `Genel Beyan Değerlendirmesi (${earnedRawScore} puan)`;
        }
      } else {
        earnedRawScore = criterion.maxScore;
        explanation = 'Kriter karşılandı.';
      }
      break;
    }

    case 'multi_choice': {
      const selectedIds = Array.isArray(rawAnswer) ? rawAnswer : [rawAnswer].filter(Boolean);
      candidateAnswerText = selectedIds.join(', ');
      if (criterion.options && selectedIds.length > 0) {
        let sum = 0;
        selectedIds.forEach((id) => {
          const opt = criterion.options?.find((o) => o.id === id || o.label === id);
          if (opt) sum += opt.points;
        });
        earnedRawScore = Math.min(criterion.maxScore, sum);
        explanation = `${selectedIds.length} seçenek seçildi (${earnedRawScore} / ${criterion.maxScore} puan)`;
      } else {
        earnedRawScore = 0;
        explanation = 'Herhangi bir seçenek işaretlenmemiş.';
        if (criterion.isMandatory) isMissingMandatory = true;
      }
      break;
    }

    case 'numeric': {
      const numVal = Number(rawAnswer ?? parseFloat(app.experienceYears || '0'));
      candidateAnswerText = isNaN(numVal) ? '0' : String(numVal);
      if (criterion.numericThresholds && criterion.numericThresholds.length > 0) {
        const threshold = criterion.numericThresholds.find(
          (t) => numVal >= t.min && (t.max === undefined || numVal <= t.max)
        );
        if (threshold) {
          earnedRawScore = threshold.points;
          explanation = `Sayısal Aralık: ${threshold.label} (${threshold.points} puan)`;
        } else {
          earnedRawScore = 0;
          explanation = `Sayısal değer (${numVal}) eşiklerin altında.`;
        }
      } else {
        earnedRawScore = Math.min(criterion.maxScore, numVal);
        explanation = `Sayısal girdi: ${numVal} puan`;
      }
      break;
    }

    case 'boolean': {
      // Örn: Devam ve katılım taahhüdü
      const boolVal =
        rawAnswer === true ||
        rawAnswer === 'true' ||
        (criterion.isPrerequisite && commitments.attendanceAccepted);
      candidateAnswerText = boolVal ? 'Evet (Kabul Edildi)' : 'Hayır (Kabul Edilmedi)';
      if (boolVal) {
        earnedRawScore = criterion.maxScore;
        explanation = 'Taahhüt eksiksiz onaylandı.';
      } else {
        earnedRawScore = 0;
        prerequisiteMet = false;
        explanation = 'Zorunlu katılım taahhüdü verilmedi.';
        if (criterion.isMandatory) isMissingMandatory = true;
      }
      break;
    }

    case 'verified_statement': {
      // ÇKS kaydı veya vergi levhası gibi idari doğrulama gerektiren beyan
      const hasStated =
        Boolean(rawAnswer) ||
        (app.occupation && !app.occupation.includes('Yok')) ||
        (commitments.truthfulnessAccepted);
      candidateAnswerText = hasStated ? 'Beyan Edildi (İdari Doğrulama Bekliyor)' : 'Beyan Edilmedi';
      if (hasStated) {
        earnedRawScore = criterion.maxScore;
        explanation = 'Aday tarafından beyan edildi; idari masada evrak doğrulaması gerektirir.';
      } else {
        earnedRawScore = 0;
        explanation = 'İlgili beyan bulunamadı.';
        if (criterion.isMandatory) isMissingMandatory = true;
      }
      break;
    }

    case 'text':
    default: {
      // Serbest metinler ÖZNEL PUANLANMAZ, 0 puan üretir ve yönetici incelemesine bırakılır
      candidateAnswerText = String(app.statement || rawAnswer || '(Gerekçe metni girildi)');
      earnedRawScore = 0;
      explanation = 'Serbest gerekçe metni otomatik puanlanmaz; yönetici değerlendirmesine bırakılmıştır.';
      if (criterion.isMandatory && !candidateAnswerText.trim()) {
        isMissingMandatory = true;
      }
      break;
    }
  }

  // Ağırlıklı puan hesabı: (Kazanılan Ham Puan / Maksimum Ham Puan) * Kriter Ağırlığı
  let earnedWeightedScore = 0;
  if (criterion.maxScore > 0 && criterion.weight > 0) {
    earnedWeightedScore = (earnedRawScore / criterion.maxScore) * criterion.weight;
  }

  // Yuvarlama (tek ondalık basamak)
  earnedWeightedScore = Math.round(earnedWeightedScore * 10) / 10;

  return {
    criterionId: criterion.id,
    criterionCode: criterion.code,
    criterionTitle: criterion.title,
    type: criterion.type,
    weight: criterion.weight,
    maxScore: criterion.maxScore,
    earnedRawScore,
    earnedWeightedScore,
    explanation,
    isMissingMandatory,
    requiresVerification: criterion.requiresVerification,
    isVerified: false,
    prerequisiteMet,
    candidateAnswerText,
  };
};

/**
 * Başvuruyu kriter seti kurallarıyla deterministik biçimde değerlendirir.
 * Formül: Toplam Puan = Σ (Kriter Kazanılan Puanı / Kriter Maksimum Puanı × Kriter Ağırlığı)
 */
export const evaluateApplication = (
  app: Application,
  criteriaSet: CriteriaSet
): EvaluationResult => {
  const breakdown: CriterionScoreDetail[] = [];
  let totalWeighted = 0;
  let allPrerequisitesMet = true;
  let unverifiedCount = 0;
  let missingMandatoryCount = 0;

  for (const criterion of criteriaSet.criteria) {
    const detail = evaluateSingleCriterion(criterion, app);
    breakdown.push(detail);

    totalWeighted += detail.earnedWeightedScore;

    if (!detail.prerequisiteMet) {
      allPrerequisitesMet = false;
    }
    if (detail.requiresVerification && !detail.isVerified) {
      unverifiedCount++;
    }
    if (detail.isMissingMandatory) {
      missingMandatoryCount++;
    }
  }

  // 0 - 100 aralığına sınırla ve tam sayıya yuvarla
  const finalTotalScore = Math.min(100, Math.max(0, Math.round(totalWeighted)));

  const rec = calculateRecommendation(
    finalTotalScore,
    allPrerequisitesMet,
    criteriaSet.thresholds
  );

  return {
    applicationId: app.id,
    criteriaSetId: criteriaSet.id,
    criteriaVersion: criteriaSet.version,
    evaluatedAt: new Date().toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    totalWeightedScore: finalTotalScore,
    recommendation: rec.status,
    recommendationLabel: rec.label,
    prerequisitesMet: allPrerequisitesMet,
    hasUnverifiedStatements: unverifiedCount > 0,
    unverifiedStatementsCount: unverifiedCount,
    missingMandatoryCount,
    scoreBreakdown: breakdown,
    notes: 'Kural bazlı deterministik ön inceleme puanı. Nihai karar idari yöneticiye aittir.',
  };
};
