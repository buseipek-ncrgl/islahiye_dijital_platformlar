import React, { createContext, useContext, useState, useMemo } from 'react';
import { AdminRole, AdminRoleProfile } from '../types/admin';

export const ADMIN_ROLE_PROFILES: AdminRoleProfile[] = [
  {
    id: 'admin',
    name: 'Oda Yöneticisi / Baş Editör',
    description: 'Tam yetkili yayın ve envanter yöneticisi. Tüm modülleri yönetebilir, içerik silebilir, yayınlayabilir ve sistem ayarlarını değiştirebilir.',
    permissions: [
      'Tüm içerikleri oluşturma, düzenleme ve silme',
      'Yayın durumu değiştirme (Taslak -> Yayında -> Arşiv)',
      'TÜRKPATENT doğrulama statüsü atama',
      'Ana sayfa editoryal vitrin sırasını belirleme',
      'Sistem veri tohumlarını sıfırlama',
    ],
  },
  {
    id: 'publisher',
    name: 'Yayın & Doğrulama Sorumlusu',
    description: 'İçerik onaylama, TÜRKPATENT kontrolü ve ana sayfa vitrini yönetimi. Sistem sıfırlama hariç tam operasyonel yetki.',
    permissions: [
      'İçerik onaylama ve yayına alma',
      'TÜRKPATENT doğrulama belgesi denetimi',
      'Ana sayfa vitrin bloklarını düzenleme',
      'Kayıtları inceleme, düzenleme ve onaylama',
    ],
  },
  {
    id: 'editor',
    name: 'İçerik Uzmanı & Saha Araştırmacısı',
    description: 'Yemek, tarif, hikâye taslağı oluşturma ve düzenleme. Kayıt silebilir veya doğrudan yayınlayamaz (onaya gönderir).',
    permissions: [
      'Yeni yemek, tarif ve kültürel hikâye taslağı ekleme',
      'Taslak içerikleri düzenleme ve onaya gönderme',
      'Lezzet haritasına ziyaret noktası önerme',
      'Saha ses ve görüntü kaydı yükleme',
    ],
  },
  {
    id: 'viewer',
    name: 'İncelemeci / Kurumsal Gözlemci',
    description: 'Yalnızca okuma ve inceleme yetkisi. Yeni kayıt ekleyemez, düzenleyemez, silemez veya yayınlayamaz.',
    permissions: [
      'Tüm içerik envanterini görüntüleme',
      'Yayın durumu ve doğrulama metriklerini inceleme',
      'Rapor ve istatistikleri görüntüleme',
    ],
  },
];

interface AdminRoleContextType {
  currentRole: AdminRole;
  roleProfile: AdminRoleProfile;
  setRole: (role: AdminRole) => void;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
  canManageSettings: boolean;
  rolesList: AdminRoleProfile[];
}

const AdminRoleContext = createContext<AdminRoleContextType | undefined>(undefined);

const STORAGE_KEY = 'islahiye_gastronomy_admin_role';

export const AdminRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRoleState] = useState<AdminRole>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AdminRole | null;
      if (saved && ['admin', 'publisher', 'editor', 'viewer'].includes(saved)) {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'admin';
  });

  const setRole = (role: AdminRole) => {
    setCurrentRoleState(role);
    try {
      localStorage.setItem(STORAGE_KEY, role);
    } catch {
      // ignore
    }
  };

  const roleProfile = useMemo(() => {
    return ADMIN_ROLE_PROFILES.find((p) => p.id === currentRole) || ADMIN_ROLE_PROFILES[0];
  }, [currentRole]);

  const canCreate = currentRole === 'admin' || currentRole === 'publisher' || currentRole === 'editor';
  const canEdit = currentRole === 'admin' || currentRole === 'publisher' || currentRole === 'editor';
  const canDelete = currentRole === 'admin' || currentRole === 'publisher';
  const canPublish = currentRole === 'admin' || currentRole === 'publisher';
  const canManageSettings = currentRole === 'admin';

  return (
    <AdminRoleContext.Provider
      value={{
        currentRole,
        roleProfile,
        setRole,
        canCreate,
        canEdit,
        canDelete,
        canPublish,
        canManageSettings,
        rolesList: ADMIN_ROLE_PROFILES,
      }}
    >
      {children}
    </AdminRoleContext.Provider>
  );
};

export const useAdminRole = (): AdminRoleContextType => {
  const context = useContext(AdminRoleContext);
  if (!context) {
    throw new Error('useAdminRole must be used within an AdminRoleProvider');
  }
  return context;
};
