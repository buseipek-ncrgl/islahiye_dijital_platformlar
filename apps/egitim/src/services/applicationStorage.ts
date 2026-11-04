import {
  Application,
  ApplicationStatus,
  DecisionHistoryItem,
  ProgramQuotaStats,
} from '../types';
import { educationApi, ApplicationDto } from './apiClient';
import {
  getActiveCriteriaSetForProgram,
  evaluateAndStoreApplication,
  resetCriteriaToDefaults,
} from './evaluationStorage';
import {
  notifyApplicationSubmitted,
  notifyAdminDecision,
} from './notificationEngine';

const STORAGE_KEY = 'islahiye_education_applications_v2';
const UPDATE_EVENT = 'islahiye_applications_updated';

const statusMap: Record<number, ApplicationStatus> = {
  0: 'draft',
  1: 'submitted',
  2: 'under_review',
  3: 'accepted',
  4: 'rejected',
  5: 'withdrawn',
};

const reverseStatusMap: Partial<Record<ApplicationStatus, number>> = {
  draft: 0,
  submitted: 1,
  under_review: 2,
  accepted: 3,
  rejected: 4,
  withdrawn: 5,
};

export const mapApplicationDtoToApplication = (dto: ApplicationDto): Application => {
  return {
    id: dto.id,
    referenceNumber: dto.applicationNumber,
    candidateId: dto.applicantUserId,
    candidateName: dto.fullName,
    phone: dto.phone,
    email: dto.email,
    programId: dto.programId,
    programTitle: dto.programName,
    termId: dto.termId,
    cohortName: dto.termName,
    appliedAt: dto.submittedAt ? new Date(dto.submittedAt).toLocaleDateString('tr-TR') : 'Bugün',
    updatedAt: dto.createdAt ? new Date(dto.createdAt).toLocaleDateString('tr-TR') : 'Bugün',
    educationLevel: dto.educationLevel,
    occupation: dto.occupation,
    residenceDistrict: dto.address?.includes('İslahiye') ? 'İslahiye Merkez' : 'Gaziantep',
    experienceYears: `${dto.experienceYears} Yıl`,
    statement: dto.motivation,
    status: statusMap[dto.status] || 'submitted',
    autoScore: dto.score
      ? {
          total: dto.score,
          ruleVersion: 'v1.0',
          residencePoints: 20,
          educationPoints: 20,
          experiencePoints: 20,
        }
      : undefined,
    deviationReason: dto.rejectionReason || undefined,
    adminJustification: dto.adminNotes || undefined,
    commitments: {
      attendanceAccepted: true,
      assignmentsAccepted: true,
      truthfulnessAccepted: true,
    },
    statusHistory: [
      {
        status: statusMap[dto.status] || 'submitted',
        changedAt: dto.submittedAt ? new Date(dto.submittedAt).toLocaleDateString('tr-TR') : 'Bugün',
        note: 'Başvuru sisteme kaydedildi.',
      },
    ],
  };
};

export const syncApplicationsWithApi = async (): Promise<Application[]> => {
  try {
    const list = await educationApi.applications();
    if (list && list.length > 0) {
      const mapped = list.map(mapApplicationDtoToApplication);
      const merged = [...INITIAL_APPLICATIONS];
      mapped.forEach((apiApp) => {
        const idx = merged.findIndex((m) => m.id === apiApp.id || m.candidateId === apiApp.candidateId);
        if (idx >= 0) {
          merged[idx] = { ...merged[idx], ...apiApp };
        } else {
          merged.push(apiApp);
        }
      });
      saveToStorage(merged);
      return merged;
    }
  } catch (err) {
    console.warn('API sync applications notice:', err);
  }
  return getStoredApplications();
};

if (typeof window !== 'undefined') {
  syncApplicationsWithApi().catch(() => {});
}

