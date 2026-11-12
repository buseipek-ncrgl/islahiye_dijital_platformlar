namespace Gastronomy.Domain.Entities;

public class RecipeIngredient
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string RecipeId { get; set; } = string.Empty;
    public Recipe? Recipe { get; set; }

    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Unit { get; set; } = "g";
    public string Category { get; set; } = "Ana Malzemeler";
    public string? Notes { get; set; }
    public bool IsOptional { get; set; }
    public bool IsKeyIngredient { get; set; }
    public int OrderIndex { get; set; }
}

