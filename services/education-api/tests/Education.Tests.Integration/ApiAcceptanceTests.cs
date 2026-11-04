using System.Net;
using System.Net.Http.Json;
using Education.Application;
using Education.Domain;
using Education.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

[assembly: CollectionBehavior(DisableTestParallelization = true)]

namespace Education.Tests.Integration;

public sealed class EducationApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public string DatabaseName { get; } = $"IslahiyeEducationApiTests_{Guid.NewGuid():N}";
    public string ConnectionString => $"Server=(localdb)\\MSSQLLocalDB;Database={DatabaseName};Trusted_Connection=True;TrustServerCertificate=True";
    public EducationApiFactory() => Environment.SetEnvironmentVariable("ConnectionStrings__EducationDb", ConnectionString);
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?> { ["ConnectionStrings:EducationDb"] = ConnectionString }));
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<EducationDbContext>>();
            services.AddDbContext<EducationDbContext>(o => o.UseSqlServer(ConnectionString));
        });
    }
    public async Task InitializeAsync()
    {
        using var scope = Services.CreateScope(); var db = scope.ServiceProvider.GetRequiredService<EducationDbContext>(); await db.Database.MigrateAsync();
        await InfrastructureSetup.SeedReferenceDataAsync(db, scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>());
    }
    async Task IAsyncLifetime.DisposeAsync() => await CleanupAsync();
    public async Task CleanupAsync() { using var scope = Services.CreateScope(); await scope.ServiceProvider.GetRequiredService<EducationDbContext>().Database.EnsureDeletedAsync(); Environment.SetEnvironmentVariable("ConnectionStrings__EducationDb", null); Dispose(); }
    public async Task<ApplicationUser> CreateUserAsync(string email, string role, bool active = true)
    {
        using var scope = Services.CreateScope(); var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = new ApplicationUser { Email = email, UserName = email, DisplayName = "Sentetik Test Kullanıcısı", EmailConfirmed = true, IsActive = active };
        var result = await users.CreateAsync(user, "Test!Password123"); Assert.True(result.Succeeded, string.Join(';', result.Errors.Select(x => x.Description)));
        await users.AddToRoleAsync(user, role); return user;
    }
    public HttpClient Client() => CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), HandleCookies = true, AllowAutoRedirect = false });
}

public sealed class ApiAcceptanceTests : IClassFixture<EducationApiFactory>
{
    private readonly EducationApiFactory factory;
    public ApiAcceptanceTests(EducationApiFactory factory) => this.factory = factory;

    [Fact]
    public async Task Authentication_session_csrf_authorization_lockout_and_rate_limit_are_real()
    {
        var email = $"admin-{Guid.NewGuid():N}@test.invalid"; var admin = await factory.CreateUserAsync(email, "Admin");
        using var client = factory.Client(); var csrf = await GetCsrf(client);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/v1/auth/me")).StatusCode);
        using (var scope = factory.Services.CreateScope()) { var db = scope.ServiceProvider.GetRequiredService<EducationDbContext>(); var stored = await db.Users.AsNoTracking().SingleAsync(x => x.Id == admin.Id); Assert.NotEqual("Test!Password123", stored.PasswordHash); Assert.False(string.IsNullOrWhiteSpace(stored.PasswordHash)); }
        using (var registration = factory.Client()) { var registrationCsrf = await GetCsrf(registration); var registered = await Post(registration, "/api/v1/auth/register", new { email = $"self-{Guid.NewGuid():N}@test.invalid", password = "Test!Password123", displayName = "Test", role = "SuperAdmin" }, registrationCsrf); Assert.Equal(HttpStatusCode.Created, registered.StatusCode); Assert.Equal(["Applicant"], (await registered.Content.ReadFromJsonAsync<UserResponse>())!.Roles); }
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/v1/auth/login", new { email, password = "Test!Password123" })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await Post(client, "/api/v1/auth/login", new { email, password = "Wrong!Password123" }, csrf)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await Post(client, "/api/v1/auth/login", new { email = "missing@test.invalid", password = "Wrong!Password123" }, csrf)).StatusCode);
        var login = await Post(client, "/api/v1/auth/login", new { email, password = "Test!Password123" }, csrf); Assert.Equal(HttpStatusCode.OK, login.StatusCode); Assert.Contains("__Host-IslahiyeEducation", string.Join(';', login.Headers.GetValues("Set-Cookie")));
        var me = await client.GetFromJsonAsync<UserResponse>("/api/v1/auth/me"); Assert.Equal(email, me!.Email); Assert.Contains("Admin", me.Roles); csrf = await GetCsrf(client);
        Assert.Equal(HttpStatusCode.NoContent, (await Post(client, "/api/v1/auth/logout", new { }, csrf)).StatusCode); Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/v1/auth/me")).StatusCode);

        var applicantEmail = $"applicant-{Guid.NewGuid():N}@test.invalid"; await factory.CreateUserAsync(applicantEmail, "Applicant"); using var applicant = factory.Client(); var applicantCsrf = await GetCsrf(applicant);
        Assert.Equal(HttpStatusCode.OK, (await Post(applicant, "/api/v1/auth/login", new { email = applicantEmail, password = "Test!Password123" }, applicantCsrf)).StatusCode); applicantCsrf = await GetCsrf(applicant);
        var forbidden = new HttpRequestMessage(HttpMethod.Post, "/api/v1/programs") { Content = JsonContent.Create(ProgramBody("forbidden")) }; forbidden.Headers.Add("X-CSRF-TOKEN", applicantCsrf); forbidden.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString()); Assert.Equal(HttpStatusCode.Forbidden, (await applicant.SendAsync(forbidden)).StatusCode);

