using System;
using System.Collections.Generic;
using System.Text;
using MiniLms.Localization;
using Volo.Abp.Application.Services;

namespace MiniLms;

/* Inherit your application services from this class.
 */
public abstract class MiniLmsAppService : ApplicationService
{
    protected MiniLmsAppService()
    {
        LocalizationResource = typeof(MiniLmsResource);
    }
}
