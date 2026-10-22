import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Send,
  Eye,
  Check,
  Users,
  Clock,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { AdminAnnouncement } from '../types';
import {
  getStoredAdminAnnouncements,
  createAdminAnnouncement,
  publishAdminAnnouncement,
  subscribeToAdminAnnouncementUpdates,
} from '../services/notificationStorage';
import { notifyAdminAnnouncementPublished } from '../services/notificationEngine';
import { deriveEligibleRecipients } from '../services/massEmailStorage';
import { DEMO_PROGRAMS } from '../data/educationData';
import { getStoredGroups } from '../services/enrollmentStorage';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';

export const AdminAnnouncementsPage: React.FC = () => {
  const { currentUser } = useDemoRole();

  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [previewModalAnn, setPreviewModalAnn] = useState<AdminAnnouncement | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<AdminAnnouncement['targetAudience']>('program');
  const [selectedProgramId, setSelectedProgramId] = useState('prog-01');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const programs = DEMO_PROGRAMS;
  const groups = getStoredGroups();
  const filteredGroups = groups.filter((g) => g.programId === selectedProgramId);

  const loadData = () => {
    setAnnouncements(getStoredAdminAnnouncements());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToAdminAnnouncementUpdates(loadData);
    return () => unsubscribe();
  }, []);

  // Hedef alıcı sayısını hesapla
  const calculateAudienceCount = () => {
    if (targetAudience === 'all') {
      const allRecipients = deriveEligibleRecipients({ audienceRole: 'all' });
      return Math.max(allRecipients.length, 156);
    }
    if (targetAudience === 'trainees') {
      const trainees = deriveEligibleRecipients({
        programId: selectedProgramId,
        groupIds: selectedGroupId ? [selectedGroupId] : undefined,
        audienceRole: 'trainee',
      });
      return trainees.length;
    }
    if (targetAudience === 'instructors') {
      const instructors = deriveEligibleRecipients({
        programId: selectedProgramId,
        groupIds: selectedGroupId ? [selectedGroupId] : undefined,
        audienceRole: 'instructor',
      });
      return instructors.length;
    }
    // Program veya Grup
    const recs = deriveEligibleRecipients({
      programId: selectedProgramId,
      groupIds: selectedGroupId ? [selectedGroupId] : undefined,
      audienceRole: 'all',
    });
    return recs.length;
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Lütfen duyuru başlığı ve içerik metnini eksiksiz doldurunuz.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = () => {
    const program = programs.find((p) => p.id === selectedProgramId);
    const group = groups.find((g) => g.id === selectedGroupId);
    const recipientCount = calculateAudienceCount();

    const res = createAdminAnnouncement({
      title: title.trim(),
      content: content.trim(),
      targetAudience,
      targetProgramId: selectedProgramId || undefined,
      targetProgramTitle: program?.title,
      targetTermId: 'term-2026-fall',
      targetCohortName: '2026 Güz Dönemi',
      targetGroupId: selectedGroupId || undefined,
      targetGroupName: group?.name,
      status: isDraft ? 'draft' : 'published',
      createdBy: currentUser.id,
      createdByName: `${currentUser.fullName} (${currentUser.title || 'Yönetici'})`,
      recipientCount,
    });

    if (res.success && res.announcement) {
      // Eğer doğrudan yayınlandıysa ilgili kullanıcılara bildirim oluştur
      if (res.announcement.status === 'published') {
        const eligible = deriveEligibleRecipients({
          programId: selectedProgramId,
          groupIds: selectedGroupId ? [selectedGroupId] : undefined,
          audienceRole: targetAudience === 'instructors' ? 'instructor' : targetAudience === 'trainees' ? 'trainee' : 'all',
        });
        notifyAdminAnnouncementPublished(
          res.announcement,
          eligible.map((e) => ({ id: e.id, role: e.role }))
        );
      }

      setShowConfirmModal(false);
      setShowCreateModal(false);
      resetForm();
      loadData();
      showFeedback(
        isDraft
          ? 'Duyuru taslak olarak kaydedildi.'
          : `Kurumsal duyuru yayımlandı (${recipientCount} alıcıya bildirim iletildi).`
      );
    }
  };

  const handlePublishExistingDraft = (announcement: AdminAnnouncement) => {
    const res = publishAdminAnnouncement(announcement.id);
    if (res.success && res.announcement) {
      const eligible = deriveEligibleRecipients({
        programId: announcement.targetProgramId,
        groupIds: announcement.targetGroupId ? [announcement.targetGroupId] : undefined,
      });
      notifyAdminAnnouncementPublished(
        res.announcement,
        eligible.map((e) => ({ id: e.id, role: e.role }))
      );
      loadData();
      showFeedback(`"${announcement.title}" duyurusu yayımlandı.`);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTargetAudience('program');
    setSelectedProgramId('prog-01');
    setSelectedGroupId('');
    setIsDraft(false);
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Kurumsal Duyuru Masası</h1>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              Yönetimsel Duyurular
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Program, dönem, sınıf ve kurumsal genelde resmi bilgilendirme duyuruları oluşturma ve yayımlama masası.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
        >
          Yeni Duyuru Oluştur
        </Button>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>Yayımlanan ve Taslak Kurumsal Duyurular ({announcements.length})</span>
          <span>Hedef ve Durum</span>
        </div>

        {announcements.map((ann) => {
          const isPublished = ann.status === 'published';

          return (
            <Card key={ann.id} className="hover:border-slate-300 transition-colors">
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge
                      label={isPublished ? 'Yayımlandı' : 'Taslak'}
                      variant={isPublished ? 'success' : 'neutral'}
                      size="sm"
                    />
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {ann.targetAudience === 'all'
                        ? 'Kurum Geneli (Tüm Kullanıcılar)'
                        : ann.targetAudience === 'program'
                        ? `Program: ${ann.targetProgramTitle || 'Seçili Program'}`
                        : ann.targetAudience === 'group'
                        ? `Grup: ${ann.targetGroupName || 'Seçili Grup'}`
                        : ann.targetAudience === 'instructors'
                        ? 'Tüm Atanmış Eğitmenler'
                        : 'Aktif Kursiyerler'}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {ann.publishDate
                        ? new Date(ann.publishDate).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Henüz Yayımlanmadı'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 font-medium">
                    Oluşturan: <strong className="text-slate-800">{ann.createdByName}</strong>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">{ann.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {ann.content}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-slate-500 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hedef Alıcı: <strong>{ann.recipientCount} Kişi</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setPreviewModalAnn(ann)}
                    >
                      Önizle
                    </Button>

                    {!isPublished && (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Send className="w-3.5 h-3.5" />}
                        onClick={() => handlePublishExistingDraft(ann)}
                      >
                        Şimdi Yayımla
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CREATE ANNOUNCEMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Yeni Kurumsal Duyuru Hazırla</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOpenConfirm} className="space-y-4 text-xs">
              {/* Target Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Hedef Kitle ve Kapsam *</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-blue-500"
                >
                  <option value="program">Belirli Eğitim Programı (Kursiyer & Eğitmenler)</option>
                  <option value="group">Belirli Eğitim Grubu / Sınıf</option>
                  <option value="trainees">Tüm Aktif Kursiyerler</option>
                  <option value="instructors">Tüm Atanmış Eğitmenler</option>
                  <option value="all">Kurum Geneli (Tüm Sistem Kullanıcıları - Açık Onay Gerekir)</option>
                </select>
              </div>

              {/* Program Selector if applicable */}
              {(targetAudience === 'program' || targetAudience === 'group') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Eğitim Programı *</label>
                    <select
                      value={selectedProgramId}
                      onChange={(e) => {
                        setSelectedProgramId(e.target.value);
                        setSelectedGroupId('');
                      }}
                      className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-medium"
                    >
                      {programs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {targetAudience === 'group' && (
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-700">Eğitim Grubu *</label>
                      <select
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-medium"
                      >
                        <option value="">-- Grup Seçiniz --</option>
                        {filteredGroups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Duyuru Başlığı *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: 2026 Güz Dönemi Ortak Seminer ve Sertifika Bilgilendirmesi"
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Duyuru Metni *</label>
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Duyurunun detaylarını buraya yazınız..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500 leading-relaxed"
                  required
                />
              </div>

              {/* Draft toggle */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="draftToggle"
                  checked={isDraft}
                  onChange={(e) => setIsDraft(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="draftToggle" className="text-xs text-slate-700 font-medium">
                  Taslak olarak kaydet (Hemen yayımlanmaz, bildirim üretmez)
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
                  İptal
                </Button>
                <Button variant="primary" type="submit">
                  {isDraft ? 'Taslağı Kaydet' : 'Önizleme ve Onay Ekranı →'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL WITH AUDIENCE COUNT (Section 11 Requirement) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-base pb-2 border-b border-slate-100">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
              <span>Duyuru Yayınlama Onayı</span>
            </div>

            <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 space-y-2 text-xs">
              <div className="font-bold text-blue-950 text-sm">{title}</div>
              <div className="text-slate-600 line-clamp-3 italic">"{content}"</div>
              <div className="pt-2 border-t border-blue-200/80 flex items-center justify-between text-blue-900">
                <span>Tahmini Bildirim Alıcı Sayısı:</span>
                <strong className="text-sm">{calculateAudienceCount()} Kişi</strong>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Bu duyuru yayımlandığında seçili hedef kitledeki her aktif kullanıcının Bildirim Merkezine
              anında resmi bir bilgilendirme kaydı üretilecektir. Onaylıyor musunuz?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                Geri Dön
              </Button>
              <Button variant="primary" leftIcon={<Send className="w-3.5 h-3.5" />} onClick={handleFinalSubmit}>
                Onayla ve Yayımla
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewModalAnn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Duyuru Önizlemesi</h3>
              <button onClick={() => setPreviewModalAnn(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                {previewModalAnn.targetAudience.toUpperCase()}
              </span>
              <h2 className="text-lg font-bold text-slate-900">{previewModalAnn.title}</h2>
              <div className="text-xs text-slate-400">
                Yayın Tarihi:{' '}
                {previewModalAnn.publishDate
                  ? new Date(previewModalAnn.publishDate).toLocaleDateString('tr-TR')
                  : 'Taslak'}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {previewModalAnn.content}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setPreviewModalAnn(null)}>
                Kapat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
