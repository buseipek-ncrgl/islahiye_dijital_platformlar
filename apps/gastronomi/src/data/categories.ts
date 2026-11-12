import { CategoryDefinition, CategoryScope } from '../types';

export interface CategoryScopeMeta {
  scope: CategoryScope;
  label: string;
  shortTitle: string;
  description: string;
  visitorRoute?: string;
}

export const CATEGORY_SCOPE_META: CategoryScopeMeta[] = [
  {
    scope: 'dish',
    label: 'Yemek, Tarif & Ürünler',
    shortTitle: 'Yemek & Tarif',
    description:
      'Yöresel lezzet kataloğu (/yemekler), ana sayfa vitrini ve Tarif Atölyesi kitap filtreleri.',
    visitorRoute: '/yemekler',
  },
  {
    scope: 'place',
    label: 'Harita Ziyaret Noktaları',
    shortTitle: 'Harita Noktası',
    description:
      'Lezzet haritasındaki fırın, lokanta, kooperatif, üretici ve tarihî mekân türleri.',
    visitorRoute: '/lezzet-haritasi',
  },
  {
    scope: 'cultural_story',
    label: 'Mutfak Mirası & Sözlü Tarih',
    shortTitle: 'Mutfak Mirası',
    description:
      'Pişirme usulleri, araç gereç, hasat dönemleri ve gelenek arşiv kategorileri.',
    visitorRoute: '/mutfak-mirasi',
  },
  {
    scope: 'artisan',
    label: 'Ustalar & Üreticiler',
    shortTitle: 'Usta & Zanaat',
    description:
      'Taş fırın, tarım üretimi, hamur zanaatı ve el sanatları uzmanlık alanları.',
    visitorRoute: '/mutfak-mirasi',
  },
  {
    scope: 'article',
    label: 'Haberler & Editoryal Yazılar',
    shortTitle: 'Haber & Yazı',
    description:
      'Gastronomi bülteni ve araştırma makaleleri filtre kategorileri.',
    visitorRoute: '/haberler',
  },
  {
    scope: 'announcement',
    label: 'Kurumsal Duyurular',
    shortTitle: 'Duyuru',
    description:
      'Resmî coğrafi işaret, kurumsal bilgilendirme ve eğitim duyuru kategorileri.',
    visitorRoute: '/duyurular',
  },
  {
    scope: 'event',
    label: 'Etkinlikler & Atölyeler',
    shortTitle: 'Etkinlik Türü',
    description:
      'Gastronomi atölyesi, hasat buluşması, panel ve festival türleri.',
    visitorRoute: '/etkinlikler',
  },
];

export const CATEGORY_SCOPE_MAP: Record<CategoryScope, CategoryScopeMeta> =
  CATEGORY_SCOPE_META.reduce(
    (acc, meta) => {
      acc[meta.scope] = meta;
      return acc;
    },
    {} as Record<CategoryScope, CategoryScopeMeta>
  );

