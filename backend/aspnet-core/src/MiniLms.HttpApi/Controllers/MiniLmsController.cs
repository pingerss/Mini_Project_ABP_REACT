using MiniLms.Localization;
using Volo.Abp.AspNetCore.Mvc;

namespace MiniLms.Controllers;

/* Inherit your controllers from this class.
 */
public abstract class MiniLmsController : AbpControllerBase
{
    protected MiniLmsController()
    {
        LocalizationResource = typeof(MiniLmsResource);
    }
}
