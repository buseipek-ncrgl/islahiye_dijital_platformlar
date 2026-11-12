namespace Gastronomy.Domain.Entities;

public class GastronomyFilm
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Slug { get; set; } = string.Empty;
    public int EpisodeNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string Description { get; set; } = string.Empty;
    public int DurationSeconds { get; set; }
    public string VideoUrl { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public string Theme { get; set; } = string.Empty;
    public string? FeaturedDishId { get; set; }
    public string? FeaturedArtisanId { get; set; }
    public bool IsFeatured { get; set; }
    public int OrderIndex { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

