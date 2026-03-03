using System;

namespace ADVMobileApi.Areas.HelpPage.ModelDescriptions;

public abstract class ModelDescription
{
	public string Documentation { get; set; }

	public Type ModelType { get; set; }

	public string Name { get; set; }
}
