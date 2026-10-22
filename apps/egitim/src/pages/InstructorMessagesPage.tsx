import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Info,
  CheckCheck,
  Check,
  AlertCircle,
  Filter,
  Hash,
  ChevronRight,
  GraduationCap,
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
  MESSAGES_UPDATE_EVENT,
  CONVERSATIONS_UPDATE_EVENT,
} from '../services/messageStorage';
import { getStoredGroups } from '../services/enrollmentStorage';

export const InstructorMessagesPage: React.FC = () => {
  const { currentUser } = useDemoRole();
  const instructorId = currentUser?.id || 'user-instructor-01';
  const instructorName = currentUser?.name || 'Murat Özkan';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = () => {
    const userConvs = getConversationsForUser(instructorId, 'instructor');
    setConversations(userConvs);

    if (userConvs.length > 0 && !selectedConversationId) {
      setSelectedConversationId(userConvs[0].id);
    }
  };

  const loadMessages = (convId: string) => {
    const res = getMessagesForConversation(convId, instructorId);
    if (res.error) {
      setErrorMsg(res.error);
      setMessages([]);
    } else {
      setMessages(res.messages);
      setErrorMsg(null);
      markConversationAsRead(convId, instructorId, 'instructor');
    }
  };

  useEffect(() => {
    loadConversations();

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
  }, [instructorId]);

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    }
  }, [selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Eğitmenin grupları
  const assignedGroups = getStoredGroups().filter((g) => g.instructorIds.includes(instructorId));

  const filteredConversations = conversations.filter((c) => {
    if (selectedGroupFilter === 'all') return true;
    return c.groupId === selectedGroupFilter;
  });

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
      senderId: instructorId,
      senderRole: 'instructor',
      senderName: instructorName,
      body: inputText,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Mesaj iletilemedi.');
    } else {
      setInputText('');
      setErrorMsg(null);
      loadMessages(selectedConversationId);
      loadConversations();
    }
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Ekmek Kırıntısı */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/egitmen" className="hover:text-brand-blue transition-colors">
              Eğitmen Masası
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-800 font-semibold">Kursiyer Mesajları</span>
          </div>
          <h1 className="text-2xl font-bold text-brand-navy">Kursiyer Danışma & Mesaj Masası</h1>
          <p className="text-xs text-slate-500 mt-1">
            Yalnızca size atanmış eğitim gruplarındaki kursiyerlerin resmi soru ve danışma mesajları.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/egitmen/kanallar"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Hash className="w-4 h-4 text-brand-blue" />
            <span>Sınıf Kanalları</span>
          </Link>
        </div>
      </div>

      {/* Dürüst Demo Bilgilendirme Kartı */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-3.5 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-semibold">Eğitmen İletişim İlkesi (Sprint E04-A):</span> Kursiyer mesajlaşması, yalnızca atandığınız grupların kapsamıyla sınırlıdır. Kursiyerin diğer programlardaki kayıtlarına veya kişisel evraklarına erişim yetkisi verilmez. Yanıtlarınız yerel demo veritabanına işlenir.
        </div>
      </div>

      {/* Ana Mesajlaşma Gövdesi */}
      <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* SOL: Konuşma Listesi ve Filtreleme */}
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
              <option value="all">Tüm Gruplarım ({conversations.length})</option>
              {assignedGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Konuşmalar */}
          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[520px]">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">Bu grupta henüz mesaj bulunmuyor.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Kursiyerleriniz soru gönderdiğinde mesajlar bu alanda listelenecektir.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
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
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-brand-navy flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">
                      {conv.traineeName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-brand-navy truncate">
                          {conv.traineeName}
                        </span>
                        {formattedDate && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formattedDate}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-medium text-emerald-700 truncate mb-1">
                        {conv.groupName}
                      </div>

                      <p className="text-xs text-slate-500 truncate">
                        {conv.lastMessagePreview || 'Henüz mesaj yok.'}
                      </p>
                    </div>

                    {conv.unreadCountInstructor > 0 && (
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {conv.unreadCountInstructor}
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

                  <div className="w-9 h-9 rounded-full bg-slate-200 text-brand-navy flex items-center justify-center font-bold text-xs shrink-0 border border-slate-300">
                    {activeConv.traineeName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-brand-navy flex items-center gap-2">
                      <span>{activeConv.traineeName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-brand-blue border border-blue-200">
                        Kayıtlı Kursiyer
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-md">
                      {activeConv.programTitle} — <span className="font-medium text-slate-700">{activeConv.groupName}</span>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{activeConv.cohortName}</span>
                </div>
              </div>

              {/* Mesaj Listesi */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[440px]">
                <div className="text-center my-2">
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 text-[10px] rounded-full border border-slate-200">
                    Kursiyer danışma akışı • {activeConv.groupName}
                  </span>
                </div>

                {messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Bu konuşmada henüz bir mesaj bulunmuyor.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderRole === 'instructor';
                    const timeStr = new Date(msg.createdAt).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="text-[10px] text-slate-400 mb-0.5 px-1">
                          {isMe ? 'Siz (Eğitmen)' : msg.senderName} • {timeStr}
                        </div>

                        <div
                          className={`max-w-[82%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                            isMe
                              ? 'bg-brand-navy text-white rounded-br-xs'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.body}</p>

                          <div
                            className={`mt-1.5 pt-1 border-t flex items-center justify-end gap-1 text-[9px] ${
                              isMe ? 'border-blue-900/40 text-blue-200' : 'border-slate-100 text-slate-400'
                            }`}
                          >
                            <span>Yerel Demoya Kaydedildi</span>
                            {isMe ? (
                              msg.readAt ? (
                                <span title="Okundu (Demo Görüntüleme)">
                                  <CheckCheck className="w-3 h-3 text-cyan-300" />
                                </span>
                              ) : (
                                <span title="Kaydedildi">
                                  <Check className="w-3 h-3 text-blue-300" />
                                </span>
                              )
                            ) : null}
                          </div>
                        </div>
                      </div>
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
                      placeholder={`Kursiyer ${activeConv.traineeName}'a yanıtınızı yazın... (Göndermek için Enter)`}
                      rows={2}
                      className="w-full resize-none p-2.5 pr-14 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue"
                      maxLength={2000}
                    />
                    <span className="absolute bottom-2 right-2 text-[10px] text-slate-400">
                      {inputText.length}/2000
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="h-10 px-4 rounded-lg bg-brand-blue text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm"
                  >
                    <span>Yanıtla</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                  <span>* Eğitmen yanıtları yalnızca ilgili kursiyere özel olarak iletilir.</span>
                  <span>Enter: Gönder | Shift + Enter: Yeni Satır</span>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-brand-navy">Görüşme Seçilmedi</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Lütfen soldaki listeden bir kursiyer mesajı seçerek yanıt veriniz.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
