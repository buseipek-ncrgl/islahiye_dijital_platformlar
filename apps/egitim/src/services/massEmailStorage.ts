/**
 * Mass Email Simulation Storage & Queue Engine (Sprint E04-B)
 * İslahiye Ticaret Odası Eğitim Portalı — Toplu E-Posta Simülasyon Masası.
 *
 * Temel Kurallar:
 * 1. Bu modül YALNIZCA bir frontend demo simülasyonudur.
 * 2. Gerçek SMTP sunucusu, harici e-posta servisi (SendGrid, Mailgun vb.) veya
 *    üretim düzeyinde veri iletimi bulunmamaktadır.
 * 3. Alıcılar mevcut Enrollment, GroupAssignment ve InstructorAssignment kayıtlarından
 *    türetilir; mükerrer alıcılar elenir (Deduplication).
 * 4. İptal edilen kayıtlar varsayılan listeden çıkarılır.
 * 5. Kuyruktaki her işlem "Toplu e-posta işlemi demo kuyruğunda işlendi. Hiçbir gerçek
 *    e-posta gönderilmedi." uyarısını taşır.
 */

import {
  MassEmailQueueItem,
  MassEmailTemplate,
} from '../types';
import {
  getStoredEnrollments,
  getStoredAssignments,
  getStoredGroups,
} from './enrollmentStorage';
import { DEMO_USERS } from '../data/educationData';

const EMAIL_TEMPLATES_STORAGE_KEY = 'islahiye_education_email_templates_v1';
const EMAIL_QUEUE_STORAGE_KEY = 'islahiye_education_email_queue_v1';

export const EMAIL_QUEUE_UPDATE_EVENT = 'islahiye_email_queue_updated';
export const EMAIL_TEMPLATES_UPDATE_EVENT = 'islahiye_email_templates_updated';

// -----------------------------------------------------------------------------
// 1. BEŞ ADET RESMİ BAŞLANGIÇ ŞABLONU (Editable Pre-built Templates)
// -----------------------------------------------------------------------------

