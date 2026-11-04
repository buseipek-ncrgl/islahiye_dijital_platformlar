using Education.Domain;
using Education.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Education.Api.Security;

public static class Bootstrap
{
    public static async Task VerifyStatusAsync(IServiceProvider services, IConfiguration config)
    {
        var db = services.GetRequiredService<EducationDbContext>();
        if (!await db.Database.CanConnectAsync()) throw new InvalidOperationException("SQL Server bağlantısı doğrulanamadı.");
        var manager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var superAdmins = await manager.GetUsersInRoleAsync("SuperAdmin");
        var state = await db.BootstrapStates.AsNoTracking().SingleOrDefaultAsync();
        var bootstrapAudits = await db.AuditLogs.AsNoTracking().CountAsync(x => x.Action == "superadmin.bootstrap");
        var role = await db.Roles.AsNoTracking().SingleOrDefaultAsync(x => x.NormalizedName == "SUPERADMIN");
        var permissionCount = role is null ? 0 : await db.RolePermissions.AsNoTracking().CountAsync(x => x.RoleId == role.Id);
        var enabled = config.GetValue<bool>("Bootstrap:Enabled");
        Console.WriteLine($"Bootstrap durumu: completed={state?.IsCompleted == true}; superAdminCount={superAdmins.Count}; bootstrapAuditCount={bootstrapAudits}; superAdminPermissionCount={permissionCount}; enabled={enabled}.");
        if (state?.IsCompleted != true || superAdmins.Count != 1 || bootstrapAudits != 1 || permissionCount == 0)
            throw new InvalidOperationException("Bootstrap kabul koşulları tamamlanmamış veya tutarsız.");
        if (enabled) throw new InvalidOperationException("Bootstrap normal yapılandırmada açık kalmış.");
        Console.WriteLine("Bootstrap tek-kullanım durumu ve normal ortam kapalı ayarı doğrulandı; hassas veri yazdırılmadı.");
    }

    public static async Task RunInteractiveAsync(IServiceProvider services, IConfiguration config, IHostEnvironment environment)
    {
        if (!config.GetValue<bool>("Bootstrap:Enabled") || (environment.EnvironmentName is not "Development" and not "Installation"))
            throw new InvalidOperationException("Bootstrap yalnızca Bootstrap__Enabled=true ve Development/Installation ortamında çalışır.");
        if (Console.IsInputRedirected) throw new InvalidOperationException("Etkileşimli terminal zorunludur; parola argüman, pipe veya dosyadan alınamaz.");
        var db = services.GetRequiredService<EducationDbContext>();
        if (!await db.Database.CanConnectAsync()) throw new InvalidOperationException("SQL Server bağlantısı doğrulanamadı.");
        var manager = services.GetRequiredService<UserManager<ApplicationUser>>();
        if (await manager.GetUsersInRoleAsync("SuperAdmin") is { Count: > 0 }) throw new InvalidOperationException("Sistemde zaten bir SuperAdmin var; bootstrap kapalıdır.");
        var state = await db.BootstrapStates.SingleAsync();
        if (state.IsCompleted) throw new InvalidOperationException("İlk yönetici bootstrap işlemi daha önce tamamlandı.");

        Console.Write("İlk süper yönetici e-posta adresi: ");
        var email = (Console.ReadLine() ?? string.Empty).Trim();
        Console.Write("Parola (ekranda görünmez): "); var password = ReadSecret(); Console.WriteLine();
        Console.Write("Parolayı tekrar girin: "); var confirmation = ReadSecret(); Console.WriteLine();
        if (!string.Equals(password, confirmation, StringComparison.Ordinal)) throw new InvalidOperationException("Parolalar eşleşmiyor.");
        if (string.IsNullOrWhiteSpace(email)) throw new InvalidOperationException("E-posta zorunludur.");

        await using var tx = await db.Database.BeginTransactionAsync();
        var user = new ApplicationUser { UserName = email, Email = email, DisplayName = "İlk Süper Yönetici", EmailConfirmed = true };
        var result = await manager.CreateAsync(user, password);
        if (!result.Succeeded) throw new InvalidOperationException(string.Join("; ", result.Errors.Select(x => x.Description)));
        result = await manager.AddToRoleAsync(user, "SuperAdmin");
        if (!result.Succeeded) throw new InvalidOperationException(string.Join("; ", result.Errors.Select(x => x.Description)));
        state.IsCompleted = true; state.CompletedAt = DateTime.UtcNow;
        db.AuditLogs.Add(new AuditLog { UserId = user.Id, Action = "superadmin.bootstrap", EntityType = "User", EntityId = user.Id, Detail = "Yetkili yerel kurulum; e-posta doğrulaması bootstrap istisnasıyla onaylandı. MFA üretim öncesi zorunludur." });
        await db.SaveChangesAsync(); await tx.CommitAsync();
        Array.Clear(password.ToCharArray()); Array.Clear(confirmation.ToCharArray());
        Console.WriteLine("İlk süper yönetici güvenli biçimde oluşturuldu. Bootstrap artık tekrar kullanılamaz.");
    }

    private static string ReadSecret()
    {
        var value = new System.Text.StringBuilder();
        while (true)
        {
            var key = Console.ReadKey(true);
            if (key.Key == ConsoleKey.Enter) break;
            if (key.Key == ConsoleKey.Backspace) { if (value.Length > 0) value.Length--; continue; }
            if (!char.IsControl(key.KeyChar)) value.Append(key.KeyChar);
        }
        return value.ToString();
    }
}
