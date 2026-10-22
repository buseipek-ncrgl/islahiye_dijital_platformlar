import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Globe,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Eye,
  Info,
  Clock,
  Users,
} from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import { Dish, DishCategory, PublicationStatus, VerificationStatus } from '../../types';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';

const PRESET_IMAGES = [
  { label: 'İslahiye Tavası', url: '/images/islahiye_tava.jpg' },
  { label: 'Firik Pilavı', url: '/images/firik_pilavi.jpg' },
  { label: 'Şemsek Böreği', url: '/images/semsek_boregi.jpg' },
  { label: 'İslahiye Kömbesi', url: '/images/islahiye_kombesi.jpg' },
  { label: 'İncir Tatlısı', url: '/images/incir_tatlisi.jpg' },
  { label: 'İslahiye Biberi', url: '/images/islahiye_biberi.jpg' },
  { label: 'Taş Fırın Közü', url: '/images/tas_firin_kozu_poster.jpg' },
  { label: 'Hamur Zanaatı', url: '/images/hamur_zanaati_poster.jpg' },
];

const CATEGORIES: { id: Exclude<DishCategory, 'all'>; label: string }[] = [
  { id: 'main', label: 'Ana Yemekler' },
  { id: 'pastry', label: 'Hamur İşleri' },
  { id: 'local_product', label: 'Yöresel Ürünler' },
  { id: 'dessert', label: 'Tatlılar' },
];

