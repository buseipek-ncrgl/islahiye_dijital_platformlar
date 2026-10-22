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
  Building,
  ShieldCheck,
} from 'lucide-react';
import { useContent } from '../../hooks/useContent';
import { Announcement, AnnouncementCategory, PublicationStatus, VerificationStatus } from '../../types';

const PRESET_COVERS = [
  { label: 'İslahiye Biber Sergisi', url: '/images/islahiye_biberi.jpg' },
  { label: 'Biber Közleme & Hasat', url: '/images/biber_kozleme_poster.jpg' },
  { label: 'Taş Fırın & Meşe Közü', url: '/images/tas_firin_kozu_poster.jpg' },
  { label: 'Hamur Zanaatı & Fırın', url: '/images/hamur_zanaati_poster.jpg' },
  { label: 'Geleneksel Mutfak', url: '/images/islahiye_tava.jpg' },
  { label: 'Amanos Firik Pilavı', url: '/images/firik_pilavi.jpg' },
];

const CATEGORIES: { id: AnnouncementCategory; label: string }[] = [
  { id: 'gastronomi', label: 'Resmî Coğrafi İşaret' },
  { id: 'kurumsal', label: 'Kurumsal Bilgilendirme' },
  { id: 'kultur', label: 'Kültürel Program' },
  { id: 'egitim', label: 'Eğitim & Gelişim' },
];

