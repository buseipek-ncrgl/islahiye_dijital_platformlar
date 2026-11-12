import { Recipe, Dish, PublicationStatus } from '../types';
import { FEATURED_DISHES } from './dishes';

export const CURATED_RECIPES: Recipe[] = [
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
    id: 'recipe-semsek',
    dishId: 'islahiye-semsegi',
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
  {
    id: 'recipe-kombe',
    dishId: 'bayram-kombesi',
    title: 'Taş Fırın Bayram Kömbesi',
    subtitle: 'Yedi baharatın kokusuyla tahta kalıplarda şekillenen asırlık bayram çöreği.',
    baseServings: 12,
    prepTime: '45 dk',
    cookTime: '20 dk',
    difficulty: 'Orta',
    notes: 'Kömbe baharatı dövülmüş mahlep, tarçın, zencefil, karanfil, muskat ve damla sakızından oluşur.',
    imageUrl: '/images/islahiye_kombesi.jpg',
    imageAlt: 'Geleneksel ahşap kalıplı bayram kömbesi',
    imageCaption: 'Taş fırında pişen ve aylarca tazeliğini koruyan İslahiye bayram kömbesi.',
    ingredients: [
      { id: 'ing-k1', name: 'Un', baseAmount: 1, unit: 'kg', fallbackDisplay: '1 kg', isScalable: true },
      { id: 'ing-k2', name: 'Köy tereyağı (eritilmiş)', baseAmount: 250, unit: 'g', fallbackDisplay: '250 g', isScalable: true },
      { id: 'ing-k3', name: 'Sızma zeytinyağı', baseAmount: 1, unit: 'su bardağı', fallbackDisplay: '1 su bardağı', isScalable: true },
      { id: 'ing-k4', name: 'Süt', baseAmount: 1, unit: 'su bardağı', fallbackDisplay: '1 su bardağı', isScalable: true },
      { id: 'ing-k5', name: 'Pancar şekeri', baseAmount: 1.5, unit: 'su bardağı', fallbackDisplay: '1.5 su bardağı', isScalable: true },
      { id: 'ing-k6', name: 'Özel kömbe baharatı', baseAmount: 2, unit: 'yemek kaşığı', fallbackDisplay: '2 yemek kaşığı', isScalable: true },
      { id: 'ing-k7', name: 'Kavrulmuş susam', baseAmount: 1, unit: 'su bardağı', fallbackDisplay: '1 su bardağı', isScalable: true },
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Şekerin Eritilmesi ve Sıvı Karışım',
        instruction: 'Pancar şekeri ılık süt içinde tamamen eriyene kadar karıştırılır; eritilmiş ılık tereyağı ve zeytinyağı ilave edilir.',
      },
      {
        stepNumber: 2,
        title: 'Baharatlı Hamurun Yoğrulması',
        instruction: 'Elenmiş un ve dövülmüş kömbe baharatı karışıma eklenir, kulak memesi kıvamında pürüzsüz ve ele yapışmayan bir hamur yoğrulur.',
      },
      {
        stepNumber: 3,
        title: 'Kalıpla Şekillendirme',
        instruction: 'Hamurdan ceviz büyüklüğünde parçalar koparılıp önce susama batırılır, ardından oymalı ahşap kömbe kalıbına bastırılıp tezgaha vurularak çıkarılır.',
      },
      {
        stepNumber: 4,
        title: 'Taş Fırında Kurutarak Pişirme',
        instruction: 'Önceden ısıtılmış 175°C fırında veya taş fırında altı ve üstü hafif pembeleşene dek yaklaşık 20 dakika pişirilir; soğuyunca teneke kutuda aylarca saklanır.',
      },
    ],
  },
  {
    id: 'recipe-incir-tatlisi',
    dishId: 'incir-tatlisi',
    title: 'Cevizli Dağ İnciri Tatlısı',
    subtitle: 'Amanos dağ incirleri, taze ceviz içi ve tarçınlı süt şerbeti.',
    baseServings: 6,
    prepTime: '20 dk',
    cookTime: '25 dk',
    difficulty: 'Kolay',
    notes: 'Kuru incirler çok sertse ılık sütte 15 dakika bekletilerek yumuşatılmalıdır.',
    imageUrl: '/images/incir_tatlisi.jpg',
    imageAlt: 'Cevizle doldurulmuş dağ inciri tatlısı',
    imageCaption: 'Amanos yaylalarının kuru incirlerinden hazırlanan geleneksel sütlü ocak tatlısı.',
    ingredients: [
      { id: 'ing-i1', name: 'Kuru dağ inciri', baseAmount: 18, unit: 'adet', fallbackDisplay: '18 adet', isScalable: true },
      { id: 'ing-i2', name: 'Amanos cevizi içi (iri dövülmüş)', baseAmount: 1.5, unit: 'su bardağı', fallbackDisplay: '1.5 su bardağı', isScalable: true },
      { id: 'ing-i3', name: 'Süt', baseAmount: 1.5, unit: 'su bardağı', fallbackDisplay: '1.5 su bardağı', isScalable: true },
      { id: 'ing-i4', name: 'Pancar şekeri', baseAmount: 3, unit: 'yemek kaşığı', fallbackDisplay: '3 yemek kaşığı', isScalable: true },
      { id: 'ing-i5', name: 'Çubuk tarçın', baseAmount: 1, unit: 'adet', fallbackDisplay: '1 adet', isScalable: false },
      { id: 'ing-i6', name: 'Manda kaymağı (servis için)', baseAmount: 100, unit: 'g', fallbackDisplay: '100 g', isScalable: true },
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'İncirlerin Hazırlanması ve Doldurulması',
        instruction: 'Ilık suda yumuşatılan incirlerin üst sap kısımları kesilir, parmakla içi açılarak iri dövülmüş dağ cevizleriyle sıkıca doldurulur.',
      },
      {
        stepNumber: 2,
        title: 'Tencereye Dizim ve Şerbetleme',
        instruction: 'Doldurulan incirler yayvan bir bakır tencereye tek sıra dizilir; üzerine süt, şeker ve tarçın çubuğu ilave edilir.',
      },
      {
        stepNumber: 3,
        title: 'Kısık Ateşte Demleme',
        instruction: 'Kapağı kapalı olarak en kısık ateşte sütü tamamen çekip ballı şerbet kıvamı alana dek 25 dakika demlendirilir; ılık kaymakla servis edilir.',
      },
    ],
  },
];

