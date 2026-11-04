/**
 * Instructor Profile Storage Service
 * Eğitmen Profil Bilgileri, Akademik Alan ve İletişim Tercihleri Yönetimi
 */

export interface InstructorProfileData {
  id: string;
  fullName: string;
  academicTitle: string;
  email: string;
  phone: string;
  institution: string;
  officeLocation: string;
  academicSpecialization: string;
  biography: string;
  registryCode: string; // Kütük Sicil No (Salt Okunur)
  officeHours: string;
  notifySms: boolean;
  notifyEmail: boolean;
  notifyApp: boolean;
  updatedAt: string;
}

const STORAGE_KEY = 'islahiye_instructor_profile_v1';
export const INSTRUCTOR_PROFILE_UPDATE_EVENT = 'islahiye_instructor_profile_updated';

export const INITIAL_INSTRUCTOR_PROFILE: InstructorProfileData = {
  id: 'user-instructor-01',
  fullName: 'Murat Özkan',
  academicTitle: 'Dr. Öğr. Üyesi / Gastronomi ve Dijital Pazarlama Danışmanı',
  email: 'murat.ozkan@islahiyeto.org.tr',
  phone: '0533 876 54 32',
  institution: 'İslahiye Ticaret Odası Eğitim Akademisi',
  officeLocation: 'İslahiye Ticaret Odası Hizmet Binası Kat: 2 No: 204',
  academicSpecialization: 'Tarımsal Pazarlama, Coğrafi İşaretler ve Dijital Tedarik Zinciri',
  biography:
    'Gaziantep Üniversitesi ve TOBB Girişimcilik Kurulu iş birliğiyle bölge üreticilerine yönelik tarımsal e-ticaret ve markalaşma eğitimleri vermektedir. Coğrafi işaretli İslahiye Biberi ve katma değerli tarım ürünlerinin ulusal pazar yerlerine entegrasyonu konusunda 12 yılı aşkın saha tecrübesine sahiptir.',
  registryCode: 'ITO-EGT-2024-009',
  officeHours: 'Pazartesi & Çarşamba 16:30 - 18:00 (Randevuyla)',
  notifySms: true,
  notifyEmail: true,
  notifyApp: true,
  updatedAt: '2026-10-26T10:00:00+03:00',
};

export const getStoredInstructorProfile = (): InstructorProfileData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_INSTRUCTOR_PROFILE));
      return { ...INITIAL_INSTRUCTOR_PROFILE };
    }
    return JSON.parse(raw);
  } catch {
    return { ...INITIAL_INSTRUCTOR_PROFILE };
  }
};

export const saveInstructorProfile = (
  profile: Partial<InstructorProfileData>
): { success: boolean; data: InstructorProfileData } => {
  try {
    const current = getStoredInstructorProfile();
    const updated: InstructorProfileData = {
      ...current,
      ...profile,
      // Kilitli kütük alanları
      id: current.id,
      registryCode: current.registryCode,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(INSTRUCTOR_PROFILE_UPDATE_EVENT, { detail: updated }));
    return { success: true, data: updated };
  } catch (error) {
    console.error('Eğitmen profili kaydedilemedi:', error);
    return { success: false, data: getStoredInstructorProfile() };
  }
};

export const subscribeToInstructorProfileUpdates = (
  callback: (data: InstructorProfileData) => void
): (() => void) => {
  const handler = (e: Event) => {
    const custom = e as CustomEvent<InstructorProfileData>;
    callback(custom.detail || getStoredInstructorProfile());
  };
  window.addEventListener(INSTRUCTOR_PROFILE_UPDATE_EVENT, handler);
  return () => window.removeEventListener(INSTRUCTOR_PROFILE_UPDATE_EVENT, handler);
};
