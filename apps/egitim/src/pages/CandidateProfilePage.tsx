import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  MapPin,
  Lock,
  CheckCircle2,
  ShieldCheck,
  Bell,
  Save,
  GraduationCap,
  AlertCircle,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  getStoredCandidateProfile,
  saveCandidateProfile,
  subscribeToCandidateProfileUpdates,
  CandidateProfileData,
} from '../services/candidateProfileStorage';

export const CandidateProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<CandidateProfileData>(getStoredCandidateProfile);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'preferences' | 'security'>('personal');

  // Form State
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [residenceDistrict, setResidenceDistrict] = useState(profile.residenceDistrict);
  const [address, setAddress] = useState(profile.address);

  const [educationLevel, setEducationLevel] = useState(profile.educationLevel);
  const [graduationDepartment, setGraduationDepartment] = useState(profile.graduationDepartment);
  const [occupation, setOccupation] = useState(profile.occupation);
  const [experienceYears, setExperienceYears] = useState(profile.experienceYears);
  const [companyName, setCompanyName] = useState(profile.companyName || '');

  const [notifySms, setNotifySms] = useState(profile.notifySms);
  const [notifyEmail, setNotifyEmail] = useState(profile.notifyEmail);
  const [notifyApp, setNotifyApp] = useState(profile.notifyApp);

  // Şifre Simülasyonu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const unsub = subscribeToCandidateProfileUpdates((updated) => {
      setProfile(updated);
    });
    return unsub;
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim()) {
      setFeedback({ type: 'error', message: 'Lütfen ad soyad ve e-posta alanlarını eksiksiz doldurunuz.' });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Yeni şifreler birbiriyle eşleşmiyor.' });
      return;
    }

    const res = saveCandidateProfile({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      residenceDistrict: residenceDistrict.trim(),
      address: address.trim(),
      educationLevel: educationLevel.trim(),
      graduationDepartment: graduationDepartment.trim(),
      occupation: occupation.trim(),
      experienceYears: experienceYears.trim(),
      companyName: companyName.trim(),
      notifySms,
      notifyEmail,
      notifyApp,
    });

    if (res.success) {
      setFeedback({
        type: 'success',
        message: 'Aday profil bilgileriniz başarıyla güncellendi ve başvuru kütüğüne işlendi.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ type: 'error', message: 'Profil kaydedilirken bir hata oluştu.' });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Üst Başlık & Hızlı Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Aday Profilim & Kütük Bilgileri
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            İletişim, ikametgâh, eğitim düzeyi ve başvuru bildirim tercihlerinizi buradan güncel tutabilirsiniz.
          </p>
        </div>
      </div>

      {/* Profil Özet Kartı Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-sm border border-slate-800">
            {getInitials(profile.fullName)}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{profile.fullName}</h2>
              <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                Kayıtlı Aday
              </span>
              <span className="text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Kimlik Doğrulandı
              </span>
            </div>
            <p className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
              <span>Aday No: <strong className="font-mono text-slate-800">{profile.candidateNumber}</strong></span>
              <span>•</span>
              <span>{profile.occupation}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {profile.residenceDistrict}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <Link
            to="/aday"
            className="text-xs font-medium text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-300 px-3 py-2 rounded-lg transition flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Başvurularımı Gör</span>
          </Link>
          <Link
            to="/egitimler"
            className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-2 rounded-lg transition shadow-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Yeni Programa Başvur</span>
          </Link>
        </div>
      </div>

      {/* Bildirim Geri Bildirimi */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Sekmeler & Form Ana Alanı */}
      <div className="space-y-6">
        {/* Sekme Butonları */}
        <div className="flex border-b border-slate-200 space-x-1 sm:space-x-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'personal'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Kişisel & İletişim Bilgileri</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('academic')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'academic'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Eğitim & Mesleki Durum</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'preferences'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Bildirim Tercihleri</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Hesap Güvenliği</span>
          </button>
        </div>

        {/* Form Alanı */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* TAB 1: Kişisel Bilgiler */}
          {activeTab === 'personal' && (
            <Card className="border-slate-200">
              <CardContent className="p-5 sm:p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Kimlik ve İletişim Bilgileri</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bu bilgiler yapacağınız eğitim başvurularında otomatik olarak kütükten çekilir.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Ad Soyad</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">E-Posta Adresi</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">GSM Telefonu</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0544 234 56 28"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">İkamet Bölgesi</label>
                    <select
                      value={residenceDistrict}
                      onChange={(e) => setResidenceDistrict(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    >
                      <option value="İslahiye Merkez (Cumhuriyet Mah.)">İslahiye Merkez (Cumhuriyet Mah.)</option>
                      <option value="İslahiye Merkez (Aydınlık Mah.)">İslahiye Merkez (Aydınlık Mah.)</option>
                      <option value="Fevzipaşa Mahallesi">Fevzipaşa Mahallesi</option>
                      <option value="Yeşilyurt Mahallesi">Yeşilyurt Mahallesi</option>
                      <option value="Altınüzüm / Boğaziçi">Altınüzüm / Boğaziçi</option>
                      <option value="Diğer Gaziantep İlçesi">Diğer Gaziantep İlçesi</option>
                      <option value="İl Dışı">İl Dışı</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">T.C. Kimlik No (Kütük Korumalı)</label>
                    <input
                      type="text"
                      disabled
                      value={profile.identityNumberMasked}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 font-mono cursor-not-allowed"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Resmi Nüfus kütüğü doğrulamalıdır, değiştirilemez.</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Aday Kütük Numarası</label>
                    <input
                      type="text"
                      disabled
                      value={profile.candidateNumber}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 font-mono cursor-not-allowed"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">İTO Eğitim İşleri kütük takip kodudur.</span>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-slate-700 font-semibold mb-1">Tebligat & İkametgâh Açık Adresi</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: Eğitim ve Meslek */}
          {activeTab === 'academic' && (
            <Card className="border-slate-200">
              <CardContent className="p-5 sm:p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Eğitim ve Mesleki Profil</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kriter puanlamasında ve sınıf kontenjan dağılımında değerlendirilen mesleki arka planınız.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Eğitim Seviyesi</label>
                    <select
                      value={educationLevel}
                      onChange={(e) => setEducationLevel(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    >
                      <option value="Lise / Ortaöğretim">Lise / Ortaöğretim</option>
                      <option value="Ön Lisans (Meslek Yüksekokulu)">Ön Lisans (Meslek Yüksekokulu)</option>
                      <option value="Lisans (İktisat Fakültesi)">Lisans (İktisat Fakültesi)</option>
                      <option value="Lisans (Ziraat / Gıda Fakültesi)">Lisans (Ziraat / Gıda Fakültesi)</option>
                      <option value="Lisans (Diğer Fakülteler)">Lisans (Diğer Fakülteler)</option>
                      <option value="Lisansüstü / Yüksek Lisans">Lisansüstü / Yüksek Lisans</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Mezun Olunan / Devam Edilen Bölüm</label>
                    <input
                      type="text"
                      value={graduationDepartment}
                      onChange={(e) => setGraduationDepartment(e.target.value)}
                      placeholder="Örn: İktisat ve Dış Ticaret"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Mevcut Meslek / Çalışma Durumu</label>
                    <select
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    >
                      <option value="Genç Girişimci & Tarım Üreticisi">Genç Girişimci & Tarım Üreticisi</option>
                      <option value="Tarımsal Üretici & Çiftçi">Tarımsal Üretici & Çiftçi</option>
                      <option value="Esnaf / KOBİ Sahibi / Ortak">Esnaf / KOBİ Sahibi / Ortak</option>
                      <option value="Kooperatif Üyesi / Yöneticisi">Kooperatif Üyesi / Yöneticisi</option>
                      <option value="Özel Sektör Çalışanı / Uzman">Özel Sektör Çalışanı / Uzman</option>
                      <option value="Yeni Mezun / İş Arayan">Yeni Mezun / İş Arayan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Sektörel Deneyim Süresi</label>
                    <select
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    >
                      <option value="Yeni Başlayan (0 - 1 Yıl)">Yeni Başlayan (0 - 1 Yıl)</option>
                      <option value="1 - 3 Yıl">1 - 3 Yıl</option>
                      <option value="3 - 5 Yıl">3 - 5 Yıl</option>
                      <option value="5 Yıldan Fazla">5 Yıldan Fazla</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">İşletme / Ticari Firma Adı (Varsa)</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Örn: Şahin Tarımsal Baharat İşletmesi"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">KOBİ ve dış ticaret programlarında şirket adı ön incelemede dikkate alınır.</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: Bildirim Tercihleri */}
          {activeTab === 'preferences' && (
            <Card className="border-slate-200">
              <CardContent className="p-5 sm:p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Başvuru Bildirim Tercihleri</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Başvuru kabul/ret kararları, kesin kayıt çağrıları ve duyurular için iletişim kanallarını seçiniz.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={notifySms}
                      onChange={(e) => setNotifySms(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <strong className="text-slate-900 block font-semibold">SMS ile Anlık Bildirim</strong>
                      <span className="text-slate-500">
                        Başvurunuz kabul edildiğinde veya kesin kayıt çağrısı yapıldığında kayıtlı cep telefonunuza SMS iletilir.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <strong className="text-slate-900 block font-semibold">E-Posta Bildirimleri</strong>
                      <span className="text-slate-500">
                        Resmi başvuru sonuç mektubu ve eğitim katılım detayları e-posta adresinize gönderilir.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={notifyApp}
                      onChange={(e) => setNotifyApp(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <strong className="text-slate-900 block font-semibold">Portal İçi Bildirimler</strong>
                      <span className="text-slate-500">
                        Aday portalı üst çubuğundaki zil ikonu üzerinden tüm sistem duyuruları görüntülenir.
                      </span>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: Güvenlik */}
          {activeTab === 'security' && (
            <Card className="border-slate-200">
              <CardContent className="p-5 sm:p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Hesap Güvenliği & Şifre Değiştirme</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aday portalına erişim şifrenizi güncelleyin veya oturum güvenliğinizi kontrol edin.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Mevcut Şifre</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Yeni Şifre</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="En az 6 karakter"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Yeni Şifre (Tekrar)</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Yeni şifreyi onaylayın"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900 block">Kütük ve Oturum Güvenliği</span>
                    <span>
                      Hesabınız 256-bit oturum koruması altındadır. Şifrenizi belirli aralıklarla güncellemeniz tavsiye edilir.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Kaydet Butonu */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Link
              to="/aday"
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              Vazgeç
            </Link>
            <Button type="submit" variant="primary" size="md">
              <Save className="w-4 h-4 mr-1.5" />
              <span>Değişiklikleri Kaydet</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
