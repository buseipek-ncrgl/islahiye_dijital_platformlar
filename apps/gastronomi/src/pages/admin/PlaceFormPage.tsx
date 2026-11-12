import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  MapPin,
  Trash2,
  Eye,
  Clock,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import { useAdminRole } from '../../context/AdminRoleContext';
import {
  GastronomyPlace,
  PlaceCategory,
  PublicationStatus,
  VerificationStatus,
} from '../../types';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { LocationPickerMap } from '../../components/admin/map/LocationPickerMap';
import { ActionConfirmModal } from '../../components/admin/common/ActionConfirmModal';
import { ImageUploadField } from '../../components/admin/common/ImageUploadField';
import { FormNotificationToast, FormNotification } from '../../components/admin/common/FormNotificationToast';
import { QuickCategoryButton } from '../../components/admin/common/QuickCategoryButton';
import { mergeCategoryOption } from '../../data/categories';

export const PlaceFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const { canCreate, canEdit, canDelete, canPublish } = useAdminRole();
  const canSave = isEditing ? canEdit : canCreate;
  const initializedKeyRef = useRef<string | null>(null);

  const {
    getPlaceById,
    savePlace,
    deletePlace,
    getDishes,
    getArtisans,
    getCategories,
    getCategoryLabel,
  } = useContent();

  const allDishes = getDishes(false);
  const allArtisans = getArtisans(false);

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasNoCoordinates, setHasNoCoordinates] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<FormNotification | null>(null);

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

  // Form State
  const [formData, setFormData] = useState<Partial<GastronomyPlace>>({
    id: `place-${Date.now()}`,
    name: '',
    category: 'oven',
    categoryLabel: 'Geleneksel Taş Fırın',
    description: '',
    detailedDescription: '',
    districtOrNeighborhood: 'İslahiye Merkez',
    address: '',
    coordinates: {
      lat: 37.025678,
      lng: 36.631868,
    },
    relatedDishIds: [],
    relatedArtisanIds: [],
    coverImage: '/images/tas_firin_kozu_poster.jpg',
    visitingHours: 'Pazartesi - Cumartesi: 07:00 - 18:00',
    websiteUrl: '',
    infoSource: 'İslahiye Yerel Saha Kayıtları',
    verificationSource: '',
    lastVerifiedDate: new Date().toISOString().split('T')[0],
    verificationStatus: 'unverified',
    isDemo: false,
    publicationStatus: canPublish ? 'published' : 'draft',
  });

  useEffect(() => {
    if (isEditing && id) {
      const existing = getPlaceById(id);
      if (existing) {
        if (initializedKeyRef.current !== existing.id) {
          initializedKeyRef.current = existing.id;
          setFormData({ ...existing });
          setHasNoCoordinates(!existing.coordinates);
        }
      } else if (initializedKeyRef.current !== `__missing__${id}`) {
        initializedKeyRef.current = `__missing__${id}`;
        setNotification({
          type: 'error',
          title: 'Kayıt Bulunamadı',
          message: 'Ziyaret noktası kaydı bulunamadı. Harita listesine yönlendiriliyorsunuz.',
        });
        setTimeout(() => {
          navigate('/yonetim/harita?tab=places');
        }, 1200);
      }
    } else if (!isEditing) {
      const qLat = searchParams.get('lat');
      const qLng = searchParams.get('lng');
      const createKey = `__create__:${qLat || ''}:${qLng || ''}`;
      if (initializedKeyRef.current !== createKey) {
        initializedKeyRef.current = createKey;
        const parsedLat = qLat ? parseFloat(qLat) : NaN;
        const parsedLng = qLng ? parseFloat(qLng) : NaN;
        const hasValidCoords = !isNaN(parsedLat) && !isNaN(parsedLng);
        setFormData({
          id: `place-${Date.now()}`,
          name: '',
          category: 'oven',
          categoryLabel: 'Geleneksel Taş Fırın',
          description: '',
          detailedDescription: '',
          districtOrNeighborhood: 'İslahiye Merkez',
          address: '',
          coordinates: {
            lat: hasValidCoords ? parsedLat : 37.025678,
            lng: hasValidCoords ? parsedLng : 36.631868,
          },
          relatedDishIds: [],
          relatedArtisanIds: [],
          coverImage: '/images/tas_firin_kozu_poster.jpg',
          visitingHours: 'Pazartesi - Cumartesi: 07:00 - 18:00',
          websiteUrl: '',
          infoSource: 'İslahiye Yerel Saha Kayıtları',
          verificationSource: '',
          lastVerifiedDate: new Date().toISOString().split('T')[0],
          verificationStatus: 'unverified',
          isDemo: false,
          publicationStatus: canPublish ? 'published' : 'draft',
        });
        setHasNoCoordinates(false);
        setErrors({});
        setActiveTab('editor');
      }
    }
  }, [id, isEditing, getPlaceById, navigate, searchParams, canPublish]);

  const handleCategoryChange = (cat: PlaceCategory, explicitLabel?: string) => {
    const resolvedLabel = explicitLabel || getCategoryLabel('place', cat, 'Gastronomi Noktası');
    setFormData((prev) => ({
      ...prev,
      category: cat,
      categoryLabel: resolvedLabel,
    }));
  };

  const handleDishToggle = (dishId: string) => {
    setFormData((prev) => {
      const current = prev.relatedDishIds || [];
      if (current.includes(dishId)) {
        return { ...prev, relatedDishIds: current.filter((i) => i !== dishId) };
      }
      return { ...prev, relatedDishIds: [...current, dishId] };
    });
  };

  const handleArtisanToggle = (artisanId: string) => {
    setFormData((prev) => {
      const current = prev.relatedArtisanIds || [];
      if (current.includes(artisanId)) {
        return { ...prev, relatedArtisanIds: current.filter((i) => i !== artisanId) };
      }
      return { ...prev, relatedArtisanIds: [...current, artisanId] };
    });
  };

  // Validation
  const validateForm = (isPublishing: boolean): boolean => {
    const newErrors: Record<string, string> = {};
    const fieldDetails: { name: string; label: string; message: string }[] = [];

    if (!formData.name?.trim()) {
      const msg = 'İşletme veya nokta adı zorunludur.';
      newErrors.name = msg;
      fieldDetails.push({ name: 'name', label: 'İşletme Adı', message: msg });
    }
    if (!formData.address?.trim()) {
      const msg = 'Açık adres bilgisi zorunludur.';
      newErrors.address = msg;
      fieldDetails.push({ name: 'address', label: 'Açık Adres', message: msg });
    }

    if (!hasNoCoordinates) {
      const lat = formData.coordinates?.lat;
      const lng = formData.coordinates?.lng;
      if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) {
        const msg = 'Enlem (Latitude) -90 ile 90 arasında geçerli bir sayı olmalıdır.';
        newErrors.coordinates = msg;
        fieldDetails.push({ name: 'coordinates', label: 'GPS Enlem', message: msg });
      }
      if (typeof lng !== 'number' || isNaN(lng) || lng < -180 || lng > 180) {
        const msg = 'Boylam (Longitude) -180 ile 180 arasında geçerli bir sayı olmalıdır.';
        newErrors.coordinates = msg;
        fieldDetails.push({ name: 'coordinates', label: 'GPS Boylam', message: msg });
      }
    }

    // Strict verification rules if published as verified
    if (isPublishing && formData.verificationStatus === 'verified') {
      if (!formData.verificationSource?.trim()) {
        const msg = 'Doğrulanmış olarak yayımlamak için resmî veya fiziki bir "Konum Doğrulama Kaynağı" belirtilmesi zorunludur.';
        newErrors.verificationSource = msg;
        fieldDetails.push({ name: 'verificationSource', label: 'Konum Doğrulama Kaynağı', message: msg });
      }
      if (hasNoCoordinates || !formData.coordinates) {
        const msg = 'Doğrulanmış bir işletmenin geçerli GPS koordinatları bulunmalıdır.';
        newErrors.coordinates = msg;
        fieldDetails.push({ name: 'coordinates', label: 'GPS Koordinatları', message: msg });
      }
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

      // Automatically smoothly scroll and focus the very first missing field!
      scrollToField(fieldDetails[0].name);
      return false;
    }

    return true;
  };

  const handleSave = (targetStatus?: PublicationStatus) => {
    if (!canSave) {
      setNotification({
        type: 'error',
        title: 'Yetki Yetersiz',
        message: 'Aktif rolünüzle ziyaret noktası kaydı oluşturma veya düzenleme yetkiniz bulunmuyor.',
      });
      return;
    }

    const requestedStatus = targetStatus || formData.publicationStatus || 'published';
    const nextStatus: PublicationStatus =
      !canPublish && (requestedStatus === 'published' || requestedStatus === 'archived')
        ? 'in_review'
        : requestedStatus;
    const isPublishing = nextStatus === 'published';

    if (!validateForm(isPublishing)) {
      return;
    }

    const payload: GastronomyPlace = {
      id: formData.id || `place-${Date.now()}`,
      name: formData.name!.trim(),
      category: formData.category || 'other',
      categoryLabel: formData.categoryLabel || 'Gastronomi Noktası',
      description: formData.description || '',
      detailedDescription: formData.detailedDescription || '',
      districtOrNeighborhood: formData.districtOrNeighborhood || '',
      address: formData.address!.trim(),
      coordinates: hasNoCoordinates ? null : formData.coordinates || null,
      relatedDishIds: formData.relatedDishIds || [],
      relatedArtisanIds: formData.relatedArtisanIds || [],
      coverImage: formData.coverImage || '',
      visitingHours: formData.visitingHours || '',
      websiteUrl: formData.websiteUrl?.trim() || '',
      infoSource: formData.infoSource || 'İslahiye Yerel Saha Kayıtları',
      verificationSource: formData.verificationSource?.trim() || undefined,
      lastVerifiedDate: formData.lastVerifiedDate || new Date().toISOString().split('T')[0],
      verificationStatus: formData.verificationStatus || 'unverified',
      isDemo: Boolean(formData.isDemo),
      publicationStatus: nextStatus,
    };

    const success = savePlace(payload);
    if (success) {
      setFormData((prev) => ({ ...prev, publicationStatus: nextStatus }));
      setNotification({
        type: 'success',
        message:
          nextStatus === 'published'
            ? 'Ziyaret noktası başarıyla kaydedildi ve sokak haritasında yayımlandı.'
            : nextStatus === 'in_review'
            ? 'Ziyaret noktası yayın onayı için incelemeye alındı (henüz yayında değil).'
            : nextStatus === 'archived'
            ? 'Ziyaret noktası arşivlendi ve haritadan kaldırıldı.'
            : 'Ziyaret noktası taslak olarak kaydedildi (ziyaretçilere kapalıdır).',
      });
      setTimeout(() => {
        navigate('/yonetim/harita?tab=places');
      }, 900);
    } else {
      setNotification({
        type: 'error',
        message: 'Kayıt sırasında bir hata oluştu.',
      });
    }
  };

  const handleDelete = () => {
    if (!formData.id || !canDelete) return;
    const success = deletePlace(formData.id);
    if (success) {
      setNotification({
        type: 'success',
        message: 'Ziyaret noktası silindi.',
      });
      setShowDeleteConfirm(false);
      setTimeout(() => {
        navigate('/yonetim/harita?tab=places');
      }, 700);
    }
  };

  const currentPubStatus: PublicationStatus = formData.publicationStatus || 'draft';
  const effectiveSaveStatus: PublicationStatus =
    !canPublish && (currentPubStatus === 'published' || currentPubStatus === 'archived')
      ? 'in_review'
      : currentPubStatus;

  const primaryButtonLabel =
    effectiveSaveStatus === 'published'
      ? 'Kaydet ve Yayımla'
      : effectiveSaveStatus === 'in_review'
      ? 'İncelemeye Gönder'
      : effectiveSaveStatus === 'archived'
      ? 'Arşivle ve Kaydet'
      : 'Taslağı Kaydet';

  // Check if this place will be visible on the visitor map
  const willBeVisibleOnVisitorMap =
    formData.publicationStatus === 'published' &&
    formData.verificationStatus === 'verified' &&
    !formData.isDemo &&
    !hasNoCoordinates &&
    Boolean(formData.coordinates) &&
    Boolean(formData.verificationSource?.trim());

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans">
      {/* Floating Viewport Toast for Notifications & Validation */}
      <FormNotificationToast notification={notification} onClose={() => setNotification(null)} />

      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/yonetim/harita?tab=places')}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-2xs"
            title="Harita listesine dön"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
                {isEditing ? `Noktayı Düzenle: ${formData.name || 'İsimsiz'}` : 'Yeni Gerçek Ziyaret Noktası Ekle'}
              </h1>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${
                  currentPubStatus === 'published'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : currentPubStatus === 'in_review'
                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                    : currentPubStatus === 'archived'
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {currentPubStatus === 'published'
                  ? 'Yayında'
                  : currentPubStatus === 'in_review'
                  ? 'İncelemede'
                  : currentPubStatus === 'archived'
                  ? 'Arşivde'
                  : 'Taslak'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Fiziksel işletme, taş fırın veya üretici noktası için adres, GPS koordinatları ve kurumsal doğrulama kaynağı.
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

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Düzenleyici
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>Önizleme</span>
            </button>
          </div>

          {canSave && currentPubStatus !== 'draft' && (
            <button
              type="button"
              onClick={() => handleSave('draft')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
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
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{primaryButtonLabel}</span>
          </button>

          {isEditing && canDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-9 w-9 inline-flex items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
              title="Kaydı Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Institutional Verification Notice Banner */}
      <div className={`p-4 rounded-xl border text-xs font-sans flex items-start gap-3 transition-colors ${
        willBeVisibleOnVisitorMap
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        {willBeVisibleOnVisitorMap ? (
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        )}
        <div className="space-y-1">
          <div className="font-bold flex items-center gap-2">
            <span>Kurumsal Doğrulama &amp; Harita Görünürlük Durumu:</span>
            {willBeVisibleOnVisitorMap ? (
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-200 text-emerald-900 font-sans text-[11px] font-bold">
                Ziyaretçi Haritasında Görünür
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-md bg-amber-200 text-amber-900 font-sans text-[11px] font-bold">
                Ziyaretçi Haritasında Gösterilmez (Taslak / Doğrulanmamış)
              </span>
            )}
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">
            {willBeVisibleOnVisitorMap
              ? 'Bu kayıt yayınlanmış, resmî/fiziki kaynağı doğrulanmış gerçek bir işletmedir. Ziyaretçi "Doğrulanmış Ziyaret Noktaları" haritasında listelenecektir.'
              : 'Platform kurumsal ilkeleri gereği; koordinatı eksik veya taslak olarak kaydedilmiş işletmeler ziyaretçi haritasında gösterilmez.'}
          </p>
        </div>
      </div>

      {/* TAB 1: FORM EDITOR */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Temel İşletme Bilgileri */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-5">
              <h2 className="text-sm font-bold text-slate-900 font-sans border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-700" />
                <span>1. İşletme veya Nokta Bilgileri</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    İşletme / Nokta Adı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="field-name"
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, name: e.target.value }));
                      if (errors.name) {
                        setErrors((prev) => {
                          const n = { ...prev };
                          delete n.name;
                          return n;
                        });
                      }
                    }}
                    placeholder="Örn: Tarihi İslahiye Taş Fırını"
                    className={`w-full px-3.5 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${
                      errors.name
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-600'
                    }`}
                  />
                  {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Kategori <span className="text-rose-500">*</span>
                    </label>
                    <QuickCategoryButton
                      scope="place"
                      onCreated={(cat) => handleCategoryChange(cat.id as PlaceCategory, cat.label)}
                    />
                  </div>
                  <select
                    value={formData.category || 'other'}
                    onChange={(e) => handleCategoryChange(e.target.value as PlaceCategory)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white cursor-pointer"
                  >
                    {mergeCategoryOption(
                      getCategories('place', true),
                      formData.category,
                      'place',
                      getCategoryLabel('place', formData.category || 'other', formData.categoryLabel)
                    ).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    İlçe / Mahalle / Mevkii
                  </label>
                  <input
                    type="text"
                    value={formData.districtOrNeighborhood || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, districtOrNeighborhood: e.target.value }))
                    }
                    placeholder="Örn: Cumhuriyet Mah., İslahiye Merkez"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kısa Tanıtım (Harita Kartı)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Harita listesinde ve kart özetinde görünecek 1-2 cümlelik tanıtım..."
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Detaylı Açıklama (İsteğe Bağlı)
                  </label>
                  <textarea
                    rows={4}
                    value={formData.detailedDescription || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, detailedDescription: e.target.value }))
                    }
                    placeholder="İşletmenin üretim tarzı, geleneksel pişirme yöntemleri, kurumsal geçmişi..."
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* 2. Adres & Gerçek Koordinatlar */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-5">
              <h2 className="text-sm font-bold text-slate-900 font-sans border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>2. Açık Adres &amp; GPS Koordinatları</span>
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-slate-600 font-normal cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasNoCoordinates}
                    onChange={(e) => setHasNoCoordinates(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Koordinat henüz doğrulanmadı / belirlenmedi</span>
                </label>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Açık Adres <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="field-address"
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, address: e.target.value }));
                      if (errors.address) {
                        setErrors((prev) => {
                          const n = { ...prev };
                          delete n.address;
                          return n;
                        });
                      }
                    }}
                    placeholder="Örn: Hacı Ali Öztürk Cad. No: 14/A, İslahiye / Gaziantep"
                    className={`w-full px-3.5 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${
                      errors.address
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-600'
                    }`}
                  />
                  {errors.address && <p className="text-[11px] text-rose-500 mt-1">{errors.address}</p>}
                </div>

                {!hasNoCoordinates ? (
                  <div id="field-coordinates" className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">
                        GPS Koordinat Değerleri (Ondalık Derece)
                      </span>
                      <span className="text-[11px] font-sans text-slate-500">
                        İslahiye Referansı: 36.95° - 37.15° N, 36.55° - 36.75° E
                      </span>
                    </div>

                    {errors.coordinates && (
                      <p className="text-xs text-rose-500 font-medium bg-rose-50 p-2 rounded-lg border border-rose-200">
                        {errors.coordinates}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-sans font-medium text-slate-600 mb-1">
                          Enlem (Latitude, -90..+90):
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={formData.coordinates?.lat ?? 37.025}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setFormData((prev) => ({
                              ...prev,
                              coordinates: {
                                lat: isNaN(val) ? 0 : val,
                                lng: prev.coordinates?.lng ?? 36.632,
                              },
                            }));
                          }}
                          className="w-full px-3 py-2 text-xs font-sans border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-sans font-medium text-slate-600 mb-1">
                          Boylam (Longitude, -180..+180):
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={formData.coordinates?.lng ?? 36.632}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setFormData((prev) => ({
                              ...prev,
                              coordinates: {
                                lat: prev.coordinates?.lat ?? 37.025,
                                lng: isNaN(val) ? 0 : val,
                              },
                            }));
                          }}
                          className="w-full px-3 py-2 text-xs font-sans border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <LocationPickerMap
                        lat={formData.coordinates?.lat ?? 37.025678}
                        lng={formData.coordinates?.lng ?? 36.631868}
                        onChangeCoordinates={(coords) => {
                          setFormData((prev) => ({
                            ...prev,
                            coordinates: coords,
                          }));
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-sans">
                    Noktanın koordinatları henüz kaydedilmemiştir. Gerçek harita üzerinde gösterilebilmesi için fiziksel saha doğrulamasıyla geçerli enlem ve boylam girilmesi şarttır.
                  </div>
                )}
              </div>
            </div>

            {/* 3. İlişkili Yemekler ve Ustalar */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-5">
              <h2 className="text-sm font-bold text-slate-900 font-sans border-b border-slate-100 pb-2.5">
                3. İçerik ve Profil İlişkileri
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Related Dishes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    İlgili Yöresel Yemekler ({formData.relatedDishIds?.length || 0} Seçili)
                  </label>
                  <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto p-2 space-y-1 bg-slate-50/70">
                    {allDishes.map((dish) => {
                      const isChecked = (formData.relatedDishIds || []).includes(dish.id);
                      return (
                        <label
                          key={dish.id}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white text-xs text-slate-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleDishToggle(dish.id)}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="truncate">{dish.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Related Artisans */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    İlgili Usta / Üretici ({formData.relatedArtisanIds?.length || 0} Seçili)
                  </label>
                  <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto p-2 space-y-1 bg-slate-50/70">
                    {allArtisans.length > 0 ? (
                      allArtisans.map((artisan) => {
                        const isChecked = (formData.relatedArtisanIds || []).includes(artisan.id);
                        return (
                          <label
                            key={artisan.id}
                            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white text-xs text-slate-800 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleArtisanToggle(artisan.id)}
                              className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className="truncate">{artisan.name} ({artisan.title})</span>
                          </label>
                        );
                      })
                    ) : (
                      <span className="text-xs text-slate-400 p-2 block font-sans">
                        Kayıtlı usta bulunamadı.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Ziyaret & İletişim Bilgileri */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 font-sans border-b border-slate-100 pb-2.5">
                4. Ziyaret &amp; İletişim Bilgileri
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ziyaret / Çalışma Saatleri
                  </label>
                  <input
                    type="text"
                    value={formData.visitingHours || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, visitingHours: e.target.value }))}
                    placeholder="Örn: Pazartesi-Cumartesi 07:00 - 18:00"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Web Sitesi (Varsa Gerçek URL)
                  </label>
                  <input
                    type="url"
                    value={formData.websiteUrl || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, websiteUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Column (1 col) */}
          <div className="space-y-6">
            {/* Doğrulama & Yayın Durumu */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-5">
              <h2 className="text-sm font-bold text-slate-900 font-sans border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Doğrulama &amp; Yayın</span>
              </h2>

              {/* Publication Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yayın Durumu
                </label>
                <select
                  value={currentPubStatus}
                  disabled={!canSave}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      publicationStatus: e.target.value as PublicationStatus,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white cursor-pointer disabled:bg-slate-50"
                >
                  <option value="draft">Taslak (CMS İçi)</option>
                  <option value="in_review">İncelemede (Onay bekliyor)</option>
                  <option value="published" disabled={!canPublish}>
                    Yayında (Doğrulanmışsa Ziyaretçiye Açık){!canPublish ? ' — Yayın yetkisi gerekir' : ''}
                  </option>
                  <option value="archived" disabled={!canPublish}>
                    Arşivlendi{!canPublish ? ' — Yayın yetkisi gerekir' : ''}
                  </option>
                </select>
              </div>

              {/* Verification Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Doğrulama Statüsü
                </label>
                <select
                  value={formData.verificationStatus || 'unverified'}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      verificationStatus: e.target.value as VerificationStatus,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white cursor-pointer"
                >
                  <option value="unverified">Doğrulanmadı (İncelemede)</option>
                  <option value="verified">Fiziki Olarak Doğrulandı</option>
                </select>
              </div>

              {/* Verification Source */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Konum Doğrulama Kaynağı {formData.verificationStatus === 'verified' && <span className="text-rose-500">*</span>}
                </label>
                <input
                  id="field-verificationSource"
                  type="text"
                  value={formData.verificationSource || ''}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, verificationSource: e.target.value }));
                    if (errors.verificationSource) {
                      setErrors((prev) => {
                        const n = { ...prev };
                        delete n.verificationSource;
                        return n;
                      });
                    }
                  }}
                  placeholder="Örn: Yerel Saha Denetimi / Tescil Sicil No"
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${
                    errors.verificationSource
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-600'
                  }`}
                />
                {errors.verificationSource && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.verificationSource}</p>
                )}
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Doğrulanmış yayın için saha belgesi veya resmî sicil kaydı zorunludur.
                </span>
              </div>

              {/* Info Source */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bilgi Kaynağı
                </label>
                <input
                  type="text"
                  value={formData.infoSource || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, infoSource: e.target.value }))}
                  placeholder="Örn: İşletme Beyanı &amp; Ticaret Sicil"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Last Verified Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Son Doğrulama Tarihi
                </label>
                <input
                  type="date"
                  value={formData.lastVerifiedDate || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, lastVerifiedDate: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Kapak Görseli */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <ImageUploadField
                value={formData.coverImage || ''}
                onChange={(url) => setFormData((prev) => ({ ...prev, coverImage: url }))}
                label="İşletme / Mekan Kapak Görseli"
              />
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
                Tüm zorunlu alanlar doldurulduğunda kayıt doğrudan harita sistemine işlenecektir.
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <Link
                to="/yonetim/harita?tab=places"
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Vazgeç
              </Link>
              {canSave && currentPubStatus !== 'draft' && (
                <button
                  type="button"
                  onClick={() => handleSave('draft')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
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
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{primaryButtonLabel}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE VISITOR CARD PREVIEW */}
      {activeTab === 'preview' && (
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200/90 shadow-2xs max-w-2xl mx-auto space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Ziyaretçi Portalı Canlı Önizlemesi
              </h3>
              <p className="text-xs text-slate-500">
                Bu nokta ziyaretçi haritasında ("Doğrulanmış Ziyaret Noktaları") aşağıdaki görünümle sunulacaktır.
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
              {currentPubStatus === 'published' ? 'Yayında' : currentPubStatus === 'in_review' ? 'İncelemede' : currentPubStatus === 'archived' ? 'Arşivde' : 'Taslak'}
            </span>
          </div>

          <div className="max-w-md mx-auto">
          {/* Place Card Mock */}
          <div className="bg-paper border border-sand/70 rounded-xl p-6 flex flex-col justify-between shadow-xs">
            <div>
              {formData.coverImage && (
                <div className="aspect-[16/10] rounded-lg overflow-hidden mb-4 bg-sand/20">
                  <ImageWithFallback
                    src={formData.coverImage}
                    alt={formData.name || 'Görsel'}
                    fallbackText={formData.name || 'İşletme'}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-forest text-ivory inline-block">
                  {formData.categoryLabel || 'Gastronomi Noktası'}
                </span>
              </div>

              <h3 className="text-xl font-display font-bold text-forest mb-2">
                {formData.name || 'İsimsiz İşletme'}
              </h3>

              <p className="text-xs text-charcoal/70 leading-relaxed font-sans mb-4">
                {formData.description || 'Henüz bir açıklama girilmedi.'}
              </p>

              <div className="flex items-start gap-1.5 text-xs text-charcoal/60 mb-3 font-sans">
                <MapPin className="w-3.5 h-3.5 text-copper shrink-0 mt-0.5" />
                <span>{formData.address || 'Adres belirtilmedi.'}</span>
              </div>

              {formData.visitingHours && (
                <div className="flex items-center gap-1.5 text-xs text-charcoal/60 mb-3 font-sans">
                  <Clock className="w-3.5 h-3.5 text-copper shrink-0" />
                  <span>{formData.visitingHours}</span>
                </div>
              )}
            </div>

            {formData.coordinates && !hasNoCoordinates && (
              <div className="pt-3 border-t border-sand/40 text-xs text-charcoal/50 font-sans flex items-center justify-between">
                <span className="tabular-nums">
                  GPS: {formData.coordinates.lat.toFixed(4)}, {formData.coordinates.lng.toFixed(4)}
                </span>
                <span className="text-[10px] text-emerald-700 font-sans font-medium">
                  {formData.verificationStatus === 'verified' ? '✓ Doğrulanmış Konum' : 'İncelemede'}
                </span>
              </div>
            )}
          </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ActionConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Ziyaret Noktasını Sil"
        message={`"${formData.name}" kaydı gastronomi envanterinden kalıcı olarak silinecektir. Bu işlem geri alınamaz.`}
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        variant="danger"
      />
    </div>
  );
};
