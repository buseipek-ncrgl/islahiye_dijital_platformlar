import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Shield,
  ShieldCheck,
  Check,
  X,
  Layers,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import {
  PERMISSION_DEFINITIONS,
  PERMISSION_CATEGORIES,
  PermissionKey,
  PermissionScope,
  UserRole,
  RolePermissionMatrix,
} from '../types';
import {
  getStoredRolePermissionMatrix,
  saveRolePermissionMatrix,
  subscribeToRoleMatrixUpdates,
} from '../services/authorizationDemoService';

const ROLES_ORDER: UserRole[] = [
  'visitor',
  'applicant',
  'trainee',
  'instructor',
  'admin',
  'superadmin',
];

const ROLE_LABELS: Record<UserRole, string> = {
  visitor: 'Ziyaretçi',
  applicant: 'Aday',
  trainee: 'Kursiyer',
  instructor: 'Eğitmen',
  admin: 'Yönetici',
  superadmin: 'Süper Yönetici',
};

export const RolePermissionsPage: React.FC = () => {
  const { currentRole, currentUser } = useDemoRole();
  const [matrix, setMatrix] = useState<RolePermissionMatrix>(getStoredRolePermissionMatrix());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state for cell modification
  const [editTarget, setEditTarget] = useState<{
    role: UserRole;
    permissionKey: PermissionKey;
    currentScope: PermissionScope;
  } | null>(null);
  const [newScope, setNewScope] = useState<PermissionScope>('none');
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const unsub = subscribeToRoleMatrixUpdates((m) => setMatrix(m));
    return () => unsub();
  }, []);

  const isSuperAdmin = currentRole === 'superadmin';

  const allDefinitions = Object.values(PERMISSION_DEFINITIONS);
  const filteredPermissions = allDefinitions.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      p.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCellClick = (role: UserRole, permKey: PermissionKey) => {
    if (!isSuperAdmin) {
      alert('İzin matrisini yalnızca Süper Yönetici (Kemal Ertürk) düzenleyebilir.');
      return;
    }
    // Superadmin permissions are immutable in demo
    if (role === 'superadmin') {
      alert('Süper Yönetici rolü sistem bütününde tam yetkiye (global) sahiptir ve değiştirilemez.');
      return;
    }

    const currentScope = matrix[role]?.[permKey] || 'none';
    setEditTarget({ role, permissionKey: permKey, currentScope });
    setNewScope(currentScope);
    setReason('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSavePermissionChange = () => {
    if (!editTarget) return;
    if (!reason.trim()) {
      setErrorMessage('Yetki değişikliği için resmi gerekçe belirtilmesi zorunludur.');
      return;
    }

    const updatedRolePerms = {
      ...(matrix[editTarget.role] || {}),
      [editTarget.permissionKey]: newScope,
    };

    const updatedMatrix: RolePermissionMatrix = {
      ...matrix,
      [editTarget.role]: updatedRolePerms,
    };

    const res = saveRolePermissionMatrix({
      newMatrix: updatedMatrix,
      actor: {
        id: currentUser.id,
        role: currentRole,
        name: currentUser.fullName,
      },
      reason,
    });

    if (!res.success) {
      setErrorMessage(res.error || 'İzin kaydedilemedi.');
    } else {
      setSuccessMessage('İzin matrisi güncellendi ve denetim kütüğüne tescil edildi.');
      setMatrix(updatedMatrix);
      setTimeout(() => {
        setEditTarget(null);
      }, 1000);
    }
  };

  const renderScopeBadge = (scope: PermissionScope) => {
    switch (scope) {
      case 'global':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <Check className="w-3 h-3 text-emerald-700" /> İzin Var (Global)
          </span>
        );
      case 'program':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
            <Layers className="w-3 h-3 text-blue-700" /> Kapsama Bağlı (Program)
          </span>
        );
      case 'group':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
            <Layers className="w-3 h-3 text-indigo-700" /> Kapsama Bağlı (Grup)
          </span>
        );
      case 'self':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
            <Shield className="w-3 h-3 text-purple-700" /> Yalnızca Kendi Verisi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-400">
            <X className="w-3 h-3 text-slate-400" /> İzin Yok
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-brand-border p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
              Granüler Yetki Matrisi
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500 font-medium">Sprint E05-A</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Rol ve İşlem İzinleri Kılavuzu
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Varsayılan Güvenlik Politikası: <strong>Açıkça tanımlanmamış tüm yetkiler reddedilir (Deny by Default).</strong>
          </p>
        </div>

        {/* Status / Permission Info */}
        <div className="flex items-center gap-2">
          {isSuperAdmin ? (
            <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              Düzenleme Modu Aktif (Süper Yönetici)
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-slate-400" />
              Yalnızca Okunabilir Görünüm
            </span>
          )}
        </div>
      </div>

      {/* Legend & Policy Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-700">Lejant:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600">İzin Var (Global)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-600">Kapsama Bağlı (Grup / Program)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-slate-600">Yalnızca Kendi Verisi (Self)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="text-slate-600">İzin Yok (Erişim Engelli)</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 italic">
          * Süper yönetici bir hücreye tıklayarak izin kapsamını değiştirebilir.
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="İzin anahtarı veya işlem tanımı ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tüm Kategoriler (24 İzin)</option>
            {Object.entries(PERMISSION_CATEGORIES).map(([catKey, catTitle]) => (
              <option key={catKey} value={catKey}>
                {catTitle}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Permissions Matrix Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-72">İşlem & Yetki Anahtarı</th>
                {ROLES_ORDER.map((role) => (
                  <th
                    key={role}
                    className={`py-3 px-3 text-center ${
                      role === 'superadmin' ? 'bg-amber-50/60 text-amber-950 font-black' : ''
                    }`}
                  >
                    {ROLE_LABELS[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPermissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Arama kriterlerine uygun yetki tanımı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredPermissions.map((perm) => {
                  return (
                    <tr key={perm.key} className="hover:bg-slate-50/70 transition">
                      {/* Permission Title & Key */}
                      <td className="py-3.5 px-4 bg-slate-50/30">
                        <div className="font-bold text-slate-900">{perm.label}</div>
                        <div className="text-[10px] text-blue-600 font-mono mt-0.5">{perm.key}</div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                          {perm.description}
                        </p>
                      </td>

                      {/* Role Cells */}
                      {ROLES_ORDER.map((role) => {
                        const scope = matrix[role]?.[perm.key] || 'none';
                        const isClickable = isSuperAdmin && role !== 'superadmin';

                        return (
                          <td
                            key={role}
                            onClick={() => isClickable && handleCellClick(role, perm.key)}
                            className={`py-3.5 px-2 text-center align-middle transition ${
                              isClickable ? 'cursor-pointer hover:bg-blue-50/80' : ''
                            } ${role === 'superadmin' ? 'bg-amber-50/30' : ''}`}
                            title={
                              isClickable
                                ? `${ROLE_LABELS[role]} için ${perm.key} yetkisini değiştirmek için tıkla`
                                : undefined
                            }
                          >
                            {renderScopeBadge(scope)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Scope Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Yetki Kapsamını Güncelle</h3>
                <p className="text-xs text-slate-500 font-mono">{editTarget.permissionKey}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div>
                Rol: <strong>{ROLE_LABELS[editTarget.role]}</strong>
              </div>
              <div>
                Mevcut Kapsam: <span className="font-mono text-slate-600">{editTarget.currentScope}</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                {successMessage}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yeni Yetki Kapsamı:
                </label>
                <select
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value as PermissionScope)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">none — İzin Yok (Engelli)</option>
                  <option value="global">global — İzin Var (Sistem Geneli)</option>
                  <option value="group">group — Kapsama Bağlı (Atanmış Grup)</option>
                  <option value="program">program — Kapsama Bağlı (Atanmış Program)</option>
                  <option value="self">self — Yalnızca Kendi Verisi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Değişiklik Gerekçesi (Zorunlu - Denetim Kütüğüne Tescil Edilir):
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Örn: Eğitmenlerin ders programını görüntüleyebilmesi için group seviyesinde yetkilendirme sağlandı."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissionChange}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                >
                  Yetkiyi Güncelle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
