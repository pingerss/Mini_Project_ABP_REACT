using MiniLms.Samples;
using Xunit;

namespace MiniLms.EntityFrameworkCore.Domains;

[Collection(MiniLmsTestConsts.CollectionDefinitionName)]
public class EfCoreSampleDomainTests : SampleDomainTests<MiniLmsEntityFrameworkCoreTestModule>
{

}
