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
import { REAL_ACCOUNTS } from './authAdapter';
import { recordAuditLog } from './auditStorage';

const USERS_STORAGE_KEY = 'islahiye_education_users_v2';
const ROLE_MATRIX_STORAGE_KEY = 'islahiye_education_role_matrix_v2';
const MATRIX_VERSION_STORAGE_KEY = 'islahiye_education_matrix_version_v2';

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
      if (Array.isArray(parsed) && parsed.length >= 25) {
        return parsed;
      }
    }

    // Gerçek Identity hesap havuzunu oluştur (30 Tam Profil)
    const initialUsers: UserProfile[] = REAL_ACCOUNTS.map((acc, index) => {
      let assignedGroupIds: string[] = [];
      let assignedProgramIds: string[] = ['prog-01'];
      let occupation = 'Girişimci';
      let residenceDistrict = 'İslahiye / Merkez';

      if (acc.role === 'trainee') {
        if (index >= 10 && index <= 15) {
          // 11-16: Grup A (Ahmet Kaya, Fatma Şahin, vb.)
          assignedGroupIds = ['grp-01'];
          assignedProgramIds = ['prog-01'];
          occupation = index === 10 ? 'Tarımsal Üretici & Çiftçi' : 'Yerel Esnaf & Girişimci';
          residenceDistrict = 'İslahiye / Atatürk Mah.';
        } else if (index >= 16 && index <= 19) {
          // 17-20: Grup B (Caner Yıldız, Büşra Kurt, vb.)
          assignedGroupIds = ['grp-02'];
          assignedProgramIds = ['prog-02'];
          occupation = 'Dış Ticaret Uzman Adayı';
          residenceDistrict = 'İslahiye / Fevzipaşa';
        } else {
          // 21-22: Grup C (İbrahim Çelik, Merve Doğan)
          assignedGroupIds = ['grp-03'];
          assignedProgramIds = ['prog-03'];
          occupation = 'Aşçı Yardımcısı & Gastronomi';
          residenceDistrict = 'İslahiye / Cumhuriyet';
        }
      } else if (acc.role === 'instructor') {
        if (acc.email.includes('mehmet')) {
          assignedGroupIds = ['grp-01', 'grp-03'];
          assignedProgramIds = ['prog-01', 'prog-03'];
          occupation = 'Baş Aşçı & Gastronomi Eğitmeni';
        } else if (acc.email.includes('murat')) {
          assignedGroupIds = ['grp-01'];
          assignedProgramIds = ['prog-01'];
          occupation = 'E-Ticaret Danışmanı';
        } else if (acc.email.includes('kemal')) {
          assignedGroupIds = ['grp-02'];
          assignedProgramIds = ['prog-02'];
          occupation = 'Gümrük Müşaviri';
        } else if (acc.email.includes('fatma')) {
          assignedGroupIds = ['grp-04'];
          assignedProgramIds = ['prog-04'];
          occupation = 'Gıda Mühendisi';
        } else {
          assignedGroupIds = ['grp-01', 'grp-03'];
          assignedProgramIds = ['prog-01', 'prog-03'];
          occupation = 'Mutfak Sanatları Eğitmeni';
        }
        residenceDistrict = 'Gaziantep / Şehitkamil';
      } else if (acc.role === 'admin' || acc.role === 'superadmin') {
        occupation = 'Kamu & Akademi Yöneticisi';
        residenceDistrict = 'İslahiye / Hükümet Cad.';
      } else if (acc.role === 'applicant') {
        occupation = 'Aday Öğrenci';
        residenceDistrict = 'İslahiye / Boğaziçi';
      }

      // Standart ID'ler (Ahmet Kaya -> usr-trainee alias)
      const id = acc.email === 'kursiyer.ahmet@islahiye.bel.tr' 
        ? 'usr-trainee'
        : acc.email === 'egitmen.mehmet@islahiye.bel.tr'
        ? 'usr-instructor'
        : `usr-real-${index + 1}`;

      const phonePrefix = '053' + (2 + (index % 6));
      const phoneSuffix = String(10 + index).padStart(2, '0');

      return {
        id,
        name: acc.name,
        fullName: acc.name,
        email: acc.email,
        role: acc.role,
        roles: [acc.role],
        title: acc.label,
        phone: `${phonePrefix} *** ** ${phoneSuffix}`,
        occupation,
        residenceDistrict,
        assignedGroupIds,
        assignedProgramIds,
        isActive: true,
        createdAt: '2026-08-01T10:00:00.000Z',
      };
    });

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
    return initialUsers;
  } catch (err) {
    console.error('Users read error:', err);
    return [];
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
// 3.B. KULLANICI OLUŞTURMA, DÜZENLEME, SİLME VE TOPLU İŞLEMLER
// -----------------------------------------------------------------------------

export const createUser = (params: {
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string;
  title?: string;
  assignedGroupIds?: string[];
  assignedProgramIds?: string[];
  isActive?: boolean;
  actor: { id: string; role: UserRole; name: string };
  reason: string;
}): { success: boolean; user?: UserProfile; error?: string } => {
  const { fullName, email, role, phone, title, assignedGroupIds, assignedProgramIds, isActive = true, actor, reason } = params;

  if (!fullName.trim() || !email.trim()) {
    return { success: false, error: 'Ad Soyad ve E-posta alanları zorunludur.' };
  }

  if (role === 'superadmin' && actor.role !== 'superadmin') {
    return { success: false, error: 'Süper Yönetici hesabı yalnızca mevcut bir Süper Yönetici tarafından tanımlanabilir.' };
  }

  const users = getStoredUsers();
  const emailExists = users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (emailExists) {
    return { success: false, error: 'Bu e-posta adresi ile kayıtlı bir kullanıcı zaten mevcut.' };
  }

  const newId = `usr-${Date.now()}`;
  const newUser: UserProfile = {
    id: newId,
    name: fullName.trim(),
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone?.trim(),
    role,
    roles: [role],
    title: title?.trim() || (role === 'instructor' ? 'Eğitmen' : role === 'trainee' ? 'Kursiyer' : 'Kullanıcı'),
    assignedGroupIds: assignedGroupIds || [],
    assignedProgramIds: assignedProgramIds || [],
    isActive,
    createdAt: new Date().toISOString(),
    statusReason: reason.trim() || 'Yeni kullanıcı kaydı oluşturuldu.',
  };

  const updatedList = [newUser, ...users];
  saveUsersToStorage(updatedList);

  recordAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    actorName: actor.name,
    action: 'user.created',
    resourceType: 'user',
    resourceId: newId,
    resourceTitle: `${newUser.fullName} (${newUser.role})`,
    reason: reason.trim() || 'Yeni kullanıcı hesabı oluşturuldu.',
    previousStateSummary: 'Hesap mevcut değildi',
    nextStateSummary: `Kullanıcı oluşturuldu (${newUser.role})`,
    sourceModule: 'authorizationDemoService',
    outcome: 'success',
  });

  return { success: true, user: newUser };
};

