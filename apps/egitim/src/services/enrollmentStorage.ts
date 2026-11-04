import {
  Enrollment,
  Group,
  GroupAssignment,
  GroupCapacityStats,
} from '../types';
import { educationApi, CourseGroupDto } from './apiClient';
import { getStoredApplications } from './applicationStorage';
import {
  notifyEnrollmentConfirmed,
  notifyGroupAssigned,
} from './notificationEngine';

const ENROLLMENTS_STORAGE_KEY = 'islahiye_education_enrollments_v2';
const GROUPS_STORAGE_KEY = 'islahiye_education_groups_v2';
const ASSIGNMENTS_STORAGE_KEY = 'islahiye_education_assignments_v2';

const ENROLLMENTS_UPDATE_EVENT = 'islahiye_enrollments_updated';
const GROUPS_UPDATE_EVENT = 'islahiye_groups_updated';

export const mapCourseGroupDtoToGroup = (dto: CourseGroupDto): Group => ({
  id: dto.id,
  programId: dto.programId,
  programTitle: dto.programName,
  termId: dto.termId,
  cohortName: dto.termName,
  name: dto.name,
  capacity: dto.capacity,
  instructorIds: dto.instructorUserId ? [dto.instructorUserId] : ['usr-instructor'],
  instructorNames: [dto.instructorName || 'Şef Mehmet Yılmaz'],
  scheduleSummary: 'Haftalık Planlı Oturumlar',
  location: dto.classroom || 'Derslik 1',
  status: dto.status === 1 ? 'active' : 'completed',
  createdAt: new Date(dto.createdAt).toLocaleDateString('tr-TR'),
});

export const syncGroupsWithApi = async (): Promise<Group[]> => {
  try {
    const list = await educationApi.groups();
    if (list && list.length > 0) {
      const mapped = list.map(mapCourseGroupDtoToGroup);
      const merged = [...INITIAL_GROUPS];
      mapped.forEach((apiGrp) => {
        const idx = merged.findIndex(
          (m) => m.id === apiGrp.id || m.name.toLowerCase() === apiGrp.name.toLowerCase()
        );
        if (idx >= 0) {
          merged[idx] = { ...merged[idx], ...apiGrp, id: merged[idx].id };
        } else {
          merged.push(apiGrp);
        }
      });
      saveGroupsToStorage(merged);
      return merged;
    }
  } catch (err) {
    console.warn('API sync groups notice:', err);
  }
  return getStoredGroups();
};

if (typeof window !== 'undefined') {
  syncGroupsWithApi().catch(() => {});
}

// -----------------------------------------------------------------------------
// SEED DATA & SAFE MIGRATION INITIALIZERS
// -----------------------------------------------------------------------------

export const INITIAL_GROUPS: Group[] = [
  {
    id: 'grp-01',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    name: 'Grup A — Sabah Oturumu',
    capacity: 25,
    instructorIds: ['usr-instructor', 'user-instructor-01'],
    instructorNames: ['Şef Mehmet Yılmaz', 'Murat Özkan'],
    scheduleSummary: 'Salı & Perşembe 09:00 - 12:00',
    location: 'IE Ana Derslik 1 (Zemin Kat)',
    status: 'active',
    createdAt: '15 Ağustos 2026',
  },
  {
    id: 'grp-02',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    name: 'Grup B — Öğleden Sonra Oturumu',
    capacity: 20,
    instructorIds: ['user-instructor-02'],
    instructorNames: ['Kemal Aksoy'],
    scheduleSummary: 'Cumartesi & Pazar 10:00 - 13:00',
    location: 'Derslik 2',
    status: 'active',
    createdAt: '15 Ağustos 2026',
  },
  {
    id: 'grp-03',
    programId: 'prog-03',
    programTitle: 'İslahiye Gastronomi ve Mutfak Sanatları',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    name: 'Grup A — Uygulama Mutfağı',
    capacity: 25,
    instructorIds: ['usr-instructor'],
    instructorNames: ['Şef Mehmet Yılmaz'],
    scheduleSummary: 'Pazartesi & Çarşamba 14:00 - 17:00',
    location: 'Uygulama Mutfağı Atölyesi',
    status: 'active',
    createdAt: '15 Ağustos 2026',
  },
  {
    id: 'grp-04',
    programId: 'prog-04',
    programTitle: 'Dijital Pazarlama & Sosyal Medya',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    name: 'Grup A (Gündüz)',
    capacity: 15,
    instructorIds: ['user-instructor-03'],
    instructorNames: ['Fatma Yıldırım'],
    scheduleSummary: 'Cuma 14:00 - 18:00',
    location: 'Seminer Salonu A',
    status: 'active',
    createdAt: '15 Ağustos 2026',
  },
];

