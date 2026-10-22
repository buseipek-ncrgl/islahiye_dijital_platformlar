/**
 * Merkezi Denetim Kayıtları Servisi (Sprint E05-A)
 * İslahiye Ticaret Odası Eğitim Portalı
 *
 * Denetim Güvenilirliği ve Mahremiyet İlkeleri:
 * 1. Tüm kritik işlemler (kararlar, kayıtlar, transferler, yoklama düzeltmeleri,
 *    ödev değerlendirmeleri, belgeler, rol/ayar değişiklikleri) loglanır.
 * 2. Parola, T.C. kimlik numarası, özel mesaj metni ve gizli yönetici notları
 *    kesinlikle denetim kayıtlarına yazılmaz (Privacy Sanitizer).
 * 3. Frontend simülasyonudur; localStorage tabanlıdır. Üretim düzeyinde
 *    sunucu tarafı WORM (Write Once Read Many) kaydı gerekeceği belgelenir.
 */

import {
  AuditLog,
  AuditFilterOptions,
} from '../types';

const AUDIT_STORAGE_KEY = 'islahiye_education_audit_logs_v1';
export const AUDIT_UPDATE_EVENT = 'islahiye_audit_logs_updated';

// -----------------------------------------------------------------------------
// 1. BAŞLANGIÇ SENTETİK DENETİM KAYITLARI (Seed Audit Trail)
// -----------------------------------------------------------------------------

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-001',
    eventId: 'evt-aud-seed-01',
    actorId: 'user-superadmin-01',
    actorRole: 'superadmin',
    actorName: 'Kemal Ertürk',
    action: 'criteria.version_published',
    resourceType: 'criteria',
    resourceId: 'crit-v1',
    resourceTitle: '2026 Güz Dönemi Başvuru Kriter Seti (v1.0)',
    timestamp: '2026-08-10T09:00:00.000Z',
    reason: 'Yeni eğitim dönemi için ağırlıklı puanlama kriterleri resmi olarak yürürlüğe alındı.',
    previousStateSummary: 'Taslak Kriter Seti',
    nextStateSummary: 'Yayında (v1.0 - 4 Kriter, Eşik: 60 Puan)',
    correlationId: 'corr-init-01',
    sourceModule: 'criteriaRepository',
    outcome: 'success',
  },
  {
    id: 'audit-002',
    eventId: 'evt-aud-seed-02',
    actorId: 'user-applicant-01',
    actorRole: 'applicant',
    actorName: 'Fatma Şahin',
    action: 'application.created',
    resourceType: 'application',
    resourceId: 'app-seed-fatma',
    resourceTitle: 'İslahiye Biberi & Tarımsal E-Ticaret Başvurusu',
    timestamp: '2026-08-20T14:22:00.000Z',
    reason: 'Aday tarafından çevrim içi başvuru formu dolduruldu.',
    previousStateSummary: 'Başvuru Yok',
    nextStateSummary: 'İnceleniyor (Referans: REF-2026-001)',
    correlationId: 'corr-app-fatma',
    sourceModule: 'applicationStorage',
    outcome: 'success',
  },
  {
    id: 'audit-003',
    eventId: 'evt-aud-seed-03',
    actorId: 'user-admin-01',
    actorRole: 'admin',
    actorName: 'Selin Aydın',
    action: 'application.accepted',
    resourceType: 'application',
    resourceId: 'app-seed-ayse',
    resourceTitle: 'Ayşe Demir - Dış Ticaret Başvurusu',
    timestamp: '2026-08-28T11:15:00.000Z',
    reason: 'Puanlama kriterlerini ve kontenjan şartlarını başarıyla sağladı.',
    previousStateSummary: 'İnceleniyor (Puan: 84/100)',
    nextStateSummary: 'Kabul Edildi - Kesin Kayıt Daveti Gönderildi',
    correlationId: 'corr-dec-ayse',
    sourceModule: 'applicationStorage',
    outcome: 'success',
  },
  {
    id: 'audit-004',
    eventId: 'evt-aud-seed-04',
    actorId: 'user-admin-01',
    actorRole: 'admin',
    actorName: 'Selin Aydın',
    action: 'enrollment.confirmed',
    resourceType: 'enrollment',
    resourceId: 'enr-trainee-01',
    resourceTitle: 'Ayşe Demir - Kesin Kayıt Onayı',
    timestamp: '2026-09-01T10:00:00.000Z',
    reason: 'Ön kayıt evrakları ve taahhütname incelenerek onaylandı.',
    previousStateSummary: 'Kabul Edildi (Kesin Kayıt Bekleniyor)',
    nextStateSummary: 'Kesin Kayıtlı (Öğrenci Paneli Aktif)',
    correlationId: 'corr-enr-ayse',
    sourceModule: 'enrollmentStorage',
    outcome: 'success',
  },
  {
    id: 'audit-005',
    eventId: 'evt-aud-seed-05',
    actorId: 'user-admin-01',
    actorRole: 'admin',
    actorName: 'Selin Aydın',
    action: 'group.trainee_assigned',
    resourceType: 'group',
    resourceId: 'grp-01',
    resourceTitle: 'Grup A (Hafta İçi Öğleden Sonra)',
    timestamp: '2026-09-02T14:30:00.000Z',
    reason: 'Kursiyer tercihi ve kontenjan durumuna göre sınıfa yerleştirildi.',
    previousStateSummary: 'Atamasız Kursiyer',
    nextStateSummary: 'Grup A Aktif Kursiyeri (Sıra: 1)',
    correlationId: 'corr-grp-ayse',
    sourceModule: 'enrollmentStorage',
    outcome: 'success',
  },
  {
    id: 'audit-006',
    eventId: 'evt-aud-seed-06',
    actorId: 'user-instructor-01',
    actorRole: 'instructor',
    actorName: 'Murat Özkan',
    action: 'attendance.taken',
    resourceType: 'attendance',
    resourceId: 'sess-01',
    resourceTitle: '1. Oturum: E-Ticaret Temelleri Yoklaması',
    timestamp: '2026-10-10T17:05:00.000Z',
    reason: 'Ders bitiminde sınıf mevcudu manuel olarak yoklandı.',
    previousStateSummary: 'Yoklama Açık',
    nextStateSummary: 'Yoklama Kapatıldı (18 Katıldı, 1 Mazeretli, 1 Katılmadı)',
    correlationId: 'corr-att-s01',
    sourceModule: 'sessionStorage',
    outcome: 'success',
  },
  {
    id: 'audit-007',
    eventId: 'evt-aud-seed-07',
    actorId: 'user-admin-01',
    actorRole: 'admin',
    actorName: 'Selin Aydın',
    action: 'attendance.corrected',
    resourceType: 'attendance',
    resourceId: 'sess-01',
    resourceTitle: 'Ayşe Demir - Yoklama Düzeltmesi',
    timestamp: '2026-10-11T09:30:00.000Z',
    reason: 'Resmi sağlık raporu ibraz edildiği için "katılmadı" durumu "mazeretli" olarak revize edildi.',
    previousStateSummary: 'Katılmadı',
    nextStateSummary: 'Mazeretli (Rapor No: 2026/841)',
    correlationId: 'corr-att-corr-01',
    sourceModule: 'sessionStorage',
    outcome: 'success',
  },
  {
    id: 'audit-008',
    eventId: 'evt-aud-seed-08',
    actorId: 'user-instructor-01',
    actorRole: 'instructor',
    actorName: 'Murat Özkan',
    action: 'assignment.evaluated',
    resourceType: 'evaluation',
    resourceId: 'asg-01',
    resourceTitle: 'Ödev 1: Mağaza Kurulum Raporu',
    timestamp: '2026-10-14T16:00:00.000Z',
    reason: 'Kursiyer teslimi incelendi ve kriterlere göre puanlandı.',
    previousStateSummary: 'Değerlendirme Bekliyor',
    nextStateSummary: 'Onaylandı (Puan: 88/100)',
    correlationId: 'corr-asg-eval-01',
    sourceModule: 'assignmentStorage',
    outcome: 'success',
  },
  {
    id: 'audit-009',
    eventId: 'evt-aud-seed-09',
    actorId: 'user-admin-01',
    actorRole: 'admin',
    actorName: 'Selin Aydın',
    action: 'success.approved',
    resourceType: 'success_decision',
    resourceId: 'dec-01',
    resourceTitle: 'Ayşe Demir - Dönem Sonu Başarı Onayı',
    timestamp: '2026-10-15T09:30:00.000Z',
    reason: '%85 devam ve 88 ödev ortalaması ile tüm şartlar sağlandı.',
    previousStateSummary: 'Akademik İnceleme Tamamlandı',
    nextStateSummary: 'Nihai Başarı Onayı Verildi (Belge Basılabilir)',
    correlationId: 'corr-succ-ayse',
    sourceModule: 'successDecisionStorage',
    outcome: 'success',
  },
  {
    id: 'audit-010',
    eventId: 'evt-aud-seed-10',
    actorId: 'user-admin-01',
    actorRole: 'admin',
    actorName: 'Selin Aydın',
    action: 'certificate.generated',
    resourceType: 'certificate',
    resourceId: 'cert-01',
    resourceTitle: 'İE-2026-0001 Numaralı Eğitim Başarı Belgesi',
    timestamp: '2026-10-15T10:00:00.000Z',
    reason: 'Onaylanan başarı kararına istinaden karekodlu resmi demo PDF belgesi basıldı.',
    previousStateSummary: 'Belge Düzenlenmedi',
    nextStateSummary: 'Geçerli Belge (Kod: V-2026-IEK01-DEMO)',
    correlationId: 'corr-cert-ayse',
    sourceModule: 'certificateStorage',
    outcome: 'success',
  },
];

