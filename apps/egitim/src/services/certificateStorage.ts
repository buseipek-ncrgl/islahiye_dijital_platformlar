import {
  CertificateRecord,
  CertificateType,
  CertificateIssuanceCheckResult,
} from '../types';
import { calculateFinalEligibility } from './successEngine';
import { getSuccessDecisionByEnrollment } from './successDecisionStorage';
import { notifyCertificateIssued } from './notificationEngine';

export const CERTIFICATES_STORAGE_KEY = 'islahiye_education_certificates_v2';
export const CERTIFICATES_UPDATE_EVENT = 'islahiye_education_certificates_updated';

// ============================================================================
// 1. BAŞLANGIÇ DEMO BELGELERİ (Seed Data - Real 2026 Fall Data)
// ============================================================================

export const INITIAL_CERTIFICATES: CertificateRecord[] = [
  // 1. Ahmet Kaya — Geçerli Düzenlenmiş Başarı Belgesi
  {
    id: 'cert-ahmet-01',
    certificateNumber: 'İE-2026-BB-001',
    enrollmentId: 'enr-trainee-ahmet',
    candidateId: 'usr-trainee',
    traineeName: 'Ahmet Kaya',
    traineeEmail: 'kursiyer.ahmet@islahiye.bel.tr',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-01',
    groupName: 'Grup A — Sabah Oturumu',
    certificateType: 'achievement',
    certificateTypeLabel: 'Eğitim Başarı Belgesi',
    status: 'issued',
    issuedAt: '2026-10-21T09:30:00+03:00',
    issuedBy: 'Selin Aydın (Eğitim Programları Müdürü)',
    successDecisionId: 'dec-ahmet-01',
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
    verificationCode: 'IE-VER-89104',
    verificationUrl: '/belge-dogrula/IE-VER-89104',
    auditHistory: [
      {
        action: 'issued',
        performedBy: 'Selin Aydın (Eğitim Programları Müdürü)',
        performedAt: '2026-10-21T09:30:00+03:00',
        newStatus: 'issued',
        note: 'Nihai yönetim kurulu onayı doğrultusunda resmi başarı belgesi düzenlendi.',
      },
    ],
    notes: '2026 Güz Dönemi ilk resmi dönem sonu başarı belgesi kaydıdır.',
    createdAt: '2026-10-21T09:30:00+03:00',
    updatedAt: '2026-10-21T09:30:00+03:00',
  },

  // 2. Fatma Şahin — Geçerli Düzenlenmiş Başarı Belgesi
  {
    id: 'cert-fatma-01',
    certificateNumber: 'İE-2026-BB-002',
    enrollmentId: 'enr-trainee-fatma',
    candidateId: 'usr-real-12',
    traineeName: 'Fatma Şahin',
    traineeEmail: 'kursiyer.fatma@islahiye.bel.tr',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-01',
    groupName: 'Grup A — Sabah Oturumu',
    certificateType: 'achievement',
    certificateTypeLabel: 'Eğitim Başarı Belgesi',
    status: 'issued',
    issuedAt: '2026-10-22T10:00:00+03:00',
    issuedBy: 'Selin Aydın (Eğitim Programları Müdürü)',
    successDecisionId: 'dec-fatma-01',
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
    verificationCode: 'IE-VER-89105',
    verificationUrl: '/belge-dogrula/IE-VER-89105',
    auditHistory: [
      {
        action: 'issued',
        performedBy: 'Selin Aydın (Eğitim Programları Müdürü)',
        performedAt: '2026-10-22T10:00:00+03:00',
        newStatus: 'issued',
        note: 'Resmi dönem sonu başarı belgesi düzenlendi.',
      },
    ],
    notes: 'Üstün başarı derecesi ile onaylandı.',
    createdAt: '2026-10-22T10:00:00+03:00',
    updatedAt: '2026-10-22T10:00:00+03:00',
  },

  // 3. Örnek İptal Edilmiş Belge (Senaryo testleri ve denetim geçmişi için)
  {
    id: 'cert-sample-cancelled',
    certificateNumber: 'İE-2026-BB-099',
    enrollmentId: 'enr-sample-cancel',
    candidateId: 'user-trainee-99',
    traineeName: 'Ali Kemal Yıldız',
    traineeEmail: 'ali.yildiz@ornek.com',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    groupId: 'grp-01',
    groupName: 'Grup A — Sabah Oturumu',
    certificateType: 'achievement',
    certificateTypeLabel: 'Eğitim Başarı Belgesi',
    status: 'cancelled',
    issuedAt: '2026-10-15T10:00:00+03:00',
    issuedBy: 'Selin Aydın (Eğitim Programları Müdürü)',
    successDecisionId: 'dec-sample-old',
    eligibilitySnapshot: {
      attendanceRate: 85,
      attendedCount: 17,
      completedSessionsCount: 20,
      excusedCount: 0,
      assignmentAverage: 75,
      mandatoryAssignmentsApproved: 3,
      mandatoryAssignmentsTotal: 3,
      sessionsEvaluatedCount: 20,
      capturedAt: '2026-10-15T09:00:00+03:00',
    },
    verificationCode: 'IE-VER-99001',
    verificationUrl: '/belge-dogrula/IE-VER-99001',
    cancelledAt: '2026-10-18T14:20:00+03:00',
    cancellationReason: 'Kursiyerin dönem sonu evraklarında tespit edilen mükerrerlik nedeniyle yönetim kurulu kararıyla iptal edilmiştir.',
    cancelledBy: 'Kemal Ertürk (Genel Sekreter Yrd.)',
    auditHistory: [
      {
        action: 'issued',
        performedBy: 'Selin Aydın (Eğitim Programları Müdürü)',
        performedAt: '2026-10-15T10:00:00+03:00',
        newStatus: 'issued',
        note: 'İlk düzenleme yapıldı.',
      },
      {
        action: 'cancelled',
        performedBy: 'Kemal Ertürk (Genel Sekreter Yrd.)',
        performedAt: '2026-10-18T14:20:00+03:00',
        previousStatus: 'issued',
        newStatus: 'cancelled',
        reason: 'Evrak mükerrerliği gerekçesiyle iptal.',
      },
    ],
    createdAt: '2026-10-15T10:00:00+03:00',
    updatedAt: '2026-10-18T14:20:00+03:00',
  },
];

