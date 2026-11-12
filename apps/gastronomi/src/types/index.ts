export type PublicationStatus = 'draft' | 'in_review' | 'published' | 'archived';
export type VerificationStatus = 'verified' | 'unverified' | 'simulated';

export type CategoryScope =
  | 'dish'
  | 'place'
  | 'cultural_story'
  | 'artisan'
  | 'article'
  | 'announcement'
  | 'event';

export interface CategoryDefinition {
  id: string;
  scope: CategoryScope;
  label: string;
  shortLabel?: string;
  description?: string;
  order: number;
  isSystem: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type DishCategory =
  | 'all'
  | 'main'
  | 'pastry'
  | 'dessert'
  | 'local_product'
  | 'cultural_stop'
  | (string & {});

export interface ScalableIngredient {
  id: string;
  name: string;
  baseAmount?: number; // base amount per baseServings (usually 4)
  unit?: string;
  fallbackDisplay: string; // fallback if not scalable (e.g. "Damak zevkine göre")
  isScalable: boolean;
}

export interface RecipeStep {
  stepNumber: number;
  title: string;
  instruction: string;
  tip?: string;
  imageUrl?: string;
  videoUrl?: string; // only defined if verified playable video exists
  videoSrc?: string; // local or verified video path compatibility
  duration?: string; // verified video duration
}

export interface Recipe {
  id: string;
  dishId: string;
  dishCategory?: Exclude<DishCategory, 'all'>;
  title: string;
  subtitle?: string;
  baseServings: number; // default base portion count (e.g. 4)
  prepTime: string;
  cookTime: string;
  difficulty: 'Kolay' | 'Orta' | 'Ustalık Gerektirir';
  notes?: string;
  imageUrl: string;
  imageAlt: string;
  imageCaption?: string;
  ingredients: ScalableIngredient[];
  steps: RecipeStep[];
  publicationStatus?: PublicationStatus;
}

export interface Dish {
  id: string;
  name: string;
  category: Exclude<DishCategory, 'all'>;
  categoryLabel: string;
  tagline: string;
  description: string;
  culturalNote?: string;
  originNote: string;
  isRegisteredGeographicalIndication: boolean;
  giStatusNote?: string;
  prepTime: string;
  cookTime: string;
  difficulty: 'Kolay' | 'Orta' | 'Ustalık Gerektirir';
  servings: string;
  imageUrl: string;
  imageAlt: string;
  imageCredit: string;
  isLead?: boolean;
  recipeId?: string; // links to dedicated Recipe object
  ingredients: { name: string; amount: string }[];
  steps?: { stepNumber: number; instruction: string; tip?: string }[];
  publicationStatus?: PublicationStatus;
  verificationStatus?: VerificationStatus;
  sourceUrl?: string;
  isDemo?: boolean;
}

export interface MediaAsset {
  id: string;
  title: string;
  type: 'image' | 'video';
  url: string;
  credit?: string;
  isSampleMedia?: boolean;
}

/**
 * Verified Physical Gastronomy Places (Mod B - Sprint 01C & 02C-2)
 */
export type PlaceCategory =
  | 'bakery'
  | 'producer'
  | 'restaurant'
  | 'market'
  | 'cultural_site'
  | 'oven'
  | 'cooperative'
  | 'other'
  | (string & {});

export type PlaceVerificationStatus =
  | 'verified'
  | 'pending_verification'
  | 'inventory_in_progress'
  | 'unverified';

export interface GastronomyPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  categoryLabel: string;
  description: string;
  detailedDescription?: string;
  districtOrNeighborhood?: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  } | null;
  verificationStatus: VerificationStatus | PlaceVerificationStatus;
  verificationSource?: string;
  lastVerifiedDate?: string;
  relatedDishIds?: string[];
  relatedArtisanIds?: string[];
  coverImage?: string;
  images?: string[];
  websiteUrl?: string;
  visitingHours?: string;
  infoSource?: string;
  isDemo?: boolean;
  publicationStatus?: PublicationStatus;
  visitInfo?: {
    openingHours?: string;
    contactPhone?: string;
    seasonalNotes?: string;
  };
}

/**
 * Cultural Flavour Atlas Types (Mod A - Sprint 01C & 02C-2)
 */
export interface CulturalAtlasRegion {
  id: string;
  name: string;
  tagline: string;
  description: string;
  terrainBadge: string;
  positionPercent: { x: number; y: number }; // Relative position on illustrative canvas (0-100)
  associatedDishIds: string[];
}

