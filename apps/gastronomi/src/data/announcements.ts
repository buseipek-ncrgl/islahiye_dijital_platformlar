import { Announcement } from '../types';

/**
 * Institutional & Cultural Announcements Dataset
 *
 * 1. Official GI Record: İslahiye Biberi (TÜRKPATENT No: 991, 05.01.2022) registered by GAZİANTEP TİCARET BORSASI.
 * 2. Editorial & Cultural Notices: Fact-checked portal inventory, oral heritage, and harvest season announcements.
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
    title: 'İslahiye Lezzet Atlası Yöresel Mutfak Envanteri Güncellemesi',
    summary:
      'İlçenin geleneksel yemek reçeteleri, taş fırın ocaklık durakları ve kültürel mutfak belleği dijital envanterde bir araya getirildi.',
    content: [
      'İslahiye mutfak kültürünü belgelemek ve gelecek kuşaklara aktarmak amacıyla oluşturulan İslahiye Lezzet Atlası bünyesinde 30 yöresel yemek ve ölçeklenebilir atölye tarifi yayımlanmıştır.',
      'Taş fırın tava ocakları, Amanos yayla yemekleri, hamur zanaatları ve kışlık kiler ürünleri ayrıntılı pişirme aşamaları ve coğrafi harita duraklarıyla birlikte incelenebilir durumdadır.',
      'Envantere yeni yöresel lezzetler, doğrulanan saha durakları ve mutfak mirası yazıları düzenli olarak eklenmeye devam etmektedir.',
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
    officialSource: 'İslahiye Dijital Platformlar Editoryal Masası',
  },
  {
    id: 'ann-03',
    title: 'Kültürel Mutfak Mirası ve Sözlü Bellek Derleme Çalışması',
    summary:
      'İslahiye’nin unutulmaya yüz tutmuş ev reçeteleri, ahşap kömbe kalıpları ve mevsimsel kiler ritüelleri kültür arşivinde belgeleniyor.',
    content: [
      'Mutfak Mirası arşivi kapsamında; taş fırınlarda meşe közüyle pişirme teknikleri, mayıs sonu firik tütsüleme gelenekleri ve eylül ayı biber sergisi kültürü kayıt altına alınmaktadır.',
      'Derlenen anlatılar, ilgili yemek reçeteleri ve harita noktalarıyla ilişkilendirilerek araştırmacılar ve ziyaretçiler için açık erişime sunulmaktadır.',
      'Kültürel miras bölümündeki yazılara "Mutfak Mirası" sekmesi üzerinden ulaşabilir, ilgili yöresel tarifleri doğrudan atölyede inceleyebilirsiniz.',
    ],
    category: 'kultur',
    categoryLabel: 'Kültürel Program',
    contentOrigin: 'editorial_narrative',
    verificationStatus: 'verified',
    isDemo: false,
    publishedAt: '2026-10-15',
    formattedDate: '15 Ekim 2026',
    publicationStatus: 'published',
    priority: 'normal',
    officialSource: 'İslahiye Mutfak Belleği Arşivi',
  },
  {
    id: 'ann-04',
    title: 'İslahiye Ovası Sonbahar Biber Kurutma ve Kış Hazırlığı Dönemi',
    summary:
      'Ağustos–Ekim biber hasat sergilerinin ardından taş dibekte pul biber işleme ve geleneksel kışlık kiler dönemi bilgileri.',
    content: [
      'Amanos Dağları eteklerindeki alüvyon toprakta yetişen İslahiye biberinin doğal güneş kurutması ağustos sonu ile ekim ayları arasında yoğunlaşmaktadır.',
      'Kurutma evresinin ardından zeytinyağı ve tuz ile dengelenerek taş dibeklerde işlenen ipek pul biber, sonbahar ve kış mutfağının ana baharatı olarak kilerlerde yerini almaktadır.',
      'Harita sayfasındaki ilgili üretim ve çarşı duraklarından mevsimsel ziyaret saatlerini kontrol edebilirsiniz.',
    ],
    category: 'gastronomi',
    categoryLabel: 'Mevsimsel Bilgi',
    contentOrigin: 'field_research',
    sourceUrl: 'https://ci.turkpatent.gov.tr/cografi-isaretler/detay/38523',
    verificationStatus: 'verified',
    isDemo: false,
    publishedAt: '2026-10-28',
    formattedDate: '28 Ekim 2026',
    publicationStatus: 'published',
    priority: 'normal',
    officialSource: 'İslahiye Lezzet Atlası Saha Arşivi',
  },
];
