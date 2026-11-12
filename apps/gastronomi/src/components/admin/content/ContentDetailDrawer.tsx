import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ExternalLink, Globe, Edit3, Trash2, CheckCircle2 } from 'lucide-react';
import { CmsContentItem } from '../../../types/admin';
import { StatusBadge } from './StatusBadge';
import { VerificationBadge } from './VerificationBadge';
import { ImageWithFallback } from '../../ui/ImageWithFallback';
import { useContent } from '../../../hooks/useContent';
import { useAdminRole } from '../../../context/AdminRoleContext';
import { ActionConfirmModal } from '../common/ActionConfirmModal';
import { sanitizeUrl } from '../../../utils/security';

interface ContentDetailDrawerProps {
  item: CmsContentItem | null;
  onClose: () => void;
}

export const ContentDetailDrawer: React.FC<ContentDetailDrawerProps> = ({ item, onClose }) => {
  const navigate = useNavigate();
  const { canEdit, canDelete, canPublish } = useAdminRole();
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
    deleteFilm,
    deleteMediaItem,
    deleteAtlasNode,
  } = useContent();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setStatusMessage(null);
    setShowDeleteConfirm(false);
  }, [item?.id, item?.contentType]);

  const formatContentOrigin = (origin?: string) => {
    switch (origin) {
      case 'editorial_narrative':
        return 'Editoryal Mutfak Anlatısı';
      case 'field_research':
        return 'Saha & Usta Araştırması';
      case 'official_registry':
        return 'Resmî TÜRKPATENT Tescili';
      case 'community_archive':
        return 'Yerel Sözlü Bellek Arşivi';
      case 'representative':
        return 'Kültürel Arşiv';
      default:
        return origin || 'Editoryal Kayıt';
    }
  };

  useEffect(() => {
    if (item && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose, showDeleteConfirm]);

  if (!item) return null;

  return (
    <>
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-fade-in"
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
                <span className="px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[11px] font-sans font-bold uppercase tracking-wider">
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
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="p-6 space-y-6">
            {/* Visual Cover Preview if available */}
            {item.coverImage && (
              <div className="rounded-xl overflow-hidden border border-slate-200 aspect-[16/9] bg-slate-100 relative">
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
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  İçerik Özeti
                </h3>
                <div className="text-xs sm:text-sm font-sans text-slate-700 leading-relaxed bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                  {item.summary}
                </div>
              </div>
            )}

            {/* Metadata Grid */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Künye &amp; Sistem Bilgileri
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90">
                  <span className="text-[11px] font-sans text-slate-500 block mb-1 font-medium">
                    Kategori
                  </span>
                  <span className="font-bold text-slate-900 text-xs sm:text-[13px]">
                    {item.categoryLabel || item.category}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90">
                  <span className="text-[11px] font-sans text-slate-500 block mb-1 font-medium">
                    Yayın Tarihi
                  </span>
                  <span className="font-bold text-slate-900 text-xs sm:text-[13px]">
                    {item.formattedDate || item.publishedAt || 'Belirtilmedi'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90">
                  <span className="text-[11px] font-sans text-slate-500 block mb-1 font-medium">
                    İçerik Kökeni
                  </span>
                  <span className="font-bold text-emerald-800 text-xs sm:text-[13px]">
                    {formatContentOrigin(item.contentOrigin)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90">
                  <span className="text-[11px] font-sans text-slate-500 block mb-1 font-medium">
                    Kayıt Türü
                  </span>
                  <span className="font-bold text-slate-900 text-xs sm:text-[13px] flex items-center gap-1.5">
                    {item.isDemo ? (
                      <span className="text-amber-700">Editoryal Ön Kayıt</span>
                    ) : (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Doğrulanmış Resmî Kayıt
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Source & Links */}
            {(item.officialSource || item.sourceUrl || item.publicUrl) && (
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Kaynak ve Erişim Bağlantıları
                </h3>

                <div className="space-y-2.5 text-xs font-sans">
                  {item.officialSource && (
                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 text-slate-800">
                      <span className="text-[11px] text-slate-500 block mb-0.5 font-medium">Kurum / Yazar Atfı:</span>
                      <strong className="text-slate-900 font-bold text-xs sm:text-[13px]">{item.officialSource}</strong>
                    </div>
                  )}

                  {item.sourceUrl && sanitizeUrl(item.sourceUrl) && (
                    <a
                      href={sanitizeUrl(item.sourceUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 flex items-center justify-between hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-all font-semibold shadow-2xs"
                    >
                      <span>Resmî Kurum / Belge Kaynağını Aç</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  )}

                  {item.publicUrl && sanitizeUrl(item.publicUrl) && (
                    <a
                      href={sanitizeUrl(item.publicUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 flex items-center justify-between hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-all font-semibold shadow-2xs group"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-600" />
                        <span>Ziyaretçi Portalında Görüntüle</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Tags if available */}
            {item.tags && item.tags.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Etiketler
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-sans font-medium text-slate-700 transition-colors"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Action Footer (Active Management) */}
        <div className="p-5 sm:p-6 border-t border-slate-200 bg-slate-50/70 space-y-4 font-sans">
          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Quick Publication Status Switcher */}
          {(canEdit || canPublish) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-xs font-sans text-slate-700 font-bold">
                Hızlı Durum Değiştir:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => {
                    updatePublicationStatus(item.id, item.contentType, 'draft');
                    setStatusMessage('İçerik Taslak durumuna alındı (Ziyaretçiye kapalı).');
                    setTimeout(() => setStatusMessage(null), 2500);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-colors ${
                    item.publicationStatus === 'draft'
                      ? 'bg-amber-500 text-white shadow-2xs font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  } disabled:opacity-45 disabled:cursor-not-allowed`}
                >
                  Taslak
                </button>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => {
                    updatePublicationStatus(item.id, item.contentType, 'in_review');
                    setStatusMessage('İçerik İncelemede olarak işaretlendi.');
                    setTimeout(() => setStatusMessage(null), 2500);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-colors ${
                    item.publicationStatus === 'in_review'
                      ? 'bg-blue-600 text-white shadow-2xs font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  } disabled:opacity-45 disabled:cursor-not-allowed`}
                >
                  İncelemede
                </button>
                <button
                  type="button"
                  disabled={!canPublish}
                  title={!canPublish ? 'Yalnızca Yayın Sorumlusu veya Yönetici yayına alabilir' : undefined}
                  onClick={() => {
                    updatePublicationStatus(item.id, item.contentType, 'published');
                    setStatusMessage('İçerik Yayımlandı (Ziyaretçi portalında görünür)!');
                    setTimeout(() => setStatusMessage(null), 2500);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-colors ${
                    item.publicationStatus === 'published'
                      ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  } disabled:opacity-45 disabled:cursor-not-allowed`}
                >
                  Yayında
                </button>
                <button
                  type="button"
                  disabled={!canPublish}
                  title={!canPublish ? 'Yalnızca Yayın Sorumlusu veya Yönetici arşivleyebilir' : undefined}
                  onClick={() => {
                    updatePublicationStatus(item.id, item.contentType, 'archived');
                    setStatusMessage('İçerik Arşivlendi (Portalda gizlendi).');
                    setTimeout(() => setStatusMessage(null), 2500);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-colors ${
                    item.publicationStatus === 'archived'
                      ? 'bg-slate-700 text-white shadow-2xs font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  } disabled:opacity-45 disabled:cursor-not-allowed`}
                >
                  Arşivde
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {/* Edit button */}
            {canEdit ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (item.contentType === 'dish') {
                    navigate(`/yonetim/yemekler/${item.id}/duzenle`);
                  } else if (item.contentType === 'recipe') {
                    navigate(`/yonetim/tarifler/${item.id}/duzenle`);
                  } else if (item.contentType === 'cultural_story') {
                    navigate(`/yonetim/kulturel-miras/${item.id}/duzenle`);
                  } else if (item.contentType === 'artisan') {
                    navigate(`/yonetim/ustalar/${item.id}/duzenle`);
                  } else if (item.contentType === 'place') {
                    navigate(`/yonetim/harita/noktalar/${item.id}/duzenle`);
                  } else if (item.contentType === 'announcement') {
                    navigate(`/yonetim/duyurular/${item.id}/duzenle`);
                  } else if (item.contentType === 'event') {
                    navigate(`/yonetim/etkinlikler/${item.id}/duzenle`);
                  } else if (item.contentType === 'film' || item.contentType === 'media') {
                    navigate('/yonetim/medya');
                  } else if (item.contentType === 'atlas_node') {
                    navigate('/yonetim/harita?tab=atlas');
                  } else {
                    navigate(`/yonetim/haberler/${item.id}/duzenle`);
                  }
                }}
                className="h-9 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Düzenle</span>
              </button>
            ) : (
              <span className="text-xs text-slate-400 font-sans italic">
                Salt okunur önizleme
              </span>
            )}

            <div className="flex items-center gap-2">
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="h-9 px-3 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors inline-flex items-center justify-center cursor-pointer"
                  title="Kaydı Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ActionConfirmModal
      isOpen={showDeleteConfirm}
      onClose={() => setShowDeleteConfirm(false)}
      variant="danger"
      title="İçeriği Silmek İstiyor musunuz?"
      message={`"${item.title}" kaydı silinecektir. Dilediğinizde ayarlardan fabrika verilerini geri yükleyebilirsiniz.`}
      confirmText="Evet, Sil"
      cancelText="Vazgeç"
      onConfirm={() => {
        if (item.contentType === 'dish') deleteDish(item.id);
        else if (item.contentType === 'recipe') deleteRecipe(item.id);
        else if (item.contentType === 'cultural_story') deleteCulturalStory(item.id);
        else if (item.contentType === 'artisan') deleteArtisan(item.id);
        else if (item.contentType === 'place') deletePlace(item.id);
        else if (item.contentType === 'announcement') deleteAnnouncement(item.id);
        else if (item.contentType === 'event') deleteEvent(item.id);
        else if (item.contentType === 'film') deleteFilm(item.id);
        else if (item.contentType === 'media') deleteMediaItem(item.id);
        else if (item.contentType === 'atlas_node') deleteAtlasNode(item.id);
        else if (item.contentType === 'editorial_article' || item.contentType === 'news') {
          deleteArticle(item.id);
        }
        setShowDeleteConfirm(false);
        onClose();
      }}
    />
    </>
  );
};
