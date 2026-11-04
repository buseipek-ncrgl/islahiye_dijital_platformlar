using Education.Application;
using Education.Domain;
using Education.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Education.Api.Controllers;

[ApiController, Route("api/v1/users")]
public sealed class UsersController(UserManager<ApplicationUser> users, RoleManager<IdentityRole> roles, EducationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<UserDetailResponse>>> List()
    {
        var allUsers = await users.Users.OrderBy(x => x.DisplayName).ToListAsync();
        var result = new List<UserDetailResponse>();

        foreach (var u in allUsers)
        {
            var userRoles = await users.GetRolesAsync(u);
            result.Add(new UserDetailResponse(u.Id, u.Email!, u.DisplayName, u.IsActive, userRoles.ToArray(), u.CreatedAt));
        }

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<UserDetailResponse>> Create(UserCreateRequest request)
    {
        var user = new ApplicationUser
        {
            UserName = request.Email.Trim(),
            Email = request.Email.Trim(),
            DisplayName = request.DisplayName.Trim(),
            EmailConfirmed = true
        };

        var result = await users.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return ValidationProblem(new ValidationProblemDetails(result.Errors.GroupBy(x => x.Code).ToDictionary(x => x.Key, x => x.Select(y => y.Description).ToArray())));

        if (!string.IsNullOrWhiteSpace(request.Role))
        {
            if (!await roles.RoleExistsAsync(request.Role))
                await roles.CreateAsync(new IdentityRole(request.Role));
            await users.AddToRoleAsync(user, request.Role);
        }

        db.AuditLogs.Add(new AuditLog
        {
            UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            Action = "user.create",
            EntityType = "User",
            EntityId = user.Id,
            Detail = $"Kullanıcı oluşturuldu: {user.Email} ({request.Role})"
        });

        await db.SaveChangesAsync();

        var userRoles = await users.GetRolesAsync(user);
        return Created($"/api/v1/users/{user.Id}", new UserDetailResponse(user.Id, user.Email!, user.DisplayName, user.IsActive, userRoles.ToArray(), user.CreatedAt));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<UserDetailResponse>> Update(string id, UserUpdateRequest request)
    {
        var user = await users.FindByIdAsync(id);
        if (user is null) return NotFound();

        user.DisplayName = request.DisplayName.Trim();
        user.IsActive = request.IsActive;
        await users.UpdateAsync(user);

        var currentRoles = await users.GetRolesAsync(user);
        await users.RemoveFromRolesAsync(user, currentRoles);
        foreach (var role in request.Roles)
        {
            if (!await roles.RoleExistsAsync(role))
                await roles.CreateAsync(new IdentityRole(role));
            await users.AddToRoleAsync(user, role);
        }

        db.AuditLogs.Add(new AuditLog
        {
            UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            Action = "user.update",
            EntityType = "User",
            EntityId = user.Id,
            Detail = $"Kullanıcı güncellendi: {user.Email}"
        });

        await db.SaveChangesAsync();

        var updatedRoles = await users.GetRolesAsync(user);
        return Ok(new UserDetailResponse(user.Id, user.Email!, user.DisplayName, user.IsActive, updatedRoles.ToArray(), user.CreatedAt));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var user = await users.FindByIdAsync(id);
        if (user is null) return NotFound();

        user.IsActive = false;
        await users.UpdateAsync(user);

        db.AuditLogs.Add(new AuditLog
        {
            UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            Action = "user.deactivate",
            EntityType = "User",
            EntityId = user.Id,
            Detail = $"Kullanıcı pasife alındı: {user.Email}"
        });

        await db.SaveChangesAsync();
        return NoContent();
    }
}

[ApiController, Route("api/v1/system")]
public sealed class SystemSettingsController(EducationDbContext db) : ControllerBase
{
    [HttpGet("settings")]
    public async Task<ActionResult<IReadOnlyList<SystemSettingResponse>>> ListSettings()
    {
        var list = await db.SystemSettings.AsNoTracking().OrderBy(x => x.Category).ThenBy(x => x.Key).ToListAsync();
        return Ok(list.Select(x => new SystemSettingResponse(x.Id, x.Key, x.Value, x.Category, x.Description, x.UpdatedAt)).ToList());
    }

    [HttpPut("settings/{key}")]
    public async Task<ActionResult<SystemSettingResponse>> UpdateSetting(string key, SystemSettingWriteRequest request)
    {
        var item = await db.SystemSettings.SingleOrDefaultAsync(x => x.Key == key);
        if (item is null)
        {
            item = new SystemSettingEntity { Key = key, Value = request.Value, Category = request.Category, Description = request.Description };
            db.SystemSettings.Add(item);
        }
        else
        {
            item.Value = request.Value;
            item.Category = request.Category;
            item.Description = request.Description;
        }

        await db.SaveChangesAsync();
        return Ok(new SystemSettingResponse(item.Id, item.Key, item.Value, item.Category, item.Description, item.UpdatedAt));
    }

    [HttpGet("audit-logs")]
    public async Task<ActionResult<IReadOnlyList<AuditLog>>> ListAuditLogs([FromQuery] int limit = 50)
    {
        var list = await db.AuditLogs.AsNoTracking().OrderByDescending(x => x.CreatedAt).Take(limit).ToListAsync();
        return Ok(list);
    }
}

