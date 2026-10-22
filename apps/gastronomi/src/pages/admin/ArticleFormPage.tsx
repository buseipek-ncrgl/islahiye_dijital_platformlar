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
  Plus,
  ArrowUp,
  ArrowDown,
  Info,
  Quote,
} from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import {
  Article,
  ArticleParagraph,
  ArticleCategory,
  PublicationStatus,
  VerificationStatus,
  ContentOrigin,
} from '../../types';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';

const PRESET_COVERS = [
  { label: 'Biber Közleme & Hasat', url: '/images/biber_kozleme_poster.jpg' },
  { label: 'Taş Fırın & Meşe Közü', url: '/images/tas_firin_kozu_poster.jpg' },
  { label: 'Hamur Zanaatı & Fırın', url: '/images/hamur_zanaati_poster.jpg' },
  { label: 'İslahiye Biber Sergisi', url: '/images/islahiye_biberi.jpg' },
  { label: 'Geleneksel Mutfak', url: '/images/islahiye_tava.jpg' },
  { label: 'Amanos Firik Pilavı', url: '/images/firik_pilavi.jpg' },
];

const CATEGORIES: { id: ArticleCategory; label: string }[] = [
  { id: 'agriculture', label: 'Toprak, Tescil & Hasat' },
  { id: 'heritage', label: 'Mutfak Mirası' },
  { id: 'gastronomy', label: 'Gastronomi' },
  { id: 'culture', label: 'Kültür & Zanaat' },
];

