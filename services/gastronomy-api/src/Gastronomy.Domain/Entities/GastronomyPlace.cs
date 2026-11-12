namespace Gastronomy.Domain.Entities;

public class GastronomyPlace
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public PlaceCategory Category { get; set; }
    public string CategoryLabel { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ShortAddress { get; set; } = string.Empty;
    public string FullAddress { get; set; } = string.Empty;
    public string District { get; set; } = "İslahiye";
    public string Neighborhood { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? OpeningHours { get; set; }

    /// <summary>
    /// Koordinatlar doğrulanmış fiziksel konumu temsil eder.
    /// Kural: Haritada konumu olmayan mekana hayali koordinat atanmaz.
    /// </summary>
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public bool HasVerifiedCoordinates { get; set; } = true;

    public PlaceVerificationStatus VerificationStatus { get; set; } = PlaceVerificationStatus.Verified;
    public string? VerificationSource { get; set; }

    public string CoverImageUrl { get; set; } = string.Empty;
    public string? SignatureDishIds { get; set; }
    public bool IsRecommended { get; set; }
    public int OrderIndex { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

