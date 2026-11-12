import { useState, useEffect, useCallback } from 'react';
import { contentStore, normalizeDishId, normalizeRecipeId } from '../services/content/contentStore';
import { ContentRepository } from '../services/content/contentRepository';
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
  CategoryDefinition,
  CategoryScope,
} from '../types';
import { CmsContentItem, CmsStats } from '../types/admin';

/**
 * Reactive Content Hook for Synchronized Visitor and CMS Views (Sprint 02C-2)
 */
export function useContent() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = contentStore.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const getDishes = useCallback((onlyPublished = false): Dish[] => {
    return contentStore.getDishes(onlyPublished);
  }, [tick]);

  const getRecipes = useCallback((onlyPublished = false): Recipe[] => {
    return contentStore.getRecipes(onlyPublished);
  }, [tick]);

  const getArticles = useCallback((onlyPublished = false): Article[] => {
    return contentStore.getArticles(onlyPublished);
  }, [tick]);

  const getAnnouncements = useCallback((onlyPublished = false): Announcement[] => {
    return contentStore.getAnnouncements(onlyPublished);
  }, [tick]);

  const getEvents = useCallback((onlyPublished = false): GastronomyEvent[] => {
    return contentStore.getEvents(onlyPublished);
  }, [tick]);

  const getCulturalStories = useCallback((onlyPublished = false): CulturalHeritageStory[] => {
    return contentStore.getCulturalStories(onlyPublished);
  }, [tick]);

  const getArtisans = useCallback((onlyPublished = false): Artisan[] => {
    return contentStore.getArtisans(onlyPublished);
  }, [tick]);

  const getFilms = useCallback((onlyPublished = false): GastronomyFilm[] => {
    return contentStore.getFilms(onlyPublished);
  }, [tick]);

  const getMediaItems = useCallback((): MediaItem[] => {
    return contentStore.getMediaItems();
  }, [tick]);

  const getAtlasNodes = useCallback((onlyPublished = false): AtlasDishNode[] => {
    return contentStore.getAtlasNodes(onlyPublished);
  }, [tick]);

  const getPlaces = useCallback((onlyVerifiedPublished = false): GastronomyPlace[] => {
    return contentStore.getPlaces(onlyVerifiedPublished);
  }, [tick]);

  const getCategories = useCallback((scope?: CategoryScope, onlyActive = false): CategoryDefinition[] => {
    return contentStore.getCategories(scope, onlyActive);
  }, [tick]);

  const getCategoryLabel = useCallback(
    (scope: CategoryScope, categoryId: string, fallback = ''): string => {
      return contentStore.getCategoryLabel(scope, categoryId, fallback);
    },
    [tick]
  );

  const getCategoryUsageCount = useCallback(
    (scope: CategoryScope, categoryId: string): number => {
      return contentStore.getCategoryUsageCount(scope, categoryId);
    },
    [tick]
  );

  const getCmsItems = useCallback((): CmsContentItem[] => {
    return ContentRepository.getAllItems();
  }, [tick]);

  const getCmsStats = useCallback((): CmsStats => {
    return ContentRepository.getStats();
  }, [tick]);

  const getDishById = useCallback((id: string): Dish | undefined => {
    const canonical = normalizeDishId(id);
    return contentStore.getDishes(false).find((d) => d.id === id || d.id === canonical);
  }, [tick]);

  const getRecipeById = useCallback((id: string): Recipe | undefined => {
    const canonicalRecipe = normalizeRecipeId(id);
    const canonicalDish = normalizeDishId(id);
    return contentStore
      .getRecipes()
      .find(
        (r) =>
          r.id === id ||
          r.id === canonicalRecipe ||
          r.dishId === id ||
          r.dishId === canonicalDish
      );
  }, [tick]);

  const getArticleBySlug = useCallback((slug: string): Article | undefined => {
    return contentStore.getArticles(false).find((a) => a.slug === slug || a.id === slug);
  }, [tick]);

  const getArticleById = useCallback((id: string): Article | undefined => {
    return contentStore.getArticles(false).find((a) => a.id === id);
  }, [tick]);

  const getCulturalStoryBySlug = useCallback((slug: string): CulturalHeritageStory | undefined => {
    return contentStore.getCulturalStories(false).find((s) => s.slug === slug || s.id === slug);
  }, [tick]);

  const getCulturalStoryById = useCallback((id: string): CulturalHeritageStory | undefined => {
    return contentStore.getCulturalStories(false).find((s) => s.id === id);
  }, [tick]);

  const getArtisanById = useCallback((id: string): Artisan | undefined => {
    return contentStore.getArtisans(false).find((a) => a.id === id);
  }, [tick]);

  const getFilmById = useCallback((id: string): GastronomyFilm | undefined => {
    return contentStore.getFilms(false).find((f) => f.id === id);
  }, [tick]);

  const getMediaItemById = useCallback((id: string): MediaItem | undefined => {
    return contentStore.getMediaItems().find((m) => m.id === id);
  }, [tick]);

  const getAtlasNodeByDishId = useCallback((dishId: string): AtlasDishNode | undefined => {
    const canonical = normalizeDishId(dishId);
    return contentStore
      .getAtlasNodes(false)
      .find(
        (n) =>
          n.dishId === dishId ||
          n.dishId === canonical ||
          n.id === dishId ||
          n.id === `node-${canonical}`
      );
  }, [tick]);

  const getPlaceById = useCallback((id: string): GastronomyPlace | undefined => {
    return contentStore.getPlaces(false).find((p) => p.id === id);
  }, [tick]);

  const getAnnouncementById = useCallback((id: string): Announcement | undefined => {
    return contentStore.getAnnouncementById(id);
  }, [tick]);

  const getEventById = useCallback((id: string): GastronomyEvent | undefined => {
    return contentStore.getEventById(id);
  }, [tick]);

  return {
    contentVersion: `${contentStore.getLastUpdated()}-${tick}`,
    getDishes,
    getRecipes,
    getArticles,
    getAnnouncements,
    getEvents,
    getCulturalStories,
    getArtisans,
    getFilms,
    getMediaItems,
    getAtlasNodes,
    getPlaces,
    getCategories,
    getCategoryLabel,
    getCategoryUsageCount,
    saveCategory: contentStore.saveCategory.bind(contentStore),
    deleteCategory: contentStore.deleteCategory.bind(contentStore),
    getDishById,
    getRecipeById,
    getArticleBySlug,
    getArticleById,
    getCulturalStoryBySlug,
    getCulturalStoryById,
    getArtisanById,
    getFilmById,
    getMediaItemById,
    getAtlasNodeByDishId,
    getPlaceById,
    getAnnouncementById,
    getEventById,
    getHomepageFeatured: contentStore.getHomepageFeatured.bind(contentStore),
    saveHomepageFeatured: contentStore.saveHomepageFeatured.bind(contentStore),
    getDemoActivityLog: contentStore.getDemoActivityLog.bind(contentStore),
    clearDemoActivityLog: contentStore.clearDemoActivityLog.bind(contentStore),
    getCmsItems,
    getCmsStats,
    saveDish: contentStore.saveDish.bind(contentStore),
    deleteDish: contentStore.deleteDish.bind(contentStore),
    saveRecipe: contentStore.saveRecipe.bind(contentStore),
    deleteRecipe: contentStore.deleteRecipe.bind(contentStore),
    saveArticle: contentStore.saveArticle.bind(contentStore),
    deleteArticle: contentStore.deleteArticle.bind(contentStore),
    saveAnnouncement: contentStore.saveAnnouncement.bind(contentStore),
    deleteAnnouncement: contentStore.deleteAnnouncement.bind(contentStore),
    saveEvent: contentStore.saveEvent.bind(contentStore),
    deleteEvent: contentStore.deleteEvent.bind(contentStore),
    saveCulturalStory: contentStore.saveCulturalStory.bind(contentStore),
    deleteCulturalStory: contentStore.deleteCulturalStory.bind(contentStore),
    saveArtisan: contentStore.saveArtisan.bind(contentStore),
    deleteArtisan: contentStore.deleteArtisan.bind(contentStore),
    saveFilm: contentStore.saveFilm.bind(contentStore),
    deleteFilm: contentStore.deleteFilm.bind(contentStore),
    saveMediaItem: contentStore.saveMediaItem.bind(contentStore),
    deleteMediaItem: contentStore.deleteMediaItem.bind(contentStore),
    saveAtlasNode: contentStore.saveAtlasNode.bind(contentStore),
    deleteAtlasNode: contentStore.deleteAtlasNode.bind(contentStore),
    savePlace: contentStore.savePlace.bind(contentStore),
    deletePlace: contentStore.deletePlace.bind(contentStore),
    updateStatus: contentStore.updateStatus.bind(contentStore),
    updatePublicationStatus: contentStore.updateStatus.bind(contentStore),
    syncWithBackend: contentStore.syncWithBackend.bind(contentStore),
    resetToSeeds: contentStore.resetToSeeds.bind(contentStore),
    lastUpdated: contentStore.getLastUpdated(),
  };
}
