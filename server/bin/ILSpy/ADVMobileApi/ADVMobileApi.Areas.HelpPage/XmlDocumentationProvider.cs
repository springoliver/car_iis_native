using System;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Web.Http.Controllers;
using System.Web.Http.Description;
using System.Xml.XPath;
using ADVMobileApi.Areas.HelpPage.ModelDescriptions;

namespace ADVMobileApi.Areas.HelpPage;

public class XmlDocumentationProvider : IDocumentationProvider, IModelDocumentationProvider
{
	private XPathNavigator _documentNavigator;

	private const string TypeExpression = "/doc/members/member[@name='T:{0}']";

	private const string MethodExpression = "/doc/members/member[@name='M:{0}']";

	private const string PropertyExpression = "/doc/members/member[@name='P:{0}']";

	private const string FieldExpression = "/doc/members/member[@name='F:{0}']";

	private const string ParameterExpression = "param[@name='{0}']";

	public XmlDocumentationProvider(string documentPath)
	{
		if (documentPath == null)
		{
			throw new ArgumentNullException("documentPath");
		}
		XPathDocument xpath = new XPathDocument(documentPath);
		_documentNavigator = xpath.CreateNavigator();
	}

	public string GetDocumentation(HttpControllerDescriptor controllerDescriptor)
	{
		XPathNavigator typeNode = GetTypeNode(controllerDescriptor.ControllerType);
		return GetTagValue(typeNode, "summary");
	}

	public virtual string GetDocumentation(HttpActionDescriptor actionDescriptor)
	{
		XPathNavigator methodNode = GetMethodNode(actionDescriptor);
		return GetTagValue(methodNode, "summary");
	}

	public virtual string GetDocumentation(HttpParameterDescriptor parameterDescriptor)
	{
		if (parameterDescriptor is ReflectedHttpParameterDescriptor reflectedParameterDescriptor)
		{
			XPathNavigator methodNode = GetMethodNode(reflectedParameterDescriptor.ActionDescriptor);
			if (methodNode != null)
			{
				string parameterName = reflectedParameterDescriptor.ParameterInfo.Name;
				XPathNavigator parameterNode = methodNode.SelectSingleNode(string.Format(CultureInfo.InvariantCulture, "param[@name='{0}']", parameterName));
				if (parameterNode != null)
				{
					return parameterNode.Value.Trim();
				}
			}
		}
		return null;
	}

	public string GetResponseDocumentation(HttpActionDescriptor actionDescriptor)
	{
		XPathNavigator methodNode = GetMethodNode(actionDescriptor);
		return GetTagValue(methodNode, "returns");
	}

	public string GetDocumentation(MemberInfo member)
	{
		string memberName = string.Format(CultureInfo.InvariantCulture, "{0}.{1}", GetTypeName(member.DeclaringType), member.Name);
		string expression = ((member.MemberType == MemberTypes.Field) ? "/doc/members/member[@name='F:{0}']" : "/doc/members/member[@name='P:{0}']");
		string selectExpression = string.Format(CultureInfo.InvariantCulture, expression, memberName);
		XPathNavigator propertyNode = _documentNavigator.SelectSingleNode(selectExpression);
		return GetTagValue(propertyNode, "summary");
	}

	public string GetDocumentation(Type type)
	{
		XPathNavigator typeNode = GetTypeNode(type);
		return GetTagValue(typeNode, "summary");
	}

	private XPathNavigator GetMethodNode(HttpActionDescriptor actionDescriptor)
	{
		if (actionDescriptor is ReflectedHttpActionDescriptor reflectedActionDescriptor)
		{
			string selectExpression = string.Format(CultureInfo.InvariantCulture, "/doc/members/member[@name='M:{0}']", GetMemberName(reflectedActionDescriptor.MethodInfo));
			return _documentNavigator.SelectSingleNode(selectExpression);
		}
		return null;
	}

	private static string GetMemberName(MethodInfo method)
	{
		string name = string.Format(CultureInfo.InvariantCulture, "{0}.{1}", GetTypeName(method.DeclaringType), method.Name);
		ParameterInfo[] parameters = method.GetParameters();
		if (parameters.Length != 0)
		{
			string[] parameterTypeNames = parameters.Select((ParameterInfo param) => GetTypeName(param.ParameterType)).ToArray();
			name += string.Format(CultureInfo.InvariantCulture, "({0})", string.Join(",", parameterTypeNames));
		}
		return name;
	}

	private static string GetTagValue(XPathNavigator parentNode, string tagName)
	{
		if (parentNode != null)
		{
			XPathNavigator node = parentNode.SelectSingleNode(tagName);
			if (node != null)
			{
				return node.Value.Trim();
			}
		}
		return null;
	}

	private XPathNavigator GetTypeNode(Type type)
	{
		string controllerTypeName = GetTypeName(type);
		string selectExpression = string.Format(CultureInfo.InvariantCulture, "/doc/members/member[@name='T:{0}']", controllerTypeName);
		return _documentNavigator.SelectSingleNode(selectExpression);
	}

	private static string GetTypeName(Type type)
	{
		string name = type.FullName;
		if (type.IsGenericType)
		{
			Type genericType = type.GetGenericTypeDefinition();
			Type[] genericArguments = type.GetGenericArguments();
			string genericTypeName = genericType.FullName;
			genericTypeName = genericTypeName.Substring(0, genericTypeName.IndexOf('`'));
			string[] argumentTypeNames = genericArguments.Select((Type t) => GetTypeName(t)).ToArray();
			name = string.Format(CultureInfo.InvariantCulture, "{0}{{{1}}}", genericTypeName, string.Join(",", argumentTypeNames));
		}
		if (type.IsNested)
		{
			name = name.Replace("+", ".");
		}
		return name;
	}
}
