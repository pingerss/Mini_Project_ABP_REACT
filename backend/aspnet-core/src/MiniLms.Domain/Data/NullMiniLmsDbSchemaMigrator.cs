using System.Threading.Tasks;
using Volo.Abp.DependencyInjection;

namespace MiniLms.Data;

/* This is used if database provider does't define
 * IMiniLmsDbSchemaMigrator implementation.
 */
public class NullMiniLmsDbSchemaMigrator : IMiniLmsDbSchemaMigrator, ITransientDependency
{
    public Task MigrateAsync()
    {
        return Task.CompletedTask;
    }
}
