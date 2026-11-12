import { GastronomyFilm } from '../types';

/**
 * 3 Playable Concept Atmosphere Clips (Sprint 01E)
 *
 * CRITICAL CONTENT INTEGRITY RULES:
 * 1. These 5-second video clips are short thematic atmosphere and craft snippets.
 *    They are NEVER labeled as full documentary episodes.
 * 2. Every clip's poster image strictly matches the actual video scene:
 *    - Wood fire oven video -> tas_firin_kozu_poster.jpg (hearth embers & flames)
 *    - Dough rolling video  -> hamur_zanaati_poster.jpg (baker hands kneading on wood)
 *    - Pepper roasting video-> biber_kozleme_poster.jpg (peppers roasting on embers)
 * 3. Exact durations (0:05) and honest origins are recorded.
 */
export const CONCEPT_CLIPS: GastronomyFilm[] = [
  {
    id: 'clip-firin-atesi',
    contentType: 'concept_clip',
    title: 'Taş Fırın & Meşe Közü',
    subtitle: 'Odun ateşinin kor közleri ve ocaklık atmosferi.',
    description:
      'Geleneksel taş fırın ocaklığında yanan meşe odunu ve fırın tabanındaki kor közlerin sinematik atmosfer klibi.',
    posterSrc: '/images/tas_firin_kozu_poster.jpg',
    coverImageUrl: '/images/tas_firin_kozu_poster.jpg',
    videoSrc: '/videos/tas-firin-ve-ocaklik.mp4',
    videoUrl: '/videos/tas-firin-ve-ocaklik.mp4',
    duration: '0:05',
    mediaOrigin: 'real-shoot',
    publicationStatus: 'published',
    status: 'published',
    statusLabel: 'Atmosfer Klibi (5 sn)',
    relatedDishId: 'islahiye-tava',
    theme: 'Taş Fırın & Meşe Ateşi',
    credits: 'İslahiye Lezzet Atlası Görsel Arşivi',
    imageCredit: 'İslahiye Lezzet Atlası Arşivi',
  },
  {
    id: 'clip-hamur-zanaati',
    contentType: 'concept_clip',
    title: 'Geleneksel Hamur Zanaatı',
    subtitle: 'Unlu tezgâhta hamur açma ve yoğurma zanaatı.',
    description:
      'Fırıncı tezgâhında un serpilerek hamur yoğurma ve açma hareketlerinin yakın plan zanaat klibi.',
    posterSrc: '/images/hamur_zanaati_poster.jpg',
    coverImageUrl: '/images/hamur_zanaati_poster.jpg',
    videoSrc: '/videos/geleneksel-hamur-hazirlama.mp4',
    videoUrl: '/videos/geleneksel-hamur-hazirlama.mp4',
    duration: '0:05',
    mediaOrigin: 'real-shoot',
    publicationStatus: 'published',
    status: 'published',
    statusLabel: 'Atmosfer Klibi (5 sn)',
    relatedDishId: 'islahiye-semsegi',
    theme: 'Hamur Zanaatı',
    credits: 'İslahiye Lezzet Atlası Görsel Arşivi',
    imageCredit: 'İslahiye Lezzet Atlası Arşivi',
  },
  {
    id: 'clip-biber-kozleme',
    contentType: 'concept_clip',
    title: 'Kırmızı Biber & Közleme Ateşi',
    subtitle: 'Izgara teli üzerinde közlenen taze biberler.',
    description:
      'Köz ateşi üzerinde dumanı tüten ve közlenen taze kırmızı biberlerin yakın plan sinematik klibi.',
    posterSrc: '/images/biber_kozleme_poster.jpg',
    coverImageUrl: '/images/biber_kozleme_poster.jpg',
    videoSrc: '/videos/islahiye-biberi-ve-kozleme.mp4',
    videoUrl: '/videos/islahiye-biberi-ve-kozleme.mp4',
    duration: '0:05',
    mediaOrigin: 'real-shoot',
    publicationStatus: 'published',
    status: 'published',
    statusLabel: 'Atmosfer Klibi (5 sn)',
    relatedDishId: 'islahiye-biberi',
    theme: 'Közleme & Ateş',
    credits: 'İslahiye Lezzet Atlası Görsel Arşivi',
    imageCredit: 'İslahiye Lezzet Atlası Arşivi',
  },
];

