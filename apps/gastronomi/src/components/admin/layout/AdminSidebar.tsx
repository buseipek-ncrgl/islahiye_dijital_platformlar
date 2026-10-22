import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Utensils,
  ChefHat,
  Wheat,
  Users,
  MapPin,
  BookOpen,
  Video,
  Newspaper,
  Bell,
  Calendar,
  ShieldCheck,
  Settings,
  X,
  ExternalLink,
} from 'lucide-react';
import { ContentRepository } from '../../../services/content/contentRepository';
import { useContent } from '../../../hooks/useContent';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const { getMediaItems, getCulturalStories, getArtisans } = useContent();
  const stats = ContentRepository.getStats();
  const mediaCount = getMediaItems().length;
  const culturalCount = getCulturalStories().length;
  const artisanCount = getArtisans().length;

  const navGroups = [
    {
      groupTitle: 'GENEL BAKIŞ',
      items: [
        {
          label: 'Genel Bakış',
          path: '/yonetim',
          icon: LayoutDashboard,
          badge: stats.totalItems,
        },
      ],
    },
    {
      groupTitle: 'GASTRONOMİ & ATLAS',
      items: [
        {
          label: 'Yemekler',
          path: '/yonetim/yemekler',
          icon: Utensils,
          badge: stats.countsByType.dish,
        },
        {
          label: 'Tarifler',
          path: '/yonetim/tarifler',
          icon: ChefHat,
          badge: stats.countsByType.recipe,
        },
        {
          label: 'Yerel Ürünler',
          path: '/yonetim/urunler',
          icon: Wheat,
          badge: 1, // İslahiye Biberi tescilli
        },
        {
          label: 'Ustalar & Üreticiler',
          path: '/yonetim/ustalar',
          icon: Users,
          badge: artisanCount,
        },
        {
          label: 'Gastronomi Haritası',
          path: '/yonetim/harita',
          icon: MapPin,
          badge: stats.countsByType.place,
        },
        {
          label: 'Kültürel Miras',
          path: '/yonetim/kulturel-miras',
          icon: BookOpen,
          badge: culturalCount,
        },
      ],
    },
    {
      groupTitle: 'YAYIN & MEDYA',
      items: [
        {
          label: 'Medya Kütüphanesi',
          path: '/yonetim/medya',
          icon: Video,
          badge: mediaCount,
        },
        {
          label: 'Haberler & Yazılar',
          path: '/yonetim/haberler',
          icon: Newspaper,
          badge: stats.countsByType.news + stats.countsByType.editorial_article,
        },
        {
          label: 'Duyurular',
          path: '/yonetim/duyurular',
          icon: Bell,
          badge: stats.countsByType.announcement,
        },
        {
          label: 'Etkinlikler',
          path: '/yonetim/etkinlikler',
          icon: Calendar,
          badge: stats.countsByType.event,
        },
      ],
    },
    {
      groupTitle: 'SİSTEM & YÖNETİM',
      items: [
        {
          label: 'Yayın Yönetimi',
          path: '/yonetim/yayin-yonetimi',
          icon: ShieldCheck,
          badge: stats.publishedCount,
        },
        {
          label: 'Ayarlar & Roller',
          path: '/yonetim/ayarlar',
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-charcoal/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-paper border-r border-sand/70 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo Top Area */}
        <div>
          <div className="h-16 px-6 border-b border-sand/70 flex items-center justify-between bg-paper">
            <Link to="/yonetim" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-forest flex items-center justify-center text-ivory font-display font-bold text-lg shadow-xs">
                İ
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-mono font-bold tracking-wider text-forest uppercase">
                  İSLAHİYE GASTRONOMİ CMS
                </span>
                <span className="text-[10px] font-sans text-charcoal/60">
                  Lezzet Atlası Yönetim Paneli
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-sm text-charcoal/50 hover:text-forest hover:bg-sand/20"
              aria-label="Menüyü Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Scrollable Area */}
          <nav className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-8.5rem)] scrollbar-none font-sans text-xs">
            {navGroups.map((group) => (
              <div key={group.groupTitle} className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-mono font-bold text-copper-dark tracking-widest uppercase">
                  {group.groupTitle}
                </div>

                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/yonetim'}
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-sm transition-colors text-xs font-medium select-none ${
                          isActive
                            ? 'bg-forest text-ivory shadow-xs font-semibold'
                            : 'text-charcoal/80 hover:bg-sand/25 hover:text-forest'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0 opacity-85" />
                        <span>{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-xs font-semibold ${
                            item.badge > 0
                              ? 'bg-sand/30 text-charcoal group-hover:bg-sand/50'
                              : 'text-charcoal/40'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer Area: Switch to Visitor Portal */}
        <div className="p-4 border-t border-sand/70 bg-ivory/50">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 rounded-sm bg-paper border border-sand/70 text-xs font-mono text-charcoal/80 hover:text-forest hover:border-copper/60 transition-all shadow-xs"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-copper" />
              <span className="font-semibold">Ziyaretçi Portalı</span>
            </div>
            <span className="text-[10px] text-copper-dark uppercase">Aç ↗</span>
          </Link>
        </div>
      </aside>
    </>
  );
};
