using Gastronomy.Application.DTOs;
using Gastronomy.Domain;
using Gastronomy.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gastronomy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlacesController(GastronomyDbContext db) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<GastronomyPlaceDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<GastronomyPlaceDto>>> GetPlaces([FromQuery] PlaceFilterParams filters, CancellationToken ct)
    {
        var query = db.Places.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(filters.Search))
        {
            var searchLower = filters.Search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(searchLower)
                                  || p.Description.ToLower().Contains(searchLower)
                                  || p.Neighborhood.ToLower().Contains(searchLower));
        }

        if (filters.Category.HasValue)
        {
            query = query.Where(p => p.Category == filters.Category.Value);
        }

        if (filters.VerifiedOnly.HasValue && filters.VerifiedOnly.Value)
        {
            query = query.Where(p => p.VerificationStatus == PlaceVerificationStatus.Verified && p.HasVerifiedCoordinates);
        }

        if (filters.RecommendedOnly.HasValue && filters.RecommendedOnly.Value)
        {
            query = query.Where(p => p.IsRecommended);
        }

        var places = await query
            .OrderBy(p => p.OrderIndex)
            .ThenBy(p => p.Name)
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

        return Ok(places);
    }

    [HttpGet("{idOrSlug}")]
    [ProducesResponseType(typeof(GastronomyPlaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GastronomyPlaceDto>> GetPlace(string idOrSlug, CancellationToken ct)
    {
        var place = await db.Places
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == idOrSlug || p.Slug == idOrSlug, ct);

        if (place is null)
        {
            return NotFound(new { message = $"'{idOrSlug}' kimlikli mekan bulunamadı." });
        }

        var dto = new GastronomyPlaceDto(
            place.Id,
            place.Slug,
            place.Name,
            place.Category,
            place.CategoryLabel,
            place.Description,
            place.ShortAddress,
            place.FullAddress,
            place.District,
            place.Neighborhood,
            place.Phone,
            place.OpeningHours,
            place.Latitude,
            place.Longitude,
            place.HasVerifiedCoordinates,
            place.VerificationStatus,
            place.VerificationSource,
            place.CoverImageUrl,
            string.IsNullOrWhiteSpace(place.SignatureDishIds)
                ? []
                : place.SignatureDishIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList(),
            place.IsRecommended,
            place.OrderIndex
        );

        return Ok(dto);
    }

    [HttpGet("map")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetMapPoints(CancellationToken ct)
    {
        // Yalnızca doğrulanmış fiziksel koordinatı olan mekanları harita katmanına ver
        var points = await db.Places
            .AsNoTracking()
            .Where(p => p.HasVerifiedCoordinates && p.VerificationStatus == PlaceVerificationStatus.Verified)
            .OrderBy(p => p.OrderIndex)
            .Select(p => new
            {
                p.Id,
                p.Slug,
                p.Name,
                p.Category,
                p.CategoryLabel,
                p.ShortAddress,
                p.Latitude,
                p.Longitude,
                p.CoverImageUrl,
                p.IsRecommended
            })
            .ToListAsync(ct);

        return Ok(new
        {
            type = "PointCollection",
            count = points.Count,
            center = new { lat = 37.025, lng = 36.633 }, // İslahiye Merkez
            points
        });
    }

    [HttpPost]
    [ProducesResponseType(typeof(GastronomyPlaceDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<GastronomyPlaceDto>> CreatePlace([FromBody] CreatePlaceDto dto, CancellationToken ct)
    {
        var placeId = !string.IsNullOrWhiteSpace(dto.Id) ? dto.Id : Guid.NewGuid().ToString("N");
        var slug = !string.IsNullOrWhiteSpace(dto.Slug)
            ? dto.Slug
            : dto.Name.ToLowerInvariant().Replace(' ', '-').Replace('ş', 's').Replace('ı', 'i').Replace('ğ', 'g').Replace('ü', 'u').Replace('ö', 'o').Replace('ç', 'c');

        var entity = new Gastronomy.Domain.Entities.GastronomyPlace
        {
            Id = placeId,
            Slug = slug,
            Name = dto.Name,
            Category = dto.Category,
            CategoryLabel = dto.CategoryLabel,
            Description = dto.Description,
            ShortAddress = dto.ShortAddress,
            FullAddress = dto.FullAddress,
            District = dto.District,
            Neighborhood = dto.Neighborhood,
            Phone = dto.Phone,
            OpeningHours = dto.OpeningHours,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            HasVerifiedCoordinates = dto.HasVerifiedCoordinates,
            VerificationStatus = dto.VerificationStatus,
            VerificationSource = dto.VerificationSource,
            CoverImageUrl = dto.CoverImageUrl,
            SignatureDishIds = dto.SignatureDishIds != null && dto.SignatureDishIds.Count > 0 ? string.Join(',', dto.SignatureDishIds) : null,
            IsRecommended = dto.IsRecommended,
            OrderIndex = dto.OrderIndex,
        };

        db.Places.Add(entity);
        await db.SaveChangesAsync(ct);

        var resultDto = new GastronomyPlaceDto(
            entity.Id,
            entity.Slug,
            entity.Name,
            entity.Category,
            entity.CategoryLabel,
            entity.Description,
            entity.ShortAddress,
            entity.FullAddress,
            entity.District,
            entity.Neighborhood,
            entity.Phone,
            entity.OpeningHours,
            entity.Latitude,
            entity.Longitude,
            entity.HasVerifiedCoordinates,
            entity.VerificationStatus,
            entity.VerificationSource,
            entity.CoverImageUrl,
            dto.SignatureDishIds ?? [],
            entity.IsRecommended,
            entity.OrderIndex
        );

        return CreatedAtAction(nameof(GetPlace), new { idOrSlug = entity.Id }, resultDto);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePlace(string id, [FromBody] UpdatePlaceDto dto, CancellationToken ct)
    {
        var place = await db.Places.FirstOrDefaultAsync(p => p.Id == id || p.Slug == id, ct);
        if (place is null)
        {
            return NotFound(new { message = $"'{id}' kimlikli mekan bulunamadı." });
        }

        place.Name = dto.Name;
        place.Category = dto.Category;
        place.CategoryLabel = dto.CategoryLabel;
        place.Description = dto.Description;
        place.ShortAddress = dto.ShortAddress;
        place.FullAddress = dto.FullAddress;
        place.District = dto.District;
        place.Neighborhood = dto.Neighborhood;
        place.Phone = dto.Phone;
        place.OpeningHours = dto.OpeningHours;
        place.Latitude = dto.Latitude;
        place.Longitude = dto.Longitude;
        place.HasVerifiedCoordinates = dto.HasVerifiedCoordinates;
        place.VerificationStatus = dto.VerificationStatus;
        place.VerificationSource = dto.VerificationSource;
        place.CoverImageUrl = dto.CoverImageUrl;
        place.SignatureDishIds = dto.SignatureDishIds != null && dto.SignatureDishIds.Count > 0 ? string.Join(',', dto.SignatureDishIds) : null;
        place.IsRecommended = dto.IsRecommended;
        place.OrderIndex = dto.OrderIndex;

        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePlace(string id, CancellationToken ct)
    {
        var place = await db.Places.FirstOrDefaultAsync(p => p.Id == id || p.Slug == id, ct);
        if (place is null)
        {
            return NotFound(new { message = $"'{id}' kimlikli mekan bulunamadı." });
        }

        db.Places.Remove(place);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}