export const AnnouncementFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAnnouncementById, saveAnnouncement, deleteAnnouncement, getEvents } = useContent();

  const isEditing = Boolean(id);
  const existingAnnouncement = useMemo(() => {
    if (!id) return undefined;
    return getAnnouncementById(id);
  }, [id, getAnnouncementById]);

  const allEvents = useMemo(() => getEvents(false), [getEvents]);

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
  const [isDemo, setIsDemo] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Populate form if editing
  useEffect(() => {
    if (existingAnnouncement) {
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
      setIsDemo(existingAnnouncement.isDemo ?? true);
    }
  }, [existingAnnouncement]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Duyuru başlığı zorunludur.';
    if (!summary.trim()) errs.summary = 'Kısa özet zorunludur.';
    if (!contentParagraphs.trim()) errs.contentParagraphs = 'Duyuru detay içeriği zorunludur.';
    if (!officialSource.trim()) errs.officialSource = 'İçerik kaynağı / kurum bilgisi zorunludur.';
    if (publicationStatus === 'published' && isDemo === false && !sourceUrl.trim()) {
      errs.sourceUrl = 'Resmî / gerçek doğruluk iddia edilen duyurularda kaynak URL zorunludur.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (targetStatus?: PublicationStatus) => {
    if (!validate()) {
      setNotification({ type: 'error', message: 'Lütfen zorunlu alanları doldurun.' });
      return;
    }

    const nextStatus = targetStatus || publicationStatus;
    const paragraphsArray = contentParagraphs
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const formattedDate = new Date(publishedAt).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const categoryObj = CATEGORIES.find((c) => c.id === category);

    const announcementData: Announcement = {
      id: existingAnnouncement?.id || `ann-${Date.now()}`,
      title: title.trim(),
      summary: summary.trim(),
      content: paragraphsArray.length > 0 ? paragraphsArray : [summary.trim()],
      detailedContent: contentParagraphs.trim(),
      category,
      categoryLabel: categoryObj?.label || 'Duyuru',
      priority,
      coverImage: coverImage.trim() || undefined,
      relatedEventId: relatedEventId.trim() || undefined,
      publishedAt,
      formattedDate,
      validUntil: validUntil.trim() || undefined,
      publicationStatus: nextStatus,
      verificationStatus,
      contentOrigin: officialSource.toLowerCase().includes('türkpatent')
        ? 'official_notice'
        : officialSource.toLowerCase().includes('oda') || officialSource.toLowerCase().includes('borsa')
        ? 'official_press'
        : 'editorial_narrative',
      officialSource: officialSource.trim(),
      infoSource: officialSource.trim(),
      sourceUrl: sourceUrl.trim() || undefined,
      isDemo,
      updatedAt: new Date().toISOString(),
    };

    saveAnnouncement(announcementData);

    setNotification({
      type: 'success',
      message:
        nextStatus === 'published'
          ? 'Duyuru başarıyla yayımlandı ve ziyaretçi sayfasına yansıtıldı.'
          : 'Duyuru taslak olarak kaydedildi.',
    });

    setTimeout(() => {
      navigate('/yonetim/duyurular');
    }, 900);
  };

  const handleDelete = () => {
    if (existingAnnouncement) {
      deleteAnnouncement(existingAnnouncement.id);
      navigate('/yonetim/duyurular');
    }
  };

  const selectedCategoryLabel = CATEGORIES.find((c) => c.id === category)?.label || 'Duyuru';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/yonetim/duyurular"
            className="p-2 rounded-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Duyuru listesine dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-sans font-bold text-slate-900">
              {isEditing ? 'Kurumsal Duyuruyu Düzenle' : 'Yeni Kurumsal Duyuru Oluştur'}
            </h1>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              İslahiye Dijital Platformlar ve resmî paydaş bilgilendirmeleri, coğrafi işaret kayıtları ve mevzuat bildirimleri.
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
              title="Duyuruyu Sil"
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

      {/* Institutional Context Disclaimer */}
      <div className="p-4 rounded-sm bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs font-sans flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold block mb-0.5">Kurumsal Kaynak & Yayımlama Sorumluluğu Ayrımı:</strong>
          TÜRKPATENT'ten gelen doğrulanmış tescil bilgileri otomatik olarak yerel platform tarafından yayımlanmış resmî kurumsal duyuru sayılmaz. Kaynak kurum (ör. TÜRKPATENT, Gaziantep Ticaret Borsası veya İslahiye Dijital Platformlar) ve kaynak URL alanı doğru seçilmelidir.
        </div>
      </div>

      {activeTab === 'form' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2-Column Content Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Temel Bilgiler */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100">
                1. Temel Bilgiler
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duyuru Başlığı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ör: İslahiye Biberi Coğrafi İşaret Tescil Belgesi Resmî Kaydı"
                  className={`w-full px-3 py-2 text-sm rounded-sm border ${
                    errors.title ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-hidden focus:ring-1 focus:ring-forest`}
                />
                {errors.title && <p className="text-xs text-rose-600 mt-1 font-sans">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
                    className="w-full px-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest bg-white"
                  >
                    {CATEGORIES.map((cat) => (
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
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest bg-white"
                  >
                    <option value="normal">Normal Bildirim</option>
                    <option value="urgent">Önemli / Öncelikli</option>
                    <option value="featured">Öne Çıkan Gündem</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kısa Özet (Listeleme Metni) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Ziyaretçi portalında kapalı kartta veya bülten listesinde görünecek 1-2 cümlelik özet..."
                  className={`w-full px-3 py-2 text-sm rounded-sm border ${
                    errors.summary ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-hidden focus:ring-1 focus:ring-forest`}
                />
                {errors.summary && <p className="text-xs text-rose-600 mt-1 font-sans">{errors.summary}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detaylı İçerik Metni <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  value={contentParagraphs}
                  onChange={(e) => setContentParagraphs(e.target.value)}
                  placeholder="Duyuru genişletildiğinde görünecek açıklamalar. Paragrafları ayırmak için Enter tuşuna basarak yeni satıra geçebilirsiniz..."
                  className={`w-full px-3 py-2 text-sm rounded-sm border ${
                    errors.contentParagraphs ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-hidden focus:ring-1 focus:ring-forest font-sans leading-relaxed`}
                />
                {errors.contentParagraphs && (
                  <p className="text-xs text-rose-600 mt-1 font-sans">{errors.contentParagraphs}</p>
                )}
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  İpucu: Her boşluk bırakılmış satır ziyaretçi sayfasında ayrı bir paragraf olarak biçimlendirilir.
                </p>
              </div>
            </div>

            {/* Section 2: Medya ve Kapak Görseli */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100">
                2. Medya & Kapak Görseli (İsteğe Bağlı)
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Görsel URL'si</label>
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="/images/islahiye_biberi.jpg veya https://..."
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

            {/* Section 3: İlgili Etkinlik İlişkilendirmesi */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100">
                3. İlişkili Etkinlik Bağlantısı
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">İlgili Gastronomi Etkinliği</label>
                <select
                  value={relatedEventId}
                  onChange={(e) => setRelatedEventId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest bg-white"
                >
                  <option value="">Bağlantılı etkinlik yok (Genel kurumsal duyuru)</option>
                  {allEvents.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.title} ({evt.formattedDate})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Duyuru bir etkinliğe ait çağrı veya program bildirimi ise ziyaretçi doğrudan etkinlik detayına yönlendirilebilir.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar / Publication & Compliance Controls */}
          <div className="space-y-6">
            {/* Section 4: Yayın Durumu */}
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
                  <option value="archived">Arşivde</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Yayın Tarihi</label>
                <input
                  type="date"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest"
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
                  className="w-full px-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest"
                />
              </div>
            </div>

            {/* Section 5: Kaynak & Doğruluk */}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100">
                Kaynak & Şeffaflık
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resmî Kaynak / Kurum <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={officialSource}
                  onChange={(e) => setOfficialSource(e.target.value)}
                  placeholder="Ör: İslahiye Dijital Platformlar / TÜRKPATENT"
                  className={`w-full px-3 py-2 text-sm rounded-sm border ${
                    errors.officialSource ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-hidden focus:ring-1 focus:ring-forest`}
                />
                {errors.officialSource && (
                  <p className="text-xs text-rose-600 mt-1 font-sans">{errors.officialSource}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kaynak URL</label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://ci.turkpatent.gov.tr/..."
                  className={`w-full px-3 py-2 text-sm rounded-sm border ${
                    errors.sourceUrl ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-hidden focus:ring-1 focus:ring-forest`}
                />
                {errors.sourceUrl && <p className="text-xs text-rose-600 mt-1 font-sans">{errors.sourceUrl}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Doğrulama Statüsü</label>
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus)}
                  className="w-full px-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-forest bg-white"
                >
                  <option value="verified">Doğrulanmış Resmî Kayıt</option>
                  <option value="unverified">Doğrulanmamış / İnceleme Bekliyor</option>
                  <option value="simulated">Temsili Simülasyon</option>
                </select>
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
                    <span className="text-xs font-semibold text-slate-800 block">Temsili Demo İçerik İşareti</span>
                    <span className="text-[11px] text-slate-500 font-sans leading-tight block mt-0.5">
                      İşaretlendiğinde ziyaretçi arayüzünde "Temsili Demo" rozetiyle sunulur.
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
              <span>/duyurular Ziyaretçi Sayfası Önizlemesi</span>
            </span>
            <span className="text-xs font-mono text-charcoal/50">
              Yayın Durumu: <strong>{publicationStatus.toUpperCase()}</strong>
            </span>
          </div>

          <article className="bg-paper border border-sand/80 rounded-sm overflow-hidden shadow-xs">
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2.5 mb-2.5 text-xs font-mono">
                {isDemo ? (
                  <span className="px-2 py-0.5 rounded-xs bg-sand/40 text-charcoal/75 font-semibold uppercase text-[10px] border border-sand">
                    Temsili Demo
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-xs bg-forest text-ivory font-bold uppercase text-[10px] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Doğrulanmış Kayıt
                  </span>
                )}
                <span className="text-copper-dark font-semibold uppercase">{selectedCategoryLabel}</span>
                <span className="text-charcoal/40">•</span>
                <span className="flex items-center gap-1 text-charcoal/50">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(publishedAt).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <h2 className="text-2xl font-display font-bold text-forest mb-2 leading-snug">
                {title || 'Duyuru Başlığı Girilmedi'}
              </h2>

              <p className="text-sm text-charcoal/70 font-sans leading-relaxed mb-4">
                {summary || 'Kısa özet metni buraya gelecektir.'}
              </p>

              {/* Render Full Content */}
              <div className="pt-4 border-t border-sand/60 space-y-3 text-sm font-sans text-charcoal/80 leading-relaxed bg-ivory/50 p-4 rounded-xs">
                {contentParagraphs
                  ? contentParagraphs.split('\n').map((p, idx) => (
                      <p key={idx} className="m-0">
                        {p}
                      </p>
                    ))
                  : 'Detaylı duyuru metni henüz girilmedi.'}
              </div>

              <div className="pt-4 mt-4 border-t border-sand/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-charcoal/65">
                <div className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-copper" />
                  <span>Kaynak: {officialSource}</span>
                </div>

                {sourceUrl && (
                  <a
                    href={sourceUrl}
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
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-slate-200 p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">Duyuruyu Silmek İstiyor musunuz?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              <strong>"{title}"</strong> başlıklı kurumsal duyuru silinecektir. Bu işlem geri alınamaz.
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
