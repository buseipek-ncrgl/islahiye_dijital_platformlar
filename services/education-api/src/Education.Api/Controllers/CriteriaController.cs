using Education.Application;
using Education.Domain;
using Education.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Education.Api.Controllers;

[ApiController, Route("api/v1/criteria")]
public sealed class CriteriaController(EducationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CriteriaSetResponse>>> List([FromQuery] Guid? programId)
    {
        var query = db.CriteriaSets.AsNoTracking().Include(x => x.Criteria).AsQueryable();
        if (programId.HasValue) query = query.Where(x => x.ProgramId == programId.Value);

        var list = await query.OrderByDescending(x => x.Version).ToListAsync();
        var programs = await db.Programs.ToDictionaryAsync(x => x.Id, x => x.Name);

        return Ok(list.Select(x => Map(x, programs.GetValueOrDefault(x.ProgramId, "Genel Program"))).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CriteriaSetResponse>> Get(Guid id)
    {
        var item = await db.CriteriaSets.AsNoTracking().Include(x => x.Criteria).SingleOrDefaultAsync(x => x.Id == id);
        if (item is null) return NotFound();

        var program = await db.Programs.FindAsync(item.ProgramId);
        return Ok(Map(item, program?.Name ?? "Genel Program"));
    }

    [HttpPost]
    public async Task<ActionResult<CriteriaSetResponse>> CreateVersion(CriteriaSetWriteRequest request)
    {
        // Deactivate previous active sets for this program if new one is active
        if (request.IsActive)
        {
            var oldSets = await db.CriteriaSets.Where(x => x.ProgramId == request.ProgramId && x.IsActive).ToListAsync();
            foreach (var old in oldSets) old.IsActive = false;
        }

        var latestVersion = await db.CriteriaSets
            .Where(x => x.ProgramId == request.ProgramId)
            .OrderByDescending(x => x.Version)
            .Select(x => x.Version)
            .FirstOrDefaultAsync();

        var set = new CriteriaSetEntity
        {
            ProgramId = request.ProgramId,
            TermId = request.TermId,
            Version = latestVersion + 1,
            IsActive = request.IsActive
        };

        db.CriteriaSets.Add(set);
        await db.SaveChangesAsync();

        if (request.Criteria != null && request.Criteria.Count > 0)
        {
            var order = 1;
            foreach (var c in request.Criteria)
            {
                db.Criteria.Add(new CriterionEntity
                {
                    CriteriaSetId = set.Id,
                    Code = c.Code.Trim().ToUpperInvariant(),
                    Title = c.Title.Trim(),
                    Description = c.Description.Trim(),
                    Category = c.Category.Trim(),
                    Weight = c.Weight,
                    MaxScore = c.MaxScore > 0 ? c.MaxScore : 100,
                    IsPrerequisite = c.IsPrerequisite,
                    OrderIndex = order++
                });
            }
            await db.SaveChangesAsync();
        }

        db.AuditLogs.Add(new AuditLog
        {
            UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            Action = "criteria.publish_version",
            EntityType = "CriteriaSet",
            EntityId = set.Id.ToString(),
            Detail = $"Kriter sürümü yayınlandı: v{set.Version}"
        });

        await db.SaveChangesAsync();

        var program = await db.Programs.FindAsync(set.ProgramId);
        return CreatedAtAction(nameof(Get), new { id = set.Id }, Map(set, program?.Name ?? "Genel Program"));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CriteriaSetResponse>> Update(Guid id, CriteriaSetWriteRequest request)
    {
        var set = await db.CriteriaSets.Include(x => x.Criteria).SingleOrDefaultAsync(x => x.Id == id);
        if (set is null) return NotFound();

        set.IsActive = request.IsActive;

        // Replace criteria
        db.Criteria.RemoveRange(set.Criteria);
        if (request.Criteria != null && request.Criteria.Count > 0)
        {
            var order = 1;
            foreach (var c in request.Criteria)
            {
                db.Criteria.Add(new CriterionEntity
                {
                    CriteriaSetId = set.Id,
                    Code = c.Code.Trim().ToUpperInvariant(),
                    Title = c.Title.Trim(),
                    Description = c.Description.Trim(),
                    Category = c.Category.Trim(),
                    Weight = c.Weight,
                    MaxScore = c.MaxScore > 0 ? c.MaxScore : 100,
                    IsPrerequisite = c.IsPrerequisite,
                    OrderIndex = order++
                });
            }
        }

        await db.SaveChangesAsync();

        var program = await db.Programs.FindAsync(set.ProgramId);
        return Ok(Map(set, program?.Name ?? "Genel Program"));
    }

    private static CriteriaSetResponse Map(CriteriaSetEntity x, string programName) =>
        new(
            x.Id,
            x.ProgramId,
            programName,
            x.TermId,
            x.Version,
            x.IsActive,
            x.Criteria.OrderBy(c => c.OrderIndex).Select(c => new CriterionDto(
                c.Id,
                c.Code,
                c.Title,
                c.Description,
                c.Category,
                c.Weight,
                c.MaxScore,
                c.IsPrerequisite,
                c.OrderIndex
            )).ToList(),
            x.CreatedAt
        );
}

public sealed record CriteriaSetResponse(
    Guid Id,
    Guid ProgramId,
    string ProgramName,
    Guid? TermId,
    int Version,
    bool IsActive,
    IReadOnlyList<CriterionDto> Criteria,
    DateTime CreatedAt
);

public sealed record CriterionDto(
    Guid Id,
    string Code,
    string Title,
    string Description,
    string Category,
    int Weight,
    int MaxScore,
    bool IsPrerequisite,
    int OrderIndex
);

public sealed record CriteriaSetWriteRequest(
    Guid ProgramId,
    Guid? TermId,
    bool IsActive,
    IReadOnlyList<CriterionWriteRequest> Criteria
);

public sealed record CriterionWriteRequest(
    string Code,
    string Title,
    string Description,
    string Category,
    int Weight,
    int MaxScore,
    bool IsPrerequisite
);

