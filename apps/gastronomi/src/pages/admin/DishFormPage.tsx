import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Check,
  Trash2,
  AlertCircle,
  Eye,
  Info,
  Clock,
  Users,
} from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import { useAdminRole } from '../../context/AdminRoleContext';
import { Dish, DishCategory, PublicationStatus, VerificationStatus } from '../../types';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { ActionConfirmModal } from '../../components/admin/common/ActionConfirmModal';
import { ImageUploadField } from '../../components/admin/common/ImageUploadField';
import { FormNotificationToast, FormNotification } from '../../components/admin/common/FormNotificationToast';
import { QuickCategoryButton } from '../../components/admin/common/QuickCategoryButton';
import { mergeCategoryOption } from '../../data/categories';

export const DishFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDishById, getRecipes, saveDish, deleteDish, getCategories, getCategoryLabel } = useContent();
  const { canCreate, canEdit, canDelete, canPublish } = useAdminRole();

  const isEditing = Boolean(id);
  const canSave = isEditing ? canEdit : canCreate;
  const existingDish = useMemo(() => (id ? getDishById(id) : undefined), [id, getDishById]);
  const availableRecipes = getRecipes();
  const initializedKeyRef = useRef<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [culturalNote, setCulturalNote] = useState('');
  const [originNote, setOriginNote] = useState('İslahiye Taş Fırın Geleneği');
  const [category, setCategory] = useState<Exclude<DishCategory, 'all'>>('main');
  const [prepTime, setPrepTime] = useState('25 dk');
  const [cookTime, setCookTime] = useState('45 dk');
  const [servings, setServings] = useState('4-6 Kişilik');
  const [difficulty, setDifficulty] = useState<'Kolay' | 'Orta' | 'Ustalık Gerektirir'>('Orta');
  const [imageUrl, setImageUrl] = useState('/images/islahiye_tava.jpg');
  const [imageAlt, setImageAlt] = useState('');
  const [imageCredit, setImageCredit] = useState('İslahiye Lezzet Atlası Arşivi');
  const [recipeId, setRecipeId] = useState<string>('');
  const [isRegisteredGI, setIsRegisteredGI] = useState(false);
  const [giStatusNote, setGiStatusNote] = useState('Yöresel Mutfak Mirası');
  const [publicationStatus, setPublicationStatus] = useState<PublicationStatus>(() =>
    canPublish ? 'published' : 'draft'
  );
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('verified');
  const [sourceUrl, setSourceUrl] = useState('');

  // UI state
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<FormNotification | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Smooth scroll and focus on missing/invalid input field
  const scrollToField = (fieldName: string) => {
    setActiveTab('form');
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

  // Populate form if editing or reset when switching from edit to create
  useEffect(() => {
    if (isEditing && id) {
      if (existingDish) {
        if (initializedKeyRef.current !== existingDish.id) {
          initializedKeyRef.current = existingDish.id;
          setName(existingDish.name);
          setTagline(existingDish.tagline || '');
          setDescription(existingDish.description || '');
          setCulturalNote(existingDish.culturalNote || '');
          setOriginNote(existingDish.originNote || 'İslahiye Taş Fırın Geleneği');
          setCategory(existingDish.category);
          setPrepTime(existingDish.prepTime || '25 dk');
          setCookTime(existingDish.cookTime || '45 dk');
          setServings(existingDish.servings || '4-6 Kişilik');
          setDifficulty(existingDish.difficulty || 'Orta');
          setImageUrl(existingDish.imageUrl);
          setImageAlt(existingDish.imageAlt || '');
          setImageCredit(existingDish.imageCredit || 'İslahiye Lezzet Atlası Arşivi');
          setRecipeId(existingDish.recipeId || '');
          setIsRegisteredGI(Boolean(existingDish.isRegisteredGeographicalIndication));
          setGiStatusNote(existingDish.giStatusNote || 'Yöresel Mutfak Mirası');
          setPublicationStatus(existingDish.publicationStatus || 'published');
          setVerificationStatus(existingDish.verificationStatus || 'verified');
          setSourceUrl(existingDish.sourceUrl || '');
          setErrors({});
          setIsDirty(false);
          setActiveTab('form');
        }
      } else if (initializedKeyRef.current !== `__missing__${id}`) {
        initializedKeyRef.current = `__missing__${id}`;
        setNotification({
          type: 'error',
          title: 'Kayıt Bulunamadı',
          message: 'Düzenlenecek yemek kaydı bulunamadı. Yemek listesine yönlendiriliyorsunuz.',
        });
        setTimeout(() => navigate('/yonetim/yemekler'), 1200);
      }
    } else if (!isEditing && initializedKeyRef.current !== '__create__') {
      initializedKeyRef.current = '__create__';
      setName('');
      setTagline('');
      setDescription('');
      setCulturalNote('');
      setOriginNote('İslahiye Taş Fırın Geleneği');
      setCategory('main');
      setPrepTime('25 dk');
      setCookTime('45 dk');
      setServings('4-6 Kişilik');
      setDifficulty('Orta');
      setImageUrl('/images/islahiye_tava.jpg');
      setImageAlt('');
      setImageCredit('İslahiye Lezzet Atlası Arşivi');
      setRecipeId('');
      setIsRegisteredGI(false);
      setGiStatusNote('Yöresel Mutfak Mirası');
      setPublicationStatus(canPublish ? 'published' : 'draft');
      setVerificationStatus('verified');
      setSourceUrl('');
      setErrors({});
      setIsDirty(false);
      setActiveTab('form');
    }
  }, [isEditing, id, existingDish, navigate, canPublish]);

  // Validation with precise field mapping and auto-focus
  const validate = () => {
    const newErrors: Record<string, string> = {};
    const fieldDetails: { name: string; label: string; message: string }[] = [];

    if (!name.trim() || name.trim().length < 3) {
      const msg = 'Yemek adı en az 3 karakter olmalıdır.';
      newErrors.name = msg;
      fieldDetails.push({ name: 'name', label: 'Yemek Adı', message: msg });
    }
    if (!description.trim() || description.trim().length < 15) {
      const msg = 'Açıklama alanı en az 15 karakter içermelidir.';
      newErrors.description = msg;
      fieldDetails.push({ name: 'description', label: 'Lezzet Açıklaması', message: msg });
    }
    if (!imageUrl.trim()) {
      const msg = 'Lütfen bir yemek fotoğrafı seçin veya bilgisayarınızdan yükleyin.';
      newErrors.imageUrl = msg;
      fieldDetails.push({ name: 'imageUrl', label: 'Yemek Fotoğrafı', message: msg });
    }

    setErrors(newErrors);

    if (fieldDetails.length > 0) {
      setActiveTab('form');
      setNotification({
        type: 'error',
        title: `${fieldDetails.length} Alanda Eksiklik Bulundu`,
        message: 'Kaydetme işleminin tamamlanması için lütfen eksik alanları doldurunuz.',
        fields: fieldDetails,
        onScrollToField: scrollToField,
      });

      // Automatically smoothly scroll and focus the very first missing field!
      scrollToField(fieldDetails[0].name);
      return false;
    }

    return true;
  };

  // Generate Unique ID & Slug
  const generateId = (text: string) => {
    const slug = text
      .toLocaleLowerCase('tr-TR')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return slug || `dish-${Date.now()}`;
  };

  const handleSave = (targetStatus?: PublicationStatus) => {
    if (!canSave) {
      setNotification({
        type: 'error',
        title: 'Yetki Yetersiz',
        message: 'Aktif rolünüz bu işlemde yemek kaydı oluşturma veya düzenleme yetkisine sahip değildir.',
      });
      return;
    }

    if (!validate()) {
      return;
    }

    const requestedStatus = targetStatus || publicationStatus;
    const finalStatus: PublicationStatus =
      !canPublish && (requestedStatus === 'published' || requestedStatus === 'archived')
        ? 'in_review'
        : requestedStatus;
    const dishId = isEditing && existingDish ? existingDish.id : generateId(name);
    const resolvedCategoryLabel = getCategoryLabel('dish', category, 'Ana Yemekler');

    const updatedDish: Dish = {
      id: dishId,
      name: name.trim(),
      category,
      categoryLabel: resolvedCategoryLabel,
      tagline: tagline.trim() || description.slice(0, 80) + '...',
      description: description.trim(),
      culturalNote: culturalNote.trim() || 'İslahiye geleneksel fırın kültüründe özenle hazırlanır.',
      originNote: originNote.trim() || 'İslahiye Mutfak Mirası',
      isRegisteredGeographicalIndication: isRegisteredGI,
      giStatusNote: isRegisteredGI
        ? dishId === 'islahiye-biberi'
          ? 'Tescilli Coğrafi İşaret'
          : 'Coğrafi İşaret Beyanı'
        : giStatusNote,
      prepTime,
      cookTime,
      difficulty,
      servings,
      imageUrl,
      imageAlt: imageAlt.trim() || name,
      imageCredit: imageCredit.trim(),
      recipeId: recipeId || undefined,
      publicationStatus: finalStatus,
      verificationStatus,
      sourceUrl: sourceUrl.trim() || undefined,
      isDemo: existingDish?.isDemo ?? false,
    } as Dish;

    (updatedDish as any).publishedAt = (existingDish as any)?.publishedAt || new Date().toISOString().split('T')[0];
    (updatedDish as any).formattedDate =
      (existingDish as any)?.formattedDate ||
      new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

    const success = saveDish(updatedDish);
    if (success) {
      setIsDirty(false);
      setPublicationStatus(finalStatus);
      const statusMessage =
        finalStatus === 'published'
          ? isEditing
            ? 'Yemek kaydı güncellendi ve yayında.'
            : 'Yeni yemek envantere eklendi ve yayımlandı.'
          : finalStatus === 'in_review'
          ? 'Yemek kaydı inceleme onayına gönderildi (henüz yayında değil).'
          : finalStatus === 'archived'
          ? 'Yemek kaydı arşivlendi ve portaldan kaldırıldı.'
          : 'Yemek kaydı taslak olarak kaydedildi (ziyaretçilere kapalıdır).';
      setNotification({
        type: 'success',
        message: statusMessage,
      });
      setTimeout(() => {
        navigate('/yonetim/yemekler');
      }, 700);
    } else {
      setNotification({ type: 'error', message: 'Kayıt sırasında bir hata oluştu.' });
    }
  };

  const handleDelete = () => {
    if (!id || !canDelete) return;
    const success = deleteDish(id);
    if (success) {
      navigate('/yonetim/yemekler');
    } else {
      setNotification({ type: 'error', message: 'Kayıt silinemedi.' });
      setShowDeleteModal(false);
    }
  };

  const effectiveSaveStatus: PublicationStatus =
    !canPublish && (publicationStatus === 'published' || publicationStatus === 'archived')
      ? 'in_review'
      : publicationStatus;

  const primaryButtonLabel =
    effectiveSaveStatus === 'published'
      ? isEditing
        ? 'Kaydet ve Yayımla'
        : 'Kaydet ve Yayımla'
      : effectiveSaveStatus === 'in_review'
      ? 'İncelemeye Gönder'
      : effectiveSaveStatus === 'archived'
      ? 'Arşivle ve Kaydet'
      : 'Taslağı Kaydet';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/yonetim/yemekler"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-2xs"
            title="Listeye Geri Dön"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
                {isEditing ? (name ? `Yemek Düzenle: ${name}` : 'Yemek Düzenleme') : 'Yeni Yöresel Yemek Tanımla'}
              </h1>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${
                  publicationStatus === 'published'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : publicationStatus === 'in_review'
                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                    : publicationStatus === 'archived'
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {publicationStatus === 'published'
                  ? 'Yayında'
                  : publicationStatus === 'in_review'
                  ? 'İncelemede'
                  : publicationStatus === 'archived'
                  ? 'Arşivde'
                  : 'Taslak'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? 'Mevcut yemek kaydı içeriklerini, malzemelerini ve ocaklık hazırlıklarını güncelleyin.'
                : 'İslahiye Lezzet Atlası envanterine yeni yöresel yemek kaydı oluşturun.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {Object.keys(errors).length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>{Object.keys(errors).length} eksik alan</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'form' ? 'preview' : 'form')}
            className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <Eye className="w-4 h-4 text-slate-400" />
            <span>{activeTab === 'form' ? 'Önizle' : 'Forma Dön'}</span>
          </button>

          {canSave && publicationStatus !== 'draft' && (
            <button
              type="button"
              onClick={() => handleSave('draft')}
              className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <Save className="w-4 h-4 text-slate-400" />
              <span>Taslak Sakla</span>
            </button>
          )}

          <button
            type="button"
            disabled={!canSave}
            onClick={() => handleSave()}
            title={!canSave ? 'Aktif rolünüzle kayıt kaydedemezsiniz' : undefined}
            className="h-9 px-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition shadow-2xs disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            <span>{primaryButtonLabel}</span>
          </button>

          {isEditing && canDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="h-9 w-9 inline-flex items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
              title="Kaydı Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Viewport Toast for Guaranteed Visibility */}
      <FormNotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
      />

      {/* Unsaved Changes Banner */}
      {isDirty && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Kaydedilmemiş değişiklikleriniz var. Sayfadan ayrılmadan önce lütfen kaydedin.</span>
        </div>
      )}

      {/* Main Form or Preview Tab */}
      {activeTab === 'preview' ? (
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200/90 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              Ziyaretçi Portalı Kart Önizlemesi
            </h3>
            <p className="text-xs text-slate-500">
              Bu lezzet portalda ziyaretçilere bu şekilde gösterilecektir.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
              <ImageWithFallback
                src={imageUrl}
                alt={name}
                fallbackText={name}
                containerClassName="w-full h-full"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[11px] font-semibold">
                  {getCategoryLabel('dish', category, existingDish?.categoryLabel || category)}
                </span>
                {isRegisteredGI && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white text-[11px] font-semibold">
                    {existingDish?.id === 'islahiye-biberi' ? 'TÜRKPATENT #991' : 'Coğrafi İşaret Beyanı'}
                  </span>
                )}
              </div>
            </div>

            <div className="p-5 space-y-3 font-sans">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {prepTime} + {cookTime}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {servings}
                </span>
              </div>

              <h4 className="text-lg font-bold text-slate-900 leading-snug">
                {name || 'Yemek Adı'}
              </h4>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                {description || 'Yemek açıklaması...'}
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">{originNote}</span>
                <span className="font-semibold text-emerald-700">Lezzet Detayı →</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-6"
        >
          {/* Section 1: Temel Bilgiler */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center border border-emerald-100">
                1
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Temel Lezzet Tanımı ve Kimliği
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div id="field-name" className="transition-all rounded-lg">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Yemek Adı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Örn: Geleneksel İslahiye Tavası"
                  className={`w-full h-10 px-3.5 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.name
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-600'
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Kategori <span className="text-rose-500">*</span>
                  </label>
                  <QuickCategoryButton
                    scope="dish"
                    onCreated={(cat) => {
                      setCategory(cat.id as Exclude<DishCategory, 'all'>);
                      setIsDirty(true);
                    }}
                  />
                </div>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as Exclude<DishCategory, 'all'>);
                    setIsDirty(true);
                  }}
                  className="w-full h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                >
                  {mergeCategoryOption(
                    getCategories('dish', true),
                    category,
                    'dish',
                    getCategoryLabel('dish', category, existingDish?.categoryLabel)
                  ).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kısa Vurgu / Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => {
                  setTagline(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Örn: Meşe odunu közünde pişen kuzu eti ve İslahiye biberi"
                className="w-full h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div id="field-description" className="transition-all rounded-lg">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Detaylı Lezzet Açıklaması <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Yemeğin içeriği, fırın veya ocaklık usulü lezzet profili..."
                className={`w-full p-3.5 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.description
                    ? 'border-rose-400 focus:ring-rose-500/20'
                    : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-600'
                }`}
              />
              {errors.description && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kültürel Bellek ve Ocaklık Notu
                </label>
                <input
                  type="text"
                  value={culturalNote}
                  onChange={(e) => {
                    setCulturalNote(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Örn: Sabahın erken saatlerinde meşe odunu ateşiyle pişirilir"
                  className="w-full h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Menşe / Gelenek Notu
                </label>
                <input
                  type="text"
                  value={originNote}
                  onChange={(e) => {
                    setOriginNote(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Örn: İslahiye Taş Fırın Geleneği"
                  className="w-full h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Görsel ve Medya */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center border border-emerald-100">
                2
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Görsel ve Medya Tanımları
              </h3>
            </div>

            <div id="field-imageUrl" className="transition-all rounded-xl">
              <ImageUploadField
                value={imageUrl}
                onChange={(url) => {
                  setImageUrl(url);
                  setIsDirty(true);
                }}
                altText={imageAlt}
                onAltTextChange={(alt) => {
                  setImageAlt(alt);
                  setIsDirty(true);
                }}
                credit={imageCredit}
                onCreditChange={(credit) => {
                  setImageCredit(credit);
                  setIsDirty(true);
                }}
                label="Yemek Fotoğrafı"
                error={errors.imageUrl}
                required
              />
            </div>
          </div>

          {/* Section 3: Hazırlık ve Porsiyon */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center border border-emerald-100">
                3
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Hazırlık, Pişirme ve Porsiyon Parametreleri
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Hazırlık Süresi
                </label>
                <input
                  type="text"
                  value={prepTime}
                  onChange={(e) => {
                    setPrepTime(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="25 dk"
                  className="w-full h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pişirme Süresi
                </label>
                <input
                  type="text"
                  value={cookTime}
                  onChange={(e) => {
                    setCookTime(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="45 dk"
                  className="w-full h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Porsiyon Ölçüsü
                </label>
                <input
                  type="text"
                  value={servings}
                  onChange={(e) => {
                    setServings(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="4-6 Kişilik"
                  className="w-full h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Zorluk Seviyesi
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => {
                    setDifficulty(e.target.value as 'Kolay' | 'Orta' | 'Ustalık Gerektirir');
                    setIsDirty(true);
                  }}
                  className="w-full h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                >
                  <option value="Kolay">Kolay</option>
                  <option value="Orta">Orta</option>
                  <option value="Ustalık Gerektirir">Ustalık Gerektirir</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                İlişkili Tarif (Tarif Atölyesi Bağlantısı)
              </label>
              <select
                value={recipeId}
                onChange={(e) => {
                  setRecipeId(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
              >
                <option value="">-- Tarif Yok (Yalnızca Lezzet Detayı Gösterilir) --</option>
                {availableRecipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 4: Yayın ve Tescil Durumu */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center border border-emerald-100">
                4
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Yayın ve Coğrafi İşaret Durumu
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Yayın Durumu
                </label>
                <select
                  value={publicationStatus}
                  disabled={!canSave}
                  onChange={(e) => {
                    setPublicationStatus(e.target.value as PublicationStatus);
                    setIsDirty(true);
                  }}
                  className="w-full h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white disabled:bg-slate-50"
                >
                  <option value="published" disabled={!canPublish}>
                    Yayında (Portalda görünür){!canPublish ? ' — Yayın yetkisi gerekir' : ''}
                  </option>
                  <option value="draft">Taslak (Yalnızca yönetimde görünür)</option>
                  <option value="in_review">İncelemede (Onay bekliyor)</option>
                  <option value="archived" disabled={!canPublish}>
                    Arşivde{!canPublish ? ' — Yayın yetkisi gerekir' : ''}
                  </option>
                </select>
              </div>

              <div className="flex flex-col justify-center pt-5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isRegisteredGI}
                    onChange={(e) => {
                      setIsRegisteredGI(e.target.checked);
                      setIsDirty(true);
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    TÜRKPATENT Resmî Coğrafi İşaret Tescilli Ürün
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 mt-1 pl-6">
                  Yalnızca resmî sicilde tescilli İslahiye Biberi (Tescil No: 991) için tescil atfı yapınız.
                </p>
              </div>
            </div>
          </div>

          {/* Form Bottom Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <div>
              {Object.keys(errors).length > 0 && (
                <button
                  type="button"
                  onClick={() => scrollToField(Object.keys(errors)[0])}
                  className="flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl border border-rose-200 transition cursor-pointer"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{Object.keys(errors).length} alanda eksik bilgi var (Düzeltmek için tıkla)</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/yonetim/yemekler"
                className="h-10 px-4 inline-flex items-center text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Vazgeç
              </Link>

              {canSave && publicationStatus !== 'draft' && (
                <button
                  type="button"
                  onClick={() => handleSave('draft')}
                  className="h-10 px-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                >
                  <Save className="w-4 h-4 text-slate-400" />
                  <span>Taslak Sakla</span>
                </button>
              )}

              <button
                type="button"
                disabled={!canSave}
                onClick={() => handleSave()}
                title={!canSave ? 'Aktif rolünüzle kayıt kaydedemezsiniz' : undefined}
                className="h-10 px-5 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition shadow-2xs cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                <span>{primaryButtonLabel}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Delete Confirmation Modal */}
      <ActionConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Yemeği Envanterden Sil"
        message={`"${name}" kaydını envanterden kaldırmak istediğinize emin misiniz?`}
        confirmText="Evet, Kalıcı Olarak Sil"
        cancelText="Vazgeç"
        variant="danger"
      />
    </div>
  );
};
