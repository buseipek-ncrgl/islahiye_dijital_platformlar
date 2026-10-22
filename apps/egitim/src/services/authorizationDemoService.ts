/**
 * Rol, Kullanıcı ve Dinamik Yetki Yönetim Servisi (Sprint E05-A)
 * İslahiye Ticaret Odası Eğitim Portalı
 *
 * Kurallar:
 * 1. Standart admin, süper yönetici rolü atayamaz (Yetki hiyerarşisi).
 * 2. Rol atama/kaldırma ve matris güncellemeleri gerekçeyle AuditLog'a yazılır.
 * 3. Rol kaldırıldığında veya değiştirildiğinde geçmiş akademik kayıtlar (başvurular, yoklamalar, ödevler, belgeler) KESİNLİKLE SİLİNMEZ!
 * 4. Pasif kullanıcı yeni işlem yapamaz.
 */

import {
  UserProfile,
  UserRole,
  PermissionKey,
  PermissionScope,
  DEFAULT_ROLE_PERMISSIONS,
} from '../types';
import { DEMO_USERS } from '../data/educationData';
import { recordAuditLog } from './auditStorage';

const USERS_STORAGE_KEY = 'islahiye_education_users_v1';
const ROLE_MATRIX_STORAGE_KEY = 'islahiye_education_role_matrix_v1';
const MATRIX_VERSION_STORAGE_KEY = 'islahiye_education_matrix_version_v1';

export const USERS_UPDATE_EVENT = 'islahiye_users_updated';
export const ROLE_MATRIX_UPDATE_EVENT = 'islahiye_role_matrix_updated';

// -----------------------------------------------------------------------------
// 1. KULLANICI LİSTESİ VE BAŞLANGIÇ VERİSİ
// -----------------------------------------------------------------------------

export const getStoredUsers = (): UserProfile[] => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Başlangıç kullanıcı havuzunu oluştur
    const initialUsers: UserProfile[] = Object.values(DEMO_USERS).map((u) => {
      let assignedGroupIds: string[] = [];
      let assignedProgramIds: string[] = [];

      if (u.role === 'trainee') {
        assignedGroupIds = ['grp-01'];
        assignedProgramIds = ['prog-01'];
      } else if (u.role === 'instructor') {
        assignedGroupIds = ['grp-01', 'grp-03'];
        assignedProgramIds = ['prog-01', 'prog-03'];
      } else if (u.role === 'applicant') {
        assignedProgramIds = ['prog-01'];
      }

      return {
        ...u,
        roles: u.roles || [u.role],
        assignedGroupIds,
        assignedProgramIds,
        isActive: u.isActive !== undefined ? u.isActive : true,
        createdAt: '2026-08-01T10:00:00.000Z',
      };
    });

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
    return initialUsers;
  } catch (err) {
    console.error('Users read error:', err);
    return Object.values(DEMO_USERS);
  }
};

export const saveUsersToStorage = (users: UserProfile[]): void => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(USERS_UPDATE_EVENT, { detail: users }));
    }
  } catch (err) {
    console.error('Users write error:', err);
  }
};

// -----------------------------------------------------------------------------
// 2. DİNAMİK YETKİ MATRİSİ VE SÜRÜM YÖNETİMİ
// -----------------------------------------------------------------------------

export type RolePermissionMatrix = Record<UserRole, Record<PermissionKey, PermissionScope>>;

