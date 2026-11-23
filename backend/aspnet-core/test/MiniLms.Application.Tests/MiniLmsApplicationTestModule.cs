using Volo.Abp.Modularity;

namespace MiniLms;

[DependsOn(
    typeof(MiniLmsApplicationModule),
    typeof(MiniLmsDomainTestModule)
)]
public class MiniLmsApplicationTestModule : AbpModule
{

}
