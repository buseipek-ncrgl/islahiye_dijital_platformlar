import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  MessageSquare,
  ClipboardList,
  Users,
  Award,
} from 'lucide-react';
import { useDemoRole } from './DemoRoleContext';

export const MobileNav: React.FC = () => {
  const { currentRole } = useDemoRole();

  const getMobileTabs = () => {
    switch (currentRole) {
      case 'applicant':
        return [
          { to: '/aday', label: 'Genel Bakış', icon: LayoutDashboard },
          { to: '/aday/katalog', label: 'Katalog', icon: BookOpen },
          { to: '/aday/rehber', label: 'Rehber', icon: ClipboardList },
          { to: '/aday/takvim', label: 'Takvim', icon: Award },
        ];
      case 'trainee':
        return [
          { to: '/kursiyer', label: 'Genel Bakış', icon: LayoutDashboard },
          { to: '/kursiyer/mesajlar', label: 'Mesajlar', icon: MessageSquare },
          { to: '#dersler', label: 'Derslerim', icon: BookOpen },
          { to: '#odevler', label: 'Ödevler', icon: CheckSquare },
        ];
      case 'instructor':
        return [
          { to: '/egitmen', label: 'Genel Bakış', icon: LayoutDashboard },
          { to: '/egitmen/mesajlar', label: 'Mesajlar', icon: MessageSquare },
          { to: '#odevler', label: 'Ödevler', icon: CheckSquare },
          { to: '#gruplar', label: 'Gruplar', icon: Users },
        ];
      case 'superadmin':
        return [
          { to: '/yonetim/super-admin', label: 'Genel Bakış', icon: LayoutDashboard },
          { to: '/yonetim/kullanicilar', label: 'Kullanıcılar', icon: Users },
          { to: '/yonetim/roller', label: 'Yetkiler', icon: CheckSquare },
          { to: '/yonetim/denetim', label: 'Denetim', icon: Award },
        ];
      case 'admin':
        return [
          { to: '/yonetim', label: 'Genel Bakış', icon: LayoutDashboard },
          { to: '/yonetim/basvurular', label: 'Başvurular', icon: ClipboardList },
          { to: '/yonetim/kanallar', label: 'Kanallar', icon: MessageSquare },
          { to: '#belgeler', label: 'Belgeler', icon: Award },
        ];
      default: // visitor
        return [
          { to: '/egitimler', label: 'Katalog', icon: BookOpen },
          { to: '/egitim-takvimi', label: 'Takvim', icon: LayoutDashboard },
          { to: '/basvuru-rehberi', label: 'Rehber', icon: ClipboardList },
          { to: '/belge-dogrula', label: 'Doğrulama', icon: Award },
        ];
    }
  };

  const tabs = getMobileTabs();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-brand-border z-40 px-2 flex items-center justify-around shadow-lg"
      aria-label="Mobil Alt Gezinme"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isHash = tab.to.startsWith('#');

        if (isHash) {
          return (
            <button
              key={tab.label}
              className="flex flex-col items-center justify-center w-full py-1 text-slate-500 hover:text-brand-blue"
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </button>
          );
        }

        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/' || tab.to === '/yonetim'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-1 transition-colors ${
                isActive
                  ? 'text-brand-blue font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] leading-none">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
