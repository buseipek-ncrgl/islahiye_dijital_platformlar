using Gastronomy.Application.DTOs;
using Gastronomy.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gastronomy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NewsEventsController(GastronomyDbContext db) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<NewsEventDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<NewsEventDto>>> GetNewsEvents(CancellationToken ct)
    {
        var items = await db.NewsEvents
            .AsNoTracking()
            .Where(n => n.IsPublished)
            .OrderByDescending(n => n.PublishedAt)
            .Select(n => new NewsEventDto(
                n.Id,
                n.Slug,
                n.Title,
                n.Type,
                n.Summary,
                n.Content,
                n.CoverImageUrl,
                n.PublishedAt,
                n.EventDate,
                n.Location,
                n.IsPublished
            ))
            .ToListAsync(ct);

        return Ok(items);
    }

    [HttpGet("{idOrSlug}")]
    [ProducesResponseType(typeof(NewsEventDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<NewsEventDto>> GetNewsEvent(string idOrSlug, CancellationToken ct)
    {
        var item = await db.NewsEvents
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.Id == idOrSlug || n.Slug == idOrSlug, ct);

        if (item is null)
        {
            return NotFound(new { message = $"'{idOrSlug}' kimlikli haber/etkinlik bulunamadı." });
        }

        var dto = new NewsEventDto(
            item.Id,
            item.Slug,
            item.Title,
            item.Type,
            item.Summary,
            item.Content,
            item.CoverImageUrl,
            item.PublishedAt,
            item.EventDate,
            item.Location,
            item.IsPublished
        );

        return Ok(dto);
    }
}

