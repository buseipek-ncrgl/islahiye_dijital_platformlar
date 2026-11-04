import React, { useState, useEffect, useRef } from 'react';
import {
  Hash,
  Megaphone,
  MessageSquare,
  Send,
  Pin,
  ArrowLeft,
  Info,
  ShieldCheck,
  AlertCircle,
  Filter,
  CornerUpLeft,
  X,
  CheckSquare,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import {
  Channel,
  ChannelMessage,
} from '../types';
import {
  getChannelsForUser,
  getMessagesForChannel,
  sendChannelMessage,
  editChannelMessage,
  deleteChannelMessage,
  deleteMultipleChannelMessages,
  toggleChannelMessageReaction,
  CHANNELS_UPDATE_EVENT,
  CHANNEL_MESSAGES_UPDATE_EVENT,
} from '../services/channelStorage';
import { getStoredGroups } from '../services/enrollmentStorage';
import { ChatMessageBubble } from '../components/common/ChatMessageBubble';
import { playMessageSentSound } from '../services/soundFx';

export const InstructorChannelsPage: React.FC = () => {
  const { currentUser } = useDemoRole();
  const instructorId = currentUser?.id || (currentUser?.email ? `usr-${currentUser.email.split('@')[0].replace(/\./g, '-')}` : 'usr-instructor');
  const instructorName = currentUser?.fullName || currentUser?.name || 'Murat Özkan';

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [inputText, setInputText] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{ id: string; senderName: string; senderRole?: string; content: string } | null>(null);

  // Toplu Seçim & Silme State'leri
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<string[]>([]);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleToggleSelectMessage = (msgId: string) => {
    setSelectedMsgIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  const handleSelectAllMessages = () => {
    const selectable = messages.filter(
      (m) => !m.isDeleted && (m.senderId === instructorId || m.senderRole === 'trainee')
    );
    setSelectedMsgIds(selectable.map((m) => m.id));
  };

  const handleConfirmBatchDelete = () => {
    if (selectedMsgIds.length === 0) return;
    const res = deleteMultipleChannelMessages(selectedMsgIds, instructorId, 'instructor');
    if (res.success && selectedChannelId) {
      loadMessages(selectedChannelId);
    }
    setSelectedMsgIds([]);
    setSelectionMode(false);
    setShowBatchDeleteModal(false);
  };

  const loadChannels = () => {
    const userChans = getChannelsForUser(instructorId, 'instructor');
    setChannels(userChans);

    if (userChans.length > 0 && !selectedChannelId) {
      setSelectedChannelId(userChans[0].id);
    }
  };

  const loadMessages = (chanId: string) => {
    const res = getMessagesForChannel(chanId, instructorId, 'instructor');
    if (res.error) {
      setErrorMsg(res.error);
      setMessages([]);
    } else {
      setMessages(res.messages);
      setErrorMsg(null);
    }
  };

  useEffect(() => {
    loadChannels();

    const handleUpdate = () => {
      loadChannels();
      if (selectedChannelId) {
        loadMessages(selectedChannelId);
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
  }, [instructorId]);

  useEffect(() => {
    if (selectedChannelId) {
      loadMessages(selectedChannelId);
      setInputText('');
      setAnnouncementTitle('');
      setIsPinned(false);
      setErrorMsg(null);
    }
  }, [selectedChannelId]);

  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMsgCountRef.current = messages.length;
  }, [messages]);

  const assignedGroups = getStoredGroups().filter((g) => g.instructorIds.includes(instructorId));

  const filteredChannels = channels.filter((c) => {
    if (selectedGroupFilter === 'all') return true;
    return c.groupId === selectedGroupFilter;
  });

  const activeChannel = channels.find((c) => c.id === selectedChannelId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannelId || !activeChannel) return;

    if (!inputText.trim()) {
      setErrorMsg('Boş içerik paylaşılamaz.');
      return;
    }

    if (activeChannel.type === 'announcement' && !announcementTitle.trim()) {
      setErrorMsg('Duyuru için bir başlık girilmesi zorunludur.');
      return;
    }

    const res = sendChannelMessage({
      channelId: selectedChannelId,
      senderId: instructorId,
      senderName: instructorName,
      senderEmail: currentUser?.email,
      senderRole: 'instructor',
      title: activeChannel.type === 'announcement' ? announcementTitle : undefined,
      content: inputText,
      isPinned: activeChannel.type === 'announcement' ? isPinned : false,
      replyTo: replyTarget || undefined,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Duyuru/mesaj paylaşılamadı.');
    } else {
      playMessageSentSound();
      setInputText('');
      setAnnouncementTitle('');
      setIsPinned(false);
      setReplyTarget(null);
      setErrorMsg(null);
      loadMessages(selectedChannelId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Üst Başlık & Hızlı Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Sınıf & Grup Kanal Yönetimi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Atandığınız eğitim gruplarına resmî duyuru yayımlama ve sınıf tartışmalarına katılma alanı.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/egitmen/mesajlar"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <MessageSquare className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Kursiyer Mesajlarım</span>
          </Link>
        </div>
      </div>

      {/* Yetki Sınırı Bilgilendirmesi */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-semibold text-slate-900">Yetki Sınırı:</span> Yalnızca odanın size atadığı grupların kanallarında duyuru yayımlayabilir veya tartışmalara katılabilirsiniz.
        </div>
      </div>

      {/* Ana Kanal Paneli */}
      <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* SOL: Kanal Listesi ve Grup Filtresi */}
        <div
          className={`md:col-span-5 lg:col-span-4 border-r border-slate-200 flex flex-col ${
            mobileShowDetail ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Grup Filtresi */}
          <div className="p-3 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-brand-navy uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Grup Filtresi:</span>
            </span>

            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="text-xs rounded border border-slate-300 bg-white px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-blue"
            >
              <option value="all">Tüm Gruplarım ({channels.length})</option>
              {assignedGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Kanal Listesi */}
          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[520px]">
            {filteredChannels.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Seçili filtrede atanmış kanal bulunamadı.
              </div>
            ) : (
              filteredChannels.map((chan) => {
                const isSelected = chan.id === selectedChannelId;
                const isAnnounce = chan.type === 'announcement';

                return (
                  <button
                    key={chan.id}
                    onClick={() => {
                      setSelectedChannelId(chan.id);
                      setMobileShowDetail(true);
                    }}
                    className={`w-full p-4 text-left transition-colors flex items-start gap-3 hover:bg-slate-50 ${
                      isSelected ? 'bg-blue-50/60 border-l-4 border-brand-blue' : ''
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isAnnounce
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-brand-blue border border-blue-200'
                      }`}
                    >
                      {isAnnounce ? <Megaphone className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-brand-navy truncate">{chan.name}</span>
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                            isAnnounce
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {isAnnounce ? 'Duyuru' : 'Tartışma'}
                        </span>
                      </div>

                      <div className="text-[11px] font-medium text-slate-600 truncate mb-1">
                        {chan.groupName}
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-1">{chan.description}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* SAĞ: Mesaj & Duyuru Akışı ve Yayınlama Formu */}
        <div
          className={`md:col-span-7 lg:col-span-8 flex flex-col bg-slate-50/30 ${
            !mobileShowDetail ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeChannel ? (
            <>
              {/* Kanal Başlığı */}
              <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileShowDetail(false)}
                    className="md:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
                    aria-label="Listeye Dön"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      activeChannel.type === 'announcement'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-brand-blue'
                    }`}
                  >
                    {activeChannel.type === 'announcement' ? (
                      <Megaphone className="w-4 h-4" />
                    ) : (
                      <Hash className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-brand-navy flex items-center gap-2">
                      <span>{activeChannel.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({activeChannel.groupName})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">
                      {activeChannel.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
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

                  <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-blue" />
                    <span>Yetkili Eğitmen</span>
                  </div>
                </div>
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
                        onClick={() => setSelectedMsgIds([])}
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

              {/* Mesaj / Duyuru Akışı (WhatsApp / Telegram Balon Görünümü) */}
              <div className="flex-1 p-4 overflow-y-auto space-y-2.5 max-h-[440px] bg-slate-100/60">
                {messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Bu kanalda henüz paylaşılan bir içerik bulunmuyor.
                  </div>
                ) : (
                  messages.map((msg) => {
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
                      (currentUserId && msgSenderId && currentUserId === msgSenderId && !msgSenderId.startsWith('user-instructor-01') && !msgSenderId.startsWith('user-instructor'))
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
                        currentUserId={instructorId}
                        isMe={isMe}
                        canEdit={isMe && !msg.isDeleted}
                        canDelete={!msg.isDeleted && (isMe || msg.senderRole === 'trainee')}
                        selectionMode={selectionMode}
                        isSelected={selectedMsgIds.includes(msg.id)}
                        onToggleSelect={handleToggleSelectMessage}
                        onReply={(id, name, text) => setReplyTarget({ id, senderName: name, content: text })}
                        onReact={(messageId, emoji) => {
                          toggleChannelMessageReaction(messageId, emoji, instructorId);
                          if (selectedChannelId) {
                            loadMessages(selectedChannelId);
                          }
                        }}
                        onEdit={(messageId, newContent) => {
                          const editRes = editChannelMessage(messageId, newContent, instructorId);
                          if (editRes.success && selectedChannelId) {
                            loadMessages(selectedChannelId);
                          }
                        }}
                        onDelete={(messageId) => {
                          const delRes = deleteChannelMessage(messageId, instructorId, 'instructor');
                          if (delRes.success && selectedChannelId) {
                            loadMessages(selectedChannelId);
                          }
                        }}
                      />
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Hata Bildirimi */}
              {errorMsg && (
                <div className="mx-4 p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Eğitmen Gönderim Formu */}
              <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-slate-200 space-y-2">
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
                {activeChannel.type === 'announcement' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={announcementTitle}
                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                        placeholder="Resmi Duyuru Başlığı (Zorunlu) *"
                        className="flex-1 p-2 text-xs rounded border border-slate-300 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        maxLength={150}
                      />

                      <label className="flex items-center gap-1.5 text-xs text-slate-600 select-none cursor-pointer px-2 py-1.5 rounded border border-slate-200 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={isPinned}
                          onChange={(e) => setIsPinned(e.target.checked)}
                          className="rounded text-brand-blue"
                        />
                        <Pin className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-[11px]">Başa Sabitle</span>
                      </label>
                    </div>

                    <div className="flex items-end gap-2">
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Duyuru metnini detaylı olarak yazınız..."
                        rows={3}
                        className="flex-1 p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        maxLength={3000}
                      />

                      <button
                        type="submit"
                        disabled={!inputText.trim() || !announcementTitle.trim()}
                        className="h-10 px-4 rounded-lg bg-amber-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
                      >
                        <Megaphone className="w-3.5 h-3.5" />
                        <span>Duyuruyu Yayımla</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        placeholder="Grup tartışmasına yanıtınızı yazın... (Enter ile gönder)"
                        rows={2}
                        className="w-full resize-none p-2.5 pr-14 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        maxLength={3000}
                      />
                      <span className="absolute bottom-2 right-2 text-[10px] text-slate-400">
                        {inputText.length}/3000
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="h-10 px-4 rounded-lg bg-brand-blue text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
                    >
                      <span>Paylaş</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>
                    {activeChannel.type === 'announcement'
                      ? '* Yayınlanan duyuru grubun tüm kursiyerleri tarafından okunabilir.'
                      : '* Eğitmen yanıtı sınıf tartışma akışına iletilir.'}
                  </span>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <Hash className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-brand-navy">Kanal Seçilmedi</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Lütfen soldaki listeden bir sınıf kanalı seçiniz.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toplu Mesaj Silme Onay Modalı */}
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
