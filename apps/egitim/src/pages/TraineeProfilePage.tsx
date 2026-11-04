import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  getStoredTraineeProfile,
  saveTraineeProfile,
  subscribeToProfileUpdates,
  TraineeProfileData,
} from '../services/traineeProfileStorage';

export const TraineeProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<TraineeProfileData>(getStoredTraineeProfile);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'notifications' | 'security'>('personal');

  // Form State
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [residenceDistrict, setResidenceDistrict] = useState(profile.residenceDistrict);
  const [address, setAddress] = useState(profile.address);
  const [emergencyContactName, setEmergencyContactName] = useState(profile.emergencyContactName);
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(profile.emergencyContactPhone);

  const [educationLevel, setEducationLevel] = useState(profile.educationLevel);
  const [graduationDepartment, setGraduationDepartment] = useState(profile.graduationDepartment);
  const [occupation, setOccupation] = useState(profile.occupation);

  const [notifySms, setNotifySms] = useState(profile.notifySms);
  const [notifyEmail, setNotifyEmail] = useState(profile.notifyEmail);
  const [notifyApp, setNotifyApp] = useState(profile.notifyApp);

  // Şifre Simülasyonu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const unsub = subscribeToProfileUpdates((updated) => {
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

    const res = saveTraineeProfile({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      residenceDistrict: residenceDistrict.trim(),
      address: address.trim(),
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
      educationLevel: educationLevel.trim(),
      graduationDepartment: graduationDepartment.trim(),
      occupation: occupation.trim(),
      notifySms,
      notifyEmail,
      notifyApp,
    });

    if (res.success) {
      setFeedback({ type: 'success', message: 'Profil bilgileriniz başarıyla güncellendi ve kütüğe işlendi.' });
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
            Profilim & Kursiyer Kütük Bilgileri
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            İletişim, ikametgâh, bildirim tercihleri ve eğitim kütük kayıtlarınızı buradan yönetebilirsiniz.
          </p>
        </div>
      </div>

      {/* Profil Özet Kartı Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-sm">
            {getInitials(profile.fullName)}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{profile.fullName}</h2>
              <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                Kursiyer
              </span>
              <span className="text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Aktif Kayıtlı
              </span>
            </div>
            <p className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
              <span>Kütük No: <strong className="font-mono text-slate-800">{profile.studentNumber}</strong></span>
              <span>•</span>
              <span>{profile.programTitle}</span>
              <span>•</span>
              <span className="text-slate-600">{profile.groupName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <span className="text-slate-500 block">Danışman Eğitmen</span>
            <span className="font-bold text-slate-900">{profile.instructorName}</span>
          </div>
        </div>
      </div>

      {/* Geri Bildirim Bildirimi */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Sekmeler */}
      <div className="flex flex-wrap border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('personal')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px flex items-center gap-2 ${
            activeTab === 'personal'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <User className="w-4 h-4" />
          Kişisel & İletişim
        </button>
        <button
          onClick={() => setActiveTab('academic')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px flex items-center gap-2 ${
            activeTab === 'academic'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Eğitim & Kütük Kaydı
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px flex items-center gap-2 ${
            activeTab === 'notifications'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Bell className="w-4 h-4" />
          Bildirim Tercihleri
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Lock className="w-4 h-4" />
          Güvenlik & Şifre
        </button>
      </div>

      {/* Form Alanı */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* TAB 1: KİŞİSEL & İLETİŞİM */}
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6 space-y-5">
                  <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Temel İletişim Bilgileri
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Ad Soyad</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">E-Posta Adresi</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-11 pl-10 pr-3.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Cep Telefonu</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full h-11 pl-10 pr-3.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">İkametgâh Mahallesi / Bölge</label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          value={residenceDistrict}
                          onChange={(e) => setResidenceDistrict(e.target.value)}
                          className="w-full h-11 pl-10 pr-3.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Açık Adres (İslahiye / Gaziantep)</label>
                    <textarea
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Acil Durum İletişim */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Acil Durum İletişim Bilgisi
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Yakın Adı Soyadı</label>
                      <input
                        type="text"
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                        className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Yakın Cep Telefonu</label>
                      <input
                        type="text"
                        value={emergencyContactPhone}
                        onChange={(e) => setEmergencyContactPhone(e.target.value)}
                        className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sağ Sütun: Resmî Kütük Güvencesi */}
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Lock className="w-4 h-4 text-slate-500" />
                  Kütükte Tescilli Bilgiler (Salt Okunur)
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Aşağıdaki kütük verileri İslahiye Ticaret Odası resmî öğrenci kayıt defterine tescil edilmiştir ve doğrudan değiştirilemez.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">T.C. Kimlik No:</span>
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {profile.identityNumberMasked}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Kursiyer Kütük No:</span>
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {profile.studentNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Kayıt Tarihi:</span>
                    <span className="text-slate-800 font-semibold">12 Ekim 2026</span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>Kimlik değişikliği talepleriniz için şahsen oda başkanlığına başvurulması gerekmektedir.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EĞİTİM & KÜTÜK KAYDI */}
        {activeTab === 'academic' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  Eğitim Geçmişi & Mesleki Bilgiler
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Mezuniyet Düzeyi</label>
                    <select
                      value={educationLevel}
                      onChange={(e) => setEducationLevel(e.target.value)}
                      className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                    >
                      <option value="Ön Lisans (Pazarlama)">Ön Lisans</option>
                      <option value="Lisans (İktisadi ve İdari Bilimler)">Lisans</option>
                      <option value="Yüksek Lisans">Yüksek Lisans</option>
                      <option value="Lise Mezunu">Lise Mezunu</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Mezun Olunan Bölüm / Alan</label>
                    <input
                      type="text"
                      value={graduationDepartment}
                      onChange={(e) => setGraduationDepartment(e.target.value)}
                      className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Mevcut Meslek / Faaliyet Alanı</label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        className="w-full h-11 pl-10 pr-3.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Kayıtlı Eğitim Masası Özeti
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-500">Program:</span>
                    <strong className="text-slate-900 font-semibold">{profile.programTitle}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-500">Dönem:</span>
                    <strong className="text-slate-900 font-semibold">2026 Güz Dönemi</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-500">Grup:</span>
                    <strong className="text-slate-900 font-semibold">{profile.groupName}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-500">Atanmış Eğitmen:</span>
                    <strong className="text-blue-700 font-bold">{profile.instructorName}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: BİLDİRİM TERCİHLERİ */}
        {activeTab === 'notifications' && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                İletişim ve Duyuru Tercihleri
              </h3>

              <div className="space-y-4 max-w-xl">
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={notifySms}
                    onChange={(e) => setNotifySms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">SMS ile Ders ve Oturum Hatırlatmaları</span>
                    <span className="text-xs text-slate-500">Ders günlerinde 2 saat öncesinde cep telefonunuza hatırlatma iletilir.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">E-Posta ile Ödev Değerlendirme & Sonuçlar</span>
                    <span className="text-xs text-slate-500">Eğitmeniniz ödevinizi puanladığında veya revizyon istediğinde e-posta alırsınız.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={notifyApp}
                    onChange={(e) => setNotifyApp(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">Sistem İçi Anlık Bildirimler</span>
                    <span className="text-xs text-slate-500">Platform içerisindeki bildirim çanında tüm hareketleri anında görün.</span>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 4: GÜVENLİK & ŞİFRE */}
        {activeTab === 'security' && (
          <Card>
            <CardContent className="p-6 space-y-5 max-w-xl">
              <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                Şifre Değiştirme
              </h3>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Mevcut Şifre</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Yeni Şifre</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="En az 8 karakter"
                    className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Yeni Şifre (Tekrar)</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Şifreyi onaylayın"
                    className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 44px Hiyerarşik Kaydet Butonu */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link to="/kursiyer">
            <Button variant="secondary" size="md">
              Vazgeç
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={<Save className="w-4 h-4" />}
          >
            Bilgileri Güncelle & Kaydet
          </Button>
        </div>
      </form>
    </div>
  );
};
