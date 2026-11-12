using System.Globalization;
using Gastronomy.Application.DTOs;
using Gastronomy.Application.Interfaces;

namespace Gastronomy.Application.Services;

public class RecipeScaler : IRecipeScaler
{
    private static readonly CultureInfo TrCulture = new("tr-TR");

    public ScaledRecipeDto ScaleRecipe(RecipeDto recipe, int requestedServings)
    {
        ArgumentNullException.ThrowIfNull(recipe);

        var safeServings = Math.Clamp(requestedServings, 1, 100);
        var baseYield = recipe.Yield <= 0 ? 4 : recipe.Yield;
        var scaleFactor = (decimal)safeServings / baseYield;

        var scaledIngredients = recipe.Ingredients
            .OrderBy(i => i.OrderIndex)
            .Select(ing =>
            {
                var rawScaled = ing.Amount * scaleFactor;
                var scaledAmount = RoundAppropriately(rawScaled, ing.Unit);
                var formatted = FormatIngredientAmount(scaledAmount, ing.Unit);

                return new ScaledIngredientDto(
                    Id: ing.Id,
                    Name: ing.Name,
                    ScaledAmount: scaledAmount,
                    Unit: ing.Unit,
                    FormattedAmount: formatted,
                    Category: ing.Category,
                    Notes: ing.Notes,
                    IsOptional: ing.IsOptional,
                    IsKeyIngredient: ing.IsKeyIngredient,
                    OrderIndex: ing.OrderIndex
                );
            })
            .ToList();

        return new ScaledRecipeDto(
            Id: recipe.Id,
            DishId: recipe.DishId,
            DishName: recipe.DishName,
            Title: recipe.Title,
            BaseYield: baseYield,
            RequestedYield: safeServings,
            YieldUnit: recipe.YieldUnit,
            ScaleFactor: Math.Round(scaleFactor, 3),
            Ingredients: scaledIngredients,
            Steps: recipe.Steps
        );
    }

    public string FormatIngredientAmount(decimal amount, string unit)
    {
        if (amount <= 0)
        {
            return $"isteğe bağlı {unit}".Trim();
        }

        var normalizedUnit = (unit ?? string.Empty).Trim().ToLower(TrCulture);

        // Gram, mililitre gibi büyük ağırlık/hacim birimlerinde tam sayı göster
        if (normalizedUnit is "g" or "gram" or "ml" or "mililitre")
        {
            return $"{Math.Round(amount):F0} {unit}";
        }

        // Kilogramda 1'in altıysa grama çevirme veya 2 basamaklı ondalık
        if (normalizedUnit is "kg" or "kilogram")
        {
            return amount < 1
                ? $"{Math.Round(amount * 1000):F0} g"
                : $"{amount:0.##} kg";
        }

        // Kaşık ve adet birimlerinde kesirli veya temiz ondalık
        if (amount % 1 == 0)
        {
            return $"{amount:0} {unit}".Trim();
        }

        var fractional = amount % 1;
        var whole = (int)amount;

        string fracString = Math.Abs(fractional - 0.5m) < 0.05m ? "½"
            : Math.Abs(fractional - 0.25m) < 0.05m ? "¼"
            : Math.Abs(fractional - 0.75m) < 0.05m ? "¾"
            : $"{fractional:0.##}";

        if (whole > 0 && (fracString is "½" or "¼" or "¾"))
        {
            return $"{whole} {fracString} {unit}".Trim();
        }

        return $"{amount:0.##} {unit}".Trim();
    }

    private static decimal RoundAppropriately(decimal amount, string unit)
    {
        var normalizedUnit = (unit ?? string.Empty).Trim().ToLower(TrCulture);
        if (normalizedUnit is "g" or "gram" or "ml" or "mililitre")
        {
            return Math.Round(amount, MidpointRounding.AwayFromZero);
        }

        return Math.Round(amount, 2, MidpointRounding.AwayFromZero);
    }
}