export const INITIAL_ENROLLMENTS: Enrollment[] = [
  // Grup A: İslahiye Biberi & Tarımsal E-Ticaret (6 Kursiyer)
  {
    id: 'enr-trainee-ahmet',
    applicationId: 'app-seed-ahmet',
    candidateId: 'usr-trainee',
    candidateName: 'Ahmet Kaya',
    candidateEmail: 'kursiyer.ahmet@islahiye.bel.tr',
    candidatePhone: '0532 *** ** 11',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    status: 'confirmed',
    confirmedAt: '1 Eylül 2026 10:00',
    confirmedBy: 'Selin Aydın (Yönetici)',
    createdAt: '28 Ağustos 2026',
    updatedAt: '1 Eylül 2026',
    notes: 'Ziraat odası çiftçi kayıt belgesi doğrulandı.',
  },
  {
    id: 'enr-trainee-fatma',
    applicationId: 'app-seed-fatma',
    candidateId: 'usr-real-12',
    candidateName: 'Fatma Şahin',
    candidateEmail: 'kursiyer.fatma@islahiye.bel.tr',
    candidatePhone: '0533 *** ** 12',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    status: 'confirmed',
    confirmedAt: '1 Eylül 2026 10:15',
    confirmedBy: 'Selin Aydın (Yönetici)',
    createdAt: '28 Ağustos 2026',
    updatedAt: '1 Eylül 2026',
    notes: 'Gıda hijyeni sertifikası ve kesin kayıt evrakları tamamlandı.',
  },
  {
    id: 'enr-trainee-mehmet',
    applicationId: 'app-seed-mehmet-ozturk',
    candidateId: 'usr-real-13',
    candidateName: 'Mehmet Öztürk',
    candidateEmail: 'kursiyer.mehmet@islahiye.bel.tr',
    candidatePhone: '0534 *** ** 13',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    status: 'confirmed',
    confirmedAt: '1 Eylül 2026 10:30',
    confirmedBy: 'Selin Aydın (Yönetici)',
    createdAt: '28 Ağustos 2026',
    updatedAt: '1 Eylül 2026',
  },
  {
    id: 'enr-trainee-elif',
    applicationId: 'app-seed-elif',
    candidateId: 'usr-real-14',
    candidateName: 'Elif Çetin',
    candidateEmail: 'kursiyer.elif@islahiye.bel.tr',
    candidatePhone: '0535 *** ** 14',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    status: 'confirmed',
    confirmedAt: '1 Eylül 2026 11:00',
    confirmedBy: 'Selin Aydın (Yönetici)',
    createdAt: '28 Ağustos 2026',
    updatedAt: '1 Eylül 2026',
  },
  {
    id: 'enr-trainee-mustafa',
    applicationId: 'app-seed-mustafa',
    candidateId: 'usr-real-15',
    candidateName: 'Mustafa Demir',
    candidateEmail: 'kursiyer.mustafa@islahiye.bel.tr',
    candidatePhone: '0536 *** ** 15',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    status: 'confirmed',
    confirmedAt: '1 Eylül 2026 11:30',
    confirmedBy: 'Selin Aydın (Yönetici)',
    createdAt: '28 Ağustos 2026',
    updatedAt: '1 Eylül 2026',
  },
  {
    id: 'enr-trainee-emine',
    applicationId: 'app-seed-emine',
    candidateId: 'usr-real-16',
    candidateName: 'Emine Koç',
    candidateEmail: 'kursiyer.emine@islahiye.bel.tr',
    candidatePhone: '0537 *** ** 16',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    status: 'confirmed',
    confirmedAt: '1 Eylül 2026 12:00',
    confirmedBy: 'Selin Aydın (Yönetici)',
    createdAt: '28 Ağustos 2026',
    updatedAt: '1 Eylül 2026',
  },

  // Grup B: Dış Ticaret & İhracat Yönetimi (4 Kursiyer)
  {
    id: 'enr-trainee-caner',
    applicationId: 'app-seed-caner',
    candidateId: 'usr-real-17',
    candidateName: 'Caner Yıldız',
    candidateEmail: 'kursiyer.caner@islahiye.bel.tr',
    candidatePhone: '0538 *** ** 17',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    status: 'confirmed',
    confirmedAt: '1 Eylül 2026 13:00',
    confirmedBy: 'Selin Aydın (Yönetici)',
    createdAt: '29 Ağustos 2026',
    updatedAt: '1 Eylül 2026',
  },
  {
    id: 'enr-trainee-busra',
    applicationId: 'app-seed-busra',
    candidateId: 'usr-real-18',
    candidateName: 'Büşra Kurt',
    candidateEmail: 'kursiyer.busra@islahiye.bel.tr',
    candidatePhone: '0539 *** ** 18',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    status: 'confirmed',
    confirmedAt: '1 Eylül 2026 13:30',
    confirmedBy: 'Selin Aydın (Yönetici)',
    createdAt: '29 Ağustos 2026',
    updatedAt: '1 Eylül 2026',
  },
  {
    id: 'enr-trainee-serdar',
    applicationId: 'app-seed-serdar',
    candidateId: 'usr-real-19',
    candidateName: 'Serdar Aslan',
    candidateEmail: 'kursiyer.serdar@islahiye.bel.tr',
    candidatePhone: '0532 *** ** 19',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    status: 'confirmed',
    confirmedAt: '1 Eylül 2026 14:00',
    confirmedBy: 'Selin Aydın (Yönetici)',
    createdAt: '29 Ağustos 2026',
    updatedAt: '1 Eylül 2026',
  },
  {
    id: 'enr-trainee-zeynep-polat',
    applicationId: 'app-seed-zeynep-polat',
    candidateId: 'usr-real-20',
    candidateName: 'Zeynep Polat',
    candidateEmail: 'kursiyer.zeynep@islahiye.bel.tr',
    candidatePhone: '0533 *** ** 20',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    status: 'confirmed',
    confirmedAt: '1 Eylül 2026 14:30',
    confirmedBy: 'Selin Aydın (Yönetici)',
    createdAt: '29 Ağustos 2026',
    updatedAt: '1 Eylül 2026',
  },

  // Grup C: İslahiye Gastronomi ve Mutfak Sanatları (2 Kursiyer)
  {
    id: 'enr-trainee-ibrahim',
    applicationId: 'app-seed-ibrahim',
    candidateId: 'usr-real-21',
    candidateName: 'İbrahim Çelik',
    candidateEmail: 'kursiyer.ibrahim@islahiye.bel.tr',
    candidatePhone: '0534 *** ** 21',
    programId: 'prog-03',
    programTitle: 'İslahiye Gastronomi ve Mutfak Sanatları',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    status: 'confirmed',
    confirmedAt: '1 Eylül 2026 15:00',
    confirmedBy: 'Selin Aydın (Yönetici)',
    createdAt: '30 Ağustos 2026',
    updatedAt: '1 Eylül 2026',
  },
  {
    id: 'enr-trainee-merve',
    applicationId: 'app-seed-merve',
    candidateId: 'usr-real-22',
    candidateName: 'Merve Doğan',
    candidateEmail: 'kursiyer.merve@islahiye.bel.tr',
    candidatePhone: '0535 *** ** 22',
    programId: 'prog-03',
    programTitle: 'İslahiye Gastronomi ve Mutfak Sanatları',
    termId: 'term-2026-fall',
    cohortName: '2026 Güz Dönemi',
    status: 'confirmed',
    confirmedAt: '1 Eylül 2026 15:30',
    confirmedBy: 'Selin Aydın (Yönetici)',
    createdAt: '30 Ağustos 2026',
    updatedAt: '1 Eylül 2026',
  },
];

