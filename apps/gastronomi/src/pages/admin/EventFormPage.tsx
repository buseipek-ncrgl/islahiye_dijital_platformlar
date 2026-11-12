import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Eye,
  Calendar,
  Clock,
  MapPin,
  Users,
} from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import { useAdminRole } from '../../context/AdminRoleContext';
import { GastronomyEvent, EventType, PublicationStatus, VerificationStatus } from '../../types';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { FormNotificationToast, FormNotification } from '../../components/admin/common/FormNotificationToast';
import { ImageUploadField } from '../../components/admin/common/ImageUploadField';
import { ActionConfirmModal } from '../../components/admin/common/ActionConfirmModal';
import { QuickCategoryButton } from '../../components/admin/common/QuickCategoryButton';
import { mergeCategoryOption } from '../../data/categories';

export const EventFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getEventById, saveEvent, deleteEvent, getCategories, getCategoryLabel } = useContent();
  const { canCreate, canEdit, canDelete, canPublish } = useAdminRole();

  const isEditing = Boolean(id);
  const canSave = isEditing ? canEdit : canCreate;
  const existingEvent = useMemo(() => {
    if (!id) return undefined;
    return getEventById(id);
  }, [id, getEventById]);
  const initializedKeyRef = useRef<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [detailedContent, setDetailedContent] = useState('');
  const [eventType, setEventType] = useState<EventType>('workshop');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endTime, setEndTime] = useState('14:00');
  const [timezone] = useState('Europe/Istanbul');
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [coverImage, setCoverImage] = useState('/images/biber_kozleme_poster.jpg');
  const [organizerInfo, setOrganizerInfo] = useState('İslahiye Kültür ve Sanat Koordinasyonu');
  const [participationConditions, setParticipationConditions] = useState(
    'Katılım ücretsiz olup kontenjanla sınırlıdır.'
  );
  const [quota, setQuota] = useState<number | ''>(25);
  const [registrationUrl, setRegistrationUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
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

  // Generate slug
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

  // Populate form if editing, or reset cleanly when switching back to create mode
  useEffect(() => {
    if (isEditing && id) {
      if (initializedKeyRef.current === id) return;
      if (existingEvent) {
        initializedKeyRef.current = id;
        setTitle(existingEvent.title);
        setSlug(existingEvent.slug);
        setSubtitle(existingEvent.subtitle || '');
        setDescription(existingEvent.description);
        setDetailedContent(existingEvent.detailedContent || existingEvent.description);
        setEventType(existingEvent.eventType);
        setStartDate(existingEvent.startDate);
        setStartTime(existingEvent.startTime || existingEvent.time.split(' - ')[0] || '10:00');
        setEndDate(existingEvent.endDate || existingEvent.startDate);
        setEndTime(existingEvent.endTime || existingEvent.time.split(' - ')[1] || '14:00');
        setLocationName(existingEvent.locationName);
        setAddress(existingEvent.address || '');
        setIsOnline(existingEvent.isOnline ?? false);
        setCoverImage(existingEvent.coverImage);
        setOrganizerInfo(existingEvent.organizerInfo || 'İslahiye Kültür ve Sanat Koordinasyonu');
        setParticipationConditions(existingEvent.participationConditions || '');
        setQuota(existingEvent.quota !== undefined ? existingEvent.quota : 25);
        setRegistrationUrl(existingEvent.registrationUrl || '');
        setSourceUrl(existingEvent.sourceUrl || '');
        setPublicationStatus(existingEvent.publicationStatus || (existingEvent.status === 'completed' ? 'archived' : 'published'));
        setVerificationStatus(existingEvent.verificationStatus || 'verified');
        setErrors({});
        setActiveTab('form');
      } else {
        initializedKeyRef.current = id;
        setNotification({
          type: 'error',
          message: 'Etkinlik kaydı bulunamadı.',
        });
        setTimeout(() => navigate('/yonetim/etkinlikler'), 1200);
      }
    } else if (!isEditing && initializedKeyRef.current !== '__create__') {
      const today = new Date().toISOString().split('T')[0];
      initializedKeyRef.current = '__create__';
      setTitle('');
      setSlug('');
      setSubtitle('');
      setDescription('');
      setDetailedContent('');
      setEventType('workshop');
      setStartDate(today);
      setStartTime('10:00');
      setEndDate(today);
      setEndTime('14:00');
      setLocationName('');
      setAddress('');
      setIsOnline(false);
      setCoverImage('/images/biber_kozleme_poster.jpg');
      setOrganizerInfo('İslahiye Kültür ve Sanat Koordinasyonu');
      setParticipationConditions('Katılım ücretsiz olup kontenjanla sınırlıdır.');
      setQuota(25);
      setRegistrationUrl('');
      setSourceUrl('');
      setPublicationStatus('draft');
      setVerificationStatus('verified');
      setErrors({});
      setActiveTab('form');
    }
  }, [isEditing, id, existingEvent, navigate]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const details: Array<{ name: string; label: string; message: string }> = [];

    if (!title.trim()) {
      errs.title = 'Etkinlik adı zorunludur.';
      details.push({ name: 'title', label: 'Etkinlik Adı', message: 'Etkinlik başlığı boş bırakılamaz.' });
    }
    if (!description.trim()) {
      errs.description = 'Kısa açıklama zorunludur.';
      details.push({ name: 'description', label: 'Kısa Açıklama', message: 'Ziyaretçi etkinlik kartında görünecek özet zorunludur.' });
    }
    if (!startDate) {
      errs.startDate = 'Başlangıç tarihi zorunludur.';
      details.push({ name: 'startDate', label: 'Başlangıç Tarihi', message: 'Etkinliğin başlangıç tarihi seçilmelidir.' });
    }
    if (!endDate) {
      errs.endDate = 'Bitiş tarihi zorunludur.';
      details.push({ name: 'endDate', label: 'Bitiş Tarihi', message: 'Etkinliğin bitiş tarihi seçilmelidir.' });
    }

    // Temporal validation (Section 5 requirement)
    if (startDate && endDate) {
      const startDateTime = new Date(`${startDate}T${startTime || '00:00'}`);
      const endDateTime = new Date(`${endDate}T${endTime || '23:59'}`);

      if (!isNaN(startDateTime.getTime()) && !isNaN(endDateTime.getTime()) && endDateTime < startDateTime) {
        errs.endDate = 'Bitiş zamanı başlangıç zamanından önce olamaz.';
        details.push({ name: 'endDate', label: 'Bitiş Tarihi ve Saati', message: 'Bitiş zamanı başlangıç zamanından önce olamaz.' });
      }
    }

    if (!locationName.trim()) {
      errs.locationName = 'Mekân adı zorunludur.';
      details.push({ name: 'locationName', label: 'Mekân Adı', message: 'Mekân veya online platform adı zorunludur.' });
    }

    const trimmedRegUrl = registrationUrl.trim();
    if (trimmedRegUrl && !/^https?:\/\/\S+/i.test(trimmedRegUrl)) {
      errs.registrationUrl = 'Kayıt bağlantısı http:// veya https:// ile başlamalıdır.';
      details.push({ name: 'registrationUrl', label: 'Kayıt Bağlantısı', message: 'Geçerli bir http:// veya https:// bağlantısı giriniz.' });
    }

    const trimmedSourceUrl = sourceUrl.trim();
    if (trimmedSourceUrl && !/^https?:\/\/\S+/i.test(trimmedSourceUrl)) {
      errs.sourceUrl = 'Kaynak URL http:// veya https:// ile başlamalıdır.';
      details.push({ name: 'sourceUrl', label: 'Kaynak URL', message: 'Geçerli bir http:// veya https:// bağlantısı giriniz.' });
    }

    setErrors(errs);

    if (details.length > 0) {
      setNotification({
        type: 'error',
        title: 'Eksik veya Hatalı Bilgiler Mevcut',
        message: `${details.length} zorunlu alanda eksiklik var. Lütfen kırmızı ile vurgulanan alanları kontrol ediniz.`,
        fields: details,
        onScrollToField: scrollToField,
      });
      scrollToField(details[0].name);
      return false;
    }

    return true;
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing || !slug) {
      setSlug(generateSlug(val));
    }
  };

  const handleSave = (targetStatus?: PublicationStatus) => {
    if (!canSave) {
      setNotification({
        type: 'error',
        title: 'Yetki Yetersiz',
        message: 'Aktif rolünüzle etkinlik oluşturma veya düzenleme yetkiniz bulunmamaktadır.',
      });
      return;
    }

    if (!validate()) {
      return;
    }

    const requestedStatus = targetStatus || publicationStatus;
    const nextStatus: PublicationStatus =
      !canPublish && (requestedStatus === 'published' || requestedStatus === 'archived')
        ? 'in_review'
        : requestedStatus;
    const resolvedEventTypeLabel = getCategoryLabel('event', eventType, 'Etkinlik');

    const parsedDate = startDate ? new Date(`${startDate}T12:00:00`) : null;
    const formattedDate =
      parsedDate && !isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : startDate;

    // Dynamic upcoming status check
    const todayStr = new Date().toISOString().split('T')[0];
    const isUpcoming = (endDate || startDate) >= todayStr;
    const computedLegacyStatus = isUpcoming ? 'upcoming' : 'completed';

    const eventData: GastronomyEvent = {
      id: existingEvent?.id || `evt-${Date.now()}`,
      slug: slug || generateSlug(title),
      title: title.trim(),
      subtitle: subtitle.trim() || 'İslahiye Gastronomi Etkinliği',
      description: description.trim(),
      detailedContent: detailedContent.trim() || description.trim(),
      eventType,
      eventTypeLabel: resolvedEventTypeLabel,
      startDate,
      startTime,
      endDate,
      endTime,
      timezone,
      formattedDate,
      time: `${startTime} - ${endTime}`,
      locationName: locationName.trim(),
      address: address.trim() || (isOnline ? 'Çevrim İçi' : 'İslahiye, Gaziantep'),
      isOnline,
      coverImage: coverImage.trim() || '/images/biber_kozleme_poster.jpg',
      imageCredit: 'İslahiye Lezzet Atlası Arşivi',
      status: computedLegacyStatus,
      statusLabel: computedLegacyStatus === 'upcoming' ? 'Yaklaşan Etkinlik' : 'Tamamlandı',
      registrationStatus: 'open',
      registrationStatusLabel: 'Katılıma Açık',
      targetAudience: 'Tüm Gastronomi Meraklıları',
      organizerInfo: organizerInfo.trim() || undefined,
      participationConditions: participationConditions.trim() || undefined,
      quota: typeof quota === 'number' ? quota : undefined,
      registrationUrl: registrationUrl.trim() || undefined,
      publicationStatus: nextStatus,
      verificationStatus,
      contentOrigin: 'editorial_narrative',
      sourceUrl: sourceUrl.trim() || undefined,
      isDemo: false,
      tags: [resolvedEventTypeLabel, 'İslahiye', isOnline ? 'Çevrim İçi' : 'Yüz Yüze'],
      updatedAt: new Date().toISOString(),
    };

    const ok = saveEvent(eventData);
    if (!ok) {
      setNotification({
        type: 'error',
        title: 'Kayıt Hatası',
        message: 'Etkinlik yerel depoya kaydedilemedi. Tarayıcı depolama alanını kontrol ediniz.',
      });
      return;
    }

    setPublicationStatus(nextStatus);
    setNotification({
      type: 'success',
      title:
        nextStatus === 'published'
          ? 'Etkinlik Yayımlandı'
          : nextStatus === 'in_review'
          ? 'İncelemeye Gönderildi'
          : nextStatus === 'archived'
          ? 'Etkinlik Arşivlendi'
          : 'Taslak Kaydedildi',
      message:
        nextStatus === 'published'
          ? 'Etkinlik başarıyla yayımlandı ve /etkinlikler sayfasına yansıtıldı.'
          : nextStatus === 'in_review'
          ? 'Etkinlik yayın onayı için incelemeye alındı (henüz yayında değil).'
          : nextStatus === 'archived'
          ? 'Etkinlik arşivlendi ve ziyaretçi portalından kaldırıldı.'
          : 'Etkinlik taslak olarak kaydedildi.',
    });

    setTimeout(() => {
      navigate('/yonetim/etkinlikler');
    }, 900);
  };

  const handleDelete = () => {
    if (!canDelete) return;
    if (existingEvent) {
      deleteEvent(existingEvent.id);
      navigate('/yonetim/etkinlikler');
    }
  };

  const selectedTypeLabel = getCategoryLabel(
    'event',
    eventType,
    existingEvent?.eventTypeLabel || 'Etkinlik'
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
            to="/yonetim/etkinlikler"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Etkinlik listesine dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-sans font-bold text-slate-900">
                {isEditing ? 'Gastronomi Etkinliğini Düzenle' : 'Yeni Gastronomi Etkinliği Ekle'}
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
              Usta ocaklık atölyeleri, biber hasat günleri ve tadım buluşmaları içerik yönetimi.
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
              title="Etkinliği Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Notification Toast */}
      <FormNotificationToast notification={notification} onClose={() => setNotification(null)} />

      {activeTab === 'form' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2-Column Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Temel Bilgiler */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <h2 className="text-sm font-sans font-bold text-slate-900 pb-2.5 border-b border-slate-100">
                1. Temel Bilgiler
              </h2>

              <div id="field-title" className="p-2 -m-2 rounded-lg transition-all duration-300">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Etkinlik Adı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ör: Geleneksel Taş Fırın Tava & Lavaş Atölyesi"
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
                      Etkinlik Türü <span className="text-rose-500">*</span>
                    </label>
                    <QuickCategoryButton
                      scope="event"
                      onCreated={(cat) => setEventType(cat.id as EventType)}
                    />
                  </div>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventType)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 bg-white"
                  >
                    {mergeCategoryOption(
                      getCategories('event', true),
                      eventType,
                      'event',
                      getCategoryLabel('event', eventType, existingEvent?.eventTypeLabel)
                    ).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">URL Kısaltması (Slug)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-sans text-xs"
                  />
                </div>
              </div>

              <div id="field-description" className="p-2 -m-2 rounded-lg transition-all duration-300">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kısa Açıklama (Kart Metni) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ziyaretçi etkinlik kartında görünecek 1-2 cümlelik özet..."
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.description
                      ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                  } focus:outline-none focus:ring-2`}
                />
                {errors.description && <p className="text-xs text-rose-600 mt-1 font-sans">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detaylı İçerik ve Program</label>
                <textarea
                  rows={5}
                  value={detailedContent}
                  onChange={(e) => setDetailedContent(e.target.value)}
                  placeholder="Etkinlik modalında ve detayında yer alacak kapsamlı program, atölye içeriği..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-sans leading-relaxed"
                />
              </div>
            </div>

            {/* Section 2: Tarih, Saat ve Mekân */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <h2 className="text-sm font-sans font-bold text-slate-900 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                <span>2. Tarih, Saat &amp; Mekân</span>
                <span className="text-[11px] text-slate-500 font-sans">Saat Dilimi: {timezone}</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div id="field-startDate" className="p-2 -m-2 rounded-lg transition-all duration-300">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Başlangıç Tarihi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${
                      errors.startDate
                        ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                    } focus:outline-none focus:ring-2`}
                  />
                  {errors.startDate && <p className="text-xs text-rose-600 mt-1 font-sans">{errors.startDate}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Başlangıç Saati</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div id="field-endDate" className="p-2 -m-2 rounded-lg transition-all duration-300">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bitiş Tarihi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${
                      errors.endDate
                        ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                    } focus:outline-none focus:ring-2`}
                  />
                  {errors.endDate && <p className="text-xs text-rose-600 mt-1 font-sans">{errors.endDate}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bitiş Saati</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div id="field-locationName" className="p-2 -m-2 rounded-lg transition-all duration-300">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mekân Adı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Ör: İslahiye Taş Fırınları Meydanı veya İslahiye Kültür Merkezi"
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.locationName
                      ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                  } focus:outline-none focus:ring-2`}
                />
                {errors.locationName && (
                  <p className="text-xs text-rose-600 mt-1 font-sans">{errors.locationName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Açık Adres (Doğrulanmışsa)</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Mahalle, cadde, ilçe (yalnızca doğrulanmış adres)..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOnline}
                    onChange={(e) => setIsOnline(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-emerald-700 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Çevrim İçi (Online Web Semineri / Canlı Yayın)
                  </span>
                </label>
              </div>
            </div>

            {/* Section 3: Katılım & Kayıt */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <h2 className="text-sm font-sans font-bold text-slate-900 pb-2.5 border-b border-slate-100">
                3. Katılım Şartları &amp; Kontenjan
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kontenjan (Kişi)</label>
                  <input
                    type="number"
                    value={quota}
                    onChange={(e) => setQuota(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ör: 30"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Organizasyon / Düzenleyen</label>
                  <input
                    type="text"
                    value={organizerInfo}
                    onChange={(e) => setOrganizerInfo(e.target.value)}
                    placeholder="Ör: İslahiye Kültür ve Sanat Koordinasyonu"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Katılım Koşulları</label>
                <textarea
                  rows={2}
                  value={participationConditions}
                  onChange={(e) => setParticipationConditions(e.target.value)}
                  placeholder="Ör: Katılım ücretsizdir, hijyen kuralları gereği ön kayıt zorunludur..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div id="field-registrationUrl" className="p-2 -m-2 rounded-lg transition-all duration-300">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Harici Resmî Kayıt Bağlantısı (Varsa)
                </label>
                <input
                  type="url"
                  value={registrationUrl}
                  onChange={(e) => setRegistrationUrl(e.target.value)}
                  placeholder="https://... veya boş bırakın"
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.registrationUrl
                      ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                  } focus:outline-none focus:ring-2`}
                />
                {errors.registrationUrl && <p className="text-xs text-rose-600 mt-1 font-sans">{errors.registrationUrl}</p>}
              </div>
            </div>

            {/* Section 4: Medya & Görsel */}
            <div id="field-coverImage" className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <h2 className="text-sm font-sans font-bold text-slate-900 pb-2.5 border-b border-slate-100">
                4. Etkinlik Görseli
              </h2>

              <ImageUploadField
                label="Etkinlik Kapak Fotoğrafı"
                value={coverImage}
                onChange={setCoverImage}
              />
            </div>
          </div>

          {/* Sidebar Section */}
          <div className="space-y-6">
            {/* Yayın Ayarları */}
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
                    Arşivde / Tamamlandı
                  </option>
                </select>
                {!canPublish && (
                  <p className="text-[11px] text-amber-700 mt-1 font-sans">
                    Aktif rolünüz doğrudan yayına alma yetkisine sahip olmadığından etkinlik incelemeye gönderilir.
                  </p>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-sans space-y-1 text-slate-600">
                <div>
                  Dönem Hesabı: <strong>{(endDate || startDate) >= new Date().toISOString().split('T')[0] ? 'Gelecek / Yaklaşan' : 'Geçmiş / Arşiv'}</strong>
                </div>
                <div className="text-[10px] text-slate-400">
                  Tarih hesabı güncel güne göre otomatik olarak yapılmaktadır.
                </div>
              </div>
            </div>

            {/* Doğruluk ve Şeffaflık */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
              <h2 className="text-sm font-sans font-bold text-slate-900 pb-2.5 border-b border-slate-100">
                Kaynak &amp; Şeffaflık
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doğrulama Statüsü</label>
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 bg-white"
                >
                  <option value="verified">Doğrulanmış Program</option>
                  <option value="unverified">Doğrulanmamış / Taslak</option>
                </select>
              </div>

              <div id="field-sourceUrl" className="p-2 -m-2 rounded-lg transition-all duration-300">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kaynak URL (İsteğe Bağlı)</label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.sourceUrl
                      ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-500/20'
                  } focus:outline-none focus:ring-2`}
                />
                {errors.sourceUrl && <p className="text-xs text-rose-600 mt-1 font-sans">{errors.sourceUrl}</p>}
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
                /etkinlikler sayfasında etkinlik kartının ziyaretçi arayüzündeki görünümü.
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
                <span>/etkinlikler Ziyaretçi Kartı Önizlemesi</span>
              </span>
              <span className="text-xs font-sans text-charcoal/50">
                Yayın Durumu: <strong>{publicationStatus.toUpperCase()}</strong>
              </span>
            </div>

            <div className="max-w-md mx-auto">
              <article className="bg-paper border border-sand/80 rounded-xl overflow-hidden shadow-xs">
                <div className="relative aspect-[16/9] bg-sand/20 overflow-hidden">
                  <ImageWithFallback
                    src={coverImage}
                    alt={title}
                    fallbackText={title}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-forest text-ivory">
                      {selectedTypeLabel}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-2 mb-4 text-xs font-sans text-charcoal/70 pb-4 border-b border-sand/60">
                    <div className="flex items-center gap-2 text-copper-dark font-semibold">
                      <Calendar className="w-4 h-4 text-copper shrink-0" />
                      <span>
                        {(() => {
                          const parsed = startDate ? new Date(`${startDate}T12:00:00`) : null;
                          return parsed && !isNaN(parsed.getTime())
                            ? parsed.toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            : startDate || 'Tarih seçilmedi';
                        })()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-copper shrink-0" />
                      <span>
                        {startTime} - {endTime} ({timezone})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-copper shrink-0" />
                      <span>{locationName}</span>
                    </div>
                    {quota && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-copper shrink-0" />
                        <span>Kontenjan: {quota} Kişi</span>
                      </div>
                    )}
                  </div>

                  <h2 className="text-xl font-display font-bold text-forest mb-2 leading-snug">
                    {title || 'Etkinlik Başlığı'}
                  </h2>

                  <p className="text-xs sm:text-sm text-charcoal/75 font-sans leading-relaxed mb-6">
                    {description || 'Etkinlik açıklaması henüz girilmedi.'}
                  </p>

                  <div className="pt-4 border-t border-sand/60 flex items-center justify-between">
                    <span className="text-[11px] font-sans text-charcoal/50">
                      {organizerInfo}
                    </span>

                    <span className="px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider">
                      Program & Katılım
                    </span>
                  </div>
                </div>
              </article>
            </div>
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
            to="/yonetim/etkinlikler"
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
        title="Etkinliği Silmek İstiyor musunuz?"
        message={`"${title}" başlıklı etkinlik kaydı silinecektir. Bu işlem geri alınamaz.`}
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        variant="danger"
      />
    </div>
  );
};
