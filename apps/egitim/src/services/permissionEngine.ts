/**
 * Granüler Yetki ve İzin Değerlendirme Motoru (Sprint E05-A)
 * İslahiye Ticaret Odası Eğitim Portalı
 *
 * Temel İlkeler:
 * 1. Deny by default: Açıkça tanımlanmamış yetki reddedilir.
 * 2. Kapsam Denetimi: Rol ismi tek başına yetmez; program ve grup kapsamı gözetilir.
 * 3. Pasif Kullanıcı Koruması: Pasif durumdaki kullanıcı işlem yapamaz.
 * 4. Çoklu Rol Desteği: Kullanıcının atanmış rolleri üzerinden izinler birleştirilir.
 */

import {
  UserProfile,
  UserRole,
  PermissionKey,
  PermissionScope,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_DEFINITIONS,
} from '../types';
import { getStoredRolePermissionMatrix } from './authorizationDemoService';

export interface PermissionEvaluationContext {
  programId?: string;
  groupId?: string;
  targetUserId?: string;
  candidateId?: string;
}

export interface PermissionCheckResult {
  isAllowed: boolean;
  permissionKey: PermissionKey;
  scope: PermissionScope;
  reason?: string;
}

/**
 * Kullanıcının belirtilen işlem için yetkisi olup olmadığını denetler.
 */
export const checkPermission = (
  user: UserProfile | undefined | null,
  permissionKey: PermissionKey,
  context?: PermissionEvaluationContext
): PermissionCheckResult => {
  // 1. Kullanıcı doğrulaması
  if (!user) {
    return {
      isAllowed: false,
      permissionKey,
      scope: 'none',
      reason: 'Oturum açmış kullanıcı bulunamadı.',
    };
  }

  // 2. Pasif kullanıcı kontrolü (Pasif hesaplar işlem yapamaz)
  if (user.isActive === false) {
    return {
      isAllowed: false,
      permissionKey,
      scope: 'none',
      reason: `Kullanıcı hesabı pasife alınmıştır: ${user.statusReason || 'Yetkili tarafından donduruldu'}.`,
    };
  }

  // 3. İzin tanımı kontrolü
  const definition = PERMISSION_DEFINITIONS[permissionKey];
  if (!definition) {
    return {
      isAllowed: false,
      permissionKey,
      scope: 'none',
      reason: 'Bilinmeyen veya tanımsız izin anahtarı.',
    };
  }

  // 4. Süper yönetici tam yetki istisnası
  const effectiveRoles: UserRole[] = user.roles && user.roles.length > 0
    ? user.roles
    : [user.role];

  if (effectiveRoles.includes('superadmin')) {
    return {
      isAllowed: true,
      permissionKey,
      scope: 'global',
    };
  }

  // Standart yönetici için süper yöneticiye özel kritik işlemler kısıtlıdır
  if (definition.isCritical && !effectiveRoles.includes('superadmin')) {
    // Sadece superadmin'e açık kritik izinler:
    if (
      permissionKey === 'permissions.manage' ||
      permissionKey === 'settings.manage' ||
      permissionKey === 'roles.manage'
    ) {
      return {
        isAllowed: false,
        permissionKey,
        scope: 'none',
        reason: 'Bu işlem yalnızca Süper Yönetici tarafından gerçekleştirilebilir.',
      };
    }
  }

  // 5. Dinamik veya varsayılan izin matrisinden rollerin yetkilerini tara
  const matrix = getStoredRolePermissionMatrix();
  let bestScope: PermissionScope = 'none';

  for (const r of effectiveRoles) {
    const roleRules = matrix[r] || DEFAULT_ROLE_PERMISSIONS[r];
    if (roleRules && roleRules[permissionKey]) {
      const scope = roleRules[permissionKey];
      if (scope === 'global') {
        bestScope = 'global';
        break; // En geniş kapsam bulundu
      } else if (scope === 'program') {
        bestScope = 'program';
      } else if (scope === 'group') {
        if (bestScope !== 'program') {
          bestScope = 'group';
        }
      } else if (scope === 'self') {
        if (bestScope === 'none') {
          bestScope = 'self';
        }
      }
    }
  }

  // Deny by default: Hiçbir rol bu izni vermemişse reddet
  if (bestScope === 'none') {
    return {
      isAllowed: false,
      permissionKey,
      scope: 'none',
      reason: `"${user.role}" rolünün bu işlem (${definition.label}) için yetkisi bulunmamaktadır.`,
    };
  }

  // 6. Kapsam (Scope) Kontrolleri
  if (bestScope === 'global') {
    return { isAllowed: true, permissionKey, scope: 'global' };
  }

  if (bestScope === 'program') {
    if (!context?.programId) {
      // Genel liste görünümleri için izin verilir, belirli işlem için program eşleşmesi aranır
      return { isAllowed: true, permissionKey, scope: 'program' };
    }
    const isAssigned = user.assignedProgramIds?.includes(context.programId);
    if (isAssigned || effectiveRoles.includes('admin')) {
      return { isAllowed: true, permissionKey, scope: 'program' };
    }
    return {
      isAllowed: false,
      permissionKey,
      scope: 'program',
      reason: 'Bu eğitim programı için atanmış yetkiniz bulunmamaktadır.',
    };
  }

  if (bestScope === 'group') {
    if (!context?.groupId) {
      return { isAllowed: true, permissionKey, scope: 'group' };
    }
    const isAssigned = user.assignedGroupIds?.includes(context.groupId);
    if (isAssigned || effectiveRoles.includes('admin')) {
      return { isAllowed: true, permissionKey, scope: 'group' };
    }
    return {
      isAllowed: false,
      permissionKey,
      scope: 'group',
      reason: 'Bu eğitim grubu için atanmış yetkiniz bulunmamaktadır (Eğitmen grup dışı işlem yapamaz).',
    };
  }

  if (bestScope === 'self') {
    const target = context?.targetUserId || context?.candidateId;
    if (!target || target === user.id) {
      return { isAllowed: true, permissionKey, scope: 'self' };
    }
    return {
      isAllowed: false,
      permissionKey,
      scope: 'self',
      reason: 'Kullanıcılar yalnızca kendi kayıt ve belgelerine erişebilir.',
    };
  }

  return { isAllowed: false, permissionKey, scope: 'none', reason: 'Yetki reddedildi.' };
};

/**
 * Hızlı boolean yetki sorgulayıcı
 */
export const hasPermission = (
  user: UserProfile | undefined | null,
  permissionKey: PermissionKey,
  context?: PermissionEvaluationContext
): boolean => {
  return checkPermission(user, permissionKey, context).isAllowed;
};

/**
 * Eğitmenin belirtilen grupta yoklama veya işlem yetkisi var mı?
 */
export const canInstructorOperateGroup = (
  user: UserProfile | undefined | null,
  groupId: string
): boolean => {
  return hasPermission(user, 'attendance.mark', { groupId });
};