export const INITIAL_ASSIGNMENTS: GroupAssignment[] = [
  // 1-6. Grup A (grp-01) Kursiyerleri
  {
    id: 'asgn-trainee-ahmet',
    enrollmentId: 'enr-trainee-ahmet',
    candidateId: 'usr-trainee',
    candidateName: 'Ahmet Kaya',
    candidateEmail: 'kursiyer.ahmet@islahiye.bel.tr',
    groupId: 'grp-01',
    groupName: 'Grup A — Sabah Oturumu',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    status: 'active',
    assignedAt: '2 Eylül 2026 14:00',
    assignedBy: 'Selin Aydın (Yönetici)',
    createdAt: '2 Eylül 2026',
    updatedAt: '2 Eylül 2026',
  },
  {
    id: 'asgn-trainee-fatma',
    enrollmentId: 'enr-trainee-fatma',
    candidateId: 'usr-real-12',
    candidateName: 'Fatma Şahin',
    candidateEmail: 'kursiyer.fatma@islahiye.bel.tr',
    groupId: 'grp-01',
    groupName: 'Grup A — Sabah Oturumu',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    status: 'active',
    assignedAt: '2 Eylül 2026 14:05',
    assignedBy: 'Selin Aydın (Yönetici)',
    createdAt: '2 Eylül 2026',
    updatedAt: '2 Eylül 2026',
  },
  {
    id: 'asgn-trainee-mehmet',
    enrollmentId: 'enr-trainee-mehmet',
    candidateId: 'usr-real-13',
    candidateName: 'Mehmet Öztürk',
    candidateEmail: 'kursiyer.mehmet@islahiye.bel.tr',
    groupId: 'grp-01',
    groupName: 'Grup A — Sabah Oturumu',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    status: 'active',
    assignedAt: '2 Eylül 2026 14:10',
    assignedBy: 'Selin Aydın (Yönetici)',
    createdAt: '2 Eylül 2026',
    updatedAt: '2 Eylül 2026',
  },
  {
    id: 'asgn-trainee-elif',
    enrollmentId: 'enr-trainee-elif',
    candidateId: 'usr-real-14',
    candidateName: 'Elif Çetin',
    candidateEmail: 'kursiyer.elif@islahiye.bel.tr',
    groupId: 'grp-01',
    groupName: 'Grup A — Sabah Oturumu',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    status: 'active',
    assignedAt: '2 Eylül 2026 14:15',
    assignedBy: 'Selin Aydın (Yönetici)',
    createdAt: '2 Eylül 2026',
    updatedAt: '2 Eylül 2026',
  },
  {
    id: 'asgn-trainee-mustafa',
    enrollmentId: 'enr-trainee-mustafa',
    candidateId: 'usr-real-15',
    candidateName: 'Mustafa Demir',
    candidateEmail: 'kursiyer.mustafa@islahiye.bel.tr',
    groupId: 'grp-01',
    groupName: 'Grup A — Sabah Oturumu',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    status: 'active',
    assignedAt: '2 Eylül 2026 14:20',
    assignedBy: 'Selin Aydın (Yönetici)',
    createdAt: '2 Eylül 2026',
    updatedAt: '2 Eylül 2026',
  },
  {
    id: 'asgn-trainee-emine',
    enrollmentId: 'enr-trainee-emine',
    candidateId: 'usr-real-16',
    candidateName: 'Emine Koç',
    candidateEmail: 'kursiyer.emine@islahiye.bel.tr',
    groupId: 'grp-01',
    groupName: 'Grup A — Sabah Oturumu',
    programId: 'prog-01',
    programTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    termId: 'term-2026-fall',
    status: 'active',
    assignedAt: '2 Eylül 2026 14:25',
    assignedBy: 'Selin Aydın (Yönetici)',
    createdAt: '2 Eylül 2026',
    updatedAt: '2 Eylül 2026',
  },

  // 7-10. Grup B (grp-02) Kursiyerleri
  {
    id: 'asgn-trainee-caner',
    enrollmentId: 'enr-trainee-caner',
    candidateId: 'usr-real-17',
    candidateName: 'Caner Yıldız',
    candidateEmail: 'kursiyer.caner@islahiye.bel.tr',
    groupId: 'grp-02',
    groupName: 'Grup B — Öğleden Sonra Oturumu',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    status: 'active',
    assignedAt: '2 Eylül 2026 14:30',
    assignedBy: 'Selin Aydın (Yönetici)',
    createdAt: '2 Eylül 2026',
    updatedAt: '2 Eylül 2026',
  },
  {
    id: 'asgn-trainee-busra',
    enrollmentId: 'enr-trainee-busra',
    candidateId: 'usr-real-18',
    candidateName: 'Büşra Kurt',
    candidateEmail: 'kursiyer.busra@islahiye.bel.tr',
    groupId: 'grp-02',
    groupName: 'Grup B — Öğleden Sonra Oturumu',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    status: 'active',
    assignedAt: '2 Eylül 2026 14:35',
    assignedBy: 'Selin Aydın (Yönetici)',
    createdAt: '2 Eylül 2026',
    updatedAt: '2 Eylül 2026',
  },
  {
    id: 'asgn-trainee-serdar',
    enrollmentId: 'enr-trainee-serdar',
    candidateId: 'usr-real-19',
    candidateName: 'Serdar Aslan',
    candidateEmail: 'kursiyer.serdar@islahiye.bel.tr',
    groupId: 'grp-02',
    groupName: 'Grup B — Öğleden Sonra Oturumu',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    status: 'active',
    assignedAt: '2 Eylül 2026 14:40',
    assignedBy: 'Selin Aydın (Yönetici)',
    createdAt: '2 Eylül 2026',
    updatedAt: '2 Eylül 2026',
  },
  {
    id: 'asgn-trainee-zeynep-polat',
    enrollmentId: 'enr-trainee-zeynep-polat',
    candidateId: 'usr-real-20',
    candidateName: 'Zeynep Polat',
    candidateEmail: 'kursiyer.zeynep@islahiye.bel.tr',
    groupId: 'grp-02',
    groupName: 'Grup B — Öğleden Sonra Oturumu',
    programId: 'prog-02',
    programTitle: 'Dış Ticaret & İhracat Yönetimi',
    termId: 'term-2026-fall',
    status: 'active',
    assignedAt: '2 Eylül 2026 14:45',
    assignedBy: 'Selin Aydın (Yönetici)',
    createdAt: '2 Eylül 2026',
    updatedAt: '2 Eylül 2026',
  },

  // 11-12. Grup C (grp-03) Kursiyerleri
  {
    id: 'asgn-trainee-ibrahim',
    enrollmentId: 'enr-trainee-ibrahim',
    candidateId: 'usr-real-21',
    candidateName: 'İbrahim Çelik',
    candidateEmail: 'kursiyer.ibrahim@islahiye.bel.tr',
    groupId: 'grp-03',
    groupName: 'Grup A — Uygulama Mutfağı',
    programId: 'prog-03',
    programTitle: 'İslahiye Gastronomi ve Mutfak Sanatları',
    termId: 'term-2026-fall',
    status: 'active',
    assignedAt: '2 Eylül 2026 15:00',
    assignedBy: 'Selin Aydın (Yönetici)',
    createdAt: '2 Eylül 2026',
    updatedAt: '2 Eylül 2026',
  },
  {
    id: 'asgn-trainee-merve',
    enrollmentId: 'enr-trainee-merve',
    candidateId: 'usr-real-22',
    candidateName: 'Merve Doğan',
    candidateEmail: 'kursiyer.merve@islahiye.bel.tr',
    groupId: 'grp-03',
    groupName: 'Grup A — Uygulama Mutfağı',
    programId: 'prog-03',
    programTitle: 'İslahiye Gastronomi ve Mutfak Sanatları',
    termId: 'term-2026-fall',
    status: 'active',
    assignedAt: '2 Eylül 2026 15:05',
    assignedBy: 'Selin Aydın (Yönetici)',
    createdAt: '2 Eylül 2026',
    updatedAt: '2 Eylül 2026',
  },
];

