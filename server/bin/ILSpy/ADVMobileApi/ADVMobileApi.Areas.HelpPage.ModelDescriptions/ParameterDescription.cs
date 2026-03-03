using System.Collections.ObjectModel;

namespace ADVMobileApi.Areas.HelpPage.ModelDescriptions;

public class ParameterDescription
{
	public Collection<ParameterAnnotation> Annotations { get; private set; }

	public string Documentation { get; set; }

	public string Name { get; set; }

	public ModelDescription TypeDescription { get; set; }

	public ParameterDescription()
	{
		Annotations = new Collection<ParameterAnnotation>();
	}
}
