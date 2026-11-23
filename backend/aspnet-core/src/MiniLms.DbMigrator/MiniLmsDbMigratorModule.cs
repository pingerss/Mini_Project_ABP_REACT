using MiniLms.EntityFrameworkCore;
using Volo.Abp.Autofac;
using Volo.Abp.Modularity;

namespace MiniLms.DbMigrator;

[DependsOn(
    typeof(AbpAutofacModule),
    typeof(MiniLmsEntityFrameworkCoreModule),
    typeof(MiniLmsApplicationContractsModule)
    )]
public class MiniLmsDbMigratorModule : AbpModule
{
}
