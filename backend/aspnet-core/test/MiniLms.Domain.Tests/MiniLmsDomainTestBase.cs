using Volo.Abp.Modularity;

namespace MiniLms;

/* Inherit from this class for your domain layer tests. */
public abstract class MiniLmsDomainTestBase<TStartupModule> : MiniLmsTestBase<TStartupModule>
    where TStartupModule : IAbpModule
{

}
