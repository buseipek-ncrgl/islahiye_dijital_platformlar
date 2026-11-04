using System.Security.Claims;
using Education.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Education.Api.Security;

public sealed class PermissionService(EducationDbContext db, UserManager<ApplicationUser> users)
{
    public async Task<IReadOnlyList<string>> GetPermissionsAsync(ClaimsPrincipal principal)
    {
        var user = await users.GetUserAsync(principal); if (user is null || !user.IsActive) return [];
        return await GetPermissionsAsync(user);
    }
    public async Task<IReadOnlyList<string>> GetPermissionsAsync(ApplicationUser user)
    {
        var roles = await users.GetRolesAsync(user);
        return await (from rp in db.RolePermissions join r in db.Roles on rp.RoleId equals r.Id join p in db.Permissions on rp.PermissionId equals p.Id where roles.Contains(r.Name!) select p.Key).Distinct().ToListAsync();
    }
    public async Task<bool> HasAsync(ClaimsPrincipal principal, string permission) => (await GetPermissionsAsync(principal)).Contains(permission);
}
