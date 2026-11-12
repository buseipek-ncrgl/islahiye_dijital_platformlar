using System.Text.Json.Serialization;
using Gastronomy.Application.Interfaces;
using Gastronomy.Application.Services;
using Gastronomy.Infrastructure;
using Gastronomy.Infrastructure.Data;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

// Port configuration (gastronomy api runs on 5235)
builder.WebHost.UseUrls(builder.Configuration["Urls"] ?? "http://localhost:5235");

// Application services
builder.Services.AddSingleton<IRecipeScaler, RecipeScaler>();

// Infrastructure
builder.Services.AddGastronomyInfrastructure(builder.Configuration);

// CORS for gastronomy frontend & local development
var configuredOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
var defaultOrigins = new[]
{
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
};
var allAllowedOrigins = defaultOrigins.Concat(configuredOrigins).Where(o => !string.IsNullOrWhiteSpace(o)).Distinct().ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowGastronomyFrontend", policy =>
    {
        policy.WithOrigins(allAllowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddOpenApi();

// Health checks
builder.Services.AddHealthChecks()
    .AddCheck<GastronomyDatabaseHealthCheck>("gastronomy_database", tags: ["ready"]);

builder.Services.AddProblemDetails(o =>
    o.CustomizeProblemDetails = c => c.ProblemDetails.Extensions["traceId"] = c.HttpContext.TraceIdentifier);

var app = builder.Build();

// Global Exception Handler
app.UseExceptionHandler(errorApp => errorApp.Run(async context =>
{
    var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
    var status = exception switch
    {
        ArgumentException or FormatException => StatusCodes.Status400BadRequest,
        KeyNotFoundException => StatusCodes.Status404NotFound,
        UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
        _ => StatusCodes.Status500InternalServerError
    };

    context.Response.StatusCode = status;
    await Results.Problem(
        statusCode: status,
        title: status >= 500 ? "Gastronomi veri servisi geçici olarak kullanılamıyor" : "İstek işlenemedi",
        detail: status >= 500 ? "Veritabanı veya iç sunucu hatası oluştu." : exception?.Message
    ).ExecuteAsync(context);
}));

app.UseCors("AllowGastronomyFrontend");
app.UseStaticFiles();

app.MapOpenApi();
app.MapControllers();

// Health check endpoints
app.MapGet("/health/live", () => Results.Ok(new
{
    status = "live",
    service = "Gastronomy.Api",
    version = "1.0.0",
    timestamp = DateTimeOffset.UtcNow
})).AllowAnonymous();

app.MapHealthChecks("/health/ready", new()
{
    Predicate = x => x.Tags.Contains("ready")
});

// Root welcome / info endpoint
app.MapGet("/", () => Results.Ok(new
{
    service = "İslahiye Dijital Platformlar — Gastronomi API",
    version = "1.0.0",
    docs = "/openapi/v1.json",
    health = "/health/live",
    endpoints = new[]
    {
        "/api/dishes",
        "/api/recipes",
        "/api/places",
        "/api/places/map",
        "/api/stories",
        "/api/films",
        "/api/news",
        "/api/catalog/overview"
    }
}));

// Automatic database migration & seeding on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var db = services.GetRequiredService<GastronomyDbContext>();

    try
    {
        await db.Database.EnsureCreatedAsync();
        await GastronomyDataSeeder.SeedAsync(db, logger);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Veritabanı oluşturma veya tohumlama sırasında hata oluştu.");
    }
}

app.Run();

public partial class Program { }

public sealed class GastronomyDatabaseHealthCheck(GastronomyDbContext db) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var canConnect = await db.Database.CanConnectAsync(cancellationToken);
            return canConnect
                ? HealthCheckResult.Healthy("Gastronomi veritabanı aktif ve erişilebilir.")
                : HealthCheckResult.Unhealthy("Gastronomi veritabanına bağlanılamıyor.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Veritabanı sağlık kontrolünde hata.", ex);
        }
    }
}

