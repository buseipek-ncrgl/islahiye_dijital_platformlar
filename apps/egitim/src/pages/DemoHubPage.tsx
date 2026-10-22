import React, { useState } from 'react';
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
} from 'lucide-react';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { DashboardContent } from '../components/layout/DashboardContent';
import { PageHeader } from '../components/layout/PageHeader';
import { PageSection } from '../components/layout/PageSection';
import { DEMO_USERS } from '../data/educationData';
import { UserRole } from '../types';
import { resetAllEducationDemoData } from '../services/demoMasterResetService';

export const DemoHubPage: React.FC = () => {
  const { currentRole, setRole, currentUser } = useDemoRole();
  const navigate = useNavigate();

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetReason, setResetReason] = useState('Sunum öncesi fabrika ayarlarına dönüş');
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  const demoRoles: Array<{
    role: UserRole;
    name: string;
    email: string;
    title: string;
    description: string;
    targetRoute: string;
    icon: React.ElementType;
    color: string;
    accent: string;
  }> = [
    {
      role: 'applicant',
      name: DEMO_USERS.applicant.fullName,
      email: DEMO_USERS.applicant.email || 'fatma.sahin@ornek.com',
      title: 'Aday Başvuru Sahibi',
      description: 'Program kataloğundan başvuru yapma, kriter puanı önerisi ve kabul/ret durum takibi.',
      targetRoute: '/aday',
      icon: UserCheck,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      accent: 'emerald',
    },
    {
      role: 'trainee',
      name: DEMO_USERS.trainee.fullName,
      email: DEMO_USERS.trainee.email || 'ayse.demir@ornek.com',
      title: 'Kabul Edilmiş Kursiyer',
      description: 'Haftalık ders takvimi, salon bilgisi, manuel yoklama geçmişi ve ödev teslim/revizyonları.',
      targetRoute: '/kursiyer',
      icon: GraduationCap,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      accent: 'blue',
    },
    {
      role: 'instructor',
      name: DEMO_USERS.instructor.fullName,
      email: DEMO_USERS.instructor.email || 'murat.ozkan@ornek.com',
      title: 'Yetkili Eğitmen',
      description: 'Manuel oturum yoklaması (katıldı/katılmadı/mazeretli), ödev puanlama ve bireysel mesajlaşma.',
      targetRoute: '/egitmen',
      icon: Briefcase,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      accent: 'indigo',
    },
    {
      role: 'admin',
      name: DEMO_USERS.admin.fullName,
      email: DEMO_USERS.admin.email || 'selin.aydin@ornek.com',
      title: 'Eğitim Operasyon Yöneticisi',
      description: 'Gerekçeli başvuru kararları, kesin kayıt, grup atamaları, nihai başarı ve belge onayı.',
      targetRoute: '/yonetim',
      icon: SlidersHorizontal,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      accent: 'amber',
    },
    {
      role: 'superadmin',
      name: DEMO_USERS.superadmin.fullName,
      email: DEMO_USERS.superadmin.email || 'kemal.erturk@ornek.com',
      title: 'Süper Yönetici',
      description: 'Granüler yetki matrisi, çoklu rol atama, sistem politikaları ve merkezi denetim kayıtları.',
      targetRoute: '/yonetim/super-admin',
      icon: ShieldCheck,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      accent: 'purple',
    },
  ];

  const handleSwitchProfile = (role: UserRole, targetRoute: string) => {
    setRole(role);
    navigate(targetRoute);
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
      setResetFeedback(`Tüm demo verileri başarıyla sıfırlandı. ${result.resetModuleCount || 13} modül başlangıç durumuna getirildi.`);
      setResetModalOpen(false);
      setTimeout(() => setResetFeedback(null), 5000);
    } else {
      setResetFeedback(`Sıfırlama hatası: ${result.message}`);
    }
  };

  return (
    <DashboardContent>
      {/* Sayfa Başlığı Standardı */}
      <PageHeader
        category="SUNUM VE DEMO ALANI"
        title="Demo & Rol Yönetim Masası"
        description="İslahiye Ticaret Odası Eğitim Portalı'nın tüm modüllerini ve rol bazlı iş akışlarını tek merkezden test edip kurumsal sunumlarda deneyimleyebilirsiniz."
        actions={
          <button
            onClick={() => setResetModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-semibold transition"
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Fabrika Ayarlarına Sıfırla</span>
          </button>
        }
      />

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
          <span>Profesyonel Kullanıcı Deneyimi & Demo Ayrımı</span>
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
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-sm text-left transition space-y-1.5 group"
          >
            <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition">
              Süper Yönetici Konsolu →
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Granüler yetki matrisi, sistem politikaları, operasyonel raporlar ve denetim izi.
            </p>
          </button>
        </div>
      </PageSection>

      {/* Şeffaf Simülasyon Bildirisi */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs space-y-1">
        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-slate-500" />
          <span>Frontend Demo ve Simülasyon Güvencesi</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Bu portal İslahiye Ticaret Odası için hazırlanmış bir ön tanıtım ve kullanıcı deneyimi simülasyonudur. Sistemde yer alan tüm veriler sentetiktir ve tarayıcı yerel saklama alanında çalışır. Gerçek canlı sistemde ASP.NET Core REST API, PostgreSQL ilişkisel veritabanı, OAuth2/OIDC yetkilendirmesi ve HSM tabanlı e-İmza altyapısı bulunacaktır.
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
                  Demo Verilerini Sıfırla
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
    </DashboardContent>
  );
};
