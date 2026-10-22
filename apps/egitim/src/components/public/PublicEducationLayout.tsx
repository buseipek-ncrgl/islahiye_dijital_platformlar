import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

interface PublicEducationLayoutProps {
  children?: React.ReactNode;
}

export const PublicEducationLayout: React.FC<PublicEducationLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-brand-slateBg text-brand-textPrimary antialiased selection:bg-blue-100 selection:text-brand-blue">
      {/* 1. Public Horizontal Header (No Sidebar) */}
      <PublicHeader />

      {/* 2. Main Visitor Content Canvas */}
      <main id="main-content" className="flex-1 focus:outline-none">
        {children || <Outlet />}
      </main>

      {/* 3. Public Institutional Footer */}
      <PublicFooter />
    </div>
  );
};
