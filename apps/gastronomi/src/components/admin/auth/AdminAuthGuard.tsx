import React from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { AdminLoginPage } from './AdminLoginPage';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

/**
 * Route guard that protects all /yonetim/* management pages.
 * If user is not authenticated, they see only the institutional login portal.
 */
export const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({ children }) => {
  const { isAuthenticated } = useAdminAuth();

  if (!isAuthenticated) {
    return <AdminLoginPage />;
  }

  return <>{children}</>;
};

