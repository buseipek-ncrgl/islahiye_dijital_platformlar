namespace Gastronomy.Domain.Entities;

public class CulturalHeritageStory
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public StoryTheme Theme { get; set; }
    public string ThemeLabel { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public string? RelatedDishIds { get; set; }
    public string? AuthorOrSource { get; set; }
    public int ReadTimeMinutes { get; set; } = 5;
    public bool IsFeatured { get; set; }
    public int OrderIndex { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