export const INITIAL_EMAIL_TEMPLATES: MassEmailTemplate[] = [
  {
    id: 'tmpl-start-notice',
    name: 'Eğitim Başlangıç Bilgilendirmesi',
    subject: '{{programName}} — {{termName}} Eğitimleri Başlıyor',
    body: `Sayın {{recipientName}},

{{institutionName}} bünyesinde düzenlenen "{{programName}}" eğitimi {{termName}} kapsamında kesin kaydınız tamamlanmıştır.

Dersleriniz {{groupName}} grubu bünyesinde planlanan takvime uygun olarak başlayacaktır. Ders programınızı ve oturum salon detaylarını öğrenci panelinizden inceleyebilirsiniz.

İlk ders gününde kimlik belgenizle birlikte derslikte hazır bulunmanızı rica eder, başarılı bir eğitim dönemi dileriz.

İletişim & Destek: {{contactInfo}}`,
    availableVariables: [
      'programName',
      'termName',
      'groupName',
      'recipientName',
      'institutionName',
      'contactInfo',
    ],
    createdAt: '2026-10-15T09:00:00.000Z',
    updatedAt: '2026-10-15T09:00:00.000Z',
  },
  {
    id: 'tmpl-session-change',
    name: 'Ders Tarihi ve Saat Değişikliği',
    subject: 'Önemli Bilgilendirme: {{groupName}} Ders Saati Güncellemesi',
    body: `Sayın {{recipientName}},

"{{programName}}" programı {{groupName}} grubunun yaklaşan ders oturumunun tarihi ve saati eğitmen ve derslik planlaması doğrultusunda güncellenmiştir.

Güncel oturum saatleri ve derslik bilgisi portal üzerindeki takviminize işlenmiştir. Katılım durumunuzu buna göre planlamanızı önemle rica ederiz.

Bilgilerinize sunarız.
{{institutionName}}`,
    availableVariables: [
      'programName',
      'termName',
      'groupName',
      'recipientName',
      'institutionName',
    ],
    createdAt: '2026-10-15T09:30:00.000Z',
    updatedAt: '2026-10-15T09:30:00.000Z',
  },
  {
    id: 'tmpl-group-announcement',
    name: 'Genel Grup Duyurusu & Saha Bilgilendirmesi',
    subject: '{{groupName}} — Önemli Bilgilendirme ve Duyuru',
    body: `Sayın {{recipientName}},

{{termName}} dönemi "{{programName}}" eğitimi {{groupName}} sınıfı için önemli bir duyuru bulunmaktadır.

Eğitim sürecine ilişkin güncel materyaller, ödev açıklamaları ve duyurular sınıf kanalınızda paylaşılmıştır. İlgili detayları incelemek için lütfen portalınıza giriş yapınız.

Saygılarımızla,
{{institutionName}}`,
    availableVariables: [
      'programName',
      'termName',
      'groupName',
      'recipientName',
      'institutionName',
    ],
    createdAt: '2026-10-15T10:00:00.000Z',
    updatedAt: '2026-10-15T10:00:00.000Z',
  },
  {
    id: 'tmpl-assignment-deadline',
    name: 'Ödev Son Teslim Tarihi Hatırlatması',
    subject: 'Hatırlatma: {{programName}} Ödev Teslim Tarihi Yaklaşıyor',
    body: `Sayın {{recipientName}},

"{{programName}}" eğitimi kapsamında eğitmeniniz tarafından tanımlanan zorunlu ödev çalışmasının son teslim süresi yaklaşmaktadır.

Dönem sonu başarı belgesi ve sertifika değerlendirmesinde en az 70/100 ödev ortalaması ve zorunlu ödevlerin tamamlanması şartı aranmaktadır. Ödevinizi zamanında sisteme yüklemenizi hatırlatırız.

İyi çalışmalar dileriz.
{{institutionName}}`,
    availableVariables: [
      'programName',
      'groupName',
      'recipientName',
      'institutionName',
    ],
    createdAt: '2026-10-15T10:30:00.000Z',
    updatedAt: '2026-10-15T10:30:00.000Z',
  },
  {
    id: 'tmpl-term-end',
    name: 'Dönem Sonu Bilgilendirmesi & Başarı Belgeleri',
    subject: 'Tebrikler: {{programName}} — {{termName}} Tamamlandı',
    body: `Sayın {{recipientName}},

{{institutionName}} tarafından yürütülen "{{programName}}" eğitimi {{termName}} dönemi ders oturumları ve değerlendirme süreçleri başarıyla tamamlanmıştır.

Devam şartını (%80) ve ödev başarı kriterlerini (70/100) sağlayan kursiyerlerimizin resmi başarı belgeleri ve QR kodlu dijital sertifikaları portal üzerinden erişime açılmıştır.

Bölgemiz ekonomisine ve dijital dönüşümüne katkılarınız için teşekkür eder, başarılarınızın devamını dileriz.

{{institutionName}} Yönetimi`,
    availableVariables: [
      'programName',
      'termName',
      'recipientName',
      'institutionName',
    ],
    createdAt: '2026-10-15T11:00:00.000Z',
    updatedAt: '2026-10-15T11:00:00.000Z',
  },
];

// -----------------------------------------------------------------------------
// 2. SEED DEMO EMAIL QUEUE (Geçmiş Kuyruk Kayıtları)
// -----------------------------------------------------------------------------

export const INITIAL_EMAIL_QUEUE: MassEmailQueueItem[] = [
  {
    id: 'queue-seed-01',
    createdBy: 'user-admin-01',
    createdByName: 'Selin Aydın (Yönetici)',
    targetProgramId: 'prog-01',
    targetProgramTitle: 'İslahiye Biberi & Tarımsal E-Ticaret',
    targetTermId: 'term-2026-fall',
    targetCohortName: '2026 Güz Dönemi',
    targetGroupIds: ['grp-01'],
    targetGroupNames: ['Grup A (Hafta İçi Öğleden Sonra)'],
    targetAudienceRole: 'trainee',
    recipientSnapshot: [
      {
        id: 'user-trainee-01',
        fullName: 'Ayşe Demir',
        email: 'ayse.demir@ornek.com',
        role: 'Kursiyer',
        groupName: 'Grup A',
      },
    ],
    recipientCount: 1,
    subject: 'İslahiye Biberi & Tarımsal E-Ticaret — 2026 Güz Dönemi Eğitimleri Başlıyor',
    body: 'Sayın Ayşe Demir, İslahiye Ticaret Odası bünyesinde düzenlenen eğitime kesin kaydınız tamamlanmıştır...',
    templateId: 'tmpl-start-notice',
    status: 'processed_in_simulation',
    createdAt: '2026-10-16T10:00:00.000Z',
    queuedAt: '2026-10-16T10:00:00.000Z',
    simulatedAt: '2026-10-16T10:01:00.000Z',
    notes: 'Toplu e-posta işlemi demo kuyruğunda işlendi. Hiçbir gerçek e-posta gönderilmedi.',
  },
];