export const DishFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDishById, getRecipes, saveDish, deleteDish } = useContent();

  const isEditing = Boolean(id);
  const existingDish = useMemo(() => (id ? getDishById(id) : undefined), [id, getDishById]);
  const availableRecipes = getRecipes();

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
  const [imageCredit, setImageCredit] = useState('İslahiye Lezzet Atlası Demo Arşivi');
  const [recipeId, setRecipeId] = useState<string>('');
  const [isRegisteredGI, setIsRegisteredGI] = useState(false);
  const [giStatusNote, setGiStatusNote] = useState('Yöresel Mutfak Mirası');
  const [publicationStatus, setPublicationStatus] = useState<PublicationStatus>('draft');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('verified');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isDemo, setIsDemo] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Populate form if editing
  useEffect(() => {
    if (existingDish) {
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
      setImageCredit(existingDish.imageCredit || 'İslahiye Lezzet Atlası Demo Arşivi');
      setRecipeId(existingDish.recipeId || '');
      setIsRegisteredGI(Boolean(existingDish.isRegisteredGeographicalIndication));
      setGiStatusNote(existingDish.giStatusNote || 'Yöresel Mutfak Mirası');
      setPublicationStatus(existingDish.publicationStatus || 'published');
      setVerificationStatus(existingDish.verificationStatus || 'verified');
      setSourceUrl(existingDish.sourceUrl || '');
      setIsDemo(existingDish.isDemo !== undefined ? existingDish.isDemo : true);
    }
  }, [existingDish]);

  // Validation
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 3) {
      newErrors.name = 'Yemek adı en az 3 karakter olmalıdır.';
    }
    if (!description.trim() || description.trim().length < 15) {
      newErrors.description = 'Açıklama alanı en az 15 karakter içermelidir.';
    }
    if (!imageUrl.trim()) {
      newErrors.imageUrl = 'Görsel URL alanı zorunludur.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Generate Unique ID & Slug
  const generateId = (text: string) => {
    const slug = text
      .toLowerCase()
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
    if (!validate()) {
      setActiveTab('form');
      setNotification({ type: 'error', message: 'Lütfen formdaki zorunlu alanları kontrol edin.' });
      return;
    }

    const finalStatus = targetStatus || publicationStatus;
    const dishId = isEditing && existingDish ? existingDish.id : generateId(name);
    const categoryObj = CATEGORIES.find((c) => c.id === category);

    const updatedDish: Dish = {
      id: dishId,
      name: name.trim(),
      category,
      categoryLabel: categoryObj?.label || 'Ana Yemekler',
      tagline: tagline.trim() || description.slice(0, 80) + '...',
      description: description.trim(),
      culturalNote: culturalNote.trim() || 'İslahiye geleneksel fırın kültüründe özenle hazırlanır.',
      originNote: originNote.trim() || 'İslahiye Mutfak Mirası',
      isRegisteredGeographicalIndication: isRegisteredGI,
      giStatusNote: isRegisteredGI ? 'Tescilli Coğrafi İşaret' : giStatusNote,
      prepTime,
      cookTime,
      difficulty,
      servings,
      imageUrl,
      imageAlt: imageAlt.trim() || name,
      imageCredit,
      recipeId: recipeId ? recipeId : undefined,
      ingredients: existingDish?.ingredients || [],
      publicationStatus: finalStatus,
      verificationStatus,
      sourceUrl: sourceUrl.trim() || undefined,
      isDemo,
      isLead: existingDish?.isLead || false,
    };

    saveDish(updatedDish);
    setIsDirty(false);
    setPublicationStatus(finalStatus);
    setNotification({
      type: 'success',
      message:
        finalStatus === 'published'
          ? 'Yemek başarıyla kaydedildi ve demo portalında yayımlandı!'
          : 'Yemek taslak olarak kaydedildi (ziyaretçi portalında gizlidir).',
    });

    setTimeout(() => {
      navigate('/yonetim/yemekler');
    }, 1200);
  };

  const handleDelete = () => {
    if (existingDish) {
      deleteDish(existingDish.id);
      setShowDeleteModal(false);
      navigate('/yonetim/yemekler');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 font-sans">
      {/* Top Breadcrumb & Action Header */}
      <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/yonetim/yemekler"
            className="p-2 rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Yemek Listesine Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs bg-slate-100 text-slate-700 border border-slate-200">
                {isEditing ? 'Yemek Düzenle' : 'Yeni Yemek Oluştur'}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-xs font-semibold ${
                  publicationStatus === 'published'
                    ? 'bg-emerald-100 text-emerald-800'
                    : publicationStatus === 'archived'
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {publicationStatus === 'published'
                  ? 'Yayında'
                  : publicationStatus === 'archived'
                  ? 'Arşivde'
                  : 'Taslak'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {name || (isEditing ? 'Yemek Düzenleme' : 'Yeni Yöresel Yemek')}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'form' ? 'preview' : 'form')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>{activeTab === 'form' ? 'Kart Önizleme' : 'Forma Dön'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('draft')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition-colors"
          >
            <Save className="w-4 h-4 text-slate-600" />
            <span>Taslak Kaydet</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('published')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-forest hover:bg-forest-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>Demo Olarak Yayımla</span>
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="p-2 rounded-sm text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200"
              title="Kaydı Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-sm border flex items-center justify-between text-xs animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Unsaved Changes Banner */}
      {isDirty && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Kaydedilmemiş değişiklikleriniz var. Sayfadan ayrılmadan önce lütfen kaydedin.</span>
          </div>
        </div>
      )}

      {/* Main Form or Preview Tab */}
      {activeTab === 'preview' ? (
        /* Preview Card */
        <div className="bg-white p-8 rounded-sm border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">
              ZİYARETÇİ KARTI VE LEZZET DETAYI CANLI ÖNİZLEME
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Portalda Nasıl Görünecek?
            </h3>
          </div>

          <div className="max-w-md mx-auto bg-ivory rounded-sm border border-sand/70 overflow-hidden shadow-sm">
            <div className="relative aspect-[4/3] bg-sand/30 overflow-hidden">
              <ImageWithFallback
                src={imageUrl}
                alt={name}
                fallbackText={name}
                containerClassName="w-full h-full"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded-xs bg-forest text-ivory text-[10px] font-mono uppercase font-bold tracking-wider">
                  {CATEGORIES.find((c) => c.id === category)?.label}
                </span>
                {isRegisteredGI && (
                  <span className="px-2 py-0.5 rounded-xs bg-copper text-ivory text-[10px] font-mono uppercase font-bold tracking-wider">
                    Tescilli
                  </span>
                )}
              </div>
            </div>

            <div className="p-5 space-y-3 font-sans">
              <div className="flex items-center justify-between text-xs font-mono text-charcoal/60">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-copper" />
                  {prepTime} + {cookTime}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-copper" />
                  {servings}
                </span>
              </div>

              <h4 className="text-xl font-display font-bold text-forest leading-snug">
                {name || 'Yemek Adı'}
              </h4>

              <p className="text-xs text-charcoal/75 leading-relaxed line-clamp-3">
                {description || 'Yemek açıklaması...'}
              </p>

              <div className="pt-3 border-t border-sand/50 flex items-center justify-between">
                <span className="text-[11px] font-mono text-charcoal/60">
                  {originNote}
                </span>
                {recipeId ? (
                  <span className="text-xs font-semibold text-copper font-mono">
                    Tarifi İncele →
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-forest font-mono">
                    Lezzet Detayı →
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Structured Form */
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-6"
        >
          {/* Section 1: Temel Bilgiler */}
          <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-slate-800 font-bold border-b border-slate-200 pb-2">
              1. Temel Lezzet Kimliği & Açıklamalar
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                  className={`w-full px-3 py-2 text-xs border rounded-sm focus:outline-none focus:ring-1 ${
                    errors.name
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-slate-300 focus:ring-forest focus:border-forest'
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as Exclude<DishCategory, 'all'>);
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kısa Vurgu / Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => {
                  setTagline(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Örn: Taş fırının meşe közünde demlenen kuzu eti, sarımsak ve İslahiye biberi."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detaylı Lezzet Açıklaması <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Yemeğin içeriği, fırın veya ocaklık usulü, lezzet profili..."
                className={`w-full px-3 py-2 text-xs border rounded-sm focus:outline-none focus:ring-1 ${
                  errors.description
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-forest focus:border-forest'
                }`}
              />
              {errors.description && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kültürel Bellek & Ocaklık Notu
              </label>
              <textarea
                rows={2}
                value={culturalNote}
                onChange={(e) => {
                  setCulturalNote(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Örn: İslahiye fırınlarında sabahın erken saatlerinde meşe odunu ateşiyle pişirilir..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest"
              />
            </div>
          </div>

          {/* Section 2: Görsel ve Medya */}
          <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-slate-800 font-bold border-b border-slate-200 pb-2">
              2. Görsel ve Medya Kökeni
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Hızlı Görsel Seçimi (Doğrulanmış Yerel Arşiv):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRESET_IMAGES.map((img) => (
                  <button
                    key={img.url}
                    type="button"
                    onClick={() => {
                      setImageUrl(img.url);
                      setImageAlt(img.label);
                      setIsDirty(true);
                    }}
                    className={`text-left p-2 rounded-sm border transition-all ${
                      imageUrl === img.url
                        ? 'border-forest bg-forest/5 ring-1 ring-forest'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <div className="aspect-[4/3] rounded-xs overflow-hidden mb-1.5 bg-slate-100">
                      <ImageWithFallback
                        src={img.url}
                        alt={img.label}
                        fallbackText={img.label}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[11px] font-sans font-semibold text-slate-800 block truncate">
                      {img.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Özel Görsel URL'si <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm font-mono focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Görsel Köken & Lisans Atfı
                </label>
                <input
                  type="text"
                  value={imageCredit}
                  onChange={(e) => {
                    setImageCredit(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Örn: İslahiye Lezzet Atlası Görsel Arşivi"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Pişirme ve Porsiyon Bilgileri */}
          <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-slate-800 font-bold border-b border-slate-200 pb-2">
              3. Pişirme Parametreleri & İlişkili Tarif
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Porsiyon Bilgisi
                </label>
                <input
                  type="text"
                  value={servings}
                  onChange={(e) => {
                    setServings(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="4-6 Kişilik"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Zorluk Derecesi
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => {
                    setDifficulty(e.target.value as 'Kolay' | 'Orta' | 'Ustalık Gerektirir');
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest bg-white"
                >
                  <option value="Kolay">Kolay</option>
                  <option value="Orta">Orta</option>
                  <option value="Ustalık Gerektirir">Ustalık Gerektirir</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                İlişkili Tarif (Tarif Atölyesi ve Önizleme Bağlantısı)
              </label>
              <select
                value={recipeId}
                onChange={(e) => {
                  setRecipeId(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest bg-white"
              >
                <option value="">-- Tarif Yok (Yalnızca Lezzet Detayı Gösterilir) --</option>
                {availableRecipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.id})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Eğer tarif seçilmezse ziyaretçi kartında sahte "Tarifi İncele" aksiyonu gösterilmez; doğrudan lezzet özeti sunulur.
              </p>
            </div>
          </div>

          {/* Section 4: Doğrulama ve Yayın Yönetimi */}
          <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-slate-800 font-bold border-b border-slate-200 pb-2">
              4. Doğrulama, Coğrafi İşaret & Yayın Durumu
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yayın Durumu
                </label>
                <select
                  value={publicationStatus}
                  onChange={(e) => {
                    setPublicationStatus(e.target.value as PublicationStatus);
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest bg-white"
                >
                  <option value="draft">Taslak (Yalnızca CMS'te görünür)</option>
                  <option value="in_review">İncelemede (Onay bekliyor)</option>
                  <option value="published">Yayında (Ziyaretçi portalında görünür)</option>
                  <option value="archived">Arşivde (Portalda gizli)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kaynak Doğrulama Durumu
                </label>
                <select
                  value={verificationStatus}
                  onChange={(e) => {
                    setVerificationStatus(e.target.value as VerificationStatus);
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest focus:border-forest bg-white"
                >
                  <option value="verified">Doğrulanmış İslahiye Kaydı</option>
                  <option value="unverified">Aday / Doğrulanmamış İçerik</option>
                  <option value="simulated">Sentetik Demo / Temsili Kayıt</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRegisteredGI}
                  onChange={(e) => {
                    setIsRegisteredGI(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="rounded-xs text-forest focus:ring-forest w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-800">
                  TÜRKPATENT Resmî Coğrafi İşaret Tescilli Ürün
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDemo}
                  onChange={(e) => {
                    setIsDemo(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="rounded-xs text-forest focus:ring-forest w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-600">
                  Demo İçerik İşareti (Frontend Simülasyonu)
                </span>
              </label>
            </div>
          </div>

          {/* Form Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              to="/yonetim/yemekler"
              className="px-4 py-2 rounded-sm border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Vazgeç
            </Link>

            <button
              type="button"
              onClick={() => handleSave('draft')}
              className="px-4 py-2 rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition-colors"
            >
              Taslak Kaydet
            </button>

            <button
              type="button"
              onClick={() => handleSave('published')}
              className="px-6 py-2 rounded-sm bg-forest hover:bg-forest-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Kaydet ve Yayımla
            </button>
          </div>
        </form>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">
                Yemeği Silmek İstiyor musunuz?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              <strong>"{name}"</strong> kaydı silinecek ve ziyaretçi portalından kaldırılacaktır. Başlangıç tohum verileri dilediğiniz zaman CMS ayarlarından sıfırlanabilir.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-sm border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-sm bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
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