// -----------------------------------------------------------------------------
// GRUP VERİLERİ YÖNETİMİ
// -----------------------------------------------------------------------------

export const getStoredGroups = (): Group[] => {
  try {
    const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(INITIAL_GROUPS));
      return INITIAL_GROUPS;
    }
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length >= 3 &&
      parsed.some((g) => g.id === 'grp-01')
    ) {
      return parsed;
    }
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(INITIAL_GROUPS));
    return INITIAL_GROUPS;
  } catch (err) {
    console.error('Groups read error:', err);
    return INITIAL_GROUPS;
  }
};

const saveGroupsToStorage = (groups: Group[]): void => {
  try {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(GROUPS_UPDATE_EVENT, { detail: groups }));
    }
  } catch (err) {
    console.error('Groups write error:', err);
  }
};

export const getGroupById = (id: string): Group | undefined => {
  return getStoredGroups().find((g) => g.id === id);
};

export const getGroupsByProgramAndTerm = (programId: string, termId?: string): Group[] => {
  const groups = getStoredGroups();
  return groups.filter((g) => {
    if (g.programId !== programId) return false;
    if (termId && g.termId !== termId && g.cohortName !== termId) return false;
    return true;
  });
};

export const createGroup = (
  groupData: Omit<Group, 'id' | 'createdAt'> & { id?: string }
): { success: boolean; group?: Group; error?: string } => {
  if (!groupData.name.trim()) {
    return { success: false, error: 'Grup adı zorunludur.' };
  }
  if (!groupData.capacity || groupData.capacity <= 0) {
    return { success: false, error: 'Grup kontenjanı 0 dan büyük olmalıdır.' };
  }

  const all = getStoredGroups();
  const timestamp = new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const newGroup: Group = {
    ...groupData,
    id: groupData.id || `grp-${Date.now()}`,
    createdAt: timestamp,
  };

  all.push(newGroup);
  saveGroupsToStorage(all);
  return { success: true, group: newGroup };
};

