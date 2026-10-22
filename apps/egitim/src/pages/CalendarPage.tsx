import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  User,
  Search,
  SlidersHorizontal,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Info,
  Sprout,
  Handshake,
  Monitor,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

// Etkinlik tipi tanımı
export interface CalendarEvent {
  id: string;
  day: number;
  month: string; // 'Eki', 'Kas'
  year: number;
  dateStr: string; // '14 Ekim 2026'
  startTime: string;
  endTime: string;
  title: string;
  category: string; // 'Tarım ve E-Ticaret', 'Dış Ticaret', 'Girişimcilik ve İşletme'
  type: 'Eğitim' | 'Seminer' | 'Atölye' | 'Bilgilendirme';
  mode: 'Yüz yüze' | 'Online' | 'Hibrit';
  location: string;
  instructor: string;
  description: string;
  colorType: 'green' | 'amber' | 'purple' | 'blue' | 'red';
  iconType: 'sprout' | 'handshake' | 'users' | 'monitor';
}

export const CalendarPage: React.FC = () => {
  // Filter States
  const [selectedArea, setSelectedArea] = useState<string>('Tümü');
  const [selectedType, setSelectedType] = useState<string>('Tümü');
  const [selectedMode, setSelectedMode] = useState<string>('Tümü');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'Gün' | 'Hafta' | 'Ay' | 'Liste'>('Gün');

  // Calendar Date State (Default: 14 Ekim 2026)
  const [selectedDay, setSelectedDay] = useState<number>(14);
  const [selectedMonth] = useState<string>('Ekim 2026');

  // Modal State
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null);

  // Ekim 2026 Sabit Demo Etkinlik Havuzu
  const allEvents: CalendarEvent[] = useMemo(
    () => [
      {
        id: 'ev-1',
        day: 1,
        month: 'Eki',
        year: 2026,
        dateStr: '1 Ekim 2026',
        startTime: '10:00',
        endTime: '12:00',
        title: 'Yöresel Ürünlerde Coğrafi İşaret Açılış Dersi',
        category: 'Tarım ve E-Ticaret',
        type: 'Eğitim',
        mode: 'Yüz yüze',
        location: 'İE Eğitim Merkezi',
        instructor: 'Dr. Ayşe Demir',
        description: 'Tescilli İslahiye biberinin pazar avantajları ve ürün standardizasyonu ders oturumu.',
        colorType: 'green',
        iconType: 'sprout',
      },
      {
        id: 'ev-2',
        day: 2,
        month: 'Eki',
        year: 2026,
        dateStr: '2 Ekim 2026',
        startTime: '14:00',
        endTime: '16:00',
        title: 'Bölgesel Lojistik ve İhracat Fırsatları',
        category: 'Dış Ticaret',
        type: 'Seminer',
        mode: 'Hibrit',
        location: 'İE Konferans Salonu',
        instructor: 'Mehmet Kaya',
        description: 'Ortadoğu ve sınır kapıları gümrük lojistiği bilgilendirme semineri.',
        colorType: 'amber',
        iconType: 'handshake',
      },
      {
        id: 'ev-13',
        day: 13,
        month: 'Eki',
        year: 2026,
        dateStr: '13 Ekim 2026',
        startTime: '11:00',
        endTime: '12:30',
        title: '2026 Güz Dönemi Başvuru Danışma Saati',
        category: 'Dijital Beceriler',
        type: 'Bilgilendirme',
        mode: 'Online',
        location: 'Online (Zoom)',
        instructor: 'İE Danışma Masası',
        description: 'Aday kursiyerlerin başvuru evrakları ve süreçler hakkındaki sorularının yanıtlanması.',
        colorType: 'purple',
        iconType: 'monitor',
      },
      {
        id: 'ev-14-1',
        day: 14,
        month: 'Eki',
        year: 2026,
        dateStr: '14 Ekim 2026',
        startTime: '10:00',
        endTime: '12:00',
        title: 'Tarımsal Ürünlerde Dijital Pazarlama Atölyesi',
        category: 'Tarım ve E-Ticaret',
        type: 'Eğitim',
        mode: 'Yüz yüze',
        location: 'İE Eğitim Merkezi',
        instructor: 'Dr. Ayşe Demir',
        description: 'Yerel üreticiler için dijital pazarlama stratejileri ve e-ticaret uygulamaları.',
        colorType: 'green',
        iconType: 'sprout',
      },
      {
        id: 'ev-14-2',
        day: 14,
        month: 'Eki',
        year: 2026,
        dateStr: '14 Ekim 2026',
        startTime: '13:30',
        endTime: '15:30',
        title: 'İhracat Süreçlerinde Temel Adımlar',
        category: 'Dış Ticaret',
        type: 'Seminer',
        mode: 'Online',
        location: 'Online (Canlı)',
        instructor: 'Mehmet Kaya',
        description: 'İhracat mevzuatı, pazar araştırması ve uluslararası pazarlara giriş sürecine ilişkin temel bilgiler.',
        colorType: 'amber',
        iconType: 'handshake',
      },
      {
        id: 'ev-14-3',
        day: 14,
        month: 'Eki',
        year: 2026,
        dateStr: '14 Ekim 2026',
        startTime: '16:00',
        endTime: '17:00',
        title: 'Kadın Girişimciler İçin Destek Programları Bilgilendirme Toplantısı',
        category: 'Girişimcilik ve İşletme',
        type: 'Bilgilendirme',
        mode: 'Yüz yüze',
        location: 'İE Konferans Salonu',
        instructor: 'Zeynep Arslan',
        description: 'Kadın girişimcilere yönelik mevcut destek programları, başvuru süreçleri ve finansman imkanları.',
        colorType: 'purple',
        iconType: 'users',
      },
      {
        id: 'ev-15',
        day: 15,
        month: 'Eki',
        year: 2026,
        dateStr: '15 Ekim 2026',
        startTime: '14:00',
        endTime: '16:00',
        title: 'KOBİ Dijitalleşme Hibe ve Fonları',
        category: 'Girişimcilik ve İşletme',
        type: 'Bilgilendirme',
        mode: 'Online',
        location: 'Online (Canlı)',
        instructor: 'Zeynep Arslan',
        description: 'KOSGEB ve kalkınma ajansı desteklerinin incelenmesi.',
        colorType: 'purple',
        iconType: 'monitor',
      },
      {
        id: 'ev-16',
        day: 16,
        month: 'Eki',
        year: 2026,
        dateStr: '16 Ekim 2026',
        startTime: '10:00',
        endTime: '13:00',
        title: 'E-Ticaret Fotoğrafçılığı ve Görsel Düzenleme',
        category: 'Tarım ve E-Ticaret',
        type: 'Atölye',
        mode: 'Yüz yüze',
        location: 'İE Mutfak & Zanaat Atölyesi',
        instructor: 'Murat Özkan',
        description: 'Ürün çekim çadırı, ışık ve akıllı telefonla e-ticaret fotoğrafçılığı pratiği.',
        colorType: 'green',
        iconType: 'sprout',
      },
      {
        id: 'ev-20',
        day: 20,
        month: 'Eki',
        year: 2026,
        dateStr: '20 Ekim 2026',
        startTime: '15:00',
        endTime: '17:00',
        title: 'E-İhracat ve Mikro İhracat Mevzuatı',
        category: 'Dış Ticaret',
        type: 'Seminer',
        mode: 'Hibrit',
        location: 'İE Konferans Salonu',
        instructor: 'Mehmet Kaya',
        description: 'ETGB kapsamında hızlı kargo ile yurt dışına satış ve KDV iadesi.',
        colorType: 'amber',
        iconType: 'handshake',
      },
      {
        id: 'ev-21',
        day: 21,
        month: 'Eki',
        year: 2026,
        dateStr: '21 Ekim 2026',
        startTime: '10:00',
        endTime: '14:00',
        title: 'Dış Ticaret Temel Eğitimi',
        category: 'Dış Ticaret',
        type: 'Eğitim',
        mode: 'Online',
        location: 'Online (2 Gün)',
        instructor: 'Mehmet Kaya',
        description: 'İhracat süreçleri, Incoterms ve gümrük evrak hazırlığı.',
        colorType: 'blue',
        iconType: 'monitor',
      },
      {
        id: 'ev-23',
        day: 23,
        month: 'Eki',
        year: 2026,
        dateStr: '23 Ekim 2026',
        startTime: '14:00',
        endTime: '16:00',
        title: 'Pazaryeri Komisyonları ve Fiyatlandırma',
        category: 'Tarım ve E-Ticaret',
        type: 'Seminer',
        mode: 'Yüz yüze',
        location: 'İE Eğitim Merkezi',
        instructor: 'Murat Özkan',
        description: 'Komisyon oranları, kargo maliyetleri ve kârlılık formülleri.',
        colorType: 'amber',
        iconType: 'handshake',
      },
      {
        id: 'ev-27',
        day: 27,
        month: 'Eki',
        year: 2026,
        dateStr: '27 Ekim 2026',
        startTime: '13:00',
        endTime: '17:00',
        title: 'Uygulamalı Mağaza Entegrasyon Simülasyonu',
        category: 'Tarım ve E-Ticaret',
        type: 'Eğitim',
        mode: 'Yüz yüze',
        location: 'İE Bilgisayar Laboratuvarı',
        instructor: 'Dr. Ayşe Demir',
        description: 'Canlı pazaryeri paneli üzerinden ürün yükleme ve barkod basımı.',
        colorType: 'green',
        iconType: 'sprout',
      },
      {
        id: 'ev-28',
        day: 28,
        month: 'Eki',
        year: 2026,
        dateStr: '28 Ekim 2026',
        startTime: '10:00',
        endTime: '13:00',
        title: 'Dijital Okuryazarlık Atölyesi',
        category: 'Dijital Beceriler',
        type: 'Atölye',
        mode: 'Yüz yüze',
        location: 'İE Eğitim Merkezi',
        instructor: 'Selin Aydın',
        description: 'Ofis programları, e-posta güvenliği ve dijital iş araçları.',
        colorType: 'green',
        iconType: 'monitor',
      },
    ],
    []
  );

  // Günlere göre etkinlik noktaları haritası
  const eventsByDay = useMemo(() => {
    const map: Record<number, Array<'green' | 'amber' | 'purple' | 'blue' | 'red'>> = {};
    allEvents.forEach((ev) => {
      if (!map[ev.day]) map[ev.day] = [];
      if (!map[ev.day].includes(ev.colorType)) {
        map[ev.day].push(ev.colorType);
      }
    });
    return map;
  }, [allEvents]);

  // Filtreleme mantığı
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      const matchSearch =
        !searchTerm.trim() ||
        ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.instructor.toLowerCase().includes(searchTerm.toLowerCase());

      const matchArea = selectedArea === 'Tümü' || ev.category === selectedArea;
      const matchType = selectedType === 'Tümü' || ev.type === selectedType;
      const matchMode = selectedMode === 'Tümü' || ev.mode === selectedMode;

      return matchSearch && matchArea && matchType && matchMode;
    });
  }, [allEvents, searchTerm, selectedArea, selectedType, selectedMode]);

  // Seçili güne ait etkinlikler
  const selectedDayEvents = useMemo(() => {
    return filteredEvents.filter((ev) => ev.day === selectedDay);
  }, [filteredEvents, selectedDay]);

  const handleResetFilters = () => {
    setSelectedArea('Tümü');
    setSelectedType('Tümü');
    setSelectedMode('Tümü');
    setSearchTerm('');
  };

  // 4 Adet Yaklaşan Etkinlik (Alt Şerit İçin)
  const upcomingStrip = [
    {
      dateNum: '21',
      dateMonth: 'Eki',
      title: 'Dış Ticaret Temel Eğitimi',
      loc: 'Online',
      dur: '2 Gün',
      badge: 'Eğitim',
      badgeStyle: 'bg-blue-50 text-blue-700 border-blue-100',
    },
    {
      dateNum: '28',
      dateMonth: 'Eki',
      title: 'Dijital Okuryazarlık Atölyesi',
      loc: 'İE Eğitim Merkezi',
      dur: '1 Gün',
      badge: 'Atölye',
      badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      dateNum: '04',
      dateMonth: 'Kas',
      title: 'Temel Bilgisayar Kullanımı',
      loc: 'İE Eğitim Merkezi',
      dur: '2 Hafta',
      badge: 'Eğitim',
      badgeStyle: 'bg-blue-50 text-blue-700 border-blue-100',
    },
    {
      dateNum: '11',
      dateMonth: 'Kas',
      title: 'El Sanatları ile Girişimcilik',
      loc: 'İE Konferans Salonu',
      dur: '1 Gün',
      badge: 'Seminer',
      badgeStyle: 'bg-amber-50 text-amber-700 border-amber-100',
    },
  ];

  // Ekim 2026 Takvim Günleri (Perşembe 1 Ekim ile başlar)
  const calendarCells = [
    { num: 28, isCurrentMonth: false },
    { num: 29, isCurrentMonth: false },
    { num: 30, isCurrentMonth: false },
    { num: 1, isCurrentMonth: true },
    { num: 2, isCurrentMonth: true },
    { num: 3, isCurrentMonth: true },
    { num: 4, isCurrentMonth: true },
    { num: 5, isCurrentMonth: true },
    { num: 6, isCurrentMonth: true },
    { num: 7, isCurrentMonth: true },
    { num: 8, isCurrentMonth: true },
    { num: 9, isCurrentMonth: true },
    { num: 10, isCurrentMonth: true },
    { num: 11, isCurrentMonth: true },
    { num: 12, isCurrentMonth: true },
    { num: 13, isCurrentMonth: true },
    { num: 14, isCurrentMonth: true },
    { num: 15, isCurrentMonth: true },
    { num: 16, isCurrentMonth: true },
    { num: 17, isCurrentMonth: true },
    { num: 18, isCurrentMonth: true },
    { num: 19, isCurrentMonth: true },
    { num: 20, isCurrentMonth: true },
    { num: 21, isCurrentMonth: true },
    { num: 22, isCurrentMonth: true },
    { num: 23, isCurrentMonth: true },
    { num: 24, isCurrentMonth: true },
    { num: 25, isCurrentMonth: true },
    { num: 26, isCurrentMonth: true },
    { num: 27, isCurrentMonth: true },
    { num: 28, isCurrentMonth: true },
    { num: 29, isCurrentMonth: true },
    { num: 30, isCurrentMonth: true },
    { num: 31, isCurrentMonth: true },
    { num: 1, isCurrentMonth: false },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* ===================================================================== */}
      {/* 1. BREADCRUMB NAVIGATION                                              */}
      {/* ===================================================================== */}
      <nav className="flex items-center gap-2 text-xs text-slate-500" aria-label="Sayfa Konumu">
        <Link to="/" className="hover:text-blue-600 transition-colors">Ana Sayfa</Link>
        <span className="text-slate-400">/</span>
        <span className="text-slate-800 font-medium">Eğitim Takvimi</span>
      </nav>

      {/* ===================================================================== */}
      {/* 2. CALENDAR HERO: Overline, Headline & Right Simulation Badge         */}
      {/* ===================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-1">
        <div className="space-y-1.5">
          <div className="text-xs font-bold text-slate-500 tracking-wider uppercase">
            YAKLAŞAN EĞİTİMLER VE ETKİNLİKLER
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Eğitim <span className="text-blue-600">Takvimi</span>
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Planlanan eğitim oturumlarını, başvuru tarihlerini ve önemli etkinlikleri takip ederek eğitim yolculuğunuzu planlayın.
          </p>
        </div>

        {/* Right Info Box (Kalıcı Proje Kuralı) */}
        <div className="flex items-center gap-3 bg-blue-50/70 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-900 max-w-md shadow-xs shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div className="leading-snug space-y-0.5">
            <p className="font-semibold text-slate-800">
              Takvimde yer alan etkinlikler demo içerikleridir.
            </p>
            <p className="text-slate-500 text-[11px]">
              Güncel ve resmi duyurular için lütfen <strong className="text-blue-700">duyurular sayfasını</strong> takip edin.
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. HORIZONTAL FILTER BAR                                              */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
          
          {/* Dropdown 1: Eğitim Alanı */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">Eğitim Alanı</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Tümü">Tümü</option>
              <option value="Tarım ve E-Ticaret">Tarım ve E-Ticaret</option>
              <option value="Dış Ticaret">Dış Ticaret</option>
              <option value="Dijital Beceriler">Dijital Beceriler</option>
              <option value="Girişimcilik ve İşletme">Girişimcilik ve İşletme</option>
              <option value="El Sanatları">El Sanatları</option>
            </select>
          </div>

          {/* Dropdown 2: Eğitim Türü */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">Eğitim Türü</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Tümü">Tümü</option>
              <option value="Eğitim">Eğitim</option>
              <option value="Seminer">Seminer</option>
              <option value="Atölye">Atölye</option>
              <option value="Bilgilendirme">Bilgilendirme</option>
            </select>
          </div>

          {/* Dropdown 3: Eğitim Biçimi */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">Eğitim Biçimi</label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Tümü">Tümü</option>
              <option value="Yüz yüze">Yüz yüze</option>
              <option value="Online">Online</option>
              <option value="Hibrit">Hibrit</option>
            </select>
          </div>

          {/* Month / Year Selector: < Ekim 2026 > */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-[11px] font-bold text-slate-700 block">Ay / Yıl</label>
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-2 py-1.5">
              <button
                type="button"
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Önceki Ay"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-800 select-none">
                {selectedMonth}
              </span>
              <button
                type="button"
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Sonraki Ay"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="lg:col-span-2 space-y-1">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Eğitim adı ara..."
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons: Filtrele & Temizle */}
          <div className="lg:col-span-2 flex items-center gap-2">
            <button
              type="button"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtrele</span>
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-2.5 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Filtreleri Temizle"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. TWO-COLUMN CALENDAR & SCHEDULE SECTION                             */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* =================================================================== */}
        {/* LEFT COLUMN: MONTHLY CALENDAR GRID & LEGEND (5 COLS)                */}
        {/* =================================================================== */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-6">
          
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-lg">
              Ekim 2026
            </h3>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Önceki Ay"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Sonraki Ay"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDay(14)}
                className="text-xs font-semibold text-slate-700 hover:text-blue-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Bugün
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-500">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
              <span key={day} className="py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Date Grid */}
          <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
            {calendarCells.map((cell, idx) => {
              const isSelected = cell.isCurrentMonth && cell.num === selectedDay;
              const dots = cell.isCurrentMonth ? eventsByDay[cell.num] || [] : [];

              return (
                <div key={idx} className="flex flex-col items-center justify-center py-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (cell.isCurrentMonth) setSelectedDay(cell.num);
                    }}
                    disabled={!cell.isCurrentMonth}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs scale-105'
                        : cell.isCurrentMonth
                        ? 'text-slate-800 hover:bg-slate-100 hover:text-blue-600'
                        : 'text-slate-300 cursor-default'
                    }`}
                  >
                    {cell.num}
                  </button>

                  {/* Event Color Dots below Date */}
                  <div className="flex items-center justify-center gap-1 h-2 mt-0.5">
                    {dots.map((color, dIdx) => {
                      const colorMap = {
                        green: 'bg-emerald-500',
                        amber: 'bg-amber-500',
                        purple: 'bg-purple-500',
                        blue: 'bg-blue-600',
                        red: 'bg-rose-500',
                      };
                      return (
                        <span
                          key={dIdx}
                          className={`w-1.5 h-1.5 rounded-full ${colorMap[color]}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Event Types Legend */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              Etkinlik Türleri
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Eğitim Oturumu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span>Seminer / Etkinlik</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                <span>Başvuru Dönemi</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                <span>Son Başvuru Tarihi</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span>Sertifika Töreni</span>
              </div>
            </div>
          </div>

        </div>

        {/* =================================================================== */}
        {/* RIGHT COLUMN: DAILY SCHEDULE CARDS FOR SELECTED DATE (7 COLS)       */}
        {/* =================================================================== */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Header Row: Selected Date + View Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                {selectedDay} {selectedMonth}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bu tarihte <strong className="text-blue-600">{selectedDayEvents.length} etkinlik</strong> bulunmaktadır.
              </p>
            </div>

            {/* View Mode Switcher Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              {(['Gün', 'Hafta', 'Ay', 'Liste'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === mode
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Events List for Selected Day */}
          {selectedDayEvents.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-3">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-slate-700 font-bold text-sm">
                Seçilen tarihte ({selectedDay} {selectedMonth}) planlanmış etkinlik bulunamadı.
              </p>
              <p className="text-xs text-slate-500">
                Takvimdeki renkli noktalı günlere tıklayarak diğer oturumları görüntüleyebilirsiniz.
              </p>
              <Button size="sm" variant="outline" onClick={() => setSelectedDay(14)}>
                14 Ekim Etkinliklerine Dön
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDayEvents.map((ev) => {
                // Color configuration according to mockup
                const borderColors = {
                  green: 'border-l-emerald-500',
                  amber: 'border-l-amber-500',
                  purple: 'border-l-purple-500',
                  blue: 'border-l-blue-600',
                  red: 'border-l-rose-500',
                };
                const iconBoxColors = {
                  green: 'bg-emerald-50 text-emerald-600',
                  amber: 'bg-amber-50 text-amber-600',
                  purple: 'bg-purple-50 text-purple-600',
                  blue: 'bg-blue-50 text-blue-600',
                  red: 'bg-rose-50 text-rose-600',
                };
                const typePillColors = {
                  Eğitim: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                  Seminer: 'bg-amber-50 text-amber-700 border-amber-100',
                  Atölye: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                  Bilgilendirme: 'bg-purple-50 text-purple-700 border-purple-100',
                };

                return (
                  <div
                    key={ev.id}
                    className={`bg-white rounded-2xl border border-slate-200/90 border-l-4 ${borderColors[ev.colorType]} shadow-xs hover:shadow-md transition-all p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 group`}
                  >
                    {/* Left: Time + Icon + Content */}
                    <div className="flex items-start gap-4">
                      
                      {/* Time Column */}
                      <div className="text-xs font-bold text-slate-700 shrink-0 text-center min-w-[50px] space-y-0.5">
                        <span className="block text-slate-900 font-extrabold">{ev.startTime}</span>
                        <span className="block text-slate-400 font-medium">{ev.endTime}</span>
                      </div>

                      {/* Icon Box */}
                      <div
                        className={`w-11 h-11 rounded-2xl ${iconBoxColors[ev.colorType]} flex items-center justify-center shrink-0`}
                      >
                        {ev.iconType === 'sprout' && <Sprout className="w-5 h-5" />}
                        {ev.iconType === 'handshake' && <Handshake className="w-5 h-5" />}
                        {ev.iconType === 'users' && <Users className="w-5 h-5" />}
                        {ev.iconType === 'monitor' && <Monitor className="w-5 h-5" />}
                      </div>

                      {/* Content Column */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                          {ev.category}
                        </span>

                        <h4 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors leading-snug">
                          {ev.title}
                        </h4>

                        {/* Metadata line */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {ev.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {ev.mode}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {ev.instructor}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed pt-1">
                          {ev.description}
                        </p>
                      </div>

                    </div>

                    {/* Right: Type Badge & Action Button */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${typePillColors[ev.type]}`}
                      >
                        {ev.type}
                      </span>

                      <button
                        type="button"
                        onClick={() => setDetailEvent(ev)}
                        className="text-xs font-semibold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 rounded-xl px-4 py-2 transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Detayları Gör</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* ===================================================================== */}
      {/* 5. BOTTOM SECTION: YAKLAŞAN ETKİNLİKLER (4 MINI CARDS)               */}
      {/* ===================================================================== */}
      <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">
              Yaklaşan Etkinlikler
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Takvimdeki önümüzdeki oturum ve seminerler
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/egitimler"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 mr-2"
            >
              <span>Tüm Etkinlikleri Gör</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Horizontal Mini Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {upcomingStrip.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-200 hover:bg-white hover:shadow-xs transition-all flex items-center gap-3.5"
            >
              {/* Date Block */}
              <div className="w-12 h-12 rounded-xl bg-blue-100/60 border border-blue-200/70 text-blue-700 flex flex-col items-center justify-center shrink-0">
                <span className="font-extrabold text-sm leading-none">{item.dateNum}</span>
                <span className="text-[10px] font-semibold uppercase">{item.dateMonth}</span>
              </div>

              {/* Title & Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 text-xs truncate">
                  {item.title}
                </h4>
                <span className="text-[11px] text-slate-500 truncate block mt-0.5">
                  {item.loc} • {item.dur}
                </span>
                <span
                  className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border mt-1.5 ${item.badgeStyle}`}
                >
                  {item.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 6. MODAL: ETKİNLİK DETAY MODALI                                        */}
      {/* ===================================================================== */}
      {detailEvent && (
        <Modal
          isOpen={Boolean(detailEvent)}
          onClose={() => setDetailEvent(null)}
          title={detailEvent.title}
          description={`${detailEvent.dateStr} • ${detailEvent.startTime} - ${detailEvent.endTime} • ${detailEvent.mode}`}
          maxWidth="max-w-lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="outline" size="sm" onClick={() => setDetailEvent(null)}>
                Kapat
              </Button>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    alert('Etkinlik takviminize simüle olarak kaydedildi.');
                    setDetailEvent(null);
                  }}
                >
                  Takvimime Ekle
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs text-slate-600">
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1 text-blue-900">
              <span className="font-bold block text-xs">Etkinlik Açıklaması:</span>
              <p className="text-[11px] leading-relaxed">{detailEvent.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Eğitmen / Konuşmacı</span>
                <span className="font-bold text-slate-800 text-xs">{detailEvent.instructor}</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Salon / Bağlantı</span>
                <span className="font-bold text-slate-800 text-xs">{detailEvent.location}</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Oturum süresince yoklama eğitmen tarafından manuel alınacaktır.</span>
              </div>
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>Bu bir eğitim portalı demo etkinlik oturumudur.</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