// -----------------------------------------------------------------------------
// 2. MAHREMİYET TEMİZLEYİCİSİ (Privacy Sanitizer)
// -----------------------------------------------------------------------------

const sanitizeLogText = (text?: string): string | undefined => {
  if (!text) return text;
  let sanitized = text;
  // Parola, gizli not, T.C. kimlik numarası kalıplarını maskele
  sanitized = sanitized.replace(/\b[1-9]\d{10}\b/g, '[TCKN MASKELENDİ]');
  sanitized = sanitized.replace(/(password|parola|şifre|secret)\s*[:=]\s*\S+/gi, '$1: [GİZLENDİ]');
  sanitized = sanitized.replace(/GİZLİ NOT[:\s]*.*$/gi, '[ÖZEL NOT ARINDIRILDI]');
  return sanitized;
};

// -----------------------------------------------------------------------------
// 3. STORAGE OKUMA VE YAZMA
// -----------------------------------------------------------------------------

export const getStoredAuditLogs = (filterOptions?: AuditFilterOptions): AuditLog[] => {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    let logs: AuditLog[] = INITIAL_AUDIT_LOGS;

    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        logs = parsed;
      }
    } else {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
    }

    if (!filterOptions) {
      return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    return logs
      .filter((log) => {
        if (filterOptions.resourceType && filterOptions.resourceType !== 'all') {
          if (log.resourceType !== filterOptions.resourceType) return false;
        }
        if (filterOptions.actorRole && filterOptions.actorRole !== 'all') {
          if (log.actorRole !== filterOptions.actorRole) return false;
        }
        if (filterOptions.outcome && filterOptions.outcome !== 'all') {
          if (log.outcome !== filterOptions.outcome) return false;
        }
        if (filterOptions.searchQuery) {
          const q = filterOptions.searchQuery.toLowerCase();
          const matchTitle = log.resourceTitle?.toLowerCase().includes(q);
          const matchActor = log.actorName.toLowerCase().includes(q);
          const matchReason = log.reason?.toLowerCase().includes(q);
          const matchAction = log.action.toLowerCase().includes(q);
          if (!matchTitle && !matchActor && !matchReason && !matchAction) return false;
        }
        if (filterOptions.startDate) {
          if (new Date(log.timestamp) < new Date(filterOptions.startDate)) return false;
        }
        if (filterOptions.endDate) {
          if (new Date(log.timestamp) > new Date(filterOptions.endDate)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.error('Audit logs read error:', err);
    return INITIAL_AUDIT_LOGS;
  }
};

const saveAuditLogsToStorage = (logs: AuditLog[]): void => {
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUDIT_UPDATE_EVENT, { detail: logs }));
    }
  } catch (err) {
    console.error('Audit logs write error:', err);
  }
};

