using System.Reflection;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using ADVMobileApi.Core.Repositories;
using ADVMobileApi.Core.Services;
using ADVMobileApi.Repository.Repositories;
using ADVMobileApi.Services.Services;
using Autofac;
using Autofac.Integration.WebApi;

namespace ADVMobileApi;

public class WebApiApplication : HttpApplication
{
	protected void Application_Start()
	{
		ContainerBuilder builder = new ContainerBuilder();
		HttpConfiguration config = GlobalConfiguration.Configuration;
		builder.RegisterApiControllers(Assembly.GetExecutingAssembly());
		builder.RegisterWebApiFilterProvider(config);
		builder.RegisterWebApiModelBinderProvider();
		builder.RegisterType<BusinessRepository>().As<IBusinessRepository>();
		builder.RegisterType<BusinessService>().As<IBusinessService>();
		IContainer container = builder.Build();
		config.DependencyResolver = new AutofacWebApiDependencyResolver(container);
		AreaRegistration.RegisterAllAreas();
		GlobalConfiguration.Configure(WebApiConfig.Register);
		FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
		RouteConfig.RegisterRoutes(RouteTable.Routes);
		BundleConfig.RegisterBundles(BundleTable.Bundles);
	}
}
