using Education.Application;
using Education.Domain;
using Education.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Education.Api.Controllers;

[ApiController, Route("api/v1/success-decisions")]
public sealed class SuccessDecisionsController(EducationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SuccessDecisionResponse>>> List(
        [FromQuery] Guid? programId,
        [FromQuery] Guid? termId,
        [FromQuery] string? studentId)
    {
        var query = db.SuccessDecisions.AsNoTracking().AsQueryable();

        if (programId.HasValue) query = query.Where(x => x.ProgramId == programId.Value);
        if (termId.HasValue) query = query.Where(x => x.TermId == termId.Value);
        if (!string.IsNullOrWhiteSpace(studentId)) query = query.Where(x => x.StudentUserId == studentId);

        var list = await query.OrderByDescending(x => x.DecidedAt).ToListAsync();
        var programs = await db.Programs.ToDictionaryAsync(x => x.Id, x => x.Name);
        var terms = await db.Terms.ToDictionaryAsync(x => x.Id, x => x.Name);

        return Ok(list.Select(x => Map(x, programs.GetValueOrDefault(x.ProgramId, ""), terms.GetValueOrDefault(x.TermId, ""))).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<SuccessDecisionResponse>> Create(SuccessDecisionWriteRequest request)
    {
        var deciderId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "admin";

        var existing = await db.SuccessDecisions.SingleOrDefaultAsync(x => x.StudentUserId == request.StudentUserId && x.TermId == request.TermId);
        if (existing is not null)
        {
            existing.AttendanceRate = request.AttendanceRate;
            existing.AssignmentAverage = request.AssignmentAverage;
            existing.MandatoryAssignmentsPassed = request.MandatoryAssignmentsPassed;
            existing.FinalStatus = request.FinalStatus;
            existing.DecisionNotes = request.DecisionNotes;
            existing.DecidedByUserId = deciderId;
            existing.DecidedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();

            var program = await db.Programs.FindAsync(existing.ProgramId);
            var term = await db.Terms.FindAsync(existing.TermId);
            return Ok(Map(existing, program?.Name ?? "", term?.Name ?? ""));
        }

        var item = new SuccessDecisionEntity
        {
            StudentUserId = request.StudentUserId,
            StudentName = request.StudentName.Trim(),
            ProgramId = request.ProgramId,
            TermId = request.TermId,
            AttendanceRate = request.AttendanceRate,
            AssignmentAverage = request.AssignmentAverage,
            MandatoryAssignmentsPassed = request.MandatoryAssignmentsPassed,
            FinalStatus = request.FinalStatus,
            DecidedByUserId = deciderId,
            DecidedAt = DateTime.UtcNow,
            DecisionNotes = request.DecisionNotes
        };

        db.SuccessDecisions.Add(item);
        db.AuditLogs.Add(new AuditLog
        {
            UserId = deciderId,
            Action = "success.decision",
            EntityType = "SuccessDecision",
            EntityId = item.Id.ToString(),
            Detail = $"Başarı kararı kaydedildi: {item.StudentName} -> {item.FinalStatus}"
        });

        await db.SaveChangesAsync();

        var p = await db.Programs.FindAsync(item.ProgramId);
        var t = await db.Terms.FindAsync(item.TermId);

        return Created($"/api/v1/success-decisions/{item.Id}", Map(item, p?.Name ?? "", t?.Name ?? ""));
    }

    private static SuccessDecisionResponse Map(SuccessDecisionEntity x, string programName, string termName) =>
        new(
            x.Id,
            x.StudentUserId,
            x.StudentName,
            x.ProgramId,
            programName,
            x.TermId,
            termName,
            x.AttendanceRate,
            x.AssignmentAverage,
            x.MandatoryAssignmentsPassed,
            x.FinalStatus,
            x.DecidedByUserId,
            x.DecidedAt,
            x.DecisionNotes
        );
}