export interface AtlasDishNode {
  id?: string;
  dishId: string;
  regionId: string;
  canvasPosition: { x: number; y: number }; // Percentage position on canvas (0-100)
  accentNote?: string;
  shortIntro?: string;
  imageUrl?: string;
  isVisible?: boolean;
  publicationStatus?: PublicationStatus;
  verificationStatus?: VerificationStatus;
  contentOrigin?: ContentOrigin;
  updatedAt?: string;
}

/**
 * Artisans and Producers (Sprint 01D)
 */
/**
 * Media Library Asset Models (Sprint 02C-1)
 */
export type MediaType =
  | 'dish_photo'
  | 'recipe_step'
  | 'video'
  | 'heritage'
  | 'artisan'
  | 'news_event';

export type MediaOrigin =
  | 'real_local'
  | 'licensed_stock'
  | 'ai_generated'
  | 'representative'
  | 'unverified';

export interface MediaItem {
  id: string;
  title: string;
  mediaType: MediaType;
  src: string;
  thumbnailSrc?: string;
  posterSrc?: string;
  description: string;
  altText: string;
  origin: MediaOrigin;
  sourceUrl?: string;
  licenseUrl?: string;
  usagePermission: string;
  verificationStatus: VerificationStatus;
  relatedContentIds: string[];
  publicationStatus: PublicationStatus;
  createdAt: string;
  updatedAt: string;
  fileSize?: string;
  dimensionsOrDuration?: string;
}

/**
 * Artisans and Producers (Sprint 01D & Sprint 02C-1)
 */
export interface Artisan {
  id: string;
  name: string; // Ad ve soyad / işletme adı
  businessName?: string;
  profileType?: 'master' | 'producer' | 'cooperative' | 'cook';
  title: string; // Uzmanlık / Unvan
  craftCategory: 'bakery' | 'agriculture' | 'pastry' | 'craft' | (string & {});
  craftCategoryLabel: string;
  biography: string; // Kısa biyografi
  detailedStory?: string; // Detaylı hikâye
  experienceYears?: number;
  villageOrNeighborhood?: string;
  imageUrl?: string; // Profil fotoğrafı
  imageCredit?: string;
  videoUrl?: string; // İsteğe bağlı video
  videoSrc?: string;
  relatedDishIds?: string[];
  relatedStoryIds?: string[];
  infoSource?: string; // Bilgi kaynağı
  publicationPermissionGranted: boolean; // Görsel ve biyografi kullanım izni
  permissionNote?: string;
  verificationStatus: VerificationStatus | 'archive_in_progress';
  publicationStatus?: PublicationStatus;
  isDemo?: boolean;
  visitInfo?: {
    address?: string;
    contactPhone?: string;
    note?: string;
  };
}

/**
 * Cultural Heritage Stories & Articles (Sprint 01D & Sprint 02C-1)
 */
export interface CulturalStorySection {
  heading?: string;
  paragraph: string;
  quote?: string;
  imageUrl?: string;
  imageCaption?: string;
}

export interface CulturalHeritageStory {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: 'tools' | 'cooking_methods' | 'seasons' | 'traditions' | (string & {});
  categoryLabel: string;
  coverImageUrl: string;
  imageCredit: string;
  readingTime: string;
  publishedDate?: string;
  leadParagraph: string;
  bodySections: CulturalStorySection[];
  relatedDishIds: string[];
  tags: string[];
  publicationStatus?: PublicationStatus;
  verificationStatus?: VerificationStatus;
  contentOrigin?: ContentOrigin;
  sourceUrl?: string;
  sourceNote?: string;
  isDemo?: boolean;
}

/**
 * Gastronomy Films & Cinematic Media (Sprint 01E)
 */
export type FilmMediaOrigin = 'real-shoot' | 'licensed-stock' | 'ai-generated';
export type FilmPublicationStatus = 'published' | 'in_production' | 'planned';
export type FilmContentType = 'concept_clip' | 'documentary_episode' | 'technique_demo';

export interface GastronomyFilm {
  id: string;
  contentType?: FilmContentType; // concept_clip vs documentary_episode
  episodeNumber?: number; // 1 to 10
  title: string;
  subtitle: string;
  description: string;
  posterSrc: string; // Primary poster / cover image
  coverImageUrl?: string; // Compatibility alias
  videoSrc?: string; // Playable local MP4 or verified direct stream
  videoUrl?: string; // Compatibility alias
  mediaOrigin: FilmMediaOrigin;
  sourceUrl?: string;
  licenseUrl?: string;
  publicationStatus: FilmPublicationStatus;
  status?: FilmPublicationStatus; // Compatibility alias
  statusLabel: string;
  duration?: string; // Only if verified video metadata exists
  relatedDishId?: string;
  theme: string;
  credits?: string;
  imageCredit?: string;
}

/**
 * Format scalable ingredient amounts based on target servings.
 */
