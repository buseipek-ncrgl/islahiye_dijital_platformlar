import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  UserCheck,
  UserX,
  Search,
  CheckCircle,
  AlertTriangle,
  Layers,
  Trash2,
  Edit2,
  X,
  ShieldCheck,
  Users,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import {
  getStoredUsers,
  createUser,
  updateUser,
  deleteUser,
  setUserActiveStatus,
  batchUpdateUserStatus,
  batchAssignRole,
  batchDeleteUsers,
  subscribeToUserUpdates,
} from '../services/authorizationDemoService';
import { UserProfile, UserRole } from '../types';
import { KpiStrip } from '../components/ui/KpiStrip';

const ROLE_OPTIONS: { id: UserRole; label: string; desc: string }[] = [
  { id: 'superadmin', label: 'Sistem Yöneticisi', desc: 'Tam sistem ve güvenlik yetkisi' },
  { id: 'admin', label: 'Yönetici', desc: 'Akademik ve operasyonel idari yetkiler' },
  { id: 'instructor', label: 'Eğitmen', desc: 'Yoklama, ders ve ödev değerlendirme' },
  { id: 'trainee', label: 'Kursiyer', desc: 'Ders, takvim, ödev ve belge erişimi' },
  { id: 'applicant', label: 'Aday', desc: 'Başvuru takibi ve katalog inceleme' },
  { id: 'visitor', label: 'Ziyaretçi', desc: 'Kamusal tanıtım ve katalog erişimi' },
];