// -----------------------------------------------------------------------------
// 4. DENETİM KAYDI OLUŞTURMA (Non-blocking & Sanitized)
// -----------------------------------------------------------------------------

export const recordAuditLog = (
  params: Omit<AuditLog, 'id' | 'timestamp' | 'eventId'> & {
    id?: string;
    timestamp?: string;
    eventId?: string;
  }
): AuditLog => {
  try {
    const logs = getStoredAuditLogs();
    const now = params.timestamp || new Date().toISOString();
    const id = params.id || `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const eventId = params.eventId || `evt-aud-${Date.now()}`;

    const newLog: AuditLog = {
      ...params,
      id,
      eventId,
      timestamp: now,
      reason: sanitizeLogText(params.reason),
      previousStateSummary: sanitizeLogText(params.previousStateSummary),
      nextStateSummary: sanitizeLogText(params.nextStateSummary),
    };

    logs.unshift(newLog);
    saveAuditLogsToStorage(logs);
    return newLog;
  } catch (err) {
    console.warn('Audit log write error caught safely:', err);
    // Hata fırlatılmaz, ana akış kesintiye uğramaz
    return {
      ...params,
      id: `audit-fallback-${Date.now()}`,
      eventId: `evt-fallback-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
  }
};

// -----------------------------------------------------------------------------
// 5. CSV DIŞA AKTARIM (UTF-8 BOM ile Türkçe Karakter Uyumlu)
// -----------------------------------------------------------------------------