export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  // 1. Dish / Recipe / Product Categories
  {
    id: 'main',
    scope: 'dish',
    label: 'Ana Yemekler',
    shortLabel: 'Ana Yemek',
    description: 'Taş fırın tavaları, kebaplar ve sıcak tencere yemekleri.',
    order: 1,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'pastry',
    scope: 'dish',
    label: 'Hamur İşleri',
    shortLabel: 'Hamur',
    description: 'Biberli ekmek, şemsek, katmer ve geleneksel fırın hamurları.',
    order: 2,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'local_product',
    scope: 'dish',
    label: 'Yöresel Ürünler',
    shortLabel: 'Ürünler',
    description: 'TÜRKPATENT tescilli İslahiye Biberi ve bölge mahsulleri.',
    order: 3,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'dessert',
    scope: 'dish',
    label: 'Tatlılar',
    shortLabel: 'Tatlı',
    description: 'Bayram kömbesi, dağ inciri tatlısı ve geleneksel ikramlıklar.',
    order: 4,
    isSystem: true,
    isActive: true,
  },

  // 2. Place Categories
  {
    id: 'bakery',
    scope: 'place',
    label: 'Taş Fırın & Ekmek Fırını',
    shortLabel: 'Taş Fırın',
    order: 1,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'oven',
    scope: 'place',
    label: 'Geleneksel Taş Fırın',
    shortLabel: 'Ocaklık Fırın',
    order: 2,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'restaurant',
    scope: 'place',
    label: 'Restoran & Lokanta',
    shortLabel: 'Lokanta',
    order: 3,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'producer',
    scope: 'place',
    label: 'Üretici & Çiftlik',
    shortLabel: 'Üretici',
    order: 4,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'cooperative',
    scope: 'place',
    label: 'Kadın Kooperatifi',
    shortLabel: 'Kooperatif',
    order: 5,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'market',
    scope: 'place',
    label: 'Yöresel Çarşı & Pazar',
    shortLabel: 'Çarşı & Pazar',
    order: 6,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'cultural_site',
    scope: 'place',
    label: 'Kültürel & Tarihi Alan',
    shortLabel: 'Kültürel Alan',
    order: 7,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'other',
    scope: 'place',
    label: 'Diğer Gastronomi Noktası',
    shortLabel: 'Diğer',
    order: 8,
    isSystem: true,
    isActive: true,
  },

  // 3. Cultural Story Categories
  {
    id: 'cooking_methods',
    scope: 'cultural_story',
    label: 'Pişirme Usulleri',
    shortLabel: 'Pişirme',
    order: 1,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'tools',
    scope: 'cultural_story',
    label: 'Geleneksel Mutfak Araçları',
    shortLabel: 'Araçlar',
    order: 2,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'seasons',
    scope: 'cultural_story',
    label: 'Hasat & Mevsimler',
    shortLabel: 'Mevsimler',
    order: 3,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'traditions',
    scope: 'cultural_story',
    label: 'Mutfak Gelenekleri',
    shortLabel: 'Gelenekler',
    order: 4,
    isSystem: true,
    isActive: true,
  },

  // 4. Artisan Craft Categories
  {
    id: 'bakery',
    scope: 'artisan',
    label: 'Taş Fırın & Ocaklık',
    shortLabel: 'Taş Fırın',
    order: 1,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'agriculture',
    scope: 'artisan',
    label: 'Toprak & Biber Üretimi',
    shortLabel: 'Biber & Tarım',
    order: 2,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'pastry',
    scope: 'artisan',
    label: 'Geleneksel Kömbe & Hamur',
    shortLabel: 'Kömbe & Hamur',
    order: 3,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'craft',
    scope: 'artisan',
    label: 'Mutfak El Sanatları',
    shortLabel: 'Bakır & Zanaat',
    order: 4,
    isSystem: true,
    isActive: true,
  },

  // 5. Article & News Categories
  {
    id: 'agriculture',
    scope: 'article',
    label: 'Toprak, Tescil & Hasat',
    shortLabel: 'Tescil & Hasat',
    order: 1,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'heritage',
    scope: 'article',
    label: 'Mutfak Mirası',
    shortLabel: 'Miras',
    order: 2,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'gastronomy',
    scope: 'article',
    label: 'Gastronomi',
    shortLabel: 'Gastronomi',
    order: 3,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'culture',
    scope: 'article',
    label: 'Kültür & Zanaat',
    shortLabel: 'Kültür',
    order: 4,
    isSystem: true,
    isActive: true,
  },

  // 6. Announcement Categories
  {
    id: 'gastronomi',
    scope: 'announcement',
    label: 'Resmî Coğrafi İşaret',
    shortLabel: 'Coğrafi İşaret',
    order: 1,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'kurumsal',
    scope: 'announcement',
    label: 'Kurumsal Bilgilendirme',
    shortLabel: 'Kurumsal',
    order: 2,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'kultur',
    scope: 'announcement',
    label: 'Kültürel Program',
    shortLabel: 'Kültür',
    order: 3,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'egitim',
    scope: 'announcement',
    label: 'Eğitim & Gelişim',
    shortLabel: 'Eğitim',
    order: 4,
    isSystem: true,
    isActive: true,
  },

  // 7. Event Types
  {
    id: 'workshop',
    scope: 'event',
    label: 'Gastronomi Atölyesi',
    shortLabel: 'Atölye',
    order: 1,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'tasting',
    scope: 'event',
    label: 'Tadım & Hasat Buluşması',
    shortLabel: 'Tadım & Hasat',
    order: 2,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'symposium',
    scope: 'event',
    label: 'Sempozyum & Panel',
    shortLabel: 'Panel',
    order: 3,
    isSystem: true,
    isActive: true,
  },
  {
    id: 'festival',
    scope: 'event',
    label: 'Festival & Şenlik',
    shortLabel: 'Festival',
    order: 4,
    isSystem: true,
    isActive: true,
  },
];

export function mergeCategoryOption(
  options: CategoryDefinition[],
  selectedId: string | undefined,
  scope: CategoryScope,
  fallbackLabel?: string
): CategoryDefinition[] {
  if (!selectedId || selectedId === 'all' || options.some((c) => c.id === selectedId)) {
    return options;
  }
  return [
    ...options,
    {
      id: selectedId,
      scope,
      label: fallbackLabel || selectedId,
      order: 999,
      isSystem: false,
      isActive: false,
    },
  ];
}

