using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Net.Http.Headers;
using System.Web.Http.Description;
using ADVMobileApi.Areas.HelpPage.ModelDescriptions;

namespace ADVMobileApi.Areas.HelpPage.Models;

public class HelpPageApiModel
{
	public ApiDescription ApiDescription { get; set; }

	public Collection<ParameterDescription> UriParameters { get; private set; }

	public string RequestDocumentation { get; set; }

	public ModelDescription RequestModelDescription { get; set; }

	public IList<ParameterDescription> RequestBodyParameters => GetParameterDescriptions(RequestModelDescription);

	public ModelDescription ResourceDescription { get; set; }

	public IList<ParameterDescription> ResourceProperties => GetParameterDescriptions(ResourceDescription);

	public IDictionary<MediaTypeHeaderValue, object> SampleRequests { get; private set; }

	public IDictionary<MediaTypeHeaderValue, object> SampleResponses { get; private set; }

	public Collection<string> ErrorMessages { get; private set; }

	public HelpPageApiModel()
	{
		UriParameters = new Collection<ParameterDescription>();
		SampleRequests = new Dictionary<MediaTypeHeaderValue, object>();
		SampleResponses = new Dictionary<MediaTypeHeaderValue, object>();
		ErrorMessages = new Collection<string>();
	}

	private static IList<ParameterDescription> GetParameterDescriptions(ModelDescription modelDescription)
	{
		if (modelDescription is ComplexTypeModelDescription complexTypeModelDescription)
		{
			return complexTypeModelDescription.Properties;
		}
		if (modelDescription is CollectionModelDescription { ElementDescription: ComplexTypeModelDescription complexTypeModelDescription2 })
		{
			return complexTypeModelDescription2.Properties;
		}
		return null;
	}
}
