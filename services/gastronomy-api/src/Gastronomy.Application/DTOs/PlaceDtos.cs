using Gastronomy.Domain;

namespace Gastronomy.Application.DTOs;

public record GastronomyPlaceDto(
    string Id,
    string Slug,
    string Name,
    PlaceCategory Category,
    string CategoryLabel,
    string Description,
    string ShortAddress,
    string FullAddress,
    string District,
    string Neighborhood,
    string? Phone,
    string? OpeningHours,
    double Latitude,
    double Longitude,
    bool HasVerifiedCoordinates,
    PlaceVerificationStatus VerificationStatus,
    string? VerificationSource,
    string CoverImageUrl,
    List<string> SignatureDishIds,
    bool IsRecommended,
    int OrderIndex
);

public record PlaceFilterParams(
    string? Search = null,
    PlaceCategory? Category = null,
    bool? VerifiedOnly = null,
    bool? RecommendedOnly = null
);

public record CreatePlaceDto(
    string? Id,
    string? Slug,
    string Name,
    PlaceCategory Category,
    string CategoryLabel,
    string Description,
    string ShortAddress,
    string FullAddress,
    string District,
    string Neighborhood,
    string? Phone,
    string? OpeningHours,
    double Latitude,
    double Longitude,
    bool HasVerifiedCoordinates,
    PlaceVerificationStatus VerificationStatus,
    string? VerificationSource,
    string CoverImageUrl,
    List<string>? SignatureDishIds,
    bool IsRecommended,
    int OrderIndex
);

public record UpdatePlaceDto(
    string Name,
    PlaceCategory Category,
    string CategoryLabel,
    string Description,
    string ShortAddress,
    string FullAddress,
    string District,
    string Neighborhood,
    string? Phone,
    string? OpeningHours,
    double Latitude,
    double Longitude,
    bool HasVerifiedCoordinates,
    PlaceVerificationStatus VerificationStatus,
    string? VerificationSource,
    string CoverImageUrl,
    List<string>? SignatureDishIds,
    bool IsRecommended,
    int OrderIndex
);

