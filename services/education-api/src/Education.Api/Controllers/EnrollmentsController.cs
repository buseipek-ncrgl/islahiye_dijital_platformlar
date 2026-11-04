using Education.Application;
using Education.Domain;
using Education.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Education.Api.Controllers;

[ApiController, Route("api/v1/enrollments")]
public sealed class EnrollmentsController(EducationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<EnrollmentResponse>>> List(
        [FromQuery] Guid? programId,
        [FromQuery] Guid? termId,
        [FromQuery] Guid? groupId,
        [FromQuery] string? studentId,
        [FromQuery] EnrollmentStatus? status)
    {
        var query = db.Enrollments.AsNoTracking().AsQueryable();

        if (programId.HasValue) query = query.Where(x => x.ProgramId == programId.Value);
        if (termId.HasValue) query = query.Where(x => x.TermId == termId.Value);
        if (groupId.HasValue) query = query.Where(x => x.GroupId == groupId.Value);
        if (!string.IsNullOrWhiteSpace(studentId)) query = query.Where(x => x.StudentUserId == studentId);
        if (status.HasValue) query = query.Where(x => x.Status == status.Value);

        var list = await query.OrderByDescending(x => x.EnrolledAt).ToListAsync();
        var programs = await db.Programs.ToDictionaryAsync(x => x.Id, x => x.Name);
        var terms = await db.Terms.ToDictionaryAsync(x => x.Id, x => x.Name);
        var groups = await db.Groups.ToDictionaryAsync(x => x.Id, x => x.Name);

        return Ok(list.Select(x => Map(x, programs.GetValueOrDefault(x.ProgramId, ""), terms.GetValueOrDefault(x.TermId, ""), x.GroupId.HasValue ? groups.GetValueOrDefault(x.GroupId.Value, "") : null)).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<EnrollmentResponse>> Create(EnrollmentWriteRequest request)
    {
        var count = await db.Enrollments.CountAsync();
        var enrollmentNumber = $"KAY-{DateTime.UtcNow.Year}-{(count + 1):D4}";

        var item = new EnrollmentEntity
        {
            ApplicationId = request.ApplicationId,
            StudentUserId = request.StudentUserId,
            StudentName = request.StudentName.Trim(),
            StudentEmail = request.StudentEmail.Trim(),
            ProgramId = request.ProgramId,
            TermId = request.TermId,
            GroupId = request.GroupId,
            EnrollmentNumber = enrollmentNumber,
            Status = EnrollmentStatus.Active,
            EnrolledAt = DateTime.UtcNow
        };

        db.Enrollments.Add(item);
        db.AuditLogs.Add(new AuditLog
        {
            UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            Action = "enrollment.create",
            EntityType = "Enrollment",
            EntityId = item.Id.ToString(),
            Detail = $"Kayıt açıldı: {enrollmentNumber} ({item.StudentName})"
        });

        await db.SaveChangesAsync();

        var program = await db.Programs.FindAsync(item.ProgramId);
        var term = await db.Terms.FindAsync(item.TermId);
        string? groupName = null;
        if (item.GroupId.HasValue)
        {
            var g = await db.Groups.FindAsync(item.GroupId.Value);
            groupName = g?.Name;
        }

        return Created($"/api/v1/enrollments/{item.Id}", Map(item, program?.Name ?? "", term?.Name ?? "", groupName));
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<EnrollmentResponse>> UpdateStatus(Guid id, EnrollmentStatusUpdateRequest request)
    {
        var item = await db.Enrollments.FindAsync(id);
        if (item is null) return NotFound();

        item.Status = request.Status;
        if (request.Status == EnrollmentStatus.Completed) item.CompletedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();

        var program = await db.Programs.FindAsync(item.ProgramId);
        var term = await db.Terms.FindAsync(item.TermId);
        string? groupName = null;
        if (item.GroupId.HasValue)
        {
            var g = await db.Groups.FindAsync(item.GroupId.Value);
            groupName = g?.Name;
        }

        return Ok(Map(item, program?.Name ?? "", term?.Name ?? "", groupName));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await db.Enrollments.FindAsync(id);
        if (item is null) return NotFound();

        db.Enrollments.Remove(item);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static EnrollmentResponse Map(EnrollmentEntity x, string programName, string termName, string? groupName) =>
        new(
            x.Id,
            x.ApplicationId,
            x.StudentUserId,
            x.StudentName,
            x.StudentEmail,
            x.ProgramId,
            programName,
            x.TermId,
            termName,
            x.GroupId,
            groupName,
            x.EnrollmentNumber,
            x.Status,
            x.EnrolledAt,
            x.CompletedAt
        );
}