// -----------------------------------------------------------------------------
// 3. STORAGE ACCESSORS
// -----------------------------------------------------------------------------

export const getStoredEmailTemplates = (): MassEmailTemplate[] => {
  try {
    const raw = localStorage.getItem(EMAIL_TEMPLATES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EMAIL_TEMPLATES_STORAGE_KEY, JSON.stringify(INITIAL_EMAIL_TEMPLATES));
      return INITIAL_EMAIL_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_EMAIL_TEMPLATES;
  } catch (err) {
    console.error('Email templates read error:', err);
    return INITIAL_EMAIL_TEMPLATES;
  }
};

export const saveEmailTemplatesToStorage = (templates: MassEmailTemplate[]): void => {
  try {
    localStorage.setItem(EMAIL_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(EMAIL_TEMPLATES_UPDATE_EVENT, { detail: templates })
      );
    }
  } catch (err) {
    console.error('Email templates write error:', err);
  }
};

export const getStoredEmailQueue = (): MassEmailQueueItem[] => {
  try {
    const raw = localStorage.getItem(EMAIL_QUEUE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EMAIL_QUEUE_STORAGE_KEY, JSON.stringify(INITIAL_EMAIL_QUEUE));
      return INITIAL_EMAIL_QUEUE;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_EMAIL_QUEUE;
  } catch (err) {
    console.error('Email queue read error:', err);
    return INITIAL_EMAIL_QUEUE;
  }
};

export const saveEmailQueueToStorage = (queue: MassEmailQueueItem[]): void => {
  try {
    localStorage.setItem(EMAIL_QUEUE_STORAGE_KEY, JSON.stringify(queue));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(EMAIL_QUEUE_UPDATE_EVENT, { detail: queue })
      );
    }
  } catch (err) {
    console.error('Email queue write error:', err);
  }
};

// -----------------------------------------------------------------------------
// 4. ALICI LİSTESİ TÜRETME VE MÜKERRER TEMİZLEME (DEDUPLICATION)
// -----------------------------------------------------------------------------

export interface RecipientEntry {
  id: string;
  fullName: string;
  email: string;
  role: 'trainee' | 'instructor';
  roleLabel: string;
  groupId?: string;
  groupName?: string;
  programTitle?: string;
}

/**
 * Mevcut Enrollment, GroupAssignment ve InstructorAssignment verilerinden
 * seçili kriterlere uygun tekil alıcı listesi türetir.
 * - Aynı kişi birden çok grupta veya kayıtta olsa dahi SADECE 1 KEZ listelenir (Deduplication).
 * - İptal edilen kayıtlar dahil edilmez.
 * - Gerçek e-posta zorunlu değildir; sentetik demo adresleri kullanılır.
 */
export const deriveEligibleRecipients = (params: {
  programId?: string;
  termId?: string;
  groupIds?: string[];
  audienceRole?: 'trainee' | 'instructor' | 'all';
}): RecipientEntry[] => {
  const { programId, termId, groupIds = [], audienceRole = 'all' } = params;

  const enrollments = getStoredEnrollments();
  const assignments = getStoredAssignments();
  const groups = getStoredGroups();

  const resultMap = new Map<string, RecipientEntry>();

  // Kursiyerleri topla
  if (audienceRole === 'trainee' || audienceRole === 'all') {
    for (const enr of enrollments) {
      // Yalnızca kesin kayıtlıları al (iptal edilenler dahil edilmez)
      if (enr.status !== 'confirmed') continue;

      if (programId && enr.programId !== programId) continue;
      if (termId && enr.termId !== termId) continue;

      // Grup filtresi varsa kontrol et
      if (groupIds.length > 0) {
        const asgn = assignments.find(
          (a) => a.enrollmentId === enr.id && a.status === 'active'
        );
        if (!asgn || !groupIds.includes(asgn.groupId)) {
          continue;
        }
      }

      const asgn = assignments.find(
        (a) => a.enrollmentId === enr.id && a.status === 'active'
      );
      const group = asgn ? groups.find((g) => g.id === asgn.groupId) : undefined;

      const syntheticEmail =
        enr.candidateEmail ||
        `${enr.candidateName.toLowerCase().replace(/\s+/g, '.')}@ornek.com`;

      // Tekil kullanıcı ID'sine göre haritaya ekle (Deduplication)
      if (!resultMap.has(enr.candidateId)) {
        resultMap.set(enr.candidateId, {
          id: enr.candidateId,
          fullName: enr.candidateName,
          email: syntheticEmail,
          role: 'trainee',
          roleLabel: 'Kursiyer',
          groupId: asgn?.groupId,
          groupName: group?.name || 'Genel Kursiyer',
          programTitle: enr.programTitle,
        });
      }
    }
  }

  // Eğitmenleri topla
  if (audienceRole === 'instructor' || audienceRole === 'all') {
    for (const group of groups) {
      if (group.status !== 'active') continue;
      if (programId && group.programId !== programId) continue;
      if (termId && group.termId !== termId) continue;
      if (groupIds.length > 0 && !groupIds.includes(group.id)) continue;

      group.instructorIds.forEach((instId, idx) => {
        const instName = group.instructorNames[idx] || 'Eğitmen';
        const demoUser = Object.values(DEMO_USERS).find((u) => u.id === instId);
        const email = demoUser?.email || `${instName.toLowerCase().replace(/\s+/g, '.')}@islahiye-dijital.org`;

        if (!resultMap.has(instId)) {
          resultMap.set(instId, {
            id: instId,
            fullName: instName,
            email,
            role: 'instructor',
            roleLabel: 'Eğitmen',
            groupId: group.id,
            groupName: group.name,
            programTitle: group.programTitle,
          });
        }
      });
    }
  }

  return Array.from(resultMap.values());
};

