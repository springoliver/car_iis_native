using System.Collections.ObjectModel;

namespace ADVMobileApi.Areas.HelpPage.ModelDescriptions;

public class ComplexTypeModelDescription : ModelDescription
{
	public Collection<ParameterDescription> Properties { get; private set; }

	public ComplexTypeModelDescription()
	{
		Properties = new Collection<ParameterDescription>();
	}
}
