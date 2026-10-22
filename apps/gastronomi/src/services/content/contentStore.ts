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
} from '../../types';
import { FEATURED_DISHES } from '../../data/dishes';
import { RECIPES } from '../../data/recipes';
import { ARTICLES } from '../../data/news';
import { ANNOUNCEMENTS } from '../../data/announcements';
import { GASTRONOMY_EVENTS } from '../../data/events';
import { CULTURAL_STORIES } from '../../data/culturalStories';
import { ARTISANS } from '../../data/artisans';
import { CONCEPT_CLIPS, DOCUMENTARY_SERIES } from '../../data/films';
import { INITIAL_MEDIA_ITEMS } from '../../data/mediaCatalog';
import { ATLAS_DISH_NODES } from '../../data/atlas';
import { VERIFIED_PLACES } from '../../data/places';

/**
 * Versioned Local Storage Store for Gastronomi CMS & Visitor Sync (Sprint 02C-3)
 */
const STORAGE_KEY_V5 = 'islahiye_cms_store_v5';
const STORAGE_KEY_V4 = 'islahiye_cms_store_v4';
const STORAGE_KEY_V3 = 'islahiye_cms_store_v3';
const STORAGE_KEY_V2 = 'islahiye_cms_store_v2';
const STORAGE_VERSION = 5;

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
  homepageFeatured: HomepageFeaturedConfig;
  demoActivityLog: DemoActivityLogItem[];
  lastUpdated: string;
}

type StoreListener = () => void;

class ContentStoreManager {
  private state: CmsStoreState;
  private listeners: Set<StoreListener> = new Set();

