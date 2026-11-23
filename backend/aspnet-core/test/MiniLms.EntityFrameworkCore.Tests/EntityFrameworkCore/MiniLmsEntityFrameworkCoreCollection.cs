using Xunit;

namespace MiniLms.EntityFrameworkCore;

[CollectionDefinition(MiniLmsTestConsts.CollectionDefinitionName)]
public class MiniLmsEntityFrameworkCoreCollection : ICollectionFixture<MiniLmsEntityFrameworkCoreFixture>
{

}
