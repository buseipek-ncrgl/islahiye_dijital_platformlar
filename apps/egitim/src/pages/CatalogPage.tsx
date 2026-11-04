import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Users,
  ArrowRight,
  SlidersHorizontal,
  RotateCcw,
  BookOpen,
  FileText,
  Monitor,
  Info,
  Clock,
  Award,
  CheckCircle2,
  Plus,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Program } from '../types';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import {
  fetchLivePrograms,
  saveCustomProgram,
  getInitialPrograms,
  updateCustomProgram,
  deleteCustomProgram,
} from '../services/programAdapter';
import { useDemoRole } from '../components/layout/DemoRoleContext';
import { playActionSound } from '../services/soundFx';

export const CatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCandidatePanel = location.pathname.startsWith('/aday');
  const isTraineePanel = location.pathname.startsWith('/kursiyer');
  const isPortalMode = isCandidatePanel || isTraineePanel || location.pathname.startsWith('/yonetim');

  const getProgramLink = (progId: string) => {
    if (isCandidatePanel) return `/aday/katalog/${progId}`;
    if (isTraineePanel) return `/kursiyer/katalog/${progId}`;
    return `/egitimler/${progId}`;
  };

  const getGuideLink = () => {
    if (isCandidatePanel) return '/aday/rehber';
    if (isTraineePanel) return '/kursiyer/dersler';
    return '/basvuru-rehberi';
  };

  // Programs from Live Database API (with instant sync fallback)
  const [programs, setPrograms] = useState<Program[]>(() => getInitialPrograms());
  const { currentUser } = useDemoRole();
  const canManageCatalog = currentUser?.role === 'admin' || currentUser?.role === 'superadmin' || isPortalMode;

  // Yeni Eğitim Ekleme Modalı
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Tarım ve E-Ticaret');
  const [newDescription, setNewDescription] = useState('');
  const [newAudience, setNewAudience] = useState('');
  const [newMode, setNewMode] = useState<'Yüz Yüze' | 'Çevrimiçi' | 'Hibrit'>('Yüz Yüze');
  const [newDurationWeeks, setNewDurationWeeks] = useState(8);
  const [newTotalHours, setNewTotalHours] = useState(32);
  const [newQuota, setNewQuota] = useState(25);
  const [newLocation, setNewLocation] = useState('İslahiye Ticaret Odası Eğitim Salonu');
  const [catalogSuccessMsg, setCatalogSuccessMsg] = useState<string | null>(null);

  const handleCreateProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const progId = `prog-custom-${Date.now()}`;
    const newProg: Program = {
      id: progId,
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim() || 'İslahiye Ticaret Odası tarafından düzenlenen mesleki eğitim programı.',
      targetAudience: newAudience.trim() || 'İslahiye bölgesindeki tüm üretici, esnaf ve girişimciler.',
      durationWeeks: newDurationWeeks,
      totalHours: newTotalHours,
      cohortName: '2026 Güz Dönemi',
      quota: newQuota,
      enrolledCount: 0,
      location: newLocation,
      mode: newMode,
      status: 'open',
      curriculumModules: [
        {
          sessionNumber: 1,
          title: 'Giriş ve Temel İlkeler',
          hours: Math.round(newTotalHours / 3),
          description: 'Eğitim kapsamı, metodoloji ve sektörel temeller.',
        },
        {
          sessionNumber: 2,
          title: 'Uygulamalı Atölye ve Vaka Analizi',
          hours: Math.round(newTotalHours / 3),
          description: 'Saha pratikleri ve uygulamalı modüller.',
        },
        {
          sessionNumber: 3,
          title: 'Son Değerlendirme ve Sertifikasyon',
          hours: Math.round(newTotalHours / 3),
          description: 'Bitirme projesi incelemesi ve başarı belgesi teslimi.',
        },
      ],
      certified: 'İTO Onaylı Başarı Sertifikası',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      level: 'Temel & Orta Düzey',
      term: '2026 Güz',
      durationMonths: `${Math.ceil(newDurationWeeks / 4)} Ay`,
      type: 'Uygulamalı Eğitim',
      highlights: ['Uygulamalı Müfredat', 'Karekodlu Belge', 'Sektörel Uzman Eğitmen'],
    };

    saveCustomProgram(newProg);
    setPrograms((prev) => [newProg, ...prev]);
    playActionSound();
    setShowAddModal(false);
    setCatalogSuccessMsg(`"${newProg.title}" başarıyla eğitim kataloğuna eklendi.`);
    setNewTitle('');
    setNewDescription('');
    setNewAudience('');
    setTimeout(() => setCatalogSuccessMsg(null), 4000);
  };

  // Program Düzenleme ve Silme Durumları
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [deleteConfirmProgram, setDeleteConfirmProgram] = useState<Program | null>(null);

  const openEditModal = (prog: Program) => {
    setEditingProgram({ ...prog });
  };

  const handleUpdateProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram || !editingProgram.title.trim()) return;

    updateCustomProgram(editingProgram);
    setPrograms((prev) => prev.map((p) => (p.id === editingProgram.id ? editingProgram : p)));
    playActionSound();
    setCatalogSuccessMsg(`"${editingProgram.title}" program bilgileri başarıyla güncellendi.`);
    setEditingProgram(null);
    setTimeout(() => setCatalogSuccessMsg(null), 4000);
  };

  const handleConfirmDeleteProgram = () => {
    if (!deleteConfirmProgram) return;

    deleteCustomProgram(deleteConfirmProgram.id);
    setPrograms((prev) => prev.filter((p) => p.id !== deleteConfirmProgram.id));
    playActionSound();
    setCatalogSuccessMsg(`"${deleteConfirmProgram.title}" eğitim kataloğundan kaldırıldı.`);
    setDeleteConfirmProgram(null);
    setTimeout(() => setCatalogSuccessMsg(null), 4000);
  };

  useEffect(() => {
    let mounted = true;
    fetchLivePrograms().then((data) => {
      if (mounted) {
        setPrograms(data);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('Tümü');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>('Tümü');
  const [sortBy, setSortBy] = useState<string>('Önerilen');

  // Modals
  const [inspectProgram, setInspectProgram] = useState<Program | null>(null);

  // Horizontal Quick Tabs (Mockup ile birebir)
  const categoryTabs = [
    'Tümü',
    'Tarım ve E-Ticaret',
    'Dış Ticaret',
    'Dijital Beceriler',
    'Girişimcilik ve İşletme',
    'El Sanatları',
  ];

  // Filter Checkbox Handlers
  const handleAreaToggle = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleModeToggle = (mode: string) => {
    setSelectedModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategoryTab('Tümü');
    setSelectedAreas([]);
    setSelectedModes([]);
    setSelectedTerm('Tümü');
  };

  // Filter Logic
  const filteredPrograms = useMemo(() => {
    return programs.filter((prog) => {
      // 1. Text Search Match
      const matchesSearch =
        !searchTerm.trim() ||
        prog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prog.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prog.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prog.targetAudience.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Horizontal Tab Match
      const matchesTab =
        selectedCategoryTab === 'Tümü' || prog.category === selectedCategoryTab;

      // 3. Sidebar Areas (Checkbox Match)
      const matchesArea =
        selectedAreas.length === 0 || selectedAreas.includes(prog.category);

      // 4. Sidebar Modes (Checkbox Match)
      const matchesMode =
        selectedModes.length === 0 ||
        selectedModes.some((mode) => {
          if (mode === 'Yüz yüze') return prog.mode === 'Yüz Yüze';
          if (mode === 'Hibrit (Çevrim içi + Yüz yüze)') return prog.mode === 'Hibrit';
          return true;
        });

      // 5. Term Match
      const matchesTerm =
        selectedTerm === 'Tümü' || prog.cohortName.includes(selectedTerm);

      return matchesSearch && matchesTab && matchesArea && matchesMode && matchesTerm;
    }).sort((a, b) => {
      if (sortBy === 'Süreye Göre') return b.durationWeeks - a.durationWeeks;
      if (sortBy === 'Kontenjan') return b.quota - a.quota;
      return 0; // Default Önerilen
    });
  }, [
    programs,
    searchTerm,
    selectedCategoryTab,
    selectedAreas,
    selectedModes,
    selectedTerm,
    sortBy,
  ]);

  const activeFiltersCount =
    (selectedCategoryTab !== 'Tümü' ? 1 : 0) +
    selectedAreas.length +
    selectedModes.length +
    (selectedTerm !== 'Tümü' ? 1 : 0) +
    (searchTerm ? 1 : 0);

  return (
    <div className={`max-w-7xl mx-auto space-y-6 pb-12 ${isPortalMode ? '' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
      
      {/* 1. BREADCRUMB NAVIGATION (Yalnızca Kamusal Görünümde) */}
      {!isPortalMode && (
        <nav className="flex items-center gap-2 text-xs text-slate-500" aria-label="Sayfa Konumu">
          <Link to="/" className="hover:text-blue-600 transition-colors">Ana Sayfa</Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-800 font-medium">Eğitimler</span>
        </nav>
      )}

      {/* 2. CATALOG HEADER: Kurumsal Standart Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Eğitim Programları Kataloğu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            İslahiye Ticaret Odası bünyesinde sunulan mesleki, dijital ve sektörel eğitim programları.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {canManageCatalog && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-2xs whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Yeni Eğitim Ekle</span>
            </button>
          )}

          {isTraineePanel ? (
            <>
              <Link
                to="/kursiyer/dersler"
                className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-2xs whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Derslerime Git</span>
              </Link>
              <Link
                to="/kursiyer"
                className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs whitespace-nowrap"
              >
                <span>Panoya Dön →</span>
              </Link>
            </>
          ) : isCandidatePanel ? (
            <Link
              to="/aday"
              className="h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs whitespace-nowrap"
            >
              <span>Aday Paneline Dön →</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2.5 bg-blue-50/70 border border-blue-100 rounded-xl px-4 py-2 text-xs text-blue-900 shrink-0">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-medium">Tüm eğitim programları ücretsiz sunulmaktadır.</span>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. PROMINENT FULL-WIDTH SEARCH BAR                                    */}
      {/* ===================================================================== */}
      <div className="relative flex items-center bg-white rounded-2xl border border-slate-200/90 shadow-xs focus-within:border-blue-600 focus-within:ring-3 focus-within:ring-blue-100 transition-all p-1.5 sm:p-2">
        <Search className="w-5 h-5 ml-3 sm:ml-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Eğitim veya konu ara (örn. e-ticaret, dış ticaret, tarım...)"
          className="w-full py-2.5 sm:py-3 px-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="mr-2 text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
          >
            Temizle
          </button>
        )}
        <button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl flex items-center gap-2 transition-colors shrink-0 shadow-xs cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span>Ara</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* 4. TWO-COLUMN MAIN CONTENT: Left Filters + Right Program Cards         */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* ------------------------------------------------------------------- */}
        {/* LEFT COLUMN: FILTERS SIDEBAR (Filtrele)                             */}
        {/* ------------------------------------------------------------------- */}
        <aside className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-6">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base pb-3 border-b border-slate-100">
            <SlidersHorizontal className="w-4 h-4 text-slate-600" />
            <span>Filtrele</span>
            {activeFiltersCount > 0 && (
              <span className="ml-auto text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </div>

          {/* Filter 1: Eğitim Alanı */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Eğitim Alanı
            </h4>
            <div className="space-y-2.5 text-xs text-slate-600">
              {[
                'Tarım ve E-Ticaret',
                'Dış Ticaret',
                'Dijital Beceriler',
                'Girişimcilik ve İşletme',
                'El Sanatları',
              ].map((area) => (
                <label
                  key={area}
                  className="flex items-center gap-2.5 cursor-pointer hover:text-slate-900 select-none"
                >
                  <input
                    type="checkbox"
                    checked={selectedAreas.includes(area)}
                    onChange={() => handleAreaToggle(area)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>{area}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Filter 2: Eğitim Biçimi */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Eğitim Biçimi
            </h4>
            <div className="space-y-2.5 text-xs text-slate-600">
              {['Yüz yüze', 'Hibrit (Çevrim içi + Yüz yüze)'].map((mode) => (
                <label
                  key={mode}
                  className="flex items-center gap-2.5 cursor-pointer hover:text-slate-900 select-none"
                >
                  <input
                    type="checkbox"
                    checked={selectedModes.includes(mode)}
                    onChange={() => handleModeToggle(mode)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>{mode}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Filter 3: Dönem */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Dönem
            </h4>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Tümü">Tümü</option>
              <option value="2026 Güz">2026 Güz Dönemi</option>
              <option value="2027 Bahar">2027 Bahar Dönemi</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl py-2.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Filtreleri Temizle</span>
          </button>
        </aside>

        {/* ------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: PROGRAM CARDS & HORIZONTAL FILTER TABS                */}
        {/* ------------------------------------------------------------------- */}
        <main className="lg:col-span-3 space-y-6">
          
          {/* Header Row: Title & Sorting */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Eğitim programları
            </h2>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-medium">Sıralama:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs text-slate-800 font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="Önerilen">Önerilen</option>
                <option value="Süreye Göre">Süreye Göre (Uzun &gt; Kısa)</option>
                <option value="Kontenjan">Kontenjana Göre</option>
              </select>
            </div>
          </div>

          {/* Horizontal Category Tabs (Pills) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
            {categoryTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedCategoryTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategoryTab === tab
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Cards List */}
          {filteredPrograms.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-800 font-bold text-sm sm:text-base">
                  Seçilen filtrelere uygun eğitim programı bulunamadı
                </p>
                <p className="text-xs text-slate-500 max-w-md">
                  Farklı bir arama terimi deneyebilir veya aktif filtreleri sıfırlayarak tüm eğitim listesini görüntüleyebilirsiniz.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 h-9 px-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                <span>Tüm Filtreleri Temizle</span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredPrograms.map((prog) => (
                <div
                  key={prog.id}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-all p-5 sm:p-6 flex flex-col md:flex-row gap-5 lg:gap-6 items-stretch group"
                >
                  {/* Left: Program Image */}
                  <div className="w-full md:w-56 lg:w-60 h-48 md:h-auto rounded-xl overflow-hidden shrink-0 relative bg-slate-100">
                    <img
                      src={prog.image || '/images/prog_islahiye_biber.jpg'}
                      alt={prog.title}
                      className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                    />
                  </div>

                  {/* Center: Program Info */}
                  <div className="flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Category Badge & Duration Pill */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${
                            prog.badgeColor || 'bg-blue-50 text-blue-700 border-blue-100'
                          }`}
                        >
                          {prog.category}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {prog.durationMonths || `${prog.durationWeeks} Hafta`} • {prog.mode}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          Ücretsiz (İE Desteği)
                        </span>
                        {prog.quota && (
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                            Kontenjan: {prog.quota} Kişi
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                        <Link to={getProgramLink(prog.id)}>
                          {prog.title}
                        </Link>
                      </h3>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1.5 line-clamp-2">
                        {prog.description}
                      </p>

                      {/* Details: Hedef Kitle & Müfredat Notu */}
                      <div className="pt-3 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-start gap-2">
                          <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-800">Hedef Kitle: </strong>
                            <span>{prog.targetAudience}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setInspectProgram(prog)}
                          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-[11px] text-left transition-colors cursor-pointer group/syl"
                        >
                          <FileText className="w-4 h-4 text-slate-400 group-hover/syl:text-blue-500 shrink-0" />
                          <span className="group-hover/syl:underline">Program detayında müfredatı inceleyin.</span>
                        </button>
                      </div>
                    </div>

                    {/* Mobile Only: Bottom Actions */}
                    <div className="pt-2 flex flex-col gap-2 border-t border-slate-100 md:hidden">
                      <div className="flex items-center justify-between">
                        <Link
                          to={getProgramLink(prog.id)}
                          className="text-xs font-semibold text-blue-600 inline-flex items-center gap-1"
                        >
                          <span>Programı İncele</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => navigate(`/aday/basvuru/${prog.id}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                        >
                          Ön Başvuru
                        </button>
                      </div>
                      {canManageCatalog && (
                        <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => openEditModal(prog)}
                            className="flex-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-lg transition inline-flex items-center justify-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Düzenle</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmProgram(prog)}
                            className="text-xs font-semibold text-rose-600 hover:bg-rose-50 py-1.5 px-3 rounded-lg transition inline-flex items-center justify-center gap-1 border border-rose-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Sil</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column (Desktop): Action Buttons */}
                  <div className="hidden md:flex flex-col items-center justify-center shrink-0 pl-5 border-l border-slate-100 min-w-[155px] space-y-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/aday/basvuru/${prog.id}`)}
                      className="w-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-2.5 rounded-xl transition shadow-xs cursor-pointer text-center"
                    >
                      Ön Başvuru Yap
                    </button>
                    <Link
                      to={getProgramLink(prog.id)}
                      className="text-xs font-semibold text-slate-700 hover:text-blue-600 inline-flex items-center gap-1 transition"
                    >
                      <span>Programı İncele</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {canManageCatalog && (
                      <div className="flex items-center gap-1.5 w-full pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => openEditModal(prog)}
                          className="flex-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 py-1.5 px-2 rounded-lg transition inline-flex items-center justify-center gap-1 cursor-pointer"
                          title="Program Bilgilerini Düzenle"
                        >
                          <Edit2 className="w-3 h-3 text-slate-500" />
                          <span>Düzenle</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmProgram(prog)}
                          className="text-[11px] font-semibold text-rose-600 hover:bg-rose-50 py-1.5 px-2 rounded-lg transition inline-flex items-center justify-center gap-1 cursor-pointer border border-transparent hover:border-rose-200"
                          title="Eğitim Programını Sil"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Sil</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>

      {/* ===================================================================== */}
      {/* 5. BOTTOM 3-STEP GUIDE BANNER: "Başvuru yapmadan önce"                */}
      {/* ===================================================================== */}
      <section className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              ADIM ADIM
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              Başvuru yapmadan önce
            </h2>
          </div>

          <Link
            to={getGuideLink()}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors group"
          >
            <span>Başvuru Rehberine Git</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 3 Step Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          
          {/* Step 1 */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
              1
            </div>
            <div className="space-y-1">
              <div className="w-8 h-8 rounded-lg bg-blue-100/50 text-blue-600 flex items-center justify-center mb-2">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Programı inceleyin
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                İlgi alanınıza uygun eğitim programlarını ve içeriklerini detaylı olarak inceleyin.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
              2
            </div>
            <div className="space-y-1">
              <div className="w-8 h-8 rounded-lg bg-blue-100/50 text-blue-600 flex items-center justify-center mb-2">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Başvuru koşullarını öğrenin
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Her program için gerekli şartları, belgeleri ve başvuru tarihlerini kontrol edin.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
              3
            </div>
            <div className="space-y-1">
              <div className="w-8 h-8 rounded-lg bg-blue-100/50 text-blue-600 flex items-center justify-center mb-2">
                <Monitor className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Başvurunuzu takip edin
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Başvuru sonrasında sürecinizi panelinizden kolayca takip edin.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ===================================================================== */}
      {/* 6. INTERACTIVE MODAL: Hızlı Müfredat ve Detay İnceleme                */}
      {/* ===================================================================== */}
      {inspectProgram && (
        <Modal
          isOpen={Boolean(inspectProgram)}
          onClose={() => setInspectProgram(null)}
          title={inspectProgram.title}
          description={`${inspectProgram.cohortName} • ${inspectProgram.durationMonths || `${inspectProgram.durationWeeks} Hafta`} (${inspectProgram.totalHours} Saat) • ${inspectProgram.mode}`}
          maxWidth="max-w-2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <Link
                to={getProgramLink(inspectProgram.id)}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Tam Program Detay Sayfasına Git →
              </Link>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setInspectProgram(null)}>
                  Kapat
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const p = inspectProgram;
                    setInspectProgram(null);
                    if (p) navigate(`/aday/basvuru/${p.id}`);
                  }}
                >
                  Ön Başvuru Yap
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1">
              <strong className="text-slate-800 block">Hedef Kitle:</strong>
              <p>{inspectProgram.targetAudience}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <strong className="text-slate-800 text-sm">
                  Oturum Müfredatı ({inspectProgram.curriculumModules.length} Oturum)
                </strong>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Toplam {inspectProgram.totalHours} Saat
                </span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {inspectProgram.curriculumModules.map((mod) => (
                  <div key={mod.sessionNumber} className="p-3 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
                    <div className="flex justify-between font-bold text-slate-800 mb-0.5">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        Oturum {mod.sessionNumber}: {mod.title}
                      </span>
                      <span className="text-blue-600 font-semibold">{mod.hours} Saat</span>
                    </div>
                    <p className="text-slate-500 text-[11px] pl-5">{mod.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg text-blue-800 text-[11px]">
              <Award className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Programı başarıyla tamamlayan kursiyerlere İE onaylı karekodlu katılım belgesi verilir.</span>
            </div>
          </div>
        </Modal>
      )}

      {/* YENİ EĞİTİM PROGRAMI EKLEME MODALI (Yönetici & SuperAdmin Yetkili) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base">Kataloğa Yeni Eğitim Programı Tanımla</h3>
                <p className="text-xs text-slate-300 mt-0.5">Program adı, kategori, kontenjan ve oturum parametreleri</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Eğitim Programı Adı *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Örn: İslahiye Biberinde İleri Kurutma & Kalite Standardı"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Kategori / Sektör *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-800"
                  >
                    <option value="Tarım ve E-Ticaret">Tarım ve E-Ticaret</option>
                    <option value="Gastronomi">Gastronomi & Mutfak Sanatları</option>
                    <option value="Dış Ticaret">Dış Ticaret & İhracat</option>
                    <option value="Dijital Beceriler">Dijital Beceriler & Teknoloji</option>
                    <option value="Girişimcilik ve İşletme">Girişimcilik ve İşletme</option>
                    <option value="El Sanatları">El Sanatları & Tasarım</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Uygulama Modu *</label>
                  <select
                    value={newMode}
                    onChange={(e) => setNewMode(e.target.value as any)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-800"
                  >
                    <option value="Yüz Yüze">Yüz Yüze</option>
                    <option value="Hibrit">Hibrit</option>
                    <option value="Çevrimiçi">Çevrimiçi (Online)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Program Özeti ve Amacı *</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  placeholder="Eğitimin temel kazanımları ve sektörel çıktısı..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Hedef Kitle ve Ön Koşul</label>
                <input
                  type="text"
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value)}
                  placeholder="Örn: İslahiye bölgesinde tarımsal üretim veya paketleme yapan üreticiler"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Süre (Hafta)</label>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={newDurationWeeks}
                    onChange={(e) => setNewDurationWeeks(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Toplam Saat</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={newTotalHours}
                    onChange={(e) => setNewTotalHours(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Kontenjan (Kişi)</label>
                  <input
                    type="number"
                    min={1}
                    max={250}
                    value={newQuota}
                    onChange={(e) => setNewQuota(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Eğitim Mekânı / Derslik</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs cursor-pointer"
                >
                  Kataloğa Kaydet ve Yayımla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Program Düzenleme Modalı */}
      {editingProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Eğitim Programını Düzenle</h3>
                  <p className="text-[11px] text-slate-500 font-mono">ID: {editingProgram.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProgram(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProgram} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Eğitim Başlığı *</label>
                <input
                  type="text"
                  required
                  value={editingProgram.title}
                  onChange={(e) => setEditingProgram({ ...editingProgram, title: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Kategori *</label>
                  <select
                    value={editingProgram.category}
                    onChange={(e) => setEditingProgram({ ...editingProgram, category: e.target.value as any })}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-800"
                  >
                    <option value="Tarım ve E-Ticaret">Tarım ve E-Ticaret</option>
                    <option value="Gastronomi">Gastronomi</option>
                    <option value="Dış Ticaret">Dış Ticaret</option>
                    <option value="Girişimcilik ve İşletme">Girişimcilik ve İşletme</option>
                    <option value="Bilişim ve Dijital Beceriler">Bilişim ve Dijital Beceriler</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Uygulama Modu *</label>
                  <select
                    value={editingProgram.mode || 'Yüz Yüze'}
                    onChange={(e) => setEditingProgram({ ...editingProgram, mode: e.target.value as any })}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-800"
                  >
                    <option value="Yüz Yüze">Yüz Yüze</option>
                    <option value="Hibrit">Hibrit</option>
                    <option value="Çevrimiçi">Çevrimiçi (Online)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Program Özeti ve Amacı *</label>
                <textarea
                  value={editingProgram.description}
                  onChange={(e) => setEditingProgram({ ...editingProgram, description: e.target.value })}
                  rows={2}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Hedef Kitle</label>
                <input
                  type="text"
                  value={editingProgram.targetAudience}
                  onChange={(e) => setEditingProgram({ ...editingProgram, targetAudience: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Süre (Hafta)</label>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={editingProgram.durationWeeks}
                    onChange={(e) => setEditingProgram({ ...editingProgram, durationWeeks: Number(e.target.value) })}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Toplam Saat</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={editingProgram.totalHours}
                    onChange={(e) => setEditingProgram({ ...editingProgram, totalHours: Number(e.target.value) })}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Kontenjan</label>
                  <input
                    type="number"
                    min={1}
                    max={250}
                    value={editingProgram.quota || 25}
                    onChange={(e) => setEditingProgram({ ...editingProgram, quota: Number(e.target.value) })}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Eğitim Mekânı / Derslik</label>
                <input
                  type="text"
                  value={editingProgram.location || ''}
                  onChange={(e) => setEditingProgram({ ...editingProgram, location: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingProgram(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-xs cursor-pointer"
                >
                  Güncellemeleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Program Silme Onay Modalı */}
      {deleteConfirmProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                </div>
                <span>Eğitim Programını Sil</span>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirmProgram(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>"{deleteConfirmProgram.title}"</strong> başlıklı eğitim programını kataloğunuzdan silmek istediğinizden emin misiniz? Bu programa ait geçmiş kayıtlar arşivlenecektir.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmProgram(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProgram}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white shadow-2xs transition cursor-pointer"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {catalogSuccessMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{catalogSuccessMsg}</span>
        </div>
      )}

    </div>
  );
};
