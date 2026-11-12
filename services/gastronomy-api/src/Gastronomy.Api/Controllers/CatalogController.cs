using Gastronomy.Application.DTOs;
using Gastronomy.Domain;
using Gastronomy.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gastronomy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CatalogController(GastronomyDbContext db) : ControllerBase
{
    [HttpGet("overview")]
    [ProducesResponseType(typeof(CatalogOverviewDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CatalogOverviewDto>> GetOverview(CancellationToken ct)
    {
        var totalDishes = await db.Dishes.CountAsync(d => d.PublicationStatus == PublicationStatus.Published, ct);
        var totalRecipes = await db.Recipes.CountAsync(ct);
        var totalGi = await db.Dishes.CountAsync(d => d.IsRegisteredGeographicalIndication, ct);
        var totalPlaces = await db.Places.CountAsync(p => p.VerificationStatus == PlaceVerificationStatus.Verified, ct);
        var totalArtisans = await db.Artisans.CountAsync(ct);
        var totalStories = await db.Stories.CountAsync(ct);
        var totalFilms = await db.Films.CountAsync(ct);

        var leadDishes = await db.Dishes
            .AsNoTracking()
            .Where(d => d.PublicationStatus == PublicationStatus.Published && d.IsLead)
            .OrderBy(d => d.OrderIndex)
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

        var recommendedPlaces = await db.Places
            .AsNoTracking()
            .Where(p => p.IsRecommended && p.HasVerifiedCoordinates)
            .OrderBy(p => p.OrderIndex)
            .Select(p => new GastronomyPlaceDto(
                p.Id,
                p.Slug,
                p.Name,
                p.Category,
                p.CategoryLabel,
                p.Description,
                p.ShortAddress,
                p.FullAddress,
                p.District,
                p.Neighborhood,
                p.Phone,
                p.OpeningHours,
                p.Latitude,
                p.Longitude,
                p.HasVerifiedCoordinates,
                p.VerificationStatus,
                p.VerificationSource,
                p.CoverImageUrl,
                string.IsNullOrWhiteSpace(p.SignatureDishIds)
                    ? new List<string>()
                    : p.SignatureDishIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList(),
                p.IsRecommended,
                p.OrderIndex
            ))
            .ToListAsync(ct);

        var featuredStories = await db.Stories
            .AsNoTracking()
            .Where(s => s.IsFeatured)
            .OrderBy(s => s.OrderIndex)
            .Select(s => new CulturalHeritageStoryDto(
                s.Id,
                s.Slug,
                s.Title,
                s.Subtitle,
                s.Theme,
                s.ThemeLabel,
                s.Summary,
                s.Content,
                s.CoverImageUrl,
                string.IsNullOrWhiteSpace(s.RelatedDishIds)
                    ? new List<string>()
                    : s.RelatedDishIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList(),
                s.AuthorOrSource,
                s.ReadTimeMinutes,
                s.IsFeatured,
                s.OrderIndex
            ))
            .ToListAsync(ct);

        var overview = new CatalogOverviewDto(
            TotalDishes: totalDishes,
            TotalRecipes: totalRecipes,
            TotalRegisteredGeographicalIndications: totalGi,
            TotalVerifiedPlaces: totalPlaces,
            TotalArtisans: totalArtisans,
            TotalHeritageStories: totalStories,
            TotalFilms: totalFilms,
            LeadDishes: leadDishes,
            RecommendedPlaces: recommendedPlaces,
            FeaturedStories: featuredStories
        );

        return Ok(overview);
    }
}

