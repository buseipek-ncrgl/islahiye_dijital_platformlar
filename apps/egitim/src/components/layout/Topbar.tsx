import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, Bell, LogOut, Sparkles } from 'lucide-react';
import { useDemoRole } from './DemoRoleContext';
import { AppNotification } from '../../types';
import {
  getNotificationsForUser,
  getUnreadNotificationCountForUser,
  markNotificationAsRead,
  subscribeToNotificationUpdates,
} from '../../services/notificationStorage';
import { authService } from '../../services/authAdapter';

interface TopbarProps {
  onToggleMobileMenu: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleMobileMenu }) => {
  const { currentRole, setRole, currentUser } = useDemoRole();
  const navigate = useNavigate();
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [userNotifications, setUserNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    if (!currentUser?.id) return;
    const notifs = getNotificationsForUser(currentUser.id);
    const unread = getUnreadNotificationCountForUser(currentUser.id);
    setUserNotifications(notifs);
    setUnreadCount(unread);
  };

  useEffect(() => {
    loadNotifications();
    const unsub = subscribeToNotificationUpdates(loadNotifications);
    return () => unsub();
  }, [currentUser?.id, currentRole]);

  // Dışarı tıklama durumunda menüleri kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    setRole('visitor');
    navigate('/giris');
  };

  const getRoleLabel = () => {
    switch (currentRole) {
      case 'superadmin':
        return 'Süper Yönetici';
      case 'admin':
        return 'Yönetici';
      case 'instructor':
        return 'Eğitmen';
      case 'trainee':
        return 'Kursiyer';
      case 'applicant':
        return 'Aday';
      default:
        return 'Ziyaretçi';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/90 h-16 px-4 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Sol Alan: Mobil Menü Butonu & Kurumsal Başlık */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden transition"
          aria-label="Menüyü Aç"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs tracking-wider shadow-sm md:hidden">
            İE
          </div>
          <div>
            <div className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
              İslahiye Ticaret Odası
            </div>
            <div className="text-[11px] text-blue-600 font-semibold tracking-wide flex items-center gap-1.5">
              <span>Eğitim Portalı</span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="hidden sm:inline text-slate-500 font-normal">
                {getRoleLabel()} Paneli
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sağ Alan: Demo Köprüsü, Bildirimler ve Kullanıcı Profili */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Ayrılmış Demo / Sunum Masası Butonu (Rol değiştirici yerine temiz köprü) */}
        <Link
          to="/demo"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition shadow-xs"
          title="Demo ve Rol Yönetim Masasına Geç"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline">Demo Masası</span>
          <span className="sm:hidden">Demo</span>
        </Link>

        {/* Bildirim Merkezi Açılır Menüsü */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            className="p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative transition"
            aria-expanded={notifMenuOpen}
            aria-label={`Bildirimler (${unreadCount} okunmamış)`}
            title={`${unreadCount} Okunmamış Bildirim`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center leading-none ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Bildirim Açılır Kutusu */}
          {notifMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold">Bildirimler</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500 font-bold">
                      {unreadCount} yeni
                    </span>
                  )}
                </div>
                <Link
                  to="/bildirimler"
                  onClick={() => setNotifMenuOpen(false)}
                  className="text-[11px] text-blue-300 hover:text-white transition"
                >
                  Tümünü Gör →
                </Link>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {userNotifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Henüz okunmamış bildiriminiz bulunmuyor.
                  </div>
                ) : (
                  userNotifications.slice(0, 5).map((notif) => {
                    const isUnread = notif.status === 'unread';
                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (currentUser?.id) {
                            markNotificationAsRead(notif.id, currentUser.id);
                          }
                          if (notif.targetRoute) {
                            navigate(notif.targetRoute);
                            setNotifMenuOpen(false);
                          }
                        }}
                        className={`p-3 text-left transition cursor-pointer hover:bg-slate-50 flex items-start gap-2.5 ${
                          isUnread ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            isUnread ? 'bg-blue-600' : 'bg-slate-300'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-900 leading-snug">
                            {notif.title}
                          </div>
                          <div className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-normal">
                            {notif.description}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {new Date(notif.createdAt).toLocaleDateString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <Link
                  to="/bildirimler"
                  onClick={() => setNotifMenuOpen(false)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                >
                  Bildirim Merkezine Git
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Kullanıcı Profili ve Oturum Menüsü */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
            aria-expanded={profileMenuOpen}
            aria-label="Kullanıcı Menüsü"
          >
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser.fullName}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {getRoleLabel()}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {currentUser.fullName
                ? currentUser.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                : 'U'}
            </div>
          </button>

          {/* Profil Açılır Kutusu */}
          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.fullName}
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {currentUser.email || 'ornek@islahiye.bel.tr'}
                </div>
                <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  {getRoleLabel()}
                </div>
              </div>

              <div className="p-2 space-y-1 text-xs text-slate-700">
                <Link
                  to="/demo"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-amber-50 text-amber-900 transition font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Demo ve Rol Masası</span>
                  </span>
                  <span className="text-[10px] text-amber-600 font-bold">Aç</span>
                </Link>

                <Link
                  to="/bildirimler"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
                >
                  <Bell className="w-3.5 h-3.5 text-slate-500" />
                  <span>Bildirimlerim</span>
                </Link>

                <div className="pt-1 border-t border-slate-100 my-1"></div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 transition text-left font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Oturumu Kapat</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
