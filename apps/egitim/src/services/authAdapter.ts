import { AuthAdapter, AuthResult, LoginCredentials, RegisterCredentials, UserProfile, UserRole } from '../types';
import { educationApi, AuthUser } from './apiClient';

const CURRENT_USER_STORAGE_KEY = 'islahiye_current_auth_user_v1';

export const REAL_ACCOUNTS = [
  // 1-2. Süper Yöneticiler
  {
    role: 'superadmin' as UserRole,
    label: 'Sistem Yöneticisi',
    name: 'Hakan Yılmaz',
    email: 'admin@islahiye.bel.tr',
    password: 'Admin123456!',
    targetRoute: '/yonetim/super-admin',
  },
  {
    role: 'superadmin' as UserRole,
    label: 'Dijital Koordinatör',
    name: 'Zeynep Kaya',
    email: 'superadmin.zeynep@islahiye.bel.tr',
    password: 'Admin123456!',
    targetRoute: '/yonetim/super-admin',
  },
  // 3-5. Eğitim Operasyon Yöneticileri (Admin)
  {
    role: 'admin' as UserRole,
    label: 'Eğitim Programları Müdürü',
    name: 'Selin Aydın',
    email: 'yonetici.selin@islahiye.bel.tr',
    password: 'Admin123456!',
    targetRoute: '/yonetim',
  },
  {
    role: 'admin' as UserRole,
    label: 'Öğrenci İşleri & Kayıt Yetkilisi',
    name: 'Serkan Korkmaz',
    email: 'yonetici.serkan@islahiye.bel.tr',
    password: 'Admin123456!',
    targetRoute: '/yonetim',
  },
  {
    role: 'admin' as UserRole,
    label: 'Ölçme & Değerlendirme Uzmanı',
    name: 'Burcu Yıldız',
    email: 'yonetici.burcu@islahiye.bel.tr',
    password: 'Admin123456!',
    targetRoute: '/yonetim',
  },
  // 6-10. Eğitmenler
  {
    role: 'instructor' as UserRole,
    label: 'Eğitmen — Gastronomi',
    name: 'Şef Mehmet Yılmaz',
    email: 'egitmen.mehmet@islahiye.bel.tr',
    password: 'Instructor123456!',
    targetRoute: '/egitmen',
  },
  {
    role: 'instructor' as UserRole,
    label: 'Eğitmen — Tarımsal E-Ticaret',
    name: 'Murat Özkan',
    email: 'egitmen.murat@islahiye.bel.tr',
    password: 'Instructor123456!',
    targetRoute: '/egitmen',
  },
  {
    role: 'instructor' as UserRole,
    label: 'Eğitmen — Dış Ticaret & İhracat',
    name: 'Kemal Aksoy',
    email: 'egitmen.kemal@islahiye.bel.tr',
    password: 'Instructor123456!',
    targetRoute: '/egitmen',
  },
  {
    role: 'instructor' as UserRole,
    label: 'Eğitmen — Gıda Güvenliği & Hijyen',
    name: 'Dr. Fatma Yıldırım',
    email: 'egitmen.fatma@islahiye.bel.tr',
    password: 'Instructor123456!',
    targetRoute: '/egitmen',
  },
  {
    role: 'instructor' as UserRole,
    label: 'Eğitmen — Anadolu Mutfak Kültürü',
    name: 'Ayşe Demir',
    email: 'egitmen.ayse@islahiye.bel.tr',
    password: 'Instructor123456!',
    targetRoute: '/egitmen',
  },
  // 11-22. Kayıtlı Aktif Kursiyerler
  {
    role: 'trainee' as UserRole,
    label: 'Kursiyer — Grup A (Girişimci)',
    name: 'Ahmet Kaya',
    email: 'kursiyer.ahmet@islahiye.bel.tr',
    password: 'Trainee123456!',
    targetRoute: '/kursiyer',
  },
  {
    role: 'trainee' as UserRole,
    label: 'Kursiyer — Grup A',
    name: 'Fatma Şahin',
    email: 'kursiyer.fatma@islahiye.bel.tr',
    password: 'Trainee123456!',
    targetRoute: '/kursiyer',
  },
  {
    role: 'trainee' as UserRole,
    label: 'Kursiyer — Grup A',
    name: 'Mehmet Öztürk',
    email: 'kursiyer.mehmet@islahiye.bel.tr',
    password: 'Trainee123456!',
    targetRoute: '/kursiyer',
  },
  {
    role: 'trainee' as UserRole,
    label: 'Kursiyer — Grup A',
    name: 'Elif Çetin',
    email: 'kursiyer.elif@islahiye.bel.tr',
    password: 'Trainee123456!',
    targetRoute: '/kursiyer',
  },
  {
    role: 'trainee' as UserRole,
    label: 'Kursiyer — Grup A',
    name: 'Mustafa Demir',
    email: 'kursiyer.mustafa@islahiye.bel.tr',
    password: 'Trainee123456!',
    targetRoute: '/kursiyer',
  },
  {
    role: 'trainee' as UserRole,
    label: 'Kursiyer — Grup A',
    name: 'Emine Koç',
    email: 'kursiyer.emine@islahiye.bel.tr',
    password: 'Trainee123456!',
    targetRoute: '/kursiyer',
  },
  {
    role: 'trainee' as UserRole,
    label: 'Kursiyer — Grup B (Dış Ticaret)',
    name: 'Caner Yıldız',
    email: 'kursiyer.caner@islahiye.bel.tr',
    password: 'Trainee123456!',
    targetRoute: '/kursiyer',
  },
  {
    role: 'trainee' as UserRole,
    label: 'Kursiyer — Grup B',
    name: 'Büşra Kurt',
    email: 'kursiyer.busra@islahiye.bel.tr',
    password: 'Trainee123456!',
    targetRoute: '/kursiyer',
  },
  {
    role: 'trainee' as UserRole,
    label: 'Kursiyer — Grup B',
    name: 'Serdar Aslan',
    email: 'kursiyer.serdar@islahiye.bel.tr',
    password: 'Trainee123456!',
    targetRoute: '/kursiyer',
  },
  {
    role: 'trainee' as UserRole,
    label: 'Kursiyer — Grup B',
    name: 'Zeynep Polat',
    email: 'kursiyer.zeynep@islahiye.bel.tr',
    password: 'Trainee123456!',
    targetRoute: '/kursiyer',
  },
  {
    role: 'trainee' as UserRole,
    label: 'Kursiyer — Grup C (Mutfak)',
    name: 'İbrahim Çelik',
    email: 'kursiyer.ibrahim@islahiye.bel.tr',
    password: 'Trainee123456!',
    targetRoute: '/kursiyer',
  },
  {
    role: 'trainee' as UserRole,
    label: 'Kursiyer — Grup C',
    name: 'Merve Doğan',
    email: 'kursiyer.merve@islahiye.bel.tr',
    password: 'Trainee123456!',
    targetRoute: '/kursiyer',
  },
  // 23-29. Aday Başvuru Sahipleri
  {
    role: 'applicant' as UserRole,
    label: 'Aday — Yeni Başvuru',
    name: 'Ali Çelik',
    email: 'aday.ali@islahiye.bel.tr',
    password: 'Applicant123456!',
    targetRoute: '/aday',
  },
  {
    role: 'applicant' as UserRole,
    label: 'Aday — Evrak Bekleyen',
    name: 'Derya Yılmaz',
    email: 'aday.derya@islahiye.bel.tr',
    password: 'Applicant123456!',
    targetRoute: '/aday',
  },
  {
    role: 'applicant' as UserRole,
    label: 'Aday — Kriter Değerlendirme',
    name: 'Hasan Kılıç',
    email: 'aday.hasan@islahiye.bel.tr',
    password: 'Applicant123456!',
    targetRoute: '/aday',
  },
  {
    role: 'applicant' as UserRole,
    label: 'Aday — Asil Liste',
    name: 'Seda Erdem',
    email: 'aday.seda@islahiye.bel.tr',
    password: 'Applicant123456!',
    targetRoute: '/aday',
  },
  {
    role: 'applicant' as UserRole,
    label: 'Aday — Yedek Liste',
    name: 'Burak Şen',
    email: 'aday.burak@islahiye.bel.tr',
    password: 'Applicant123456!',
    targetRoute: '/aday',
  },
  {
    role: 'applicant' as UserRole,
    label: 'Aday — Şube Ataması Bekleyen',
    name: 'Hilal Güneş',
    email: 'aday.hilal@islahiye.bel.tr',
    password: 'Applicant123456!',
    targetRoute: '/aday',
  },
  {
    role: 'applicant' as UserRole,
    label: 'Aday — Elenen Başvuru',
    name: 'Volkan Tekin',
    email: 'aday.volkan@islahiye.bel.tr',
    password: 'Applicant123456!',
    targetRoute: '/aday',
  },
  // 30. Genel Ziyaretçi
  {
    role: 'visitor' as UserRole,
    label: 'Portal Ziyaretçisi',
    name: 'Ziyaretçi Kullanıcı',
    email: 'ziyaretci@islahiye-dijital.org',
    password: 'Visitor123456!',
    targetRoute: '/',
  },
];

