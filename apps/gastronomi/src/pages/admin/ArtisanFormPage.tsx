import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Info,
  Save,
  ShieldCheck,
  Trash2,
  Eye,
} from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import { useAdminRole } from '../../context/AdminRoleContext';
import {
  Artisan,
  PublicationStatus,
} from '../../types';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { ImageUploadField } from '../../components/admin/common/ImageUploadField';
import { FormNotificationToast, FormNotification } from '../../components/admin/common/FormNotificationToast';
import { ActionConfirmModal } from '../../components/admin/common/ActionConfirmModal';
import { QuickCategoryButton } from '../../components/admin/common/QuickCategoryButton';
import { mergeCategoryOption } from '../../data/categories';

export const ArtisanFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const { canCreate, canEdit, canDelete, canPublish } = useAdminRole();
  const canSave = isEditing ? canEdit : canCreate;

  const {
    getArtisanById,
    saveArtisan,
    deleteArtisan,
    getDishes,
    getCulturalStories,
    getCategories,
    getCategoryLabel,
  } = useContent();

  const allDishes = getDishes(false);
  const allStories = getCulturalStories(false);

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<FormNotification | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const initializedKeyRef = useRef<string | null>(null);

  // Smooth scroll and focus on missing/invalid input field
  const scrollToField = (fieldName: string) => {
    setActiveTab('editor');
    setTimeout(() => {
      const element = document.getElementById(`field-${fieldName}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input =
          element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT'
            ? element
            : element.querySelector('input, textarea, select');
        if (input) {
          (input as HTMLElement).focus();
        }
        element.classList.add('ring-4', 'ring-rose-500/40', 'transition-all');
        setTimeout(() => {
          element.classList.remove('ring-4', 'ring-rose-500/40');
        }, 2500);
      }
    }, 120);
  };

  const createDefaultFormData = (): Partial<Artisan> => ({
    id: `artisan-${Date.now()}`,
    name: '',
    businessName: '',
    profileType: 'master',
    title: 'Geleneksel Taş Fırın Ustası',
    craftCategory: 'bakery',
    craftCategoryLabel: 'Taş Fırın & Ocaklık',
    biography: '',
    detailedStory: '',
    experienceYears: 25,
    villageOrNeighborhood: '',
    imageUrl: '/images/tas_firin_kozu_poster.jpg',
    imageCredit: 'İslahiye Lezzet Atlası Saha Arşivi',
    videoUrl: '',
    relatedDishIds: [],
    relatedStoryIds: [],
    infoSource: 'İslahiye Yerel Saha Kayıtları & İzin Formu',
    publicationPermissionGranted: true,
    permissionNote: 'Kurumsal tanıtım ve editoryal yayın muvafakatnamesi mevcuttur.',
    verificationStatus: 'verified',
    publicationStatus: 'draft',
    isDemo: false,
    visitInfo: {
      address: '',
      contactPhone: '',
      note: '',
    },
  });

  // Form State
  const [formData, setFormData] = useState<Partial<Artisan>>(createDefaultFormData);

  useEffect(() => {
    if (isEditing && id) {
      if (initializedKeyRef.current === id) return;
      const existing = getArtisanById(id);
      if (existing) {
        initializedKeyRef.current = id;
        setFormData({ ...existing });
        setErrors({});
        setActiveTab('editor');
      } else {
        initializedKeyRef.current = id;
        setNotification({
          type: 'error',
          message: 'Usta veya üretici kaydı bulunamadı.',
        });
        setTimeout(() => navigate('/yonetim/ustalar'), 1200);
      }
    } else if (!isEditing && initializedKeyRef.current !== '__create__') {
      initializedKeyRef.current = '__create__';
      setFormData(createDefaultFormData());
      setErrors({});
      setActiveTab('editor');
    }
  }, [id, isEditing, getArtisanById, navigate]);

  const handleCraftCategoryChange = (
    cat: Artisan['craftCategory'],
    explicitLabel?: string
  ) => {
    const resolvedLabel =
      explicitLabel || getCategoryLabel('artisan', cat, 'Taş Fırın & Ocaklık');

    setFormData((prev) => ({
      ...prev,
      craftCategory: cat,
      craftCategoryLabel: resolvedLabel,
    }));
  };

  const validate = (targetStatus?: PublicationStatus): boolean => {
    const newErrors: Record<string, string> = {};
    const fieldDetails: { name: string; label: string; message: string }[] = [];

    if (!formData.name?.trim()) {
      const msg = 'Usta veya üretici adı/soyadı zorunludur.';
      newErrors.name = msg;
      fieldDetails.push({ name: 'name', label: 'Ad ve Soyad', message: msg });
    }
    if (!formData.biography?.trim()) {
      const msg = 'Kısa biyografi ve zanaat özeti zorunludur.';
      newErrors.biography = msg;
      fieldDetails.push({ name: 'biography', label: 'Kısa Biyografi', message: msg });
    }

    if (targetStatus === 'published' && !formData.publicationPermissionGranted) {
      const msg = 'Resmî görsel ve biyografi kullanım izni (muvafakatname) olmadan yayınlanamaz.';
      newErrors.permission = msg;
      fieldDetails.push({ name: 'permission', label: 'Yayın İzni Muvafakatnamesi', message: msg });
    }

    setErrors(newErrors);

    if (fieldDetails.length > 0) {
      setActiveTab('editor');
      setNotification({
        type: 'error',
        title: `${fieldDetails.length} Alanda Eksiklik Bulundu`,
        message: 'Kaydetme işleminin tamamlanması için lütfen eksik alanları doldurunuz.',
        fields: fieldDetails,
        onScrollToField: scrollToField,
      });

      scrollToField(fieldDetails[0].name);
      return false;
    }

    return true;
  };

  const handleSubmit = (targetStatus?: PublicationStatus) => {
    if (!canSave) {
      setNotification({
        type: 'error',
        title: 'Yetki Yetersiz',
        message: 'Aktif rolünüzle usta veya üretici profili oluşturma/düzenleme yetkiniz bulunmamaktadır.',
      });
      return;
    }

    const currentStatus = (formData.publicationStatus || 'draft') as PublicationStatus;
    const requestedStatus = targetStatus || currentStatus;
    const finalStatus: PublicationStatus =
      !canPublish && (requestedStatus === 'published' || requestedStatus === 'archived')
        ? 'in_review'
        : requestedStatus;

    if (!validate(finalStatus)) {
      return;
    }

    const artisanToSave: Artisan = {
      id: formData.id || `artisan-${Date.now()}`,
      name: formData.name!.trim(),
      businessName: formData.businessName?.trim() || undefined,
      profileType: formData.profileType || 'master',
      title: formData.title?.trim() || 'Zanaatkâr',
      craftCategory: formData.craftCategory || 'bakery',
      craftCategoryLabel: formData.craftCategoryLabel || 'Taş Fırın & Ocaklık',
      biography: formData.biography!.trim(),
      detailedStory: formData.detailedStory?.trim() || undefined,
      experienceYears: formData.experienceYears,
      villageOrNeighborhood: formData.villageOrNeighborhood?.trim() || undefined,
      imageUrl: formData.imageUrl?.trim() || undefined,
      imageCredit: formData.imageCredit?.trim() || undefined,
      videoUrl: formData.videoUrl?.trim() || undefined,
      relatedDishIds: formData.relatedDishIds || [],
      relatedStoryIds: formData.relatedStoryIds || [],
      infoSource: formData.infoSource?.trim() || 'İslahiye Yerel Saha Kayıtları',
      publicationPermissionGranted: Boolean(formData.publicationPermissionGranted),
      permissionNote: formData.permissionNote?.trim() || undefined,
      verificationStatus: formData.verificationStatus || 'verified',
      publicationStatus: finalStatus,
      isDemo: false,
      visitInfo: formData.visitInfo,
    };

    const ok = saveArtisan(artisanToSave);
    if (!ok) {
      setNotification({
        type: 'error',
        title: 'Kayıt Hatası',
        message: 'Usta profili yerel depoya kaydedilemedi. Tarayıcı depolama alanını kontrol ediniz.',
      });
      return;
    }

    setFormData((prev) => ({ ...prev, publicationStatus: finalStatus }));
    setNotification({
      type: 'success',
      message:
        finalStatus === 'published'
          ? 'Usta / üretici profili başarıyla yayımlandı!'
          : finalStatus === 'in_review'
          ? 'Profil yayın onayı için incelemeye alındı (henüz yayında değil).'
          : finalStatus === 'archived'
          ? 'Profil arşivlendi ve ziyaretçi portalından kaldırıldı.'
          : 'Usta profili taslak olarak kaydedildi.',
    });
    setTimeout(() => {
      navigate('/yonetim/ustalar');
    }, 900);
  };

  const handleDelete = () => {
    if (!canDelete || !formData.id) return;
    deleteArtisan(formData.id);
    navigate('/yonetim/ustalar');
  };

  const currentStatus = (formData.publicationStatus || 'draft') as PublicationStatus;
  const effectiveSaveStatus: PublicationStatus =
    !canPublish && (currentStatus === 'published' || currentStatus === 'archived')
      ? 'in_review'
      : currentStatus;

  const primaryButtonLabel =
    effectiveSaveStatus === 'published'
      ? 'Kaydet ve Yayımla'
      : effectiveSaveStatus === 'in_review'
      ? 'İncelemeye Gönder'
      : effectiveSaveStatus === 'archived'
      ? 'Arşivle ve Kaydet'
      : 'Taslağı Kaydet';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 font-sans">
      {/* Floating Viewport Toast for Notifications & Validation */}
      <FormNotificationToast notification={notification} onClose={() => setNotification(null)} />

      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/yonetim/ustalar')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Geri Dön"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
                {isEditing
                  ? (formData.name ? `Usta Düzenle: ${formData.name}` : 'Usta Profilini Düzenle')
                  : 'Yeni Usta / Üretici Profili Ekle'}
              </h1>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${
                  currentStatus === 'published'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : currentStatus === 'in_review'
                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                    : currentStatus === 'archived'
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {currentStatus === 'published'
                  ? 'Yayında'
                  : currentStatus === 'in_review'
                  ? 'İncelemede'
                  : currentStatus === 'archived'
                  ? 'Arşivde'
                  : 'Taslak'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-sans">
              Zanaatkâr biyografileri, atölye bilgileri ve sözlü miras kayıtları yönetimi.
            </p>
          </div>
        </div>

        {/* Action Buttons & Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {Object.keys(errors).length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>{Object.keys(errors).length} eksik alan</span>
            </div>
          )}

          {/* Tab Switcher */}
          <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-100 mr-1">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Editör
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Canlı Önizleme</span>
            </button>
          </div>

          {canSave && currentStatus !== 'draft' && (
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-slate-400" />
              <span>Taslak Sakla</span>
            </button>
          )}

          <button
            type="button"
            disabled={!canSave}
            onClick={() => handleSubmit()}
            title={!canSave ? 'Aktif rolünüzle kayıt kaydedemezsiniz' : undefined}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{primaryButtonLabel}</span>
          </button>

          {isEditing && canDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
              title="Usta Profilini Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Corporate Institutional Guard Notice (Section 7) */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs font-sans flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block mb-0.5 font-bold">Kişisel Veri ve Mahremiyet İlkesi:</strong>
          Kurumsal yayın ilkeleri gereğince, gerçek ve izinli kişi verisi bulunmuyorsa temsilî veya kurgusal şahıs profilleri üretilmez.
          Görsel ve biyografi kullanım izni (muvafakatname) onaylanmadan şahıs profilleri ziyaretçi portalında yayımlanamaz.
        </div>
      </div>

      {activeTab === 'editor' ? (
        /* ==================== EDITOR TAB ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Identity Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <h2 className="text-xs font-sans font-bold text-slate-500 uppercase tracking-wider">
                1. KİMLİK &amp; ZANAAT BİLGİSİ
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ad Soyad / Usta Adı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="field-name"
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors((prev) => { const n = { ...prev }; delete n.name; return n; });
                    }}
                    placeholder="Örn: Mehmet Usta"
                    className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 font-semibold ${
                      errors.name
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                    }`}
                  />
                  {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    İşletme / Fırın Adı (İsteğe Bağlı)
                  </label>
                  <input
                    type="text"
                    value={formData.businessName || ''}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Örn: Tarihi Çarşı Taş Fırını"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Profil Türü
                  </label>
                  <select
                    value={formData.profileType || 'master'}
                    onChange={(e) => setFormData({ ...formData, profileType: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="master">Geleneksel Ocaklık / Fırın Ustası</option>
                    <option value="producer">Tarımsal Üretici / Çiftçi</option>
                    <option value="cooperative">Kadın Girişimi & Kooperatif</option>
                    <option value="cook">Geleneksel Aşçı / Emektar</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Zanaat Kategorisi
                    </label>
                    <QuickCategoryButton
                      scope="artisan"
                      onCreated={(cat) =>
                        handleCraftCategoryChange(cat.id as Artisan['craftCategory'], cat.label)
                      }
                    />
                  </div>
                  <select
                    value={formData.craftCategory || 'bakery'}
                    onChange={(e) => handleCraftCategoryChange(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {mergeCategoryOption(
                      getCategories('artisan', true),
                      formData.craftCategory,
                      'artisan',
                      getCategoryLabel('artisan', formData.craftCategory || 'bakery', formData.craftCategoryLabel)
                    ).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Uzmanlık & Unvan
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Örn: 35 Yıllık Meşe Odunu Fırın Ustası"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deneyim Yılı & Köy/Mahalle
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={formData.experienceYears || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, experienceYears: Number(e.target.value) })
                      }
                      placeholder="Yıl (Örn: 30)"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-sans"
                    />
                    <input
                      type="text"
                      value={formData.villageOrNeighborhood || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, villageOrNeighborhood: e.target.value })
                      }
                      placeholder="Mahalle/Köy"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kısa Biyografi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="field-biography"
                  rows={3}
                  required
                  value={formData.biography || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, biography: e.target.value });
                    if (errors.biography) setErrors((prev) => { const n = { ...prev }; delete n.biography; return n; });
                  }}
                  placeholder="Ustanın yetişme hikâyesi, ocaklık hafızası ve zanaat yolculuğu..."
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 leading-relaxed font-sans ${
                    errors.biography
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                  }`}
                />
                {errors.biography && <p className="text-[11px] text-rose-500 mt-1">{errors.biography}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detaylı Usta Hikâyesi (İsteğe Bağlı)
                </label>
                <textarea
                  rows={4}
                  value={formData.detailedStory || ''}
                  onChange={(e) => setFormData({ ...formData, detailedStory: e.target.value })}
                  placeholder="Sözlü tarih görüşmesi, sabah ocaklık ritüeli ve genç kuşaklara aktarılan sırlar..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 leading-relaxed font-sans"
                />
              </div>
            </div>

            {/* Relations Linker */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <h2 className="text-xs font-sans font-bold text-slate-500 uppercase tracking-wider">
                2. İLİŞKİLİ YEMEKLER &amp; KÜLTÜREL ANLATILAR
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Related Dishes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ustanın İcra Ettiği Yemekler
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                    {allDishes.map((dish) => {
                      const isChecked = (formData.relatedDishIds || []).includes(dish.id);
                      return (
                        <label
                          key={dish.id}
                          className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-md text-xs text-slate-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const current = formData.relatedDishIds || [];
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  relatedDishIds: [...current, dish.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  relatedDishIds: current.filter((id) => id !== dish.id),
                                });
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer shrink-0"
                          />
                          <span className="truncate">{dish.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Related Cultural Stories */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    İlişkili Mutfak Mirası Anlatıları
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                    {allStories.map((story) => {
                      const isChecked = (formData.relatedStoryIds || []).includes(story.id);
                      return (
                        <label
                          key={story.id}
                          className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-md text-xs text-slate-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const current = formData.relatedStoryIds || [];
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  relatedStoryIds: [...current, story.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  relatedStoryIds: current.filter((id) => id !== story.id),
                                });
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer shrink-0"
                          />
                          <span className="truncate">{story.title}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar / Permissions / Compliance (1 col) */}
          <div className="space-y-6">
            {/* Legal Permission & Consent (CRITICAL) */}
            <div id="field-permission" className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <h2 className="text-xs font-sans font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>3. YAYIN İZNİ &amp; BELGELENDİRME</span>
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yayın Durumu
                </label>
                <select
                  value={currentStatus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      publicationStatus: e.target.value as PublicationStatus,
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-sans"
                >
                  <option value="draft">Taslak (Yalnızca CMS'te görünür)</option>
                  <option value="in_review">İnceleme Aşamasında</option>
                  <option value="published" disabled={!canPublish}>
                    Yayında (Ziyaretçiye Açık){!canPublish ? ' — Yetki Gerektirir' : ''}
                  </option>
                  <option value="archived" disabled={!canPublish}>
                    Arşivlenmiş (Yayından Kaldırıldı)
                  </option>
                </select>
                {!canPublish && (
                  <p className="text-[11px] text-amber-700 mt-1 font-sans">
                    Aktif rolünüz doğrudan yayına alma yetkisine sahip olmadığından profil incelemeye gönderilir.
                  </p>
                )}
              </div>

              {/* Consent Checkbox */}
              <div className={`p-3 rounded-lg border space-y-2 transition-all ${
                errors.permission ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20' : 'bg-emerald-50/60 border-emerald-200'
              }`}>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.publicationPermissionGranted)}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        publicationPermissionGranted: e.target.checked,
                      });
                      if (errors.permission) setErrors((prev) => { const n = { ...prev }; delete n.permission; return n; });
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer shrink-0"
                  />
                  <div className="text-xs text-slate-900 font-semibold leading-snug">
                    Görsel ve Biyografi Yayın İzni (Muvafakatname) Alındı
                  </div>
                </label>
                {errors.permission ? (
                  <p className="text-[11px] text-rose-600 font-medium font-sans">
                    {errors.permission}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-600 font-sans leading-relaxed">
                    İzin kutusu işaretlenmeden profil ziyaretçi tarafına aktarılamaz.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  İzin Belgesi & Protokol Notu
                </label>
                <input
                  type="text"
                  value={formData.permissionNote || ''}
                  onChange={(e) => setFormData({ ...formData, permissionNote: e.target.value })}
                  placeholder="Örn: 2026/04 No'lu Kurumsal Tanıtım Muvafakatnamesi"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

            </div>

            {/* Media & Visuals */}
            <div id="field-imageUrl" className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <ImageUploadField
                value={formData.imageUrl || ''}
                onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
                altText={formData.name || ''}
                credit={formData.imageCredit || ''}
                onCreditChange={(credit) => setFormData((prev) => ({ ...prev, imageCredit: credit }))}
                label="Usta / Zanaatkâr Profil Fotoğrafı"
              />

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  İsteğe Bağlı Video Klip Yolu
                </label>
                <input
                  type="text"
                  value={formData.videoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="/videos/tas-firin-ve-ocaklik.mp4"
                  className="w-full px-3 py-2 text-xs font-sans border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Visit & Contact Information */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
              <h2 className="text-xs font-sans font-bold text-slate-500 uppercase tracking-wider">
                5. ZİYARET &amp; KONUM NOTU
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ziyaret Adresi / Çarşı Konumu
                </label>
                <input
                  type="text"
                  value={formData.visitInfo?.address || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      visitInfo: { ...formData.visitInfo, address: e.target.value },
                    })
                  }
                  placeholder="Örn: Tarihi Arasta Çarşısı No: 14"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  İletişim / Not (İzinli)
                </label>
                <input
                  type="text"
                  value={formData.visitInfo?.note || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      visitInfo: { ...formData.visitInfo, note: e.target.value },
                    })
                  }
                  placeholder="Örn: Sabah 06:00 - 14:00 arası ocaklık aktiftir."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          {/* Bottom Actions Bar */}
          <div className="lg:col-span-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            {Object.keys(errors).length > 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg animate-pulse">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{Object.keys(errors).length} alanda eksik veya hatalı bilgi var</span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-sans">
                Görsel ve biyografi muvafakatnamesi alındıktan sonra profil doğrudan yayınlanabilir.
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <Link
                to="/yonetim/ustalar"
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Vazgeç
              </Link>
              {canSave && currentStatus !== 'draft' && (
                <button
                  type="button"
                  onClick={() => handleSubmit('draft')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-slate-400" />
                  <span>Taslak Sakla</span>
                </button>
              )}
              <button
                type="button"
                disabled={!canSave}
                onClick={() => handleSubmit()}
                title={!canSave ? 'Aktif rolünüzle kayıt kaydedemezsiniz' : undefined}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{primaryButtonLabel}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== LIVE VISITOR CARD PREVIEW TAB ==================== */
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Ziyaretçi Portalı Canlı Önizlemesi
              </h3>
              <p className="text-xs text-slate-500">
                Usta ve üretici kartının ziyaretçi arayüzündeki görünümü.
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
              {formData.craftCategoryLabel}
            </span>
          </div>

          <div className="bg-ivory border border-sand/70 rounded-xl p-6 sm:p-12 shadow-xs">
            <div className="max-w-md mx-auto bg-paper border border-sand/70 rounded-xl p-6 shadow-xs space-y-4">
              {formData.imageUrl && (
                <div className="aspect-[4/3] rounded-lg overflow-hidden border border-sand/60 bg-sand/20">
                <ImageWithFallback
                  src={formData.imageUrl}
                  alt={formData.name || 'Usta'}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-sans text-copper-dark uppercase tracking-wider font-semibold">
                  {formData.craftCategoryLabel}
                </span>

              </div>

              <h3 className="text-xl font-display font-bold text-forest">
                {formData.name || 'Usta Adı Belirtilmedi'}
              </h3>

              {formData.title && (
                <span className="text-xs font-sans text-charcoal/60 block mt-0.5">
                  {formData.title} {formData.experienceYears ? `• ${formData.experienceYears} Yıllık Deneyim` : ''}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed font-sans">
              {formData.biography || 'Biyografi metni girilmedi.'}
            </p>

            {formData.visitInfo?.address && (
              <div className="pt-3 border-t border-sand/50 text-[11px] font-sans text-charcoal/60 flex items-center justify-between">
                <span>{formData.visitInfo.address}</span>
                {formData.villageOrNeighborhood && (
                  <span>{formData.villageOrNeighborhood}</span>
                )}
              </div>
            )}
          </div>
          </div>
        </div>
      )}

      <ActionConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        variant="danger"
        title="Usta Profilini Sil"
        message={`"${formData.name || 'Bu profil'}" kalıcı olarak silinecek ve ziyaretçi portalından kaldırılacaktır.`}
        confirmText="Evet, Sil"
      />
    </div>
  );
};
