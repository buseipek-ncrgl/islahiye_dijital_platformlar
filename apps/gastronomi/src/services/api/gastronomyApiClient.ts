import { Dish, Recipe, GastronomyPlace, CulturalHeritageStory, GastronomyFilm } from '../../types';
import { validateApiBaseUrl, sanitizeUrl, isCurrentAdminAuthorized } from '../../utils/security';

export interface ScaledIngredient {
  id: string;
  name: string;
  scaledAmount: number;
  unit: string;
  formattedAmount: string;
  category: string;
  notes?: string;
  isOptional: boolean;
  isKeyIngredient: boolean;
  orderIndex: number;
}

export interface ScaledRecipeResponse {
  id: string;
  dishId: string;
  dishName?: string;
  title: string;
  baseYield: number;
  requestedYield: number;
  yieldUnit: string;
  scaleFactor: number;
  ingredients: ScaledIngredient[];
  steps: Array<{
    id: string;
    stepNumber: number;
    title: string;
    instruction: string;
    tip?: string;
    durationMinutes?: number;
    imageUrl?: string;
  }>;
}

export interface CatalogOverviewResponse {
  totalDishes: number;
  totalRecipes: number;
  totalRegisteredGeographicalIndications: number;
  totalVerifiedPlaces: number;
  totalArtisans: number;
  totalHeritageStories: number;
  totalFilms: number;
  leadDishes: Dish[];
  recommendedPlaces: GastronomyPlace[];
  featuredStories: CulturalHeritageStory[];
}

export interface BackendDishDto {
  id: string;
  slug: string;
  name: string;
  alternativeNames?: string;
  category: number | string;
  categoryLabel: string;
  tagline: string;
  shortDescription: string;
  description: string;
  culturalNote?: string;
  originNote?: string;
  isRegisteredGeographicalIndication: boolean;
  giRegistrationNumber?: string;
  giStatusNote?: string;
  seasonalAvailability?: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: string;
  defaultServings: number;
  imageUrl: string;
  imageAlt?: string;
  imageCredit?: string;
  isLead: boolean;
  orderIndex: number;
  recipes?: any[];
}

const API_BASE_URL = validateApiBaseUrl(
  (import.meta as any).env?.VITE_GASTRONOMY_API_URL,
  'http://localhost:5235'
);

/**
 * Maps Backend Dish DTO to Frontend Dish model
 */
export function mapBackendDishToFrontend(dto: BackendDishDto): Dish {
  const categoryMap: Record<string, any> = {
    '0': 'main',
    '1': 'main',
    '2': 'main',
    '3': 'pastry',
    '4': 'dessert',
    '5': 'main',
    '6': 'local_product',
    TavaEt: 'main',
    Corba: 'main',
    DolmaSarma: 'main',
    HamurIsi: 'pastry',
    Tatli: 'dessert',
    MezeSalata: 'main',
    OzelLezzet: 'local_product',
  };

  const catStr = String(dto.category);
  const frontendCategory = categoryMap[catStr] || 'main';

  const diffStr = (dto.difficulty || '').toLocaleLowerCase('tr-TR');
  const difficulty: 'Kolay' | 'Orta' | 'Ustalık Gerektirir' =
    diffStr === 'kolay' ? 'Kolay' : diffStr === 'ileri' ? 'Ustalık Gerektirir' : 'Orta';

  // Format ingredients & steps from nested primary recipe if present
  const primaryRecipe = dto.recipes?.[0];

  const rawSlug = dto.slug || dto.id;
  const canonicalId =
    rawSlug === 'semsek-boregi'
      ? 'islahiye-semsegi'
      : rawSlug === 'islahiye-kombesi'
      ? 'bayram-kombesi'
      : rawSlug;

  return {
    id: canonicalId,
    name: dto.name,
    category: frontendCategory,
    categoryLabel: dto.categoryLabel || 'Yöresel Lezzet',
    tagline: dto.tagline || '',
    description: dto.description || dto.shortDescription || '',
    culturalNote: dto.culturalNote,
    originNote: dto.originNote || 'İslahiye Taş Fırın Geleneği',
    isRegisteredGeographicalIndication: Boolean(dto.isRegisteredGeographicalIndication),
    giStatusNote: dto.giStatusNote,
    prepTime: `${dto.prepTimeMinutes || 25} dk`,
    cookTime: `${dto.cookTimeMinutes || 45} dk`,
    difficulty,
    servings: `${dto.defaultServings || 4} Kişilik`,
    imageUrl: sanitizeUrl(dto.imageUrl, '/images/islahiye_tava.jpg'),
    imageAlt: dto.imageAlt || dto.name,
    imageCredit: dto.imageCredit || 'İslahiye Lezzet Atlası Arşivi',
    isLead: Boolean(dto.isLead),
    recipeId: primaryRecipe ? primaryRecipe.id : undefined,
    ingredients: primaryRecipe?.ingredients?.map((i: any) => ({
      name: i.name,
      amount: `${i.amount} ${i.unit || ''}`.trim(),
    })) || [],
    steps: primaryRecipe?.steps?.map((s: any) => ({
      stepNumber: s.stepNumber,
      instruction: s.instruction,
      tip: s.tip,
    })) || [],
  };
}

