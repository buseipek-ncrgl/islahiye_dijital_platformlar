import { Program, CurriculumModule } from '../types';
import { educationApi, ProgramDto } from './apiClient';
import { DEMO_PROGRAMS } from '../data/educationData';

export function mapProgramDtoToProgram(dto: ProgramDto): Program {
  const primaryTerm = dto.terms?.[0];
  const outcomes = dto.learningOutcomes
    ? dto.learningOutcomes.split(/[,.;\n]/).map((s) => s.trim()).filter(Boolean)
    : [];

  const modules: CurriculumModule[] = [
    {
      sessionNumber: 1,
      title: 'Temel Kavramlar ve Giriş',
      hours: 4,
      description: dto.description || 'Programa giriş ve temel ilkeler.',
    },
    {
      sessionNumber: 2,
      title: 'Uygulamalı Atölye ve Saha Pratiği',
      hours: 6,
      description: dto.learningOutcomes || 'Uygulamalı vaka çalışması ve pratik.',
    },
    {
      sessionNumber: 3,
      title: 'İnceleme, Değerlendirme ve Bitirme',
      hours: 4,
      description: dto.prerequisites || 'Son değerlendirme ve sertifikasyon hazırlığı.',
    },
  ];

  return {
    id: dto.id,
    title: dto.name,
    category: dto.slug.includes('gastronomi')
      ? 'Gastronomi'
      : dto.slug.includes('baharat')
      ? 'Tarım ve E-Ticaret'
      : 'Tarım ve E-Ticaret',
    description: dto.description,
    targetAudience: dto.targetAudience,
    durationWeeks: 8,
    totalHours: 32,
    cohortName: primaryTerm?.name || '2026 Bahar Dönemi',
    quota: primaryTerm?.capacity || 25,
    enrolledCount: 0,
    location: 'İslahiye Ticaret Odası Eğitim Salonu',
    mode: 'Yüz Yüze',
    status: dto.status === 1 ? 'open' : 'planned',
    curriculumModules: modules,
    certified: 'İTO Onaylı Başarı Sertifikası',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    level: 'Orta Düzey',
    term: primaryTerm?.name || '2026 Bahar',
    durationMonths: '2 Ay',
    type: 'Uygulamalı Eğitim',
    highlights: outcomes.length > 0 ? outcomes.slice(0, 3) : ['Uygulamalı Eğitim', 'Resmî Sertifika'],
  };
}

const CUSTOM_PROGRAMS_KEY = 'islahiye_custom_programs_v1';
const DELETED_PROGRAMS_KEY = 'islahiye_deleted_programs_v1';

export function getDeletedProgramIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_PROGRAMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getCustomPrograms(): Program[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PROGRAMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getInitialPrograms(): Program[] {
  const deleted = getDeletedProgramIds();
  const custom = getCustomPrograms();
  const merged = [...custom].filter((p) => !deleted.includes(p.id));
  DEMO_PROGRAMS.forEach((dp) => {
    if (!merged.some((m) => m.id === dp.id) && !deleted.includes(dp.id)) {
      merged.push(dp);
    }
  });
  if (merged.length === 0) {
    return DEMO_PROGRAMS;
  }
  return merged;
}

export function saveCustomProgram(prog: Program): void {
  const existing = getCustomPrograms();
  const filtered = existing.filter((p) => p.id !== prog.id);
  localStorage.setItem(CUSTOM_PROGRAMS_KEY, JSON.stringify([prog, ...filtered]));
}

export function updateCustomProgram(prog: Program): void {
  saveCustomProgram(prog);
}

export function deleteCustomProgram(id: string): void {
  const existing = getCustomPrograms();
  localStorage.setItem(CUSTOM_PROGRAMS_KEY, JSON.stringify(existing.filter((p) => p.id !== id)));
  const deleted = getDeletedProgramIds();
  if (!deleted.includes(id)) {
    deleted.push(id);
    localStorage.setItem(DELETED_PROGRAMS_KEY, JSON.stringify(deleted));
  }
}

export async function fetchLivePrograms(): Promise<Program[]> {
  const initial = getInitialPrograms();
  try {
    const dts = await educationApi.programs();
    if (dts && dts.length > 0) {
      const mapped = dts.map(mapProgramDtoToProgram);
      const merged = [...initial];
      mapped.forEach((apiProg) => {
        const idx = merged.findIndex((m) => m.id === apiProg.id || m.title === apiProg.title);
        if (idx >= 0) {
          const originalId = merged[idx].id;
          merged[idx] = { ...merged[idx], ...apiProg, id: originalId };
        } else {
          merged.push(apiProg);
        }
      });
      return merged.length > 0 ? merged : DEMO_PROGRAMS;
    }
  } catch (err) {
    console.warn('Failed to fetch live programs from API, using cached/demo:', err);
  }
  return initial.length > 0 ? initial : DEMO_PROGRAMS;
}

export async function fetchLiveProgramById(id: string): Promise<Program | null> {
  const initial = getInitialPrograms().find((p) => p.id === id);
  if (initial) return initial;
  try {
    const dto = await educationApi.program(id);
    if (dto) return mapProgramDtoToProgram(dto);
  } catch (err) {
    console.error('Failed to fetch program from API:', err);
  }
  return null;
}

