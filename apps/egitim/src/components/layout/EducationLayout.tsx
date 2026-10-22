import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';

export const EducationLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar (Desktop 256px sticky & Mobile drawer) */}
      <Sidebar
        isOpenOnMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        {/* Standard Content Container: 32px desktop (p-8), 24px tablet (p-6), 16px mobile (p-4) */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 pb-24 md:pb-10 overflow-y-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (390px viewport support) */}
        <MobileNav />
      </div>
    </div>
  );
};

export const DashboardShell = EducationLayout;

