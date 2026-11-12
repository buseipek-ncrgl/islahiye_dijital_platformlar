import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, ArrowLeft, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAdminAuth } from '../../../context/AdminAuthContext';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = login({ username, password });
      setIsLoading(false);

      if (result.success) {
        navigate('/yonetim');
      } else {
        setErrorMsg(result.error || 'Giriş başarısız.');
      }
    }, 350);
  };

  const handleQuickFill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      {/* Top Header Bar */}
      <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white text-sm block leading-none">İslahiye Dijital Platformlar</span>
            <span className="text-[11px] text-slate-400">Kurumsal Yönetim ve İçerik Masası (CMS)</span>
          </div>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Ziyaretçi Portalına Dön</span>
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-850 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-3 shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-white">Yetkili Yönetici Girişi</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Bu alan kamuya açık değildir. Yalnızca tescil, envanter ve yayın yetkisi bulunan kurum personeli içindir.
            </p>
          </div>

          {/* Security Notice */}
          <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Erişim Kısıtlaması:</strong> Ziyaretçilerin ve yetkisiz kullanıcıların API ve envanter düzenleme yetkisi bulunmamaktadır.
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kurumsal Kullanıcı Adı
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin veya editor"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-750 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Erişim Parolası
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-750 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide transition-colors shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Kimlik Doğrulanıyor...</span>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Yönetim Masasına Giriş Yap</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Staff Demo Hints */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <span className="text-[11px] text-slate-500 block mb-2 font-medium">
              Yetkili Kurum Personeli Hızlı Giriş:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'islahiye2026')}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-[11px] text-slate-300 border border-slate-700/60 transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Oda Yöneticisi</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('editor', 'islahiye2026')}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-[11px] text-slate-300 border border-slate-700/60 transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3 h-3 text-amber-400" />
                <span>İçerik Editörü</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-slate-800 px-6 flex items-center justify-between text-xs text-slate-500">
        <span>© 2026 İslahiye Ticaret Odası &amp; Belediye İş Birliği Platformu</span>
        <span className="text-[11px]">Güvenli Yönetim Protokolü v2.1</span>
      </footer>
    </div>
  );
};

