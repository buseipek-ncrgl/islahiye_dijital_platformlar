using Gastronomy.Domain;

namespace Gastronomy.Application.DTOs;

public record ArtisanDto(
    string Id,
    string Slug,
    string FullName,
    string CraftTitle,
    int ExperienceYears,
    string Bio,
    string Specialties,
    string? WorkplaceName,
    string? WorkplacePlaceId,
    string AvatarUrl,
    bool IsFeatured,
    int OrderIndex
);

public record CulturalHeritageStoryDto(
    string Id,
    string Slug,
    string Title,
    string? Subtitle,
    StoryTheme Theme,
    string ThemeLabel,
    string Summary,
    string Content,
    string CoverImageUrl,
    List<string> RelatedDishIds,
    string? AuthorOrSource,
    int ReadTimeMinutes,
    bool IsFeatured,
    int OrderIndex
);

public record CreateStoryDto(
    string? Id,
    string? Slug,
    string Title,
    string? Subtitle,
    StoryTheme Theme,
    string ThemeLabel,
    string Summary,
    string Content,
    string CoverImageUrl,
    List<string>? RelatedDishIds,
    string? AuthorOrSource,
    int ReadTimeMinutes,
    bool IsFeatured,
    int OrderIndex
);

public record UpdateStoryDto(
    string Title,
    string? Subtitle,
    StoryTheme Theme,
    string ThemeLabel,
    string Summary,
    string Content,
    string CoverImageUrl,
    List<string>? RelatedDishIds,
    string? AuthorOrSource,
    int ReadTimeMinutes,
    bool IsFeatured,
    int OrderIndex
);

public record GastronomyFilmDto(
    string Id,
    string Slug,
    int EpisodeNumber,
    string Title,
    string? Subtitle,
    string Description,
    int DurationSeconds,
    string VideoUrl,
    string ThumbnailUrl,
    string Theme,
    string? FeaturedDishId,
    string? FeaturedArtisanId,
    bool IsFeatured,
    int OrderIndex
);

public record NewsEventDto(
    string Id,
    string Slug,
    string Title,
    string Type,
    string Summary,
    string Content,
    string? CoverImageUrl,
    DateTimeOffset PublishedAt,
    DateTimeOffset? EventDate,
    string? Location,
    bool IsPublished
);

public record CatalogOverviewDto(
    int TotalDishes,
    int TotalRecipes,
    int TotalRegisteredGeographicalIndications,
    int TotalVerifiedPlaces,
    int TotalArtisans,
    int TotalHeritageStories,
    int TotalFilms,
    List<DishSummaryDto> LeadDishes,
    List<GastronomyPlaceDto> RecommendedPlaces,
    List<CulturalHeritageStoryDto> FeaturedStories
);