// -----------------------------------------------------------------------------
// 5. DEĞİŞKEN ALANLAR & ŞABLON ÇÖZÜMLEME MOTORU (Template Variable Resolver)
// -----------------------------------------------------------------------------

export interface ResolvedTemplateResult {
  subject: string;
  body: string;
  unresolvedVariables: string[];
}

/**
 * Şablon metnindeki {{variableName}} kalıplarını çözümler.
 * Çözümlenemeyen eksik değişkenleri raporlar.
 */
export const resolveTemplateVariables = (
  text: string,
  variables: Record<string, string>
): { resolved: string; missing: string[] } => {
  const missing: string[] = [];
  const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g;

  const resolved = text.replace(regex, (match, varName) => {
    if (varName in variables && variables[varName] !== undefined && variables[varName] !== '') {
      return variables[varName];
    }
    if (!missing.includes(varName)) {
      missing.push(varName);
    }
    return match; // Eksik değişken olduğu gibi bırakılır
  });

  return { resolved, missing };
};

export const previewEmailWithSample = (
  template: { subject: string; body: string },
  context: {
    programName?: string;
    termName?: string;
    groupName?: string;
    recipientName?: string;
    institutionName?: string;
    contactInfo?: string;
  }
): ResolvedTemplateResult => {
  const vars: Record<string, string> = {
    programName: context.programName || '',
    termName: context.termName || '',
    groupName: context.groupName || '',
    recipientName: context.recipientName || 'Örnek Kursiyer (Sayın Ayşe Demir)',
    institutionName: context.institutionName || 'İslahiye Ticaret Odası',
    contactInfo: context.contactInfo || 'egitim@islahiye-tso.org.tr | 0342 862 ** **',
  };

  const subjRes = resolveTemplateVariables(template.subject, vars);
  const bodyRes = resolveTemplateVariables(template.body, vars);

  const missingSet = new Set([...subjRes.missing, ...bodyRes.missing]);

  return {
    subject: subjRes.resolved,
    body: bodyRes.resolved,
    unresolvedVariables: Array.from(missingSet),
  };
};

// -----------------------------------------------------------------------------
// 6. KUYRUK İŞLEMLERİ (Queue Management)
// -----------------------------------------------------------------------------

/**
 * Toplu e-postayı demo kuyruğuna ekler.
 * Kuyruğa eklenen kayıt geçmişe kaydedilir ve içeriği sessizce değiştirilemez.
 */