export const exportAuditLogsToCSV = (logs: AuditLog[]): string => {
  const headers = [
    'Kayıt No',
    'Tarih & Saat',
    'İşlem Yapan',
    'Rol',
    'İşlem Türü',
    'Kaynak Türü',
    'Kaynak Başlığı / ID',
    'Önceki Durum',
    'Sonraki Durum',
    'Gerekçe / Açıklama',
    'Sonuç',
    'Modül',
  ];

  const rows = logs.map((log) => [
    log.id,
    new Date(log.timestamp).toLocaleString('tr-TR'),
    `"${log.actorName.replace(/"/g, '""')}"`,
    log.actorRole,
    log.action,
    log.resourceType,
    `"${(log.resourceTitle || log.resourceId).replace(/"/g, '""')}"`,
    `"${(log.previousStateSummary || '').replace(/"/g, '""')}"`,
    `"${(log.nextStateSummary || '').replace(/"/g, '""')}"`,
    `"${(log.reason || '').replace(/"/g, '""')}"`,
    log.outcome,
    log.sourceModule,
  ]);

  const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  return '\uFEFF' + csvContent; // UTF-8 BOM for Excel compatibility
};

// -----------------------------------------------------------------------------
// 6. ABONELİK VE SIFIRLAMA
// -----------------------------------------------------------------------------

export const subscribeToAuditUpdates = (callback: (logs: AuditLog[]) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback(getStoredAuditLogs());
  window.addEventListener(AUDIT_UPDATE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(AUDIT_UPDATE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};

export const subscribeToAuditLogUpdates = subscribeToAuditUpdates;

export const resetAuditStorage = (): void => {
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUDIT_UPDATE_EVENT, { detail: INITIAL_AUDIT_LOGS }));
  }
};