/**
 * Maps Frontend Dish to Backend Create/Update Payload
 */
export function mapFrontendDishToBackend(dish: Dish) {
  const categoryEnumMap: Record<string, number> = {
    main: 0, // TavaEt
    pastry: 3, // HamurIsi
    dessert: 4, // Tatli
    local_product: 6, // OzelLezzet
  };

  const parseMinutes = (timeStr?: string) => {
    if (!timeStr) return 30;
    const match = timeStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 30;
  };

  const parseServings = (servStr?: string) => {
    if (!servStr) return 4;
    const match = servStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 4;
  };

  return {
    slug: dish.id,
    name: dish.name,
    alternativeNames: (dish as any).alternativeNames || '',
    category: categoryEnumMap[dish.category] ?? 0,
    categoryLabel: dish.categoryLabel || 'Yöresel Lezzet',
    tagline: dish.tagline || '',
    shortDescription: dish.description?.slice(0, 300) || '',
    description: dish.description || '',
    culturalNote: dish.culturalNote || '',
    originNote: dish.originNote || '',
    isRegisteredGeographicalIndication: Boolean(dish.isRegisteredGeographicalIndication),
    giRegistrationNumber:
      dish.id === 'islahiye-biberi' && dish.isRegisteredGeographicalIndication ? '991' : null,
    giStatusNote: dish.giStatusNote || '',
    seasonalAvailability: (dish as any).seasonalAvailability || 'Dört Mevsim',
    prepTimeMinutes: parseMinutes(dish.prepTime),
    cookTimeMinutes: parseMinutes(dish.cookTime),
    difficulty: dish.difficulty === 'Kolay' ? 'kolay' : dish.difficulty === 'Ustalık Gerektirir' ? 'ileri' : 'orta',
    defaultServings: parseServings(dish.servings),
    imageUrl: dish.imageUrl || '/images/islahiye_tava.jpg',
    imageAlt: dish.imageAlt || dish.name,
    imageCredit: dish.imageCredit || 'İslahiye Lezzet Atlası',
    isLead: Boolean(dish.isLead),
    orderIndex: 1,
    publicationStatus: 1,
    verificationStatus: 2,
  };
}

class GastronomyApiClient {
  private baseUrl = API_BASE_URL;
  private isBackendAvailable: boolean | null = null;
  private lastHealthCheckTime = 0;

  private async fetchWithTimeout(
    url: string,
    init: RequestInit = {},
    timeoutMs = 4500
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, {
        ...init,
        headers: {
          Accept: 'application/json',
          ...(init.headers || {}),
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Health check to detect whether the ASP.NET Core backend is online.
   */
  public async isOnline(force = false): Promise<boolean> {
    const now = Date.now();
    if (!force && this.isBackendAvailable !== null && now - this.lastHealthCheckTime < 2500) {
      return this.isBackendAvailable;
    }

    try {
      const res = await this.fetchWithTimeout(
        `${this.baseUrl}/health/live`,
        { headers: { Accept: 'application/json' } },
        1200
      );
      this.isBackendAvailable = res.ok;
    } catch {
      this.isBackendAvailable = false;
    }

    this.lastHealthCheckTime = now;
    return this.isBackendAvailable;
  }

  // --- DISHES API ---

  public async getDishes(filters?: {
    search?: string;
    category?: string;
    giOnly?: boolean;
    difficulty?: string;
    includeAll?: boolean;
  }): Promise<Dish[] | null> {
    if (!(await this.isOnline())) return null;

    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.giOnly) params.append('geographicalIndicationOnly', 'true');
      if (filters?.difficulty) params.append('difficulty', filters.difficulty);
      if (filters?.includeAll) params.append('includeAll', 'true');

      const url = `${this.baseUrl}/api/dishes${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await this.fetchWithTimeout(url);
      if (res.ok) {
        const rawList: BackendDishDto[] = await res.json();
        return rawList.map(mapBackendDishToFrontend);
      }
    } catch (err) {
      console.warn('[GastronomyApiClient] Error fetching dishes from backend:', err);
    }
    return null;
  }

  public async getDish(idOrSlug: string): Promise<Dish | null> {
    if (!(await this.isOnline())) return null;

    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/dishes/${encodeURIComponent(idOrSlug)}`);
      if (res.ok) {
        const raw: BackendDishDto = await res.json();
        return mapBackendDishToFrontend(raw);
      }
    } catch (err) {
      console.warn(`[GastronomyApiClient] Error fetching dish ${idOrSlug}:`, err);
    }
    return null;
  }

