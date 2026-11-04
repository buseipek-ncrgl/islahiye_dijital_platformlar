using System.Threading.RateLimiting;
using Education.Api.Security;
using Education.Infrastructure;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls(builder.Configuration["Urls"] ?? "http://localhost:5234");

builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:5174")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.ConfigureApplicationCookie(o =>
{
    o.Cookie.Name = "IslahiyeEducation-Auth";
    o.Cookie.HttpOnly = true;
    o.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    o.Cookie.SameSite = SameSiteMode.Lax;
    o.SlidingExpiration = true;
    o.ExpireTimeSpan = TimeSpan.FromHours(8);
    o.Events.OnRedirectToLogin = c => { c.Response.StatusCode = 401; return Task.CompletedTask; };
    o.Events.OnRedirectToAccessDenied = c => { c.Response.StatusCode = 403; return Task.CompletedTask; };
});

builder.Services.AddAuthorization();
builder.Services.AddControllersWithViews();
builder.Services.AddOpenApi();

builder.Services.AddAntiforgery(o =>
{
    o.HeaderName = "X-CSRF-TOKEN";
    o.Cookie.Name = "IslahiyeEducation-Csrf";
    o.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    o.Cookie.SameSite = SameSiteMode.Lax;
});

builder.Services.AddScoped<PermissionService>();
builder.Services.AddSignalR();
builder.Services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("database", tags: ["ready"]);

builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 100, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});

builder.Services.AddProblemDetails(o => o.CustomizeProblemDetails = c => c.ProblemDetails.Extensions["traceId"] = c.HttpContext.TraceIdentifier);

var app = builder.Build();

app.UseExceptionHandler(error => error.Run(async context =>
{
    var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
    var status = exception switch
    {
        Education.Domain.DomainValidationException => 400,
        UnauthorizedAccessException => 401,
        DbUpdateConcurrencyException => 409,
        Microsoft.Data.SqlClient.SqlException => 503,
        DbUpdateException => 409,
        _ => 500
    };
    context.Response.StatusCode = status;
    await Results.Problem(statusCode: status, title: status >= 500 ? "Servis geçici olarak kullanılamıyor" : "İstek işlenemedi", detail: status >= 500 ? "Veri hizmetine erişilemedi." : exception?.Message).ExecuteAsync(context);
}));

if (app.Environment.IsEnvironment("Testing"))
    app.UseForwardedHeaders(new ForwardedHeadersOptions { ForwardedHeaders = ForwardedHeaders.XForwardedProto });

app.UseCors("AllowFrontend");
app.UseStaticFiles();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapOpenApi();
app.MapControllers();
app.MapHub<Education.Api.Hubs.EducationHub>("/hubs/education");

app.MapGet("/health/live", () => Results.Ok(new { status = "live", timestamp = DateTime.UtcNow })).AllowAnonymous();
app.MapHealthChecks("/health/ready", new() { Predicate = x => x.Tags.Contains("ready") });

// Auto-create database schema and seed reference data on start
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<EducationDbContext>();
    var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var users = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

    await db.Database.EnsureCreatedAsync();
    await InfrastructureSetup.SeedReferenceDataAsync(db, roles, users);
}

if (args.Any(x => x is "--bootstrap-superadmin" or "--verify-bootstrap-status" or "--seed-e2e-admin" or "--verify-e2e" or "--cleanup-e2e"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<EducationDbContext>();
    if (args.Contains("--bootstrap-superadmin")) await Bootstrap.RunInteractiveAsync(scope.ServiceProvider, builder.Configuration, builder.Environment);
    if (args.Contains("--verify-bootstrap-status")) await Bootstrap.VerifyStatusAsync(scope.ServiceProvider, builder.Configuration);
    if (args.Contains("--seed-e2e-admin")) await E2eTestData.SeedAsync(scope.ServiceProvider, builder.Configuration, builder.Environment);
    if (args.Contains("--verify-e2e")) await E2eTestData.VerifyAsync(db, builder.Configuration, builder.Environment);
    if (args.Contains("--cleanup-e2e")) await E2eTestData.CleanupAsync(db, builder.Configuration, builder.Environment);
    return;
}

app.Run();

public partial class Program { }

public sealed class DatabaseHealthCheck(EducationDbContext db) : Microsoft.Extensions.Diagnostics.HealthChecks.IHealthCheck
{
    public async Task<Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult> CheckHealthAsync(Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckContext context, CancellationToken cancellationToken = default)
        => await db.Database.CanConnectAsync(cancellationToken)
            ? Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Healthy("Veritabanı erişilebilir.")
            : Microsoft.Extensions.Diagnostics.HealthChecks.HealthCheckResult.Unhealthy("Veritabanına erişilemiyor.");
}
