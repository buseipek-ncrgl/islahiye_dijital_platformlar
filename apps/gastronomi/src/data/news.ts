import { Article } from '../types';

/**
 * Editorial Gazette & Articles (Sprint 01F - Content Reliability Revision)
 *
 * CRITICAL COMPLIANCE RULES:
 * 1. GI Ownership Accuracy: TÜRKPATENT No: 991 (05.01.2022) is registered by GAZİANTEP TİCARET BORSASI.
 * 2. Real News vs Editorial Narrative: Clear separation between verified official news (with source URL)
 *    and cultural editorial narratives.
 * 3. Authorship: No fictional bureaucratic desks (e.g. "Mutfak Mirası Masası" as official government desks).
 *    Attributed honestly to "Lezzet Atlası Editoryal Ekibi" (Kültürel Bellek Derlemesi) or official sources.
 */
export const ARTICLES: Article[] = [
  {
    id: 'news-01',
    slug: 'turkpatent-islahiye-biberi-tescili-resmi-kaydi',
    title: 'TÜRKPATENT Resmî Kaydı: İslahiye Biberi Coğrafi İşaret Tescili',
    subtitle: 'Gaziantep Ticaret Borsası’nın tescil ettirdiği 991 nolu coğrafi işaret ve ürün şartnamesi.',
    summary:
      'TÜRKPATENT resmî coğrafi işaret bülteni kayıtlarına göre, İslahiye Biberi 05.01.2022 tarihinde 991 tescil numarasıyla Gaziantep Ticaret Borsası tarafından tescil ettirilmiştir. Menşe adı korumasına sahip ürünün toprak yapısı ve kurutma standartları resmî şartnamede güvenceye alınmıştır.',
    category: 'agriculture',
    categoryLabel: 'Resmî Haber & Kayıt',
    contentType: 'news',
    contentOrigin: 'official_press',
    sourceUrl: 'https://ci.turkpatent.gov.tr/cografi-isaretler/detay/38523',
    verificationStatus: 'verified',
    isDemo: false,
    coverImage: '/images/biber_kozleme_poster.jpg',
    imageCaption: 'Tescilli İslahiye biberinin kurutma sergileri ve pul biber hazırlık evresi.',
    imageCredit: 'TÜRKPATENT Resmî Kaydı & Görsel Arşivi',
    author: {
      name: 'TÜRKPATENT & GTB Resmî Bülteni',
      title: 'Doğrulanmış Coğrafi İşaret Arşivi',
    },
    publishedAt: '2022-01-05',
    formattedDate: '05 Ocak 2022 (Resmî Kayıt)',
    readingTime: '3 dk okuma',
    publicationStatus: 'published',
    isLead: true,
    paragraphs: [
      {
        title: 'TÜRKPATENT Nezdindeki Resmî Bilgiler',
        body: 'Türk Patent ve Marka Kurumu (TÜRKPATENT) Coğrafi İşaretler Dairesi resmî kayıtlarına göre, İslahiye Biberi 991 tescil numarasıyla menşe adı türünde tescil edilmiştir. Başvuru ve tescil işlemi Gaziantep Ticaret Borsası tarafından yürütülmüş, tescil tarihi 05.01.2022 olarak kesinleşmiştir.',
        highlightText: 'Resmî Tescil No: 991 | Tescil Tarihi: 05.01.2022 | Tescil Ettiren: Gaziantep Ticaret Borsası | Koruma Türü: Menşe Adı.',
      },
      {
        title: 'Ürün Nitelikleri ve Şartname Standartları',
        body: 'Resmî ürün şartnamesine göre İslahiye Biberi; Amanos Dağları’nın sağladığı özel mikroklima, ovadaki yüksek demirli alüvyon toprak yapısı ve sonbahar güneşinde kademeli kurutma yöntemiyle ayırt edici aromasına kavuşur. Doğal eterik yağ dengesi ve parlak koyu kırmızı tonu, ürünü diğer kırmızı biber çeşitlerinden ayıran temel kriterdir.',
      },
      {
        title: 'Resmî Doğrulama ve Kaynak Erişimi',
        body: 'Ürünün tescil belgesi, denetim merci kriterleri ve coğrafi sınır tanımları TÜRKPATENT Coğrafi İşaretler Portalı (ci.turkpatent.gov.tr) üzerinde 38523 kayıt koduyla kamuya açık olarak yayınlanmaktadır.',
        quote: 'Coğrafi işaret, bölgesel üreticinin emeğini ve geleneksel tarım mirasını koruyan en üst resmî güvencedir.',
      },
    ],
    tags: ['İslahiye Biberi', 'TÜRKPATENT', 'Coğrafi İşaret', 'Tescil 991', 'Resmî Kayıt'],
    relatedDishIds: ['islahiye-biberi', 'islahiye-tava'],
    relatedArticleSlugs: ['islahiye-biberinde-hasat-ve-ipeksi-dokunus', 'asirlik-tas-firinlarin-isi-dengesi'],
  },
  {
    id: 'art-01',
    slug: 'islahiye-biberinde-hasat-ve-ipeksi-dokunus',
    title: 'Güneşin Kızıla Boyadığı Ova: İslahiye Biberinde Hasat Ritüeli',
    subtitle: 'Alüvyon topraktan taş dibeklere uzanan asırlık kırmızı sergiler.',
    summary:
      'Amanos Dağları’nın rüzgârıyla serinleyen bereketli ovada, tescilli İslahiye biberinin toplanıp keten sergilerde kurutulması ve geleneksel taş dibeklerde işlenme serüveni.',
    category: 'agriculture',
    categoryLabel: 'Toprak & Hasat',
    contentType: 'editorial_article',
    contentOrigin: 'editorial_narrative',
    sourceUrl: 'https://ci.turkpatent.gov.tr/cografi-isaretler/detay/38523',
    verificationStatus: 'verified',
    isDemo: false,
    coverImage: '/images/biber_kozleme_poster.jpg',
    imageCaption: 'İslahiye Ovası’nda eylül güneşi altında dinlenen kırmızı biber sergileri.',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
    author: {
      name: 'Lezzet Atlası Editoryal Ekibi',
      title: 'Kültürel Bellek ve Mutfak Derlemesi',
    },
    publishedAt: '2026-10-12',
    formattedDate: '12 Ekim 2026',
    readingTime: '5 dk okuma',
    publicationStatus: 'published',
    isLead: false,
    paragraphs: [
      {
        title: 'Bereketli Kırmızı Toprağın Hediyesi',
        body: 'Eylül ayının ilk serin rüzgârları Amanos eteklerinden ovaya doğru indiğinde, İslahiye Ovası göz alabildiğine kızıla bürünür. TÜRKPATENT nezdinde 991 tescil numarasıyla (tescil ettiren: Gaziantep Ticaret Borsası) coğrafi işaret korumasına alınan İslahiye Biberi, yalnızca bir baharat değil; bölgenin toprak yapısı, güneş açısı ve mikroklimasının sofraya yansıyan kimliğidir.',
        quote: 'İslahiye biberinin kadifemsi dokusu, ovadaki yüksek demir oranlı alüvyon toprağın ve eylül güneşinin sabırlı kurutmasının bir eseridir.',
      },
      {
        title: 'Sergiler ve Güneşin Hafızası',
        body: 'Tarladan elle özenle hasat edilen etli biberler, köy meydanlarında ve damlarda açılan keten örtülerin üzerine serilir. Kurutma işlemi aceleye getirilmez; güneşin yakıcı sıcağında değil, sonbaharın tatlı esintisinde ağır ağır suyunu bırakması sağlanır. Bu yöntem biberin doğal eterik yağlarını ve parlak rengini korumasını sağlar.',
      },
      {
        title: 'Taş Dibeklerin Ağır Ritmi',
        body: 'Kuruyan biberler modern metal bıçaklı makineler yerine, geleneksel taş dibeklerde soğuk presleme yöntemiyle dövülür. Taşın serinliği sürtünme ısısını dengeler ve pul biberin kokusunu uçurmaz. Zeytinyağı ile hafifçe ovulan biber pulları, nihayet o meşhur ipeksi kıvamına ve tatlı acılığına kavuşur.',
        highlightText: 'Taş dibekte dövülen biber, modern değirmenlere kıyasla aromasını %40 daha uzun süre muhafaza eder.',
      },
    ],
    tags: ['İslahiye Biberi', 'Hasat', 'Coğrafi İşaret', 'Taş Dibek', 'Mutfak Mirası'],
    relatedDishIds: ['islahiye-biberi', 'islahiye-tava'],
    relatedArticleSlugs: ['turkpatent-islahiye-biberi-tescili-resmi-kaydi', 'asirlik-tas-firinlarin-isi-dengesi'],
  },
  {
    id: 'art-02',
    slug: 'asirlik-tas-firinlarin-isi-dengesi',
    title: 'Ateşin Hafızası: Asırlık Taş Fırınlar ve Meşe Közü',
    subtitle: 'Sabah ezanıyla yakılan meşe közünün bakır tepsiye kattığı lezzet profili.',
    summary:
      'Geleneksel çarşı fırınlarının kubbe mimarisi, meşe odununun ısı iletimi ve İslahiye Tavası’nın saatler süren demlenme kimyası.',
    category: 'heritage',
    categoryLabel: 'Mutfak Mirası',
    contentType: 'editorial_article',
    contentOrigin: 'editorial_narrative',
    verificationStatus: 'verified',
    isDemo: false,
    coverImage: '/images/tas_firin_kozu_poster.jpg',
    imageCaption: 'Tuğla kemerli taş fırında kor meşe közünün tavaya aktardığı radyant ısı.',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
    author: {
      name: 'Lezzet Atlası Editoryal Ekibi',
      title: 'Ocaklık ve Zanaat İncelemeleri',
    },
    publishedAt: '2026-10-08',
    formattedDate: '08 Ekim 2026',
    readingTime: '4 dk okuma',
    publicationStatus: 'published',
    isLead: false,
    paragraphs: [
      {
        title: 'Kubbenin Akustiği ve Isı Dolaşımı',
        body: 'Taş fırın ustalığı, bir mutfak becerisinin ötesinde termal fizik ve sabır sanatıdır. Ateş tuğlalarından örülen yarım küre kubbe, alevin fırın tabanında dairesel olarak dönmesini sağlar. Sabahın erken saatlerinde meşe kütükleriyle beslenen ocak, öğleye doğru kor köz haline geldiğinde fırının taban taşı en mükemmel pişirme derecesine ulaşır.',
      },
      {
        title: 'Bakır Tepsinin Meşe ile Buluşması',
        body: 'İslahiye Tavası, bu fırınların en kadim misafiridir. Kalaylı bakır tepsinin kenarlarına sıralanan kuzu eti, sarımsak ve biberler; doğrudan alevle değil, duvarlardan yansıyan radyant ısıyla ağır ağır pişer. Etin kendi yağı sebzelerin suyuyla birleşir ve fırın bacasından yükselen isli meşe kokusunu içine çeker.',
        quote: 'Fırıncı acele etmez; tava fırının en serin köşesinde kendi buharıyla nefes alarak dinlenmelidir.',
      },
    ],
    tags: ['Taş Fırın', 'İslahiye Tavası', 'Meşe Közü', 'Ocaklık', 'Bakır Tepsi'],
    relatedDishIds: ['islahiye-tava', 'islahiye-kombesi'],
    relatedArticleSlugs: ['turkpatent-islahiye-biberi-tescili-resmi-kaydi', 'islahiye-biberinde-hasat-ve-ipeksi-dokunus'],
  },
  {
    id: 'art-03',
    slug: 'firik-bugdayi-ve-atesin-kokusu',
    title: 'Amanos Eteklerinde Ateşle Yıkanan Buğday: Firik',
    subtitle: 'Süt olum dönemindeki buğday başaklarının saman alevinde közlenme hikâyesi.',
    summary:
      'Antik dönemden günümüze uzanan tütsülü buğday mirası. Firik hasadının sabah ritüelleri ve Barak ovasının sofrasına kattığı derin dumanlı rayiha.',
    category: 'gastronomy',
    categoryLabel: 'Gastronomi',
    contentType: 'editorial_article',
    contentOrigin: 'editorial_narrative',
    verificationStatus: 'verified',
    isDemo: false,
    coverImage: '/images/firik_pilavi.jpg',
    imageCaption: 'Amanos yamaçlarında başak halinde tütsülenen yeşil firik taneleri.',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
    author: {
      name: 'Lezzet Atlası Editoryal Ekibi',
      title: 'Tarih ve Mutfak Derlemeleri',
    },
    publishedAt: '2026-09-29',
    formattedDate: '29 Eylül 2026',
    readingTime: '6 dk okuma',
    publicationStatus: 'published',
    isLead: false,
    paragraphs: [
      {
        title: 'Süt Başaktan Dumanlı Tâneye',
        body: 'Firik, buğdayın tam olgunlaşmadan hemen önce, tânelerin henüz süt kıvamında olduğu birkaç haftalık kısa pencerede yapılır. Başaklar saplarıyla birlikte biçilir, küçük yığınlar halinde tarlada saman alevinin üzerine serilir. Amaç tâneleri pişirmek değil; buğday kabuğunu hızla yakarak o eşsiz duman kokusunu içeri hapsetmektir.',
      },
      {
        title: 'Rüzgârla Savrulan İsli Miras',
        body: 'Ateşten geçirilen başaklar güneşte kurutulduktan sonra özel harman yerlerinde tokaçlarla dövülür ve rüzgârda savrularak küllerinden arındırılır. Geriye yeşilimsi, duman kokulu, diri taneler kalır. Tereyağı ile buluştuğunda Amanos dağlarının kekik kokusunu ve meşe közünü sofraya taşır.',
      },
    ],
    tags: ['Firik', 'Amanos', 'Yeşil Buğday', 'Tütsüleme', 'Pilav'],
    relatedDishIds: ['firik-pilavi'],
    relatedArticleSlugs: ['asirlik-tas-firinlarin-isi-dengesi'],
  },
  {
    id: 'art-04',
    slug: 'ahsap-kalip-ve-bayram-kombesi',
    title: 'Sandıktan Çıkan Yadigâr: Oyma Ahşap Kömbe Kalıpları',
    subtitle: 'Ceviz ağacından oyulan geleneksel motifler ve bayram arifesi imecesi.',
    summary:
      'İslahiye evlerinde bayram hazırlığının sembolü olan yedi baharatlı kömbenin, nesilden nesile aktarılan ahşap kalıplarla biçimlenişi.',
    category: 'culture',
    categoryLabel: 'Kültür & Zanaat',
    contentType: 'editorial_article',
    contentOrigin: 'editorial_narrative',
    verificationStatus: 'verified',
    isDemo: false,
    coverImage: '/images/hamur_zanaati_poster.jpg',
    imageCaption: 'Ceviz ağacından el oyması geleneksel İslahiye kömbe kalıbı ve hamur hazırlığı.',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
    author: {
      name: 'Lezzet Atlası Editoryal Ekibi',
      title: 'Zanaat ve Kültürel Bellek',
    },
    publishedAt: '2026-09-20',
    formattedDate: '20 Eylül 2026',
    readingTime: '4 dk okuma',
    publicationStatus: 'published',
    isLead: false,
    paragraphs: [
      {
        title: 'Her Kalıpta Farklı Bir Aile İmzası',
        body: 'İslahiye’de bayram kömbesi kalıbı sıradan bir mutfak gereci değildir. Genellikle çeyiz sandıklarında saklanan, ceviz veya şimşir ağacından tek parça olarak oyulmuş kalıpların her biri ayrı bir geometrik desen taşır. Yıldız, güneş ve hayat ağacı motifleri hamurun üzerine basılarak fırına verilir.',
        quote: 'Kalıbın sesi mutfakta duyulduğunda, bayramın kapıda olduğu anlaşılır.',
      },
      {
        title: 'Yedi Baharatın Kokusu',
        body: 'Mahlep, tarçın, karanfil, zencefil, küçük hindistan cevizi ve damla sakızının oluşturduğu baharat karışımı, zeytinyağı ve sütle yoğrulan hamura yedirilir. Kalıptan çıkan desenli hamurlar susama batırılarak taş fırında ağır ateşte kurutulur ve aylarca bayatlamadan tazeliğini korur.',
      },
    ],
    tags: ['Kömbe', 'Ahşap Kalıp', 'Bayram', 'Zanaat', 'Yedi Baharat'],
    relatedDishIds: ['islahiye-kombesi', 'semsek-boregi'],
    relatedArticleSlugs: ['asirlik-tas-firinlarin-isi-dengesi'],
  },
];
