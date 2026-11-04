import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Clock,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Monitor,
  UtensilsCrossed,
  Users,
  Video,
  X,
  RotateCcw,
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import {
  FacilityRoom,
  getStoredFacilities,
  createFacility,
  updateFacility,
  deleteFacility,
  getStoredSchedules,
  addStoredSchedule,
  removeStoredSchedule,
  resetFacilityCatalog,
  subscribeToFacilityCatalog,
} from '../services/facilityCatalogService';
import { KpiStrip } from '../components/ui/KpiStrip';
import { ActionConfirmModal } from '../components/common/ActionConfirmModal';

export const FacilityManagementPage: React.FC = () => {
  const [facilities, setFacilities] = useState<FacilityRoom[]>(getStoredFacilities());
  const [schedules, setSchedules] = useState<string[]>(getStoredSchedules());
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'capacity_desc' | 'capacity_asc' | 'floor'>('name');
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState<FacilityRoom | null>(null);

  // Form states for Facility
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<FacilityRoom['type']>('classroom');
  const [formTypeLabel, setFormTypeLabel] = useState('Teorik Derslik');
  const [formFloor, setFormFloor] = useState('Kat 1');
  const [formCapacity, setFormCapacity] = useState(30);
  const [formFeatures, setFormFeatures] = useState<string[]>(['Projeksiyon', 'Akıllı Tahta', 'İklimlendirme']);
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [formStatus, setFormStatus] = useState<FacilityRoom['status']>('active');

  // New Schedule input
  const [newScheduleInput, setNewScheduleInput] = useState('');

  // Feedback Toast
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // In-App Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm?: () => void;
  }>({ isOpen: false, title: '', message: '' });

  const loadData = () => {
    setFacilities(getStoredFacilities());
    setSchedules(getStoredSchedules());
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToFacilityCatalog(loadData);
    return () => unsub();
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Filtered and Sorted facilities
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      if (selectedTypeFilter !== 'all' && f.type !== selectedTypeFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = f.name.toLowerCase().includes(query);
        const matchesType = f.typeLabel.toLowerCase().includes(query);
        const matchesFloor = f.floor.toLowerCase().includes(query);
        return matchesName || matchesType || matchesFloor;
      }
      return true;
    });
  }, [facilities, selectedTypeFilter, searchQuery]);

  const sortedFacilities = useMemo(() => {
    return [...filteredFacilities].sort((a, b) => {
      if (sortBy === 'capacity_desc') return b.capacity - a.capacity;
      if (sortBy === 'capacity_asc') return a.capacity - b.capacity;
      if (sortBy === 'floor') return a.floor.localeCompare(b.floor, 'tr');
      return a.name.localeCompare(b.name, 'tr');
    });
  }, [filteredFacilities, sortBy]);

  const handleToggleSelectAll = () => {
    if (selectedFacilityIds.length === sortedFacilities.length) {
      setSelectedFacilityIds([]);
    } else {
      setSelectedFacilityIds(sortedFacilities.map((f) => f.id));
    }
  };

  const handleToggleSingleSelect = (id: string) => {
    setSelectedFacilityIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = (newStatus: FacilityRoom['status']) => {
    if (selectedFacilityIds.length === 0) return;
    selectedFacilityIds.forEach((id) => {
      updateFacility(id, { status: newStatus });
    });
    showToast('success', `${selectedFacilityIds.length} mekânın durumu güncellendi.`);
    setSelectedFacilityIds([]);
    loadData();
  };

  const handleBulkDelete = () => {
    if (selectedFacilityIds.length === 0) return;
    if (facilities.length - selectedFacilityIds.length < 1) {
      showToast('error', 'Katalogda en az bir aktif derslik kalmalıdır.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Toplu Mekân Silme',
      message: `Seçilen ${selectedFacilityIds.length} mekân katalogdan kalıcı olarak silinsin mi?`,
      confirmText: 'Evet, Sil',
      variant: 'danger',
      onConfirm: () => {
        selectedFacilityIds.forEach((id) => {
          deleteFacility(id);
        });
        showToast('success', `${selectedFacilityIds.length} mekân katalogdan kaldırıldı.`);
        setSelectedFacilityIds([]);
        loadData();
      },
    });
  };

  // Overall statistics
  const stats = useMemo(() => {
    const total = facilities.length;
    const physical = facilities.filter((f) => f.type !== 'online').length;
    const online = facilities.filter((f) => f.type === 'online').length;
    const totalCapacity = facilities
      .filter((f) => f.type !== 'online')
      .reduce((acc, f) => acc + f.capacity, 0);

    return { total, physical, online, totalCapacity, scheduleCount: schedules.length };
  }, [facilities, schedules]);

  // Handlers for Facility Modal
  const openCreateModal = () => {
    setEditingFacility(null);
    setFormName('');
    setFormType('classroom');
    setFormTypeLabel('Teorik Derslik');
    setFormFloor('Kat 1');
    setFormCapacity(30);
    setFormFeatures(['Projeksiyon', 'Akıllı Tahta', 'İklimlendirme']);
    setFormStatus('active');
    setShowCreateModal(true);
  };

  const openEditModal = (facility: FacilityRoom) => {
    setEditingFacility(facility);
    setFormName(facility.name);
    setFormType(facility.type);
    setFormTypeLabel(facility.typeLabel);
    setFormFloor(facility.floor);
    setFormCapacity(facility.capacity);
    setFormFeatures([...facility.features]);
    setFormStatus(facility.status);
    setShowCreateModal(true);
  };

  const handleFacilitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('error', 'Lütfen mekân / derslik adını giriniz.');
      return;
    }

    if (editingFacility) {
      const ok = updateFacility(editingFacility.id, {
        name: formName.trim(),
        type: formType,
        typeLabel: formTypeLabel,
        floor: formFloor.trim(),
        capacity: Number(formCapacity),
        features: formFeatures,
        status: formStatus,
      });
      if (ok) {
        showToast('success', `"${formName}" bilgileri başarıyla güncellendi.`);
        setShowCreateModal(false);
      } else {
        showToast('error', 'Mekân güncellenirken hata oluştu.');
      }
    } else {
      createFacility({
        name: formName.trim(),
        type: formType,
        typeLabel: formTypeLabel,
        floor: formFloor.trim(),
        capacity: Number(formCapacity),
        features: formFeatures,
        status: formStatus,
      });
      showToast('success', `"${formName}" başarıyla kataloğa eklendi.`);
      setShowCreateModal(false);
    }
  };

  const handleDeleteFacility = (facility: FacilityRoom) => {
    if (facilities.length <= 1) {
      showToast('error', 'Katalogda en az bir aktif derslik kalmalıdır.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Dersliği Katalogdan Kaldır',
      message: `"${facility.name}" dersliği katalogdan silinsin mi?`,
      confirmText: 'Evet, Sil',
      variant: 'danger',
      onConfirm: () => {
        const ok = deleteFacility(facility.id);
        if (ok) {
          showToast('success', `"${facility.name}" katalogdan kaldırıldı.`);
        } else {
          showToast('error', 'Derslik silinemedi.');
        }
      },
    });
  };

  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    if (!formFeatures.includes(newFeatureInput.trim())) {
      setFormFeatures([...formFeatures, newFeatureInput.trim()]);
    }
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (tag: string) => {
    setFormFeatures(formFeatures.filter((f) => f !== tag));
  };

  // Handlers for Schedule
  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleInput.trim()) return;
    addStoredSchedule(newScheduleInput.trim());
    setNewScheduleInput('');
    showToast('success', 'Yeni ders oturum saati şablonu eklendi.');
  };

  const handleRemoveSchedule = (sched: string) => {
    if (schedules.length <= 1) {
      showToast('error', 'En az bir aktif takvim şablonu bulunmalıdır.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Takvim Şablonunu Kaldır',
      message: `"${sched}" saat şablonu katalogdan silinsin mi?`,
      confirmText: 'Evet, Kaldır',
      variant: 'danger',
      onConfirm: () => {
        removeStoredSchedule(sched);
        showToast('success', 'Takvim şablonu kaldırıldı.');
      },
    });
  };

  const handleReset = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Kataloğu Sıfırla',
      message: 'Tüm mekân ve takvim kataloğu başlangıç fabrika ayarlarına döndürülsün mü? Özel eklenen salonlar sıfırlanacaktır.',
      confirmText: 'Evet, Sıfırla',
      variant: 'danger',
      onConfirm: () => {
        resetFacilityCatalog();
        showToast('success', 'Katalog varsayılanlara sıfırlandı.');
      },
    });
  };

  const getFacilityIcon = (type: FacilityRoom['type']) => {
    switch (type) {
      case 'computer_lab':
        return <Monitor className="w-5 h-5 text-indigo-600" />;
      case 'workshop':
        return <UtensilsCrossed className="w-5 h-5 text-amber-600" />;
      case 'conference_hall':
        return <Users className="w-5 h-5 text-purple-600" />;
      case 'online':
        return <Video className="w-5 h-5 text-emerald-600" />;
      default:
        return <Building2 className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Derslik ve Mekân Kataloğu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            İslahiye Ticaret Odası bünyesindeki eğitim sınıfları, atölyeler, bilişim laboratuvarları ve takvim şablonları.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Derslik Tanımla</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition"
            title="Kataloğu fabrika ayarlarına döndür"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Varsayılana Sıfırla</span>
          </button>
        </div>
      </div>

      {/* Metric Strip (Stripe / Canvas LMS Metrik Bandı) */}
      <KpiStrip
        items={[
          {
            label: 'Toplam Mekân',
            value: `${stats.total} Salon`,
            icon: <Building2 className="w-4 h-4" />,
            subtext: 'Tüm bina ve sanal odalar',
          },
          {
            label: 'Fiziksel Derslik & Atölye',
            value: `${stats.physical} Oda`,
            icon: <Building2 className="w-4 h-4" />,
            subtext: `${stats.totalCapacity} Toplam koltuk`,
          },
          {
            label: 'Sanal & Canlı Sınıf',
            value: `${stats.online} Yayın`,
            icon: <Video className="w-4 h-4" />,
            subtext: 'WebRTC & çevrimiçi oda',
          },
          {
            label: 'Takvim Şablonları',
            value: `${stats.scheduleCount} Slot`,
            icon: <Clock className="w-4 h-4" />,
            subtext: 'Haftalık oturum zamanı',
          },
        ]}
      />

      {/* Filter, Search, Sort and View Switcher Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Type Filter Tabs (Segmented Control) */}
          <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/80">
            {[
              { id: 'all', label: 'Tüm Mekânlar' },
              { id: 'classroom', label: 'Derslikler' },
              { id: 'computer_lab', label: 'Bilişim Lab' },
              { id: 'workshop', label: 'Atölyeler' },
              { id: 'conference_hall', label: 'Salonlar' },
              { id: 'online', label: 'Sanal' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTypeFilter(tab.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  selectedTypeFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right Controls: Search, Sort and View Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Derslik adı veya kat ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
              />
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="name">Ada Göre (A-Z)</option>
                <option value="capacity_desc">Kapasite (Çoktan Aza)</option>
                <option value="capacity_asc">Kapasite (Azdan Çoka)</option>
                <option value="floor">Kata Göre</option>
              </select>
            </div>

            {/* View Mode Toggle: Grid vs List */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Kart Görünümü"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kartlar</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Liste / Tablo Görünümü"
              >
                <List className="w-3.5 h-3.5" />
                <span>Liste</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: FACILITIES GRID (CARD VIEW) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedFacilities.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              Arama kriterlerine uygun mekân veya derslik bulunamadı.
            </div>
          ) : (
            sortedFacilities.map((facility) => (
              <div
                key={facility.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm hover:border-blue-300 transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        {getFacilityIcon(facility.type)}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {facility.typeLabel}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {facility.name}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        facility.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {facility.status === 'active' ? 'Aktif' : 'Bakımda'}
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Bulunduğu Kat / Konum:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {facility.floor}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Kapasite / Kontenjan:</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {facility.capacity} Kursiyer
                      </span>
                    </div>
                  </div>

                  {/* Equipment Tags */}
                  <div className="mt-3">
                    <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                      Donanım & Özellikler:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {facility.features.map((feat) => (
                        <span
                          key={feat}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(facility)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Düzenle</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFacility(facility)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sil</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW 2: FACILITIES TABLE (LIST VIEW) */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedFacilityIds.length === sortedFacilities.length &&
                        sortedFacilities.length > 0
                      }
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                  </th>
                  <th className="py-3 px-4">Derslik & Mekân Adı</th>
                  <th className="py-3 px-3">Tür</th>
                  <th className="py-3 px-3">Bulunduğu Kat / Konum</th>
                  <th className="py-3 px-3 text-center">Kapasite</th>
                  <th className="py-3 px-4">Donanım & Donatılar</th>
                  <th className="py-3 px-3 text-center">Durum</th>
                  <th className="py-3 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sortedFacilities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Arama kriterlerine uygun mekân veya derslik bulunamadı.
                    </td>
                  </tr>
                ) : (
                  sortedFacilities.map((facility) => {
                    const isSelected = selectedFacilityIds.includes(facility.id);

                    return (
                      <tr
                        key={facility.id}
                        className={`transition ${
                          isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSingleSelect(facility.id)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                        </td>

                        {/* Name & Icon */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              {getFacilityIcon(facility.type)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 leading-snug">
                                {facility.name}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                ID: <span className="font-mono">{facility.id}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {facility.typeLabel}
                          </span>
                        </td>

                        {/* Floor */}
                        <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {facility.floor}
                          </span>
                        </td>

                        {/* Capacity with Meter */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono font-bold text-slate-900">
                              {facility.capacity} Koltuk
                            </span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${Math.min(100, (facility.capacity / 80) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Features Tags */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {facility.features.map((feat) => (
                              <span
                                key={feat}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200"
                              >
                                {feat}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              facility.status === 'active'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                facility.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                            />
                            {facility.status === 'active' ? 'Aktif' : 'Bakımda'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(facility)}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Mekân Bilgilerini Düzenle"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFacility(facility)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Mekânı Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Ribbon for Multi-Selected Facilities */}
      {selectedFacilityIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 max-w-3xl w-[92vw] animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
              {selectedFacilityIds.length}
            </div>
            <div>
              <div className="text-xs font-bold">
                {selectedFacilityIds.length} Derslik / Mekân Seçildi
              </div>
              <div className="text-[10px] text-slate-400">
                Toplu durum veya silme işlemi uygulayın
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkStatusChange('active')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Aktif Yap</span>
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatusChange('maintenance')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
            >
              <span>Bakıma Al</span>
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Sil</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedFacilityIds([])}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. DERS TAKVİMİ & OTURUM SAATLERİ KATALOĞU                           */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Ders Takvimi ve Oturum Saatleri Kataloğu</h2>
              <p className="text-[11px] text-slate-500">
                Yeni grup ve oturum oluştururken açılır menüde listelenen haftalık zaman şablonları.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            {schedules.length} Tanımlı Şablon
          </span>
        </div>

        {/* Ekleme Formu */}
        <form onSubmit={handleAddSchedule} className="flex gap-2 max-w-xl">
          <input
            type="text"
            placeholder="Örn: Salı & Cuma 14:00 - 17:00 (Hafta İçi Öğleden Sonra)"
            value={newScheduleInput}
            onChange={(e) => setNewScheduleInput(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Kataloğa Ekle</span>
          </button>
        </form>

        {/* Liste */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {schedules.map((sched) => (
            <div
              key={sched}
              className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs hover:border-slate-300 transition group"
            >
              <div className="flex items-center gap-2.5 text-slate-800 font-medium">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                <span>{sched}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveSchedule(sched)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition p-1"
                title="Şablonu Kaldır"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. DERSLİK OLUŞTURMA & DÜZENLEME MODALI                                */}
      {/* ===================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingFacility ? 'Derslik Bilgilerini Düzenle' : 'Yeni Derslik / Mekân Tanımla'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFacilitySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mekân / Derslik Adı *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Örn: İE Tasarım ve İnovasyon Atölyesi (Kat 3)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mekân Türü *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const val = e.target.value as FacilityRoom['type'];
                      setFormType(val);
                      switch (val) {
                        case 'classroom':
                          setFormTypeLabel('Teorik Derslik');
                          break;
                        case 'computer_lab':
                          setFormTypeLabel('Bilişim Laboratuvarı');
                          break;
                        case 'workshop':
                          setFormTypeLabel('Uygulama Atölyesi');
                          break;
                        case 'conference_hall':
                          setFormTypeLabel('Konferans Salonu');
                          break;
                        case 'online':
                          setFormTypeLabel('Çevrimiçi / Sanal');
                          break;
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="classroom">Teorik Derslik</option>
                    <option value="computer_lab">Bilişim Laboratuvarı</option>
                    <option value="workshop">Uygulama Atölyesi / Mutfak</option>
                    <option value="conference_hall">Konferans / Seminer Salonu</option>
                    <option value="online">Çevrimiçi / Canlı Sınıf</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bulunduğu Kat / Konum *
                  </label>
                  <input
                    type="text"
                    value={formFloor}
                    onChange={(e) => setFormFloor(e.target.value)}
                    placeholder="Örn: Kat 2, Zemin Kat, Atölye 1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kapasite / Kontenjan (Kişi) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Durum *
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as FacilityRoom['status'])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Aktif Kullanımda</option>
                    <option value="maintenance">Bakımda / Tadilatta</option>
                    <option value="inactive">Pasif</option>
                  </select>
                </div>
              </div>

              {/* Equipment Feature Tags */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Donanım ve Ekipman Özellikleri:
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Örn: Akıllı Tahta, Projeksiyon, Fiber Ağ"
                    value={newFeatureInput}
                    onChange={(e) => setNewFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition"
                  >
                    Ekle
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-7">
                  {formFeatures.map((feat) => (
                    <span
                      key={feat}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-800 border border-slate-200"
                    >
                      <span>{feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(feat)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition"
                >
                  {editingFacility ? 'Değişiklikleri Kaydet' : 'Dersliği Kataloğa Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Custom Confirm / Action Modal */}
      <ActionConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
      />
    </div>
  );
};