export const updateUser = (params: {
  targetUserId: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string;
  title?: string;
  assignedGroupIds?: string[];
  assignedProgramIds?: string[];
  isActive?: boolean;
  actor: { id: string; role: UserRole; name: string };
  reason: string;
}): { success: boolean; user?: UserProfile; error?: string } => {
  const { targetUserId, fullName, email, role, phone, title, assignedGroupIds, assignedProgramIds, isActive, actor, reason } = params;

  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === targetUserId);
  if (index === -1) {
    return { success: false, error: 'Kullanıcı bulunamadı.' };
  }

  const existing = users[index];
  if (existing.role === 'superadmin' && actor.role !== 'superadmin') {
    return { success: false, error: 'Süper Yönetici hesabı yalnızca Süper Yönetici tarafından düzenlenebilir.' };
  }
  if (role === 'superadmin' && actor.role !== 'superadmin') {
    return { success: false, error: 'Süper Yönetici rolü yalnızca Süper Yönetici tarafından atanabilir.' };
  }

  const updatedRoles = Array.from(new Set([...(existing.roles || []), role]));

  const updatedUser: UserProfile = {
    ...existing,
    name: fullName.trim() || existing.name,
    fullName: fullName.trim() || existing.fullName,
    email: email.trim().toLowerCase() || existing.email,
    phone: phone !== undefined ? phone.trim() : existing.phone,
    role,
    roles: updatedRoles,
    title: title !== undefined ? title.trim() : existing.title,
    assignedGroupIds: assignedGroupIds !== undefined ? assignedGroupIds : existing.assignedGroupIds,
    assignedProgramIds: assignedProgramIds !== undefined ? assignedProgramIds : existing.assignedProgramIds,
    isActive: isActive !== undefined ? isActive : existing.isActive,
    updatedAt: new Date().toISOString(),
    statusReason: reason.trim() || existing.statusReason,
  };

  users[index] = updatedUser;
  saveUsersToStorage(users);

  recordAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    actorName: actor.name,
    action: 'user.updated',
    resourceType: 'user',
    resourceId: targetUserId,
    resourceTitle: `${updatedUser.fullName} (${updatedUser.role})`,
    reason: reason.trim() || 'Kullanıcı profili ve rolü güncellendi.',
    previousStateSummary: `${existing.fullName} (${existing.role})`,
    nextStateSummary: `${updatedUser.fullName} (${updatedUser.role})`,
    sourceModule: 'authorizationDemoService',
    outcome: 'success',
  });

  return { success: true, user: updatedUser };
};

