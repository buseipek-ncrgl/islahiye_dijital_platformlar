import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  FileText,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { Card, CardContent } from '../components/ui/Card';
import { getStoredGroups } from '../services/enrollmentStorage';
import { getStoredSessions } from '../services/sessionStorage';

export const InstructorCalendarPage: React.FC = () => {
  const { currentUser } = useDemoRole();

  // Gruplar ve Oturumlar
  const allGroups = useMemo(() => getStoredGroups(), []);
  const allSessions = useMemo(() => getStoredSessions(), []);

  // Eğitmene atanmış gruplar
  const instructorAssignedGroups = useMemo(() => {
    const matched = allGroups.filter(
      (g) =>
        g.instructorIds?.includes(currentUser.id) ||
        g.instructorNames?.some((n) => n.toLowerCase().includes(currentUser.fullName.toLowerCase()))
    );
    if (matched.length > 0) return matched;
    const defaultMatched = allGroups.filter((g) => g.instructorIds?.includes('user-instructor-01'));
    return defaultMatched.length > 0 ? defaultMatched : allGroups;
  }, [allGroups, currentUser]);

  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  // Filtrelenmiş oturumlar
  const instructorSessions = useMemo(() => {
    const assignedGroupIds = new Set(instructorAssignedGroups.map((g) => g.id));
    return allSessions.filter((s) => {
      if (selectedGroupFilter !== 'all') {
        return s.groupId === selectedGroupFilter;
      }
      return assignedGroupIds.has(s.groupId) || s.instructorId === currentUser.id;
    });
  }, [allSessions, instructorAssignedGroups, selectedGroupFilter, currentUser]);

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

  // Ayın ilk gününün haftanın hangi günü olduğu (0: Pazartesi ... 6: Pazar)
  const firstDayOfWeek = useMemo(() => {
    const day = new Date(currentYear, currentMonth, 1).getDay();
    return day === 0 ? 6 : day - 1;
  }, [currentYear, currentMonth]);

  // Gün bazında oturumları filtreleme
  const getEventsForDay = (day: number) => {
    const dayPad = day.toString().padStart(2, '0');
    const monthPad = (currentMonth + 1).toString().padStart(2, '0');
    const dateQuery = `${currentYear}-${monthPad}-${dayPad}`;

    return instructorSessions.filter((s) => {
      return (
        s.date.includes(`${day} ${monthNames[currentMonth]}`) ||
        s.date === dateQuery ||
        (currentMonth === 9 && (day === 12 || day === 14 || day === 19 || day === 21 || day === 26 || day === 28) && s.sessionNumber === Math.floor(day / 3))
      );
    });
  };

  const selectedDayEvents = useMemo(() => {
    return getEventsForDay(selectedDay);
  }, [selectedDay, currentMonth, currentYear, instructorSessions]);

  // İstatistikler
  const totalMonthSessions = useMemo(() => {
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      count += getEventsForDay(d).length;
    }
    return count;
  }, [daysInMonth, instructorSessions, currentMonth, currentYear]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Üst Başlık & Hızlı Aksiyonlar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Eğitmen Ders ve Oturum Takvimi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Atanmış olduğunuz şubelerin haftalık oturum programı, derslik planı ve yoklama takvimi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/egitmen/dersler"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-2xs whitespace-nowrap"
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>Yoklama Masasını Aç</span>
          </Link>
          <Link
            to="/egitmen/odevler"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <FileText className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Ödev Masası</span>
          </Link>
        </div>
      </div>

      {/* Grup Filtresi ve Özet Metrikler */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-blue-600" /> Şube Filtresi:
          </span>
          <button
            onClick={() => setSelectedGroupFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedGroupFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tüm Şubelerim ({instructorAssignedGroups.length})
          </button>
          {instructorAssignedGroups.map((grp) => (
            <button
              key={grp.id}
              onClick={() => setSelectedGroupFilter(grp.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedGroupFilter === grp.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {grp.name}
            </button>
          ))}
        </div>

        <div className="md:col-span-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Bu Ay Planlanan Dersler
            </span>
            <span className="text-xl font-extrabold text-slate-900 tabular-nums">
              {totalMonthSessions} Oturum
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Ana Takvim Bölümü & Yan Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sol Kolon: Takvim Tablosu (8 Sütun) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Ay Başlığı ve İleri/Geri Kontrol */}
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {monthNames[currentMonth]} {currentYear}
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-600 transition"
                title="Önceki Ay"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setCurrentMonth(9);
                  setCurrentYear(2026);
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition"
              >
                Bugün
              </button>
              <button
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-600 transition"
                title="Sonraki Ay"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Haftanın Günleri Başlığı */}
          <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-bold text-slate-600 bg-slate-50">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cts', 'Paz'].map((d) => (
              <div key={d} className="py-2.5 border-r border-slate-100 last:border-r-0">
                {d}
              </div>
            ))}
          </div>

          {/* Günler Izgarası */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {/* Boşluklar (İlk günden önceki günler) */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-20 sm:h-24 bg-slate-50/40 p-1 text-slate-300" />
            ))}

            {/* Ayın Günleri */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const events = getEventsForDay(day);
              const isSelected = day === selectedDay;
              const hasEvents = events.length > 0;

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`h-20 sm:h-24 p-1.5 transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/70 ring-2 ring-blue-500 ring-inset'
                      : hasEvents
                      ? 'bg-white hover:bg-slate-50'
                      : 'bg-white hover:bg-slate-50/70 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : hasEvents
                          ? 'text-slate-900 bg-slate-100'
                          : 'text-slate-600'
                      }`}
                    >
                      {day}
                    </span>
                    {hasEvents && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    {events.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[10px] truncate px-1 py-0.5 rounded font-medium bg-blue-100/80 text-blue-900 border border-blue-200/50"
                        title={ev.title}
                      >
                        {ev.startTime} • {ev.title}
                      </div>
                    ))}
                    {events.length > 2 && (
                      <span className="text-[9px] text-slate-500 font-bold block truncate">
                        +{events.length - 2} oturum daha
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sağ Kolon: Seçili Günün Oturum Detayları (4 Sütun) */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                    Günün Oturum Programı
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedDay} {monthNames[currentMonth]} {currentYear}
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {selectedDayEvents.length} Ders
                </span>
              </div>

              {selectedDayEvents.length === 0 ? (
                <div className="py-10 text-center text-slate-500 space-y-2">
                  <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">Bu gün için planlı dersiniz bulunmuyor.</p>
                  <p className="text-[11px] text-slate-400">
                    Takvimden ders oturumu olan günleri seçerek ayrıntılı bilgi alabilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {selectedDayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          Oturum #{ev.sessionNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            ev.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ev.status === 'attendance_open' || ev.status === 'active'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {ev.status === 'completed'
                            ? 'Tamamlandı'
                            : ev.status === 'attendance_open'
                            ? 'Yoklama Açık'
                            : 'Planlandı'}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {ev.title}
                      </h4>

                      <div className="space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Saat: <strong>{ev.startTime} - {ev.endTime}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">Konum: <strong>{ev.location}</strong></span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <Link
                          to="/egitmen/dersler"
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                        >
                          <span>Yoklama Masasına Git</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
