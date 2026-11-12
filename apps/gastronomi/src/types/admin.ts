import { PublicationStatus, VerificationStatus, ContentOrigin } from './index';

export type { PublicationStatus, VerificationStatus, ContentOrigin };

/**
 * Unified CMS Content Types & Administration Models (Sprint 02A)
 */

export type CmsContentType =
  | 'dish'
  | 'recipe'
  | 'place'
  | 'artisan'
  | 'film'
  | 'news'
  | 'editorial_article'
  | 'cultural_story'
  | 'announcement'
  | 'event'
  | 'media'
  | 'atlas_node';

export interface CmsContentItem {
  id: string;
  slug?: string;
  title: string;
  subtitle?: string;
  summary?: string;
  contentType: CmsContentType;
  contentTypeLabel: string;
  category: string;
  categoryLabel: string;
  coverImage?: string;
  publicationStatus: PublicationStatus;
  verificationStatus: VerificationStatus;
  contentOrigin: ContentOrigin;
  isDemo: boolean;
  publishedAt?: string;
  formattedDate?: string;
  sourceUrl?: string;
  officialSource?: string;
  authorOrProducer?: string;
  publicUrl?: string; // Route link on visitor portal if accessible
  tags?: string[];
  metrics?: {
    readingTime?: string;
    duration?: string;
    servings?: string | number;
    stepsCount?: number;
  };
}

export interface CmsStats {
  totalItems: number;
  publishedCount: number;
  draftCount: number;
  inReviewCount: number;
  archivedCount: number;
  verifiedCount: number;
  simulatedDemoCount: number;
  unverifiedCount: number;
  countsByType: Record<CmsContentType, number>;
  countsByCategory: Record<string, number>;
  missingSourceCount: number;
}

export interface CmsFilterState {
  searchQuery: string;
  contentType: CmsContentType | 'all';
  publicationStatus: PublicationStatus | 'all';
  verificationStatus: VerificationStatus | 'all';
  isDemoOnly: boolean | null; // null = all, true = demo only, false = verified real only
}

export interface AdminNavItem {
  id: string;
  label: string;
  path: string;
  iconName: string;
  badgeCount?: number;
  group: 'overview' | 'gastronomy' | 'editorial' | 'system';
  contentTypeFilter?: CmsContentType;
}

export type AdminRole = 'viewer' | 'editor' | 'publisher' | 'admin';

export interface AdminRoleProfile {
  id: AdminRole;
  name: string;
  description: string;
  permissions: string[];
}
