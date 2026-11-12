import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  Check,
  Edit3,
  Eye,
  UserCheck,
  RefreshCw,
  Database,
  LogOut,
} from 'lucide-react';
import { useAdminRole } from '../../../context/AdminRoleContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import { useBackendConnection } from '../../../context/BackendConnectionContext';
import { AdminRole } from '../../../types/admin';

interface AdminTopbarProps {
  onToggleSidebar: () => void;
  pageTitle: string;
  subtitle?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  onToggleSidebar,
  pageTitle,
  subtitle,
  searchQuery,
  onSearchChange,
}) => {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const { currentRole, setRole, roleProfile, rolesList } = useAdminRole();
  const { isOnline, isChecking, checkConnection } = useBackendConnection();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRoleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleIcon = (roleId: AdminRole) => {
    switch (roleId) {
      case 'admin':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-700" />;
      case 'publisher':
        return <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />;
      case 'editor':
        return <Edit3 className="w-3.5 h-3.5 text-amber-700" />;
      case 'viewer':
        return <Eye className="w-3.5 h-3.5 text-slate-600" />;
      default:
        return <UserCheck className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3.5 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Menüyü Aç"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate leading-tight">
            {pageTitle}
          </h1>
          {subtitle && (
            <p className="text-[11px] text-slate-500 truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Center: Search if provided */}
      {onSearchChange !== undefined && (
        <div className="hidden md:flex items-center flex-1 max-w-xs relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="İçeriklerde hızlı ara..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
          />
        </div>
      )}

      {/* Right: Simulation Mode Badge & Interactive Role Switcher & Visitor Portal Link */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Dynamic Real Backend Connection Status Pill */}
        {isOnline === true ? (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium shadow-2xs"
            title="ASP.NET Core REST API ve MSSQL / Veritabanı (Port 5235) Bağlı"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="w-3 h-3 text-emerald-600 hidden sm:inline" />
            <span className="hidden sm:inline">Canlı Veritabanı:</span>
            <span className="font-semibold text-emerald-950">Port 5235 Aktif</span>
          </div>
        ) : isOnline === false ? (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium shadow-2xs"
            title="Yerel veri deposu aktif. ASP.NET Core REST API (Port 5235) çevrimdışı."
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="hidden sm:inline">API:</span>
            <span className="font-semibold text-rose-950">Yerel Mod</span>
            <button
              type="button"
              onClick={() => checkConnection()}
              disabled={isChecking}
              className="ml-1 p-0.5 rounded text-rose-600 hover:text-rose-950 hover:bg-rose-100 transition-colors"
              title="Sunucu Bağlantısını Kontrol Et"
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-amber-900">Bağlantı Kontrol Ediliyor...</span>
          </div>
        )}

        {/* Interactive Role Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
            title="Kullanıcı Rolünü Değiştir"
          >
            {getRoleIcon(currentRole)}
            <span className="text-slate-600">Rol:</span>
            <strong className="text-slate-900 font-semibold">{roleProfile.name.split('/')[0].trim()}</strong>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${roleMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Role Dropdown Menu */}
          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-fade-in font-sans">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Yetki ve Rol Profili
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Aktif yönetici rolünün arayüz yetkilerini ve işlem kapsamını görüntüleyin.
                </div>
              </div>

              <div className="space-y-1">
                {rolesList.map((r) => {
                  const isSelected = r.id === currentRole;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setRole(r.id);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-emerald-50/80 border border-emerald-200'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">{getRoleIcon(r.id)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-bold ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                            {r.name.split('/')[0].trim()}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                          {r.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 px-3 py-1 bg-slate-50 rounded-lg text-[10px] text-slate-500">
                Aktif: <strong className="text-slate-700">{roleProfile.permissions[0]}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Visitor Portal Direct Link */}
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors shadow-2xs"
        >
          <span className="hidden sm:inline">Portala Git</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* Secure Admin Logout Button */}
        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
          title="Yönetici Oturumunu Kapat"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Güvenli Çıkış</span>
        </button>
      </div>
    </header>
  );
};
