using MiniLms.Samples;
using Xunit;

namespace MiniLms.EntityFrameworkCore.Applications;

[Collection(MiniLmsTestConsts.CollectionDefinitionName)]
public class EfCoreSampleAppServiceTests : SampleAppServiceTests<MiniLmsEntityFrameworkCoreTestModule>
{

}
