import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Info,
  ShieldCheck,
  Globe,
  Eye,
} from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import {
  Artisan,
  PublicationStatus,
} from '../../types';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';

export const ArtisanFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const {
    getArtisanById,
    saveArtisan,
    getDishes,
    getCulturalStories,
    getMediaItems,
  } = useContent();

  const allDishes = getDishes(false);
  const allStories = getCulturalStories(false);
  const mediaItems = getMediaItems();

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Artisan>>({
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
    villageOrNeighborhood: 'İslahiye Çarşısı',
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
    isDemo: true, // Marked demo by default if synthetic entry
    visitInfo: {
      address: '',
      contactPhone: '',
      note: '',
    },
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (isEditing && id) {
      const existing = getArtisanById(id);
      if (existing) {
        setFormData({ ...existing });
      } else {
        alert('Usta veya üretici kaydı bulunamadı.');
        navigate('/yonetim/ustalar');
      }
    }
  }, [id, isEditing, getArtisanById, navigate]);

  const handleCraftCategoryChange = (cat: Artisan['craftCategory']) => {
    let label = 'Taş Fırın & Ocaklık';
    if (cat === 'agriculture') label = 'Toprak & Biber Üreticisi';
    else if (cat === 'pastry') label = 'Geleneksel Kömbe & Hamur';
    else if (cat === 'craft') label = 'Mutfak El Sanatları';

    setFormData((prev) => ({
      ...prev,
      craftCategory: cat,
      craftCategoryLabel: label,
    }));
  };

  const handleSubmit = (targetStatus?: PublicationStatus) => {
    if (!formData.name?.trim() || !formData.biography?.trim()) {
      alert('Lütfen ad/soyad ve kısa biyografi alanlarını eksiksiz doldurunuz.');
      return;
    }

    if (targetStatus === 'published' && !formData.publicationPermissionGranted) {
      alert(
        'Kural Uyarısı: Resmî görsel ve biyografi kullanım izni (muvafakatname) bulunmayan usta veya üretici profilleri yayımlanamaz.'
      );
      return;
    }

    const artisanToSave: Artisan = {
      id: formData.id || `artisan-${Date.now()}`,
      name: formData.name.trim(),
      businessName: formData.businessName?.trim() || undefined,
      profileType: formData.profileType || 'master',
      title: formData.title?.trim() || 'Zanaatkâr',
      craftCategory: formData.craftCategory || 'bakery',
      craftCategoryLabel: formData.craftCategoryLabel || 'Taş Fırın & Ocaklık',
      biography: formData.biography.trim(),
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
      publicationStatus: targetStatus || formData.publicationStatus || 'draft',
      isDemo: formData.isDemo ?? true,
      visitInfo: formData.visitInfo,
    };

    saveArtisan(artisanToSave);
    showToast(
      targetStatus === 'published'
        ? 'Usta / üretici profili başarıyla yayımlandı!'
        : 'Profil taslak olarak kaydedildi.'
    );

    setTimeout(() => {
      navigate('/yonetim/ustalar');
    }, 700);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-sm bg-forest-900 text-ivory text-xs font-mono shadow-xl border border-sand/40 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-copper-light shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/yonetim/ustalar')}
            className="p-2 rounded-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Geri Dön"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-copper-dark font-semibold">
                ZANAATKÂR & ÜRETİCİ ARŞİVİ
              </span>
              <span className="text-slate-300">•</span>
              <span
                className={`px-1.5 py-0.2 rounded-xs text-[10px] font-mono font-bold uppercase ${
                  formData.publicationStatus === 'published'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {formData.publicationStatus === 'published' ? 'Yayında' : 'Taslak'}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">
              {isEditing ? 'Usta / Üretici Profilini Düzenle' : 'Yeni Usta / Üretici Profili Ekle'}
            </h1>
          </div>
        </div>

        {/* Action Buttons & Tabs */}
        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex items-center border border-slate-200 rounded-sm p-0.5 bg-slate-50 mr-2">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-xs text-xs font-semibold transition-colors ${
                activeTab === 'editor'
                  ? 'bg-white text-forest shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Editör
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-xs text-xs font-semibold transition-colors flex items-center gap-1 ${
                activeTab === 'preview'
                  ? 'bg-white text-forest shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Canlı Önizleme</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            className="px-3.5 py-2 rounded-sm border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Taslak Kaydet
          </button>

          <button
            type="button"
            onClick={() => handleSubmit('published')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-forest hover:bg-forest-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Demo Olarak Yayımla</span>
          </button>
        </div>
      </div>

      {/* Corporate Institutional Guard Notice (Section 7) */}
      <div className="p-4 rounded-sm bg-amber-50/70 border border-amber-200 text-amber-900 text-xs font-sans flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block mb-0.5 font-bold">Kişisel Veri ve Mahremiyet İlkesi:</strong>
          AGENTS.md 4. maddesi gereğince, gerçek ve izinli kişi verisi bulunmuyorsa sahte isimler veya sahte profil fotoğrafları üretilmez.
          CMS'de yeni örnek kişi kaydı oluşturulabilir ancak açıkça demo olarak işaretlenmelidir.
          Görsel ve biyografi kullanım izni (muvafakatname) onaylanmadan şahıs profilleri ziyaretçi sayfasına yansıtılamaz.
        </div>
      </div>

      {activeTab === 'editor' ? (
        /* ==================== EDITOR TAB ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Identity Card */}
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                1. KİMLİK & ZANAAT BİLGİSİ
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ad Soyad / Usta Adı <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Örn: Mehmet Usta"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest font-semibold"
                  />
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
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Profil Türü
                  </label>
                  <select
                    value={formData.profileType || 'master'}
                    onChange={(e) => setFormData({ ...formData, profileType: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm bg-white focus:outline-none focus:border-forest"
                  >
                    <option value="master">Geleneksel Ocaklık / Fırın Ustası</option>
                    <option value="producer">Tarımsal Üretici / Çiftçi</option>
                    <option value="cooperative">Kadın Girişimi & Kooperatif</option>
                    <option value="cook">Geleneksel Aşçı / Emektar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Zanaat Kategorisi
                  </label>
                  <select
                    value={formData.craftCategory || 'bakery'}
                    onChange={(e) => handleCraftCategoryChange(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm bg-white focus:outline-none focus:border-forest"
                  >
                    <option value="bakery">Taş Fırın & Ocaklık</option>
                    <option value="agriculture">Toprak & Biber Üretimi</option>
                    <option value="pastry">Geleneksel Kömbe & Hamur</option>
                    <option value="craft">Mutfak El Sanatları</option>
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
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
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
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest font-mono"
                    />
                    <input
                      type="text"
                      value={formData.villageOrNeighborhood || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, villageOrNeighborhood: e.target.value })
                      }
                      placeholder="Mahalle/Köy"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kısa Biyografi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.biography || ''}
                  onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
                  placeholder="Ustanın yetişme hikâyesi, ocaklık hafızası ve zanaat yolculuğu..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest leading-relaxed font-sans"
                />
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
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest leading-relaxed font-sans"
                />
              </div>
            </div>

            {/* Relations Linker */}
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                2. İLİŞKİLİ YEMEKLER & KÜLTÜREL ANLATILAR
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Related Dishes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ustanın İcra Ettiği Yemekler
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-200 rounded-sm p-2 bg-slate-50/50">
                    {allDishes.map((dish) => {
                      const isChecked = (formData.relatedDishIds || []).includes(dish.id);
                      return (
                        <label
                          key={dish.id}
                          className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xs text-xs text-slate-700 cursor-pointer"
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
                            className="rounded-xs text-forest focus:ring-forest"
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
                  <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-200 rounded-sm p-2 bg-slate-50/50">
                    {allStories.map((story) => {
                      const isChecked = (formData.relatedStoryIds || []).includes(story.id);
                      return (
                        <label
                          key={story.id}
                          className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-xs text-xs text-slate-700 cursor-pointer"
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
                            className="rounded-xs text-forest focus:ring-forest"
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
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-copper" />
                <span>3. YAYIN İZNİ & BELGELENDİRME</span>
              </h2>

              {/* Consent Checkbox */}
              <div className="p-3 rounded-sm bg-forest-50/60 border border-forest-200 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.publicationPermissionGranted)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        publicationPermissionGranted: e.target.checked,
                      })
                    }
                    className="mt-0.5 rounded-xs text-forest focus:ring-forest"
                  />
                  <div className="text-xs text-forest-950 font-semibold leading-snug">
                    Görsel ve Biyografi Yayın İzni (Muvafakatname) Alındı
                  </div>
                </label>
                <p className="text-[11px] text-forest-800/80 font-sans leading-relaxed">
                  İzin kutusu işaretlenmeden profil ziyaretçi tarafına aktarılamaz.
                </p>
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
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
                />
              </div>

              {/* Demo profile toggle */}
              <div className="p-3 rounded-sm bg-amber-50/70 border border-amber-200 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isDemo)}
                    onChange={(e) => setFormData({ ...formData, isDemo: e.target.checked })}
                    className="mt-0.5 rounded-xs text-amber-600 focus:ring-amber-500"
                  />
                  <div className="text-xs text-amber-950 font-semibold leading-snug">
                    Temsili Demo Profili Olarak İşaretle
                  </div>
                </label>
                <p className="text-[11px] text-amber-900/80 font-sans leading-relaxed">
                  Henüz resmî saha mülakatı tamamlanmamış örnek kayıtlar için aktiftir. Ziyaretçi arayüzünde 'Temsili Demo Kaydı' etiketi yer alır.
                </p>
              </div>
            </div>

            {/* Media & Visuals */}
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                4. GÖRSEL & MEDYA
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Profil Fotoğrafı Seçimi
                </label>
                <select
                  value={formData.imageUrl || ''}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm bg-white focus:outline-none focus:border-forest mb-2 font-mono"
                >
                  <option value="">Fotoğrafsız Profil</option>
                  {mediaItems.map((m) => (
                    <option key={m.id} value={m.src}>
                      {m.title} ({m.src})
                    </option>
                  ))}
                </select>

                {formData.imageUrl && (
                  <div className="aspect-[4/3] rounded-sm overflow-hidden border border-slate-200 bg-slate-100">
                    <ImageWithFallback
                      src={formData.imageUrl}
                      alt={formData.name || 'Profil'}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fotoğraf Kaynağı & Arşiv
                </label>
                <input
                  type="text"
                  value={formData.imageCredit || ''}
                  onChange={(e) => setFormData({ ...formData, imageCredit: e.target.value })}
                  placeholder="İslahiye Lezzet Atlası Saha Arşivi"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  İsteğe Bağlı Video Klip Yolu
                </label>
                <input
                  type="text"
                  value={formData.videoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="/videos/tas-firin-ve-ocaklik.mp4"
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
                />
              </div>
            </div>

            {/* Visit & Contact Information */}
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-xs space-y-3">
              <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                5. ZİYARET & KONUM NOTU
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
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
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
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== LIVE VISITOR CARD PREVIEW TAB ==================== */
        <div className="bg-ivory border border-sand/70 rounded-sm p-6 sm:p-12 shadow-sm">
          <div className="max-w-md mx-auto bg-paper border border-sand/70 rounded-sm p-6 shadow-xs space-y-4">
            {formData.imageUrl && (
              <div className="aspect-[4/3] rounded-xs overflow-hidden border border-sand/60 bg-sand/20">
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
                <span className="text-[10px] font-mono text-copper-dark uppercase tracking-wider font-semibold">
                  {formData.craftCategoryLabel}
                </span>
                {formData.isDemo && (
                  <span className="px-1.5 py-0.5 rounded-xs bg-amber-100 text-amber-800 text-[9px] font-mono font-bold uppercase">
                    Temsili Demo Kaydı
                  </span>
                )}
              </div>

              <h3 className="text-xl font-display font-bold text-forest">
                {formData.name || 'Usta Adı Belirtilmedi'}
              </h3>

              {formData.title && (
                <span className="text-xs font-mono text-charcoal/60 block mt-0.5">
                  {formData.title} {formData.experienceYears ? `• ${formData.experienceYears} Yıllık Deneyim` : ''}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed font-sans">
              {formData.biography || 'Biyografi metni girilmedi.'}
            </p>

            {formData.visitInfo?.address && (
              <div className="pt-3 border-t border-sand/50 text-[11px] font-mono text-charcoal/60 flex items-center justify-between">
                <span>{formData.visitInfo.address}</span>
                {formData.villageOrNeighborhood && (
                  <span>{formData.villageOrNeighborhood}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
