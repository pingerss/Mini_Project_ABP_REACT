using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using MiniLms.Data;
using Volo.Abp.DependencyInjection;

namespace MiniLms.EntityFrameworkCore;

public class EntityFrameworkCoreMiniLmsDbSchemaMigrator
    : IMiniLmsDbSchemaMigrator, ITransientDependency
{
    private readonly IServiceProvider _serviceProvider;

    public EntityFrameworkCoreMiniLmsDbSchemaMigrator(
        IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task MigrateAsync()
    {
        /* We intentionally resolve the MiniLmsDbContext
         * from IServiceProvider (instead of directly injecting it)
         * to properly get the connection string of the current tenant in the
         * current scope.
         */

        await _serviceProvider
            .GetRequiredService<MiniLmsDbContext>()
            .Database
            .MigrateAsync();
    }
}
