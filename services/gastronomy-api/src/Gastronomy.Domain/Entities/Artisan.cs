namespace Gastronomy.Domain.Entities;

public class Artisan
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Slug { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string CraftTitle { get; set; } = string.Empty;
    public int ExperienceYears { get; set; }
    public string Bio { get; set; } = string.Empty;
    public string Specialties { get; set; } = string.Empty;
    public string? WorkplaceName { get; set; }
    public string? WorkplacePlaceId { get; set; }
    public string AvatarUrl { get; set; } = string.Empty;
    public bool IsFeatured { get; set; }
    public int OrderIndex { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

