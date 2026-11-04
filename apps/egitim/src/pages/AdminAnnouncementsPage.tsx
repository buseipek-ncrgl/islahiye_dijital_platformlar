import React, { useState, useEffect, useMemo } from 'react';
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
  LayoutGrid,
  List,
  Search,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { AdminAnnouncement } from '../types';
import {
  getStoredAdminAnnouncements,
  createAdminAnnouncement,
  updateAdminAnnouncement,
  deleteAdminAnnouncement,
  publishAdminAnnouncement,
  subscribeToAdminAnnouncementUpdates,
} from '../services/notificationStorage';
import { playActionSound } from '../services/soundFx';
import { notifyAdminAnnouncementPublished } from '../services/notificationEngine';
import { deriveEligibleRecipients } from '../services/massEmailStorage';
import { fetchLivePrograms, getInitialPrograms } from '../services/programAdapter';
import { Program } from '../types';
import { getStoredGroups } from '../services/enrollmentStorage';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { KpiStrip } from '../components/ui/KpiStrip';
import { StatusBadge } from '../components/ui/StatusBadge';

export const AdminAnnouncementsPage: React.FC = () => {
  const { currentUser } = useDemoRole();

  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [previewModalAnn, setPreviewModalAnn] = useState<AdminAnnouncement | null>(null);

  // Edit & Delete State
  const [editingAnn, setEditingAnn] = useState<AdminAnnouncement | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [deletingAnn, setDeletingAnn] = useState<AdminAnnouncement | null>(null);

  const handleStartEdit = (ann: AdminAnnouncement) => {
    setEditingAnn(ann);
    setEditTitle(ann.title);
    setEditContent(ann.content);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnn || !editTitle.trim() || !editContent.trim()) return;
    const res = updateAdminAnnouncement(editingAnn.id, {
      title: editTitle.trim(),
      content: editContent.trim(),
    });
    if (res.success) {
      playActionSound();
      setEditingAnn(null);
      setFeedbackMsg('Duyuru başarıyla güncellendi.');
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingAnn) return;
    const res = deleteAdminAnnouncement(deletingAnn.id);
    if (res.success) {
      playActionSound();
      setDeletingAnn(null);
      setFeedbackMsg('Duyuru başarıyla silindi.');
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<AdminAnnouncement['targetAudience']>('program');
  const [selectedProgramId, setSelectedProgramId] = useState('prog-01');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const [programs, setPrograms] = useState<Program[]>(() => getInitialPrograms());
  const groups = getStoredGroups();
  const filteredGroups = useMemo(() => {
    const direct = groups.filter((g) => g.programId === selectedProgramId);
    if (direct.length > 0) return direct;
    return groups;
  }, [groups, selectedProgramId]);

  useEffect(() => {
    fetchLivePrograms().then((progs) => {
      if (progs && progs.length > 0) {
        setPrograms(progs);
        if (!selectedProgramId || !progs.some((p) => p.id === selectedProgramId)) {
          setSelectedProgramId(progs[0].id);
        }
      }
    });
  }, []);

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
      return allRecipients.length;
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
      setFeedbackMsg('Lütfen duyuru başlığı ve içerik metnini eksiksiz doldurunuz.');
      setTimeout(() => setFeedbackMsg(null), 4000);
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

  // KPIs
  const totalCount = announcements.length;
  const publishedCount = announcements.filter((a) => a.status === 'published').length;
  const draftCount = announcements.filter((a) => a.status === 'draft').length;
  const totalRecipients = announcements.reduce((acc, a) => acc + (a.recipientCount || 0), 0);

  // Filtered Announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      if (statusFilter !== 'all' && ann.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ann.title.toLowerCase().includes(q);
        const matchContent = ann.content.toLowerCase().includes(q);
        const matchCreator = ann.createdByName.toLowerCase().includes(q);
        if (!matchTitle && !matchContent && !matchCreator) return false;
      }
      return true;
    });
  }, [announcements, statusFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Kurumsal Duyuru Masası
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Program, dönem, sınıf ve kurumsal genelde resmi bilgilendirme duyuruları oluşturma ve yayımlama masası.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Yeni Duyuru Oluştur</span>
          </button>
        </div>
      </div>

      {/* 4 TOP KPI STRIP (Stripe / Canvas LMS Standart Metrik Bandı) */}
      <KpiStrip
        items={[
          {
            label: 'Toplam Duyuru',
            value: totalCount,
            icon: <Bell className="w-4 h-4" />,
            subtext: 'Tüm dönem kayıtları',
          },
          {
            label: 'Yayındaki Duyurular',
            value: publishedCount,
            icon: <CheckCircle2 className="w-4 h-4" />,
            subtext: 'Kullanıcılara iletilen',
          },
          {
            label: 'Taslaklar',
            value: draftCount,
            icon: <Clock className="w-4 h-4" />,
            subtext: 'Yayımlanmayı bekleyen',
            badge: draftCount > 0 ? (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Taslak
              </span>
            ) : undefined,
          },
          {
            label: 'Kapsanan Alıcılar',
            value: totalRecipients,
            icon: <Users className="w-4 h-4" />,
            subtext: 'Tekil bildirim erişimi',
          },
        ]}
      />

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Duyuru ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white w-48 text-slate-800"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1">
            {[
              { key: 'all', label: 'Tümü' },
              { key: 'published', label: 'Yayımlanan' },
              { key: 'draft', label: 'Taslak' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key as any)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  statusFilter === f.key
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center border border-slate-300 rounded-lg p-0.5 bg-slate-100 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded text-xs flex items-center gap-1 transition ${
              viewMode === 'list'
                ? 'bg-white shadow-2xs text-brand-navy font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Liste Görünümü"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Liste</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded text-xs flex items-center gap-1 transition ${
              viewMode === 'grid'
                ? 'bg-white shadow-2xs text-brand-navy font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Kart Görünümü"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kartlar</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Announcements Content */}
      {filteredAnnouncements.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-slate-400 text-xs">
            Arama ve filtre kriterlerinize uygun duyuru bulunamadı.
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAnnouncements.map((ann) => {
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
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[200px]">
                        {ann.targetAudience === 'all'
                          ? 'Kurum Geneli'
                          : ann.targetAudience === 'program'
                          ? `${ann.targetProgramTitle || 'Seçili Program'}`
                          : ann.targetAudience === 'group'
                          ? `${ann.targetGroupName || 'Seçili Grup'}`
                          : ann.targetAudience === 'instructors'
                          ? 'Eğitmenler'
                          : 'Kursiyerler'}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {ann.publishDate
                        ? new Date(ann.publishDate).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Taslak'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">{ann.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {ann.content}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ann.recipientCount} Alıcı</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setPreviewModalAnn(ann)}
                        className="text-xs"
                      >
                        Önizle
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Edit2 className="w-3.5 h-3.5 text-blue-600" />}
                        onClick={() => handleStartEdit(ann)}
                        className="text-xs"
                      >
                        Düzenle
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
                        onClick={() => setDeletingAnn(ann)}
                        className="text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
                      >
                        Sil
                      </Button>

                      {!isPublished && (
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Send className="w-3.5 h-3.5" />}
                          onClick={() => handlePublishExistingDraft(ann)}
                          className="text-xs"
                        >
                          Yayımla
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <Card>
          <CardContent className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Duyuru Başlığı</th>
                    <th className="py-3 px-3">Hedef Kitle</th>
                    <th className="py-3 px-3 text-center">Durum</th>
                    <th className="py-3 px-3 text-center">Tarih</th>
                    <th className="py-3 px-3 text-center">Alıcı</th>
                    <th className="py-3 px-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAnnouncements.map((ann) => {
                    const isPublished = ann.status === 'published';
                    return (
                      <tr key={ann.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{ann.title}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{ann.content}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-medium text-slate-700">
                            {ann.targetAudience === 'all'
                              ? 'Kurum Geneli'
                              : ann.targetProgramTitle || ann.targetGroupName || 'Özel Segment'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <StatusBadge
                            label={isPublished ? 'Yayımlandı' : 'Taslak'}
                            variant={isPublished ? 'success' : 'neutral'}
                            size="sm"
                          />
                        </td>
                        <td className="py-3 px-3 text-center text-slate-500 tabular-nums">
                          {ann.publishDate
                            ? new Date(ann.publishDate).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'short',
                              })
                            : '-'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700 tabular-nums">
                          {ann.recipientCount}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewModalAnn(ann)}
                              className="text-[11px] py-1 px-2"
                            >
                              İncele
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartEdit(ann)}
                              className="text-[11px] py-1 px-2 text-blue-700"
                            >
                              Düzenle
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingAnn(ann)}
                              className="text-[11px] py-1 px-2 text-rose-700 border-rose-200 hover:bg-rose-50"
                            >
                              Sil
                            </Button>
                            {!isPublished && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handlePublishExistingDraft(ann)}
                                className="text-[11px] py-1 px-2"
                              >
                                Yayımla
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* EDIT ANNOUNCEMENT MODAL */}
      {editingAnn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Kurumsal Duyuruyu Düzenle</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAnn(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Duyuru Başlığı *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500 font-semibold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Duyuru Metni *</label>
                <textarea
                  rows={6}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500 leading-relaxed"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button variant="secondary" type="button" onClick={() => setEditingAnn(null)}>
                  Vazgeç
                </Button>
                <Button variant="primary" type="submit">
                  Değişiklikleri Kaydet
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingAnn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-base pb-2 border-b border-slate-100">
              <Trash2 className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Duyuruyu Silme Onayı</span>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
              <span className="font-bold block text-sm">{deletingAnn.title}</span>
              <p className="line-clamp-2 text-rose-700">{deletingAnn.content}</p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bu kurumsal duyuruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setDeletingAnn(null)}>
                Vazgeç
              </Button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-2xs cursor-pointer"
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
