import { Announcement } from '../types';

/**
 * Institutional Announcements Dataset (Sprint 01F - Content Reliability Revision)
 *
 * CRITICAL COMPLIANCE RULES:
 * 1. GI Ownership Accuracy: İslahiye Biberi (TÜRKPATENT No: 991, 05.01.2022) is registered by
 *    GAZİANTEP TİCARET BORSASI.
 * 2. Real vs Demo separation: Simulated demo announcements are clearly flagged with `isDemo: true`,
 *    `verificationStatus: 'simulated'`, and `contentOrigin: 'temsili_demo'`.
 * 3. Official notices have verified source references (`sourceUrl`).
 */
export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-01',
    title: 'İslahiye Biberi Coğrafi İşaret Tescil Kaydı ve Bilgilendirme',
    summary:
      'TÜRKPATENT nezdinde 991 tescil numarasıyla kayıtlı İslahiye Biberi resmî tescil bilgileri, ürün özellikleri ve kayıt detayları.',
    content: [
      'TÜRKPATENT resmî coğrafi işaret kayıtlarına göre İslahiye Biberi, 05.01.2022 tarihinde 991 tescil numarasıyla Gaziantep Ticaret Borsası tarafından tescil ettirilmiştir.',
      'Menşe adı korumasına sahip İslahiye Biberi; Amanos Dağları’nın serinletici rüzgârı, bölgenin yüksek demir oranlı alüvyon toprak yapısı ve geleneksel kurutma yöntemleriyle kendine has koyu kırmızı rengini, ipeksi dokusunu ve tatlı-acı dengesini kazanmaktadır.',
      'Tescil belgesi, ürün şartnamesi ve resmî kayıt detayları TÜRKPATENT Coğrafi İşaretler Portalı üzerinden kamuya açık olarak incelenebilmektedir.',
    ],
    category: 'gastronomi',
    categoryLabel: 'Resmî Coğrafi İşaret Kaydı',
    contentOrigin: 'official_notice',
    sourceUrl: 'https://ci.turkpatent.gov.tr/cografi-isaretler/detay/38523',
    verificationStatus: 'verified',
    isDemo: false,
    publishedAt: '2022-01-05',
    formattedDate: '05 Ocak 2022 (Resmî Tescil)',
    publicationStatus: 'published',
    priority: 'normal',
    officialSource: 'TÜRKPATENT Coğrafi İşaretler Portalı (Tescil Ettiren: Gaziantep Ticaret Borsası)',
  },
  {
    id: 'ann-02',
    title: 'İslahiye Lezzet Atlası Prototip ve Dijital Arşiv Bilgilendirmesi',
    summary:
      'İslahiye Dijital Platformlar koordinasyonunda yürütülen yerel gastronomi prototipi ve kültürel miras derleme çalışmaları.',
    content: [
      'İslahiye Dijital Platformlar yerel gastronomi ve mutfak kültürünü tanıtmak amacıyla hazırladığı İslahiye Lezzet Atlası prototipi geliştirme aşamasındadır.',
      'İlçemizdeki kadim fırın ocaklıkları, el oyması kömbe kalıpları, yerel üretici hikâyeleri ve geleneksel yemek tarifleri kültürel bellek kapsamında dijital olarak modellenmektedir.',
      'Bu portal bir frontend prototipi olup resmî idari işlem, başvuru ve belge onay merci değildir.',
    ],
    category: 'kurumsal',
    categoryLabel: 'Kurumsal Bilgilendirme',
    contentOrigin: 'official_notice',
    verificationStatus: 'verified',
    isDemo: false,
    publishedAt: '2026-10-01',
    formattedDate: '01 Ekim 2026',
    publicationStatus: 'published',
    priority: 'normal',
    officialSource: 'İslahiye Dijital Platformlar Ekibi',
  },
  {
    id: 'ann-03',
    title: 'Örnek Bildirim: Kültürel Mutfak Mirası Saha Arşivi Çağrısı (Demo)',
    summary:
      'Gelecekteki sözlü tarih derleme süreçlerini simüle etmek amacıyla hazırlanmış arayüz test duyurusu.',
    content: [
      'Bu bildirim, portal duyuru modülünün akordiyon yapısını ve gösterimini test etmek amacıyla oluşturulmuş temsili bir arayüz simülasyonudur.',
      'Gelecekte açılabilecek sözlü tarih derleme ve aile arşivi katkı süreçlerinin görsel hiyerarşisini gösterir.',
      'Şu an için aktif bir resmî başvuru kabulü veya teslim noktası bulunmamaktadır.',
    ],
    category: 'kultur',
    categoryLabel: 'Temsili Demo Bildirimi',
    contentOrigin: 'temsili_demo',
    verificationStatus: 'simulated',
    isDemo: true,
    publishedAt: '2026-10-05',
    formattedDate: '05 Ekim 2026',
    validUntil: '2026-12-31',
    publicationStatus: 'published',
    priority: 'normal',
    officialSource: 'Arayüz Tasarım Simülasyonu (Demo)',
  },
  {
    id: 'ann-04',
    title: 'Örnek Bildirim: Mesleki Mutfak Hijyen Semineri Takvim Taslağı (Demo)',
    summary:
      'Eğitim bilgilendirme içeriklerinin şablon testini gerçekleştirmek için hazırlanmış örnek kayıt.',
    content: [
      'Bu içerik bir arayüz simülasyonudur; henüz kesinleşmiş resmî bir takvim veya kayıt kabulü bulunmamaktadır.',
      'Eğitim ve seminer duyurularının görsel hiyerarşisini, kategori rozetlerini ve son geçerlilik tarihlerini doğrulamak için hazırlanmıştır.',
    ],
    category: 'egitim',
    categoryLabel: 'Temsili Demo Bildirimi',
    contentOrigin: 'temsili_demo',
    verificationStatus: 'simulated',
    isDemo: true,
    publishedAt: '2026-09-15',
    formattedDate: '15 Eylül 2026',
    publicationStatus: 'published',
    priority: 'normal',
    officialSource: 'Arayüz Tasarım Simülasyonu (Demo)',
  },
];
