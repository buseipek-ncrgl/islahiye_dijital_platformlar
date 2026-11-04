/**
 * Mekân, Derslik ve Oturum Takvimi Kataloğu (Facility & Schedule Catalog)
 * İslahiye Ticaret Odası Eğitim Portalı
 *
 * Yöneticilerin yeni derslikler, laboratuvarlar, atölyeler ve ders oturum saatleri
 * tanımlamasına, çoğaltmasına veya katalog üzerinden yönetmesine olanak tanır.
 */

export interface FacilityRoom {
  id: string;
  name: string;
  type: 'classroom' | 'computer_lab' | 'workshop' | 'conference_hall' | 'online';
  typeLabel: string;
  floor: string;
  capacity: number;
  features: string[];
  status: 'active' | 'maintenance' | 'inactive';
}

const STORAGE_KEY_FACILITIES = 'islahiye_education_catalog_facilities_v1';
const STORAGE_KEY_SCHEDULES = 'islahiye_education_catalog_schedules_v1';

export const DEFAULT_FACILITIES: FacilityRoom[] = [
  {
    id: 'fac-01',
    name: 'İE Ana Derslik 1 (Zemin Kat)',
    type: 'classroom',
    typeLabel: 'Teorik Derslik',
    floor: 'Zemin Kat',
    capacity: 30,
    features: ['Akıllı Tahta', 'Projeksiyon', 'Klima & Havalandırma', 'Ses Yalıtımı'],
    status: 'active',
  },
  {
    id: 'fac-02',
    name: 'İE Bilişim ve Bilgisayar Laboratuvarı (Kat 2)',
    type: 'computer_lab',
    typeLabel: 'Bilişim Laboratuvarı',
    floor: 'Kat 2',
    capacity: 25,
    features: ['25 Adet PC İstasyonu', 'Gigabit Fiber Ağ', 'Sunucu Bağlantısı', 'Projeksiyon'],
    status: 'active',
  },
  {
    id: 'fac-03',
    name: 'İE Konferans ve Seminer Salonu (Zemin Kat)',
    type: 'conference_hall',
    typeLabel: 'Konferans Salonu',
    floor: 'Zemin Kat',
    capacity: 80,
    features: ['Profesyonel Ses Sistemi', 'Kablosuz Mikrofonlar', 'Çift Projeksiyon', 'Kürsü'],
    status: 'active',
  },
  {
    id: 'fac-04',
    name: 'İE Gastronomi ve Uygulama Mutfağı (Atölye 1)',
    type: 'workshop',
    typeLabel: 'Gastronomi Atölyesi',
    floor: 'Atölye 1',
    capacity: 20,
    features: ['Endüstriyel Ocaklar', 'Hazırlık Tezgahları', 'Fırın Üniteleri', 'Hijyen İstasyonu'],
    status: 'active',
  },
  {
    id: 'fac-05',
    name: 'İE Çok Amaçlı Eğitim Salonu B (Kat 1)',
    type: 'classroom',
    typeLabel: 'Çok Amaçlı Salon',
    floor: 'Kat 1',
    capacity: 35,
    features: ['Modüler Masa Düzeni', 'Ses Sistemi', 'Akıllı Ekran', 'Doğal Işık'],
    status: 'active',
  },
  {
    id: 'fac-06',
    name: 'İE Girişimcilik ve Kuluçka Odası (Kat 2)',
    type: 'workshop',
    typeLabel: 'Girişimcilik Odası',
    floor: 'Kat 2',
    capacity: 15,
    features: ['Toplantı Masası', 'Beyaz Yazı Tahtası', 'Video Konferans Ünitesi'],
    status: 'active',
  },
  {
    id: 'fac-07',
    name: 'Online / Sanal Sınıf (Canlı Yayın)',
    type: 'online',
    typeLabel: 'Çevrimiçi / Sanal',
    floor: 'Bulut Platformu',
    capacity: 250,
    features: ['Canlı Video Akışı', 'Ekran Paylaşımı', 'Oturum Kaydı', 'Sanal El Kaldırma'],
    status: 'active',
  },
];

export const DEFAULT_SCHEDULES: string[] = [
  'Pazartesi & Çarşamba 09:30 - 12:30 (Hafta İçi Sabah)',
  'Pazartesi & Çarşamba 14:00 - 17:00 (Hafta İçi Öğleden Sonra)',
  'Salı & Perşembe 09:30 - 12:30 (Hafta İçi Sabah)',
  'Salı & Perşembe 14:00 - 17:00 (Hafta İçi Öğleden Sonra)',
  'Pazartesi & Çarşamba 18:00 - 20:30 (Hafta İçi Akşam)',
  'Cumartesi & Pazar 10:00 - 13:00 (Hafta Sonu Sabah)',
  'Cumartesi & Pazar 14:00 - 17:00 (Hafta Sonu Öğleden Sonra)',
  'Cuma 14:00 - 18:00 (Hafta İçi Yoğunlaştırılmış)',
];

type CatalogListener = () => void;
const listeners: Set<CatalogListener> = new Set();

