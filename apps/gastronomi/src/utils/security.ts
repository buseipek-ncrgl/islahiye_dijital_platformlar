/**
 * İslahiye Gastronomi Portalı — Güvenlik ve Girdi Temizleme Yardımcıları
 * 
 * Bu modül; URL doğrulama, XSS / protokol enjeksiyonu önleme,
 * CSS URL temizleme ve LocalStorage deserialization (prototype pollution)
 * korumalarını merkezileştirir.
 */

/**
 * Güvenli URL Şemaları: yalnızca http, https, mailto, tel ve güvenli göreli yollar
 */
const SAFE_URL_PATTERN = /^(https?:|mailto:|tel:|\/|#)/i;
const DANGEROUS_PROTOCOLS = /^(javascript|vbscript|data|file):/i;

/**
 * Kullanıcı, admin veya API kaynaklı harici URL'leri doğrular ve temizler.
 * javascript: veya vbscript: gibi zararlı protokolleri engelleyerek boş string döner.
 */
export function sanitizeUrl(url: unknown, fallback = ''): string {
  if (typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  // Tehlikeli protokol tespiti
  if (DANGEROUS_PROTOCOLS.test(trimmed)) {
    console.warn('[Security] Potansiyel zararlı URL şeması engellendi:', trimmed.slice(0, 30));
    return fallback;
  }

  // Güvenli protokol veya geçerli göreli yol kontrolü
  if (SAFE_URL_PATTERN.test(trimmed)) {
    return trimmed;
  }

  // Protokol belirtilmemişse (örn: www.islahiye.bel.tr) https ekleyerek dönüştür
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return fallback;
}

/**
 * Dış bağlantının geçerli bir HTTP/HTTPS bağlantısı olup olmadığını kontrol eder.
 */
export function isSafeExternalUrl(url: unknown): boolean {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  return /^https?:\/\/[a-zA-Z0-9.-]+/i.test(trimmed);
}

/**
 * CSS background-image: url('...') içerisinde kullanılacak görsel URL'lerini
 * CSS kaçış / break-out (tırnak, ters eğik çizgi, parantez) saldırılarına karşı temizler.
 */
export function sanitizeCssUrl(url: unknown, fallback = '/images/islahiye_tava.jpg'): string {
  if (typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  // Tehlikeli şema kontrolü
  if (DANGEROUS_PROTOCOLS.test(trimmed) && !trimmed.startsWith('data:image/')) {
    return fallback;
  }

  // CSS injection için kullanılan tehlikeli karakterleri kaldır/kaçır: ', ", \, (, )
  const sanitized = trimmed.replace(/['"\\()]/g, '');

  if (
    sanitized.startsWith('/') ||
    sanitized.startsWith('http://') ||
    sanitized.startsWith('https://') ||
    sanitized.startsWith('data:image/')
  ) {
    return sanitized;
  }

  return fallback;
}

/**
 * HTML karakter kaçışı (Leaflet marker html ve tooltip metinleri için)
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Prototype Pollution korumalı güvenli JSON ayrıştırıcı.
 * LocalStorage veya harici veriden gelen nesnelerdeki __proto__, constructor ve prototype
 * anahtarlarını silerek nesne prototipinin zehirlenmesini önler.
 */
export function safeJsonParse<T>(rawJson: string | null | undefined, fallback: T): T {
  if (!rawJson || typeof rawJson !== 'string') return fallback;

  try {
    const parsed = JSON.parse(rawJson, (key, value) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        console.warn(`[Security] Potansiyel Prototype Pollution anahtarı filtrelendi: ${key}`);
        return undefined;
      }
      return value;
    });

    return parsed !== null && parsed !== undefined ? (parsed as T) : fallback;
  } catch (err) {
    console.warn('[Security] JSON parse hatası, varsayılan duruma dönülüyor:', err);
    return fallback;
  }
}

/**
 * API Base URL doğrulama ve normalizasyonu.
 * Trailing slash'leri temizler, geçersiz protokolleri güvenli varsayılana çeker.
 */
export function validateApiBaseUrl(
  rawUrl: string | undefined | null,
  defaultUrl = 'http://localhost:5235'
): string {
  if (!rawUrl || typeof rawUrl !== 'string') return defaultUrl;
  const trimmed = rawUrl.trim().replace(/\/+$/, '');

  // Sadece http://, https:// veya göreli /api kabul edilir
  if (/^https?:\/\/[a-zA-Z0-9.-]+(:[0-9]+)?(\/.*)?$/i.test(trimmed) || trimmed.startsWith('/')) {
    // Tarayıcı HTTPS üzerinden çalışırken API'nin HTTP olması durumunda Mixed Content uyarısı ver
    if (
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      trimmed.startsWith('http://') &&
      !trimmed.includes('localhost') &&
      !trimmed.includes('127.0.0.1')
    ) {
      console.warn(
        '[Security] HTTPS sayfasından güvensiz HTTP API çağrısı Mixed Content engeline takılabilir:',
        trimmed
      );
    }
    return trimmed;
  }

  return defaultUrl;
}

/**
 * Yönetim Paneli Yetkilendirme Oturum Anahtarı (sessionStorage)
 */
export const AUTH_STORAGE_KEY = 'islahiye_admin_auth_session_v1';

const SESSION_INTEGRITY_SALT = 'islahiye_tamper_proof_auth_salt_2026';

/**
 * Oturum verisi için kurumsal imza üretir.
 * Storage üzerinden manuel manipülasyonları tespit etmek için kullanılır.
 */
export function computeSessionSignature(username: string, role: string, timestamp: number): string {
  const payload = `${username}:${role}:${timestamp}:${SESSION_INTEGRITY_SALT}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `sig_${Math.abs(hash).toString(36)}_${(timestamp ^ 0x4a4a4a).toString(36)}`;
}

/**
 * Oturum imzasını, zaman damgasını ve kullanıcı yetki sınırını doğrular.
 */
export function verifySessionSignature(session: any): boolean {
  if (!session || typeof session !== 'object') return false;
  const { username, role, timestamp, signature, isAuthenticated } = session;

  if (!isAuthenticated || !username || !role || !timestamp || !signature) {
    return false;
  }

  // Yalnızca yetkili kurumsal kullanıcı adları kabul edilir
  if (!['admin', 'yonetici', 'editor'].includes(username)) {
    return false;
  }

  // Oturum zaman aşımı denetimi (Maksimum 4 saatlik oturum)
  const now = Date.now();
  if (timestamp > now + 60000 || now - timestamp > 4 * 60 * 60 * 1000) {
    return false;
  }

  const expectedSignature = computeSessionSignature(username, role, timestamp);
  return signature === expectedSignature;
}

/**
 * Kullanıcının aktif, doğrulanmış ve manipüle edilmemiş bir yönetim oturumuna sahip olup olmadığını sorgular.
 * React dışındaki servislerden (örn: gastronomyApiClient, contentStore) çağrılabilir.
 * Storage üzerinde kurcalama (tampering) tespit edilirse oturum derhal temizlenir ve erişim engellenir.
 */
export function isCurrentAdminAuthorized(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw);

    const isValid = verifySessionSignature(session);
    if (!isValid) {
      console.warn('[Security] Geçersiz veya tahrif edilmiş (tampered) yönetim oturumu tespit edildi, oturum sıfırlanıyor.');
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