export const UserManagementPage: React.FC = () => {
  const { currentRole, currentUser } = useDemoRole();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected User IDs for Bulk Actions
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTargetUser, setEditTargetUser] = useState<UserProfile | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserProfile | null>(null);
  const [bulkRoleModalOpen, setBulkRoleModalOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  // Form Fields for Create / Edit
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('trainee');
  const [formTitle, setFormTitle] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formReason, setFormReason] = useState('');

  // Bulk Form Fields
  const [bulkNewRole, setBulkNewRole] = useState<UserRole>('trainee');
  const [bulkReason, setBulkReason] = useState('');

  // Feedback Messages
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

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.title && u.title.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole =
        roleFilter === 'all' ||
        u.role === roleFilter ||
        (u.roles && u.roles.includes(roleFilter as UserRole));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.isActive !== false) ||
        (statusFilter === 'inactive' && u.isActive === false);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Macro Statistics
  const macroStats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isActive !== false).length;
    const inactive = users.filter((u) => u.isActive === false).length;
    const admins = users.filter((u) => u.role === 'admin' || u.role === 'superadmin').length;
    const instructors = users.filter((u) => u.role === 'instructor').length;
    return { total, active, inactive, admins, instructors };
  }, [users]);

  // Multi-Select Handlers
  const handleToggleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormFullName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('trainee');
    setFormTitle('Kursiyer');
    setFormIsActive(true);
    setFormReason('Yeni kullanıcı hesap tanımlaması');
    setErrorMessage('');
    setShowCreateModal(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const res = createUser({
      fullName: formFullName,
      email: formEmail,
      phone: formPhone,
      role: formRole,
      title: formTitle,
      isActive: formIsActive,
      actor: { id: currentUser.id, role: currentRole, name: currentUser.fullName },
      reason: formReason.trim() || 'Yeni kullanıcı hesabı oluşturuldu.',
    });

    if (res.success) {
      setSuccessMessage(`"${res.user?.fullName}" kullanıcısı başarıyla oluşturuldu.`);
      setShowCreateModal(false);
      loadUsers();
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      setErrorMessage(res.error || 'Kullanıcı oluşturulamadı.');
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (u: UserProfile) => {
    setEditTargetUser(u);
    setFormFullName(u.fullName || u.name || '');
    setFormEmail(u.email || '');
    setFormPhone(u.phone || '');
    setFormRole(u.role);
    setFormTitle(u.title || '');
    setFormIsActive(u.isActive !== false);
    setFormReason('');
    setErrorMessage('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTargetUser) return;
    setErrorMessage('');

    const res = updateUser({
      targetUserId: editTargetUser.id,
      fullName: formFullName,
      email: formEmail,
      phone: formPhone,
      role: formRole,
      title: formTitle,
      isActive: formIsActive,
      actor: { id: currentUser.id, role: currentRole, name: currentUser.fullName },
      reason: formReason.trim() || 'Kullanıcı bilgileri güncellendi.',
    });

    if (res.success) {
      setSuccessMessage(`"${res.user?.fullName}" profili başarıyla güncellendi.`);
      setEditTargetUser(null);
      loadUsers();
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      setErrorMessage(res.error || 'Güncelleme başarısız oldu.');
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (u: UserProfile) => {
    setDeleteTargetUser(u);
    setFormReason('');
    setErrorMessage('');
  };

  const handleDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTargetUser) return;

    const res = deleteUser({
      targetUserId: deleteTargetUser.id,
      actor: { id: currentUser.id, role: currentRole, name: currentUser.fullName },
      reason: formReason.trim() || 'Kullanıcı hesabı silindi.',
    });

    if (res.success) {
      setSuccessMessage(`"${deleteTargetUser.fullName}" kullanıcısı silindi (Geçmiş akademik kayıtlar kütükte korundu).`);
      setDeleteTargetUser(null);
      loadUsers();
      setSelectedUserIds((prev) => prev.filter((id) => id !== deleteTargetUser.id));
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      setErrorMessage(res.error || 'Silme işlemi gerçekleştirilemedi.');
    }
  };

  // Quick Status Toggle
  const handleToggleStatus = (u: UserProfile) => {
    const newStatus = !(u.isActive !== false);
    const res = setUserActiveStatus({
      targetUserId: u.id,
      isActive: newStatus,
      statusReason: newStatus ? 'Hesap tekrar aktifleştirildi' : 'Yönetim kararıyla askıya alındı',
      actor: { id: currentUser.id, role: currentRole, name: currentUser.fullName },
    });

    if (res.success) {
      setSuccessMessage(`"${u.fullName}" hesabı ${newStatus ? 'aktifleştirildi' : 'askıya alındı'}.`);
      loadUsers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      setErrorMessage(res.error || 'Durum değiştirilemedi.');
    }
  };

  // Bulk Actions
  const handleBulkStatusChange = (isActive: boolean) => {
    const res = batchUpdateUserStatus({
      targetUserIds: selectedUserIds,
      isActive,
      actor: { id: currentUser.id, role: currentRole, name: currentUser.fullName },
      reason: isActive ? 'Toplu aktifleştirme' : 'Toplu askıya alma',
    });

    if (res.success) {
      setSuccessMessage(`${res.count} kullanıcı başarıyla ${isActive ? 'aktifleştirildi' : 'askıya alındı'}.`);
      loadUsers();
      setSelectedUserIds([]);
      setTimeout(() => setSuccessMessage(''), 3500);
    }
  };

  const handleBulkAssignRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = batchAssignRole({
      targetUserIds: selectedUserIds,
      newRole: bulkNewRole,
      actor: { id: currentUser.id, role: currentRole, name: currentUser.fullName },
      reason: bulkReason.trim() || `Toplu ${bulkNewRole} rolü tanımlandı.`,
    });

    if (res.success) {
      setSuccessMessage(`${res.count} kullanıcıya "${bulkNewRole}" rolü atandı.`);
      setBulkRoleModalOpen(false);
      loadUsers();
      setSelectedUserIds([]);
      setTimeout(() => setSuccessMessage(''), 3500);
    } else {
      setErrorMessage(res.error || 'Toplu rol ataması başarısız.');
    }
  };

  const handleBulkDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = batchDeleteUsers({
      targetUserIds: selectedUserIds,
      actor: { id: currentUser.id, role: currentRole, name: currentUser.fullName },
      reason: bulkReason.trim() || 'Toplu kullanıcı silme işlemi.',
    });

    if (res.success) {
      setSuccessMessage(`${res.count} kullanıcı başarıyla silindi.`);
      setBulkDeleteModalOpen(false);
      loadUsers();
      setSelectedUserIds([]);
      setTimeout(() => setSuccessMessage(''), 3500);
    } else {
      setErrorMessage(res.error || 'Toplu silme başarısız.');
    }
  };

  // Helper badge color
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-900 text-white">
            Sistem Yöneticisi
          </span>
        );
      case 'admin':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
            Yönetici
          </span>
        );
      case 'instructor':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            Eğitmen
          </span>
        );
      case 'trainee':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
            Kursiyer
          </span>
        );
      case 'applicant':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
            Aday
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200/80">
            Ziyaretçi
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-20">
      
      {/* 1. ÜST BAŞLIK & YENİ KULLANICI EKLEME BUTONU */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Kullanıcı ve Rol Yönetim Masası
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Sistem kullanıcıları, kurumsal rol atamaları, hesap aktiflik durumları ve toplu yetkilendirme konsolu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="h-9 px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>Yeni Kullanıcı Tanımla</span>
          </button>
        </div>
      </div>

      {/* Geri Bildirim Mesajları */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage('')} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage('')} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. REFERANS AUTH0 / OKTA STANDARDI: 4 Telemetri KPI Bandı */}
      <KpiStrip
        items={[
          {
            label: 'Toplam Hesap',
            value: `${macroStats.total} Kullanıcı`,
            icon: <Users className="w-4 h-4" />,
            subtext: 'Sistemde kayıtlı kimlikler',
          },
          {
            label: 'Aktif Kullanıcı',
            value: `${macroStats.active} Hesap`,
            icon: <UserCheck className="w-4 h-4" />,
            subtext: 'Giriş yapabilir durumda',
          },
          {
            label: 'Askıya Alınan / Pasif',
            value: `${macroStats.inactive} Hesap`,
            icon: <UserX className="w-4 h-4" />,
            subtext: 'Erişimi durdurulmuş',
            badge: macroStats.inactive > 0 ? (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-800 border border-rose-200">
                Pasif
              </span>
            ) : undefined,
          },
          {
            label: 'İdari & Yetkili Roller',
            value: `${macroStats.admins + macroStats.instructors} Görevli`,
            icon: <ShieldCheck className="w-4 h-4" />,
            subtext: `${macroStats.admins} Yönetici, ${macroStats.instructors} Eğitmen`,
          },
        ]}
      />

      {/* 3. ARAMA, FİLTRE VE ÇOKLU SEÇİM İŞLEM ŞERİDİ */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Sol Alan: Arama & Filtreler */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="İsim, e-posta, unvan ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">Tüm Roller</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Yalnızca Aktifler</option>
                <option value="inactive">Yalnızca Pasifler</option>
              </select>
            </div>

            {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Temizle</span>
              </button>
            )}
          </div>

          {/* Sağ Alan: Toplu Seçim Bilgisi */}
          <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            <span className="text-xs text-slate-500">
              Gösterilen: <strong>{filteredUsers.length}</strong> / {users.length} Kullanıcı
            </span>
          </div>

        </div>

        {/* TOPLU İŞLEM YÜZEN ŞERİDİ (BULK ACTION RIBBON) */}
        {selectedUserIds.length > 0 && (
          <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs text-blue-950 font-bold">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">
                {selectedUserIds.length}
              </span>
              <span>Kullanıcı Seçildi: Toplu İşlem Uygula</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setBulkRoleModalOpen(true)}
                className="h-8 px-3 rounded-lg bg-white border border-blue-300 text-blue-800 hover:bg-blue-100 text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Toplu Rol Değiştir</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkStatusChange(true)}
                className="h-8 px-3 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Toplu Aktif Yap</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkStatusChange(false)}
                className="h-8 px-3 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
              >
                <UserX className="w-3.5 h-3.5 text-amber-600" />
                <span>Toplu Askıya Al</span>
              </button>

              <button
                type="button"
                onClick={() => setBulkDeleteModalOpen(true)}
                className="h-8 px-3 rounded-lg bg-white border border-rose-300 text-rose-800 hover:bg-rose-50 text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Toplu Sil</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedUserIds([])}
                className="h-8 px-2.5 rounded-lg text-slate-500 hover:text-slate-800 text-xs font-medium transition cursor-pointer"
              >
                Vazgeç
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. KULLANICI LİSTESİ TABLOSU */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-sm text-slate-700">Filtrelere uygun kullanıcı bulunamadı.</p>
            <p className="text-xs text-slate-400">Arama terimini değiştiriniz veya yeni kullanıcı ekleyiniz.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[580px] overflow-y-auto relative">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-2xs text-slate-700 font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-10 bg-slate-50">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Tümünü Seç / Kaldır"
                    >
                      {selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4 bg-slate-50">Kullanıcı Bilgisi</th>
                  <th className="py-3 px-3 bg-slate-50">E-Posta & İletişim</th>
                  <th className="py-3 px-3 bg-slate-50">Ana Rol</th>
                  <th className="py-3 px-3 bg-slate-50">Durum</th>
                  <th className="py-3 px-4 text-right bg-slate-50">Yönetim Aksiyonları</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u.id);
                  const isUserActive = u.isActive !== false;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOne(u.id)}
                          className="cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                          )}
                        </button>
                      </td>

                      {/* Kullanıcı Adı ve Unvan */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            u.role === 'superadmin'
                              ? 'bg-slate-900 text-white'
                              : u.role === 'admin'
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : u.role === 'instructor'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {(u.fullName || u.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <span>{u.fullName || u.name}</span>
                              {u.id === currentUser.id && (
                                <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded font-medium">
                                  Siz
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">{u.title || 'Kurumsal Kullanıcı'}</div>
                          </div>
                        </div>
                      </td>

                      {/* E-Posta */}
                      <td className="py-3.5 px-3">
                        <div className="text-slate-800 font-medium font-mono text-[11px]">{u.email || '—'}</div>
                        {u.phone && (
                          <div className="text-[10px] text-slate-400 mt-0.5">{u.phone}</div>
                        )}
                      </td>

                      {/* Rol */}
                      <td className="py-3.5 px-3">
                        {getRoleBadge(u.role)}
                      </td>

                      {/* Durum */}
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                            isUserActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                          }`}
                          title="Durumu değiştirmek için tıklayınız"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isUserActive ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                          <span>{isUserActive ? 'Aktif' : 'Askıya Alındı'}</span>
                        </button>
                      </td>

                      {/* Eylemler */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Kullanıcıyı Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(u)}
                            disabled={u.role === 'superadmin' || u.id === currentUser.id}
                            className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={u.role === 'superadmin' ? 'Süper Yönetici silinemez' : 'Kullanıcıyı Sil'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 5. MODALLAR (YENİ EKLE, DÜZENLE, SİL, TOPLU İŞLEMLER)                  */}
      {/* ===================================================================== */}

      {/* A. YENİ KULLANICI EKLEME MODALI */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-brand-navy text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Yeni Kullanıcı Tanımla</h3>
                <p className="text-xs text-slate-300 mt-0.5">İslahiye Ticaret Odası Kurumsal Kimlik Kaydı</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ad Soyad *</label>
                <input
                  type="text"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Örn: Dr. Emre Demir"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">E-Posta Adresi *</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="emre.demir@islahiyeto.org.tr"
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefon Numarası</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0532 123 45 67"
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rol Tanımı *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-800"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.id} value={r.id} disabled={r.id === 'superadmin' && !isSuperAdmin}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kurumsal Unvan / Görev</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Örn: E-Ticaret Eğitmeni"
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="createActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="createActive" className="text-slate-700 font-medium">
                  Hesap oluşturulduğunda hemen aktif olsun
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Denetim Gerekçesi (Audit Log) *</label>
                <input
                  type="text"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Örn: 2026 Dönemi yeni eğitmen görevlendirmesi"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition font-semibold shadow-xs cursor-pointer"
                >
                  Kullanıcıyı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. KULLANICI DÜZENLEME MODALI */}
      {editTargetUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-brand-navy text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Kullanıcı Bilgilerini Düzenle</h3>
                <p className="text-xs text-slate-300 mt-0.5">{editTargetUser.fullName} ({editTargetUser.id})</p>
              </div>
              <button
                type="button"
                onClick={() => setEditTargetUser(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ad Soyad *</label>
                <input
                  type="text"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">E-Posta Adresi *</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rol *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-800"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.id} value={r.id} disabled={r.id === 'superadmin' && !isSuperAdmin}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unvan</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="editActive" className="text-slate-700 font-medium">
                  Hesap aktif (Giriş yapılabilir)
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Güncelleme Gerekçesi (Audit Log) *</label>
                <input
                  type="text"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Örn: Görev değişikliği ve e-posta güncellemesi"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditTargetUser(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition font-semibold shadow-xs cursor-pointer"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. KULLANICI SİLME ONAY MODALI */}
      {deleteTargetUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-rose-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Kullanıcıyı Sil</h3>
                <p className="text-xs text-rose-200 mt-0.5">{deleteTargetUser.fullName}</p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTargetUser(null)}
                className="text-rose-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeleteSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
                <span className="font-bold block">Dikkat: Kullanıcı Hesabı Kaldırılacak</span>
                <p className="text-[11px] leading-relaxed">
                  Bu kullanıcının sistem giriş yetkisi kaldırılacaktır. Mevzuat gereği adayın veya kursiyerin geçmişe ait başvuru, ödev, devam ve tescilli belge kayıtları kütükte saklanmaya devam eder.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Silme Gerekçesi (Zorunlu) *</label>
                <input
                  type="text"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Örn: Kurumdan ayrılma veya mükerrer hesap talebi"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTargetUser(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition font-semibold shadow-xs cursor-pointer"
                >
                  Kullanıcıyı Sil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* D. TOPLU ROL DEĞİŞTİRME MODALI */}
      {bulkRoleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-brand-navy text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Toplu Rol Değiştir</h3>
                <p className="text-xs text-slate-300 mt-0.5">{selectedUserIds.length} kullanıcı seçildi</p>
              </div>
              <button
                type="button"
                onClick={() => setBulkRoleModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkAssignRoleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Yeni Atanacak Rol *</label>
                <select
                  value={bulkNewRole}
                  onChange={(e) => setBulkNewRole(e.target.value as UserRole)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-800"
                >
                  {ROLE_OPTIONS.filter((r) => r.id !== 'superadmin').map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Toplu İşlem Gerekçesi *</label>
                <input
                  type="text"
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  placeholder="Örn: Yeni dönem kursiyer toplu yetkilendirmesi"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBulkRoleModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition font-semibold shadow-xs cursor-pointer"
                >
                  Rolleri Uygula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* E. TOPLU SİLME ONAY MODALI */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-rose-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Toplu Kullanıcı Sil</h3>
                <p className="text-xs text-rose-200 mt-0.5">{selectedUserIds.length} kullanıcı silinecek</p>
              </div>
              <button
                type="button"
                onClick={() => setBulkDeleteModalOpen(false)}
                className="text-rose-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkDeleteSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
                <span className="font-bold block">Toplu Silme Uyarısı</span>
                <p className="text-[11px] leading-relaxed">
                  Seçilen {selectedUserIds.length} kullanıcının hesapları silinecektir (Süper yöneticiler ve kendi hesabınız korunur).
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Toplu Silme Gerekçesi *</label>
                <input
                  type="text"
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  placeholder="Örn: Eski dönem demo hesaplarının temizlenmesi"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBulkDeleteModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition font-semibold shadow-xs cursor-pointer"
                >
                  Tümünü Sil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagementPage;
