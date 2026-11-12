namespace Gastronomy.Domain.Entities;

public class RecipeStep
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string RecipeId { get; set; } = string.Empty;
    public Recipe? Recipe { get; set; }

    public int StepNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Instruction { get; set; } = string.Empty;
    public string? Tip { get; set; }
    public int? DurationMinutes { get; set; }
    public string? ImageUrl { get; set; }
    public int? VideoTimestampSeconds { get; set; }
}

