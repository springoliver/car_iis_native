using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Formatting;
using System.Net.Http.Headers;
using System.Web.Http.Description;
using System.Xml.Linq;
using Newtonsoft.Json;

namespace ADVMobileApi.Areas.HelpPage;

public class HelpPageSampleGenerator
{
	public IDictionary<HelpPageSampleKey, Type> ActualHttpMessageTypes { get; internal set; }

	public IDictionary<HelpPageSampleKey, object> ActionSamples { get; internal set; }

	public IDictionary<Type, object> SampleObjects { get; internal set; }

	public IList<Func<HelpPageSampleGenerator, Type, object>> SampleObjectFactories { get; private set; }

	public HelpPageSampleGenerator()
	{
		ActualHttpMessageTypes = new Dictionary<HelpPageSampleKey, Type>();
		ActionSamples = new Dictionary<HelpPageSampleKey, object>();
		SampleObjects = new Dictionary<Type, object>();
		SampleObjectFactories = new List<Func<HelpPageSampleGenerator, Type, object>> { DefaultSampleObjectFactory };
	}

	public IDictionary<MediaTypeHeaderValue, object> GetSampleRequests(ApiDescription api)
	{
		return GetSample(api, SampleDirection.Request);
	}

	public IDictionary<MediaTypeHeaderValue, object> GetSampleResponses(ApiDescription api)
	{
		return GetSample(api, SampleDirection.Response);
	}

	public virtual IDictionary<MediaTypeHeaderValue, object> GetSample(ApiDescription api, SampleDirection sampleDirection)
	{
		if (api == null)
		{
			throw new ArgumentNullException("api");
		}
		string controllerName = api.ActionDescriptor.ControllerDescriptor.ControllerName;
		string actionName = api.ActionDescriptor.ActionName;
		IEnumerable<string> parameterNames = api.ParameterDescriptions.Select((ApiParameterDescription p) => p.Name);
		Collection<MediaTypeFormatter> formatters;
		Type type = ResolveType(api, controllerName, actionName, parameterNames, sampleDirection, out formatters);
		Dictionary<MediaTypeHeaderValue, object> samples = new Dictionary<MediaTypeHeaderValue, object>();
		IEnumerable<KeyValuePair<HelpPageSampleKey, object>> actionSamples = GetAllActionSamples(controllerName, actionName, parameterNames, sampleDirection);
		foreach (KeyValuePair<HelpPageSampleKey, object> actionSample in actionSamples)
		{
			samples.Add(actionSample.Key.MediaType, WrapSampleIfString(actionSample.Value));
		}
		if (type != null && !typeof(HttpResponseMessage).IsAssignableFrom(type))
		{
			object sampleObject = GetSampleObject(type);
			foreach (MediaTypeFormatter formatter in formatters)
			{
				foreach (MediaTypeHeaderValue mediaType in formatter.SupportedMediaTypes)
				{
					if (!samples.ContainsKey(mediaType))
					{
						object sample = GetActionSample(controllerName, actionName, parameterNames, type, formatter, mediaType, sampleDirection);
						if (sample == null && sampleObject != null)
						{
							sample = WriteSampleObjectUsingFormatter(formatter, sampleObject, type, mediaType);
						}
						samples.Add(mediaType, WrapSampleIfString(sample));
					}
				}
			}
		}
		return samples;
	}

	public virtual object GetActionSample(string controllerName, string actionName, IEnumerable<string> parameterNames, Type type, MediaTypeFormatter formatter, MediaTypeHeaderValue mediaType, SampleDirection sampleDirection)
	{
		if (ActionSamples.TryGetValue(new HelpPageSampleKey(mediaType, sampleDirection, controllerName, actionName, parameterNames), out var sample) || ActionSamples.TryGetValue(new HelpPageSampleKey(mediaType, sampleDirection, controllerName, actionName, new string[1] { "*" }), out sample) || ActionSamples.TryGetValue(new HelpPageSampleKey(mediaType, type), out sample) || ActionSamples.TryGetValue(new HelpPageSampleKey(mediaType), out sample))
		{
			return sample;
		}
		return null;
	}

	public virtual object GetSampleObject(Type type)
	{
		if (!SampleObjects.TryGetValue(type, out var sampleObject))
		{
			foreach (Func<HelpPageSampleGenerator, Type, object> factory in SampleObjectFactories)
			{
				if (factory == null)
				{
					continue;
				}
				try
				{
					sampleObject = factory(this, type);
					if (sampleObject != null)
					{
						break;
					}
				}
				catch
				{
				}
			}
		}
		return sampleObject;
	}

	public virtual Type ResolveHttpRequestMessageType(ApiDescription api)
	{
		string controllerName = api.ActionDescriptor.ControllerDescriptor.ControllerName;
		string actionName = api.ActionDescriptor.ActionName;
		IEnumerable<string> parameterNames = api.ParameterDescriptions.Select((ApiParameterDescription p) => p.Name);
		Collection<MediaTypeFormatter> formatters;
		return ResolveType(api, controllerName, actionName, parameterNames, SampleDirection.Request, out formatters);
	}