// -----------------------------------------------------------------------------
// KESİN KAYIT (ENROLLMENT) YÖNETİMİ & MİGRASYON
// -----------------------------------------------------------------------------

export const getStoredEnrollments = (): Enrollment[] => {
  try {
    const raw = localStorage.getItem(ENROLLMENTS_STORAGE_KEY);
    let enrollments: Enrollment[] = [];

    if (!raw) {
      enrollments = [...INITIAL_ENROLLMENTS];
    } else {
      const parsed = JSON.parse(raw);
      enrollments = Array.isArray(parsed) ? parsed : [...INITIAL_ENROLLMENTS];
    }

    if (enrollments.length < 5 || !enrollments.some((e) => e.candidateId === 'usr-trainee')) {
      enrollments = [...INITIAL_ENROLLMENTS];
    }

    // GÜVENLİ MİGRASYON:
    // Eğer başvuru deposunda kabul edilmiş (accepted) bir aday varsa ve henüz enrollment kaydı oluşmamışsa,
    // onu 'pending_confirmation' durumunda listeye ekle (Veri kaybını ve tutarsızlığı önler)
    const apps = getStoredApplications();
    const acceptedApps = apps.filter((a) => a.status === 'accepted');

    let mutated = false;
    acceptedApps.forEach((app) => {
      const exists = enrollments.some(
        (e) =>
          e.applicationId === app.id ||
          (e.candidateId === app.candidateId &&
            e.programId === app.programId &&
            (e.termId === app.termId || e.cohortName === app.cohortName))
      );

      if (!exists) {
        const newEnrollment: Enrollment = {
          id: `enr-${app.id}`,
          applicationId: app.id,
          candidateId: app.candidateId,
          candidateName: app.candidateName,
          candidateEmail: app.email,
          candidatePhone: app.phone,
          programId: app.programId,
          programTitle: app.programTitle,
          termId: app.termId || 'term-2026-fall',
          cohortName: app.cohortName || '2026 Güz Dönemi',
          status: 'pending_confirmation',
          createdAt: app.appliedAt || '21 Ekim 2026',
          updatedAt: app.decidedAt || app.appliedAt || '21 Ekim 2026',
          notes: app.candidateDecisionMessage || 'İdari masada kabul edildi, kesin kayıt onayı bekleniyor.',
        };
        enrollments.push(newEnrollment);
        mutated = true;
      }
    });

    if (mutated || !raw) {
      localStorage.setItem(ENROLLMENTS_STORAGE_KEY, JSON.stringify(enrollments));
    }

    return enrollments;
  } catch (err) {
    console.error('Enrollments read error:', err);
    return INITIAL_ENROLLMENTS;
  }
};