function mapBackendRole(roles: string[]): UserRole {
  const normalized = roles.map((r) => r.toLowerCase());
  if (normalized.includes('superadmin')) return 'superadmin';
  if (normalized.includes('admin')) return 'admin';
  if (normalized.includes('instructor')) return 'instructor';
  if (normalized.includes('trainee')) return 'trainee';
  if (normalized.includes('applicant')) return 'applicant';
  return 'visitor';
}

function mapAuthUserToProfile(user: AuthUser): UserProfile {
  const primaryRole = mapBackendRole(user.roles);
  return {
    id: user.id,
    fullName: user.displayName,
    name: user.displayName,
    email: user.email,
    role: primaryRole,
    roles: user.roles.map((r) => r.toLowerCase() as UserRole),
    title:
      primaryRole === 'superadmin'
        ? 'Süper Yönetici'
        : primaryRole === 'admin'
        ? 'Eğitim & Süreç Yöneticisi'
        : primaryRole === 'instructor'
        ? 'Eğitmen'
        : primaryRole === 'trainee'
        ? 'Kayıtlı Kursiyer'
        : 'Aday Başvuru Sahibi',
    isActive: true,
  };
}

/**
 * API AUTH ADAPTER
 * Canlı ASP.NET Core Identity API uç noktalarına (`/api/v1/auth/*`) doğrudan bağlanır.
 */