export const getStoredRolePermissionMatrix = (): RolePermissionMatrix => {
  try {
    const raw = localStorage.getItem(ROLE_MATRIX_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
    localStorage.setItem(ROLE_MATRIX_STORAGE_KEY, JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
    return DEFAULT_ROLE_PERMISSIONS;
  } catch (err) {
    console.error('Role matrix read error:', err);
    return DEFAULT_ROLE_PERMISSIONS;
  }
};

export const getMatrixVersion = (): number => {
  try {
    const raw = localStorage.getItem(MATRIX_VERSION_STORAGE_KEY);
    return raw ? parseInt(raw, 10) || 1 : 1;
  } catch {
    return 1;
  }
};

export const saveRolePermissionMatrix = (
  paramOrMatrix:
    | RolePermissionMatrix
    | {
        newMatrix: RolePermissionMatrix;
        actor: { id: string; role: UserRole; name: string };
        reason: string;
      },
  actorParam?: { id: string; role: UserRole; name: string },
  reasonParam?: string
): { success: boolean; version: number; error?: string } => {
  let newMatrix: RolePermissionMatrix;
  let actor: { id: string; role: UserRole; name: string };
  let reason: string;

  if ('newMatrix' in paramOrMatrix) {
    newMatrix = paramOrMatrix.newMatrix;
    actor = paramOrMatrix.actor;
    reason = paramOrMatrix.reason;
  } else {
    newMatrix = paramOrMatrix;
    actor = actorParam!;
    reason = reasonParam || '';
  }

  if (actor.role !== 'superadmin') {
    return {
      success: false,
      version: getMatrixVersion(),
      error: 'İzin matrisini yalnızca Süper Yönetici değiştirebilir.',
    };
  }

  if (!reason.trim()) {
    return {
      success: false,
      version: getMatrixVersion(),
      error: 'Yetki matrisi değişikliği için kurumsal gerekçe zorunludur.',
    };
  }

  const prevVersion = getMatrixVersion();
  const nextVersion = prevVersion + 1;

  localStorage.setItem(ROLE_MATRIX_STORAGE_KEY, JSON.stringify(newMatrix));
  localStorage.setItem(MATRIX_VERSION_STORAGE_KEY, nextVersion.toString());

  // Denetim kaydı oluştur
  recordAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    actorName: actor.name,
    action: 'permission.matrix_updated',
    resourceType: 'permission_matrix',
    resourceId: `matrix-v${nextVersion}`,
    resourceTitle: `İzin Matrisi Revizyonu (v${nextVersion})`,
    reason: reason.trim(),
    previousStateSummary: `Sürüm ${prevVersion}`,
    nextStateSummary: `Sürüm ${nextVersion} onaylandı ve etkinleştirildi`,
    sourceModule: 'authorizationDemoService',
    outcome: 'success',
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(ROLE_MATRIX_UPDATE_EVENT, { detail: newMatrix })
    );
  }

  return { success: true, version: nextVersion };
};

// -----------------------------------------------------------------------------
// 3. KULLANICI ROL VE DURUM YÖNETİMİ
// -----------------------------------------------------------------------------

export const assignUserRole = (params: {
  targetUserId: string;
  newRole: UserRole;
  actor: { id: string; role: UserRole; name: string };
  reason: string;
}): { success: boolean; user?: UserProfile; error?: string } => {
  const { targetUserId, newRole, actor, reason } = params;

  // Kural: Standart admin, süper yönetici rolü atayamaz
  if (newRole === 'superadmin' && actor.role !== 'superadmin') {
    recordAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      actorName: actor.name,
      action: 'access.denied',
      resourceType: 'role_assignment',
      resourceId: targetUserId,
      resourceTitle: 'Yetkisiz Süper Yönetici Atama Girişimi',
      reason: 'Standart yönetici süper yönetici rolü tanımlamaya çalıştı.',
      sourceModule: 'authorizationDemoService',
      outcome: 'denied',
    });
    return {
      success: false,
      error: 'Süper yönetici rolünü yalnızca mevcut bir Süper Yönetici atayabilir.',
    };
  }

  if (!reason.trim()) {
    return { success: false, error: 'Rol atama işlemi için gerekçe belirtilmelidir.' };
  }

  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === targetUserId);

  if (index === -1) {
    return { success: false, error: 'Kullanıcı bulunamadı.' };
  }

  const targetUser = users[index];
  const oldRoles = targetUser.roles || [targetUser.role];
  const updatedRoles = Array.from(new Set([...oldRoles, newRole]));

  const updatedUser: UserProfile = {
    ...targetUser,
    role: newRole, // Ana aktif rol
    roles: updatedRoles,
    statusReason: `Rol güncellendi: ${newRole} (${reason})`,
  };

  users[index] = updatedUser;
  saveUsersToStorage(users);

  recordAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    actorName: actor.name,
    action: 'user.role_assigned',
    resourceType: 'role_assignment',
    resourceId: targetUserId,
    resourceTitle: `${targetUser.fullName} (${newRole})`,
    reason: reason.trim(),
    previousStateSummary: `Roller: ${oldRoles.join(', ')}`,
    nextStateSummary: `Roller: ${updatedRoles.join(', ')}`,
    sourceModule: 'authorizationDemoService',
    outcome: 'success',
  });

  return { success: true, user: updatedUser };
};

