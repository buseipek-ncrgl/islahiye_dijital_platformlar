import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { DEMO_PROGRAMS } from '../data/educationData';
import { Program } from '../types';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

export const CatalogPage: React.FC = () => {
  const navigate = useNavigate();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('Tümü');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>('Tümü');
  const [sortBy, setSortBy] = useState<string>('Önerilen');

  // Modals
  const [inspectProgram, setInspectProgram] = useState<Program | null>(null);
  const [applyModalProgram, setApplyModalProgram] = useState<Program | null>(null);

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
    return DEMO_PROGRAMS.filter((prog) => {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* ===================================================================== */}
      {/* 1. BREADCRUMB NAVIGATION                                              */}
      {/* ===================================================================== */}
      <nav className="flex items-center gap-2 text-xs text-slate-500" aria-label="Sayfa Konumu">
        <Link to="/" className="hover:text-blue-600 transition-colors">Ana Sayfa</Link>
        <span className="text-slate-400">/</span>
        <span className="text-slate-800 font-medium">Eğitimler</span>
      </nav>

      {/* ===================================================================== */}
      {/* 2. CATALOG HEADER: Overline, Headline & Right Simulation Badge        */}
      {/* ===================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div className="space-y-1.5">
          <div className="text-xs font-bold text-slate-500 tracking-wider uppercase">
            EĞİTİM KATALOĞU
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Size uygun eğitimi <span className="text-blue-600">keşfedin</span>
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Mesleki gelişiminiz için hazırlanan örnek eğitim programlarını inceleyin.
          </p>
        </div>

        {/* Official Simulation Badge (Kalıcı Proje Kuralı) */}
        <div className="flex items-center gap-3 bg-blue-50/70 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-900 max-w-md shadow-xs shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-100/80 flex items-center justify-center shrink-0 text-blue-600">
            <Info className="w-4 h-4" />
          </div>
          <p className="leading-snug">
            Bu sayfadaki programlar temsilî demo içerikleridir; resmî başvuru duyurusu değildir.
          </p>
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
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center space-y-3">
              <p className="text-slate-700 font-bold text-base">
                Seçilen filtrelere uygun eğitim programı bulunamadı.
              </p>
              <p className="text-xs text-slate-500">
                Farklı anahtar kelimeler deneyebilir veya filtreleri temizleyebilirsiniz.
              </p>
              <Button size="sm" variant="outline" onClick={handleResetFilters}>
                Filtreleri Sıfırla
              </Button>
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
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                        <Link to={`/egitimler/${prog.id}`}>
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
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 md:hidden">
                      <Link
                        to={`/egitimler/${prog.id}`}
                        className="text-xs font-semibold text-blue-600 inline-flex items-center gap-1"
                      >
                        <span>Programı İncele</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => setApplyModalProgram(prog)}
                        className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                      >
                        Ön Başvuru
                      </button>
                    </div>
                  </div>

                  {/* Right Column (Desktop): Circle Arrow & Link */}
                  <div className="hidden md:flex flex-col items-center justify-center shrink-0 pl-4 border-l border-slate-100 min-w-[130px] space-y-2">
                    <Link
                      to={`/egitimler/${prog.id}`}
                      className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs"
                      title="Programı İncele"
                    >
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    <Link
                      to={`/egitimler/${prog.id}`}
                      className="text-xs font-semibold text-blue-600 group-hover:underline text-center"
                    >
                      Programı İncele
                    </Link>
                    <button
                      type="button"
                      onClick={() => setApplyModalProgram(prog)}
                      className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer mt-1"
                    >
                      Hızlı Başvuru
                    </button>
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
            to="/basvuru-rehberi"
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
                to={`/egitimler/${inspectProgram.id}`}
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
                    setApplyModalProgram(p);
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

      {/* ===================================================================== */}
      {/* 7. INTERACTIVE MODAL: Demo Ön Başvuru Bilgilendirme                   */}
      {/* ===================================================================== */}
      {applyModalProgram && (
        <Modal
          isOpen={Boolean(applyModalProgram)}
          onClose={() => setApplyModalProgram(null)}
          title="Ön Başvuru Süreci Bilgilendirmesi"
          description={applyModalProgram.title}
          maxWidth="max-w-md"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setApplyModalProgram(null);
                  navigate('/basvuru-rehberi');
                }}
              >
                Rehberi Gör
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setApplyModalProgram(null)}>
                  Kapat
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const id = applyModalProgram.id;
                    setApplyModalProgram(null);
                    navigate(`/aday/basvuru/${id}`);
                  }}
                >
                  Başvuru Formuna Git →
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <p>
              Bu eğitim programı <strong>2026 Güz Dönemi</strong> ön başvuru aşamasındadır.
            </p>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
              <strong>Şeffaflık ve Simülasyon Notu:</strong>
              <p className="text-[11px]">
                Bu ekran bir arayüz demo simülasyonudur. Sistemde adayın kriter puanı hesaplanır; kesin kabul kararı yetkili yönetici tarafından verilir.
              </p>
            </div>
            <p>
              Tüm koşulları, başarı kriterlerini ve başvuru takvimini incelemek için Başvuru Rehberi sayfamıza yönelebilirsiniz.
            </p>
          </div>
        </Modal>
      )}

    </div>
  );
};
