using Education.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Education.Api.Security;

public static class E2eTestData
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration config, IHostEnvironment environment)
    {
        EnsureIsolatedTestDatabase(config, environment);
        var email = config["E2E:AdminEmail"] ?? throw new InvalidOperationException("E2E test e-postası tanımlı değil.");
        var password = config["E2E:AdminPassword"] ?? throw new InvalidOperationException("E2E test parolası tanımlı değil.");
        var users = services.GetRequiredService<UserManager<ApplicationUser>>();
        if (await users.FindByEmailAsync(email) is not null) throw new InvalidOperationException("E2E test yöneticisi zaten mevcut.");
        var user = new ApplicationUser { Email = email, UserName = email, DisplayName = "Sentetik E2E Yöneticisi", EmailConfirmed = true };
        var created = await users.CreateAsync(user, password);
        if (!created.Succeeded) throw new InvalidOperationException(string.Join("; ", created.Errors.Select(x => x.Description)));
        var role = await users.AddToRoleAsync(user, "Admin");
        if (!role.Succeeded) throw new InvalidOperationException(string.Join("; ", role.Errors.Select(x => x.Description)));
        Console.WriteLine("İzole E2E test yöneticisi oluşturuldu; hassas bilgiler yazdırılmadı.");
    }

    public static async Task VerifyAsync(EducationDbContext db, IConfiguration config, IHostEnvironment environment)
    {
        EnsureIsolatedTestDatabase(config, environment);
        var slug = config["E2E:ExpectedProgramSlug"] ?? throw new InvalidOperationException("Beklenen E2E program slug değeri tanımlı değil.");
        var program = await db.Programs.AsNoTracking().SingleOrDefaultAsync(x => x.Slug == slug);
        if (program is null) throw new InvalidOperationException("E2E programı SQL Server'da bulunamadı.");
        var termCount = await db.Terms.AsNoTracking().CountAsync(x => x.ProgramId == program.Id);
        var auditCount = await db.AuditLogs.AsNoTracking().CountAsync(x => x.EntityId == program.Id.ToString());
        if (termCount != 1 || auditCount < 2) throw new InvalidOperationException("E2E SQL ilişkileri veya audit kanıtı eksik.");
        Console.WriteLine($"SQL kanıtı doğrulandı: program=1, dönem={termCount}, audit>={auditCount}, durum={program.Status}.");
    }

    public static async Task CleanupAsync(EducationDbContext db, IConfiguration config, IHostEnvironment environment)
    {
        EnsureIsolatedTestDatabase(config, environment);
        await db.Database.EnsureDeletedAsync();
        Console.WriteLine("İzole E2E test veritabanı silindi.");
    }

    private static void EnsureIsolatedTestDatabase(IConfiguration config, IHostEnvironment environment)
    {
        if (!environment.IsEnvironment("Testing")) throw new InvalidOperationException("E2E veri işlemleri yalnız Testing ortamında çalışır.");
        var connection = config.GetConnectionString("EducationDb") ?? throw new InvalidOperationException("E2E SQL bağlantısı tanımlı değil.");
        var database = new SqlConnectionStringBuilder(connection).InitialCatalog;
        if (string.IsNullOrWhiteSpace(database) || !database.StartsWith("IslahiyeEducationE2E_", StringComparison.Ordinal))
            throw new InvalidOperationException("E2E veri işlemleri yalnız IslahiyeEducationE2E_* veritabanlarında çalışır.");
    }
}
