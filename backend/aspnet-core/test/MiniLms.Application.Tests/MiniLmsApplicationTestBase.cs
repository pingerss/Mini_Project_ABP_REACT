using Volo.Abp.Modularity;

namespace MiniLms;

public abstract class MiniLmsApplicationTestBase<TStartupModule> : MiniLmsTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
