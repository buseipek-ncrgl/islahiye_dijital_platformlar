import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Hash,
  Megaphone,
  PlusCircle,
  CheckCircle,
  Users,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  Search,
  MessageSquare,
  Send,
  ShieldCheck,
  ArrowLeft,
  CornerUpLeft,
  Check,
  Lock,
  CheckSquare,
} from 'lucide-react';
import { KpiStrip } from '../components/ui/KpiStrip';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import {
  Channel,
  ChannelMembership,
  ChannelType,
  ChannelMessage,
} from '../types';
import {
  getStoredChannels,
  getStoredChannelMemberships,
  createChannel,
  updateChannel,
  deleteChannel,
  toggleChannelStatus,
  getMessagesForChannel,
  sendChannelMessage,
  editChannelMessage,
  deleteChannelMessage,
  deleteMultipleChannelMessages,
  toggleChannelMessageReaction,
  CHANNELS_UPDATE_EVENT,
  CHANNEL_MESSAGES_UPDATE_EVENT,
} from '../services/channelStorage';
import { ChatMessageBubble } from '../components/common/ChatMessageBubble';
import { playMessageSentSound, playActionSound } from '../services/soundFx';
import { getStoredGroups } from '../services/enrollmentStorage';

export const AdminChannelsPage: React.FC = () => {
  const { currentUser } = useDemoRole();
  const adminId = currentUser?.id || (currentUser?.email ? `usr-${currentUser.email.split('@')[0].replace(/\./g, '-')}` : 'usr-admin-hakan');
  const adminName = currentUser?.fullName || currentUser?.name || 'Hakan Yılmaz';

  const [channels, setChannels] = useState<Channel[]>([]);
  const [memberships, setMemberships] = useState<ChannelMembership[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('all');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'announcement' | 'discussion'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Messages in active channel
  const [channelMessagesList, setChannelMessagesList] = useState<ChannelMessage[]>([]);
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const [adminPostTitle, setAdminPostTitle] = useState('');
  const [adminPostContent, setAdminPostContent] = useState('');
  const [isPostingMsg, setIsPostingMsg] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalGroupId, setModalGroupId] = useState('');
  const [modalType, setModalType] = useState<ChannelType>('announcement');
  const [modalName, setModalName] = useState('');
  const [modalDescription, setModalDescription] = useState('');

  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'closed'>('active');

  const [deletingChannel, setDeletingChannel] = useState<Channel | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<{ id: string; senderName: string; senderRole?: string; content: string } | null>(null);

  // Toplu Seçim & Silme State'leri
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<string[]>([]);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef(0);
  const groups = getStoredGroups();

  const loadData = () => {
    const chs = getStoredChannels();
    setChannels(chs);
    setMemberships(getStoredChannelMemberships());

    if (chs.length > 0 && !selectedChannelId) {
      setSelectedChannelId(chs[0].id);
    }
  };

  const loadChannelMessages = (chanId: string) => {
    const res = getMessagesForChannel(chanId, adminId, 'admin');
    setChannelMessagesList(res.messages || []);
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
      if (selectedChannelId) {
        loadChannelMessages(selectedChannelId);
      }
    };

    window.addEventListener(CHANNELS_UPDATE_EVENT, handleUpdate);
    window.addEventListener(CHANNEL_MESSAGES_UPDATE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(CHANNELS_UPDATE_EVENT, handleUpdate);
      window.removeEventListener(CHANNEL_MESSAGES_UPDATE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [selectedChannelId]);

  useEffect(() => {
    if (selectedChannelId) {
      loadChannelMessages(selectedChannelId);
      setAdminPostContent('');
      setAdminPostTitle('');
      setIsPinned(false);
      setMsgSearchQuery('');
      setSelectedMsgIds([]);
      setSelectionMode(false);
      // Kanal değiştiğinde en alta anında kaydır
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      }, 60);
    }
  }, [selectedChannelId]);

  useEffect(() => {
    // Yalnızca yeni mesaj atıldığında (eleman sayısı arttığında) alta kaydır
    // Emoji ekleme/çıkarma veya düzenleme yapıldığında mevcut scroll pozisyonunu ASLA bozma
    if (channelMessagesList.length > prevMsgCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMsgCountRef.current = channelMessagesList.length;
  }, [channelMessagesList]);

  const programs = useMemo(() => {
    return Array.from(new Set(groups.map((g) => g.programTitle).filter(Boolean)));
  }, [groups]);

  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
      if (selectedProgramFilter !== 'all' && c.programTitle !== selectedProgramFilter) return false;
      if (selectedGroupFilter !== 'all' && c.groupId !== selectedGroupFilter) return false;
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchDesc = c.description?.toLowerCase().includes(q);
        const matchProg = c.programTitle?.toLowerCase().includes(q);
        const matchGrp = c.groupName?.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchProg && !matchGrp) return false;
      }
      return true;
    });
  }, [channels, selectedProgramFilter, selectedGroupFilter, typeFilter, searchQuery]);

  const activeChannel = useMemo(() => {
    if (selectedChannelId) {
      const found = channels.find((c) => c.id === selectedChannelId);
      if (found) return found;
    }
    return filteredChannels[0] || channels[0] || null;
  }, [channels, filteredChannels, selectedChannelId]);

  const activeChannelMembers = useMemo(() => {
    if (!activeChannel) return [];
    return memberships.filter((m) => m.channelId === activeChannel.id);
  }, [memberships, activeChannel]);

  const filteredMessages = useMemo(() => {
    if (!msgSearchQuery.trim()) return channelMessagesList;
    const q = msgSearchQuery.toLowerCase();
    return channelMessagesList.filter((m) => {
      return (
        m.content.toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q) ||
        m.title?.toLowerCase().includes(q)
      );
    });
  }, [channelMessagesList, msgSearchQuery]);

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalGroupId) {
      setErrorMsg('Lütfen bir eğitim grubu seçiniz.');
      return;
    }
    if (!modalName.trim()) {
      setErrorMsg('Lütfen kanal adı giriniz.');
      return;
    }

    const group = groups.find((g) => g.id === modalGroupId);
    if (!group) {
      setErrorMsg('Eğitim grubu bulunamadı.');
      return;
    }

    const res = createChannel({
      programId: group.programId,
      termId: group.termId,
      groupId: group.id,
      type: modalType,
      name: modalName.trim(),
      description: modalDescription.trim(),
      createdBy: adminId,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Kanal oluşturulamadı.');
    } else {
      setShowCreateModal(false);
      setModalName('');
      setModalDescription('');
      setErrorMsg(null);
      setSuccessMsg(`"${modalName.trim()}" kanalı başarıyla oluşturuldu.`);
      loadData();
      if (res.channel) {
        setSelectedChannelId(res.channel.id);
      }
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleToggleStatus = (chanId: string) => {
    const res = toggleChannelStatus(chanId);
    if (res.success && res.channel) {
      setSuccessMsg(`Kanal durumu "${res.channel.status === 'active' ? 'Aktif' : 'Kapatıldı'}" olarak güncellendi.`);
      loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;
    const res = updateChannel(editingChannel.id, {
      name: editName.trim(),
      description: editDescription.trim(),
      status: editStatus,
    });
    if (res.success) {
      setSuccessMsg(`"${editName.trim()}" kanalı başarıyla güncellendi.`);
      setEditingChannel(null);
      loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(res.error || 'Güncelleme başarısız.');
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingChannel) return;
    const res = deleteChannel(deletingChannel.id);
    if (res.success) {
      setSuccessMsg(`"${deletingChannel.name}" kanalı silindi.`);
      setDeletingChannel(null);
      loadData();
      if (selectedChannelId === deletingChannel.id) {
        setSelectedChannelId(null);
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(res.error || 'Silme işlemi başarısız.');
    }
  };

  const handleAdminPostMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChannel) return;

    if (!adminPostContent.trim()) {
      setErrorMsg('Lütfen iletmek istediğiniz mesaj içeriğini yazınız.');
      return;
    }

    if (activeChannel.type === 'announcement' && !adminPostTitle.trim()) {
      setErrorMsg('Duyuru mesajı için bir başlık girilmesi zorunludur.');
      return;
    }

    setIsPostingMsg(true);
    const res = sendChannelMessage({
      channelId: activeChannel.id,
      senderId: adminId,
      senderName: adminName,
      senderEmail: currentUser?.email,
      senderRole: 'admin',
      title: adminPostTitle.trim() || undefined,
      content: adminPostContent.trim(),
      isPinned: activeChannel.type === 'announcement' ? isPinned : false,
      replyTo: replyTarget || undefined,
    });
    setIsPostingMsg(false);
    if (res.success) {
      playMessageSentSound();
      setAdminPostContent('');
      setAdminPostTitle('');
      setIsPinned(false);
      setReplyTarget(null);
      setErrorMsg(null);
      loadChannelMessages(activeChannel.id);
      setSuccessMsg('Kanal mesajınız ve idari duyurunuz iletildi.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(res.error || 'Mesaj iletilemedi.');
    }
  };

  const handleToggleSelectMessage = (msgId: string) => {
    setSelectedMsgIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  const handleSelectAllMessages = () => {
    const selectable = filteredMessages.filter((m) => !m.isDeleted).map((m) => m.id);
    setSelectedMsgIds(selectable);
  };

  const handleClearSelection = () => {
    setSelectedMsgIds([]);
  };

  const handleConfirmBatchDelete = () => {
    if (selectedMsgIds.length === 0) return;
    const res = deleteMultipleChannelMessages(selectedMsgIds, adminId, 'admin');
    if (res.success) {
      playActionSound();
      setSuccessMsg(`${res.deletedCount} adet mesaj başarıyla silindi.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setSelectedMsgIds([]);
      setSelectionMode(false);
      setShowBatchDeleteModal(false);
      if (activeChannel) {
        loadChannelMessages(activeChannel.id);
      }
    }
  };

  // Top KPIs
  const totalChannelsCount = channels.length;
  const activeChannelsCount = channels.filter((c) => c.status === 'active').length;
  const announcementChannelsCount = channels.filter((c) => c.type === 'announcement').length;
  const totalMembershipsCount = memberships.length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Üst Başlık & Yeni Kanal Ekleme */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Grup Kanal Masası & İdari Ayarlar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Program ve grup kanallarının idari yönetimi, üye mutabakatı ve resmî duyuru yayınlama masası.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setModalGroupId(groups[0]?.id || '');
              setShowCreateModal(true);
            }}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Yeni Grup Kanalı Aç</span>
          </button>
        </div>
      </div>

      {/* 4 TOP KPI STRIP (Stripe / Slack Standart Metrik Bandı) */}
      <KpiStrip
        items={[
          {
            label: 'Toplam Kanal',
            value: totalChannelsCount,
            icon: <Hash className="w-4 h-4" />,
            subtext: 'Aktif & arşivlenmiş kanallar',
          },
          {
            label: 'Aktif İletişim Kanalları',
            value: activeChannelsCount,
            icon: <Users className="w-4 h-4" />,
            subtext: 'Mesajlaşmaya açık',
          },
          {
            label: 'Resmî Duyuru Kanalları',
            value: announcementChannelsCount,
            icon: <Megaphone className="w-4 h-4" />,
            subtext: 'Tek yönlü bilgilendirme',
          },
          {
            label: 'Kayıtlı Kanal Üyeliği',
            value: totalMembershipsCount,
            icon: <Users className="w-4 h-4" />,
            subtext: 'Kursiyer & eğitmen eşleşmesi',
          },
        ]}
      />

      {/* Bildirimler */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ANA KANAL ÇALIŞMA ALANI (Discord / Slack Stili 2 Sütunlu Workspace) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[640px]">
        {/* SOL KOLON: KANAL LİSTESİ & FİLTRELER (md:col-span-4 lg:col-span-4) */}
        <div
          className={`md:col-span-5 lg:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/50 ${
            mobileShowDetail ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Sol Kolon Üstü: Arama ve Hızlı Filtreler */}
          <div className="p-3.5 border-b border-slate-200 space-y-2.5 bg-white">
            {/* Arama Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Kanal veya grup ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Program ve Grup Dropdown Filtreleri */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <select
                  value={selectedProgramFilter}
                  onChange={(e) => setSelectedProgramFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Tüm Programlar</option>
                  {programs.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedGroupFilter}
                  onChange={(e) => setSelectedGroupFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Tüm Gruplar</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tür Hap Filtresi */}
            <div className="flex items-center gap-1 border-t border-slate-100 pt-2 text-[11px]">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  typeFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tümü ({channels.length})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('announcement')}
                className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                  typeFilter === 'announcement'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <Megaphone className="w-3 h-3" />
                <span>Duyuru ({announcementChannelsCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('discussion')}
                className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                  typeFilter === 'discussion'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                }`}
              >
                <Hash className="w-3 h-3" />
                <span>Tartışma</span>
              </button>
            </div>
          </div>

          {/* Kanal Listesi */}
          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[600px]">
            {filteredChannels.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Seçili kriterlere uygun grup kanalı bulunamadı.
              </div>
            ) : (
              filteredChannels.map((chan) => {
                const isSelected = activeChannel?.id === chan.id;
                const isAnnounce = chan.type === 'announcement';
                const isActive = chan.status === 'active';
                const memCount = memberships.filter((m) => m.channelId === chan.id).length;

                return (
                  <div
                    key={chan.id}
                    onClick={() => {
                      setSelectedChannelId(chan.id);
                      setMobileShowDetail(true);
                    }}
                    className={`p-3 cursor-pointer transition text-left flex items-start justify-between gap-2.5 border-l-4 ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-600'
                        : 'border-transparent hover:bg-white bg-slate-50/30'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isAnnounce
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {isAnnounce ? <Megaphone className="w-3.5 h-3.5" /> : <Hash className="w-3.5 h-3.5" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                            {chan.name}
                          </span>
                          {!isActive && (
                            <span className="text-[9px] font-semibold px-1 rounded bg-rose-100 text-rose-700">
                              Kapatıldı
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {chan.groupName}
                        </div>

                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-1">
                          <span>{chan.cohortName}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Users className="w-3 h-3 text-slate-400" />
                            {memCount} Üye
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SAĞ KOLON: AKTİF KANAL ÇALIŞMA ALANI & MESAJLAR (md:col-span-8 lg:col-span-8) */}
        <div
          className={`md:col-span-7 lg:col-span-8 flex flex-col bg-white ${
            !mobileShowDetail ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeChannel ? (
            <>
              {/* Aktif Kanal Başlık Çubuğu */}
              <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Mobil Geri Butonu */}
                  <button
                    onClick={() => setMobileShowDetail(false)}
                    className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      activeChannel.type === 'announcement'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {activeChannel.type === 'announcement' ? (
                      <Megaphone className="w-4 h-4" />
                    ) : (
                      <Hash className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                        {activeChannel.name}
                      </h2>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          activeChannel.type === 'announcement'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {activeChannel.type === 'announcement' ? 'Resmî Duyuru Kanalı' : 'Tartışma Kanalı'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          activeChannel.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {activeChannel.status === 'active' ? 'Aktif' : 'Kapatıldı'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {activeChannel.groupName} • {activeChannel.programTitle}
                    </p>
                  </div>
                </div>

                {/* İdari Eylemler */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto text-xs">
                  <button
                    onClick={() => {
                      setSelectionMode((prev) => !prev);
                      setSelectedMsgIds([]);
                    }}
                    className={`h-8 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer ${
                      selectionMode
                        ? 'border-blue-400 bg-blue-100 text-blue-900'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                    title="Toplu Mesaj Seçimi ve Silme"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span className="hidden sm:inline">{selectionMode ? 'Seçimi Kapat' : 'Toplu Seç'}</span>
                  </button>

                  <button
                    onClick={() => setShowMembersModal(true)}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 transition shadow-2xs"
                    title="Kanal Üyelerini Listele"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>{activeChannelMembers.length} Üye</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingChannel(activeChannel);
                      setEditName(activeChannel.name);
                      setEditDescription(activeChannel.description || '');
                      setEditStatus(activeChannel.status);
                    }}
                    className="h-8 px-2.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 transition shadow-2xs"
                    title="Kanal Ayarlarını Düzenle"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                    <span className="hidden sm:inline">Düzenle</span>
                  </button>

                  <button
                    onClick={() => handleToggleStatus(activeChannel.id)}
                    className={`h-8 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs ${
                      activeChannel.status === 'active'
                        ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                    title={activeChannel.status === 'active' ? 'Kanalı Kapat' : 'Kanalı Aç'}
                  >
                    {activeChannel.status === 'active' ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Kapat</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Aç</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setDeletingChannel(activeChannel)}
                    className="h-8 px-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold flex items-center justify-center transition shadow-2xs"
                    title="Kanalı Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Mesaj İçi Arama ve Sayaç Barı */}
              <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Bu kanaldaki iletilerde ara..."
                    value={msgSearchQuery}
                    onChange={(e) => setMsgSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                  {filteredMessages.length} İleti Kaydı
                </span>
              </div>

              {/* Toplu Seçim Aksiyon Çubuğu */}
              {selectionMode && (
                <div className="px-4 py-2 bg-blue-50/95 border-b border-blue-200 flex items-center justify-between text-xs animate-in slide-in-from-top-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-blue-900">
                      {selectedMsgIds.length} mesaj seçildi
                    </span>
                    <button
                      type="button"
                      onClick={handleSelectAllMessages}
                      className="text-blue-700 hover:underline font-semibold cursor-pointer"
                    >
                      Tümünü Seç
                    </button>
                    {selectedMsgIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="text-slate-600 hover:underline cursor-pointer"
                      >
                        Seçimi Temizle
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={selectedMsgIds.length === 0}
                      onClick={() => setShowBatchDeleteModal(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-2xs ${
                        selectedMsgIds.length > 0
                          ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Seçilenleri Sil ({selectedMsgIds.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectionMode(false);
                        setSelectedMsgIds([]);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                      title="Seçim modunu kapat"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Mesaj Akışı (Stream - WhatsApp / Telegram Balon Görünümü) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 bg-slate-100/60 max-h-[500px]">
                {filteredMessages.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                    Bu kanalda henüz paylaşılmış bir mesaj veya duyuru kaydı bulunmuyor.
                  </div>
                ) : (
                  filteredMessages.map((msg) => {
                    const currentUserName = (currentUser?.fullName || currentUser?.name || '').trim().toLowerCase();
                    const currentUserId = (currentUser?.id || '').trim();
                    const currentUserEmail = (currentUser?.email || '').trim().toLowerCase();

                    const msgSenderName = (msg.senderName || '').trim().toLowerCase();
                    const msgSenderId = (msg.senderId || '').trim();
                    const msgSenderEmail = (msg.senderEmail || '').trim().toLowerCase();

                    // Gönderici adı mevcut ve oturum açan kullanıcının adından farklıysa ASLA 'isMe' olamaz
                    const nameDiffers = Boolean(currentUserName && msgSenderName && currentUserName !== msgSenderName);

                    // Eşleşme kontrolü: İsimler tam uyuşuyorsa veya benzersiz e-posta / özel ID uyuşuyorsa
                    const isMe = !nameDiffers && Boolean(
                      (currentUserName && msgSenderName && currentUserName === msgSenderName) ||
                      (currentUserEmail && msgSenderEmail && currentUserEmail === msgSenderEmail) ||
                      (currentUserId && msgSenderId && currentUserId === msgSenderId && !msgSenderId.startsWith('user-admin-01') && !msgSenderId.startsWith('user-admin'))
                    );
                    return (
                      <ChatMessageBubble
                        key={msg.id}
                        id={msg.id}
                        senderId={msg.senderId}
                        senderName={msg.senderName}
                        senderRole={msg.senderRole}
                        title={msg.title}
                        content={msg.content}
                        createdAt={msg.createdAt}
                        isPinned={msg.isPinned}
                        isEdited={msg.isEdited}
                        editedAt={msg.editedAt}
                        isDeleted={msg.isDeleted}
                        deletedAt={msg.deletedAt}
                        replyTo={msg.replyTo}
                        reactions={msg.reactions}
                        currentUserId={adminId}
                        isMe={isMe}
                        canEdit={isMe && !msg.isDeleted}
                        canDelete={!msg.isDeleted}
                        selectionMode={selectionMode}
                        isSelected={selectedMsgIds.includes(msg.id)}
                        onToggleSelect={handleToggleSelectMessage}
                        onReply={(id, name, text) => setReplyTarget({ id, senderName: name, content: text })}
                        onReact={(messageId, emoji) => {
                          toggleChannelMessageReaction(messageId, emoji, adminId);
                          if (activeChannel) {
                            loadChannelMessages(activeChannel.id);
                          }
                        }}
                        onEdit={(messageId, newContent) => {
                          const res = editChannelMessage(messageId, newContent, adminId);
                          if (res.success && activeChannel) {
                            loadChannelMessages(activeChannel.id);
                          }
                        }}
                        onDelete={(messageId) => {
                          const res = deleteChannelMessage(messageId, adminId, 'admin');
                          if (res.success && activeChannel) {
                            loadChannelMessages(activeChannel.id);
                          }
                        }}
                      />
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* İdari Mesaj & Duyuru Gönderim Alanı */}
              {activeChannel.status === 'active' ? (
                <form
                  onSubmit={handleAdminPostMessage}
                  className="p-3 sm:p-4 bg-white border-t border-slate-200 space-y-2.5"
                >
                  {/* Hata / Doğrulama Uyarısı (Doğrudan Gönderim Alanının Üzerinde - Gözden Kaçmaz) */}
                  {errorMsg && (
                    <div className="p-2.5 px-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-center justify-between shadow-xs animate-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="font-semibold">{errorMsg}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setErrorMsg(null)}
                        className="text-rose-600 hover:text-rose-800 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Yanıtlanan Mesaj Başlığı (Varsa) */}
                  {replyTarget && (
                    <div className="flex items-center justify-between p-2 px-3 bg-blue-50/90 border border-blue-200 rounded-xl text-xs text-blue-900 animate-in fade-in">
                      <div className="flex items-center gap-2 min-w-0">
                        <CornerUpLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="font-bold truncate">{replyTarget.senderName} yanıtlanıyor:</span>
                        <span className="italic text-slate-500 truncate text-[11px]">"{replyTarget.content}"</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyTarget(null)}
                        className="p-1 text-slate-400 hover:text-slate-700 ml-2 cursor-pointer"
                        title="Yanıtı İptal Et"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5 text-slate-900">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>İdari Duyuru / Mesaj Gönder</span>
                    </span>
                    <span className="text-[11px] text-slate-400">Tüm kanal üyelerine iletilir</span>
                  </div>

                  {activeChannel.type === 'announcement' && (
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Duyuru Başlığı (Zorunlu) *"
                        value={adminPostTitle}
                        onChange={(e) => {
                          setAdminPostTitle(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={isPinned}
                          onChange={(e) => setIsPinned(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>En Üste Sabitle</span>
                      </label>
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <textarea
                      rows={2}
                      placeholder="Kanala iletmek istediğiniz idari mesaj veya bilgilendirmeyi yazınız..."
                      value={adminPostContent}
                      onChange={(e) => setAdminPostContent(e.target.value)}
                      className="flex-1 p-2.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none leading-relaxed font-sans"
                    />
                    <button
                      type="submit"
                      disabled={!adminPostContent.trim() || isPostingMsg}
                      className="h-16 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xs shrink-0 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Gönder</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
                  Bu kanal idari olarak kapatıldığı için yeni mesaj gönderimi kilitlenmiştir. Tekrar açmak için yukarıdaki <strong>Aç</strong> butonunu kullanabilirsiniz.
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 text-xs">
              <Hash className="w-10 h-10 text-slate-300 mb-2 opacity-50" />
              <span>İncelemek istediğiniz bir kanalı sol listeden seçiniz.</span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: YENİ KANAL OLUŞTURMA */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <span>Yeni Grup Kanalı Tanımla</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Bağlı Eğitim Grubu *</label>
                <select
                  value={modalGroupId}
                  onChange={(e) => setModalGroupId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} — {g.programTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Kanal Türü *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType('announcement')}
                    className={`p-2.5 rounded-lg border text-left flex items-start gap-2 transition ${
                      modalType === 'announcement'
                        ? 'border-amber-400 bg-amber-50/50 text-amber-900 font-bold'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <Megaphone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-xs">Resmî Duyuru</div>
                      <div className="text-[10px] text-slate-500 font-normal">Yalnızca idare ve eğitmen yazar</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalType('discussion')}
                    className={`p-2.5 rounded-lg border text-left flex items-start gap-2 transition ${
                      modalType === 'discussion'
                        ? 'border-blue-400 bg-blue-50/50 text-blue-900 font-bold'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <Hash className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-xs">Grup Tartışması</div>
                      <div className="text-[10px] text-slate-500 font-normal">Tüm kursiyerler mesaj yazabilir</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Kanal Adı *</label>
                <input
                  type="text"
                  placeholder="Örn: Sınav & Proje Bilgilendirme"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Açıklama</label>
                <textarea
                  rows={2}
                  placeholder="Kanalın amacı ve kullanım sınırları..."
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                >
                  Kanalı Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: KANAL DÜZENLEME */}
      {/* ========================================================================= */}
      {editingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Kanal Ayarlarını Düzenle</span>
              </h3>
              <button
                onClick={() => setEditingChannel(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              {/* Bağlı Grup ve Üye Bilgilendirme Kartı (Grup Değişmez Güvencesi) */}
              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 text-[11px] text-blue-900 space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>Bağlı Grup: <strong>{editingChannel.groupName || 'Tüm Gruplar'}</strong></span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                    Grup & Üyeler Sabit
                  </span>
                </div>
                <p className="text-[10px] text-blue-700/90 leading-tight">
                  Kanal adı veya durumu güncellendiğinde kanalın bağlı olduğu grup, kursiyerleri ve eğitmenleri kesinlikle değişmez; mevcut üyelikler aynen korunur.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Kanal Adı *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Açıklama</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Kanal Durumu</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'active' | 'closed')}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="active">Aktif (İletişim Açık)</option>
                  <option value="closed">Kapatıldı (Salt Okunur)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingChannel(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: KANAL SİLME ONAYI */}
      {/* ========================================================================= */}
      {deletingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Kanalı Silmek İstiyor musunuz?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  &quot;{deletingChannel.name}&quot; kanalı ve bu kanala bağlı tüm mesaj geçmişi silinecektir.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingChannel(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
              >
                Evet, Kanalı Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: KANAL ÜYELERİ LİSTESİ */}
      {/* ========================================================================= */}
      {showMembersModal && activeChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Kanal Üyeleri — {activeChannel.name}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Toplam {activeChannelMembers.length} kayıtlı üye (kursiyer ve eğitmen)
                </p>
              </div>
              <button
                onClick={() => setShowMembersModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 text-xs">
              {activeChannelMembers.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  Bu kanala henüz atanmış üye kaydı bulunamadı.
                </div>
              ) : (
                activeChannelMembers.map((m) => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{m.participantName}</div>
                      <div className="text-[10px] text-slate-400">
                        Katılım: {new Date(m.joinedAt).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.role === 'instructor'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {m.role === 'instructor'
                        ? 'Eğitmen'
                        : m.role === 'admin'
                        ? 'Yönetici'
                        : 'Kursiyer'}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setShowMembersModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: TOPLU MESAJ SİLME ONAY MODALI */}
      {/* ========================================================================= */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <span>Toplu Mesaj Silme</span>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchDeleteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Seçilen <strong className="text-slate-900">{selectedMsgIds.length} adet</strong> mesajı silmek istediğinizden emin misiniz? Silinen mesajların yerine <em>"Bu mesaj silindi"</em> bildirimi yerleştirilecektir.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBatchDeleteModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white shadow-2xs transition cursor-pointer"
              >
                Evet, {selectedMsgIds.length} Mesajı Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
