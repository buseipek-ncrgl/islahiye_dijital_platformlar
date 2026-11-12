namespace Gastronomy.Application.DTOs;

public record RecipeSummaryDto(
    string Id,
    string DishId,
    string Title,
    string Slug,
    int Yield,
    string YieldUnit,
    string AuthorType,
    string AuthorName,
    int PrepTimeMinutes,
    int CookTimeMinutes,
    string Difficulty,
    bool IsPrimary,
    string? CoverImageUrl,
    int IngredientCount,
    int StepCount
);

public record RecipeIngredientDto(
    string Id,
    string Name,
    decimal Amount,
    string Unit,
    string Category,
    string? Notes,
    bool IsOptional,
    bool IsKeyIngredient,
    int OrderIndex
);

public record ScaledIngredientDto(
    string Id,
    string Name,
    decimal ScaledAmount,
    string Unit,
    string FormattedAmount,
    string Category,
    string? Notes,
    bool IsOptional,
    bool IsKeyIngredient,
    int OrderIndex
);

public record RecipeStepDto(
    string Id,
    int StepNumber,
    string Title,
    string Instruction,
    string? Tip,
    int? DurationMinutes,
    string? ImageUrl,
    int? VideoTimestampSeconds
);

public record RecipeDto(
    string Id,
    string DishId,
    string? DishName,
    string Title,
    string Slug,
    int Yield,
    string YieldUnit,
    string AuthorType,
    string AuthorName,
    string? AuthorAffiliation,
    int PrepTimeMinutes,
    int CookTimeMinutes,
    int RestTimeMinutes,
    string Difficulty,
    bool IsPrimary,
    string? VideoUrl,
    int? VideoDurationSeconds,
    string? CoverImageUrl,
    string? Notes,
    List<RecipeIngredientDto> Ingredients,
    List<RecipeStepDto> Steps
);

public record ScaledRecipeDto(
    string Id,
    string DishId,
    string? DishName,
    string Title,
    int BaseYield,
    int RequestedYield,
    string YieldUnit,
    decimal ScaleFactor,
    List<ScaledIngredientDto> Ingredients,
    List<RecipeStepDto> Steps
);

public record CreateRecipeDto(
    string DishId,
    string Title,
    string Slug,
    int Yield,
    string YieldUnit,
    string AuthorType,
    string AuthorName,
    string? AuthorAffiliation,
    int PrepTimeMinutes,
    int CookTimeMinutes,
    int RestTimeMinutes,
    string Difficulty,
    bool IsPrimary,
    string? VideoUrl,
    int? VideoDurationSeconds,
    string? CoverImageUrl,
    string? Notes,
    List<CreateRecipeIngredientDto> Ingredients,
    List<CreateRecipeStepDto> Steps
);

public record CreateRecipeIngredientDto(
    string Name,
    decimal Amount,
    string Unit,
    string Category,
    string? Notes,
    bool IsOptional,
    bool IsKeyIngredient,
    int OrderIndex
);

public record CreateRecipeStepDto(
    int StepNumber,
    string Title,
    string Instruction,
    string? Tip,
    int? DurationMinutes,
    string? ImageUrl,
    int? VideoTimestampSeconds
);

