using Gastronomy.Domain;

namespace Gastronomy.Application.DTOs;

public record DishSummaryDto(
    string Id,
    string Slug,
    string Name,
    string? AlternativeNames,
    DishCategory Category,
    string CategoryLabel,
    string Tagline,
    string ShortDescription,
    bool IsRegisteredGeographicalIndication,
    string? GiRegistrationNumber,
    string? GiStatusNote,
    int PrepTimeMinutes,
    int CookTimeMinutes,
    string Difficulty,
    int DefaultServings,
    string ImageUrl,
    string? ImageAlt,
    string? ImageCredit,
    bool IsLead,
    int OrderIndex,
    int RecipeCount
);

public record DishDto(
    string Id,
    string Slug,
    string Name,
    string? AlternativeNames,
    DishCategory Category,
    string CategoryLabel,
    string Tagline,
    string ShortDescription,
    string Description,
    string? CulturalNote,
    string? OriginNote,
    bool IsRegisteredGeographicalIndication,
    string? GiRegistrationNumber,
    string? GiStatusNote,
    string? SeasonalAvailability,
    int PrepTimeMinutes,
    int CookTimeMinutes,
    string Difficulty,
    int DefaultServings,
    string ImageUrl,
    string? ImageAlt,
    string? ImageCredit,
    bool IsLead,
    int OrderIndex,
    PublicationStatus PublicationStatus,
    VerificationStatus VerificationStatus,
    DateTimeOffset CreatedAt,
    List<RecipeSummaryDto> Recipes
);

public record CreateDishDto(
    string Slug,
    string Name,
    string? AlternativeNames,
    DishCategory Category,
    string CategoryLabel,
    string Tagline,
    string ShortDescription,
    string Description,
    string? CulturalNote,
    string? OriginNote,
    bool IsRegisteredGeographicalIndication,
    string? GiRegistrationNumber,
    string? GiStatusNote,
    string? SeasonalAvailability,
    int PrepTimeMinutes,
    int CookTimeMinutes,
    string Difficulty,
    int DefaultServings,
    string ImageUrl,
    string? ImageAlt,
    string? ImageCredit,
    bool IsLead,
    int OrderIndex
);

public record UpdateDishDto(
    string Name,
    string? AlternativeNames,
    DishCategory Category,
    string CategoryLabel,
    string Tagline,
    string ShortDescription,
    string Description,
    string? CulturalNote,
    string? OriginNote,
    bool IsRegisteredGeographicalIndication,
    string? GiRegistrationNumber,
    string? GiStatusNote,
    string? SeasonalAvailability,
    int PrepTimeMinutes,
    int CookTimeMinutes,
    string Difficulty,
    int DefaultServings,
    string ImageUrl,
    string? ImageAlt,
    string? ImageCredit,
    bool IsLead,
    int OrderIndex,
    PublicationStatus PublicationStatus,
    VerificationStatus VerificationStatus
);

public record DishFilterParams(
    string? Search = null,
    DishCategory? Category = null,
    bool? GeographicalIndicationOnly = null,
    string? Difficulty = null,
    bool? IncludeAll = null
);

