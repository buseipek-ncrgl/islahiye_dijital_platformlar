using Gastronomy.Infrastructure;
using Gastronomy.Infrastructure.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Gastronomy.Tests;

public class BusinessRuleComplianceTests : IDisposable
{
    private readonly SqliteConnection _connection;

    public BusinessRuleComplianceTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();
    }

    public void Dispose()
    {
        _connection.Dispose();
    }

    private async Task<GastronomyDbContext> CreateDbContextAsync()
    {
        var options = new DbContextOptionsBuilder<GastronomyDbContext>()
            .UseSqlite(_connection)
            .Options;

        var db = new GastronomyDbContext(options);
        await db.Database.EnsureCreatedAsync();
        await GastronomyDataSeeder.SeedAsync(db, NullLogger.Instance);
        return db;
    }

    [Fact]
    public async Task GeographicalIndication_Rule_OnlyIslahiyeBiberiIsRegisteredWith991()
    {
        // Kural: Yalnızca TÜRKPATENT tescil no 991 İslahiye Biberi tescilli olmalıdır.
        // Doğrulanmamış hiçbir yemek tescilli olarak işaretlenemez.
        await using var db = await CreateDbContextAsync();

        var registeredDishes = await db.Dishes
            .Where(d => d.IsRegisteredGeographicalIndication)
            .ToListAsync();

        Assert.Single(registeredDishes);

        var biber = registeredDishes.First();
        Assert.Equal("islahiye-biberi", biber.Slug);
        Assert.Equal("991", biber.GiRegistrationNumber);
    }

    [Fact]
    public async Task Dish_And_Recipe_Separation_Rule()
    {
        // Kural: Gastronomi: yemek (Dish) ve tarif (Recipe) ayrı kavramlardır;
        // bir yemek için birden fazla tarif/video olabilir.
        await using var db = await CreateDbContextAsync();

        var dishWithRecipes = await db.Dishes
            .Include(d => d.Recipes)
                .ThenInclude(r => r.Ingredients)
            .FirstOrDefaultAsync(d => d.Slug == "islahiye-tava");

        Assert.NotNull(dishWithRecipes);
        Assert.NotEmpty(dishWithRecipes.Recipes);

        var recipe = dishWithRecipes.Recipes.First();
        Assert.Equal(dishWithRecipes.Id, recipe.DishId);
        Assert.NotEmpty(recipe.Ingredients);
    }

    [Fact]
    public async Task Places_VerifiedCoordinates_MustBeWithinIslahiyeBounds()
    {
        // Kural: Haritada konumu olmayan yemeğe hayali koordinat atama.
        // Doğrulanmış noktalar İslahiye coğrafi sınırlarında olmalıdır (36.9 - 37.2 Enlem, 36.5 - 36.8 Boylam).
        await using var db = await CreateDbContextAsync();

        var verifiedPlaces = await db.Places
            .Where(p => p.HasVerifiedCoordinates)
            .ToListAsync();

        Assert.NotEmpty(verifiedPlaces);

        foreach (var place in verifiedPlaces)
        {
            Assert.InRange(place.Latitude, 36.90, 37.20);
            Assert.InRange(place.Longitude, 36.50, 36.80);
            Assert.False(string.IsNullOrWhiteSpace(place.VerificationSource));
        }
    }
}
