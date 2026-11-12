using Gastronomy.Application.DTOs;
using Gastronomy.Domain;
using Gastronomy.Domain.Entities;
using Gastronomy.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gastronomy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DishesController(GastronomyDbContext db, ILogger<DishesController> logger) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<DishSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<DishSummaryDto>>> GetDishes([FromQuery] DishFilterParams filters, CancellationToken ct)
    {
        var query = db.Dishes.AsNoTracking();

        if (filters.IncludeAll != true)
        {
            query = query.Where(d => d.PublicationStatus == PublicationStatus.Published);
        }

        if (!string.IsNullOrWhiteSpace(filters.Search))
        {
            var searchLower = filters.Search.Trim().ToLower();
            query = query.Where(d => d.Name.ToLower().Contains(searchLower)
                                  || d.Tagline.ToLower().Contains(searchLower)
                                  || d.ShortDescription.ToLower().Contains(searchLower));
        }

        if (filters.Category.HasValue)
        {
            query = query.Where(d => d.Category == filters.Category.Value);
        }

        if (filters.GeographicalIndicationOnly.HasValue && filters.GeographicalIndicationOnly.Value)
        {
            query = query.Where(d => d.IsRegisteredGeographicalIndication);
        }

        if (!string.IsNullOrWhiteSpace(filters.Difficulty))
        {
            var diff = filters.Difficulty.Trim().ToLower();
            query = query.Where(d => d.Difficulty.ToLower() == diff);
        }

        var dishes = await query
            .OrderBy(d => d.OrderIndex)
            .ThenBy(d => d.Name)
            .Select(d => new DishSummaryDto(
                d.Id,
                d.Slug,
                d.Name,
                d.AlternativeNames,
                d.Category,
                d.CategoryLabel,
                d.Tagline,
                d.ShortDescription,
                d.IsRegisteredGeographicalIndication,
                d.GiRegistrationNumber,
                d.GiStatusNote,
                d.PrepTimeMinutes,
                d.CookTimeMinutes,
                d.Difficulty,
                d.DefaultServings,
                d.ImageUrl,
                d.ImageAlt,
                d.ImageCredit,
                d.IsLead,
                d.OrderIndex,
                d.Recipes.Count
            ))
            .ToListAsync(ct);

        return Ok(dishes);
    }

    [HttpGet("{idOrSlug}")]
    [ProducesResponseType(typeof(DishDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DishDto>> GetDish(string idOrSlug, CancellationToken ct)
    {
        var dish = await db.Dishes
            .AsNoTracking()
            .Include(d => d.Recipes)
                .ThenInclude(r => r.Ingredients)
            .Include(d => d.Recipes)
                .ThenInclude(r => r.Steps)
            .FirstOrDefaultAsync(d => d.Id == idOrSlug || d.Slug == idOrSlug, ct);

        if (dish is null)
        {
            return NotFound(new { message = $"'{idOrSlug}' kimliğine veya slug değerine sahip yemek bulunamadı." });
        }

        var dto = new DishDto(
            dish.Id,
            dish.Slug,
            dish.Name,
            dish.AlternativeNames,
            dish.Category,
            dish.CategoryLabel,
            dish.Tagline,
            dish.ShortDescription,
            dish.Description,
            dish.CulturalNote,
            dish.OriginNote,
            dish.IsRegisteredGeographicalIndication,
            dish.GiRegistrationNumber,
            dish.GiStatusNote,
            dish.SeasonalAvailability,
            dish.PrepTimeMinutes,
            dish.CookTimeMinutes,
            dish.Difficulty,
            dish.DefaultServings,
            dish.ImageUrl,
            dish.ImageAlt,
            dish.ImageCredit,
            dish.IsLead,
            dish.OrderIndex,
            dish.PublicationStatus,
            dish.VerificationStatus,
            dish.CreatedAt,
            dish.Recipes.Select(r => new RecipeSummaryDto(
                r.Id,
                r.DishId,
                r.Title,
                r.Slug,
                r.Yield,
                r.YieldUnit,
                r.AuthorType,
                r.AuthorName,
                r.PrepTimeMinutes,
                r.CookTimeMinutes,
                r.Difficulty,
                r.IsPrimary,
                r.CoverImageUrl,
                r.Ingredients.Count,
                r.Steps.Count
            )).ToList()
        );

        return Ok(dto);
    }

    [HttpGet("{idOrSlug}/recipes")]
    [ProducesResponseType(typeof(List<RecipeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<RecipeDto>>> GetDishRecipes(string idOrSlug, CancellationToken ct)
    {
        var dish = await db.Dishes
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == idOrSlug || d.Slug == idOrSlug, ct);

        if (dish is null)
        {
            return NotFound(new { message = $"'{idOrSlug}' ile eşleşen yemek bulunamadı." });
        }

        var recipes = await db.Recipes
            .AsNoTracking()
            .Where(r => r.DishId == dish.Id)
            .Include(r => r.Ingredients)
            .Include(r => r.Steps)
            .OrderByDescending(r => r.IsPrimary)
            .ThenBy(r => r.Title)
            .Select(r => new RecipeDto(
                r.Id,
                r.DishId,
                dish.Name,
                r.Title,
                r.Slug,
                r.Yield,
                r.YieldUnit,
                r.AuthorType,
                r.AuthorName,
                r.AuthorAffiliation,
                r.PrepTimeMinutes,
                r.CookTimeMinutes,
                r.RestTimeMinutes,
                r.Difficulty,
                r.IsPrimary,
                r.VideoUrl,
                r.VideoDurationSeconds,
                r.CoverImageUrl,
                r.Notes,
                r.Ingredients.OrderBy(i => i.OrderIndex).Select(i => new RecipeIngredientDto(
                    i.Id, i.Name, i.Amount, i.Unit, i.Category, i.Notes, i.IsOptional, i.IsKeyIngredient, i.OrderIndex
                )).ToList(),
                r.Steps.OrderBy(s => s.StepNumber).Select(s => new RecipeStepDto(
                    s.Id, s.StepNumber, s.Title, s.Instruction, s.Tip, s.DurationMinutes, s.ImageUrl, s.VideoTimestampSeconds
                )).ToList()
            ))
            .ToListAsync(ct);

        return Ok(recipes);
    }

    [HttpPost]
    [ProducesResponseType(typeof(DishDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DishDto>> CreateDish([FromBody] CreateDishDto dto, CancellationToken ct)
    {
        if (await db.Dishes.AnyAsync(d => d.Slug == dto.Slug, ct))
        {
            return BadRequest(new { message = $"'{dto.Slug}' slug değeri zaten kullanılıyor." });
        }

        var dish = new Dish
        {
            Slug = dto.Slug,
            Name = dto.Name,
            AlternativeNames = dto.AlternativeNames,
            Category = dto.Category,
            CategoryLabel = dto.CategoryLabel,
            Tagline = dto.Tagline,
            ShortDescription = dto.ShortDescription,
            Description = dto.Description,
            CulturalNote = dto.CulturalNote,
            OriginNote = dto.OriginNote,
            IsRegisteredGeographicalIndication = dto.IsRegisteredGeographicalIndication,
            GiRegistrationNumber = dto.GiRegistrationNumber,
            GiStatusNote = dto.GiStatusNote,
            SeasonalAvailability = dto.SeasonalAvailability,
            PrepTimeMinutes = dto.PrepTimeMinutes,
            CookTimeMinutes = dto.CookTimeMinutes,
            Difficulty = dto.Difficulty,
            DefaultServings = dto.DefaultServings,
            ImageUrl = dto.ImageUrl,
            ImageAlt = dto.ImageAlt,
            ImageCredit = dto.ImageCredit,
            IsLead = dto.IsLead,
            OrderIndex = dto.OrderIndex,
            PublicationStatus = PublicationStatus.Published,
            VerificationStatus = VerificationStatus.Verified
        };

        db.Dishes.Add(dish);
        await db.SaveChangesAsync(ct);
        logger.LogInformation("Yeni yemek eklendi: {Id} - {Name}", dish.Id, dish.Name);

        return CreatedAtAction(nameof(GetDish), new { idOrSlug = dish.Id }, new DishDto(
            dish.Id, dish.Slug, dish.Name, dish.AlternativeNames, dish.Category, dish.CategoryLabel,
            dish.Tagline, dish.ShortDescription, dish.Description, dish.CulturalNote, dish.OriginNote,
            dish.IsRegisteredGeographicalIndication, dish.GiRegistrationNumber, dish.GiStatusNote,
            dish.SeasonalAvailability, dish.PrepTimeMinutes, dish.CookTimeMinutes, dish.Difficulty,
            dish.DefaultServings, dish.ImageUrl, dish.ImageAlt, dish.ImageCredit, dish.IsLead,
            dish.OrderIndex, dish.PublicationStatus, dish.VerificationStatus, dish.CreatedAt, []
        ));
    }

    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateDish(string id, [FromBody] UpdateDishDto dto, CancellationToken ct)
    {
        var dish = await db.Dishes.FirstOrDefaultAsync(d => d.Id == id, ct);
        if (dish is null)
        {
            return NotFound(new { message = $"'{id}' kimlikli yemek bulunamadı." });
        }

        dish.Name = dto.Name;
        dish.AlternativeNames = dto.AlternativeNames;
        dish.Category = dto.Category;
        dish.CategoryLabel = dto.CategoryLabel;
        dish.Tagline = dto.Tagline;
        dish.ShortDescription = dto.ShortDescription;
        dish.Description = dto.Description;
        dish.CulturalNote = dto.CulturalNote;
        dish.OriginNote = dto.OriginNote;
        dish.IsRegisteredGeographicalIndication = dto.IsRegisteredGeographicalIndication;
        dish.GiRegistrationNumber = dto.GiRegistrationNumber;
        dish.GiStatusNote = dto.GiStatusNote;
        dish.SeasonalAvailability = dto.SeasonalAvailability;
        dish.PrepTimeMinutes = dto.PrepTimeMinutes;
        dish.CookTimeMinutes = dto.CookTimeMinutes;
        dish.Difficulty = dto.Difficulty;
        dish.DefaultServings = dto.DefaultServings;
        dish.ImageUrl = dto.ImageUrl;
        dish.ImageAlt = dto.ImageAlt;
        dish.ImageCredit = dto.ImageCredit;
        dish.IsLead = dto.IsLead;
        dish.OrderIndex = dto.OrderIndex;
        dish.PublicationStatus = dto.PublicationStatus;
        dish.VerificationStatus = dto.VerificationStatus;
        dish.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDish(string id, CancellationToken ct)
    {
        var dish = await db.Dishes.FirstOrDefaultAsync(d => d.Id == id, ct);
        if (dish is null)
        {
            return NotFound(new { message = $"'{id}' kimlikli yemek bulunamadı." });
        }

        db.Dishes.Remove(dish);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}