export const deleteUser = (params: {
  targetUserId: string;
  actor: { id: string; role: UserRole; name: string };
  reason: string;
}): { success: boolean; error?: string } => {
  const { targetUserId, actor, reason } = params;

  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === targetUserId);
  if (index === -1) {
    return { success: false, error: 'Kullanıcı bulunamadı.' };
  }

  const target = users[index];
  if (target.role === 'superadmin') {
    return { success: false, error: 'Süper Yönetici hesabı sistem güvenliği gereği silinemez.' };
  }
  if (target.id === actor.id) {
    return { success: false, error: 'Kendi hesabınızı silemezsiniz.' };
  }

  const updatedList = users.filter((u) => u.id !== targetUserId);
  saveUsersToStorage(updatedList);

  recordAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    actorName: actor.name,
    action: 'user.deleted',
    resourceType: 'user',
    resourceId: targetUserId,
    resourceTitle: `${target.fullName} (${target.role})`,
    reason: reason.trim() || 'Kullanıcı hesabı silindi. (Akademik geçmiş korundu)',
    previousStateSummary: `Aktif kullanıcı: ${target.fullName}`,
    nextStateSummary: 'Kullanıcı silindi',
    sourceModule: 'authorizationDemoService',
    outcome: 'success',
  });

  return { success: true };
};

export const batchUpdateUserStatus = (params: {
  targetUserIds: string[];
  isActive: boolean;
  actor: { id: string; role: UserRole; name: string };
  reason: string;
}): { success: boolean; count: number; error?: string } => {
  const { targetUserIds, isActive, actor, reason } = params;
  if (targetUserIds.length === 0) return { success: true, count: 0 };

  const users = getStoredUsers();
  let updatedCount = 0;

  const updatedUsers = users.map((u) => {
    if (targetUserIds.includes(u.id)) {
      if (u.role === 'superadmin' && actor.role !== 'superadmin') return u;
      updatedCount++;
      return {
        ...u,
        isActive,
        statusReason: reason.trim() || `Toplu durum güncellemesi (${isActive ? 'Aktif' : 'Pasif'})`,
        updatedAt: new Date().toISOString(),
      };
    }
    return u;
  });

  saveUsersToStorage(updatedUsers);

  recordAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    actorName: actor.name,
    action: 'user.bulk_status_updated',
    resourceType: 'user_batch',
    resourceId: `batch-${Date.now()}`,
    resourceTitle: `${updatedCount} Kullanıcı (${isActive ? 'Aktifleştirildi' : 'Askıya Alındı'})`,
    reason: reason.trim() || 'Toplu durum değişikliği uygulandı.',
    previousStateSummary: `${targetUserIds.length} kullanıcı hedeflendi`,
    nextStateSummary: `${updatedCount} kullanıcı güncellendi`,
    sourceModule: 'authorizationDemoService',
    outcome: 'success',
  });

  return { success: true, count: updatedCount };
};