// ============================================================================
// 2. TEMEL DEPOLAMA ERİŞİM FONKSİYONLARI
// ============================================================================

export const getStoredCertificates = (): CertificateRecord[] => {
  try {
    const raw = localStorage.getItem(CERTIFICATES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(INITIAL_CERTIFICATES));
      return INITIAL_CERTIFICATES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < 2) {
      localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(INITIAL_CERTIFICATES));
      return INITIAL_CERTIFICATES;
    }
    return parsed;
  } catch (err) {
    console.error('getStoredCertificates error:', err);
    return INITIAL_CERTIFICATES;
  }
};

const saveCertificates = (records: CertificateRecord[]) => {
  try {
    localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(records));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(CERTIFICATES_UPDATE_EVENT));
    }
  } catch (err) {
    console.error('saveCertificates error:', err);
  }
};

export const subscribeToCertificateUpdates = (callback: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CERTIFICATES_UPDATE_EVENT, callback);
  return () => {
    window.removeEventListener(CERTIFICATES_UPDATE_EVENT, callback);
  };
};

// ============================================================================
// 3. 8 KATI YETKİ VE ÖN KOŞUL KONTROLÜ
// ============================================================================

export const checkCertificateIssuanceEligibility = (
  enrollmentId: string
): CertificateIssuanceCheckResult => {
  const reasons: string[] = [];

  // Anlık başarı uygunluğunu hesapla
  const eligibility = calculateFinalEligibility(enrollmentId);
  if (!eligibility || eligibility.traineeId === 'unknown') {
    reasons.push('Geçerli kesin kayıt bulunamadı.');
    return { canIssue: false, reasons };
  }

  // 1. Kesin kayıt geçerliliği
  if (!eligibility.enrollmentId) {
    reasons.push('Kesin kayıt kaydı eksik veya geçersiz.');
  }

  // 2. Program ve dönem tutarlılığı
  if (!eligibility.programId || !eligibility.termId) {
    reasons.push('Program ve eğitim dönemi bilgileri eksik.');
  }

  // 3. Devam koşulu (en az %80)
  if (!eligibility.attendanceEligible) {
    reasons.push(
      `Devam oranı şartı (%80) sağlanmamıştır. (Mevcut: ${
        eligibility.attendanceRate !== null ? `%${eligibility.attendanceRate}` : 'Hesaplanamıyor'
      })`
    );
  }

  // 4. Ödev ortalaması (en az 70/100)
  if (!eligibility.gradeEligible) {
    reasons.push(
      `Ödev ortalaması şartı (70/100) sağlanmamıştır. (Mevcut: ${
        eligibility.assignmentAverage !== null ? `${eligibility.assignmentAverage} / 100` : 'Not Yok'
      })`
    );
  }

  // 5. Zorunlu ödev onayları
  if (!eligibility.mandatoryEligible) {
    reasons.push(
      `Bütün zorunlu ödevler onaylanmamıştır. (${eligibility.mandatoryAssignmentsApproved} / ${eligibility.mandatoryAssignmentsTotal} onaylı)`
    );
  }

  // 6. Yetkili yönetici nihai başarı kararı
  const decisionRecord = getSuccessDecisionByEnrollment(enrollmentId);
  if (!decisionRecord || decisionRecord.decision !== 'approved') {
    reasons.push(
      'Yetkili oda yöneticisi tarafından nihai başarı onayı verilmemiştir. (Önce /yonetim/basari-onay masasından onaylanmalıdır)'
    );
  }

  // 7. Başarı kararının akademik kanıt özeti güncel olmalı (snapshot uyumsuzluğu olmamalı)
  if (eligibility.hasDiscrepancyWithSavedSnapshot) {
    reasons.push(
      'Kayıtlı onay snapshot verisi ile güncel yoklama/not verileri arasında uyumsuzluk tespit edilmiştir. Yeniden inceleme gereklidir.'
    );
  }

  // 8. Mükerrer aktif belge kontrolü
  const allCerts = getStoredCertificates();
  const existingActive = allCerts.find(
    (c) => c.enrollmentId === enrollmentId && (c.status === 'issued' || c.status === 'draft')
  );
  if (existingActive) {
    reasons.push(
      `Bu kursiyer için zaten düzenlenmiş aktif bir belge bulunmaktadır (${existingActive.certificateNumber}). Mükerrer belge üretilemez.`
    );
  }

  return {
    canIssue: reasons.length === 0,
    reasons,
    eligibilityResult: eligibility,
    existingCertificate: existingActive,
  };
};

