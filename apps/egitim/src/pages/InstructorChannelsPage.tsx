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
  ChevronRight,
  AlertCircle,
  Filter,
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
  CHANNELS_UPDATE_EVENT,
  CHANNEL_MESSAGES_UPDATE_EVENT,
} from '../services/channelStorage';
import { getStoredGroups } from '../services/enrollmentStorage';

export const InstructorChannelsPage: React.FC = () => {
  const { currentUser } = useDemoRole();
  const instructorId = currentUser?.id || 'user-instructor-01';
  const instructorName = currentUser?.name || 'Murat Özkan';

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [inputText, setInputText] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      senderRole: 'instructor',
      title: activeChannel.type === 'announcement' ? announcementTitle : undefined,
      content: inputText,
      isPinned: activeChannel.type === 'announcement' ? isPinned : false,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Duyuru/mesaj paylaşılamadı.');
    } else {
      setInputText('');
      setAnnouncementTitle('');
      setIsPinned(false);
      setErrorMsg(null);
      loadMessages(selectedChannelId);
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
            <span className="text-slate-800 font-semibold">Sınıf Kanalları</span>
          </div>
          <h1 className="text-2xl font-bold text-brand-navy">Sınıf & Grup Kanal Yönetimi</h1>
          <p className="text-xs text-slate-500 mt-1">
            Atandığınız eğitim gruplarına resmi duyuru yayımlama ve sınıf tartışmalarına katılma alanı.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/egitmen/mesajlar"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
          >
            <MessageSquare className="w-4 h-4 text-brand-blue" />
            <span>Kursiyer Mesajlarım</span>
          </Link>
        </div>
      </div>

      {/* Dürüst Demo Bilgilendirme Kartı */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-3.5 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-semibold">Yetki Sınırı:</span> Yalnızca odanın size atadığı grupların kanallarında duyuru yayımlayabilir veya tartışmalara katılabilirsiniz. Başka eğitmene ait grupların kanallarına erişim frontend demo seviyesinde engellenmiştir.
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

                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-blue" />
                  <span>Yetkili Eğitmen</span>
                </div>
              </div>

              {/* Mesaj / Duyuru Akışı */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[440px]">
                {messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Bu kanalda henüz paylaşılan bir içerik bulunmuyor.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isInstructor = msg.senderRole === 'instructor';
                    const isMe = msg.senderId === instructorId;
                    const isAnnounce = activeChannel.type === 'announcement';
                    const dateStr = new Date(msg.createdAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    // DUYURU MESAJI GÖRÜNÜMÜ
                    if (isAnnounce) {
                      return (
                        <div
                          key={msg.id}
                          className="bg-white rounded-xl border border-amber-200 shadow-sm p-4 relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500" />
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="p-1 rounded bg-amber-100 text-amber-800">
                                <Megaphone className="w-3.5 h-3.5" />
                              </span>
                              <h3 className="text-xs font-bold text-brand-navy">
                                {msg.title || 'Resmi Duyuru'}
                              </h3>
                              {msg.isPinned && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Pin className="w-2.5 h-2.5" />
                                  <span>Sabitlendi</span>
                                </span>
                              )}
                            </div>

                            <span className="text-[10px] text-slate-400 shrink-0">{dateStr}</span>
                          </div>

                          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed mb-3">
                            {msg.content}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                            <span className="font-semibold text-slate-700">Yayınlayan: {msg.senderName}</span>
                            <span className="text-slate-400">Yerel Demoya Kaydedildi</span>
                          </div>
                        </div>
                      );
                    }

                    // TARTIŞMA MESAJI GÖRÜNÜMÜ
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="text-[10px] text-slate-400 mb-0.5 px-1 flex items-center gap-1.5">
                          <span className="font-medium text-slate-600">
                            {isMe ? 'Siz (Eğitmen)' : msg.senderName}
                          </span>
                          {!isInstructor && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              Kursiyer
                            </span>
                          )}
                          <span>•</span>
                          <span>{dateStr}</span>
                        </div>

                        <div
                          className={`max-w-[82%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                            isMe
                              ? 'bg-brand-navy text-white rounded-br-xs'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <div
                            className={`mt-1 pt-0.5 text-right text-[9px] ${
                              isMe ? 'text-blue-200' : 'text-slate-400'
                            }`}
                          >
                            <span>Yerel Demoya Kaydedildi</span>
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

              {/* Eğitmen Gönderim Formu */}
              <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-slate-200 space-y-2">
                {activeChannel.type === 'announcement' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={announcementTitle}
                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                        placeholder="Resmi Duyuru Başlığı (Örn: 3. Hafta Saha İncelemesi)"
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
                  <span>Yerel Demo Simülasyonu</span>
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
    </div>
  );
};
