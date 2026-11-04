import React, { useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
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
  TrendingUp,
  User,
  HelpCircle,
  X,
  Building2,
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
  const location = useLocation();
  const navigate = useNavigate();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Rol bazlı kurumsal ve sade menü yapılandırması (Sprint numaraları ve teknik notlar temizlendi)
  const getNavSections = () => {
    switch (currentRole) {
      case 'superadmin':
        return [
          {
            title: 'SİSTEM & GÜVENLİK YÖNETİŞİMİ',
            items: [
              { to: '/yonetim/super-admin', label: 'Genel Bakış', icon: LayoutDashboard },
              { to: '/yonetim/kullanicilar', label: 'Kullanıcı & Rol Masası', icon: Users },
              { to: '/yonetim/roller', label: 'Granüler Yetki Matrisi', icon: SlidersHorizontal },
              { to: '/yonetim/ayarlar', label: 'Sistem Politikaları', icon: Layers },
              { to: '/yonetim/denetim', label: 'Merkezi Denetim İzi', icon: CheckSquare },
            ],
          },
          {
            title: 'OPERASYONEL VE AKADEMİK KONSOL',
            items: [
              { to: '/yonetim/egitimler', label: 'Eğitim Kataloğu & Tanımlama', icon: BookOpen },
              { to: '/yonetim/basvurular', label: 'Başvuru Değerlendirme', icon: ClipboardList },
              { to: '/yonetim/kriterler', label: 'Puanlama Kriterleri', icon: SlidersHorizontal },
              { to: '/yonetim/kesin-kayit', label: 'Kesin Kayıt Masası', icon: Users },
              { to: '/yonetim/gruplar', label: 'Grup & Kontenjan', icon: Layers },
              { to: '/yonetim/mekanlar', label: 'Derslik & Mekân Kataloğu', icon: Building2 },
              { to: '/yonetim/oturumlar', label: 'Oturum Planlama', icon: Calendar },
              { to: '/yonetim/yoklama-denetim', label: 'Yoklama Denetimi', icon: CheckSquare },
              { to: '/yonetim/odevler', label: 'Ödev & Değerlendirme', icon: FileText },
              { to: '/yonetim/basari-onay', label: 'Dönem Başarı Onayı', icon: Award },
              { to: '/yonetim/belgeler', label: 'Belge Kütüğü & Doğrulama', icon: Award },
              { to: '/yonetim/raporlar', label: 'Operasyonel Raporlar', icon: TrendingUp },
            ],
          },
          {
            title: 'İLETİŞİM ALTYAPISI',
            items: [
              { to: '/yonetim/kanallar', label: 'Grup Kanalları', icon: Hash },
              { to: '/yonetim/duyurular', label: 'Kurumsal Duyurular', icon: Bell },
              { to: '/yonetim/toplu-eposta', label: 'Toplu E-Posta Masası', icon: Mail },
            ],
          },
        ];

      case 'admin':
        return [
          {
            title: 'GENEL BAKIŞ & RAPORLAMA',
            items: [
              { to: '/yonetim', label: 'Genel Bakış', icon: LayoutDashboard },
              { to: '/yonetim/raporlar', label: 'Operasyonel Raporlar', icon: TrendingUp },
              { to: '/yonetim/denetim', label: 'Denetim Kayıtları', icon: CheckSquare },
            ],
          },
          {
            title: 'BAŞVURU & KAYIT MASASI',
            items: [
              { to: '/yonetim/egitimler', label: 'Eğitim Kataloğu & Tanımlama', icon: BookOpen },
              { to: '/yonetim/basvurular', label: 'Başvuru Değerlendirme', icon: ClipboardList },
              { to: '/yonetim/kriterler', label: 'Puanlama Kriterleri', icon: SlidersHorizontal },
              { to: '/yonetim/kesin-kayit', label: 'Kesin Kayıt Masası', icon: Users },
              { to: '/yonetim/gruplar', label: 'Grup & Kontenjan', icon: Layers },
              { to: '/yonetim/mekanlar', label: 'Derslik & Mekân Kataloğu', icon: Building2 },
            ],
          },
          {
            title: 'EĞİTİM & AKADEMİK SÜREÇ',
            items: [
              { to: '/yonetim/oturumlar', label: 'Oturum & Takvim Planlama', icon: Calendar },
              { to: '/yonetim/yoklama-denetim', label: 'Yoklama Denetimi', icon: CheckSquare },
              { to: '/yonetim/odevler', label: 'Ödev & Değerlendirme', icon: FileText },
              { to: '/yonetim/basari-onay', label: 'Dönem Sonu Başarı Onayı', icon: Award },
              { to: '/yonetim/belgeler', label: 'Belge Kütüğü & Doğrulama', icon: Award },
            ],
          },
          {
            title: 'İLETİŞİM & DUYURU MASASI',
            items: [
              { to: '/yonetim/kanallar', label: 'Grup Kanalları', icon: Hash },
              { to: '/yonetim/duyurular', label: 'Kurumsal Duyurular', icon: Bell },
              { to: '/yonetim/toplu-eposta', label: 'Toplu E-Posta Masası', icon: Mail },
            ],
          },
        ];

      case 'instructor':
        return [
          {
            title: 'EĞİTİM YÖNETİMİ',
            items: [
              { to: '/egitmen', label: 'Genel Bakış', icon: LayoutDashboard },
              { to: '/egitmen/dersler', label: 'Derslerim & Yoklama', icon: ClipboardList },
              { to: '/egitmen/takvim', label: 'Eğitim Takvimi', icon: Calendar },
              { to: '/egitmen/odevler', label: 'Ödevler & Değerlendirme', icon: FileText },
              { to: '/egitmen/gruplar', label: 'Gruplarım', icon: Users },
              { to: '/egitmen/ilerleme', label: 'Kursiyer İlerlemesi', icon: TrendingUp },
            ],
          },
          {
            title: 'İLETİŞİM',
            items: [
              { to: '/egitmen/mesajlar', label: 'Mesajlar', icon: MessageSquare },
              { to: '/egitmen/kanallar', label: 'Grup Kanalları', icon: Hash },
              { to: '/bildirimler', label: 'Bildirimler', icon: Bell },
              { to: '/egitmen/profil', label: 'Profilim', icon: User },
            ],
          },
        ];

      case 'trainee':
        return [
          {
            title: 'EĞİTİM SÜRECİM',
            items: [
              { to: '/kursiyer', label: 'Genel Bakış', icon: LayoutDashboard },
              { to: '/kursiyer/dersler', label: 'Derslerim', icon: BookOpen },
              { to: '/kursiyer/takvim', label: 'Takvim', icon: Calendar },
              { to: '/kursiyer/odevler', label: 'Ödevlerim', icon: CheckSquare },
              { to: '/kursiyer/devam', label: 'Devam Durumum', icon: ClipboardList },
              { to: '/kursiyer/belgeler', label: 'Belgelerim', icon: Award },
            ],
          },
          {
            title: 'İLETİŞİM & KATALOG',
            items: [
              { to: '/kursiyer/mesajlar', label: 'Eğitmen Mesajları', icon: MessageSquare },
              { to: '/kursiyer/kanallar', label: 'Grup Kanallarım', icon: Hash },
              { to: '/kursiyer/katalog', label: 'Eğitim Kataloğu', icon: BookOpen },
              { to: '/kursiyer/belge-dogrula', label: 'Karekod Doğrulama', icon: Award },
              { to: '/kursiyer/profil', label: 'Profilim', icon: User },
            ],
          },
        ];

      case 'applicant':
        return [
          {
            title: 'BAŞVURU YÖNETİMİ',
            items: [
              { to: '/aday', label: 'Genel Bakış', icon: LayoutDashboard },
              { to: '/aday/katalog', label: 'Eğitim Kataloğu & Başvuru', icon: BookOpen },
              { to: '/aday/takvim', label: 'Dönem Takvimi', icon: Calendar },
            ],
          },
          {
            title: 'BİLGİ & HESAP',
            items: [
              { to: '/aday/rehber', label: 'Başvuru Rehberi', icon: ClipboardList },
              { to: '/bildirimler', label: 'Bildirimler', icon: Bell },
              { to: '/aday/profil', label: 'Profilim & Bilgilerim', icon: User },
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

  const getHomePath = () => {
    switch (currentRole) {
      case 'superadmin':
        return '/yonetim/super-admin';
      case 'admin':
        return '/yonetim';
      case 'instructor':
        return '/egitmen';
      case 'trainee':
        return '/kursiyer';
      case 'applicant':
        return '/aday';
      default:
        return '/';
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
        <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#334155_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Kurumsal Başlık Standardı */}
          <Link
            to={getHomePath()}
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
            }}
            className="p-4 border-b border-slate-800/80 flex items-center gap-3 hover:bg-slate-800/40 transition block"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs tracking-wider shadow-sm shrink-0">
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
          <nav className="p-2.5 space-y-3" aria-label="Ana Panel Gezinimi">
            {sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-0.5">
                {section.title && (
                  <div className="px-2.5 pt-1.5 pb-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                    {section.title}
                  </div>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isHashLink = item.to.includes('#');

                  if (isHashLink) {
                    const [pagePath, hash] = item.to.split('#');
                    const isCurrentPage = location.pathname === pagePath;
                    const isCurrentHash = isCurrentPage && location.hash === `#${hash}`;

                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          if (onCloseMobile) onCloseMobile();
                          if (location.pathname !== pagePath) {
                            navigate(item.to);
                            return;
                          }
                          window.location.hash = hash;
                        }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                          isCurrentHash
                            ? 'bg-blue-500/15 text-blue-400 font-semibold border-l-2 border-blue-500'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isCurrentHash ? 'text-blue-400' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  }

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={
                        item.to === '/' ||
                        item.to === '/kursiyer' ||
                        item.to === '/egitmen' ||
                        item.to === '/aday' ||
                        item.to === '/yonetim' ||
                        item.to === '/yonetim/super-admin'
                      }
                      onClick={() => {
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={({ isActive }) => {
                        const isSuppressedByHash = item.to === '/egitmen' && Boolean(location.hash && location.hash !== '#');
                        const isReallyActive = isActive && !isSuppressedByHash;

                        return `flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isReallyActive
                            ? 'bg-blue-500/15 text-blue-400 font-semibold border-l-2 border-blue-500'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                        }`;
                      }}
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

        {/* Alt Kullanıcı & Hızlı Rol Değiştirici */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/70 space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-slate-800 text-blue-400 font-bold text-[11px] flex items-center justify-center shrink-0 border border-slate-700">
                {currentUser.fullName
                  ? currentUser.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                  : 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate leading-tight">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-400 truncate leading-tight">
                  {(currentUser.title || '').replace(/süper yönetici/i, 'Sistem Yöneticisi') || 'Kullanıcı'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsHelpModalOpen(true)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
              title="Yardım ve Destek"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Hızlı Rol ve Panel Değiştirici Köprüsü */}
          <Link
            to="/demo"
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full inline-flex items-center justify-between px-2.5 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white border border-slate-700/60 transition"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Rol & Görünüm Değiştir</span>
            </span>
            <span className="text-[10px] text-blue-400 font-medium">Değiştir →</span>
          </Link>
        </div>
      </aside>

      {/* Kurumsal Yardım ve Destek Modalı */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">İTO Eğitim Portalı Destek Masası</h3>
              </div>
              <button
                onClick={() => setIsHelpModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1.5">
                <span className="font-bold text-blue-900 block">Eğitim ve İdari İşler Koordinatörlüğü</span>
                <p className="text-blue-800 leading-relaxed">
                  Ders oturumları, grup kontenjanları veya sistem erişim talepleriniz için oda sekretaryasıyla iletişime geçebilirsiniz.
                </p>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Santral Telefonu:</span>
                  <strong className="text-slate-900">0342 862 10 20 (Dahili: 104)</strong>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">E-Posta:</span>
                  <strong className="text-blue-600">egitim@islahiyeto.org.tr</strong>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Hizmet Saatleri:</span>
                  <span className="text-slate-700">Hafta içi 08:30 – 17:30</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Hizmet Binası:</span>
                  <span className="text-slate-700">Cumhuriyet Mah. İstasyon Cad. No: 12 İslahiye</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsHelpModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold transition"
                >
                  Anladım, Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