export const batchAssignRole = (params: {
  targetUserIds: string[];
  newRole: UserRole;
  actor: { id: string; role: UserRole; name: string };
  reason: string;
}): { success: boolean; count: number; error?: string } => {
  const { targetUserIds, newRole, actor, reason } = params;
  if (targetUserIds.length === 0) return { success: true, count: 0 };

  if (newRole === 'superadmin' && actor.role !== 'superadmin') {
    return { success: false, count: 0, error: 'Süper Yönetici rolü toplu olarak atanamaz.' };
  }

  const users = getStoredUsers();
  let updatedCount = 0;

  const updatedUsers = users.map((u) => {
    if (targetUserIds.includes(u.id)) {
      if (u.role === 'superadmin' && actor.role !== 'superadmin') return u;
      updatedCount++;
      const updatedRoles = Array.from(new Set([...(u.roles || []), newRole]));
      return {
        ...u,
        role: newRole,
        roles: updatedRoles,
        statusReason: reason.trim() || `Toplu rol ataması: ${newRole}`,
        updatedAt: new Date().toISOString(),
      };
    }
    return u;
  });

  saveUsersToStorage(updatedUsers);

  recordAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    actorName: actor.name,
    action: 'user.bulk_role_assigned',
    resourceType: 'user_batch',
    resourceId: `batch-role-${Date.now()}`,
    resourceTitle: `${updatedCount} Kullanıcıya ${newRole} rolü atandı`,
    reason: reason.trim() || 'Toplu rol güncellemesi.',
    previousStateSummary: `${targetUserIds.length} kullanıcı`,
    nextStateSummary: `${updatedCount} kullanıcıya ${newRole} atandı`,
    sourceModule: 'authorizationDemoService',
    outcome: 'success',
  });

  return { success: true, count: updatedCount };
};

export const batchDeleteUsers = (params: {
  targetUserIds: string[];
  actor: { id: string; role: UserRole; name: string };
  reason: string;
}): { success: boolean; count: number; error?: string } => {
  const { targetUserIds, actor, reason } = params;
  if (targetUserIds.length === 0) return { success: true, count: 0 };

  const users = getStoredUsers();
  const safeToDelete = targetUserIds.filter((id) => {
    const user = users.find((u) => u.id === id);
    if (!user) return false;
    if (user.role === 'superadmin') return false;
    if (user.id === actor.id) return false;
    return true;
  });

  const updatedUsers = users.filter((u) => !safeToDelete.includes(u.id));
  saveUsersToStorage(updatedUsers);

  recordAuditLog({
    actorId: actor.id,
    actorRole: actor.role,
    actorName: actor.name,
    action: 'user.bulk_deleted',
    resourceType: 'user_batch',
    resourceId: `batch-delete-${Date.now()}`,
    resourceTitle: `${safeToDelete.length} Kullanıcı Silindi`,
    reason: reason.trim() || 'Toplu kullanıcı silme işlemi.',
    previousStateSummary: `${users.length} toplam kullanıcı`,
    nextStateSummary: `${updatedUsers.length} kalan kullanıcı`,
    sourceModule: 'authorizationDemoService',
    outcome: 'success',
  });

  return { success: true, count: safeToDelete.length };
};

