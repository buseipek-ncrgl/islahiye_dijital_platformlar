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
  Calendar,
  Clock,
  MapPin,
  Users,
} from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import { GastronomyEvent, EventType, PublicationStatus, VerificationStatus } from '../../types';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';

const PRESET_COVERS = [
  { label: 'Biber Közleme & Hasat', url: '/images/biber_kozleme_poster.jpg' },
  { label: 'Taş Fırın & Meşe Közü', url: '/images/tas_firin_kozu_poster.jpg' },
  { label: 'Hamur Zanaatı & Fırın', url: '/images/hamur_zanaati_poster.jpg' },
  { label: 'İslahiye Biber Sergisi', url: '/images/islahiye_biberi.jpg' },
  { label: 'Geleneksel Mutfak', url: '/images/islahiye_tava.jpg' },
  { label: 'Amanos Firik Pilavı', url: '/images/firik_pilavi.jpg' },
];

const EVENT_TYPES: { id: EventType; label: string }[] = [
  { id: 'workshop', label: 'Usta Atölyesi' },
  { id: 'tasting', label: 'Tadım & Hasat Buluşması' },
  { id: 'symposium', label: 'Sempozyum & Panel' },
  { id: 'festival', label: 'Festival & Şenlik' },
];

export const EventFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getEventById, saveEvent, deleteEvent } = useContent();

  const isEditing = Boolean(id);
  const existingEvent = useMemo(() => {
    if (!id) return undefined;
    return getEventById(id);
  }, [id, getEventById]);

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
  const [locationName, setLocationName] = useState('İslahiye Belediyesi Kültür Merkezi');
  const [address, setAddress] = useState('Cumhuriyet Mah. İstasyon Cad. No:12, İslahiye / Gaziantep');
  const [isOnline, setIsOnline] = useState(false);
  const [coverImage, setCoverImage] = useState('/images/biber_kozleme_poster.jpg');
  const [organizerInfo, setOrganizerInfo] = useState('İslahiye Kültür ve Sanat Koordinasyonu');
  const [participationConditions, setParticipationConditions] = useState(
    'Katılım ücretsiz olup kontenjanla sınırlıdır. Örnek demo gösterimidir.'
  );
  const [quota, setQuota] = useState<number | ''>(25);
  const [registrationUrl, setRegistrationUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [publicationStatus, setPublicationStatus] = useState<PublicationStatus>('draft');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('verified');
  const [isDemo, setIsDemo] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Generate slug
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
    if (existingEvent) {
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
      setIsDemo(existingEvent.isDemo ?? true);
    }
  }, [existingEvent]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Etkinlik adı zorunludur.';
    if (!description.trim()) errs.description = 'Kısa açıklama zorunludur.';
    if (!locationName.trim()) errs.locationName = 'Mekân adı zorunludur.';
    if (!startDate) errs.startDate = 'Başlangıç tarihi zorunludur.';
    if (!endDate) errs.endDate = 'Bitiş tarihi zorunludur.';

    // Temporal validation (Section 5 requirement)
    const startDateTime = new Date(`${startDate}T${startTime || '00:00'}`);
    const endDateTime = new Date(`${endDate}T${endTime || '23:59'}`);

    if (endDateTime < startDateTime) {
      errs.endDate = 'Bitiş zamanı başlangıç zamanından önce olamaz.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing || !slug) {
      setSlug(generateSlug(val));
    }
  };

  const handleSave = (targetStatus?: PublicationStatus) => {
    if (!validate()) {
      setNotification({ type: 'error', message: 'Lütfen formdaki hataları ve tarih sırasını kontrol edin.' });
      return;
    }

    const nextStatus = targetStatus || publicationStatus;
    const typeObj = EVENT_TYPES.find((t) => t.id === eventType);

    const formattedDate = new Date(startDate).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

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
      eventTypeLabel: typeObj?.label || 'Etkinlik',
      startDate,
      startTime,
      endDate,
      endTime,
      timezone,
      formattedDate,
      time: `${startTime} - ${endTime}`,
      locationName: locationName.trim(),
      address: address.trim() || 'İslahiye / Gaziantep',
      isOnline,
      coverImage: coverImage.trim() || '/images/biber_kozleme_poster.jpg',
      imageCredit: 'İslahiye Lezzet Atlası Demo Arşivi',
      status: computedLegacyStatus,
      statusLabel: computedLegacyStatus === 'upcoming' ? 'Yaklaşan Etkinlik' : 'Tamamlandı',
      registrationStatus: 'open',
      registrationStatusLabel: 'Ön Kayıt (Demo)',
      targetAudience: 'Tüm Gastronomi Meraklıları',
      organizerInfo: organizerInfo.trim() || undefined,
      participationConditions: participationConditions.trim() || undefined,
      quota: typeof quota === 'number' ? quota : undefined,
      registrationUrl: registrationUrl.trim() || undefined,
      publicationStatus: nextStatus,
      verificationStatus,
      contentOrigin: 'editorial_narrative',
      sourceUrl: sourceUrl.trim() || undefined,
      isDemo,
      tags: [typeObj?.label || 'Etkinlik', 'İslahiye', isOnline ? 'Çevrim İçi' : 'Yüz Yüze'],
      updatedAt: new Date().toISOString(),
    };

    saveEvent(eventData);

    setNotification({
      type: 'success',
      message:
        nextStatus === 'published'
          ? 'Etkinlik başarıyla yayımlandı ve /etkinlikler sayfasına yansıtıldı.'
          : 'Etkinlik taslak olarak kaydedildi.',
    });

    setTimeout(() => {
      navigate('/yonetim/etkinlikler');
    }, 900);
  };

  const handleDelete = () => {
    if (existingEvent) {
      deleteEvent(existingEvent.id);
      navigate('/yonetim/etkinlikler');
    }
  };

  const selectedTypeLabel = EVENT_TYPES.find((t) => t.id === eventType)?.label || 'Etkinlik';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/yonetim/etkinlikler"
            className="p-2 rounded-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Etkinlik listesine dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-sans font-bold text-slate-900">
              {isEditing ? 'Gastronomi Etkinliğini Düzenle' : 'Yeni Gastronomi Etkinliği Ekle'}
            </h1>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Usta ocaklık atölyeleri, biber hasat günleri ve tadım buluşmaları içerik yönetimi.
            </p>
          </div>
        </div>

        {/* Tab Controls & Primary Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-sm bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`px-3 py-1 text-xs font-semibold rounded-xs transition-colors ${
                activeTab === 'form' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Form Editörü
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 text-xs font-semibold rounded-xs transition-colors flex items-center gap-1.5 ${
                activeTab === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-copper" />
              <span>Ziyaretçi Önizlemesi</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleSave('draft')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Taslak Kaydet</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('published')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-forest hover:bg-forest-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Yayımla (Demo)</span>
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="p-2 rounded-sm text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200"
              title="Etkinliği Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-sm text-xs font-sans flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
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
            className="text-slate-400 hover:text-slate-600 font-mono text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Institutional Event Disclaimer Banner */}
      <div className="p-4 rounded-sm bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs font-sans flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold block mb-0.5">Etkinlik Başvuru ve Kayıt Simülasyonu Sınırları:</strong>
          Bu platformda gerçek başvuru toplama, online biletleme veya ödeme altyapısı bulunmamaktadır. Kayıt bağlantısı mevcutsa kullanıcı yalnızca doğrulanmış harici resmi bağlantıya yönlendirilebilir. Temsili etkinliklerdeki kayıt butonu ziyaretçiye yalnızca demo modalı gösterir.
        </div>
      </div>

      {activeTab === 'form' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2-Column Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Temel Bilgiler */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100">
                1. Temel Bilgiler
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Etkinlik Adı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ör: Geleneksel Taş Fırın Tava & Lavaş Atölyesi"
                  className={`w-full px-3 py-2 text-sm rounded-sm border ${
                    errors.title ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-hidden focus:ring-1 focus:ring-forest`}
                />
                {errors.title && <p className="text-xs text-rose-600 mt-1 font-sans">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Etkinlik Türü <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventType)}
                    className="w-full px-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest bg-white"
                  >
                    {EVENT_TYPES.map((t) => (
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
                    className="w-full px-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kısa Açıklama (Kart Metni) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ziyaretçi etkinlik kartında görünecek 1-2 cümlelik özet..."
                  className={`w-full px-3 py-2 text-sm rounded-sm border ${
                    errors.description ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-hidden focus:ring-1 focus:ring-forest`}
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
                  className="w-full px-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest font-sans leading-relaxed"
                />
              </div>
            </div>

            {/* Section 2: Tarih, Saat ve Mekân */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>2. Tarih, Saat & Mekân</span>
                <span className="text-[11px] text-slate-400 font-mono">Saat Dilimi: {timezone}</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Başlangıç Tarihi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Başlangıç Saati</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bitiş Tarihi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-sm border ${
                      errors.endDate ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                    } focus:outline-hidden focus:ring-1 focus:ring-forest`}
                  />
                  {errors.endDate && <p className="text-xs text-rose-600 mt-1 font-sans">{errors.endDate}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bitiş Saati</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mekân Adı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Ör: İslahiye Taş Fırınları Meydanı veya İslahiye Kültür Merkezi Konferans Salonu"
                  className={`w-full px-3 py-2 text-sm rounded-sm border ${
                    errors.locationName ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-hidden focus:ring-1 focus:ring-forest`}
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
                  placeholder="Cadde, sokak, no, ilçe..."
                  className="w-full px-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOnline}
                    onChange={(e) => setIsOnline(e.target.checked)}
                    className="rounded-xs border-slate-300 text-forest focus:ring-forest"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Çevrim İçi (Online Web Semineri / Canlı Yayın)
                  </span>
                </label>
              </div>
            </div>

            {/* Section 3: Katılım & Kayıt */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100">
                3. Katılım Şartları & Kontenjan
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kontenjan (Kişi)</label>
                  <input
                    type="number"
                    value={quota}
                    onChange={(e) => setQuota(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ör: 30"
                    className="w-full px-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Organizasyon / Düzenleyen</label>
                  <input
                    type="text"
                    value={organizerInfo}
                    onChange={(e) => setOrganizerInfo(e.target.value)}
                    placeholder="Ör: İslahiye Kültür ve Sanat Koordinasyonu"
                    className="w-full px-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest"
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
                  className="w-full px-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Harici Resmî Kayıt Bağlantısı (Varsa)
                </label>
                <input
                  type="url"
                  value={registrationUrl}
                  onChange={(e) => setRegistrationUrl(e.target.value)}
                  placeholder="https://islahiyeto.org.tr/etkinlik-kayit veya boş bırakın"
                  className="w-full px-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest"
                />
              </div>
            </div>

            {/* Section 4: Medya & Görsel */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100">
                4. Etkinlik Görseli
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Görsel URL</label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-500 mb-2">
                  Hazır Doğrulanmış Görsellerden Seçin:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_COVERS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setCoverImage(preset.url)}
                      className={`text-left p-2 rounded-xs border text-xs transition-colors flex items-center gap-2 ${
                        coverImage === preset.url
                          ? 'border-forest bg-forest-50/50 text-forest font-semibold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xs overflow-hidden shrink-0 bg-slate-100">
                        <img src={preset.url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Section */}
          <div className="space-y-6">
            {/* Yayın Ayarları */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100">
                Yayın Ayarları
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Yayın Durumu</label>
                <select
                  value={publicationStatus}
                  onChange={(e) => setPublicationStatus(e.target.value as PublicationStatus)}
                  className="w-full px-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest bg-white"
                >
                  <option value="draft">Taslak (Ziyaretçiye Gizli)</option>
                  <option value="in_review">İncelemede</option>
                  <option value="published">Yayında (Ziyaretçiye Açık)</option>
                  <option value="archived">Arşivde / Tamamlandı</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xs border border-slate-200 text-xs font-mono space-y-1 text-slate-600">
                <div>
                  Dönem Hesabı: <strong>{(endDate || startDate) >= new Date().toISOString().split('T')[0] ? 'Gelecek / Yaklaşan' : 'Geçmiş / Arşiv'}</strong>
                </div>
                <div className="text-[10px] text-slate-400">
                  Tarih hesabı güncel güne göre otomatik olarak yapılmaktadır.
                </div>
              </div>
            </div>

            {/* Doğruluk ve Şeffaflık */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100">
                Kaynak & Şeffaflık
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doğrulama Statüsü</label>
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus)}
                  className="w-full px-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest bg-white"
                >
                  <option value="verified">Doğrulanmış Program</option>
                  <option value="unverified">Doğrulanmamış / Taslak</option>
                  <option value="simulated">Temsili Simülasyon</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kaynak URL (İsteğe Bağlı)</label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDemo}
                    onChange={(e) => setIsDemo(e.target.checked)}
                    className="mt-0.5 rounded-xs border-slate-300 text-forest focus:ring-forest"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Temsili Demo Modeli</span>
                    <span className="text-[11px] text-slate-500 font-sans leading-tight block mt-0.5">
                      İşaretlendiğinde ziyaretçi arayüzünde "Temsili Demo Modeli" etiketiyle sunulur.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Visitor Preview Tab */
        <div className="bg-ivory text-charcoal p-6 sm:p-10 rounded-sm border border-sand/80 shadow-xs space-y-6">
          <div className="border-b border-sand/70 pb-4 flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-copper font-bold flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>/etkinlikler Ziyaretçi Kartı Önizlemesi</span>
            </span>
            <span className="text-xs font-mono text-charcoal/50">
              Yayın Durumu: <strong>{publicationStatus.toUpperCase()}</strong>
            </span>
          </div>

          <div className="max-w-md mx-auto">
            <article className="bg-paper border border-sand/80 rounded-sm overflow-hidden shadow-xs">
              <div className="relative aspect-[16/9] bg-sand/20 overflow-hidden">
                <ImageWithFallback
                  src={coverImage}
                  alt={title}
                  fallbackText={title}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-xs bg-forest text-ivory">
                    {selectedTypeLabel}
                  </span>
                </div>
                {isDemo && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2.5 py-1 rounded-xs bg-sand/90 text-charcoal border border-sand">
                      Temsili Demo Modeli
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="space-y-2 mb-4 text-xs font-mono text-charcoal/70 pb-4 border-b border-sand/60">
                  <div className="flex items-center gap-2 text-copper-dark font-semibold">
                    <Calendar className="w-4 h-4 text-copper shrink-0" />
                    <span>
                      {new Date(startDate).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
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
                  <span className="text-[11px] font-mono text-charcoal/50">
                    {organizerInfo}
                  </span>

                  <span className="px-3 py-1.5 rounded-sm bg-forest text-ivory text-xs font-semibold uppercase tracking-wider">
                    Ön Kayıt (Demo)
                  </span>
                </div>
              </div>
            </article>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">Etkinliği Silmek İstiyor musunuz?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              <strong>"{title}"</strong> başlıklı etkinlik kaydı silinecektir. Bu işlem geri alınamaz.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
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
