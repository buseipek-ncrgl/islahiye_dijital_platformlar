import React, { useState } from 'react';
import {
  CheckCheck,
  Edit2,
  Trash2,
  Pin,
  CornerUpLeft,
  X,
  Smile,
} from 'lucide-react';
import { ConversationParticipantRole } from '../../types';
import { playActionSound } from '../../services/soundFx';
import { getUserDisplayName } from '../../services/authorizationDemoService';

const QUICK_REACTIONS = ['👍', '❤️', '👏', '🎉', '💡', '🚀'];

export interface ChatMessageBubbleProps {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: ConversationParticipantRole | 'trainee' | 'instructor' | 'admin';
  title?: string;
  content: string;
  createdAt: string;
  isPinned?: boolean;
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  replyTo?: {
    id: string;
    senderName: string;
    senderRole?: string;
    content: string;
  };
  reactions?: Record<string, string[]>;
  currentUserId?: string;
  isMe: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (messageId: string, senderName: string, content: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  id,
  senderName,
  senderRole = 'trainee',
  title,
  content,
  createdAt,
  isPinned = false,
  isEdited = false,
  editedAt,
  isDeleted = false,
  deletedAt,
  replyTo,
  reactions,
  currentUserId,
  isMe,
  canEdit = false,
  canDelete = false,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
  onEdit,
  onDelete,
  onReply,
  onReact,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(content);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionDetailModal, setReactionDetailModal] = useState<{ emoji: string; userIds: string[] } | null>(null);

