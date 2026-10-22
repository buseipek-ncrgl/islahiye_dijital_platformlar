import { UserRole, UserProfile } from './index';

/**
 * Kimlik Doğrulama Giriş Bilgileri
 */
export interface LoginCredentials {
  emailOrUsername: string;
  password?: string;
  rememberMe?: boolean;
}

/**
 * Yeni Hesap Oluşturma Bilgileri (Aday Başlangıç Rolü)
 */
export interface RegisterCredentials {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  agreeToTerms: boolean;
}

/**
 * Oturum Açma / Kayıt Yanıtı
 */
export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
  isDemoSimulation: boolean;
  requiresBackendNotice?: string;
}

/**
 * Gelecekteki ASP.NET Core Kimlik Doğrulama Servisi ile Uyumlu Adapter Arayüzü
 */
export interface AuthAdapter {
  login(credentials: LoginCredentials): Promise<AuthResult>;
  register(credentials: RegisterCredentials): Promise<AuthResult>;
  logout(): Promise<void>;
  getCurrentUser(): UserProfile | null;
  getDemoUsers(): Record<UserRole, UserProfile>;
}
