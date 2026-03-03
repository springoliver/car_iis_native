using System.Collections.Generic;
using System.Web.Http;
using ADVMobileApi.Core.Services;

namespace ADVMobileApi.Controllers;

public class ValuesController : ApiController
{
	private IBusinessService _businessService;

	public ValuesController(IBusinessService businessService)
	{
		_businessService = businessService;
	}

	public IEnumerable<string> Get()
	{
		return new string[2] { "value1", "value2" };
	}

	public string Get(int id)
	{
		return "value";
	}

	public void Post([FromBody] string value)
	{
	}

	public void Put(int id, [FromBody] string value)
	{
	}

	public void Delete(int id)
	{
	}
}
