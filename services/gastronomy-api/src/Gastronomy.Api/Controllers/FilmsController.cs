using Gastronomy.Application.DTOs;
using Gastronomy.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gastronomy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FilmsController(GastronomyDbContext db) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<GastronomyFilmDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<GastronomyFilmDto>>> GetFilms(CancellationToken ct)
    {
        var films = await db.Films
            .AsNoTracking()
            .OrderBy(f => f.EpisodeNumber)
            .ThenBy(f => f.OrderIndex)
            .Select(f => new GastronomyFilmDto(
                f.Id,
                f.Slug,
                f.EpisodeNumber,
                f.Title,
                f.Subtitle,
                f.Description,
                f.DurationSeconds,
                f.VideoUrl,
                f.ThumbnailUrl,
                f.Theme,
                f.FeaturedDishId,
                f.FeaturedArtisanId,
                f.IsFeatured,
                f.OrderIndex
            ))
            .ToListAsync(ct);

        return Ok(films);
    }

    [HttpGet("{idOrSlug}")]
    [ProducesResponseType(typeof(GastronomyFilmDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GastronomyFilmDto>> GetFilm(string idOrSlug, CancellationToken ct)
    {
        var film = await db.Films
            .AsNoTracking()
            .FirstOrDefaultAsync(f => f.Id == idOrSlug || f.Slug == idOrSlug, ct);

        if (film is null)
        {
            return NotFound(new { message = $"'{idOrSlug}' kimlikli film veya klip bulunamadı." });
        }

        var dto = new GastronomyFilmDto(
            film.Id,
            film.Slug,
            film.EpisodeNumber,
            film.Title,
            film.Subtitle,
            film.Description,
            film.DurationSeconds,
            film.VideoUrl,
            film.ThumbnailUrl,
            film.Theme,
            film.FeaturedDishId,
            film.FeaturedArtisanId,
            film.IsFeatured,
            film.OrderIndex
        );

        return Ok(dto);
    }
}