const notifyListeners = () => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error notifying facility catalog listener:', e);
    }
  });
};

export const subscribeToFacilityCatalog = (listener: CatalogListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getStoredFacilities = (): FacilityRoom[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FACILITIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_FACILITIES, JSON.stringify(DEFAULT_FACILITIES));
      return [...DEFAULT_FACILITIES];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.warn('Error reading stored facilities, using defaults:', e);
  }
  return [...DEFAULT_FACILITIES];
};

export const createFacility = (data: Omit<FacilityRoom, 'id'>): FacilityRoom => {
  const current = getStoredFacilities();
  const newId = `fac-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const newFacility: FacilityRoom = {
    ...data,
    id: newId,
  };

  const updated = [newFacility, ...current];
  try {
    localStorage.setItem(STORAGE_KEY_FACILITIES, JSON.stringify(updated));
    notifyListeners();
  } catch (e) {
    console.error('Error creating facility:', e);
  }
  return newFacility;
};

export const updateFacility = (id: string, updates: Partial<FacilityRoom>): boolean => {
  const current = getStoredFacilities();
  const index = current.findIndex((f) => f.id === id);
  if (index === -1) return false;

  current[index] = { ...current[index], ...updates };
  try {
    localStorage.setItem(STORAGE_KEY_FACILITIES, JSON.stringify(current));
    notifyListeners();
    return true;
  } catch (e) {
    console.error('Error updating facility:', e);
    return false;
  }
};

export const deleteFacility = (id: string): boolean => {
  const current = getStoredFacilities();
  if (current.length <= 1) return false;

  const updated = current.filter((f) => f.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_FACILITIES, JSON.stringify(updated));
    notifyListeners();
    return true;
  } catch (e) {
    console.error('Error deleting facility:', e);
    return false;
  }
};

// Location Names Helpers (Used by existing dropdowns)
export const getStoredLocations = (): string[] => {
  const facilities = getStoredFacilities();
  return facilities.filter((f) => f.status === 'active').map((f) => f.name);
};

export const addStoredLocation = (newLoc: string): string[] => {
  const trimmed = newLoc.trim();
  if (!trimmed) return getStoredLocations();

  const currentFacilities = getStoredFacilities();
  if (currentFacilities.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
    return getStoredLocations();
  }

  const isOnline = trimmed.toLowerCase().includes('online') || trimmed.toLowerCase().includes('sanal');
  const isLab = trimmed.toLowerCase().includes('laboratuvar') || trimmed.toLowerCase().includes('bilgisayar');
  const isWorkshop = trimmed.toLowerCase().includes('atölye') || trimmed.toLowerCase().includes('mutfak');
  const isHall = trimmed.toLowerCase().includes('salon') || trimmed.toLowerCase().includes('konferans');

  createFacility({
    name: trimmed,
    type: isOnline ? 'online' : isLab ? 'computer_lab' : isWorkshop ? 'workshop' : isHall ? 'conference_hall' : 'classroom',
    typeLabel: isOnline ? 'Çevrimiçi / Sanal' : isLab ? 'Bilişim Laboratuvarı' : isWorkshop ? 'Uygulama Atölyesi' : isHall ? 'Konferans Salonu' : 'Derslik',
    floor: isOnline ? 'Bulut' : 'Ana Bina',
    capacity: isOnline ? 200 : 25,
    features: ['Projeksiyon & Ekran', 'İklimlendirme'],
    status: 'active',
  });

  return getStoredLocations();
};

export const removeStoredLocation = (locationName: string): string[] => {
  const currentFacilities = getStoredFacilities();
  const match = currentFacilities.find((f) => f.name === locationName);
  if (match) {
    deleteFacility(match.id);
  }
  return getStoredLocations();
};

// Schedule Management Helpers
export const getStoredSchedules = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCHEDULES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(DEFAULT_SCHEDULES));
      return [...DEFAULT_SCHEDULES];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.warn('Error reading stored schedules, using defaults:', e);
  }
  return [...DEFAULT_SCHEDULES];
};

export const addStoredSchedule = (newSched: string): string[] => {
  const trimmed = newSched.trim();
  if (!trimmed) return getStoredSchedules();

  const current = getStoredSchedules();
  if (current.includes(trimmed)) return current;

  const updated = [...current, trimmed];
  try {
    localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(updated));
    notifyListeners();
  } catch (e) {
    console.error('Error saving new schedule:', e);
  }
  return updated;
};

export const removeStoredSchedule = (scheduleName: string): string[] => {
  const current = getStoredSchedules();
  const updated = current.filter((s) => s !== scheduleName);
  try {
    localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(updated));
    notifyListeners();
  } catch (e) {
    console.error('Error removing schedule:', e);
  }
  return updated;
};

export const resetFacilityCatalog = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY_FACILITIES, JSON.stringify(DEFAULT_FACILITIES));
    localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(DEFAULT_SCHEDULES));
    notifyListeners();
  } catch (e) {
    console.error('Error resetting facility catalog:', e);
  }
};
