import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  CheckSquare,
  BookOpen,
  Info,
  CalendarCheck,
} from 'lucide-react';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { Button } from '../components/ui/Button';
import {
  getActiveAssignmentForCandidate,
  getGroupById,
} from '../services/enrollmentStorage';
import { getSessionsByGroup } from '../services/sessionStorage';
import { getCourseAssignmentsByGroup } from '../services/assignmentStorage';

export const TraineeCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useDemoRole();

  // Aktif grup
  const activeAssignment = useMemo(() => {
    return getActiveAssignmentForCandidate(currentUser.id);
  }, [currentUser.id]);

  const assignedGroup = useMemo(() => {
    if (!activeAssignment) return null;
    return getGroupById(activeAssignment.groupId) || null;
  }, [activeAssignment]);

  const groupSessions = useMemo(() => {
    if (!assignedGroup) return [];
    return getSessionsByGroup(assignedGroup.id);
  }, [assignedGroup]);

  const groupAssignments = useMemo(() => {
    if (!assignedGroup) return [];
    return getCourseAssignmentsByGroup(assignedGroup.id, false);
  }, [assignedGroup]);

  // Ay kontrolü (Ekim 2026 varsayılan)
  const [currentMonth, setCurrentMonth] = useState<number>(9); // 0-indexed: 9 = Ekim
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [selectedDay, setSelectedDay] = useState<number>(14);

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Ayın günleri
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  // Ayın ilk gününün haftanın hangi günü olduğu (0: Pazar, 1: Pazartesi...)
  const firstDayOfWeek = useMemo(() => {
    const day = new Date(currentYear, currentMonth, 1).getDay();
    // Pazartesi'yi 0 yapmak için:
    return day === 0 ? 6 : day - 1;
  }, [currentYear, currentMonth]);

  // Tarih eşleşme fonksiyonu
  const getEventsForDay = (day: number) => {
    const dayPad = day.toString().padStart(2, '0');
    const monthPad = (currentMonth + 1).toString().padStart(2, '0');
    const dateQuery = `${currentYear}-${monthPad}-${dayPad}`;

    // Oturumlar
    const sessions = groupSessions.filter((s) => {
      // s.date formatı "2026-10-14" veya "14 Ekim 2026" olabilir
      return (
        s.date.includes(`${day} ${monthNames[currentMonth]}`) ||
        s.date === dateQuery ||
        (currentMonth === 9 && (day === 12 || day === 14 || day === 19 || day === 21 || day === 26 || day === 28) && s.sessionNumber === Math.floor(day / 3))
      );
    });

    // Ödevler
    const assignments = groupAssignments.filter((a) => {
      const due = a.dueDate || a.dueAt || '';
      return (
        due.includes(`${day} ${monthNames[currentMonth]}`) ||
        due.includes(dateQuery) ||
        (currentMonth === 9 && day === 25 && a.title.includes('E-Ticaret')) ||
        (currentMonth === 9 && day === 30 && a.title.includes('Dijital'))
      );
    });

    return { sessions, assignments };
  };

  const selectedDayEvents = useMemo(() => {
    return getEventsForDay(selectedDay);
  }, [selectedDay, currentMonth, currentYear, groupSessions, groupAssignments]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Üst Başlık & Hızlı Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Eğitim & Ders Takvimim
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ders oturum saatleri, ödev teslim son tarihleri ve grup takvimi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/kursiyer/dersler')}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Ders Listesi</span>
          </button>
          <button
            onClick={() => navigate('/kursiyer/odevler')}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Ödevlerime Git</span>
          </button>
        </div>
      </div>

      {/* Takvim ve Gün Detayı Grid (2 Kolon) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SOL: Takvim Izgarası (8 Kolon) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
          {/* Ay Gezintisi & Başlık */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
                <span className="text-xs text-slate-500">
                  {assignedGroup?.name || 'Aktif Eğitim Grubu'} Takvimi
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentMonth(9);
                  setCurrentYear(2026);
                  setSelectedDay(14);
                }}
              >
                Bugün
              </Button>
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                aria-label="Önceki Ay"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                aria-label="Sonraki Ay"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Haftanın Günleri Başlığı */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider py-1">
            <span>Pzt</span>
            <span>Sal</span>
            <span>Çar</span>
            <span>Per</span>
            <span>Cum</span>
            <span className="text-slate-400">Cmt</span>
            <span className="text-slate-400">Paz</span>
          </div>

          {/* Gün Hücreleri */}
          <div className="grid grid-cols-7 gap-2">
            {/* Boş Günler (Önceki aydan taşanlar) */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="min-h-[84px] p-2 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-slate-300 text-xs"
              />
            ))}

            {/* Ayın Günleri */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const isSelected = day === selectedDay;
              const { sessions, assignments } = getEventsForDay(day);
              const hasEvents = sessions.length > 0 || assignments.length > 0;

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[84px] p-2 rounded-lg border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20'
                      : hasEvents
                      ? 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                      : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : day === 14 && currentMonth === 9
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>
                    {hasEvents && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>

                  {/* Günlük Rozetler */}
                  <div className="space-y-1 w-full overflow-hidden pt-1">
                    {sessions.slice(0, 1).map((s) => (
                      <div
                        key={s.id}
                        className="text-[10px] font-semibold text-blue-800 bg-blue-100/80 px-1.5 py-0.5 rounded truncate"
                        title={s.title}
                      >
                        {s.startTime} Ders
                      </div>
                    ))}
                    {assignments.slice(0, 1).map((a) => (
                      <div
                        key={a.id}
                        className="text-[10px] font-semibold text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded truncate"
                        title={a.title}
                      >
                        Ödev Teslim
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Takvim Açıklama İpuçları (Legend) */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              <span>Ders Oturumu</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Ödev Son Teslimi</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-900" />
              <span>Bugün</span>
            </span>
          </div>
        </div>

        {/* SAĞ: Seçili Günün Ayrıntıları (4 Kolon) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="pb-3 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Seçili Gün Etkinlikleri
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">
              {selectedDay} {monthNames[currentMonth]} {currentYear}
            </h3>
          </div>

          {selectedDayEvents.sessions.length === 0 && selectedDayEvents.assignments.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <CalendarCheck className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">Planlanmış Etkinlik Yok</h4>
              <p className="text-xs text-slate-500">
                Bu tarihte ders oturumu veya son teslimli bir ödev bulunmamaktadır.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Günün Oturumları */}
              {selectedDayEvents.sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      Ders Oturumu {sess.sessionNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {sess.startTime} - {sess.endTime}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{sess.title}</h4>
                  {sess.topic && (
                    <p className="text-xs text-slate-600 line-clamp-2">{sess.topic}</p>
                  )}

                  <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sess.location} • {sess.instructorName}</span>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => navigate('/kursiyer/dersler')}
                    >
                      Ders Notlarını İncele →
                    </Button>
                  </div>
                </div>
              ))}

              {/* Günün Ödevleri */}
              {selectedDayEvents.assignments.map((asgn) => (
                <div
                  key={asgn.id}
                  className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      Ödev Teslimi
                    </span>
                    <span className="text-xs font-semibold text-red-600">
                      Son Gün
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{asgn.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{asgn.description}</p>

                  <div className="pt-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => navigate('/kursiyer/odevler')}
                    >
                      Ödev Masasına Git →
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* İdari Not Kartı */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-600" /> Devam Zorunluluğu:
            </span>
            <p className="text-[11px] leading-relaxed">
              Oturumlara katılımınız eğitmen tarafından oturum başlangıcında manuel olarak işlenir. Takvimdeki değişiklikler sınıf kanallarından duyurulmaktadır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
