import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Info,
  AlertCircle,
  Plus,
  ShieldCheck,
  Hash,
  Search,
  CornerUpLeft,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import {
  Conversation,
  DirectMessage,
} from '../types';
import {
  getConversationsForUser,
  getMessagesForConversation,
  sendDirectMessage,
  markConversationAsRead,
  getEligibleInstructorsForTrainee,
  getOrCreateConversation,
  EligibleInstructorContext,
  editDirectMessage,
  deleteDirectMessage,
  toggleDirectMessageReaction,
  MESSAGES_UPDATE_EVENT,
  CONVERSATIONS_UPDATE_EVENT,
} from '../services/messageStorage';
import { ChatMessageBubble } from '../components/common/ChatMessageBubble';
import { playMessageSentSound } from '../services/soundFx';

export const TraineeMessagesPage: React.FC = () => {
  const { currentUser } = useDemoRole();
  const traineeId = currentUser?.id || 'user-trainee-01';
  const traineeName = currentUser?.name || 'Ayşe Demir';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [eligibleInstructors, setEligibleInstructors] = useState<EligibleInstructorContext[]>([]);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [replyTarget, setReplyTarget] = useState<{ id: string; senderName: string; senderRole?: string; content: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = () => {
    const userConvs = getConversationsForUser(traineeId, 'trainee');
    setConversations(userConvs);

    if (userConvs.length > 0 && !selectedConversationId) {
      setSelectedConversationId(userConvs[0].id);
    }
  };

  const loadMessages = (convId: string) => {
    const res = getMessagesForConversation(convId, traineeId);
    if (res.error) {
      setErrorMsg(res.error);
      setMessages([]);
    } else {
      setMessages(res.messages);
      setErrorMsg(null);
      markConversationAsRead(convId, traineeId, 'trainee');
    }
  };

  useEffect(() => {
    loadConversations();
    setEligibleInstructors(getEligibleInstructorsForTrainee(traineeId));

    const handleUpdate = () => {
      loadConversations();
      if (selectedConversationId) {
        loadMessages(selectedConversationId);
      }
    };

    window.addEventListener(MESSAGES_UPDATE_EVENT, handleUpdate);
    window.addEventListener(CONVERSATIONS_UPDATE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(MESSAGES_UPDATE_EVENT, handleUpdate);
      window.removeEventListener(CONVERSATIONS_UPDATE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [traineeId]);

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    }
  }, [selectedConversationId]);

  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMsgCountRef.current = messages.length;
  }, [messages]);

  const activeConv = conversations.find((c) => c.id === selectedConversationId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversationId) return;

    if (!inputText.trim()) {
      setErrorMsg('Boş mesaj gönderilemez.');
      return;
    }

    const res = sendDirectMessage({
      conversationId: selectedConversationId,
      senderId: traineeId,
      senderRole: 'trainee',
      senderName: traineeName,
      body: inputText,
      replyTo: replyTarget || undefined,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Mesaj iletilemedi.');
    } else {
      playMessageSentSound();
      setInputText('');
      setReplyTarget(null);
      setErrorMsg(null);
      loadMessages(selectedConversationId);
      loadConversations();
    }
  };

  const handleStartConversationWith = (inst: EligibleInstructorContext) => {
    const res = getOrCreateConversation(
      traineeId,
      traineeName,
      inst.instructorId,
      inst.instructorName,
      inst.groupId
    );

    if (res.conversation) {
      setSelectedConversationId(res.conversation.id);
      setShowNewModal(false);
      setMobileShowDetail(true);
      loadConversations();
    } else {
      setErrorMsg(res.error || 'Görüşme başlatılamadı.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Üst Başlık & Hızlı Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Eğitmen Birebir Mesajlaşması
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Yalnızca kayıtlı ve aktif olduğunuz grupların atanmış eğitmenleriyle birebir resmî danışma alanı.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/kursiyer/kanallar"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <Hash className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Grup Kanallarım</span>
          </Link>

          <button
            onClick={() => setShowNewModal(true)}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Yeni Mesaj Başlat</span>
          </button>
        </div>
      </div>

      {/* Eğitmen Danışma Bilgilendirme Kartı */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <span className="font-semibold">Danışma Esasları:</span> Eğitmenlerinize ders içerikleri, ödev revizyonları ve eğitim programı kapsamındaki sorularınızı iletebilirsiniz. Mesajlarınız doğrudan atanmış grup eğitmeninizin gelen kutusuna iletilir.
        </div>
      </div>

      {/* Ana Mesajlaşma Gövdesi */}
      <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* SOL: Konuşma Listesi */}
        <div
          className={`md:col-span-5 lg:col-span-4 border-r border-slate-200 flex flex-col ${
            mobileShowDetail ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-3 border-b border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-navy uppercase tracking-wider">
                Konuşmalar ({conversations.length})
              </span>
              <span className="text-[11px] text-slate-500">Aktif Kayıtlar</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Eğitmen veya mesaj ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[520px]">
            {conversations.filter((c) => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return (
                c.instructorName.toLowerCase().includes(q) ||
                (c.groupName && c.groupName.toLowerCase().includes(q)) ||
                (c.lastMessagePreview && c.lastMessagePreview.toLowerCase().includes(q))
              );
            }).length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">
                  {searchQuery ? 'Aramanıza uygun konuşma bulunamadı.' : 'Henüz başlatılmış bir konuşma yok.'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Atanmış eğitmeninizle görüşme başlatmak için yukarıdaki "Yeni Mesaj Başlat" butonunu kullanabilirsiniz.
                </p>
              </div>
            ) : (
              conversations
                .filter((c) => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    c.instructorName.toLowerCase().includes(q) ||
                    (c.groupName && c.groupName.toLowerCase().includes(q)) ||
                    (c.lastMessagePreview && c.lastMessagePreview.toLowerCase().includes(q))
                  );
                })
                .map((conv) => {
                const isSelected = conv.id === selectedConversationId;
                const formattedDate = conv.lastMessageAt
                  ? new Date(conv.lastMessageAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversationId(conv.id);
                      setMobileShowDetail(true);
                    }}
                    className={`w-full p-4 text-left transition-colors flex items-start gap-3 hover:bg-slate-50 ${
                      isSelected ? 'bg-blue-50/60 border-l-4 border-brand-blue' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-brand-navy flex items-center justify-center font-bold text-xs shrink-0 border border-slate-300">
                      {conv.instructorName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-brand-navy truncate">
                          {conv.instructorName}
                        </span>
                        {formattedDate && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formattedDate}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-medium text-blue-700 truncate mb-1">
                        {conv.groupName}
                      </div>

                      <p className="text-xs text-slate-500 truncate">
                        {conv.lastMessagePreview || 'Henüz mesaj yok.'}
                      </p>
                    </div>

                    {conv.unreadCountTrainee > 0 && (
                      <span className="w-5 h-5 rounded-full bg-brand-blue text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {conv.unreadCountTrainee}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* SAĞ: Mesajlaşma Detayı ve Giriş Alanı */}
        <div
          className={`md:col-span-7 lg:col-span-8 flex flex-col bg-slate-50/30 ${
            !mobileShowDetail ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConv ? (
            <>
              {/* Konuşma Başlığı */}
              <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileShowDetail(false)}
                    className="md:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
                    aria-label="Listeye Dön"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="w-9 h-9 rounded-full bg-brand-navy text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {activeConv.instructorName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-brand-navy flex items-center gap-2">
                      <span>{activeConv.instructorName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Atanmış Eğitmen
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-md">
                      {activeConv.programTitle} — <span className="font-medium text-slate-700">{activeConv.groupName}</span>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Yetkili Grup İletişimi</span>
                </div>
              </div>

              {/* Mesaj Listesi */}
              {/* Mesaj Listesi (WhatsApp / Telegram Balon Görünümü) */}
              <div className="flex-1 p-4 overflow-y-auto space-y-2.5 max-h-[440px] bg-slate-100/60">
                {/* Güvenlik ve Gizlilik İpucu */}
                <div className="text-center my-1.5">
                  <span className="inline-block px-3 py-1 bg-white text-slate-500 text-[10px] rounded-full border border-slate-200 shadow-2xs">
                    Görüşme {activeConv.groupName} kapsamında korunmaktadır.
                  </span>
                </div>

                {messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Bu konuşmada henüz bir mesaj bulunmuyor. İlk mesajınızı aşağıdan gönderebilirsiniz.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const currentUserName = (currentUser?.fullName || currentUser?.name || '').trim().toLowerCase();
                    const currentUserId = (currentUser?.id || '').trim();

                    const msgSenderName = (msg.senderName || '').trim().toLowerCase();
                    const msgSenderId = (msg.senderId || '').trim();

                    const nameDiffers = Boolean(currentUserName && msgSenderName && currentUserName !== msgSenderName);
                    const isMe = !nameDiffers && Boolean(
                      (currentUserName && msgSenderName && currentUserName === msgSenderName) ||
                      (currentUserId && msgSenderId && currentUserId === msgSenderId && !msgSenderId.startsWith('user-trainee-01'))
                    );
                    return (
                      <ChatMessageBubble
                        key={msg.id}
                        id={msg.id}
                        senderId={msg.senderId}
                        senderName={msg.senderName}
                        senderRole={msg.senderRole}
                        content={msg.body}
                        createdAt={msg.createdAt}
                        isEdited={msg.isEdited}
                        editedAt={msg.editedAt}
                        isDeleted={msg.isDeleted}
                        deletedAt={msg.deletedAt}
                        isMe={isMe}
                        canEdit={isMe && !msg.isDeleted}
                        canDelete={isMe && !msg.isDeleted}
                        replyTo={msg.replyTo}
                        reactions={msg.reactions}
                        currentUserId={traineeId}
                        onReact={(messageId, emoji) => {
                          toggleDirectMessageReaction(messageId, emoji, traineeId);
                          if (selectedConversationId) {
                            loadMessages(selectedConversationId);
                          }
                        }}
                        onReply={(msgId, senderName, content) => {
                          setReplyTarget({
                            id: msgId,
                            senderName,
                            content,
                          });
                        }}
                        onEdit={(messageId, newContent) => {
                          const editRes = editDirectMessage(messageId, newContent, traineeId);
                          if (editRes.success && selectedConversationId) {
                            loadMessages(selectedConversationId);
                          }
                        }}
                        onDelete={(messageId) => {
                          const delRes = deleteDirectMessage(messageId, traineeId);
                          if (delRes.success && selectedConversationId) {
                            loadMessages(selectedConversationId);
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

              {/* Mesaj Gönderme Formu */}
              <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-slate-200">
                {/* Yanıtlanan Mesaj Önizleme Bandı */}
                {replyTarget && (
                  <div className="mb-2.5 px-3 py-2 bg-blue-50/90 border-l-4 border-blue-600 rounded-r-lg flex items-center justify-between animate-fadeIn text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <CornerUpLeft className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-blue-900 block truncate">
                          {replyTarget.senderName} kişisine yanıt:
                        </span>
                        <span className="text-slate-600 truncate block text-[11px]">
                          {replyTarget.content}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyTarget(null)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-blue-100 rounded transition shrink-0 ml-2"
                      title="Yanıtı iptal et"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

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
                      placeholder={`Eğitmeniniz ${activeConv.instructorName}'a mesajınızı yazın... (Göndermek için Enter)`}
                      rows={2}
                      className="w-full resize-none p-3 pr-14 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                      maxLength={2000}
                    />
                    <span className="absolute bottom-2 right-2 text-[10px] text-slate-400">
                      {inputText.length}/2000
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="h-11 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
                  >
                    <span>Gönder</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>* Dosya ve belge ekleri resmî ödev teslim masası üzerinden yüklenmelidir.</span>
                  <span>Enter: Gönder | Shift + Enter: Yeni Satır</span>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-900">Görüşme Seçilmedi</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Lütfen soldaki listeden bir konuşma seçin veya kayıtlı grubunuzun atanmış eğitmeniyle yeni bir görüşme başlatın.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* YENİ GÖRÜŞME MODALI */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Yeni Eğitmen Görüşmesi</h3>
                <p className="text-xs text-slate-500 mt-0.5">Yalnızca kayıtlı olduğunuz grupların yetkili eğitmenleri listelenir.</p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {eligibleInstructors.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Aktif bir grupta atanmış eğitmeniniz bulunmuyor.
                </div>
              ) : (
                eligibleInstructors.map((inst) => (
                  <div
                    key={`${inst.instructorId}-${inst.groupId}`}
                    className="py-3.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900">{inst.instructorName}</div>
                      <div className="text-xs text-blue-700 font-medium">{inst.groupName}</div>
                      <div className="text-xs text-slate-500">{inst.programTitle}</div>
                    </div>

                    <button
                      onClick={() => handleStartConversationWith(inst)}
                      className="h-9 px-3.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shrink-0"
                    >
                      Mesaj Başlat
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowNewModal(false)}
                className="h-9 px-4 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
