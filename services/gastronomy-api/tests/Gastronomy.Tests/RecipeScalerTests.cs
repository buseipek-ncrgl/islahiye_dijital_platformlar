using Gastronomy.Application.DTOs;
using Gastronomy.Application.Services;
using Xunit;

namespace Gastronomy.Tests;

public class RecipeScalerTests
{
    private readonly RecipeScaler _scaler = new();

    private static RecipeDto CreateSampleRecipe(int yield = 4)
    {
        return new RecipeDto(
            Id: "test-recipe",
            DishId: "test-dish",
            DishName: "İslahiye Tavası",
            Title: "Geleneksel Tava",
            Slug: "geleneksel-tava",
            Yield: yield,
            YieldUnit: "porsiyon",
            AuthorType: "yerel_usta",
            AuthorName: "Usta",
            AuthorAffiliation: null,
            PrepTimeMinutes: 20,
            CookTimeMinutes: 50,
            RestTimeMinutes: 5,
            Difficulty: "orta",
            IsPrimary: true,
            VideoUrl: null,
            VideoDurationSeconds: null,
            CoverImageUrl: null,
            Notes: null,
            Ingredients:
            [
                new RecipeIngredientDto("1", "Kuzu eti", 800m, "g", "Et", null, false, true, 1),
                new RecipeIngredientDto("2", "Köy domatesi", 4m, "adet", "Sebze", null, false, false, 2),
                new RecipeIngredientDto("3", "Firik bulguru", 1.5m, "su bardağı", "Tahıl", null, false, true, 3),
                new RecipeIngredientDto("4", "Sarımsak", 12m, "diş", "Sebze", null, false, false, 4)
            ],
            Steps: []
        );
    }

    [Fact]
    public void ScaleRecipe_HalvingServings_ShouldHalveAmounts()
    {
        // Arrange
        var recipe = CreateSampleRecipe(yield: 4);

        // Act
        var scaled = _scaler.ScaleRecipe(recipe, requestedServings: 2);

        // Assert
        Assert.Equal(4, scaled.BaseYield);
        Assert.Equal(2, scaled.RequestedYield);
        Assert.Equal(0.5m, scaled.ScaleFactor);

        var meat = scaled.Ingredients.First(i => i.Name == "Kuzu eti");
        Assert.Equal(400m, meat.ScaledAmount);
        Assert.Equal("400 g", meat.FormattedAmount);

        var tomatoes = scaled.Ingredients.First(i => i.Name == "Köy domatesi");
        Assert.Equal(2m, tomatoes.ScaledAmount);
        Assert.Equal("2 adet", tomatoes.FormattedAmount);
    }

    [Fact]
    public void ScaleRecipe_IncreasingTo6_ShouldMultiplyByOneAndHalf()
    {
        // Arrange
        var recipe = CreateSampleRecipe(yield: 4);

        // Act
        var scaled = _scaler.ScaleRecipe(recipe, requestedServings: 6);

        // Assert
        Assert.Equal(1.5m, scaled.ScaleFactor);

        var meat = scaled.Ingredients.First(i => i.Name == "Kuzu eti");
        Assert.Equal(1200m, meat.ScaledAmount);

        var tomatoes = scaled.Ingredients.First(i => i.Name == "Köy domatesi");
        Assert.Equal(6m, tomatoes.ScaledAmount);
        Assert.Equal("6 adet", tomatoes.FormattedAmount);
    }

    [Theory]
    [InlineData(0, 1)] // Clamped to 1
    [InlineData(-5, 1)] // Clamped to 1
    [InlineData(150, 100)] // Clamped to 100
    public void ScaleRecipe_InvalidServings_ShouldClampProperly(int inputServings, int expectedServings)
    {
        // Arrange
        var recipe = CreateSampleRecipe(yield: 4);

        // Act
        var scaled = _scaler.ScaleRecipe(recipe, inputServings);

        // Assert
        Assert.Equal(expectedServings, scaled.RequestedYield);
    }

    [Fact]
    public void FormatIngredientAmount_KilogramFractional_FormatsNicely()
    {
        // 0.5 kg should format as 500 g
        var formatted = _scaler.FormatIngredientAmount(0.5m, "kg");
        Assert.Equal("500 g", formatted);

        // 1.5 kg should format as 1,5 kg (tr-TR decimal separator is comma)
        var formattedKg = _scaler.FormatIngredientAmount(1.5m, "kg");
        Assert.Equal("1,5 kg", formattedKg);
    }
}
