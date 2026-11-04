import React, { useState, useEffect, useMemo } from 'react';
import {
  SlidersHorizontal,
  Shield,
  Check,
  X,
  Layers,
  Search,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  Users,
  CheckSquare,
  Square,
  Lock,
  Sparkles,
} from 'lucide-react';
import { ActionConfirmModal } from '../components/common/ActionConfirmModal';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import {
  PERMISSION_DEFINITIONS,
  PERMISSION_CATEGORIES,
  PermissionKey,
  PermissionScope,
  PermissionCategory,
  UserRole,
  RolePermissionMatrix,
} from '../types';
import {
  getStoredRolePermissionMatrix,
  saveRolePermissionMatrix,
  subscribeToRoleMatrixUpdates,
  batchSetPermissionsForRole,
  resetRolePermissionsToDefault,
  getMatrixVersion,
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
  superadmin: 'Sistem Yöneticisi',
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  visitor: 'Kayıtsız halk ve genel ziyaretçi',
  applicant: 'Başvuru yapmış ve inceleme bekleyen aday',
  trainee: 'Kursa kabul edilmiş aktif öğrenci',
  instructor: 'Ders ve yoklama yürüten eğitmen',
  admin: 'Eğitim koordinatörü ve komisyon yetkilisi',
  superadmin: 'Sistem mimarı ve master denetçi',
};

