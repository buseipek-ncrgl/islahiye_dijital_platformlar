import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Info,
  Award,
  Search,
  Filter,
  Clock,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
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
import { calculateTraineeAttendance } from '../services/attendanceEngine';
import { Session } from '../types';

export const TraineeAttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useDemoRole();

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedSessionModal, setSelectedSessionModal] = useState<Session | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'attended' | 'absent_excused' | 'upcoming'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsub1 = subscribeToSessionUpdates(() => setRefreshTrigger((p) => p + 1));
    const unsub2 = subscribeToAttendanceUpdates(() => setRefreshTrigger((p) => p + 1));
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

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

  const attendanceCalc = useMemo(() => {
    if (!assignedGroup) return null;
    return calculateTraineeAttendance(currentUser.id, assignedGroup.id, {
      enrollmentDate: activeAssignment?.assignedAt,
    });
  }, [currentUser.id, assignedGroup, activeAssignment, refreshTrigger]);

  const traineeAttendanceMap = useMemo(() => {
    const all = getStoredAttendanceRecords();
    const map = new Map<string, string>();
    all
      .filter(
        (r) =>
          r.candidateId === currentUser.id ||
          r.traineeId === currentUser.id ||
          (currentUser.id.includes('trainee') &&
            (r.candidateId?.includes('trainee') || r.traineeId?.includes('trainee')))
      )
      .forEach((r) => map.set(r.sessionId, r.status));
    return map;
  }, [currentUser.id, refreshTrigger]);

  const attendedCount = attendanceCalc?.attendedCount ?? 4;
  const excusedCount = attendanceCalc?.excusedCount ?? 0;
  const absentCount = attendanceCalc?.absentCount ?? 0;
  const safeAbsentCount = absentCount > 0 ? absentCount : 0;

  // En fazla kaç oturum kaçırılabilir? (Toplam oturumun %20'si)
  const maxAbsenceAllowed = Math.floor((groupSessions.length || 6) * 0.2);
  const remainingAbsenceQuota = Math.max(1, maxAbsenceAllowed - safeAbsentCount);

  // Filtrelenmiş oturumlar
  const filteredSessions = useMemo(() => {
    return groupSessions.filter((sess) => {
      const userStatus = traineeAttendanceMap.get(sess.id) || (sess.status === 'completed' ? 'attended' : undefined);
      const isCompleted = sess.status === 'completed';
      if (filterStatus === 'attended' && userStatus !== 'attended') return false;
      if (filterStatus === 'absent_excused' && userStatus !== 'absent' && userStatus !== 'excused') return false;
      if (filterStatus === 'upcoming' && (isCompleted || sess.status === 'cancelled')) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = sess.title.toLowerCase().includes(q);
        const matchesTopic = sess.topic ? sess.topic.toLowerCase().includes(q) : false;
        const matchesNum = sess.sessionNumber.toString().includes(q);
        if (!matchesTitle && !matchesTopic && !matchesNum) return false;
      }
      return true;
    });
  }, [groupSessions, filterStatus, searchQuery, traineeAttendanceMap]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Üst Başlık & Hızlı Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Devam Durumu & Oturum Takip Kütüğü
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {assignedGroup
              ? `${assignedGroup.programTitle} — ${assignedGroup.name} resmî devam kayıtları ve baraj uygunluğu.`
              : 'Eğitim grubu devam durumu.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/kursiyer/takvim')}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Ders Takvimi</span>
          </button>
          <button
            onClick={() => navigate('/kursiyer/belgeler')}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <Award className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Belgelerim & Kütük →</span>
          </button>
        </div>
      </div>

      {/* 4 Özet Gösterge Kartı (KpiStrip Standardı) */}
      <KpiStrip
        columns={4}
        items={[
          {
            label: 'Genel Devam Oranı',
            value: `%${attendanceCalc?.attendanceRate ?? 100}`,
            subtext: 'Resmî baraj: en az %80',
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
            badge: (
              <StatusBadge
                label={attendanceCalc?.hasPassedThreshold !== false ? 'Baraj Sağlandı' : 'Risk'}
                variant={attendanceCalc?.hasPassedThreshold !== false ? 'success' : 'danger'}
                size="sm"
              />
            ),
          },
          {
            label: 'Katılınan Oturumlar',
            value: `${attendedCount} Oturum`,
            subtext: 'Eğitmen onaylı tam katılım',
            icon: <UserCheck className="w-3.5 h-3.5 text-blue-600" />,
          },
          {
            label: 'Mazeretli / Devamsız',
            value: `${excusedCount} Mazeret • ${safeAbsentCount} Devamsız`,
            subtext: 'Mazeretli oturumlar eklenir',
            icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
          },
          {
            label: 'Kalan Devamsızlık Hakkı',
            value: `${remainingAbsenceQuota} Oturum`,
            subtext: 'Barajı aşmadan kalan pay',
            icon: <AlertCircle className="w-3.5 h-3.5 text-slate-500" />,
          },
        ]}
      />

      {/* Oturum & Yoklama Tablosu (IBM Carbon / Style Guide Section 8) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Tüm Ders Oturumları ve Yoklama Kayıtları ({filteredSessions.length} / {groupSessions.length} Oturum)
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Yoklamalar her ders oturumu başlangıcında eğitmen tarafından manuel olarak sisteme işlenmektedir.
            </p>
          </div>
          <span className="text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 rounded-full shrink-0">
            Resmî Devam Barajı: %80
          </span>
        </div>

        {/* Filtre ve Arama Barı */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-600 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Filtrele:
            </span>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Tümü ({groupSessions.length})
            </button>
            <button
              onClick={() => setFilterStatus('attended')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'attended'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              Katıldıklarım ({attendedCount})
            </button>
            <button
              onClick={() => setFilterStatus('absent_excused')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'absent_excused'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              Mazeret & Devamsız ({excusedCount + safeAbsentCount})
            </button>
            <button
              onClick={() => setFilterStatus('upcoming')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                filterStatus === 'upcoming'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
              }`}
            >
              Gelecek Dersler
            </button>
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Oturum veya konu ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="p-10 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            {searchQuery || filterStatus !== 'all' ? 'Arama kriterine uygun oturum bulunamadı.' : 'Henüz oturum tanımlanmamış.'}
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Oturum</th>
                  <th className="py-3 px-4">Ders Başlığı & İçerik</th>
                  <th className="py-3 px-4">Tarih & Saat</th>
                  <th className="py-3 px-4">Yer & Sorumlu Eğitmen</th>
                  <th className="py-3 px-4 text-center">Yoklama Durumu</th>
                  <th className="py-3 px-4 text-right">İşlem</th>
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
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        Oturum {sess.sessionNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{sess.title}</div>
                        {sess.topic && (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {sess.topic}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{sess.date}</div>
                        <div className="text-xs text-slate-500">
                          {sess.startTime} - {sess.endTime}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{sess.location}</div>
                        <div className="text-xs text-slate-500">{sess.instructorName}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isCancelled ? (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            İptal Edildi (Muaf)
                          </span>
                        ) : isCompleted ? (
                          userStatus === 'attended' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Katıldı
                            </span>
                          ) : userStatus === 'excused' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              Mazeretli
                            </span>
                          ) : userStatus === 'absent' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                              Katılmadı
                            </span>
                          ) : (
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                              Kayıt Yok
                            </span>
                          )
                        ) : isOpen ? (
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                            Yoklama Alınıyor
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            Gelecek Oturum
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedSessionModal(sess)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                        >
                          Notlar →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Devam Esasları Bilgilendirme Kartı */}
      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs leading-relaxed flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-slate-900 block text-sm">Resmî Devam Esasları & Başarı Koşulu:</strong>
          <p>
            İslahiye Ticaret Odası eğitim mevzuatı gereği, kursiyerlerin dönem sonu başarı belgesine hak kazanabilmesi için toplam oturumların en az <strong>%80</strong>'ine bizzat katılım sağlaması zorunludur.
            Resmî mazeret belgeleri (sağlık raporu, resmi izin vb.) eğitmen veya oda yönetimi onayından sonra mazeretli statüsüne geçirilir ve devam payına dahil edilir.
          </p>
        </div>
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
                <span className="text-slate-500 block">Derslik:</span>
                <span className="font-bold text-slate-900">{selectedSessionModal.location}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Eğitmen:</span>
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
              <h4 className="font-bold text-slate-900">İşlenen Ders Konusu:</h4>
              <p className="text-slate-600 text-xs leading-relaxed">
                {selectedSessionModal.topic || 'Bu oturuma ait ders notu bulunmamaktadır.'}
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
