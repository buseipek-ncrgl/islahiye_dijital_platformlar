namespace Gastronomy.Domain.Entities;

public class NewsEvent
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = "haber"; // haber | etkinlik | duyuru
    public string Summary { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public DateTimeOffset PublishedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? EventDate { get; set; }
    public string? Location { get; set; }
    public bool IsPublished { get; set; } = true;
}

