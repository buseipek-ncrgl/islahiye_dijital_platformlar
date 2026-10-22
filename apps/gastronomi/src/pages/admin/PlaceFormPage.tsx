import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Trash2,
  Eye,
  Clock,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import {
  GastronomyPlace,
  PlaceCategory,
  PublicationStatus,
  VerificationStatus,
} from '../../types';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';

const PLACE_CATEGORIES: { id: PlaceCategory; label: string }[] = [
  { id: 'restaurant', label: 'Restoran & Lokanta' },
  { id: 'producer', label: 'Üretici & Çiftlik' },
  { id: 'oven', label: 'Geleneksel Taş Fırın' },
  { id: 'cooperative', label: 'Kadın Kooperatifi' },
  { id: 'market', label: 'Yöresel Çarşı & Pazar' },
  { id: 'other', label: 'Diğer Gastronomi Noktası' },
];

export const PlaceFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const {
    getPlaceById,
    savePlace,
    deletePlace,
    getDishes,
    getArtisans,
    getMediaItems,
  } = useContent();

  const allDishes = getDishes(false);
  const allArtisans = getArtisans(false);
  const mediaItems = getMediaItems();

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [hasNoCoordinates, setHasNoCoordinates] = useState(false);

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
      lat: 37.025,
      lng: 36.632,
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
    isDemo: true, // Default to demo for synthetic testing
    publicationStatus: 'draft',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (isEditing && id) {
      const existing = getPlaceById(id);
      if (existing) {
        setFormData({ ...existing });
        if (!existing.coordinates) {
          setHasNoCoordinates(true);
        }
      } else {
        alert('Ziyaret noktası kaydı bulunamadı.');
        navigate('/yonetim/harita?tab=places');
      }
    }
  }, [id, isEditing, getPlaceById, navigate]);

  const handleCategoryChange = (cat: PlaceCategory) => {
    const found = PLACE_CATEGORIES.find((c) => c.id === cat);
    setFormData((prev) => ({
      ...prev,
      category: cat,
      categoryLabel: found ? found.label : 'Gastronomi Noktası',
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
  const validateForm = (isPublishing: boolean): string | null => {
    if (!formData.name?.trim()) {
      return 'İşletme veya nokta adı zorunludur.';
    }
    if (!formData.address?.trim()) {
      return 'Açık adres bilgisi zorunludur.';
    }

    if (!hasNoCoordinates) {
      const lat = formData.coordinates?.lat;
      const lng = formData.coordinates?.lng;
      if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) {
        return 'Enlem (Latitude) -90 ile 90 arasında geçerli bir sayı olmalıdır.';
      }
      if (typeof lng !== 'number' || isNaN(lng) || lng < -180 || lng > 180) {
        return 'Boylam (Longitude) -180 ile 180 arasında geçerli bir sayı olmalıdır.';
      }
    }

    // Strict verification rules if published as verified
    if (isPublishing && formData.verificationStatus === 'verified') {
      if (!formData.verificationSource?.trim()) {
        return 'Doğrulanmış olarak yayımlamak için resmî veya fiziki bir "Konum Doğrulama Kaynağı" belirtilmesi zorunludur.';
      }
      if (hasNoCoordinates || !formData.coordinates) {
        return 'Doğrulanmış bir işletmenin geçerli GPS koordinatları bulunmalıdır.';
      }
    }

    return null;
  };

  const handleSave = (targetStatus?: PublicationStatus) => {
    const nextStatus = targetStatus || formData.publicationStatus || 'draft';
    const isPublishing = nextStatus === 'published';

    const error = validateForm(isPublishing);
    if (error) {
      alert(`Doğrulama Uyarısı:\n${error}`);
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
      websiteUrl: formData.websiteUrl || '',
      infoSource: formData.infoSource || 'İslahiye Yerel Saha Kayıtları',
      verificationSource: formData.verificationSource || '',
      lastVerifiedDate: formData.lastVerifiedDate || new Date().toISOString().split('T')[0],
      verificationStatus: formData.verificationStatus || 'unverified',
      isDemo: Boolean(formData.isDemo),
      publicationStatus: nextStatus,
    };

    const success = savePlace(payload);
    if (success) {
      showToast(
        nextStatus === 'published'
          ? 'Ziyaret noktası başarıyla kaydedildi ve yayımlandı.'
          : 'Ziyaret noktası taslak olarak kaydedildi.'
      );
      setTimeout(() => {
        navigate('/yonetim/harita?tab=places');
      }, 700);
    } else {
      alert('Kayıt sırasında bir hata oluştu.');
    }
  };

  const handleDelete = () => {
    if (!formData.id) return;
    const success = deletePlace(formData.id);
    if (success) {
      showToast('Ziyaret noktası silindi.');
      setShowDeleteConfirm(false);
      navigate('/yonetim/harita?tab=places');
    }
  };

  // Check if this place will be visible on the visitor map
  const willBeVisibleOnVisitorMap =
    formData.publicationStatus === 'published' &&
    formData.verificationStatus === 'verified' &&
    !formData.isDemo &&
    !hasNoCoordinates &&
    Boolean(formData.coordinates) &&
    Boolean(formData.verificationSource?.trim());

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-forest text-white px-5 py-3 rounded-sm shadow-xl flex items-center gap-3 border border-forest-light text-xs font-sans animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-copper-light shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            type="button"
            onClick={() => navigate('/yonetim/harita?tab=places')}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-800 transition-colors mb-2 focus:outline-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ziyaret Noktaları Listesine Dön</span>
          </button>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
            {isEditing ? `Noktayı Düzenle: ${formData.name || 'İsimsiz'}` : 'Yeni Gerçek Ziyaret Noktası Ekle'}
          </h1>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Fiziksel işletme, taş fırın veya üretici noktası için adres, GPS koordinatları ve kurumsal doğrulama kaynağı.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-sm border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
              title="Kaydı Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center bg-slate-100 p-1 rounded-sm border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors ${
                activeTab === 'editor'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Düzenleyici
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors ${
                activeTab === 'preview'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Önizleme</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleSave('draft')}
            className="px-4 py-2 rounded-sm border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
          >
            Taslak Kaydet
          </button>

          <button
            type="button"
            onClick={() => handleSave('published')}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-sm bg-forest hover:bg-forest-800 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Yayımla</span>
          </button>
        </div>
      </div>

      {/* Institutional Verification Notice Banner */}
      <div className={`p-4 rounded-sm border text-xs font-sans flex items-start gap-3 transition-colors ${
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
            <span>Kurumsal Doğrulama & Harita Görünürlük Durumu:</span>
            {willBeVisibleOnVisitorMap ? (
              <span className="px-2 py-0.5 rounded-xs bg-emerald-200 text-emerald-900 font-mono text-[10px] uppercase font-bold">
                Ziyaretçi Haritasında Görünür
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-xs bg-amber-200 text-amber-900 font-mono text-[10px] uppercase font-bold">
                Ziyaretçi Haritasında Gösterilmez (Gizli / Taslak / Demo)
              </span>
            )}
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">
            {willBeVisibleOnVisitorMap
              ? 'Bu kayıt yayınlanmış, resmî/fiziki kaynağı doğrulanmış ve demo olmayan gerçek bir işletmedir. Ziyaretçi "Doğrulanmış Ziyaret Noktaları" haritasında listelenecektir.'
              : 'Platform kurumsal ilkeleri gereği; kaynağı doğrulanmamış, koordinatı eksik veya demo olarak işaretlenmiş işletmeler ziyaretçi haritasında görünmez. Yalnızca CMS içi simülasyon ve önizleme amaçlı saklanır.'}
          </p>
        </div>
      </div>

      {/* TAB 1: FORM EDITOR */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Temel İşletme Bilgileri */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-5">
              <h2 className="text-sm font-bold text-slate-900 font-sans border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <Building className="w-4 h-4 text-forest" />
                <span>1. İşletme veya Nokta Bilgileri</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    İşletme / Nokta Adı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Örn: Tarihi İslahiye Taş Fırını"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category || 'other'}
                    onChange={(e) => handleCategoryChange(e.target.value as PlaceCategory)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:border-forest bg-white"
                  >
                    {PLACE_CATEGORIES.map((cat) => (
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:border-forest"
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
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:border-forest"
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
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:border-forest"
                  />
                </div>
              </div>
            </div>

            {/* 2. Adres & Gerçek Koordinatlar */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-5">
              <h2 className="text-sm font-bold text-slate-900 font-sans border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-forest" />
                  <span>2. Açık Adres & GPS Koordinatları</span>
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-slate-600 font-normal cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasNoCoordinates}
                    onChange={(e) => setHasNoCoordinates(e.target.checked)}
                    className="rounded-xs text-forest focus:ring-forest"
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
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Örn: Hacı Ali Öztürk Cad. No: 14/A, İslahiye / Gaziantep"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:border-forest"
                  />
                </div>

                {!hasNoCoordinates ? (
                  <div className="p-4 bg-slate-50 rounded-sm border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">
                        GPS Koordinat Değerleri (Ondalık Derece)
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        İslahiye Çevresi Referansı: 36.95° - 37.15° N, 36.55° - 36.75° E
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-mono text-slate-600 mb-1">
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
                          className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-sm focus:outline-none focus:border-forest"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono text-slate-600 mb-1">
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
                          className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-sm focus:outline-none focus:border-forest"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-800 font-sans">
                    Noktanın koordinatları henüz kaydedilmemiştir. Gerçek harita üzerinde gösterilebilmesi için fiziksel saha doğrulamasıyla geçerli enlem ve boylam girilmesi şarttır.
                  </div>
                )}
              </div>
            </div>

            {/* 3. İlişkili Yemekler ve Ustalar */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-5">
              <h2 className="text-sm font-bold text-slate-900 font-sans border-b border-slate-100 pb-2.5">
                3. İçerik ve Profil İlişkileri
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Related Dishes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    İlgili Yöresel Yemekler ({formData.relatedDishIds?.length || 0} Seçili)
                  </label>
                  <div className="border border-slate-200 rounded-sm max-h-48 overflow-y-auto p-2 space-y-1 bg-slate-50">
                    {allDishes.map((dish) => {
                      const isChecked = (formData.relatedDishIds || []).includes(dish.id);
                      return (
                        <label
                          key={dish.id}
                          className="flex items-center gap-2 p-1.5 rounded-xs hover:bg-white text-xs text-slate-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleDishToggle(dish.id)}
                            className="rounded-xs text-forest focus:ring-forest"
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
                  <div className="border border-slate-200 rounded-sm max-h-48 overflow-y-auto p-2 space-y-1 bg-slate-50">
                    {allArtisans.length > 0 ? (
                      allArtisans.map((artisan) => {
                        const isChecked = (formData.relatedArtisanIds || []).includes(artisan.id);
                        return (
                          <label
                            key={artisan.id}
                            className="flex items-center gap-2 p-1.5 rounded-xs hover:bg-white text-xs text-slate-800 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleArtisanToggle(artisan.id)}
                              className="rounded-xs text-forest focus:ring-forest"
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
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 font-sans border-b border-slate-100 pb-2.5">
                4. Ziyaret & İletişim Bilgileri
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:border-forest"
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:border-forest"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Column (1 col) */}
          <div className="space-y-6">
            {/* Doğrulama & Yayın Durumu */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-5">
              <h2 className="text-sm font-bold text-slate-900 font-sans border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-forest" />
                <span>Doğrulama & Yayın</span>
              </h2>

              {/* Publication Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yayın Durumu
                </label>
                <select
                  value={formData.publicationStatus || 'draft'}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      publicationStatus: e.target.value as PublicationStatus,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:border-forest bg-white"
                >
                  <option value="draft">Taslak (CMS İçi)</option>
                  <option value="published">Yayında (Doğrulanmışsa Ziyaretçiye Açık)</option>
                  <option value="archived">Arşivlendi</option>
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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:border-forest bg-white"
                >
                  <option value="unverified">Doğrulanmadı (İncelemede)</option>
                  <option value="verified">Fiziki Olarak Doğrulandı</option>
                  <option value="simulated">Demo / Simülasyon</option>
                </select>
              </div>

              {/* Verification Source */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Konum Doğrulama Kaynağı {formData.verificationStatus === 'verified' && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="text"
                  value={formData.verificationSource || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, verificationSource: e.target.value }))
                  }
                  placeholder="Örn: Yerel Saha Denetimi / Tescil Sicil No"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:border-forest"
                />
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
                  placeholder="Örn: İşletme Beyanı & Ticaret Sicil"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:border-forest"
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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:border-forest"
                />
              </div>

              {/* Is Demo Checkbox */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isDemo)}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isDemo: e.target.checked }))}
                    className="mt-0.5 rounded-xs text-forest focus:ring-forest"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Demo / Temsili Kayıt
                    </span>
                    <span className="text-[11px] text-slate-500 font-sans block leading-tight">
                      İşaretlendiğinde kamuya açık haritada kesinlikle yayınlanmaz.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Kapak Görseli */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 font-sans border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <span>Kapak Görseli</span>
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(!showMediaPicker)}
                  className="text-xs font-mono text-copper hover:text-copper-dark"
                >
                  {showMediaPicker ? 'Kapat' : 'Medya Kütüphanesinden Seç'}
                </button>
              </h2>

              {/* Preview Thumbnail */}
              <div className="aspect-[16/10] bg-slate-100 rounded-sm border border-slate-200 overflow-hidden relative">
                <ImageWithFallback
                  src={formData.coverImage || ''}
                  alt={formData.name || 'Görsel'}
                  fallbackText="Görsel Yok"
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-[11px] font-mono text-slate-600 mb-1">
                  Görsel URL:
                </label>
                <input
                  type="text"
                  value={formData.coverImage || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, coverImage: e.target.value }))}
                  placeholder="/images/tas_firin_kozu_poster.jpg"
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-sm focus:outline-none focus:border-forest"
                />
              </div>

              {/* Quick Media Selector Dropdown/Grid */}
              {showMediaPicker && (
                <div className="p-2 border border-slate-200 rounded-sm bg-slate-50 max-h-48 overflow-y-auto grid grid-cols-2 gap-2">
                  {mediaItems.map((media) => (
                    <button
                      key={media.id}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, coverImage: media.src }));
                        setShowMediaPicker(false);
                      }}
                      className="text-left group relative border border-slate-200 rounded-xs overflow-hidden bg-white hover:border-forest"
                    >
                      <div className="aspect-[16/9] w-full overflow-hidden">
                        <img
                          src={media.thumbnailSrc || media.src}
                          alt={media.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-1">
                        <span className="block text-[10px] font-sans font-medium text-slate-800 truncate">
                          {media.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE VISITOR CARD PREVIEW */}
      {activeTab === 'preview' && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="p-4 bg-slate-100 rounded-sm text-center text-xs text-slate-600 font-sans">
            Aşağıdaki görünüm, bu noktanın ziyaretçi haritasında ('Doğrulanmış Ziyaret Noktaları') nasıl sunulacağını göstermektedir.
          </div>

          {/* Place Card Mock */}
          <div className="bg-paper border border-sand/70 rounded-sm p-6 flex flex-col justify-between shadow-xs">
            <div>
              {formData.coverImage && (
                <div className="aspect-[16/10] rounded-sm overflow-hidden mb-4 bg-sand/20">
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
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs bg-forest text-ivory inline-block">
                  {formData.categoryLabel || 'Gastronomi Noktası'}
                </span>
                {formData.isDemo && (
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs bg-amber-100 text-amber-800 border border-amber-300">
                    Demo Simülasyon
                  </span>
                )}
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
              <div className="pt-3 border-t border-sand/40 text-xs text-charcoal/50 font-mono flex items-center justify-between">
                <span>
                  GPS: {formData.coordinates.lat.toFixed(4)}, {formData.coordinates.lng.toFixed(4)}
                </span>
                <span className="text-[10px] text-emerald-700 font-sans font-medium">
                  {formData.verificationStatus === 'verified' ? '✓ Doğrulanmış Konum' : 'İncelemede'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">
                Ziyaret Noktasını Silmek İstiyor musunuz?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              <strong>"{formData.name}"</strong> kaydı kalıcı olarak silinecektir. Dilediğinizde ayarlardan fabrika verilerini geri yükleyebilirsiniz.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-sm border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-sm bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
