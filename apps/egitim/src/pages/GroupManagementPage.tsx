import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Layers,
  Plus,
  ArrowRightLeft,
  UserMinus,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Calendar,
  X,
  History,
  ShieldAlert,
} from 'lucide-react';
import { Group, GroupAssignment } from '../types';
import {
  getStoredGroups,
  getStoredAssignments,
  createGroup,
  transferTraineeGroup,
  removeTraineeFromGroup,
  getGroupCapacityStats,
  subscribeToGroupUpdates,
} from '../services/enrollmentStorage';
import { getStoredApplications } from '../services/applicationStorage';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import {
  getStoredLocations,
  addStoredLocation,
  getStoredSchedules,
  addStoredSchedule,
  subscribeToFacilityCatalog,
} from '../services/facilityCatalogService';
import { VenuePicker } from '../components/common/VenuePicker';
import { KpiStrip } from '../components/ui/KpiStrip';
import { fetchLivePrograms, getInitialPrograms } from '../services/programAdapter';
import { Program } from '../types';

const PREDEFINED_GROUP_NAMES = [
  'Grup A — Sabah Oturumu',
  'Grup B — Öğleden Sonra Oturumu',
  'Grup C — Hafta Sonu Sabah',
  'Grup D — Hafta Sonu Öğleden Sonra',
  'Grup E — Hafta İçi Akşam',
  'Özel Grup Adı Belirt...',
];

