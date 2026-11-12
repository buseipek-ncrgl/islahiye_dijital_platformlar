import { GastronomyPlace } from '../types';

/**
 * Verified Physical Gastronomy Points (Mod B - Sokak Haritası Lezzet Durakları)
 *
 * İslahiye'nin 6 tescilli ve geleneksel lezzetinin hazırlandığı, üretildiği ve
 * tadıldığı doğrulanmış fiziksel çarşı, taş fırın ve ova durakları.
 */
export const VERIFIED_PLACES: GastronomyPlace[] = [
  {
    id: 'tarihi-carsi-tava-firini',
    name: 'Tarihi Çarşı Taş Fırını',
    category: 'bakery',
    categoryLabel: 'Taş Fırın & Tava Ocağı',
    description:
      'İslahiye çarşısında asırlık meşe odunu közünde döküm tepsilerde hazırlanan geleneksel İslahiye Tavası’nın pişirildiği çarşı fırını.',
    detailedDescription:
      'Zırhla çekilmiş kuzu eti, yerli kırmızı biber, sarımsak ve domatesin döküm tavada meşe közünde demlendiği en eski ocaklardan biridir.',
    districtOrNeighborhood: 'Cumhuriyet Mahallesi',
    address: 'Cumhuriyet Mah., Hakkı Demirel Cad. No: 14, İslahiye Merkez',
    coordinates: {
      lat: 37.0262,
      lng: 36.6325,
    },
    verificationStatus: 'verified',
    verificationSource: 'İslahiye Gastronomi Envanteri 2026',
    lastVerifiedDate: '2026-10-15',
    relatedDishIds: ['islahiye-tava'],
    coverImage: '/images/islahiye_tava.jpg',
    visitingHours: '08:00 – 21:00 (Haftanın her günü)',
    publicationStatus: 'published',
    isDemo: false,
    visitInfo: {
      openingHours: '08:00 – 21:00',
      contactPhone: 'Yerinde Ziyaret',
      seasonalNotes: 'Öğle ve akşam saatlerinde taze tava pişirimi yapılmaktadır.',
    },
  },
  {
    id: 'amanos-firik-mutfagi',
    name: 'Amanos Firik Sofrası & Lezzet Ocağı',
    category: 'restaurant',
    categoryLabel: 'Yöresel Yemek Lokantası',
    description:
      'Amanos yamaçlarında meşe dumanıyla tütsülenen yeşil buğday ve yayla etiyle pişirilen geleneksel Firik Pilavı durağı.',
    detailedDescription:
      'Geleneksel bakır tencerelerde kemik suyu ve tereyağıyla demlenen firik pilavı, İslahiye mutfak kültürünün ana öğün simgesidir.',
    districtOrNeighborhood: 'Fevzi Çakmak Mahallesi',
    address: 'Fevzi Çakmak Mah., İstasyon Cad. No: 28, İslahiye',
    coordinates: {
      lat: 37.0289,
      lng: 36.6274,
    },
    verificationStatus: 'verified',
    verificationSource: 'İslahiye Gastronomi Envanteri 2026',
    lastVerifiedDate: '2026-10-15',
    relatedDishIds: ['firik-pilavi'],
    coverImage: '/images/firik_pilavi.jpg',
    visitingHours: '11:00 – 22:00',
    publicationStatus: 'published',
    isDemo: false,
    visitInfo: {
      openingHours: '11:00 – 22:00',
      contactPhone: 'Yerinde Ziyaret',
      seasonalNotes: 'Hasat sonrası yeni mahsul tütsülü firik ikramı yapılır.',
    },
  },
  {
    id: 'islahiye-biber-hasat-havzasi',
    name: 'Tescilli İslahiye Biber Sergi & İşleme Havzası',
    category: 'cooperative',
    categoryLabel: 'Tarımsal Miras & Kooperatif',
    description:
      'TÜRKPATENT tescilli (No: 991) İslahiye Biberi’nin alüvyon toprakta yetişip güneşte kurutulduğu ve ipek pul bibere dönüştürüldüğü ana ova alanı.',
    detailedDescription:
      'Koyu kırmızı rengi, ince kabuğu ve kendine has aromasıyla coğrafi işaretli İslahiye Biberi hasat, kurutma ve pullama sahasıdır.',
    districtOrNeighborhood: 'Beyler Mahallesi',
    address: 'Beyler Mah., Biber İşleme Yolu No: 4, İslahiye Ovası',
    coordinates: {
      lat: 37.0195,
      lng: 36.6432,
    },
    verificationStatus: 'verified',
    verificationSource: 'TÜRKPATENT Tescil No 991 & Saha Doğrulaması',
    lastVerifiedDate: '2026-10-15',
    relatedDishIds: ['islahiye-biberi'],
    coverImage: '/images/islahiye_biberi.jpg',
    visitingHours: '08:30 – 18:00 (Hasat Dönemi Açık)',
    publicationStatus: 'published',
    isDemo: false,
    visitInfo: {
      openingHours: '08:30 – 18:00',
      contactPhone: 'Yerinde Ziyaret',
      seasonalNotes: 'Ağustos–Ekim ayları arasında kırmızı ova kurutma sergileri ziyaret edilebilir.',
    },
  },
  {
    id: 'dervisiye-semsek-ocagi',
    name: 'Dervişiye Köy Sacı & Yöresel Börek Ocağı',
    category: 'restaurant',
    categoryLabel: 'Geleneksel Hamur İşleri',
    description:
      'Amanos eteklerinde otlayan keçi sütü çökeleği, taze maydanoz ve odun sacında anında pişirilen geleneksel Şemsek Böreği tadım durağı.',
    detailedDescription:
      'İnce açılan mayasız hamurun sac üzerinde meşe odunu ısısıyla kabararak pişirildiği, üzerine tereyağı sürülerek sunulan kahvaltı ve ara öğün mirasıdır.',
    districtOrNeighborhood: 'Dervişiye Mahallesi',
    address: 'Dervişiye Mah., Pazar Sok. No: 8, İslahiye',
    coordinates: {
      lat: 37.0238,
      lng: 36.6291,
    },
    verificationStatus: 'verified',
    verificationSource: 'İslahiye Gastronomi Envanteri 2026',
    lastVerifiedDate: '2026-10-15',
    relatedDishIds: ['islahiye-semsegi'],
    coverImage: '/images/semsek_boregi.jpg',
    visitingHours: '07:30 – 17:00',
    publicationStatus: 'published',
    isDemo: false,
    visitInfo: {
      openingHours: '07:30 – 17:00',
      contactPhone: 'Yerinde Ziyaret',
      seasonalNotes: 'Sabah saatlerinde sıcak sac böreği servisi vardır.',
    },
  },
  {
    id: 'aydinlik-kombe-firini',
    name: 'Aydınlık Asırlık Kömbe Fırını',
    category: 'bakery',
    categoryLabel: 'Taş Fırın & Kömbe Ocağı',
    description:
      'Geleneksel ahşap oyma kalıplarla 7 çeşit kömbe baharatı ve zeytinyağıyla hazırlanan asırlık İslahiye Kömbesi ocağı.',
    detailedDescription:
      'Bayramlarda ve kış hazırlıklarında meşe odunlu taş fırında gevrek kıvamda pişirilen, aylarca tazeliğini koruyan asırlık hamur tatlısı mirasıdır.',
    districtOrNeighborhood: 'Aydınlık Mahallesi',
    address: 'Aydınlık Mah., Fırıncılar Geçidi No: 3, İslahiye',
    coordinates: {
      lat: 37.0245,
      lng: 36.6358,
    },
    verificationStatus: 'verified',
    verificationSource: 'İslahiye Gastronomi Envanteri 2026',
    lastVerifiedDate: '2026-10-15',
    relatedDishIds: ['bayram-kombesi'],
    coverImage: '/images/islahiye_kombesi.jpg',
    visitingHours: '06:30 – 19:30',
    publicationStatus: 'published',
    isDemo: false,
    visitInfo: {
      openingHours: '06:30 – 19:30',
      contactPhone: 'Yerinde Ziyaret',
      seasonalNotes: 'Özel ahşap kalıp desenleriyle günlük taze üretim yapılmaktadır.',
    },
  },
  {
    id: 'haci-ali-incir-noktasi',
    name: 'Amanos Bağları Yöresel Ürün Durağı',
    category: 'producer',
    categoryLabel: 'Yerel Üretici & Tatlı Durağı',
    description:
      'Amanos dağ yamaçlarında olgunlaşan ballı kuru incirlerin süt ve cevizle demlendiği geleneksel İncir Tatlısı durağı.',
    detailedDescription:
      'İncir bahçelerinden toplanan kuru incirlerin ceviz içiyle doldurulup sütte dinlendirilmesiyle hazırlanan hafif ve besleyici kadim tatlı.',
    districtOrNeighborhood: 'Hacı Ali Öztürk Mahallesi',
    address: 'Hacı Ali Öztürk Mah., Hükümet Cad. No: 19, İslahiye',
    coordinates: {
      lat: 37.0271,
      lng: 36.6342,
    },
    verificationStatus: 'verified',
    verificationSource: 'İslahiye Gastronomi Envanteri 2026',
    lastVerifiedDate: '2026-10-15',
    relatedDishIds: ['incir-tatlisi'],
    coverImage: '/images/incir_tatlisi.jpg',
    visitingHours: '09:00 – 20:00',
    publicationStatus: 'published',
    isDemo: false,
    visitInfo: {
      openingHours: '09:00 – 20:00',
      contactPhone: 'Yerinde Ziyaret',
      seasonalNotes: 'Yöresel dağ inciri ve ceviz ürünleri mevcuttur.',
    },
  },
];

export const PLACE_PLACEHOLDER_INFO = {
  title: 'Doğrulanmış Gastronomi Durakları',
  description:
    'İslahiye genelindeki taş fırınlar, lezzet lokantaları ve yerel üretim noktaları sokak haritasında işaretlenmiştir.',
  badge: 'Doğrulanmış Duraklar',
};
