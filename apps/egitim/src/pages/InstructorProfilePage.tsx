import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  CheckCircle2,
  ShieldCheck,
  Bell,
  Save,
  GraduationCap,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  getStoredInstructorProfile,
  saveInstructorProfile,
  subscribeToInstructorProfileUpdates,
  InstructorProfileData,
} from '../services/instructorProfileStorage';

export const InstructorProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<InstructorProfileData>(getStoredInstructorProfile);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'notifications' | 'security'>('personal');

  // Form State
  const [fullName, setFullName] = useState(profile.fullName);
  const [academicTitle, setAcademicTitle] = useState(profile.academicTitle);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [institution, setInstitution] = useState(profile.institution);
  const [officeLocation, setOfficeLocation] = useState(profile.officeLocation);
  const [officeHours, setOfficeHours] = useState(profile.officeHours);

  const [academicSpecialization, setAcademicSpecialization] = useState(profile.academicSpecialization);
  const [biography, setBiography] = useState(profile.biography);

  const [notifySms, setNotifySms] = useState(profile.notifySms);
  const [notifyEmail, setNotifyEmail] = useState(profile.notifyEmail);
  const [notifyApp, setNotifyApp] = useState(profile.notifyApp);

  // Şifre Durumu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const unsub = subscribeToInstructorProfileUpdates((updated) => {
      setProfile(updated);
    });
    return unsub;
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const result = saveInstructorProfile({
      fullName,
      academicTitle,
      email,
      phone,
      institution,
      officeLocation,
      officeHours,
      academicSpecialization,
      biography,
      notifySms,
      notifyEmail,
      notifyApp,
    });

    if (result.success) {
      setFeedback({
        type: 'success',
        message: 'Eğitmen profil bilgileriniz başarıyla güncellendi.',
      });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({
        type: 'error',
        message: 'Profil güncellenirken bir hata oluştu.',
      });
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setFeedback({ type: 'error', message: 'Lütfen mevcut şifrenizi giriniz.' });
      return;
    }
    if (newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'Yeni şifreniz en az 6 karakter olmalıdır.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Yeni şifreler birbiriyle eşleşmiyor.' });
      return;
    }

    setFeedback({
      type: 'success',
      message: 'Güvenlik şifreniz başarıyla güncellendi.',
    });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Üst Başlık & Hızlı Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Eğitmen Profil & İletişim Masası
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Oda bünyesindeki eğitmen kütük bilgileriniz, akademik uzmanlık alanınız ve iletişim tercihlerinizi yönetin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Doğrulanmış Eğitmen Kütüğü</span>
          </span>
        </div>
      </div>

      {/* Geri Bildirim Bildirimi */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
              : 'bg-rose-50/80 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2 text-xs md:text-sm font-semibold">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-60 hover:opacity-100 font-bold ml-4"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Üst Profil Özet Kartı */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center font-bold text-xl shadow-xs ring-4 ring-blue-50">
              {profile.fullName.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg md:text-xl font-bold text-slate-900">{profile.fullName}</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {profile.registryCode}
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-600 mt-0.5 font-medium">
                {profile.academicTitle}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {profile.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {profile.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {profile.officeLocation}
                </span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[11px] text-slate-400 block">Kurum & Birim</span>
            <span className="text-xs font-semibold text-slate-800 block">
              {profile.institution}
            </span>
          </div>
        </div>
      </div>

      {/* Sekmeler & Form Konteyneri */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Sekme Butonları */}
        <div className="flex items-center border-b border-slate-200 overflow-x-auto bg-slate-50/50">
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'personal'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Kişisel & İletişim Bilgileri</span>
          </button>

          <button
            onClick={() => setActiveTab('academic')}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'academic'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Akademik Uzmanlık & Biyografi</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Bildirim & İletişim İzinleri</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Hesap Güvenliği & Şifre</span>
          </button>
        </div>

        {/* Sekme 1: Kişisel Bilgiler */}
        {activeTab === 'personal' && (
          <form onSubmit={handleSaveProfile} className="p-5 md:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Akademik Unvan & Rol
                </label>
                <input
                  type="text"
                  value={academicTitle}
                  onChange={(e) => setAcademicTitle(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kurumsal E-Posta Adresi
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  İletişim Telefon Numarası
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bağlı Kurum / Teşkilat
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ofis / Çalışma Odası Konumu
                </label>
                <input
                  type="text"
                  value={officeLocation}
                  onChange={(e) => setOfficeLocation(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Öğrenci Görüşme & Ofis Saatleri
                </label>
                <input
                  type="text"
                  value={officeHours}
                  onChange={(e) => setOfficeHours(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <Button type="submit" size="sm" className="gap-2">
                <Save className="w-4 h-4" />
                <span>Değişiklikleri Kaydet</span>
              </Button>
            </div>
          </form>
        )}

        {/* Sekme 2: Akademik Uzmanlık & Biyografi */}
        {activeTab === 'academic' && (
          <form onSubmit={handleSaveProfile} className="p-5 md:p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Akademik Uzmanlık Alanları & Çalışma Konuları
                </label>
                <input
                  type="text"
                  value={academicSpecialization}
                  onChange={(e) => setAcademicSpecialization(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Kursiyerlerin sınıf kanalı ve profilinizde görüntüleyeceği temel uzmanlık alanınız.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Eğitmen Özgeçmişi & Biyografi
                </label>
                <textarea
                  rows={6}
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <Button type="submit" size="sm" className="gap-2">
                <Save className="w-4 h-4" />
                <span>Biyografiyi Güncelle</span>
              </Button>
            </div>
          </form>
        )}

        {/* Sekme 3: Bildirim Tercihleri */}
        {activeTab === 'notifications' && (
          <form onSubmit={handleSaveProfile} className="p-5 md:p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between p-4 rounded-xl border border-slate-200/80 hover:bg-slate-50/50 transition">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900">SMS Bildirimleri</h4>
                  <p className="text-xs text-slate-500">
                    Acil oturum değişiklikleri, oda idari duyuruları ve sistem alarmları kayıtlı cep telefonunuza iletilir.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifySms}
                  onChange={(e) => setNotifySms(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                />
              </div>

              <div className="flex items-start justify-between p-4 rounded-xl border border-slate-200/80 hover:bg-slate-50/50 transition">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900">E-Posta Bildirimleri</h4>
                  <p className="text-xs text-slate-500">
                    Yeni kursiyer mesajları, ödev teslimleri ve haftalık akademik özet raporları kurumsal adresinize gönderilir.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                />
              </div>

              <div className="flex items-start justify-between p-4 rounded-xl border border-slate-200/80 hover:bg-slate-50/50 transition">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900">Portal İçi Bildirim Çanı</h4>
                  <p className="text-xs text-slate-500">
                    Portal üst çubuğunda anlık kanal mesajları ve teslim uyarıları için rozet gösterilir.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyApp}
                  onChange={(e) => setNotifyApp(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <Button type="submit" size="sm" className="gap-2">
                <Save className="w-4 h-4" />
                <span>Bildirim Tercihlerini Kaydet</span>
              </Button>
            </div>
          </form>
        )}

        {/* Sekme 4: Hesap Güvenliği */}
        {activeTab === 'security' && (
          <form onSubmit={handleUpdatePassword} className="p-5 md:p-6 space-y-6">
            <div className="max-w-md space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mevcut Şifreniz
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  placeholder="En az 6 karakter"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yeni Şifre (Tekrar)
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  placeholder="En az 6 karakter"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <Button type="submit" size="sm" className="gap-2">
                <Lock className="w-4 h-4" />
                <span>Şifreyi Güncelle</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
