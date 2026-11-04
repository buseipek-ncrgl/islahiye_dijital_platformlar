import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  UserCheck,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lock,
  SlidersHorizontal,
  Search,
  Copy,
  CheckCheck,
  ChevronRight,
} from 'lucide-react';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { PageSection } from '../components/layout/PageSection';
import { authService, REAL_ACCOUNTS } from '../services/authAdapter';
import { UserRole } from '../types';
import { resetAllEducationDemoData } from '../services/demoMasterResetService';

export const DemoHubPage: React.FC = () => {
  const { currentRole, setRole, currentUser } = useDemoRole();
  const navigate = useNavigate();

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetReason, setResetReason] = useState('Sunum öncesi fabrika ayarlarına dönüş');
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  // 30 Hesap Arama & Filtreleme Durumları
  const [accountTab, setAccountTab] = useState<string>('all');
  const [accountSearch, setAccountSearch] = useState<string>('');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopyPassword = (email: string, pass: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleSwitchAccount = async (acc: typeof REAL_ACCOUNTS[0]) => {
    try {
      await authService.login({
        emailOrUsername: acc.email,
        password: acc.password,
        rememberMe: true,
      });
      setRole(acc.role);
      navigate(acc.targetRoute);
    } catch {
      setRole(acc.role);
      navigate(acc.targetRoute);
    }
  };

  const getAccountBadge = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return { label: 'Süper Admin', badgeClass: 'bg-slate-900 text-white border-slate-900' };
      case 'admin':
        return { label: 'Yönetici', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'instructor':
        return { label: 'Eğitmen', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'trainee':
        return { label: 'Kursiyer', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'applicant':
        return { label: 'Aday', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200' };
      default:
        return { label: 'Ziyaretçi', badgeClass: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const filteredAccounts = useMemo(() => {
    return REAL_ACCOUNTS.filter((acc) => {
      const matchesRole =
        accountTab === 'all'
          ? true
          : accountTab === 'admin'
          ? acc.role === 'admin' || acc.role === 'superadmin'
          : acc.role === accountTab;

      const matchesSearch =
        accountSearch.trim() === '' ||
        acc.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
        acc.email.toLowerCase().includes(accountSearch.toLowerCase()) ||
        acc.label.toLowerCase().includes(accountSearch.toLowerCase());

      return matchesRole && matchesSearch;
    });
  }, [accountTab, accountSearch]);

  const demoRoles: Array<{
    role: UserRole;
    name: string;
    email: string;
    password?: string;
    title: string;
    description: string;
    targetRoute: string;
    icon: React.ElementType;
    color: string;
    accent: string;
  }> = [
    {
      role: 'applicant',
      name: 'Ali Çelik',
      email: 'aday.ali@islahiye.bel.tr',
      password: 'Applicant123456!',
      title: 'Aday Başvuru Sahibi',
      description: 'Program kataloğundan başvuru yapma, kriter puanı önerisi ve kabul/ret durum takibi.',
      targetRoute: '/aday',
      icon: UserCheck,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      accent: 'emerald',
    },
    {
      role: 'trainee',
      name: 'Ahmet Kaya',
      email: 'kursiyer.ahmet@islahiye.bel.tr',
      password: 'Trainee123456!',
      title: 'Kayıtlı Kursiyer',
      description: 'Haftalık ders takvimi, salon bilgisi, manuel yoklama geçmişi ve ödev teslim/revizyonları.',
      targetRoute: '/kursiyer',
      icon: GraduationCap,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      accent: 'blue',
    },
    {
      role: 'instructor',
      name: 'Şef Mehmet Yılmaz',
      email: 'egitmen.mehmet@islahiye.bel.tr',
      password: 'Instructor123456!',
      title: 'Yetkili Eğitmen',
      description: 'Manuel oturum yoklaması (katıldı/katılmadı/mazeretli), ödev puanlama ve bireysel mesajlaşma.',
      targetRoute: '/egitmen',
      icon: Briefcase,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      accent: 'indigo',
    },
    {
      role: 'admin',
      name: 'Sistem Yöneticisi',
      email: 'admin@islahiye.bel.tr',
      password: 'Admin123456!',
      title: 'Eğitim Operasyon Yöneticisi',
      description: 'Gerekçeli başvuru kararları, kesin kayıt, grup atamaları, nihai başarı ve belge onayı.',
      targetRoute: '/yonetim',
      icon: SlidersHorizontal,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      accent: 'amber',
    },
    {
      role: 'superadmin',
      name: 'Sistem Yöneticisi',
      email: 'admin@islahiye.bel.tr',
      password: 'Admin123456!',
      title: 'Sistem Yöneticisi',
      description: 'Granüler yetki matrisi, çoklu rol atama, sistem politikaları ve merkezi denetim kayıtları.',
      targetRoute: '/yonetim/super-admin',
      icon: ShieldCheck,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      accent: 'blue',
    },
  ];

  const handleSwitchProfile = async (
    roleOrItem: UserRole | (typeof demoRoles)[0],
    targetRoute?: string
  ) => {
    let target = targetRoute;
    let role: UserRole;
    let email: string | undefined;
    let password: string | undefined;

    if (typeof roleOrItem === 'string') {
      role = roleOrItem;
      const found = demoRoles.find((r) => r.role === role);
      email = found?.email;
      password = found?.password;
      if (!target) target = found?.targetRoute || '/';
    } else {
      role = roleOrItem.role;
      email = roleOrItem.email;
      password = roleOrItem.password;
      target = roleOrItem.targetRoute;
    }

    if (email && password) {
      await authService.login({
        emailOrUsername: email,
        password: password,
      });
    }
    setRole(role);
    navigate(target || '/');
  };

  const handleExecuteReset = () => {
    const result = resetAllEducationDemoData({
      actor: {
        id: currentUser.id,
        role: currentRole,
        name: currentUser.fullName,
      },
      reason: resetReason || 'Demo Hub üzerinden tam sıfırlama',
    });
    if (result.success) {
      setResetFeedback(`Tüm sistem kütük verileri başarıyla sıfırlandı. ${result.resetModuleCount || 13} modül başlangıç durumuna getirildi.`);
      setResetModalOpen(false);
      setTimeout(() => setResetFeedback(null), 5000);
    } else {
      setResetFeedback(`Sıfırlama hatası: ${result.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. ÜST BAŞLIK VE HIZLI İŞLEM BUTONLARI (STANDART DÜZ BAŞLIK) */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Rol & Panel Yönetim Masası
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            İslahiye Ticaret Odası Eğitim Portalı'nın tüm modüllerini ve rol bazlı iş akışlarını tek merkezden test edip kurumsal sunumlarda deneyimleyebilirsiniz.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setResetModalOpen(true)}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition shadow-2xs whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Fabrika Ayarlarına Sıfırla</span>
          </button>
        </div>
      </div>

      {/* Geri Bildirim Bildirisi */}
      {resetFeedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{resetFeedback}</span>
        </div>
      )}

      {/* Kurumsal Mimari Ayrımı Bilgilendirme Kartı */}
      <div className="p-5 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
          <Sparkles className="w-4 h-4" />
          <span>Kullanıcı Deneyimi & Rol Geçiş Merkezi</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Eğitim portalının normal kullanıcı arayüzlerinde gereksiz rol değiştirici butonları ve geliştirme etiketleri kaldırılmıştır. Bu sayfa, kurum yetkililerine ve jüriye farklı rollerin arayüzlerini anında test ettirmek üzere tasarlanmış özel kontrol merkezidir.
        </p>
      </div>

      {/* 5 Hazır Test Profili Seçici */}
      <PageSection
        title="1. Hazır Kurumsal Roller Arasında Geçiş Yapın"
        description="Aşağıdaki rollerden birine tıklayarak ilgili kullanıcının oturumuna ve yetkilerine geçiş yapabilirsiniz:"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {demoRoles.map((item) => {
            const Icon = item.icon;
            const isCurrent = currentRole === item.role;

            return (
              <div
                key={item.role}
                className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-blue-50/50 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center border ${item.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                        Aktif Oturum
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {item.name}
                    </h3>
                    <div className="text-[11px] font-semibold text-blue-600">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {item.email}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Hedef: {item.targetRoute}</span>
                  <button
                    onClick={() => handleSwitchProfile(item.role, item.targetRoute)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                  >
                    <span>{isCurrent ? 'Panele Git' : 'Bu Role Geç'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </PageSection>

      {/* Hızlı Senaryo Başlatıcılar */}
      <PageSection
        title="2. Uçtan Uca İş Akışı Senaryoları"
        description="Belirli bir operasyonel süreci baştan sona test etmek için doğrudan ilgili karar merkezine geçin:"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <button
            onClick={() => handleSwitchProfile('applicant', '/aday')}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-sm text-left transition space-y-1.5 group"
          >
            <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
              Aday Başvuru Döngüsü →
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Katalogdan program seçimi, taslak başvuru, kriter tavsiyesi ve takip ekranı.
            </p>
          </button>

          <button
            onClick={() => handleSwitchProfile('instructor', '/egitmen')}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-sm text-left transition space-y-1.5 group"
          >
            <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition">
              Manuel Yoklama & Ödev →
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Oturum yoklama girişi, ödev puanlama, revizyon isteme ve başarı ön kontrolü.
            </p>
          </button>

          <button
            onClick={() => handleSwitchProfile('admin', '/yonetim/basvurular')}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-sm text-left transition space-y-1.5 group"
          >
            <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition">
              Yönetici Karar Masası →
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Başvuru kabul/ret kararları, kesin kayıt kontenjan onayı ve grup yerleşimi.
            </p>
          </button>

          <button
            onClick={() => handleSwitchProfile('superadmin', '/yonetim/super-admin')}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm text-left transition space-y-1.5 group"
          >
            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition">
              Genel Bakış →
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Granüler yetki matrisi, sistem politikaları, operasyonel raporlar ve denetim izi.
            </p>
          </button>
        </div>
      </PageSection>

      {/* 2. Sistemde Tanımlı 30 Kullanıcı Hesabı & Parolaları */}
      <PageSection
        title={`2. Sistemde Kayıtlı 30 Gerçekçi Kullanıcı & Parolalar (${REAL_ACCOUNTS.length} Hesap)`}
        description="Aşağıdaki listeden dilediğiniz kullanıcının parolasını tek tıkla kopyalayabilir veya o kullanıcı olarak oturum açabilirsiniz:"
      >
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          {/* Sekmeler ve Arama */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/60">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
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
                  onClick={() => setAccountTab(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
                    accountTab === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                placeholder="İsim, e-posta veya unvan ara..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Tablo */}
          <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-xs z-10 border-b border-slate-200">
                <tr className="text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Rol</th>
                  <th className="py-2.5 px-3">Ad Soyad</th>
                  <th className="py-2.5 px-3">Unvan / Görev</th>
                  <th className="py-2.5 px-3">E-Posta</th>
                  <th className="py-2.5 px-3">Giriş Parolası</th>
                  <th className="py-2.5 px-3 text-right">İşlem</th>
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
                      <td className="py-2.5 px-3 font-bold text-slate-900">{acc.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{acc.label}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{acc.email}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <code className="font-mono font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {acc.password}
                          </code>
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
                        <button
                          type="button"
                          onClick={() => handleSwitchAccount(acc)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-md transition cursor-pointer shadow-2xs"
                        >
                          <span>Başlat</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Referans doküman: <code className="font-mono text-slate-700">docs/KULLANICI_HESAPLARI_VE_GIRIS_BILGILERI.md</code></span>
            <span>Toplam {filteredAccounts.length} / {REAL_ACCOUNTS.length} hesap listeleniyor</span>
          </div>
        </div>
      </PageSection>

      {/* Şeffaf Simülasyon Bildirisi */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs space-y-1">
        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-slate-500" />
          <span>Sistem ve Veri Güvencesi</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Bu portal İslahiye Ticaret Odası için hazırlanmış entegre dijital eğitim platformudur. Tüm iş akışları kurumsal standartlara ve rol bazlı yetkilendirme mimarisine göre işletilir.
        </p>
      </div>

      {/* Fabrika Ayarlarına Sıfırlama Onay Modalı */}
      {resetModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Sistem Verilerini Sıfırla
                </h3>
                <p className="text-xs text-slate-500">
                  Fabrika başlangıç durumuna dönülecektir.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bu işlem tüm 13 modüldeki (başvurular, oturumlar, yoklamalar, ödevler, belgeler, mesajlar vb.) test kayıtlarını temizleyerek varsayılan tohum verilerine döndürür. Sıfırlama öncesinde otomatik bir kurtarma yedeği alınır.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Sıfırlama Gerekçesi:
              </label>
              <input
                type="text"
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setResetModalOpen(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                İptal
              </button>
              <button
                onClick={handleExecuteReset}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition shadow-sm"
              >
                Evet, Sıfırla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
