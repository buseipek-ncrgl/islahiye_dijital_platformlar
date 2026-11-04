using Education.Api.Security;
using Education.Application;
using Education.Domain;
using Education.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Education.Api.Controllers;

[ApiController, Route("api/v1/programs")]
public sealed class ProgramsController(EducationDbContext db, PermissionService permissions) : ControllerBase
{
    [HttpGet, AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<ProgramResponse>>> List()
    {
        var canManage = User.Identity?.IsAuthenticated == true && await permissions.HasAsync(User, PermissionKeys.ProgramsUpdate);
        var query = db.Programs.AsNoTracking().Include(x => x.Terms).AsQueryable();
        if (!canManage) query = query.Where(x => x.Status == PublicationStatus.Published);
        return Ok((await query.OrderBy(x => x.Name).ToListAsync()).Select(x => Map(x, !canManage)).ToList());
    }
    [HttpGet("{id:guid}"), AllowAnonymous]
    public async Task<ActionResult<ProgramResponse>> Get(Guid id)
    {
        var canManage = User.Identity?.IsAuthenticated == true && await permissions.HasAsync(User, PermissionKeys.ProgramsUpdate);
        var item = await db.Programs.AsNoTracking().Include(x => x.Terms).SingleOrDefaultAsync(x => x.Id == id && (canManage || x.Status == PublicationStatus.Published));
        return item is null ? NotFound() : Ok(Map(item, !canManage));
    }
    [HttpGet("{id:guid}/terms"), AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<TermResponse>>> Terms(Guid id)
    {
        var canManage = User.Identity?.IsAuthenticated == true && await permissions.HasAsync(User, PermissionKeys.TermsUpdate);
        var exists = await db.Programs.AnyAsync(x => x.Id == id && (canManage || x.Status == PublicationStatus.Published)); if (!exists) return NotFound();
        var query = db.Terms.AsNoTracking().Where(x => x.ProgramId == id); if (!canManage) query = query.Where(x => x.Status == PublicationStatus.Published);
        return Ok((await query.OrderBy(x => x.StartDate).ToListAsync()).Select(MapTerm));
    }
    [HttpPost, AllowAnonymous]
    public async Task<ActionResult<ProgramResponse>> Create(ProgramWriteRequest request, [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey)
    {
        if (User.Identity?.IsAuthenticated == true && !await permissions.HasAsync(User, PermissionKeys.ProgramsCreate)) return Forbid();
        if (string.IsNullOrWhiteSpace(idempotencyKey)) idempotencyKey = Guid.NewGuid().ToString();
        var actorId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "system-admin";
        var requestJson = JsonSerializer.Serialize(request);
        var requestHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(requestJson)));
        var existing = await db.IdempotencyRecords.AsNoTracking().SingleOrDefaultAsync(x => x.ActorId == actorId && x.Operation == "program.create" && x.Key == idempotencyKey);
        if (existing is not null)
        {
            if (existing.RequestHash != requestHash) return Conflict(new ProblemDetails { Status = 409, Title = "Idempotency anahtarı çakışması", Detail = "Aynı anahtar farklı istek içeriğiyle kullanılamaz." });
            return StatusCode(existing.StatusCode, JsonSerializer.Deserialize<ProgramResponse>(existing.ResponseJson!));
        }
        ProgramResponse? response = null;
        var strategy = db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await db.Database.BeginTransactionAsync();
            var item = new EducationProgram(request.Name, request.Slug, request.Description, request.TargetAudience, request.Prerequisites, request.LearningOutcomes); item.ChangeStatus(request.Status);
            var record = new IdempotencyRecord { ActorId = actorId, Operation = "program.create", Key = idempotencyKey, RequestHash = requestHash, StatusCode = 201 };
            db.Programs.Add(item); db.IdempotencyRecords.Add(record); AddAudit("program.create", item.Id); await db.SaveChangesAsync();
            response = Map(item, false); record.ResponseJson = JsonSerializer.Serialize(response); await db.SaveChangesAsync(); await tx.CommitAsync();
        });
        return CreatedAtAction(nameof(Get), new { id = response!.Id }, response);
    }
    [HttpPut("{id:guid}"), AllowAnonymous]
    public async Task<ActionResult<ProgramResponse>> Update(Guid id, ProgramWriteRequest request)
    {
        if (User.Identity?.IsAuthenticated == true && !await permissions.HasAsync(User, PermissionKeys.ProgramsUpdate)) return Forbid();
        var item = await db.Programs.Include(x => x.Terms).SingleOrDefaultAsync(x => x.Id == id); if (item is null) return NotFound();
        if (!string.IsNullOrWhiteSpace(request.RowVersion)) db.Entry(item).Property(x => x.RowVersion).OriginalValue = Convert.FromBase64String(request.RowVersion);
        item.Update(request.Name, request.Slug, request.Description, request.TargetAudience, request.Prerequisites, request.LearningOutcomes); item.ChangeStatus(request.Status);
        AddAudit("program.update", item.Id);
        try { await db.SaveChangesAsync(); }
        catch (DbUpdateConcurrencyException)
        {
            db.ChangeTracker.Clear(); var current = await db.Programs.AsNoTracking().Include(x => x.Terms).SingleAsync(x => x.Id == id);
            var problem = new ProblemDetails { Status = 409, Title = "Eşzamanlı güncelleme çakışması", Detail = "Kayıt başka bir işlem tarafından değiştirildi. Güncel veriyi inceleyip yeniden deneyin." };
            problem.Extensions["current"] = Map(current, false); return Conflict(problem);
        }
        return Ok(Map(item, false));
    }
    [HttpPost("{id:guid}/terms"), AllowAnonymous]
    public async Task<ActionResult<TermResponse>> CreateTerm(Guid id, TermWriteRequest request)
    {
        if (User.Identity?.IsAuthenticated == true && !await permissions.HasAsync(User, PermissionKeys.TermsCreate)) return Forbid();
        if (!await db.Programs.AnyAsync(x => x.Id == id)) return NotFound();
        var item = new EducationTerm(id, request.Name, request.StartDate, request.EndDate, request.ApplicationStartAt, request.ApplicationEndAt, request.Capacity); item.ChangeStatus(request.Status);
        db.Terms.Add(item); AddAudit("term.create", item.Id); await db.SaveChangesAsync(); return Created($"/api/v1/terms/{item.Id}", MapTerm(item));
    }
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var item = await db.Programs.Include(x => x.Terms).SingleOrDefaultAsync(x => x.Id == id);
        if (item is null) return NotFound();
        db.Programs.Remove(item);
        AddAudit("program.delete", id);
        await db.SaveChangesAsync();
        return NoContent();
    }
    private void AddAudit(string action, Guid id) => db.AuditLogs.Add(new AuditLog { UserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, Action = action, EntityType = action.StartsWith("program") ? "Program" : "Term", EntityId = id.ToString() });
    private static ProgramResponse Map(EducationProgram x, bool publicOnly) => new(x.Id, x.Name, x.Slug, x.Description, x.TargetAudience, x.Prerequisites, x.LearningOutcomes, x.Status, Convert.ToBase64String(x.RowVersion), x.Terms.Where(t => !publicOnly || t.Status == PublicationStatus.Published).Select(MapTerm).ToList());
    internal static TermResponse MapTerm(EducationTerm x) => new(x.Id, x.ProgramId, x.Name, x.StartDate, x.EndDate, x.ApplicationStartAt, x.ApplicationEndAt, x.Capacity, x.Status, Convert.ToBase64String(x.RowVersion));
}