// ============================================================================
// 4. BELGE NUMARASI VE DOĞRULAMA KODU ÜRETİCİSİ
// ============================================================================

export const generateUniqueCertificateNumber = (): string => {
  const allCerts = getStoredCertificates();
  const year = new Date().getFullYear();
  let maxSeq = 0;

  for (const cert of allCerts) {
    const match = cert.certificateNumber.match(/(?:İE|İTO)-\d{4}-BB-(\d+)/i);
    if (match && match[1]) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `İE-${year}-BB-${nextSeq}`;
};

export const generateUniqueVerificationCode = (): string => {
  const allCerts = getStoredCertificates();
  const existingCodes = new Set(allCerts.map((c) => c.verificationCode.toUpperCase()));

  let code = '';
  do {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    code = `IE-VER-${randomNum}`;
  } while (existingCodes.has(code));

  return code;
};

// ============================================================================
// 5. BELGE DÜZENLEME, İPTAL VE YENİDEN DÜZENLEME İŞLEMLERİ
// ============================================================================

export const issueCertificate = (params: {
  enrollmentId: string;
  issuedBy: string;
  certificateType?: CertificateType;
  notes?: string;
}): { success: boolean; certificate?: CertificateRecord; error?: string } => {
  const check = checkCertificateIssuanceEligibility(params.enrollmentId);
  if (!check.canIssue || !check.eligibilityResult) {
    return {
      success: false,
      error: check.reasons.join(' '),
    };
  }

  const decision = getSuccessDecisionByEnrollment(params.enrollmentId);
  if (!decision) {
    return { success: false, error: 'Yönetici başarı kararı bulunamadı.' };
  }

  const certType = params.certificateType || 'achievement';
  const certNumber = generateUniqueCertificateNumber();
  const verCode = generateUniqueVerificationCode();
  const nowIso = new Date().toISOString();

  const newCert: CertificateRecord = {
    id: `cert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    certificateNumber: certNumber,
    enrollmentId: params.enrollmentId,
    candidateId: check.eligibilityResult.traineeId,
    traineeName: check.eligibilityResult.traineeName,
    traineeEmail: check.eligibilityResult.traineeEmail,
    programId: check.eligibilityResult.programId,
    programTitle: check.eligibilityResult.programTitle,
    termId: check.eligibilityResult.termId,
    cohortName: check.eligibilityResult.cohortName,
    groupId: check.eligibilityResult.groupId,
    groupName: check.eligibilityResult.groupName,
    certificateType: certType,
    certificateTypeLabel:
      certType === 'achievement'
        ? 'Eğitim Başarı Belgesi'
        : certType === 'participation'
        ? 'Katılım Belgesi'
        : 'Uzmanlık Belgesi',
    status: 'issued',
    issuedAt: nowIso,
    issuedBy: params.issuedBy,
    successDecisionId: decision.decisionId,
    eligibilitySnapshot: check.eligibilityResult.sourceSnapshot,
    verificationCode: verCode,
    verificationUrl: `/belge-dogrula/${verCode}`,
    auditHistory: [
      {
        action: 'issued',
        performedBy: params.issuedBy,
        performedAt: nowIso,
        newStatus: 'issued',
        note: params.notes || 'Nihai yönetim onayı doğrultusunda başarı belgesi düzenlendi.',
      },
    ],
    notes: params.notes,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const allCerts = getStoredCertificates();
  saveCertificates([newCert, ...allCerts]);

  // Bildirim tetikle (Non-blocking)
  try {
    notifyCertificateIssued(newCert);
  } catch (err) {
    console.warn('Belge bildirimi tetiklenirken hata:', err);
  }

  return { success: true, certificate: newCert };
};

export const cancelCertificate = (params: {
  certificateId: string;
  cancellationReason: string;
  cancelledBy: string;
}): { success: boolean; certificate?: CertificateRecord; error?: string } => {
  if (!params.cancellationReason || params.cancellationReason.trim().length < 5) {
    return { success: false, error: 'İptal işlemi için zorunlu gerekçe belirtilmelidir.' };
  }

  const allCerts = getStoredCertificates();
  const certIndex = allCerts.findIndex((c) => c.id === params.certificateId);
  if (certIndex === -1) {
    return { success: false, error: 'Belge kaydı bulunamadı.' };
  }

  const cert = allCerts[certIndex];
  if (cert.status === 'cancelled') {
    return { success: false, error: 'Bu belge zaten iptal edilmiştir.' };
  }

  const nowIso = new Date().toISOString();
  const updatedCert: CertificateRecord = {
    ...cert,
    status: 'cancelled',
    cancelledAt: nowIso,
    cancellationReason: params.cancellationReason.trim(),
    cancelledBy: params.cancelledBy,
    updatedAt: nowIso,
    auditHistory: [
      ...(cert.auditHistory || []),
      {
        action: 'cancelled',
        performedBy: params.cancelledBy,
        performedAt: nowIso,
        previousStatus: cert.status,
        newStatus: 'cancelled',
        reason: params.cancellationReason.trim(),
      },
    ],
  };

  allCerts[certIndex] = updatedCert;
  saveCertificates([...allCerts]);

  return { success: true, certificate: updatedCert };
};

export const reissueCertificate = (params: {
  previousCertificateId: string;
  reissueReason: string;
  reissuedBy: string;
}): { success: boolean; newCertificate?: CertificateRecord; error?: string } => {
  if (!params.reissueReason || params.reissueReason.trim().length < 5) {
    return { success: false, error: 'Yeniden düzenleme gerekçesi zorunludur.' };
  }

  const allCerts = getStoredCertificates();
  const oldCertIndex = allCerts.findIndex((c) => c.id === params.previousCertificateId);
  if (oldCertIndex === -1) {
    return { success: false, error: 'Önceki belge kaydı bulunamadı.' };
  }

  const oldCert = allCerts[oldCertIndex];
  const nowIso = new Date().toISOString();

  // Yeni belge numarası ve doğrulama kodu
  const newCertNumber = generateUniqueCertificateNumber();
  const newVerCode = generateUniqueVerificationCode();
  const newCertId = `cert-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Güncel snapshot'ı çek
  const eligibility = calculateFinalEligibility(oldCert.enrollmentId, oldCert.termId);

  const newCert: CertificateRecord = {
    ...oldCert,
    id: newCertId,
    certificateNumber: newCertNumber,
    verificationCode: newVerCode,
    verificationUrl: `/belge-dogrula/${newVerCode}`,
    status: 'issued',
    issuedAt: nowIso,
    issuedBy: params.reissuedBy,
    eligibilitySnapshot: eligibility.sourceSnapshot,
    supersededFromCertificateId: oldCert.id,
    supersededByCertificateId: undefined,
    cancelledAt: undefined,
    cancellationReason: undefined,
    cancelledBy: undefined,
    auditHistory: [
      {
        action: 'reissued',
        performedBy: params.reissuedBy,
        performedAt: nowIso,
        newStatus: 'issued',
        reason: params.reissueReason.trim(),
        note: `${oldCert.certificateNumber} numaralı belgenin yerine yeniden düzenlendi.`,
      },
    ],
    notes: `Önceki Belge: ${oldCert.certificateNumber}. Gerekçe: ${params.reissueReason.trim()}`,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // Eski belgeyi superseded olarak güncelle
  const updatedOldCert: CertificateRecord = {
    ...oldCert,
    status: 'superseded',
    supersededByCertificateId: newCertId,
    supersededReason: params.reissueReason.trim(),
    updatedAt: nowIso,
    auditHistory: [
      ...(oldCert.auditHistory || []),
      {
        action: 'status_changed',
        performedBy: params.reissuedBy,
        performedAt: nowIso,
        previousStatus: oldCert.status,
        newStatus: 'superseded',
        reason: `Yerine yeni belge (${newCertNumber}) düzenlendi: ${params.reissueReason.trim()}`,
      },
    ],
  };

  allCerts[oldCertIndex] = updatedOldCert;
  saveCertificates([newCert, ...allCerts]);

  return { success: true, newCertificate: newCert };
};

// ============================================================================
// 6. SORGULAMA VE DOĞRULAMA FONKSİYONLARI
// ============================================================================

export const getCertificateByVerificationCode = (code: string): CertificateRecord | null => {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  const allCerts = getStoredCertificates();
  return (
    allCerts.find(
      (c) =>
        c.verificationCode.toUpperCase() === normalized ||
        c.certificateNumber.toUpperCase() === normalized
    ) || null
  );
};

export const getCertificatesByCandidateId = (candidateId: string): CertificateRecord[] => {
  if (!candidateId) return [];
  const isDemoTrainee =
    candidateId === 'usr-trainee' ||
    candidateId === 'user-trainee-01' ||
    candidateId === 'user-trainee-02' ||
    candidateId.includes('trainee') ||
    candidateId.includes('ahmet');

  const allCerts = getStoredCertificates();
  return allCerts.filter(
    (c) =>
      c.candidateId === candidateId ||
      (isDemoTrainee && (c.candidateId === 'usr-trainee' || c.candidateId === 'user-trainee-01' || c.candidateId === 'user-trainee-02'))
  );
};

export const getCertificateByEnrollment = (enrollmentId: string): CertificateRecord | null => {
  if (!enrollmentId) return null;
  const allCerts = getStoredCertificates();
  return allCerts.find((c) => c.enrollmentId === enrollmentId && c.status !== 'superseded') || null;
};

// ============================================================================
// 7. AKADEMİK VERİLERİN DEĞİŞMESİ (DISCREPANCY) KONTROLÜ
// ============================================================================

export const checkCertificateAcademicDiscrepancy = (
  certificate: CertificateRecord
): { hasDiscrepancy: boolean; currentEligibility?: ReturnType<typeof calculateFinalEligibility> } => {
  if (certificate.status === 'cancelled' || certificate.status === 'superseded') {
    return { hasDiscrepancy: false };
  }

  const current = calculateFinalEligibility(certificate.enrollmentId, certificate.termId);
  const snap = certificate.eligibilitySnapshot;

  const attChanged = snap.attendanceRate !== current.attendanceRate;
  const gradeChanged = snap.assignmentAverage !== current.assignmentAverage;
  const mandChanged = snap.mandatoryAssignmentsApproved !== current.mandatoryAssignmentsApproved;

  const hasDiscrepancy = attChanged || gradeChanged || mandChanged || !current.academicEligible;

  return {
    hasDiscrepancy,
    currentEligibility: current,
  };
};

export const resetCertificateDemoData = () => {
  localStorage.setItem(CERTIFICATES_STORAGE_KEY, JSON.stringify(INITIAL_CERTIFICATES));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CERTIFICATES_UPDATE_EVENT));
  }
};
