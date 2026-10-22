import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  Info,
  ChefHat,
  Eye,
} from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import {
  CulturalHeritageStory,
  CulturalStorySection,
  PublicationStatus,
} from '../../types';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';

export const CulturalStoryFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const {
    getCulturalStoryById,
    saveCulturalStory,
    getDishes,
    getMediaItems,
  } = useContent();

  const allDishes = getDishes(false);
  const mediaItems = getMediaItems();

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<CulturalHeritageStory>>({
    id: `story-${Date.now()}`,
    slug: '',
    title: '',
    subtitle: '',
    category: 'cooking_methods',
    categoryLabel: 'Pişirme Usulleri',
    coverImageUrl: '/images/islahiye_tava.jpg',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
    readingTime: '4 dk',
    publishedDate: '16 Ekim 2026',
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
    publicationStatus: 'draft',
    verificationStatus: 'verified',
    contentOrigin: 'editorial_narrative',
    sourceNote: 'İslahiye Mutfak Kültürü Araştırma Arşivi',
    isDemo: false,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load existing story on edit
  useEffect(() => {
    if (isEditing && id) {
      const existing = getCulturalStoryById(id);
      if (existing) {
        setFormData({ ...existing });
      } else {
        alert('Kültürel miras anlatısı bulunamadı.');
        navigate('/yonetim/kulturel-miras');
      }
    }
  }, [id, isEditing, getCulturalStoryById, navigate]);

  // Slug generator helper
  const handleTitleChange = (val: string) => {
    setFormData((prev) => {
      const updates: Partial<CulturalHeritageStory> = { title: val };
      if (!isEditing || !prev.slug) {
        const generatedSlug = val
          .toLowerCase()
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
  const handleCategoryChange = (cat: CulturalHeritageStory['category']) => {
    let label = 'Pişirme Usulleri';
    if (cat === 'tools') label = 'Geleneksel Mutfak Araçları';
    else if (cat === 'seasons') label = 'Hasat & Mevsimler';
    else if (cat === 'traditions') label = 'Mutfak Gelenekleri';

    setFormData((prev) => ({
      ...prev,
      category: cat,
      categoryLabel: label,
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
      alert('En az bir içerik bölümü bulunmalıdır.');
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

  // Form submit
  const handleSubmit = (targetStatus?: PublicationStatus) => {
    if (!formData.title?.trim() || !formData.leadParagraph?.trim()) {
      alert('Lütfen anlatı başlığını ve giriş paragrafını eksiksiz doldurunuz.');
      return;
    }

    const storyToSave: CulturalHeritageStory = {
      id: formData.id || `story-${Date.now()}`,
      slug: formData.slug?.trim() || `story-${Date.now()}`,
      title: formData.title.trim(),
      subtitle: formData.subtitle?.trim() || '',
      category: formData.category || 'cooking_methods',
      categoryLabel: formData.categoryLabel || 'Pişirme Usulleri',
      coverImageUrl: formData.coverImageUrl || '/images/islahiye_tava.jpg',
      imageCredit: formData.imageCredit || 'İslahiye Lezzet Atlası Görsel Arşivi',
      readingTime: formData.readingTime || '4 dk',
      publishedDate: formData.publishedDate || '16 Ekim 2026',
      leadParagraph: formData.leadParagraph.trim(),
      bodySections: (formData.bodySections || []).filter(
        (s) => s.heading?.trim() || s.paragraph?.trim()
      ),
      relatedDishIds: formData.relatedDishIds || [],
      tags: formData.tags || ['Kültürel Miras'],
      publicationStatus: targetStatus || formData.publicationStatus || 'draft',
      verificationStatus: formData.verificationStatus || 'verified',
      contentOrigin: formData.contentOrigin || 'editorial_narrative',
      sourceNote: formData.sourceNote?.trim(),
      sourceUrl: formData.sourceUrl?.trim(),
      isDemo: formData.isDemo ?? false,
    };

    saveCulturalStory(storyToSave);
    showToast(
      targetStatus === 'published'
        ? 'Kültürel miras anlatısı başarıyla yayımlandı!'
        : 'Anlatı taslak olarak kaydedildi.'
    );

    setTimeout(() => {
      navigate('/yonetim/kulturel-miras');
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
            onClick={() => navigate('/yonetim/kulturel-miras')}
            className="p-2 rounded-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Geri Dön"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-copper-dark font-semibold">
                KÜLTÜREL MİRAS & SÖZLÜ TARİH
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
              {isEditing ? 'Kültürel Anlatıyı Düzenle' : 'Yeni Kültürel Miras Anlatısı Oluştur'}
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

      {/* Corporate Editorial Integrity Notice */}
      <div className="p-4 rounded-sm bg-amber-50/70 border border-amber-200 text-amber-900 text-xs font-sans flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block mb-0.5 font-bold">Kültürel Bellek Doğruluk İlkesi:</strong>
          AGENTS.md ve EDITORIAL_BENCHMARKS.md yönergeleri gereğince, gerçekte bulunmayan tarihsel belge, saha görüşmesi, röportaj veya ustaya atfedilen hayalî alıntı üretilmez.
          Yayımlanan anlatılar anında `/mutfak-mirasi` ziyaretçi sayfasına yansır; taslak anlatılar ise ziyaretçilerden izole tutulur.
        </div>
      </div>

      {activeTab === 'editor' ? (
        /* ==================== EDITOR TAB ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editorial Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Headline Card */}
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                1. TEMEL BAŞLIK & ÖZET
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Anlatı Başlığı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Örn: Taş Fırının Meşe Közü: Asırlık Ocaklık Hafızası"
                  className="w-full px-3 py-2 text-sm font-semibold border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kalıcı Bağlantı (URL Slug)
                </label>
                <div className="flex items-center text-xs border border-slate-200 rounded-sm bg-slate-50 px-3 py-2">
                  <span className="text-slate-400 font-mono">/mutfak-mirasi/</span>
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="flex-1 bg-transparent border-0 focus:outline-none font-mono text-slate-800 text-xs pl-1"
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
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Giriş Paragrafı (Lead Paragraph) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.leadParagraph || ''}
                  onChange={(e) => setFormData({ ...formData, leadParagraph: e.target.value })}
                  placeholder="İslahiye mutfak kültürünün kalbinde yer alan asırlık ocaklık ve taş fırın ritüelinin giriş anlatısı..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest leading-relaxed font-sans"
                />
              </div>
            </div>

            {/* Structured Body Sections */}
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  2. YAPILANDIRILMIŞ İÇERİK BÖLÜMLERİ ({formData.bodySections?.length || 0})
                </h2>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="text-xs text-forest hover:text-forest-800 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Bölüm Ekle</span>
                </button>
              </div>

              <div className="space-y-4">
                {(formData.bodySections || []).map((section, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-sm border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-600">
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
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-sm bg-white focus:outline-none focus:border-forest"
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
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm bg-white focus:outline-none focus:border-forest leading-relaxed font-sans"
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
                        className="w-full px-3 py-1.5 text-xs italic border border-slate-200 rounded-sm bg-white focus:outline-none focus:border-forest text-slate-700"
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
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                3. YAYIN & KATEGORİ
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Miras Kategorisi
                </label>
                <select
                  value={formData.category || 'cooking_methods'}
                  onChange={(e) => handleCategoryChange(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm bg-white focus:outline-none focus:border-forest"
                >
                  <option value="cooking_methods">Pişirme Usulleri (Ocaklık & Köz)</option>
                  <option value="tools">Geleneksel Mutfak Araçları</option>
                  <option value="seasons">Hasat & Mevsimler</option>
                  <option value="traditions">Mutfak Gelenekleri</option>
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
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kapak Görseli
                </label>
                <select
                  value={formData.coverImageUrl || '/images/islahiye_tava.jpg'}
                  onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm bg-white focus:outline-none focus:border-forest mb-2 font-mono"
                >
                  {mediaItems.map((m) => (
                    <option key={m.id} value={m.src}>
                      {m.title} ({m.src})
                    </option>
                  ))}
                </select>

                <div className="aspect-[16/9] rounded-sm overflow-hidden border border-slate-200 bg-slate-100">
                  <ImageWithFallback
                    src={formData.coverImageUrl || '/images/islahiye_tava.jpg'}
                    alt={formData.title || 'Kapak Önizleme'}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Görsel Kaynağı & Telif
                </label>
                <input
                  type="text"
                  value={formData.imageCredit || ''}
                  onChange={(e) => setFormData({ ...formData, imageCredit: e.target.value })}
                  placeholder="İslahiye Lezzet Atlası Görsel Arşivi"
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
                />
              </div>
            </div>

            {/* Related Dishes Linker */}
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-xs space-y-3">
              <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                4. İLİŞKİLİ YEMEKLER ({formData.relatedDishIds?.length || 0})
              </h2>
              <p className="text-[11px] text-slate-500 font-sans">
                Bu kültürel anlatının sonunda ziyaretçiye önerilecek yemekleri seçiniz.
              </p>

              <div className="max-h-44 overflow-y-auto space-y-1 border border-slate-200 rounded-sm p-2 bg-slate-50/50">
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
                              relatedDishIds: current.filter((dId) => dId !== dish.id),
                            });
                          }
                        }}
                        className="rounded-xs text-forest focus:ring-forest"
                      />
                      <span className="font-medium truncate">{dish.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 ml-auto">
                        {dish.categoryLabel}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Research & Source Integrity */}
            <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-xs space-y-3">
              <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                5. KAYNAK & DOĞRULAMA
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
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-sm focus:outline-none focus:border-forest"
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
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-sm bg-white focus:outline-none focus:border-forest"
                >
                  <option value="verified">Doğrulanmış Kültürel Kayıt</option>
                  <option value="simulated">Temsili / Simülasyon</option>
                  <option value="unverified">Doğrulanmamış</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== LIVE EDITORIAL PREVIEW TAB ==================== */
        <div className="bg-ivory border border-sand/70 rounded-sm p-6 sm:p-12 shadow-sm">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Header info */}
            <div className="border-b border-sand/50 pb-6">
              <div className="flex items-center gap-2 text-xs font-mono text-copper-dark uppercase font-semibold mb-2">
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
            <div className="rounded-sm overflow-hidden aspect-[16/9] border border-sand/60 relative">
              <ImageWithFallback
                src={formData.coverImageUrl || '/images/islahiye_tava.jpg'}
                alt={formData.title || 'Kapak'}
                containerClassName="w-full h-full"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-xs bg-forest-900/80 text-ivory text-[10px] font-mono">
                {formData.imageCredit}
              </div>
            </div>

            {/* Lead Paragraph */}
            {formData.leadParagraph && (
              <div className="p-4 sm:p-6 bg-paper rounded-sm border-l-2 border-copper">
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
                <div className="flex items-center gap-2 text-xs font-mono uppercase text-forest font-bold">
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
                        className="p-3 bg-paper border border-sand/70 rounded-xs flex items-center gap-3"
                      >
                        <div className="w-12 h-12 rounded-xs overflow-hidden bg-sand/30 shrink-0">
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
                          <span className="text-[10px] font-mono text-copper-dark block">
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
      )}
    </div>
  );
};
