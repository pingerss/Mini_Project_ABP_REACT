using Microsoft.Extensions.Localization;
using MiniLms.Localization;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Ui.Branding;

namespace MiniLms;

[Dependency(ReplaceServices = true)]
public class MiniLmsBrandingProvider : DefaultBrandingProvider
{
    private IStringLocalizer<MiniLmsResource> _localizer;

    public MiniLmsBrandingProvider(IStringLocalizer<MiniLmsResource> localizer)
    {
        _localizer = localizer;
    }

    public override string AppName => _localizer["AppName"];
}
