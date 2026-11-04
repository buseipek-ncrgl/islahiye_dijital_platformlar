/**
 * Candidate Profile Storage Service
 * Aday Kişisel Bilgileri, Kütük Kaydı ve Tercih Yönetimi Motoru
 */

export interface CandidateProfileData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  identityNumberMasked: string; // T.C. Kimlik Kütük Kaydı (Salt Okunur)
  candidateNumber: string;       // Aday Kütük No (Salt Okunur)
  residenceDistrict: string;
  address: string;
  educationLevel: string;
  graduationDepartment: string;
  occupation: string;
  experienceYears: string;
  companyName?: string;
  targetSectors: string[];
  notifySms: boolean;
  notifyEmail: boolean;
  notifyApp: boolean;
  updatedAt: string;
}

const STORAGE_KEY = 'islahiye_candidate_profile_v1';
export const CANDIDATE_PROFILE_UPDATE_EVENT = 'islahiye_candidate_profile_updated';

export const INITIAL_CANDIDATE_PROFILE: CandidateProfileData = {
  id: 'user-applicant-01',
  fullName: 'Fatma Şahin',
  email: 'fatma.sahin@ornek.com',
  phone: '0544 234 56 28',
  identityNumberMasked: '382*******46',
  candidateNumber: 'ISL-2026-AD085',
  residenceDistrict: 'İslahiye Merkez (Cumhuriyet Mah.)',
  address: 'Cumhuriyet Caddesi No: 18 D: 4 İslahiye / Gaziantep',
  educationLevel: 'Lisans (İktisat Fakültesi)',
  graduationDepartment: 'İktisat ve Dış Ticaret',
  occupation: 'Genç Girişimci & Tarım Üreticisi',
  experienceYears: '3 - 5 Yıl',
  companyName: 'Şahin Tarımsal Baharat İşletmesi',
  targetSectors: ['Dış Ticaret & İhracat', 'Tarımsal E-Ticaret', 'Dijital Pazarlama'],
  notifySms: true,
  notifyEmail: true,
  notifyApp: true,
  updatedAt: '2026-10-26T09:30:00+03:00',
};

export const getStoredCandidateProfile = (): CandidateProfileData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CANDIDATE_PROFILE));
      return { ...INITIAL_CANDIDATE_PROFILE };
    }
    return JSON.parse(raw);
  } catch {
    return { ...INITIAL_CANDIDATE_PROFILE };
  }
};

export const saveCandidateProfile = (
  profile: Partial<CandidateProfileData>
): { success: boolean; data: CandidateProfileData } => {
  try {
    const current = getStoredCandidateProfile();
    const updated: CandidateProfileData = {
      ...current,
      ...profile,
      // Kilitli kütük alanlarının değişmesini engelle
      id: current.id,
      identityNumberMasked: current.identityNumberMasked,
      candidateNumber: current.candidateNumber,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent(CANDIDATE_PROFILE_UPDATE_EVENT, { detail: updated })
    );
    return { success: true, data: updated };
  } catch (error) {
    console.error('Aday profili kaydedilemedi:', error);
    return { success: false, data: getStoredCandidateProfile() };
  }
};

export const subscribeToCandidateProfileUpdates = (
  callback: (data: CandidateProfileData) => void
): (() => void) => {
  const handler = (e: Event) => {
    const custom = e as CustomEvent<CandidateProfileData>;
    callback(custom.detail || getStoredCandidateProfile());
  };
  window.addEventListener(CANDIDATE_PROFILE_UPDATE_EVENT, handler);
  return () => window.removeEventListener(CANDIDATE_PROFILE_UPDATE_EVENT, handler);
};