export const RolePermissionsPage: React.FC = () => {
  const { currentRole, currentUser } = useDemoRole();
  const [matrix, setMatrix] = useState<RolePermissionMatrix>(getStoredRolePermissionMatrix());
  const [matrixVer, setMatrixVer] = useState<number>(getMatrixVersion());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPermKeys, setSelectedPermKeys] = useState<PermissionKey[]>([]);

  // Modal & Edit states
  const [editTarget, setEditTarget] = useState<{
    role: UserRole;
    permissionKey: PermissionKey;
    currentScope: PermissionScope;
  } | null>(null);
  const [newScope, setNewScope] = useState<PermissionScope>('none');

  // Bulk action modal state
  const [bulkModal, setBulkModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    role: UserRole;
    permissionKeys: PermissionKey[];
    scope: PermissionScope;
  } | null>(null);

  // Reset role to default modal
  const [resetTargetRole, setResetTargetRole] = useState<UserRole | null>(null);

  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [warningModal, setWarningModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });

  // Floating bar selections
  const [floatingRole, setFloatingRole] = useState<UserRole>('instructor');
  const [floatingScope, setFloatingScope] = useState<PermissionScope>('group');

  useEffect(() => {
    const unsub = subscribeToRoleMatrixUpdates((m) => {
      setMatrix(m);
      setMatrixVer(getMatrixVersion());
    });
    return () => unsub();
  }, []);

  const isSuperAdmin = currentRole === 'superadmin';
  const allDefinitions = useMemo(() => Object.values(PERMISSION_DEFINITIONS), []);

  // Filtered definitions
  const filteredPermissions = useMemo(() => {
    return allDefinitions.filter((p) => {
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch =
        p.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [allDefinitions, selectedCategory, searchQuery]);

  // Group filtered permissions by category
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, typeof filteredPermissions> = {};
    filteredPermissions.forEach((p) => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, [filteredPermissions]);

  // Telemetry: role coverage statistics
  const roleCoverageStats = useMemo(() => {
    const stats: Record<UserRole, { total: number; active: number; percentage: number; globalCount: number; scopedCount: number }> = {
      visitor: { total: 24, active: 0, percentage: 0, globalCount: 0, scopedCount: 0 },
      applicant: { total: 24, active: 0, percentage: 0, globalCount: 0, scopedCount: 0 },
      trainee: { total: 24, active: 0, percentage: 0, globalCount: 0, scopedCount: 0 },
      instructor: { total: 24, active: 0, percentage: 0, globalCount: 0, scopedCount: 0 },
      admin: { total: 24, active: 0, percentage: 0, globalCount: 0, scopedCount: 0 },
      superadmin: { total: 24, active: 24, percentage: 100, globalCount: 24, scopedCount: 0 },
    };

    ROLES_ORDER.forEach((role) => {
      const perms = matrix[role] || {};
      let active = 0;
      let globalCount = 0;
      let scopedCount = 0;

      allDefinitions.forEach((def) => {
        const sc = perms[def.key] || 'none';
        if (sc !== 'none') {
          active++;
          if (sc === 'global') globalCount++;
          else scopedCount++;
        }
      });

      const total = allDefinitions.length || 24;
      stats[role] = {
        total,
        active,
        percentage: Math.round((active / total) * 100),
        globalCount,
        scopedCount,
      };
    });

    return stats;
  }, [matrix, allDefinitions]);

  // Multi-select toggle helpers
  const handleToggleSelectAll = () => {
    if (selectedPermKeys.length === filteredPermissions.length) {
      setSelectedPermKeys([]);
    } else {
      setSelectedPermKeys(filteredPermissions.map((p) => p.key as PermissionKey));
    }
  };

  const handleToggleCategorySelect = (categoryKey: string) => {
    const catKeys = (groupedPermissions[categoryKey] || []).map((p) => p.key as PermissionKey);
    const allSelected = catKeys.every((k) => selectedPermKeys.includes(k));

    if (allSelected) {
      setSelectedPermKeys((prev) => prev.filter((k) => !catKeys.includes(k)));
    } else {
      setSelectedPermKeys((prev) => Array.from(new Set([...prev, ...catKeys])));
    }
  };

  const handleToggleSingleSelect = (permKey: PermissionKey) => {
    setSelectedPermKeys((prev) =>
      prev.includes(permKey) ? prev.filter((k) => k !== permKey) : [...prev, permKey]
    );
  };

  // Single cell click
  const handleCellClick = (role: UserRole, permKey: PermissionKey) => {
    if (!isSuperAdmin) {
      setWarningModal({
        isOpen: true,
        title: 'Yetki Sınırı',
        message: 'İzin matrisini yalnızca Sistem Yöneticisi (Kemal Ertürk) düzenleyebilir.',
      });
      return;
    }
    if (role === 'superadmin') {
      setWarningModal({
        isOpen: true,
        title: 'Korumalı Rol',
        message: 'Sistem Yöneticisi rolü sistem bütününde tam yetkiye (global) sahiptir ve kısıtlanamaz.',
      });
      return;
    }

    const currentScope = matrix[role]?.[permKey] || 'none';
    setEditTarget({ role, permissionKey: permKey, currentScope });
    setNewScope(currentScope);
    setReason('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Save single cell modification
  const handleSaveSinglePermission = () => {
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
      setSuccessMessage('İzin güncellendi ve denetim kütüğüne tescil edildi.');
      setMatrix(updatedMatrix);
      setMatrixVer(res.version);
      setTimeout(() => {
        setEditTarget(null);
      }, 1000);
    }
  };

  // Trigger Bulk Category Action Modal
  const handleOpenCategoryBulkModal = (categoryKey: string, role: UserRole) => {
    if (!isSuperAdmin) {
      setWarningModal({
        isOpen: true,
        title: 'Yetki Sınırı',
        message: 'Toplu yetki atamasını yalnızca Sistem Yöneticisi gerçekleştirebilir.',
      });
      return;
    }
    const catKeys = (groupedPermissions[categoryKey] || []).map((p) => p.key as PermissionKey);
    const catTitle = PERMISSION_CATEGORIES[categoryKey as PermissionCategory] || categoryKey;

    setBulkModal({
      isOpen: true,
      title: `${ROLE_LABELS[role]} için "${catTitle}" Kategorisinde Toplu Yetki`,
      description: `Bu işlem "${catTitle}" modülündeki ${catKeys.length} izni tek seferde güncelleyecektir.`,
      role,
      permissionKeys: catKeys,
      scope: 'scoped' as any,
    });
    setReason('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Trigger Bulk Selected Action
  const handleOpenSelectedBulkModal = () => {
    if (!isSuperAdmin) {
      setWarningModal({
        isOpen: true,
        title: 'Yetki Sınırı',
        message: 'Toplu yetki atamasını yalnızca Sistem Yöneticisi gerçekleştirebilir.',
      });
      return;
    }
    if (selectedPermKeys.length === 0) return;

    setBulkModal({
      isOpen: true,
      title: `${ROLE_LABELS[floatingRole]} için Seçili ${selectedPermKeys.length} İzne Yetki Ata`,
      description: `Seçili ${selectedPermKeys.length} iznin yetki kapsamı "${floatingScope}" olarak toplu tescillenecektir.`,
      role: floatingRole,
      permissionKeys: selectedPermKeys as PermissionKey[],
      scope: floatingScope,
    });
    setReason('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Execute Bulk Set Permissions
  const handleExecuteBulkSave = () => {
    if (!bulkModal) return;
    if (!reason.trim()) {
      setErrorMessage('Toplu yetki değişikliği için resmi kurumsal gerekçe girilmesi zorunludur.');
      return;
    }

    const res = batchSetPermissionsForRole({
      role: bulkModal.role,
      permissionKeys: bulkModal.permissionKeys,
      newScope: bulkModal.scope,
      actor: {
        id: currentUser.id,
        role: currentRole,
        name: currentUser.fullName,
      },
      reason,
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Toplu yetki güncellenemedi.');
    } else {
      setSuccessMessage(`${bulkModal.permissionKeys.length} adet yetki başarıyla güncellendi (v${res.version}.0).`);
      setMatrix(getStoredRolePermissionMatrix());
      setMatrixVer(res.version);
      setTimeout(() => {
        setBulkModal(null);
        setSelectedPermKeys([]);
      }, 1200);
    }
  };

  // Execute Role Reset to Defaults
  const handleExecuteRoleReset = () => {
    if (!resetTargetRole) return;
    if (!reason.trim()) {
      setErrorMessage('Rolü varsayılana döndürmek için gerekçe belirtilmesi zorunludur.');
      return;
    }

    const res = resetRolePermissionsToDefault({
      role: resetTargetRole,
      actor: {
        id: currentUser.id,
        role: currentRole,
        name: currentUser.fullName,
      },
      reason,
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Rol sıfırlanamadı.');
    } else {
      setSuccessMessage(`${ROLE_LABELS[resetTargetRole]} rolü fabrika varsayılanlarına döndürüldü.`);
      setMatrix(getStoredRolePermissionMatrix());
      setMatrixVer(res.version);
      setTimeout(() => {
        setResetTargetRole(null);
      }, 1200);
    }
  };

  // Render Scope Badge (Kurumsal Tek Renk Mavi Ton Ailesi)
  const renderScopeBadge = (scope: PermissionScope) => {
    switch (scope) {
      case 'global':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-600 text-white shadow-2xs">
            <Check className="w-3 h-3 text-white stroke-[3]" /> Global
          </span>
        );
      case 'program':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200 shadow-2xs">
            <Layers className="w-3 h-3 text-blue-700 stroke-[2.5]" /> Program
          </span>
        );
      case 'group':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            <Users className="w-3 h-3 text-blue-600 stroke-[2.5]" /> Grup
          </span>
        );
      case 'self':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs">
            <Shield className="w-3 h-3 text-slate-600 stroke-[2.5]" /> Kendi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-400 bg-slate-100/70">
            <X className="w-3 h-3 text-slate-400" /> Yok
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Granüler Yetki ve Erişim Matrisi
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
              v{matrixVer}.0
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            İslahiye Eğitim Portalı 6 temel rolü ve 24 işlem bazlı yetkiyi yönetir; tüm toplu ve tekil değişiklikler denetim kütüğüne yazılır.
          </p>
        </div>

        {/* Global Superadmin Badge */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-right shrink-0">
          <div className="text-xs font-bold text-slate-900 flex items-center justify-end gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Master Root: Süper Yönetici</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {isSuperAdmin
              ? 'Yetki düzenleme yetkiniz aktif.'
              : 'Salt Okunur Mod: Yetkileri yalnızca Kemal Ertürk düzenleyebilir.'}
          </div>
        </div>
      </div>

      {/* Role Coverage Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {ROLES_ORDER.map((role) => {
          const stats = roleCoverageStats[role];
          const isSuper = role === 'superadmin';

          return (
            <div
              key={role}
              className={`p-3.5 rounded-xl border transition shadow-2xs relative flex flex-col justify-between ${
                isSuper
                  ? 'bg-amber-50/50 border-amber-200 ring-1 ring-amber-300/40'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {ROLE_LABELS[role]}
                  </span>
                  {isSuper ? (
                    <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                  ) : (
                    <button
                      type="button"
                      disabled={!isSuperAdmin}
                      onClick={() => setResetTargetRole(role)}
                      className="text-[10px] text-slate-400 hover:text-blue-600 p-0.5 rounded transition disabled:opacity-30"
                      title="Fabrika varsayılanına sıfırla"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-1 mb-2">
                  {ROLE_DESCRIPTIONS[role]}
                </p>
              </div>

              <div>
                <div className="flex items-baseline justify-between text-xs mb-1">
                  <span className="font-extrabold text-slate-800 text-sm">
                    %{stats.percentage}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {stats.active}/{stats.total} İzin
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isSuper
                        ? 'bg-amber-500'
                        : stats.percentage > 70
                        ? 'bg-emerald-500'
                        : stats.percentage > 30
                        ? 'bg-blue-500'
                        : 'bg-indigo-400'
                    }`}
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-700">Kapsam Seviyeleri:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="text-slate-600 font-medium">Global (Sistem Geneli)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span className="text-slate-600 font-medium">Program (Atanmış Program)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-300" />
              <span className="text-slate-600 font-medium">Grup (Atanmış Grup)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-slate-600 font-medium">Kendi (Yalnızca Kendi Verisi)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="text-slate-400 font-medium">Yok (Erişim Engelli)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            {isSuperAdmin ? (
              <span className="text-emerald-700 font-medium">
                Hücreye tıklayarak doğrudan yetki kapsamını değiştirebilirsiniz.
              </span>
            ) : (
              <span className="text-slate-400">Görüntüleme modundasınız.</span>
            )}
          </div>
        </div>

        {/* Search, Category and Top Action Ribbon */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="İzin veya açıklama ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
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

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1.5"
            >
              {selectedPermKeys.length === filteredPermissions.length && filteredPermissions.length > 0 ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Seçimi Temizle</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tümünü Seç ({filteredPermissions.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Permissions Matrix Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[640px] overflow-y-auto relative">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-20 bg-slate-50 shadow-2xs">
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center bg-slate-50">
                  <span className="sr-only">Seçim</span>
                </th>
                <th className="py-3 px-4 w-80 bg-slate-50">İşlem & Yetki Anahtarı</th>
                {ROLES_ORDER.map((role) => (
                  <th
                    key={role}
                    className={`py-3 px-3 text-center ${
                      role === 'superadmin'
                        ? 'bg-amber-50/90 text-amber-950 font-black'
                        : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{ROLE_LABELS[role]}</span>
                      {role === 'superadmin' && <Lock className="w-3 h-3 text-amber-600" />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPermissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Arama kriterlerine uygun izin tanımı bulunamadı.
                  </td>
                </tr>
              ) : (
                Object.entries(groupedPermissions).map(([catKey, perms]) => {
                  const catTitle = PERMISSION_CATEGORIES[catKey as PermissionCategory] || catKey;
                  const allCatSelected = perms.every((p) => selectedPermKeys.includes(p.key as PermissionKey));

                  return (
                    <React.Fragment key={catKey}>
                      {/* Category Header Row */}
                      <tr className="bg-slate-100/60 border-t border-b border-slate-200/80">
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={allCatSelected}
                            onChange={() => handleToggleCategorySelect(catKey)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                            title="Bu kategorideki tüm izinleri seç"
                          />
                        </td>
                        <td colSpan={7} className="py-2.5 px-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                                {catTitle}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                                {perms.length} İzin
                              </span>
                            </div>

                            {/* Category Quick Bulk Action for Superadmin */}
                            {isSuperAdmin && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-500 font-medium">
                                  Toplu İşlem:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenCategoryBulkModal(catKey, 'instructor')}
                                  className="px-2 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition"
                                >
                                  Eğitmene Yetki Ver
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenCategoryBulkModal(catKey, 'admin')}
                                  className="px-2 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition"
                                >
                                  Yöneticiye Yetki Ver
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Permission Rows */}
                      {perms.map((perm) => {
                        const isSelected = selectedPermKeys.includes(perm.key);

                        return (
                          <tr
                            key={perm.key}
                            className={`transition ${
                              isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50/70'
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSingleSelect(perm.key as PermissionKey)}
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                              />
                            </td>

                            {/* Label & Key */}
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{perm.label}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  {perm.key}
                                </span>
                              </div>
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
                                  onClick={() => isClickable && handleCellClick(role, perm.key as PermissionKey)}
                                  className={`py-3 px-2 text-center align-middle transition ${
                                    isClickable ? 'cursor-pointer hover:bg-blue-100/60' : ''
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
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bulk Action Ribbon */}
      {selectedPermKeys.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 max-w-4xl w-[92vw] animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
              {selectedPermKeys.length}
            </div>
            <div>
              <div className="text-xs font-bold">
                {selectedPermKeys.length} İzin Seçildi
              </div>
              <div className="text-[10px] text-slate-400">
                Toplu yetki veya kısıtlama atayın
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Target Role Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Rol:</span>
              <select
                value={floatingRole}
                onChange={(e) => setFloatingRole(e.target.value as UserRole)}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                {ROLES_ORDER.filter((r) => r !== 'superadmin').map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Scope Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Kapsam:</span>
              <select
                value={floatingScope}
                onChange={(e) => setFloatingScope(e.target.value as PermissionScope)}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                <option value="none">none (İzin Yok)</option>
                <option value="global">global (Sistem Geneli)</option>
                <option value="group">group (Atanmış Grup)</option>
                <option value="program">program (Atanmış Program)</option>
                <option value="self">self (Yalnızca Kendi Verisi)</option>
              </select>
            </div>

            {/* Apply Button */}
            <button
              type="button"
              onClick={handleOpenSelectedBulkModal}
              disabled={!isSuperAdmin}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5 disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Toplu Ata</span>
            </button>

            {/* Clear selection */}
            <button
              type="button"
              onClick={() => setSelectedPermKeys([])}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {/* Edit Single Scope Modal */}
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
                Hedef Rol: <strong>{ROLE_LABELS[editTarget.role]}</strong>
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
                  placeholder="Örn: Eğitmenlerin grup yoklaması alabilmesi için group kapsamı verildi."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditTarget(null);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSaveSinglePermission}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                >
                  Yetkiyi Güncelle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Confirmation Modal */}
      {bulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{bulkModal.title}</h3>
                <p className="text-xs text-slate-500">{bulkModal.description}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Hedef Rol:</span>
                <span className="font-bold text-slate-900">{ROLE_LABELS[bulkModal.role]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Etkilenecek İzin Sayısı:</span>
                <span className="font-bold text-blue-700">{bulkModal.permissionKeys.length} İzin</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Atanacak Kapsam:</span>
                <select
                  value={bulkModal.scope}
                  onChange={(e) =>
                    setBulkModal({ ...bulkModal, scope: e.target.value as PermissionScope })
                  }
                  className="px-2 py-1 text-xs border border-slate-300 rounded-md font-bold text-slate-800"
                >
                  <option value="none">none (İzin Yok)</option>
                  <option value="global">global (Sistem Geneli)</option>
                  <option value="group">group (Atanmış Grup)</option>
                  <option value="program">program (Atanmış Program)</option>
                  <option value="self">self (Yalnızca Kendi Verisi)</option>
                </select>
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
                  Resmi Değişiklik Gerekçesi (Zorunlu):
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Örn: Eğitmenlerin dönem başlangıcında ilgili modüllere grup bazlı erişimi sağlandı."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setBulkModal(null);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkSave}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
                >
                  Toplu Değişikliği Uygula
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Role to Default Modal */}
      {resetTargetRole && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {ROLE_LABELS[resetTargetRole]} Rolünü Sıfırla
                </h3>
                <p className="text-xs text-slate-500">
                  Bu rolün tüm yetkileri sistemin fabrika varsayılanlarına döndürülecektir.
                </p>
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
                  Sıfırlama Gerekçesi (Zorunlu):
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Örn: Rol üzerindeki manuel izin sapmaları giderilerek standart yetkilere çekildi."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetTargetRole(null);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRoleReset}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition"
                >
                  Varsayılanlara Sıfırla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-App Custom Warning Modal */}
      <ActionConfirmModal
        isOpen={warningModal.isOpen}
        onClose={() => setWarningModal((prev) => ({ ...prev, isOpen: false }))}
        title={warningModal.title}
        message={warningModal.message}
        variant="warning"
        isAlertOnly
      />
    </div>
  );
};