        using (var scope = factory.Services.CreateScope()) { var db = scope.ServiceProvider.GetRequiredService<EducationDbContext>(); await db.Users.Where(x => x.Id == admin.Id).ExecuteUpdateAsync(x => x.SetProperty(u => u.IsActive, false)); }
        using var inactive = factory.Client(); var inactiveCsrf = await GetCsrf(inactive); Assert.Equal(HttpStatusCode.Unauthorized, (await Post(inactive, "/api/v1/auth/login", new { email, password = "Test!Password123" }, inactiveCsrf)).StatusCode);

        var lockedEmail = $"locked-{Guid.NewGuid():N}@test.invalid"; await factory.CreateUserAsync(lockedEmail, "Applicant"); using var locked = factory.Client(); var lockedCsrf = await GetCsrf(locked);
        for (var i = 0; i < 5; i++) await Post(locked, "/api/v1/auth/login", new { email = lockedEmail, password = "Wrong!Password123" }, lockedCsrf);
        Assert.Equal(HttpStatusCode.Unauthorized, (await Post(locked, "/api/v1/auth/login", new { email = lockedEmail, password = "Test!Password123" }, lockedCsrf)).StatusCode);

        var rateFactory = new EducationApiFactory(); await rateFactory.InitializeAsync();
        try { using var limited = rateFactory.Client(); var limitedCsrf = await GetCsrf(limited); HttpStatusCode last = 0; for (var i = 0; i < 55; i++) last = (await Post(limited, "/api/v1/auth/login", new { email = $"rate-{i}@test.invalid", password = "Wrong!Password123" }, limitedCsrf)).StatusCode; Assert.Equal(HttpStatusCode.TooManyRequests, last); }
        finally { await rateFactory.CleanupAsync(); }
    }

    [Fact]
    public async Task Program_term_visibility_idempotency_concurrency_and_sql_persistence_work()
    {
        var email = $"admin-flow-{Guid.NewGuid():N}@test.invalid"; await factory.CreateUserAsync(email, "Admin"); using var admin = factory.Client(); var csrf = await GetCsrf(admin);
        Assert.Equal(HttpStatusCode.OK, (await Post(admin, "/api/v1/auth/login", new { email, password = "Test!Password123" }, csrf)).StatusCode); csrf = await GetCsrf(admin);
        var key = Guid.NewGuid().ToString(); var create = await SendProgram(admin, ProgramBody("kalici-program"), csrf, key); Assert.Equal(HttpStatusCode.Created, create.StatusCode); var program = await create.Content.ReadFromJsonAsync<ProgramResponse>();
        var replay = await SendProgram(admin, ProgramBody("kalici-program"), csrf, key); Assert.Equal(HttpStatusCode.Created, replay.StatusCode); Assert.Equal(program!.Id, (await replay.Content.ReadFromJsonAsync<ProgramResponse>())!.Id);
        Assert.Equal(HttpStatusCode.Conflict, (await SendProgram(admin, ProgramBody("farkli-icerik"), csrf, key)).StatusCode);
        using var anonymous = factory.Client(); Assert.DoesNotContain((await anonymous.GetFromJsonAsync<List<ProgramResponse>>("/api/v1/programs"))!, x => x.Id == program.Id);

        var invalidTerm = new { name = "Hatalı", startDate = "2027-05-01", endDate = "2027-04-01", applicationStartAt = "2027-01-01T00:00:00Z", applicationEndAt = "2027-02-01T00:00:00Z", capacity = -1, status = 0, rowVersion = (string?)null };
        Assert.Equal(HttpStatusCode.BadRequest, (await Post(admin, $"/api/v1/programs/{program.Id}/terms", invalidTerm, csrf)).StatusCode);
        var termBody = new { name = "2027 Bahar", startDate = "2027-03-01", endDate = "2027-05-31", applicationStartAt = "2027-01-01T00:00:00Z", applicationEndAt = "2027-02-20T00:00:00Z", capacity = 20, status = 1, rowVersion = (string?)null };
        var termResponse = await Post(admin, $"/api/v1/programs/{program.Id}/terms", termBody, csrf); Assert.Equal(HttpStatusCode.Created, termResponse.StatusCode); var term = await termResponse.Content.ReadFromJsonAsync<TermResponse>();
        var publishBody = new ProgramWriteRequest(program.Name, program.Slug, program.Description, program.TargetAudience, program.Prerequisites, program.LearningOutcomes, PublicationStatus.Published, program.RowVersion);
        var publish = await Put(admin, $"/api/v1/programs/{program.Id}", publishBody, csrf); Assert.Equal(HttpStatusCode.OK, publish.StatusCode); var published = await publish.Content.ReadFromJsonAsync<ProgramResponse>();
        Assert.Contains((await anonymous.GetFromJsonAsync<List<ProgramResponse>>("/api/v1/programs"))!, x => x.Id == program.Id);
        Assert.Equal(HttpStatusCode.Conflict, (await Put(admin, $"/api/v1/programs/{program.Id}", publishBody, csrf)).StatusCode);
        var termUpdate = new TermWriteRequest(term!.Name, term.StartDate, term.EndDate, term.ApplicationStartAt, term.ApplicationEndAt, 25, PublicationStatus.Published, term.RowVersion);
        Assert.Equal(HttpStatusCode.OK, (await Put(admin, $"/api/v1/terms/{term.Id}", termUpdate, csrf)).StatusCode); Assert.Equal(HttpStatusCode.Conflict, (await Put(admin, $"/api/v1/terms/{term.Id}", termUpdate, csrf)).StatusCode);
        var archive = new ProgramWriteRequest(published!.Name, published.Slug, published.Description, published.TargetAudience, published.Prerequisites, published.LearningOutcomes, PublicationStatus.Archived, published.RowVersion);
        Assert.Equal(HttpStatusCode.OK, (await Put(admin, $"/api/v1/programs/{program.Id}", archive, csrf)).StatusCode);
        using var scope = factory.Services.CreateScope(); var db = scope.ServiceProvider.GetRequiredService<EducationDbContext>(); Assert.Equal(1, await db.Programs.CountAsync(x => x.Id == program.Id)); Assert.Equal(1, await db.Terms.CountAsync(x => x.ProgramId == program.Id)); Assert.Equal(1, await db.IdempotencyRecords.CountAsync(x => x.Key == key));
    }

    [Fact]
    public async Task Database_unavailable_returns_unhealthy_and_5xx_without_fallback_then_recovers()
    {
        Environment.SetEnvironmentVariable("ConnectionStrings__EducationDb", "Server=127.0.0.1,1;Database=Unavailable;User Id=none;Password=none;TrustServerCertificate=True;Connect Timeout=1");
        try
        {
            using var unavailable = new WebApplicationFactory<Program>().WithWebHostBuilder(b => b.UseEnvironment("Testing"));
            using var client = unavailable.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), AllowAutoRedirect = false });
            Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.GetAsync("/health/ready")).StatusCode);
            Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.GetAsync("/api/v1/programs")).StatusCode);
        }
        finally { Environment.SetEnvironmentVariable("ConnectionStrings__EducationDb", factory.ConnectionString); }
        using var recovered = factory.Client(); Assert.Equal(HttpStatusCode.OK, (await recovered.GetAsync("/health/ready")).StatusCode); Assert.Equal(HttpStatusCode.OK, (await recovered.GetAsync("/api/v1/programs")).StatusCode);
    }

    private static object ProgramBody(string slug) => new { name = "B01.1 Test Programı", slug, description = "Sentetik test", targetAudience = "Test", prerequisites = "Yok", learningOutcomes = "Test", status = 0, rowVersion = (string?)null };
    private static async Task<string> GetCsrf(HttpClient client) => (await (await client.GetAsync("/api/v1/auth/csrf")).Content.ReadFromJsonAsync<CsrfResponse>())!.Token;
    private static Task<HttpResponseMessage> Post(HttpClient c, string url, object body, string csrf) { var r = new HttpRequestMessage(HttpMethod.Post, url) { Content = JsonContent.Create(body) }; r.Headers.Add("X-CSRF-TOKEN", csrf); return c.SendAsync(r); }
    private static Task<HttpResponseMessage> Put(HttpClient c, string url, object body, string csrf) { var r = new HttpRequestMessage(HttpMethod.Put, url) { Content = JsonContent.Create(body) }; r.Headers.Add("X-CSRF-TOKEN", csrf); return c.SendAsync(r); }
    private static Task<HttpResponseMessage> SendProgram(HttpClient c, object body, string csrf, string key) { var r = new HttpRequestMessage(HttpMethod.Post, "/api/v1/programs") { Content = JsonContent.Create(body) }; r.Headers.Add("X-CSRF-TOKEN", csrf); r.Headers.Add("Idempotency-Key", key); return c.SendAsync(r); }
    private sealed record CsrfResponse(string Token);
}