export const INITIAL_APPLICATIONS: Application[] = [
  // 1. Ahmet Kaya (Grup A - Kayıtlı)
  {
    id: 'app-seed-ahmet',
    referenceNumber: 'ISL-2026-0001',
    candidateId: 'usr-trainee',
    candidateName: 'Ahmet Kaya',
    phone: '0532 *** ** 11',
    email: 'kursiyer.ahmet@islahiye.bel.tr',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    appliedAt: '12 Ağustos 2026 10:00',
    updatedAt: '25 Ağustos 2026 14:00',
    educationLevel: 'Lisans',
    occupation: 'Tarımsal Üretici & Çiftçi',
    residenceDistrict: 'İslahiye Merkez',
    experienceYears: '4 Yıl',
    statement: 'İslahiye biberinin coğrafi işaret standartlarında dijital pazarlarda doğrudan satışı üzerine çalışmaktayım.',
    status: 'accepted',
    autoScore: { total: 95, ruleVersion: 'v1.0', residencePoints: 30, educationPoints: 30, experiencePoints: 35 },
    commitments: { attendanceAccepted: true, assignmentsAccepted: true, truthfulnessAccepted: true },
    statusHistory: [
      { status: 'submitted', changedAt: '12 Ağustos 2026', note: 'Başvuru yapıldı.' },
      { status: 'accepted', changedAt: '20 Ağustos 2026', note: 'Asil listeye kabul edildi.' },
    ],
  },
  // 2. Fatma Şahin (Grup A - Kayıtlı)
  {
    id: 'app-seed-fatma',
    referenceNumber: 'ISL-2026-0002',
    candidateId: 'usr-real-12',
    candidateName: 'Fatma Şahin',
    phone: '0533 *** ** 12',
    email: 'kursiyer.fatma@islahiye.bel.tr',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    appliedAt: '13 Ağustos 2026 11:30',
    updatedAt: '25 Ağustos 2026 14:00',
    educationLevel: 'Lisans',
    occupation: 'Gıda Teknikeri',
    residenceDistrict: 'İslahiye Merkez',
    experienceYears: '5 Yıl',
    statement: 'Paketleme ve soğuk zincir lojistiği eğitimlerini tamamlayarak e-ihracat yapmak istiyorum.',
    status: 'accepted',
    autoScore: { total: 92, ruleVersion: 'v1.0', residencePoints: 30, educationPoints: 30, experiencePoints: 32 },
    commitments: { attendanceAccepted: true, assignmentsAccepted: true, truthfulnessAccepted: true },
    statusHistory: [
      { status: 'submitted', changedAt: '13 Ağustos 2026', note: 'Başvuru yapıldı.' },
      { status: 'accepted', changedAt: '20 Ağustos 2026', note: 'Asil listeye kabul edildi.' },
    ],
  },
  // 3. Mehmet Öztürk (Grup A - Kayıtlı)
  {
    id: 'app-seed-mehmet-ozturk',
    referenceNumber: 'ISL-2026-0003',
    candidateId: 'usr-real-13',
    candidateName: 'Mehmet Öztürk',
    phone: '0534 *** ** 13',
    email: 'kursiyer.mehmet@islahiye.bel.tr',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    appliedAt: '14 Ağustos 2026 09:15',
    updatedAt: '25 Ağustos 2026 14:00',
    educationLevel: 'Ön Lisans',
    occupation: 'Esnaf',
    residenceDistrict: 'İslahiye / Fevzipaşa',
    experienceYears: '3 Yıl',
    statement: 'Yöresel baharat ve salça ürünlerimizi ulusal pazaryerlerine taşımak.',
    status: 'accepted',
    autoScore: { total: 88, ruleVersion: 'v1.0', residencePoints: 28, educationPoints: 25, experiencePoints: 35 },
    commitments: { attendanceAccepted: true, assignmentsAccepted: true, truthfulnessAccepted: true },
    statusHistory: [
      { status: 'submitted', changedAt: '14 Ağustos 2026', note: 'Başvuru yapıldı.' },
      { status: 'accepted', changedAt: '20 Ağustos 2026', note: 'Asil listeye kabul edildi.' },
    ],
  },
  // 4. Elif Çetin (Grup A - Kayıtlı)
  {
    id: 'app-seed-elif',
    referenceNumber: 'ISL-2026-0004',
    candidateId: 'usr-real-14',
    candidateName: 'Elif Çetin',
    phone: '0535 *** ** 14',
    email: 'kursiyer.elif@islahiye.bel.tr',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    appliedAt: '15 Ağustos 2026 14:20',
    updatedAt: '25 Ağustos 2026 14:00',
    educationLevel: 'Lisans',
    occupation: 'Grafik & Medya',
    residenceDistrict: 'İslahiye / Atatürk Mah.',
    experienceYears: '3 Yıl',
    statement: 'Ürün etiket tasarımı, fotoğrafçılık ve sosyal medya kanallarından doğrudan satış.',
    status: 'accepted',
    autoScore: { total: 85, ruleVersion: 'v1.0', residencePoints: 25, educationPoints: 30, experiencePoints: 30 },
    commitments: { attendanceAccepted: true, assignmentsAccepted: true, truthfulnessAccepted: true },
    statusHistory: [
      { status: 'submitted', changedAt: '15 Ağustos 2026', note: 'Başvuru yapıldı.' },
      { status: 'accepted', changedAt: '20 Ağustos 2026', note: 'Asil listeye kabul edildi.' },
    ],
  },
  // 5. Mustafa Demir (Grup A - Kayıtlı)
  {
    id: 'app-seed-mustafa',
    referenceNumber: 'ISL-2026-0005',
    candidateId: 'usr-real-15',
    candidateName: 'Mustafa Demir',
    phone: '0536 *** ** 15',
    email: 'kursiyer.mustafa@islahiye.bel.tr',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    appliedAt: '16 Ağustos 2026 16:00',
    updatedAt: '25 Ağustos 2026 14:00',
    educationLevel: 'Lise',
    occupation: 'Çiftçi',
    residenceDistrict: 'İslahiye / Boğaziçi',
    experienceYears: '6 Yıl',
    statement: 'Biber hasadı sonrası kurutma ve paketlemede e-ticaret modeline geçiş.',
    status: 'accepted',
    autoScore: { total: 81, ruleVersion: 'v1.0', residencePoints: 30, educationPoints: 16, experiencePoints: 35 },
    commitments: { attendanceAccepted: true, assignmentsAccepted: true, truthfulnessAccepted: true },
    statusHistory: [
      { status: 'submitted', changedAt: '16 Ağustos 2026', note: 'Başvuru yapıldı.' },
      { status: 'accepted', changedAt: '20 Ağustos 2026', note: 'Asil listeye kabul edildi.' },
    ],
  },
  // 6. Emine Koç (Grup A - Kayıtlı)
  {
    id: 'app-seed-emine',
    referenceNumber: 'ISL-2026-0006',
    candidateId: 'usr-real-16',
    candidateName: 'Emine Koç',
    phone: '0537 *** ** 16',
    email: 'kursiyer.emine@islahiye.bel.tr',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    appliedAt: '17 Ağustos 2026 10:30',
    updatedAt: '25 Ağustos 2026 14:00',
    educationLevel: 'Ön Lisans',
    occupation: 'Kooperatif Temsilcisi',
    residenceDistrict: 'İslahiye Merkez',
    experienceYears: '2 Yıl',
    statement: 'Kadın kooperatifimizin el yapımı kurutulmuş biber ve baharat ürünlerini pazarlamak.',
    status: 'accepted',
    autoScore: { total: 79, ruleVersion: 'v1.0', residencePoints: 28, educationPoints: 25, experiencePoints: 26 },
    commitments: { attendanceAccepted: true, assignmentsAccepted: true, truthfulnessAccepted: true },
    statusHistory: [
      { status: 'submitted', changedAt: '17 Ağustos 2026', note: 'Başvuru yapıldı.' },
      { status: 'accepted', changedAt: '20 Ağustos 2026', note: 'Asil listeye kabul edildi.' },
    ],
  },
  // 7. Caner Yıldız (Grup B - Kayıtlı)
  {
    id: 'app-seed-caner',
    referenceNumber: 'ISL-2026-0007',
    candidateId: 'usr-real-17',
    candidateName: 'Caner Yıldız',
    phone: '0538 *** ** 17',
    email: 'kursiyer.caner@islahiye.bel.tr',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    appliedAt: '18 Ağustos 2026 09:40',
    updatedAt: '25 Ağustos 2026 14:00',
    educationLevel: 'Lisans',
    occupation: 'Dış Ticaret Uzman Adayı',
    residenceDistrict: 'İslahiye Merkez',
    experienceYears: '3 Yıl',
    statement: 'Ortadoğu ve Avrupa pazarlarına yöresel ürün ihracatı yapmak için mevzuat öğrenmek.',
    status: 'accepted',
    autoScore: { total: 90, ruleVersion: 'v1.0', residencePoints: 30, educationPoints: 30, experiencePoints: 30 },
    commitments: { attendanceAccepted: true, assignmentsAccepted: true, truthfulnessAccepted: true },
    statusHistory: [
      { status: 'submitted', changedAt: '18 Ağustos 2026', note: 'Başvuru yapıldı.' },
      { status: 'accepted', changedAt: '20 Ağustos 2026', note: 'Asil listeye kabul edildi.' },
    ],
  },
  // 8. Büşra Kurt (Grup B - Kayıtlı)
  {
    id: 'app-seed-busra',
    referenceNumber: 'ISL-2026-0008',
    candidateId: 'usr-real-18',
    candidateName: 'Büşra Kurt',
    phone: '0539 *** ** 18',
    email: 'kursiyer.busra@islahiye.bel.tr',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    appliedAt: '19 Ağustos 2026 13:10',
    updatedAt: '25 Ağustos 2026 14:00',
    educationLevel: 'Lisans',
    occupation: 'Lojistik Operatörü',
    residenceDistrict: 'İslahiye / Fevzipaşa',
    experienceYears: '4 Yıl',
    statement: 'Gümrük evrakları ve akreditif yöntemlerini uluslararası standartlarda öğrenmek.',
    status: 'accepted',
    autoScore: { total: 86, ruleVersion: 'v1.0', residencePoints: 26, educationPoints: 30, experiencePoints: 30 },
    commitments: { attendanceAccepted: true, assignmentsAccepted: true, truthfulnessAccepted: true },
    statusHistory: [
      { status: 'submitted', changedAt: '19 Ağustos 2026', note: 'Başvuru yapıldı.' },
      { status: 'accepted', changedAt: '20 Ağustos 2026', note: 'Asil listeye kabul edildi.' },
    ],
  },
  // 9. Serdar Aslan (Grup B - Kayıtlı)
  {
    id: 'app-seed-serdar',
    referenceNumber: 'ISL-2026-0009',
    candidateId: 'usr-real-19',
    candidateName: 'Serdar Aslan',
    phone: '0532 *** ** 19',
    email: 'kursiyer.serdar@islahiye.bel.tr',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    appliedAt: '20 Ağustos 2026 11:00',
    updatedAt: '25 Ağustos 2026 14:00',
    educationLevel: 'Ön Lisans',
    occupation: 'Gümrük Stajyeri',
    residenceDistrict: 'İslahiye Merkez',
    experienceYears: '2 Yıl',
    statement: 'Incoterms ve sınır kapısı lojistik operasyonlarında yetkinlik kazanmak.',
    status: 'accepted',
    autoScore: { total: 83, ruleVersion: 'v1.0', residencePoints: 28, educationPoints: 25, experiencePoints: 30 },
    commitments: { attendanceAccepted: true, assignmentsAccepted: true, truthfulnessAccepted: true },
    statusHistory: [
      { status: 'submitted', changedAt: '20 Ağustos 2026', note: 'Başvuru yapıldı.' },
      { status: 'accepted', changedAt: '22 Ağustos 2026', note: 'Asil listeye kabul edildi.' },
    ],
  },
  // 10. Zeynep Polat (Grup B - Kayıtlı)
  {
    id: 'app-seed-zeynep-polat',
    referenceNumber: 'ISL-2026-0010',
    candidateId: 'usr-real-20',
    candidateName: 'Zeynep Polat',
    phone: '0533 *** ** 20',
    email: 'kursiyer.zeynep@islahiye.bel.tr',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    appliedAt: '21 Ağustos 2026 15:45',
    updatedAt: '25 Ağustos 2026 14:00',
    educationLevel: 'Lisans',
    occupation: 'İşletmeci',
    residenceDistrict: 'İslahiye / Atatürk Mah.',
    experienceYears: '3 Yıl',
    statement: 'Kuru meyve ve baharat ihracatında sınır ötesi pazaryeri anlaşmaları yapmak.',
    status: 'accepted',
    autoScore: { total: 78, ruleVersion: 'v1.0', residencePoints: 25, educationPoints: 28, experiencePoints: 25 },
    commitments: { attendanceAccepted: true, assignmentsAccepted: true, truthfulnessAccepted: true },
    statusHistory: [
      { status: 'submitted', changedAt: '21 Ağustos 2026', note: 'Başvuru yapıldı.' },
      { status: 'accepted', changedAt: '23 Ağustos 2026', note: 'Asil listeye kabul edildi.' },
    ],
  },
  // 11. İbrahim Çelik (Grup C - Kayıtlı)
  {
    id: 'app-seed-ibrahim',
    referenceNumber: 'ISL-2026-0011',
    candidateId: 'usr-real-21',
    candidateName: 'İbrahim Çelik',
    phone: '0534 *** ** 21',
    email: 'kursiyer.ibrahim@islahiye.bel.tr',
    programId: 'prog-03',
    programTitle: 'İslahiye Gastronomi ve Mutfak Sanatları',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    appliedAt: '22 Ağustos 2026 10:15',
    updatedAt: '25 Ağustos 2026 14:00',
    educationLevel: 'Ön Lisans',
    occupation: 'Aşçı Yardımcısı',
    residenceDistrict: 'İslahiye Merkez',
    experienceYears: '4 Yıl',
    statement: 'Geleneksel İslahiye mutfak reçeteleri ve modern sunum teknikleri.',
    status: 'accepted',
    autoScore: { total: 91, ruleVersion: 'v1.0', residencePoints: 30, educationPoints: 26, experiencePoints: 35 },
    commitments: { attendanceAccepted: true, assignmentsAccepted: true, truthfulnessAccepted: true },
    statusHistory: [
      { status: 'submitted', changedAt: '22 Ağustos 2026', note: 'Başvuru yapıldı.' },
      { status: 'accepted', changedAt: '24 Ağustos 2026', note: 'Asil listeye kabul edildi.' },
    ],
  },
  // 12. Merve Doğan (Grup C - Kayıtlı)
  {
    id: 'app-seed-merve',
    referenceNumber: 'ISL-2026-0012',
    candidateId: 'usr-real-22',
    candidateName: 'Merve Doğan',
    phone: '0535 *** ** 22',
    email: 'kursiyer.merve@islahiye.bel.tr',
    programId: 'prog-03',
    programTitle: 'İslahiye Gastronomi ve Mutfak Sanatları',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    appliedAt: '23 Ağustos 2026 14:00',
    updatedAt: '25 Ağustos 2026 14:00',
    educationLevel: 'Lisans',
    occupation: 'Gıda Mühendisi',
    residenceDistrict: 'İslahiye / Cumhuriyet',
    experienceYears: '3 Yıl',
    statement: 'Yöresel gastronomi turizmi ve reçete standardizasyonu çalışması.',
    status: 'accepted',
    autoScore: { total: 87, ruleVersion: 'v1.0', residencePoints: 27, educationPoints: 30, experiencePoints: 30 },
    commitments: { attendanceAccepted: true, assignmentsAccepted: true, truthfulnessAccepted: true },
    statusHistory: [
      { status: 'submitted', changedAt: '23 Ağustos 2026', note: 'Başvuru yapıldı.' },
      { status: 'accepted', changedAt: '25 Ağustos 2026', note: 'Asil listeye kabul edildi.' },
    ],
  },
  // 13. Seda Erdem (Asil Liste / Kesin Kayıt Masasında Onay Bekleyen)
  {
    id: 'app-seed-seda',
    referenceNumber: 'ISL-2026-0013',
    candidateId: 'usr-real-26',
    candidateName: 'Seda Erdem',
    phone: '0536 *** ** 26',
    email: 'aday.seda@islahiye.bel.tr',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    appliedAt: '24 Ağustos 2026 16:30',
    updatedAt: '28 Ağustos 2026 11:00',
    educationLevel: 'Lisans',
    occupation: 'Pazarlama Uzmanı',
    residenceDistrict: 'İslahiye Merkez',
    experienceYears: '4 Yıl',
    statement: 'Asil listeye kabul edildim; evraklarımı yükledim, kesin kayıt onayını bekliyorum.',
    status: 'accepted',
    autoScore: { total: 89, ruleVersion: 'v1.0', residencePoints: 29, educationPoints: 30, experiencePoints: 30 },
    commitments: { attendanceAccepted: true, assignmentsAccepted: true, truthfulnessAccepted: true },
    statusHistory: [
      { status: 'submitted', changedAt: '24 Ağustos 2026', note: 'Başvuru yapıldı.' },
      { status: 'accepted', changedAt: '28 Ağustos 2026', note: 'Asil listeye kabul edildi, kesin kayıt evrakı bekleniyor.' },
    ],
  },
  // 14. Derya Yılmaz (İnceleme / Evrak Kontrolü Bekleyen)
  {
    id: 'app-seed-derya',
    referenceNumber: 'ISL-2026-0014',
    candidateId: 'usr-real-24',
    candidateName: 'Derya Yılmaz',
    phone: '0537 *** ** 24',
    email: 'aday.derya@islahiye.bel.tr',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    appliedAt: '25 Ağustos 2026 11:15',
    updatedAt: '28 Ağustos 2026 12:00',
    educationLevel: 'Ön Lisans',
    occupation: 'Grafiker',
    residenceDistrict: 'İslahiye Merkez',
    experienceYears: '3 Yıl',
    statement: 'Ürün ambalajı ve e-ticaret vitrini tasarımı yapmaktayım.',
    status: 'under_review',
    autoScore: { total: 82, ruleVersion: 'v1.0', residencePoints: 25, educationPoints: 25, experiencePoints: 32 },
    commitments: { attendanceAccepted: true, assignmentsAccepted: true, truthfulnessAccepted: true },
    statusHistory: [
      { status: 'submitted', changedAt: '25 Ağustos 2026', note: 'Başvuru yapıldı.' },
      { status: 'under_review', changedAt: '28 Ağustos 2026', note: 'Kriter ve evrak incelemesine alındı.' },
    ],
  },
  // 15. Hasan Kılıç (İnceleme / Kriter Puanlaması Bekleyen)
  {
    id: 'app-seed-hasan',
    referenceNumber: 'ISL-2026-0015',
    candidateId: 'usr-real-25',
    candidateName: 'Hasan Kılıç',
    phone: '0538 *** ** 25',
    email: 'aday.hasan@islahiye.bel.tr',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    appliedAt: '26 Ağustos 2026 09:30',
    updatedAt: '28 Ağustos 2026 13:00',
    educationLevel: 'Lise',
    occupation: 'Lojistik Elemanı',
    residenceDistrict: 'İslahiye / Boğaziçi',
    experienceYears: '2 Yıl',
    statement: 'İhracat gümrük süreçlerinde kendimi geliştirmek istiyorum.',
    status: 'under_review',
    autoScore: { total: 74, ruleVersion: 'v1.0', residencePoints: 28, educationPoints: 16, experiencePoints: 30 },
    commitments: { attendanceAccepted: true, assignmentsAccepted: true, truthfulnessAccepted: true },
    statusHistory: [
      { status: 'submitted', changedAt: '26 Ağustos 2026', note: 'Başvuru yapıldı.' },
      { status: 'under_review', changedAt: '28 Ağustos 2026', note: 'İnceleme aşamasında.' },
    ],
  },
  // 16. Ali Çelik (Yeni Başvuru)
  {
    id: 'app-seed-ali',
    referenceNumber: 'ISL-2026-0016',
    candidateId: 'usr-real-23',
    candidateName: 'Ali Çelik',
    phone: '0539 *** ** 23',
    email: 'aday.ali@islahiye.bel.tr',
    programId: 'prog-03',
    programTitle: 'İslahiye Gastronomi ve Mutfak Sanatları',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    appliedAt: '27 Ağustos 2026 15:20',
    updatedAt: '27 Ağustos 2026 15:20',
    educationLevel: 'Ön Lisans',
    occupation: 'Aşçı Yardımcısı',
    residenceDistrict: 'İslahiye Merkez',
    experienceYears: '2 Yıl',
    statement: 'Geleneksel İslahiye mutfağı ve gastronomi alanında mesleki uzmanlığımı artırmak istiyorum.',
    status: 'submitted',
    autoScore: { total: 70, ruleVersion: 'v1.0', residencePoints: 25, educationPoints: 25, experiencePoints: 20 },
    commitments: { attendanceAccepted: true, assignmentsAccepted: true, truthfulnessAccepted: true },
    statusHistory: [{ status: 'submitted', changedAt: '27 Ağustos 2026', note: 'Başvuru sisteme kaydedildi.' }],
  },
  // 17. Burak Şen (Yedek Liste)
  {
    id: 'app-seed-burak',
    referenceNumber: 'ISL-2026-0017',
    candidateId: 'usr-real-27',
    candidateName: 'Burak Şen',
    phone: '0532 *** ** 27',
    email: 'aday.burak@islahiye.bel.tr',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    appliedAt: '28 Ağustos 2026 14:00',
    updatedAt: '30 Ağustos 2026 10:00',
    educationLevel: 'Lise',
    occupation: 'Çırak',
    residenceDistrict: 'Gaziantep',
    experienceYears: '1 Yıl',
    statement: 'Kontenjan açılırsa eğitime katılmak istiyorum.',
    status: 'waitlisted',
    autoScore: { total: 65, ruleVersion: 'v1.0', residencePoints: 15, educationPoints: 20, experiencePoints: 30 },
    commitments: { attendanceAccepted: true, assignmentsAccepted: true, truthfulnessAccepted: true },
    statusHistory: [
      { status: 'submitted', changedAt: '28 Ağustos 2026', note: 'Başvuru yapıldı.' },
      { status: 'waitlisted', changedAt: '30 Ağustos 2026', note: 'Kriter sıralaması sonucu yedek listeye alındı.' },
    ],
  },
  // 18. Volkan Tekin (Şartları Sağlamadı / Elendi)
  {
    id: 'app-seed-volkan',
    referenceNumber: 'ISL-2026-0018',
    candidateId: 'usr-real-29',
    candidateName: 'Volkan Tekin',
    phone: '0533 *** ** 29',
    email: 'aday.volkan@islahiye.bel.tr',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    appliedAt: '29 Ağustos 2026 16:50',
    updatedAt: '31 Ağustos 2026 09:00',
    educationLevel: 'Lise',
    occupation: 'Öğrenci',
    residenceDistrict: 'Kilis',
    experienceYears: '0 Yıl',
    statement: 'Online katılmak istiyorum.',
    status: 'rejected',
    autoScore: { total: 42, ruleVersion: 'v1.0', residencePoints: 10, educationPoints: 15, experiencePoints: 17 },
    commitments: { attendanceAccepted: true, assignmentsAccepted: true, truthfulnessAccepted: true },
    statusHistory: [
      { status: 'submitted', changedAt: '29 Ağustos 2026', note: 'Başvuru yapıldı.' },
      { status: 'rejected', changedAt: '31 Ağustos 2026', note: 'Bölge ikamet şartı ve devam taahhüdü sağlanamadı.' },
    ],
  },
];