const saveEnrollmentsToStorage = (enrollments: Enrollment[]): void => {
  try {
    localStorage.setItem(ENROLLMENTS_STORAGE_KEY, JSON.stringify(enrollments));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(ENROLLMENTS_UPDATE_EVENT, { detail: enrollments })
      );
    }
  } catch (err) {
    console.error('Enrollments write error:', err);
  }
};

export const getEnrollmentById = (id: string): Enrollment | undefined => {
  return getStoredEnrollments().find((e) => e.id === id);
};

export const getEnrollmentsByProgramAndTerm = (
  programId: string,
  termId?: string
): Enrollment[] => {
  const all = getStoredEnrollments();
  return all.filter((e) => {
    if (e.programId !== programId) return false;
    if (termId && e.termId !== termId && e.cohortName !== termId) return false;
    return true;
  });
};

export const getEnrollmentForCandidate = (
  candidateId: string,
  programId?: string
): Enrollment | undefined => {
  const all = getStoredEnrollments();
  return all.find((e) => {
    if (e.candidateId !== candidateId) return false;
    if (programId && e.programId !== programId) return false;
    return e.status !== 'cancelled';
  });
};

/**
 * Yönetici tarafından kesin kaydı onaylama
 */
export const confirmEnrollment = (
  enrollmentId: string,
  confirmedBy: string,
  notes?: string
): { success: boolean; enrollment?: Enrollment; error?: string } => {
  const all = getStoredEnrollments();
  const index = all.findIndex((e) => e.id === enrollmentId);

  if (index === -1) {
    return { success: false, error: 'Kesin kayıt başvurusu bulunamadı.' };
  }

  const enr = all[index];

  // Aynı adayın aynı program ve dönemde başka aktif kesin kaydı var mı?
  const duplicateActive = all.find(
    (e) =>
      e.id !== enr.id &&
      e.candidateId === enr.candidateId &&
      e.programId === enr.programId &&
      (e.termId === enr.termId || e.cohortName === enr.cohortName) &&
      e.status === 'confirmed'
  );

  if (duplicateActive) {
    return {
      success: false,
      error: 'Bu adayın bu program ve dönem için zaten aktif bir kesin kaydı bulunmaktadır.',
    };
  }

  const timestamp = new Date().toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updated: Enrollment = {
    ...enr,
    status: 'confirmed',
    confirmedAt: timestamp,
    confirmedBy,
    updatedAt: timestamp,
    notes: notes || enr.notes || 'Kesin kayıt yönetici tarafından onaylandı.',
  };

  all[index] = updated;
  saveEnrollmentsToStorage(all);

  // Bildirim tetikle (Non-blocking)
  try {
    notifyEnrollmentConfirmed(updated);
  } catch (err) {
    console.warn('Kesin kayıt bildirimi tetiklenirken hata:', err);
  }

  return { success: true, enrollment: updated };
};

/**
 * Kesin kaydı iptal etme (İlişkili grup atamasını kaldırır ve kontenjanı açar)
 */
export const cancelEnrollment = (
  enrollmentId: string,
  reason: string,
  cancelledBy: string
): { success: boolean; error?: string } => {
  const all = getStoredEnrollments();
  const index = all.findIndex((e) => e.id === enrollmentId);

  if (index === -1) {
    return { success: false, error: 'Kayıt bulunamadı.' };
  }

  const enr = all[index];
  const timestamp = new Date().toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  all[index] = {
    ...enr,
    status: 'cancelled',
    cancellationReason: reason.trim(),
    updatedAt: timestamp,
    notes: `İptal Edildi (${cancelledBy}): ${reason.trim()}`,
  };

  saveEnrollmentsToStorage(all);

  // İlişkili grup atamasını kaldırarak grup kontenjanını boşalt
  removeTraineeFromGroup(enrollmentId, `Kesin kayıt iptali sebebiyle: ${reason}`, cancelledBy);

  return { success: true };
};

// -----------------------------------------------------------------------------
// GRUP ATAMASI (GROUP ASSIGNMENT) YÖNETİMİ
// -----------------------------------------------------------------------------

export const getStoredAssignments = (): GroupAssignment[] => {
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        ASSIGNMENTS_STORAGE_KEY,
        JSON.stringify(INITIAL_ASSIGNMENTS)
      );
      return INITIAL_ASSIGNMENTS;
    }
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length >= 10 &&
      parsed.some((a) => a.candidateId === 'usr-trainee')
    ) {
      return parsed;
    }
    localStorage.setItem(
      ASSIGNMENTS_STORAGE_KEY,
      JSON.stringify(INITIAL_ASSIGNMENTS)
    );
    return INITIAL_ASSIGNMENTS;
  } catch (err) {
    console.error('Assignments read error:', err);
    return INITIAL_ASSIGNMENTS;
  }
};

const saveAssignmentsToStorage = (assignments: GroupAssignment[]): void => {
  try {
    localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(GROUPS_UPDATE_EVENT, { detail: assignments })
      );
    }
  } catch (err) {
    console.error('Assignments write error:', err);
  }
};

export const getGroupAssignmentsByGroup = (groupId: string): GroupAssignment[] => {
  const all = getStoredAssignments();
  return all.filter((a) => a.groupId === groupId && a.status === 'active');
};

