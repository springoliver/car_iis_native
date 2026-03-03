using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Net.Http.Headers;

namespace ADVMobileApi.Areas.HelpPage;

public class HelpPageSampleKey
{
	public string ControllerName { get; private set; }

	public string ActionName { get; private set; }

	public MediaTypeHeaderValue MediaType { get; private set; }

	public HashSet<string> ParameterNames { get; private set; }

	public Type ParameterType { get; private set; }

	public SampleDirection? SampleDirection { get; private set; }

	public HelpPageSampleKey(MediaTypeHeaderValue mediaType)
	{
		if (mediaType == null)
		{
			throw new ArgumentNullException("mediaType");
		}
		ActionName = string.Empty;
		ControllerName = string.Empty;
		MediaType = mediaType;
		ParameterNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
	}

	public HelpPageSampleKey(MediaTypeHeaderValue mediaType, Type type)
		: this(mediaType)
	{
		if (type == null)
		{
			throw new ArgumentNullException("type");
		}
		ParameterType = type;
	}

	public HelpPageSampleKey(SampleDirection sampleDirection, string controllerName, string actionName, IEnumerable<string> parameterNames)
	{
		if (!Enum.IsDefined(typeof(SampleDirection), sampleDirection))
		{
			throw new InvalidEnumArgumentException("sampleDirection", (int)sampleDirection, typeof(SampleDirection));
		}
		if (controllerName == null)
		{
			throw new ArgumentNullException("controllerName");
		}
		if (actionName == null)
		{
			throw new ArgumentNullException("actionName");
		}
		if (parameterNames == null)
		{
			throw new ArgumentNullException("parameterNames");
		}
		ControllerName = controllerName;
		ActionName = actionName;
		ParameterNames = new HashSet<string>(parameterNames, StringComparer.OrdinalIgnoreCase);
		SampleDirection = sampleDirection;
	}

	public HelpPageSampleKey(MediaTypeHeaderValue mediaType, SampleDirection sampleDirection, string controllerName, string actionName, IEnumerable<string> parameterNames)
		: this(sampleDirection, controllerName, actionName, parameterNames)
	{
		if (mediaType == null)
		{
			throw new ArgumentNullException("mediaType");
		}
		MediaType = mediaType;
	}

	public override bool Equals(object obj)
	{
		if (!(obj is HelpPageSampleKey otherKey))
		{
			return false;
		}
		if (string.Equals(ControllerName, otherKey.ControllerName, StringComparison.OrdinalIgnoreCase) && string.Equals(ActionName, otherKey.ActionName, StringComparison.OrdinalIgnoreCase) && (MediaType == otherKey.MediaType || (MediaType != null && ((object)MediaType).Equals((object)otherKey.MediaType))) && ParameterType == otherKey.ParameterType && SampleDirection == otherKey.SampleDirection)
		{
			return ParameterNames.SetEquals(otherKey.ParameterNames);
		}
		return false;
	}

	public override int GetHashCode()
	{
		int hashCode = ControllerName.ToUpperInvariant().GetHashCode() ^ ActionName.ToUpperInvariant().GetHashCode();
		if (MediaType != null)
		{
			hashCode ^= ((object)MediaType).GetHashCode();
		}
		if (SampleDirection.HasValue)
		{
			hashCode ^= SampleDirection.GetHashCode();
		}
		if (ParameterType != null)
		{
			hashCode ^= ParameterType.GetHashCode();
		}
		foreach (string parameterName in ParameterNames)
		{
			hashCode ^= parameterName.ToUpperInvariant().GetHashCode();
		}
		return hashCode;
	}
}
