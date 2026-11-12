import React, { createContext, useContext, useState } from 'react';
import { AdminRole } from '../types/admin';
import {
  AUTH_STORAGE_KEY,
  isCurrentAdminAuthorized,
  computeSessionSignature,
  verifySessionSignature,
} from '../utils/security';

export { AUTH_STORAGE_KEY, isCurrentAdminAuthorized };

export interface AdminUser {
  username: string;
  displayName: string;
  role: AdminRole;
  loginTime: string;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  adminUser: AdminUser | null;
  login: (credentials: { username: string; password: string }) => { success: boolean; error?: string };
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (verifySessionSignature(parsed) && parsed.adminUser) {
          return parsed.adminUser;
        } else {
          sessionStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch {
      // fallback
    }
    return null;
  });

  const isAuthenticated = Boolean(adminUser);

  const login = ({ username, password }: { username: string; password: string }): { success: boolean; error?: string } => {
    const trimmedUser = (username || '').trim().toLowerCase();
    const trimmedPass = (password || '').trim();

    if (!trimmedUser || !trimmedPass) {
      return { success: false, error: 'Lütfen kullanıcı adı ve parolanızı eksiksiz giriniz.' };
    }

    // Yetkili Kurumsal Hesap Doğrulaması (Belediye ve Oda Yönetim Heyeti)
    if (
      (trimmedUser === 'admin' && (trimmedPass === 'islahiye2026' || trimmedPass === 'admin' || trimmedPass === 'islahiye')) ||
      (trimmedUser === 'yonetici' && (trimmedPass === 'islahiye2026' || trimmedPass === 'yonetici')) ||
      (trimmedUser === 'editor' && (trimmedPass === 'islahiye2026' || trimmedPass === 'editor'))
    ) {
      const role: AdminRole = trimmedUser === 'editor' ? 'editor' : 'admin';
      const user: AdminUser = {
        username: trimmedUser,
        displayName:
          trimmedUser === 'admin'
            ? 'Oda Yöneticisi / Baş Editör'
            : trimmedUser === 'yonetici'
            ? 'Yayın & Doğrulama Sorumlusu'
            : 'İçerik Uzmanı & Araştırmacı',
        role,
        loginTime: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      };

      const timestamp = Date.now();
      const signature = computeSessionSignature(trimmedUser, role, timestamp);

      setAdminUser(user);
      try {
        sessionStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({
            isAuthenticated: true,
            username: trimmedUser,
            role,
            timestamp,
            signature,
            adminUser: user,
          })
        );
      } catch {
        // ignore storage error
      }

      return { success: true };
    }

    return {
      success: false,
      error: 'Geçersiz kullanıcı adı veya parola. Bu alan yalnızca yetkili belediye ve oda personeli içindir.',
    };
  };

  const logout = () => {
    setAdminUser(null);
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, adminUser, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
