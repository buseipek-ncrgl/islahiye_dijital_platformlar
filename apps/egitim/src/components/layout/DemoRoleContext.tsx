import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserRole, UserProfile } from '../../types';
import { DEMO_USERS } from '../../data/educationData';

interface DemoRoleContextType {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: UserProfile;
  activeUserKey: string;
  setActiveUserKey: (key: string) => void;
}

const DemoRoleContext = createContext<DemoRoleContextType | undefined>(undefined);

export const DemoRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // URL rotasına göre başlangıç rolünü tahmin et veya varsayılan yap
  const getInitialRole = (): UserRole => {
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
  const [activeUserKey, setActiveUserKey] = useState<string>(getInitialRole());

  // Sayfa yolu değiştiğinde rolü güncelle
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/aday') && currentRole !== 'applicant') {
      setCurrentRole('applicant');
      if (activeUserKey !== 'applicant' && activeUserKey !== 'applicant2') {
        setActiveUserKey('applicant');
      }
    } else if (
      (path.startsWith('/yonetim/super-admin') ||
        path.startsWith('/yonetim/kullanicilar') ||
        path.startsWith('/yonetim/roller') ||
        path.startsWith('/yonetim/ayarlar')) &&
      currentRole !== 'superadmin'
    ) {
      setCurrentRole('superadmin');
      setActiveUserKey('superadmin');
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
      setActiveUserKey('admin');
    } else if (path.startsWith('/egitmen') && currentRole !== 'instructor') {
      setCurrentRole('instructor');
      setActiveUserKey('instructor');
    } else if (path.startsWith('/kursiyer') && currentRole !== 'trainee') {
      setCurrentRole('trainee');
      setActiveUserKey('trainee');
    }
  }, [location.pathname]);

  const handleSetRole = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (newRole === 'applicant') {
      setActiveUserKey('applicant');
      navigate('/aday');
    } else if (newRole === 'visitor') {
      setActiveUserKey('visitor');
      navigate('/');
    } else if (newRole === 'trainee') {
      setActiveUserKey('trainee');
      navigate('/kursiyer');
    } else if (newRole === 'instructor') {
      setActiveUserKey('instructor');
      navigate('/egitmen');
    } else if (newRole === 'admin') {
      setActiveUserKey('admin');
      navigate('/yonetim');
    } else if (newRole === 'superadmin') {
      setActiveUserKey('superadmin');
      navigate('/yonetim/super-admin');
    }
  };

  const handleSetActiveUserKey = (key: string) => {
    setActiveUserKey(key);
    const user = DEMO_USERS[key];
    if (user && user.role !== currentRole) {
      setCurrentRole(user.role);
    }
  };

  const currentUser = DEMO_USERS[activeUserKey] || DEMO_USERS[currentRole] || DEMO_USERS.visitor;

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
