import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  X,
  AlertCircle,
} from 'lucide-react';
import { CategoryDefinition, CategoryScope } from '../../types';
import { CATEGORY_SCOPE_META, CATEGORY_SCOPE_MAP } from '../../data/categories';
import { useContent } from '../../hooks/useContent';
import { useAdminRole } from '../../context/AdminRoleContext';
import {
  FormNotificationToast,
  FormNotification,
} from '../../components/admin/common/FormNotificationToast';

export const CategoryManagementPage: React.FC = () => {
  const {
    getCategories,
    getCategoryUsageCount,
    saveCategory,
    deleteCategory,
  } = useContent();
  const { canCreate, canEdit, canDelete } = useAdminRole();

  const [selectedScope, setSelectedScope] = useState<CategoryScope | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<FormNotification | null>(null);

  // Edit / Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDefinition | null>(null);
  const [formScope, setFormScope] = useState<CategoryScope>('dish');
  const [formId, setFormId] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formShortLabel, setFormShortLabel] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    category: CategoryDefinition;
    usageCount: number;
  } | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const allCategories = getCategories();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalOpen(false);
        setDeleteTarget(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLocaleLowerCase('tr-TR').trim();
    return allCategories.filter((cat) => {
      if (selectedScope !== 'all' && cat.scope !== selectedScope) return false;
      if (q) {
        const scopeLabel = CATEGORY_SCOPE_MAP[cat.scope]?.label.toLocaleLowerCase('tr-TR') || '';
        const matches =
          cat.label.toLocaleLowerCase('tr-TR').includes(q) ||
          (cat.shortLabel || '').toLocaleLowerCase('tr-TR').includes(q) ||
          cat.id.toLocaleLowerCase('tr-TR').includes(q) ||
          scopeLabel.includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [allCategories, selectedScope, searchQuery]);

  const scopeCounts = useMemo(() => {
    const map: Record<string, number> = { all: allCategories.length };
    CATEGORY_SCOPE_META.forEach((m) => {
      map[m.scope] = allCategories.filter((c) => c.scope === m.scope).length;
    });
    return map;
  }, [allCategories]);

  const activeCount = useMemo(
    () => allCategories.filter((c) => c.isActive).length,
    [allCategories]
  );

  const openCreateModal = () => {
    if (!canCreate) return;
    const defaultScope: CategoryScope = selectedScope === 'all' ? 'dish' : selectedScope;
    const scopeList = getCategories(defaultScope, false);
    setEditingCategory(null);
    setFormScope(defaultScope);
    setFormId('');
    setFormLabel('');
    setFormShortLabel('');
    setFormDescription('');
    setFormOrder(scopeList.length + 1);
    setFormIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (cat: CategoryDefinition) => {
    if (!canEdit) return;
    setEditingCategory(cat);
    setFormScope(cat.scope);
    setFormId(cat.id);
    setFormLabel(cat.label);
    setFormShortLabel(cat.shortLabel || '');
    setFormDescription(cat.description || '');
    setFormOrder(cat.order);
    setFormIsActive(cat.isActive);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const res = saveCategory({
      id: editingCategory ? editingCategory.id : formId.trim() || undefined,
      scope: editingCategory ? editingCategory.scope : formScope,
      label: formLabel,
      shortLabel: formShortLabel,
      description: formDescription,
      order: Number(formOrder) || 1,
      isActive: formIsActive,
    });

    if (!res.ok || !res.category) {
      setFormError(res.error || 'Kategori kaydedilemedi.');
      return;
    }

    setModalOpen(false);
    setNotification({
      type: 'success',
      title: editingCategory ? 'Kategori Güncellendi' : 'Yeni Kategori Eklendi',
      message: `"${res.category.label}" (${CATEGORY_SCOPE_MAP[res.category.scope]?.shortTitle}) tüm katalog ve form listelerine yansıtıldı.`,
    });
  };

  const handleToggleActive = (cat: CategoryDefinition) => {
    if (!canEdit) return;
    const res = saveCategory({
      ...cat,
      isActive: !cat.isActive,
    });
    if (!res.ok) {
      setNotification({
        type: 'error',
        title: 'İşlem Başarısız',
        message: res.error || 'Kategori durumu güncellenemedi.',
      });
      return;
    }
    setNotification({
      type: 'success',
      title: !cat.isActive ? 'Kategori Aktifleştirildi' : 'Kategori Pasife Alındı',
      message: !cat.isActive
        ? `"${cat.label}" artık ziyaretçi kataloglarında ve yeni içerik formlarında görünür.`
        : `"${cat.label}" pasife alındı; mevcut kayıtlar korunur ancak yeni seçenekte gizlenir.`,
    });
  };

  const openDeleteModal = (cat: CategoryDefinition) => {
    if (!canDelete) return;
    const usageCount = getCategoryUsageCount(cat.scope, cat.id);
    const alternatives = getCategories(cat.scope, false).filter((c) => c.id !== cat.id);
    setDeleteTarget({ category: cat, usageCount });
    setReassignTargetId(alternatives[0]?.id || '');
    setDeleteError(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const { category, usageCount } = deleteTarget;
    const res = deleteCategory(
      category.scope,
      category.id,
      usageCount > 0 ? reassignTargetId : undefined
    );
    if (!res.ok) {
      setDeleteError(res.error || 'Kategori silinemedi.');
      return;
    }
    setDeleteTarget(null);
    setNotification({
      type: 'success',
      title: 'Kategori Silindi',
      message:
        usageCount > 0
          ? `"${category.label}" silindi ve bağlı ${usageCount} kayıt seçilen kategoriye aktarıldı.`
          : `"${category.label}" katalogdan kaldırıldı.`,
    });
  };

  const deleteAlternatives = deleteTarget
    ? getCategories(deleteTarget.category.scope, false).filter(
        (c) => c.id !== deleteTarget.category.id
      )
    : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      <FormNotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
      />

      {/* Page Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <Tag className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Dinamik Kategori &amp; Tür Kataloğu
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Yemek, tarif, ürün, harita noktası, mutfak mirası, usta, haber, duyuru ve etkinlik
            kategorilerini buradan yönetebilirsiniz. Eklediğiniz ve adlandırdığınız her kategori
            ziyaretçi portalındaki filtrelere ve CMS formlarına otomatik yansır.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden md:block px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 block">Toplam / Aktif</span>
            <span className="text-sm font-bold text-slate-900">
              {allCategories.length} / {activeCount}
            </span>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={openCreateModal}
              className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Kategori Ekle</span>
            </button>
          )}
        </div>
      </div>

      {/* Scope Tabs & Search */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedScope('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedScope === 'all'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tümü ({scopeCounts.all || 0})
          </button>

          {CATEGORY_SCOPE_META.map((meta) => (
            <button
              key={meta.scope}
              type="button"
              onClick={() => setSelectedScope(meta.scope)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedScope === meta.scope
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {meta.shortTitle} ({scopeCounts[meta.scope] || 0})
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kategori adı, kısa etiket, kod veya modüle göre ara..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {selectedScope !== 'all' && CATEGORY_SCOPE_MAP[selectedScope]?.visitorRoute && (
            <Link
              to={CATEGORY_SCOPE_MAP[selectedScope].visitorRoute!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ziyaretçi Katalog Sayfasını Gör</span>
            </Link>
          )}
        </div>

        {selectedScope !== 'all' && (
          <p className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
            {CATEGORY_SCOPE_MAP[selectedScope]?.description}
          </p>
        )}
      </div>

      {/* Category Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {filteredCategories.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Arama ölçütünüze uygun kategori bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 w-14">Sıra</th>
                  <th className="py-3 px-4">Kategori Adı &amp; Açıklama</th>
                  <th className="py-3 px-4">Modül</th>
                  <th className="py-3 px-4">Kod (ID)</th>
                  <th className="py-3 px-4 text-center">Kayıt Sayısı</th>
                  <th className="py-3 px-4">Durum</th>
                  <th className="py-3 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((cat) => {
                  const usage = getCategoryUsageCount(cat.scope, cat.id);
                  const scopeMeta = CATEGORY_SCOPE_MAP[cat.scope];
                  const isProtectedCore = cat.scope === 'dish' && cat.id === 'local_product';

                  return (
                    <tr
                      key={`${cat.scope}:${cat.id}`}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        !cat.isActive ? 'opacity-65 bg-slate-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-slate-500 font-semibold">
                        #{cat.order}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">
                            {cat.label}
                          </span>
                          {cat.shortLabel && cat.shortLabel !== cat.label && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                              Kısa: {cat.shortLabel}
                            </span>
                          )}
                          {cat.isSystem && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/70 text-[10px] font-semibold">
                              Sistem
                            </span>
                          )}
                        </div>
                        {cat.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 max-w-md">
                            {cat.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                        {scopeMeta?.shortTitle || cat.scope}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {cat.id}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            usage > 0
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {usage}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {cat.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold">
                            Pasif
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => openEditModal(cat)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Düzenle"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleToggleActive(cat)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                              title={cat.isActive ? 'Pasife Al' : 'Aktifleştir'}
                            >
                              {cat.isActive ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          {canDelete && !isProtectedCore && (
                            <button
                              type="button"
                              onClick={() => openDeleteModal(cat)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Kategoriyi Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Create / Edit Category Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingCategory
                  ? `Kategoriyi Düzenle: ${editingCategory.label}`
                  : 'Yeni Kategori Ekle'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Modül / Katalog Kapsamı <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formScope}
                    disabled={Boolean(editingCategory)}
                    onChange={(e) => {
                      const nextScope = e.target.value as CategoryScope;
                      setFormScope(nextScope);
                      setFormOrder(getCategories(nextScope, false).length + 1);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-emerald-600 disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    {CATEGORY_SCOPE_META.map((m) => (
                      <option key={m.scope} value={m.scope}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sıra Numarası
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formOrder}
                    onChange={(e) => setFormOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Adı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="Örn: Çorbalar ve Tencere Yemekleri"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
                {editingCategory && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Kategori adını değiştirdiğinizde bu kategoriye bağlı mevcut içeriklerin etiketleri de otomatik güncellenir.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kısa Etiket (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={formShortLabel}
                    onChange={(e) => setFormShortLabel(e.target.value)}
                    placeholder="Örn: Çorba"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teknik Kod (Boşsa otomatik oluşur)
                  </label>
                  <input
                    type="text"
                    disabled={Boolean(editingCategory)}
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="ornek_kategori"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Açıklama (Opsiyonel)
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Kategorinin içerik kapsamı hakkında editör notu"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Aktif (Ziyaretçi katalog filtrelerinde ve yeni içerik formlarında göster)
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 cursor-pointer shadow-2xs"
                >
                  {editingCategory ? 'Değişiklikleri Kaydet' : 'Kategoriyi Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Reassign Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setDeleteTarget(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 shrink-0">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    "{deleteTarget.category.label}" Kategorisini Sil
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {deleteTarget.usageCount > 0
                      ? `Bu kategori şu anda ${deleteTarget.usageCount} kayıt tarafından kullanılıyor. Silmeden önce kayıtların aktarılacağı kategoriyi seçiniz.`
                      : 'Bu kategoride bağlı kayıt bulunmuyor. Katalogdan kalıcı olarak kaldırmak istiyor musunuz?'}
                  </p>
                </div>
              </div>

              {deleteError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {deleteError}
                </div>
              )}

              {deleteTarget.usageCount > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kayıtların Aktarılacağı Kategori <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={reassignTargetId}
                    onChange={(e) => setReassignTargetId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-emerald-600"
                  >
                    {deleteAlternatives.map((alt) => (
                      <option key={alt.id} value={alt.id}>
                        {alt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteTarget.usageCount > 0 && !reassignTargetId}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {deleteTarget.usageCount > 0 ? 'Aktar ve Sil' : 'Evet, Sil'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

