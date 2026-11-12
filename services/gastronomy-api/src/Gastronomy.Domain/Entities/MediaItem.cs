namespace Gastronomy.Domain.Entities;

public class MediaItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Title { get; set; } = string.Empty;
    public MediaType MediaType { get; set; } = MediaType.Image;
    public MediaOrigin Origin { get; set; } = MediaOrigin.StockEditorial;
    public string? OriginNote { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string AltText { get; set; } = string.Empty;
    public string? Credit { get; set; }
    public string? LicenseNotice { get; set; }
    public string? EntityCategory { get; set; }
    public string? EntityId { get; set; }
}

