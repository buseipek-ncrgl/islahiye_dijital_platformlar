import { CulturalHeritageStory } from '../types';

export const CULTURAL_STORIES: CulturalHeritageStory[] = [
  {
    id: 'tas-firin-ve-mese-kozu',
    slug: 'tas-firin-ve-mese-kozu',
    title: 'Taş Fırının Meşe Közü: Asırlık Ocaklık Hafızası',
    subtitle:
      'Sabahın ilk ışıklarıyla alevlenen meşe odunları, bakır tepsilerde demlenen lezzet ve İslahiye çarşısının fırın geleneği.',
    category: 'cooking_methods',
    categoryLabel: 'Pişirme Usulleri',
    coverImageUrl: '/images/islahiye_tava.jpg',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
    readingTime: '4 dk',
    publishedDate: '15 Ekim 2026',
    leadParagraph:
      'İslahiye’de mutfak kültürü yalnızca evlerin ocaklarında değil, mahallelerin kalbinde yer alan asırlık taş fırınlarda şekillenir. Sabahın erken saatlerinde meşe odunu ateşiyle ısınan bu fırınlar, tüm çarşı esnafının ve ailelerin ortak lezzet ocağıdır.',
    bodySections: [
      {
        heading: 'Meşe Odunu ve Ağır Ağır Demlenme',
        paragraph:
          'Geleneksel taş fırınların en ayırt edici özelliği, ateşin doğrudan yemeğe değil, taban taşına ve fırının tonoz kubbesine nüfuz etmesidir. Meşe odununun çıkardığı is kokusuz temiz köz, bakır tepsideki kuzu etinin ve sebzelerin suyunu kaybetmeden, kendi buharında demlenerek pişmesini sağlar.',
      },
      {
        heading: 'Tırnaklı Pide ve Fırıncı İmecesi',
        paragraph:
          'İslahiye tavası fırına verilirken, fırın ustası tırnaklı pideleri küreğin ucunda alevle buluşturur. Fırından çıkan cızırdayan tepsi, sıcağı sıcağına kesilen tırnaklı pideyle birlikte sofraya konur. Bu ritüel, İslahiye’de asırlardır süren bir dayanışma ve gastronomi mirasıdır.',
      },
    ],
    relatedDishIds: ['islahiye-tava', 'bayram-kombesi'],
    tags: ['Taş Fırın', 'Meşe Közü', 'İslahiye Tavası', 'Ocaklık Kültürü'],
  },
  {
    id: 'islahiye-biberi-ve-sonbahar-sergileri',
    slug: 'islahiye-biberi-ve-sonbahar-sergileri',
    title: 'Güneşin Kızıla Boyadığı Ova: İslahiye Biberi',
    subtitle:
      'Amanos rüzgârıyla kuruyan, taş dibeklerde işlenen ve TÜRKPATENT nezdinde tescillenen kırmızı mirasın hikâyesi.',
    category: 'seasons',
    categoryLabel: 'Hasat & Mevsimler',
    coverImageUrl: '/images/islahiye_biberi.jpg',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
    readingTime: '5 dk',
    publishedDate: '15 Ekim 2026',
    leadParagraph:
      'Eylül ayı geldiğinde İslahiye Ovası baştan başa kızıla bürünür. Bereketli alüvyon topraklarda yetişen ve 05.01.2022 tarihinde 991 tescil numarasıyla tescillenen İslahiye Biberi, yakıcı acılıktan ziyade meyvemsi aromasıyla Anadolu mutfağının en kıymetli baharatlarındandır.',
    bodySections: [
      {
        heading: 'Keten Örtülerde Doğal Güneşleme',
        paragraph:
          'Hasat edilen taze kırmızı biberler elle saplarından ayrılır, temizlenir ve temiz keten sergiler üzerinde güneşin altına yayılır. Rüzgârın ve güneşin dengeli kurutması, biberin içindeki uçucu yağların ve doğal parlak yakut renginin korunmasını sağlar.',
      },
      {
        heading: 'Taş Dibek ve İpeksi Doku',
        paragraph:
          'Kurutulan biberler zeytinyağı ile hafifçe ovularak geleneksel taş dibeklerde dövülür. Metal bıçakların sürtünmesiyle ısıtılmayan biber, taşın soğukluğunda ezilerek ipeksi pullara dönüşür. Bu yöntem, biberin parlak rengini ve taze kokusunu aylarca muhafaza eder.',
      },
    ],
    relatedDishIds: ['islahiye-biberi', 'islahiye-tava'],
    tags: ['İslahiye Biberi', 'Coğrafi İşaret 991', 'Güneş Sergisi', 'Taş Dibek'],
  },
  {
    id: 'firik-ve-atesin-hafizasi',
    slug: 'firik-ve-atesin-hafizasi',
    title: 'Ateşle Olgunlaşan Yeşil Buğday: Firik Mirası',
    subtitle:
      'Başaktayken alevde tütsülenen sert durum buğdayının is kokusu ve kadim Mezopotamya mirası.',
    category: 'traditions',
    categoryLabel: 'Mutfak Gelenekleri',
    coverImageUrl: '/images/firik_pilavi.jpg',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
    readingTime: '4 dk',
    publishedDate: '15 Ekim 2026',
    leadParagraph:
      'Firik, buğdayın henüz tam sararmadan, tanelerin süt olum döneminde hasat edilip başaklarıyla birlikte açık alevde tütsülenmesiyle elde edilen antik bir tahıldır. İslahiye ve çevresinde yüzyıllardır uygulanan bu yöntem, buğdaya eşsiz bir isli rayiha kazandırır.',
    bodySections: [
      {
        heading: 'Amanos Eteklerinde Ateş Çemberi',
        paragraph:
          'Mayıs sonu ve haziran başında tarlalarda yakılan kontrollü saman alevleri arasında buğday başakları hızla gezdirilir. Dış kavuzlar alevle yanarken içteki sütlü yeşil buğday tanesi hafifçe kavrulur ve ateşi içine hapseder.',
      },
      {
        heading: 'Köy Tereyağı ile Ağır Pişirme',
        paragraph:
          'Taş değirmende hafifçe kırılan firik, pilav tenceresinde köy tereyağı, kuzu eti suyu ve haşlanmış nohutla buluşur. Firik pişirilirken suda fazla bekletilmez; böylece içine çektiği meşe isi ve dağ kokusu doğrudan sofraya taşınır.',
      },
    ],
    relatedDishIds: ['firik-pilavi'],
    tags: ['Firik Buğdayı', 'Ateş Kültürü', 'Tütsüleme', 'Amanos Yaylaları'],
  },
  {
    id: 'ahsap-kalip-ve-bayram-kombesi',
    slug: 'ahsap-kalip-ve-bayram-kombesi',
    title: 'Oymalı Ahşap Kalıplar ve Bayram Kömbesi',
    subtitle:
      'Gürgen ve ceviz ağacına nakşedilen geleneksel motifler, yedi baharatın kokusu ve bayram imecesi.',
    category: 'tools',
    categoryLabel: 'Geleneksel Mutfak Araçları',
    coverImageUrl: '/images/islahiye_kombesi.jpg',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
    readingTime: '3 dk',
    publishedDate: '15 Ekim 2026',
    leadParagraph:
      'İslahiye’de bayram hazırlıklarının simgesi, mutfak sandıklarından çıkarılan el oyması ahşap kömbe kalıplarıdır. Yöresel marangozların ceviz ağacından oyduğu bu kalıplar, nesiller boyunca anneden kıza aktarılan aile yadigârlarıdır.',
    bodySections: [
      {
        heading: 'Geleneksel Kömbe Baharatı',
        paragraph:
          'Kömbe hamuru; mahlep, tarçın, zencefil, karanfil, muskat ve damla sakızından oluşan özel bir baharat harmanıyla yoğrulur. Hamur ahşap kalıba elle bastırılıp sertçe tahtaya vurulduğunda, kalıbın derin çiçek veya yıldız motifi bisküviye kusursuzca geçer.',
      },
      {
        heading: 'Uzun Süre Tazelik Sırrı',
        paragraph:
          'Taş fırında düşük ısıda kurutularak pişirilen kömbeler, susamla kaplı gevrek dokuları ve doğal baharatları sayesinde aylarca bayatlamadan saklanabilir. İslahiye evlerinde bayram ziyaretçilerine ikram edilen en zarif mirastır.',
      },
    ],
    relatedDishIds: ['bayram-kombesi'],
    tags: ['Ahşap Kalıp', 'İslahiye Kömbesi', 'Bayram Geleneği', 'Mutfak Araçları'],
  },
  {
    id: 'tandir-ve-semsek-boregi-ritueli',
    slug: 'tandir-ve-semsek-boregi-ritueli',
    title: 'Tandır Ateşi ve Şemsek İmecesi: Köy Odalarının Kadim Mirası',
    subtitle:
      'İncecik açılan yufkaların kıymalı harçla buluşup sac üzerinde çıtırdayarak kabardığı İslahiye köy ritüeli.',
    category: 'traditions',
    categoryLabel: 'Mutfak Gelenekleri',
    coverImageUrl: '/images/semsek_boregi.jpg',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
    readingTime: '4 dk',
    publishedDate: '15 Ekim 2026',
    leadParagraph:
      'Şemsek Böreği, İslahiye köylerinde hasat sonu, düğün ve bayram sabahlarında kadınların sac başında toplandığı en samimi imece lezzetidir. Dervişiye ve Fevzi Çakmak ocaklarında harlanan meşe odunu ateşi, hamurun gevrek ve sulu pişmesini sağlar.',
    bodySections: [
      {
        heading: 'Köy Kuzu Kıyması ve İslahiye Pul Biberi',
        paragraph:
          'Şemsek harcında Amanos yaylalarında otlayan kıvırcık kuzu kıyması, ince kıyılmış soğan ve İslahiye Biber Sergi Havzası’ndan gelen ipeksi pul biber harmanlanır. Çiğden yoğrulan harç, yufkanın içinde kendi buharında pişer.',
      },
      {
        heading: 'Sac Üzerinde Altın Sarısı Pişirim',
        paragraph:
          'Yarım ay şeklinde kapatılan böreklerin kenarları parmak uçlarıyla bastırılarak kapatılır ve hafif tereyağlı sac üzerinde çevrilerek kabartılır. Yanında köy yayık ayranıyla sıcağı sıcağına ikram edilir.',
      },
    ],
    relatedDishIds: ['islahiye-semsegi'],
    tags: ['Şemsek Böreği', 'Tandır Ateşi', 'Sac Böreği', 'Köy İmecesi'],
  },
  {
    id: 'dag-inciri-ve-ceviz-hasadi',
    slug: 'dag-inciri-ve-ceviz-hasadi',
    title: 'Amanos Dağ İnciri ve Cevizli Tatlı Geleneği',
    subtitle:
      'Güneşte kurutulan dağ incirlerinin süt ve cevizle tencerede ağır ağır demlendiği kış ziyafeti.',
    category: 'seasons',
    categoryLabel: 'Hasat & Mevsimler',
    coverImageUrl: '/images/incir_tatlisi.jpg',
    imageCredit: 'İslahiye Lezzet Atlası Görsel Arşivi',
    readingTime: '3 dk',
    publishedDate: '15 Ekim 2026',
    leadParagraph:
      'Amanos Dağları’nın serin rüzgârlarında olgunlaşan yabani dağ incirleri, sonbaharda toplanıp gölgede kurutulur. Kış aylarında İslahiye evlerinde ceviz içiyle doldurulup sütte demlendirilerek en asil tatlıya dönüştürülür.',
    bodySections: [
      {
        heading: 'Sütte Ağır Ağır Demlenme Sırrı',
        paragraph:
          'Kuru incirler ılık suda bekletilip yumuşatıldıktan sonra tepe kısımlarından iri dövülmüş dağ ceviziyle doldurulur. Tencereye dizilen incirlerin üzerine köy sütü ve tereyağı gezdirilerek kısık ateşte süt çekilene dek demlendirilir.',
      },
      {
        heading: 'Doğal Meyve Şekeri ve Tarçın Kokusu',
        paragraph:
          'Ekstra rafine şeker kullanılmadan, yalnızca incirin kendi balı ve sütün tatlılığıyla pişen bu tatlı, İslahiye’nin en eski hafif kış ikramıdır. Üzerine kaymak veya ceviz serpilerek ılık servis edilir.',
      },
    ],
    relatedDishIds: ['incir-tatlisi'],
    tags: ['Dağ İnciri', 'İncir Tatlısı', 'Amanos Bereketi', 'Ceviz'],
  },
];
