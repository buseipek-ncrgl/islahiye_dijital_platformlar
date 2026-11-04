import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  EyeOff,
  Search,
  AlertCircle,
  RefreshCw,
  Clock,
  FileText,
  Calendar,
  CheckSquare,
  MessageSquare,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import {
  AppNotification,
  NotificationCategory,
  NotificationEvent,
} from '../types';
import {
  getNotificationsForUser,
  getUnreadNotificationCountForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dismissNotification,
  getStoredNotificationEvents,
  retryFailedNotificationEvent,
  subscribeToNotificationUpdates,
} from '../services/notificationStorage';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { KpiStrip } from '../components/ui/KpiStrip';

type FilterTab = 'all' | 'unread' | 'application' | 'classes' | 'communication' | 'certificate';

export const NotificationCenterPage: React.FC = () => {
  const { currentUser, currentRole } = useDemoRole();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [failedEvents, setFailedEvents] = useState<NotificationEvent[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = () => {
    if (!currentUser?.id) return;
    const userNotifs = getNotificationsForUser(currentUser.id);
    const unread = getUnreadNotificationCountForUser(currentUser.id);
    setNotifications(userNotifs);
    setUnreadCount(unread);

    // Başarısız olayları denetle (Yalnızca demo denetimi ve testi için)
    const allEvents = getStoredNotificationEvents();
    const userFailed = allEvents.filter(
      (e) => e.recipientId === currentUser.id && e.status === 'failed'
    );
    setFailedEvents(userFailed);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToNotificationUpdates(loadData);
    return () => unsubscribe();
  }, [currentUser?.id, currentRole]);

  // Tab ve arama filtresi
  const filteredNotifications = notifications.filter((notif) => {
    // Tab filtresi
    if (activeTab === 'unread' && notif.status !== 'unread') return false;
    if (activeTab === 'application' && notif.category !== 'application') return false;
    if (activeTab === 'classes' && !['session', 'assignment'].includes(notif.category)) return false;
    if (activeTab === 'communication' && !['communication', 'announcement'].includes(notif.category)) return false;
    if (activeTab === 'certificate' && notif.category !== 'certificate') return false;

    // Metin araması
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = notif.title.toLowerCase().includes(q);
      const matchDesc = notif.description.toLowerCase().includes(q);
      return matchTitle || matchDesc;
    }

    return true;
  });

  const handleMarkAsRead = (notificationId: string) => {
    const res = markNotificationAsRead(notificationId, currentUser.id);
    if (res.success) {
      loadData();
    }
  };

  const handleMarkAllAsRead = () => {
    const res = markAllNotificationsAsRead(currentUser.id);
    if (res.success) {
      loadData();
      showNotificationFeedback(`${res.updatedCount} bildirim okundu olarak işaretlendi.`);
    }
  };

  const handleDismiss = (notificationId: string) => {
    const res = dismissNotification(notificationId, currentUser.id);
    if (res.success) {
      loadData();
      showNotificationFeedback('Bildirim gizlendi (Asıl başvuru/ödev kaydınız korunmaktadır).');
    }
  };

  const handleRetryFailedEvent = (eventId: string) => {
    const res = retryFailedNotificationEvent(eventId);
    if (res.success) {
      loadData();
      showNotificationFeedback('Başarısız bildirim olayı yeniden denendi ve başarıyla oluşturuldu.');
    }
  };

  const showNotificationFeedback = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'application':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'session':
        return <Calendar className="w-4 h-4 text-indigo-600" />;
      case 'assignment':
        return <CheckSquare className="w-4 h-4 text-emerald-600" />;
      case 'communication':
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case 'announcement':
        return <Bell className="w-4 h-4 text-amber-600" />;
      case 'certificate':
        return <Award className="w-4 h-4 text-amber-700" />;
      default:
        return <Layers className="w-4 h-4 text-slate-600" />;
    }
  };

  const getCategoryLabel = (category: NotificationCategory) => {
    switch (category) {
      case 'application':
        return 'Başvuru & Kayıt';
      case 'session':
        return 'Ders & Oturum';
      case 'assignment':
        return 'Ödev Süreci';
      case 'communication':
        return 'Özel Mesaj';
      case 'announcement':
        return 'Grup Duyurusu';
      case 'certificate':
        return 'Başarı & Belge';
      default:
        return 'Sistem';
    }
  };

  const formatNotificationTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const appNotifsCount = notifications.filter((n) => n.category === 'application').length;
  const classNotifsCount = notifications.filter((n) => ['session', 'assignment'].includes(n.category)).length;
  const otherNotifsCount = notifications.filter((n) => ['certificate', 'communication', 'announcement'].includes(n.category)).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header & Context */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Bildirim Merkezi</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Aktif Profil: <strong className="text-slate-800 font-semibold">{currentUser.fullName}</strong> ({currentUser.title || currentRole})
            — Kimliğinize tanımlanmış resmî sistem bildirimleri.
          </p>
        </div>

        {/* Global Action */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
            >
              <CheckCheck className="w-4 h-4 shrink-0" />
              <span>Tümünü Okundu Yap</span>
            </button>
          )}
          <button
            onClick={loadData}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* 4 TOP KPI STRIP (Stripe / Canvas LMS Standart Metrik Bandı) */}
      <KpiStrip
        items={[
          {
            label: 'Okunmamış Bildirim',
            value: unreadCount,
            icon: <Bell className="w-4 h-4" />,
            subtext: 'İşlem veya inceleme bekliyor',
            badge: unreadCount > 0 ? (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200">
                Yeni
              </span>
            ) : undefined,
          },
          {
            label: 'Başvuru & Kayıt',
            value: appNotifsCount,
            icon: <FileText className="w-4 h-4" />,
            subtext: 'Ön değerlendirme & kabul',
          },
          {
            label: 'Akademik & Ders',
            value: classNotifsCount,
            icon: <Calendar className="w-4 h-4" />,
            subtext: 'Oturum, ödev & revizyon',
          },
          {
            label: 'Belge & İletişim',
            value: otherNotifsCount,
            icon: <Award className="w-4 h-4" />,
            subtext: 'Karekod, duyuru & mesaj',
          },
        ]}
      />

      {/* Action Toast Feedback */}
      {actionMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Failed Events Simulation Alert */}
      {failedEvents.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Bekleyen Bildirim Olayı Tespit Edildi (Kuyruk Kontrolü)</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Asıl işlem başarıyla kaydedilmiş ancak bildirim dağıtım kuyruğunda gecikme oluşmuştur.
            Aşağıdaki butona basarak bildirimi kontrollü olarak yeniden tetikleyebilirsiniz:
          </p>
          <div className="pt-1 flex flex-wrap gap-2">
            {failedEvents.map((fe) => (
              <button
                key={fe.id}
                onClick={() => handleRetryFailedEvent(fe.id)}
                className="h-9 px-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Yeniden Tetikle: {fe.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tümü ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'unread'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Okunmamış</span>
            {unreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('application')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'application'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Başvuru & Kayıt
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'classes'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ders & Ödev
          </button>
          <button
            onClick={() => setActiveTab('communication')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'communication'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Mesajlar & Kanallar
          </button>
          <button
            onClick={() => setActiveTab('certificate')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'certificate'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Başarı & Belgeler
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Bildirimlerde ara..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="border-dashed border-slate-300">
            <CardContent className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">Bildirim Bulunamadı</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery || activeTab !== 'all'
                    ? 'Seçtiğiniz filtreye uygun bildirim bulunmuyor. Filtreleri temizleyebilirsiniz.'
                    : 'Henüz yeni bir bildiriminiz bulunmuyor. Süreçlerde bir gelişme olduğunda burada listelenecektir.'}
                </p>
              </div>
              {(searchQuery || activeTab !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveTab('all');
                    setSearchQuery('');
                  }}
                >
                  Filtreleri Temizle
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notif) => {
            const isUnread = notif.status === 'unread';

            return (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border transition-all ${
                  isUnread
                    ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-500/10'
                    : 'bg-slate-50/70 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Category Icon + Content */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isUnread ? 'bg-blue-50 border border-blue-200' : 'bg-slate-200/60'
                      }`}
                    >
                      {getCategoryIcon(notif.category)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {getCategoryLabel(notif.category)}
                        </span>
                        {isUnread && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            Yeni
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatNotificationTime(notif.createdAt)}
                        </span>
                      </div>

                      <h4 className={`text-sm ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {notif.title}
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                        {notif.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Mark as Read / Read Status */}
                    {isUnread ? (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition"
                        title="Okundu Olarak İşaretle"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="p-1.5 text-slate-300" title="Okundu">
                        <CheckCheck className="w-4 h-4" />
                      </span>
                    )}

                    {/* Target Route Navigation Button */}
                    {notif.targetRoute && (
                      <button
                        onClick={() => navigate(notif.targetRoute)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-semibold transition"
                        title="İlgili Sayfaya Git"
                      >
                        <span>İncele</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {/* Dismiss Button */}
                    <button
                      onClick={() => handleDismiss(notif.id)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Bildirimi Gizle (Kayıt silinmez)"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
