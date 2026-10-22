import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  UserCheck,
  UserX,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Layers,
  Info,
} from 'lucide-react';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import {
  getStoredUsers,
  assignUserRole,
  revokeUserRole,
  setUserActiveStatus,
  subscribeToUserUpdates,
} from '../services/authorizationDemoService';
import { UserProfile, UserRole } from '../types';

export const UserManagementPage: React.FC = () => {
  const { currentRole, currentUser } = useDemoRole();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modal State for Role Change
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [modalMode, setModalMode] = useState<'assign' | 'revoke' | 'status' | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>('trainee');
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadUsers = () => {
    setUsers(getStoredUsers());
  };

  useEffect(() => {
    loadUsers();
    const unsub = subscribeToUserUpdates(setUsers);
    return () => unsub();
  }, []);

  const isSuperAdmin = currentRole === 'superadmin';

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole =
      roleFilter === 'all' ||
      u.role === roleFilter ||
      (u.roles && u.roles.includes(roleFilter as UserRole));

    return matchesSearch && matchesRole;
  });

  const handleOpenAssignModal = (u: UserProfile) => {
    setSelectedUser(u);
    setModalMode('assign');
    setTargetRole('trainee');
    setReason('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleOpenRevokeModal = (u: UserProfile, roleToRevoke: UserRole) => {
    setSelectedUser(u);
    setModalMode('revoke');
    setTargetRole(roleToRevoke);
    setReason('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleOpenStatusModal = (u: UserProfile) => {
    setSelectedUser(u);
    setModalMode('status');
    setReason('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleExecuteModalAction = () => {
    if (!selectedUser) return;
    if (!reason.trim()) {
      setErrorMessage('Lütfen işlemin denetim gerekçesini belirtiniz.');
      return;
    }

    if (modalMode === 'assign') {
      const res = assignUserRole({
        targetUserId: selectedUser.id,
        newRole: targetRole,
        actor: {
          id: currentUser.id,
          role: currentRole,
          name: currentUser.fullName,
        },
        reason,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Rol atanamadı.');
      } else {
        setSuccessMessage(`${selectedUser.fullName} kullanıcısına ${targetRole} rolü başarıyla atandı.`);
        setTimeout(() => {
          setModalMode(null);
          loadUsers();
        }, 1200);
      }
    } else if (modalMode === 'revoke') {
      const res = revokeUserRole({
        targetUserId: selectedUser.id,
        roleToRevoke: targetRole,
        actor: {
          id: currentUser.id,
          role: currentRole,
          name: currentUser.fullName,
        },
        reason,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Rol kaldırılamadı.');
      } else {
        setSuccessMessage(`${selectedUser.fullName} kullanıcısından ${targetRole} rolü kaldırıldı.`);
        setTimeout(() => {
          setModalMode(null);
          loadUsers();
        }, 1200);
      }
    } else if (modalMode === 'status') {
      const newStatus = selectedUser.isActive === false ? true : false;
      const res = setUserActiveStatus({
        targetUserId: selectedUser.id,
        isActive: newStatus,
        actor: {
          id: currentUser.id,
          role: currentRole,
          name: currentUser.fullName,
        },
        statusReason: reason,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Durum güncellenemedi.');
      } else {
        setSuccessMessage(
          `${selectedUser.fullName} durumu ${newStatus ? 'Aktif' : 'Pasif'} olarak güncellendi.`
        );
        setTimeout(() => {
          setModalMode(null);
          loadUsers();
        }, 1200);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-brand-border p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
              Kullanıcı & Rol Yönetimi
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500 font-medium">Sprint E05-A</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Sentetik Kullanıcı ve Erişim Masası
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Sistem kullanıcıları, çoklu roller, grup ilişkileri ve aktif/pasif durum yönetimi.
          </p>
        </div>

        {/* Academic Preservation Notice */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 flex items-start gap-2 max-w-md">
          <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Akademik Bütünlük Kuralı:</strong> Bir kullanıcının rolü kaldırılsa veya pasife alınsa dahi geçmiş başvuru, yoklama, ödev ve belge kayıtları <strong>kesinlikle silinmez</strong>.
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="İsim, e-posta veya demo ID ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tüm Roller</option>
            <option value="superadmin">Süper Yönetici</option>
            <option value="admin">Yönetici</option>
            <option value="instructor">Eğitmen</option>
            <option value="trainee">Kursiyer</option>
            <option value="applicant">Aday</option>
            <option value="visitor">Ziyaretçi</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Kullanıcı</th>
                <th className="py-3 px-4">Birincil Rol</th>
                <th className="py-3 px-4">Tüm Roller</th>
                <th className="py-3 px-4">Grup & Program Kapsamı</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Arama kriterlerine uygun kullanıcı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isActive = u.isActive !== false;
                  const allRoles = u.roles || [u.role];

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/80 transition ${
                        !isActive ? 'opacity-60 bg-slate-50/40' : ''
                      }`}
                    >
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{u.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {u.id} {u.email && `• ${u.email}`}
                        </div>
                      </td>

                      {/* Primary Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            u.role === 'superadmin'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : u.role === 'admin'
                              ? 'bg-purple-100 text-purple-900 border border-purple-200'
                              : u.role === 'instructor'
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : u.role === 'trainee'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {u.role === 'superadmin'
                            ? '★ Süper Yönetici'
                            : u.role === 'admin'
                            ? 'Yönetici'
                            : u.role === 'instructor'
                            ? 'Eğitmen'
                            : u.role === 'trainee'
                            ? 'Kursiyer'
                            : u.role === 'applicant'
                            ? 'Aday'
                            : 'Ziyaretçi'}
                        </span>
                      </td>

                      {/* All Roles with Revoke Option */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {allRoles.map((r) => (
                            <span
                              key={r}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              <span>{r}</span>
                              {allRoles.length > 1 && (
                                <button
                                  onClick={() => handleOpenRevokeModal(u, r)}
                                  className="text-slate-400 hover:text-rose-600 font-bold ml-0.5"
                                  title={`${r} rolünü kaldır`}
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Group & Program Scope */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-600">
                        {u.assignedGroupIds && u.assignedGroupIds.length > 0 ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 font-medium text-slate-800">
                              <Layers className="w-3 h-3 text-blue-500" />
                              <span>Gruplar: {u.assignedGroupIds.join(', ')}</span>
                            </div>
                            {u.assignedProgramIds && (
                              <div className="text-[10px] text-slate-400">
                                Programlar: {u.assignedProgramIds.join(', ')}
                              </div>
                            )}
                          </div>
                        ) : u.assignedProgramIds && u.assignedProgramIds.length > 0 ? (
                          <div className="text-[11px] text-slate-600">
                            Program: {u.assignedProgramIds.join(', ')}
                          </div>
                        ) : (
                          <span className="text-slate-400">Genel / Kapsamsız</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleOpenStatusModal(u)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                          }`}
                          title="Durumu değiştirmek için tıkla"
                        >
                          {isActive ? (
                            <>
                              <UserCheck className="w-3 h-3" /> Aktif
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3" /> Pasif
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenAssignModal(u)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition"
                        >
                          + Rol Ata
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Assign / Revoke / Status */}
      {modalMode && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  modalMode === 'assign'
                    ? 'bg-blue-100 text-blue-700'
                    : modalMode === 'revoke'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {modalMode === 'assign' ? (
                  <UserPlus className="w-5 h-5" />
                ) : modalMode === 'revoke' ? (
                  <UserX className="w-5 h-5" />
                ) : (
                  <ShieldAlert className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {modalMode === 'assign'
                    ? 'Kullanıcıya Rol Ata'
                    : modalMode === 'revoke'
                    ? 'Kullanıcıdan Rol Kaldır'
                    : 'Kullanıcı Durumunu Güncelle'}
                </h3>
                <p className="text-xs text-slate-500">{selectedUser.fullName}</p>
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
              {modalMode === 'assign' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Atanacak Rol:
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="trainee">Kursiyer (trainee)</option>
                    <option value="instructor">Eğitmen (instructor)</option>
                    <option value="admin">Yönetici (admin)</option>
                    <option value="applicant">Aday (applicant)</option>
                    <option value="superadmin" disabled={!isSuperAdmin}>
                      ★ Süper Yönetici {isSuperAdmin ? '' : '(Yalnızca Süper Yönetici Atayabilir)'}
                    </option>
                  </select>
                </div>
              )}

              {modalMode === 'revoke' && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                  Kaldırılacak Rol: <strong className="text-rose-700">{targetRole}</strong>
                </div>
              )}

              {modalMode === 'status' && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                  Yeni Durum:{' '}
                  <strong>{selectedUser.isActive === false ? 'Aktif' : 'Pasif'}</strong>
                  {selectedUser.isActive !== false && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Pasif yapılan kullanıcı platformda yeni işlem (başvuru, yoklama, ödev teslimi vb.) yapamaz.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  İşlem Gerekçesi (Zorunlu - Denetim Kütüğüne Yazılır):
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Değişikliğin idari veya akademik gerekçesini açıklayınız..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteModalAction}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                >
                  Onayla ve Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
