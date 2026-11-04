import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  FileText,
  Lock,
  X,
  AlertTriangle,
  ShieldCheck,
  Check,
  Search,
  Filter,
  LayoutGrid,
  List,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { Group } from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatCard } from '../components/ui/StatCard';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { getStoredGroups, getGroupCapacityStats } from '../services/enrollmentStorage';
import { calculateBatchEligibility } from '../services/successEngine';

export const InstructorProgressPage: React.FC = () => {
  const { currentUser } = useDemoRole();
  const navigate = useNavigate();

  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [inspectTrainee, setInspectTrainee] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'eligible' | 'attendance_risk' | 'grade_risk'>('all');

  const loadData = () => {
    const grps = getStoredGroups();
    setAllGroups(grps);
  };

  useEffect(() => {
    loadData();
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

  useEffect(() => {
    if (
      instructorAssignedGroups.length > 0 &&
      (!selectedGroupId || !instructorAssignedGroups.some((g) => g.id === selectedGroupId))
    ) {
      setSelectedGroupId(instructorAssignedGroups[0].id);
    }
  }, [instructorAssignedGroups, selectedGroupId]);

  const selectedGroup = useMemo(() => {
    return allGroups.find((g) => g.id === selectedGroupId) || instructorAssignedGroups[0] || null;
  }, [allGroups, selectedGroupId, instructorAssignedGroups]);

  // Kursiyer Akademik Başarı Ön Kontrol Hesaplamaları
  const groupEligibilityList = useMemo(() => {
    if (!selectedGroup) return [];
    return calculateBatchEligibility(selectedGroup.id);
  }, [selectedGroup]);

  const totalCount = groupEligibilityList.length;
  const academicPassedCount = groupEligibilityList.filter((e) => e.academicEligible).length;
  const academicFailedCount = groupEligibilityList.filter((e) => !e.academicEligible).length;
  const adminApprovedCount = groupEligibilityList.filter((e) => e.finalStatus === 'admin_approved').length;

  const attendancePassedCount = groupEligibilityList.filter((e) => e.attendanceEligible).length;
  const gradePassedCount = groupEligibilityList.filter((e) => e.gradeEligible).length;
  const mandatoryPassedCount = groupEligibilityList.filter((e) => e.mandatoryEligible).length;

  const overallSuccessRate = totalCount > 0 ? Math.round((academicPassedCount / totalCount) * 100) : 0;

  // Filtrelenmiş Kursiyer Listesi
  const filteredEligibilityList = useMemo(() => {
    return groupEligibilityList.filter((trainee) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = trainee.traineeName.toLowerCase().includes(q);
        const matchesId = trainee.enrollmentId.toLowerCase().includes(q);
        if (!matchesName && !matchesId) return false;
      }
      if (riskFilter === 'eligible') {
        return trainee.academicEligible;
      }
      if (riskFilter === 'attendance_risk') {
        return !trainee.attendanceEligible;
      }
      if (riskFilter === 'grade_risk') {
        return !trainee.gradeEligible;
      }
      return true;
    });
  }, [groupEligibilityList, searchQuery, riskFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-16">
      {/* 1. Üst Başlık & Hızlı Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Kursiyer Akademik İlerlemesi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {selectedGroup
              ? `${selectedGroup.programTitle} — ${selectedGroup.name} şubesindeki kursiyerlerin %80 devam, 70 not ortalaması ve zorunlu ödev denetimi.`
              : 'Kursiyerlerin akademik barajları sağlama durumunu inceleyin.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            to="/egitmen/dersler"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Ders & Yoklama Masası</span>
          </Link>
          <Link
            to="/egitmen/odevler"
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs whitespace-nowrap"
          >
            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Ödev Değerlendirme</span>
          </Link>
        </div>
      </div>

      {/* 2. Ortak Grup Seçici */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-600 px-2 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-blue-600" /> Görevli Olduğunuz Şube:
        </span>
        {instructorAssignedGroups.map((grp) => {
          const stats = getGroupCapacityStats(grp.id);
          const isSelected = grp.id === selectedGroup?.id;
          return (
            <button
              key={grp.id}
              type="button"
              onClick={() => setSelectedGroupId(grp.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{grp.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {stats.assignedCount} Kursiyer
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. REFERANS CANVAS/SPEEDGRADER STANDARDI: 4 KPI Kartı + Sınıf Başarı Radarı */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
          <StatCard
            title="Kayıtlı Kursiyer"
            value={`${totalCount} Aday`}
            icon={<Users className="w-4 h-4" />}
            variant="default"
            subtitle="Şubedeki aktif öğrenci"
          />
          <StatCard
            title="Şartları Sağlayan"
            value={`${academicPassedCount} Aday`}
            icon={<CheckCircle2 className="w-4 h-4" />}
            variant="emerald"
            subtitle="%80 Devam & 70 Not & Zorunlu"
          />
          <StatCard
            title="Risk / Eksik Şart"
            value={`${academicFailedCount} Aday`}
            icon={<AlertTriangle className="w-4 h-4" />}
            variant="amber"
            subtitle="Devamsızlık veya ödev eksiği"
          />
          <StatCard
            title="Yönetim Onaylı"
            value={`${adminApprovedCount} Aday`}
            icon={<Award className="w-4 h-4" />}
            variant="blue"
            subtitle="Belgesi kütüğe tescil edildi"
          />
        </div>

        {/* Sınıf Başarı & Mezuniyet Radarı Şeridi */}
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                  Şube Akademik Başarı & Mezuniyet Radarı
                </h3>
                <p className="text-[11px] text-slate-500">
                  {selectedGroup?.name} şubesindeki 3 temel barajın genel sınıf dağılımı
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Genel Mezuniyet Uygunluğu:</span>
              <span className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg tabular-nums">
                %{overallSuccessRate}
              </span>
            </div>
          </div>

          {/* 3 Temel Baraj Gösterge Çubukları */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            
            {/* Devam Barajı */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-slate-700 font-semibold text-[11px]">
                <span>1. Devam Barajı (≥%80)</span>
                <strong className="text-emerald-700 tabular-nums">{attendancePassedCount} / {totalCount}</strong>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{ width: `${totalCount > 0 ? (attendancePassedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Ödev Barajı */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-slate-700 font-semibold text-[11px]">
                <span>2. Ödev Barajı (≥70/100)</span>
                <strong className="text-blue-700 tabular-nums">{gradePassedCount} / {totalCount}</strong>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${totalCount > 0 ? (gradePassedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Zorunlu Ödevler */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-slate-700 font-semibold text-[11px]">
                <span>3. Zorunlu Ödevler</span>
                <strong className="text-amber-700 tabular-nums">{mandatoryPassedCount} / {totalCount}</strong>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${totalCount > 0 ? (mandatoryPassedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 4. Kurumsal Bilgilendirme Kutusu */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs text-slate-700">
        <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-slate-900">
            Resmî Belge Hak Ediş Mevzuatı & Yetki Sınırı
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Kursiyerlerin dijital başarı belgesine hak kazanabilmesi için en az <strong>%80 devam</strong>, en az <strong>70/100 ödev ortalaması</strong>, tüm zorunlu ödevlerin onaylanması ve nihayetinde <strong>İslahiye Ticaret Odası yönetiminin nihai onay kararı</strong> zorunludur. Eğitmenler akademik durumları inceler; belge tescil yetkisi yetkili idari yöneticiye aittir.
          </p>
        </div>
      </div>

      {/* 5. Kursiyer Kütüğü Tablosu & Kart Görünümü */}
      <Card className="rounded-2xl border-slate-200 shadow-xs overflow-hidden">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>{selectedGroup?.name} — Kursiyer Akademik Durum ve Ön Kontrol Kütüğü</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {filteredEligibilityList.length} / {groupEligibilityList.length} Kursiyer
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kriterler dinamik hesaplanır; devamsızlık ve ödev barajının altındaki kursiyerler uyarı etiketiyle belirtilir.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
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
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md text-xs font-medium transition ${
                    viewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Kart Görünümü"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Arama ve Risk Filtreleme Çubukları */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-600 flex items-center gap-1.5 mr-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" /> Filtrele:
              </span>
              <button
                type="button"
                onClick={() => setRiskFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  riskFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Tümü ({groupEligibilityList.length})
              </button>
              <button
                type="button"
                onClick={() => setRiskFilter('eligible')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  riskFilter === 'eligible'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
                }`}
              >
                Şartları Sağlayan ({academicPassedCount})
              </button>
              <button
                type="button"
                onClick={() => setRiskFilter('attendance_risk')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  riskFilter === 'attendance_risk'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-rose-800 hover:bg-rose-50 border border-rose-200'
                }`}
              >
                Devamsızlık Riski ({groupEligibilityList.filter((e) => !e.attendanceEligible).length})
              </button>
              <button
                type="button"
                onClick={() => setRiskFilter('grade_risk')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  riskFilter === 'grade_risk'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
                }`}
              >
                Ödev Barajı Altı ({groupEligibilityList.filter((e) => !e.gradeEligible).length})
              </button>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Kursiyer veya kayıt no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {filteredEligibilityList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              {searchQuery || riskFilter !== 'all'
                ? 'Filtreleme kriterlerine uygun kursiyer bulunamadı.'
                : 'Bu gruba atanmış kesin kayıtlı kursiyer bulunamadı.'}
            </div>
          ) : viewMode === 'list' ? (
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Kursiyer</th>
                    <th className="py-3 px-3 text-center">1. Devam Oranı (%80)</th>
                    <th className="py-3 px-3 text-center">2. Ödev Ortalaması (70/100)</th>
                    <th className="py-3 px-3 text-center">3. Zorunlu Onaylar</th>
                    <th className="py-3 px-3 text-center">Akademik Ön Kontrol</th>
                    <th className="py-3 px-3 text-center">4. Yönetici Kararı</th>
                    <th className="py-3 px-3 text-right">Eylemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEligibilityList.map((trainee) => {
                    return (
                      <tr key={trainee.enrollmentId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{trainee.traineeName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Kayıt: {trainee.enrollmentId}
                          </div>
                        </td>

                        {/* 1. Devam */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="space-y-0.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold tabular-nums border ${
                                trainee.attendanceEligible
                                  ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                                  : 'text-rose-800 bg-rose-50 border-rose-200'
                              }`}
                            >
                              {trainee.attendanceEligible ? <Check className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-rose-600" />}
                              <span>%{trainee.attendanceRate ?? 0}</span>
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {trainee.attendedCount} / {trainee.completedSessionsCount} Oturum
                            </span>
                          </div>
                        </td>

                        {/* 2. Ödev Ortalaması */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="space-y-0.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold tabular-nums border ${
                                trainee.gradeEligible
                                  ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                                  : 'text-amber-800 bg-amber-50 border-amber-200'
                              }`}
                            >
                              {trainee.gradeEligible ? <Check className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-amber-600" />}
                              <span>
                                {trainee.assignmentAverage !== null ? `${trainee.assignmentAverage}/100` : 'Ödev Yok'}
                              </span>
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              {trainee.gradeEligible ? 'Baraj Sağlandı' : '70 Puan Altı'}
                            </span>
                          </div>
                        </td>

                        {/* 3. Zorunlu Onaylar */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                              trainee.mandatoryEligible
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            {trainee.mandatoryAssignmentsApproved} / {trainee.mandatoryAssignmentsTotal} Onay
                          </span>
                        </td>

                        {/* Ön Kontrol Durumu */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              trainee.academicEligible
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {trainee.academicEligible ? 'Şartları Sağlıyor ✓' : 'Eksik Şartı Var'}
                          </span>
                        </td>

                        {/* 4. Yönetici Kararı (Salt Okunur) */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              trainee.finalStatus === 'admin_approved'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : trainee.finalStatus === 'rejected'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-slate-100 text-slate-600 border border-slate-300'
                            }`}
                          >
                            {trainee.finalStatus === 'admin_approved'
                              ? 'Tescil Edildi ✓'
                              : trainee.finalStatus === 'rejected'
                              ? 'Reddedildi'
                              : 'İnceleme Bekliyor'}
                          </span>
                        </td>

                        {/* Eylemler */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate('/egitmen/odevler')}
                              className="text-[11px] py-1 px-2.5"
                            >
                              Ödevler
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setInspectTrainee(trainee)}
                              className="text-[11px] py-1 px-2.5"
                            >
                              İncele
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEligibilityList.map((trainee) => (
                <div
                  key={trainee.enrollmentId}
                  className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{trainee.traineeName}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {trainee.enrollmentId}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          trainee.academicEligible
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {trainee.academicEligible ? 'Uygun ✓' : 'Riskli'}
                      </span>
                    </div>

                    {/* Dual Gauge Meters */}
                    <div className="space-y-2 pt-1 text-xs">
                      {/* Devam */}
                      <div>
                        <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                          <span>Devam: <strong className="text-slate-900">%{trainee.attendanceRate ?? 0}</strong></span>
                          <span className="text-slate-400">(Baraj: %80)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              trainee.attendanceEligible ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(trainee.attendanceRate ?? 0, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Ödev Ortalaması */}
                      <div>
                        <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                          <span>
                            Ödev Ortalaması: <strong className="text-slate-900">{trainee.assignmentAverage !== null ? `${trainee.assignmentAverage}/100` : '—'}</strong>
                          </span>
                          <span className="text-slate-400">(Baraj: 70)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              trainee.gradeEligible ? 'bg-blue-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(trainee.assignmentAverage ?? 0, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Zorunlu Ödevler & Tescil */}
                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                        <span>Zorunlu Ödev: <strong className="text-slate-800">{trainee.mandatoryAssignmentsApproved}/{trainee.mandatoryAssignmentsTotal}</strong></span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            trainee.finalStatus === 'admin_approved'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {trainee.finalStatus === 'admin_approved' ? 'Tescilli' : 'Beklemede'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/egitmen/odevler')}
                      className="text-xs py-1 px-3 flex-1"
                    >
                      Ödevler
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setInspectTrainee(trainee)}
                      className="text-xs py-1 px-3 flex-1"
                    >
                      Detay İncele
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kursiyer İnceleme Modalı */}
      {inspectTrainee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-brand-navy text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Kursiyer Akademik İnceleme Kartı</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {inspectTrainee.traineeName} • {inspectTrainee.enrollmentId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectTrainee(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-500 font-semibold block">Devam Oranı</span>
                  <div className="text-base font-extrabold text-slate-900 tabular-nums">
                    %{inspectTrainee.attendanceRate ?? 0}
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    {inspectTrainee.attendedCount} / {inspectTrainee.completedSessionsCount} ders katılımı
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-500 font-semibold block">Ödev Ortalaması</span>
                  <div className="text-base font-extrabold text-slate-900 tabular-nums">
                    {inspectTrainee.assignmentAverage !== null ? `${inspectTrainee.assignmentAverage}/100` : '—'}
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    {inspectTrainee.gradeEligible ? 'Baraj Sağlandı (≥70)' : 'Baraj Altı (<70)'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                <span className="font-bold text-blue-900 text-xs">Zorunlu Ödev Onay Durumu:</span>
                <p className="text-slate-600 text-[11px]">
                  Bu kursiyer {inspectTrainee.mandatoryAssignmentsTotal} zorunlu ödevden {inspectTrainee.mandatoryAssignmentsApproved} tanesini onaylatmıştır.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setInspectTrainee(null)}
                >
                  Kapat
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorProgressPage;
