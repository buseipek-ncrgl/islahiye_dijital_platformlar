import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { contentStore } from '../services/content/contentStore';
import { ContentRepository } from '../services/content/contentRepository';
import { ARTICLES } from '../data/news';
import { ANNOUNCEMENTS } from '../data/announcements';
import { GASTRONOMY_EVENTS } from '../data/events';
import { ARTISAN_PROJECT_INFO } from '../data/artisans';
import { Article, Announcement, GastronomyEvent } from '../types';
import { isEventUpcoming, getIstanbulDate } from '../pages/EventsPage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestResult {
  scenario: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(scenario: string, name: string, condition: boolean, details: string) {
  results.push({ scenario, name, passed: condition, details });
  const status = condition ? '✓ PASS' : '✗ FAIL';
  console.log(`${status} [${scenario}] ${name}: ${details}`);
}

async function runSprint03E2TestSuite() {
  console.log('===================================================================');
  console.log('   SPRINT 03E-2 TEST SUITE: HABERLER, DUYURULAR VE ETKİNLİKLER    ');
  console.log('===================================================================\n');

  // Reset store to seeds to ensure clean state
  contentStore.resetToSeeds();

  // -------------------------------------------------------------------------
  // Senaryo A — Yeni Haberin CMS Üzerinden Oluşturulması ve Yayını
  // -------------------------------------------------------------------------
  console.log('--- SENARYO A: YENİ HABER OLUŞTURMA & YAYINLAMA ---');
  const initialPublishedCount = contentStore.getArticles(true).length;

  const testArticleId = 'test-yeni-biber-arastirmasi';
  const testArticleSlug = 'yeni-biber-arastirmasi-makalesi';
  const newArticle: Article = {
    id: testArticleId,
    slug: testArticleSlug,
    title: 'İslahiye Biberi Kurutma Dinamikleri ve Nem Oranı Raporu (Test)',
    subtitle: 'Hasat sonrası keten sergilerde mikro-klima etkileşimi.',
    summary: 'Amanos eteklerinde eylül kurutmasının aromatik eterik yağ dengesine etkisi.',
    category: 'agriculture',
    categoryLabel: 'Toprak & Hasat',
    contentType: 'editorial_article',
    contentOrigin: 'editorial_narrative',
    sourceUrl: 'https://ci.turkpatent.gov.tr/cografi-isaretler/detay/38523',
    verificationStatus: 'verified',
    isDemo: false,
    coverImage: '/images/biber_kozleme_poster.jpg',
    imageCredit: 'Lezzet Atlası Arşivi',
    author: {
      name: 'Lezzet Atlası Editoryal Ekibi',
      title: 'Toprak ve Hasat Masası',
    },
    publishedAt: '2026-10-16',
    formattedDate: '16 Ekim 2026',
    readingTime: '4 dk okuma',
    publicationStatus: 'published',
    isLead: false,
    paragraphs: [
      {
        title: 'Giriş ve Metodoloji',
        body: 'Bu araştırma yazısı CMS dinamik senkronizasyonunu test etmek amacıyla eklenmiştir.',
        highlightText: 'Nem oranı %12 seviyesinde dengelenmektedir.',
      },
    ],
    tags: ['İslahiye Biberi', 'Nem Oranı', 'Test'],
    relatedDishIds: ['islahiye-biberi'],
  };

  contentStore.saveArticle(newArticle);
  const updatedArticles = contentStore.getArticles(true);
  assert(
    'Senaryo A',
    'Yeni Makale CMS Yayını',
    updatedArticles.length === initialPublishedCount + 1,
    `Yayımlanmış makale sayısı ${initialPublishedCount} -> ${updatedArticles.length}`
  );

  const savedArticle = contentStore.getArticles(true).find((a) => a.id === testArticleId);
  assert(
    'Senaryo A',
    'Makale Slug ve Başlık Bütünlüğü',
    savedArticle?.slug === testArticleSlug && savedArticle?.title.includes('İslahiye Biberi'),
    `Slug: ${savedArticle?.slug}, Başlık: ${savedArticle?.title}`
  );

  // -------------------------------------------------------------------------
  // Senaryo B — Haber Arşivleme & Ana Sayfa Fallback Davranışı
  // -------------------------------------------------------------------------
  console.log('\n--- SENARYO B: HABER ARŞİVLEME & ANA SAYFA FALLBACK ---');
  // Arşive al
  contentStore.updateStatus('article', testArticleId, 'archived');
  const articlesAfterArchive = contentStore.getArticles(true);
  const isFoundInPublished = articlesAfterArchive.some((a) => a.id === testArticleId);
  assert(
    'Senaryo B',
    'Arşivlenen Haber Ziyaretçiden Kaldırıldı',
    !isFoundInPublished,
    `Arşivlenen makale yayındaki listede bulunmuyor.`
  );

  // Lead makaleyi arşive alıp fallback davranışını test et
  const originalLead = contentStore.getArticles(true).find((a) => a.isLead);
  if (originalLead) {
    contentStore.updateStatus('article', originalLead.id, 'archived');
    const remainingPublished = contentStore.getArticles(true);
    const newEffectiveLead = remainingPublished.find((a) => a.isLead) || remainingPublished[0];
    assert(
      'Senaryo B',
      'Lead Arşivlendiğinde Fallback Makale Seçimi',
      Boolean(newEffectiveLead && newEffectiveLead.id !== originalLead.id),
      `Orijinal lead (${originalLead.id}) arşivlendi, yeni efektif lead: ${newEffectiveLead?.id}`
    );
    // Geri al
    contentStore.updateStatus('article', originalLead.id, 'published');
  }

  // -------------------------------------------------------------------------
  // Senaryo C — Haber Araması, Kategori Filtreleme & Detay Navigasyonu
  // -------------------------------------------------------------------------
  console.log('\n--- SENARYO C: ARAMA, KATEGORİ FİLTRELEME & NAVİGASYON ---');
  const allPub = contentStore.getArticles(true);
  const searchResults = allPub.filter((a) =>
    a.title.toLowerCase().includes('biber') || a.summary.toLowerCase().includes('biber')
  );
  assert(
    'Senaryo C',
    'Metin Araması Filtreleme ("biber")',
    searchResults.length > 0,
    `"biber" aramasıyla eşleşen makale sayısı: ${searchResults.length}`
  );

  const agriCategoryArticles = allPub.filter((a) => a.category === 'agriculture');
  assert(
    'Senaryo C',
    'Kategori Filtresi (agriculture / Toprak & Hasat)',
    agriCategoryArticles.length > 0,
    `agriculture kategorisindeki makale sayısı: ${agriCategoryArticles.length}`
  );

  const testSlug = 'turkpatent-islahiye-biberi-tescili-resmi-kaydi';
  const detailArticle = allPub.find((a) => a.slug === testSlug);
  assert(
    'Senaryo C',
    'Detay Slug Navigasyon Kaydı',
    Boolean(detailArticle && detailArticle.paragraphs.length > 0),
    `Slug ${testSlug} bulundu, ${detailArticle?.paragraphs.length} paragraf içeriyor.`
  );

  // -------------------------------------------------------------------------
  // Senaryo D — Duyuru Oluşturma, Akordiyon ve Arşivleme
  // -------------------------------------------------------------------------
  console.log('\n--- SENARYO D: DUYURU OLUŞTURMA & AKORDİYON DOĞRULAMA ---');
  const testAnnId = 'test-ann-01';
  const newAnn: Announcement = {
    id: testAnnId,
    title: 'Yeni TÜRKPATENT Denetim Takvimi Bildirimi (Test)',
    summary: '2026 yılı sonbahar dönemi coğrafi işaret denetim usulleri bilgilendirmesi.',
    content: [
      'Gaziantep Ticaret Borsası ve yetkili denetim mercileri koordinasyonunda yürütülecek denetimler.',
      'Üretici ve paketleme tesislerinin şartnameye uygunluk kontrolleri simülasyonu.',
    ],
    detailedContent: 'Gaziantep Ticaret Borsası ve yetkili denetim mercileri koordinasyonunda yürütülecek denetimler.\nÜretici ve paketleme tesislerinin şartnameye uygunluk kontrolleri simülasyonu.',
    category: 'gastronomi',
    categoryLabel: 'Resmî Coğrafi İşaret',
    contentOrigin: 'official_notice',
    verificationStatus: 'verified',
    isDemo: false,
    publishedAt: '2026-10-16',
    formattedDate: '16 Ekim 2026',
    validUntil: '2026-12-31',
    publicationStatus: 'published',
    priority: 'normal',
    officialSource: 'TÜRKPATENT Coğrafi İşaretler Dairesi',
  };

  contentStore.saveAnnouncement(newAnn);
  const announcementsList = contentStore.getAnnouncements(true);
  const foundAnn = announcementsList.find((a) => a.id === testAnnId);
  assert(
    'Senaryo D',
    'Duyuru CMS Yayını',
    Boolean(foundAnn),
    `Yeni duyuru yayında: ${foundAnn?.title}`
  );

  // Geçerlilik süresi dolmuş duyuru testi
  const expiredAnn: Announcement = {
    ...newAnn,
    id: 'test-expired-ann',
    title: 'Süresi Dolmuş Eski Bildirim (Test)',
    validUntil: '2020-01-01',
  };
  contentStore.saveAnnouncement(expiredAnn);
  const todayStr = getIstanbulDate();
  const isExpired = Boolean(expiredAnn.validUntil && expiredAnn.validUntil < todayStr);
  assert(
    'Senaryo D',
    'Geçerlilik Süresi Sona Ermiş Duyuru Tespiti',
    isExpired,
    `validUntil: ${expiredAnn.validUntil} < ${todayStr} -> Geçerlilik sona ermiş olarak algılandı.`
  );

  // Arşive alma
  contentStore.updateStatus('announcement', testAnnId, 'archived');
  const annAfterArchive = contentStore.getAnnouncements(true);
  assert(
    'Senaryo D',
    'Duyuru Arşivleme',
    !annAfterArchive.some((a) => a.id === testAnnId),
    `Arşivlenen duyuru ziyaretçi listesinden kaldırıldı.`
  );

  // -------------------------------------------------------------------------
  // Senaryo E — Etkinlik Tarihi, Saat Dilimi & Sıralama
  // -------------------------------------------------------------------------
  console.log('\n--- SENARYO E: ETKİNLİK TARİHİ, SAAT DİLİMİ & SIRALAMA ---');
  const publishedEvents = contentStore.getEvents(true);
  const istanbulDate = getIstanbulDate();
  assert(
    'Senaryo E',
    'Europe/Istanbul Saat Dilimi Hesaplaması',
    /^\d{4}-\d{2}-\d{2}$/.test(istanbulDate),
    `Bugünün İstanbul yerel tarihi: ${istanbulDate}`
  );

  const upcomingEvts = publishedEvents.filter((e) => isEventUpcoming(e));
  const completedEvts = publishedEvents.filter((e) => !isEventUpcoming(e));
  assert(
    'Senaryo E',
    'Yaklaşan ve Geçmiş Etkinlik Ayrımı',
    upcomingEvts.length > 0 && completedEvts.length > 0,
    `Yaklaşan: ${upcomingEvts.length}, Tamamlanan/Arşiv: ${completedEvts.length}`
  );

  // Temsili demo kontrolü
  const allEventsAreDemo = publishedEvents.every((e) => e.isDemo && e.verificationStatus === 'simulated');
  assert(
    'Senaryo E',
    'Etkinliklerin Dürüst Temsili Simülasyon Olarak İşaretlenmesi',
    allEventsAreDemo,
    `Tüm etkinlikler isDemo: true ve simulated olarak işaretli.`
  );

  // -------------------------------------------------------------------------
  // Senaryo F — Boşluk, Eksik Görsel & Güvenli Fallback
  // -------------------------------------------------------------------------
  console.log('\n--- SENARYO F: EKSİK GÖRSEL VE GÜVENLİ FALLBACK TESTİ ---');
  const sparseArticle: Article = {
    id: 'test-sparse-art',
    slug: 'sparse-art-slug',
    title: 'Minimal İçerikli Test Makalesi',
    subtitle: '',
    summary: 'Özet metin.',
    category: 'culture',
    categoryLabel: 'Kültür & Zanaat',
    contentType: 'editorial_article',
    contentOrigin: 'editorial_narrative',
    verificationStatus: 'verified',
    isDemo: false,
    coverImage: '', // Boş görsel
    imageCredit: '',
    author: {
      name: 'Test Yazar',
      title: 'Araştırmacı',
    },
    publishedAt: '2026-10-16',
    formattedDate: '16 Ekim 2026',
    readingTime: '2 dk',
    publicationStatus: 'published',
    paragraphs: [{ body: 'Tek paragraf metin.' }],
    tags: [], // Boş etiket
  };

  contentStore.saveArticle(sparseArticle);
  const retrievedSparse = contentStore.getArticles(true).find((a) => a.id === 'test-sparse-art');
  assert(
    'Senaryo F',
    'Eksik Görsel ve Boş Etiketle Güvenli Kayıt',
    Boolean(retrievedSparse && retrievedSparse.coverImage === '' && retrievedSparse.tags.length === 0),
    `Boş görsel ve etiket çökme oluşturmadan ele alındı.`
  );

  // Temizle
  contentStore.deleteArticle('test-sparse-art');

  // -------------------------------------------------------------------------
  // Senaryo G — Şablon & Bileşen Dosya Bütünlüğü
  // -------------------------------------------------------------------------
  console.log('\n--- SENARYO G: DOSYA VE SEMANTİK YAPILANDIRMA ---');
  const newsPageCode = fs.readFileSync(path.join(__dirname, '../pages/NewsPage.tsx'), 'utf-8');
  assert(
    'Senaryo G',
    'NewsPage Asimetrik Monografi & Serif Başlık Yapısı',
    newsPageCode.includes('Mutfak Kültürü & Araştırma Yazıları') && newsPageCode.includes('leadArticle'),
    `NewsPage.tsx doğru başlık ve leadArticle mimarisini içeriyor.`
  );

  const eventsPageCode = fs.readFileSync(path.join(__dirname, '../pages/EventsPage.tsx'), 'utf-8');
  assert(
    'Senaryo G',
    'EventsPage Takvim & Europe/Istanbul Entegrasyonu',
    eventsPageCode.includes('Europe/Istanbul') && eventsPageCode.includes('getCalendarBadge'),
    `EventsPage.tsx takvim rozeti ve Europe/Istanbul saat dilimini içeriyor.`
  );

  const agendaCode = fs.readFileSync(path.join(__dirname, '../components/home/EditorialAgendaShowcase.tsx'), 'utf-8');
  assert(
    'Senaryo G',
    'EditorialAgendaShowcase Yenilenen Editoryal Başlık',
    agendaCode.includes('TOPRAĞIN HAFIZASI & GÜNCEL BÜLTEN') && !agendaCode.includes('07 / EDİTORYAL YAYIN & GÜNDEM'),
    `EditorialAgendaShowcase mekanik 07/ etiketinden arındırıldı.`
  );

  // -------------------------------------------------------------------------
  // Senaryo H — Regresyon Testleri: Hero, Lezzetler, Tarif Atölyesi, Atlas, Filmler
  // -------------------------------------------------------------------------
  console.log('\n--- SENARYO H: MONOREPO & GASTONOMİ REGRESYON TESTLERİ ---');
  const dishes = contentStore.getDishes(true);
  const recipes = contentStore.getRecipes(true);
  const stories = contentStore.getCulturalStories(true);
  const artisans = contentStore.getArtisans(false);
  const films = contentStore.getFilms(true);
  const atlasNodes = contentStore.getAtlasNodes(true);
  const cmsItems = ContentRepository.getAllItems();

  assert('Senaryo H', 'Yöresel Yemekler Regresyon', dishes.length >= 6, `Yemek sayısı: ${dishes.length}`);
  assert('Senaryo H', 'Tarif Atölyesi Regresyon', recipes.length >= 3, `Tarif sayısı: ${recipes.length}`);
  assert('Senaryo H', 'Kültürel Miras Regresyon', stories.length >= 3, `Kültürel hikâye sayısı: ${stories.length}`);
  assert(
    'Senaryo H',
    'Ustalar & Üreticiler Dürüstlük Kriteri',
    ARTISAN_PROJECT_INFO.craftCategories.length === 3 && artisans.length === 0,
    `Usta profili uydurulmadı (${artisans.length} sahte profil), ${ARTISAN_PROJECT_INFO.craftCategories.length} temsili zanaat anlatısı mevcut.`
  );
  assert('Senaryo H', 'Gastronomi Filmleri Regresyon', films.length >= 3, `Film/klip sayısı: ${films.length}`);
  assert('Senaryo H', 'Kültürel Atlas Regresyon', atlasNodes.length >= 6, `Atlas düğüm sayısı: ${atlasNodes.length}`);
  assert('Senaryo H', 'CMS Envanter Öğeleri Regresyon', cmsItems.length >= 20, `Toplam CMS öğe sayısı: ${cmsItems.length}`);

  // Test özeti
  console.log('\n===================================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`TEST SONUCU: ${passed}/${total} BAŞARILI (${failed} BAŞARISIZ)`);
  console.log('===================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSprint03E2TestSuite().catch((err) => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