/**
 * Başvuru yerel deposunu ilklendirir veya mevcut veriyi döndürür.
 */
export const getStoredApplications = (): Application[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APPLICATIONS));
      return INITIAL_APPLICATIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length >= 15) {
      return parsed;
    }
    // Önbellekte eksik/eski veri varsa zengin tohum verisiyle tazele
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APPLICATIONS));
    return INITIAL_APPLICATIONS;
  } catch (err) {
    console.error('LocalStorage read error:', err);
    return INITIAL_APPLICATIONS;
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
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ISL-${year}-${randomNum}`;
};

/**
 * Tarih ve saati Türkçe kurumsal formatta döner.
 */
export const formatCurrentTimestamp = (): string => {
  const now = new Date();
  const months = [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ];
  const day = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} ${hours}:${minutes}`;
};

/**
 * Tüm başvuruları getirir.
 */
export const getAllApplications = (): Application[] => {
  return getStoredApplications();
};

/**
 * Belirli bir adaya ait tüm başvuruları getirir.
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
 * Bir adayın belirli bir program ve dönemde aktif başvurusu olup olmadığını denetler.
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

    const norm = (val?: string) => (val === '2026 Güz Dönemi' ? 'term-2026-fall' : val);
    const appTerm = norm(app.termId || app.cohortName) || 'term-2026-fall';
    const targetNorm = norm(targetTerm) || 'term-2026-fall';
    if (appTerm !== targetNorm && app.cohortName !== targetNorm && app.termId !== targetNorm) return false;

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
    candidateName: appData.candidateName || 'Aday',
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

  if (hasActiveApplication(appData.candidateId, appData.programId, termId, appData.id)) {
    return {
      success: false,
      error: `Bu programa (${appData.programTitle || 'seçilen program'}) ve döneme ait zaten aktif bir başvurunuz bulunmaktadır. Tekrar başvuru yapılamaz.`,
    };
  }

  const timestamp = formatCurrentTimestamp();
  const activeCriteriaSet = getActiveCriteriaSetForProgram(appData.programId);
  const criteriaVersionId = activeCriteriaSet?.id;

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

  // Canlı backend API ile senkronize et
  try {
    educationApi
      .createApplication({
        programId: finalApp.programId,
        termId: finalApp.termId,
        fullName: finalApp.candidateName,
        email: finalApp.email,
        phone: finalApp.phone,
        birthDate: '1995-01-01',
        educationLevel: finalApp.educationLevel,
        occupation: finalApp.occupation,
        experienceYears: parseInt(finalApp.experienceYears || '1', 10) || 1,
        motivation: finalApp.statement,
        address: finalApp.residenceDistrict || 'İslahiye Merkez',
        specialNeeds: 'Yok',
        submitNow: true,
      })
      .catch((apiErr) => console.warn('API create application sync notice:', apiErr));
  } catch (err) {
    console.warn('API call skipped:', err);
  }

  try {
    notifyApplicationSubmitted(finalApp);
  } catch (notifErr) {
    console.warn('Başvuru bildirimi gönderilirken hata oluştu:', notifErr);
  }

  return { success: true, application: finalApp };
};

/**
 * Başvuruyu geri çekme
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
 * Yönetici nihai kararı uygulama (Kabul, Yedek, Reddet)
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

  let internalNote = internalDecisionNoteOrJustification.trim();
  let candidateMessage = candidateDecisionMessageOrDecidedBy.trim();
  let managerName = decidedByOrDeviationReason?.trim() || 'Selin Aydın (Yönetici)';
  let devReason = deviationReason?.trim();

  if (!devReason && candidateDecisionMessageOrDecidedBy.includes('(')) {
    managerName = candidateDecisionMessageOrDecidedBy.trim();
    candidateMessage = internalDecisionNoteOrJustification.trim();
  }

  if (!internalNote) {
    return { success: false, error: 'Kurum içi değerlendirme notu zorunludur.' };
  }
  if (!candidateMessage) {
    return { success: false, error: 'Adaya iletilecek sonuç açıklaması zorunludur.' };
  }

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
    adminJustification: candidateMessage,
    decidedAt: timestamp,
    decidedBy: managerName,
    updatedAt: timestamp,
    decisionHistory: [...(app.decisionHistory || []), decisionRecord],
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

  try {
    educationApi
      .updateApplicationStatus(appId, {
        status: reverseStatusMap[newStatus] ?? 1,
        adminNotes: candidateMessage,
        internalDecisionNote: internalNote,
        rejectionReason: newStatus === 'rejected' ? candidateMessage : undefined,
      })
      .catch((apiErr) => console.warn('API update application status sync notice:', apiErr));
  } catch (err) {
    console.warn('API call skipped:', err);
  }

  try {
    notifyAdminDecision(all[index], candidateMessage);
  } catch (notifErr) {
    console.warn('Yönetici kararı bildirimi tetiklenirken hata oluştu:', notifErr);
  }

  return { success: true };
};

/**
 * Belirli bir program için kontenjan ve başvuru istatistiklerini hesaplar.
 */
export const getProgramQuotaStats = (programId: string, termId?: string): ProgramQuotaStats => {
  const all = getStoredApplications().filter((a) => {
    if (a.programId !== programId) return false;
    if (termId && a.termId && a.termId !== termId) return false;
    return true;
  });
  const defaultQuota = 30;

  const acceptedCount = all.filter((a) => a.status === 'accepted').length;
  const waitlistedCount = all.filter((a) => a.status === 'waitlisted' || a.status === 'reserve').length;
  const pendingCount = all.filter((a) =>
    ['submitted', 'under_review', 'pending'].includes(a.status)
  ).length;
  const rejectedCount = all.filter((a) => a.status === 'rejected').length;
  const withdrawnCount = all.filter((a) => a.status === 'withdrawn').length;

  return {
    programId,
    programTitle: all[0]?.programTitle || 'Eğitim Programı',
    termId: termId || all[0]?.termId || 'term-2026-fall',
    cohortName: all[0]?.cohortName || '2026 Güz Dönemi',
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
 * Başvuru yerel deposunu sıfırlar
 */
export const resetApplicationsToDefaults = (): void => {
  saveToStorage(INITIAL_APPLICATIONS);
  resetCriteriaToDefaults();
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