  public async createDish(dish: Dish): Promise<Dish | null> {
    if (!isCurrentAdminAuthorized()) {
      console.warn('[GastronomyApiClient] Güvenlik Engeli: Yetkisiz kullanıcı tarafından API yemek ekleme işlemi engellendi.');
      return null;
    }
    if (!(await this.isOnline())) return null;

    try {
      const payload = mapFrontendDishToBackend(dish);
      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/dishes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created: BackendDishDto = await res.json();
        return mapBackendDishToFrontend(created);
      }
    } catch (err) {
      console.error('[GastronomyApiClient] Error creating dish:', err);
    }
    return null;
  }

  public async updateDish(id: string, dish: Dish): Promise<boolean> {
    if (!isCurrentAdminAuthorized()) {
      console.warn('[GastronomyApiClient] Güvenlik Engeli: Yetkisiz kullanıcı tarafından API yemek güncelleme işlemi engellendi.');
      return false;
    }
    if (!(await this.isOnline())) return false;

    try {
      const payload = mapFrontendDishToBackend(dish);
      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/dishes/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      return res.ok;
    } catch (err) {
      console.error(`[GastronomyApiClient] Error updating dish ${id}:`, err);
      return false;
    }
  }

  public async deleteDish(id: string): Promise<boolean> {
    if (!isCurrentAdminAuthorized()) {
      console.warn('[GastronomyApiClient] Güvenlik Engeli: Yetkisiz kullanıcı tarafından API yemek silme işlemi engellendi.');
      return false;
    }
    if (!(await this.isOnline())) return false;

    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/dishes/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (err) {
      console.error(`[GastronomyApiClient] Error deleting dish ${id}:`, err);
      return false;
    }
  }

  // --- RECIPES & SCALING API ---

  public async getRecipe(idOrSlug: string): Promise<Recipe | null> {
    if (!(await this.isOnline())) return null;

    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/recipes/${encodeURIComponent(idOrSlug)}`);
      if (res.ok) {
        const r = await res.json();
        return {
          id: r.id,
          dishId: r.dishId,
          title: r.title,
          baseServings: r.yield || 4,
          prepTime: `${r.prepTimeMinutes || 20} dk`,
          cookTime: `${r.cookTimeMinutes || 45} dk`,
          difficulty: r.difficulty === 'kolay' ? 'Kolay' : r.difficulty === 'ileri' ? 'Ustalık Gerektirir' : 'Orta',
          notes: r.notes,
          imageUrl: r.coverImageUrl || '/images/islahiye_tava.jpg',
          imageAlt: r.title,
          ingredients: r.ingredients?.map((ing: any) => ({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            category: ing.category,
            notes: ing.notes,
            isOptional: ing.isOptional,
            isKeyIngredient: ing.isKeyIngredient,
          })) || [],
          steps: r.steps?.map((st: any) => ({
            stepNumber: st.stepNumber,
            title: st.title,
            instruction: st.instruction,
            tip: st.tip,
            durationMinutes: st.durationMinutes,
            imageUrl: st.imageUrl,
          })) || [],
        };
      }
    } catch (err) {
      console.warn(`[GastronomyApiClient] Error fetching recipe ${idOrSlug}:`, err);
    }
    return null;
  }

  public async getScaledRecipe(idOrSlug: string, servings: number): Promise<ScaledRecipeResponse | null> {
    if (!(await this.isOnline())) return null;

    try {
      const res = await this.fetchWithTimeout(
        `${this.baseUrl}/api/recipes/${encodeURIComponent(idOrSlug)}/scale?servings=${servings}`
      );
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn(`[GastronomyApiClient] Error scaling recipe ${idOrSlug}:`, err);
    }
    return null;
  }

  // --- PLACES API ---

  public async getPlaces(filters?: {
    search?: string;
    category?: string;
    verifiedOnly?: boolean;
    recommendedOnly?: boolean;
  }): Promise<GastronomyPlace[] | null> {
    if (!(await this.isOnline())) return null;

    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.verifiedOnly) params.append('verifiedOnly', 'true');
      if (filters?.recommendedOnly) params.append('recommendedOnly', 'true');

      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/places?${params.toString()}`);
      if (res.ok) {
        const rawList = await res.json();
        const placeCatMap: Record<string, GastronomyPlace['category']> = {
          '0': 'restaurant',
          '1': 'bakery',
          '2': 'oven',
          '3': 'producer',
          '4': 'cooperative',
          '5': 'market',
          '6': 'cultural_site',
          restaurant: 'restaurant',
          bakery: 'bakery',
          oven: 'oven',
          producer: 'producer',
          cooperative: 'cooperative',
          market: 'market',
          cultural_site: 'cultural_site',
          other: 'other',
        };
        return rawList.map((p: any) => ({
          id: p.slug || p.id,
          name: p.name,
          category: placeCatMap[String(p.category).toLocaleLowerCase('tr-TR')] || 'restaurant',
          categoryLabel: p.categoryLabel || 'Lezzet Durağı',
          description: p.description,
          districtOrNeighborhood: p.neighborhood || p.district || 'İslahiye',
          address: p.fullAddress || p.shortAddress,
          coordinates:
            typeof p.latitude === 'number' && typeof p.longitude === 'number'
              ? { lat: p.latitude, lng: p.longitude }
              : null,
          verificationStatus:
            p.verificationStatus === 0 || p.verificationStatus === 'pending_verification'
              ? 'pending_verification'
              : 'verified',
          verificationSource: p.verificationSource || 'İslahiye Gastronomi Envanteri',
          lastVerifiedDate: '2026-10-15',
          relatedDishIds: (p.signatureDishIds || []).map((id: string) =>
            id === 'semsek-boregi'
              ? 'islahiye-semsegi'
              : id === 'islahiye-kombesi'
              ? 'bayram-kombesi'
              : id
          ),
          coverImage: p.coverImageUrl || '/images/islahiye_tava.jpg',
          visitingHours: p.openingHours || '08:00 – 21:00',
          publicationStatus: 'published',
          isDemo: false,
          visitInfo: {
            openingHours: p.openingHours || '08:00 – 21:00',
            contactPhone: p.phone || 'Yerinde Ziyaret',
          },
        }));
      }
    } catch (err) {
      console.warn('[GastronomyApiClient] Error fetching places from backend:', err);
    }
    return null;
  }

  public async getMapPoints(): Promise<any | null> {
    if (!(await this.isOnline())) return null;

    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/places/map`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[GastronomyApiClient] Error fetching map points:', err);
    }
    return null;
  }

  private mapPlaceCategoryToEnum(category: GastronomyPlace['category']): number {
    const map: Record<GastronomyPlace['category'], number> = {
      restaurant: 0,
      bakery: 1,
      oven: 2,
      producer: 3,
      cooperative: 4,
      market: 5,
      cultural_site: 5,
      other: 0,
    };
    return map[category] ?? 0;
  }

  public async createPlace(place: GastronomyPlace): Promise<boolean> {
    if (!isCurrentAdminAuthorized()) {
      console.warn('[GastronomyApiClient] Güvenlik Engeli: Yetkisiz kullanıcı tarafından API nokta ekleme işlemi engellendi.');
      return false;
    }
    if (!(await this.isOnline())) return false;
    try {
      const payload = {
        id: place.id,
        slug: place.id.replace(/^place-/, ''),
        name: place.name,
        category: this.mapPlaceCategoryToEnum(place.category),
        categoryLabel: place.categoryLabel || 'Lezzet Durağı',
        description: place.description || '',
        shortAddress: place.address || '',
        fullAddress: place.address || '',
        district: place.districtOrNeighborhood || 'İslahiye',
        neighborhood: place.districtOrNeighborhood || 'İslahiye',
        phone: place.visitInfo?.contactPhone || '',
        openingHours: place.visitingHours || '08:00 – 21:00',
        latitude: place.coordinates?.lat ?? null,
        longitude: place.coordinates?.lng ?? null,
        hasVerifiedCoordinates: Boolean(place.coordinates),
        verificationStatus: place.verificationStatus === 'verified' ? 1 : 0,
        verificationSource: place.verificationSource || 'İslahiye Gastronomi Envanteri',
        coverImageUrl: place.coverImage || '/images/islahiye_tava.jpg',
        signatureDishIds: place.relatedDishIds || [],
        isRecommended: true,
        orderIndex: 99,
      };

      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/places`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (err) {
      console.warn('[GastronomyApiClient] Error creating place:', err);
      return false;
    }
  }

  public async updatePlace(id: string, place: GastronomyPlace): Promise<boolean> {
    if (!isCurrentAdminAuthorized()) {
      console.warn('[GastronomyApiClient] Güvenlik Engeli: Yetkisiz kullanıcı tarafından API nokta güncelleme işlemi engellendi.');
      return false;
    }
    if (!(await this.isOnline())) return false;
    try {
      const payload = {
        name: place.name,
        category: this.mapPlaceCategoryToEnum(place.category),
        categoryLabel: place.categoryLabel || 'Lezzet Durağı',
        description: place.description || '',
        shortAddress: place.address || '',
        fullAddress: place.address || '',
        district: place.districtOrNeighborhood || 'İslahiye',
        neighborhood: place.districtOrNeighborhood || 'İslahiye',
        phone: place.visitInfo?.contactPhone || '',
        openingHours: place.visitingHours || '08:00 – 21:00',
        latitude: place.coordinates?.lat ?? null,
        longitude: place.coordinates?.lng ?? null,
        hasVerifiedCoordinates: Boolean(place.coordinates),
        verificationStatus: place.verificationStatus === 'verified' ? 1 : 0,
        verificationSource: place.verificationSource || 'İslahiye Gastronomi Envanteri',
        coverImageUrl: place.coverImage || '/images/islahiye_tava.jpg',
        signatureDishIds: place.relatedDishIds || [],
        isRecommended: true,
        orderIndex: 99,
      };

      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/places/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (err) {
      console.warn(`[GastronomyApiClient] Error updating place ${id}:`, err);
      return false;
    }
  }

  public async deletePlace(id: string): Promise<boolean> {
    if (!isCurrentAdminAuthorized()) {
      console.warn('[GastronomyApiClient] Güvenlik Engeli: Yetkisiz kullanıcı tarafından API nokta silme işlemi engellendi.');
      return false;
    }
    if (!(await this.isOnline())) return false;
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/places/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (err) {
      console.warn(`[GastronomyApiClient] Error deleting place ${id}:`, err);
      return false;
    }
  }

  // --- STORIES & FILMS & NEWS ---

  public async getStories(): Promise<CulturalHeritageStory[] | null> {
    if (!(await this.isOnline())) return null;

    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/stories`);
      if (res.ok) {
        const list = await res.json();
        const storyCatMap: Record<string, CulturalHeritageStory['category']> = {
          '0': 'cooking_methods',
          '1': 'tools',
          '2': 'seasons',
          '3': 'traditions',
          cooking_methods: 'cooking_methods',
          tools: 'tools',
          seasons: 'seasons',
          traditions: 'traditions',
        };
        return list.map((s: any) => ({
          id: s.slug || s.id,
          slug: s.slug || s.id,
          title: s.title,
          subtitle: s.subtitle || '',
          category: storyCatMap[String(s.theme).toLocaleLowerCase('tr-TR')] || 'cooking_methods',
          categoryLabel: s.themeLabel || 'Mutfak Mirası',
          coverImageUrl: s.coverImageUrl || '/images/islahiye_tava.jpg',
          readingTime: `${s.readTimeMinutes || 5} dk`,
          publishedDate: '15 Ekim 2026',
          leadParagraph: s.summary || '',
          bodySections: [{ heading: s.title, paragraph: s.content || '' }],
          relatedDishIds: (s.relatedDishIds || []).map((id: string) =>
            id === 'semsek-boregi'
              ? 'islahiye-semsegi'
              : id === 'islahiye-kombesi'
              ? 'bayram-kombesi'
              : id
          ),
          tags: ['İslahiye Mutfak Kültürü'],
        }));
      }
    } catch (err) {
      console.warn('[GastronomyApiClient] Error fetching stories:', err);
    }
    return null;
  }

  public async createStory(story: CulturalHeritageStory): Promise<boolean> {
    if (!isCurrentAdminAuthorized()) {
      console.warn('[GastronomyApiClient] Güvenlik Engeli: Yetkisiz kullanıcı tarafından API hikaye ekleme işlemi engellendi.');
      return false;
    }
    if (!(await this.isOnline())) return false;
    try {
      const payload = {
        id: story.id,
        slug: story.slug || story.id,
        title: story.title,
        subtitle: story.subtitle || '',
        theme: 0,
        themeLabel: story.categoryLabel || 'Mutfak Mirası',
        summary: story.leadParagraph || '',
        content: story.bodySections?.map((s) => `${s.heading}\n${s.paragraph}`).join('\n\n') || story.leadParagraph || '',
        coverImageUrl: story.coverImageUrl || '/images/islahiye_tava.jpg',
        relatedDishIds: story.relatedDishIds || [],
        authorOrSource: story.imageCredit || 'İslahiye Lezzet Atlası Kültürel Bellek Grubu',
        readTimeMinutes: parseInt(story.readingTime || '4', 10) || 4,
        isFeatured: true,
        orderIndex: 99,
      };

      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (err) {
      console.warn('[GastronomyApiClient] Error creating story:', err);
      return false;
    }
  }

  public async updateStory(id: string, story: CulturalHeritageStory): Promise<boolean> {
    if (!isCurrentAdminAuthorized()) {
      console.warn('[GastronomyApiClient] Güvenlik Engeli: Yetkisiz kullanıcı tarafından API hikaye güncelleme işlemi engellendi.');
      return false;
    }
    if (!(await this.isOnline())) return false;
    try {
      const payload = {
        title: story.title,
        subtitle: story.subtitle || '',
        theme: 0,
        themeLabel: story.categoryLabel || 'Mutfak Mirası',
        summary: story.leadParagraph || '',
        content: story.bodySections?.map((s) => `${s.heading}\n${s.paragraph}`).join('\n\n') || story.leadParagraph || '',
        coverImageUrl: story.coverImageUrl || '/images/islahiye_tava.jpg',
        relatedDishIds: story.relatedDishIds || [],
        authorOrSource: story.imageCredit || 'İslahiye Lezzet Atlası Kültürel Bellek Grubu',
        readTimeMinutes: parseInt(story.readingTime || '4', 10) || 4,
        isFeatured: true,
        orderIndex: 99,
      };

      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/stories/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (err) {
      console.warn(`[GastronomyApiClient] Error updating story ${id}:`, err);
      return false;
    }
  }

  public async deleteStory(id: string): Promise<boolean> {
    if (!isCurrentAdminAuthorized()) {
      console.warn('[GastronomyApiClient] Güvenlik Engeli: Yetkisiz kullanıcı tarafından API hikaye silme işlemi engellendi.');
      return false;
    }
    if (!(await this.isOnline())) return false;
    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/stories/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (err) {
      console.warn(`[GastronomyApiClient] Error deleting story ${id}:`, err);
      return false;
    }
  }

  public async getFilms(): Promise<GastronomyFilm[] | null> {
    if (!(await this.isOnline())) return null;

    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/films`);
      if (res.ok) {
        const list = await res.json();
        return list.map((f: any) => ({
          id: f.slug || f.id,
          contentType: 'concept_clip',
          title: f.title,
          subtitle: f.subtitle || '',
          description: f.description || '',
          posterSrc: f.thumbnailUrl || '/images/tas_firin_kozu_poster.jpg',
          coverImageUrl: f.thumbnailUrl || '/images/tas_firin_kozu_poster.jpg',
          videoSrc: f.videoUrl,
          videoUrl: f.videoUrl,
          duration: `${f.durationSeconds || 5} sn`,
          mediaOrigin: 'local_field',
          publicationStatus: 'published',
          status: 'published',
          relatedDishId: f.featuredDishId || 'islahiye-tava',
          theme: f.theme || 'Taş Fırın & Köz',
        }));
      }
    } catch (err) {
      console.warn('[GastronomyApiClient] Error fetching films:', err);
    }
    return null;
  }

  public async getCatalogOverview(): Promise<CatalogOverviewResponse | null> {
    if (!(await this.isOnline())) return null;

    try {
      const res = await this.fetchWithTimeout(`${this.baseUrl}/api/catalog/overview`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[GastronomyApiClient] Error fetching catalog overview:', err);
    }
    return null;
  }
}

export const gastronomyApiClient = new GastronomyApiClient();