export function formatIngredientAmount(
  ing: ScalableIngredient,
  targetServings: number,
  baseServings: number = 4
): string {
  if (!ing.isScalable || ing.baseAmount === undefined) {
    return ing.fallbackDisplay || (ing as any).amount || '';
  }
  const ratio = targetServings / baseServings;
  const scaled = ing.baseAmount * ratio;
  const formattedNumber = Number.isInteger(scaled)
    ? scaled.toString()
    : parseFloat(scaled.toFixed(2)).toString();
  return `${formattedNumber} ${ing.unit || ''}`.trim();
}

/**
 * Editorial Publishing & Gazette (Sprint 01F)
 */
export type ArticleCategory =
  | 'all'
  | 'gastronomy'
  | 'heritage'
  | 'agriculture'
  | 'culture'
  | (string & {});
export type ArticleContentType = 'news' | 'editorial_article';

export type ContentOrigin =
  | 'official_press'
  | 'official_notice'
  | 'editorial_narrative'
  | 'field_research'
  | 'temsili_demo';

export interface ArticleParagraph {
  title?: string;
  body: string;
  quote?: string;
  highlightText?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  category: Exclude<ArticleCategory, 'all'>;
  categoryLabel: string;
  contentType: ArticleContentType;
  contentOrigin: ContentOrigin;
  sourceUrl?: string;
  verificationStatus: VerificationStatus;
  isDemo: boolean;
  coverImage: string;
  imageCaption?: string;
  imageCredit: string;
  author: {
    name: string;
    title: string;
  };
  publishedAt: string; // ISO date format "2026-10-15"
  formattedDate: string; // e.g. "15 Ekim 2026"
  readingTime: string; // e.g. "4 dk okuma"
  publicationStatus: PublicationStatus;
  isLead?: boolean; // Featured lead article
  paragraphs: ArticleParagraph[];
  tags: string[];
  relatedDishIds?: string[];
  relatedArticleSlugs?: string[];
}

export type AnnouncementCategory =
  | 'gastronomi'
  | 'egitim'
  | 'kultur'
  | 'kurumsal'
  | (string & {});

export interface Announcement {
  id: string;
  title: string;
  summary: string;
  content: string[];
  detailedContent?: string;
  category: AnnouncementCategory;
  categoryLabel: string;
  contentOrigin: ContentOrigin;
  sourceUrl?: string;
  verificationStatus: VerificationStatus;
  isDemo: boolean;
  publishedAt: string;
  formattedDate: string;
  validUntil?: string;
  publicationStatus: PublicationStatus;
  priority: 'normal' | 'urgent';
  officialSource?: string;
  infoSource?: string;
  coverImage?: string;
  relatedEventId?: string;
  updatedAt?: string;
}

export type EventType = 'workshop' | 'tasting' | 'symposium' | 'festival' | (string & {});
export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
export type EventRegistrationStatus = 'open' | 'closed' | 'invite_only';

export interface GastronomyEvent {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  detailedContent?: string;
  eventType: EventType;
  eventTypeLabel: string;
  contentOrigin: ContentOrigin;
  sourceUrl?: string;
  verificationStatus: VerificationStatus;
  isDemo: boolean;
  startDate: string; // ISO date "2026-10-28"
  startTime?: string; // e.g. "14:00"
  endDate?: string; // ISO date "2026-10-28"
  endTime?: string; // e.g. "17:00"
  timezone?: string; // "Europe/Istanbul"
  formattedDate: string; // e.g. "28 Ekim 2026"
  time: string; // e.g. "14:00 - 17:00"
  locationName: string; // e.g. "İslahiye Kültür Merkezi Atölyesi"
  address: string;
  isOnline: boolean;
  coverImage: string;
  imageCredit: string;
  status: EventStatus;
  statusLabel: string;
  registrationStatus: EventRegistrationStatus;
  registrationStatusLabel: string;
  maxParticipants?: number;
  quota?: number;
  registrationUrl?: string;
  organizerInfo?: string;
  participationConditions?: string;
  publicationStatus?: PublicationStatus;
  tags: string[];
  targetAudience: string;
  updatedAt?: string;
}

/**
 * Homepage Featured Editorial Content Configuration (Sprint 02C-3)
 */
export interface HomepageFeaturedConfig {
  leadArticleId: string;
  secondaryArticleIds: string[];
  featuredAnnouncementId: string;
  featuredEventId: string;
  updatedAt: string;
}

/**
 * CMS Demo Activity Log Item (Sprint 02C-3)
 */
export interface DemoActivityLogItem {
  id: string;
  action: string;
  contentType: string;
  contentId: string;
  contentTitle: string;
  timestamp: string; // ISO string
  formattedTime: string;
  details?: string;
}


