import { CmsContentItem, CmsStats, CmsFilterState, CmsContentType } from '../../types/admin';
import { contentStore } from './contentStore';

/**
 * Unified Read-Only CMS Content Repository (Sprint 02C-1 - Dynamic Store Sync)
 *
 * Reads and normalizes all live datasets dynamically from contentStore.
 * Provides live computed stats, real filtering, and detail extraction without stale caching.
 */

export class ContentRepository {
  public static getAllItems(): CmsContentItem[] {
    const items: CmsContentItem[] = [];

    const dishes = contentStore.getDishes(false);
    const recipes = contentStore.getRecipes();
    const articles = contentStore.getArticles(false);
    const announcements = contentStore.getAnnouncements(false);
    const events = contentStore.getEvents(false);
    const culturalStories = contentStore.getCulturalStories(false);
    const artisans = contentStore.getArtisans(false);
    const films = contentStore.getFilms(false);

    // 1. Dishes
    dishes.forEach((dish) => {
      const pubStatus = (dish as any).publicationStatus || 'published';
      const verStatus = (dish as any).verificationStatus || 'verified';
      const isDemo = (dish as any).isDemo ?? false;

      items.push({
        id: dish.id,
        slug: dish.id,
        title: dish.name,
        subtitle: dish.categoryLabel || dish.category,
        summary: dish.description,
        contentType: 'dish',
        contentTypeLabel: 'Yöresel Lezzet',
        category: dish.category,
        categoryLabel: dish.categoryLabel || dish.category,
        coverImage: dish.imageUrl,
        publicationStatus: pubStatus,
        verificationStatus: verStatus,
        contentOrigin: (dish as any).contentOrigin || 'field_research',
        isDemo,
        publishedAt: (dish as any).publishedAt || '2026-10-01',
        formattedDate: (dish as any).formattedDate || '01 Ekim 2026',
        sourceUrl: (dish as any).sourceUrl,
        officialSource: dish.imageCredit || 'İslahiye Gastronomi Envanteri',
        authorOrProducer: 'İslahiye Mutfak Belleği',
        publicUrl: pubStatus === 'published' ? `/#lezzetler` : undefined,
        tags: [dish.category, 'Yöresel Lezzet'],
        metrics: {
          servings: dish.servings,
        },
      });
    });

    // 2. Recipes
    recipes.forEach((recipe) => {
      const associatedDish = dishes.find((d) => d.id === recipe.dishId);
      const categoryLabel = associatedDish ? associatedDish.categoryLabel : 'Tarif';
      const pubStatus = (recipe as any).publicationStatus || 'published';

      items.push({
        id: recipe.id,
        slug: recipe.id,
        title: recipe.title,
        subtitle: `${recipe.prepTime} hazırlık | ${recipe.cookTime} pişirme | ${recipe.difficulty}`,
        summary: `${recipe.title} geleneksel ocaklık yapım aşamaları ve ${recipe.baseServings} kişilik malzeme listesi.`,
        contentType: 'recipe',
        contentTypeLabel: 'Geleneksel Tarif',
        category: categoryLabel,
        categoryLabel: categoryLabel,
        coverImage: recipe.imageUrl,
        publicationStatus: pubStatus,
        verificationStatus: (recipe as any).verificationStatus || 'verified',
        contentOrigin: 'editorial_narrative',
        isDemo: (recipe as any).isDemo ?? false,
        publishedAt: (recipe as any).publishedAt || '2026-10-05',
        formattedDate: (recipe as any).formattedDate || '05 Ekim 2026',
        officialSource: 'İslahiye Tarif Atölyesi',
        authorOrProducer: 'Usta Ocaklık Anlatımı',
        publicUrl: pubStatus === 'published' ? `/#atolye` : undefined,
        tags: [categoryLabel, recipe.difficulty, 'Tarif Atölyesi'],
        metrics: {
          duration: `${recipe.prepTime} + ${recipe.cookTime}`,
          servings: recipe.baseServings,
          stepsCount: recipe.steps.length,
        },
      });
    });

    // 3. Films & Video Clips
    films.forEach((film) => {
      const isDoc = film.contentType === 'documentary_episode';
      const label = isDoc ? 'Belgesel Dizisi' : 'Atmosfer Klibi (5 sn)';
      const pubStatus = film.publicationStatus === 'published' ? 'published' : 'draft';

      items.push({
        id: film.id,
        slug: film.id,
        title: film.title,
        subtitle: film.subtitle,
        summary: film.description,
        contentType: 'film',
        contentTypeLabel: label,
        category: isDoc ? 'Belgesel' : 'Sinematik Medya',
        categoryLabel: isDoc ? 'Belgesel Arşivi' : 'Atmosfer Klibi',
        coverImage: film.posterSrc || film.coverImageUrl,
        publicationStatus: pubStatus,
        verificationStatus: isDoc ? 'unverified' : 'verified',
        contentOrigin: film.mediaOrigin === 'ai-generated' ? 'temsili_demo' : 'field_research',
        isDemo: !isDoc,
        publishedAt: isDoc ? '2026-12-01' : '2026-10-10',
        formattedDate: isDoc ? 'Planlama Aşaması' : '10 Ekim 2026',
        sourceUrl: film.sourceUrl,
        officialSource: film.credits,
        authorOrProducer: film.credits,
        publicUrl: `/#filmler`,
        tags: isDoc ? ['Belgesel', 'Bölüm ' + (film.episodeNumber || 1)] : ['Klip', 'Video', film.theme || 'Gastronomi'],
        metrics: {
          duration: film.duration || '0:05',
        },
      });
    });

    // 4. Cultural Heritage Stories
    culturalStories.forEach((story) => {
      const pubStatus = story.publicationStatus || 'published';
      items.push({
        id: story.id,
        slug: story.slug,
        title: story.title,
        subtitle: story.subtitle,
        summary: story.leadParagraph,
        contentType: 'editorial_article',
        contentTypeLabel: 'Kültürel Miras',
        category: story.category,
        categoryLabel: story.categoryLabel,
        coverImage: story.coverImageUrl,
        publicationStatus: pubStatus,
        verificationStatus: story.verificationStatus || 'verified',
        contentOrigin: story.contentOrigin || 'editorial_narrative',
        isDemo: story.isDemo ?? false,
        publishedAt: '2026-10-15',
        formattedDate: story.publishedDate || '15 Ekim 2026',
        officialSource: story.imageCredit,
        authorOrProducer: 'İslahiye Lezzet Atlası Kültürel Bellek Grubu',
        publicUrl: pubStatus === 'published' ? `/mutfak-mirasi/${story.slug}` : undefined,
        tags: story.tags,
        metrics: {
          readingTime: story.readingTime,
        },
      });
    });

    // 5. Artisans & Producers
    artisans.forEach((artisan) => {
      const pubStatus = artisan.publicationStatus || 'published';
      const verStatus =
        artisan.verificationStatus === 'archive_in_progress' ? 'unverified' : (artisan.verificationStatus as any) || 'verified';

      items.push({
        id: artisan.id,
        title: artisan.name,
        subtitle: artisan.title,
        summary: artisan.biography,
        contentType: 'artisan',
        contentTypeLabel: 'Zanaatkâr & Üretici',
        category: artisan.craftCategory,
        categoryLabel: artisan.craftCategoryLabel,
        coverImage: artisan.imageUrl,
        publicationStatus: pubStatus,
        verificationStatus: verStatus,
        contentOrigin: 'field_research',
        isDemo: artisan.isDemo ?? true,
        publishedAt: '2026-10-15',
        formattedDate: '15 Ekim 2026',
        officialSource: artisan.infoSource || 'İslahiye Yerel Saha Kayıtları',
        authorOrProducer: artisan.name,
        publicUrl: pubStatus === 'published' ? `/#ustalar` : undefined,
        tags: [artisan.craftCategoryLabel, 'Zanaatkâr'],
        metrics: {
          servings: artisan.experienceYears ? `${artisan.experienceYears} Yıl` : undefined,
        },
      });
    });

    // 6. News and Editorial Articles
    articles.forEach((article) => {
      items.push({
        id: article.id,
        slug: article.slug,
        title: article.title,
        subtitle: article.subtitle,
        summary: article.summary,
        contentType: article.contentType === 'news' ? 'news' : 'editorial_article',
        contentTypeLabel: article.contentType === 'news' ? 'Resmî Haber' : 'Editoryal Yazı',
        category: article.category,
        categoryLabel: article.categoryLabel,
        coverImage: article.coverImage,
        publicationStatus: article.publicationStatus,
        verificationStatus: article.verificationStatus,
        contentOrigin: article.contentOrigin,
        isDemo: article.isDemo,
        publishedAt: article.publishedAt,
        formattedDate: article.formattedDate,
        sourceUrl: article.sourceUrl,
        officialSource: article.author.title,
        authorOrProducer: article.author.name,
        publicUrl: article.publicationStatus === 'published' ? `/haberler/${article.slug}` : undefined,
        tags: article.tags,
        metrics: {
          readingTime: article.readingTime,
        },
      });
    });

    // 7. Announcements
    announcements.forEach((ann) => {
      items.push({
        id: ann.id,
        title: ann.title,
        summary: ann.summary,
        contentType: 'announcement',
        contentTypeLabel: 'Kurumsal Duyuru',
        category: ann.category,
        categoryLabel: ann.categoryLabel,
        publicationStatus: ann.publicationStatus,
        verificationStatus: ann.verificationStatus,
        contentOrigin: ann.contentOrigin,
        isDemo: ann.isDemo,
        publishedAt: ann.publishedAt,
        formattedDate: ann.formattedDate,
        sourceUrl: ann.sourceUrl,
        officialSource: ann.officialSource,
        authorOrProducer: ann.officialSource,
        publicUrl: ann.publicationStatus === 'published' ? `/duyurular` : undefined,
        tags: [ann.categoryLabel],
      });
    });

    // 8. Gastronomy Events
    events.forEach((evt) => {
      items.push({
        id: evt.id,
        slug: evt.slug,
        title: evt.title,
        subtitle: evt.subtitle,
        summary: evt.description,
        contentType: 'event',
        contentTypeLabel: 'Etkinlik & Buluşma',
        category: evt.eventType,
        categoryLabel: evt.eventTypeLabel,
        coverImage: evt.coverImage,
        publicationStatus: evt.publicationStatus || (evt.status === 'completed' ? 'archived' : 'published'),
        verificationStatus: evt.verificationStatus,
        contentOrigin: evt.contentOrigin,
        isDemo: evt.isDemo,
        publishedAt: evt.startDate,
        formattedDate: evt.formattedDate,
        sourceUrl: evt.sourceUrl,
        officialSource: evt.locationName,
        authorOrProducer: evt.locationName,
        publicUrl: evt.publicationStatus === 'published' && evt.status !== 'cancelled' ? `/etkinlikler` : undefined,
        tags: evt.tags,
        metrics: {
          duration: evt.time,
        },
      });
    });

    // 9. Physical Gastronomy Places (Sprint 02C-2)
    const places = contentStore.getPlaces(false);
    places.forEach((place) => {
      const pubStatus = place.publicationStatus || 'published';
      const verStatus =
        place.verificationStatus === 'pending_verification' ||
        place.verificationStatus === 'inventory_in_progress'
          ? 'unverified'
          : (place.verificationStatus as any) || 'verified';

      items.push({
        id: place.id,
        title: place.name,
        subtitle: place.address,
        summary: place.description,
        contentType: 'place',
        contentTypeLabel: 'Ziyaret Noktası',
        category: place.category,
        categoryLabel: place.categoryLabel,
        coverImage: place.coverImage || (place.images && place.images[0]),
        publicationStatus: pubStatus,
        verificationStatus: verStatus,
        contentOrigin: 'field_research',
        isDemo: place.isDemo ?? false,
        publishedAt: '2026-10-15',
        formattedDate: place.lastVerifiedDate || '15 Ekim 2026',
        sourceUrl: place.websiteUrl,
        officialSource:
          place.verificationSource || place.infoSource || 'İslahiye Yerel Saha Kaydı',
        authorOrProducer: place.name,
        publicUrl: pubStatus === 'published' ? `/lezzet-haritasi` : undefined,
        tags: [place.categoryLabel, 'Ziyaret Noktası'],
      });
    });

    // 10. Media Items
    const mediaItems = contentStore.getMediaItems();
    mediaItems.forEach((m) => {
      items.push({
        id: m.id,
        title: m.title,
        subtitle: m.mediaType,
        summary: m.description,
        contentType: 'media',
        contentTypeLabel: 'Medya Öğesi',
        category: m.mediaType,
        categoryLabel: m.mediaType,
        coverImage: m.src,
        publicationStatus: m.publicationStatus || 'published',
        verificationStatus: m.verificationStatus || 'verified',
        contentOrigin: m.origin === 'real_local' ? 'field_research' : 'temsili_demo',
        isDemo: m.origin !== 'real_local',
        publishedAt: '2026-10-15',
        formattedDate: '15 Ekim 2026',
        officialSource: m.usagePermission,
        authorOrProducer: m.usagePermission,
        tags: [m.mediaType, m.origin],
      });
    });

    // 11. Atlas Dish Nodes
    const atlasNodes = contentStore.getAtlasNodes(false);
    atlasNodes.forEach((node) => {
      const associatedDish = dishes.find((d) => d.id === node.dishId);
      const title = associatedDish ? associatedDish.name : (node.accentNote || node.dishId);
      items.push({
        id: node.id || `atlas-${node.dishId}`,
        title,
        subtitle: node.accentNote,
        summary: node.shortIntro || associatedDish?.description || 'Lezzet Atlası coğrafi konumu.',
        contentType: 'atlas_node',
        contentTypeLabel: 'Atlas Düğümü',
        category: 'Lezzet Atlası',
        categoryLabel: 'Atlas Düğümü',
        coverImage: node.imageUrl || associatedDish?.imageUrl,
        publicationStatus: node.publicationStatus || 'published',
        verificationStatus: node.verificationStatus || 'verified',
        contentOrigin: node.contentOrigin || 'editorial_narrative',
        isDemo: false,
        publishedAt: '2026-10-15',
        formattedDate: '15 Ekim 2026',
        publicUrl: node.publicationStatus === 'published' ? `/#atlas` : undefined,
        tags: ['Atlas', node.regionId],
      });
    });

    return items;
  }

