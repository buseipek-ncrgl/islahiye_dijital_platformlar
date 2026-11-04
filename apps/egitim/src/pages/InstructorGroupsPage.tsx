import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  Users,
  CheckSquare,
  Award,
} from 'lucide-react';
import { Group } from '../types';
import { Button } from '../components/ui/Button';
import { KpiStrip } from '../components/ui/KpiStrip';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { getStoredGroups, getGroupCapacityStats } from '../services/enrollmentStorage';
import { calculateGroupAttendanceSummary } from '../services/attendanceEngine';
import { getSessionsByGroup } from '../services/sessionStorage';

export const InstructorGroupsPage: React.FC = () => {
  const { currentUser } = useDemoRole();
  const navigate = useNavigate();

  const [allGroups, setAllGroups] = useState<Group[]>([]);

  useEffect(() => {
    setAllGroups(getStoredGroups());
  }, []);

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

  // Genel İstatistikler
  const totalAssignedStudents = useMemo(() => {
    return instructorAssignedGroups.reduce((acc, g) => acc + (getGroupCapacityStats(g.id).assignedCount || 0), 0);
  }, [instructorAssignedGroups]);

  const overallAverageAttendance = useMemo(() => {
    const rates: number[] = [];
    instructorAssignedGroups.forEach((g) => {
      const summary = calculateGroupAttendanceSummary(g.id);
      if (summary.averageAttendanceRate !== null) {
        rates.push(summary.averageAttendanceRate);
      }
    });
    if (rates.length === 0) return 85;
    return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
  }, [instructorAssignedGroups]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Üst Başlık & Hızlı Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Eğitmen Atanmış Eğitim Gruplarım
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            İslahiye Ticaret Odası bünyesinde ders verdiğiniz aktif eğitim sınıfları, kontenjan ve katılım durumları.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/egitmen/dersler"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Yoklama Masası</span>
          </Link>
          <Link
            to="/egitmen/odevler"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Ödev Masası</span>
          </Link>
        </div>
      </div>

      {/* 4 Özet Metrik Bandı (KpiStrip Standardı) */}
      <KpiStrip
        columns={4}
        items={[
          {
            label: 'Atanmış Gruplar',
            value: `${instructorAssignedGroups.length} Sınıf`,
            subtext: 'Aktif derslik',
            icon: <Calendar className="w-3.5 h-3.5 text-blue-600" />,
          },
          {
            label: 'Toplam Kursiyer',
            value: `${totalAssignedStudents} Kursiyer`,
            subtext: 'Kayıtlı öğrenci',
            icon: <Users className="w-3.5 h-3.5 text-purple-600" />,
          },
          {
            label: 'Ortalama Katılım Oranı',
            value: `%${overallAverageAttendance}`,
            subtext: '%80 baraj kriteri',
            icon: <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />,
          },
          {
            label: 'Resmî Görevlendirme',
            value: currentUser.fullName,
            subtext: currentUser.title || 'Alan Eğitmeni',
            icon: <Award className="w-3.5 h-3.5 text-amber-600" />,
          },
        ]}
      />

      {/* Grup Kartları Izgarası */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {instructorAssignedGroups.map((grp) => {
          const stats = getGroupCapacityStats(grp.id);
          const gSum = calculateGroupAttendanceSummary(grp.id);
          const sessions = getSessionsByGroup(grp.id);
          const completedSessionsCount = sessions.filter((s) => s.status === 'completed').length;
          const capacityPercent = Math.min(100, Math.round((stats.assignedCount / (grp.capacity || 1)) * 100));

          return (
            <div
              key={grp.id}
              className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      {grp.cohortName || '2026 Güz Dönemi'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">{grp.name}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{grp.programTitle}</p>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 shrink-0">
                    {stats.assignedCount} / {grp.capacity} Kursiyer
                  </span>
                </div>

                {/* Kontenjan İlerleme Çubuğu */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-3">
                  <div
                    className="h-1.5 rounded-full bg-blue-600"
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>

                {/* Grup Detayları */}
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Ders Programı:
                    </span>
                    <span className="font-semibold text-slate-800">{grp.scheduleSummary || 'Haftalık Plan'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Oturum İlerlemesi:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {completedSessionsCount} / {sessions.length} Tamamlandı
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-slate-400" /> Ortalama Devam:
                    </span>
                    <span className="font-bold text-emerald-700">
                      {gSum.averageAttendanceRate !== null
                        ? `%${gSum.averageAttendanceRate}`
                        : 'Henüz Hesaplanmadı'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Aksiyon Butonları */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/egitmen/dersler')}
                  className="w-full justify-center"
                >
                  Yoklama
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/egitmen/odevler')}
                  className="w-full justify-center"
                >
                  Ödevler
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/egitmen/ilerleme')}
                  className="w-full justify-center"
                >
                  İlerleme
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/egitmen/kanallar')}
                  className="w-full justify-center"
                >
                  Kanal
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
