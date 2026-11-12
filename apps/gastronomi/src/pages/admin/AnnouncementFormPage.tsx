import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Calendar,
  Building,
  ShieldCheck,
} from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import { useAdminRole } from '../../context/AdminRoleContext';
import { Announcement, AnnouncementCategory, PublicationStatus, VerificationStatus } from '../../types';
import { FormNotificationToast, FormNotification } from '../../components/admin/common/FormNotificationToast';
import { ImageUploadField } from '../../components/admin/common/ImageUploadField';
import { ActionConfirmModal } from '../../components/admin/common/ActionConfirmModal';
import { QuickCategoryButton } from '../../components/admin/common/QuickCategoryButton';
import { mergeCategoryOption } from '../../data/categories';
import { sanitizeUrl } from '../../utils/security';

export const AnnouncementFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getAnnouncementById,
    saveAnnouncement,
    deleteAnnouncement,
    getEvents,
    getCategories,
    getCategoryLabel,
  } = useContent();
  const { canCreate, canEdit, canDelete, canPublish } = useAdminRole();

  const isEditing = Boolean(id);
  const canSave = isEditing ? canEdit : canCreate;
  const existingAnnouncement = useMemo(() => {
    if (!id) return undefined;
    return getAnnouncementById(id);
  }, [id, getAnnouncementById]);

  const allEvents = useMemo(() => getEvents(false), [getEvents]);
  const initializedKeyRef = useRef<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [contentParagraphs, setContentParagraphs] = useState('');
  const [category, setCategory] = useState<AnnouncementCategory>('kurumsal');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [coverImage, setCoverImage] = useState('');
  const [relatedEventId, setRelatedEventId] = useState('');
  const [officialSource, setOfficialSource] = useState('İslahiye Dijital Platformlar');
  const [sourceUrl, setSourceUrl] = useState('');
  const [publishedAt, setPublishedAt] = useState(() => new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [publicationStatus, setPublicationStatus] = useState<PublicationStatus>('draft');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('verified');

  // UI state
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<FormNotification | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Smooth scroll to invalid field and trigger a glowing pulse ring
  const scrollToField = (fieldName: string) => {
    setActiveTab('form');
    setTimeout(() => {
      const el = document.getElementById(`field-${fieldName}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-rose-500/40', 'transition-all', 'duration-500');
        setTimeout(() => {
          el.classList.remove('ring-4', 'ring-rose-500/40');
        }, 2500);
        const input = el.querySelector('input, textarea, select') as HTMLElement | null;
        if (input) {
          input.focus();
        }
      }
    }, 50);
  };

  // Populate form if editing, or reset cleanly when switching back to create mode
  useEffect(() => {
    if (isEditing && id) {
      if (initializedKeyRef.current === id) return;
      if (existingAnnouncement) {
        initializedKeyRef.current = id;
        setTitle(existingAnnouncement.title);
        setSummary(existingAnnouncement.summary);
        setContentParagraphs(
          existingAnnouncement.detailedContent ||
            (Array.isArray(existingAnnouncement.content) ? existingAnnouncement.content.join('\n\n') : '')
        );
        setCategory(existingAnnouncement.category);
        setPriority(existingAnnouncement.priority || 'normal');
        setCoverImage(existingAnnouncement.coverImage || '');
        setRelatedEventId(existingAnnouncement.relatedEventId || '');
        setOfficialSource(existingAnnouncement.officialSource || existingAnnouncement.infoSource || 'İslahiye Dijital Platformlar');
        setSourceUrl(existingAnnouncement.sourceUrl || '');
        setPublishedAt(existingAnnouncement.publishedAt || new Date().toISOString().split('T')[0]);
        setValidUntil(existingAnnouncement.validUntil || '');
        setPublicationStatus(existingAnnouncement.publicationStatus || 'draft');
        setVerificationStatus(existingAnnouncement.verificationStatus || 'verified');
        setErrors({});
        setActiveTab('form');
      } else {
        initializedKeyRef.current = id;
        setNotification({
          type: 'error',
          message: 'Duyuru kaydı bulunamadı.',
        });
        setTimeout(() => navigate('/yonetim/duyurular'), 1200);
      }
    } else if (!isEditing && initializedKeyRef.current !== '__create__') {
      initializedKeyRef.current = '__create__';
      setTitle('');
      setSummary('');
      setContentParagraphs('');
      setCategory('kurumsal');
      setPriority('normal');
      setCoverImage('');
      setRelatedEventId('');
      setOfficialSource('İslahiye Dijital Platformlar');
      setSourceUrl('');
      setPublishedAt(new Date().toISOString().split('T')[0]);
      setValidUntil('');
      setPublicationStatus('draft');
      setVerificationStatus('verified');
      setErrors({});
      setActiveTab('form');
    }
  }, [isEditing, id, existingAnnouncement, navigate]);

  const validate = (targetStatus: PublicationStatus): boolean => {
    const errs: Record<string, string> = {};
    const details: Array<{ name: string; label: string; message: string }> = [];

    if (!title.trim()) {
      errs.title = 'Duyuru başlığı zorunludur.';
      details.push({ name: 'title', label: 'Duyuru Başlığı', message: 'Duyuru başlığı boş bırakılamaz.' });
    }
    if (!summary.trim()) {
      errs.summary = 'Kısa özet zorunludur.';
      details.push({ name: 'summary', label: 'Kısa Özet', message: 'Ziyaretçi portalında görünecek özet zorunludur.' });
    }
    if (!contentParagraphs.trim()) {
      errs.contentParagraphs = 'Duyuru detay içeriği zorunludur.';
      details.push({ name: 'contentParagraphs', label: 'Detaylı İçerik', message: 'Duyurunun detay metin paragrafları zorunludur.' });
    }
    if (!officialSource.trim()) {
      errs.officialSource = 'İçerik kaynağı / kurum bilgisi zorunludur.';
      details.push({ name: 'officialSource', label: 'Resmî Kaynak / Kurum', message: 'İçerik kaynağı veya kurum bilgisi zorunludur.' });
    }
    const trimmedSourceUrl = sourceUrl.trim();
    if (trimmedSourceUrl && !/^https?:\/\/\S+/i.test(trimmedSourceUrl)) {
      errs.sourceUrl = 'Kaynak URL http:// veya https:// ile başlamalıdır.';
      details.push({ name: 'sourceUrl', label: 'Kaynak URL', message: 'Geçerli bir http:// veya https:// bağlantısı giriniz.' });
    } else if (targetStatus === 'published' && category === 'gastronomi' && !trimmedSourceUrl) {
      errs.sourceUrl = 'Resmî tescil duyurularında kaynak URL zorunludur.';
      details.push({ name: 'sourceUrl', label: 'Kaynak URL', message: 'Resmî tescil duyurularında kaynak URL zorunludur.' });
    }

    setErrors(errs);

    if (details.length > 0) {
      setNotification({
        type: 'error',
        title: 'Eksik veya Hatalı Bilgiler Mevcut',
        message: `${details.length} zorunlu alanda eksiklik var. Lütfen kırmızı ile vurgulanan alanları doldurunuz.`,
        fields: details,
        onScrollToField: scrollToField,
      });
      scrollToField(details[0].name);
      return false;
    }

    return true;
  };

  const handleSave = (targetStatus?: PublicationStatus) => {
    if (!canSave) {
      setNotification({
        type: 'error',
        title: 'Yetki Yetersiz',
        message: 'Aktif rolünüzle duyuru oluşturma veya düzenleme yetkiniz bulunmamaktadır.',
      });
      return;
    }

    const requestedStatus = targetStatus || publicationStatus;
    const nextStatus: PublicationStatus =
      !canPublish && (requestedStatus === 'published' || requestedStatus === 'archived')
        ? 'in_review'
        : requestedStatus;

    if (!validate(nextStatus)) {
      return;
    }

    const paragraphsArray = contentParagraphs
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const parsedDate = publishedAt ? new Date(`${publishedAt}T12:00:00`) : null;
    const formattedDate =
      parsedDate && !isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : publishedAt;

    const resolvedCategoryLabel = getCategoryLabel('announcement', category, 'Duyuru');
    const normalizedSource = officialSource.toLocaleLowerCase('tr-TR');

    const announcementData: Announcement = {
      id: existingAnnouncement?.id || `ann-${Date.now()}`,
      title: title.trim(),
      summary: summary.trim(),
      content: paragraphsArray.length > 0 ? paragraphsArray : [summary.trim()],
      detailedContent: contentParagraphs.trim(),
      category,
      categoryLabel: resolvedCategoryLabel,
      priority,
      coverImage: coverImage.trim() || undefined,
      relatedEventId: relatedEventId.trim() || undefined,
      publishedAt,
      formattedDate,
      validUntil: validUntil.trim() || undefined,
      publicationStatus: nextStatus,
      verificationStatus,
      contentOrigin: normalizedSource.includes('türkpatent')
        ? 'official_notice'
        : normalizedSource.includes('oda') || normalizedSource.includes('borsa')
        ? 'official_press'
        : 'editorial_narrative',
      officialSource: officialSource.trim(),
      infoSource: officialSource.trim(),
      sourceUrl: sourceUrl.trim() || undefined,
      isDemo: false,
      updatedAt: new Date().toISOString(),
    };

    const ok = saveAnnouncement(announcementData);
    if (!ok) {
      setNotification({
        type: 'error',
        title: 'Kayıt Hatası',
        message: 'Duyuru yerel depoya kaydedilemedi. Tarayıcı depolama alanını kontrol ediniz.',
      });
      return;
    }

    setPublicationStatus(nextStatus);
    setNotification({
      type: 'success',
      title:
        nextStatus === 'published'
          ? 'Duyuru Yayımlandı'
          : nextStatus === 'in_review'
          ? 'İncelemeye Gönderildi'
          : nextStatus === 'archived'
          ? 'Duyuru Arşivlendi'
          : 'Taslak Kaydedildi',
      message:
        nextStatus === 'published'
          ? 'Duyuru başarıyla yayımlandı ve ziyaretçi sayfasına yansıtıldı.'
          : nextStatus === 'in_review'
          ? 'Duyuru yayın onayı için incelemeye alındı (henüz yayında değil).'
          : nextStatus === 'archived'
          ? 'Duyuru arşivlendi ve ziyaretçi portalından kaldırıldı.'
          : 'Duyuru taslak olarak kaydedildi.',
    });

    setTimeout(() => {
      navigate('/yonetim/duyurular');
    }, 900);
  };

  const handleDelete = () => {
    if (!canDelete) return;
    if (existingAnnouncement) {
      deleteAnnouncement(existingAnnouncement.id);
      navigate('/yonetim/duyurular');
    }
  };

  const selectedCategoryLabel = getCategoryLabel(
    'announcement',
    category,
    existingAnnouncement?.categoryLabel || 'Duyuru'
  );
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

  const statusLabel =
    publicationStatus === 'published'
      ? 'Yayında'
      : publicationStatus === 'in_review'
      ? 'İncelemede'
      : publicationStatus === 'archived'
      ? 'Arşivde'
      : 'Taslak';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/yonetim/duyurular"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Duyuru listesine dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-sans font-bold text-slate-900">
                {isEditing ? 'Kurumsal Duyuruyu Düzenle' : 'Yeni Kurumsal Duyuru Oluştur'}
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
                {statusLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              İslahiye Dijital Platformlar ve resmî paydaş bilgilendirmeleri, coğrafi işaret kayıtları ve mevzuat bildirimleri.
            </p>
          </div>
        </div>

        {/* Tab Controls & Primary Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {Object.keys(errors).length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{Object.keys(errors).length} alanda hata</span>
            </span>
          )}

          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'form' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Form Editörü
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'preview' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ziyaretçi Önizlemesi</span>
            </button>
          </div>

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
              className="h-9 w-9 inline-flex items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200"
              title="Duyuruyu Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Notification Toast */}
      <FormNotificationToast notification={notification} onClose={() => setNotification(null)} />

      {/* Institutional Context Disclaimer */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs font-sans flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold block mb-0.5">Kurumsal Kaynak &amp; Yayımlama Sorumluluğu Ayrımı:</strong>
          TÜRKPATENT'ten gelen doğrulanmış tescil bilgileri otomatik olarak yerel platform tarafından yayımlanmış resmî kurumsal duyuru sayılmaz. Kaynak kurum (ör. TÜRKPATENT, Gaziantep Ticaret Borsası veya İslahiye Dijital Platformlar) ve kaynak URL alanı doğru seçilmelidir.
        </div>
      </div>

      {activeTab === 'form' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2-Column Content Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Temel Bilgiler */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <h2 className="text-sm font-sans font-bold text-slate-900 pb-2.5 border-b border-slate-100">
                1. Temel Bilgiler
              </h2>

              <div id="field-title" className="p-2 -m-2 rounded-lg transition-all duration-300">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duyuru Başlığı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ör: İslahiye Biberi Coğrafi İşaret Tescil Belgesi Resmî Kaydı"
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.title
                      ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                  } focus:outline-none focus:ring-2`}
                />
                {errors.title && <p className="text-xs text-rose-600 mt-1 font-sans">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Kategori <span className="text-rose-500">*</span>
                    </label>
                    <QuickCategoryButton
                      scope="announcement"
                      onCreated={(cat) => setCategory(cat.id as AnnouncementCategory)}
                    />
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  >
                    {mergeCategoryOption(
                      getCategories('announcement', true),
                      category,
                      'announcement',
                      getCategoryLabel('announcement', category, existingAnnouncement?.categoryLabel)
                    ).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Öncelik Derecesi</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'normal' | 'urgent')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  >
                    <option value="normal">Normal Bildirim</option>
                    <option value="urgent">Önemli / Öncelikli</option>
                  </select>
                </div>
              </div>

              <div id="field-summary" className="p-2 -m-2 rounded-lg transition-all duration-300">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kısa Özet (Listeleme Metni) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Ziyaretçi portalında kapalı kartta veya bülten listesinde görünecek 1-2 cümlelik özet..."
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.summary
                      ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                  } focus:outline-none focus:ring-2`}
                />
                {errors.summary && <p className="text-xs text-rose-600 mt-1 font-sans">{errors.summary}</p>}
              </div>

              <div id="field-contentParagraphs" className="p-2 -m-2 rounded-lg transition-all duration-300">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detaylı İçerik Metni <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  value={contentParagraphs}
                  onChange={(e) => setContentParagraphs(e.target.value)}
                  placeholder="Duyuru genişletildiğinde görünecek açıklamalar. Paragrafları ayırmak için Enter tuşuna basarak yeni satıra geçebilirsiniz..."
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.contentParagraphs
                      ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                  } focus:outline-none focus:ring-2 font-sans leading-relaxed`}
                />
                {errors.contentParagraphs && (
                  <p className="text-xs text-rose-600 mt-1 font-sans">{errors.contentParagraphs}</p>
                )}
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  İpucu: Her boşluk bırakılmış satır ziyaretçi sayfasında ayrı bir paragraf olarak biçimlendirilir.
                </p>
              </div>
            </div>

            {/* Section 2: Medya ve Kapak Görseli */}
            <div id="field-coverImage" className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <h2 className="text-sm font-sans font-bold text-slate-900 pb-2.5 border-b border-slate-100">
                2. Medya &amp; Kapak Görseli (İsteğe Bağlı)
              </h2>

              <ImageUploadField
                label="Duyuru Kapak Görseli"
                value={coverImage}
                onChange={setCoverImage}
              />
            </div>

            {/* Section 3: İlgili Etkinlik İlişkilendirmesi */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <h2 className="text-sm font-sans font-bold text-slate-900 pb-2.5 border-b border-slate-100">
                3. İlişkili Etkinlik Bağlantısı
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">İlgili Gastronomi Etkinliği</label>
                <select
                  value={relatedEventId}
                  onChange={(e) => setRelatedEventId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 bg-white"
                >
                  <option value="">Bağlantılı etkinlik yok (Genel kurumsal duyuru)</option>
                  {allEvents.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title} ({evt.formattedDate})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1 font-sans">
                  Duyuru bir etkinliğe ait çağrı veya program bildirimi ise ziyaretçi doğrudan etkinlik detayına yönlendirilebilir.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar / Publication & Compliance Controls */}
          <div className="space-y-6">
            {/* Section 4: Yayın Durumu */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <h2 className="text-sm font-sans font-bold text-slate-900 pb-2.5 border-b border-slate-100">
                Yayın Ayarları
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Yayın Durumu</label>
                <select
                  value={publicationStatus}
                  onChange={(e) => setPublicationStatus(e.target.value as PublicationStatus)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 bg-white"
                >
                  <option value="draft">Taslak (Ziyaretçiye Gizli)</option>
                  <option value="in_review">İncelemede</option>
                  <option value="published" disabled={!canPublish}>
                    Yayında (Ziyaretçiye Açık){!canPublish ? ' — Yetki Gerektirir' : ''}
                  </option>
                  <option value="archived" disabled={!canPublish}>
                    Arşivde
                  </option>
                </select>
                {!canPublish && (
                  <p className="text-[11px] text-amber-700 mt-1 font-sans">
                    Aktif rolünüz doğrudan yayına alma yetkisine sahip olmadığından duyuru incelemeye gönderilir.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Yayın Tarihi</label>
                <input
                  type="date"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Geçerlilik Bitiş Tarihi (İsteğe Bağlı)
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Section 5: Kaynak & Doğruluk */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <h2 className="text-sm font-sans font-bold text-slate-900 pb-2.5 border-b border-slate-100">
                Kaynak &amp; Şeffaflık
              </h2>

              <div id="field-officialSource" className="p-2 -m-2 rounded-lg transition-all duration-300">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resmî Kaynak / Kurum <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={officialSource}
                  onChange={(e) => setOfficialSource(e.target.value)}
                  placeholder="Ör: İslahiye Dijital Platformlar / TÜRKPATENT"
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.officialSource
                      ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                  } focus:outline-none focus:ring-2`}
                />
                {errors.officialSource && (
                  <p className="text-xs text-rose-600 mt-1 font-sans">{errors.officialSource}</p>
                )}
              </div>

              <div id="field-sourceUrl" className="p-2 -m-2 rounded-lg transition-all duration-300">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kaynak URL</label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://ci.turkpatent.gov.tr/..."
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.sourceUrl
                      ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                  } focus:outline-none focus:ring-2`}
                />
                {errors.sourceUrl && <p className="text-xs text-rose-600 mt-1 font-sans">{errors.sourceUrl}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doğrulama Statüsü</label>
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 bg-white"
                >
                  <option value="verified">Doğrulanmış Resmî Kayıt</option>
                  <option value="unverified">Doğrulanmamış / İnceleme Bekliyor</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Visitor Preview Tab */
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Ziyaretçi Portalı Canlı Önizlemesi
              </h3>
              <p className="text-xs text-slate-500">
                /duyurular sayfasında duyurunun ziyaretçi arayüzündeki görünümü.
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
              Yayın Durumu: {statusLabel}
            </span>
          </div>

          <div className="bg-ivory text-charcoal p-6 sm:p-10 rounded-xl border border-sand/80 shadow-xs space-y-6 font-sans">
            <div className="border-b border-sand/70 pb-4 flex items-center justify-between">
              <span className="text-xs font-sans uppercase tracking-wider text-copper font-bold flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>/duyurular Ziyaretçi Sayfası Önizlemesi</span>
              </span>
              <span className="text-xs font-sans text-charcoal/50">
                Yayın Durumu: <strong>{publicationStatus.toUpperCase()}</strong>
              </span>
            </div>

            <article className="bg-paper border border-sand/80 rounded-xl overflow-hidden shadow-xs">
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2.5 mb-2.5 text-xs font-sans">
                  <span className="px-2 py-0.5 rounded-md bg-forest text-ivory font-bold uppercase text-[10px] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Doğrulanmış Kayıt
                  </span>
                  <span className="text-copper-dark font-semibold uppercase">{selectedCategoryLabel}</span>
                  <span className="text-charcoal/40">•</span>
                  <span className="flex items-center gap-1 text-charcoal/50">
                    <Calendar className="w-3.5 h-3.5" />
                    {(() => {
                      const parsed = publishedAt ? new Date(`${publishedAt}T12:00:00`) : null;
                      return parsed && !isNaN(parsed.getTime())
                        ? parsed.toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : publishedAt || 'Tarih seçilmedi';
                    })()}
                  </span>
                </div>

                <h2 className="text-2xl font-display font-bold text-forest mb-2 leading-snug">
                  {title || 'Duyuru Başlığı Girilmedi'}
                </h2>

                <p className="text-sm text-charcoal/70 font-sans leading-relaxed mb-4">
                  {summary || 'Kısa özet metni buraya gelecektir.'}
                </p>

                {/* Render Full Content */}
                <div className="pt-4 border-t border-sand/60 space-y-3 text-sm font-sans text-charcoal/80 leading-relaxed bg-ivory/50 p-4 rounded-lg">
                  {contentParagraphs
                    ? contentParagraphs.split('\n').map((p, idx) => (
                        <p key={idx} className="m-0">
                          {p}
                        </p>
                      ))
                    : 'Detaylı duyuru metni henüz girilmedi.'}
                </div>

                <div className="pt-4 mt-4 border-t border-sand/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans text-charcoal/65">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-copper" />
                    <span>Kaynak: {officialSource}</span>
                  </div>

                  {sourceUrl && sanitizeUrl(sourceUrl) && (
                    <a
                      href={sanitizeUrl(sourceUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-copper hover:text-forest font-semibold transition-colors"
                    >
                      <span>Resmî Kaynağı İncele</span>
                      <Globe className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-slate-200 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-sans">
            Durum: <strong className="text-slate-800">{statusLabel}</strong>
          </span>
          {Object.keys(errors).length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{Object.keys(errors).length} zorunlu alanda eksik veya hatalı bilgi var</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Link
            to="/yonetim/duyurular"
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            İptal
          </Link>
          {canSave && publicationStatus !== 'draft' && (
            <button
              type="button"
              onClick={() => handleSave('draft')}
              className="px-4 py-2 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
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
            className="px-5 py-2 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition shadow-2xs disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{primaryButtonLabel}</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ActionConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Duyuruyu Silmek İstiyor musunuz?"
        message={`"${title}" başlıklı kurumsal duyuru silinecektir. Bu işlem geri alınamaz.`}
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        variant="danger"
      />
    </div>
  );
};
