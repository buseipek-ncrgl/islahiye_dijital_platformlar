namespace Gastronomy.Domain.Entities;

public class Dish
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? AlternativeNames { get; set; }
    public DishCategory Category { get; set; }
    public string CategoryLabel { get; set; } = string.Empty;
    public string Tagline { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? CulturalNote { get; set; }
    public string? OriginNote { get; set; }

    /// <summary>
    /// TÜRKPATENT resmi tescili var mı?
    /// Kural: Yalnızca tescil no 991 İslahiye Biberi tescillidir; doğrulanmamış ürünler false olmalıdır.
    /// </summary>
    public bool IsRegisteredGeographicalIndication { get; set; }
    public string? GiRegistrationNumber { get; set; }
    public string? GiStatusNote { get; set; }

    public string? SeasonalAvailability { get; set; }
    public int PrepTimeMinutes { get; set; }
    public int CookTimeMinutes { get; set; }
    public string Difficulty { get; set; } = "orta"; // kolay | orta | ileri
    public int DefaultServings { get; set; } = 4;

    public string ImageUrl { get; set; } = string.Empty;
    public string? ImageAlt { get; set; }
    public string? ImageCredit { get; set; }
    public bool IsLead { get; set; }
    public int OrderIndex { get; set; }

    public PublicationStatus PublicationStatus { get; set; } = PublicationStatus.Published;
    public VerificationStatus VerificationStatus { get; set; } = VerificationStatus.Verified;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; set; }

    public List<Recipe> Recipes { get; set; } = [];
}

