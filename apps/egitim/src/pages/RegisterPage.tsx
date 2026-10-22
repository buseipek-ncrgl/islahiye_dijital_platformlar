import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Info,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { authService } from '../services/authAdapter';
import { useDemoRole } from '../components/layout/DemoRoleContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setRole } = useDemoRole();

  // Form alanları (Görsel 2)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setErrorMessage('Lütfen ad, soyad ve e-posta adresinizi giriniz.');
      return;
    }

    if (!password) {
      setErrorMessage('Lütfen bir parola belirleyiniz.');
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage('Belirlediğiniz parolalar birbiriyle eşleşmiyor.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.register({
        fullName,
        email,
        phone: '0500 000 00 00',
        password,
        agreeToTerms: true,
      });

      setIsLoading(false);

      if (res.success && res.user) {
        setSuccessNotice(
          'Aday hesabınız simüle edildi. Aday Paneli’ne yönlendiriliyorsunuz...'
        );
        setRole('applicant');
        setTimeout(() => {
          navigate('/aday');
        }, 1500);
      } else {
        setErrorMessage(res.error || 'Kayıt işlemi gerçekleştirilemedi.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Kayıt sırasında bir hata oluştu.');
    }
  };

  const handleQuickCandidateStart = () => {
    setFirstName('Fatma');
    setLastName('Şahin');
    setEmail('fatma.sahin@ornek.com');
    setPassword('demo1234');
    setPasswordConfirm('demo1234');
    setRole('applicant');
    navigate('/aday');
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
          <span className="text-slate-800 font-medium">Hesap Oluştur</span>
        </nav>

        {/* 2 Kolonlu Ana Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Sol Kolon: Başlık ve 01-02-03 Adımları */}
          <div className="lg:col-span-6 space-y-6 pt-2">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                <span className="w-4 h-0.5 bg-blue-600 inline-block"></span>
                <span>YENİ ADAY HESABI</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
                Eğitim başvuruna<br />
                <span className="text-blue-600">buradan başla.</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-4 sm:mt-5 max-w-lg leading-relaxed">
                Bir aday hesabıyla eğitim programlarına başvurabilir, başvuru durumunu takip edebilir ve kabul sonrasındaki adımlara ulaşabilirsin.
              </p>
            </div>

            <hr className="border-slate-200/90 my-8" />

            {/* Başvuru Adımları 01 - 02 - 03 */}
            <div className="space-y-6">
              {/* Adım 01 */}
              <div className="flex items-start gap-4">
                <span className="text-base sm:text-lg font-black text-blue-600 font-mono tracking-tight shrink-0 mt-0.5">
                  01
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Hesabını oluştur</h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Başvurularını takip edeceğin kişisel alanını hazırla.
                  </p>
                </div>
              </div>

              {/* Adım 02 */}
              <div className="flex items-start gap-4">
                <span className="text-base sm:text-lg font-black text-blue-600 font-mono tracking-tight shrink-0 mt-0.5">
                  02
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">İlgilendiğin programı seç</h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Programın hedef kitlesini ve koşullarını incele.
                  </p>
                </div>
              </div>

              {/* Adım 03 */}
              <div className="flex items-start gap-4">
                <span className="text-base sm:text-lg font-black text-blue-600 font-mono tracking-tight shrink-0 mt-0.5">
                  03
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Başvurunu tamamla</h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    Program başvurusunu gönder ve sonucu panelinden takip et.
                  </p>
                </div>
              </div>
            </div>

            {/* Eğitmen veya Yönetici Misin? Uyarısı */}
            <div className="pt-8 space-y-1.5 border-t border-slate-200/70">
              <h4 className="text-sm font-bold text-slate-900">
                Eğitmen veya yönetici misin?
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md">
                Personel hesapları bu aday kayıt formundan oluşturulmaz; yetkili kurum yöneticisi tarafından tanımlanır.
              </p>
            </div>
          </div>

          {/* Sağ Kolon: Kayıt Kartı */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-9 space-y-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  ADAY HESABI • KAYIT
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Hesap oluştur
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Hesap bilgilerin başvuru sürecinde kullanılacaktır. Bu sayfa şu an tasarım önizlemesidir.
                </p>
              </div>

              {/* Mavi Bilgilendirme Kutusu */}
              <div className="bg-[#EFF6FF] border border-blue-100 rounded-xl p-3.5 sm:p-4 flex items-start gap-3 text-xs sm:text-[13px] text-slate-700">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="font-bold text-slate-900">Henüz gerçek kayıt yapılmıyor.</strong> Lütfen gerçek ad, e-posta veya parola girmeyin. Bu makette bilgiler gönderilmez ve saklanmaz.
                </p>
              </div>

              {/* Hata Bildirimi */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Başarı Bildirimi */}
              {successNotice && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{successNotice}</span>
                </div>
              )}

              {/* Kayıt Formu */}
              <form onSubmit={handleRegister} className="space-y-4 pt-1">
                {/* Ad - Soyad 2'li Satır */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                      Ad
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Adınız"
                      className="w-full px-3.5 py-2.5 sm:py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition placeholder:text-slate-400 text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                      Soyad
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Soyadınız"
                      className="w-full px-3.5 py-2.5 sm:py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition placeholder:text-slate-400 text-slate-900 bg-white"
                    />
                  </div>
                </div>

                {/* E-posta Adresi */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                    E-posta adresi
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@eposta.com"
                    className="w-full px-3.5 py-2.5 sm:py-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition placeholder:text-slate-400 text-slate-900 bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Üretim sürümünde hesap bildirimleri için kullanılacaktır.
                  </p>
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
                      placeholder="Parola belirleyin"
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
                  <p className="text-[11px] text-slate-400 mt-1">
                    Parola kuralları gerçek hesap altyapısı geliştirilirken netleştirilecektir.
                  </p>
                </div>

                {/* Parolayı Tekrar Gir */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                    Parolayı tekrar gir
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswordConfirm ? 'text' : 'password'}
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="Parolayı tekrar girin"
                      className="w-full px-3.5 py-2.5 sm:py-3 pr-20 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition placeholder:text-slate-400 text-slate-900 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition cursor-pointer"
                    >
                      {showPasswordConfirm ? 'Gizle' : 'Göster'}
                    </button>
                  </div>
                </div>

                {/* Hesap Oluştur Butonu */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 sm:py-3.5 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Hesap Hazırlanıyor...
                    </span>
                  ) : (
                    <>
                      <span>Hesap Oluştur</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Giriş Yap Yönlendirmesi */}
                <div className="text-center text-xs text-slate-600 pt-2">
                  Zaten hesabın var mı?{' '}
                  <Link to="/giris" className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2">
                    Giriş Yap
                  </Link>
                </div>
              </form>

              {/* Kart İçi Gizlilik ve Hesap Güvenliği Notu (Görsel 2 ile Birebir) */}
              <div className="pt-4 border-t border-slate-100 space-y-1">
                <h4 className="text-xs font-bold text-slate-800">
                  Gizlilik ve hesap güvenliği
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Gerçek kayıt sisteminde hesap doğrulaması, parola güvenliği ve kişisel verilerin işlenmesi için onaylı politika ve güvenli sunucu altyapısı gerekecektir. Bu maket söz konusu işlemleri gerçekleştirmez.
                </p>
              </div>
            </div>

            {/* Hızlı Demo Aday Kısayolu */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Demo Aday ile Hemen Başla</div>
                  <div className="text-[11px] text-slate-500">Fatma Şahin profiliyle formu doldurmadan doğrudan aday alanını aç</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleQuickCandidateStart}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs whitespace-nowrap transition cursor-pointer"
              >
                Adayı Başlat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* FULL-WIDTH BİLGİ ŞERİDİ (Görsel 2 ile Birebir)                          */}
      {/* ===================================================================== */}
      <div className="w-full bg-[#F1F5F9] border-t border-b border-slate-200/90 py-3.5 px-4 sm:px-6 lg:px-8 mt-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 text-center sm:text-left leading-relaxed">
            <strong className="font-bold text-slate-900">Hesap açmak, eğitime kabul anlamına gelmez.</strong>{' '}
            Program başvurusu ve yönetici değerlendirmesi ayrı adımlardır; eğitmen ve yönetici yetkileri kullanıcı tarafından seçilemez.
          </div>
          <Link
            to="/giris"
            className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-700 whitespace-nowrap shrink-0 group transition"
          >
            <span>Giriş tasarımını incele</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};
