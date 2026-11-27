using System;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace MiniLms.EntityFrameworkCore;

/* This class is needed for EF Core console commands
 * (like Add-Migration and Update-Database commands) */
public class MiniLmsDbContextFactory : IDesignTimeDbContextFactory<MiniLmsDbContext>
{
    public MiniLmsDbContext CreateDbContext(string[] args)
    {
        MiniLmsEfCoreEntityExtensionMappings.Configure();

        var configuration = BuildConfiguration();

        // var builder = new DbContextOptionsBuilder<MiniLmsDbContext>()
        //     .UseSqlite(configuration.GetConnectionString("Default"));

        // return new MiniLmsDbContext(builder.Options);
        var builder = new DbContextOptionsBuilder<MiniLmsDbContext>()
    .UseSqlServer(configuration.GetConnectionString("Default"));
            return new MiniLmsDbContext(builder.Options);
    }

    private static IConfigurationRoot BuildConfiguration()
    {
        var builder = new ConfigurationBuilder()
            .SetBasePath(Path.Combine(Directory.GetCurrentDirectory(), "../MiniLms.DbMigrator/"))
            .AddJsonFile("appsettings.json", optional: false);

        return builder.Build();
    }
}
