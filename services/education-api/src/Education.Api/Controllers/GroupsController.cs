using Education.Application;
using Education.Domain;
using Education.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Education.Api.Controllers;

[ApiController, Route("api/v1/groups")]
public sealed class GroupsController(EducationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<GroupResponse>>> List([FromQuery] Guid? termId, [FromQuery] string? instructorId)
    {
        var query = db.Groups.AsNoTracking().Include(x => x.Students).AsQueryable();
        if (termId.HasValue) query = query.Where(x => x.TermId == termId.Value);
        if (!string.IsNullOrWhiteSpace(instructorId)) query = query.Where(x => x.InstructorUserId == instructorId);

        var list = await query.OrderBy(x => x.Name).ToListAsync();
        var programs = await db.Programs.ToDictionaryAsync(x => x.Id, x => x.Name);
        var terms = await db.Terms.ToDictionaryAsync(x => x.Id, x => x.Name);

        return Ok(list.Select(x => Map(x, programs.GetValueOrDefault(x.ProgramId, ""), terms.GetValueOrDefault(x.TermId, ""))).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<GroupResponse>> Get(Guid id)
    {
        var item = await db.Groups.AsNoTracking().Include(x => x.Students).SingleOrDefaultAsync(x => x.Id == id);
        if (item is null) return NotFound();

        var program = await db.Programs.FindAsync(item.ProgramId);
        var term = await db.Terms.FindAsync(item.TermId);

        return Ok(Map(item, program?.Name ?? "", term?.Name ?? ""));
    }

    [HttpPost]
    public async Task<ActionResult<GroupResponse>> Create(GroupWriteRequest request)
    {
        var item = new CourseGroupEntity
        {
            ProgramId = request.ProgramId,
            TermId = request.TermId,
            Name = request.Name.Trim(),
            Code = request.Code.Trim(),
            Classroom = request.Classroom.Trim(),
            Capacity = request.Capacity,
            InstructorUserId = request.InstructorUserId,
            InstructorName = request.InstructorName,
            Status = request.Status
        };

        db.Groups.Add(item);
        db.AuditLogs.Add(new AuditLog
        {
            UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            Action = "group.create",
            EntityType = "Group",
            EntityId = item.Id.ToString(),
            Detail = $"Grup oluşturuldu: {item.Name} ({item.Code})"
        });

        await db.SaveChangesAsync();

        var program = await db.Programs.FindAsync(item.ProgramId);
        var term = await db.Terms.FindAsync(item.TermId);

        return CreatedAtAction(nameof(Get), new { id = item.Id }, Map(item, program?.Name ?? "", term?.Name ?? ""));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<GroupResponse>> Update(Guid id, GroupWriteRequest request)
    {
        var item = await db.Groups.Include(x => x.Students).SingleOrDefaultAsync(x => x.Id == id);
        if (item is null) return NotFound();

        item.Name = request.Name.Trim();
        item.Code = request.Code.Trim();
        item.Classroom = request.Classroom.Trim();
        item.Capacity = request.Capacity;
        item.InstructorUserId = request.InstructorUserId;
        item.InstructorName = request.InstructorName;
        item.Status = request.Status;

        await db.SaveChangesAsync();

        var program = await db.Programs.FindAsync(item.ProgramId);
        var term = await db.Terms.FindAsync(item.TermId);

        return Ok(Map(item, program?.Name ?? "", term?.Name ?? ""));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await db.Groups.FindAsync(id);
        if (item is null) return NotFound();

        db.Groups.Remove(item);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:guid}/students")]
    public async Task<ActionResult<GroupResponse>> AssignStudent(Guid id, AssignStudentRequest request)
    {
        var group = await db.Groups.Include(x => x.Students).SingleOrDefaultAsync(x => x.Id == id);
        if (group is null) return NotFound();

        var enrollment = await db.Enrollments.SingleOrDefaultAsync(x => x.StudentUserId == request.StudentUserId && x.TermId == group.TermId);
        if (enrollment is null)
        {
            var count = await db.Enrollments.CountAsync();
            enrollment = new EnrollmentEntity
            {
                StudentUserId = request.StudentUserId,
                StudentName = request.StudentName,
                StudentEmail = request.StudentEmail,
                ProgramId = group.ProgramId,
                TermId = group.TermId,
                GroupId = group.Id,
                EnrollmentNumber = $"KAY-{DateTime.UtcNow.Year}-{(count + 1):D4}",
                Status = EnrollmentStatus.Active,
                EnrolledAt = DateTime.UtcNow
            };
            db.Enrollments.Add(enrollment);
        }
        else
        {
            enrollment.GroupId = group.Id;
        }

        await db.SaveChangesAsync();

        var program = await db.Programs.FindAsync(group.ProgramId);
        var term = await db.Terms.FindAsync(group.TermId);

        return Ok(Map(group, program?.Name ?? "", term?.Name ?? ""));
    }

    [HttpDelete("{id:guid}/students/{studentUserId}")]
    public async Task<IActionResult> RemoveStudent(Guid id, string studentUserId)
    {
        var enrollment = await db.Enrollments.SingleOrDefaultAsync(x => x.GroupId == id && x.StudentUserId == studentUserId);
        if (enrollment is not null)
        {
            enrollment.GroupId = null;
            await db.SaveChangesAsync();
        }
        return NoContent();
    }

    private static GroupResponse Map(CourseGroupEntity x, string programName, string termName) =>
        new(
            x.Id,
            x.ProgramId,
            programName,
            x.TermId,
            termName,
            x.Name,
            x.Code,
            x.Classroom,
            x.Capacity,
            x.InstructorUserId,
            x.InstructorName,
            x.Status,
            x.Students.Count,
            x.CreatedAt
        );
}

