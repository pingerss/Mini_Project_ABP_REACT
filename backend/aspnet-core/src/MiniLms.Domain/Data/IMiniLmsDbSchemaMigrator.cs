using System.Threading.Tasks;

namespace MiniLms.Data;

public interface IMiniLmsDbSchemaMigrator
{
    Task MigrateAsync();
}
