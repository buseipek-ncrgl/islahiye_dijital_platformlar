import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Clock,
  Award,
  FileText,
  GraduationCap,
  Users,
  Search,
  MapPin,
  BarChart3,
  Calendar,
  Building,
  FileCheck2,
  X,
} from 'lucide-react';

export const PublicHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [announcementDetail, setAnnouncementDetail] = useState<{
    title: string;
    category: string;
    date: string;
    content: string;
  } | null>(null);

  // Filter Categories from Design Mockup
  const filterTabs = [
    'Tümü',
    'Tarım ve E-Ticaret',
    'Dış Ticaret',
    'Dijital Beceriler',
    'Gastronomi',
    'El Sanatları',
  ];

  // 3 Featured Programs from Design Mockup
  const allPrograms = [
    {
      id: 'prog-01',
      title: 'İslahiye Biberi ve Tarımsal E-Ticaret',
      category: 'Tarım ve E-Ticaret',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      description: 'Yerel tarımsal ürünlerin dijital pazarlama, e-ticaret ve sürdürülebilir üretim yöntemleri.',
      duration: '3 Ay',
      type: 'Uygulamalı',
      certified: 'Sertifikalı',
      image: '/images/prog_islahiye_biber.jpg',
    },
    {
      id: 'prog-02',
      title: 'Dış Ticaret ve İhracat Yönetimi',
      category: 'Dış Ticaret',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-100',
      description: 'İhracat süreçleri, dış ticaret mevzuatı ve uluslararası pazarlara erişim konularında temel bilgiler.',
      duration: '2 Ay',
      type: 'Uygulamalı',
      certified: 'Sertifikalı',
      image: '/images/prog_dis_ticaret.jpg',
    },
    {
      id: 'prog-03',
      title: 'Temel Bilgisayar ve Dijital Okuryazarlık',
      category: 'Dijital Beceriler',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-100',
      description: 'Günlük iş yaşamında ihtiyaç duyulan dijital beceriler ve ofis uygulamaları kullanımı.',
      duration: '2 Ay',
      type: 'Uygulamalı',
      certified: 'Sertifikalı',
      image: '/images/prog_dijital_okuryazarlik.jpg',
    },
    {
      id: 'prog-04',
      title: 'Yöresel Mutfak & Gastronomi İşletmeciliği',
      category: 'Gastronomi',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-100',
      description: 'Geleneksel lezzetlerin profesyonel standartlarda sunumu, hijyen ve restoran yönetimi.',
      duration: '3 Ay',
      type: 'Uygulamalı',
      certified: 'Sertifikalı',
      image: '/images/prog_gastronomi.jpg',
    },
    {
      id: 'prog-05',
      title: 'Geleneksel Dokuma ve El Sanatları',
      category: 'El Sanatları',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-100',
      description: 'Bölgesel el sanatlarının korunması, modern tasarımla birleştirilmesi ve kooperatif satışı.',
      duration: '2 Ay',
      type: 'Uygulamalı',
      certified: 'Sertifikalı',
      image: '/images/prog_tarim.jpg',
    },
  ];

  const displayedPrograms =
    selectedCategory === 'Tümü'
      ? allPrograms.slice(0, 3)
      : allPrograms.filter((p) => p.category === selectedCategory);

  // Duyurular listesi (Mockup ile tam eşleşen)
  const announcements = [
    {
      id: 'ann-1',
      category: 'Genel',
      categoryBadge: 'bg-blue-50 text-blue-700 border-blue-100',
      iconBoxBg: 'bg-rose-50 text-rose-600 border-rose-100',
      title: '2026 Güz Dönemi Başvuruları Açıldı',
      description: 'Yeni dönem eğitim programlarına başvurular başlamıştır.',
      date: '10 Ekim 2026',
      fullText:
        'İslahiye Ticaret Odası 2026 Güz Dönemi mesleki eğitim programları için ön başvuru süreci başlamıştır. Tarım, dış ticaret ve dijital beceriler alanlarında açılacak atölyelere kayıt olmak için Başvuru Rehberini inceleyiniz.',
    },
    {
      id: 'ann-2',
      category: 'Atölye',
      categoryBadge: 'bg-amber-50 text-amber-700 border-amber-100',
      iconBoxBg: 'bg-amber-50 text-amber-600 border-amber-100',
      title: 'Dijital Pazarlama Atölyesi Başlıyor',
      description: 'Uygulamalı eğitim atölyesi için kontenjanlar sınırlıdır.',
      date: '8 Ekim 2026',
      fullText:
        'Yerel esnaf ve KOBİ çalışanlarına yönelik düzenlenecek olan uygulamalı Dijital Pazarlama Atölyesi sınırlı kontenjanla açılacaktır. Öncelik İslahiye esnafına verilecektir.',
    },
    {
      id: 'ann-3',
      category: 'Belge',
      categoryBadge: 'bg-purple-50 text-purple-700 border-purple-100',
      iconBoxBg: 'bg-purple-50 text-purple-600 border-purple-100',
      title: 'Belge Doğrulama Sistemi Güncellendi',
      description: 'Düzenlenen sertifikaların doğrulaması artık çevrimiçi yapılabilir.',
      date: '5 Ekim 2026',
      fullText:
        'Tamamlanan programlara ait karekodlu başarı belgelerinin doğruluğu, İE Belge Doğrulama Portalı üzerinden kimlik ve sertifika numarasıyla 7/24 teyit edilebilir hale getirilmiştir.',
    },
  ];

  // Eğitim Takvimi listesi (Mockup ile tam eşleşen)
  const calendarEvents = [
    {
      day: '14',
      month: 'Eki',
      title: 'Dijital Pazarlama Atölyesi',
      location: 'İE Eğitim Merkezi',
      type: 'Atölye',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      day: '21',
      month: 'Eki',
      title: 'Dış Ticaret Temel Eğitimi',
      location: 'Online',
      type: 'Eğitim',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      day: '28',
      month: 'Eki',
      title: 'İslahiye Biberi: Tarımdan Markaya',
      location: 'İE Konferans Salonu',
      type: 'Seminer',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      day: '04',
      month: 'Kas',
      title: 'Temel Bilgisayar Kullanımı',
      location: 'İE Eğitim Merkezi',
      type: 'Eğitim',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
  ];

  return (
    <div className="space-y-16 lg:space-y-20 pb-20 bg-slate-50/40">
      
      {/* ===================================================================== */}
      {/* 1. HERO SECTION: Full-bleed Right Photo with Seamless Left/Bottom Fade */}
      {/* ===================================================================== */}
      <section className="relative overflow-hidden bg-white border-b border-slate-100 min-h-[480px] sm:min-h-[520px] lg:min-h-[560px] flex items-center">
        
        {/* Right-side Full-Bleed Photo with Deep Unified Alpha Fade (Metne doğru uzanan, bütünsel ve canlı editoryal kompozisyon) */}
        <div className="absolute top-0 right-0 bottom-0 w-full lg:w-[68%] xl:w-[65%] 2xl:w-[62%] z-0 pointer-events-none select-none overflow-hidden">
          {/* Mobile Text Readability Overlay (Sadece lg altı küçük ekranlarda metin okunabilirliği için) */}
          <div className="lg:hidden absolute inset-0 bg-white/85 z-10" />

          {/* Mask Layer 1: Left-to-Right Extended Alpha Transition (Görseli metnin ardına doğru yumuşakça taşır, sağa doğru tam canlılığa ulaştırır) */}
          <div
            className="w-full h-full"
            style={{
              WebkitMaskImage:
                'linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.02) 8%, rgba(0, 0, 0, 0.12) 18%, rgba(0, 0, 0, 0.45) 30%, rgba(0, 0, 0, 0.85) 44%, black 58%)',
              maskImage:
                'linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.02) 8%, rgba(0, 0, 0, 0.12) 18%, rgba(0, 0, 0, 0.45) 30%, rgba(0, 0, 0, 0.85) 44%, black 58%)',
            }}
          >
            {/* Mask Layer 2: Bottom-to-Top Alpha Transition (Alt kenarı yumuşakça beyaz zeminle birleştirir) */}
            <div
              className="w-full h-full"
              style={{
                WebkitMaskImage:
                  'linear-gradient(to top, transparent 0%, rgba(0, 0, 0, 0.3) 3%, rgba(0, 0, 0, 0.8) 8%, black 15%)',
                maskImage:
                  'linear-gradient(to top, transparent 0%, rgba(0, 0, 0, 0.3) 3%, rgba(0, 0, 0, 0.8) 8%, black 15%)',
              }}
            >
              <img
                src="/images/hero_students.jpg"
                alt="İslahiye Mesleki Eğitim Kursiyerleri"
                className="w-full h-full object-cover object-[70%_center] lg:object-[66%_center] xl:object-center"
              />
            </div>
          </div>
        </div>

        {/* Content Container (Left-aligned text over the clean white / faded area) */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 lg:py-20 w-full">
          <div className="max-w-xl lg:max-w-2xl space-y-6 text-left">
            
            {/* Eyebrow with leading short line */}
            <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span className="w-7 h-0.5 bg-slate-400"></span>
              <span>MESLEKİ EĞİTİM VE GELİŞİM</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-extrabold text-slate-900 tracking-tight leading-[1.18]">
              Geleceğin becerileri,<br />
              bugünün <span className="text-blue-600">fırsatları.</span>
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg">
              İslahiye Ticaret Odası bünyesinde yerel üreticileri, esnafı ve gençleri geleceğin mesleki becerileriyle buluşturan kurumsal eğitim platformu. Uygulamalı atölyeleri keşfedin, başvuru koşullarını inceleyin ve kariyer yolculuğunuzu <strong className="font-semibold text-slate-800">dijital ortamda takip edin.</strong>
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/egitimler"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-3.5 rounded-xl shadow-xs transition-colors cursor-pointer group"
              >
                <span>Eğitimleri Keşfet</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <a
                href="#basvuru-sureci"
                className="inline-flex items-center justify-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold text-sm px-3 py-3.5 transition-colors cursor-pointer group"
              >
                <span>Başvuru süreci nasıl işler?</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 2. FEATURE HIGHLIGHTS STRIP: 4 Columns with Clean Pastel Icons        */}
      {/* ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:divide-x lg:divide-slate-100">
          
          {/* Feature 1 */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/60">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                Uygulamalı Eğitimler
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Teoriyi pratiğe dönüştüren atölyeler
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-center gap-4 lg:pl-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/60">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                Sektörel Uzmanlık
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Güncel ve ihtiyaç odaklı programlar
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-center gap-4 lg:pl-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/60">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                Yerel Kalkınma
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                İslahiye ve bölge ekonomisine katkı
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="flex items-center gap-4 lg:pl-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/60">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                Sertifika Desteği
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kariyeriniz için güçlü bir adım
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. FEATURED PROGRAMS: Categories & 3 Real Photo Program Cards        */}
      {/* ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              ÖNE ÇIKAN PROGRAMLAR
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Eğitim programlarını keşfedin
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              İslahiye'nin ihtiyaçlarına uygun, uygulamalı ve sertifikalı eğitim programları.
            </p>
          </div>

          <Link
            to="/egitimler"
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 self-start sm:self-auto group"
          >
            <span>Tüm Programları Gör</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Filter Pills / Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedCategory(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === tab
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 3 Program Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayedPrograms.map((prog) => (
            <div
              key={prog.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer"
              onClick={() => navigate(`/egitimler/${prog.id}`)}
            >
              {/* Card Image */}
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img
                  src={prog.image}
                  alt={prog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span
                    className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${prog.badgeColor}`}
                  >
                    {prog.category}
                  </span>
                  
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-2">
                    {prog.title}
                  </h3>
                  
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {prog.description}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {/* Meta Row: Duration | Type | Certificate */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{prog.duration}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{prog.type}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span>{prog.certified}</span>
                    </span>
                  </div>

                  {/* Programı İncele Link */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                    <span>Programı İncele</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. ADIM ADIM BAŞVURU SÜRECİ: 4 Connected Stepper Cards                */}
      {/* ===================================================================== */}
      <section id="basvuru-sureci" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              ADIM ADIM
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Başvuru süreci
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Eğitim programlarına başvurmak için izlemeniz gereken temel adımlar.
            </p>
          </div>

          <Link
            to="/basvuru-rehberi"
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 self-start sm:self-auto group"
          >
            <span>Başvuru rehberini görüntüle</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 4 Stepper Cards with Horizontal Connector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          
          {/* Step 1 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col text-left space-y-3 relative group hover:border-blue-200 transition">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                1
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Programı Seçin</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                İlgi alanınıza uygun eğitim programını inceleyin.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col text-left space-y-3 relative group hover:border-blue-200 transition">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <FileText className="w-6 h-6" />
              </div>
              <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                2
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Başvurunuzu Yapın</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Gerekli bilgileri doldurun ve belgeleri yükleyin.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col text-left space-y-3 relative group hover:border-blue-200 transition">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Search className="w-6 h-6" />
              </div>
              <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                3
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Değerlendirme Süreci</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Başvurunuz ilgili kriterlere göre değerlendirilir.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col text-left space-y-3 relative group hover:border-blue-200 transition">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                4
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Eğitime Katılın</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Kabul edildikten sonra eğitim sürecinizi dijital ortamda takip edin.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ===================================================================== */}
      {/* 5. DUAL COLUMNS: Duyurular (Sol) & Eğitim Takvimi (Sağ)               */}
      {/* ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Left Column: Duyurular */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Duyurular
              </h2>
              <button
                onClick={() =>
                  setAnnouncementDetail({
                    title: 'Tüm Duyurular',
                    category: 'Genel',
                    date: '2026 Dönemi',
                    content:
                      'İslahiye Ticaret Odası bünyesinde duyurulan tüm güncel eğitim ve atölye bildirimleri bu listede yayınlanmaktadır.',
                  })
                }
                className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group cursor-pointer"
              >
                <span>Tüm Duyurular</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  onClick={() =>
                    setAnnouncementDetail({
                      title: ann.title,
                      category: ann.category,
                      date: ann.date,
                      content: ann.fullText,
                    })
                  }
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 flex items-start gap-4 hover:border-blue-200 hover:shadow-xs transition cursor-pointer group"
                >
                  {/* Icon Box */}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${ann.iconBoxBg}`}
                  >
                    {ann.category === 'Genel' && <Building className="w-5 h-5" />}
                    {ann.category === 'Atölye' && <Calendar className="w-5 h-5" />}
                    {ann.category === 'Belge' && <FileCheck2 className="w-5 h-5" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${ann.categoryBadge}`}
                      >
                        {ann.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors leading-snug">
                      {ann.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {ann.description}
                    </p>
                  </div>

                  {/* Date on the right */}
                  <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0 mt-0.5">
                    {ann.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Eğitim Takvimi */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Eğitim Takvimi
              </h2>
              <Link
                to="/egitim-takvimi"
                className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
              >
                <span>Takvimi Görüntüle</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="space-y-3">
              {calendarEvents.map((ev, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate('/egitim-takvimi')}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 flex items-center justify-between gap-4 hover:border-blue-200 hover:shadow-xs transition cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    {/* Date Badge */}
                    <div className="w-13 h-13 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center shrink-0">
                      <span className="text-base font-extrabold text-blue-600 leading-none">
                        {ev.day}
                      </span>
                      <span className="text-[10px] font-bold text-blue-600 uppercase mt-0.5">
                        {ev.month}
                      </span>
                    </div>

                    {/* Event Detail */}
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                        {ev.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{ev.location}</p>
                    </div>
                  </div>

                  {/* Type Badge */}
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full border ${ev.badgeColor}`}
                  >
                    {ev.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Announcement Detail Modal */}
      {announcementDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-blue-600 uppercase">
                {announcementDetail.category} Duyurusu
              </span>
              <button
                onClick={() => setAnnouncementDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg leading-snug">
                {announcementDetail.title}
              </h3>
              <span className="text-xs text-slate-400 block mt-1">
                Tarih: {announcementDetail.date}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {announcementDetail.content}
            </p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setAnnouncementDetail(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
