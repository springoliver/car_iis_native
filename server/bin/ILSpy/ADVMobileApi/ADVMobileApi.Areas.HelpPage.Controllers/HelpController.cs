using System.Web.Http;
using System.Web.Mvc;
using ADVMobileApi.Areas.HelpPage.ModelDescriptions;
using ADVMobileApi.Areas.HelpPage.Models;

namespace ADVMobileApi.Areas.HelpPage.Controllers;

public class HelpController : Controller
{
	private const string ErrorViewName = "Error";

	public HttpConfiguration Configuration { get; private set; }

	public HelpController()
		: this(GlobalConfiguration.Configuration)
	{
	}

	public HelpController(HttpConfiguration config)
	{
		Configuration = config;
	}

	public ActionResult Index()
	{
		base.ViewBag.DocumentationProvider = Configuration.Services.GetDocumentationProvider();
		return View(Configuration.Services.GetApiExplorer().ApiDescriptions);
	}

	public ActionResult Api(string apiId)
	{
		if (!string.IsNullOrEmpty(apiId))
		{
			HelpPageApiModel apiModel = Configuration.GetHelpPageApiModel(apiId);
			if (apiModel != null)
			{
				return View(apiModel);
			}
		}
		return View("Error");
	}

	public ActionResult ResourceModel(string modelName)
	{
		if (!string.IsNullOrEmpty(modelName))
		{
			ModelDescriptionGenerator modelDescriptionGenerator = Configuration.GetModelDescriptionGenerator();
			if (modelDescriptionGenerator.GeneratedModels.TryGetValue(modelName, out var modelDescription))
			{
				return View(modelDescription);
			}
		}
		return View("Error");
	}
}
