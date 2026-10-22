import { Recipe } from '../types';

export const RECIPES: Recipe[] = [
  {
    id: 'recipe-islahiye-tava',
    dishId: 'islahiye-tava',
    title: 'Geleneksel İslahiye Tavası',
    subtitle: 'Meşe odunu közünde pişen kuzu eti, sarımsak ve İslahiye biberi.',
    baseServings: 4,
    prepTime: '25 dk',
    cookTime: '55 dk',
    difficulty: 'Orta',
    notes: 'Taş fırında piştiğinde lezzeti katlanır; ev fırınında 200°C alt-üst ayarda pişirilebilir.',
    imageUrl: '/images/islahiye_tava.jpg',
    imageAlt: 'Taş fırında pişen geleneksel İslahiye Tavası',
    imageCaption: 'Taş fırının meşe közünde demlenen geleneksel İslahiye Tavası hazırlık süreci.',
    ingredients: [
      {
        id: 'ing-1',
        name: 'Kuzu kuşbaşı (orta yağlı)',
        baseAmount: 800,
        unit: 'g',
        fallbackDisplay: '800 g',
        isScalable: true,
      },
      {
        id: 'ing-2',
        name: 'İslahiye kırmızı pul biberi',
        baseAmount: 2,
        unit: 'tatlı kaşığı',
        fallbackDisplay: '2 tatlı kaşığı',
        isScalable: true,
      },
      {
        id: 'ing-3',
        name: 'Yerli diş sarımsak',
        baseAmount: 12,
        unit: 'diş',
        fallbackDisplay: '12 diş',
        isScalable: true,
      },
      {
        id: 'ing-4',
        name: 'Köy domatesi',
        baseAmount: 4,
        unit: 'adet',
        fallbackDisplay: '4 adet',
        isScalable: true,
      },
      {
        id: 'ing-5',
        name: 'Köy biberi (yeşil)',
        baseAmount: 4,
        unit: 'adet',
        fallbackDisplay: '4 adet',
        isScalable: true,
      },
      {
        id: 'ing-6',
        name: 'Kuyruk yağı (ince kıyılmış)',
        baseAmount: 80,
        unit: 'g',
        fallbackDisplay: '80 g',
        isScalable: true,
      },
      {
        id: 'ing-7',
        name: 'Kaya tuzu ve karabiber',
        fallbackDisplay: 'Damak tadına göre',
        isScalable: false,
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Etin ve Bakır Tepsinin Hazırlanması',
        instruction:
          'Kuzu eti oda sıcaklığında yaklaşık 15 dakika dinlendirilir. İnce kıyılmış kuyruk yağı ile birlikte geniş bir bakır tepsiye eşit şekilde yayılır.',
        tip: 'Eti çok küçük doğramamak suyunu ve yumuşak dokusunu fırında muhafaza etmesini sağlar.',
      },
      {
        stepNumber: 2,
        title: 'Sarımsak ve Sebzelerin Dizilmesi',
        instruction:
          'Kabukları ayıklanmış sarımsak dişleri ezilmeden, bütün halde etlerin arasına yerleştirilir. Domates ve köy biberleri iri dilimler halinde etlerin üzerine dizilir.',
        tip: 'Sarımsakları ezmeden bütün koymak, fırında yanmadan lokum gibi közlenmesini sağlar.',
      },
      {
        stepNumber: 3,
        title: 'Baharat ve Yağ Harmanı',
        instruction:
          'Tescilli İslahiye pul biberi, tane karabiber ve kaya tuzu tepsinin her tarafına eşit serpilir. Sebzelerin ve etin aromalarının birbirine geçmesi için hafifçe harmanlanır.',
        tip: 'İslahiye biberinin yakıcı olmayan tatlı aroması yemeğin ana lezzet omurgasını oluşturur.',
      },
      {
        stepNumber: 4,
        title: 'Taş Fırında Ağır Pişirme ve Demleme',
        instruction:
          'Tava, meşe odunu yanan taş fırında (veya önceden 200°C ısıtılmış fırında) yaklaşık 50-55 dakika etler yumuşayıp suyunu çekene dek demlendirilir. Sıcak tırnaklı pideyle hemen servis edilir.',
        tip: 'Fırından çıkar çıkmaz tepsiyi 5 dakika kendi buharında dinlendirmek lezzeti artırır.',
      },
    ],
  },
  {
    id: 'recipe-firik-pilavi',
    dishId: 'firik-pilavi',
    title: 'Amanos Usulü Firik Pilavı',
    subtitle: 'Közde tütsülenen yeşil buğdayın isli aroması ve tereyağı.',
    baseServings: 4,
    prepTime: '15 dk',
    cookTime: '30 dk',
    difficulty: 'Kolay',
    notes: 'İsli aromasını kaybetmemesi için firik bulguru suda bekletilmeden yalnızca hafifçe yıkanmalıdır.',
    imageUrl: '/images/firik_pilavi.jpg',
    imageAlt: 'Geleneksel firik pilavı sunumu',
    imageCaption: 'Közde tütsülenen yeşil buğday ve nohut ile hazırlanan geleneksel firik pilavı.',
    ingredients: [
      {
        id: 'ing-f1',
        name: 'Közlenmiş firik bulguru',
        baseAmount: 1.5,
        unit: 'su bardağı',
        fallbackDisplay: '1.5 su bardağı',
        isScalable: true,
      },
      {
        id: 'ing-f2',
        name: 'Pilavlık bulgur',
        baseAmount: 0.5,
        unit: 'su bardağı',
        fallbackDisplay: '0.5 su bardağı',
        isScalable: true,
      },
      {
        id: 'ing-f3',
        name: 'Köy tereyağı',
        baseAmount: 3,
        unit: 'yemek kaşığı',
        fallbackDisplay: '3 yemek kaşığı',
        isScalable: true,
      },
      {
        id: 'ing-f4',
        name: 'Haşlanmış nohut',
        baseAmount: 1,
        unit: 'su bardağı',
        fallbackDisplay: '1 su bardağı',
        isScalable: true,
      },
      {
        id: 'ing-f5',
        name: 'Sıcak kuzu et suyu',
        baseAmount: 4,
        unit: 'su bardağı',
        fallbackDisplay: '4 su bardağı',
        isScalable: true,
      },
      {
        id: 'ing-f6',
        name: 'Kaya tuzu & tane karabiber',
        fallbackDisplay: 'Damak zevkine göre',
        isScalable: false,
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Firik Bulgurunun Ayıklanması',
        instruction:
          'Közlenmiş yeşil firik bulguru geniş bir tepside ayıklanır; is aromasını kaybetmemesi için yalnızca ılık suyla hafifçe sudan geçirilir ve süzülür.',
        tip: 'Firik bulgurunu asla suda bekletmeyin, aksi halde o kadim tütsü aroması suya geçer.',
      },
      {
        stepNumber: 2,
        title: 'Tereyağında Kavurma',
        instruction:
          'Köy tereyağı tencerede eritilir; firik ve pilavlık bulgur ilave edilerek kokusu çıkana dek 3-4 dakika orta ateşte kavrulur.',
      },
      {
        stepNumber: 3,
        title: 'Et Suyu ve Nohut İlavesi',
        instruction:
          'Sıcak kuzu et suyu, haşlanmış nohutlar ve kaya tuzu tencereye eklenir. Bir taşım kaynadıktan sonra ateş kısılır.',
      },
      {
        stepNumber: 4,
        title: 'Kısık Ateşte Demlenme',
        instruction:
          'Pilav suyunu tamamen çekene dek kısık ateşte pişirilir; ocaktan alındıktan sonra üzerine keten bez örtülüp 20 dakika demlendirilir.',
        tip: 'Yanında süzme yayık ayranı ve közlenmiş taze biberle sunulması tavsiye edilir.',
      },
    ],
  },
  {
    id: 'recipe-semsek-boregi',
    dishId: 'semsek-boregi',
    title: 'Geleneksel İslahiye Semseği',
    subtitle: 'El açması incecik yufka, taze çökelek ve nane kokulu saç böreği.',
    baseServings: 4,
    prepTime: '35 dk',
    cookTime: '15 dk',
    difficulty: 'Orta',
    notes: 'Odun ateşinde kızdırılmış sacda pişirildiğinde çıtır kabarcıklı geleneksel dokusuna ulaşır.',
    imageUrl: '/images/semsek_boregi.jpg',
    imageAlt: 'Geleneksel tereyağlı semsek böreği',
    imageCaption: 'Taze köy çökeleği ve İslahiye baharatlarıyla hazırlanan saç böreği.',
    ingredients: [
      {
        id: 'ing-s1',
        name: 'Elenmiş buğday unu',
        baseAmount: 4,
        unit: 'su bardağı',
        fallbackDisplay: '4 su bardağı',
        isScalable: true,
      },
      {
        id: 'ing-s2',
        name: 'Taze köy çökeleği / lor',
        baseAmount: 350,
        unit: 'g',
        fallbackDisplay: '350 g',
        isScalable: true,
      },
      {
        id: 'ing-s3',
        name: 'Taze maydanoz & kuru nane',
        baseAmount: 1,
        unit: 'demet',
        fallbackDisplay: '1 demet',
        isScalable: true,
      },
      {
        id: 'ing-s4',
        name: 'İslahiye pul biberi',
        baseAmount: 1.5,
        unit: 'tatlı kaşığı',
        fallbackDisplay: '1.5 tatlı kaşığı',
        isScalable: true,
      },
      {
        id: 'ing-s5',
        name: 'Sürmek için köy tereyağı',
        baseAmount: 60,
        unit: 'g',
        fallbackDisplay: '60 g',
        isScalable: true,
      },
      {
        id: 'ing-s6',
        name: 'Ilık su ve kaya tuzu',
        fallbackDisplay: 'Hamur kıvamına göre',
        isScalable: false,
      },
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Hamurun Yoğrulması ve Dinlendirilmesi',
        instruction:
          'Un, tuz ve ılık suyla kulak memesi yumuşaklığında pürüzsüz bir hamur yoğrulur. Bezelere ayrılıp üzeri nemli bezle 20 dakika dinlendirilir.',
      },
      {
        stepNumber: 2,
        title: 'Peynirli İç Harcın Hazırlanması',
        instruction:
          'Taze köy çökeleği ince kıyılmış maydanoz, mis kokulu kuru nane ve İslahiye pul biberiyle ezilmeden harmanlanır.',
      },
      {
        stepNumber: 3,
        title: 'Yufkanın Açılması ve Kapatılması',
        instruction:
          'Bezeler oklavayla tabak büyüklüğünde incecik açılır. Bir yarısına peynirli harç yayılıp yarım ay şeklinde kapatılır, kenarları ruletle kesilir.',
      },
      {
        stepNumber: 4,
        title: 'Sacda Pişirme ve Yağlama',
        instruction:
          'Kızgın sacda veya döküm tavada iki tarafı altın sarısı benekler oluşana dek pişirilir. Sacdan iner inmez üzerine bol tereyağı sürülür.',
        tip: 'Demli bir çay eşliğinde soğutulmadan çıtır çıtır tüketilmesi önerilir.',
      },
    ],
  },
];
