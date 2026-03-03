using System.Web.Mvc;

namespace ADVMobileApi.Controllers;

public class HomeController : Controller
{
	public ActionResult Index()
	{
		base.ViewBag.Title = "Home Page";
		return View();
	}
}
