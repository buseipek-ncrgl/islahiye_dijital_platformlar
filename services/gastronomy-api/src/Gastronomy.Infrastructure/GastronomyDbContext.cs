using Gastronomy.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Gastronomy.Infrastructure;

public class GastronomyDbContext : DbContext
{
    public GastronomyDbContext(DbContextOptions<GastronomyDbContext> options) : base(options)
    {
    }

    public DbSet<Dish> Dishes => Set<Dish>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<RecipeIngredient> RecipeIngredients => Set<RecipeIngredient>();
    public DbSet<RecipeStep> RecipeSteps => Set<RecipeStep>();
    public DbSet<GastronomyPlace> Places => Set<GastronomyPlace>();
    public DbSet<Artisan> Artisans => Set<Artisan>();
    public DbSet<CulturalHeritageStory> Stories => Set<CulturalHeritageStory>();
    public DbSet<GastronomyFilm> Films => Set<GastronomyFilm>();
    public DbSet<NewsEvent> NewsEvents => Set<NewsEvent>();
    public DbSet<MediaItem> MediaItems => Set<MediaItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Dish
        modelBuilder.Entity<Dish>(b =>
        {
            b.HasKey(d => d.Id);
            b.Property(d => d.Id).HasMaxLength(64);
            b.Property(d => d.Slug).HasMaxLength(128).IsRequired();
            b.Property(d => d.Name).HasMaxLength(160).IsRequired();
            b.Property(d => d.CategoryLabel).HasMaxLength(80);
            b.Property(d => d.Tagline).HasMaxLength(300);
            b.Property(d => d.ShortDescription).HasMaxLength(500);
            b.Property(d => d.ImageUrl).HasMaxLength(500);
            b.HasIndex(d => d.Slug).IsUnique();
            b.HasIndex(d => d.Category);
            b.HasIndex(d => d.IsRegisteredGeographicalIndication);

            b.HasMany(d => d.Recipes)
             .WithOne(r => r.Dish)
             .HasForeignKey(r => r.DishId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // Recipe
        modelBuilder.Entity<Recipe>(b =>
        {
            b.HasKey(r => r.Id);
            b.Property(r => r.Id).HasMaxLength(64);
            b.Property(r => r.DishId).HasMaxLength(64).IsRequired();
            b.Property(r => r.Slug).HasMaxLength(128).IsRequired();
            b.Property(r => r.Title).HasMaxLength(160).IsRequired();
            b.Property(r => r.AuthorName).HasMaxLength(100);
            b.Property(r => r.YieldUnit).HasMaxLength(40);
            b.HasIndex(r => r.Slug).IsUnique();

            b.HasMany(r => r.Ingredients)
             .WithOne(i => i.Recipe)
             .HasForeignKey(i => i.RecipeId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasMany(r => r.Steps)
             .WithOne(s => s.Recipe)
             .HasForeignKey(s => s.RecipeId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        // RecipeIngredient
        modelBuilder.Entity<RecipeIngredient>(b =>
        {
            b.HasKey(i => i.Id);
            b.Property(i => i.Id).HasMaxLength(64);
            b.Property(i => i.RecipeId).HasMaxLength(64).IsRequired();
            b.Property(i => i.Name).HasMaxLength(160).IsRequired();
            b.Property(i => i.Unit).HasMaxLength(40);
            b.Property(i => i.Category).HasMaxLength(60);
            b.Property(i => i.Amount).HasPrecision(10, 2);
        });

        // RecipeStep
        modelBuilder.Entity<RecipeStep>(b =>
        {
            b.HasKey(s => s.Id);
            b.Property(s => s.Id).HasMaxLength(64);
            b.Property(s => s.RecipeId).HasMaxLength(64).IsRequired();
            b.Property(s => s.Title).HasMaxLength(160);
        });

        // GastronomyPlace
        modelBuilder.Entity<GastronomyPlace>(b =>
        {
            b.HasKey(p => p.Id);
            b.Property(p => p.Id).HasMaxLength(64);
            b.Property(p => p.Slug).HasMaxLength(128).IsRequired();
            b.Property(p => p.Name).HasMaxLength(160).IsRequired();
            b.Property(p => p.District).HasMaxLength(80);
            b.Property(p => p.Neighborhood).HasMaxLength(80);
            b.Property(p => p.ShortAddress).HasMaxLength(250);
            b.Property(p => p.CoverImageUrl).HasMaxLength(500);
            b.HasIndex(p => p.Slug).IsUnique();
            b.HasIndex(p => p.Category);
        });

        // Artisan
        modelBuilder.Entity<Artisan>(b =>
        {
            b.HasKey(a => a.Id);
            b.Property(a => a.Id).HasMaxLength(64);
            b.Property(a => a.Slug).HasMaxLength(128).IsRequired();
            b.Property(a => a.FullName).HasMaxLength(120).IsRequired();
            b.Property(a => a.CraftTitle).HasMaxLength(120);
            b.HasIndex(a => a.Slug).IsUnique();
        });

        // CulturalHeritageStory
        modelBuilder.Entity<CulturalHeritageStory>(b =>
        {
            b.HasKey(s => s.Id);
            b.Property(s => s.Id).HasMaxLength(64);
            b.Property(s => s.Slug).HasMaxLength(128).IsRequired();
            b.Property(s => s.Title).HasMaxLength(200).IsRequired();
            b.Property(s => s.ThemeLabel).HasMaxLength(80);
            b.Property(s => s.CoverImageUrl).HasMaxLength(500);
            b.HasIndex(s => s.Slug).IsUnique();
        });

        // GastronomyFilm
        modelBuilder.Entity<GastronomyFilm>(b =>
        {
            b.HasKey(f => f.Id);
            b.Property(f => f.Id).HasMaxLength(64);
            b.Property(f => f.Slug).HasMaxLength(128).IsRequired();
            b.Property(f => f.Title).HasMaxLength(200).IsRequired();
            b.Property(f => f.VideoUrl).HasMaxLength(500);
            b.Property(f => f.ThumbnailUrl).HasMaxLength(500);
            b.HasIndex(f => f.Slug).IsUnique();
        });

        // NewsEvent
        modelBuilder.Entity<NewsEvent>(b =>
        {
            b.HasKey(n => n.Id);
            b.Property(n => n.Id).HasMaxLength(64);
            b.Property(n => n.Slug).HasMaxLength(128).IsRequired();
            b.Property(n => n.Title).HasMaxLength(200).IsRequired();
            b.Property(n => n.Type).HasMaxLength(40);
            b.HasIndex(n => n.Slug).IsUnique();
        });

        // MediaItem
        modelBuilder.Entity<MediaItem>(b =>
        {
            b.HasKey(m => m.Id);
            b.Property(m => m.Id).HasMaxLength(64);
            b.Property(m => m.Title).HasMaxLength(200).IsRequired();
            b.Property(m => m.Url).HasMaxLength(500).IsRequired();
            b.Property(m => m.AltText).HasMaxLength(250);
        });
    }
}

