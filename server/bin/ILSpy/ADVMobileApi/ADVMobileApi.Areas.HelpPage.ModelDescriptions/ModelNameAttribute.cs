using System;

namespace ADVMobileApi.Areas.HelpPage.ModelDescriptions;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Struct | AttributeTargets.Enum, AllowMultiple = false, Inherited = false)]
public sealed class ModelNameAttribute : Attribute
{
	public string Name { get; private set; }

	public ModelNameAttribute(string name)
	{
		Name = name;
	}
}
