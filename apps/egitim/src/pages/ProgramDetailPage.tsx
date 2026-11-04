import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  FileText,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  Tag,
  ShoppingCart,
  Package,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import { Program } from '../types';
import { fetchLivePrograms, getInitialPrograms } from '../services/programAdapter';

export const ProgramDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isCandidatePanel = location.pathname.startsWith('/aday');
  const isTraineePanel = location.pathname.startsWith('/kursiyer');
  const isPortalMode = isCandidatePanel || isTraineePanel || location.pathname.startsWith('/yonetim');

  const getCatalogLink = () => {
    if (isCandidatePanel) return '/aday/katalog';
    if (isTraineePanel) return '/kursiyer/katalog';
    return '/egitimler';
  };

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

  const initialList = useMemo<Program[]>(() => getInitialPrograms(), []);
  const initialFound = useMemo<Program | null>(() => {
    return (
      initialList.find(
        (p: Program) =>
          p.id === id ||
          p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(id || '')
      ) || initialList[0] || null
    );
  }, [id, initialList]);

  const [program, setProgram] = useState<Program | null>(() => initialFound);
  const [otherPrograms, setOtherPrograms] = useState<Program[]>(() =>
    initialFound ? initialList.filter((p: Program) => p.id !== initialFound.id) : []
  );
  const [isLoading, setIsLoading] = useState(false);

  // Accordion state for FAQ and Sessions
  const [expandedSessions, setExpandedSessions] = useState<number[]>([1, 2]);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  useEffect(() => {
    let mounted = true;
    fetchLivePrograms().then((all) => {
      if (!mounted) return;
      if (all.length > 0) {
        const found =
          all.find(
            (p) =>
              p.id === id ||
              p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(id || '')
          ) || all[0];
        setProgram(found);
        setOtherPrograms(all.filter((p) => p.id !== found.id));
      }
      setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-800">Program Bulunamadı</h2>
        <p className="text-sm text-slate-500 mt-2">İlgili eğitim programı sistemde mevcut değil.</p>
        <Link to={getCatalogLink()} className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">
          Kataloğa Dön
        </Link>
      </div>
    );
  }

  const toggleSession = (sessNum: number) => {
    setExpandedSessions((prev) =>
      prev.includes(sessNum)
        ? prev.filter((s) => s !== sessNum)
        : [...prev, sessNum]
    );
  };

  const toggleAllSessions = () => {
    if (expandedSessions.length === program.curriculumModules.length) {
      setExpandedSessions([]);
    } else {
      setExpandedSessions(program.curriculumModules.map((m) => m.sessionNumber));
    }
  };

  // Other programs for Related & Similar sections
  const relatedPrograms = otherPrograms.slice(0, 3);

  // Dynamic Learning Competencies (Neler Öğreneceksiniz?)
  const programCompetencies: Record<
    string,
    Array<{ icon: any; title: string; desc: string }>
  > = {
    'prog-01': [
      {
        icon: ShoppingCart,
        title: 'Pazaryeri ve dijital mağaza kurulum mantığı',
        desc: 'E-ticaret ve pazaryeri platformlarında satıcı hesabı açma ve mağaza yönetimi süreçlerini öğrenirsiniz.',
      },
      {
        icon: FileText,
        title: 'Ürün içerikleri ve görsel hazırlama',
        desc: 'Ürün açıklamaları, görsel standartları, tescilli ürün vurgusu ve etkili içerik hazırlama teknikleri.',
      },
      {
        icon: Package,
        title: 'Paketleme, kargo ve operasyon akışı',
        desc: 'Ürünlerin güvenli, gıda standartlarına uygun ve doğru şekilde tüketiciye ulaşması için operasyon süreçleri.',
      },
      {
        icon: ShieldCheck,
        title: 'Coğrafi işaretli ürünlerin dijital konumlandırılması',
        desc: 'İslahiye Biberi gibi tescilli ürünlerin dijital pazarlarda marka değeriyle doğru şekilde konumlanması.',
      },
    ],
    'prog-02': [
      {
        icon: BarChart3,
        title: 'Uluslararası Ticaret ve Teslim Şekilleri',
        desc: 'Incoterms 2020 kuralları, ihracat teslim koşulları ve risk paylaşım esaslarını kavrarsınız.',
      },
      {
        icon: FileText,
        title: 'Gümrük Mevzuatı ve Evrak Hazırlığı',
        desc: 'Menşe şahadetnamesi, ATR/EUR1 dolaşım belgeleri ve gümrük beyannamelerini eksiksiz düzenleme.',
      },
      {
        icon: ShieldCheck,
        title: 'Akreditif ve Ödeme Güvenliği',
        desc: 'Uluslararası ticarette ödeme yöntemleri, risk yönetimi ve bankacılık akreditif süreçleri.',
      },
      {
        icon: ShoppingCart,
        title: 'Hedef Pazar Tespiti ve Müşteri Bulma',
        desc: 'TradeAtlas ve ITC araçlarıyla bölgesel hedef pazarları analiz etme ve alıcı bulma stratejileri.',
      },
    ],
    default: [
      {
        icon: ShoppingCart,
        title: 'Uygulamalı Mesleki Beceriler',
        desc: 'Sektörün ihtiyaç duyduğu temel kavram ve operasyonel süreçleri uygulamalı atölyelerle öğrenirsiniz.',
      },
      {
        icon: FileText,
        title: 'Dijital Araç ve Raporlama Yetkinliği',
        desc: 'İş süreçlerinizi hızlandıracak modern yazılım ve dijital ofis araçlarını profesyonelce kullanma.',
      },
      {
        icon: Package,
        title: 'İşletme Standartları ve Kalite Yönetimi',
        desc: 'Müşteri memnuniyeti, standartlara uyum ve verimli iş akışlarını tasarlama yöntemleri.',
      },
      {
        icon: ShieldCheck,
        title: 'Yerel ve Bölgesel Değer Yaratma',
        desc: 'İslahiye ve bölge ekonomisine doğrudan katkı sağlayan kurumsal çalışma prensipleri.',
      },
    ],
  };

  const currentCompetencies =
    programCompetencies[program.id] || programCompetencies.default;

  // Dynamic Post-Program Outcomes (Bu Programdan Sonra)
  const programOutcomes: Record<string, string[]> = {
    'prog-01': [
      'E-ticaret ve pazaryeri platformlarında kendi mağazanızı kurabilirsiniz.',
      'Yöresel ürünlerinizi dijital pazarlarda daha geniş kitlelere ulaştırabilirsiniz.',
      'Paketleme, kargo ve lojistik operasyon süreçlerini hatasız yönetebilirsiniz.',
      'Coğrafi işaretli ürünlerin dijital marka görünürlüğünü artırabilirsiniz.',
    ],
    'prog-02': [
      'İhracat mevzuatına uygun evrak ve beyanname hazırlayabilirsiniz.',
      'Uluslararası ödeme ve akreditif süreçlerini güvenle yönetebilirsiniz.',
      'Bölgesel ve küresel pazar istihbaratı verilerini analiz edebilirsiniz.',
      'KOBİ düzeyinde sınır ötesi ticaret bağlantıları kurabilirsiniz.',
    ],
    default: [
      'Sektörel temel kavramları ve operasyonel standartları hayata geçirebilirsiniz.',
      'Dijital araç ve platformları yerel üretim süreçlerinize entegre edebilirsiniz.',
      'Uygulamalı vaka analizleriyle mesleki özgüveninizi güçlendirebilirsiniz.',
      'İE onaylı başarı/katılım belgesiyle kariyerinizi belgelendirebilirsiniz.',
    ],
  };

  const currentOutcomes = programOutcomes[program.id] || programOutcomes.default;

  // Sık Sorulan Sorular (FAQ)
  const faqList = [
    {
      q: 'Bu programa kimler başvurabilir?',
      a: 'İslahiye ve çevre bölgelerde ikamet eden yerel tarım üreticileri, esnaf, KOBİ çalışanları, kooperatif ortakları ve mesleki becerilerini dijital çağa taşımak isteyen tüm girişimci adayları başvurabilir.',
    },
    {
      q: 'Eğitimler hangi gün ve saatlerde yapılacak?',
      a: 'Eğitim oturumları çalışan ve üreten kesimin katılımını kolaylaştırmak amacıyla hafta içi akşam veya cumartesi günleri 6 saatlik uygulamalı bloklar halinde İE Eğitim Merkezi salonlarında gerçekleştirilir.',
    },
    {
      q: 'Başvuru sonrasında nasıl bir süreç izleniyor?',
      a: 'Ön başvuru formunuz alındıktan sonra sistemde şeffaf puanlama kurallarına göre bir ön değerlendirme yapılır. Kontenjan durumuna göre kesin kabul ve grup atama kararları İE yetkili yöneticisi tarafından onaylanarak SMS/Panel bildirimiyle iletilir.',
    },
    {
      q: 'Katılım belgesi ve sertifika nasıl doğrulanır?',
      a: 'Programı %80 devam ve 70/100 başarı şartıyla tamamlayan kursiyerlere özel karekodlu (QR) başarı belgesi düzenlenir. Bu belge İE Belge Doğrulama portalı üzerinden sertifika kodu veya karekodla 7/24 resmi olarak teyit edilebilir.',
    },
  ];

  return (
    <div className={`max-w-7xl mx-auto space-y-6 pb-12 ${isPortalMode ? '' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
      
      {/* 1. BREADCRUMB NAVIGATION */}
      <nav className="flex items-center gap-2 text-xs text-slate-500" aria-label="Sayfa Konumu">
        {isTraineePanel ? (
          <>
            <Link to="/kursiyer/katalog" className="hover:text-blue-600 transition-colors">Eğitim Kataloğu</Link>
            <span className="text-slate-400">/</span>
            <span className="text-slate-900 font-semibold truncate max-w-sm sm:max-w-md">{program.title}</span>
          </>
        ) : isCandidatePanel ? (
          <>
            <Link to="/aday" className="hover:text-blue-600 transition-colors">Aday Portalı</Link>
            <span className="text-slate-400">/</span>
            <Link to="/aday/katalog" className="hover:text-blue-600 transition-colors">Eğitim Kataloğu</Link>
            <span className="text-slate-400">/</span>
            <span className="text-slate-900 font-semibold truncate max-w-sm sm:max-w-md">{program.title}</span>
          </>
        ) : (
          <>
            <Link to="/" className="hover:text-blue-600 transition-colors">Ana Sayfa</Link>
            <span className="text-slate-400">/</span>
            <Link to="/egitimler" className="hover:text-blue-600 transition-colors">Eğitim Programları</Link>
            <span className="text-slate-400">/</span>
            <span className="text-slate-900 font-semibold truncate max-w-sm sm:max-w-md">{program.title}</span>
          </>
        )}
      </nav>

      {/* ===================================================================== */}
      {/* 2. PROGRAM HERO CARD: Headline, Parameters & Photographic Banner      */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 lg:p-10 relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column (Content & Parameters) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Category Badge */}
            <span
              className={`inline-block text-xs font-semibold px-3 py-1 rounded-md border ${
                program.badgeColor || 'bg-emerald-50 text-emerald-700 border-emerald-100'
              }`}
            >
              {program.category}
            </span>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {program.title}
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {program.description}
            </p>

            {/* 6 Key Parameter Badges (Grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs text-slate-700">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span><strong>{program.durationMonths || `${program.durationWeeks} Hafta`}</strong> ({program.totalHours} Saat)</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <Users className="w-4 h-4 text-blue-600 shrink-0" />
                <span><strong>{program.mode}</strong> Eğitim</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{program.cohortName}</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{program.location}</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <Users className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Kontenjan: <strong>{program.quota}</strong></span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-emerald-700 font-semibold">Ön Başvuru Açık</span>
              </div>
            </div>

            {/* Bottom Tag Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Program Alanı: <strong className="text-slate-700">{program.category}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Ücretsiz Katılım</span>
              </div>
            </div>

          </div>

          {/* Right Column (Hero Photo Presentation) */}
          <div className="lg:col-span-5 relative">
            <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100 aspect-4/3 w-full relative bg-slate-100 group">
              <img
                src={program.image || '/images/prog_islahiye_biber.jpg'}
                alt={program.title}
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end p-5">
                <div className="text-white text-xs">
                  <span className="font-semibold block text-sm">{program.title}</span>
                  <span className="text-slate-200">İE Uygulamalı Atölye Programı</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. MAIN CONTENT: 2 COLUMNS (Left 8 Cols, Right 4 Cols Sticky Rail)    */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* =================================================================== */}
        {/* LEFT COLUMN: DETAILED CONTENT SECTIONS                             */}
        {/* =================================================================== */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Section 1: Program Hakkında */}
          <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              Program Hakkında
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-8 text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3">
                <p>
                  İslahiye'nin değerli tarımsal ürünlerinin, özellikle coğrafi işaretli İslahiye Biberi'nin dijital pazarlarda daha geniş kitlelere ulaşmasını desteklemek amacıyla hazırlanan bu program; üreticiler, kooperatifler ve girişimciler için uygulamalı bir öğrenme deneyimi sunar.
                </p>
                <p>
                  Katılımcılar, e-ticaret ekosistemini, pazaryeri entegrasyonlarını, dijital mağaza yönetimini ve ürünlerini güvenli şekilde tüketiciyle buluşturma süreçlerini adım adım öğrenir.
                </p>
              </div>
              <div className="md:col-span-4 rounded-xl overflow-hidden border border-slate-100 shadow-2xs h-36 md:h-full min-h-[140px]">
                <img
                  src={program.image || '/images/prog_islahiye_biber.jpg'}
                  alt="Program Uygulama"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Neler Öğreneceksiniz? (4 Cards in 2x2 Grid) */}
          <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-5">
            <h2 className="text-xl font-bold text-slate-900">
              Neler Öğreneceksiniz?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentCompetencies.map((comp, idx) => {
                const IconComponent = comp.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-200 transition-colors space-y-2.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {comp.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {comp.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 3: Kimler İçin Uygun? & Ön Koşullar (2 Wide Cards) */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Card 1: Kimler İçin Uygun? */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2.5 text-blue-600 font-bold text-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span>Kimler İçin Uygun?</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {program.targetAudience} E-ticaret ve dijital pazar dinamiklerine ilgi duyan, yerel ürünlerini internet üzerinden Türkiye geneline pazarlamak isteyen herkes katılabilir.
              </p>
            </div>

            {/* Card 2: Ön Koşullar ve Katılım Şartları */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2.5 text-blue-600 font-bold text-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <span>Ön Koşullar ve Katılım Şartları</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Eğitimlere en az <strong>%80 oranında devam</strong> zorunluluğu.</li>
                <li>Ödev ve uygulama çalışmalarından en az <strong>70/100 başarı notu</strong>.</li>
                <li>Tüm zorunlu ödevlerin tamamlanması ve onaylanması.</li>
                <li>Kesin kayıt için İslahiye Ticaret Odası'nın idari onayı gereklidir.</li>
                <li>QR kod sadece belge doğrulama için kullanılır, devam takibi için kullanılmaz.</li>
                <li>Bu sayfada hassas kimlik bilgileri talep edilmez.</li>
              </ul>
            </div>

          </section>

          {/* Section 4: Oturum Bazlı Müfredat */}
          <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Oturum Bazlı Müfredat
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Toplam {program.curriculumModules.length} Oturum • {program.totalHours} Saat Uygulamalı İçerik
                </p>
              </div>

              <button
                type="button"
                onClick={toggleAllSessions}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                {expandedSessions.length === program.curriculumModules.length
                  ? 'Tümünü Kapat'
                  : 'Tüm Oturumları Gör →'}
              </button>
            </div>

            {/* Curriculum Accordion List */}
            <div className="space-y-3">
              {program.curriculumModules.map((mod) => {
                const isOpen = expandedSessions.includes(mod.sessionNumber);
                return (
                  <div
                    key={mod.sessionNumber}
                    className="border border-slate-200/80 rounded-2xl overflow-hidden transition-all bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSession(mod.sessionNumber)}
                      className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-4 text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {mod.sessionNumber}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                            Oturum {mod.sessionNumber}: {mod.title}
                          </h3>
                          <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {mod.description}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {mod.hours} Saat
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5 text-xs text-slate-600 border-t border-slate-100 bg-slate-50/40 space-y-2">
                        <p className="leading-relaxed">
                          {mod.description} Bu oturumda teorik anlatımın yanı sıra vaka analizleri ve dijital pazar araçları üzerinden birebir uygulamalar yapılacaktır.
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-blue-700 font-medium pt-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Uygulamalı Atölye ve Değerlendirme Dahildir</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 5: Sık Sorulan Sorular (Accordion) */}
          <section className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Sık Sorulan Sorular
              </h2>
              <Link
                to={getGuideLink()}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Tüm Soruları Gör →
              </Link>
            </div>

            <div className="space-y-3">
              {faqList.map((faq, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-4.5 flex items-center justify-between gap-4 text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {faq.q}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

        </div>

        {/* =================================================================== */}
        {/* RIGHT COLUMN: STICKY CONVERSION & DETAILS RAIL                     */}
        {/* =================================================================== */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
          
          {/* Card 1: Primary Status & Action Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-5">
            
            {/* Status Header */}
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl w-fit">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ön Başvuru Açık</span>
            </div>

            {/* Term Title */}
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg leading-snug">
                {program.cohortName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ön başvurular devam ediyor.
              </p>
            </div>

            {/* Quick Spec List */}
            <div className="space-y-3 pt-2 text-xs text-slate-600 border-t border-slate-100">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{program.durationMonths || `${program.durationWeeks} Hafta`} ({program.totalHours} Saat)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{program.mode} Eğitim</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{program.location}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Kontenjan: {program.quota}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Program Alanı: {program.category}</span>
              </div>
            </div>

            {/* Primary Action Button - Direct Frictionless Navigation */}
            <button
              type="button"
              onClick={() => {
                if (isTraineePanel) {
                  navigate('/kursiyer/dersler');
                } else {
                  navigate(`/aday/basvuru/${program.id}`);
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>{isTraineePanel ? 'Kayıtlı Derslerime Git' : 'Ön Başvuru Yap'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Secondary Action Link */}
            <Link
              to={getGuideLink()}
              className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Başvuru Rehberi</span>
            </Link>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-900 leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                Eğitim kontenjanları sınırlıdır. Başvurular oda yönetim kurulu tarafından değerlendirilerek kesin kayıt listesi ilan edilir.
              </span>
            </div>

          </div>

          {/* Card 2: Hedef Kitle */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-blue-600 font-bold text-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span>Hedef Kitle</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {program.targetAudience}
            </p>
          </div>

          {/* Card 3: Başvuru Adımları (1 to 4) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              Başvuru Adımları
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <strong className="text-slate-800 block">Programı İncele</strong>
                  <span className="text-slate-500 text-[11px]">Program detaylarını, içerikleri ve koşulları inceleyin.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <strong className="text-slate-800 block">Ön Başvuru Yap</strong>
                  <span className="text-slate-500 text-[11px]">Online ön başvuru formunu doldurun.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <strong className="text-slate-800 block">İdari Değerlendirme</strong>
                  <span className="text-slate-500 text-[11px]">Başvurunuz İslahiye Ticaret Odası tarafından değerlendirilir.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                  4
                </div>
                <div>
                  <strong className="text-slate-800 block">Kesin Kayıt</strong>
                  <span className="text-slate-500 text-[11px]">Uygun bulunan adaylara kesin kayıt bilgileri iletilir.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Bu Programdan Sonra */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-3.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Bu Programdan Sonra</span>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              {currentOutcomes.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 5: İlgili Programlar */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                İlgili Programlar
              </h3>
              <Link
                to={getCatalogLink()}
                className="text-[11px] font-semibold text-blue-600 hover:underline"
              >
                Tüm Programları Gör →
              </Link>
            </div>

            <div className="space-y-3">
              {relatedPrograms.map((rel) => (
                <Link
                  key={rel.id}
                  to={getProgramLink(rel.id)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <img
                    src={rel.image || '/images/prog_islahiye_biber.jpg'}
                    alt={rel.title}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold text-blue-600 block">
                      {rel.category}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs truncate group-hover:text-blue-600 transition-colors">
                      {rel.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 block">
                      {rel.durationMonths || `${rel.durationWeeks} Hf`} • {rel.mode}
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors text-slate-400">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </aside>

      </div>

      {/* ===================================================================== */}
      {/* 4. BENZER EĞİTİMLER CAROUSEL / BOTTOM SECTION                          */}
      {/* ===================================================================== */}
      <section className="pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Benzer Eğitimler
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              İlginizi çekebilecek diğer mesleki ve dijital gelişim programları
            </p>
          </div>

          <Link
            to={getCatalogLink()}
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
          >
            <span>Tüm Eğitim Programlarını Gör</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {relatedPrograms.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div>
                <div className="h-44 w-full overflow-hidden bg-slate-100 relative">
                  <img
                    src={p.image || '/images/prog_islahiye_biber.jpg'}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${p.badgeColor}`}>
                      {p.category}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                    <Link to={getProgramLink(p.id)}>{p.title}</Link>
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {p.durationMonths || `${p.durationWeeks} Hf`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {p.mode}
                  </span>
                </div>

                <Link
                  to={getProgramLink(p.id)}
                  className="font-semibold text-blue-600 hover:text-blue-700 text-xs inline-flex items-center gap-1 group/btn"
                >
                  <span>Programı İncele</span>
                  <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 5. MOBILE STICKY ACTION BAR (Sürtünmesiz Mobil Dönüşüm Çubuğu)        */}
      {/* ===================================================================== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-slate-900 truncate">
            {program.title}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Ücretsiz • Ön Başvuru Açık</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (isTraineePanel) {
              navigate('/kursiyer/dersler');
            } else {
              navigate(`/aday/basvuru/${program.id}`);
            }
          }}
          className="shrink-0 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
        >
          <span>{isTraineePanel ? 'Derslerime Git' : 'Ön Başvuru Yap'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