export const enqueueMassEmail = (params: {
  createdBy: string;
  createdByName: string;
  targetProgramId?: string;
  targetProgramTitle?: string;
  targetTermId?: string;
  targetCohortName?: string;
  targetGroupIds: string[];
  targetGroupNames: string[];
  targetAudienceRole: 'trainee' | 'instructor' | 'all';
  recipientSnapshot: Array<{
    id: string;
    fullName: string;
    email: string;
    role: string;
    groupName?: string;
  }>;
  subject: string;
  body: string;
  templateId?: string;
  notes?: string;
}): { success: boolean; item?: MassEmailQueueItem; error?: string } => {
  if (!params.subject.trim() || !params.body.trim()) {
    return { success: false, error: 'E-posta konusu ve mesaj metni boş bırakılamaz.' };
  }

  if (params.recipientSnapshot.length === 0) {
    return { success: false, error: 'Seçili filtre kriterlerine uygun hedef alıcı bulunamadı.' };
  }

  const queue = getStoredEmailQueue();
  const now = new Date().toISOString();

  const newItem: MassEmailQueueItem = {
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdBy: params.createdBy,
    createdByName: params.createdByName,
    targetProgramId: params.targetProgramId,
    targetProgramTitle: params.targetProgramTitle,
    targetTermId: params.targetTermId,
    targetCohortName: params.targetCohortName,
    targetGroupIds: params.targetGroupIds,
    targetGroupNames: params.targetGroupNames,
    targetAudienceRole: params.targetAudienceRole,
    recipientSnapshot: params.recipientSnapshot,
    recipientCount: params.recipientSnapshot.length,
    subject: params.subject.trim(),
    body: params.body.trim(),
    templateId: params.templateId,
    status: 'queued_demo',
    createdAt: now,
    queuedAt: now,
    notes: params.notes || 'Toplu e-posta demo gönderim kuyruğuna alındı.',
  };

  queue.unshift(newItem);
  saveEmailQueueToStorage(queue);

  return { success: true, item: newItem };
};

/**
 * Demo kuyruk işlemini simüle eder (Processed in Simulation).
 * "Toplu e-posta işlemi demo kuyruğunda işlendi. Hiçbir gerçek e-posta gönderilmedi."
 */
export const simulateProcessQueueItem = (
  queueItemId: string
): { success: boolean; item?: MassEmailQueueItem; error?: string } => {
  const queue = getStoredEmailQueue();
  const idx = queue.findIndex((q) => q.id === queueItemId);

  if (idx === -1) {
    return { success: false, error: 'Kuyruk kaydı bulunamadı.' };
  }

  const item = queue[idx];
  if (item.status === 'cancelled') {
    return { success: false, error: 'İptal edilmiş bir işlem işlenemez.' };
  }

  const now = new Date().toISOString();
  item.status = 'processed_in_simulation';
  item.simulatedAt = now;
  item.notes = 'Toplu e-posta işlemi demo kuyruğunda işlendi. Hiçbir gerçek e-posta gönderilmedi.';

  queue[idx] = item;
  saveEmailQueueToStorage(queue);

  return { success: true, item };
};

/**
 * Kuyruk kaydını iptal etme
 */
export const cancelMassEmailQueueItem = (
  queueItemId: string,
  cancellationReason: string
): { success: boolean; item?: MassEmailQueueItem; error?: string } => {
  const queue = getStoredEmailQueue();
  const idx = queue.findIndex((q) => q.id === queueItemId);

  if (idx === -1) {
    return { success: false, error: 'Kuyruk kaydı bulunamadı.' };
  }

  const item = queue[idx];
  item.status = 'cancelled';
  item.cancellationReason = cancellationReason.trim() || 'Yönetici talebiyle iptal edildi.';

  queue[idx] = item;
  saveEmailQueueToStorage(queue);

  return { success: true, item };
};

/**
 * Şablon güncelleme veya yeni şablon ekleme
 */
export const saveEmailTemplate = (
  template: MassEmailTemplate
): { success: boolean; template: MassEmailTemplate } => {
  const templates = getStoredEmailTemplates();
  const idx = templates.findIndex((t) => t.id === template.id);
  const now = new Date().toISOString();

  const updated: MassEmailTemplate = {
    ...template,
    updatedAt: now,
  };

  if (idx >= 0) {
    templates[idx] = updated;
  } else {
    templates.push(updated);
  }

  saveEmailTemplatesToStorage(templates);
  return { success: true, template: updated };
};

export const resetEmailStorage = (): void => {
  localStorage.setItem(EMAIL_TEMPLATES_STORAGE_KEY, JSON.stringify(INITIAL_EMAIL_TEMPLATES));
  localStorage.setItem(EMAIL_QUEUE_STORAGE_KEY, JSON.stringify(INITIAL_EMAIL_QUEUE));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EMAIL_TEMPLATES_UPDATE_EVENT, { detail: INITIAL_EMAIL_TEMPLATES })
    );
    window.dispatchEvent(
      new CustomEvent(EMAIL_QUEUE_UPDATE_EVENT, { detail: INITIAL_EMAIL_QUEUE })
    );
  }
};
