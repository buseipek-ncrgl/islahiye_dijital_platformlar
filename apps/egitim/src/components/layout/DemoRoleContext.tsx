import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserRole, UserProfile } from '../../types';
import { authService, REAL_ACCOUNTS } from '../../services/authAdapter';

interface DemoRoleContextType {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: UserProfile;
  activeUserKey: string;
  setActiveUserKey: (key: string) => void;
}

const DemoRoleContext = createContext<DemoRoleContextType | undefined>(undefined);

const GUEST_USER: UserProfile = {
  id: 'usr-guest',
  fullName: 'Ziyaretçi',
  email: 'ziyaretci@islahiye-dijital.org',
  role: 'visitor',
  roles: ['visitor'],
  title: 'Ziyaretçi Kullanıcı',
  isActive: true,
};

export const DemoRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getInitialRole = (): UserRole => {
    const saved = authService.getCurrentUser();
    if (saved && saved.role) return saved.role;

    const path = location.pathname;
    if (path.startsWith('/aday')) return 'applicant';
    if (
      path.startsWith('/yonetim/super-admin') ||
      path.startsWith('/yonetim/kullanicilar') ||
      path.startsWith('/yonetim/roller') ||
      path.startsWith('/yonetim/ayarlar')
    ) {
      return 'superadmin';
    }
    if (path.startsWith('/yonetim')) return 'admin';
    if (path.startsWith('/egitmen')) return 'instructor';
    if (path.startsWith('/kursiyer')) return 'trainee';
    return 'visitor';
  };

  const [currentRole, setCurrentRole] = useState<UserRole>(getInitialRole);
  const [activeUserKey, setActiveUserKey] = useState<string>(() => {
    const saved = authService.getCurrentUser();
    return saved?.email ?? getInitialRole();
  });
  const [liveUser, setLiveUser] = useState<UserProfile | null>(() => authService.getCurrentUser());

  // Listen to auth user changes (login, logout, account switch)
  useEffect(() => {
    const handleAuthChange = (e: Event) => {
      const customEvent = e as CustomEvent<UserProfile | null>;
      const user = customEvent.detail;
      setLiveUser(user);
      if (user) {
        setCurrentRole(user.role);
        setActiveUserKey(user.email);
      } else {
        setCurrentRole('visitor');
        setActiveUserKey('visitor');
      }
    };

    window.addEventListener('auth_user_changed', handleAuthChange);
    return () => window.removeEventListener('auth_user_changed', handleAuthChange);
  }, []);

  // Update role based on URL navigation
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/aday') && currentRole !== 'applicant') {
      setCurrentRole('applicant');
    } else if (
      (path.startsWith('/yonetim/super-admin') ||
        path.startsWith('/yonetim/kullanicilar') ||
        path.startsWith('/yonetim/roller') ||
        path.startsWith('/yonetim/ayarlar')) &&
      currentRole !== 'superadmin'
    ) {
      setCurrentRole('superadmin');
    } else if (
      path.startsWith('/yonetim') &&
      !path.startsWith('/yonetim/super-admin') &&
      !path.startsWith('/yonetim/kullanicilar') &&
      !path.startsWith('/yonetim/roller') &&
      !path.startsWith('/yonetim/ayarlar') &&
      currentRole !== 'admin' &&
      currentRole !== 'superadmin'
    ) {
      setCurrentRole('admin');
    } else if (path.startsWith('/egitmen') && currentRole !== 'instructor') {
      setCurrentRole('instructor');
    } else if (path.startsWith('/kursiyer') && currentRole !== 'trainee') {
      setCurrentRole('trainee');
    }
  }, [location.pathname]);

  const handleSetRole = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (newRole === 'applicant') {
      navigate('/aday');
    } else if (newRole === 'visitor') {
      navigate('/');
    } else if (newRole === 'trainee') {
      navigate('/kursiyer');
    } else if (newRole === 'instructor') {
      navigate('/egitmen');
    } else if (newRole === 'admin') {
      navigate('/yonetim');
    } else if (newRole === 'superadmin') {
      navigate('/yonetim/super-admin');
    }
  };

  const resolveUniqueUserId = (acc: typeof REAL_ACCOUNTS[0]): string => {
    if (acc.email === 'admin@islahiye.bel.tr') return 'usr-admin-hakan';
    if (acc.email === 'superadmin.zeynep@islahiye.bel.tr') return 'usr-superadmin-zeynep';
    if (acc.email === 'kursiyer.ahmet@islahiye.bel.tr') return 'usr-trainee';
    if (acc.email === 'egitmen.mehmet@islahiye.bel.tr') return 'usr-instructor';
    const prefix = acc.email.split('@')[0].replace(/\./g, '-');
    return `usr-${prefix}`;
  };

  const handleSetActiveUserKey = (key: string) => {
    setActiveUserKey(key);
    const matchedAccount = REAL_ACCOUNTS.find((a) => a.email === key || a.role === key);
    if (matchedAccount) {
      const switchedProfile: UserProfile = {
        id: resolveUniqueUserId(matchedAccount),
        fullName: matchedAccount.name,
        name: matchedAccount.name,
        email: matchedAccount.email,
        role: matchedAccount.role,
        roles: [matchedAccount.role],
        title: matchedAccount.label,
        isActive: true,
      };
      setLiveUser(switchedProfile);
      setCurrentRole(matchedAccount.role);
    }
  };

  const getDefaultRoleProfile = (role: UserRole): UserProfile => {
    const acc = REAL_ACCOUNTS.find((a) => a.role === role);
    if (!acc) return GUEST_USER;

    const id = resolveUniqueUserId(acc);

    return {
      id,
      fullName: acc.name,
      name: acc.name,
      email: acc.email,
      role: acc.role,
      roles: [acc.role],
      title: acc.label,
      isActive: true,
    };
  };

  const currentUser: UserProfile = liveUser
    ? {
        ...liveUser,
        title: (liveUser.title || '').replace(/süper yönetici/i, 'Sistem Yöneticisi') || 'Kullanıcı',
      }
    : getDefaultRoleProfile(currentRole);

  return (
    <DemoRoleContext.Provider
      value={{
        currentRole,
        setRole: handleSetRole,
        currentUser,
        activeUserKey,
        setActiveUserKey: handleSetActiveUserKey,
      }}
    >
      {children}
    </DemoRoleContext.Provider>
  );
};

export const useDemoRole = (): DemoRoleContextType => {
  const context = useContext(DemoRoleContext);
  if (!context) {
    throw new Error('useDemoRole must be used within a DemoRoleProvider');
  }
  return context;
};
