using System.Net.Http.Headers;
using System.Web.Http;

namespace ADVMobileApi.Areas.HelpPage;

public static class HelpPageConfig
{
	public static void Register(HttpConfiguration config)
	{
		//IL_0010: Unknown result type (might be due to invalid IL or missing references)
		//IL_001a: Expected O, but got Unknown
		config.SetSampleForMediaType(new TextSample("Binary JSON content. See http://bsonspec.org for details."), new MediaTypeHeaderValue("application/bson"));
	}
}