/**
 * 10 Planned Corporate Documentary Episodes (PDF Blueprint)
 *
 * CRITICAL RULE:
 * None of these 10 planned episodes contain video files yet.
 * No fake players, fake durations, or fictitious filming claims are made.
 */
export const DOCUMENTARY_SERIES: GastronomyFilm[] = [
  {
    id: 'film-doc-01',
    contentType: 'documentary_episode',
    episodeNumber: 1,
    title: 'Taş Fırının Meşe Közü: İslahiye Tavası',
    subtitle: 'Çarşı ocaklığının meşe ateşi ve fırın ritüeli.',
    description:
      'Geleneksel taş fırınlarda sabahın ilk ışıklarıyla yakılan meşe ateşi ve kuzu etinin sebzelerle ağır ağır demlenme hikâyesi.',
    posterSrc: '/images/islahiye_tava.jpg',
    coverImageUrl: '/images/islahiye_tava.jpg',
    mediaOrigin: 'real-shoot',
    publicationStatus: 'planned',
    status: 'planned',
    statusLabel: 'Belgesel Bölüm Özeti',
    relatedDishId: 'islahiye-tava',
    theme: 'Taş Fırın & Ocaklık',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
  },
  {
    id: 'film-doc-02',
    contentType: 'documentary_episode',
    episodeNumber: 2,
    title: 'Ateşle Olgunlaşan Yeşil Buğday: Firik',
    subtitle: 'Amanos eteklerinde başakta tütsüleme geleneği.',
    description:
      'Süt olum dönemindeki buğdayın saman alevinde közlenmesi ve Mezopotamya’dan Barak ovasına uzanan kadim is aroması.',
    posterSrc: '/images/firik_pilavi.jpg',
    coverImageUrl: '/images/firik_pilavi.jpg',
    mediaOrigin: 'real-shoot',
    publicationStatus: 'planned',
    status: 'planned',
    statusLabel: 'Belgesel Bölüm Özeti',
    relatedDishId: 'firik-pilavi',
    theme: 'Hasat & Tütsüleme',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
  },
  {
    id: 'film-doc-03',
    contentType: 'documentary_episode',
    episodeNumber: 3,
    title: 'Güneşin Kızıla Boyadığı Ova: İslahiye Biberi',
    subtitle: 'Tescilli biberin tarladan taş dibeğe uzanan yolculuğu.',
    description:
      'Kırmızı alüvyon topraktan toplanıp keten sergilerde güneşe serilen ve taş dibekte ipeksi pullara dönüşen tescilli lezzet.',
    posterSrc: '/images/islahiye_biberi.jpg',
    coverImageUrl: '/images/islahiye_biberi.jpg',
    mediaOrigin: 'real-shoot',
    publicationStatus: 'planned',
    status: 'planned',
    statusLabel: 'Belgesel Bölüm Özeti',
    relatedDishId: 'islahiye-biberi',
    theme: 'Tescilli Ürün & Hasat',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
  },
  {
    id: 'film-doc-04',
    contentType: 'documentary_episode',
    episodeNumber: 4,
    title: 'Sacın Üzerinde Kabaran Lezzet: Semsek',
    subtitle: 'Odun ateşinde sac böreği ve taze peynirin buluşması.',
    description:
      'İncecik açılan mayasız hamurun yerel peynirle harmanlanıp kızgın sac üzerinde çevrilerek pişirilme tekniği.',
    posterSrc: '/images/semsek_boregi.jpg',
    coverImageUrl: '/images/semsek_boregi.jpg',
    mediaOrigin: 'real-shoot',
    publicationStatus: 'planned',
    status: 'planned',
    statusLabel: 'Belgesel Bölüm Özeti',
    relatedDishId: 'islahiye-semsegi',
    theme: 'Hamur & Ateş Sacı',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
  },
  {
    id: 'film-doc-05',
    contentType: 'documentary_episode',
    episodeNumber: 5,
    title: 'Bayram Arifeleri ve Ahşap Kömbe Kalıbı',
    subtitle: 'Ceviz oyma kalıplar, yedi baharat ve bayram imecesi.',
    description:
      'Geleneksel ahşap kalıpların mutfak sandıklarından çıkarılışı ve bayram kömbesinin nesiller arası aktarımı.',
    posterSrc: '/images/islahiye_kombesi.jpg',
    coverImageUrl: '/images/islahiye_kombesi.jpg',
    mediaOrigin: 'real-shoot',
    publicationStatus: 'planned',
    status: 'planned',
    statusLabel: 'Belgesel Bölüm Özeti',
    relatedDishId: 'bayram-kombesi',
    theme: 'Zanaat Araçları & Bayram',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
  },
  {
    id: 'film-doc-06',
    contentType: 'documentary_episode',
    episodeNumber: 6,
    title: 'Amanos Yayla Pınarları ve Yöresel Otlar',
    subtitle: 'Yabani kekik, dağ nanesi ve yayla florasının mutfağa etkisi.',
    description:
      'Amanos dağ yamaçlarında yetişen aromatik endemik otların toplanması ve kuzu etine kattığı lezzet profili.',
    posterSrc: '/images/firik_pilavi.jpg',
    coverImageUrl: '/images/firik_pilavi.jpg',
    mediaOrigin: 'real-shoot',
    publicationStatus: 'planned',
    status: 'planned',
    statusLabel: 'Belgesel Bölüm Özeti',
    theme: 'Yayla Florası & Doğa',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
  },
  {
    id: 'film-doc-07',
    contentType: 'documentary_episode',
    episodeNumber: 7,
    title: 'Taş Dibeklerin Ritmi ve Baharat Kültürü',
    subtitle: 'Geleneksel kırma, dövme ve harmanlama yöntemleri.',
    description:
      'Metal bıçak yerine soğuk taşta ezilen baharatların aroma ve uçucu yağ zenginliğini nasıl koruduğu.',
    posterSrc: '/images/islahiye_biberi.jpg',
    coverImageUrl: '/images/islahiye_biberi.jpg',
    mediaOrigin: 'real-shoot',
    publicationStatus: 'planned',
    status: 'planned',
    statusLabel: 'Belgesel Bölüm Özeti',
    theme: 'Geleneksel Aletler',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
  },
  {
    id: 'film-doc-08',
    contentType: 'documentary_episode',
    episodeNumber: 8,
    title: 'Kurutmalıklar, Salçalar ve Kış Hazırlıkları',
    subtitle: 'İslahiye evlerinde imece usulü kiler kültürü.',
    description:
      'Yaz sonu damlarda kaynatılan biber salçaları, ipe dizilen kurutmalıklar ve kış sofralarına hazırlık hafızası.',
    posterSrc: '/images/islahiye_tava.jpg',
    coverImageUrl: '/images/islahiye_tava.jpg',
    mediaOrigin: 'real-shoot',
    publicationStatus: 'planned',
    status: 'planned',
    statusLabel: 'Belgesel Bölüm Özeti',
    theme: 'Kiler & İmece Kültürü',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
  },
  {
    id: 'film-doc-09',
    contentType: 'documentary_episode',
    episodeNumber: 9,
    title: 'Amanos Cevizi ve Kuru İncir Tatlısı',
    subtitle: 'Dağ cevizinin ovadaki incir bahçeleriyle buluşması.',
    description:
      'Geleneksel kuru incir tatlısının kısık ateşte şerbetlenmesi ve İslahiye bağ tatlıları kültürü.',
    posterSrc: '/images/incir_tatlisi.jpg',
    coverImageUrl: '/images/incir_tatlisi.jpg',
    mediaOrigin: 'real-shoot',
    publicationStatus: 'planned',
    status: 'planned',
    statusLabel: 'Belgesel Bölüm Özeti',
    relatedDishId: 'incir-tatlisi',
    theme: 'Meyve Bahçeleri & Tatlılar',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
  },
  {
    id: 'film-doc-10',
    contentType: 'documentary_episode',
    episodeNumber: 10,
    title: 'İslahiye Sofrasında Birlik ve İmece Ruhu',
    subtitle: 'Düğünlerden bayramlara topluluk mutfağı ve sofra adabı.',
    description:
      'Toplu pişirilen yemekler, komşuluk ikramları ve İslahiye’nin misafirperverlik geleneğinin belgesel kaydı.',
    posterSrc: '/images/islahiye_tava.jpg',
    coverImageUrl: '/images/islahiye_tava.jpg',
    mediaOrigin: 'real-shoot',
    publicationStatus: 'planned',
    status: 'planned',
    statusLabel: 'Belgesel Bölüm Özeti',
    theme: 'Toplumsal Bellek',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
  },
];

/**
 * Combined list preserving backwards compatibility for all imports
 */
export const GASTRONOMY_FILMS: GastronomyFilm[] = [
  ...CONCEPT_CLIPS,
  ...DOCUMENTARY_SERIES,
];
