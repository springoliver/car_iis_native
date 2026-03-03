using System.Configuration;

namespace ADVMobileApi.Core.Utilities;

public static class Utility
{
	public static string GetConfig(string keyValue)
	{
		return ConfigurationSettings.AppSettings[keyValue];
	}
}