export const ArticleFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getArticles, saveArticle, deleteArticle } = useContent();

  const isEditing = Boolean(id);
  const existingArticle = useMemo(() => {
    if (!id) return undefined;
    const articles = getArticles();
    return articles.find((a) => a.id === id || a.slug === id);
  }, [id, getArticles]);

  // Article State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState<ArticleCategory>('agriculture');
  const [contentType, setContentType] = useState<'news' | 'editorial_article'>('news');
  const [contentOrigin, setContentOrigin] = useState<string>('official_press');
  const [sourceUrl, setSourceUrl] = useState('');
  const [authorName, setAuthorName] = useState('İslahiye Lezzet Atlası Editoryal Ekibi');
  const [authorTitle, setAuthorTitle] = useState('Kültürel Bellek ve Araştırma');
  const [readingTime, setReadingTime] = useState('3 dk okuma');
  const [coverImage, setCoverImage] = useState('/images/biber_kozleme_poster.jpg');
  const [imageCaption, setImageCaption] = useState('');
  const [imageCredit, setImageCredit] = useState('İslahiye Lezzet Atlası Demo Arşivi');
  const [tagsInput, setTagsInput] = useState('İslahiye, Gastronomi, Kültür');
  const [publicationStatus, setPublicationStatus] = useState<PublicationStatus>('draft');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('verified');
  const [isDemo, setIsDemo] = useState(true);

  // Structured Paragraphs
  const [paragraphs, setParagraphs] = useState<ArticleParagraph[]>([
    {
      title: 'Giriş ve Arka Plan',
      body: 'İslahiye Ovası ve Amanos Dağları eteklerinde yüzyıllardır sürdürülen gastronomi ritüelleri...',
      highlightText: '',
      quote: '',
    },
  ]);

  // UI state
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Generate slug from text
  const generateSlug = (text: string) => {
    return text
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
  };

  // Populate form if editing
  useEffect(() => {
    if (existingArticle) {
      setTitle(existingArticle.title);
      setSlug(existingArticle.slug);
      setSubtitle(existingArticle.subtitle || '');
      setSummary(existingArticle.summary);
      setCategory(existingArticle.category);
      setContentType(existingArticle.contentType);
      setContentOrigin(existingArticle.contentOrigin || 'official_press');
      setSourceUrl(existingArticle.sourceUrl || '');
      setAuthorName(existingArticle.author.name);
      setAuthorTitle(existingArticle.author.title);
      setReadingTime(existingArticle.readingTime || '3 dk okuma');
      setCoverImage(existingArticle.coverImage);
      setImageCaption(existingArticle.imageCaption || '');
      setImageCredit(existingArticle.imageCredit || 'İslahiye Lezzet Atlası Demo Arşivi');
      setTagsInput(existingArticle.tags ? existingArticle.tags.join(', ') : '');
      setPublicationStatus(existingArticle.publicationStatus || 'published');
      setVerificationStatus((existingArticle.verificationStatus as VerificationStatus) || 'verified');
      setIsDemo(existingArticle.isDemo !== undefined ? existingArticle.isDemo : false);
      setParagraphs(existingArticle.paragraphs || []);
    }
  }, [existingArticle]);

  // Auto-generate slug when title changes (if not edited manually)
  const handleTitleChange = (val: string) => {
    setTitle(val);
    setIsDirty(true);
    if (!isEditing || !slug) {
      setSlug(generateSlug(val));
    }
  };

  // Paragraph Helpers
  const addParagraph = () => {
    setParagraphs([
      ...paragraphs,
      {
        title: '',
        body: '',
        highlightText: '',
        quote: '',
      },
    ]);
    setIsDirty(true);
  };

  const updateParagraph = (index: number, updates: Partial<ArticleParagraph>) => {
    const next = [...paragraphs];
    next[index] = { ...next[index], ...updates };
    setParagraphs(next);
    setIsDirty(true);
  };

  const removeParagraph = (index: number) => {
    setParagraphs(paragraphs.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const moveParagraph = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= paragraphs.length) return;
    const next = [...paragraphs];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    setParagraphs(next);
    setIsDirty(true);
  };

  // Validation
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 5) {
      newErrors.title = 'Başlık en az 5 karakter olmalıdır.';
    }
    if (!slug.trim()) {
      newErrors.slug = 'URL slug alanı boş bırakılamaz.';
    }
    if (!summary.trim() || summary.trim().length < 20) {
      newErrors.summary = 'Özet alanı en az 20 karakter olmalıdır.';
    }
    // Kurumsal haber ise kaynak URL zorunlu olmalı (AGENTS.md ve sprint kuralı)
    if (contentType === 'news' && !sourceUrl.trim()) {
      newErrors.sourceUrl =
        'Kurumsal veya resmî haber kayıtlarında doğrulanabilir kaynak URL zorunludur.';
    }
    if (paragraphs.length < 1) {
      newErrors.paragraphs = 'En az bir içerik paragrafı eklenmelidir.';
    }
    const emptyParagraph = paragraphs.some((p) => !p.body.trim());
    if (emptyParagraph) {
      newErrors.paragraphs = 'Tüm paragrafların gövde metinleri doldurulmalıdır.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (targetStatus?: PublicationStatus) => {
    if (!validate()) {
      setActiveTab('form');
      setNotification({ type: 'error', message: 'Lütfen formdaki zorunlu alanları kontrol edin.' });
      return;
    }

    const finalStatus = targetStatus || publicationStatus;
    const articleId = isEditing && existingArticle ? existingArticle.id : `news-${Date.now()}`;
    const categoryObj = CATEGORIES.find((c) => c.id === category);

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const today = new Date();
    const formattedDate = `${today.getDate()} ${
      [
        'Ocak',
        'Şubat',
        'Mart',
        'Nisan',
        'Mayıs',
        'Haziran',
        'Temmuz',
        'Ağustos',
        'Eylül',
        'Ekim',
        'Kasım',
        'Aralık',
      ][today.getMonth()]
    } ${today.getFullYear()}`;

    const updatedArticle: Article = {
      id: articleId,
      slug: slug.trim(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      summary: summary.trim(),
      category: (category === 'all' ? 'agriculture' : category) as Exclude<ArticleCategory, 'all'>,
      categoryLabel: categoryObj?.label || 'Gastronomi',
      contentType,
      contentOrigin: (contentOrigin as ContentOrigin) || 'official_press',
      sourceUrl: sourceUrl.trim() || undefined,
      verificationStatus,
      isDemo,
      coverImage,
      imageCaption: imageCaption.trim() || undefined,
      imageCredit: imageCredit.trim() || 'İslahiye Lezzet Atlası Demo Arşivi',
      author: {
        name: authorName.trim(),
        title: authorTitle.trim(),
      },
      publishedAt: today.toISOString().split('T')[0],
      formattedDate,
      readingTime,
      publicationStatus: finalStatus,
      isLead: existingArticle?.isLead || false,
      paragraphs,
      tags: parsedTags,
      relatedDishIds: existingArticle?.relatedDishIds,
      relatedArticleSlugs: existingArticle?.relatedArticleSlugs,
    };

    saveArticle(updatedArticle);
    setIsDirty(false);
    setPublicationStatus(finalStatus);
    setNotification({
      type: 'success',
      message:
        finalStatus === 'published'
          ? 'Haber / Makale başarıyla yayımlandı ve /haberler sayfasında görünür hale geldi!'
          : 'Haber taslak olarak kaydedildi (ziyaretçilere kapalıdır).',
    });

    setTimeout(() => {
      navigate('/yonetim/haberler');
    }, 1200);
  };

  const handleDelete = () => {
    if (existingArticle) {
      deleteArticle(existingArticle.id);
      setShowDeleteModal(false);
      navigate('/yonetim/haberler');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 font-sans">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/yonetim/haberler"
            className="p-2 rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Haber Listesine Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs bg-slate-100 text-slate-700 border border-slate-200">
                {isEditing ? 'Yazı Düzenle' : 'Yeni Haber / Makale'}
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
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-slate-100 text-slate-600">
                {contentType === 'news' ? 'Resmî Haber' : 'Editoryal Makale'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {title || (isEditing ? 'Yazı Düzenleme' : 'Yeni Haber veya Makale')}
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
            <span>{activeTab === 'form' ? 'Editoryal Önizleme' : 'Forma Dön'}</span>
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
              title="Yazıyı Sil"
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
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Yazıda kaydedilmemiş düzenlemeleriniz bulunmaktadır.</span>
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === 'preview' ? (
        /* Editorial Magazine Preview */
        <div className="bg-ivory p-6 sm:p-10 rounded-sm border border-sand/80 shadow-xs space-y-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="border-b border-sand pb-4">
              <span className="text-[10px] font-mono text-copper-dark uppercase tracking-widest block font-bold">
                EDİTORYAL DERGİ & DETAY CANLI ÖNİZLEME
              </span>
              <div className="flex items-center gap-2 text-xs font-mono text-charcoal/60 mt-2">
                <span>{contentType === 'news' ? 'Resmî Haber' : 'Editoryal Makale'}</span>
                <span>•</span>
                <span>{readingTime}</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-display font-bold text-forest leading-tight">
              {title || 'Yazı Başlığı'}
            </h1>

            {subtitle && (
              <p className="text-base text-charcoal/80 font-sans italic border-l-2 border-copper pl-3">
                {subtitle}
              </p>
            )}

            <div className="aspect-[16/9] rounded-sm overflow-hidden bg-sand/30 border border-sand">
              <ImageWithFallback
                src={coverImage}
                alt={title}
                fallbackText={title}
                containerClassName="w-full h-full"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-4 bg-sand/20 rounded-sm text-xs font-sans text-charcoal/85 leading-relaxed font-medium">
              <strong>Özet:</strong> {summary || 'Özet metni buraya gelecek...'}
            </div>

            {/* Paragraph Blocks */}
            <div className="space-y-6 pt-4">
              {paragraphs.map((p, idx) => (
                <div key={idx} className="space-y-3">
                  {p.title && (
                    <h3 className="text-xl font-display font-bold text-forest">
                      {p.title}
                    </h3>
                  )}
                  <p className="text-sm font-sans text-charcoal/85 leading-relaxed">
                    {p.body}
                  </p>
                  {p.highlightText && (
                    <div className="p-3 bg-amber-50/80 border-l-3 border-amber-600 text-xs font-mono text-amber-950">
                      {p.highlightText}
                    </div>
                  )}
                  {p.quote && (
                    <blockquote className="p-4 border-l-2 border-copper bg-paper italic text-xs font-display text-forest flex items-start gap-2">
                      <Quote className="w-4 h-4 text-copper shrink-0" />
                      <span>{p.quote}</span>
                    </blockquote>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Form View */
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-6"
        >
          {/* Section 1: Başlık, Tür ve Kategori */}
          <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-slate-800 font-bold border-b border-slate-200 pb-2">
              1. Yazı Başlığı, Türü & Özet
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  İçerik Türü <span className="text-rose-500">*</span>
                </label>
                <select
                  value={contentType}
                  onChange={(e) => {
                    setContentType(e.target.value as 'news' | 'editorial_article');
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                >
                  <option value="news">Resmî Haber & Kayıt (Kaynak URL zorunludur)</option>
                  <option value="editorial_article">Editoryal Makale & Mutfak Belleği</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as ArticleCategory);
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yazı Başlığı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Örn: İslahiye Biberinde Hasat Sezonu ve İpeksi Kurutma"
                  className={`w-full px-3 py-2 text-xs border rounded-sm focus:outline-none focus:ring-1 ${
                    errors.title ? 'border-rose-400' : 'border-slate-300 focus:ring-forest'
                  }`}
                />
                {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Slug <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setIsDirty(true);
                  }}
                  className={`w-full px-3 py-2 text-xs border rounded-sm font-mono focus:outline-none focus:ring-1 ${
                    errors.slug ? 'border-rose-400' : 'border-slate-300 focus:ring-forest'
                  }`}
                />
                {errors.slug && <p className="text-[11px] text-rose-500 mt-1">{errors.slug}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alt Başlık (Subtitle)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => {
                  setSubtitle(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Örn: Amanos mikroklimasında yetişen biberin kurutma sergileri ve pul biber hazırlık evresi."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Haber Özeti (Lead / Summary) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Yazının ilk paragrafı ve kartlarda görünecek özet..."
                className={`w-full px-3 py-2 text-xs border rounded-sm focus:outline-none focus:ring-1 ${
                  errors.summary ? 'border-rose-400' : 'border-slate-300 focus:ring-forest'
                }`}
              />
              {errors.summary && <p className="text-[11px] text-rose-500 mt-1">{errors.summary}</p>}
            </div>
          </div>

          {/* Section 2: Kapak Görseli ve Medya */}
          <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-slate-800 font-bold border-b border-slate-200 pb-2">
              2. Kapak Görseli & Lisans Bilgisi
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Hızlı Kapak Seçimi (Doğrulanmış Arşiv):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PRESET_COVERS.map((cov) => (
                  <button
                    key={cov.url}
                    type="button"
                    onClick={() => {
                      setCoverImage(cov.url);
                      setIsDirty(true);
                    }}
                    className={`text-left p-2 rounded-sm border transition-all ${
                      coverImage === cov.url
                        ? 'border-forest bg-forest/5 ring-1 ring-forest'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <div className="aspect-[16/9] rounded-xs overflow-hidden mb-1.5 bg-slate-100">
                      <ImageWithFallback
                        src={cov.url}
                        alt={cov.label}
                        fallbackText={cov.label}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[11px] font-sans font-semibold text-slate-800 block truncate">
                      {cov.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kapak Görsel URL
                </label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => {
                    setCoverImage(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm font-mono focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Görsel Lisans / Kaynak Atfı
                </label>
                <input
                  type="text"
                  value={imageCredit}
                  onChange={(e) => {
                    setImageCredit(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Yapılandırılmış Metin Paragrafları */}
          <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <h2 className="text-sm font-mono uppercase tracking-wider text-slate-800 font-bold">
                  3. İçerik Blokları & Paragraflar ({paragraphs.length} Blok)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Her blok için alt başlık, gövde metni ve opsiyonel alıntı/vurgu kutusu tanımlayabilirsiniz.
                </p>
              </div>

              <button
                type="button"
                onClick={addParagraph}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-forest text-white text-xs font-semibold hover:bg-forest-800 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Blok Ekle</span>
              </button>
            </div>

            {errors.paragraphs && (
              <p className="text-xs text-rose-500 font-medium">{errors.paragraphs}</p>
            )}

            <div className="space-y-4">
              {paragraphs.map((p, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-sm space-y-3 relative"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-xs bg-slate-300 text-slate-800 text-[10px] font-mono font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={p.title || ''}
                        onChange={(e) => updateParagraph(idx, { title: e.target.value })}
                        placeholder="Ara Başlık (Örn: Ürün Nitelikleri ve Şartname Standartları)"
                        className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 rounded-sm w-72 focus:outline-none focus:ring-1 focus:ring-forest"
                      />
                    </div>

                    <div className="flex items-center gap-1 text-slate-400">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveParagraph(idx, 'up')}
                        className="p-1 hover:text-slate-700 disabled:opacity-30"
                        title="Yukarı Taşı"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === paragraphs.length - 1}
                        onClick={() => moveParagraph(idx, 'down')}
                        className="p-1 hover:text-slate-700 disabled:opacity-30"
                        title="Aşağı Taşı"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeParagraph(idx)}
                        className="p-1 text-rose-500 hover:text-rose-700 ml-2"
                        title="Bloğu Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Paragraf Gövdesi <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={p.body}
                      onChange={(e) => updateParagraph(idx, { body: e.target.value })}
                      placeholder="Bu bölümün detaylı editoryal metni..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Vurgu / Öne Çıkan Not Kutusu (Opsiyonel)
                      </label>
                      <input
                        type="text"
                        value={p.highlightText || ''}
                        onChange={(e) => updateParagraph(idx, { highlightText: e.target.value })}
                        placeholder="Örn: Resmî Tescil No: 991 | Gaziantep Ticaret Borsası"
                        className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-forest"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Alıntı / Söz (Quote - Opsiyonel)
                      </label>
                      <input
                        type="text"
                        value={p.quote || ''}
                        onChange={(e) => updateParagraph(idx, { quote: e.target.value })}
                        placeholder="Örn: Coğrafi işaret, bölgesel üreticinin emeğini korur..."
                        className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-sm italic text-slate-700 focus:outline-none focus:ring-1 focus:ring-forest"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Kaynak, Yazar ve Doğrulama */}
          <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-slate-800 font-bold border-b border-slate-200 pb-2">
              4. Doğrulama, Kaynak URL & Yayın Durumu
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kaynak URL {contentType === 'news' && <span className="text-rose-500">* (Resmî haberde zorunlu)</span>}
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => {
                    setSourceUrl(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="https://ci.turkpatent.gov.tr/..."
                  className={`w-full px-3 py-2 text-xs border rounded-sm font-mono focus:outline-none focus:ring-1 ${
                    errors.sourceUrl ? 'border-rose-400' : 'border-slate-300 focus:ring-forest'
                  }`}
                />
                {errors.sourceUrl && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.sourceUrl}</p>
                )}
                <p className="text-[10px] text-slate-500 mt-0.5">
                  TÜRKPATENT gibi harici resmî kaynaklar otomatik olarak kurumsal basın açıklaması sayılmaz; doğrulanmış dış kaynak olarak etiketlenir.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yazar / Kurum İsmi
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => {
                    setAuthorName(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Örn: Lezzet Atlası Editoryal Ekibi"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>
            </div>

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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                >
                  <option value="draft">Taslak (Yalnızca CMS'te görünür)</option>
                  <option value="in_review">İncelemede (Onay bekliyor)</option>
                  <option value="published">Yayında (/haberler sayfasında görünür)</option>
                  <option value="archived">Arşivde (Portalda gizli)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Etiketler (Virgülle ayırın)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => {
                    setTagsInput(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="İslahiye Biberi, TÜRKPATENT, Hasat"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
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
                  Demo İçerik İşareti (Frontend Temsili Makale)
                </span>
              </label>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              to="/yonetim/haberler"
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
                Yazıyı Silmek İstiyor musunuz?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              <strong>"{title}"</strong> yazısı silinecek ve /haberler portalından kaldırılacaktır.
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