// Helper to convert any Dish into a rich, scalable Recipe
export function createRecipeFromDish(dish: Dish): Recipe {
  const servingsNum = parseInt(dish.servings) || 4;

  const ingredients =
    Array.isArray(dish.ingredients) && dish.ingredients.length > 0
      ? dish.ingredients.map((ing, idx) => {
          const amountStr = ing.amount || '';
          const match = amountStr.match(/^([\d.,/]+)\s*(.*)$/);
          let baseAmount: number | undefined = undefined;
          let unit = '';
          if (match) {
            if (match[1].includes('/')) {
              const [num, den] = match[1].split('/');
              baseAmount = parseFloat(num) / parseFloat(den);
            } else {
              baseAmount = parseFloat(match[1].replace(',', '.'));
            }
            unit = match[2];
          }
          return {
            id: `ing-${dish.id}-${idx + 1}`,
            name: ing.name || 'Yöresel Malzeme',
            baseAmount: isNaN(baseAmount as number) ? undefined : baseAmount,
            unit: unit || '',
            fallbackDisplay: ing.amount || 'Gerektiği kadar',
            isScalable: typeof baseAmount === 'number' && !isNaN(baseAmount),
          };
        })
      : [
          {
            id: `ing-${dish.id}-1`,
            name: 'Temel Yöresel Malzemeler',
            baseAmount: 500,
            unit: 'g',
            fallbackDisplay: '500 g',
            isScalable: true,
          },
          {
            id: `ing-${dish.id}-2`,
            name: 'İslahiye Baharatları ve Zeytinyağı',
            baseAmount: 2,
            unit: 'yemek kaşığı',
            fallbackDisplay: '2 yemek kaşığı',
            isScalable: true,
          },
        ];

  const steps =
    Array.isArray(dish.steps) && dish.steps.length > 0
      ? dish.steps.map((st, sIdx) => {
          let stepTitle = `Adım ${st.stepNumber || sIdx + 1}: Hazırlık`;
          const instr = (st.instruction || '').toLocaleLowerCase('tr-TR');
          if (instr.includes('kayna') || instr.includes('haşla')) stepTitle = `Adım ${st.stepNumber || sIdx + 1}: Haşlama ve Kaynatma`;
          else if (instr.includes('yoğrul') || instr.includes('hamur') || instr.includes('açılır')) stepTitle = `Adım ${st.stepNumber || sIdx + 1}: Hamur ve Harç Hazırlığı`;
          else if (instr.includes('kavur') || instr.includes('tava') || instr.includes('mühür')) stepTitle = `Adım ${st.stepNumber || sIdx + 1}: Kavurma ve Mühürleme`;
          else if (instr.includes('fırın') || instr.includes('köz') || instr.includes('pişir')) stepTitle = `Adım ${st.stepNumber || sIdx + 1}: Fırınlama ve Pişirme`;
          else if (instr.includes('demlen') || instr.includes('servis')) stepTitle = `Adım ${st.stepNumber || sIdx + 1}: Demleme ve Servis`;
          else if (instr.includes('şerbet') || instr.includes('tatlı')) stepTitle = `Adım ${st.stepNumber || sIdx + 1}: Şerbetleme ve Bağlama`;
          else if (st.tip) stepTitle = st.tip.split('.')[0];

          const stepsLen = dish.steps ? dish.steps.length : 1;
          return {
            stepNumber: st.stepNumber || sIdx + 1,
            title: stepTitle,
            instruction: st.instruction || 'Geleneksel tarife göre özenle pişirilir.',
            tip: st.tip || (sIdx === stepsLen - 1 ? 'Sıcak olarak taze ekmek veya yayık ayranı eşliğinde servis edilmesi önerilir.' : undefined),
            imageUrl: dish.imageUrl,
          };
        })
      : [
          {
            stepNumber: 1,
            title: 'Malzemelerin Hazırlanması ve Dinlendirilmesi',
            instruction: `${dish.name} için tüm taze malzemeler oda sıcaklığında hazırlanır ve geleneksel İslahiye usulüne göre ayıklanır.`,
            tip: 'Malzemelerin tazeliği yemeğin lezzetini doğrudan belirler.',
            imageUrl: dish.imageUrl,
          },
          {
            stepNumber: 2,
            title: 'Geleneksel Pişirme ve Sunum',
            instruction: `${dish.name}, taş fırında veya kısık ocaklık ateşinde kıvamını alana kadar pişirilir ve dinlendirilerek sıcak servis edilir.`,
            tip: 'Bakır sahanda veya güveçte dinlendirildikten sonra ikram edilmesi önerilir.',
            imageUrl: dish.imageUrl,
          },
        ];

  return {
    id: dish.recipeId || `recipe-${dish.id}`,
    dishId: dish.id,
    title: dish.name,
    subtitle: dish.tagline || dish.description,
    baseServings: servingsNum,
    prepTime: dish.prepTime || '20 dk',
    cookTime: dish.cookTime || '40 dk',
    difficulty: dish.difficulty || 'Orta',
    notes: dish.culturalNote || dish.description,
    imageUrl: dish.imageUrl || '/images/islahiye_tava.jpg',
    imageAlt: dish.imageAlt || dish.name,
    imageCaption: dish.description,
    ingredients,
    steps,
    publicationStatus: (dish.publicationStatus as PublicationStatus) || 'published',
  };
}

// Generate complete recipes for all dishes not covered by curated recipes
const curatedDishIds = new Set(CURATED_RECIPES.map((r) => r.dishId));
curatedDishIds.add('semsek-boregi');
curatedDishIds.add('islahiye-semsegi');
curatedDishIds.add('bayram-kombesi');
curatedDishIds.add('islahiye-kombesi');

const generatedRecipes: Recipe[] = FEATURED_DISHES.filter((d) => !curatedDishIds.has(d.id)).map(createRecipeFromDish);

// Full inventory of all 30 authentic İslahiye recipes
export const RECIPES: Recipe[] = [...CURATED_RECIPES, ...generatedRecipes];