  public static getStats(): CmsStats {
    const items = this.getAllItems();

    const countsByType: Record<CmsContentType, number> = {
      dish: 0,
      recipe: 0,
      place: 0,
      artisan: 0,
      film: 0,
      news: 0,
      editorial_article: 0,
      announcement: 0,
      event: 0,
      media: 0,
      atlas_node: 0,
    };

    const countsByCategory: Record<string, number> = {};

    let publishedCount = 0;
    let draftCount = 0;
    let inReviewCount = 0;
    let archivedCount = 0;
    let verifiedCount = 0;
    let simulatedDemoCount = 0;
    let unverifiedCount = 0;
    let missingSourceCount = 0;

    items.forEach((item) => {
      if (countsByType[item.contentType] !== undefined) {
        countsByType[item.contentType]++;
      }

      const catKey = item.categoryLabel || item.category || 'Diğer';
      countsByCategory[catKey] = (countsByCategory[catKey] || 0) + 1;

      if (item.publicationStatus === 'published') publishedCount++;
      else if (item.publicationStatus === 'draft') draftCount++;
      else if (item.publicationStatus === 'in_review') inReviewCount++;
      else if (item.publicationStatus === 'archived') archivedCount++;

      if (item.verificationStatus === 'verified') verifiedCount++;
      else if (item.verificationStatus === 'simulated') simulatedDemoCount++;
      else if (item.verificationStatus === 'unverified') unverifiedCount++;

      if (!item.sourceUrl && !item.officialSource) {
        missingSourceCount++;
      }
    });

    return {
      totalItems: items.length,
      publishedCount,
      draftCount,
      inReviewCount,
      archivedCount,
      verifiedCount,
      simulatedDemoCount,
      unverifiedCount,
      countsByType,
      countsByCategory,
      missingSourceCount,
    };
  }

  public static filterItems(items: CmsContentItem[], filter: CmsFilterState): CmsContentItem[] {
    return items.filter((item) => {
      if (filter.searchQuery.trim() !== '') {
        const q = filter.searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSummary = item.summary ? item.summary.toLowerCase().includes(q) : false;
        const matchesCategory = item.categoryLabel.toLowerCase().includes(q);
        const matchesTags = item.tags ? item.tags.some((t) => t.toLowerCase().includes(q)) : false;

        if (!matchesTitle && !matchesSummary && !matchesCategory && !matchesTags) {
          return false;
        }
      }

      if (filter.contentType !== 'all' && item.contentType !== filter.contentType) {
        return false;
      }

      if (filter.publicationStatus !== 'all' && item.publicationStatus !== filter.publicationStatus) {
        return false;
      }

      if (filter.verificationStatus !== 'all' && item.verificationStatus !== filter.verificationStatus) {
        return false;
      }

      if (filter.isDemoOnly !== null && item.isDemo !== filter.isDemoOnly) {
        return false;
      }

      return true;
    });
  }

  public static getItemById(id: string): CmsContentItem | undefined {
    return this.getAllItems().find((item) => item.id === id);
  }
}
