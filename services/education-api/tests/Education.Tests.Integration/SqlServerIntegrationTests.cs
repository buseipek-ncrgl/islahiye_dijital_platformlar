using Education.Domain;
using Education.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Education.Tests.Integration;

public sealed class SqlServerIntegrationTests : IAsyncLifetime
{
    private readonly string _database = $"IslahiyeEducationTests_{Guid.NewGuid():N}";
    private EducationDbContext Db() => new(new DbContextOptionsBuilder<EducationDbContext>().UseSqlServer($"Server=(localdb)\\MSSQLLocalDB;Database={_database};Trusted_Connection=True;TrustServerCertificate=True").Options);
    public async Task InitializeAsync() { await using var db = Db(); await db.Database.MigrateAsync(); }
    public async Task DisposeAsync() { await using var db = Db(); await db.Database.EnsureDeletedAsync(); }

    [Fact]
    public async Task Program_and_term_persist_in_real_sql_server()
    {
        var id = Guid.Empty;
        await using (var db = Db())
        {
            var p = new EducationProgram("SQL Kanıt Programı", $"sql-kanit-{Guid.NewGuid():N}", "Test", "Test", "Yok", "Test"); db.Programs.Add(p); await db.SaveChangesAsync(); id = p.Id;
            db.Terms.Add(new EducationTerm(p.Id, "Test Dönemi", new(2027, 3, 1), new(2027, 5, 1), new DateTime(2027, 1, 1, 0, 0, 0, DateTimeKind.Utc), new DateTime(2027, 2, 20, 0, 0, 0, DateTimeKind.Utc), 20)); await db.SaveChangesAsync();
        }
        await using var verify = Db(); Assert.Equal(1, await verify.Programs.CountAsync(x => x.Id == id)); Assert.Equal(1, await verify.Terms.CountAsync(x => x.ProgramId == id));
    }

    [Fact]
    public async Task Slug_unique_constraint_is_enforced()
    {
        await using var db = Db(); db.Programs.AddRange(new EducationProgram("A", "ayni-slug", "", "", "", ""), new EducationProgram("B", "ayni-slug", "", "", "", "")); await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
    }
}
