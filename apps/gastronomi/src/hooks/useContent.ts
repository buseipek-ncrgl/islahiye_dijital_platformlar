import { useState, useEffect, useCallback } from 'react';
import { contentStore } from '../services/content/contentStore';
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
} from '../types';
import { CmsContentItem, CmsStats } from '../types/admin';

/**
 * Reactive Content Hook for Synchronized Visitor and CMS Views (Sprint 02C-2)
 */
export function useContent() {
  const [, setTick] = useState(0);

  useEffect(() => {
    // Re-render component whenever store emits a change
    const unsubscribe = contentStore.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const getDishes = useCallback((onlyPublished = false): Dish[] => {
    return contentStore.getDishes(onlyPublished);
  }, []);

  const getRecipes = useCallback((onlyPublished = false): Recipe[] => {
    return contentStore.getRecipes(onlyPublished);
  }, []);

  const getArticles = useCallback((onlyPublished = false): Article[] => {
    return contentStore.getArticles(onlyPublished);
  }, []);

  const getAnnouncements = useCallback((onlyPublished = false): Announcement[] => {
    return contentStore.getAnnouncements(onlyPublished);
  }, []);

  const getEvents = useCallback((onlyPublished = false): GastronomyEvent[] => {
    return contentStore.getEvents(onlyPublished);
  }, []);

  const getCulturalStories = useCallback((onlyPublished = false): CulturalHeritageStory[] => {
    return contentStore.getCulturalStories(onlyPublished);
  }, []);

  const getArtisans = useCallback((onlyPublished = false): Artisan[] => {
    return contentStore.getArtisans(onlyPublished);
  }, []);

  const getFilms = useCallback((onlyPublished = false): GastronomyFilm[] => {
    return contentStore.getFilms(onlyPublished);
  }, []);

  const getMediaItems = useCallback((): MediaItem[] => {
    return contentStore.getMediaItems();
  }, []);

  const getAtlasNodes = useCallback((onlyPublished = false): AtlasDishNode[] => {
    return contentStore.getAtlasNodes(onlyPublished);
  }, []);

  const getPlaces = useCallback((onlyVerifiedPublished = false): GastronomyPlace[] => {
    return contentStore.getPlaces(onlyVerifiedPublished);
  }, []);

  const getCmsItems = useCallback((): CmsContentItem[] => {
    return ContentRepository.getAllItems();
  }, []);

  const getCmsStats = useCallback((): CmsStats => {
    return ContentRepository.getStats();
  }, []);

  const getDishById = useCallback((id: string): Dish | undefined => {
    return contentStore.getDishes(false).find((d) => d.id === id);
  }, []);

  const getRecipeById = useCallback((id: string): Recipe | undefined => {
    return contentStore.getRecipes().find((r) => r.id === id);
  }, []);

  const getArticleBySlug = useCallback((slug: string): Article | undefined => {
    return contentStore.getArticles(false).find((a) => a.slug === slug || a.id === slug);
  }, []);

  const getArticleById = useCallback((id: string): Article | undefined => {
    return contentStore.getArticles(false).find((a) => a.id === id);
  }, []);

  const getCulturalStoryBySlug = useCallback((slug: string): CulturalHeritageStory | undefined => {
    return contentStore.getCulturalStories(false).find((s) => s.slug === slug || s.id === slug);
  }, []);

  const getCulturalStoryById = useCallback((id: string): CulturalHeritageStory | undefined => {
    return contentStore.getCulturalStories(false).find((s) => s.id === id);
  }, []);

  const getArtisanById = useCallback((id: string): Artisan | undefined => {
    return contentStore.getArtisans(false).find((a) => a.id === id);
  }, []);

  const getFilmById = useCallback((id: string): GastronomyFilm | undefined => {
    return contentStore.getFilms(false).find((f) => f.id === id);
  }, []);

  const getMediaItemById = useCallback((id: string): MediaItem | undefined => {
    return contentStore.getMediaItems().find((m) => m.id === id);
  }, []);

  const getAtlasNodeByDishId = useCallback((dishId: string): AtlasDishNode | undefined => {
    return contentStore.getAtlasNodes(false).find((n) => n.dishId === dishId || n.id === dishId);
  }, []);

  const getPlaceById = useCallback((id: string): GastronomyPlace | undefined => {
    return contentStore.getPlaces(false).find((p) => p.id === id);
  }, []);

  const getAnnouncementById = useCallback((id: string): Announcement | undefined => {
    return contentStore.getAnnouncementById(id);
  }, []);

  const getEventById = useCallback((id: string): GastronomyEvent | undefined => {
    return contentStore.getEventById(id);
  }, []);

  return {
    contentVersion: contentStore.getLastUpdated(),
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
    saveMediaItem: contentStore.saveMediaItem.bind(contentStore),
    deleteMediaItem: contentStore.deleteMediaItem.bind(contentStore),
    saveAtlasNode: contentStore.saveAtlasNode.bind(contentStore),
    deleteAtlasNode: contentStore.deleteAtlasNode.bind(contentStore),
    savePlace: contentStore.savePlace.bind(contentStore),
    deletePlace: contentStore.deletePlace.bind(contentStore),
    updateStatus: contentStore.updateStatus.bind(contentStore),
    updatePublicationStatus: contentStore.updateStatus.bind(contentStore),
    resetToSeeds: contentStore.resetToSeeds.bind(contentStore),
    lastUpdated: contentStore.getLastUpdated(),
  };
}
