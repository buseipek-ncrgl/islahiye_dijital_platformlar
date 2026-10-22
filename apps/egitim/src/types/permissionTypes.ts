/**
 * Granüler İzin ve Yetkilendirme Veri Modelleri (Sprint E05-A)
 * İslahiye Ticaret Odası Eğitim Portalı
 *
 * Temel İlke:
 * 1. Açıkça tanımlanmamış yetki reddedilir (Deny by default).
 * 2. Rol ismi tek başına yetmez; program, dönem ve grup kapsamı gözetilir.
 * 3. Frontend kontrolleri sunucu güvenliği yerine geçmez (Simülasyon garantisi).
 */

import { UserRole } from './index';

// -----------------------------------------------------------------------------
// 1. İZİN KATEGORİLERİ VE GRANÜLER İZİN ANAHTARLARI
// -----------------------------------------------------------------------------

export type PermissionCategory =
  | 'applications'
  | 'operations'
  | 'assignments'
  | 'certificates'
  | 'communications'
  | 'governance';

export const PERMISSION_CATEGORIES: Record<PermissionCategory, string> = {
  applications: 'Başvuru ve Aday Yönetimi',
  operations: 'Eğitim Operasyonu',
  assignments: 'Ödev ve Başarı',
  certificates: 'Belge ve Sertifikasyon',
  communications: 'İletişim ve Duyurular',
  governance: 'Yönetişim ve Sistem',
};

export type PermissionKey =
  // Başvuru ve Aday Yönetimi
  | 'applications.view'
  | 'applications.submit'
  | 'applications.evaluate'
  | 'applications.decide'
  | 'criteria.manage'
  // Eğitim Operasyonu
  | 'programs.manage'
  | 'terms.manage'
  | 'groups.manage'
  | 'enrollments.confirm'
  | 'sessions.manage'
  | 'attendance.mark'
  | 'attendance.correct'
  // Ödev ve Başarı
  | 'assignments.create'
  | 'assignments.evaluate'
  | 'success.review'
  | 'success.approve'
  // Belge ve Sertifikasyon
  | 'certificates.issue'
  | 'certificates.cancel'
  | 'certificates.verify'
  // İletişim ve Duyurular
  | 'channels.manage'
  | 'announcements.publish'
  | 'massEmail.queueDemo'
  // Yönetişim ve Sistem
  | 'users.view'
  | 'roles.manage'
  | 'permissions.manage'
  | 'settings.manage'
  | 'audit.view'
  | 'reports.view';

export type PermissionScope = 'global' | 'program' | 'group' | 'self' | 'none';

export type RolePermissionMatrix = Record<UserRole, Record<PermissionKey, PermissionScope>>;

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  description: string;
  category: PermissionCategory;
  categoryLabel: string;
  allowedScopes: PermissionScope[];
  isCritical: boolean; // Süper yönetici yetkisi gerektiren kritik işlemler
}

// -----------------------------------------------------------------------------
// 2. TÜM İZİNLERİN DETAYLI KATALOĞU
// -----------------------------------------------------------------------------

