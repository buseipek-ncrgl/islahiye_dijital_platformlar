import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ExternalLink, Globe, Edit3, Trash2, CheckCircle2 } from 'lucide-react';
import { CmsContentItem } from '../../../types/admin';
import { StatusBadge } from './StatusBadge';
import { VerificationBadge } from './VerificationBadge';
import { ImageWithFallback } from '../../ui/ImageWithFallback';
import { useContent } from '../../../hooks/useContent';

interface ContentDetailDrawerProps {
  item: CmsContentItem | null;
  onClose: () => void;
}

export const ContentDetailDrawer: React.FC<ContentDetailDrawerProps> = ({ item, onClose }) => {
  const navigate = useNavigate();
  const {
    updatePublicationStatus,
    deleteDish,
    deleteRecipe,
    deleteArticle,
    deleteCulturalStory,
    deleteArtisan,
    deletePlace,
    deleteAnnouncement,
    deleteEvent,
    getCulturalStoryById,
  } = useContent();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (item && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden bg-charcoal/60 backdrop-blur-xs flex justify-end animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-left border-l border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div>
          <div className="p-6 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/70">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-xs bg-slate-200 text-slate-700 text-[10px] font-mono font-bold uppercase tracking-wider">
                  {item.contentTypeLabel}
                </span>
                <StatusBadge status={item.publicationStatus} />
                <VerificationBadge status={item.verificationStatus} isDemo={item.isDemo} />
              </div>

              <h2 className="text-xl font-sans font-bold text-slate-900 leading-snug">
                {item.title}
              </h2>

              {item.subtitle && (
                <p className="text-xs text-slate-600 font-sans italic">
                  {item.subtitle}
                </p>
              )}
            </div>

            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className="p-2 rounded-sm text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="p-6 space-y-6">
            {/* Visual Cover Preview if available */}
            {item.coverImage && (
              <div className="rounded-sm overflow-hidden border border-slate-200 aspect-[16/9] bg-slate-100 relative">
                <ImageWithFallback
                  src={item.coverImage}
                  alt={item.title}
                  fallbackText={item.title}
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Summary Text */}
            {item.summary && (
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                  İÇERİK ÖZETİ
                </h3>
                <p className="text-sm font-sans text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-sm border border-slate-200">
                  {item.summary}
                </p>
              </div>
            )}

            {/* Metadata Grid */}
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-3">
                KÜNYE & SİSTEM BİLGİLERİ
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                <div className="p-3 rounded-sm bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">
                    Kategori
                  </span>
                  <span className="font-semibold text-slate-800">
                    {item.categoryLabel}
                  </span>
                </div>

                <div className="p-3 rounded-sm bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">
                    Yayın Tarihi
                  </span>
                  <span className="font-semibold text-slate-800">
                    {item.formattedDate || item.publishedAt || 'Belirtilmedi'}
                  </span>
                </div>

                <div className="p-3 rounded-sm bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">
                    İçerik Kökeni
                  </span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {item.contentOrigin}
                  </span>
                </div>

                <div className="p-3 rounded-sm bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">
                    Temsil Türü
                  </span>
                  <span className="font-semibold text-slate-800">
                    {item.isDemo ? 'Temsili Demo Modeli' : 'Doğrulanmış Resmî Kayıt'}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Source & Links */}
            {(item.officialSource || item.sourceUrl || item.publicUrl) && (
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-3">
                  KAYNAK VE ERİŞİM BAĞLANTILARI
                </h3>

                <div className="space-y-2.5 text-xs font-mono">
                  {item.officialSource && (
                    <div className="p-3 rounded-sm bg-slate-50 border border-slate-200 text-slate-700">
                      <span className="text-[10px] text-slate-500 block uppercase">Kurum / Yazar Atfı:</span>
                      <strong>{item.officialSource}</strong>
                    </div>
                  )}

                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between hover:bg-emerald-100 transition-colors"
                    >
                      <span>Resmî Kurum / Belge Kaynağını Aç</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {item.publicUrl && (
                    <a
                      href={item.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-sm bg-forest-50 border border-forest-200 text-forest-800 flex items-center justify-between hover:bg-forest-100 transition-colors font-semibold"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Ziyaretçi Portalında Görüntüle</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Tags if available */}
            {item.tags && item.tags.length > 0 && (
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-2">
                  ETİKETLER
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-xs bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Action Footer (Sprint 02B Active Management) */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-4">
          {statusMessage && (
            <div className="p-2.5 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Quick Publication Status Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white border border-slate-200 rounded-sm">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold">
              Hızlı Durum Değiştir:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  updatePublicationStatus(item.id, 'draft');
                  setStatusMessage('İçerik Taslak durumuna alındı (Ziyaretçiye kapalı).');
                  setTimeout(() => setStatusMessage(null), 2500);
                }}
                className={`px-2.5 py-1 rounded-xs text-[11px] font-mono font-semibold transition-colors ${
                  item.publicationStatus === 'draft'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Taslak
              </button>
              <button
                type="button"
                onClick={() => {
                  updatePublicationStatus(item.id, 'in_review');
                  setStatusMessage('İçerik İncelemede olarak işaretlendi.');
                  setTimeout(() => setStatusMessage(null), 2500);
                }}
                className={`px-2.5 py-1 rounded-xs text-[11px] font-mono font-semibold transition-colors ${
                  item.publicationStatus === 'in_review'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                İncelemede
              </button>
              <button
                type="button"
                onClick={() => {
                  updatePublicationStatus(item.id, 'published');
                  setStatusMessage('İçerik Demo Olarak Yayımlandı (Ziyaretçi portalında görünür)!');
                  setTimeout(() => setStatusMessage(null), 2500);
                }}
                className={`px-2.5 py-1 rounded-xs text-[11px] font-mono font-semibold transition-colors ${
                  item.publicationStatus === 'published'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Yayında
              </button>
              <button
                type="button"
                onClick={() => {
                  updatePublicationStatus(item.id, 'archived');
                  setStatusMessage('İçerik Arşivlendi (Portalda gizlendi).');
                  setTimeout(() => setStatusMessage(null), 2500);
                }}
                className={`px-2.5 py-1 rounded-xs text-[11px] font-mono font-semibold transition-colors ${
                  item.publicationStatus === 'archived'
                    ? 'bg-slate-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Arşivde
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {/* Edit button */}
            {item.contentType === 'dish' ||
            item.contentType === 'recipe' ||
            item.contentType === 'news' ||
            item.contentType === 'editorial_article' ||
            item.contentType === 'artisan' ||
            item.contentType === 'place' ||
            item.contentType === 'announcement' ||
            item.contentType === 'event' ||
            item.contentType === 'film' ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (item.contentType === 'dish') {
                    navigate(`/yonetim/yemekler/${item.id}/duzenle`);
                  } else if (item.contentType === 'recipe') {
                    navigate(`/yonetim/tarifler/${item.id}/duzenle`);
                  } else if (item.contentType === 'artisan') {
                    navigate(`/yonetim/ustalar/${item.id}/duzenle`);
                  } else if (item.contentType === 'place') {
                    navigate(`/yonetim/harita/noktalar/${item.id}/duzenle`);
                  } else if (item.contentType === 'announcement') {
                    navigate(`/yonetim/duyurular/${item.id}/duzenle`);
                  } else if (item.contentType === 'event') {
                    navigate(`/yonetim/etkinlikler/${item.id}/duzenle`);
                  } else if (item.contentType === 'film') {
                    navigate('/yonetim/medya');
                  } else if (item.contentType === 'editorial_article') {
                    const isCultural = Boolean(getCulturalStoryById(item.id));
                    if (isCultural) {
                      navigate(`/yonetim/kulturel-miras/${item.id}/duzenle`);
                    } else {
                      navigate(`/yonetim/haberler/${item.id}/duzenle`);
                    }
                  } else {
                    navigate(`/yonetim/haberler/${item.id}/duzenle`);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-forest hover:bg-forest-800 text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Düzenle</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 font-mono italic">
                (Sprint 02C Kapsamı)
              </span>
            )}

            <div className="flex items-center gap-2">
              {(item.contentType === 'dish' ||
                item.contentType === 'recipe' ||
                item.contentType === 'news' ||
                item.contentType === 'editorial_article' ||
                item.contentType === 'artisan' ||
                item.contentType === 'place' ||
                item.contentType === 'announcement' ||
                item.contentType === 'event') && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 rounded-sm text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200"
                  title="Kaydı Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-sm bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider hover:bg-slate-900 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-sm border border-slate-200 p-6 max-w-sm w-full shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-sm font-bold text-slate-900">
                  İçeriği Silmek İstiyor musunuz?
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                <strong>"{item.title}"</strong> kaydı silinecektir. Dilediğinizde ayarlardan fabrika verilerini geri yükleyebilirsiniz.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-sm border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (item.contentType === 'dish') deleteDish(item.id);
                    else if (item.contentType === 'recipe') deleteRecipe(item.id);
                    else if (item.contentType === 'artisan') deleteArtisan(item.id);
                    else if (item.contentType === 'place') deletePlace(item.id);
                    else if (item.contentType === 'announcement') deleteAnnouncement(item.id);
                    else if (item.contentType === 'event') deleteEvent(item.id);
                    else if (item.contentType === 'editorial_article') {
                      const isCultural = Boolean(getCulturalStoryById(item.id));
                      if (isCultural) deleteCulturalStory(item.id);
                      else deleteArticle(item.id);
                    } else if (item.contentType === 'news') deleteArticle(item.id);
                    setShowDeleteConfirm(false);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-sm bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
                >
                  Evet, Sil
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
