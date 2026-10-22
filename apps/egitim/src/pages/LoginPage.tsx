import React, { useState } from 'react';
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
} from 'lucide-react';
import { authService } from '../services/authAdapter';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { DEMO_USERS } from '../data/educationData';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setRole } = useDemoRole();

  // Form durumları
  const [emailOrUsername, setEmailOrUsername] = useState('ayse.demir@ornek.com');
  const [password, setPassword] = useState('demo1234');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modallar
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [demoInfoModalOpen, setDemoInfoModalOpen] = useState(false);

  // Kurumsal hazır demo hesapları listesi (Tüm Roller)
  const quickProfiles: Array<{
    role: UserRole;
    label: string;
    email: string;
    name: string;
    title: string;
    targetRoute: string;
    icon: any;
    badgeClass: string;
  }> = [
    {
      role: 'trainee',
      label: 'Kursiyer',
      name: DEMO_USERS.trainee.fullName || 'Ayşe Demir',
      email: DEMO_USERS.trainee.email || 'ayse.demir@ornek.com',
      title: 'Devam Eden Kursiyer',
      targetRoute: '/kursiyer',
      icon: GraduationCap,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      role: 'applicant',
      label: 'Aday',
      name: DEMO_USERS.applicant.fullName || 'Fatma Şahin',
      email: DEMO_USERS.applicant.email || 'fatma.sahin@ornek.com',
      title: 'Başvuru Sahibi',
      targetRoute: '/aday',
      icon: User,
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      role: 'instructor',
      label: 'Eğitmen',
      name: DEMO_USERS.instructor.fullName || 'Murat Özkan',
      email: 'murat.ozkan@ornek.com',
      title: 'Ders & Yoklama Sorumlusu',
      targetRoute: '/egitmen',
      icon: Sparkles,
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      role: 'admin',
      label: 'Yönetici',
      name: DEMO_USERS.admin.fullName || 'Selin Aydın',
      email: 'selin.aydin@ornek.com',
      title: 'Eğitim & Süreç Yöneticisi',
      targetRoute: '/yonetim',
      icon: ShieldCheck,
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      role: 'superadmin',
      label: 'Süper Admin',
      name: DEMO_USERS.superadmin.fullName || 'Kemal Ertürk',
      email: 'kemal.erturk@ornek.com',
      title: 'Sistem & Güvenlik Yöneticisi',
      targetRoute: '/yonetim/super-admin',
      icon: ShieldCheck,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ];

  const handleFillCredentials = (email: string) => {
    setEmailOrUsername(email);
    setPassword('demo1234');
    setErrorMessage(null);
  };

  const handleQuickLogin = (role: UserRole, email: string, targetRoute: string) => {
    setEmailOrUsername(email);
    setPassword('demo1234');
    setRole(role);
    navigate(targetRoute);
  };

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
        setErrorMessage(res.error || 'Giriş yapılamadı. Lütfen geçerli bir demo e-postası giriniz.');
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
          <Link to="/" className="hover:text-slate-900 transition-colors">
            Ana Sayfa
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-800 font-medium">Giriş Yap</span>
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

              {/* Mavi Bilgilendirme Kutusu (Tasarım Önizlemesi) */}
              <div className="bg-[#EFF6FF] border border-blue-100 rounded-xl p-3.5 sm:p-4 flex items-start gap-3 text-xs sm:text-[13px] text-slate-700">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="font-bold text-slate-900">Tasarım önizlemesi.</strong> Gerçek giriş henüz aktif değildir. Lütfen gerçek e-posta veya parola yazmayın.
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
                Demo hakkında bilgi
              </button>
            </div>

            {/* ================================================================= */}
            {/* DEMO HESAP KISAYOLLARI (TÜM ROLLER)                                */}
            {/* ================================================================= */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-900 tracking-wide">
                    DEMO HESAPLARI KISAYOLU (TÜM ROLLER)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Tek tıkla giriş veya formu doldurma
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {quickProfiles.map((p) => {
                  const Icon = p.icon;
                  return (
                    <div
                      key={p.role}
                      className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-blue-50/40 hover:border-blue-300 transition flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${p.badgeClass}`}>
                            {p.label}
                          </span>
                          <Icon className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div className="text-xs font-bold text-slate-900 leading-snug">{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate" title={p.email}>
                          {p.email}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => handleFillCredentials(p.email)}
                          className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded transition cursor-pointer"
                          title="E-posta ve şifreyi forma yaz"
                        >
                          Doldur
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickLogin(p.role, p.email, p.targetRoute)}
                          className="text-[10px] font-bold text-blue-700 hover:text-white hover:bg-blue-600 bg-blue-100/70 px-2.5 py-1 rounded transition cursor-pointer ml-auto flex items-center gap-1"
                          title="Doğrudan bu rolle paneli aç"
                        >
                          <span>Hemen Aç</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
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
            <strong className="font-bold text-slate-900">Demo ve gerçek giriş ayrı işlemlerdir.</strong>{' '}
            Bu maket yalnızca arayüzü gösterir; rol değiştirme, test profilleri ve veri sıfırlama normal giriş ekranının parçası değildir.
          </div>
          <Link
            to="/hesap-olustur"
            className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-700 whitespace-nowrap shrink-0 group transition"
          >
            <span>Yeni hesap akışını incele</span>
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
                Bu platform bir <strong>tasarım ve mimari önizleme prototipidir</strong>. Gerçek e-posta veya SMS doğrulama servisi bu aşamada bağlı değildir.
              </p>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1">
                <div className="font-bold text-slate-900">Demo Giriş Bilgisi:</div>
                <p>Tüm demo hesapları için varsayılan parola: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono font-bold text-slate-800">demo1234</code></p>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
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

      {/* DEMO HAKKINDA BİLGİ MODALI */}
      {demoInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Demo Ortamı & Personel Yetkilendirmesi</span>
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
                Aşağıda yer alan <strong>Demo Hesap Kısayolları</strong> aracılığıyla Kursiyer, Eğitmen, Yönetici ve Süper Admin rollerini doğrudan test edebilirsiniz.
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
