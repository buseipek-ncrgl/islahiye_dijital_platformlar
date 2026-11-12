import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Plus,
  Save,
  Trash2,
  Clock,
  AlertCircle,
  Info,
  ChefHat,
  Eye,
} from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import { useAdminRole } from '../../context/AdminRoleContext';
import {
  CulturalHeritageStory,
  CulturalStorySection,
  PublicationStatus,
} from '../../types';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { ImageUploadField } from '../../components/admin/common/ImageUploadField';
import { FormNotificationToast, FormNotification } from '../../components/admin/common/FormNotificationToast';
import { ActionConfirmModal } from '../../components/admin/common/ActionConfirmModal';
import { QuickCategoryButton } from '../../components/admin/common/QuickCategoryButton';
import { mergeCategoryOption } from '../../data/categories';

export const CulturalStoryFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const { canCreate, canEdit, canDelete, canPublish } = useAdminRole();
  const canSave = isEditing ? canEdit : canCreate;

  const {
    getCulturalStoryById,
    saveCulturalStory,
    deleteCulturalStory,
    getDishes,
    getCategories,
    getCategoryLabel,
  } = useContent();

  const allDishes = getDishes(false);

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

  const createDefaultFormData = (): Partial<CulturalHeritageStory> => ({
    id: `story-${Date.now()}`,
    slug: '',
    title: '',
    subtitle: '',
    category: 'cooking_methods',
    categoryLabel: 'Pişirme Usulleri',
    coverImageUrl: '/images/islahiye_tava.jpg',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
    readingTime: '4 dk',
    publishedDate: new Date().toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    leadParagraph: '',
    bodySections: [
      {
        heading: '',
        paragraph: '',
        quote: '',
      },
    ],
    relatedDishIds: [],
    tags: ['Kültürel Miras', 'Mutfak Belleği'],
    publicationStatus: canPublish ? 'published' : 'draft',
    verificationStatus: 'verified',
    contentOrigin: 'editorial_narrative',
    sourceNote: 'İslahiye Mutfak Kültürü Araştırma Arşivi',
    isDemo: false,
  });

  // Form State
  const [formData, setFormData] = useState<Partial<CulturalHeritageStory>>(createDefaultFormData);

  // Load existing story on edit, or reset cleanly when switching back to create mode
  useEffect(() => {
    if (isEditing && id) {
      if (initializedKeyRef.current === id) return;
      const existing = getCulturalStoryById(id);
      if (existing) {
        initializedKeyRef.current = id;
        setFormData({ ...existing });
        setErrors({});
        setActiveTab('editor');
      } else {
        initializedKeyRef.current = id;
        setNotification({
          type: 'error',
          message: 'Kültürel miras anlatısı bulunamadı.',
        });
        setTimeout(() => navigate('/yonetim/kulturel-miras'), 1200);
      }
    } else if (!isEditing && initializedKeyRef.current !== '__create__') {
      initializedKeyRef.current = '__create__';
      setFormData(createDefaultFormData());
      setErrors({});
      setActiveTab('editor');
    }
  }, [id, isEditing, getCulturalStoryById, navigate, canPublish]);

  // Slug generator helper
  const handleTitleChange = (val: string) => {
    setFormData((prev) => {
      const updates: Partial<CulturalHeritageStory> = { title: val };
      if (!isEditing || !prev.slug) {
        const generatedSlug = val
          .toLocaleLowerCase('tr-TR')
          .replace(/ğ/g, 'g')
          .replace(/ü/g, 'u')
          .replace(/ş/g, 's')
          .replace(/ı/g, 'i')
          .replace(/ö/g, 'o')
          .replace(/ç/g, 'c')
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');
        updates.slug = generatedSlug;
      }
      return { ...prev, ...updates };
    });
  };

  // Category mapper
  const handleCategoryChange = (
    cat: CulturalHeritageStory['category'],
    explicitLabel?: string
  ) => {
    const resolvedLabel =
      explicitLabel || getCategoryLabel('cultural_story', cat, 'Pişirme Usulleri');

    setFormData((prev) => ({
      ...prev,
      category: cat,
      categoryLabel: resolvedLabel,
    }));
  };

  // Section handlers
  const handleAddSection = () => {
    setFormData((prev) => ({
      ...prev,
      bodySections: [
        ...(prev.bodySections || []),
        { heading: '', paragraph: '', quote: '' },
      ],
    }));
  };

  const handleRemoveSection = (idx: number) => {
    if ((formData.bodySections || []).length <= 1) {
      setNotification({
        type: 'error',
        message: 'Kültürel anlatıda en az bir içerik bölümü bulunmalıdır.',
      });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      bodySections: (prev.bodySections || []).filter((_, i) => i !== idx),
    }));
  };

  const handleUpdateSection = (
    idx: number,
    field: keyof CulturalStorySection,
    value: string
  ) => {
    setFormData((prev) => {
      const updated = [...(prev.bodySections || [])];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, bodySections: updated };
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const fieldDetails: { name: string; label: string; message: string }[] = [];

    if (!formData.title?.trim()) {
      const msg = 'Kültürel anlatı başlığı zorunludur.';
      newErrors.title = msg;
      fieldDetails.push({ name: 'title', label: 'Anlatı Başlığı', message: msg });
    }
    if (!formData.leadParagraph?.trim()) {
      const msg = 'Giriş (lead) paragrafı zorunludur.';
      newErrors.leadParagraph = msg;
      fieldDetails.push({ name: 'leadParagraph', label: 'Giriş Paragrafı', message: msg });
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

  // Form submit
  const handleSubmit = (targetStatus?: PublicationStatus) => {
    if (!canSave) {
      setNotification({
        type: 'error',
        title: 'Yetki Yetersiz',
        message: 'Aktif rolünüzle kültürel miras anlatısı oluşturma veya düzenleme yetkiniz bulunmamaktadır.',
      });
      return;
    }

    if (!validate()) {
      return;
    }

    const currentStatus = (formData.publicationStatus || 'draft') as PublicationStatus;
    const requestedStatus = targetStatus || currentStatus;
    const finalStatus: PublicationStatus =
      !canPublish && (requestedStatus === 'published' || requestedStatus === 'archived')
        ? 'in_review'
        : requestedStatus;

    const storyToSave: CulturalHeritageStory = {
      id: formData.id || `story-${Date.now()}`,
      slug: formData.slug?.trim() || `story-${Date.now()}`,
      title: formData.title!.trim(),
      subtitle: formData.subtitle?.trim() || '',
      category: formData.category || 'cooking_methods',
      categoryLabel: formData.categoryLabel || 'Pişirme Usulleri',
      coverImageUrl: formData.coverImageUrl || '/images/islahiye_tava.jpg',
      imageCredit: formData.imageCredit || 'İslahiye Lezzet Atlası Görsel Arşivi',
      readingTime: formData.readingTime || '4 dk',
      publishedDate:
        formData.publishedDate ||
        new Date().toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      leadParagraph: formData.leadParagraph!.trim(),
      bodySections: (formData.bodySections || []).filter(
        (s) => s.heading?.trim() || s.paragraph?.trim()
      ),
      relatedDishIds: formData.relatedDishIds || [],
      tags: formData.tags || ['Kültürel Miras'],
      publicationStatus: finalStatus,
      verificationStatus: formData.verificationStatus || 'verified',
      contentOrigin: formData.contentOrigin || 'editorial_narrative',
      sourceNote: formData.sourceNote?.trim(),
      sourceUrl: formData.sourceUrl?.trim(),
      isDemo: formData.isDemo ?? false,
    };

    const ok = saveCulturalStory(storyToSave);
    if (!ok) {
      setNotification({
        type: 'error',
        title: 'Kayıt Hatası',
        message: 'Anlatı yerel depoya kaydedilemedi. Tarayıcı depolama alanını kontrol ediniz.',
      });
      return;
    }

    setFormData((prev) => ({ ...prev, publicationStatus: finalStatus }));
    setNotification({
      type: 'success',
      message:
        finalStatus === 'published'
          ? 'Kültürel miras anlatısı başarıyla yayımlandı!'
          : finalStatus === 'in_review'
          ? 'Anlatı yayın onayı için incelemeye alındı (henüz yayında değil).'
          : finalStatus === 'archived'
          ? 'Anlatı arşivlendi ve ziyaretçi portalından kaldırıldı.'
          : 'Anlatı taslak olarak kaydedildi.',
    });

    setTimeout(() => {
      navigate('/yonetim/kulturel-miras');
    }, 900);
  };

  const handleDelete = () => {
    if (!canDelete || !formData.id) return;
    deleteCulturalStory(formData.id);
    navigate('/yonetim/kulturel-miras');
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
            onClick={() => navigate('/yonetim/kulturel-miras')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Geri Dön"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
                {isEditing
                  ? (formData.title ? `Miras Yazısı: ${formData.title}` : 'Kültürel Anlatıyı Düzenle')
                  : 'Yeni Kültürel Miras Anlatısı Oluştur'}
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
              Ocaklık ritüelleri, mevsimsel hasat hikâyeleri ve somut olmayan mutfak mirası kayıtları.
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
              title="Anlatıyı Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Corporate Editorial Integrity Notice */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs font-sans flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block mb-0.5 font-bold">Kültürel Bellek Doğruluk İlkesi:</strong>
          Kurumsal yayın ilkeleri gereğince, gerçekte bulunmayan tarihsel belge, saha araştırması veya ustaya atfedilen kurgusal alıntı sisteme girilmez.
          Yayımlanan anlatılar anında Lezzet Atlası ziyaretçi portalına yansır; taslak anlatılar ise denetim aşamasında tutulur.
        </div>
      </div>

      {activeTab === 'editor' ? (
        /* ==================== EDITOR TAB ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editorial Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Headline Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <h2 className="text-xs font-sans font-bold text-slate-500 uppercase tracking-wider">
                1. TEMEL BAŞLIK &amp; ÖZET
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Anlatı Başlığı <span className="text-rose-500">*</span>
                </label>
                <input
                  id="field-title"
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => {
                    handleTitleChange(e.target.value);
                    if (errors.title) setErrors((prev) => { const n = { ...prev }; delete n.title; return n; });
                  }}
                  placeholder="Örn: Taş Fırının Meşe Közü: Asırlık Ocaklık Hafızası"
                  className={`w-full px-3 py-2 text-sm font-semibold border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.title
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                  }`}
                />
                {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kalıcı Bağlantı (URL Slug)
                </label>
                <div className="flex items-center text-xs border border-slate-300 rounded-lg bg-slate-50 px-3 py-2 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20">
                  <span className="text-slate-400 font-sans">/mutfak-mirasi/</span>
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="flex-1 bg-transparent border-0 focus:outline-none font-sans text-slate-800 text-xs pl-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Editoryal Alt Başlık / Spot Cümle
                </label>
                <input
                  type="text"
                  value={formData.subtitle || ''}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Sabahın ilk ışıklarıyla alevlenen meşe odunları ve çarşı fırın geleneği."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giriş Paragrafı (Lead Paragraph) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="field-leadParagraph"
                  rows={4}
                  required
                  value={formData.leadParagraph || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, leadParagraph: e.target.value });
                    if (errors.leadParagraph) setErrors((prev) => { const n = { ...prev }; delete n.leadParagraph; return n; });
                  }}
                  placeholder="İslahiye mutfak kültürünün kalbinde yer alan asırlık ocaklık ve taş fırın ritüelinin giriş anlatısı..."
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 leading-relaxed font-sans ${
                    errors.leadParagraph
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                  }`}
                />
                {errors.leadParagraph && <p className="text-[11px] text-rose-500 mt-1">{errors.leadParagraph}</p>}
              </div>
            </div>

            {/* Structured Body Sections */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-sans font-bold text-slate-500 uppercase tracking-wider">
                  2. YAPILANDIRILMIŞ İÇERİK BÖLÜMLERİ ({formData.bodySections?.length || 0})
                </h2>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Bölüm Ekle</span>
                </button>
              </div>

              <div className="space-y-4">
                {(formData.bodySections || []).map((section, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-sans font-bold text-slate-700">
                        Bölüm #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Bölümü Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Bölüm Alt Başlığı
                      </label>
                      <input
                        type="text"
                        value={section.heading || ''}
                        onChange={(e) => handleUpdateSection(idx, 'heading', e.target.value)}
                        placeholder="Örn: Meşe Odunu ve Ağır Ağır Demlenme"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Paragraf Metni
                      </label>
                      <textarea
                        rows={3}
                        value={section.paragraph || ''}
                        onChange={(e) => handleUpdateSection(idx, 'paragraph', e.target.value)}
                        placeholder="Bölümün detaylı anlatım metni..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 leading-relaxed font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Vurgulu Alıntı veya Editoryal Not (İsteğe Bağlı)
                      </label>
                      <input
                        type="text"
                        value={section.quote || ''}
                        onChange={(e) => handleUpdateSection(idx, 'quote', e.target.value)}
                        placeholder="Örn: Ateş doğrudan yemeğe değil, tonoz kubbenin hafızasına değer."
                        className="w-full px-3 py-2 text-xs italic border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Metadata Settings (1 col) */}
          <div className="space-y-6">
            {/* Category & Cover Image */}
            <div id="field-coverImageUrl" className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <h2 className="text-xs font-sans font-bold text-slate-500 uppercase tracking-wider">
                3. YAYIN &amp; KATEGORİ
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
                    Aktif rolünüz doğrudan yayına alma yetkisine sahip olmadığından içerik incelemeye gönderilir.
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Miras Kategorisi
                  </label>
                  <QuickCategoryButton
                    scope="cultural_story"
                    onCreated={(cat) =>
                      handleCategoryChange(cat.id as CulturalHeritageStory['category'], cat.label)
                    }
                  />
                </div>
                <select
                  value={formData.category || 'cooking_methods'}
                  onChange={(e) => handleCategoryChange(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-sans"
                >
                  {mergeCategoryOption(
                    getCategories('cultural_story', true),
                    formData.category,
                    'cultural_story',
                    getCategoryLabel('cultural_story', formData.category || 'cooking_methods', formData.categoryLabel)
                  ).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tahmini Okuma Süresi
                </label>
                <input
                  type="text"
                  value={formData.readingTime || '4 dk'}
                  onChange={(e) => setFormData({ ...formData, readingTime: e.target.value })}
                  placeholder="Örn: 4 dk"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-sans"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <ImageUploadField
                  value={formData.coverImageUrl || '/images/islahiye_tava.jpg'}
                  onChange={(url) => setFormData({ ...formData, coverImageUrl: url })}
                  altText={formData.title || ''}
                  credit={formData.imageCredit || ''}
                  onCreditChange={(credit) => setFormData({ ...formData, imageCredit: credit })}
                  label="Kültürel Anlatı Kapak Görseli"
                />
              </div>
            </div>

            {/* Related Dishes Linker */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
              <h2 className="text-xs font-sans font-bold text-slate-500 uppercase tracking-wider">
                4. İLİŞKİLİ YEMEKLER ({formData.relatedDishIds?.length || 0})
              </h2>
              <p className="text-[11px] text-slate-500 font-sans">
                Bu kültürel anlatının sonunda ziyaretçiye önerilecek yemekleri seçiniz.
              </p>

              <div className="max-h-44 overflow-y-auto space-y-1 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
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
                              relatedDishIds: current.filter((dId) => dId !== dish.id),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer shrink-0"
                      />
                      <span className="font-medium truncate">{dish.name}</span>
                      <span className="text-[10px] font-sans text-slate-400 ml-auto">
                        {dish.categoryLabel}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Research & Source Integrity */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
              <h2 className="text-xs font-sans font-bold text-slate-500 uppercase tracking-wider">
                5. KAYNAK &amp; DOĞRULAMA
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Araştırma Notu / Kaynak
                </label>
                <input
                  type="text"
                  value={formData.sourceNote || ''}
                  onChange={(e) => setFormData({ ...formData, sourceNote: e.target.value })}
                  placeholder="İslahiye Kültür Arşivi"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Doğrulama Durumu
                </label>
                <select
                  value={formData.verificationStatus || 'verified'}
                  onChange={(e) =>
                    setFormData({ ...formData, verificationStatus: e.target.value as any })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="verified">Doğrulanmış Kültürel Kayıt</option>
                  <option value="unverified">Doğrulanmamış</option>
                </select>
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
                {effectiveSaveStatus === 'published'
                  ? 'Anlatı yayımlandığında /mutfak-mirasi sayfasında anında listelenecektir.'
                  : effectiveSaveStatus === 'in_review'
                  ? 'Anlatı editör incelemesi kuyruğuna kaydedilecektir.'
                  : effectiveSaveStatus === 'archived'
                  ? 'Anlatı arşivlenerek ziyaretçi portalından kaldırılacaktır.'
                  : 'Anlatı taslak olarak kaydedilecek ve yalnızca CMS içinde görünecektir.'}
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <Link
                to="/yonetim/kulturel-miras"
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
        /* ==================== LIVE EDITORIAL PREVIEW TAB ==================== */
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Ziyaretçi Portalı Canlı Önizlemesi
              </h3>
              <p className="text-xs text-slate-500">
                /mutfak-mirasi sayfasındaki editoryal okuma ve anlatı görünümü.
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
              {formData.categoryLabel}
            </span>
          </div>

          <div className="bg-ivory border border-sand/70 rounded-xl p-6 sm:p-12 shadow-xs">
            <div className="max-w-3xl mx-auto space-y-8">
              {/* Header info */}
              <div className="border-b border-sand/50 pb-6">
                <div className="flex items-center gap-2 text-xs font-sans text-copper-dark uppercase font-semibold mb-2">
                  <span>{formData.categoryLabel}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-copper" /> {formData.readingTime} Okuma
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-display font-bold text-forest leading-tight mb-3">
                  {formData.title || 'Başlık Belirtilmedi'}
                </h1>

                {formData.subtitle && (
                  <p className="text-sm sm:text-base text-charcoal/75 italic font-sans leading-relaxed">
                    {formData.subtitle}
                  </p>
                )}
              </div>

              {/* Cover Image */}
              <div className="rounded-xl overflow-hidden aspect-[16/9] border border-sand/60 relative">
                <ImageWithFallback
                  src={formData.coverImageUrl || '/images/islahiye_tava.jpg'}
                  alt={formData.title || 'Kapak'}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-md bg-forest-900/80 text-ivory text-[10px] font-sans">
                  {formData.imageCredit}
                </div>
              </div>

              {/* Lead Paragraph */}
              {formData.leadParagraph && (
                <div className="p-4 sm:p-6 bg-paper rounded-xl border-l-2 border-copper">
                  <p className="text-sm sm:text-base font-serif text-charcoal leading-relaxed">
                    {formData.leadParagraph}
                  </p>
                </div>
              )}

              {/* Structured Sections */}
              <div className="space-y-6">
                {(formData.bodySections || []).map((sec, i) => (
                  <div key={i} className="space-y-2">
                    {sec.heading && (
                      <h2 className="text-lg sm:text-xl font-display font-bold text-forest pt-2">
                        {sec.heading}
                      </h2>
                    )}
                    {sec.paragraph && (
                      <p className="text-xs sm:text-sm text-charcoal/80 leading-relaxed font-sans">
                        {sec.paragraph}
                      </p>
                    )}
                    {sec.quote && (
                      <blockquote className="my-3 pl-4 border-l border-copper-dark italic text-xs sm:text-sm text-copper-dark font-serif">
                        “{sec.quote}”
                      </blockquote>
                    )}
                  </div>
                ))}
              </div>

              {/* Related Dishes Preview */}
              {(formData.relatedDishIds || []).length > 0 && (
                <div className="pt-8 border-t border-sand/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-sans uppercase text-forest font-bold">
                    <ChefHat className="w-4 h-4 text-copper" />
                    <span>Bu Anlatıyla İlişkili İslahiye Lezzetleri</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(formData.relatedDishIds || []).map((dId) => {
                      const dish = allDishes.find((d) => d.id === dId);
                      if (!dish) return null;
                      return (
                        <div
                          key={dId}
                          className="p-3 bg-paper border border-sand/70 rounded-xl flex items-center gap-3"
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-sand/30 shrink-0">
                            <ImageWithFallback
                              src={dish.imageUrl}
                              alt={dish.name}
                              containerClassName="w-full h-full"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="text-xs font-display font-bold text-forest">
                              {dish.name}
                            </div>
                            <span className="text-[10px] font-sans text-copper-dark block">
                              {dish.categoryLabel}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
        title="Kültürel Anlatıyı Sil"
        message={`"${formData.title || 'Bu anlatı'}" kalıcı olarak silinecek ve /mutfak-mirasi portalından kaldırılacaktır.`}
        confirmText="Evet, Sil"
      />
    </div>
  );
};
