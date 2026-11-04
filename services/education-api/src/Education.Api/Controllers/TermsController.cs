using Education.Api.Security;
using Education.Application;
using Education.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Education.Api.Controllers;

[ApiController, Route("api/v1/terms")]
public sealed class TermsController(EducationDbContext db) : ControllerBase
{
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TermResponse>> Get(Guid id)
    {
        var item = await db.Terms.FindAsync(id);
        return item is null ? NotFound() : Ok(ProgramsController.MapTerm(item));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TermResponse>> Update(Guid id, TermWriteRequest request)
    {
        var item = await db.Terms.SingleOrDefaultAsync(x => x.Id == id);
        if (item is null) return NotFound();

        item.Update(request.Name, request.StartDate, request.EndDate, request.ApplicationStartAt, request.ApplicationEndAt, request.Capacity);
        item.ChangeStatus(request.Status);

        db.AuditLogs.Add(new() { UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value, Action = "term.update", EntityType = "Term", EntityId = id.ToString() });
        await db.SaveChangesAsync();

        return Ok(ProgramsController.MapTerm(item));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await db.Terms.FindAsync(id);
        if (item is null) return NotFound();

        db.Terms.Remove(item);
        db.AuditLogs.Add(new() { UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value, Action = "term.delete", EntityType = "Term", EntityId = id.ToString() });
        await db.SaveChangesAsync();
        return NoContent();
    }
}
