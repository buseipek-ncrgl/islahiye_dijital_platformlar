using Gastronomy.Application.DTOs;
using Gastronomy.Application.Interfaces;
using Gastronomy.Domain.Entities;
using Gastronomy.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gastronomy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecipesController(GastronomyDbContext db, IRecipeScaler scaler, ILogger<RecipesController> logger) : ControllerBase
{
    [HttpGet("{idOrSlug}")]
    [ProducesResponseType(typeof(RecipeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RecipeDto>> GetRecipe(string idOrSlug, CancellationToken ct)
    {
        var recipe = await db.Recipes
            .AsNoTracking()
            .Include(r => r.Dish)
            .Include(r => r.Ingredients)
            .Include(r => r.Steps)
            .FirstOrDefaultAsync(r => r.Id == idOrSlug || r.Slug == idOrSlug, ct);

        if (recipe is null)
        {
            return NotFound(new { message = $"'{idOrSlug}' kimliğine veya slug değerine sahip tarif bulunamadı." });
        }

        var dto = new RecipeDto(
            recipe.Id,
            recipe.DishId,
            recipe.Dish?.Name,
            recipe.Title,
            recipe.Slug,
            recipe.Yield,
            recipe.YieldUnit,
            recipe.AuthorType,
            recipe.AuthorName,
            recipe.AuthorAffiliation,
            recipe.PrepTimeMinutes,
            recipe.CookTimeMinutes,
            recipe.RestTimeMinutes,
            recipe.Difficulty,
            recipe.IsPrimary,
            recipe.VideoUrl,
            recipe.VideoDurationSeconds,
            recipe.CoverImageUrl,
            recipe.Notes,
            recipe.Ingredients.OrderBy(i => i.OrderIndex).Select(i => new RecipeIngredientDto(
                i.Id, i.Name, i.Amount, i.Unit, i.Category, i.Notes, i.IsOptional, i.IsKeyIngredient, i.OrderIndex
            )).ToList(),
            recipe.Steps.OrderBy(s => s.StepNumber).Select(s => new RecipeStepDto(
                s.Id, s.StepNumber, s.Title, s.Instruction, s.Tip, s.DurationMinutes, s.ImageUrl, s.VideoTimestampSeconds
            )).ToList()
        );

        return Ok(dto);
    }

    [HttpGet("{idOrSlug}/scale")]
    [ProducesResponseType(typeof(ScaledRecipeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ScaledRecipeDto>> GetScaledRecipe(string idOrSlug, [FromQuery] int servings = 4, CancellationToken ct = default)
    {
        if (servings < 1 || servings > 100)
        {
            return BadRequest(new { message = "Porsiyon miktarı 1 ile 100 arasında olmalıdır." });
        }

        var recipe = await db.Recipes
            .AsNoTracking()
            .Include(r => r.Dish)
            .Include(r => r.Ingredients)
            .Include(r => r.Steps)
            .FirstOrDefaultAsync(r => r.Id == idOrSlug || r.Slug == idOrSlug, ct);

        if (recipe is null)
        {
            return NotFound(new { message = $"'{idOrSlug}' kimlikli tarif bulunamadı." });
        }

        var baseDto = new RecipeDto(
            recipe.Id,
            recipe.DishId,
            recipe.Dish?.Name,
            recipe.Title,
            recipe.Slug,
            recipe.Yield,
            recipe.YieldUnit,
            recipe.AuthorType,
            recipe.AuthorName,
            recipe.AuthorAffiliation,
            recipe.PrepTimeMinutes,
            recipe.CookTimeMinutes,
            recipe.RestTimeMinutes,
            recipe.Difficulty,
            recipe.IsPrimary,
            recipe.VideoUrl,
            recipe.VideoDurationSeconds,
            recipe.CoverImageUrl,
            recipe.Notes,
            recipe.Ingredients.OrderBy(i => i.OrderIndex).Select(i => new RecipeIngredientDto(
                i.Id, i.Name, i.Amount, i.Unit, i.Category, i.Notes, i.IsOptional, i.IsKeyIngredient, i.OrderIndex
            )).ToList(),
            recipe.Steps.OrderBy(s => s.StepNumber).Select(s => new RecipeStepDto(
                s.Id, s.StepNumber, s.Title, s.Instruction, s.Tip, s.DurationMinutes, s.ImageUrl, s.VideoTimestampSeconds
            )).ToList()
        );

        var scaled = scaler.ScaleRecipe(baseDto, servings);
        return Ok(scaled);
    }

    [HttpPost]
    [ProducesResponseType(typeof(RecipeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RecipeDto>> CreateRecipe([FromBody] CreateRecipeDto dto, CancellationToken ct)
    {
        var dishExists = await db.Dishes.AnyAsync(d => d.Id == dto.DishId, ct);
        if (!dishExists)
        {
            return BadRequest(new { message = $"DishId '{dto.DishId}' ile eşleşen yemek bulunamadı." });
        }

        if (await db.Recipes.AnyAsync(r => r.Slug == dto.Slug, ct))
        {
            return BadRequest(new { message = $"'{dto.Slug}' slug değeri zaten kullanılıyor." });
        }

        var recipe = new Recipe
        {
            DishId = dto.DishId,
            Title = dto.Title,
            Slug = dto.Slug,
            Yield = dto.Yield,
            YieldUnit = dto.YieldUnit,
            AuthorType = dto.AuthorType,
            AuthorName = dto.AuthorName,
            AuthorAffiliation = dto.AuthorAffiliation,
            PrepTimeMinutes = dto.PrepTimeMinutes,
            CookTimeMinutes = dto.CookTimeMinutes,
            RestTimeMinutes = dto.RestTimeMinutes,
            Difficulty = dto.Difficulty,
            IsPrimary = dto.IsPrimary,
            VideoUrl = dto.VideoUrl,
            VideoDurationSeconds = dto.VideoDurationSeconds,
            CoverImageUrl = dto.CoverImageUrl,
            Notes = dto.Notes
        };

        foreach (var ing in dto.Ingredients)
        {
            recipe.Ingredients.Add(new RecipeIngredient
            {
                RecipeId = recipe.Id,
                Name = ing.Name,
                Amount = ing.Amount,
                Unit = ing.Unit,
                Category = ing.Category,
                Notes = ing.Notes,
                IsOptional = ing.IsOptional,
                IsKeyIngredient = ing.IsKeyIngredient,
                OrderIndex = ing.OrderIndex
            });
        }

        foreach (var step in dto.Steps)
        {
            recipe.Steps.Add(new RecipeStep
            {
                RecipeId = recipe.Id,
                StepNumber = step.StepNumber,
                Title = step.Title,
                Instruction = step.Instruction,
                Tip = step.Tip,
                DurationMinutes = step.DurationMinutes,
                ImageUrl = step.ImageUrl,
                VideoTimestampSeconds = step.VideoTimestampSeconds
            });
        }

        db.Recipes.Add(recipe);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Yeni tarif eklendi: {Id} - {Title}", recipe.Id, recipe.Title);

        return CreatedAtAction(nameof(GetRecipe), new { idOrSlug = recipe.Id }, new RecipeDto(
            recipe.Id, recipe.DishId, null, recipe.Title, recipe.Slug, recipe.Yield, recipe.YieldUnit,
            recipe.AuthorType, recipe.AuthorName, recipe.AuthorAffiliation, recipe.PrepTimeMinutes,
            recipe.CookTimeMinutes, recipe.RestTimeMinutes, recipe.Difficulty, recipe.IsPrimary,
            recipe.VideoUrl, recipe.VideoDurationSeconds, recipe.CoverImageUrl, recipe.Notes,
            recipe.Ingredients.Select(i => new RecipeIngredientDto(i.Id, i.Name, i.Amount, i.Unit, i.Category, i.Notes, i.IsOptional, i.IsKeyIngredient, i.OrderIndex)).ToList(),
            recipe.Steps.Select(s => new RecipeStepDto(s.Id, s.StepNumber, s.Title, s.Instruction, s.Tip, s.DurationMinutes, s.ImageUrl, s.VideoTimestampSeconds)).ToList()
        ));
    }
}

