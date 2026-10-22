import { AuthAdapter, AuthResult, LoginCredentials, RegisterCredentials, UserProfile, UserRole } from '../types';
import { DEMO_USERS } from '../data/educationData';

const CURRENT_USER_STORAGE_KEY = 'islahiye_current_auth_user_v1';

/**
 * 1. DEMO AUTH ADAPTER
 * Kurumsal demo ve sunum ortamı için sentetik kullanıcı hesaplarıyla çalışır.
 * Güvenlik iddiası taşımaz; tarayıcı yerel durumunda simüle eder.
 */
export class DemoAuthAdapter implements AuthAdapter {
  private demoAccounts: Record<string, UserProfile> = {
    // E-posta ve kullanıcı adı eşleştirmeleri
    'fatma.sahin@ornek.com': DEMO_USERS.applicant,
    'fatma.sahin@islahiye-dijital.org': DEMO_USERS.applicant,
    'aday': DEMO_USERS.applicant,
    'fatma': DEMO_USERS.applicant,

    'ayse.demir@ornek.com': DEMO_USERS.trainee,
    'ayse.demir@islahiye-dijital.org': DEMO_USERS.trainee,
    'kursiyer': DEMO_USERS.trainee,
    'ayse': DEMO_USERS.trainee,

    'murat.ozkan@ornek.com': DEMO_USERS.instructor,
    'murat.ozkan@islahiye-dijital.org': DEMO_USERS.instructor,
    'egitmen': DEMO_USERS.instructor,
    'murat': DEMO_USERS.instructor,

    'selin.aydin@ornek.com': DEMO_USERS.admin,
    'selin.aydin@islahiye-dijital.org': DEMO_USERS.admin,
    'yonetici': DEMO_USERS.admin,
    'admin': DEMO_USERS.admin,

    'kemal.erturk@ornek.com': DEMO_USERS.superadmin,
    'kemal.erturk@islahiye-dijital.org': DEMO_USERS.superadmin,
    'superadmin': DEMO_USERS.superadmin,
    'kemal': DEMO_USERS.superadmin,
  };

  public async login(credentials: LoginCredentials): Promise<AuthResult> {
    const key = credentials.emailOrUsername.trim().toLowerCase();
    const matchedUser = this.demoAccounts[key];

    if (!matchedUser) {
      return {
        success: false,
        isDemoSimulation: true,
        error: 'Geçersiz e-posta veya kullanıcı adı. Demo ortamında listelenen kurumsal test hesaplarını veya hazır profil seçiciyi kullanabilirsiniz.',
      };
    }

    // Demo ortamında şifre doğrulaması semboliktir fakat boş geçilmemesi beklenir
    if (credentials.password !== undefined && credentials.password.length > 0 && credentials.password.length < 3) {
      return {
        success: false,
        isDemoSimulation: true,
        error: 'Şifre alanı en az 3 karakter olmalıdır.',
      };
    }

    try {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(matchedUser));
      // Demo Role Context senkronizasyonu için event tetikle
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth_user_changed', { detail: matchedUser }));
      }
    } catch (e) {
      console.warn('LocalStorage error in DemoAuthAdapter:', e);
    }

    return {
      success: true,
      user: matchedUser,
      isDemoSimulation: true,
    };
  }

  public async register(credentials: RegisterCredentials): Promise<AuthResult> {
    if (!credentials.fullName.trim() || !credentials.email.trim()) {
      return {
        success: false,
        isDemoSimulation: true,
        error: 'Lütfen ad soyad ve e-posta alanlarını eksiksiz doldurunuz.',
      };
    }

    if (!credentials.agreeToTerms) {
      return {
        success: false,
        isDemoSimulation: true,
        error: 'Devam etmek için Aydınlatma Metni ve Üyelik Koşullarını kabul etmelisiniz.',
      };
    }

    // Mimari Güvenlik Kuralı: Yeni kaydolan aday KENDİNE ASLA YÖNETİCİ/EĞİTMEN ROLÜ VEREMEZ.
    // Varsayılan rol istisnasız 'applicant' (Aday) olarak atanır.
    const newUser: UserProfile = {
      id: `usr-new-${Date.now()}`,
      fullName: credentials.fullName.trim(),
      email: credentials.email.trim(),
      role: 'applicant',
      roles: ['applicant'],
      title: 'Kayıtlı Aday',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(newUser));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth_user_changed', { detail: newUser }));
      }
    } catch (e) {
      console.warn('LocalStorage error in register:', e);
    }

    return {
      success: true,
      user: newUser,
      isDemoSimulation: true,
      requiresBackendNotice: 'Hesabınız başarıyla oluşturuldu (Demo Simülasyonu). Canlı üretim sisteminde aktivasyon e-postası doğrulaması zorunludur.',
    };
  }

  public async logout(): Promise<void> {
    try {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth_user_changed', { detail: null }));
      }
    } catch (e) {
      console.warn('LocalStorage error in logout:', e);
    }
  }

  public getCurrentUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('LocalStorage read error:', e);
    }
    return null;
  }

  public getDemoUsers(): Record<UserRole, UserProfile> {
    return DEMO_USERS;
  }
}

/**
 * 2. API AUTH ADAPTER (Gelecek ASP.NET Core Entegrasyon Sözleşmesi)
 * Canlı backend geliştirildiğinde ASP.NET Core Identity / JWT servislerine bağlanacak mimari köprü.
 */
export class ApiAuthAdapter implements AuthAdapter {
  private apiBaseUrl: string;

  constructor(apiBaseUrl = '/api/auth') {
    this.apiBaseUrl = apiBaseUrl;
  }

  public async login(_credentials: LoginCredentials): Promise<AuthResult> {
    // Backend henüz mevcut olmadığından sahte başarı iddiasında bulunulmaz
    return {
      success: false,
      isDemoSimulation: false,
      error: 'Backend API henüz aktif değildir. Lütfen kurumsal oturum açma için Demo Modu test hesaplarını kullanınız.',
      requiresBackendNotice: `ASP.NET Core [POST ${this.apiBaseUrl}/login] uç noktası bağlanmalıdır.`,
    };
  }

  public async register(_credentials: RegisterCredentials): Promise<AuthResult> {
    return {
      success: false,
      isDemoSimulation: false,
      error: 'Backend API henüz aktif değildir. Lütfen Demo Modu üzerinden kayıt simülasyonunu test ediniz.',
      requiresBackendNotice: `ASP.NET Core [POST ${this.apiBaseUrl}/register] uç noktası bağlanmalıdır.`,
    };
  }

  public async logout(): Promise<void> {
    // API logout placeholder
  }

  public getCurrentUser(): UserProfile | null {
    return null;
  }

  public getDemoUsers(): Record<UserRole, UserProfile> {
    return DEMO_USERS;
  }
}

// Uygulama genelinde kullanılacak varsayılan servis
export const authService = new DemoAuthAdapter();