  constructor() {
    this.state = this.loadFromStorage();

    // Listen for storage events across browser tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY_V5 || event.key === STORAGE_KEY_V4) {
          this.state = this.loadFromStorage();
          this.notify();
        }
      });
    }
  }

  private getDefaultHomepageFeatured(): HomepageFeaturedConfig {
    return {
      leadArticleId: ARTICLES[0]?.id || 'biber-hasadi-ve-ovada-guz-donemi',
      secondaryArticleIds: [
        ARTICLES[1]?.id || 'geleneksel-tas-firinlar-ve-ocaklik-kulturu',
        ARTICLES[2]?.id || 'firik-bugdayinin-tarihi-ve-mevsimsel-ritueli',
      ],
      featuredAnnouncementId: ANNOUNCEMENTS[0]?.id || 'ann-1',
      featuredEventId: GASTRONOMY_EVENTS[0]?.id || 'evt-1',
      updatedAt: new Date().toISOString(),
    };
  }

  private getDefaultActivityLog(): DemoActivityLogItem[] {
    return [
      {
        id: `log-seed-1`,
        action: 'Sistem Başlatıldı',
        contentType: 'system',
        contentId: 'init-v5',
        contentTitle: 'İslahiye Gastronomi CMS v5 Deposu Başlatıldı',
        timestamp: new Date().toISOString(),
        formattedTime: 'Şimdi',
        details: 'Duyuru, etkinlik, merkezi yayın ve ana sayfa vitrin yönetimi modülleri bağlandı.',
      },
    ];
  }

  /**
   * Initializes state from localStorage with seamless v2/v3/v4 -> v5 migration
   */
  private loadFromStorage(): CmsStoreState {
    if (typeof window === 'undefined') {
      return this.getDefaultState();
    }

    try {
      // 1. Try to load v5
      const rawV5 = localStorage.getItem(STORAGE_KEY_V5);
      if (rawV5) {
        const parsed: CmsStoreState = JSON.parse(rawV5);
        if (parsed && parsed.version === STORAGE_VERSION) {
          if (
            Array.isArray(parsed.dishes) &&
            Array.isArray(parsed.recipes) &&
            Array.isArray(parsed.articles) &&
            Array.isArray(parsed.announcements) &&
            Array.isArray(parsed.events) &&
            Array.isArray(parsed.culturalStories) &&
            Array.isArray(parsed.artisans) &&
            Array.isArray(parsed.films) &&
            Array.isArray(parsed.mediaItems) &&
            Array.isArray(parsed.atlasNodes) &&
            Array.isArray(parsed.places)
          ) {
            if (!Array.isArray(parsed.places) || parsed.places.length === 0) {
              parsed.places = JSON.parse(JSON.stringify(VERIFIED_PLACES));
            }
            if (!parsed.homepageFeatured) {
              parsed.homepageFeatured = this.getDefaultHomepageFeatured();
            }
            if (!Array.isArray(parsed.demoActivityLog)) {
              parsed.demoActivityLog = this.getDefaultActivityLog();
            }
            return parsed;
          }
        }
      }

      // 2. Try non-destructive migration from v4
      const rawV4 = localStorage.getItem(STORAGE_KEY_V4);
      if (rawV4) {
        try {
          const parsedV4 = JSON.parse(rawV4);
          if (parsedV4 && parsedV4.dishes) {
            const migratedState: CmsStoreState = {
              version: STORAGE_VERSION,
              dishes: parsedV4.dishes || JSON.parse(JSON.stringify(FEATURED_DISHES)),
              recipes: parsedV4.recipes || JSON.parse(JSON.stringify(RECIPES)),
              articles: parsedV4.articles || JSON.parse(JSON.stringify(ARTICLES)),
              announcements: parsedV4.announcements || JSON.parse(JSON.stringify(ANNOUNCEMENTS)),
              events: parsedV4.events || JSON.parse(JSON.stringify(GASTRONOMY_EVENTS)),
              culturalStories: parsedV4.culturalStories || JSON.parse(JSON.stringify(CULTURAL_STORIES)),
              artisans: parsedV4.artisans || JSON.parse(JSON.stringify(ARTISANS)),
              films: parsedV4.films || JSON.parse(JSON.stringify([...CONCEPT_CLIPS, ...DOCUMENTARY_SERIES])),
              mediaItems: parsedV4.mediaItems || JSON.parse(JSON.stringify(INITIAL_MEDIA_ITEMS)),
              atlasNodes: parsedV4.atlasNodes || this.getSeedAtlasNodes(),
              places: parsedV4.places || JSON.parse(JSON.stringify(VERIFIED_PLACES)),
              homepageFeatured: this.getDefaultHomepageFeatured(),
              demoActivityLog: this.getDefaultActivityLog(),
              lastUpdated: new Date().toISOString(),
            };
            this.saveToStorage(migratedState);
            return migratedState;
          }
        } catch (migrationErr) {
          console.warn('Migration from v4 failed, falling back:', migrationErr);
        }
      }

      // 3. Try non-destructive migration from v3
      const rawV3 = localStorage.getItem(STORAGE_KEY_V3);
      if (rawV3) {
        try {
          const parsedV3 = JSON.parse(rawV3);
          if (parsedV3 && parsedV3.dishes) {
            const migratedState: CmsStoreState = {
              version: STORAGE_VERSION,
              dishes: parsedV3.dishes || JSON.parse(JSON.stringify(FEATURED_DISHES)),
              recipes: parsedV3.recipes || JSON.parse(JSON.stringify(RECIPES)),
              articles: parsedV3.articles || JSON.parse(JSON.stringify(ARTICLES)),
              announcements: parsedV3.announcements || JSON.parse(JSON.stringify(ANNOUNCEMENTS)),
              events: parsedV3.events || JSON.parse(JSON.stringify(GASTRONOMY_EVENTS)),
              culturalStories: parsedV3.culturalStories || JSON.parse(JSON.stringify(CULTURAL_STORIES)),
              artisans: parsedV3.artisans || JSON.parse(JSON.stringify(ARTISANS)),
              films: parsedV3.films || JSON.parse(JSON.stringify([...CONCEPT_CLIPS, ...DOCUMENTARY_SERIES])),
              mediaItems: parsedV3.mediaItems || JSON.parse(JSON.stringify(INITIAL_MEDIA_ITEMS)),
              atlasNodes: this.getSeedAtlasNodes(),
              places: JSON.parse(JSON.stringify(VERIFIED_PLACES)),
              homepageFeatured: this.getDefaultHomepageFeatured(),
              demoActivityLog: this.getDefaultActivityLog(),
              lastUpdated: new Date().toISOString(),
            };
            this.saveToStorage(migratedState);
            return migratedState;
          }
        } catch (migrationErr) {
          console.warn('Migration from v3 failed, falling back:', migrationErr);
        }
      }

      // 4. Try fallback migration from v2
      const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
      if (rawV2) {
        try {
          const parsedV2 = JSON.parse(rawV2);
          if (parsedV2 && parsedV2.dishes) {
            const migratedState: CmsStoreState = {
              version: STORAGE_VERSION,
              dishes: parsedV2.dishes || JSON.parse(JSON.stringify(FEATURED_DISHES)),
              recipes: parsedV2.recipes || JSON.parse(JSON.stringify(RECIPES)),
              articles: parsedV2.articles || JSON.parse(JSON.stringify(ARTICLES)),
              announcements: parsedV2.announcements || JSON.parse(JSON.stringify(ANNOUNCEMENTS)),
              events: parsedV2.events || JSON.parse(JSON.stringify(GASTRONOMY_EVENTS)),
              culturalStories: JSON.parse(JSON.stringify(CULTURAL_STORIES)),
              artisans: JSON.parse(JSON.stringify(ARTISANS)),
              films: JSON.parse(JSON.stringify([...CONCEPT_CLIPS, ...DOCUMENTARY_SERIES])),
              mediaItems: JSON.parse(JSON.stringify(INITIAL_MEDIA_ITEMS)),
              atlasNodes: this.getSeedAtlasNodes(),
              places: JSON.parse(JSON.stringify(VERIFIED_PLACES)),
              homepageFeatured: this.getDefaultHomepageFeatured(),
              demoActivityLog: this.getDefaultActivityLog(),
              lastUpdated: new Date().toISOString(),
            };
            this.saveToStorage(migratedState);
            return migratedState;
          }
        } catch (mErr) {
          console.warn('Migration from v2 failed:', mErr);
        }
      }

      // 5. Fallback to pristine defaults
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
      contentOrigin: s.contentOrigin || 'field_research',
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
      homepageFeatured: this.getDefaultHomepageFeatured(),
      demoActivityLog: this.getDefaultActivityLog(),
      lastUpdated: new Date().toISOString(),
    };
  }

  private saveToStorage(state: CmsStoreState): boolean {
    if (typeof window === 'undefined') return false;
    try {
      state.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY_V5, JSON.stringify(state));
      return true;
    } catch (err) {
      console.error('LocalStorage write failed (quota exceeded or restricted):', err);
      alert('Tarayıcı yerel depolama alanı dolu veya kısıtlı. Değişiklik kaydedilemedi.');
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

  // --- GETTERS ---

  public getDishes(onlyPublished = false): Dish[] {
    if (!onlyPublished) return this.state.dishes;
    return this.state.dishes.filter(
      (d) => !('publicationStatus' in d) || (d as any).publicationStatus === 'published'
    );
  }

  public getRecipes(onlyPublished = false): Recipe[] {
    if (!onlyPublished) return this.state.recipes;
    return this.state.recipes.filter(
      (r) => !r.publicationStatus || r.publicationStatus === 'published'
    );
  }

  public getArticles(onlyPublished = false): Article[] {
    if (!onlyPublished) return this.state.articles;
    return this.state.articles.filter((a) => a.publicationStatus === 'published');
  }

  // --- ANNOUNCEMENTS CRUD (Sprint 02C-3) ---
  public getAnnouncements(onlyPublished = false): Announcement[] {
    if (!onlyPublished) return this.state.announcements;
    return this.state.announcements.filter(
      (a) => !a.publicationStatus || a.publicationStatus === 'published'
    );
  }

  public getAnnouncementById(id: string): Announcement | undefined {
    return this.state.announcements.find((a) => a.id === id);
  }

  public saveAnnouncement(announcement: Announcement): boolean {
    const existingIndex = this.state.announcements.findIndex((a) => a.id === announcement.id);
    const isNew = existingIndex < 0;
    const toSave: Announcement = {
      ...announcement,
      updatedAt: new Date().toISOString(),
    };

    if (isNew) {
      this.state.announcements.unshift(toSave);
    } else {
      this.state.announcements[existingIndex] = toSave;
    }

    this.logDemoActivity(
      isNew ? 'Yeni Duyuru Oluşturuldu' : 'Duyuru Güncellendi',
      'announcement',
      announcement.id,
      announcement.title,
      `Yayın Durumu: ${announcement.publicationStatus === 'published' ? 'Yayında' : announcement.publicationStatus}`
    );

    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  public deleteAnnouncement(id: string): boolean {
    const target = this.state.announcements.find((a) => a.id === id);
    this.state.announcements = this.state.announcements.filter((a) => a.id !== id);

    // If selected as homepage featured, fallback gracefully
    if (this.state.homepageFeatured?.featuredAnnouncementId === id) {
      const fallback = this.state.announcements.find(
        (a) => !a.publicationStatus || a.publicationStatus === 'published'
      );
      this.state.homepageFeatured.featuredAnnouncementId = fallback?.id || '';
    }

    this.logDemoActivity(
      'Duyuru Silindi',
      'announcement',
      id,
      target?.title || id,
      'Kayıt duyurular envanterinden kaldırıldı.'
    );

    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  // --- EVENTS CRUD (Sprint 02C-3) ---
  public getEvents(onlyPublished = false): GastronomyEvent[] {
    if (!onlyPublished) return this.state.events;
    return this.state.events.filter(
      (e) => (!e.publicationStatus || e.publicationStatus === 'published') && e.status !== 'cancelled'
    );
  }

  public getEventById(id: string): GastronomyEvent | undefined {
    return this.state.events.find((e) => e.id === id || e.slug === id);
  }

  public saveEvent(event: GastronomyEvent): boolean {
    const existingIndex = this.state.events.findIndex(
      (e) => e.id === event.id || (e.slug && e.slug === event.slug)
    );
    const isNew = existingIndex < 0;
    const toSave: GastronomyEvent = {
      ...event,
      updatedAt: new Date().toISOString(),
    };

    if (isNew) {
      this.state.events.unshift(toSave);
    } else {
      this.state.events[existingIndex] = toSave;
    }

    this.logDemoActivity(
      isNew ? 'Yeni Etkinlik Oluşturuldu' : 'Etkinlik Güncellendi',
      'event',
      event.id,
      event.title,
      `Tarih: ${event.startDate} | Yayın: ${event.publicationStatus || 'published'}`
    );

    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  public deleteEvent(id: string): boolean {
    const target = this.state.events.find((e) => e.id === id || e.slug === id);
    this.state.events = this.state.events.filter((e) => e.id !== id && e.slug !== id);

    // If selected as homepage featured, fallback gracefully
    if (this.state.homepageFeatured?.featuredEventId === id) {
      const fallback = this.state.events.find(
        (e) => (!e.publicationStatus || e.publicationStatus === 'published') && e.status !== 'cancelled'
      );
      this.state.homepageFeatured.featuredEventId = fallback?.id || '';
    }

    this.logDemoActivity(
      'Etkinlik Silindi',
      'event',
      id,
      target?.title || id,
      'Kayıt etkinlik takviminden kaldırıldı.'
    );

    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  // --- HOMEPAGE FEATURED SELECTION (Sprint 02C-3) ---
  public getHomepageFeatured(): HomepageFeaturedConfig {
    if (!this.state.homepageFeatured) {
      this.state.homepageFeatured = this.getDefaultHomepageFeatured();
    }
    return this.state.homepageFeatured;
  }

  public saveHomepageFeatured(config: Partial<HomepageFeaturedConfig>): boolean {
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

    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
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

    this.state.demoActivityLog.unshift(logItem);
    if (this.state.demoActivityLog.length > 100) {
      this.state.demoActivityLog = this.state.demoActivityLog.slice(0, 100);
    }
  }

  public clearDemoActivityLog(): boolean {
    this.state.demoActivityLog = this.getDefaultActivityLog();
    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  public getCulturalStories(onlyPublished = false): CulturalHeritageStory[] {
    if (!onlyPublished) return this.state.culturalStories;
    return this.state.culturalStories.filter(
      (s) => !s.publicationStatus || s.publicationStatus === 'published'
    );
  }

  public getArtisans(onlyPublished = false): Artisan[] {
    if (!onlyPublished) return this.state.artisans;
    return this.state.artisans.filter(
      (a) =>
        (!a.publicationStatus || a.publicationStatus === 'published') &&
        a.publicationPermissionGranted === true
    );
  }

  public getFilms(onlyPublished = false): GastronomyFilm[] {
    if (!onlyPublished) return this.state.films;
    return this.state.films.filter(
      (f) => !f.publicationStatus || f.publicationStatus === 'published'
    );
  }

  public getMediaItems(): MediaItem[] {
    return this.state.mediaItems;
  }

  // --- CULTURAL ATLAS NODES (Sprint 02C-2) ---

  public getAtlasNodes(onlyPublished = false): AtlasDishNode[] {
    if (!onlyPublished) return this.state.atlasNodes;
    return this.state.atlasNodes.filter(
      (n) =>
        (!n.publicationStatus || n.publicationStatus === 'published') &&
        n.isVisible !== false
    );
  }

  public saveAtlasNode(node: AtlasDishNode): boolean {
    const nodeId = node.id || `node-${node.dishId}`;
    const existingIndex = this.state.atlasNodes.findIndex(
      (n) => n.id === nodeId || n.dishId === node.dishId
    );

    const nodeWithDefaults: AtlasDishNode = {
      ...node,
      id: nodeId,
      isVisible: node.isVisible ?? true,
      publicationStatus: node.publicationStatus || 'published',
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      this.state.atlasNodes[existingIndex] = nodeWithDefaults;
    } else {
      this.state.atlasNodes.push(nodeWithDefaults);
    }

    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  public deleteAtlasNode(dishIdOrNodeId: string): boolean {
    this.state.atlasNodes = this.state.atlasNodes.filter(
      (n) => n.id !== dishIdOrNodeId && n.dishId !== dishIdOrNodeId
    );
    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  // --- PHYSICAL GASTONOMY PLACES (Sprint 02C-2) ---

  public getPlaces(onlyVerifiedPublished = false): GastronomyPlace[] {
    if (!onlyVerifiedPublished) return this.state.places;
    // Strict visitor map criteria: published AND verified AND not demo AND has real coordinates AND has verification source
    return this.state.places.filter(
      (p) =>
        (!p.publicationStatus || p.publicationStatus === 'published') &&
        p.verificationStatus === 'verified' &&
        !p.isDemo &&
        p.coordinates !== null &&
        Boolean(p.verificationSource)
    );
  }

  public savePlace(place: GastronomyPlace): boolean {
    const existingIndex = this.state.places.findIndex((p) => p.id === place.id);
    if (existingIndex >= 0) {
      this.state.places[existingIndex] = { ...place };
    } else {
      this.state.places.unshift({ ...place });
    }

    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  public deletePlace(placeId: string): boolean {
    this.state.places = this.state.places.filter((p) => p.id !== placeId);
    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  // --- DISH CRUD ---

  public saveDish(dish: Dish): boolean {
    const existingIndex = this.state.dishes.findIndex((d) => d.id === dish.id);
    if (existingIndex >= 0) {
      this.state.dishes[existingIndex] = { ...dish };
    } else {
      this.state.dishes.unshift({ ...dish });
    }

    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  public deleteDish(dishId: string): boolean {
    this.state.dishes = this.state.dishes.filter((d) => d.id !== dishId);
    this.state.recipes = this.state.recipes.map((r) =>
      r.dishId === dishId ? { ...r, dishId: '' } : r
    );
    // Also remove from atlas nodes
    this.state.atlasNodes = this.state.atlasNodes.filter((n) => n.dishId !== dishId);

    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  // --- RECIPE CRUD ---

  public saveRecipe(recipe: Recipe): boolean {
    const existingIndex = this.state.recipes.findIndex((r) => r.id === recipe.id);
    if (existingIndex >= 0) {
      this.state.recipes[existingIndex] = { ...recipe };
    } else {
      this.state.recipes.unshift({ ...recipe });
    }

    if (recipe.dishId) {
      const dishIndex = this.state.dishes.findIndex((d) => d.id === recipe.dishId);
      if (dishIndex >= 0) {
        this.state.dishes[dishIndex] = {
          ...this.state.dishes[dishIndex],
          recipeId: recipe.id,
        };
      }
    }

    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  public deleteRecipe(recipeId: string): boolean {
    this.state.recipes = this.state.recipes.filter((r) => r.id !== recipeId);
    this.state.dishes = this.state.dishes.map((d) =>
      d.recipeId === recipeId ? { ...d, recipeId: undefined } : d
    );

    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  // --- ARTICLE CRUD ---

  public saveArticle(article: Article): boolean {
    const existingIndex = this.state.articles.findIndex((a) => a.id === article.id);
    if (existingIndex >= 0) {
      this.state.articles[existingIndex] = { ...article };
    } else {
      this.state.articles.unshift({ ...article });
    }

    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  public deleteArticle(articleId: string): boolean {
    this.state.articles = this.state.articles.filter((a) => a.id !== articleId);
    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  // --- CULTURAL STORIES CRUD ---

  public saveCulturalStory(story: CulturalHeritageStory): boolean {
    const existingIndex = this.state.culturalStories.findIndex((s) => s.id === story.id);
    if (existingIndex >= 0) {
      this.state.culturalStories[existingIndex] = { ...story };
    } else {
      this.state.culturalStories.unshift({ ...story });
    }

    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  public deleteCulturalStory(storyId: string): boolean {
    this.state.culturalStories = this.state.culturalStories.filter((s) => s.id !== storyId);
    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  // --- ARTISANS CRUD ---

  public saveArtisan(artisan: Artisan): boolean {
    const existingIndex = this.state.artisans.findIndex((a) => a.id === artisan.id);
    if (existingIndex >= 0) {
      this.state.artisans[existingIndex] = { ...artisan };
    } else {
      this.state.artisans.unshift({ ...artisan });
    }

    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  public deleteArtisan(artisanId: string): boolean {
    this.state.artisans = this.state.artisans.filter((a) => a.id !== artisanId);
    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  // --- FILMS CRUD ---

  public saveFilm(film: GastronomyFilm): boolean {
    const existingIndex = this.state.films.findIndex((f) => f.id === film.id);
    if (existingIndex >= 0) {
      this.state.films[existingIndex] = { ...film };
    } else {
      this.state.films.unshift({ ...film });
    }

    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  // --- MEDIA ITEMS CRUD ---

  public saveMediaItem(item: MediaItem): boolean {
    const existingIndex = this.state.mediaItems.findIndex((m) => m.id === item.id);
    if (existingIndex >= 0) {
      this.state.mediaItems[existingIndex] = {
        ...item,
        updatedAt: new Date().toISOString(),
      };
    } else {
      this.state.mediaItems.unshift({
        ...item,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  public deleteMediaItem(itemId: string): boolean {
    this.state.mediaItems = this.state.mediaItems.filter((m) => m.id !== itemId);
    const success = this.saveToStorage(this.state);
    if (success) this.notify();
    return success;
  }

  // --- GENERIC STATUS UPDATE ---

  public updateStatus(
    arg1: string,
    arg2: string,
    arg3?: string
  ): boolean {
    const id = arg3 !== undefined ? arg2 : arg1;
    const newStatus = arg3 !== undefined ? arg3 : arg2;

    // 0a. Announcements
    const ann = this.state.announcements.find((a) => a.id === id);
    if (ann) {
      ann.publicationStatus = newStatus as any;
      ann.updatedAt = new Date().toISOString();
      this.logDemoActivity(
        'Duyuru Durumu Değiştirildi',
        'announcement',
        ann.id,
        ann.title,
        `Yeni yayın durumu: ${newStatus}`
      );
      const success = this.saveToStorage(this.state);
      if (success) this.notify();
      return success;
    }

    // 0b. Events
    const evt = this.state.events.find((e) => e.id === id || e.slug === id);
    if (evt) {
      evt.publicationStatus = newStatus as any;
      evt.updatedAt = new Date().toISOString();
      if (newStatus === 'archived') {
        evt.status = 'completed';
      }
      this.logDemoActivity(
        'Etkinlik Durumu Değiştirildi',
        'event',
        evt.id,
        evt.title,
        `Yeni yayın durumu: ${newStatus}`
      );
      const success = this.saveToStorage(this.state);
      if (success) this.notify();
      return success;
    }

    // 1. Places
    const place = this.state.places.find((p) => p.id === id);
    if (place) {
      place.publicationStatus = newStatus as any;
      this.logDemoActivity(
        'Ziyaret Noktası Durumu Değiştirildi',
        'place',
        place.id,
        place.name,
        `Yeni yayın durumu: ${newStatus}`
      );
      const success = this.saveToStorage(this.state);
      if (success) this.notify();
      return success;
    }

    // 2. Atlas Nodes
    const node = this.state.atlasNodes.find((n) => n.id === id || n.dishId === id);
    if (node) {
      node.publicationStatus = newStatus as any;
      node.updatedAt = new Date().toISOString();
      this.logDemoActivity(
        'Atlas Düğümü Durumu Değiştirildi',
        'atlas_node',
        node.id || node.dishId,
        node.dishId,
        `Yeni yayın durumu: ${newStatus}`
      );
      const success = this.saveToStorage(this.state);
      if (success) this.notify();
      return success;
    }

    // 3. Articles
    const art = this.state.articles.find((a) => a.id === id);
    if (art) {
      art.publicationStatus = newStatus as any;
      this.logDemoActivity(
        'Haber/Makale Durumu Değiştirildi',
        'news',
        art.id,
        art.title,
        `Yeni yayın durumu: ${newStatus}`
      );
      const success = this.saveToStorage(this.state);
      if (success) this.notify();
      return success;
    }

    // 4. Cultural Stories
    const story = this.state.culturalStories.find((s) => s.id === id);
    if (story) {
      story.publicationStatus = newStatus as any;
      this.logDemoActivity(
        'Kültürel Miras Durumu Değiştirildi',
        'editorial_article',
        story.id,
        story.title,
        `Yeni yayın durumu: ${newStatus}`
      );
      const success = this.saveToStorage(this.state);
      if (success) this.notify();
      return success;
    }

    // 5. Artisans
    const artisan = this.state.artisans.find((a) => a.id === id);
    if (artisan) {
      artisan.publicationStatus = newStatus as any;
      this.logDemoActivity(
        'Usta/Üretici Durumu Değiştirildi',
        'artisan',
        artisan.id,
        artisan.name,
        `Yeni yayın durumu: ${newStatus}`
      );
      const success = this.saveToStorage(this.state);
      if (success) this.notify();
      return success;
    }

    // 6. Dishes
    const dish = this.state.dishes.find((d) => d.id === id);
    if (dish) {
      dish.publicationStatus = newStatus as any;
      this.logDemoActivity(
        'Yemek Durumu Değiştirildi',
        'dish',
        dish.id,
        dish.name,
        `Yeni yayın durumu: ${newStatus}`
      );
      const success = this.saveToStorage(this.state);
      if (success) this.notify();
      return success;
    }

    // 7. Recipes
    const recipe = this.state.recipes.find((r) => r.id === id);
    if (recipe) {
      recipe.publicationStatus = newStatus as any;
      this.logDemoActivity(
        'Tarif Durumu Değiştirildi',
        'recipe',
        recipe.id,
        recipe.title,
        `Yeni yayın durumu: ${newStatus}`
      );
      const success = this.saveToStorage(this.state);
      if (success) this.notify();
      return success;
    }

    // 8. Films
    const film = this.state.films.find((f) => f.id === id);
    if (film) {
      film.publicationStatus = newStatus as any;
      film.status = newStatus as any;
      this.logDemoActivity(
        'Film/Video Durumu Değiştirildi',
        'film',
        film.id,
        film.title,
        `Yeni yayın durumu: ${newStatus}`
      );
      const success = this.saveToStorage(this.state);
      if (success) this.notify();
      return success;
    }

    // 9. Media Items
    const media = this.state.mediaItems.find((m) => m.id === id);
    if (media) {
      media.publicationStatus = newStatus as any;
      media.updatedAt = new Date().toISOString();
      this.logDemoActivity(
        'Medya Durumu Değiştirildi',
        'media',
        media.id,
        media.title,
        `Yeni yayın durumu: ${newStatus}`
      );
      const success = this.saveToStorage(this.state);
      if (success) this.notify();
      return success;
    }

    return false;
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
