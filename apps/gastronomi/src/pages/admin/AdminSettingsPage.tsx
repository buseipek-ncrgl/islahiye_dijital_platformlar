import React, { useState } from 'react';
import {
  ShieldAlert,
  UserCheck,
  Check,
  FileCheck,
  Settings,
  Database,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { AdminRole, AdminRoleProfile } from '../../types/admin';
import { useContent } from '../../hooks/useContent';

const ROLE_PROFILES: AdminRoleProfile[] = [
  {
    id: 'admin',
    name: 'Oda Yöneticisi (Admin)',
    description: 'Tüm içerikleri görüntüleme, düzenleme, yayınlama, tescil onayı ve sistem konfigürasyonu.',
    permissions: [
      'İçerik Görüntüleme',
      'İçerik Oluşturma & Düzenleme (02B)',
      'Yayınlama & Arşivleme (02B)',
      'Kaynak Doğrulama & Tescil Onayı',
      'Medya Kütüphanesi Yönetimi',
      'Sistem Ayarları',
    ],
  },
  {
    id: 'publisher',
    name: 'Yayın Sorumlusu (Publisher)',
    description: 'Hazırlanan içerikleri denetleme, yayınlama ve ziyaretçi görünürlüğünü yönetme.',
    permissions: [
      'İçerik Görüntüleme',
      'Yayınlama & Arşivleme (02B)',
      'Kaynak Doğrulama & Tescil Onayı',
      'Medya Kütüphanesi İnceleme',
    ],
  },
  {
    id: 'editor',
    name: 'Editoryal Editör (Editor)',
    description: 'Yemek, tarif, kültürel bellek ve haber taslakları hazırlama.',
    permissions: [
      'İçerik Görüntüleme',
      'İçerik Taslağı Oluşturma & Düzenleme (02B)',
      'Medya Kütüphanesi Yükleme',
    ],
  },
  {
    id: 'viewer',
    name: 'Gözlemci / Denetçi (Viewer)',
    description: 'Yalnızca içerik envanteri, yayın durumu ve güvenilirlik metriklerini inceleme.',
    permissions: ['İçerik Görüntüleme (Salt Okunur)'],
  },
];

export const AdminSettingsPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<AdminRole>('admin');
  const { resetToSeeds } = useContent();
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleConfirmReset = () => {
    resetToSeeds();
    setShowResetModal(false);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Settings Header */}
      <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-5 h-5 text-forest" />
          <h2 className="text-xl sm:text-2xl font-sans font-bold text-slate-900 tracking-tight">
            Sistem Ayarları & Demo Veri Yönetimi
          </h2>
        </div>
        <p className="text-xs sm:text-sm font-sans text-slate-500 max-w-2xl leading-relaxed">
          Gelecek backend entegrasyonu ve rol tabanlı yetkilendirme (RBAC) için hazırlanan arayüz simülasyonu,
          tarayıcı depolaması ve demo veri sıfırlama araçları.
        </p>
      </div>

      {resetSuccess && (
        <div className="p-4 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-sans flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Demo verileri başarıyla sıfırlandı. Orijinal başlangıç tohum verileri yüklendi.</span>
        </div>
      )}

      {/* Critical Security & Simulation Disclaimer */}
      <div className="p-4 rounded-sm bg-amber-50 border border-amber-200 text-amber-900 text-xs font-sans flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block font-bold">Yetkilendirme ve Mahremiyet Sınırı (AGENTS.md Madde 3):</strong>
          <p className="leading-relaxed">
            Bu ekran bir <strong>demo simülasyonudur</strong>; gerçek bir authentication veya şifreli oturum güvenliği değildir.
            Gerçek sistemde rol bazlı yetkiler, kimlik doğrulama belirteçleri ve kritik işlemler ASP.NET Core backend servisi
            tarafından sunucu tarafında doğrulanacaktır. Frontend simülasyonu güvenlik kontrolü yerine geçmez.
          </p>
        </div>
      </div>

      {/* Role Selection & Permission Matrix */}
      <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-6">
        <div>
          <h3 className="text-sm font-sans font-bold text-slate-900 mb-1">
            Demo Rol Seçimi ve Yetki Matrisi
          </h3>
          <p className="text-xs text-slate-500 font-sans">
            Arayüzün farklı kullanıcı rollerinde nasıl davrandığını simüle etmek için rol profilini seçebilirsiniz.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROLE_PROFILES.map((profile) => (
            <div
              key={profile.id}
              onClick={() => setSelectedRole(profile.id)}
              className={`p-4 rounded-sm border cursor-pointer transition-all flex flex-col justify-between ${
                selectedRole === profile.id
                  ? 'border-forest bg-forest-50/50 shadow-xs ring-1 ring-forest'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <UserCheck
                    className={`w-4 h-4 ${
                      selectedRole === profile.id ? 'text-forest' : 'text-slate-400'
                    }`}
                  />
                  {selectedRole === profile.id && (
                    <span className="text-[10px] font-mono font-bold text-forest uppercase tracking-wider bg-forest-100 px-1.5 py-0.2 rounded-xs">
                      Aktif Rol
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-sans font-bold text-slate-900 mb-1">
                  {profile.name}
                </h4>

                <p className="text-xs font-sans text-slate-600 leading-relaxed mb-4">
                  {profile.description}
                </p>
              </div>

              {/* Permission List */}
              <div className="pt-3 border-t border-slate-200/70 space-y-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">
                  Tanımlı Yetkiler:
                </span>
                {profile.permissions.map((perm) => (
                  <div key={perm} className="flex items-center gap-1.5 text-[11px] font-sans text-slate-700">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{perm}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Reset Card (Sprint 02B Requirement 14) */}
      <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-600 mb-1">
              <RotateCcw className="w-5 h-5 text-rose-600" />
              <h3 className="text-base font-sans font-bold text-slate-900">
                Demo Verilerini Sıfırlama (Fabrika Tohum Verilerine Dönüş)
              </h3>
            </div>
            <p className="text-xs font-sans text-slate-600 max-w-2xl leading-relaxed">
              Sunumlar veya test senaryoları sonrasında sistem durumunu temizlemek için kullanılır.
              Bu işlem yalnızca tarayıcınızın yerel depolamasında (localStorage) tutulan demo kayıtlarını sıfırlar.
              Gerçek kurum veritabanını etkilemez. Orijinal başlangıç tohum verileri bozulmadan korunur.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors shrink-0 shadow-2xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Demo Verilerini Sıfırla</span>
          </button>
        </div>
      </div>

      {/* Architectural Principles & Storage Readiness */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-forest">
            <Database className="w-5 h-5 text-forest" />
            <h3 className="text-sm font-sans font-bold text-slate-900">
              Frontend Sürümlü Depolama Katmanı (v5)
            </h3>
          </div>
          <p className="text-xs font-sans text-slate-600 leading-relaxed">
            Sprint 02C-3 kapsamında geliştirilen <strong>contentStore</strong> katmanı;
            yapılan tüm demo yemek, tarif, haber, kültürel bellek, usta, harita noktaları, duyuru, etkinlik, ana sayfa vitrin ve işlem geçmişi kayıtlarını tarayıcının <code className="text-forest font-mono">islahiye_cms_store_v5</code> anahtarında sürüm kontrollü olarak tutar. Sayfa yenilendiğinde veya sekmeler arasında veri tutarlılığı kesintisiz korunur.
          </p>
        </div>

        <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-forest">
            <FileCheck className="w-5 h-5 text-forest" />
            <h3 className="text-sm font-sans font-bold text-slate-900">
              Kurumsal İçerik Güvenilirlik İlkeleri
            </h3>
          </div>
          <p className="text-xs font-sans text-slate-600 leading-relaxed">
            İslahiye Biberi tescil sahipliği (TÜRKPATENT No: 991, 05.01.2022) Gaziantep Ticaret Borsası nezdindedir.
            CMS içerik onaylarında doğrulanmamış usta anlatımları veya resmi kurum onayı taşımayan
            iddialar yayınlanamaz.
          </p>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <RotateCcw className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">
                Demo Değişiklikleri Sıfırlansın mı?
              </h3>
            </div>
            <div className="text-xs text-slate-600 leading-relaxed font-sans space-y-2">
              <p>
                Bu işlem tarayıcınızda oluşturduğunuz veya değiştirdiğiniz tüm <strong>yemekleri, tarifleri ve haberleri</strong> silecek ve orijinal başlangıç tohum verilerine döndürecektir.
              </p>
              <p className="font-semibold text-rose-700">
                Bu işlem geri alınamaz. Devam etmek istediğinizi onaylıyor musunuz?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-sm border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-sm bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-xs"
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
