import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  CheckSquare,
  MessageSquare,
  Award,
  Users,
  ClipboardList,
  Layers,
  SlidersHorizontal,
  FileText,
  Hash,
  Bell,
  Mail,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useDemoRole } from './DemoRoleContext';

interface SidebarProps {
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenOnMobile = false,
  onCloseMobile,
}) => {
  const { currentRole, currentUser } = useDemoRole();

  // Rol bazlı kurumsal ve sade menü yapılandırması (Sprint numaraları ve teknik notlar temizlendi)
  const getNavSections = () => {
    switch (currentRole) {
      case 'superadmin':
        return [
          {
            title: 'YÖNETİŞİM & SİSTEM',
            items: [
              { to: '/yonetim/super-admin', label: 'Süper Yönetici Konsolu', icon: ShieldCheck },
              { to: '/yonetim/kullanicilar', label: 'Kullanıcı & Rol Masası', icon: Users },
              { to: '/yonetim/roller', label: 'Granüler Yetki Matrisi', icon: SlidersHorizontal },
              { to: '/yonetim/ayarlar', label: 'Sistem & Politika Ayarları', icon: Layers },
            ],
          },
          {
            title: 'DENETİM & RAPORLAR',
            items: [
              { to: '/yonetim/denetim', label: 'Merkezi Denetim İzi', icon: CheckSquare },
              { to: '/yonetim/raporlar', label: 'Operasyonel Raporlar', icon: FileText },
              { to: '/yonetim/yoklama-denetim', label: 'Yoklama Denetimi', icon: ClipboardList },
              { to: '/yonetim', label: 'Operasyonel Yönetim', icon: LayoutDashboard },
              { to: '/bildirimler', label: 'Bildirimler', icon: Bell },
            ],
          },
        ];

      case 'admin':
        return [
          {
            title: 'GENEL BAKIŞ & İLETİŞİM',
            items: [
              { to: '/yonetim', label: 'Yönetim Paneli', icon: LayoutDashboard },
              { to: '/yonetim/raporlar', label: 'Operasyonel Raporlar', icon: FileText },
              { to: '/bildirimler', label: 'Bildirimler', icon: Bell },
              { to: '/yonetim/duyurular', label: 'Kurumsal Duyurular', icon: Bell },
              { to: '/yonetim/toplu-eposta', label: 'Toplu E-Posta Masası', icon: Mail },
            ],
          },
          {
            title: 'BAŞVURU & KAYIT',
            items: [
              { to: '/yonetim/basvurular', label: 'Başvuru Değerlendirme', icon: ClipboardList },
              { to: '/yonetim/kesin-kayit', label: 'Kesin Kayıt Masası', icon: Users },
              { to: '/yonetim/gruplar', label: 'Grup & Kontenjan', icon: Layers },
              { to: '/yonetim/kriterler', label: 'Puanlama Kriterleri', icon: SlidersHorizontal },
            ],
          },
          {
            title: 'EĞİTİM & BAŞARI',
            items: [
              { to: '/yonetim/oturumlar', label: 'Oturum Planlama', icon: Calendar },
              { to: '/yonetim/yoklama-denetim', label: 'Yoklama Denetimi', icon: CheckSquare },
              { to: '/yonetim/odevler', label: 'Ödev & Değerlendirme', icon: FileText },
              { to: '/yonetim/basari-onay', label: 'Dönem Başarı Onayı', icon: Award },
              { to: '/yonetim/belgeler', label: 'Belge Kütüğü & Doğrulama', icon: Award },
              { to: '/yonetim/kanallar', label: 'Grup Kanalları', icon: Hash },
              { to: '/yonetim/denetim', label: 'Denetim Kayıtları', icon: CheckSquare },
            ],
          },
        ];

      case 'instructor':
        return [
          {
            title: 'EĞİTİM YÖNETİMİ',
            items: [
              { to: '/egitmen', label: 'Genel Bakış', icon: LayoutDashboard },
              { to: '/egitmen#yoklama', label: 'Derslerim & Yoklama', icon: ClipboardList },
              { to: '/egitmen#odevler', label: 'Ödevler & Puanlama', icon: CheckSquare },
              { to: '/egitmen#gruplar', label: 'Gruplarım', icon: Users },
              { to: '/egitmen#ilerleme', label: 'Kursiyer İlerlemesi', icon: TrendingUp },
            ],
          },
          {
            title: 'İLETİŞİM',
            items: [
              { to: '/egitmen/mesajlar', label: 'Kursiyer Mesajları', icon: MessageSquare },
              { to: '/egitmen/kanallar', label: 'Sınıf Kanalları', icon: Hash },
              { to: '/bildirimler', label: 'Bildirimler', icon: Bell },
            ],
          },
        ];

      case 'trainee':
        return [
          {
            title: 'EĞİTİM SÜRECİM',
            items: [
              { to: '/kursiyer', label: 'Genel Bakış', icon: LayoutDashboard },
              { to: '/kursiyer#dersler', label: 'Derslerim & Takvim', icon: BookOpen },
              { to: '/kursiyer#odevler', label: 'Ödevlerim', icon: CheckSquare },
              { to: '/kursiyer#yoklama', label: 'Devam Durumum', icon: Calendar },
              { to: '/kursiyer#belgeler', label: 'Belgelerim & Doğrulama', icon: Award },
            ],
          },
          {
            title: 'İLETİŞİM',
            items: [
              { to: '/kursiyer/mesajlar', label: 'Eğitmen Mesajları', icon: MessageSquare },
              { to: '/kursiyer/kanallar', label: 'Grup Kanallarım', icon: Hash },
              { to: '/bildirimler', label: 'Bildirimler', icon: Bell },
            ],
          },
        ];

      case 'applicant':
        return [
          {
            title: 'BAŞVURU YOLCULUĞU',
            items: [
              { to: '/aday', label: 'Başvurularım & Durum', icon: LayoutDashboard },
              { to: '/bildirimler', label: 'Bildirimler', icon: Bell },
              { to: '/egitimler', label: 'Eğitim Kataloğu', icon: BookOpen },
              { to: '/basvuru-rehberi', label: 'Başvuru Rehberi', icon: ClipboardList },
              { to: '/egitim-takvimi', label: 'Dönem Takvimi', icon: Calendar },
            ],
          },
        ];

      default:
        return [
          {
            title: 'EĞİTİM VE PROGRAMLAR',
            items: [
              { to: '/egitimler', label: 'Eğitim Kataloğu', icon: BookOpen },
              { to: '/egitim-takvimi', label: 'Dönem Takvimi', icon: Calendar },
              { to: '/basvuru-rehberi', label: 'Başvuru Rehberi', icon: ClipboardList },
              { to: '/belge-dogrula', label: 'Belge Doğrulama', icon: Award },
            ],
          },
        ];
    }
  };

  const sections = getNavSections();

  return (
    <>
      {/* Mobil Karartma Perdesi */}
      {isOpenOnMobile && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Ana Standart Sidebar (256px / w-64) */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 z-40 border-r border-slate-800 transition-transform duration-200
          ${isOpenOnMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Kurumsal Başlık Standardı */}
          <Link
            to="/"
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
            }}
            className="p-5 border-b border-slate-800/80 flex items-center gap-3 hover:bg-slate-800/40 transition block"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs tracking-wider shadow-sm shrink-0">
              İE
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-white leading-tight truncate">
                İslahiye Ticaret Odası
              </div>
              <div className="text-[11px] text-blue-400 font-semibold tracking-wide truncate">
                Eğitim Portalı
              </div>
            </div>
          </Link>

          {/* Menü Bölümleri */}
          <nav className="p-3 space-y-4" aria-label="Ana Panel Gezinimi">
            {sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                {section.title && (
                  <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {section.title}
                  </div>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isHashLink = item.to.includes('#');

                  if (isHashLink) {
                    const [pagePath, hash] = item.to.split('#');
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          if (onCloseMobile) onCloseMobile();
                          if (window.location.pathname !== pagePath && pagePath !== '') {
                            window.location.href = item.to;
                            return;
                          }
                          const el = document.getElementById(hash);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors text-left"
                      >
                        <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  }

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/' || item.to === '/yonetim' || item.to === '/yonetim/super-admin'}
                      onClick={() => {
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-sm'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Alt Kullanıcı Kartı & Ayrılmış Demo Masası Köprüsü */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">
              {currentUser.fullName
                ? currentUser.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">
                {currentUser.fullName}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {currentUser.title || 'Kullanıcı'}
              </div>
            </div>
          </div>

          {/* Ayrılmış Demo / Sunum Alanına Doğrudan Köprü (Normal gezinmeyi kirletmez) */}
          <Link
            to="/demo"
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full inline-flex items-center justify-between px-2.5 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white border border-slate-700/60 transition"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Demo / Rol Masası</span>
            </span>
            <span className="text-[10px] text-blue-400 font-medium">Aç →</span>
          </Link>
        </div>
      </aside>
    </>
  );
};
