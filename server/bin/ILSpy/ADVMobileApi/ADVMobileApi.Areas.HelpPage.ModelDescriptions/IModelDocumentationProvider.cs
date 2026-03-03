using System;
using System.Reflection;

namespace ADVMobileApi.Areas.HelpPage.ModelDescriptions;

public interface IModelDocumentationProvider
{
	string GetDocumentation(MemberInfo member);

	string GetDocumentation(Type type);
}
