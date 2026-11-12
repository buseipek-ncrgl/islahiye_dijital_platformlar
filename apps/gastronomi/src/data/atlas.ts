import { CulturalAtlasRegion, AtlasDishNode } from '../types';

/**
 * Cultural Micro-Regions of the İslahiye Flavour Basin (Mod A)
 * These represent thematic geographic zones for symbolic cultural exploration.
 */
export const CULTURAL_REGIONS: CulturalAtlasRegion[] = [
  {
    id: 'amanos-yaylalari',
    name: 'Amanos Dağ Etekleri & Yaylalar',
    tagline: 'Kekik kokulu yamaçlar, serin pınarlar ve tütsülenen yeşil buğday.',
    description:
      'Akdeniz ve Barak iklimlerinin buluştuğu yayla florası; meşe ateşinde tütsülenen firik buğdayının ve yayla kuzu etinin coğrafyası.',
    terrainBadge: 'Yayla & Dağ Florası',
    positionPercent: { x: 25, y: 18 },
    associatedDishIds: ['firik-pilavi'],
  },
  {
    id: 'islahiye-ovasi',
    name: 'İslahiye Ovası & Güneş Havzası',
    tagline: 'Kırmızı alüvyon toprak, eylül sıcağı ve güneşte kuruyan biber sergileri.',
    description:
      'Güneşin bereketiyle olgunlaşan tescilli İslahiye biberi, asırlık kuru incir bahçeleri ve ceviz ağaçlarının yetiştiği tarım ovası.',
    terrainBadge: 'Bereketli Ova Havzası',
    positionPercent: { x: 75, y: 20 },
    associatedDishIds: ['islahiye-biberi', 'incir-tatlisi'],
  },
  {
    id: 'tarihi-tascarsi',
    name: 'Tarihi Taş Fırınlar & Ocaklık Dokusu',
    tagline: 'Meşe odunu közü, bakır tepsiler ve asırlık çarşı ocaklığı.',
    description:
      'İslahiye merkezindeki asırlık taş fırınlar; döküm tavalar, sac üzerinde pişen peynirli semsekler ve geleneksel bayram kömbesi.',
    terrainBadge: 'Çarşı & Taş Fırın Mirası',
    positionPercent: { x: 44, y: 84 },
    associatedDishIds: ['islahiye-tava', 'islahiye-semsegi', 'bayram-kombesi'],
  },
];

/**
 * Position nodes for cultural dishes on the authentic cartographic canvas.
 * Positioned across the authentic İslahiye district boundary geometry.
 */
export const ATLAS_DISH_NODES: AtlasDishNode[] = [
  // 1. Amanos Usulü Firik Pilavı - Amanos foothills (NW)
  {
    dishId: 'firik-pilavi',
    regionId: 'amanos-yaylalari',
    canvasPosition: { x: 23, y: 32 },
    accentNote: 'Amanos Etekleri & İsli Buğday',
  },
  // 2. İslahiye Biberi - Sun-drenched agricultural plain (NE)
  {
    dishId: 'islahiye-biberi',
    regionId: 'islahiye-ovasi',
    canvasPosition: { x: 63, y: 35 },
    accentNote: 'Kırmızı Topraklar & Güneş Kurutması',
  },
  // 3. Geleneksel İslahiye Tavası - Historic stone ovens & hearths (Center)
  {
    dishId: 'islahiye-tava',
    regionId: 'tarihi-tascarsi',
    canvasPosition: { x: 42, y: 42 },
    accentNote: 'Taş Fırın & Meşe Odunu Közü',
  },
  // 4. Geleneksel Semsek Böreği - Riverside village / western slope
  {
    dishId: 'islahiye-semsegi',
    regionId: 'tarihi-tascarsi',
    canvasPosition: { x: 28, y: 64 },
    accentNote: 'Köy Çökeleği & Sac Böreği',
  },
  // 5. Taş Fırın Bayram Kömbesi - Historic bakery tradition (South-Center)
  {
    dishId: 'bayram-kombesi',
    regionId: 'tarihi-tascarsi',
    canvasPosition: { x: 48, y: 68 },
    accentNote: 'Ahşap Kalıp & 7 Baharat',
  },
  // 6. Cevizli İncir Tatlısı - Southeastern orchards
  {
    dishId: 'incir-tatlisi',
    regionId: 'islahiye-ovasi',
    canvasPosition: { x: 74, y: 66 },
    accentNote: 'Dağ İnciri & Süt Demlemesi',
  },
];


