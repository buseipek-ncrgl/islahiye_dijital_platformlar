using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Gastronomy.Infrastructure;

public static class InfrastructureSetup
{
    public static IServiceCollection AddGastronomyInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var provider = configuration.GetValue<string>("DatabaseProvider") ?? "Sqlite";
        var connectionString = configuration.GetConnectionString("GastronomyDb");

        services.AddDbContext<GastronomyDbContext>(options =>
        {
            if (provider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(connectionString))
            {
                options.UseSqlServer(connectionString, sql =>
                {
                    sql.MigrationsAssembly(typeof(GastronomyDbContext).Assembly.FullName);
                    sql.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), errorNumbersToAdd: null);
                });
            }
            else
            {
                // SQLite (Varsayılan Yerel Geliştirme ve Taşınabilir Depolama)
                var sqliteConn = connectionString;
                if (string.IsNullOrWhiteSpace(sqliteConn) || !sqliteConn.Contains("Data Source=", StringComparison.OrdinalIgnoreCase))
                {
                    sqliteConn = "Data Source=gastronomy.db";
                }

                options.UseSqlite(sqliteConn, sql =>
                {
                    sql.MigrationsAssembly(typeof(GastronomyDbContext).Assembly.FullName);
                });
            }
        });

        return services;
    }
}

