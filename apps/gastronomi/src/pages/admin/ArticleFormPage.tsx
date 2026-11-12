import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
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
import { useAdminRole } from '../../context/AdminRoleContext';
import {
  Article,
  ArticleParagraph,
  ArticleCategory,
  PublicationStatus,
  VerificationStatus,
  ContentOrigin,
} from '../../types';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { ActionConfirmModal } from '../../components/admin/common/ActionConfirmModal';
import { ImageUploadField } from '../../components/admin/common/ImageUploadField';
import { FormNotificationToast, FormNotification } from '../../components/admin/common/FormNotificationToast';
import { QuickCategoryButton } from '../../components/admin/common/QuickCategoryButton';
import { mergeCategoryOption } from '../../data/categories';

export const ArticleFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getArticles, saveArticle, deleteArticle, getCategories, getCategoryLabel } = useContent();
  const { canCreate, canEdit, canDelete, canPublish } = useAdminRole();

  const isEditing = Boolean(id);
  const canSave = isEditing ? canEdit : canCreate;
  const existingArticle = useMemo(() => {
    if (!id) return undefined;
    const articles = getArticles();
    return articles.find((a) => a.id === id || a.slug === id);
  }, [id, getArticles]);

  const initializedKeyRef = useRef<string | null>(null);

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
  const [imageCredit, setImageCredit] = useState('İslahiye Lezzet Atlası Arşivi');
  const [tagsInput, setTagsInput] = useState('İslahiye, Gastronomi, Kültür');
  const [publicationStatus, setPublicationStatus] = useState<PublicationStatus>(() =>
    canPublish ? 'published' : 'draft'
  );
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('verified');

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

  // Generate slug from text
  const generateSlug = (text: string) => {
    return text
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
  };

  // Populate form if editing or reset when switching from edit to create
  useEffect(() => {
    if (isEditing && id) {
      if (existingArticle) {
        if (initializedKeyRef.current !== existingArticle.id) {
          initializedKeyRef.current = existingArticle.id;
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
          setImageCredit(existingArticle.imageCredit || 'İslahiye Lezzet Atlası Arşivi');
          setTagsInput(existingArticle.tags ? existingArticle.tags.join(', ') : '');
          setPublicationStatus(existingArticle.publicationStatus || 'published');
          setVerificationStatus((existingArticle.verificationStatus as VerificationStatus) || 'verified');
          setParagraphs(existingArticle.paragraphs || []);
          setErrors({});
          setIsDirty(false);
          setActiveTab('form');
        }
      } else if (initializedKeyRef.current !== `__missing__${id}`) {
        initializedKeyRef.current = `__missing__${id}`;
        setNotification({
          type: 'error',
          title: 'Kayıt Bulunamadı',
          message: 'Düzenlenecek haber veya makale kaydı bulunamadı.',
        });
        setTimeout(() => navigate('/yonetim/haberler'), 1200);
      }
    } else if (!isEditing && initializedKeyRef.current !== '__create__') {
      initializedKeyRef.current = '__create__';
      setTitle('');
      setSlug('');
      setSubtitle('');
      setSummary('');
      setCategory('agriculture');
      setContentType('news');
      setContentOrigin('official_press');
      setSourceUrl('');
      setAuthorName('İslahiye Lezzet Atlası Editoryal Ekibi');
      setAuthorTitle('Kültürel Bellek ve Araştırma');
      setReadingTime('3 dk okuma');
      setCoverImage('/images/biber_kozleme_poster.jpg');
      setImageCaption('');
      setImageCredit('İslahiye Lezzet Atlası Arşivi');
      setTagsInput('İslahiye, Gastronomi, Kültür');
      setPublicationStatus(canPublish ? 'published' : 'draft');
      setVerificationStatus('verified');
      setParagraphs([
        {
          title: 'Giriş ve Arka Plan',
          body: 'İslahiye Ovası ve Amanos Dağları eteklerinde yüzyıllardır sürdürülen gastronomi ritüelleri...',
          highlightText: '',
          quote: '',
        },
      ]);
      setErrors({});
      setIsDirty(false);
      setActiveTab('form');
    }
  }, [isEditing, id, existingArticle, navigate, canPublish]);

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

  // Validation with precise field mapping and auto-focus
  const validate = () => {
    const newErrors: Record<string, string> = {};
    const fieldDetails: { name: string; label: string; message: string }[] = [];

    if (!title.trim() || title.trim().length < 3) {
      const msg = 'Haber başlığı en az 3 karakter olmalıdır.';
      newErrors.title = msg;
      fieldDetails.push({ name: 'title', label: 'Haber Başlığı', message: msg });
    }
    if (!slug.trim()) {
      const autoSlug = generateSlug(title);
      setSlug(autoSlug);
    }
    if (!summary.trim() || summary.trim().length < 10) {
      const msg = 'Özet alanı en az 10 karakter olmalıdır.';
      newErrors.summary = msg;
      fieldDetails.push({ name: 'summary', label: 'İçerik Özeti', message: msg });
    }
    const trimmedSource = sourceUrl.trim();
    if (trimmedSource && !/^https?:\/\/\S+/i.test(trimmedSource)) {
      const msg = 'Kaynak URL http:// veya https:// ile başlamalıdır.';
      newErrors.sourceUrl = msg;
      fieldDetails.push({ name: 'sourceUrl', label: 'Kaynak URL', message: msg });
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

  const handleSave = (targetStatus?: PublicationStatus) => {
    if (!canSave) {
      setNotification({
        type: 'error',
        title: 'Yetki Yetersiz',
        message: 'Aktif rolünüz bu işlemde kayıt oluşturma veya düzenleme yetkisine sahip değildir.',
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
    const articleId = isEditing && existingArticle ? existingArticle.id : `news-${Date.now()}`;
    const resolvedCategoryLabel = getCategoryLabel('article', category, 'Gastronomi');

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const finalParagraphs = paragraphs.filter((p) => p.body.trim().length > 0);
    if (finalParagraphs.length === 0) {
      finalParagraphs.push({
        title: 'Giriş ve Genel Bakış',
        body: summary.trim() || title.trim(),
      });
    }

    const finalSourceUrl = sourceUrl.trim() || undefined;

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
      slug: slug.trim() || generateSlug(title),
      title: title.trim(),
      subtitle: subtitle.trim(),
      summary: summary.trim(),
      category: (category === 'all' ? 'agriculture' : category) as Exclude<ArticleCategory, 'all'>,
      categoryLabel: resolvedCategoryLabel,
      contentType,
      contentOrigin: (contentOrigin as ContentOrigin) || 'official_press',
      sourceUrl: finalSourceUrl,
      verificationStatus,
      isDemo: false,
      coverImage,
      imageCaption: imageCaption.trim() || undefined,
      imageCredit: imageCredit.trim() || 'İslahiye Lezzet Atlası Arşivi',
      author: {
        name: authorName.trim(),
        title: authorTitle.trim(),
      },
      publishedAt: existingArticle?.publishedAt || today.toISOString().split('T')[0],
      formattedDate: existingArticle?.formattedDate || formattedDate,
      readingTime,
      publicationStatus: finalStatus,
      isLead: existingArticle?.isLead || false,
      paragraphs: finalParagraphs,
      tags: parsedTags,
      relatedDishIds: existingArticle?.relatedDishIds,
      relatedArticleSlugs: existingArticle?.relatedArticleSlugs,
    };

    const ok = saveArticle(updatedArticle);
    if (!ok) {
      setNotification({
        type: 'error',
        title: 'Kayıt Hatası',
        message: 'Yazı yerel depoya kaydedilemedi. Tarayıcı depolama alanını kontrol ediniz.',
      });
      return;
    }

    setIsDirty(false);
    setPublicationStatus(finalStatus);
    setNotification({
      type: 'success',
      message:
        finalStatus === 'published'
          ? 'Haber / Makale başarıyla yayımlandı ve /haberler sayfasında görünür hale geldi!'
          : finalStatus === 'in_review'
          ? 'Yazı yayın onayı için incelemeye alındı (henüz yayında değil).'
          : finalStatus === 'archived'
          ? 'Yazı arşivlendi ve ziyaretçi portalından kaldırıldı.'
          : 'Yazı taslak olarak kaydedildi (ziyaretçilere kapalıdır).',
    });

    setTimeout(() => {
      navigate('/yonetim/haberler');
    }, 1200);
  };

  const handleDelete = () => {
    if (!canDelete) return;
    if (existingArticle) {
      deleteArticle(existingArticle.id);
      setShowDeleteModal(false);
      navigate('/yonetim/haberler');
    }
  };

  const effectiveSaveStatus: PublicationStatus =
    !canPublish && (publicationStatus === 'published' || publicationStatus === 'archived')
      ? 'in_review'
      : publicationStatus;

  const primaryButtonLabel =
    effectiveSaveStatus === 'published'
      ? 'Kaydet ve Yayımla'
      : effectiveSaveStatus === 'in_review'
      ? 'İncelemeye Gönder'
      : effectiveSaveStatus === 'archived'
      ? 'Arşivle ve Kaydet'
      : 'Taslağı Kaydet';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 font-sans">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/yonetim/haberler"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-2xs"
            title="Haber Listesine Dön"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
                {isEditing
                  ? (title ? `Yazı Düzenle: ${title}` : 'Yazı Düzenleme')
                  : (contentType === 'news' ? 'Yeni Resmî Haber' : 'Yeni Editoryal Makale')}
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
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                {contentType === 'news' ? 'Resmî Haber' : 'Editoryal Makale'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-sans">
              Mutfak kültürü bülten haberleri ve saha araştırma yazıları için editoryal içerik düzenleme.
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
            <CheckCircle2 className="w-4 h-4" />
            <span>{primaryButtonLabel}</span>
          </button>

          {isEditing && canDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="h-9 w-9 inline-flex items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
              title="Yazıyı Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Viewport Toast for Notifications & Validation */}
      <FormNotificationToast notification={notification} onClose={() => setNotification(null)} />

      {/* Unsaved Changes Banner */}
      {isDirty && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Yazıda kaydedilmemiş düzenlemeleriniz bulunmaktadır.</span>
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === 'preview' ? (
        /* Editorial Magazine Preview */
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Ziyaretçi Portalı Canlı Önizlemesi
              </h3>
              <p className="text-xs text-slate-500">
                Editoryal dergi ve haber detay sayfasındaki okuma düzeni.
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
              {contentType === 'news' ? 'Resmî Haber' : 'Editoryal Makale'}
            </span>
          </div>

        <div className="bg-ivory p-6 sm:p-10 rounded-xl border border-sand/80 shadow-xs space-y-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="border-b border-sand pb-4">
              <span className="text-[11px] font-sans text-copper-dark uppercase tracking-wider block font-bold">
                EDİTORYAL DERGİ &amp; DETAY CANLI ÖNİZLEME
              </span>
              <div className="flex items-center gap-2 text-xs font-sans text-charcoal/60 mt-2">
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

            <div className="aspect-[16/9] rounded-xl overflow-hidden bg-sand/30 border border-sand">
              <ImageWithFallback
                src={coverImage}
                alt={title}
                fallbackText={title}
                containerClassName="w-full h-full"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-4 bg-sand/20 rounded-xl text-xs font-sans text-charcoal/85 leading-relaxed font-medium">
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
                    <div className="p-3 bg-amber-50/80 border-l-4 border-amber-600 text-xs font-sans text-amber-950 rounded-r-lg">
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
          <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <h2 className="text-sm font-sans font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              1. Yazı Başlığı, Türü &amp; Özet
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  İçerik Türü <span className="text-rose-500">*</span>
                </label>
                <select
                  value={contentType}
                  onChange={(e) => {
                    setContentType(e.target.value as 'news' | 'editorial_article');
                    setIsDirty(true);
                  }}
                  className="w-full h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                >
                  <option value="news">Resmî Haber &amp; Kurumsal Bülten</option>
                  <option value="editorial_article">Editoryal Makale &amp; Mutfak Belleği</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Kategori <span className="text-rose-500">*</span>
                  </label>
                  <QuickCategoryButton
                    scope="article"
                    onCreated={(cat) => {
                      setCategory(cat.id as ArticleCategory);
                      setIsDirty(true);
                    }}
                  />
                </div>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as ArticleCategory);
                    setIsDirty(true);
                  }}
                  className="w-full h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                >
                  {mergeCategoryOption(
                    getCategories('article', true),
                    category,
                    'article',
                    getCategoryLabel('article', category, existingArticle?.categoryLabel)
                  ).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Yazı Başlığı <span className="text-rose-500">*</span>
                </label>
                <input
                  id="field-title"
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Örn: İslahiye Biberinde Hasat Sezonu ve İpeksi Kurutma"
                  className={`w-full h-10 px-3.5 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.title ? 'border-rose-400 focus:ring-rose-500/20' : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-600'
                  }`}
                />
                {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  URL Slug <span className="text-rose-500">*</span>
                </label>
                <input
                  id="field-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setIsDirty(true);
                  }}
                  className={`w-full h-10 px-3.5 text-xs sm:text-sm border rounded-lg font-sans focus:outline-none focus:ring-2 ${
                    errors.slug ? 'border-rose-400 focus:ring-rose-500/20' : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-600'
                  }`}
                />
                {errors.slug && <p className="text-[11px] text-rose-500 mt-1">{errors.slug}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                className="w-full h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Haber Özeti (Lead / Summary) <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="field-summary"
                rows={2}
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Yazının ilk paragrafı ve kartlarda görünecek özet..."
                className={`w-full p-3.5 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.summary ? 'border-rose-400 focus:ring-rose-500/20' : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-600'
                }`}
              />
              {errors.summary && <p className="text-[11px] text-rose-500 mt-1">{errors.summary}</p>}
            </div>
          </div>

          {/* Section 2: Kapak Görseli ve Medya */}
          <div id="field-coverImage" className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <ImageUploadField
              value={coverImage}
              onChange={(url) => {
                setCoverImage(url);
                setIsDirty(true);
              }}
              altText={imageCaption}
              onAltTextChange={(caption) => {
                setImageCaption(caption);
                setIsDirty(true);
              }}
              credit={imageCredit}
              onCreditChange={(credit) => {
                setImageCredit(credit);
                setIsDirty(true);
              }}
              label="Haber / Makale Kapak Görseli"
              required
            />
          </div>

          {/* Section 3: Yapılandırılmış Metin Paragrafları */}
          <div id="field-paragraphs" className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h2 className="text-sm font-sans font-bold text-slate-900">
                  3. İçerik Blokları &amp; Paragraflar ({paragraphs.length} Blok)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Her blok için alt başlık, gövde metni ve opsiyonel alıntı/vurgu kutusu tanımlayabilirsiniz.
                </p>
              </div>

              <button
                type="button"
                onClick={addParagraph}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors shadow-2xs cursor-pointer"
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
                  className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3 relative"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-800 text-xs font-sans font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={p.title || ''}
                        onChange={(e) => updateParagraph(idx, { title: e.target.value })}
                        placeholder="Ara Başlık (Örn: Ürün Nitelikleri ve Şartname Standartları)"
                        className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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
                      className="w-full p-3 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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
                        className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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
                        className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg italic text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Kaynak, Yazar ve Doğrulama */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
            <h2 className="text-sm font-sans font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              4. Doğrulama, Kaynak URL &amp; Yayın Durumu
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kaynak URL <span className="text-slate-400 font-normal">(Opsiyonel - Resmî kaynak bağlantısı)</span>
                </label>
                <input
                  id="field-sourceUrl"
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => {
                    setSourceUrl(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="https://ci.turkpatent.gov.tr/..."
                  className={`w-full h-10 px-3.5 text-xs sm:text-sm border rounded-lg font-sans focus:outline-none focus:ring-2 ${
                    errors.sourceUrl ? 'border-rose-400 focus:ring-rose-500/20' : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-600'
                  }`}
                />
                {errors.sourceUrl && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.sourceUrl}</p>
                )}
                <p className="text-[10px] text-slate-500 mt-1">
                  TÜRKPATENT gibi harici resmî kaynaklar otomatik olarak kurumsal basın açıklaması sayılmaz; doğrulanmış dış kaynak olarak etiketlenir.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                  className="w-full h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
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
                    Yayında (/haberler sayfasında görünür){!canPublish ? ' — Yayın yetkisi gerekir' : ''}
                  </option>
                  <option value="draft">Taslak (Yalnızca CMS'te görünür)</option>
                  <option value="in_review">İncelemede (Onay bekliyor)</option>
                  <option value="archived" disabled={!canPublish}>
                    Arşivde (Portalda gizli){!canPublish ? ' — Yayın yetkisi gerekir' : ''}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                  className="w-full h-10 px-3.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

          </div>

          {/* Bottom Actions */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200">
            {Object.keys(errors).length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg mr-auto animate-pulse">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{Object.keys(errors).length} zorunlu alanda eksik veya hatalı bilgi var</span>
              </div>
            )}

            <Link
              to="/yonetim/haberler"
              className="h-10 px-4 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              Vazgeç
            </Link>

            {canSave && publicationStatus !== 'draft' && (
              <button
                type="button"
                onClick={() => handleSave('draft')}
                className="h-10 px-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                <Save className="w-4 h-4 text-slate-400" />
                <span>Taslak Kaydet</span>
              </button>
            )}

            <button
              type="button"
              disabled={!canSave}
              onClick={() => handleSave()}
              title={!canSave ? 'Aktif rolünüzle kayıt kaydedemezsiniz' : undefined}
              className="h-10 px-5 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{primaryButtonLabel}</span>
            </button>
          </div>
        </form>
      )}

      {/* Delete Confirmation Modal */}
      <ActionConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Yazıyı Silmek İstiyor musunuz?"
        message={`"${title}" yazısı silinecek ve /haberler portalından kaldırılacaktır.`}
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        variant="danger"
      />
    </div>
  );
};