export const getActiveAssignmentForEnrollment = (
  enrollmentId: string
): GroupAssignment | undefined => {
  const all = getStoredAssignments();
  return all.find((a) => a.enrollmentId === enrollmentId && a.status === 'active');
};

export const getActiveAssignmentForCandidate = (
  candidateId: string,
  programId?: string
): GroupAssignment | undefined => {
  const all = getStoredAssignments();
  const direct = all.find((a) => {
    if (a.candidateId !== candidateId && a.candidateEmail !== candidateId) return false;
    if (programId && a.programId !== programId) return false;
    return a.status === 'active';
  });
  if (direct) return direct;

  // Fallback for demo accounts (Ahmet Kaya / demo trainee)
  if (
    candidateId === 'usr-trainee' ||
    candidateId.includes('trainee') ||
    candidateId.includes('ahmet') ||
    candidateId === 'user-trainee-01'
  ) {
    return (
      all.find((a) => a.candidateId === 'usr-trainee' || a.candidateId === 'user-trainee-01') ||
      all.find((a) => a.groupId === 'grp-01') ||
      all[0]
    );
  }
  return all[0];
};

/**
 * Grup doluluk istatistiği hesaplama
 */
export const getGroupCapacityStats = (groupId: string): GroupCapacityStats => {
  const group = getGroupById(groupId);
  if (!group) {
    return {
      groupId,
      groupName: 'Bilinmeyen Grup',
      capacity: 0,
      assignedCount: 0,
      availableSeats: 0,
      isFull: true,
    };
  }

  const assigned = getGroupAssignmentsByGroup(groupId);
  const assignedCount = assigned.length;
  const availableSeats = Math.max(0, group.capacity - assignedCount);

  return {
    groupId: group.id,
    groupName: group.name,
    capacity: group.capacity,
    assignedCount,
    availableSeats,
    isFull: assignedCount >= group.capacity,
  };
};

/**
 * Kesin kayıtlı kursiyeri bir eğitim grubuna yerleştirme
 */