export class ApiAuthAdapter implements AuthAdapter {
  public async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const email = credentials.emailOrUsername.trim().toLowerCase();
      const user = await educationApi.login(email, credentials.password || '');
      const profile = mapAuthUserToProfile(user);

      try {
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(profile));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth_user_changed', { detail: profile }));
        }
      } catch (storageErr) {
        console.warn('LocalStorage error in ApiAuthAdapter:', storageErr);
      }

      return {
        success: true,
        user: profile,
        isDemoSimulation: false,
      };
    } catch (err: any) {
      // Backend servisi kapalıysa veya ulaşılamıyorsa, hazır REAL_ACCOUNTS üzerinden yerel demo oturumu sağla
      const email = credentials.emailOrUsername.trim().toLowerCase();
      const matched = REAL_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === email && a.password === credentials.password
      );

      if (matched) {
        const id =
          matched.email === 'admin@islahiye.bel.tr'
            ? 'usr-admin-hakan'
            : matched.email === 'superadmin.zeynep@islahiye.bel.tr'
            ? 'usr-superadmin-zeynep'
            : matched.email === 'kursiyer.ahmet@islahiye.bel.tr'
            ? 'usr-trainee'
            : matched.email === 'egitmen.mehmet@islahiye.bel.tr'
            ? 'usr-instructor'
            : `usr-${matched.email.split('@')[0].replace(/\./g, '-')}`;

        const demoProfile: UserProfile = {
          id,
          fullName: matched.name,
          name: matched.name,
          email: matched.email,
          role: matched.role,
          roles: [matched.role],
          title: matched.label,
          isActive: true,
        };

        try {
          localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(demoProfile));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth_user_changed', { detail: demoProfile }));
          }
        } catch (storageErr) {
          console.warn('LocalStorage error in ApiAuthAdapter demo fallback:', storageErr);
        }

        return {
          success: true,
          user: demoProfile,
          isDemoSimulation: true,
        };
      }

      return {
        success: false,
        isDemoSimulation: false,
        error:
          err.message ||
          'Giriş başarısız. Lütfen e-posta adresinizi ve şifrenizi kontrol ediniz.',
      };
    }
  }

  public async register(credentials: RegisterCredentials): Promise<AuthResult> {
    if (!credentials.fullName.trim() || !credentials.email.trim()) {
      return {
        success: false,
        isDemoSimulation: false,
        error: 'Lütfen ad soyad ve e-posta alanlarını eksiksiz doldurunuz.',
      };
    }

    if (!credentials.agreeToTerms) {
      return {
        success: false,
        isDemoSimulation: false,
        error: 'Devam etmek için Aydınlatma Metni ve Üyelik Koşullarını kabul etmelisiniz.',
      };
    }

    try {
      const user = await educationApi.register(
        credentials.email.trim().toLowerCase(),
        credentials.password || 'Aday123456!',
        credentials.fullName.trim()
      );
      const profile = mapAuthUserToProfile(user);

      try {
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(profile));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth_user_changed', { detail: profile }));
        }
      } catch (storageErr) {
        console.warn('LocalStorage error in register:', storageErr);
      }

      return {
        success: true,
        user: profile,
        isDemoSimulation: false,
      };
    } catch (err: any) {
      return {
        success: false,
        isDemoSimulation: false,
        error: err.message || 'Kayıt işlemi başarısız oldu.',
      };
    }
  }

  public async logout(): Promise<void> {
    try {
      await educationApi.logout();
    } catch (err) {
      console.warn('API logout notice:', err);
    }
    try {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth_user_changed', { detail: null }));
      }
    } catch (storageErr) {
      console.warn('LocalStorage error in logout:', storageErr);
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
    const list: Record<string, UserProfile> = {};
    for (const acc of REAL_ACCOUNTS) {
      list[acc.role] = {
        id: `user-${acc.role}`,
        fullName: acc.name,
        email: acc.email,
        role: acc.role,
        roles: [acc.role],
        title: acc.label,
        isActive: true,
      };
    }
    return list as Record<UserRole, UserProfile>;
  }
}

// Varsayılan servis: Gerçek API Kimlik Doğrulama Servisi
export const authService = new ApiAuthAdapter();
