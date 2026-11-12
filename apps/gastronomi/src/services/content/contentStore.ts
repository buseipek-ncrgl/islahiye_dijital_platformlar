import {
  Dish,
  Recipe,
  Article,
  Announcement,
  GastronomyEvent,
  CulturalHeritageStory,
  Artisan,
  GastronomyFilm,
  MediaItem,
  AtlasDishNode,
  GastronomyPlace,
  HomepageFeaturedConfig,
  DemoActivityLogItem,
  CategoryDefinition,
  CategoryScope,
} from '../../types';
import { FEATURED_DISHES } from '../../data/dishes';
import { RECIPES, createRecipeFromDish } from '../../data/recipes';
import { ARTICLES } from '../../data/news';
import { ANNOUNCEMENTS } from '../../data/announcements';
import { GASTRONOMY_EVENTS } from '../../data/events';
import { CULTURAL_STORIES } from '../../data/culturalStories';
import { ARTISANS } from '../../data/artisans';
import { CONCEPT_CLIPS, DOCUMENTARY_SERIES } from '../../data/films';
import { INITIAL_MEDIA_ITEMS } from '../../data/mediaCatalog';
import { ATLAS_DISH_NODES } from '../../data/atlas';
import { VERIFIED_PLACES } from '../../data/places';
import { DEFAULT_CATEGORIES, CATEGORY_SCOPE_MAP } from '../../data/categories';
import { gastronomyApiClient } from '../api/gastronomyApiClient';
import { safeJsonParse, isCurrentAdminAuthorized } from '../../utils/security';

/**
 * Versioned Local Storage Store for Gastronomi CMS & Visitor Sync (Sprint 02C-4: Unique Editorial Imagery)
 */
const STORAGE_KEY_V8 = 'islahiye_cms_store_v8';
const STORAGE_KEY_V7 = 'islahiye_cms_store_v7';
const STORAGE_VERSION = 8;

const LEGACY_DISH_ALIASES: Record<string, string> = {
  'semsek-boregi': 'islahiye-semsegi',
  'islahiye-kombesi': 'bayram-kombesi',
};

const LEGACY_RECIPE_ALIASES: Record<string, string> = {
  'recipe-semsek-boregi': 'recipe-semsek',
  'recipe-islahiye-kombesi': 'recipe-kombe',
};

export const normalizeDishId = (id: string): string => LEGACY_DISH_ALIASES[id] || id;
export const normalizeRecipeId = (id: string): string => LEGACY_RECIPE_ALIASES[id] || id;
const normalizeAtlasNodeId = (id: string): string => {
  if (id === 'node-semsek-boregi' || id === 'atlas-semsek-boregi') return 'node-islahiye-semsegi';
  if (id === 'node-islahiye-kombesi' || id === 'atlas-islahiye-kombesi') return 'node-bayram-kombesi';
  return id;
};

export interface CmsStoreState {
  version: number;
  dishes: Dish[];
  recipes: Recipe[];
  articles: Article[];
  announcements: Announcement[];
  events: GastronomyEvent[];
  culturalStories: CulturalHeritageStory[];
  artisans: Artisan[];
  films: GastronomyFilm[];
  mediaItems: MediaItem[];
  atlasNodes: AtlasDishNode[];
  places: GastronomyPlace[];
  deletedSeedIds?: string[];
  categories?: CategoryDefinition[];
  homepageFeatured: HomepageFeaturedConfig;
  demoActivityLog: DemoActivityLogItem[];
  lastUpdated: string;
}

type StoreListener = () => void;

class ContentStoreManager {
  private state: CmsStoreState;
  private listeners: Set<StoreListener> = new Set();
  private backendConnected: boolean = false;
  private simulationOverride: boolean = true;