export const GroupManagementPage: React.FC = () => {
  const { currentUser } = useDemoRole();

  const [groups, setGroups] = useState<Group[]>([]);
  const [assignments, setAssignments] = useState<GroupAssignment[]>([]);
  const [programs, setPrograms] = useState<Program[]>(() => getInitialPrograms());
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [filterProgramId, setFilterProgramId] = useState<string>('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [transferTargetAssignment, setTransferTargetAssignment] = useState<GroupAssignment | null>(null);
  const [removeTargetAssignment, setRemoveTargetAssignment] = useState<GroupAssignment | null>(null);

  const [schedules, setSchedules] = useState<string[]>(getStoredSchedules());
  const [customLocation, setCustomLocation] = useState<string>('');
  const [customSchedule, setCustomSchedule] = useState<string>('');

  // Create form state
  const [newGroupNamePreset, setNewGroupNamePreset] = useState<string>(PREDEFINED_GROUP_NAMES[0]);
  const [newGroupName, setNewGroupName] = useState<string>(PREDEFINED_GROUP_NAMES[0]);
  const [newGroupProgramId, setNewGroupProgramId] = useState<string>('prog-01');
  const [newGroupCapacity, setNewGroupCapacity] = useState<number>(20);
  const [newGroupInstructorId, setNewGroupInstructorId] = useState<string>('user-instructor-01');
  const [newGroupSchedule, setNewGroupSchedule] = useState<string>(getStoredSchedules()[1] || '');
  const [newGroupLocation, setNewGroupLocation] = useState<string>(getStoredLocations()[0] || '');

  // Transfer form state
  const [targetNewGroupId, setTargetNewGroupId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');

  // Remove form state
  const [removeReason, setRemoveReason] = useState<string>('');

  // Scoped modal validation errors (cleared when closing modals)
  const [createModalError, setCreateModalError] = useState<string | null>(null);
  const [transferModalError, setTransferModalError] = useState<string | null>(null);
  const [removeModalError, setRemoveModalError] = useState<string | null>(null);

  // Toast / feedback message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = () => {
    const grps = getStoredGroups();
    const asgns = getStoredAssignments();
    setGroups(grps);
    setAssignments(asgns);

    fetchLivePrograms().then((progs) => {
      if (progs && progs.length > 0) setPrograms(progs);
    });

    if (grps.length > 0 && !selectedGroupId) {
      setSelectedGroupId(grps[0].id);
    }
  };

  useEffect(() => {
    loadData();
    const unsub1 = subscribeToGroupUpdates(loadData);
    const unsub2 = subscribeToFacilityCatalog(() => {
      setSchedules(getStoredSchedules());
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  // Filtered groups
  const filteredGroups = useMemo(() => {
    if (filterProgramId === 'all') return groups;
    return groups.filter((g) => g.programId === filterProgramId);
  }, [groups, filterProgramId]);

  // Selected group object
  const currentGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || filteredGroups[0] || null;
  }, [groups, selectedGroupId, filteredGroups]);

  // Trainees assigned to current group
  const currentGroupTrainees = useMemo(() => {
    if (!currentGroup) return [];
    return assignments.filter(
      (a) => a.groupId === currentGroup.id && a.status === 'active'
    );
  }, [assignments, currentGroup]);

  // Calculate stats for current group
  const currentGroupStats = useMemo(() => {
    if (!currentGroup) return { capacity: 0, assignedCount: 0, availableSeats: 0, isFull: false };
    return getGroupCapacityStats(currentGroup.id);
  }, [currentGroup, assignments]);

  // Overall statistics
  const totalStats = useMemo(() => {
    const totalCapacity = filteredGroups.reduce((acc, g) => acc + g.capacity, 0);
    const activeAssignments = assignments.filter(
      (a) => a.status === 'active' && filteredGroups.some((g) => g.id === a.groupId)
    );
    const totalAssigned = activeAssignments.length;
    const occupancyRate = totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0;

    return {
      totalGroups: filteredGroups.length,
      totalCapacity,
      totalAssigned,
      occupancyRate,
    };
  }, [filteredGroups, assignments]);

  // Available instructors list
  const instructorOptions = [
    { id: 'user-instructor-01', name: 'Murat Özkan', expertise: 'E-Ticaret & Bilişim' },
    { id: 'user-instructor-02', name: 'Kemal Aksoy', expertise: 'Dış Ticaret & Gümrük' },
    { id: 'user-instructor-03', name: 'Fatma Yıldırım', expertise: 'Dijital Pazarlama & İletişim' },
  ];

  // Programs mapping (dynamic with fallback)
  const programOptions = useMemo(() => {
    return programs.map((p) => ({ id: p.id, title: p.title }));
  }, [programs]);

  // Candidates on waitlist for current group's program
  const waitlistedCandidates = useMemo(() => {
    if (!currentGroup) return [];
    const apps = getStoredApplications();
    return apps.filter(
      (a) => a.programId === currentGroup.programId && a.status === 'waitlisted'
    );
  }, [currentGroup]);

  // Handlers
  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      setCreateModalError('Lütfen grup adı giriniz.');
      return;
    }

    let finalSchedule = newGroupSchedule;
    if (newGroupSchedule === 'custom') {
      if (!customSchedule.trim()) {
        setCreateModalError('Lütfen yeni ders takvimi / oturum zamanını belirtiniz.');
        return;
      }
      addStoredSchedule(customSchedule.trim());
      finalSchedule = customSchedule.trim();
    }

    let finalLocation = newGroupLocation;
    if (newGroupLocation === 'custom') {
      if (!customLocation.trim()) {
        setCreateModalError('Lütfen yeni derslik / konum adını belirtiniz.');
        return;
      }
      addStoredLocation(customLocation.trim());
      finalLocation = customLocation.trim();
    }

    const prog = programOptions.find((p) => p.id === newGroupProgramId);
    const inst = instructorOptions.find((i) => i.id === newGroupInstructorId);

    const res = createGroup({
      programId: newGroupProgramId,
      programTitle: prog ? prog.title : 'Eğitim Programı',
      termId: 'term-2026-fall',
      cohortName: '2026 Güz Dönemi',
      name: newGroupName.trim(),
      capacity: Number(newGroupCapacity),
      instructorIds: inst ? [inst.id] : ['user-instructor-01'],
      instructorNames: inst ? [inst.name] : ['Murat Özkan'],
      scheduleSummary: finalSchedule.trim() || 'Haftalık 6 Saat',
      location: finalLocation.trim() || 'Derslik',
      status: 'active',
    });

    if (res.success && res.group) {
      setFeedback({ type: 'success', message: `"${res.group.name}" başarıyla oluşturuldu.` });
      setCreateModalError(null);
      setShowCreateModal(false);
      setSelectedGroupId(res.group.id);
      setNewGroupName('');
      setCustomLocation('');
      setCustomSchedule('');
      loadData();
    } else {
      setCreateModalError(res.error || 'Grup oluşturulamadı.');
    }
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTargetAssignment) return;
    if (!targetNewGroupId) {
      setTransferModalError('Lütfen hedef grup seçiniz.');
      return;
    }
    if (!transferReason.trim()) {
      setTransferModalError('Lütfen transfer gerekçesi yazınız.');
      return;
    }

    const res = transferTraineeGroup(
      transferTargetAssignment.enrollmentId,
      targetNewGroupId,
      transferReason,
      currentUser.fullName
    );

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `${transferTargetAssignment.candidateName} başarıyla hedef gruba transfer edildi. Önceki yoklama geçmişi korundu.`,
      });
      setTransferModalError(null);
      setTransferTargetAssignment(null);
      setTargetNewGroupId('');
      setTransferReason('');
      loadData();
    } else {
      setTransferModalError(res.error || 'Transfer başarısız oldu.');
    }
  };

  const handleRemoveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!removeTargetAssignment) return;
    if (!removeReason.trim()) {
      setRemoveModalError('Lütfen gruptan çıkarma gerekçesi yazınız.');
      return;
    }

    const res = removeTraineeFromGroup(
      removeTargetAssignment.enrollmentId,
      removeReason,
      currentUser.fullName
    );

    if (res.success) {
      setFeedback({
        type: 'success',
        message: `${removeTargetAssignment.candidateName} gruptan çıkarıldı. Grup kontenjanı serbest bırakıldı.`,
      });
      setRemoveModalError(null);
      setRemoveTargetAssignment(null);
      setRemoveReason('');
      loadData();
    } else {
      setRemoveModalError(res.error || 'İşlem gerçekleştirilemedi.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Grup & Kontenjan Masası
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Program bazlı gruplar, eğitmen atamaları, kontenjan takibi ve kursiyer yerleşim masası.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Yeni Grup Oluştur</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-lg flex items-start justify-between text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Standard 4 KPI Strip (Stripe / Canvas LMS Standart Metrik Bandı) */}
      <KpiStrip
        items={[
          {
            label: 'Toplam Program',
            value: programOptions.length,
            icon: <Calendar className="w-4 h-4" />,
            subtext: '2026 Güz Dönemi',
          },
          {
            label: 'Toplam Grup',
            value: totalStats.totalGroups,
            icon: <Layers className="w-4 h-4" />,
            subtext: 'Aktif şubeler',
          },
          {
            label: 'Toplam Kapasite',
            value: `${totalStats.totalCapacity} Kişi`,
            icon: <Users className="w-4 h-4" />,
            subtext: 'Kontenjan havuzu',
          },
          {
            label: 'Yerleşim & Doluluk',
            value: `%${totalStats.occupancyRate}`,
            icon: <CheckCircle2 className="w-4 h-4" />,
            subtext: `${totalStats.totalAssigned} / ${totalStats.totalCapacity} Kursiyer`,
          },
        ]}
      />

      {/* Program Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Program Filtresi:</span>
          <select
            value={filterProgramId}
            onChange={(e) => setFilterProgramId(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-300 bg-slate-50 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Tüm Programlar ({groups.length} Grup)</option>
            {programOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <div className="text-slate-500 flex items-center gap-1.5 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Aktif Dönem: 2026 Güz Dönemi</span>
        </div>
      </div>

      {/* Main Layout: Group Cards on Left (or selection) and Group Detail & Roster on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Groups List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Eğitim Grupları ({filteredGroups.length})
            </h2>
            <span className="text-xs text-slate-500">Seçmek için karta tıklayın</span>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
              Bu filtreye uygun grup bulunamadı.
            </div>
          ) : (
            filteredGroups.map((grp) => {
              const stats = getGroupCapacityStats(grp.id);
              const isSelected = grp.id === currentGroup?.id;
              const percent = grp.capacity > 0 ? Math.round((stats.assignedCount / grp.capacity) * 100) : 0;

              return (
                <div
                  key={grp.id}
                  onClick={() => setSelectedGroupId(grp.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-blue-700">{grp.programTitle}</div>
                      <h3 className="font-bold text-slate-900 mt-0.5">{grp.name}</h3>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 border ${
                        stats.isFull
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : stats.availableSeats <= 3
                          ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {stats.isFull
                        ? 'Kontenjan Dolu'
                        : stats.availableSeats <= 3
                        ? `Son ${stats.availableSeats} Koltuk!`
                        : `${stats.availableSeats} Boş Koltuk`}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 truncate">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{grp.scheduleSummary}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{grp.location || 'Seminer Salonu'}</span>
                    </div>
                  </div>

                  {/* Capacity Progress Bar */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 font-medium">Doluluk Oranı:</span>
                      <span className="font-bold text-slate-800 tabular-nums">
                        {stats.assignedCount} / {grp.capacity} Kursiyer (%{percent})
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          stats.isFull
                            ? 'bg-rose-500'
                            : percent >= 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Group Roster & Management */}
        <div className="lg:col-span-7 space-y-4">
          {currentGroup ? (
            <>
              {/* Selected Group Header Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      {currentGroup.cohortName} • {currentGroup.programTitle}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">{currentGroup.name}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        currentGroupStats.isFull
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      {currentGroupStats.assignedCount} / {currentGroup.capacity} Kursiyer
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Atanmış Eğitmen:</span>
                    <span className="font-bold text-slate-800 mt-0.5 block text-sm">
                      {currentGroup.instructorNames?.join(', ') || 'Murat Özkan'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Haftalık Takvim:</span>
                    <span className="font-bold text-slate-800 mt-0.5 block text-sm">
                      {currentGroup.scheduleSummary}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Derslik / Konum:</span>
                    <span className="font-bold text-slate-800 mt-0.5 block text-sm">
                      {currentGroup.location || 'Seminer Salonu B'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trainee Roster Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Grup Kursiyer Listesi ({currentGroupTrainees.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Bu grupta aktif kayıtlı kursiyerler ve transfer geçmişleri
                    </p>
                  </div>
                </div>

                {currentGroupTrainees.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium">Bu gruba henüz kursiyer yerleştirilmemiştir.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Kesin Kayıt Masası üzerinden kesin kaydı tamamlanmış adayları bu gruba atayabilirsiniz.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Kursiyer Adı</th>
                          <th className="py-3 px-3">İletişim</th>
                          <th className="py-3 px-3">Atanma Tarihi</th>
                          <th className="py-3 px-3">Transfer Bilgisi</th>
                          <th className="py-3 px-4 text-right">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {currentGroupTrainees.map((trainee) => (
                          <tr key={trainee.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{trainee.candidateName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">ID: {trainee.candidateId}</div>
                            </td>
                            <td className="py-3 px-3">
                              <div>{trainee.candidateEmail}</div>
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              {trainee.assignedAt}
                            </td>
                            <td className="py-3 px-3">
                              {trainee.transferHistory && trainee.transferHistory.length > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800">
                                  <History className="w-3 h-3" />
                                  {trainee.transferHistory.length} Transfer
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">İlk Atama</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setTransferTargetAssignment(trainee)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-medium transition-colors text-[11px]"
                                  title="Farklı gruba transfer et"
                                >
                                  <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                                  Transfer
                                </button>
                                <button
                                  onClick={() => setRemoveTargetAssignment(trainee)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-red-50 border border-slate-300 rounded text-red-600 hover:border-red-300 font-medium transition-colors text-[11px]"
                                  title="Gruptan çıkar"
                                >
                                  <UserMinus className="w-3 h-3 text-red-500" />
                                  Çıkar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Waitlisted Candidates Alert & Policy Card (Requirement 6) */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-950 text-sm">
                      Yedek Liste & Kontenjan İdare Politikası
                    </h4>
                    <p className="mt-1 text-amber-800 leading-relaxed">
                      Bu programda kayıt iptali veya kontenjan açılması durumunda yedek listedeki adaylar <strong>otomatik olarak kesin kayıtlı kursiyere dönüşmez</strong>. Yetkili yöneticinin Başvuru Karar Masası üzerinden gerekçelendirerek yeni kabul kararı vermesi, ardından kesin kayıt onayının yürütülmesi şarttır.
                    </p>
                    {waitlistedCandidates.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-amber-200/60 font-medium">
                        Bu programda sırada bekleyen <strong>{waitlistedCandidates.length} yedek aday</strong> bulunmaktadır:{' '}
                        {waitlistedCandidates.map((c) => c.candidateName).join(', ')}.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
              Lütfen sol taraftan bir grup seçiniz.
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. YENİ GRUP OLUŞTURMA MODALI */}
      {/* ===================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-brand-navy text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Yeni Eğitim Grubu Tanımla</h3>
                <p className="text-xs text-slate-300 mt-0.5">Program, eğitmen ve kontenjan bilgisi</p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateModalError(null);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroupSubmit} className="p-6 space-y-4 text-xs">
              {createModalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{createModalError}</span>
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Eğitim Programı *</label>
                <select
                  value={newGroupProgramId}
                  onChange={(e) => setNewGroupProgramId(e.target.value)}
                  className="w-full text-xs border-slate-300 rounded-lg p-2.5 bg-slate-50"
                  required
                >
                  {programOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Grup Adı *</label>
                <div className="space-y-2">
                  <select
                    value={newGroupNamePreset}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewGroupNamePreset(val);
                      if (val !== 'Özel Grup Adı Belirt...') {
                        setNewGroupName(val);
                      } else {
                        setNewGroupName('');
                      }
                    }}
                    className="w-full text-xs border-slate-300 rounded-lg p-2.5 bg-slate-50 font-medium"
                    required
                  >
                    {PREDEFINED_GROUP_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>

                  {newGroupNamePreset === 'Özel Grup Adı Belirt...' && (
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Örn: Grup F — Hafta Sonu İleri Düzey"
                      className="w-full text-xs border-slate-300 rounded-lg p-2.5"
                      required
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kontenjan (Kişi) *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newGroupCapacity}
                    onChange={(e) => setNewGroupCapacity(Number(e.target.value))}
                    className="w-full text-xs border-slate-300 rounded-lg p-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Atanacak Eğitmen *</label>
                  <select
                    value={newGroupInstructorId}
                    onChange={(e) => setNewGroupInstructorId(e.target.value)}
                    className="w-full text-xs border-slate-300 rounded-lg p-2.5 bg-slate-50"
                    required
                  >
                    {instructorOptions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.expertise})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">Ders Takvimi / Oturum Zamanı *</label>
                  <span className="text-[10px] text-slate-400">Katalog Şablonları</span>
                </div>
                <select
                  value={newGroupSchedule}
                  onChange={(e) => {
                    setNewGroupSchedule(e.target.value);
                    if (e.target.value !== 'custom') setCustomSchedule('');
                  }}
                  className="w-full text-xs border-slate-300 rounded-lg p-2.5 bg-slate-50 font-medium"
                  required
                >
                  {schedules.map((sched) => (
                    <option key={sched} value={sched}>
                      {sched}
                    </option>
                  ))}
                  <option value="custom">+ Yeni Takvim / Saat Şablonu Tanımla...</option>
                </select>
                {newGroupSchedule === 'custom' && (
                  <div className="mt-2 space-y-1">
                    <input
                      type="text"
                      value={customSchedule}
                      onChange={(e) => setCustomSchedule(e.target.value)}
                      placeholder="Örn: Salı & Cuma 14:00 - 17:00 (Hafta İçi Öğleden Sonra)"
                      className="w-full text-xs border-slate-300 rounded-lg p-2.5 bg-white"
                      required
                    />
                    <p className="text-[10px] text-slate-500">
                      Girilen yeni saat şablonu otomatik olarak merkezi takvim kataloğuna kaydedilecektir.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <VenuePicker
                  value={newGroupLocation}
                  onChange={(val) => {
                    setNewGroupLocation(val);
                    if (val !== 'custom') setCustomLocation('');
                  }}
                  customValue={customLocation}
                  onCustomChange={(val) => setCustomLocation(val)}
                  label="Derslik ve Grup Mekânı"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateModalError(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-navy hover:bg-slate-800 text-white rounded-lg transition-colors font-semibold shadow-sm"
                >
                  Grubu Kaydet ve Yayınla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. KURSİYER TRANSFER MODALI */}
      {/* ===================================================================== */}
      {transferTargetAssignment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-blue-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Kursiyer Grup Transferi</h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  {transferTargetAssignment.candidateName} için kontrollü transfer
                </p>
              </div>
              <button
                onClick={() => {
                  setTransferTargetAssignment(null);
                  setTransferModalError(null);
                }}
                className="text-blue-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4 text-xs">
              {transferModalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{transferModalError}</span>
                </div>
              )}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-slate-500 font-medium">Mevcut Grup:</div>
                <div className="font-bold text-slate-800 text-sm mt-0.5">
                  {transferTargetAssignment.groupName}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Program: {transferTargetAssignment.programTitle}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hedef Grup Seçimi *</label>
                <select
                  value={targetNewGroupId}
                  onChange={(e) => setTargetNewGroupId(e.target.value)}
                  className="w-full text-xs border-slate-300 rounded-lg p-2.5 bg-slate-50"
                  required
                >
                  <option value="">-- Hedef Grubu Seçiniz --</option>
                  {groups
                    .filter(
                      (g) =>
                        g.programId === transferTargetAssignment.programId &&
                        g.id !== transferTargetAssignment.groupId
                    )
                    .map((g) => {
                      const stats = getGroupCapacityStats(g.id);
                      return (
                        <option
                          key={g.id}
                          value={g.id}
                          disabled={stats.isFull}
                        >
                          {g.name} ({stats.assignedCount}/{g.capacity} Dolu - {stats.isFull ? 'KONTENJAN DOLU' : `${stats.availableSeats} Boş`})
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transfer Gerekçesi (Zorunlu) *
                </label>
                <textarea
                  rows={3}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="Örn: Kursiyerin çalışma saatleri değişikliği sebebiyle hafta içi akşam grubuna geçiş talebi onaylandı."
                  className="w-full text-xs border-slate-300 rounded-lg p-2.5"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  * Önceki oturum yoklama kayıtları silinmez ve korunur.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTransferTargetAssignment(null);
                    setTransferModalError(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors font-semibold shadow-sm"
                >
                  Transferi Onayla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. GRUPTAN ÇIKARMA MODALI */}
      {/* ===================================================================== */}
      {removeTargetAssignment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-red-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Gruptan Çıkarma</h3>
                <p className="text-xs text-red-200 mt-0.5">
                  {removeTargetAssignment.candidateName} gruptan çıkarılacak
                </p>
              </div>
              <button
                onClick={() => {
                  setRemoveTargetAssignment(null);
                  setRemoveModalError(null);
                }}
                className="text-red-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRemoveSubmit} className="p-6 space-y-4 text-xs">
              {removeModalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{removeModalError}</span>
                </div>
              )}
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900">
                <p className="font-bold">Dikkat: Kontenjan Boşaltılacaktır</p>
                <p className="mt-1 text-[11px] leading-relaxed">
                  Bu işlem kursiyeri {removeTargetAssignment.groupName} grubundan çıkarır ve grup kontenjanında 1 kişilik boş yer açar. Kursiyerin kesin kaydı iptal edilmez; yeni bir gruba atanmayı bekleyen durumuna geçer.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Çıkarma Gerekçesi (Zorunlu) *
                </label>
                <textarea
                  rows={3}
                  value={removeReason}
                  onChange={(e) => setRemoveReason(e.target.value)}
                  placeholder="Örn: Kursiyer mazeret bildirerek grup yerleşiminin askıya alınmasını talep etmiştir."
                  className="w-full text-xs border-slate-300 rounded-lg p-2.5"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRemoveTargetAssignment(null);
                    setRemoveModalError(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold shadow-sm"
                >
                  Gruptan Çıkarmayı Onayla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupManagementPage;
