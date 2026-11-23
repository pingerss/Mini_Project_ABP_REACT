using Volo.Abp.Modularity;

namespace MiniLms;

[DependsOn(
    typeof(MiniLmsDomainModule),
    typeof(MiniLmsTestBaseModule)
)]
public class MiniLmsDomainTestModule : AbpModule
{

}
