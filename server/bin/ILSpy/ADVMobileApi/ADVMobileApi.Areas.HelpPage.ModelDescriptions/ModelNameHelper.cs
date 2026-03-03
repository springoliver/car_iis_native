using System;
using System.Globalization;
using System.Linq;
using System.Reflection;

namespace ADVMobileApi.Areas.HelpPage.ModelDescriptions;

internal static class ModelNameHelper
{
	public static string GetModelName(Type type)
	{
		ModelNameAttribute modelNameAttribute = type.GetCustomAttribute<ModelNameAttribute>();
		if (modelNameAttribute != null && !string.IsNullOrEmpty(modelNameAttribute.Name))
		{
			return modelNameAttribute.Name;
		}
		string modelName = type.Name;
		if (type.IsGenericType)
		{
			Type genericType = type.GetGenericTypeDefinition();
			Type[] genericArguments = type.GetGenericArguments();
			string genericTypeName = genericType.Name;
			genericTypeName = genericTypeName.Substring(0, genericTypeName.IndexOf('`'));
			string[] argumentTypeNames = genericArguments.Select((Type t) => GetModelName(t)).ToArray();
			modelName = string.Format(CultureInfo.InvariantCulture, "{0}Of{1}", genericTypeName, string.Join("And", argumentTypeNames));
		}
		return modelName;
	}
}
