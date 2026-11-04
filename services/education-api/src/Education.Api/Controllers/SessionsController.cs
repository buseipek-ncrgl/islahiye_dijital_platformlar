using Education.Application;
using Education.Domain;
using Education.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Education.Api.Controllers;

[ApiController, Route("api/v1/sessions")]
public sealed class SessionsController(EducationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SessionResponse>>> List([FromQuery] Guid? groupId, [FromQuery] DateOnly? date)
    {
        var query = db.CourseSessions.AsNoTracking().Include(x => x.AttendanceRecords).AsQueryable();

        if (groupId.HasValue) query = query.Where(x => x.GroupId == groupId.Value);
        if (date.HasValue) query = query.Where(x => x.Date == date.Value);

        var list = await query.OrderBy(x => x.Date).ThenBy(x => x.StartTime).ToListAsync();
        var groups = await db.Groups.ToDictionaryAsync(x => x.Id, x => x.Name);
        var users = await db.Users.ToDictionaryAsync(x => x.Id, x => x.DisplayName);

        return Ok(list.Select(x => Map(x, groups.GetValueOrDefault(x.GroupId, ""), users)).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SessionResponse>> Get(Guid id)
    {
        var item = await db.CourseSessions.AsNoTracking().Include(x => x.AttendanceRecords).SingleOrDefaultAsync(x => x.Id == id);
        if (item is null) return NotFound();

        var group = await db.Groups.FindAsync(item.GroupId);
        var users = await db.Users.ToDictionaryAsync(x => x.Id, x => x.DisplayName);

        return Ok(Map(item, group?.Name ?? "", users));
    }

    [HttpPost]
    public async Task<ActionResult<SessionResponse>> Create(SessionWriteRequest request)
    {
        var item = new CourseSessionEntity
        {
            GroupId = request.GroupId,
            Title = request.Title.Trim(),
            Date = request.Date,
            StartTime = request.StartTime.Trim(),
            EndTime = request.EndTime.Trim(),
            Classroom = request.Classroom.Trim(),
            Status = request.Status,
            Notes = request.Notes
        };

        db.CourseSessions.Add(item);
        db.AuditLogs.Add(new AuditLog
        {
            UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            Action = "session.create",
            EntityType = "CourseSession",
            EntityId = item.Id.ToString(),
            Detail = $"Oturum oluşturuldu: {item.Title} ({item.Date})"
        });

        await db.SaveChangesAsync();

        var group = await db.Groups.FindAsync(item.GroupId);
        var users = await db.Users.ToDictionaryAsync(x => x.Id, x => x.DisplayName);

        return CreatedAtAction(nameof(Get), new { id = item.Id }, Map(item, group?.Name ?? "", users));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SessionResponse>> Update(Guid id, SessionWriteRequest request)
    {
        var item = await db.CourseSessions.Include(x => x.AttendanceRecords).SingleOrDefaultAsync(x => x.Id == id);
        if (item is null) return NotFound();

        item.Title = request.Title.Trim();
        item.Date = request.Date;
        item.StartTime = request.StartTime.Trim();
        item.EndTime = request.EndTime.Trim();
        item.Classroom = request.Classroom.Trim();
        item.Status = request.Status;
        item.Notes = request.Notes;

        await db.SaveChangesAsync();

        var group = await db.Groups.FindAsync(item.GroupId);
        var users = await db.Users.ToDictionaryAsync(x => x.Id, x => x.DisplayName);

        return Ok(Map(item, group?.Name ?? "", users));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await db.CourseSessions.FindAsync(id);
        if (item is null) return NotFound();

        db.CourseSessions.Remove(item);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id:guid}/attendance")]
    public async Task<ActionResult<IReadOnlyList<AttendanceRecordResponse>>> GetAttendance(Guid id)
    {
        var session = await db.CourseSessions.Include(x => x.AttendanceRecords).SingleOrDefaultAsync(x => x.Id == id);
        if (session is null) return NotFound();

        var users = await db.Users.ToDictionaryAsync(x => x.Id, x => x.DisplayName);
        return Ok(session.AttendanceRecords.Select(r => new AttendanceRecordResponse(
            r.Id,
            r.SessionId,
            r.StudentUserId,
            users.GetValueOrDefault(r.StudentUserId, "Kursiyer"),
            r.Status,
            r.RecordedAt,
            r.Notes
        )).ToList());
    }

    [HttpPost("{id:guid}/attendance")]
    public async Task<ActionResult<SessionResponse>> SaveAttendance(Guid id, AttendanceSaveRequest request)
    {
        var session = await db.CourseSessions.Include(x => x.AttendanceRecords).SingleOrDefaultAsync(x => x.Id == id);
        if (session is null) return NotFound();

        var recorderId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "instructor";

        foreach (var record in request.Records)
        {
            var existing = session.AttendanceRecords.SingleOrDefault(x => x.StudentUserId == record.StudentUserId);
            if (existing is not null)
            {
                existing.Status = record.Status;
                existing.Notes = record.Notes;
                existing.RecordedByUserId = recorderId;
                existing.RecordedAt = DateTime.UtcNow;
            }
            else
            {
                session.AttendanceRecords.Add(new AttendanceRecordEntity
                {
                    SessionId = id,
                    StudentUserId = record.StudentUserId,
                    Status = record.Status,
                    RecordedByUserId = recorderId,
                    RecordedAt = DateTime.UtcNow,
                    Notes = record.Notes
                });
            }
        }

        session.Status = SessionStatus.Completed;
        db.AuditLogs.Add(new AuditLog
        {
            UserId = recorderId,
            Action = "attendance.save",
            EntityType = "CourseSession",
            EntityId = id.ToString(),
            Detail = $"Manuel yoklama kaydedildi. Oturum: {session.Title}"
        });

        await db.SaveChangesAsync();

        var group = await db.Groups.FindAsync(session.GroupId);
        var users = await db.Users.ToDictionaryAsync(x => x.Id, x => x.DisplayName);

        return Ok(Map(session, group?.Name ?? "", users));
    }

    private static SessionResponse Map(CourseSessionEntity x, string groupName, Dictionary<string, string> users) =>
        new(
            x.Id,
            x.GroupId,
            groupName,
            x.Title,
            x.Date,
            x.StartTime,
            x.EndTime,
            x.Classroom,
            x.Status,
            x.Notes,
            x.AttendanceRecords.Select(r => new AttendanceRecordResponse(
                r.Id,
                r.SessionId,
                r.StudentUserId,
                users.GetValueOrDefault(r.StudentUserId, "Kursiyer"),
                r.Status,
                r.RecordedAt,
                r.Notes
            )).ToList()
        );
}

