using Education.Application;
using Education.Domain;
using Education.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Education.Api.Controllers;

[ApiController, Route("api/v1/applications")]
public sealed class ApplicationsController(EducationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ApplicationResponse>>> List(
        [FromQuery] Guid? programId,
        [FromQuery] Guid? termId,
        [FromQuery] ApplicationStatus? status,
        [FromQuery] string? search)
    {
        var query = db.Applications.AsNoTracking()
            .Include(x => x.Documents)
            .Include(x => x.Evaluations)
            .AsQueryable();

        if (programId.HasValue) query = query.Where(x => x.ProgramId == programId.Value);
        if (termId.HasValue) query = query.Where(x => x.TermId == termId.Value);
        if (status.HasValue) query = query.Where(x => x.Status == status.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(x => x.FullName.ToLower().Contains(s) || x.ApplicationNumber.ToLower().Contains(s) || x.Email.ToLower().Contains(s));
        }

        var list = await query.OrderByDescending(x => x.CreatedAt).ToListAsync();
        var programs = await db.Programs.ToDictionaryAsync(x => x.Id, x => x.Name);
        var terms = await db.Terms.ToDictionaryAsync(x => x.Id, x => x.Name);

        return Ok(list.Select(x => Map(x, programs.GetValueOrDefault(x.ProgramId, ""), terms.GetValueOrDefault(x.TermId, ""))).ToList());
    }

    [HttpGet("mine"), Authorize]
    public async Task<ActionResult<IReadOnlyList<ApplicationResponse>>> Mine()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var list = await db.Applications.AsNoTracking()
            .Include(x => x.Documents)
            .Include(x => x.Evaluations)
            .Where(x => x.ApplicantUserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        var programs = await db.Programs.ToDictionaryAsync(x => x.Id, x => x.Name);
        var terms = await db.Terms.ToDictionaryAsync(x => x.Id, x => x.Name);

        return Ok(list.Select(x => Map(x, programs.GetValueOrDefault(x.ProgramId, ""), terms.GetValueOrDefault(x.TermId, ""))).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApplicationResponse>> Get(Guid id)
    {
        var item = await db.Applications.AsNoTracking()
            .Include(x => x.Documents)
            .Include(x => x.Evaluations)
            .SingleOrDefaultAsync(x => x.Id == id);

        if (item is null) return NotFound();

        var program = await db.Programs.FindAsync(item.ProgramId);
        var term = await db.Terms.FindAsync(item.TermId);

        return Ok(Map(item, program?.Name ?? "", term?.Name ?? ""));
    }

    [HttpPost]
    public async Task<ActionResult<ApplicationResponse>> Create(ApplicationWriteRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous-applicant";

        var count = await db.Applications.CountAsync();
        var applicationNumber = $"ISL-{DateTime.UtcNow.Year}-{(count + 1):D4}";

        var initialScore = 70.0m;
        if (request.ExperienceYears >= 3) initialScore += 15.0m;
        else if (request.ExperienceYears >= 1) initialScore += 10.0m;

        if (request.EducationLevel.Contains("Lisans") || request.EducationLevel.Contains("Yüksek")) initialScore += 10.0m;

        var entity = new ApplicationEntity
        {
            ApplicationNumber = applicationNumber,
            ApplicantUserId = userId,
            ProgramId = request.ProgramId,
            TermId = request.TermId,
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim(),
            Phone = request.Phone.Trim(),
            BirthDate = request.BirthDate,
            EducationLevel = request.EducationLevel.Trim(),
            Occupation = request.Occupation.Trim(),
            ExperienceYears = request.ExperienceYears,
            Motivation = request.Motivation.Trim(),
            Address = request.Address.Trim(),
            SpecialNeeds = request.SpecialNeeds.Trim(),
            Status = request.SubmitNow ? ApplicationStatus.Submitted : ApplicationStatus.Draft,
            SubmittedAt = request.SubmitNow ? DateTime.UtcNow : null,
            Score = initialScore
        };

        db.Applications.Add(entity);
        db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            Action = "application.create",
            EntityType = "Application",
            EntityId = entity.Id.ToString(),
            Detail = $"Başvuru oluşturuldu: {applicationNumber}"
        });

        await db.SaveChangesAsync();

        var program = await db.Programs.FindAsync(entity.ProgramId);
        var term = await db.Terms.FindAsync(entity.TermId);

        return CreatedAtAction(nameof(Get), new { id = entity.Id }, Map(entity, program?.Name ?? "", term?.Name ?? ""));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApplicationResponse>> Update(Guid id, ApplicationWriteRequest request)
    {
        var item = await db.Applications
            .Include(x => x.Documents)
            .Include(x => x.Evaluations)
            .SingleOrDefaultAsync(x => x.Id == id);

        if (item is null) return NotFound();

        item.FullName = request.FullName.Trim();
        item.Email = request.Email.Trim();
        item.Phone = request.Phone.Trim();
        item.BirthDate = request.BirthDate;
        item.EducationLevel = request.EducationLevel.Trim();
        item.Occupation = request.Occupation.Trim();
        item.ExperienceYears = request.ExperienceYears;
        item.Motivation = request.Motivation.Trim();
        item.Address = request.Address.Trim();
        item.SpecialNeeds = request.SpecialNeeds.Trim();
        if (request.SubmitNow && item.Status == ApplicationStatus.Draft)
        {
            item.Status = ApplicationStatus.Submitted;
            item.SubmittedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();

        var program = await db.Programs.FindAsync(item.ProgramId);
        var term = await db.Terms.FindAsync(item.TermId);

        return Ok(Map(item, program?.Name ?? "", term?.Name ?? ""));
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<ApplicationResponse>> UpdateStatus(Guid id, ApplicationStatusUpdateRequest request)
    {
        var item = await db.Applications
            .Include(x => x.Documents)
            .Include(x => x.Evaluations)
            .SingleOrDefaultAsync(x => x.Id == id);

        if (item is null) return NotFound();

        item.Status = request.Status;
        if (!string.IsNullOrWhiteSpace(request.AdminNotes)) item.AdminNotes = request.AdminNotes;
        if (!string.IsNullOrWhiteSpace(request.RejectionReason)) item.RejectionReason = request.RejectionReason;
        if (!string.IsNullOrWhiteSpace(request.InternalDecisionNote)) item.InternalDecisionNote = request.InternalDecisionNote;

        db.AuditLogs.Add(new AuditLog
        {
            UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            Action = "application.status_update",
            EntityType = "Application",
            EntityId = item.Id.ToString(),
            Detail = $"Durum güncellendi: {request.Status}"
        });

        await db.SaveChangesAsync();

        var program = await db.Programs.FindAsync(item.ProgramId);
        var term = await db.Terms.FindAsync(item.TermId);

        return Ok(Map(item, program?.Name ?? "", term?.Name ?? ""));
    }

    [HttpPost("{id:guid}/evaluate")]
    public async Task<ActionResult<ApplicationResponse>> Evaluate(Guid id, ApplicationEvaluationRequest request)
    {
        var item = await db.Applications
            .Include(x => x.Documents)
            .Include(x => x.Evaluations)
            .SingleOrDefaultAsync(x => x.Id == id);

        if (item is null) return NotFound();

        var evaluatorId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "admin";

        var eval = new ApplicationEvaluationEntity
        {
            ApplicationId = id,
            EvaluatedByUserId = evaluatorId,
            TotalScore = request.TotalScore,
            Recommendation = request.Recommendation,
            EvaluationNotes = request.EvaluationNotes,
            EvaluatedAt = DateTime.UtcNow
        };

        db.ApplicationEvaluations.Add(eval);
        item.Score = request.TotalScore;

        await db.SaveChangesAsync();

        var program = await db.Programs.FindAsync(item.ProgramId);
        var term = await db.Terms.FindAsync(item.TermId);

        return Ok(Map(item, program?.Name ?? "", term?.Name ?? ""));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await db.Applications.FindAsync(id);
        if (item is null) return NotFound();

        db.Applications.Remove(item);
        db.AuditLogs.Add(new AuditLog
        {
            UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            Action = "application.delete",
            EntityType = "Application",
            EntityId = id.ToString(),
            Detail = $"Başvuru silindi: {item.ApplicationNumber}"
        });

        await db.SaveChangesAsync();
        return NoContent();
    }

    private static ApplicationResponse Map(ApplicationEntity x, string programName, string termName) =>
        new(
            x.Id,
            x.ApplicationNumber,
            x.ApplicantUserId,
            x.ProgramId,
            programName,
            x.TermId,
            termName,
            x.FullName,
            x.Email,
            x.Phone,
            x.BirthDate,
            x.EducationLevel,
            x.Occupation,
            x.ExperienceYears,
            x.Motivation,
            x.Address,
            x.SpecialNeeds,
            x.Status,
            x.SubmittedAt,
            x.AdminNotes,
            x.RejectionReason,
            x.Score,
            x.Documents.Select(d => new ApplicationDocumentDto(d.Id, d.DocumentType, d.FileName, d.ContentType, d.FileSizeBytes, d.Status, d.VerifiedAt)).ToList(),
            x.Evaluations.Select(e => new ApplicationEvaluationDto(e.Id, e.EvaluatedByUserId, e.TotalScore, e.Recommendation, e.EvaluationNotes, e.EvaluatedAt)).ToList(),
            x.CreatedAt
        );
}