export const revokeUserRole = (params: {
  targetUserId: string;
  roleToRevoke: UserRole;
  actor: { id: string; role: UserRole; name: string };
  reason: string;
}): { success: boolean; user?: UserProfile; error?: string } => {
  const { targetUserId, roleToRevoke, actor, reason } = params;

  if (roleToRevoke === 'superadmin' && actor.role !== 'superadmin') {
    return {
      success: false,
      error: 'Süper yönetici rolü yalnızca bir Süper Yönetici tarafından kaldırılabilir.',
    };
  }

  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === targetUserId);

  if (index === -1) {
    return { success: false, error: 'Kullanıcı bulunamadı.' };
  }

  const targetUser = users[index];
  const oldRoles = targetUser.roles || [targetUser.role];
  const updatedRoles = oldRoles.filter((r) => r !== roleToRevoke);

  const fallbackRole: UserRole = updatedRoles.length > 0 ? updatedRoles[0] : 'visitor';

  const updatedUser: UserProfile = {
    ...targetUser,
    role: fallbackRole,
    roles: updatedRoles.length > 0 ? updatedRoles : [fallbackRole],
  };

  users[index] = updatedUser;
  saveUsersToStorage(users);

  // Kural: Geçmiş akademik kayıtlar korunur, silinmez!
  recordAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    actorName: actor.name,
    action: 'user.role_revoked',
    resourceType: 'role_assignment',
    resourceId: targetUserId,
    resourceTitle: `${targetUser.fullName} (${roleToRevoke} kaldırıldı)`,
    reason: reason.trim() || 'Yetkili kararıyla rol geri alındı.',
    previousStateSummary: `Roller: ${oldRoles.join(', ')}`,
    nextStateSummary: `Roller: ${updatedUser.roles?.join(', ')} (Akademik geçmiş korundu)`,
    sourceModule: 'authorizationDemoService',
    outcome: 'success',
  });

  return { success: true, user: updatedUser };
};

export const setUserActiveStatus = (params: {
  targetUserId: string;
  isActive: boolean;
  statusReason: string;
  actor: { id: string; role: UserRole; name: string };
}): { success: boolean; user?: UserProfile; error?: string } => {
  const { targetUserId, isActive, statusReason, actor } = params;

  if (actor.role !== 'admin' && actor.role !== 'superadmin') {
    return { success: false, error: 'Kullanıcı durumunu değiştirme yetkiniz yok.' };
  }

  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === targetUserId);

  if (index === -1) {
    return { success: false, error: 'Kullanıcı bulunamadı.' };
  }

  const targetUser = users[index];
  if (targetUser.role === 'superadmin' && actor.role !== 'superadmin') {
    return { success: false, error: 'Süper yönetici hesabı standart admin tarafından pasife alınamaz.' };
  }

  const updatedUser: UserProfile = {
    ...targetUser,
    isActive,
    statusReason: statusReason.trim(),
  };

  users[index] = updatedUser;
  saveUsersToStorage(users);

  recordAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    actorName: actor.name,
    action: 'user.role_assigned',
    resourceType: 'role_assignment',
    resourceId: targetUserId,
    resourceTitle: `${targetUser.fullName} (Durum: ${isActive ? 'Aktif' : 'Pasif'})`,
    reason: statusReason.trim(),
    previousStateSummary: `Durum: ${targetUser.isActive !== false ? 'Aktif' : 'Pasif'}`,
    nextStateSummary: `Durum: ${isActive ? 'Aktif' : 'Pasif'}`,
    sourceModule: 'authorizationDemoService',
    outcome: 'success',
  });

  return { success: true, user: updatedUser };
};

// -----------------------------------------------------------------------------
// 4. ABONELİKLER VE SIFIRLAMA
// -----------------------------------------------------------------------------

export const subscribeToUserUpdates = (callback: (users: UserProfile[]) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback(getStoredUsers());
  window.addEventListener(USERS_UPDATE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(USERS_UPDATE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};

export const subscribeToRoleMatrixUpdates = (
  callback: (matrix: RolePermissionMatrix) => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback(getStoredRolePermissionMatrix());
  window.addEventListener(ROLE_MATRIX_UPDATE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(ROLE_MATRIX_UPDATE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};

export const resetAuthorizationStorage = (): void => {
  localStorage.setItem(ROLE_MATRIX_STORAGE_KEY, JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
  localStorage.setItem(MATRIX_VERSION_STORAGE_KEY, '1');
  localStorage.removeItem(USERS_STORAGE_KEY);
  getStoredUsers(); // Re-seed users
};
