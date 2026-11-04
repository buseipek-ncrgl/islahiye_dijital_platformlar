/**
 * Trainee Profile Storage Service
 * Kursiyer Kişisel Bilgileri ve Tercih Yönetimi Motoru
 */

export interface TraineeProfileData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  residenceDistrict: string;
  address: string;
  identityNumberMasked: string; // T.C. Kimlik Kütük Kaydı (Salt Okunur)
  studentNumber: string;         // Kütük Kursiyer No (Salt Okunur)
  educationLevel: string;
  graduationDepartment: string;
  occupation: string;
  programTitle: string;
  groupName: string;
  instructorName: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notifySms: boolean;
  notifyEmail: boolean;
  notifyApp: boolean;
  updatedAt: string;
}

const STORAGE_KEY = 'islahiye_trainee_profile_v2';
export const PROFILE_UPDATE_EVENT = 'islahiye_trainee_profile_updated';

export const INITIAL_TRAINEE_PROFILE: TraineeProfileData = {
  id: 'usr-trainee',
  fullName: 'Ahmet Kaya',
  email: 'kursiyer.ahmet@islahiye.bel.tr',
  phone: '0532 123 45 67',
  residenceDistrict: 'İslahiye / Fevzipaşa',
  address: 'Cumhuriyet Caddesi No: 24/B İslahiye / Gaziantep',
  identityNumberMasked: '284*******12',
  studentNumber: 'ISL-2026-TR042',
  educationLevel: 'Lisans (İktisadi ve İdari Bilimler)',
  graduationDepartment: 'Pazarlama & Tarımsal İşletmecilik',
  occupation: 'Tarımsal Üretim & E-Ticaret Girişimcisi',
  programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
  groupName: 'Grup A — Sabah Oturumu',
  instructorName: 'Murat Özkan',
  emergencyContactName: 'Mehmet Kaya',
  emergencyContactPhone: '0532 987 65 43',
  notifySms: true,
  notifyEmail: true,
  notifyApp: true,
  updatedAt: '2026-10-26T10:00:00+03:00',
};

export const getStoredTraineeProfile = (): TraineeProfileData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TRAINEE_PROFILE));
      return { ...INITIAL_TRAINEE_PROFILE };
    }
    return JSON.parse(raw);
  } catch {
    return { ...INITIAL_TRAINEE_PROFILE };
  }
};

export const saveTraineeProfile = (profile: Partial<TraineeProfileData>): { success: boolean; data: TraineeProfileData } => {
  try {
    const current = getStoredTraineeProfile();
    const updated: TraineeProfileData = {
      ...current,
      ...profile,
      // Kilitli kütük alanlarının değişmesini engelle
      id: current.id,
      identityNumberMasked: current.identityNumberMasked,
      studentNumber: current.studentNumber,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(PROFILE_UPDATE_EVENT, { detail: updated }));
    return { success: true, data: updated };
  } catch (error) {
    console.error('Profil kaydedilemedi:', error);
    return { success: false, data: getStoredTraineeProfile() };
  }
};

export const subscribeToProfileUpdates = (callback: (data: TraineeProfileData) => void): (() => void) => {
  const handler = (e: Event) => {
    const custom = e as CustomEvent<TraineeProfileData>;
    callback(custom.detail || getStoredTraineeProfile());
  };
  window.addEventListener(PROFILE_UPDATE_EVENT, handler);
  return () => window.removeEventListener(PROFILE_UPDATE_EVENT, handler);
};
