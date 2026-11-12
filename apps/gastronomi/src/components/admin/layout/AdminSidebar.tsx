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
  Tag,
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
  const { getMediaItems, getCulturalStories, getArtisans, getDishes, getCategories } = useContent();
  const stats = ContentRepository.getStats();
  const mediaCount = getMediaItems().length;
  const culturalCount = getCulturalStories().length;
  const artisanCount = getArtisans().length;
  const localProductCount = getDishes(false).filter((d) => d.category === 'local_product').length;
  const newsAndArticlesCount = stats.countsByType.news + stats.countsByType.editorial_article;
  const activeCategoriesCount = getCategories(undefined, true).length;

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
          label: 'Yöresel Yemekler',
          path: '/yonetim/yemekler',
          icon: Utensils,
          badge: stats.countsByType.dish,
        },
        {
          label: 'Geleneksel Tarifler',
          path: '/yonetim/tarifler',
          icon: ChefHat,
          badge: stats.countsByType.recipe,
        },
        {
          label: 'Coğrafi İşaret & Ürünler',
          path: '/yonetim/urunler',
          icon: Wheat,
          badge: localProductCount,
        },
        {
          label: 'Gastronomi Haritası',
          path: '/yonetim/harita',
          icon: MapPin,
          badge: stats.countsByType.place,
        },
        {
          label: 'Ustalar & Üreticiler',
          path: '/yonetim/ustalar',
          icon: Users,
          badge: artisanCount,
        },
        {
          label: 'Mutfak Mirası',
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
          badge: newsAndArticlesCount,
        },
        {
          label: 'Kurumsal Duyurular',
          path: '/yonetim/duyurular',
          icon: Bell,
          badge: stats.countsByType.announcement,
        },
        {
          label: 'Etkinlikler & Atölye',
          path: '/yonetim/etkinlikler',
          icon: Calendar,
          badge: stats.countsByType.event,
        },
      ],
    },
    {
      groupTitle: 'SİSTEM & YÖNETİŞİM',
      items: [
        {
          label: 'Yayın Denetimi',
          path: '/yonetim/yayin-yonetimi',
          icon: ShieldCheck,
          badge: stats.publishedCount,
        },
        {
          label: 'Kategori Yönetimi',
          path: '/yonetim/kategoriler',
          icon: Tag,
          badge: activeCategoriesCount,
        },
        {
          label: 'Sistem Ayarları',
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
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo Top Area */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <Link to="/yonetim" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
              İG
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-white tracking-wide truncate">
                İslahiye Gastronomi CMS
              </span>
              <span className="text-[10px] text-emerald-400 font-medium truncate">
                Lezzet Atlası Yönetim Portalı
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Menüyü Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Scrollable Area */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4 [scrollbar-width:thin] [scrollbar-color:#334155_transparent] text-xs">
          {navGroups.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
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
                      `flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-xs font-medium select-none ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400 font-semibold border-l-2 border-emerald-500 shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className="w-4 h-4 shrink-0 opacity-80" />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-sans px-2 py-0.5 rounded-full font-bold shrink-0 ${
                          item.badge > 0
                            ? 'bg-slate-800 text-slate-300 border border-slate-700/80'
                            : 'text-slate-600'
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

        {/* Footer Area: Switch to Visitor Portal */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 shrink-0">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 hover:border-emerald-500/50 transition-all shadow-xs"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold">Ziyaretçi Portalı</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-sans font-bold uppercase">Aç ↗</span>
          </Link>
        </div>
      </aside>
    </>
  );
};