export const batchSetPermissionsForRole = (params: {
  role: UserRole;
  permissionKeys: PermissionKey[];
  newScope: PermissionScope;
  actor: { id: string; role: UserRole; name: string };
  reason: string;
}): { success: boolean; version: number; error?: string } => {
  const { role, permissionKeys, newScope, actor, reason } = params;

  if (role === 'superadmin') {
    return { success: false, version: getMatrixVersion(), error: 'Sistem Yöneticisi rol yetkileri değiştirilemez.' };
  }

  const matrix = getStoredRolePermissionMatrix();
  const rolePerms = { ...(matrix[role] || {}) };

  permissionKeys.forEach((key) => {
    rolePerms[key] = newScope;
  });

  const updatedMatrix: RolePermissionMatrix = {
    ...matrix,
    [role]: rolePerms,
  };

  return saveRolePermissionMatrix({
    newMatrix: updatedMatrix,
    actor,
    reason: reason.trim() || `${role} rolü için toplu ${permissionKeys.length} yetki ${newScope} yapıldı.`,
  });
};

export const resetRolePermissionsToDefault = (params: {
  role: UserRole;
  actor: { id: string; role: UserRole; name: string };
  reason: string;
}): { success: boolean; version: number; error?: string } => {
  const { role, actor, reason } = params;

  const matrix = getStoredRolePermissionMatrix();
  const updatedMatrix: RolePermissionMatrix = {
    ...matrix,
    [role]: { ...DEFAULT_ROLE_PERMISSIONS[role] },
  };

  return saveRolePermissionMatrix({
    newMatrix: updatedMatrix,
    actor,
    reason: reason.trim() || `${role} rolü fabrika varsayılan yetkilerine döndürüldü.`,
  });
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

export const getUserDisplayName = (userId: string): string => {
  const users = getStoredUsers();
  const u = users.find((x) => x.id === userId || x.email === userId);
  if (u) return u.fullName || u.name || userId;

  if (userId === 'usr-admin-hakan' || userId === 'user-admin-01' || userId === 'admin@islahiye.bel.tr') return 'Hakan Yılmaz';
  if (userId === 'usr-superadmin-zeynep' || userId === 'superadmin.zeynep@islahiye.bel.tr') return 'Zeynep Kaya';
  if (userId === 'usr-yonetici-selin' || userId === 'yonetici.selin@islahiye.bel.tr') return 'Selin Aydın';
  if (userId === 'usr-yonetici-serkan' || userId === 'yonetici.serkan@islahiye.bel.tr') return 'Serkan Korkmaz';
  if (userId === 'usr-yonetici-burcu' || userId === 'yonetici.burcu@islahiye.bel.tr') return 'Burcu Yıldız';
  if (userId === 'usr-instructor' || userId === 'user-instructor-01' || userId === 'egitmen.mehmet@islahiye.bel.tr') return 'Şef Mehmet Yılmaz';
  if (userId === 'usr-egitmen-murat' || userId === 'user-instructor-02' || userId === 'egitmen.murat@islahiye.bel.tr') return 'Murat Özkan';
  if (userId === 'usr-egitmen-kemal' || userId === 'user-instructor-03' || userId === 'egitmen.kemal@islahiye.bel.tr') return 'Kemal Aksoy';
  if (userId === 'usr-trainee' || userId === 'user-trainee-01' || userId === 'kursiyer.ahmet@islahiye.bel.tr') return 'Ahmet Kaya';
  if (userId === 'usr-kursiyer-fatma' || userId === 'kursiyer.fatma@islahiye.bel.tr') return 'Fatma Şahin';
  if (userId === 'usr-real-12') return 'Caner Yıldız';
  if (userId === 'usr-real-13') return 'Merve Çetin';
  if (userId === 'usr-real-17') return 'Ayşe Demir';
  if (userId === 'usr-real-20') return 'Zeynep Polat';
  if (userId === 'usr-real-21') return 'Mehmet Can';
  if (userId === 'usr-superadmin') return 'Sistem Yöneticisi';
  if (userId.includes('admin')) return 'Yönetici';
  if (userId.includes('instructor')) return 'Eğitmen';
  if (userId.includes('trainee')) return 'Kursiyer';
  return userId;
};
