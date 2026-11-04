using Education.Application;
using Education.Domain;
using Education.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Education.Api.Controllers;

[ApiController, Route("api/v1/assignments")]
public sealed class AssignmentsController(EducationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AssignmentResponse>>> List([FromQuery] Guid? groupId)
    {
        var query = db.Assignments.AsNoTracking().Include(x => x.Submissions).AsQueryable();
        if (groupId.HasValue) query = query.Where(x => x.GroupId == groupId.Value);

        var list = await query.OrderByDescending(x => x.DueDate).ToListAsync();
        var groups = await db.Groups.ToDictionaryAsync(x => x.Id, x => x.Name);

        return Ok(list.Select(x => Map(x, groups.GetValueOrDefault(x.GroupId, ""))).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AssignmentResponse>> Get(Guid id)
    {
        var item = await db.Assignments.AsNoTracking().Include(x => x.Submissions).SingleOrDefaultAsync(x => x.Id == id);
        if (item is null) return NotFound();

        var group = await db.Groups.FindAsync(item.GroupId);
        return Ok(Map(item, group?.Name ?? ""));
    }

    [HttpPost]
    public async Task<ActionResult<AssignmentResponse>> Create(AssignmentWriteRequest request)
    {
        var item = new AssignmentEntity
        {
            GroupId = request.GroupId,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            DueDate = request.DueDate,
            MaxScore = request.MaxScore,
            Weight = request.Weight,
            IsMandatory = request.IsMandatory
        };

        db.Assignments.Add(item);
        db.AuditLogs.Add(new AuditLog
        {
            UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            Action = "assignment.create",
            EntityType = "Assignment",
            EntityId = item.Id.ToString(),
            Detail = $"Ödev tanımlandı: {item.Title}"
        });

        await db.SaveChangesAsync();

        var group = await db.Groups.FindAsync(item.GroupId);
        return CreatedAtAction(nameof(Get), new { id = item.Id }, Map(item, group?.Name ?? ""));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AssignmentResponse>> Update(Guid id, AssignmentWriteRequest request)
    {
        var item = await db.Assignments.Include(x => x.Submissions).SingleOrDefaultAsync(x => x.Id == id);
        if (item is null) return NotFound();

        item.Title = request.Title.Trim();
        item.Description = request.Description.Trim();
        item.DueDate = request.DueDate;
        item.MaxScore = request.MaxScore;
        item.Weight = request.Weight;
        item.IsMandatory = request.IsMandatory;

        await db.SaveChangesAsync();

        var group = await db.Groups.FindAsync(item.GroupId);
        return Ok(Map(item, group?.Name ?? ""));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await db.Assignments.FindAsync(id);
        if (item is null) return NotFound();

        db.Assignments.Remove(item);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:guid}/submit")]
    public async Task<ActionResult<AssignmentSubmissionResponse>> Submit(Guid id, AssignmentSubmissionRequest request)
    {
        var assignment = await db.Assignments.Include(x => x.Submissions).SingleOrDefaultAsync(x => x.Id == id);
        if (assignment is null) return NotFound();

        var studentId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous-student";
        var user = await db.Users.FindAsync(studentId);
        var studentName = user?.DisplayName ?? "Kursiyer";

        var previousCount = assignment.Submissions.Count(x => x.StudentUserId == studentId);

        var submission = new AssignmentSubmissionEntity
        {
            AssignmentId = id,
            StudentUserId = studentId,
            StudentName = studentName,
            SubmissionText = request.SubmissionText.Trim(),
            AttachmentPath = request.AttachmentPath,
            SubmittedAt = DateTime.UtcNow,
            Status = SubmissionStatus.Submitted,
            RevisionNumber = previousCount + 1
        };

        db.AssignmentSubmissions.Add(submission);
        db.AuditLogs.Add(new AuditLog
        {
            UserId = studentId,
            Action = "assignment.submit",
            EntityType = "AssignmentSubmission",
            EntityId = submission.Id.ToString(),
            Detail = $"Ödev teslim edildi: {assignment.Title} (Rev: {submission.RevisionNumber})"
        });

        await db.SaveChangesAsync();

        return Created($"/api/v1/assignments/submissions/{submission.Id}", MapSubmission(submission));
    }

    [HttpPost("submissions/{submissionId:guid}/grade")]
    public async Task<ActionResult<AssignmentSubmissionResponse>> Grade(Guid submissionId, AssignmentGradeRequest request)
    {
        var submission = await db.AssignmentSubmissions.FindAsync(submissionId);
        if (submission is null) return NotFound();

        var evaluatorId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "instructor";

        submission.Score = request.Score;
        submission.Feedback = request.Feedback.Trim();
        submission.Status = request.Status;
        submission.EvaluatedByUserId = evaluatorId;
        submission.EvaluatedAt = DateTime.UtcNow;

        db.AuditLogs.Add(new AuditLog
        {
            UserId = evaluatorId,
            Action = "assignment.grade",
            EntityType = "AssignmentSubmission",
            EntityId = submission.Id.ToString(),
            Detail = $"Ödev puanlandı: Not: {request.Score}, Durum: {request.Status}"
        });

        await db.SaveChangesAsync();

        return Ok(MapSubmission(submission));
    }

    private static AssignmentResponse Map(AssignmentEntity x, string groupName) =>
        new(
            x.Id,
            x.GroupId,
            groupName,
            x.Title,
            x.Description,
            x.DueDate,
            x.MaxScore,
            x.Weight,
            x.IsMandatory,
            x.Submissions.Select(MapSubmission).ToList(),
            x.CreatedAt
        );

    private static AssignmentSubmissionResponse MapSubmission(AssignmentSubmissionEntity s) =>
        new(
            s.Id,
            s.AssignmentId,
            s.StudentUserId,
            s.StudentName,
            s.SubmissionText,
            s.AttachmentPath,
            s.SubmittedAt,
            s.Score,
            s.Feedback,
            s.EvaluatedByUserId,
            s.EvaluatedAt,
            s.Status,
            s.RevisionNumber
        );
}