export const PERMISSION_DEFINITIONS: Record<PermissionKey, PermissionDefinition> = {
  // Başvuru ve Aday
  'applications.view': {
    key: 'applications.view',
    label: 'Başvuruları Görüntüleme',
    description: 'Eğitim başvurularını ve başvuru detaylarını inceleme yetkisi.',
    category: 'applications',
    categoryLabel: 'Başvuru ve Aday Yönetimi',
    allowedScopes: ['global', 'program', 'self'],
    isCritical: false,
  },
  'applications.submit': {
    key: 'applications.submit',
    label: 'Başvuru Yapma',
    description: 'Aday olarak eğitim programına resmi başvuru gönderme yetkisi.',
    category: 'applications',
    categoryLabel: 'Başvuru ve Aday Yönetimi',
    allowedScopes: ['self'],
    isCritical: false,
  },
  'applications.evaluate': {
    key: 'applications.evaluate',
    label: 'Başvuru Değerlendirme / Puanlama',
    description: 'Aday başvurularına kriter bazlı simülasyon puanı verme yetkisi.',
    category: 'applications',
    categoryLabel: 'Başvuru ve Aday Yönetimi',
    allowedScopes: ['global', 'program'],
    isCritical: false,
  },
  'applications.decide': {
    key: 'applications.decide',
    label: 'Nihai Başvuru Kararı Verme',
    description: 'Başvuru hakkında kabul, ret, yedek nihai kararını onaylama yetkisi.',
    category: 'applications',
    categoryLabel: 'Başvuru ve Aday Yönetimi',
    allowedScopes: ['global', 'program'],
    isCritical: true,
  },
  'criteria.manage': {
    key: 'criteria.manage',
    label: 'Başvuru Kriterlerini Yönetme',
    description: 'Başvuru değerlendirme kriter setlerini oluşturma, ağırlık belirleme ve sürümleme.',
    category: 'applications',
    categoryLabel: 'Başvuru ve Aday Yönetimi',
    allowedScopes: ['global'],
    isCritical: true,
  },

  // Eğitim Operasyonu
  'programs.manage': {
    key: 'programs.manage',
    label: 'Program Tanımlama ve Yönetme',
    description: 'Eğitim programı açma, içerik ve hedef kitle düzenleme.',
    category: 'operations',
    categoryLabel: 'Eğitim Operasyonu',
    allowedScopes: ['global'],
    isCritical: true,
  },
  'terms.manage': {
    key: 'terms.manage',
    label: 'Dönem ve Takvim Yönetimi',
    description: 'Eğitim dönemleri (Güz, Bahar) ve kontenjan dönemlerini yapılandırma.',
    category: 'operations',
    categoryLabel: 'Eğitim Operasyonu',
    allowedScopes: ['global'],
    isCritical: false,
  },
  'groups.manage': {
    key: 'groups.manage',
    label: 'Grup ve Kontenjan Yönetimi',
    description: 'Eğitim sınıfları oluşturma, eğitmen atama ve grup transferlerini yönetme.',
    category: 'operations',
    categoryLabel: 'Eğitim Operasyonu',
    allowedScopes: ['global', 'program'],
    isCritical: false,
  },
  'enrollments.confirm': {
    key: 'enrollments.confirm',
    label: 'Kesin Kayıt Onaylama',
    description: 'Kabul edilen adayların kesin kayıt evraklarını onaylayıp kursiyer yapma yetkisi.',
    category: 'operations',
    categoryLabel: 'Eğitim Operasyonu',
    allowedScopes: ['global', 'program'],
    isCritical: true,
  },
  'sessions.manage': {
    key: 'sessions.manage',
    label: 'Ders Oturumu Planlama',
    description: 'Ders oturumları oluşturma, saat/tarih değiştirme ve ders iptal etme.',
    category: 'operations',
    categoryLabel: 'Eğitim Operasyonu',
    allowedScopes: ['global', 'program', 'group'],
    isCritical: false,
  },
  'attendance.mark': {
    key: 'attendance.mark',
    label: 'Yoklama Alma (Manuel)',
    description: 'Ders oturumunda katıldı, katılmadı, mazeretli durumlarını işaretleme.',
    category: 'operations',
    categoryLabel: 'Eğitim Operasyonu',
    allowedScopes: ['group'],
    isCritical: false,
  },
  'attendance.correct': {
    key: 'attendance.correct',
    label: 'Kapanmış Yoklamayı Düzeltme',
    description: 'Kapanmış ders oturumunda gerekçe belirterek yoklama kaydını revize etme.',
    category: 'operations',
    categoryLabel: 'Eğitim Operasyonu',
    allowedScopes: ['global', 'group'],
    isCritical: true,
  },

  // Ödev ve Başarı
  'assignments.create': {
    key: 'assignments.create',
    label: 'Ödev Tanımlama ve Yayımlama',
    description: 'Gruba yeni ödev verme, son teslim tarihi ve zorunluluk durumu belirleme.',
    category: 'assignments',
    categoryLabel: 'Ödev ve Başarı Değerlendirmesi',
    allowedScopes: ['global', 'group'],
    isCritical: false,
  },
  'assignments.evaluate': {
    key: 'assignments.evaluate',
    label: 'Ödev Değerlendirme ve Notlama',
    description: 'Teslim edilen ödevleri inceleme, 0-100 puan verme ve revizyon talep etme.',
    category: 'assignments',
    categoryLabel: 'Ödev ve Başarı Değerlendirmesi',
    allowedScopes: ['global', 'group'],
    isCritical: false,
  },
  'success.review': {
    key: 'success.review',
    label: 'Dönem Sonu Başarı İncelemesi',
    description: '%80 devam ve 70/100 ödev ortalaması sağlayan adayların kütüğünü inceleme.',
    category: 'assignments',
    categoryLabel: 'Ödev ve Başarı Değerlendirmesi',
    allowedScopes: ['global', 'program', 'self'],
    isCritical: false,
  },
  'success.approve': {
    key: 'success.approve',
    label: 'Nihai Başarı Kararını Onaylama',
    description: 'Eğitim başarı kararını resmi olarak tescil etme yetkisi.',
    category: 'assignments',
    categoryLabel: 'Ödev ve Başarı Değerlendirmesi',
    allowedScopes: ['global', 'program'],
    isCritical: true,
  },

  // Belge ve Sertifikasyon
  'certificates.issue': {
    key: 'certificates.issue',
    label: 'Resmi Başarı Belgesi Düzenleme',
    description: 'Başarılı kursiyerler için numaralı, karekodlu PDF başarı belgesi basma.',
    category: 'certificates',
    categoryLabel: 'Belge ve Sertifikasyon',
    allowedScopes: ['global', 'program'],
    isCritical: true,
  },
  'certificates.cancel': {
    key: 'certificates.cancel',
    label: 'Düzenlenmiş Belgeyi İptal Etme',
    description: 'Hatalı veya geçersiz kılınan başarı belgesini gerekçeyle iptal etme.',
    category: 'certificates',
    categoryLabel: 'Belge ve Sertifikasyon',
    allowedScopes: ['global'],
    isCritical: true,
  },
  'certificates.verify': {
    key: 'certificates.verify',
    label: 'Belge Doğrulama (QR)',
    description: 'Karekod veya doğrulama kodu üzerinden kamuya açık belge sorgulama.',
    category: 'certificates',
    categoryLabel: 'Belge ve Sertifikasyon',
    allowedScopes: ['global'],
    isCritical: false,
  },

  // İletişim ve Duyurular
  'channels.manage': {
    key: 'channels.manage',
    label: 'Grup Kanallarını Yönetme',
    description: 'Sınıf tartışma ve duyuru kanallarını oluşturma, arşivleme veya kapatma.',
    category: 'communications',
    categoryLabel: 'İletişim ve Duyurular',
    allowedScopes: ['global', 'group'],
    isCritical: false,
  },
  'announcements.publish': {
    key: 'announcements.publish',
    label: 'Kurumsal Duyuru Yayımlama',
    description: 'Hedef kitle bazlı genel kurumsal duyuruları hazırlama ve yayımlama.',
    category: 'communications',
    categoryLabel: 'İletişim ve Duyurular',
    allowedScopes: ['global', 'group'],
    isCritical: false,
  },
  'massEmail.queueDemo': {
    key: 'massEmail.queueDemo',
    label: 'Toplu E-Posta Simülasyonu',
    description: 'Şablon seçip alıcı türeterek demo gönderim kuyruğuna ekleme ve işletme.',
    category: 'communications',
    categoryLabel: 'İletişim ve Duyurular',
    allowedScopes: ['global'],
    isCritical: true,
  },

  // Yönetişim ve Sistem
  'users.view': {
    key: 'users.view',
    label: 'Kullanıcı Listesini İnceleme',
    description: 'Sentetik demo kullanıcılarını, rollerini ve kapsamlarını listeleme.',
    category: 'governance',
    categoryLabel: 'Yönetişim ve Sistem Masası',
    allowedScopes: ['global'],
    isCritical: false,
  },
  'roles.manage': {
    key: 'roles.manage',
    label: 'Rol ve Yetki Atama',
    description: 'Kullanıcılara demo rolleri atama, kaldırma veya durumunu değiştirme.',
    category: 'governance',
    categoryLabel: 'Yönetişim ve Sistem Masası',
    allowedScopes: ['global'],
    isCritical: true,
  },
  'permissions.manage': {
    key: 'permissions.manage',
    label: 'Granüler İzin Matrisini Düzenleme',
    description: 'Rollerin varsayılan yetki ve kapsam matrisini değiştirme (Yalnızca Süper Admin).',
    category: 'governance',
    categoryLabel: 'Yönetişim ve Sistem Masası',
    allowedScopes: ['global'],
    isCritical: true,
  },
  'settings.manage': {
    key: 'settings.manage',
    label: 'Kritik Sistem Ayarlarını Yönetme',
    description: 'Devam politikası, başarı eşikleri ve doğrulama URL ayarlarını sürümleme.',
    category: 'governance',
    categoryLabel: 'Yönetişim ve Sistem Masası',
    allowedScopes: ['global'],
    isCritical: true,
  },
  'audit.view': {
    key: 'audit.view',
    label: 'Merkezi Denetim Kayıtlarını İnceleme',
    description: 'Sistemde gerçekleşen kritik işlemlerin değiştirilemez denetim geçmişini görme.',
    category: 'governance',
    categoryLabel: 'Yönetişim ve Sistem Masası',
    allowedScopes: ['global'],
    isCritical: false,
  },
  'reports.view': {
    key: 'reports.view',
    label: 'Operasyonel Raporlama ve Dışa Aktarım',
    description: 'Başvuru, devam, ödev ve başarı metriklerini raporlama ve CSV alma.',
    category: 'governance',
    categoryLabel: 'Yönetişim ve Sistem Masası',
    allowedScopes: ['global', 'program'],
    isCritical: false,
  },
};

