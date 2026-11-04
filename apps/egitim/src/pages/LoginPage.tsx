import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Check,
  Info,
  ArrowRight,
  AlertCircle,
  X,
  ShieldCheck,
  User,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Copy,
  CheckCheck,
  Search,
  KeyRound,
} from 'lucide-react';
import { authService, REAL_ACCOUNTS } from '../services/authAdapter';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setRole } = useDemoRole();

  // Form durumları
  const [emailOrUsername, setEmailOrUsername] = useState('admin@islahiye.bel.tr');
  const [password, setPassword] = useState('Admin123456!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modallar ve Arama
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [demoInfoModalOpen, setDemoInfoModalOpen] = useState(false);
  const [allAccountsModalOpen, setAllAccountsModalOpen] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [accountSearch, setAccountSearch] = useState<string>('');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleFillCredentials = (email: string, pass: string) => {
    setEmailOrUsername(email);
    setPassword(pass);
    setErrorMessage(null);
  };

  const handleCopyPassword = (email: string, pass: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleQuickLogin = async (acc: typeof REAL_ACCOUNTS[0]) => {
    setEmailOrUsername(acc.email);
    setPassword(acc.password);
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authService.login({
        emailOrUsername: acc.email,
        password: acc.password,
        rememberMe: true,
      });
      setIsLoading(false);
      if (res.success && res.user) {
        setRole(res.user.role);
        navigate(acc.targetRoute);
      } else {
        setErrorMessage(res.error || 'Giriş yapılamadı.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Oturum açılamadı.');
    }
  };

  const getAccountBadge = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return { label: 'Süper Admin', badgeClass: 'bg-slate-900 text-white border-slate-900', icon: ShieldCheck };
      case 'admin':
        return { label: 'Yönetici', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', icon: ShieldCheck };
      case 'instructor':
        return { label: 'Eğitmen', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Sparkles };
      case 'trainee':
        return { label: 'Kursiyer', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: GraduationCap };
      case 'applicant':
        return { label: 'Aday', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200', icon: User };
      default:
        return { label: 'Ziyaretçi', badgeClass: 'bg-slate-50 text-slate-700 border-slate-200', icon: User };
    }
  };

  const filteredAccounts = useMemo(() => {
    return REAL_ACCOUNTS.filter((acc) => {
      const matchesRole =
        selectedRoleFilter === 'all'
          ? true
          : selectedRoleFilter === 'admin'
          ? acc.role === 'admin' || acc.role === 'superadmin'
          : acc.role === selectedRoleFilter;

      const matchesSearch =
        accountSearch.trim() === '' ||
        acc.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
        acc.email.toLowerCase().includes(accountSearch.toLowerCase()) ||
        acc.label.toLowerCase().includes(accountSearch.toLowerCase());

      return matchesRole && matchesSearch;
    });
  }, [selectedRoleFilter, accountSearch]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!emailOrUsername.trim()) {
      setErrorMessage('Lütfen kurumsal e-posta adresinizi giriniz.');
      return;
    }

    if (!password) {
      setErrorMessage('Lütfen parolanızı giriniz.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.login({
        emailOrUsername,
        password,
        rememberMe: true,
      });

      setIsLoading(false);

      if (res.success && res.user) {
        setRole(res.user.role);

        if (res.user.role === 'applicant') navigate('/aday');
        else if (res.user.role === 'trainee') navigate('/kursiyer');
        else if (res.user.role === 'instructor') navigate('/egitmen');
        else if (res.user.role === 'admin') navigate('/yonetim');
        else if (res.user.role === 'superadmin') navigate('/yonetim/super-admin');
        else navigate('/');
      } else {
        setErrorMessage(res.error || 'Giriş yapılamadı. Lütfen kayıtlı e-posta adresinizi ve şifrenizi kontrol ediniz.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Beklenmeyen bir oturum hatası oluştu.');
    }
  };

  return (
    <div className="bg-[#FAFBFD] min-h-[calc(100vh-140px)] flex flex-col justify-between">
      {/* Üst Ana Kapsayıcı */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12">
        {/* Kırıntı Menü (Breadcrumb) */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 mb-8 sm:mb-12">
          <span className="text-slate-500 font-medium">İTO Eğitim Portalı</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 font-semibold">Giriş Yap &amp; Çalışma Alanı</span>
        </nav>

        {/* 2 Kolonlu Ana Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Sol Kolon: Başlık ve Bilgilendirme */}
          <div className="lg:col-span-6 space-y-6 pt-2">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                <span className="w-4 h-0.5 bg-blue-600 inline-block"></span>
                <span>KİŞİSEL ÇALIŞMA ALANI</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
                Eğitimine kaldığın<br />
                yerden <span className="text-blue-600">devam et.</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-4 sm:mt-5 max-w-lg leading-relaxed">
                Başvurularını, derslerini ve değerlendirmelerini tek bir yerden takip etmek için hesabına giriş yap.
              </p>
            </div>

            <hr className="border-slate-200/90 my-8" />

            {/* Hesabınla Yapabileceklerin */}
            <div className="space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                HESABINLA YAPABİLECEKLERİN
              </h3>

              <div className="space-y-4">
                {/* Madde 1 */}
                <div className="flex items-start gap-3.5">
                  <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Başvurularını takip et</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                      İnceleme, kabul ve kesin kayıt durumlarını görüntüle.
                    </p>
                  </div>
                </div>

                {/* Madde 2 */}
                <div className="flex items-start gap-3.5">
                  <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Eğitimlerine ulaş</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                      Ders programını, yoklamanı ve ödevlerini takip et.
                    </p>
                  </div>
                </div>

                {/* Madde 3 */}
                <div className="flex items-start gap-3.5">
                  <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Sonuçlarını görüntüle</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                      Başarı ve belge durumlarını tek alanda incele.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 pt-3">
              İlk kez başvuracaksan{' '}
              <Link to="/hesap-olustur" className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2">
                aday hesabı oluşturma
              </Link>{' '}
              adımından başlayabilirsin.
            </p>
          </div>

          {/* Sağ Kolon: Giriş Kartı ve Demo Kısayolları */}
          <div className="lg:col-span-6 space-y-4">
            {/* Giriş Kartı */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-9 space-y-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  HESAP ERİŞİMİ
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Hesabına giriş yap
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Kişisel eğitim alanına erişmek için hesap bilgilerini kullan.
                </p>
              </div>

              {/* Mavi Bilgilendirme Kutusu (Canlı Sistem) */}
              <div className="bg-[#EFF6FF] border border-blue-100 rounded-xl p-3.5 sm:p-4 flex items-start gap-3 text-xs sm:text-[13px] text-slate-700">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="font-bold text-slate-900">Canlı Sistem Aktif.</strong> Veritabanında kayıtlı kullanıcı hesapları veya aşağıdaki hazır sistem hesaplarıyla doğrudan oturum açabilirsiniz.
                </p>
              </div>

              {/* Hata Bildirimi */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Giriş Formu */}
              <form onSubmit={handleFormSubmit} className="space-y-4 pt-1">
                {/* E-posta Adresi */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                    E-posta adresi
                  </label>
                  <input
                    type="text"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="ornek@eposta.com"
                    className="w-full px-3.5 py-2.5 sm:py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition placeholder:text-slate-400 text-slate-900 bg-white"
                  />
                </div>

                {/* Parola */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                    Parola
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Parolanızı girin"
                      className="w-full px-3.5 py-2.5 sm:py-3 pr-20 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition placeholder:text-slate-400 text-slate-900 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition cursor-pointer"
                    >
                      {showPassword ? 'Gizle' : 'Göster'}
                    </button>
                  </div>
                </div>

                {/* Alt Satır: Doğrulama notu ve Şifremi Unuttum */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Hesap doğrulaması henüz bağlı değil.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(true)}
                    className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    Şifremi unuttum
                  </button>
                </div>

                {/* Giriş Yap Butonu */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 sm:py-3.5 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Oturum Açılıyor...
                    </span>
                  ) : (
                    <>
                      <span>Giriş Yap</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Kayıt Ol Yönlendirmesi */}
                <div className="text-center text-xs text-slate-600 pt-2">
                  Henüz hesabın yok mu?{' '}
                  <Link to="/hesap-olustur" className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2">
                    Hesap Oluştur
                  </Link>
                </div>
              </form>
            </div>

            {/* Kart Altı Yetki Notu */}
            <div className="text-center text-xs text-slate-500">
              Kurum personeli erişimi yetkili kurum yöneticisi tarafından tanımlanır.{' '}
              <button
                type="button"
                onClick={() => setDemoInfoModalOpen(true)}
                className="font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Yetkilendirme hakkında bilgi
              </button>
            </div>

            {/* ================================================================= */}
            {/* DEMO HESAP KISAYOLLARI (30 GERÇEKÇİ HESAP & ŞİFRELER)               */}
            {/* ================================================================= */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-900 tracking-wide">
                    SİSTEM HESAPLARI &amp; GİRİŞ BİLGİLERİ ({REAL_ACCOUNTS.length} HESAP)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAllAccountsModalOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 border border-blue-200 px-2.5 py-1 rounded-lg transition cursor-pointer self-start sm:self-auto"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Tüm Şifreleri &amp; Tabloyu Gör</span>
                </button>
              </div>

              {/* Rol Filtre Butonları */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'all', label: `Tümü (${REAL_ACCOUNTS.length})` },
                  { id: 'admin', label: 'Yönetim (5)' },
                  { id: 'instructor', label: 'Eğitmenler (5)' },
                  { id: 'trainee', label: 'Kursiyerler (12)' },
                  { id: 'applicant', label: 'Adaylar (7)' },
                  { id: 'visitor', label: 'Ziyaretçi (1)' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedRoleFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition shrink-0 cursor-pointer ${
                      selectedRoleFilter === tab.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Hızlı Arama */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  placeholder="İsim, unvan veya e-posta ile ara..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Hesap Kartları Listesi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredAccounts.map((p) => {
                  const badge = getAccountBadge(p.role);
                  const Icon = badge.icon;
                  const isCopied = copiedEmail === p.email;

                  return (
                    <div
                      key={p.email}
                      className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-blue-50/30 hover:border-blue-300 transition flex flex-col justify-between space-y-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.badgeClass}`}>
                            {badge.label}
                          </span>
                          <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </div>
                        <div className="text-xs font-bold text-slate-900 leading-snug truncate" title={p.name}>
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate" title={p.label}>
                          {p.label}
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono truncate bg-white px-1.5 py-0.5 rounded border border-slate-200/70" title={p.email}>
                          {p.email}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                          <span className="font-mono text-slate-700 font-semibold">{p.password}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyPassword(p.email, p.password)}
                            className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 cursor-pointer"
                            title="Parolayı Kopyala"
                          >
                            {isCopied ? (
                              <>
                                <CheckCheck className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600 font-semibold">Kopyalandı</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Kopyala</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => handleFillCredentials(p.email, p.password)}
                          className="text-[10px] font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded transition cursor-pointer"
                          title="E-posta ve şifreyi forma yaz"
                        >
                          Doldur
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickLogin(p)}
                          className="text-[10px] font-bold text-blue-700 hover:text-white hover:bg-blue-600 bg-blue-100/70 px-2.5 py-1 rounded transition cursor-pointer ml-auto flex items-center gap-1"
                          title="Doğrudan bu hesapla giriş yap ve paneli aç"
                        >
                          <span>Giriş Yap</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredAccounts.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-500">
                  Arama kriterlerine uygun sistem hesabı bulunamadı.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* FULL-WIDTH BİLGİ ŞERİDİ (Görsel 1 ile Birebir)                          */}
      {/* ===================================================================== */}
      <div className="w-full bg-[#F1F5F9] border-t border-b border-slate-200/90 py-3.5 px-4 sm:px-6 lg:px-8 mt-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 text-center sm:text-left leading-relaxed">
            <strong className="font-bold text-slate-900">İslahiye Ticaret Odası Eğitim Portalı Güvenli Giriş.</strong>{' '}
            Tüm kursiyer, eğitmen ve yetkili personel girişleri kurumsal kimlik doğrulaması ile güvence altına alınmıştır.
          </div>
          <Link
            to="/hesap-olustur"
            className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-700 whitespace-nowrap shrink-0 group transition"
          >
            <span>Yeni kursiyer hesabı oluştur</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* ŞİFREMİ UNUTTUM MODALI */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Şifre Sıfırlama Bilgilendirmesi</span>
              </div>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                Bu platform bir <strong>tasarım ve operasyonel prototiptir</strong>. Şifrenizi unuttuysanız aşağıdaki standart demo hesap parolalarını kullanabilir veya sistem hesapları tablosundan tek tıkla oturum açabilirsiniz.
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1.5">
                <div className="font-bold text-slate-900">Standart Rol Parolaları:</div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                  <div>Yöneticiler: <strong className="text-slate-900">Admin123456!</strong></div>
                  <div>Eğitmenler: <strong className="text-slate-900">Instructor123456!</strong></div>
                  <div>Kursiyerler: <strong className="text-slate-900">Trainee123456!</strong></div>
                  <div>Adaylar: <strong className="text-slate-900">Applicant123456!</strong></div>
                </div>
              </div>
            </div>
            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setForgotModalOpen(false);
                  setAllAccountsModalOpen(true);
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline cursor-pointer"
              >
                Tüm Hesap Listesini Aç
              </button>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Anladım
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TÜM HESAPLAR VE ŞİFRELER TABLOSU MODALI */}
      {allAccountsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Başlığı */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Kullanıcı Hesapları &amp; Giriş Parolaları Rehberi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sistemde tanımlı 30 gerçekçi hesap, unvanları ve tek tıkla giriş bağlantıları
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAllAccountsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/70 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filtre ve Arama Barı */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 bg-white">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: `Tümü (${REAL_ACCOUNTS.length})` },
                  { id: 'admin', label: 'Yönetim (5)' },
                  { id: 'instructor', label: 'Eğitmenler (5)' },
                  { id: 'trainee', label: 'Kursiyerler (12)' },
                  { id: 'applicant', label: 'Adaylar (7)' },
                  { id: 'visitor', label: 'Ziyaretçi (1)' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedRoleFilter(tab.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
                      selectedRoleFilter === tab.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  placeholder="İsim veya e-posta ara..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Tablo Alanı */}
            <div className="overflow-y-auto flex-1 p-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/50">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Rol</th>
                    <th className="py-2.5 px-3">Ad Soyad &amp; Unvan</th>
                    <th className="py-2.5 px-3">Kurumsal E-Posta</th>
                    <th className="py-2.5 px-3">Parola</th>
                    <th className="py-2.5 px-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAccounts.map((acc, idx) => {
                    const badge = getAccountBadge(acc.role);
                    const isCopied = copiedEmail === acc.email;

                    return (
                      <tr key={acc.email} className="hover:bg-blue-50/30 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${badge.badgeClass}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{acc.name}</div>
                          <div className="text-[11px] text-slate-500">{acc.label}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">
                          {acc.email}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                              {acc.password}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyPassword(acc.email, acc.password)}
                              className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-slate-100 transition cursor-pointer"
                              title="Parolayı Kopyala"
                            >
                              {isCopied ? (
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                handleFillCredentials(acc.email, acc.password);
                                setAllAccountsModalOpen(false);
                              }}
                              className="text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-md transition cursor-pointer"
                              title="Form alanlarına doldur"
                            >
                              Doldur
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAllAccountsModalOpen(false);
                                handleQuickLogin(acc);
                              }}
                              className="text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-md transition cursor-pointer inline-flex items-center gap-1"
                              title="Doğrudan bu kullanıcıyla oturum aç"
                            >
                              <span>Giriş</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Alt Kısım */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <div>
                Referans doküman: <code className="bg-slate-200/80 px-1 py-0.5 rounded font-mono text-[11px] text-slate-800">docs/KULLANICI_HESAPLARI_VE_GIRIS_BILGILERI.md</code>
              </div>
              <button
                type="button"
                onClick={() => setAllAccountsModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEMO HAKKINDA BİLGİ MODALI */}
      {demoInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Sistem Girişi & Personel Yetkilendirmesi</span>
              </div>
              <button
                type="button"
                onClick={() => setDemoInfoModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                Kurum personeli, eğitmen ve yönetici yetkileri <strong>İE Kurum Yöneticisi</strong> tarafından merkezi olarak açılır. Halka açık kayıt formundan yalnızca <strong>Aday Hesabı</strong> oluşturulabilir.
              </p>
              <p>
                Aşağıda yer alan <strong>Hızlı Profil Kısayolları</strong> aracılığıyla Kursiyer, Eğitmen, Yönetici ve Sistem Yöneticisi profillerine doğrudan geçiş yapabilirsiniz.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDemoInfoModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
