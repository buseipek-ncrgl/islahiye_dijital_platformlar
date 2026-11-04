using Education.Application;
using Education.Domain;
using Education.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Education.Api.Controllers;

[ApiController, Route("api/v1/announcements")]
public sealed class AnnouncementsController(EducationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AnnouncementResponse>>> List([FromQuery] string? role, [FromQuery] bool activeOnly = true)
    {
        var query = db.Announcements.AsNoTracking().AsQueryable();
        if (activeOnly) query = query.Where(x => x.IsActive);
        if (!string.IsNullOrWhiteSpace(role)) query = query.Where(x => x.TargetRole == "All" || x.TargetRole == role);

        var list = await query.OrderByDescending(x => x.CreatedAt).ToListAsync();
        return Ok(list.Select(x => new AnnouncementResponse(
            x.Id,
            x.Title,
            x.Content,
            x.TargetRole,
            x.Priority,
            x.IsActive,
            x.CreatedByUserId,
            x.CreatedAt
        )).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<AnnouncementResponse>> Create(AnnouncementWriteRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "admin";

        var item = new AnnouncementEntity
        {
            Title = request.Title.Trim(),
            Content = request.Content.Trim(),
            TargetRole = request.TargetRole,
            Priority = request.Priority,
            IsActive = request.IsActive,
            CreatedByUserId = userId
        };

        db.Announcements.Add(item);
        await db.SaveChangesAsync();

        return Created($"/api/v1/announcements/{item.Id}", new AnnouncementResponse(
            item.Id,
            item.Title,
            item.Content,
            item.TargetRole,
            item.Priority,
            item.IsActive,
            item.CreatedByUserId,
            item.CreatedAt
        ));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await db.Announcements.FindAsync(id);
        if (item is null) return NotFound();

        db.Announcements.Remove(item);
        await db.SaveChangesAsync();
        return NoContent();
    }
}

[ApiController, Route("api/v1/notifications")]
public sealed class NotificationsController(EducationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<NotificationResponse>>> List([FromQuery] string? userId)
    {
        var targetUser = userId ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "demo-user";

        var list = await db.Notifications.AsNoTracking()
            .Where(x => x.UserId == targetUser)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(list.Select(x => new NotificationResponse(
            x.Id,
            x.UserId,
            x.Title,
            x.Message,
            x.Type,
            x.Link,
            x.IsRead,
            x.CreatedAt
        )).ToList());
    }

    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var item = await db.Notifications.FindAsync(id);
        if (item is null) return NotFound();

        item.IsRead = true;
        await db.SaveChangesAsync();
        return NoContent();
    }
}

