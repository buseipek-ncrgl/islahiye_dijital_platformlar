using Gastronomy.Application.DTOs;

namespace Gastronomy.Application.Interfaces;

public interface IRecipeScaler
{
    ScaledRecipeDto ScaleRecipe(RecipeDto recipe, int requestedServings);
    string FormatIngredientAmount(decimal amount, string unit);
}