	public virtual Type ResolveType(ApiDescription api, string controllerName, string actionName, IEnumerable<string> parameterNames, SampleDirection sampleDirection, out Collection<MediaTypeFormatter> formatters)
	{
		if (!Enum.IsDefined(typeof(SampleDirection), sampleDirection))
		{
			throw new InvalidEnumArgumentException("sampleDirection", (int)sampleDirection, typeof(SampleDirection));
		}
		if (api == null)
		{
			throw new ArgumentNullException("api");
		}
		if (ActualHttpMessageTypes.TryGetValue(new HelpPageSampleKey(sampleDirection, controllerName, actionName, parameterNames), out var type) || ActualHttpMessageTypes.TryGetValue(new HelpPageSampleKey(sampleDirection, controllerName, actionName, new string[1] { "*" }), out type))
		{
			Collection<MediaTypeFormatter> newFormatters = new Collection<MediaTypeFormatter>();
			foreach (MediaTypeFormatter formatter in api.ActionDescriptor.Configuration.Formatters)
			{
				if (IsFormatSupported(sampleDirection, formatter, type))
				{
					newFormatters.Add(formatter);
				}
			}
			formatters = newFormatters;
		}
		else
		{
			switch (sampleDirection)
			{
			case SampleDirection.Request:
				type = api.ParameterDescriptions.FirstOrDefault((ApiParameterDescription p) => p.Source == ApiParameterSource.FromBody)?.ParameterDescriptor.ParameterType;
				formatters = api.SupportedRequestBodyFormatters;
				break;
			default:
				type = api.ResponseDescription.ResponseType ?? api.ResponseDescription.DeclaredType;
				formatters = api.SupportedResponseFormatters;
				break;
			}
		}
		return type;
	}

	public virtual object WriteSampleObjectUsingFormatter(MediaTypeFormatter formatter, object value, Type type, MediaTypeHeaderValue mediaType)
	{
		if (formatter == null)
		{
			throw new ArgumentNullException("formatter");
		}
		if (mediaType == null)
		{
			throw new ArgumentNullException("mediaType");
		}
		object sample = string.Empty;
		MemoryStream ms = null;
		HttpContent content = null;
		try
		{
			if (formatter.CanWriteType(type))
			{
				ms = new MemoryStream();
				content = (HttpContent)(object)new ObjectContent(type, value, formatter, mediaType);
				formatter.WriteToStreamAsync(type, value, ms, content, null).Wait();
				ms.Position = 0L;
				StreamReader reader = new StreamReader(ms);
				string serializedSampleString = reader.ReadToEnd();
				if (mediaType.MediaType.ToUpperInvariant().Contains("XML"))
				{
					serializedSampleString = TryFormatXml(serializedSampleString);
				}
				else if (mediaType.MediaType.ToUpperInvariant().Contains("JSON"))
				{
					serializedSampleString = TryFormatJson(serializedSampleString);
				}
				sample = new TextSample(serializedSampleString);
			}
			else
			{
				sample = new InvalidSample(string.Format(CultureInfo.CurrentCulture, "Failed to generate the sample for media type '{0}'. Cannot use formatter '{1}' to write type '{2}'.", mediaType, formatter.GetType().Name, type.Name));
			}
		}
		catch (Exception exception)
		{
			sample = new InvalidSample(string.Format(CultureInfo.CurrentCulture, "An exception has occurred while using the formatter '{0}' to generate sample for media type '{1}'. Exception message: {2}", formatter.GetType().Name, mediaType.MediaType, UnwrapException(exception).Message));
		}
		finally
		{
			ms?.Dispose();
			if (content != null)
			{
				content.Dispose();
			}
		}
		return sample;
	}

	internal static Exception UnwrapException(Exception exception)
	{
		if (exception is AggregateException aggregateException)
		{
			return aggregateException.Flatten().InnerException;
		}
		return exception;
	}

	private static object DefaultSampleObjectFactory(HelpPageSampleGenerator sampleGenerator, Type type)
	{
		ObjectGenerator objectGenerator = new ObjectGenerator();
		return objectGenerator.GenerateObject(type);
	}

	private static string TryFormatJson(string str)
	{
		try
		{
			object parsedJson = JsonConvert.DeserializeObject(str);
			return JsonConvert.SerializeObject(parsedJson, Formatting.Indented);
		}
		catch
		{
			return str;
		}
	}

	private static string TryFormatXml(string str)
	{
		try
		{
			XDocument xml = XDocument.Parse(str);
			return xml.ToString();
		}
		catch
		{
			return str;
		}
	}

	private static bool IsFormatSupported(SampleDirection sampleDirection, MediaTypeFormatter formatter, Type type)
	{
		return sampleDirection switch
		{
			SampleDirection.Request => formatter.CanReadType(type), 
			SampleDirection.Response => formatter.CanWriteType(type), 
			_ => false, 
		};
	}

	private IEnumerable<KeyValuePair<HelpPageSampleKey, object>> GetAllActionSamples(string controllerName, string actionName, IEnumerable<string> parameterNames, SampleDirection sampleDirection)
	{
		HashSet<string> parameterNamesSet = new HashSet<string>(parameterNames, StringComparer.OrdinalIgnoreCase);
		foreach (KeyValuePair<HelpPageSampleKey, object> sample in ActionSamples)
		{
			HelpPageSampleKey sampleKey = sample.Key;
			if (string.Equals(controllerName, sampleKey.ControllerName, StringComparison.OrdinalIgnoreCase) && string.Equals(actionName, sampleKey.ActionName, StringComparison.OrdinalIgnoreCase) && (sampleKey.ParameterNames.SetEquals(new string[1] { "*" }) || parameterNamesSet.SetEquals(sampleKey.ParameterNames)) && sampleDirection == sampleKey.SampleDirection)
			{
				yield return sample;
			}
		}
	}

	private static object WrapSampleIfString(object sample)
	{
		if (sample is string stringSample)
		{
			return new TextSample(stringSample);
		}
		return sample;
	}
}
