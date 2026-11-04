import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  User,
  Filter,
  FileText,
  FileDown,
  Download,
  Search,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { Button } from '../components/ui/Button';
import { KpiStrip } from '../components/ui/KpiStrip';
import { Modal } from '../components/ui/Modal';
import {
  getActiveAssignmentForCandidate,
  getGroupById,
  getStoredGroups,
} from '../services/enrollmentStorage';
import {
  getSessionsByGroup,
  getStoredAttendanceRecords,
  subscribeToSessionUpdates,
  subscribeToAttendanceUpdates,
} from '../services/sessionStorage';
import { Session } from '../types';

export const TraineeCoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useDemoRole();

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedSessionModal, setSelectedSessionModal] = useState<Session | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'upcoming'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  useEffect(() => {
    const unsub1 = subscribeToSessionUpdates(() => setRefreshTrigger((p) => p + 1));
    const unsub2 = subscribeToAttendanceUpdates(() => setRefreshTrigger((p) => p + 1));
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  // Aktif kayıt
  const activeAssignment = useMemo(() => {
    return getActiveAssignmentForCandidate(currentUser.id);
  }, [currentUser.id, refreshTrigger]);

  const assignedGroup = useMemo(() => {
    if (activeAssignment) {
      const g = getGroupById(activeAssignment.groupId);
      if (g) return g;
    }
    const allGroups = getStoredGroups();
    return allGroups[0] || null;
  }, [activeAssignment, refreshTrigger]);

  const groupSessions = useMemo(() => {
    if (!assignedGroup) return [];
    return getSessionsByGroup(assignedGroup.id);
  }, [assignedGroup, refreshTrigger]);

  const traineeAttendanceMap = useMemo(() => {
    const all = getStoredAttendanceRecords();
    const map = new Map<string, string>();
    all
      .filter(
        (r) =>
          r.candidateId === currentUser.id ||
          r.traineeId === currentUser.id ||
          (currentUser.id.includes('trainee') &&
            (r.candidateId?.includes('trainee') || r.traineeId?.includes('trainee') || r.enrollmentId?.includes('trainee')))
      )
      .forEach((r) => map.set(r.sessionId, r.status));
    return map;
  }, [currentUser.id, refreshTrigger]);

  // Filtrelenmiş oturumlar
  const filteredSessions = useMemo(() => {
    return groupSessions.filter((sess) => {
      if (filterStatus === 'completed' && sess.status !== 'completed') return false;
      if (filterStatus === 'upcoming' && (sess.status === 'completed' || sess.status === 'cancelled')) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = sess.title.toLowerCase().includes(q);
        const matchesTopic = sess.topic ? sess.topic.toLowerCase().includes(q) : false;
        const matchesNum = sess.sessionNumber.toString().includes(q);
        if (!matchesTitle && !matchesTopic && !matchesNum) return false;
      }
      return true;
    });
  }, [groupSessions, filterStatus, searchQuery]);

  const completedCount = groupSessions.filter((s) => s.status === 'completed').length;
  const remainingCount = groupSessions.filter((s) => s.status !== 'completed' && s.status !== 'cancelled').length;
  const completedProgressRate = groupSessions.length > 0 ? Math.round((completedCount / groupSessions.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Üst Başlık & Hızlı Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Derslerim & Müfredat Akışı
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {assignedGroup
              ? `${assignedGroup.programTitle} — ${assignedGroup.name} müfredatı ve oturum içerikleri.`
              : 'Kayıtlı olduğunuz eğitim programı oturumları.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/kursiyer/takvim')}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Takvimi Aç</span>
          </button>
          <button
            onClick={() => navigate('/kursiyer/devam')}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Devam Durumumu Gör</span>
          </button>
        </div>
      </div>

      {/* İndirme Geri Bildirim Bildirimi */}
      {downloadToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-fadeIn shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Özet Durum Kartları (KpiStrip Standardı) */}
      <KpiStrip
        columns={3}
        items={[
          {
            label: 'Toplam Oturum Sayısı',
            value: `${groupSessions.length} Oturum`,
            subtext: 'Müfredatta planlanan ders programı',
            icon: <BookOpen className="w-3.5 h-3.5 text-slate-500" />,
          },
          {
            label: 'Tamamlanan Dersler',
            value: `${completedCount} / ${groupSessions.length} Oturum`,
            subtext: `%${completedProgressRate} İlerleme`,
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
          },
          {
            label: 'Kalan Dersler',
            value: `${remainingCount} Oturum`,
            subtext: 'Gelecek haftalarda işlenecek',
            icon: <Clock className="w-3.5 h-3.5 text-blue-600" />,
          },
        ]}
      />

      {/* Oturum Filtre & Arama & Görünüm Değiştirici */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">Filtrele:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tümü ({groupSessions.length})
            </button>
            <button
              onClick={() => setFilterStatus('upcoming')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'upcoming'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Gelecek Oturumlar ({remainingCount})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'completed'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tamamlananlar ({completedCount})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Oturum veya konu ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-medium transition ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Kart Görünümü"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-medium transition ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Liste Görünümü"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Oturum Kartları / Tablo Listesi */}
      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Seçili Kriterde Oturum Bulunamadı</h3>
            <p className="text-xs text-slate-500">
              {searchQuery ? 'Arama kriterlerine uygun oturum yok. Filtreleri temizleyebilirsiniz.' : 'Filtreleri sıfırlayarak tüm oturumları görebilirsiniz.'}
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          filteredSessions.map((sess) => {
            const userStatus = traineeAttendanceMap.get(sess.id);
            const isCompleted = sess.status === 'completed';
            const isOpen = sess.status === 'attendance_open' || sess.status === 'active';
            const isCancelled = sess.status === 'cancelled';

            return (
              <div
                key={sess.id}
                className="p-6 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-xs space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                        Oturum {sess.sessionNumber}
                      </span>

                      {isCancelled ? (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          İptal Edildi (Muaf)
                        </span>
                      ) : isCompleted ? (
                        userStatus === 'attended' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Katıldınız
                          </span>
                        ) : userStatus === 'excused' ? (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            Mazeretli
                          </span>
                        ) : userStatus === 'absent' ? (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                            Katılmadınız
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            Tamamlandı
                          </span>
                        )
                      ) : isOpen ? (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                          Yoklama Alınıyor
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          Gelecek Oturum
                        </span>
                      )}

                      <span className="text-xs text-slate-500 ml-auto sm:ml-0 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <strong className="text-slate-800">{sess.date}</strong>
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900">{sess.title}</h2>
                    {sess.topic && (
                      <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                        {sess.topic}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sess.startTime} - {sess.endTime}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sess.location}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Eğitmen: <strong className="text-slate-800">{sess.instructorName}</strong></span>
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 pt-2 lg:pt-0">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => setSelectedSessionModal(sess)}
                    >
                      Oturum Notları & Materyaller →
                    </Button>
                  </div>
                </div>

                {/* Oturum Kaynakları & Materyalleri Çubuğu */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      Ders Materyalleri:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDownloadToast(`Oturum ${sess.sessionNumber} Ders Sunumu (Hafta_${sess.sessionNumber}_Ders_Notu.pdf) açılıyor.`);
                        setTimeout(() => setDownloadToast(null), 3500);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer"
                      title="Ders Sunumu PDF"
                    >
                      <FileDown className="w-3.5 h-3.5 text-rose-600" />
                      <span>Hafta_{sess.sessionNumber}_Ders_Notu.pdf</span>
                      <span className="text-[10px] text-slate-400 font-mono">(2.4 MB)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDownloadToast(`Oturum ${sess.sessionNumber} Uygulama Dosyaları (Uygulama_Dosyalari.zip) indiriliyor.`);
                        setTimeout(() => setDownloadToast(null), 3500);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer"
                      title="Örnek Kaynak Kod ve Çalışma Dosyaları"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600" />
                      <span>Uygulama_Dosyalari.zip</span>
                      <span className="text-[10px] text-slate-400 font-mono">(4.8 MB)</span>
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 italic">
                    Ders saatinden 24 saat önce güncellenir.
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-center">No</th>
                  <th className="py-3 px-4">Oturum Başlığı & Konu</th>
                  <th className="py-3 px-3">Tarih & Saat</th>
                  <th className="py-3 px-3">Mekan & Eğitmen</th>
                  <th className="py-3 px-3 text-center">Devam Durumunuz</th>
                  <th className="py-3 px-3 text-right">Eylemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.map((sess) => {
                  const userStatus = traineeAttendanceMap.get(sess.id);
                  const isCompleted = sess.status === 'completed';
                  const isOpen = sess.status === 'attendance_open' || sess.status === 'active';
                  const isCancelled = sess.status === 'cancelled';

                  return (
                    <tr key={sess.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-center font-mono font-bold text-blue-700">
                        #{sess.sessionNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{sess.title}</div>
                        {sess.topic && <div className="text-[11px] text-slate-500 line-clamp-1">{sess.topic}</div>}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        <div>{sess.date}</div>
                        <div className="text-slate-400">{sess.startTime} - {sess.endTime}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        <div>{sess.location}</div>
                        <div className="text-[10px] text-slate-400">{sess.instructorName}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isCancelled ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                            İptal
                          </span>
                        ) : isCompleted ? (
                          userStatus === 'attended' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Katıldınız ✓
                            </span>
                          ) : userStatus === 'excused' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              Mazeretli
                            </span>
                          ) : userStatus === 'absent' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                              Katılmadınız ✗
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] text-slate-500">Tamamlandı</span>
                          )
                        ) : isOpen ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                            Yoklama Açık
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] text-slate-400">Gelecek</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSessionModal(sess)}
                          className="text-xs"
                        >
                          Materyaller
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Oturum Notları Modalı */}
      {selectedSessionModal && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedSessionModal(null)}
          title={`Oturum ${selectedSessionModal.sessionNumber}: ${selectedSessionModal.title}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Tarih & Saat:</span>
                <span className="font-bold text-slate-900">
                  {selectedSessionModal.date} ({selectedSessionModal.startTime} - {selectedSessionModal.endTime})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Derslik / Yer:</span>
                <span className="font-bold text-slate-900">{selectedSessionModal.location}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Sorumlu Eğitmen:</span>
                <span className="font-bold text-slate-900">{selectedSessionModal.instructorName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Yoklama Statüsü:</span>
                <span className="font-bold text-blue-700 capitalize">
                  {selectedSessionModal.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-900">Ders Konusu & Hedefleri:</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                {selectedSessionModal.topic ||
                  'Bu oturumda teorik anlatım ve pratik laboratuvar uygulamaları yürütülecektir.'}
              </p>
            </div>

            {/* İndirilebilir Kaynaklar */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                İndirilebilir Kaynaklar & Sunum Dosyaları:
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <FileDown className="w-4 h-4 text-rose-600" />
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        Hafta_{selectedSessionModal.sessionNumber}_Ders_Sunumu.pdf
                      </span>
                      <span className="text-[10px] text-slate-400">PDF Dokümanı • 2.4 MB</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDownloadToast('Ders PDF dokümanı indiriliyor...');
                      setTimeout(() => setDownloadToast(null), 3500);
                    }}
                    className="text-xs text-blue-600 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>İndir</span>
                    <Download className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        Uygulama_Vaka_Verileri.zip
                      </span>
                      <span className="text-[10px] text-slate-400">Arşiv Dosyası • 4.8 MB</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDownloadToast('Uygulama vaka verileri arşivi indiriliyor...');
                      setTimeout(() => setDownloadToast(null), 3500);
                    }}
                    className="text-xs text-blue-600 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>İndir</span>
                    <Download className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
              <span className="font-bold block">Önemli Katılım Notu:</span>
              <p className="text-blue-800 leading-relaxed">
                Yoklama kayıtları ders başlangıcında eğitmen tarafından manuel olarak alınmaktadır. Oturum süresince aktif katılım ve uygulama ödevlerinin takibi zorunludur.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setSelectedSessionModal(null)}
              >
                Kapat
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
