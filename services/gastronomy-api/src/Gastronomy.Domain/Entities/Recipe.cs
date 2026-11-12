namespace Gastronomy.Domain.Entities;

public class Recipe
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string DishId { get; set; } = string.Empty;
    public Dish? Dish { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int Yield { get; set; } = 4;
    public string YieldUnit { get; set; } = "porsiyon";

    public string AuthorType { get; set; } = "yerel_usta"; // yerel_usta | arastirmaci | ev_ascisi
    public string AuthorName { get; set; } = string.Empty;
    public string? AuthorAffiliation { get; set; }

    public int PrepTimeMinutes { get; set; }
    public int CookTimeMinutes { get; set; }
    public int RestTimeMinutes { get; set; }
    public string Difficulty { get; set; } = "orta";
    public bool IsPrimary { get; set; } = true;

    public string? VideoUrl { get; set; }
    public int? VideoDurationSeconds { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? Notes { get; set; }

    public List<RecipeIngredient> Ingredients { get; set; } = [];
    public List<RecipeStep> Steps { get; set; } = [];
}

