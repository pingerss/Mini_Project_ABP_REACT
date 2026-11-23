using Volo.Abp.Settings;

namespace MiniLms.Settings;

public class MiniLmsSettingDefinitionProvider : SettingDefinitionProvider
{
    public override void Define(ISettingDefinitionContext context)
    {
        //Define your own settings here. Example:
        //context.Add(new SettingDefinition(MiniLmsSettings.MySetting1));
    }
}