  constructor() {
    this.state = this.loadFromStorage();

    // Listen for storage events across browser tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if ((event.key === STORAGE_KEY_V8 || event.key === STORAGE_KEY_V7) && event.newValue) {
          try {
            const parsed = JSON.parse(event.newValue);
            if (parsed && typeof parsed === 'object') {
              this.state = parsed;
              this.notify();
            }
          } catch {
            // Ignore parse errors from external tabs
          }
        }
      });

      // Initial probe & sync with live ASP.NET Core backend
      setTimeout(() => {
        this.syncWithBackend().catch((e) => console.warn('[ContentStore] Initial sync error:', e));
      }, 300);
    }
  }

  public isBackendConnected(): boolean {
    return this.backendConnected;
  }

  public isSimulationOverride(): boolean {
    return this.simulationOverride;
  }

  public setBackendConnectionStatus(connected: boolean): void {
    if (this.backendConnected !== connected) {
      this.backendConnected = connected;
      this.notify();
    }
  }

  public setSimulationOverride(override: boolean): void {
    this.simulationOverride = override;
    this.notify();
  }

  private shouldYieldData(): boolean {
    return true;
  }

  private getDefaultHomepageFeatured(): HomepageFeaturedConfig {
    return {
      leadArticleId: ARTICLES[0]?.id || 'news-01',
      secondaryArticleIds: [
        ARTICLES[1]?.id || 'art-01',
        ARTICLES[2]?.id || 'art-02',
      ],
      featuredAnnouncementId: ANNOUNCEMENTS[0]?.id || 'ann-01',
      featuredEventId: GASTRONOMY_EVENTS[0]?.id || 'evt-01',
      updatedAt: new Date().toISOString(),
    };
  }

  private getDeletedSet(stateRef: CmsStoreState = this.state): Set<string> {
    return new Set(Array.isArray(stateRef.deletedSeedIds) ? stateRef.deletedSeedIds : []);
  }

  private markDeleted(ids: string[]): void {
    const current = new Set(Array.isArray(this.state.deletedSeedIds) ? this.state.deletedSeedIds : []);
    ids.filter(Boolean).forEach((id) => current.add(id));
    this.state.deletedSeedIds = Array.from(current);
  }

  private unmarkDeleted(ids: string[]): void {
    if (!Array.isArray(this.state.deletedSeedIds) || this.state.deletedSeedIds.length === 0) return;
    const toRemove = new Set(ids.filter(Boolean));
    this.state.deletedSeedIds = this.state.deletedSeedIds.filter((id) => !toRemove.has(id));
  }

  private getDefaultActivityLog(): DemoActivityLogItem[] {
    return [
      {
        id: `log-seed-1`,
        action: 'Sistem Başlatıldı',
        contentType: 'system',
        contentId: 'init-v8',
        contentTitle: 'İslahiye Gastronomi CMS Veri Deposu Hazır',
        timestamp: new Date().toISOString(),
        formattedTime: 'Şimdi',
        details: 'Duyuru, etkinlik, merkezi yayın ve ana sayfa vitrin yönetimi modülleri etkinleştirildi.',
      },
    ];
  }

  /**
   * Initializes state from localStorage with canonical ID migration & deletion persistence
   */
  private loadFromStorage(): CmsStoreState {
    if (typeof window === 'undefined') {
      return this.getDefaultState();
    }

    try {
      const rawV8 = localStorage.getItem(STORAGE_KEY_V8);
      const rawStored = rawV8 || localStorage.getItem(STORAGE_KEY_V7);
      const isMigratingFromV7 = !rawV8 && Boolean(rawStored);
      if (rawStored) {
        const parsed: CmsStoreState | null = safeJsonParse<CmsStoreState | null>(rawStored, null);
        const hasValidDishes =
          parsed &&
          (parsed.version === STORAGE_VERSION || parsed.version === 7) &&
          Array.isArray(parsed.dishes) &&
          (parsed.dishes.length > 0 || (Array.isArray(parsed.deletedSeedIds) && parsed.deletedSeedIds.length > 0));

        if (hasValidDishes) {
          const deletedSet = new Set(Array.isArray(parsed.deletedSeedIds) ? parsed.deletedSeedIds : []);
          parsed.deletedSeedIds = Array.from(deletedSet);

          // Normalize legacy dish IDs and recipe links without losing custom edits
          const seenDishIds = new Set<string>();
          parsed.dishes = parsed.dishes
            .map((d) => ({
              ...d,
              id: normalizeDishId(d.id),
              recipeId: d.recipeId ? normalizeRecipeId(d.recipeId) : d.recipeId,
            }))
            .filter((d) => {
              if (!d.id || seenDishIds.has(d.id) || deletedSet.has(d.id)) return false;
              seenDishIds.add(d.id);
              return true;
            });

          if (!Array.isArray(parsed.places)) {
            parsed.places = JSON.parse(JSON.stringify(VERIFIED_PLACES));
          } else {
            // Repair legacy dish aliases on places without touching valid /images/dishes/ paths or user deletes
            parsed.places = parsed.places
              .filter((p) => !deletedSet.has(p.id) && !deletedSet.has(`place-${p.id}`))
              .map((place) => {
                const defaultPlace = VERIFIED_PLACES.find(
                  (vp) =>
                    vp.id === place.id ||
                    vp.name.trim().toLocaleLowerCase('tr-TR') === place.name.trim().toLocaleLowerCase('tr-TR')
                );
                if (defaultPlace) {
                  if (
                    defaultPlace.coordinates &&
                    typeof defaultPlace.coordinates.lat === 'number' &&
                    typeof defaultPlace.coordinates.lng === 'number' &&
                    (!place.coordinates ||
                      typeof place.coordinates.lat !== 'number' ||
                      typeof place.coordinates.lng !== 'number')
                  ) {
                    place.coordinates = {
                      lat: defaultPlace.coordinates.lat,
                      lng: defaultPlace.coordinates.lng,
                    };
                  }
                  if (!place.coverImage) {
                    place.coverImage = defaultPlace.coverImage;
                  }
                }
                if (place.relatedDishIds) {
                  place.relatedDishIds = place.relatedDishIds.map(normalizeDishId);
                }
                return place;
              });

            const existingPlaceIds = new Set(parsed.places.map((p) => p.id));
            const existingPlaceNames = new Set(
              parsed.places.map((p) => p.name.trim().toLocaleLowerCase('tr-TR'))
            );
            VERIFIED_PLACES.forEach((vp) => {
              if (
                !deletedSet.has(vp.id) &&
                !deletedSet.has(`place-${vp.id}`) &&
                !existingPlaceIds.has(vp.id) &&
                !existingPlaceNames.has(vp.name.trim().toLocaleLowerCase('tr-TR'))
              ) {
                parsed.places.push(JSON.parse(JSON.stringify(vp)));
              }
            });
          }

          // Cultural Heritage Stories
          if (!Array.isArray(parsed.culturalStories)) {
            parsed.culturalStories = JSON.parse(JSON.stringify(CULTURAL_STORIES));
          } else {
            parsed.culturalStories = parsed.culturalStories
              .filter(
                (s) => !deletedSet.has(s.id) && !deletedSet.has(`story-${s.id}`) && !deletedSet.has(s.slug)
              )
              .map((s) => ({
                ...s,
                relatedDishIds: s.relatedDishIds ? s.relatedDishIds.map(normalizeDishId) : s.relatedDishIds,
              }));

            const existingStoryIds = new Set(parsed.culturalStories.map((s) => s.id));
            const existingStoryTitles = new Set(
              parsed.culturalStories.map((s) => s.title.trim().toLocaleLowerCase('tr-TR'))
            );
            CULTURAL_STORIES.forEach((cs) => {
              if (
                !deletedSet.has(cs.id) &&
                !deletedSet.has(`story-${cs.id}`) &&
                !deletedSet.has(cs.slug) &&
                !existingStoryIds.has(cs.id) &&
                !existingStoryTitles.has(cs.title.trim().toLocaleLowerCase('tr-TR'))
              ) {
                parsed.culturalStories.push(JSON.parse(JSON.stringify(cs)));
              }
            });
          }

          // Films
          const defaultFilms = [...CONCEPT_CLIPS, ...DOCUMENTARY_SERIES];
          if (!Array.isArray(parsed.films)) {
            parsed.films = JSON.parse(JSON.stringify(defaultFilms));
          } else {
            parsed.films = parsed.films
              .filter((f) => !deletedSet.has(f.id))
              .map((f) => ({
                ...f,
                relatedDishId: f.relatedDishId ? normalizeDishId(f.relatedDishId) : f.relatedDishId,
              }));
            const existingFilmIds = new Set(parsed.films.map((f) => f.id));
            defaultFilms.forEach((df) => {
              if (!deletedSet.has(df.id) && !existingFilmIds.has(df.id)) {
                parsed.films.push(JSON.parse(JSON.stringify(df)));
              }
            });
          }

          // Artisans
          if (!Array.isArray(parsed.artisans)) {
            parsed.artisans = JSON.parse(JSON.stringify(ARTISANS));
          } else {
            parsed.artisans = parsed.artisans.filter((a) => !deletedSet.has(a.id));
            const existingArtisanIds = new Set(parsed.artisans.map((a) => a.id));
            ARTISANS.forEach((art) => {
              if (!deletedSet.has(art.id) && !existingArtisanIds.has(art.id)) {
                parsed.artisans.push(JSON.parse(JSON.stringify(art)));
              }
            });
          }

          // Recipes (canonicalize legacy IDs and respect deleted seeds)
          if (!Array.isArray(parsed.recipes)) {
            parsed.recipes = JSON.parse(JSON.stringify(RECIPES));
          } else {
            const seenRecipeIds = new Set<string>();
            const normalizedStoredRecipes = parsed.recipes
              .map((r) => ({
                ...r,
                id: normalizeRecipeId(r.id),
                dishId: r.dishId ? normalizeDishId(r.dishId) : r.dishId,
              }))
              .filter((r) => {
                if (
                  !r.id ||
                  seenRecipeIds.has(r.id) ||
                  deletedSet.has(r.id) ||
                  (r.dishId && (deletedSet.has(r.dishId) || deletedSet.has(`deleted-dish-recipe:${r.dishId}`)))
                ) {
                  return false;
                }
                seenRecipeIds.add(r.id);
                return true;
              });

            const defaultRecipeIds = new Set(RECIPES.map((r) => r.id));
            const userRecipes = normalizedStoredRecipes.filter((r) => !defaultRecipeIds.has(r.id));
            const userModifiedDefaults = new Map(
              normalizedStoredRecipes.filter((r) => defaultRecipeIds.has(r.id)).map((r) => [r.id, r])
            );

            const resolvedDefaults: Recipe[] = [];
            RECIPES.forEach((rec) => {
              if (
                deletedSet.has(rec.id) ||
                deletedSet.has(rec.dishId) ||
                deletedSet.has(`deleted-dish-recipe:${rec.dishId}`)
              ) {
                return;
              }
              const userEdit = userModifiedDefaults.get(rec.id);
              if (userEdit) {
                if (!userEdit.imageUrl) {
                  userEdit.imageUrl = rec.imageUrl;
                }
                resolvedDefaults.push(userEdit);
              } else {
                resolvedDefaults.push(JSON.parse(JSON.stringify(rec)));
              }
            });

            const existingDishIds = new Set([
              ...userRecipes.map((r) => r.dishId).filter(Boolean),
              ...resolvedDefaults.map((r) => r.dishId).filter(Boolean),
            ]);

            const customDishRecipes: Recipe[] = [];
            parsed.dishes.forEach((d) => {
              const expectedRecipeId = d.recipeId || `recipe-${d.id}`;
              if (
                d &&
                d.id &&
                !existingDishIds.has(d.id) &&
                !deletedSet.has(expectedRecipeId) &&
                !deletedSet.has(`deleted-dish-recipe:${d.id}`)
              ) {
                customDishRecipes.push(createRecipeFromDish(d));
              }
            });

            parsed.recipes = [...userRecipes, ...customDishRecipes, ...resolvedDefaults];
          }

          if (!Array.isArray(parsed.announcements)) {
            parsed.announcements = JSON.parse(JSON.stringify(ANNOUNCEMENTS));
          } else {
            parsed.announcements = parsed.announcements.filter((a) => !deletedSet.has(a.id));
          }

          if (!Array.isArray(parsed.events)) {
            parsed.events = JSON.parse(JSON.stringify(GASTRONOMY_EVENTS));
          } else {
            parsed.events = parsed.events.filter((e) => !deletedSet.has(e.id) && !deletedSet.has(e.slug));
          }

          if (!Array.isArray(parsed.articles)) {
            parsed.articles = JSON.parse(JSON.stringify(ARTICLES));
          } else {
            parsed.articles = parsed.articles
              .filter((a) => !deletedSet.has(a.id))
              .map((a) => ({
                ...a,
                relatedDishIds: a.relatedDishIds ? a.relatedDishIds.map(normalizeDishId) : a.relatedDishIds,
              }));
          }

          if (!Array.isArray(parsed.atlasNodes)) {
            parsed.atlasNodes = this.getSeedAtlasNodes();
          } else {
            const seenAtlasIds = new Set<string>();
            parsed.atlasNodes = parsed.atlasNodes
              .map((n) => ({
                ...n,
                id: normalizeAtlasNodeId(n.id || `node-${normalizeDishId(n.dishId)}`),
                dishId: normalizeDishId(n.dishId),
              }))
              .filter((n) => {
                const nodeKey = n.id || `node-${n.dishId}`;
                if (
                  deletedSet.has(nodeKey) ||
                  deletedSet.has(n.dishId) ||
                  seenAtlasIds.has(nodeKey)
                ) {
                  return false;
                }
                seenAtlasIds.add(nodeKey);
                return true;
              });
          }

          if (!Array.isArray(parsed.mediaItems)) {
            parsed.mediaItems = JSON.parse(JSON.stringify(INITIAL_MEDIA_ITEMS));
          } else {
            parsed.mediaItems = parsed.mediaItems
              .filter((m) => !deletedSet.has(m.id))
              .map((m) => ({
                ...m,
                relatedContentIds: m.relatedContentIds
                  ? m.relatedContentIds.map((cid) => normalizeRecipeId(normalizeDishId(cid)))
                  : m.relatedContentIds,
              }));
          }

          if (!parsed.homepageFeatured) {
            parsed.homepageFeatured = this.getDefaultHomepageFeatured();
          } else {
            const existingArticleIds = new Set(parsed.articles.map((a) => a.id));
            if (parsed.homepageFeatured.leadArticleId && !existingArticleIds.has(parsed.homepageFeatured.leadArticleId)) {
              const fallback = parsed.articles.find((a) => a.publicationStatus === 'published');
              parsed.homepageFeatured.leadArticleId = fallback?.id || '';
            }
            if (Array.isArray(parsed.homepageFeatured.secondaryArticleIds)) {
              parsed.homepageFeatured.secondaryArticleIds = parsed.homepageFeatured.secondaryArticleIds.filter(
                (id) => !id || existingArticleIds.has(id)
              );
            }
          }

          if (!Array.isArray(parsed.demoActivityLog)) {
            parsed.demoActivityLog = this.getDefaultActivityLog();
          }

          let categoriesBackfilled = false;
          if (!Array.isArray(parsed.categories) || parsed.categories.length === 0) {
            parsed.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
            categoriesBackfilled = true;
          } else {
            const hasLocalProduct = parsed.categories.some(
              (c) => c.scope === 'dish' && c.id === 'local_product'
            );
            if (!hasLocalProduct) {
              const seedLocal = DEFAULT_CATEGORIES.find(
                (c) => c.scope === 'dish' && c.id === 'local_product'
              );
              if (seedLocal) {
                parsed.categories = [...parsed.categories, { ...seedLocal }];
                categoriesBackfilled = true;
              }
            }
          }

          if (categoriesBackfilled && !isMigratingFromV7 && parsed.version === STORAGE_VERSION) {
            this.saveToStorage(parsed);
          }

          if (isMigratingFromV7 || parsed.version !== STORAGE_VERSION) {
            parsed.version = STORAGE_VERSION;

            const annSeeds = new Map(ANNOUNCEMENTS.map((a) => [a.id, a]));
            parsed.announcements = parsed.announcements.map((a) => {
              const seed = annSeeds.get(a.id);
              const isLegacyDemoSeed =
                Boolean(a.isDemo) ||
                a.verificationStatus === 'simulated' ||
                a.title.includes('(Demo)') ||
                a.title.includes('Prototip') ||
                a.officialSource?.includes('Simülasyon');
              return seed && isLegacyDemoSeed ? JSON.parse(JSON.stringify(seed)) : a;
            });

            const evtSeeds = new Map(GASTRONOMY_EVENTS.map((e) => [e.id, e]));
            parsed.events = parsed.events.map((e) => {
              const seed = evtSeeds.get(e.id);
              const isLegacyDemoSeed =
                Boolean(e.isDemo) ||
                e.verificationStatus === 'simulated' ||
                e.title.startsWith('Örnek Etkinlik') ||
                e.eventTypeLabel.includes('(Demo)') ||
                e.statusLabel.includes('(Demo)');
              return seed && isLegacyDemoSeed ? JSON.parse(JSON.stringify(seed)) : e;
            });

            const filmSeeds = new Map([...CONCEPT_CLIPS, ...DOCUMENTARY_SERIES].map((f) => [f.id, f]));
            parsed.films = parsed.films.map((f) => {
              const seed = filmSeeds.get(f.id);
              const isLegacyFilmSeed =
                f.credits?.includes('Pyramid-Flow') ||
                f.credits?.includes('OSCBench') ||
                f.statusLabel?.includes('Temsili Klip') ||
                f.statusLabel?.includes('Planlanan Belgesel') ||
                f.imageCredit?.includes('Temsili Konsept');
              return seed && isLegacyFilmSeed ? JSON.parse(JSON.stringify(seed)) : f;
            });

            const mediaSeeds = new Map(INITIAL_MEDIA_ITEMS.map((m) => [m.id, m]));
            parsed.mediaItems = parsed.mediaItems.map((m) => {
              const seed = mediaSeeds.get(m.id);
              const isLegacyMediaSeed =
                m.verificationStatus === 'simulated' ||
                m.usagePermission?.includes('Temsili') ||
                m.usagePermission?.includes('Prototip');
              return seed && isLegacyMediaSeed ? JSON.parse(JSON.stringify(seed)) : m;
            });

            parsed.demoActivityLog = parsed.demoActivityLog.map((entry) =>
              entry.id === 'log-seed-1' ? this.getDefaultActivityLog()[0] : entry
            );

            this.saveToStorage(parsed);
          }

          return parsed;
        }
      }

      const defaultState = this.getDefaultState();
      this.saveToStorage(defaultState);
      return defaultState;
    } catch (err) {
      console.warn('CMS LocalStorage reading failed, falling back to base seeds:', err);
      return this.getDefaultState();
    }
  }

  private getSeedAtlasNodes(): AtlasDishNode[] {
    return ATLAS_DISH_NODES.map((node) => {
      const dish = FEATURED_DISHES.find((d) => d.id === node.dishId);
      return {
        id: `node-${node.dishId}`,
        dishId: node.dishId,
        regionId: node.regionId,
        canvasPosition: { ...node.canvasPosition },
        accentNote: node.accentNote || dish?.tagline || '',
        shortIntro: dish?.description || '',
        imageUrl: dish?.imageUrl || '',
        isVisible: true,
        publicationStatus: 'published',
        verificationStatus: 'verified',
        contentOrigin: 'editorial_narrative',
        updatedAt: '2026-10-15T12:00:00Z',
      };
    });
  }

  private getDefaultState(): CmsStoreState {
    const seedCulturalStories: CulturalHeritageStory[] = JSON.parse(
      JSON.stringify(CULTURAL_STORIES)
    ).map((s: CulturalHeritageStory) => ({
      ...s,
      publicationStatus: s.publicationStatus || 'published',
      verificationStatus: s.verificationStatus || 'verified',
      contentOrigin: s.contentOrigin || 'editorial_narrative',
      isDemo: false,
    }));

    return {
      version: STORAGE_VERSION,
      dishes: JSON.parse(JSON.stringify(FEATURED_DISHES)),
      recipes: JSON.parse(JSON.stringify(RECIPES)),
      articles: JSON.parse(JSON.stringify(ARTICLES)),
      announcements: JSON.parse(JSON.stringify(ANNOUNCEMENTS)),
      events: JSON.parse(JSON.stringify(GASTRONOMY_EVENTS)),
      culturalStories: seedCulturalStories,
      artisans: JSON.parse(JSON.stringify(ARTISANS)),
      films: JSON.parse(JSON.stringify([...CONCEPT_CLIPS, ...DOCUMENTARY_SERIES])),
      mediaItems: JSON.parse(JSON.stringify(INITIAL_MEDIA_ITEMS)),
      atlasNodes: this.getSeedAtlasNodes(),
      places: JSON.parse(JSON.stringify(VERIFIED_PLACES)),
      deletedSeedIds: [],
      categories: JSON.parse(JSON.stringify(DEFAULT_CATEGORIES)),
      homepageFeatured: this.getDefaultHomepageFeatured(),
      demoActivityLog: this.getDefaultActivityLog(),
      lastUpdated: new Date().toISOString(),
    };
  }

  private upsertAtIndex<T>(arr: T[], index: number, item: T, append = false): T[] {
    if (index >= 0) {
      return arr.map((existing, i) => (i === index ? item : existing));
    }
    return append ? [...arr, item] : [item, ...arr];
  }

  private runTransaction(mutator: () => void): boolean {
    if (typeof window !== 'undefined' && !isCurrentAdminAuthorized()) {
      console.warn('[CmsContentStore] Güvenlik Engeli: Yetkisiz kullanıcı tarafından içerik değiştirme engellendi.');
      return false;
    }
    const previousStateSnapshot = JSON.stringify(this.state);
    mutator();
    const success = this.saveToStorage(this.state);
    if (!success) {
      try {
        this.state = JSON.parse(previousStateSnapshot);
      } catch {
        // Ignore snapshot parse failure
      }
      return false;
    }
    this.notify();
    return true;
  }

  private saveToStorage(state: CmsStoreState): boolean {
    if (typeof window === 'undefined') return false;
    try {
      state.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY_V8, JSON.stringify(state));
      return true;
    } catch (err) {
      console.error('LocalStorage write failed (quota exceeded or restricted):', err);
      return false;
    }
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Listener callback error:', err);
      }
    });
  }

  public subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Synchronizes state with the live ASP.NET Core backend API.
   * If backend is offline, marks state as offline and suppresses fake data.
   */
  public async syncWithBackend(): Promise<void> {
    try {
      const isOnline = await gastronomyApiClient.isOnline(true);
      this.backendConnected = isOnline;

      if (!isOnline) {
        this.notify();
        return;
      }

      const [dishes, places, stories, films] = await Promise.all([
        gastronomyApiClient.getDishes({ includeAll: true }),
        gastronomyApiClient.getPlaces(),
        gastronomyApiClient.getStories(),
        gastronomyApiClient.getFilms(),
      ]);

      let changed = false;
      const deletedSet = this.getDeletedSet();

      if (dishes && dishes.length > 0) {
        const normalizedBackendDishes = dishes
          .map((d) => ({
            ...d,
            id: normalizeDishId(d.id),
            recipeId: d.recipeId ? normalizeRecipeId(d.recipeId) : d.recipeId,
          }))
          .filter((d) => !deletedSet.has(d.id));
        const backendDishIds = new Set(normalizedBackendDishes.map((d) => d.id));
        const clientCustomDishes = this.state.dishes.filter((cd) => !backendDishIds.has(cd.id) && !deletedSet.has(cd.id));
        const missingDefaultDishes = FEATURED_DISHES.filter(
          (fd) => !deletedSet.has(fd.id) && !backendDishIds.has(fd.id) && !clientCustomDishes.some((cd) => cd.id === fd.id)
        );
        this.state.dishes = [...clientCustomDishes, ...normalizedBackendDishes, ...missingDefaultDishes];
        changed = true;
      }

      if (places && places.length > 0) {
        const filteredPlaces = places.filter(
          (p) => !deletedSet.has(p.id) && !deletedSet.has(`place-${p.id}`)
        );
        const backendPlaceKeys = new Set([
          ...filteredPlaces.map((p) => p.id),
          ...filteredPlaces.map((p) => (p as any).slug).filter(Boolean),
          ...filteredPlaces.map((p) => p.name.trim().toLocaleLowerCase('tr-TR')),
        ]);

        const clientCustomPlaces = this.state.places.filter(
          (cp) =>
            !deletedSet.has(cp.id) &&
            !backendPlaceKeys.has(cp.id) &&
            !backendPlaceKeys.has((cp as any).slug) &&
            !backendPlaceKeys.has(cp.name.trim().toLocaleLowerCase('tr-TR'))
        );

        const missingVerifiedPlaces = VERIFIED_PLACES.filter(
          (vp) =>
            !deletedSet.has(vp.id) &&
            !deletedSet.has(`place-${vp.id}`) &&
            !backendPlaceKeys.has(vp.id) &&
            !backendPlaceKeys.has(`place-${vp.id}`) &&
            !backendPlaceKeys.has(vp.name.trim().toLocaleLowerCase('tr-TR')) &&
            !clientCustomPlaces.some(
              (cp) => cp.id === vp.id || cp.name.trim().toLocaleLowerCase('tr-TR') === vp.name.trim().toLocaleLowerCase('tr-TR')
            )
        );

        this.state.places = [...clientCustomPlaces, ...filteredPlaces, ...missingVerifiedPlaces];
        changed = true;
      }

      if (stories && stories.length > 0) {
        const filteredStories = stories.filter(
          (s) => !deletedSet.has(s.id) && !deletedSet.has(`story-${s.id}`) && !deletedSet.has(s.slug)
        );
        const backendStoryKeys = new Set([
          ...filteredStories.map((s) => s.id),
          ...filteredStories.map((s) => (s as any).slug).filter(Boolean),
          ...filteredStories.map((s) => s.title.trim().toLocaleLowerCase('tr-TR')),
        ]);

        const clientCustomStories = this.state.culturalStories.filter(
          (cs) =>
            !deletedSet.has(cs.id) &&
            !backendStoryKeys.has(cs.id) &&
            !backendStoryKeys.has((cs as any).slug) &&
            !backendStoryKeys.has(cs.title.trim().toLocaleLowerCase('tr-TR'))
        );

        const missingDefaultStories = CULTURAL_STORIES.filter(
          (ds) =>
            !deletedSet.has(ds.id) &&
            !deletedSet.has(`story-${ds.id}`) &&
            !deletedSet.has(ds.slug) &&
            !backendStoryKeys.has(ds.id) &&
            !backendStoryKeys.has(`story-${ds.id}`) &&
            !backendStoryKeys.has(ds.title.trim().toLocaleLowerCase('tr-TR')) &&
            !clientCustomStories.some(
              (cs) => cs.id === ds.id || cs.title.trim().toLocaleLowerCase('tr-TR') === ds.title.trim().toLocaleLowerCase('tr-TR')
            )
        );

        this.state.culturalStories = [...clientCustomStories, ...filteredStories, ...missingDefaultStories];
        changed = true;
      }

      if (films && films.length > 0) {
        const defaultFilms = [...CONCEPT_CLIPS, ...DOCUMENTARY_SERIES];
        const filteredFilms = films.filter((f) => !deletedSet.has(f.id));
        const backendFilmIds = new Set(filteredFilms.map((f) => f.id));

        const clientCustomFilms = this.state.films.filter(
          (cf) => !deletedSet.has(cf.id) && !backendFilmIds.has(cf.id)
        );
        const missingDefaultFilms = defaultFilms.filter(
          (df) => !deletedSet.has(df.id) && !backendFilmIds.has(df.id) && !clientCustomFilms.some((cf) => cf.id === df.id)
        );

        this.state.films = [...clientCustomFilms, ...filteredFilms, ...missingDefaultFilms];
        changed = true;
      }

      if (changed) {
        this.saveToStorage(this.state);
      }
      this.notify();
    } catch (err) {
      console.warn('[ContentStoreManager] Backend sync encountered an issue:', err);
    }
  }

  // --- GETTERS (STRICT REAL BACKEND MODE) ---

  public getDishes(onlyPublished = false): Dish[] {
    if (!this.shouldYieldData()) return [];
    if (!onlyPublished) return this.state.dishes;
    return this.state.dishes.filter(
      (d) => !('publicationStatus' in d) || (d as any).publicationStatus === 'published'
    );
  }

  public getRecipes(onlyPublished = false): Recipe[] {
    if (!this.shouldYieldData()) return [];

    // Ensure any dishes in state that lack a recipe (and haven't had their recipe deleted) have one generated
    const deletedSet = this.getDeletedSet();
    const existingDishIds = new Set(this.state.recipes.map((r) => r.dishId).filter(Boolean));
    let hasExtra = false;
    for (const d of this.state.dishes) {
      const expectedRecipeId = d.recipeId || `recipe-${d.id}`;
      if (
        d &&
        d.id &&
        !existingDishIds.has(d.id) &&
        !deletedSet.has(expectedRecipeId) &&
        !deletedSet.has(`deleted-dish-recipe:${d.id}`)
      ) {
        hasExtra = true;
        break;
      }
    }

    let combined = this.state.recipes;
    if (hasExtra) {
      const extraRecipes: Recipe[] = [];
      this.state.dishes.forEach((d) => {
        const expectedRecipeId = d.recipeId || `recipe-${d.id}`;
        if (
          d &&
          d.id &&
          !existingDishIds.has(d.id) &&
          !deletedSet.has(expectedRecipeId) &&
          !deletedSet.has(`deleted-dish-recipe:${d.id}`)
        ) {
          extraRecipes.push(createRecipeFromDish(d));
        }
      });
      combined = [...extraRecipes, ...this.state.recipes];
    }

    if (!onlyPublished) return combined;
    return combined.filter(
      (r) => !r.publicationStatus || r.publicationStatus === 'published'
    );
  }

  public getArticles(onlyPublished = false): Article[] {
    if (!this.shouldYieldData()) return [];
    if (!onlyPublished) return this.state.articles;
    return this.state.articles.filter((a) => a.publicationStatus === 'published');
  }

  // --- ANNOUNCEMENTS CRUD (Sprint 02C-3) ---
  public getAnnouncements(onlyPublished = false): Announcement[] {
    if (!this.shouldYieldData()) return [];
    if (!onlyPublished) return this.state.announcements;
    return this.state.announcements.filter(
      (a) => !a.publicationStatus || a.publicationStatus === 'published'
    );
  }

  public getAnnouncementById(id: string): Announcement | undefined {
    return this.state.announcements.find((a) => a.id === id);
  }

  public saveAnnouncement(announcement: Announcement): boolean {
    return this.runTransaction(() => {
      this.unmarkDeleted([announcement.id]);
      const existingIndex = this.state.announcements.findIndex((a) => a.id === announcement.id);
      const isNew = existingIndex < 0;
      const toSave: Announcement = {
        ...announcement,
        updatedAt: new Date().toISOString(),
      };

      this.state.announcements = this.upsertAtIndex(this.state.announcements, existingIndex, toSave);

      this.logDemoActivity(
        isNew ? 'Yeni Duyuru Oluşturuldu' : 'Duyuru Güncellendi',
        'announcement',
        announcement.id,
        announcement.title,
        `Yayın Durumu: ${announcement.publicationStatus === 'published' ? 'Yayında' : announcement.publicationStatus}`
      );
    });
  }

  public deleteAnnouncement(id: string): boolean {
    return this.runTransaction(() => {
      const target = this.state.announcements.find((a) => a.id === id);
      this.state.announcements = this.state.announcements.filter((a) => a.id !== id);
      this.markDeleted([id]);

      // If selected as homepage featured, fallback gracefully
      if (this.state.homepageFeatured?.featuredAnnouncementId === id) {
        const fallback = this.state.announcements.find(
          (a) => !a.publicationStatus || a.publicationStatus === 'published'
        );
        this.state.homepageFeatured = {
          ...this.state.homepageFeatured,
          featuredAnnouncementId: fallback?.id || '',
        };
      }

      this.logDemoActivity(
        'Duyuru Silindi',
        'announcement',
        id,
        target?.title || id,
        'Kayıt duyurular envanterinden kaldırıldı.'
      );
    });
  }

  // --- EVENTS CRUD (Sprint 02C-3) ---
  public getEvents(onlyPublished = false): GastronomyEvent[] {
    if (!this.shouldYieldData()) return [];
    if (!onlyPublished) return this.state.events;
    return this.state.events.filter(
      (e) => (!e.publicationStatus || e.publicationStatus === 'published') && e.status !== 'cancelled'
    );
  }

  public getEventById(id: string): GastronomyEvent | undefined {
    return this.state.events.find((e) => e.id === id || e.slug === id);
  }

  public saveEvent(event: GastronomyEvent): boolean {
    return this.runTransaction(() => {
      this.unmarkDeleted([event.id, event.slug]);
      const existingIndex = this.state.events.findIndex(
        (e) => e.id === event.id || (e.slug && e.slug === event.slug)
      );
      const isNew = existingIndex < 0;
      const toSave: GastronomyEvent = {
        ...event,
        updatedAt: new Date().toISOString(),
      };

      this.state.events = this.upsertAtIndex(this.state.events, existingIndex, toSave);

      this.logDemoActivity(
        isNew ? 'Yeni Etkinlik Oluşturuldu' : 'Etkinlik Güncellendi',
        'event',
        event.id,
        event.title,
        `Tarih: ${event.startDate} | Yayın: ${event.publicationStatus || 'published'}`
      );
    });
  }

  public deleteEvent(id: string): boolean {
    return this.runTransaction(() => {
      const target = this.state.events.find((e) => e.id === id || e.slug === id);
      this.state.events = this.state.events.filter((e) => e.id !== id && e.slug !== id);
      this.markDeleted([id, target?.id || '', target?.slug || '']);

      // If selected as homepage featured, fallback gracefully
      if (this.state.homepageFeatured?.featuredEventId === id) {
        const fallback = this.state.events.find(
          (e) => (!e.publicationStatus || e.publicationStatus === 'published') && e.status !== 'cancelled'
        );
        this.state.homepageFeatured = {
          ...this.state.homepageFeatured,
          featuredEventId: fallback?.id || '',
        };
      }

      this.logDemoActivity(
        'Etkinlik Silindi',
        'event',
        id,
        target?.title || id,
        'Kayıt etkinlik takviminden kaldırıldı.'
      );
    });
  }

  // --- CATEGORY CATALOG CRUD & RESOLUTION ---

  private ensureCategories(): CategoryDefinition[] {
    if (!Array.isArray(this.state.categories) || this.state.categories.length === 0) {
      this.state.categories = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
    }
    return this.state.categories!;
  }

  private generateCategoryId(scope: CategoryScope, label: string): string {
    const base =
      label
        .toLocaleLowerCase('tr-TR')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'kategori';

    const existingIds = new Set(
      this.ensureCategories()
        .filter((c) => c.scope === scope)
        .map((c) => c.id)
    );
    if (!existingIds.has(base)) return base;
    let idx = 2;
    while (existingIds.has(`${base}_${idx}`)) idx++;
    return `${base}_${idx}`;
  }

  private applyCategoryAssignment(
    scope: CategoryScope,
    fromId: string,
    toId: string,
    toLabel: string
  ): void {
    switch (scope) {
      case 'dish':
        this.state.dishes = this.state.dishes.map((d) =>
          d.category === fromId
            ? { ...d, category: toId, categoryLabel: toLabel }
            : d
        );
        this.state.recipes = this.state.recipes.map((r) =>
          r.dishCategory === fromId ? { ...r, dishCategory: toId } : r
        );
        break;
      case 'place':
        this.state.places = this.state.places.map((p) =>
          p.category === fromId
            ? { ...p, category: toId, categoryLabel: toLabel }
            : p
        );
        break;
      case 'cultural_story':
        this.state.culturalStories = this.state.culturalStories.map((s) =>
          s.category === fromId
            ? { ...s, category: toId, categoryLabel: toLabel }
            : s
        );
        break;
      case 'artisan':
        this.state.artisans = this.state.artisans.map((a) =>
          a.craftCategory === fromId
            ? { ...a, craftCategory: toId, craftCategoryLabel: toLabel }
            : a
        );
        break;
      case 'article':
        this.state.articles = this.state.articles.map((a) =>
          a.category === fromId
            ? { ...a, category: toId, categoryLabel: toLabel }
            : a
        );
        break;
      case 'announcement':
        this.state.announcements = this.state.announcements.map((a) =>
          a.category === fromId
            ? { ...a, category: toId, categoryLabel: toLabel }
            : a
        );
        break;
      case 'event':
        this.state.events = this.state.events.map((e) =>
          e.eventType === fromId
            ? { ...e, eventType: toId, eventTypeLabel: toLabel }
            : e
        );
        break;
    }
  }

  public getCategories(scope?: CategoryScope, onlyActive = false): CategoryDefinition[] {
    const list = this.ensureCategories().filter((c) => {
      if (scope && c.scope !== scope) return false;
      if (onlyActive && !c.isActive) return false;
      return true;
    });
    return [...list].sort(
      (a, b) =>
        (a.order ?? 999) - (b.order ?? 999) ||
        a.label.localeCompare(b.label, 'tr-TR')
    );
  }

  public getCategoryLabel(
    scope: CategoryScope,
    categoryId: string,
    fallback = ''
  ): string {
    const found =
      this.ensureCategories().find(
        (c) => c.scope === scope && c.id === categoryId
      ) ||
      DEFAULT_CATEGORIES.find((c) => c.scope === scope && c.id === categoryId);
    return found?.label || fallback || categoryId;
  }

  public getCategoryUsageCount(scope: CategoryScope, categoryId: string): number {
    switch (scope) {
      case 'dish':
        return (
          this.state.dishes.filter((d) => d.category === categoryId).length +
          this.state.recipes.filter(
            (r) => !r.dishId && r.dishCategory === categoryId
          ).length
        );
      case 'place':
        return this.state.places.filter((p) => p.category === categoryId).length;
      case 'cultural_story':
        return this.state.culturalStories.filter((s) => s.category === categoryId).length;
      case 'artisan':
        return this.state.artisans.filter((a) => a.craftCategory === categoryId).length;
      case 'article':
        return this.state.articles.filter((a) => a.category === categoryId).length;
      case 'announcement':
        return this.state.announcements.filter((a) => a.category === categoryId).length;
      case 'event':
        return this.state.events.filter((e) => e.eventType === categoryId).length;
      default:
        return 0;
    }
  }

  public saveCategory(
    input: Partial<CategoryDefinition> & { scope: CategoryScope; label: string }
  ): { ok: boolean; category?: CategoryDefinition; error?: string } {
    const trimmedLabel = input.label.trim();
    if (!trimmedLabel) {
      return { ok: false, error: 'Kategori adı boş bırakılamaz.' };
    }

    const categories = this.ensureCategories();
    const existingIndex = input.id
      ? categories.findIndex((c) => c.scope === input.scope && c.id === input.id)
      : -1;
    const isNew = existingIndex < 0;
    const existing = existingIndex >= 0 ? categories[existingIndex] : undefined;

    let resolvedId = input.id?.trim();
    if (isNew) {
      resolvedId = resolvedId
        ? resolvedId
            .toLocaleLowerCase('tr-TR')
            .replace(/ğ/g, 'g')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ç/g, 'c')
            .replace(/[^a-z0-9_-]+/g, '_')
            .replace(/^_+|_+$/g, '')
        : this.generateCategoryId(input.scope, trimmedLabel);

      if (!resolvedId) {
        resolvedId = this.generateCategoryId(input.scope, trimmedLabel);
      }

      if (categories.some((c) => c.scope === input.scope && c.id === resolvedId)) {
        return {
          ok: false,
          error: `"${resolvedId}" kodu bu modülde zaten mevcut.`,
        };
      }
    } else if (existing) {
      resolvedId = existing.id;
    }

    const nowIso = new Date().toISOString();
    const scopeCount = categories.filter((c) => c.scope === input.scope).length;
    const savedCategory: CategoryDefinition = {
      id: resolvedId!,
      scope: input.scope,
      label: trimmedLabel,
      shortLabel: input.shortLabel !== undefined ? input.shortLabel.trim() || undefined : existing?.shortLabel,
      description: input.description !== undefined ? input.description.trim() || undefined : existing?.description,
      order: typeof input.order === 'number' && !isNaN(input.order) ? input.order : existing?.order ?? scopeCount + 1,
      isSystem: existing?.isSystem ?? Boolean(input.isSystem),
      isActive: input.isActive !== undefined ? input.isActive : existing?.isActive ?? true,
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    const ok = this.runTransaction(() => {
      this.state.categories = this.upsertAtIndex(
        this.ensureCategories(),
        existingIndex,
        savedCategory,
        true
      );

      // Keep existing content items' stored category labels synchronized on rename
      if (existing && existing.label !== savedCategory.label) {
        this.applyCategoryAssignment(
          savedCategory.scope,
          savedCategory.id,
          savedCategory.id,
          savedCategory.label
        );
      }

      const scopeTitle = CATEGORY_SCOPE_MAP[savedCategory.scope]?.shortTitle || savedCategory.scope;
      this.logDemoActivity(
        isNew ? 'Kategori Eklendi' : 'Kategori Güncellendi',
        'category',
        `${savedCategory.scope}:${savedCategory.id}`,
        `${savedCategory.label} (${scopeTitle})`,
        savedCategory.isActive ? 'Aktif katalog kategorisi' : 'Pasif durumda'
      );
    });

    if (!ok) {
      return { ok: false, error: 'Kategori tarayıcı deposuna kaydedilemedi.' };
    }

    return { ok: true, category: savedCategory };
  }

  public deleteCategory(
    scope: CategoryScope,
    categoryId: string,
    reassignToId?: string
  ): { ok: boolean; error?: string } {
    if (scope === 'dish' && categoryId === 'local_product') {
      return {
        ok: false,
        error:
          '"Yöresel Ürünler" kategorisi Coğrafi İşaret modülü tarafından doğrudan kullanıldığı için silinemez; adını düzenleyebilirsiniz.',
      };
    }

    const categories = this.ensureCategories();
    const target = categories.find((c) => c.scope === scope && c.id === categoryId);
    if (!target) {
      return { ok: false, error: 'Silinecek kategori bulunamadı.' };
    }

    const usageCount = this.getCategoryUsageCount(scope, categoryId);
    let reassignTarget: CategoryDefinition | undefined;
    if (usageCount > 0) {
      if (!reassignToId || reassignToId === categoryId) {
        return {
          ok: false,
          error: `Bu kategoride ${usageCount} kayıt bulunuyor. Silmeden önce kayıtların aktarılacağı hedef kategoriyi seçiniz veya kategoriyi pasife alınız.`,
        };
      }
      reassignTarget = categories.find((c) => c.scope === scope && c.id === reassignToId);
      if (!reassignTarget) {
        return { ok: false, error: 'Seçilen hedef kategori bulunamadı.' };
      }
    }

    const ok = this.runTransaction(() => {
      if (usageCount > 0 && reassignTarget) {
        this.applyCategoryAssignment(
          scope,
          categoryId,
          reassignTarget.id,
          reassignTarget.label
        );
      }

      this.state.categories = this.ensureCategories().filter(
        (c) => !(c.scope === scope && c.id === categoryId)
      );

      const scopeTitle = CATEGORY_SCOPE_MAP[scope]?.shortTitle || scope;
      this.logDemoActivity(
        'Kategori Silindi',
        'category',
        `${scope}:${categoryId}`,
        `${target.label} (${scopeTitle})`,
        reassignTarget
          ? `${usageCount} kayıt "${reassignTarget.label}" kategorisine aktarıldı.`
          : 'Kullanılmayan kategori katalogdan kaldırıldı.'
      );
    });

    if (!ok) {
      return { ok: false, error: 'Kategori silme işlemi kaydedilemedi.' };
    }

    return { ok: true };
  }

  // --- HOMEPAGE FEATURED SELECTION (Sprint 02C-3) ---
  public getHomepageFeatured(): HomepageFeaturedConfig {
    if (!this.state.homepageFeatured) {
      this.state.homepageFeatured = this.getDefaultHomepageFeatured();
    }
    return this.state.homepageFeatured;
  }

  public saveHomepageFeatured(config: Partial<HomepageFeaturedConfig>): boolean {
    return this.runTransaction(() => {
      this.state.homepageFeatured = {
        ...this.getHomepageFeatured(),
        ...config,
        updatedAt: new Date().toISOString(),
      };

      this.logDemoActivity(
        'Ana Sayfa Vitrini Güncellendi',
        'system',
        'homepage-featured',
        'Manşet ve Öne Çıkan İçerik Seçimi',
        'Ana sayfadaki başyazı, ikincil makaleler, duyuru ve etkinlik seçimleri güncellendi.'
      );
    });
  }

  // --- DEMO ACTIVITY LOG (Sprint 02C-3) ---
  public getDemoActivityLog(): DemoActivityLogItem[] {
    return this.state.demoActivityLog || [];
  }

  public logDemoActivity(
    action: string,
    contentType: string,
    contentId: string,
    contentTitle: string,
    details?: string
  ): void {
    if (!Array.isArray(this.state.demoActivityLog)) {
      this.state.demoActivityLog = [];
    }

    const now = new Date();
    const formattedTime = `${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;

    const logItem: DemoActivityLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      contentType,
      contentId,
      contentTitle,
      timestamp: now.toISOString(),
      formattedTime,
      details,
    };

    this.state.demoActivityLog = [logItem, ...this.state.demoActivityLog].slice(0, 100);
  }

  public clearDemoActivityLog(): boolean {
    return this.runTransaction(() => {
      this.state.demoActivityLog = this.getDefaultActivityLog();
    });
  }

  public getCulturalStories(onlyPublished = false): CulturalHeritageStory[] {
    if (!this.shouldYieldData()) return [];
    if (!onlyPublished) return this.state.culturalStories;
    return this.state.culturalStories.filter(
      (s) => !s.publicationStatus || s.publicationStatus === 'published'
    );
  }

  public getArtisans(onlyPublished = false): Artisan[] {
    if (!this.shouldYieldData()) return [];
    if (!onlyPublished) return this.state.artisans;
    return this.state.artisans.filter(
      (a) =>
        (!a.publicationStatus || a.publicationStatus === 'published') &&
        a.publicationPermissionGranted === true
    );
  }

  public getFilms(onlyPublished = false): GastronomyFilm[] {
    if (!this.shouldYieldData()) return [];
    if (!onlyPublished) return this.state.films;
    return this.state.films.filter(
      (f) => !f.publicationStatus || f.publicationStatus === 'published'
    );
  }

  public getMediaItems(): MediaItem[] {
    if (!this.shouldYieldData()) return [];
    return this.state.mediaItems;
  }

  // --- CULTURAL ATLAS NODES (Sprint 02C-2) ---

  public getAtlasNodes(onlyPublished = false): AtlasDishNode[] {
    if (!this.shouldYieldData()) return [];
    if (!onlyPublished) return this.state.atlasNodes;
    return this.state.atlasNodes.filter(
      (n) =>
        (!n.publicationStatus || n.publicationStatus === 'published') &&
        n.isVisible !== false
    );
  }

  public saveAtlasNode(node: AtlasDishNode): boolean {
    return this.runTransaction(() => {
      const canonicalDishId = normalizeDishId(node.dishId);
      const nodeId = normalizeAtlasNodeId(node.id || `node-${canonicalDishId}`);
      this.unmarkDeleted([nodeId, canonicalDishId]);
      const existingIndex = this.state.atlasNodes.findIndex(
        (n) => n.id === nodeId || n.dishId === canonicalDishId || n.dishId === node.dishId
      );

      const nodeWithDefaults: AtlasDishNode = {
        ...node,
        id: nodeId,
        dishId: canonicalDishId,
        isVisible: node.isVisible ?? true,
        publicationStatus: node.publicationStatus || 'published',
        updatedAt: new Date().toISOString(),
      };

      this.state.atlasNodes = this.upsertAtIndex(this.state.atlasNodes, existingIndex, nodeWithDefaults, true);
    });
  }

  public deleteAtlasNode(dishIdOrNodeId: string): boolean {
    return this.runTransaction(() => {
      const canonical = normalizeDishId(dishIdOrNodeId);
      const normalizedNode = normalizeAtlasNodeId(dishIdOrNodeId);
      const target = this.state.atlasNodes.find(
        (n) =>
          n.id === dishIdOrNodeId ||
          n.id === normalizedNode ||
          n.dishId === dishIdOrNodeId ||
          n.dishId === canonical
      );
      this.state.atlasNodes = this.state.atlasNodes.filter(
        (n) =>
          n.id !== dishIdOrNodeId &&
          n.id !== normalizedNode &&
          n.dishId !== dishIdOrNodeId &&
          n.dishId !== canonical
      );
      this.markDeleted([
        dishIdOrNodeId,
        normalizedNode,
        target?.id || '',
        `node-${canonical}`,
      ]);
    });
  }

  // --- PHYSICAL GASTONOMY PLACES (Sprint 02C-2) ---

  public getPlaces(onlyVerifiedPublished = false): GastronomyPlace[] {
    if (!this.shouldYieldData()) return [];
    if (!onlyVerifiedPublished) return this.state.places;
    // Visitor map criteria: published AND has valid coordinates (lat/lng)
    return this.state.places.filter(
      (p) =>
        (!p.publicationStatus || p.publicationStatus === 'published') &&
        p.coordinates !== null &&
        typeof p.coordinates?.lat === 'number' &&
        typeof p.coordinates?.lng === 'number'
    );
  }

  public savePlace(place: GastronomyPlace): boolean {
    let isNew = false;
    const normalizedPlace: GastronomyPlace = {
      ...place,
      relatedDishIds: place.relatedDishIds ? place.relatedDishIds.map(normalizeDishId) : place.relatedDishIds,
    };

    const success = this.runTransaction(() => {
      this.unmarkDeleted([normalizedPlace.id, `place-${normalizedPlace.id}`]);
      const existingIndex = this.state.places.findIndex((p) => p.id === normalizedPlace.id);
      isNew = existingIndex < 0;
      this.state.places = this.upsertAtIndex(this.state.places, existingIndex, { ...normalizedPlace });

      this.logDemoActivity(
        isNew ? 'Yeni Ziyaret Noktası Eklendi' : 'Ziyaret Noktası Güncellendi',
        'place',
        normalizedPlace.id,
        normalizedPlace.name,
        `${normalizedPlace.categoryLabel || normalizedPlace.category} — ${normalizedPlace.districtOrNeighborhood || 'İslahiye'}`
      );
    });

    if (success) {
      gastronomyApiClient.isOnline().then((online) => {
        if (online) {
          if (isNew) {
            gastronomyApiClient.createPlace(normalizedPlace).catch((e) => console.warn('[ContentStore] createPlace API sync failed:', e));
          } else {
            gastronomyApiClient.updatePlace(normalizedPlace.id, normalizedPlace).catch((e) => console.warn('[ContentStore] updatePlace API sync failed:', e));
          }
        }
      });
    }

    return success;
  }

  public deletePlace(placeId: string): boolean {
    const success = this.runTransaction(() => {
      const deleted = this.state.places.find((p) => p.id === placeId);
      this.state.places = this.state.places.filter((p) => p.id !== placeId);
      this.markDeleted([placeId, `place-${placeId}`]);
      if (deleted) {
        this.logDemoActivity(
          'Ziyaret Noktası Silindi',
          'place',
          deleted.id,
          deleted.name,
          'Kayıt silindi.'
        );
      }
    });

    if (success) {
      gastronomyApiClient.isOnline().then((online) => {
        if (online) {
          gastronomyApiClient.deletePlace(placeId).catch((e) => console.warn('[ContentStore] deletePlace API sync failed:', e));
        }
      });
    }

    return success;
  }

  // --- DISH CRUD ---

  public saveDish(dish: Dish): boolean {
    const canonicalDishId = normalizeDishId(dish.id);
    const dishToSave: Dish = {
      ...dish,
      id: canonicalDishId,
      recipeId: dish.recipeId ? normalizeRecipeId(dish.recipeId) : dish.recipeId,
    };
    let isNew = false;

    const success = this.runTransaction(() => {
      this.unmarkDeleted([
        canonicalDishId,
        dishToSave.recipeId || `recipe-${canonicalDishId}`,
        `deleted-dish-recipe:${canonicalDishId}`,
      ]);

      const existingIndex = this.state.dishes.findIndex((d) => d.id === canonicalDishId);
      isNew = existingIndex < 0;
      this.state.dishes = this.upsertAtIndex(this.state.dishes, existingIndex, { ...dishToSave });

      // Keep recipes synchronized with dishes
      const existingRecipeIndex = this.state.recipes.findIndex(
        (r) => r.id === dishToSave.recipeId || r.dishId === canonicalDishId
      );
      if (existingRecipeIndex >= 0) {
        const existing = this.state.recipes[existingRecipeIndex];
        const updatedRecipeItem: Recipe = {
          ...existing,
          dishCategory: dishToSave.category,
          title: dishToSave.name || existing.title,
          subtitle: dishToSave.tagline || existing.subtitle,
          imageUrl: dishToSave.imageUrl || existing.imageUrl,
          imageAlt: dishToSave.imageAlt || existing.imageAlt,
          prepTime: dishToSave.prepTime || existing.prepTime,
          cookTime: dishToSave.cookTime || existing.cookTime,
          difficulty: dishToSave.difficulty || existing.difficulty,
          publicationStatus: (dishToSave as any).publicationStatus || existing.publicationStatus,
        };
        this.state.recipes = this.upsertAtIndex(this.state.recipes, existingRecipeIndex, updatedRecipeItem);
        dishToSave.recipeId = existing.id;
      } else {
        const generatedRecipe = createRecipeFromDish(dishToSave);
        dishToSave.recipeId = generatedRecipe.id;
        this.state.recipes = [generatedRecipe, ...this.state.recipes];
      }

      this.logDemoActivity(
        isNew ? 'Yeni Yemek Eklendi' : 'Yemek Güncellendi',
        'dish',
        dishToSave.id,
        dishToSave.name,
        `${dishToSave.categoryLabel || dishToSave.category}`
      );
    });

    if (success) {
      gastronomyApiClient.isOnline().then((online) => {
        if (online) {
          if (isNew) {
            gastronomyApiClient.createDish(dishToSave).catch((e) => console.warn('[ContentStore] createDish API sync failed:', e));
          } else {
            gastronomyApiClient.updateDish(dishToSave.id, dishToSave).catch((e) => console.warn('[ContentStore] updateDish API sync failed:', e));
          }
        }
      });
    }

    return success;
  }

  public deleteDish(dishId: string): boolean {
    const canonicalDishId = normalizeDishId(dishId);
    const targetDish = this.state.dishes.find((d) => d.id === dishId || d.id === canonicalDishId);
    const effectiveDishId = targetDish?.id || canonicalDishId;

    const success = this.runTransaction(() => {
      const linkedRecipeIds = [
        targetDish?.recipeId || '',
        `recipe-${effectiveDishId}`,
      ].filter(Boolean);

      this.state.dishes = this.state.dishes.filter((d) => d.id !== effectiveDishId && d.id !== dishId);
      this.state.recipes = this.state.recipes.filter(
        (r) =>
          r.dishId !== effectiveDishId &&
          r.dishId !== dishId &&
          !linkedRecipeIds.includes(r.id)
      );
      this.state.atlasNodes = this.state.atlasNodes.filter(
        (n) => n.dishId !== effectiveDishId && n.dishId !== dishId
      );
      this.markDeleted([
        dishId,
        effectiveDishId,
        ...linkedRecipeIds,
        `node-${effectiveDishId}`,
        `deleted-dish-recipe:${effectiveDishId}`,
      ]);

      if (targetDish) {
        this.logDemoActivity(
          'Yemek Silindi',
          'dish',
          effectiveDishId,
          targetDish.name,
          'Kayıt ve ilişkili düğümler envanterden kaldırıldı.'
        );
      }
    });

    if (success) {
      gastronomyApiClient.isOnline().then((online) => {
        if (online) {
          gastronomyApiClient.deleteDish(effectiveDishId).catch((e) => console.warn('[ContentStore] deleteDish API sync failed:', e));
        }
      });
    }

    return success;
  }

  // --- RECIPE CRUD ---

  public saveRecipe(recipe: Recipe): boolean {
    return this.runTransaction(() => {
      const canonicalDishId = recipe.dishId ? normalizeDishId(recipe.dishId) : '';
      const canonicalRecipeId = normalizeRecipeId(recipe.id);
      const recipeToSave: Recipe = {
        ...recipe,
        id: canonicalRecipeId,
        dishId: canonicalDishId,
      };

      const resolvedCat = recipeToSave.dishCategory || 'main';
      const resolvedCatLabel = this.getCategoryLabel('dish', resolvedCat, 'Ana Yemekler');

      this.unmarkDeleted([
        canonicalRecipeId,
        canonicalDishId ? `deleted-dish-recipe:${canonicalDishId}` : '',
      ]);

      const existingIndex = this.state.recipes.findIndex((r) => r.id === canonicalRecipeId);
      const isNew = existingIndex < 0;
      this.state.recipes = this.upsertAtIndex(this.state.recipes, existingIndex, { ...recipeToSave });

      if (canonicalDishId) {
        const dishIndex = this.state.dishes.findIndex((d) => d.id === canonicalDishId);

        if (dishIndex >= 0) {
          const currentDish = this.state.dishes[dishIndex];
          const isStandaloneDish =
            canonicalDishId.startsWith('dish-') && currentDish.recipeId === canonicalRecipeId;
          const updatedDish: Dish = isStandaloneDish
            ? {
                ...currentDish,
                name: recipeToSave.title,
                category: recipeToSave.dishCategory || currentDish.category,
                categoryLabel: recipeToSave.dishCategory
                  ? resolvedCatLabel
                  : currentDish.categoryLabel,
                tagline: recipeToSave.subtitle || recipeToSave.title,
                description: recipeToSave.notes || currentDish.description || recipeToSave.title,
                prepTime: recipeToSave.prepTime,
                cookTime: recipeToSave.cookTime,
                difficulty: recipeToSave.difficulty,
                servings: `${recipeToSave.baseServings} Kişilik`,
                imageUrl: recipeToSave.imageUrl,
                imageAlt: recipeToSave.imageAlt || recipeToSave.title,
                recipeId: canonicalRecipeId,
                publicationStatus: recipeToSave.publicationStatus || currentDish.publicationStatus,
              }
            : {
                ...currentDish,
                recipeId: canonicalRecipeId,
              };
          this.state.dishes = this.upsertAtIndex(this.state.dishes, dishIndex, updatedDish);
        } else {
          const newDish: Dish = {
            id: canonicalDishId,
            name: recipeToSave.title,
            category: resolvedCat,
            categoryLabel: resolvedCatLabel,
            tagline: recipeToSave.subtitle || recipeToSave.title,
            description: recipeToSave.notes || recipeToSave.title,
            originNote: 'İslahiye Mutfak Envanteri',
            isRegisteredGeographicalIndication: false,
            prepTime: recipeToSave.prepTime,
            cookTime: recipeToSave.cookTime,
            difficulty: recipeToSave.difficulty,
            servings: `${recipeToSave.baseServings} Kişilik`,
            imageUrl: recipeToSave.imageUrl,
            imageAlt: recipeToSave.imageAlt || recipeToSave.title,
            imageCredit: 'İslahiye Lezzet Atlası',
            recipeId: canonicalRecipeId,
            ingredients: recipeToSave.ingredients.map((i) => ({
              name: i.name,
              amount: i.fallbackDisplay || `${i.baseAmount || ''} ${i.unit || ''}`.trim(),
            })),
            steps: recipeToSave.steps.map((s) => ({
              stepNumber: s.stepNumber,
              instruction: s.instruction,
              tip: s.tip,
            })),
            publicationStatus: recipeToSave.publicationStatus || 'published',
            verificationStatus: 'verified',
          };
          this.state.dishes = [newDish, ...this.state.dishes];
        }
      }

      this.logDemoActivity(
        isNew ? 'Yeni Tarif Oluşturuldu' : 'Tarif Güncellendi',
        'recipe',
        recipeToSave.id,
        recipeToSave.title,
        `${recipeToSave.prepTime} + ${recipeToSave.cookTime} • ${recipeToSave.publicationStatus || 'published'}`
      );
    });
  }

  public deleteRecipe(recipeId: string): boolean {
    return this.runTransaction(() => {
      const canonicalRecipeId = normalizeRecipeId(recipeId);
      const target = this.state.recipes.find((r) => r.id === recipeId || r.id === canonicalRecipeId);
      this.state.recipes = this.state.recipes.filter(
        (r) => r.id !== recipeId && r.id !== canonicalRecipeId
      );
      this.state.dishes = this.state.dishes.map((d) =>
        d.recipeId === recipeId || d.recipeId === canonicalRecipeId ? { ...d, recipeId: undefined } : d
      );
      this.markDeleted([
        recipeId,
        canonicalRecipeId,
        target?.dishId ? `deleted-dish-recipe:${normalizeDishId(target.dishId)}` : '',
      ]);

      if (target) {
        this.logDemoActivity(
          'Tarif Silindi',
          'recipe',
          target.id,
          target.title,
          'Kayıt tarif envanterinden kaldırıldı.'
        );
      }
    });
  }

  // --- ARTICLE CRUD ---

  public saveArticle(article: Article): boolean {
    return this.runTransaction(() => {
      this.unmarkDeleted([article.id, article.slug]);
      const existingIndex = this.state.articles.findIndex((a) => a.id === article.id);
      const isNew = existingIndex < 0;
      this.state.articles = this.upsertAtIndex(this.state.articles, existingIndex, { ...article });

      this.logDemoActivity(
        isNew ? 'Yeni Haber/Yazı Eklendi' : 'Haber/Yazı Güncellendi',
        article.contentType === 'news' ? 'news' : 'editorial_article',
        article.id,
        article.title,
        `${article.categoryLabel || article.category} — ${article.formattedDate || article.publishedAt || '2026'}`
      );
    });
  }

  public deleteArticle(articleId: string): boolean {
    return this.runTransaction(() => {
      const target = this.state.articles.find((a) => a.id === articleId);
      this.state.articles = this.state.articles.filter((a) => a.id !== articleId);
      this.markDeleted([articleId]);

      if (this.state.homepageFeatured) {
        const nextFeatured = { ...this.state.homepageFeatured };
        let featuredChanged = false;
        if (nextFeatured.leadArticleId === articleId) {
          const fallbackLead = this.state.articles.find((a) => a.publicationStatus === 'published');
          nextFeatured.leadArticleId = fallbackLead?.id || '';
          featuredChanged = true;
        }
        if (Array.isArray(nextFeatured.secondaryArticleIds)) {
          const filteredSec = nextFeatured.secondaryArticleIds.filter((id) => id !== articleId);
          if (filteredSec.length !== nextFeatured.secondaryArticleIds.length) {
            nextFeatured.secondaryArticleIds = filteredSec;
            featuredChanged = true;
          }
        }
        if (featuredChanged) {
          this.state.homepageFeatured = nextFeatured;
        }
      }

      if (target) {
        this.logDemoActivity(
          'Haber/Yazı Silindi',
          target.contentType === 'news' ? 'news' : 'editorial_article',
          target.id,
          target.title,
          'Kayıt arşivden kaldırıldı.'
        );
      }
    });
  }

  // --- CULTURAL STORIES CRUD ---

  public saveCulturalStory(story: CulturalHeritageStory): boolean {
    const storyId = story.id || story.slug || `story-${Date.now()}`;
    const slug = story.slug || storyId;
    const storyToSave: CulturalHeritageStory = {
      ...story,
      id: storyId,
      slug,
      relatedDishIds: story.relatedDishIds ? story.relatedDishIds.map(normalizeDishId) : story.relatedDishIds,
      publicationStatus: story.publicationStatus || 'published',
      verificationStatus: story.verificationStatus || 'verified',
    };
    let isNew = false;

    const success = this.runTransaction(() => {
      this.unmarkDeleted([storyId, `story-${storyId}`, slug]);
      const existingIndex = this.state.culturalStories.findIndex(
        (s) => s.id === storyId || s.slug === slug
      );
      isNew = existingIndex < 0;
      this.state.culturalStories = this.upsertAtIndex(this.state.culturalStories, existingIndex, {
        ...storyToSave,
      });

      this.logDemoActivity(
        isNew ? 'Yeni Kültürel Miras Anlatısı Eklendi' : 'Kültürel Miras Anlatısı Güncellendi',
        'cultural_story',
        storyToSave.id,
        storyToSave.title,
        `${storyToSave.categoryLabel || storyToSave.category} — ${storyToSave.publishedDate || '15 Ekim 2026'}`
      );
    });

    if (success) {
      gastronomyApiClient.isOnline().then((online) => {
        if (online) {
          if (isNew) {
            gastronomyApiClient.createStory(storyToSave).catch((e) => console.warn('[ContentStore] createStory API sync failed:', e));
          } else {
            gastronomyApiClient.updateStory(storyToSave.id, storyToSave).catch((e) => console.warn('[ContentStore] updateStory API sync failed:', e));
          }
        }
      });
    }

    return success;
  }

  public deleteCulturalStory(storyId: string): boolean {
    const success = this.runTransaction(() => {
      const deleted = this.state.culturalStories.find((s) => s.id === storyId || s.slug === storyId);
      this.state.culturalStories = this.state.culturalStories.filter(
        (s) => s.id !== storyId && s.slug !== storyId
      );
      this.markDeleted([
        storyId,
        `story-${storyId}`,
        deleted?.id || '',
        deleted?.slug || '',
        deleted?.id ? `story-${deleted.id}` : '',
      ]);

      if (deleted) {
        this.logDemoActivity(
          'Kültürel Miras Anlatısı Silindi',
          'cultural_story',
          deleted.id,
          deleted.title,
          'Kayıt mutfak mirası arşivinden kaldırıldı.'
        );
      }
    });

    if (success) {
      gastronomyApiClient.isOnline().then((online) => {
        if (online) {
          gastronomyApiClient.deleteStory(storyId).catch((e) => console.warn('[ContentStore] deleteStory API sync failed:', e));
        }
      });
    }

    return success;
  }

  // --- ARTISANS CRUD ---

  public saveArtisan(artisan: Artisan): boolean {
    return this.runTransaction(() => {
      this.unmarkDeleted([artisan.id]);
      const existingIndex = this.state.artisans.findIndex((a) => a.id === artisan.id);
      const isNew = existingIndex < 0;
      this.state.artisans = this.upsertAtIndex(this.state.artisans, existingIndex, { ...artisan });

      this.logDemoActivity(
        isNew ? 'Yeni Usta/Üretici Eklendi' : 'Usta/Üretici Güncellendi',
        'artisan',
        artisan.id,
        artisan.name,
        `${artisan.title} — ${artisan.businessName || artisan.villageOrNeighborhood || 'İslahiye'}`
      );
    });
  }

  public deleteArtisan(artisanId: string): boolean {
    return this.runTransaction(() => {
      const target = this.state.artisans.find((a) => a.id === artisanId);
      this.state.artisans = this.state.artisans.filter((a) => a.id !== artisanId);
      this.markDeleted([artisanId]);

      if (target) {
        this.logDemoActivity(
          'Usta/Üretici Silindi',
          'artisan',
          target.id,
          target.name,
          'Kayıt usta arşivinden kaldırıldı.'
        );
      }
    });
  }

  // --- FILMS CRUD ---

  public saveFilm(film: GastronomyFilm): boolean {
    return this.runTransaction(() => {
      this.unmarkDeleted([film.id]);
      const existingIndex = this.state.films.findIndex((f) => f.id === film.id);
      const isNew = existingIndex < 0;
      this.state.films = this.upsertAtIndex(this.state.films, existingIndex, { ...film });

      this.logDemoActivity(
        isNew ? 'Yeni Film/Video Eklendi' : 'Film/Video Güncellendi',
        'film',
        film.id,
        film.title,
        `${film.theme || 'Gastronomi'} — ${film.duration || '0:05'}`
      );
    });
  }

  public deleteFilm(filmId: string): boolean {
    return this.runTransaction(() => {
      const target = this.state.films.find((f) => f.id === filmId);
      this.state.films = this.state.films.filter((f) => f.id !== filmId);
      this.markDeleted([filmId]);

      if (target) {
        this.logDemoActivity(
          'Film/Video Silindi',
          'film',
          target.id,
          target.title,
          'Kayıt görsel-işitsel arşivden kaldırıldı.'
        );
      }
    });
  }

  // --- MEDIA ITEMS CRUD ---

  public saveMediaItem(item: MediaItem): boolean {
    return this.runTransaction(() => {
      this.unmarkDeleted([item.id]);
      const existingIndex = this.state.mediaItems.findIndex((m) => m.id === item.id);
      const nextMedia: MediaItem =
        existingIndex >= 0
          ? { ...item, updatedAt: new Date().toISOString() }
          : {
              ...item,
              createdAt: item.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
      this.state.mediaItems = this.upsertAtIndex(this.state.mediaItems, existingIndex, nextMedia);
    });
  }

  public deleteMediaItem(itemId: string): boolean {
    return this.runTransaction(() => {
      this.state.mediaItems = this.state.mediaItems.filter((m) => m.id !== itemId);
      this.markDeleted([itemId]);
    });
  }

  // --- GENERIC STATUS UPDATE ---

  public updateStatus(
    arg1: string,
    arg2: string,
    arg3?: string
  ): boolean {
    const id = arg1;
    const contentTypeHint = arg3 !== undefined ? arg2 : undefined;
    const newStatus = arg3 !== undefined ? arg3 : arg2;
    const shouldCheck = (type: string) => !contentTypeHint || contentTypeHint === type;
    let matched = false;

    const success = this.runTransaction(() => {
      const nowIso = new Date().toISOString();
      type CmsArrayKeys =
        | 'dishes'
        | 'recipes'
        | 'articles'
        | 'announcements'
        | 'events'
        | 'culturalStories'
        | 'artisans'
        | 'films'
        | 'mediaItems'
        | 'atlasNodes'
        | 'places';
      const patchEntity = <K extends CmsArrayKeys>(
        listKey: K,
        predicate: (item: CmsStoreState[K][number]) => boolean,
        actionLabel: string,
        logType: string | ((item: CmsStoreState[K][number]) => string),
        getTitle: (item: CmsStoreState[K][number]) => string,
        getId?: (item: CmsStoreState[K][number]) => string,
        extraFields?: Record<string, any>
      ): boolean => {
        type ItemT = CmsStoreState[K][number];
        const list = this.state[listKey] as ItemT[];
        const idx = list.findIndex(predicate);
        if (idx < 0) return false;
        const current = list[idx] as ItemT & { id?: string };
        const updated = {
          ...current,
          publicationStatus: newStatus as any,
          ...extraFields,
        } as ItemT & { id?: string };
        this.state[listKey] = this.upsertAtIndex(list, idx, updated) as CmsStoreState[K];
        this.logDemoActivity(
          actionLabel,
          typeof logType === 'function' ? logType(updated) : logType,
          getId ? getId(updated) : updated.id || id,
          getTitle(updated),
          `Yeni yayın durumu: ${newStatus}`
        );
        matched = true;
        return true;
      };

      if (
        shouldCheck('announcement') &&
        patchEntity('announcements', (a) => a.id === id, 'Duyuru Durumu Değiştirildi', 'announcement', (a) => a.title, undefined, {
          updatedAt: nowIso,
        })
      ) {
        return;
      }

      if (
        shouldCheck('event') &&
        patchEntity(
          'events',
          (e) => e.id === id || e.slug === id,
          'Etkinlik Durumu Değiştirildi',
          'event',
          (e) => e.title,
          undefined,
          newStatus === 'archived' ? { updatedAt: nowIso, status: 'completed' } : { updatedAt: nowIso }
        )
      ) {
        return;
      }

      if (
        shouldCheck('place') &&
        patchEntity('places', (p) => p.id === id, 'Ziyaret Noktası Durumu Değiştirildi', 'place', (p) => p.name)
      ) {
        return;
      }

      if (shouldCheck('atlas_node')) {
        const normalizedNode = normalizeAtlasNodeId(id);
        if (
          patchEntity(
            'atlasNodes',
            (n) =>
              n.id === id ||
              n.id === normalizedNode ||
              `atlas-${n.dishId}` === id ||
              n.dishId === id,
            'Atlas Düğümü Durumu Değiştirildi',
            'atlas_node',
            (n) => n.dishId,
            (n) => n.id || n.dishId,
            { updatedAt: nowIso }
          )
        ) {
          return;
        }
      }

      if (
        (shouldCheck('news') || shouldCheck('editorial_article')) &&
        patchEntity(
          'articles',
          (a) => a.id === id,
          'Haber/Makale Durumu Değiştirildi',
          (a) => (a.contentType === 'news' ? 'news' : 'editorial_article'),
          (a) => a.title
        )
      ) {
        return;
      }

      if (
        shouldCheck('cultural_story') &&
        patchEntity(
          'culturalStories',
          (s) => s.id === id || s.slug === id,
          'Kültürel Miras Durumu Değiştirildi',
          'cultural_story',
          (s) => s.title
        )
      ) {
        return;
      }

      if (
        shouldCheck('artisan') &&
        patchEntity('artisans', (a) => a.id === id, 'Usta/Üretici Durumu Değiştirildi', 'artisan', (a) => a.name)
      ) {
        return;
      }

      if (shouldCheck('dish')) {
        const canonical = normalizeDishId(id);
        if (
          patchEntity('dishes', (d) => d.id === id || d.id === canonical, 'Yemek Durumu Değiştirildi', 'dish', (d) => d.name)
        ) {
          return;
        }
      }

      if (shouldCheck('recipe')) {
        const canonical = normalizeRecipeId(id);
        if (
          patchEntity('recipes', (r) => r.id === id || r.id === canonical, 'Tarif Durumu Değiştirildi', 'recipe', (r) => r.title)
        ) {
          return;
        }
      }

      if (
        shouldCheck('film') &&
        patchEntity('films', (f) => f.id === id, 'Film/Video Durumu Değiştirildi', 'film', (f) => f.title, undefined, {
          status: newStatus as any,
        })
      ) {
        return;
      }

      if (shouldCheck('media')) {
        patchEntity('mediaItems', (m) => m.id === id, 'Medya Durumu Değiştirildi', 'media', (m) => m.title, undefined, {
          updatedAt: nowIso,
        });
      }
    });

    return matched && success;
  }

  // --- RESET TO PRISTINE SEEDS ---

  public resetToSeeds(): boolean {
    this.state = this.getDefaultState();
    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  public getLastUpdated(): string {
    return this.state.lastUpdated;
  }
}

export const contentStore = new ContentStoreManager();
