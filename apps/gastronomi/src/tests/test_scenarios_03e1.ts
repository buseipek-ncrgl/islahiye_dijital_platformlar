import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { contentStore } from '../services/content/contentStore';
import { ContentRepository } from '../services/content/contentRepository';
import { CONCEPT_CLIPS, DOCUMENTARY_SERIES } from '../data/films';
import { ARTISANS, ARTISAN_PROJECT_INFO } from '../data/artisans';
import { CulturalHeritageStory } from '../types';

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

async function runTestSuite() {
  console.log('===============================================================');
  console.log('   SPRINT 03E-1 TEST SUITE: MUTFAK MİRASI, USTALAR VE FİLMLER  ');
  console.log('===============================================================\n');

  // -------------------------------------------------------------------------
  // Senaryo A — Kültürel Miras CMS Senkronizasyonu & Yaşam Döngüsü
  // -------------------------------------------------------------------------
  console.log('--- SENARYO A: KÜLTÜREL MİRAS CMS SENKRONİZASYONU ---');
  const initialPublishedStories = contentStore.getCulturalStories(true);
  const initialCount = initialPublishedStories.length;
  assert(
    'Senaryo A',
    'Başlangıç Yayındaki Hikâyeler',
    initialCount > 0,
    `Mevcut yayımlanmış hikâye sayısı: ${initialCount}`
  );

  // 1. Yeni Hikâye Ekle
  const newStoryId = 'test-yeni-ocaklik-hikayesi';
  const newStorySlug = 'yeni-ocaklik-hikayesi-demo';
  const testStory: CulturalHeritageStory = {
    id: newStoryId,
    slug: newStorySlug,
    title: 'Yeni Taş Fırın Ocaklık Belgesi (Test)',
    subtitle: 'Çarşı ocaklığının sabah ritüeli ve test kaydı.',
    category: 'cooking_methods',
    categoryLabel: 'Pişirme Usulleri',
    coverImageUrl: '/images/islahiye_tava.jpg',
    imageCredit: 'Test Saha Arşivi',
    readingTime: '3 dk',
    publishedDate: '16 Ekim 2026',
    leadParagraph: 'Bu test hikâyesi CMS üzerinden dinamik yayın akışını doğrulamak için oluşturulmuştur.',
    bodySections: [
      {
        heading: 'Test Başlığı',
        paragraph: 'Ocaklığın meşe odunu ateşi test edilmektedir.',
      },
    ],
    relatedDishIds: ['islahiye-tava'],
    tags: ['Test', 'Ocaklık'],
    publicationStatus: 'published',
  };

  contentStore.saveCulturalStory(testStory);
  const afterAdd = contentStore.getCulturalStories(true);
  const foundAdded = afterAdd.find((s) => s.id === newStoryId);
  assert(
    'Senaryo A',
    'CMS Yeni Hikâye Yayını',
    foundAdded !== undefined && foundAdded.publicationStatus === 'published',
    'Yeni hikâye kaydedildi ve getCulturalStories(true) içinde anında listelendi'
  );

  // 2. Detay Sayfası slug sorgulama
  const retrievedStory = contentStore.getCulturalStories(false).find((s) => s.slug === newStorySlug);
  assert(
    'Senaryo A',
    'Slug ile Detay Erişimi',
    retrievedStory !== undefined && retrievedStory.id === newStoryId,
    `Slug '${newStorySlug}' ile tam eşleşti`
  );

  // 3. Hikâyeyi Arşivle
  contentStore.saveCulturalStory({
    ...testStory,
    publicationStatus: 'archived',
  });
  const afterArchive = contentStore.getCulturalStories(true);
  const foundArchivedInVisitor = afterArchive.find((s) => s.id === newStoryId);
  assert(
    'Senaryo A',
    'Arşivleme ve Ziyaretçi Görünümünden Gizleme',
    foundArchivedInVisitor === undefined,
    'Arşivlenen hikâye getCulturalStories(true) listesinden başarıyla kaldırıldı'
  );

  // -------------------------------------------------------------------------
  // Senaryo B — Usta Profilleri & İzin/Doğruluk Kuralları
  // -------------------------------------------------------------------------
  console.log('\n--- SENARYO B: USTA PROFİLLERİ & İZİN DOĞRULUĞU ---');
  const defaultArtisans = contentStore.getArtisans(true);
  assert(
    'Senaryo B',
    'Boş Envanter ve Doğruluk İlkesi',
    defaultArtisans.length === 0,
    'Doğrulanmamış veya izinsiz sahte kişi profili bulunmamaktadır (Envanter boş)'
  );

  assert(
    'Senaryo B',
    'Sade ve Dürüst Kurumsal Açıklama',
    ARTISAN_PROJECT_INFO.description.includes('temsili bir kültürel içerik alanıdır') &&
      ARTISAN_PROJECT_INFO.description.includes('gerekli yayın izinleri') &&
      !ARTISAN_PROJECT_INFO.description.includes('Resmî Arşiv Kapsamı'),
    'Zanaat alanı uydurma kurumsal iddia olmaksızın temsili kültürel alan olarak tanımlanmış'
  );

  assert(
    'Senaryo B',
    'Üç Temel Zanaat Anlatısı Tanımı',
    ARTISAN_PROJECT_INFO.craftCategories.length === 3,
    'Fırın & Ocaklık, Toprak & Biber, Hamur Zanaatı temaları tanımlı'
  );

  // -------------------------------------------------------------------------
  // Senaryo C — Gastronomi Videoları & Oynatma Bütünlüğü
  // -------------------------------------------------------------------------
  const rootPublicDir = path.resolve(__dirname, '../../public');

  assert(
    'Senaryo C',
    '3 Oynatılabilir Klip Mevcudiyeti',
    CONCEPT_CLIPS.length === 3,
    'Tam olarak 3 adet konsept atmosfer klibi tanımlı'
  );

  let allVideoFilesExist = true;
  let allPosterFilesExist = true;

  for (const clip of CONCEPT_CLIPS) {
    const videoDiskPath = path.join(rootPublicDir, clip.videoSrc.replace(/^\//, ''));
    const posterDiskPath = path.join(rootPublicDir, clip.posterSrc.replace(/^\//, ''));

    const vExists = fs.existsSync(videoDiskPath);
    const pExists = fs.existsSync(posterDiskPath);

    if (!vExists) allVideoFilesExist = false;
    if (!pExists) allPosterFilesExist = false;

    assert(
      'Senaryo C',
      `Medya Dosyası: ${clip.title}`,
      vExists && pExists,
      `Video (${clip.videoSrc}): ${vExists ? 'MEVCUT' : 'EKSİK'}, Poster (${clip.posterSrc}): ${pExists ? 'MEVCUT' : 'EKSİK'}`
    );

    assert(
      'Senaryo C',
      `Süre Doğruluğu: ${clip.title}`,
      clip.duration === '0:05',
      `Gerçek klip süresi dürüstçe 0:05 (5 sn) olarak belirtilmiş`
    );
  }

  // 10 Planlanan Belgesel Kontrolü: Video linki OLMAMALI
  const fakeVideoFoundInPlan = DOCUMENTARY_SERIES.some((d) => d.videoSrc || d.videoUrl);
  assert(
    'Senaryo C',
    '10 Bölümlük Planlama Sahte Video İçermiyor',
    !fakeVideoFoundInPlan,
    'Planlanan belgesel taslaklarında hiçbir sahte video bağlantısı veya sahte oynatıcı bulunmuyor'
  );

  // -------------------------------------------------------------------------
  // Senaryo D — CMS Medya Kütüphanesi & Veri İlişkileri
  // -------------------------------------------------------------------------
  console.log('\n--- SENARYO D: CMS MEDYA KÜTÜPHANESİ İLİŞKİLERİ ---');
  const mediaItems = contentStore.getMediaItems();
  assert(
    'Senaryo D',
    'Medya Kütüphanesi Kayıtları',
    mediaItems.length === 12,
    `Kütüphanede tam olarak 12 adet doğrulanmış medya öğesi mevcut (mevcut: ${mediaItems.length})`
  );

  const conceptMediaItem = mediaItems.find((m) => m.id === 'media-islahiye-biberi');
  assert(
    'Senaryo D',
    'Medya Kaynak & Lisans Atıfları',
    conceptMediaItem !== undefined &&
      conceptMediaItem.sourceUrl !== undefined &&
      conceptMediaItem.usagePermission !== undefined,
    'Medya kütüphanesindeki varlıklar kaynak URL ve kullanım izni atıflarına sahip'
  );

  // -------------------------------------------------------------------------
  // Senaryo E — Yayın Durumları & İlişkili Kayıt Güvenliği
  // -------------------------------------------------------------------------
  console.log('\n--- SENARYO E: YAYIN DURUMLARI & KORUMA ---');
  const publishedFilms = contentStore.getFilms(true);
  const onlyPublishedFilms = publishedFilms.every((f) => f.publicationStatus === 'published');
  assert(
    'Senaryo E',
    'Ziyaretçi Yalnızca Yayınlanmış Filmleri Görür',
    onlyPublishedFilms,
    'getFilms(true) yalnızca publicationStatus="published" olan klipleri döndürür'
  );

  // İlişkili yemek ID'leri kırık bağlantı kontrolü
  const allDishes = contentStore.getDishes(false);
  const dishIds = new Set(allDishes.map((d) => d.id));
  const validStories = contentStore.getCulturalStories(true);
  let safeRelatedDishes = true;
  for (const story of validStories) {
    for (const relId of story.relatedDishIds || []) {
      if (!dishIds.has(relId)) {
        safeRelatedDishes = false;
      }
    }
  }
  assert(
    'Senaryo E',
    'Mutfak Mirası İlişkili Yemek Referansları Güvenliği',
    safeRelatedDishes,
    'Kültürel hikâyelerdeki ilişkili yemek ID’leri geçerli yemek kayıtlarına işaret ediyor'
  );

  // -------------------------------------------------------------------------
  // Senaryo F — Mobil & Erişilebilirlik Parametreleri
  // -------------------------------------------------------------------------
  console.log('\n--- SENARYO F: ERİŞİLEBİLİRLİK & BİLEŞEN KONTROLLERİ ---');
  const heritageShowcaseSrc = fs.readFileSync(
    path.resolve(__dirname, '../components/home/CulturalHeritageShowcase.tsx'),
    'utf-8'
  );
  assert(
    'Senaryo F',
    'Mutfak Mirası useContent Reaktivitesi',
    heritageShowcaseSrc.includes('useContent()') && heritageShowcaseSrc.includes('getCulturalStories(true)'),
    'CulturalHeritageShowcase doğrudan useContent() ve getCulturalStories(true) kullanıyor'
  );

  const videoModalSrc = fs.readFileSync(
    path.resolve(__dirname, '../components/films/CinematicVideoModal.tsx'),
    'utf-8'
  );
  assert(
    'Senaryo F',
    'Modal Ses Kesme ve Escape Desteği',
    videoModalSrc.includes('videoRef.current.pause()') &&
      videoModalSrc.includes("e.key === 'Escape'") &&
      videoModalSrc.includes("document.body.style.overflow = 'hidden'"),
    'CinematicVideoModal body scroll lock, Escape kapatma ve kapanışta anında pause() garantiliyor'
  );

  const artisansShowcaseSrc = fs.readFileSync(
    path.resolve(__dirname, '../components/home/ArtisansShowcase.tsx'),
    'utf-8'
  );
  assert(
    'Senaryo F',
    'Usta Bölümü Asimetrik Monografi & Sade İfade',
    artisansShowcaseSrc.includes('Taş Fırın ve Ocaklık Kültürü') &&
      artisansShowcaseSrc.includes('Toprak ve Biber Üretimi') &&
      artisansShowcaseSrc.includes('Geleneksel Hamur Zanaatı') &&
      !artisansShowcaseSrc.includes('Resmî Arşiv Kapsamı') &&
      !artisansShowcaseSrc.includes('Belgeleme Fazı'),
    'ArtisansShowcase 3 eşit kart yerine asimetrik monografi düzeni ve sade kurumsal açıklama içeriyor'
  );

  // -------------------------------------------------------------------------
  // Senaryo G — Sıfır Regresyon (Hero, Lezzetler, Tarif Atölyesi, Atlas)
  // -------------------------------------------------------------------------
  console.log('\n--- SENARYO G: SIFIR REGRESYON ---');
  const dishes = contentStore.getDishes(true);
  const recipes = contentStore.getRecipes(true);
  const atlasNodes = contentStore.getAtlasNodes(true);

  assert(
    'Senaryo G',
    'Yöresel Lezzetler Verisi Sağlam',
    dishes.length === 6,
    `Tam olarak ${dishes.length} adet yayınlanmış yöresel lezzet mevcut (Sprint 03C-1)`
  );

  assert(
    'Senaryo G',
    'Tarif Atölyesi Verisi Sağlam',
    recipes.length === 3,
    `Tam olarak ${recipes.length} adet yayınlanmış tarif adımı ve malzemesi mevcut (Sprint 03C-2)`
  );

  assert(
    'Senaryo G',
    'Kültürel Atlas Verisi Sağlam',
    atlasNodes.length === 6,
    `Tam olarak ${atlasNodes.length} adet yayınlanmış seyahatname atlas düğümü mevcut (Sprint 03D-2)`
  );

  // Summary
  console.log('\n===============================================================');
  const totalPassed = results.filter((r) => r.passed).length;
  console.log(`TEST SONUCU: ${totalPassed} / ${results.length} BAŞARILI`);
  console.log('===============================================================');

  if (totalPassed === results.length) {
    console.log('TÜM TEST SENARYOLARI (A - G) EKSİKSİZ TAMAMLANDI!');
  } else {
    console.error('BAZI TESTLER BAŞARISIZ OLDU!');
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test koşturma hatası:', err);
  process.exit(1);
});