export const assignTraineeToGroup = (
  enrollmentId: string,
  groupId: string,
  assignedBy: string
): { success: boolean; assignment?: GroupAssignment; error?: string } => {
  const enrollment = getEnrollmentById(enrollmentId);
  if (!enrollment) {
    return { success: false, error: 'Kesin kayıt bulunamadı.' };
  }

  if (enrollment.status !== 'confirmed') {
    return {
      success: false,
      error: 'Yalnızca kesin kaydı onaylanmış kursiyerler gruba yerleştirilebilir.',
    };
  }

  const group = getGroupById(groupId);
  if (!group) {
    return { success: false, error: 'Hedef grup bulunamadı.' };
  }

  // Grup kontenjan kontrolü
  const capacityStats = getGroupCapacityStats(groupId);
  if (capacityStats.isFull) {
    return {
      success: false,
      error: `"${group.name}" grubu maksimum kontenjana (${group.capacity} kişi) ulaşmıştır. Yeni yerleştirme yapılamaz.`,
    };
  }

  const assignments = getStoredAssignments();

  // Aynı kursiyerin aynı programda başka aktif grup ataması var mı?
  const existingActive = assignments.find(
    (a) =>
      a.enrollmentId === enrollmentId &&
      a.status === 'active'
  );

  if (existingActive) {
    if (existingActive.groupId === groupId) {
      return { success: false, error: 'Kursiyer zaten bu grupta aktif olarak kayıtlıdır.' };
    }
    return {
      success: false,
      error: 'Kursiyerin zaten aktif bir grup ataması bulunmaktadır. Lütfen "Grup Transferi" işlemini kullanınız.',
    };
  }

  const timestamp = new Date().toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const newAssignment: GroupAssignment = {
    id: `asgn-${Date.now()}`,
    enrollmentId,
    candidateId: enrollment.candidateId,
    candidateName: enrollment.candidateName,
    candidateEmail: enrollment.candidateEmail,
    groupId: group.id,
    groupName: group.name,
    programId: enrollment.programId,
    programTitle: enrollment.programTitle,
    termId: enrollment.termId,
    status: 'active',
    assignedAt: timestamp,
    assignedBy,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  assignments.push(newAssignment);
  saveAssignmentsToStorage(assignments);

  // Bildirim tetikle (Non-blocking)
  try {
    notifyGroupAssigned(newAssignment, group);
  } catch (err) {
    console.warn('Grup atama bildirimi tetiklenirken hata:', err);
  }

  return { success: true, assignment: newAssignment };
};

/**
 * Grup transferi (Geçmiş yoklama verileri korunarak yeni gruba geçiş)
 */
export const transferTraineeGroup = (
  enrollmentId: string,
  newGroupId: string,
  reason: string,
  transferredBy: string
): { success: boolean; assignment?: GroupAssignment; error?: string } => {
  const currentAssignment = getActiveAssignmentForEnrollment(enrollmentId);
  if (!currentAssignment) {
    return { success: false, error: 'Aktif grup ataması bulunamadı.' };
  }

  if (currentAssignment.groupId === newGroupId) {
    return { success: false, error: 'Kursiyer zaten hedef gruptadır.' };
  }

  const targetGroup = getGroupById(newGroupId);
  if (!targetGroup) {
    return { success: false, error: 'Hedef grup bulunamadı.' };
  }

  // Hedef grup kontenjan kontrolü
  const capacityStats = getGroupCapacityStats(newGroupId);
  if (capacityStats.isFull) {
    return {
      success: false,
      error: `Hedef grup "${targetGroup.name}" tam dolu (${targetGroup.capacity} kişi). Transfer yapılamaz.`,
    };
  }

  const assignments = getStoredAssignments();
  const index = assignments.findIndex((a) => a.id === currentAssignment.id);

  if (index === -1) {
    return { success: false, error: 'Atama kaydı bulunamadı.' };
  }

  const timestamp = new Date().toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const transferLog = {
    fromGroupId: currentAssignment.groupId,
    fromGroupName: currentAssignment.groupName,
    toGroupId: targetGroup.id,
    toGroupName: targetGroup.name,
    transferredAt: timestamp,
    transferredBy,
    reason: reason.trim() || 'Yönetici kararıyla grup değişikliği.',
  };

  const updated: GroupAssignment = {
    ...currentAssignment,
    groupId: targetGroup.id,
    groupName: targetGroup.name,
    updatedAt: timestamp,
    transferHistory: [
      ...(currentAssignment.transferHistory || []),
      transferLog,
    ],
  };

  assignments[index] = updated;
  saveAssignmentsToStorage(assignments);

  // Bildirim tetikle (Non-blocking)
  try {
    notifyGroupAssigned(updated, targetGroup);
  } catch (err) {
    console.warn('Grup transfer bildirimi tetiklenirken hata:', err);
  }

  return { success: true, assignment: updated };
};

/**
 * Gruptan çıkarma (Atama durumunu 'removed' yapar ve grup kontenjanını boşaltır)
 */
export const removeTraineeFromGroup = (
  enrollmentId: string,
  reason: string,
  removedBy: string
): { success: boolean; error?: string } => {
  const assignments = getStoredAssignments();
  const index = assignments.findIndex(
    (a) => a.enrollmentId === enrollmentId && a.status === 'active'
  );

  if (index === -1) {
    return { success: true }; // Zaten grupta aktif atama yok
  }

  const current = assignments[index];
  const timestamp = new Date().toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  assignments[index] = {
    ...current,
    status: 'removed',
    removalReason: `${reason.trim()} (${removedBy})`,
    updatedAt: timestamp,
  };

  saveAssignmentsToStorage(assignments);
  return { success: true };
};

export const batchConfirmEnrollments = (
  enrollmentIds: string[],
  confirmedBy: string,
  notes?: string
): { successCount: number; errors: string[] } => {
  let successCount = 0;
  const errors: string[] = [];

  enrollmentIds.forEach((id) => {
    const res = confirmEnrollment(id, confirmedBy, notes);
    if (res.success) successCount++;
    else if (res.error) errors.push(res.error);
  });

  return { successCount, errors };
};

export const batchAssignTraineesToGroup = (
  enrollmentIds: string[],
  groupId: string,
  assignedBy: string
): { successCount: number; errors: string[] } => {
  let successCount = 0;
  const errors: string[] = [];

  enrollmentIds.forEach((id) => {
    const res = assignTraineeToGroup(id, groupId, assignedBy);
    if (res.success) successCount++;
    else if (res.error) errors.push(res.error);
  });

  return { successCount, errors };
};

export const batchCancelEnrollments = (
  enrollmentIds: string[],
  reason: string,
  cancelledBy: string
): { successCount: number; errors: string[] } => {
  let successCount = 0;
  const errors: string[] = [];

  enrollmentIds.forEach((id) => {
    const res = cancelEnrollment(id, reason, cancelledBy);
    if (res.success) successCount++;
    else if (res.error) errors.push(res.error);
  });

  return { successCount, errors };
};

/**
 * Demo depolarını sıfırlama
 */
export const resetEnrollmentsToDefaults = (): void => {
  localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(INITIAL_GROUPS));
  localStorage.setItem(ENROLLMENTS_STORAGE_KEY, JSON.stringify(INITIAL_ENROLLMENTS));
  localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(INITIAL_ASSIGNMENTS));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(GROUPS_UPDATE_EVENT, { detail: INITIAL_GROUPS }));
    window.dispatchEvent(
      new CustomEvent(ENROLLMENTS_UPDATE_EVENT, { detail: INITIAL_ENROLLMENTS })
    );
  }
};

/**
 * Abonelikler
 */
export const subscribeToEnrollmentUpdates = (
  callback: (enrollments: Enrollment[]) => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const handler = () => {
    callback(getStoredEnrollments());
  };
  window.addEventListener(ENROLLMENTS_UPDATE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(ENROLLMENTS_UPDATE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};

export const subscribeToGroupUpdates = (
  callback: () => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const handler = () => {
    callback();
  };
  window.addEventListener(GROUPS_UPDATE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(GROUPS_UPDATE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};