// -----------------------------------------------------------------------------
// 3. ROLLER İÇİN VARSAYILAN İZİN MATRİSİ (Default Role Matrix)
// -----------------------------------------------------------------------------

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Record<PermissionKey, PermissionScope>> = {
  // Ziyaretçi: Yalnızca kamuya açık katalog ve belge doğrulama
  visitor: {
    'applications.view': 'none',
    'applications.submit': 'none',
    'applications.evaluate': 'none',
    'applications.decide': 'none',
    'criteria.manage': 'none',
    'programs.manage': 'none',
    'terms.manage': 'none',
    'groups.manage': 'none',
    'enrollments.confirm': 'none',
    'sessions.manage': 'none',
    'attendance.mark': 'none',
    'attendance.correct': 'none',
    'assignments.create': 'none',
    'assignments.evaluate': 'none',
    'success.review': 'none',
    'success.approve': 'none',
    'certificates.issue': 'none',
    'certificates.cancel': 'none',
    'certificates.verify': 'global',
    'channels.manage': 'none',
    'announcements.publish': 'none',
    'massEmail.queueDemo': 'none',
    'users.view': 'none',
    'roles.manage': 'none',
    'permissions.manage': 'none',
    'settings.manage': 'none',
    'audit.view': 'none',
    'reports.view': 'none',
  },

  // Aday: Kendi başvurusunu görme, başvuru yapma ve belge sorgulama
  applicant: {
    'applications.view': 'self',
    'applications.submit': 'self',
    'applications.evaluate': 'none',
    'applications.decide': 'none',
    'criteria.manage': 'none',
    'programs.manage': 'none',
    'terms.manage': 'none',
    'groups.manage': 'none',
    'enrollments.confirm': 'none',
    'sessions.manage': 'none',
    'attendance.mark': 'none',
    'attendance.correct': 'none',
    'assignments.create': 'none',
    'assignments.evaluate': 'none',
    'success.review': 'self',
    'success.approve': 'none',
    'certificates.issue': 'none',
    'certificates.cancel': 'none',
    'certificates.verify': 'global',
    'channels.manage': 'none',
    'announcements.publish': 'none',
    'massEmail.queueDemo': 'none',
    'users.view': 'none',
    'roles.manage': 'none',
    'permissions.manage': 'none',
    'settings.manage': 'none',
    'audit.view': 'none',
    'reports.view': 'none',
  },

  // Kursiyer: Kendi kayıtları, dersleri, ödev teslimi, kendi başarı durumu
  trainee: {
    'applications.view': 'self',
    'applications.submit': 'none',
    'applications.evaluate': 'none',
    'applications.decide': 'none',
    'criteria.manage': 'none',
    'programs.manage': 'none',
    'terms.manage': 'none',
    'groups.manage': 'none',
    'enrollments.confirm': 'none',
    'sessions.manage': 'none',
    'attendance.mark': 'none',
    'attendance.correct': 'none',
    'assignments.create': 'none',
    'assignments.evaluate': 'none',
    'success.review': 'self',
    'success.approve': 'none',
    'certificates.issue': 'none',
    'certificates.cancel': 'none',
    'certificates.verify': 'global',
    'channels.manage': 'none',
    'announcements.publish': 'none',
    'massEmail.queueDemo': 'none',
    'users.view': 'none',
    'roles.manage': 'none',
    'permissions.manage': 'none',
    'settings.manage': 'none',
    'audit.view': 'none',
    'reports.view': 'none',
  },

  // Eğitmen: Yalnızca atanmış grupları için ders, yoklama, ödev oluşturma/notlama, kanal
  instructor: {
    'applications.view': 'none',
    'applications.submit': 'none',
    'applications.evaluate': 'none',
    'applications.decide': 'none',
    'criteria.manage': 'none',
    'programs.manage': 'none',
    'terms.manage': 'none',
    'groups.manage': 'none',
    'enrollments.confirm': 'none',
    'sessions.manage': 'group',
    'attendance.mark': 'group',
    'attendance.correct': 'group',
    'assignments.create': 'group',
    'assignments.evaluate': 'group',
    'success.review': 'group',
    'success.approve': 'none',
    'certificates.issue': 'none',
    'certificates.cancel': 'none',
    'certificates.verify': 'global',
    'channels.manage': 'group',
    'announcements.publish': 'group',
    'massEmail.queueDemo': 'none',
    'users.view': 'none',
    'roles.manage': 'none',
    'permissions.manage': 'none',
    'settings.manage': 'none',
    'audit.view': 'none',
    'reports.view': 'none',
  },

  // Standart Yönetici (Admin): Tüm eğitim operasyonları ve karar masaları; ancak kritik süper admin ayarları kısıtlı
  admin: {
    'applications.view': 'global',
    'applications.submit': 'none',
    'applications.evaluate': 'global',
    'applications.decide': 'global',
    'criteria.manage': 'global',
    'programs.manage': 'global',
    'terms.manage': 'global',
    'groups.manage': 'global',
    'enrollments.confirm': 'global',
    'sessions.manage': 'global',
    'attendance.mark': 'global',
    'attendance.correct': 'global',
    'assignments.create': 'global',
    'assignments.evaluate': 'global',
    'success.review': 'global',
    'success.approve': 'global',
    'certificates.issue': 'global',
    'certificates.cancel': 'global',
    'certificates.verify': 'global',
    'channels.manage': 'global',
    'announcements.publish': 'global',
    'massEmail.queueDemo': 'global',
    'users.view': 'global',
    'roles.manage': 'none', // Standart admin süper admin veya üst rol atayamaz
    'permissions.manage': 'none', // İzin matrisi düzenleme yetkisi YOK
    'settings.manage': 'none', // Kritik sistem ayarlarını değiştirme yetkisi YOK
    'audit.view': 'global',
    'reports.view': 'global',
  },

  // Süper Yönetici: Eksiksiz tam yetki (İzin matrisi, kritik ayarlar, rol atama dahil)
  superadmin: {
    'applications.view': 'global',
    'applications.submit': 'none',
    'applications.evaluate': 'global',
    'applications.decide': 'global',
    'criteria.manage': 'global',
    'programs.manage': 'global',
    'terms.manage': 'global',
    'groups.manage': 'global',
    'enrollments.confirm': 'global',
    'sessions.manage': 'global',
    'attendance.mark': 'global',
    'attendance.correct': 'global',
    'assignments.create': 'global',
    'assignments.evaluate': 'global',
    'success.review': 'global',
    'success.approve': 'global',
    'certificates.issue': 'global',
    'certificates.cancel': 'global',
    'certificates.verify': 'global',
    'channels.manage': 'global',
    'announcements.publish': 'global',
    'massEmail.queueDemo': 'global',
    'users.view': 'global',
    'roles.manage': 'global',
    'permissions.manage': 'global',
    'settings.manage': 'global',
    'audit.view': 'global',
    'reports.view': 'global',
  },
};
