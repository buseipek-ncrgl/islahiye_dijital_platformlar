import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  SlidersHorizontal,
  Layers,
  CheckSquare,
  FileText,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Lock,
  Info,
} from 'lucide-react';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { getStoredUsers } from '../services/authorizationDemoService';
import { getStoredSystemSettings } from '../services/systemSettingsStorage';
import { getStoredAuditLogs } from '../services/auditStorage';
import { resetAllEducationDemoData } from '../services/demoMasterResetService';
import { SystemSettings, AuditLog, UserProfile } from '../types';

export const SuperAdminDashboardPage: React.FC = () => {
  const { currentRole, currentUser } = useDemoRole();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [resetReason, setResetReason] = useState('Sprint E05-A demo testi başlangıç senaryosu');
  const [resetSuccess, setResetSuccess] = useState(false);

  const loadData = () => {
    setUsers(getStoredUsers());
    setSettings(getStoredSystemSettings());
    setAuditLogs(getStoredAuditLogs());
  };

  useEffect(() => {
    loadData();
  }, []);

  const isSuperAdmin = currentRole === 'superadmin';

  const handleExecuteReset = () => {
    if (resetConfirmInput.trim() !== 'SIFIRLA') return;

    resetAllEducationDemoData({
      actor: {
        id: currentUser.id,
        role: currentRole,
        name: currentUser.fullName,
      },
      reason: resetReason,
    });

    setResetSuccess(true);
    setTimeout(() => {
      setShowResetModal(false);
      setResetSuccess(false);
      setResetConfirmInput('');
      loadData();
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Banner & Institutional Header */}
      <div className="bg-white rounded-xl border border-brand-border p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              Süper Yönetici Yönetişim Masası
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500 font-medium">Sprint E05-A</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Merkezi Yönetişim ve Denetim Konsolu
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Yetki matrisi, kullanıcı rolleri, sistem politikaları, operasyonel raporlar ve WORM benzeri sentetik denetim kütüğü.
          </p>
        </div>

        {/* Superadmin Indicator / Warning */}
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            {currentUser.fullName.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">{currentUser.fullName}</div>
            <div className="text-[11px] text-amber-700 font-medium">
              {isSuperAdmin ? '★ Süper Yönetici Yetkisi Aktif' : 'Standart Yönetici / Sınırlı Erişim'}
            </div>
          </div>
        </div>
      </div>

      {/* Role Notice Warning if not Superadmin */}
      {!isSuperAdmin && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <div className="font-bold">Erişim Sınırlaması Uyarısı:</div>
            <p>
              Şu anda <strong>{currentUser.role}</strong> rolü ile oturum açtınız. Süper yöneticiye ait kritik sistem ayarları ve rol atamaları yalnızca <strong>Süper Yönetici (Kemal Ertürk)</strong> profili tarafından düzenlenebilir.
            </p>
          </div>
        </div>
      )}

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Kullanıcılar</div>
          <div className="text-2xl font-bold text-slate-900">{users.length}</div>
          <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> {users.filter((u) => u.isActive !== false).length} Aktif
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tanımlı İzinler</div>
          <div className="text-2xl font-bold text-slate-900">24</div>
          <div className="text-[11px] text-blue-600 font-medium">6 Kategori Matrisi</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Politika Sürümü</div>
          <div className="text-2xl font-bold text-slate-900">v{settings?.version || 1}.0</div>
          <div className="text-[11px] text-slate-500 truncate">
            {settings?.attendancePolicy?.minAttendanceRateRequired}% Devam / {settings?.assignmentPolicy?.minPassingAssignmentAverage} Ödev
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Denetim Kütüğü</div>
          <div className="text-2xl font-bold text-slate-900">{auditLogs.length}</div>
          <div className="text-[11px] text-purple-600 font-medium">Merkezi Kayıt</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Mahremiyet</div>
          <div className="text-2xl font-bold text-emerald-700 flex items-center gap-1">
            <Lock className="w-4 h-4 text-emerald-600" /> Korunuyor
          </div>
          <div className="text-[11px] text-slate-500">Özel Mesaj Sanitized</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Modül Depoları</div>
          <div className="text-2xl font-bold text-slate-900">13/13</div>
          <div className="text-[11px] text-emerald-600 font-medium">Senkronize</div>
        </div>
      </div>

      {/* Main Governance Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Module 1: User & Role Management */}
        <div
          onClick={() => navigate('/yonetim/kullanicilar')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition">
                Kullanıcı ve Rol Yönetimi
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Sentetik kullanıcı havuzu, çoklu rol atama, eğitmen grup kapsamları ve pasif statü kontrolü. Geçmiş akademik veriler korunur.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
            <span>Kullanıcıları Yönet →</span>
            <span className="text-[11px] text-slate-400 font-normal">/yonetim/kullanicilar</span>
          </div>
        </div>

        {/* Module 2: Granular Permission Matrix */}
        <div
          onClick={() => navigate('/yonetim/roller')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition">
                Granüler Yetki Matrisi
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                24 granüler izin anahtarı, rol-izin eşleşmesi (İzin Var / İzin Yok / Kapsama Bağlı), gerekçeli sürüm geçmişi ve denetim kaydı.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
            <span>Matrisi Görüntüle →</span>
            <span className="text-[11px] text-slate-400 font-normal">/yonetim/roller</span>
          </div>
        </div>

        {/* Module 3: System Settings & Policies */}
        <div
          onClick={() => navigate('/yonetim/ayarlar')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 group-hover:text-amber-700 transition">
                Sistem ve Politika Ayarları
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Devam hesaplama politikası (mazeretli paydadan çıkarma), ödev eşikleri (%70/100), doğrulama URL format denetimi ve sürüm geçmişi.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>Ayarları Yapılandır →</span>
            <span className="text-[11px] text-slate-400 font-normal">/yonetim/ayarlar</span>
          </div>
        </div>

        {/* Module 4: Central Audit Trail */}
        <div
          onClick={() => navigate('/yonetim/denetim')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
                Merkezi Denetim Kayıtları
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Tüm idari kararlar, yoklama düzeltmeleri, ödev notu revizyonları, belge iptalleri ve rol değişikliklerinin tekil olay referansları ve CSV çıktısı.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Denetim Kütüğünü Aç →</span>
            <span className="text-[11px] text-slate-400 font-normal">/yonetim/denetim</span>
          </div>
        </div>

        {/* Module 5: Operational Reporting */}
        <div
          onClick={() => navigate('/yonetim/raporlar')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 group-hover:text-sky-700 transition">
                Operasyonel Raporlar
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Başvurular, kesin kayıt, kontenjan doluluğu, ders/devam ve belge metrikleri. Sentetik depolardan dinamik hesaplanır; payda sıfırsa hesaplanamaz gösterilir.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-sky-700">
            <span>Raporları İncele →</span>
            <span className="text-[11px] text-slate-400 font-normal">/yonetim/raporlar</span>
          </div>
        </div>

        {/* Module 6: Master Demo Data Control */}
        <div
          onClick={() => setShowResetModal(true)}
          className="bg-white p-5 rounded-xl border border-rose-200 hover:border-rose-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 group-hover:text-rose-700 transition">
                Demo Test & Veri Sıfırlama
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Tüm 13 modülün sentetik başlangıç verilerini senkronize olarak fabrika ayarlarına döndürür. Açık onay ve gerekçe zorunludur.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-rose-600">
            <span>Veri Sıfırlama Sihirbazı →</span>
            <span className="text-[11px] text-slate-400 font-normal">Master Reset</span>
          </div>
        </div>
      </div>

      {/* Privacy & Direct Message Policy Box (Section 4 Compliance) */}
      <div className="bg-slate-900 text-slate-200 rounded-xl p-6 shadow-md border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Kurumsal Mahremiyet ve Özel Mesaj Güvenlik Protokolü</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Süper yönetici hesabı dahi olsa, platform üzerinden kursiyer ile eğitmen arasındaki <strong>özel birebir mesajlaşmalar otomatik olarak yönetim masasına açılmaz</strong>.
          Özel mesaj içeriklerine erişim ancak adli veya kurumsal disiplin soruşturması kapsamında tanımlanacak çift anahtarlı kurumsal protokol ile mümkün olabilir.
          Denetim kütüklerinde (Audit Trail) ve CSV çıktılarında kişisel mesaj metinleri, şifreler ve T.C. kimlik numaraları filtrelenmektedir.
        </p>
        <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>
            Bu sistem bir <strong>frontend demo simülasyonudur</strong>. Gerçek üretim ortamında veritabanı düzeyinde şifreleme ve denetimli HSM saklama gereklidir.
          </span>
        </div>
      </div>

      {/* Master Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Demo Verilerini Fabrika Ayarlarına Döndür
                </h3>
                <p className="text-xs text-slate-500">
                  Tüm eğitim modüllerinin mock verileri ilk haline getirilecek.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
              <div className="font-bold">Sıfırlanacak 13 Modül:</div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Başvurular, Değerlendirme Kriterleri, Kesin Kayıt, Gruplar, Oturum ve Manuel Yoklama, Ödev ve Notlandırma, Nihai Başarı Kararları, Belge Kütüğü, Özel Mesajlar, Grup Kanalları, Bildirimler, Toplu E-Posta Kuyruğu ve Sistem Ayarları.
              </p>
            </div>

            {resetSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Tüm eğitim platformu verileri başarıyla ilk fabrika haline döndürüldü!
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sıfırlama Gerekçesi (Denetim Kütüğüne Kaydedilir):
                  </label>
                  <input
                    type="text"
                    value={resetReason}
                    onChange={(e) => setResetReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="Örn: Sprint E05-A test senaryosu için temizleme"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Onaylamak için büyük harflerle <strong>SIFIRLA</strong> yazınız:
                  </label>
                  <input
                    type="text"
                    value={resetConfirmInput}
                    onChange={(e) => setResetConfirmInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="SIFIRLA"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetModal(false);
                      setResetConfirmInput('');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    disabled={resetConfirmInput.trim() !== 'SIFIRLA' || !isSuperAdmin}
                    onClick={handleExecuteReset}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tüm Verileri Sıfırla
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