  // Baş harfler
  const initials = senderName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  // Saat formatı
  const timeStr = new Date(createdAt).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const editedTimeStr = editedAt
    ? new Date(editedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '';

  const deletedTimeStr = deletedAt
    ? new Date(deletedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '';

  const isRoleAdmin = senderRole === 'admin';
  const isRoleInstructor = senderRole === 'instructor';

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    if (onEdit) {
      onEdit(id, editText.trim());
      playActionSound();
    }
    setIsEditing(false);
  };

  const handleConfirmDeleteAction = () => {
    setShowDeleteModal(false);
    if (onDelete) {
      onDelete(id);
      playActionSound();
    }
  };

  return (
    <div id={`msg-${id}`} className={`group flex items-end gap-2 my-1.5 transition-all duration-300 ${isMe ? 'justify-end' : 'justify-start'}`}>
      {/* Toplu Seçim Kutusu (Sol - Gelen Mesajlar İçin) */}
      {selectionMode && !isDeleted && !isMe && (
        <div className="shrink-0 mb-3 flex items-center pr-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect?.(id)}
            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
            title="Mesajı seç"
          />
        </div>
      )}

      {/* Sol Avatar (Gelen mesajlar için) */}
      {!isMe && (
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mb-1 shadow-2xs ${
            isRoleAdmin
              ? 'bg-blue-800 text-white'
              : isRoleInstructor
              ? 'bg-emerald-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
          title={`${senderName} (${
            isRoleAdmin ? 'Yönetici' : isRoleInstructor ? 'Eğitmen' : 'Kursiyer'
          })`}
        >
          {initials}
        </div>
      )}

      {/* Mesaj Balonu ve Eylem Konteyneri */}
      <div className={`relative max-w-[85%] sm:max-w-[72%] md:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Gönderici İsmi ve Rol (Yalnızca gelen mesajlarda) */}
        {!isMe && !isDeleted && (
          <div className="flex items-center gap-1.5 mb-1 px-1">
            <span
              className={`text-[11px] font-bold ${
                isRoleAdmin
                  ? 'text-blue-800'
                  : isRoleInstructor
                  ? 'text-emerald-700'
                  : 'text-blue-700'
              }`}
            >
              {senderName}
            </span>
            <span
              className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${
                isRoleAdmin
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : isRoleInstructor
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {isRoleAdmin ? 'Yönetici' : isRoleInstructor ? 'Eğitmen' : 'Kursiyer'}
            </span>
          </div>
        )}

        {/* Mesaj Gövdesi (WhatsApp / Telegram Balonu) */}
        <div
          onClick={() => {
            if (selectionMode && onToggleSelect && !isDeleted) {
              onToggleSelect(id);
            }
          }}
          className={`relative px-3.5 py-2.5 text-xs transition-all shadow-2xs ${
            selectionMode && !isDeleted ? 'cursor-pointer' : ''
          } ${
            isSelected
              ? 'ring-2 ring-blue-500 ring-offset-2 shadow-md'
              : ''
          } ${
            isDeleted
              ? 'bg-slate-100 text-slate-400 border border-slate-200/80 rounded-2xl italic'
              : isMe
              ? 'bg-blue-600 text-white rounded-2xl rounded-tr-xs'
              : 'bg-white text-slate-800 border border-slate-200/90 rounded-2xl rounded-tl-xs'
          }`}
        >
          {/* Sabitli Mesaj Rozeti */}
          {isPinned && !isDeleted && (
            <div
              className={`flex items-center gap-1 text-[10px] font-bold mb-1.5 pb-1 border-b ${
                isMe
                  ? 'text-amber-200 border-blue-500/60'
                  : 'text-amber-700 border-slate-100'
              }`}
            >
              <Pin className="w-2.5 h-2.5 fill-current" />
              <span>Sabitlenmiş İleti</span>
            </div>
          )}

          {/* Yanıtlanan Mesaj Alıntısı (WhatsApp / Telegram Style Tıklanabilir & Açık Renkli Alıntı) */}
          {replyTo && !isDeleted && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                const targetEl = document.getElementById(`msg-${replyTo.id}`);
                if (targetEl) {
                  targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  targetEl.classList.add('ring-4', 'ring-amber-400', 'ring-offset-2', 'rounded-2xl');
                  setTimeout(() => {
                    targetEl.classList.remove('ring-4', 'ring-amber-400', 'ring-offset-2');
                  }, 1800);
                }
              }}
              title="Yanıtlanan mesaja git ↑"
              className={`mb-2 p-2 rounded-lg text-[11px] border-l-4 transition-all cursor-pointer group/reply select-none ${
                isMe
                  ? 'bg-white/20 hover:bg-white/30 border-white text-white backdrop-blur-xs'
                  : 'bg-blue-50/90 hover:bg-blue-100/90 border-blue-600 text-slate-800'
              }`}
            >
              <div className={`font-bold text-[10px] flex items-center justify-between gap-1.5 ${isMe ? 'text-blue-100' : 'text-blue-700'}`}>
                <span className="flex items-center gap-1">
                  <CornerUpLeft className="w-3 h-3" />
                  <span>{replyTo.senderName}</span>
                </span>
                <span className="text-[9px] font-normal opacity-80 group-hover/reply:underline">
                  Mesaja git ↑
                </span>
              </div>
              <p className={`line-clamp-1 italic text-[11px] mt-0.5 ${isMe ? 'text-white/95' : 'text-slate-700'}`}>
                {replyTo.content}
              </p>
            </div>
          )}

          {/* Başlık (Varsa, örneğin duyuru başlığı) */}
          {title && !isDeleted && (
            <div
              className={`font-bold text-xs mb-1 ${
                isMe ? 'text-blue-100' : 'text-slate-900'
              }`}
            >
              {title}
            </div>
          )}

          {/* İçerik veya Düzenleme Modu */}
          {isDeleted ? (
            <div className="flex items-center gap-1.5 py-0.5">
              <Trash2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Bu mesaj silindi.</span>
              {deletedTimeStr && (
                <span className="text-[10px] not-italic text-slate-400 ml-1">
                  ({deletedTimeStr})
                </span>
              )}
            </div>
          ) : isEditing ? (
            <div className="space-y-2 min-w-[220px]">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={2}
                autoFocus
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2 py-1 text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-2 py-1 text-[10px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded"
                >
                  Kaydet
                </button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed break-words">
              {content}
            </p>
          )}

          {/* Alt Bilgi: Saat, Düzenlendi Etiketi ve Çift Onay İkonu */}
          {!isDeleted && !isEditing && (
            <div
              className={`flex items-center justify-end gap-1 text-[10px] mt-1 select-none ${
                isMe ? 'text-blue-100/90' : 'text-slate-400'
              }`}
            >
              {isEdited && (
                <span className="italic mr-0.5 opacity-90">
                  (düzenlendi{editedTimeStr ? ` ${editedTimeStr}` : ''})
                </span>
              )}
              <span>{timeStr}</span>
              {isMe && <CheckCheck className="w-3.5 h-3.5 stroke-[2.2] ml-0.5 text-blue-200" />}
            </div>
          )}
        </div>

        {/* İfadeler / Emoji Reaksiyonları (WhatsApp / Telegram / Discord Tarzı) */}
        {reactions && Object.keys(reactions).length > 0 && !isDeleted && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(reactions).map(([emoji, userIds]) => {
              if (!userIds || userIds.length === 0) return null;
              const hasReacted = Boolean(currentUserId && userIds.includes(currentUserId));
              const reactorNames = userIds.map((uId) => getUserDisplayName(uId)).join(', ');
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReactionDetailModal({ emoji, userIds });
                  }}
                  title={`${emoji} (${userIds.length} kişi): ${reactorNames}\n(Bırakanları görmek veya kaldırmak için tıklayınız)`}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition cursor-pointer select-none group/reaction relative ${
                    hasReacted
                      ? isMe
                        ? 'bg-blue-500 text-white border-blue-300 ring-1 ring-blue-300 font-bold shadow-xs'
                        : 'bg-blue-100 text-blue-900 border-blue-300 ring-1 ring-blue-300 font-bold shadow-xs'
                      : isMe
                      ? 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="text-[10px] tabular-nums font-semibold">{userIds.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Hover / Dokunma Eylem Menüsü (İfade / Yanıtla / Düzenle / Sil) */}
        {!isDeleted && !isEditing && (onReact || onReply || canEdit || canDelete) && (
          <div
            className={`opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 ${
              isMe ? '-left-28' : '-right-28'
            } flex items-center gap-0.5 bg-white/95 backdrop-blur-xs border border-slate-200 shadow-2xs rounded-lg p-0.5 z-10`}
          >
            {/* Hızlı Emoji Reaksiyon Menüsü (Tıklamalı Popover + Dış Tıklama Kapatma) */}
            {onReact && (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEmojiPicker((prev) => !prev);
                  }}
                  className={`p-1 rounded transition cursor-pointer ${
                    showEmojiPicker
                      ? 'text-amber-600 bg-amber-100'
                      : 'text-slate-500 hover:text-amber-500 hover:bg-amber-50'
                  }`}
                  title="İfade Bırak"
                >
                  <Smile className="w-3 h-3" />
                </button>

                {showEmojiPicker && (
                  <>
                    <div
                      className="fixed inset-0 z-20 cursor-default"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEmojiPicker(false);
                      }}
                    />
                    <div
                      className="flex items-center gap-1.5 absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-full py-1.5 px-2 shadow-xl z-30 animate-in fade-in zoom-in-95"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {QUICK_REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReact(id, emoji);
                            playActionSound();
                            setShowEmojiPicker(false);
                          }}
                          className="hover:scale-135 transition transform p-0.5 text-base cursor-pointer select-none active:scale-95"
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {onReply && (
              <button
                type="button"
                onClick={() => onReply(id, senderName, content)}
                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                title="Yanıtla"
              >
                <CornerUpLeft className="w-3 h-3" />
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setEditText(content);
                  setIsEditing(true);
                }}
                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                title="Mesajı Düzenle"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                title="Mesajı Sil"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sağ Avatar (Giden mesajlar için - şık mini badge) */}
      {isMe && (
        <div
          className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mb-1 shadow-2xs"
          title="Siz"
        >
          {initials || 'SİZ'}
        </div>
      )}

      {/* Toplu Seçim Kutusu (Sağ - Giden Mesajlar İçin) */}
      {selectionMode && !isDeleted && isMe && (
        <div className="shrink-0 mb-3 flex items-center pl-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect?.(id)}
            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
            title="Mesajı seç"
          />
        </div>
      )}

      {/* İFADE DETAY VE KALDIRMA MODALI (Tıklayınca listeyi görür, kendi ismi üzerine tıklayınca kaldırabilir) */}
      {reactionDetailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setReactionDetailModal(null);
          }}
        >
          <div
            className="bg-white rounded-2xl max-w-xs w-full p-4 space-y-3 shadow-2xl border border-slate-200 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{reactionDetailModal.emoji}</span>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    İfade Bırakanlar
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    Toplam {reactionDetailModal.userIds.length} kişi
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReactionDetailModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto divide-y divide-slate-50 text-xs">
              {reactionDetailModal.userIds.map((uId) => {
                const isCurrentUser = currentUserId ? uId === currentUserId : false;
                const displayName = getUserDisplayName(uId);
                const userInitials = displayName
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0].toUpperCase())
                  .join('');

                return (
                  <div
                    key={uId}
                    onClick={() => {
                      if (isCurrentUser && onReact) {
                        onReact(id, reactionDetailModal.emoji);
                        playActionSound();
                        setReactionDetailModal(null);
                      }
                    }}
                    className={`flex items-center justify-between py-2 px-1 rounded-lg transition ${
                      isCurrentUser
                        ? 'cursor-pointer hover:bg-rose-50 group/useritem'
                        : 'hover:bg-slate-50'
                    }`}
                    title={isCurrentUser ? 'İfadenizi kaldırmak için tıklayınız' : displayName}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                        isCurrentUser ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {userInitials}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-800 block truncate">
                          {displayName}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] font-bold text-blue-600">
                            (Siz)
                          </span>
                        )}
                      </div>
                    </div>

                    {isCurrentUser && (
                      <span className="text-[10px] font-semibold text-rose-600 group-hover/useritem:underline shrink-0 flex items-center gap-0.5">
                        <X className="w-3 h-3 text-rose-500" />
                        <span>Kaldır</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Eğer geçerli kullanıcı bu ifadeyi henüz bırakmadıysa: Ekleme butonu */}
            {currentUserId && !reactionDetailModal.userIds.includes(currentUserId) && onReact && (
              <button
                type="button"
                onClick={() => {
                  onReact(id, reactionDetailModal.emoji);
                  playActionSound();
                  setReactionDetailModal(null);
                }}
                className="w-full py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition text-center cursor-pointer border border-blue-200/80"
              >
                + Siz de bu ifadeyi bırakın ({reactionDetailModal.emoji})
              </button>
            )}
          </div>
        </div>
      )}

      {/* ÖZEL UI SİLME ONAY POPUP / MODAL (Tarayıcı confirm uyarısı yerine) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <span>Mesajı Sil</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bu mesajı silmek istediğinizden emin misiniz? Silinen mesajın yerine <em>"Bu mesaj silindi"</em> bildirimi yerleştirilecektir.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAction}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white shadow-2xs transition cursor-pointer"
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
