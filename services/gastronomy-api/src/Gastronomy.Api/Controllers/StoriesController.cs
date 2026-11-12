using Gastronomy.Application.DTOs;
using Gastronomy.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gastronomy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StoriesController(GastronomyDbContext db) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<CulturalHeritageStoryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CulturalHeritageStoryDto>>> GetStories(CancellationToken ct)
    {
        var stories = await db.Stories
            .AsNoTracking()
            .OrderBy(s => s.OrderIndex)
            .ThenBy(s => s.Title)
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

        return Ok(stories);
    }

    [HttpGet("{idOrSlug}")]
    [ProducesResponseType(typeof(CulturalHeritageStoryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CulturalHeritageStoryDto>> GetStory(string idOrSlug, CancellationToken ct)
    {
        var story = await db.Stories
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == idOrSlug || s.Slug == idOrSlug, ct);

        if (story is null)
        {
            return NotFound(new { message = $"'{idOrSlug}' kimlikli kültürel hikâye bulunamadı." });
        }

        var dto = new CulturalHeritageStoryDto(
            story.Id,
            story.Slug,
            story.Title,
            story.Subtitle,
            story.Theme,
            story.ThemeLabel,
            story.Summary,
            story.Content,
            story.CoverImageUrl,
            string.IsNullOrWhiteSpace(story.RelatedDishIds)
                ? []
                : story.RelatedDishIds.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList(),
            story.AuthorOrSource,
            story.ReadTimeMinutes,
            story.IsFeatured,
            story.OrderIndex
        );

        return Ok(dto);
    }

    [HttpPost]
    [ProducesResponseType(typeof(CulturalHeritageStoryDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<CulturalHeritageStoryDto>> CreateStory([FromBody] CreateStoryDto dto, CancellationToken ct)
    {
        var storyId = !string.IsNullOrWhiteSpace(dto.Id) ? dto.Id : Guid.NewGuid().ToString("N");
        var slug = !string.IsNullOrWhiteSpace(dto.Slug)
            ? dto.Slug
            : dto.Title.ToLowerInvariant().Replace(' ', '-').Replace('ş', 's').Replace('ı', 'i').Replace('ğ', 'g').Replace('ü', 'u').Replace('ö', 'o').Replace('ç', 'c');

        var entity = new Gastronomy.Domain.Entities.CulturalHeritageStory
        {
            Id = storyId,
            Slug = slug,
            Title = dto.Title,
            Subtitle = dto.Subtitle,
            Theme = dto.Theme,
            ThemeLabel = dto.ThemeLabel,
            Summary = dto.Summary,
            Content = dto.Content,
            CoverImageUrl = dto.CoverImageUrl,
            RelatedDishIds = dto.RelatedDishIds != null && dto.RelatedDishIds.Count > 0 ? string.Join(',', dto.RelatedDishIds) : null,
            AuthorOrSource = dto.AuthorOrSource,
            ReadTimeMinutes = dto.ReadTimeMinutes,
            IsFeatured = dto.IsFeatured,
            OrderIndex = dto.OrderIndex,
        };

        db.Stories.Add(entity);
        await db.SaveChangesAsync(ct);

        var resultDto = new CulturalHeritageStoryDto(
            entity.Id,
            entity.Slug,
            entity.Title,
            entity.Subtitle,
            entity.Theme,
            entity.ThemeLabel,
            entity.Summary,
            entity.Content,
            entity.CoverImageUrl,
            dto.RelatedDishIds ?? [],
            entity.AuthorOrSource,
            entity.ReadTimeMinutes,
            entity.IsFeatured,
            entity.OrderIndex
        );

        return CreatedAtAction(nameof(GetStory), new { idOrSlug = entity.Id }, resultDto);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStory(string id, [FromBody] UpdateStoryDto dto, CancellationToken ct)
    {
        var story = await db.Stories.FirstOrDefaultAsync(s => s.Id == id || s.Slug == id, ct);
        if (story is null)
        {
            return NotFound(new { message = $"'{id}' kimlikli hikâye bulunamadı." });
        }

        story.Title = dto.Title;
        story.Subtitle = dto.Subtitle;
        story.Theme = dto.Theme;
        story.ThemeLabel = dto.ThemeLabel;
        story.Summary = dto.Summary;
        story.Content = dto.Content;
        story.CoverImageUrl = dto.CoverImageUrl;
        story.RelatedDishIds = dto.RelatedDishIds != null && dto.RelatedDishIds.Count > 0 ? string.Join(',', dto.RelatedDishIds) : null;
        story.AuthorOrSource = dto.AuthorOrSource;
        story.ReadTimeMinutes = dto.ReadTimeMinutes;
        story.IsFeatured = dto.IsFeatured;
        story.OrderIndex = dto.OrderIndex;

        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteStory(string id, CancellationToken ct)
    {
        var story = await db.Stories.FirstOrDefaultAsync(s => s.Id == id || s.Slug == id, ct);
        if (story is null)
        {
            return NotFound(new { message = $"'{id}' kimlikli hikâye bulunamadı." });
        }

        db.Stories.Remove(story);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}

