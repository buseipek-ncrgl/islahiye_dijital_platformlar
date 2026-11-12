import React, { useState } from 'react';
import {
  Settings,
  RotateCcw,
  CheckCircle2,
  Database,
  FileCheck,
  UserCheck,
  Check,
} from 'lucide-react';
import { contentStore } from '../../services/content/contentStore';
import { ActionConfirmModal } from '../../components/admin/common/ActionConfirmModal';
import { useAdminRole } from '../../context/AdminRoleContext';

export const AdminSettingsPage: React.FC = () => {
  const { currentRole, setRole, canManageSettings, rolesList } = useAdminRole();
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleConfirmReset = () => {
    contentStore.resetToSeeds();
    setShowResetModal(false);
    setResetSuccess(true);
    setTimeout(() => {
      setResetSuccess(false);
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Settings Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <Settings className="w-4 h-4" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Sistem Politikaları ve Yetki Yönetimi
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
          İslahiye Lezzet Atlası kurumsal rol yetkileri, veri saklama ilkeleri ve envanter yönetim araçları.
        </p>
      </div>

      {resetSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Envanter verileri başarıyla başlangıç tohum verilerine sıfırlandı.</span>
        </div>
      )}

      {/* Role Selection & Permission Matrix */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Kullanıcı Rolü ve Yetki Matrisi
          </h3>
          <p className="text-xs text-slate-500">
            Farklı kullanıcı seviyelerinin yetki sınırlarını ve erişim kapsamını inceleyebilirsiniz.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rolesList.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => setRole(profile.id)}
              aria-pressed={currentRole === profile.id}
              className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                currentRole === profile.id
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-600'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <UserCheck
                    className={`w-4 h-4 ${
                      currentRole === profile.id ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  />
                  {currentRole === profile.id && (
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded-full">
                      Aktif Rol
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-slate-900 mb-1">
                  {profile.name}
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                  {profile.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/60 space-y-1.5 w-full">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                  Yetkiler:
                </span>
                {profile.permissions.map((perm, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{perm}</span>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Reset Card */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-600 mb-1">
              <RotateCcw className="w-5 h-5 text-rose-600" />
              <h3 className="text-base font-bold text-slate-900">
                Envanter Başlangıç Tohum Verilerine Dönüş
              </h3>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Test ve önizleme süreçlerinde eklenen tüm içerikleri sıfırlayarak sistemi orijinal resmî başlangıç kayıtlarına döndürür.
            </p>
          </div>

          {canManageSettings ? (
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="h-9 px-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors shrink-0 shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Envanteri Sıfırla</span>
            </button>
          ) : (
            <div
              className="h-9 px-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-medium border border-slate-200 shrink-0 cursor-not-allowed"
              title="Yalnızca Oda Yöneticisi (Admin) envanteri sıfırlayabilir."
            >
              <RotateCcw className="w-4 h-4 text-slate-300" />
              <span>Sıfırlama (Kısıtlı)</span>
            </div>
          )}
        </div>
      </div>

      {/* Architectural Principles & Storage Readiness */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-800">
            <Database className="w-5 h-5 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Veri Depolama ve Senkronizasyon Katmanı
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Gastronomi CMS veri deposu; tescilli yemek, tarif, haber, kültürel bellek ve harita noktası kayıtlarını çift yönlü olarak yerel depolama ve ASP.NET Core REST API katmanı ile senkronize tutar.
          </p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-800">
            <FileCheck className="w-5 h-5 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Resmî Coğrafi İşaret ve Menşe İlkeleri
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            İslahiye Biberi tescil kaydı (TÜRKPATENT No: 991, 05.01.2022) Gaziantep Ticaret Borsası nezdindedir.
            Yayın onaylarında resmî kurum tescil belgeleri ve doğrulanmış kaynak standartları esas alınmaktadır.
          </p>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ActionConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleConfirmReset}
        title="Envanteri Başlangıç Verilerine Sıfırla"
        message="Bu işlem tarayıcıda yapılan tüm geçici içerik değişikliklerini temizleyecek ve sistemi orijinal başlangıç envanterine döndürecektir. Devam etmek istiyor musunuz?"
        confirmText="Evet, Sıfırla"
        cancelText="Vazgeç"
        variant="danger"
      />
    </div>
  );
};
